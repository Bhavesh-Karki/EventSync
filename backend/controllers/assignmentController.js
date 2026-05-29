const mongoose = require("mongoose");
const Assignment = require("../models/Assignment");
const Event = require("../models/Event");
const Volunteer = require("../models/Volunteer");

const VALID_STATUSES = ["pending", "in-progress", "completed", "cancelled"];

const sendError = (res, error, fallback = "Server error") => {
  const isClientError =
    error.name === "ValidationError" ||
    error.name === "CastError" ||
    /not found|invalid|required|already|full/i.test(error.message || "");

  return res.status(isClientError ? 400 : 500).json({
    success: false,
    message: error.message || fallback,
    data: null
  });
};

const getId = (value) => {
  if (!value) return "";
  if (typeof value === "object") return String(value._id || value.id || "");
  return String(value);
};

const getAssignmentPayload = (body) => ({
  event: getId(body.event || body.eventId),
  volunteer: getId(body.volunteer || body.volunteerId),
  duty: body.duty,
  schedule: body.schedule,
  priority: body.priority,
  notes: body.notes,
  status: body.status
});

const validateObjectId = (id, label) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new Error(`Invalid ${label} ID`);
  }
};

const populateAssignment = (query) =>
  query
    .populate("event", "name date location status")
    .populate("volunteer", "name email phone status");

const syncAssignmentRefs = async (oldAssignment, assignment) => {
  const oldEventId = getId(oldAssignment && oldAssignment.event);
  const oldVolunteerId = getId(oldAssignment && oldAssignment.volunteer);
  const eventId = getId(assignment.event);
  const volunteerId = getId(assignment.volunteer);

  if (oldEventId && oldEventId !== eventId) {
    await Event.findByIdAndUpdate(oldEventId, { $pull: { volunteers: oldVolunteerId || volunteerId } });
  }

  if (oldVolunteerId && oldVolunteerId !== volunteerId) {
    await Volunteer.findByIdAndUpdate(oldVolunteerId, { $pull: { eventsAssigned: oldEventId || eventId } });
  }

  await Event.findByIdAndUpdate(eventId, { $addToSet: { volunteers: volunteerId } });
  await Volunteer.findByIdAndUpdate(volunteerId, { $addToSet: { eventsAssigned: eventId } });
};

const ensureAssignmentTargets = async (eventId, volunteerId, assignmentId = null) => {
  validateObjectId(eventId, "event");
  validateObjectId(volunteerId, "volunteer");

  const [event, volunteer] = await Promise.all([
    Event.findById(eventId),
    Volunteer.findById(volunteerId)
  ]);

  if (!event) throw new Error("Event not found");
  if (!volunteer) throw new Error("Volunteer not found");
  if (event.volunteers.length >= event.capacity && !event.volunteers.some((id) => String(id) === volunteerId)) {
    throw new Error("Event is at full capacity");
  }

  const duplicateQuery = {
    event: eventId,
    volunteer: volunteerId,
    status: { $ne: "cancelled" }
  };

  if (assignmentId) {
    duplicateQuery._id = { $ne: assignmentId };
  }

  const duplicate = await Assignment.findOne(duplicateQuery);
  if (duplicate) {
    throw new Error("Volunteer is already assigned to this event");
  }
};

const getAllAssignments = async (req, res) => {
  try {
    const assignments = await populateAssignment(Assignment.find()).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Assignments retrieved successfully",
      data: assignments
    });
  } catch (error) {
    console.error("Error in getAllAssignments controller:", error);
    return sendError(res, error, "Failed to retrieve assignments");
  }
};

const createAssignment = async (req, res) => {
  try {
    const payload = getAssignmentPayload(req.body);
    await ensureAssignmentTargets(payload.event, payload.volunteer);

    const assignment = await Assignment.create({
      event: payload.event,
      volunteer: payload.volunteer,
      duty: payload.duty,
      schedule: payload.schedule,
      priority: payload.priority || "medium",
      notes: payload.notes || "",
      status: payload.status || "pending"
    });

    if (assignment.status !== "cancelled") {
      await syncAssignmentRefs(null, assignment);
    }

    const populatedAssignment = await populateAssignment(Assignment.findById(assignment._id));

    return res.status(201).json({
      success: true,
      message: "Assignment created successfully",
      data: populatedAssignment
    });
  } catch (error) {
    console.error("Error in createAssignment controller:", error);
    return sendError(res, error, "Failed to create assignment");
  }
};

const getAssignmentsByVolunteer = async (req, res) => {
  try {
    validateObjectId(req.params.volunteerId, "volunteer");

    const assignments = await populateAssignment(
      Assignment.find({ volunteer: req.params.volunteerId })
    ).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: assignments
    });
  } catch (error) {
    console.error("Error in getAssignmentsByVolunteer controller:", error);
    return sendError(res, error, "Failed to retrieve assignments");
  }
};

const updateAssignmentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!VALID_STATUSES.includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`);
    }

    const updates = { status };
    const unset = {};
    if (status === "in-progress") {
      updates.startedAt = new Date();
      updates.hoursWorked = 0;
      unset.completedAt = "";
    }
    if (status === "completed") {
      updates.completedAt = new Date();
    }
    if (status === "pending") {
      updates.hoursWorked = 0;
      unset.startedAt = "";
      unset.completedAt = "";
    }

    let assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      throw new Error("Assignment not found");
    }
    const previousAssignment = assignment;

    if (status === "completed" && assignment.startedAt) {
      updates.hoursWorked = Math.max(0, (updates.completedAt - assignment.startedAt) / (1000 * 60 * 60));
    }

    assignment = await populateAssignment(
      Assignment.findByIdAndUpdate(
        req.params.id,
        { $set: updates, ...(Object.keys(unset).length ? { $unset: unset } : {}) },
        { new: true, runValidators: true }
      )
    );

    if (status === "cancelled") {
      await Promise.all([
        Event.findByIdAndUpdate(previousAssignment.event, { $pull: { volunteers: previousAssignment.volunteer } }),
        Volunteer.findByIdAndUpdate(previousAssignment.volunteer, { $pull: { eventsAssigned: previousAssignment.event } })
      ]);
    } else {
      await syncAssignmentRefs(previousAssignment, assignment);
    }

    return res.json({ success: true, data: assignment });
  } catch (error) {
    console.error("Error in updateAssignmentStatus:", error);
    return sendError(res, error);
  }
};

const getAssignmentStats = async (req, res) => {
  try {
    const total = await Assignment.countDocuments();
    const pending = await Assignment.countDocuments({ status: "pending" });
    const inProgress = await Assignment.countDocuments({ status: "in-progress" });
    const completed = await Assignment.countDocuments({ status: "completed" });
    const cancelled = await Assignment.countDocuments({ status: "cancelled" });

    res.json({
      success: true,
      data: { total, pending, inProgress, completed, cancelled }
    });
  } catch (error) {
    console.error("Error in getAssignmentStats:", error);
    return sendError(res, error);
  }
};

const updateAssignment = async (req, res) => {
  try {
    const existing = await Assignment.findById(req.params.id);
    if (!existing) {
      throw new Error("Assignment not found");
    }

    const payload = getAssignmentPayload(req.body);
    const eventId = payload.event || getId(existing.event);
    const volunteerId = payload.volunteer || getId(existing.volunteer);

    if (eventId !== getId(existing.event) || volunteerId !== getId(existing.volunteer)) {
      await ensureAssignmentTargets(eventId, volunteerId, req.params.id);
    }

    const updates = {
      event: eventId,
      volunteer: volunteerId,
      duty: payload.duty,
      schedule: payload.schedule,
      priority: payload.priority,
      notes: payload.notes,
      status: payload.status
    };

    Object.keys(updates).forEach((key) => updates[key] === undefined && delete updates[key]);

    const assignment = await populateAssignment(
      Assignment.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
    );

    if (assignment.status === "cancelled") {
      await Promise.all([
        Event.findByIdAndUpdate(existing.event, { $pull: { volunteers: existing.volunteer } }),
        Volunteer.findByIdAndUpdate(existing.volunteer, { $pull: { eventsAssigned: existing.event } })
      ]);
    } else {
      await syncAssignmentRefs(existing, assignment);
    }

    res.json({ success: true, data: assignment });
  } catch (error) {
    console.error("Error in updateAssignment:", error);
    return sendError(res, error);
  }
};

const deleteAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findByIdAndDelete(req.params.id);
    if (!assignment) {
      throw new Error("Assignment not found");
    }

    await Promise.all([
      Event.findByIdAndUpdate(assignment.event, { $pull: { volunteers: assignment.volunteer } }),
      Volunteer.findByIdAndUpdate(assignment.volunteer, { $pull: { eventsAssigned: assignment.event } })
    ]);

    res.json({ success: true, message: "Assignment deleted successfully" });
  } catch (error) {
    console.error("Error in deleteAssignment:", error);
    return sendError(res, error);
  }
};

module.exports = {
  getAllAssignments,
  createAssignment,
  getAssignmentsByVolunteer,
  updateAssignmentStatus,
  getAssignmentStats,
  deleteAssignment,
  updateAssignment
};
