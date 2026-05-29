const Event = require("../models/Event");
const Assignment = require("../models/Assignment");
const Volunteer = require("../models/Volunteer");

const sendError = (res, error, fallback) => {
  const status = error.name === "ValidationError" || error.name === "CastError" ? 400 : 500;
  return res.status(status).json({ success: false, message: error.message || fallback });
};

// GET all events
const getAllEvents = async (req, res) => {
  try {
    const events = await Event.find();
    return res.json({ success: true, data: events });
  } catch (error) {
    console.error("getAllEvents error:", error);
    return sendError(res, error, "Failed to fetch events");
  }
};

// CREATE event
const createEvent = async (req, res) => {
  try {
    const event = new Event(req.body);
    await event.save();
    return res.status(201).json({ success: true, data: event });
  } catch (error) {
    console.error("createEvent error:", error);
    return sendError(res, error, "Failed to create event");
  }
};

// UPDATE event
const updateEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }
    return res.json({ success: true, data: event });
  } catch (error) {
    console.error("updateEvent error:", error);
    return sendError(res, error, "Failed to update event");
  }
};

// DELETE event
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }
    const assignments = await Assignment.find({ event: event._id });
    const volunteerIds = assignments.map((assignment) => assignment.volunteer);

    await Promise.all([
      Assignment.deleteMany({ event: event._id }),
      Volunteer.updateMany(
        { _id: { $in: volunteerIds } },
        { $pull: { eventsAssigned: event._id } }
      )
    ]);

    return res.json({ success: true, message: "Event deleted successfully" });
  } catch (error) {
    console.error("deleteEvent error:", error);
    return sendError(res, error, "Failed to delete event");
  }
};

module.exports = {
  getAllEvents,
  createEvent,
  updateEvent,
  deleteEvent
};
