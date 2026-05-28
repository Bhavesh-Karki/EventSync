// ========================================
// SERVICE MODULE - services/volunteerServiceMongo.js
// ========================================
// Demonstrates MongoDB operations for Volunteer management
// ========================================

const Volunteer = require('../models/Volunteer');
const fileOps = require('../utils/fileOperations');
const validators = require('../utils/validators');

// ========================================
// CREATE VOLUNTEER
// ========================================
async function createVolunteer(volunteerData) {
    try {
        const validation = validators.validateVolunteer(volunteerData);
        
        if (!validation.valid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }
        
        // Create volunteer in MongoDB
        const newVolunteer = await Volunteer.create({
            name: volunteerData.name,
            email: volunteerData.email.toLowerCase(),
            phone: volunteerData.phone,
            skills: volunteerData.skills || [],
            availability: volunteerData.availability || 'flexible',
            status: 'active',
            eventsAssigned: [],
            address: volunteerData.address,
            emergencyContact: volunteerData.emergencyContact
        });
        
        await fileOps.appendLog(`Volunteer created in MongoDB: ${newVolunteer.name} (ID: ${newVolunteer._id})`);
        
        return newVolunteer;
    } catch (error) {
        // Handle duplicate email error
        if (error.code === 11000) {
            throw new Error('A volunteer with this email already exists');
        }
        if (error.name === 'ValidationError') {
            throw new Error(`Validation error: ${error.message}`);
        }
        throw new Error(`Failed to create volunteer: ${error.message}`);
    }
}

// ========================================
// GET ALL VOLUNTEERS
// ========================================
async function getAllVolunteers() {
    try {
        const volunteers = await Volunteer.find()
            .populate('eventsAssigned', 'name date location')
            .sort({ name: 1 });
        
        return volunteers;
    } catch (error) {
        throw new Error(`Failed to get volunteers: ${error.message}`);
    }
}

// ========================================
// GET VOLUNTEER BY ID
// ========================================
async function getVolunteerById(volunteerId) {
    try {
        const volunteer = await Volunteer.findById(volunteerId)
            .populate('eventsAssigned', 'name date location status');
        
        return volunteer;
    } catch (error) {
        if (error.name === 'CastError') {
            throw new Error('Invalid volunteer ID format');
        }
        throw new Error(`Failed to get volunteer: ${error.message}`);
    }
}

// ========================================
// UPDATE VOLUNTEER
// ========================================
async function updateVolunteer(volunteerId, updateData) {
    try {
        const updatedVolunteer = await Volunteer.findByIdAndUpdate(
            volunteerId,
            { $set: updateData },
            { new: true, runValidators: true }
        ).populate('eventsAssigned', 'name date');
        
        if (!updatedVolunteer) {
            throw new Error('Volunteer not found');
        }
        
        await fileOps.appendLog(`Volunteer updated: ${updatedVolunteer.name} (ID: ${volunteerId})`);
        
        return updatedVolunteer;
    } catch (error) {
        if (error.code === 11000) {
            throw new Error('Email already exists');
        }
        throw new Error(`Failed to update volunteer: ${error.message}`);
    }
}

// ========================================
// DELETE VOLUNTEER
// ========================================
async function deleteVolunteer(volunteerId) {
    try {
        const deletedVolunteer = await Volunteer.findByIdAndDelete(volunteerId);
        
        if (!deletedVolunteer) {
            throw new Error('Volunteer not found');
        }
        
        await fileOps.appendLog(`Volunteer deleted: ${deletedVolunteer.name} (ID: ${volunteerId})`);
        
        return { success: true, deletedVolunteer };
    } catch (error) {
        throw new Error(`Failed to delete volunteer: ${error.message}`);
    }
}

// ========================================
// SEARCH VOLUNTEERS BY SKILL
// ========================================
async function searchVolunteersBySkill(skill) {
    try {
        // Using static method from model
        const volunteers = await Volunteer.findBySkill(skill);
        return volunteers;
    } catch (error) {
        throw new Error(`Failed to search volunteers: ${error.message}`);
    }
}

// ========================================
// GET ACTIVE VOLUNTEERS
// ========================================
async function getActiveVolunteers() {
    try {
        const volunteers = await Volunteer.findActive();
        return volunteers;
    } catch (error) {
        throw new Error(`Failed to get active volunteers: ${error.message}`);
    }
}

// ========================================
// GET AVAILABLE VOLUNTEERS
// ========================================
async function getAvailableVolunteers() {
    try {
        const volunteers = await Volunteer.findAvailable();
        return volunteers;
    } catch (error) {
        throw new Error(`Failed to get available volunteers: ${error.message}`);
    }
}

// ========================================
// ASSIGN EVENT TO VOLUNTEER
// ========================================
async function addEventToVolunteer(volunteerId, eventId) {
    try {
        const volunteer = await Volunteer.findById(volunteerId);
        
        if (!volunteer) {
            throw new Error('Volunteer not found');
        }
        
        // Use instance method
        await volunteer.assignEvent(eventId);
        
        await fileOps.appendLog(`Event ${eventId} assigned to volunteer ${volunteerId}`);
        
        return volunteer;
    } catch (error) {
        throw new Error(`Failed to add event to volunteer: ${error.message}`);
    }
}

// ========================================
// REMOVE EVENT FROM VOLUNTEER
// ========================================
async function removeEventFromVolunteer(volunteerId, eventId) {
    try {
        const volunteer = await Volunteer.findById(volunteerId);
        
        if (!volunteer) {
            throw new Error('Volunteer not found');
        }
        
        await volunteer.unassignEvent(eventId);
        
        return volunteer;
    } catch (error) {
        throw new Error(`Failed to remove event: ${error.message}`);
    }
}

// ========================================
// UPDATE VOLUNTEER STATUS
// ========================================
async function updateVolunteerStatus(volunteerId, status) {
    try {
        const validStatuses = ['active', 'inactive', 'pending'];
        
        if (!validStatuses.includes(status)) {
            throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
        }
        
        const volunteer = await Volunteer.findByIdAndUpdate(
            volunteerId,
            { status },
            { new: true }
        );
        
        if (!volunteer) {
            throw new Error('Volunteer not found');
        }
        
        return volunteer;
    } catch (error) {
        throw new Error(`Failed to update status: ${error.message}`);
    }
}

// ========================================
// GET VOLUNTEER STATISTICS
// ========================================
async function getVolunteerStatistics() {
    try {
        const stats = await Volunteer.getStatistics();
        return stats;
    } catch (error) {
        throw new Error(`Failed to get statistics: ${error.message}`);
    }
}

// ========================================
// GET TOP VOLUNTEERS
// ========================================
async function getTopVolunteers(limit = 10) {
    try {
        const topVolunteers = await Volunteer.findTopVolunteers(limit);
        return topVolunteers;
    } catch (error) {
        throw new Error(`Failed to get top volunteers: ${error.message}`);
    }
}

// ========================================
// UPDATE VOLUNTEER RATING
// ========================================
async function updateVolunteerRating(volunteerId, rating) {
    try {
        const volunteer = await Volunteer.findById(volunteerId);
        
        if (!volunteer) {
            throw new Error('Volunteer not found');
        }
        
        await volunteer.updateRating(rating);
        
        return volunteer;
    } catch (error) {
        throw new Error(`Failed to update rating: ${error.message}`);
    }
}

// Module exports
module.exports = {
    createVolunteer,
    getAllVolunteers,
    getVolunteerById,
    updateVolunteer,
    deleteVolunteer,
    searchVolunteersBySkill,
    getActiveVolunteers,
    getAvailableVolunteers,
    addEventToVolunteer,
    removeEventFromVolunteer,
    updateVolunteerStatus,
    getVolunteerStatistics,
    getTopVolunteers,
    updateVolunteerRating
};
