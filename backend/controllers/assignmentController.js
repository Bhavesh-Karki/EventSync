const Assignment = require("../models/Assignment");

const getAllAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find()
      .populate("event")
      .populate("volunteer");

    return res.status(200).json({
      success: true,
      message: "Assignments retrieved successfully",
      data: assignments
    });
  } catch (error) {
    console.error("Error in getAllAssignments controller:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve assignments",
      data: null
    });
  }
};

const createAssignment = async (req, res) => {
  try {
    const assignment = new Assignment(req.body);
    await assignment.save();

    // Populate the newly created assignment
    const populatedAssignment = await Assignment.findById(assignment._id)
      .populate("event")
      .populate("volunteer");

    return res.status(201).json({
      success: true,
      message: "Assignment created successfully",
      data: populatedAssignment
    });
  } catch (error) {
    console.error("Error in createAssignment controller:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create assignment",
      data: null
    });
  }
};

const getAssignmentsByVolunteer = async (req, res) => {
  try {
    const assignments = await Assignment.find({ volunteer: req.params.volunteerId })
      .populate("event")
      .populate("volunteer");

    return res.status(200).json({
      success: true,
      data: assignments
    });
  } catch (error) {
    console.error("Error in getAssignmentsByVolunteer controller:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve assignments"
    });
  }
};

const updateAssignmentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({ success: false, message: "Assignment not found" });
    }

    assignment.status = status;
    await assignment.save();

    res.json({ success: true, data: assignment });
  } catch (error) {
    console.error("Error in updateAssignmentStatus:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getAssignmentStats = async (req, res) => {
  try {
    const total = await Assignment.countDocuments();
    const pending = await Assignment.countDocuments({ status: 'pending' });
    const inProgress = await Assignment.countDocuments({ status: 'in-progress' });
    const completed = await Assignment.countDocuments({ status: 'completed' });
    const cancelled = await Assignment.countDocuments({ status: 'cancelled' });

    res.json({
      success: true,
      data: { total, pending, inProgress, completed, cancelled }
    });
  } catch (error) {
    console.error("Error in getAssignmentStats:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const updateAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate("event")
      .populate("volunteer");
    if (!assignment) {
      return res.status(404).json({ success: false, message: "Assignment not found" });
    }
    res.json({ success: true, data: assignment });
  } catch (error) {
    console.error("Error in updateAssignment:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

const deleteAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findByIdAndDelete(req.params.id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: "Assignment not found" });
    }
    res.json({ success: true, message: "Assignment deleted successfully" });
  } catch (error) {
    console.error("Error in deleteAssignment:", error);
    res.status(500).json({ success: false, message: "Server error" });
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
