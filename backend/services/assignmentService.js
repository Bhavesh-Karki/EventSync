// ========================================
// SERVICE MODULE - services/assignmentService.js
// ========================================
// This demonstrates:
// 1. Complex business logic
// 2. Inter-service communication
// 3. Async/Await with multiple operations
// 4. File operations for persistence
// ========================================

const { v4: uuidv4 } = require('uuid');

// Importing custom modules
const fileOps = require('../utils/fileOperations');
const validators = require('../utils/validators');

// Importing other services (demonstrates inter-service communication)
const eventService = require('./eventService');
const volunteerService = require('./volunteerService');

// In-memory storage
let assignments = [];

const ASSIGNMENTS_FILE = 'assignments.json';

// ========================================
// INITIALIZE SERVICE
// ========================================
async function initializeAssignments() {
    try {
        const result = await fileOps.readFileAsync(ASSIGNMENTS_FILE);
        
        if (result.data && Array.isArray(result.data)) {
            assignments = result.data;
            console.log(`✅ Loaded ${assignments.length} assignments from file`);
            await fileOps.appendLog(`Loaded ${assignments.length} assignments from file`);
        } else {
            assignments = [];
            console.log('📝 Starting with empty assignments list');
        }
    } catch (error) {
        console.error('❌ Error loading assignments:', error.message);
        assignments = [];
    }
}

initializeAssignments();

// ========================================
// SAVE TO FILE
// ========================================
async function saveAssignmentsToFile() {
    try {
        await fileOps.writeFileAsync(ASSIGNMENTS_FILE, assignments);
        await fileOps.appendLog(`Saved ${assignments.length} assignments to file`);
        return { success: true };
    } catch (error) {
        console.error('Error saving assignments:', error.message);
        throw error;
    }
}

// ========================================
// CREATE ASSIGNMENT
// ========================================
/**
 * Create a new assignment
 * Demonstrates async operations with multiple service calls
 * @param {object} assignmentData - Assignment data
 * @returns {Promise<object>} - Created assignment
 */
async function createAssignment(assignmentData) {
    try {
        // Validate assignment data
        const validation = validators.validateAssignment(assignmentData);
        
        if (!validation.valid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }
        
        // Verify event exists (demonstrates inter-service communication)
        const event = await eventService.getEventById(assignmentData.eventId);
        if (!event) {
            throw new Error('Event not found');
        }
        
        // Verify volunteer exists
        const volunteer = await volunteerService.getVolunteerById(assignmentData.volunteerId);
        if (!volunteer) {
            throw new Error('Volunteer not found');
        }
        
        // Check for duplicate assignment
        const existingAssignment = assignments.find(a => 
            a.eventId === assignmentData.eventId && 
            a.volunteerId === assignmentData.volunteerId &&
            a.duty === assignmentData.duty
        );
        
        if (existingAssignment) {
            throw new Error('This assignment already exists');
        }
        
        // Create new assignment
        const newAssignment = {
            id: uuidv4(),
            eventId: assignmentData.eventId,
            volunteerId: assignmentData.volunteerId,
            eventName: event.name,
            volunteerName: volunteer.name,
            duty: validators.sanitizeString(assignmentData.duty),
            schedule: assignmentData.schedule,
            status: 'pending',
            notes: assignmentData.notes || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            completedAt: null
        };
        
        assignments.push(newAssignment);
        
        // Update event and volunteer references
        await eventService.assignVolunteerToEvent(assignmentData.eventId, assignmentData.volunteerId);
        await volunteerService.addEventToVolunteer(assignmentData.volunteerId, assignmentData.eventId);
        
        // Save to file with setTimeout (demonstrates async timing)
        setTimeout(async () => {
            await saveAssignmentsToFile();
            await fileOps.appendLog(`Assignment created: ${newAssignment.duty} for ${volunteer.name} at ${event.name}`);
        }, 500);
        
        return newAssignment;
    } catch (error) {
        throw new Error(`Failed to create assignment: ${error.message}`);
    }
}

// ========================================
// GET ALL ASSIGNMENTS
// ========================================
/**
 * Get all assignments
 * @returns {Promise<Array>} - Array of assignments
 */
async function getAllAssignments() {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve([...assignments]);
        }, 100);
    });
}

// ========================================
// GET ASSIGNMENTS BY VOLUNTEER
// ========================================
/**
 * Get assignments for a specific volunteer
 * Demonstrates filtering with async
 * @param {string} volunteerId - Volunteer ID
 * @returns {Promise<Array>} - Array of assignments
 */
async function getAssignmentsByVolunteer(volunteerId) {
    try {
        return await new Promise((resolve) => {
            setTimeout(() => {
                const volunteerAssignments = assignments.filter(a => a.volunteerId === volunteerId);
                resolve(volunteerAssignments);
            }, 100);
        });
    } catch (error) {
        throw new Error(`Failed to get volunteer assignments: ${error.message}`);
    }
}

// ========================================
// GET ASSIGNMENTS BY EVENT
// ========================================
/**
 * Get assignments for a specific event
 * @param {string} eventId - Event ID
 * @returns {Promise<Array>} - Array of assignments
 */
async function getAssignmentsByEvent(eventId) {
    try {
        return await new Promise((resolve) => {
            setTimeout(() => {
                const eventAssignments = assignments.filter(a => a.eventId === eventId);
                resolve(eventAssignments);
            }, 100);
        });
    } catch (error) {
        throw new Error(`Failed to get event assignments: ${error.message}`);
    }
}

// ========================================
// UPDATE ASSIGNMENT STATUS
// ========================================
/**
 * Update assignment status
 * Demonstrates status transitions
 * @param {string} assignmentId - Assignment ID
 * @param {string} status - New status (pending, in-progress, completed, cancelled)
 * @returns {Promise<object>} - Updated assignment
 */
async function updateAssignmentStatus(assignmentId, status) {
    try {
        const validStatuses = ['pending', 'in-progress', 'completed', 'cancelled'];
        
        if (!validStatuses.includes(status)) {
            throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
        }
        
        const assignmentIndex = assignments.findIndex(a => a.id === assignmentId);
        
        if (assignmentIndex === -1) {
            throw new Error('Assignment not found');
        }
        
        assignments[assignmentIndex].status = status;
        assignments[assignmentIndex].updatedAt = new Date().toISOString();
        
        // Set completion timestamp if completed
        if (status === 'completed') {
            assignments[assignmentIndex].completedAt = new Date().toISOString();
        }
        
        await saveAssignmentsToFile();
        await fileOps.appendLog(`Assignment status updated: ${assignmentId} -> ${status}`);
        
        return assignments[assignmentIndex];
    } catch (error) {
        throw new Error(`Failed to update assignment status: ${error.message}`);
    }
}

// ========================================
// UPDATE ASSIGNMENT
// ========================================
/**
 * Update assignment details
 * @param {string} assignmentId - Assignment ID
 * @param {object} updateData - Data to update
 * @returns {Promise<object>} - Updated assignment
 */
async function updateAssignment(assignmentId, updateData) {
    try {
        const assignmentIndex = assignments.findIndex(a => a.id === assignmentId);
        
        if (assignmentIndex === -1) {
            throw new Error('Assignment not found');
        }
        
        assignments[assignmentIndex] = {
            ...assignments[assignmentIndex],
            ...updateData,
            id: assignmentId,
            updatedAt: new Date().toISOString()
        };
        
        await saveAssignmentsToFile();
        await fileOps.appendLog(`Assignment updated: ${assignmentId}`);
        
        return assignments[assignmentIndex];
    } catch (error) {
        throw new Error(`Failed to update assignment: ${error.message}`);
    }
}

// ========================================
// DELETE ASSIGNMENT
// ========================================
/**
 * Delete assignment
 * @param {string} assignmentId - Assignment ID
 * @returns {Promise<object>} - Deletion result
 */
async function deleteAssignment(assignmentId) {
    try {
        const assignmentIndex = assignments.findIndex(a => a.id === assignmentId);
        
        if (assignmentIndex === -1) {
            throw new Error('Assignment not found');
        }
        
        const deletedAssignment = assignments[assignmentIndex];
        assignments.splice(assignmentIndex, 1);
        
        await saveAssignmentsToFile();
        await fileOps.appendLog(`Assignment deleted: ${assignmentId}`);
        
        return { success: true, deletedAssignment };
    } catch (error) {
        throw new Error(`Failed to delete assignment: ${error.message}`);
    }
}

// ========================================
// GET ASSIGNMENT STATISTICS
// ========================================
/**
 * Get assignment statistics
 * Demonstrates data aggregation with async
 * @returns {Promise<object>} - Statistics object
 */
async function getAssignmentStats() {
    return new Promise((resolve) => {
        setTimeout(() => {
            const stats = {
                total: assignments.length,
                pending: assignments.filter(a => a.status === 'pending').length,
                inProgress: assignments.filter(a => a.status === 'in-progress').length,
                completed: assignments.filter(a => a.status === 'completed').length,
                cancelled: assignments.filter(a => a.status === 'cancelled').length,
                byEvent: {}
            };
            
            // Count assignments per event
            assignments.forEach(a => {
                if (!stats.byEvent[a.eventId]) {
                    stats.byEvent[a.eventId] = {
                        eventName: a.eventName,
                        count: 0
                    };
                }
                stats.byEvent[a.eventId].count++;
            });
            
            resolve(stats);
        }, 100);
    });
}

// Module exports
module.exports = {
    createAssignment,
    getAllAssignments,
    getAssignmentsByVolunteer,
    getAssignmentsByEvent,
    updateAssignmentStatus,
    updateAssignment,
    deleteAssignment,
    getAssignmentStats,
    initializeAssignments
};
