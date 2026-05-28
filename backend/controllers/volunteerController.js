const Volunteer = require("../models/Volunteer");

const getAllVolunteers = async (req, res) => {
  try {
    const volunteers = await Volunteer.find();
    res.json({ success: true, data: volunteers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to retrieve volunteers", data: null });
  }
};

const createVolunteer = async (req, res) => {
  try {
    const volunteer = new Volunteer(req.body);
    await volunteer.save();
    res.status(201).json({ success: true, data: volunteer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message || "Failed to add volunteer" });
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
    res.status(500).json({ success: false, message: "Server error" });
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
    res.status(500).json({ success: false, message: err.message || "Failed to update volunteer" });
  }
};

const deleteVolunteer = async (req, res) => {
  try {
    const volunteer = await Volunteer.findByIdAndDelete(req.params.id);
    if (!volunteer) {
      return res.status(404).json({ success: false, message: "Volunteer not found" });
    }
    res.json({ success: true, message: "Volunteer deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to delete volunteer" });
  }
};

module.exports = {
  getAllVolunteers,
  createVolunteer,
  getVolunteerById,
  updateVolunteer,
  deleteVolunteer
};
