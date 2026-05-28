const Event = require("../models/Event");

// GET all events
const getAllEvents = async (req, res) => {
  try {
    const events = await Event.find();
    return res.json({ success: true, data: events });
  } catch (error) {
    console.error("getAllEvents error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch events" });
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
    return res.status(500).json({ success: false, message: error.message || "Failed to create event" });
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
    return res.status(500).json({ success: false, message: error.message || "Failed to update event" });
  }
};

// DELETE event
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }
    return res.json({ success: true, message: "Event deleted successfully" });
  } catch (error) {
    console.error("deleteEvent error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete event" });
  }
};

module.exports = {
  getAllEvents,
  createEvent,
  updateEvent,
  deleteEvent
};
