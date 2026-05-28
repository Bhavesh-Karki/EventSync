// ========================================
// SERVICE MODULE - services/assignmentServiceMongo.js
// ========================================
// Demonstrates MongoDB operations for Assignment management
// ========================================

const Assignment = require('../models/Assignment');
const Event = require('../models/Event');
const Volunteer = require('../models/Volunteer');
const fileOps = require('../utils/fileOperations');
const validators = require('../utils/validators');

// ========================================
// CREATE ASSIGNMENT
// ========================================
async function createAssignment(assignmentData) {
    try {
        const validation = validators.validateAssignment(assignmentData);
        
        if (!validation.valid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }
        
        // Verify event exists
        const event = await Event.findById(assignmentData.eventId);
        if (!event) {
            throw new Error('Event not found');
        }
        
        // Verify volunteer exists
        const volunteer = await Volunteer.findById(assignmentData.volunteerId);
        if (!volunteer) {
            throw new Error('Volunteer not found');
        }
        
        // Check for conflicts
        const hasConflict = await Assignment.checkConflicts(
            assignmentData.volunteerId,
            assignmentData.eventId
        );
        
        if (hasConflict) {
            throw new Error('Volunteer is already assigned to this event');
        }
        
        // Create assignment in MongoDB
        const newAssignment = await Assignment.create({
            event: assignmentData.eventId,
            volunteer: assignmentData.volunteerId,
            duty: assignmentData.duty,
            schedule: assignmentData.schedule,
            status: 'pending',
            priority: assignmentData.priority || 'medium',
            notes: assignmentData.notes || ''
        });
        
        // Update event and volunteer
        await event.addVolunteer(assignmentData.volunteerId);
        await volunteer.assignEvent(assignmentData.eventId);
        
        // Populate the assignment before returning
        await newAssignment.populate([
            { path: 'event', select: 'name date location' },
            { path: 'volunteer', select: 'name email phone' }
        ]);
        
        await fileOps.appendLog(`Assignment created: ${newAssignment.duty} for ${volunteer.name}`);
        
        return newAssignment;
    } catch (error) {
        if (error.name === 'ValidationError') {
            throw new Error(`Validation error: ${error.message}`);
        }
        throw new Error(`Failed to create assignment: ${error.message}`);
    }
}

// ========================================
// GET ALL ASSIGNMENTS
// ========================================
async function getAllAssignments() {
    try {
        const assignments = await Assignment.find()
            .populate('event', 'name date location status')
            .populate('volunteer', 'name email phone')
            .sort({ createdAt: -1 });
        
        return assignments;
    } catch (error) {
        throw new Error(`Failed to get assignments: ${error.message}`);
    }
}

// ========================================
// GET ASSIGNMENT BY ID
// ========================================
async function getAssignmentById(assignmentId) {
    try {
        const assignment = await Assignment.findById(assignmentId)
            .populate('event', 'name date location status description')
            .populate('volunteer', 'name email phone skills');
        
        return assignment;
    } catch (error) {
        throw new Error(`Failed to get assignment: ${error.message}`);
    }
}

// ========================================
// GET ASSIGNMENTS BY VOLUNTEER
// ========================================
async function getAssignmentsByVolunteer(volunteerId) {
    try {
        const assignments = await Assignment.findByVolunteer(volunteerId);
        return assignments;
    } catch (error) {
        throw new Error(`Failed to get volunteer assignments: ${error.message}`);
    }
}

// ========================================
// GET ASSIGNMENTS BY EVENT
// ========================================
async function getAssignmentsByEvent(eventId) {
    try {
        const assignments = await Assignment.findByEvent(eventId);
        return assignments;
    } catch (error) {
        throw new Error(`Failed to get event assignments: ${error.message}`);
    }
}

// ========================================
// GET ASSIGNMENTS BY STATUS
// ========================================
async function getAssignmentsByStatus(status) {
    try {
        const assignments = await Assignment.findByStatus(status);
        return assignments;
    } catch (error) {
        throw new Error(`Failed to get assignments by status: ${error.message}`);
    }
}

// ========================================
// UPDATE ASSIGNMENT STATUS
// ========================================
async function updateAssignmentStatus(assignmentId, status) {
    try {
        const validStatuses = ['pending', 'in-progress', 'completed', 'cancelled'];
        
        if (!validStatuses.includes(status)) {
            throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
        }
        
        const assignment = await Assignment.findById(assignmentId);
        
        if (!assignment) {
            throw new Error('Assignment not found');
        }
        
        // Use instance methods for status changes
        if (status === 'in-progress') {
            await assignment.start();
        } else if (status === 'completed') {
            await assignment.complete();
        } else if (status === 'cancelled') {
            await assignment.cancel();
        } else {
            assignment.status = status;
            await assignment.save();
        }
        
        // Populate before returning
        await assignment.populate([
            { path: 'event', select: 'name date location' },
            { path: 'volunteer', select: 'name email' }
        ]);
        
        await fileOps.appendLog(`Assignment status updated: ${assignmentId} -> ${status}`);
        
        return assignment;
    } catch (error) {
        throw new Error(`Failed to update assignment status: ${error.message}`);
    }
}

// ========================================
// UPDATE ASSIGNMENT
// ========================================
async function updateAssignment(assignmentId, updateData) {
    try {
        const updatedAssignment = await Assignment.findByIdAndUpdate(
            assignmentId,
            { $set: updateData },
            { new: true, runValidators: true }
        )
        .populate('event', 'name date location')
        .populate('volunteer', 'name email');
        
        if (!updatedAssignment) {
            throw new Error('Assignment not found');
        }
        
        await fileOps.appendLog(`Assignment updated: ${assignmentId}`);
        
        return updatedAssignment;
    } catch (error) {
        throw new Error(`Failed to update assignment: ${error.message}`);
    }
}

// ========================================
// DELETE ASSIGNMENT
// ========================================
async function deleteAssignment(assignmentId) {
    try {
        const assignment = await Assignment.findById(assignmentId);
        
        if (!assignment) {
            throw new Error('Assignment not found');
        }
        
        // Remove references from event and volunteer
        const event = await Event.findById(assignment.event);
        const volunteer = await Volunteer.findById(assignment.volunteer);
        
        if (event) {
            await event.removeVolunteer(assignment.volunteer);
        }
        
        if (volunteer) {
            await volunteer.unassignEvent(assignment.event);
        }
        
        // Delete the assignment
        await Assignment.findByIdAndDelete(assignmentId);
        
        await fileOps.appendLog(`Assignment deleted: ${assignmentId}`);
        
        return { success: true, deletedAssignment: assignment };
    } catch (error) {
        throw new Error(`Failed to delete assignment: ${error.message}`);
    }
}

// ========================================
// CHECK IN VOLUNTEER
// ========================================
async function checkInVolunteer(assignmentId) {
    try {
        const assignment = await Assignment.findById(assignmentId);
        
        if (!assignment) {
            throw new Error('Assignment not found');
        }
        
        await assignment.checkIn();
        
        return assignment;
    } catch (error) {
        throw new Error(`Failed to check in: ${error.message}`);
    }
}

// ========================================
// CHECK OUT VOLUNTEER
// ========================================
async function checkOutVolunteer(assignmentId) {
    try {
        const assignment = await Assignment.findById(assignmentId);
        
        if (!assignment) {
            throw new Error('Assignment not found');
        }
        
        await assignment.checkOut();
        
        return assignment;
    } catch (error) {
        throw new Error(`Failed to check out: ${error.message}`);
    }
}

// ========================================
// SUBMIT FEEDBACK
// ========================================
async function submitFeedback(assignmentId, rating, comment) {
    try {
        const assignment = await Assignment.findById(assignmentId);
        
        if (!assignment) {
            throw new Error('Assignment not found');
        }
        
        await assignment.submitFeedback(rating, comment);
        
        return assignment;
    } catch (error) {
        throw new Error(`Failed to submit feedback: ${error.message}`);
    }
}

// ========================================
// GET ASSIGNMENT STATISTICS
// ========================================
async function getAssignmentStats() {
    try {
        const stats = await Assignment.getStatistics();
        return stats;
    } catch (error) {
        throw new Error(`Failed to get statistics: ${error.message}`);
    }
}

// ========================================
// GET UPCOMING ASSIGNMENTS
// ========================================
async function getUpcomingAssignments() {
    try {
        const assignments = await Assignment.findUpcoming();
        return assignments;
    } catch (error) {
        throw new Error(`Failed to get upcoming assignments: ${error.message}`);
    }
}

// Module exports
module.exports = {
    createAssignment,
    getAllAssignments,
    getAssignmentById,
    getAssignmentsByVolunteer,
    getAssignmentsByEvent,
    getAssignmentsByStatus,
    updateAssignmentStatus,
    updateAssignment,
    deleteAssignment,
    checkInVolunteer,
    checkOutVolunteer,
    submitFeedback,
    getAssignmentStats,
    getUpcomingAssignments
};
