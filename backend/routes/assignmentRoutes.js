const express = require("express");
const router = express.Router();

const {
  getAllAssignments,
  createAssignment,
  getAssignmentsByVolunteer,
  updateAssignmentStatus,
  getAssignmentStats,
  deleteAssignment,
  updateAssignment
} = require("../controllers/assignmentController");

router.get("/", getAllAssignments);
router.post("/", createAssignment);
router.get("/stats", getAssignmentStats);
router.get("/volunteer/:volunteerId", getAssignmentsByVolunteer);
router.patch("/:id/status", updateAssignmentStatus);
router.put("/:id", updateAssignment);
router.delete("/:id", deleteAssignment);

module.exports = router;
