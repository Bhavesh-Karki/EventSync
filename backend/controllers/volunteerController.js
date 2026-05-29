const Volunteer = require("../models/Volunteer");
const Assignment = require("../models/Assignment");
const Event = require("../models/Event");

const sendError = (res, err, fallback) => {
  const status =
    err.name === "ValidationError" ||
    err.name === "CastError" ||
    err.code === 11000
      ? 400
      : 500;

  const message = err.code === 11000
    ? "A volunteer with this email already exists"
    : err.message || fallback;

  return res.status(status).json({ success: false, message, data: null });
};

const getAllVolunteers = async (req, res) => {
  try {
    const volunteers = await Volunteer.find();
    res.json({ success: true, data: volunteers });
  } catch (err) {
    console.error(err);
    sendError(res, err, "Failed to retrieve volunteers");
  }
};

const createVolunteer = async (req, res) => {
  try {
    const volunteer = new Volunteer(req.body);
    await volunteer.save();
    res.status(201).json({ success: true, data: volunteer });
  } catch (err) {
    console.error(err);
    sendError(res, err, "Failed to add volunteer");
  }
};

const getVolunteerById = async (req, res) => {
  try {
    const volunteer = await Volunteer.findById(req.params.id);
    if (!volunteer) {
      return res.status(404).json({ success: false, message: "Volunteer not found" });
    }
    res.json({ success: true, data: volunteer });
  } catch (err) {
    console.error(err);
    sendError(res, err, "Server error");
  }
};

const updateVolunteer = async (req, res) => {
  try {
    const volunteer = await Volunteer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!volunteer) {
      return res.status(404).json({ success: false, message: "Volunteer not found" });
    }
    res.json({ success: true, data: volunteer });
  } catch (err) {
    console.error(err);
    sendError(res, err, "Failed to update volunteer");
  }
};

const deleteVolunteer = async (req, res) => {
  try {
    const volunteer = await Volunteer.findByIdAndDelete(req.params.id);
    if (!volunteer) {
      return res.status(404).json({ success: false, message: "Volunteer not found" });
    }
    const assignments = await Assignment.find({ volunteer: volunteer._id });
    const eventIds = assignments.map((assignment) => assignment.event);

    await Promise.all([
      Assignment.deleteMany({ volunteer: volunteer._id }),
      Event.updateMany(
        { _id: { $in: eventIds } },
        { $pull: { volunteers: volunteer._id } }
      )
    ]);

    res.json({ success: true, message: "Volunteer deleted successfully" });
  } catch (err) {
    console.error(err);
    sendError(res, err, "Failed to delete volunteer");
  }
};

module.exports = {
  getAllVolunteers,
  createVolunteer,
  getVolunteerById,
  updateVolunteer,
  deleteVolunteer
};
