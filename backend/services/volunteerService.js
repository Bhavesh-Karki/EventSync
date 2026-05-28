// ========================================
// SERVICE MODULE - services/volunteerService.js
// ========================================
// This demonstrates:
// 1. Service layer with business logic
// 2. Async/Await patterns
// 3. File operations using custom module
// 4. Error handling
// ========================================

const { v4: uuidv4 } = require('uuid');

// Importing custom modules (demonstrates require())
const fileOps = require('../utils/fileOperations');
const validators = require('../utils/validators');

// In-memory storage
let volunteers = [];

const VOLUNTEERS_FILE = 'volunteers.json';

// ========================================
// INITIALIZE SERVICE
// ========================================
async function initializeVolunteers() {
    try {
        const result = await fileOps.readFileAsync(VOLUNTEERS_FILE);
        
        if (result.data && Array.isArray(result.data)) {
            volunteers = result.data;
            console.log(`✅ Loaded ${volunteers.length} volunteers from file`);
            await fileOps.appendLog(`Loaded ${volunteers.length} volunteers from file`);
        } else {
            volunteers = [];
            console.log('📝 Starting with empty volunteers list');
        }
    } catch (error) {
        console.error('❌ Error loading volunteers:', error.message);
        volunteers = [];
    }
}

initializeVolunteers();

// ========================================
// SAVE TO FILE
// ========================================
async function saveVolunteersToFile() {
    try {
        await fileOps.writeFileAsync(VOLUNTEERS_FILE, volunteers);
        await fileOps.appendLog(`Saved ${volunteers.length} volunteers to file`);
        return { success: true };
    } catch (error) {
        console.error('Error saving volunteers:', error.message);
        throw error;
    }
}

// ========================================
// CREATE VOLUNTEER
// ========================================
/**
 * Create a new volunteer
 * Demonstrates validation and async operations
 * @param {object} volunteerData - Volunteer data
 * @returns {Promise<object>} - Created volunteer
 */
async function createVolunteer(volunteerData) {
    try {
        // Validate volunteer data
        const validation = validators.validateVolunteer(volunteerData);
        
        if (!validation.valid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }
        
        // Check for duplicate email
        const existingVolunteer = volunteers.find(v => v.email === volunteerData.email);
        if (existingVolunteer) {
            throw new Error('A volunteer with this email already exists');
        }
        
        // Create new volunteer
        const newVolunteer = {
            id: uuidv4(),
            name: validators.sanitizeString(volunteerData.name),
            email: volunteerData.email.toLowerCase(),
            phone: volunteerData.phone,
            skills: volunteerData.skills || [],
            availability: volunteerData.availability || 'flexible',
            status: 'active',
            eventsAssigned: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        volunteers.push(newVolunteer);
        
        // Using setTimeout to demonstrate asynchronous file saving
        setTimeout(async () => {
            await saveVolunteersToFile();
            await fileOps.appendLog(`Volunteer created: ${newVolunteer.name} (ID: ${newVolunteer.id})`);
        }, 500);
        
        return newVolunteer;
    } catch (error) {
        throw new Error(`Failed to create volunteer: ${error.message}`);
    }
}

// ========================================
// GET ALL VOLUNTEERS
// ========================================
/**
 * Get all volunteers
 * Demonstrates Promise pattern
 * @returns {Promise<Array>} - Array of volunteers
 */
async function getAllVolunteers() {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve([...volunteers]);
        }, 100);
    });
}

// ========================================
// GET VOLUNTEER BY ID
// ========================================
/**
 * Get volunteer by ID
 * @param {string} volunteerId - Volunteer ID
 * @returns {Promise<object|null>} - Volunteer or null
 */
async function getVolunteerById(volunteerId) {
    try {
        return await new Promise((resolve) => {
            setTimeout(() => {
                const volunteer = volunteers.find(v => v.id === volunteerId);
                resolve(volunteer || null);
            }, 100);
        });
    } catch (error) {
        throw new Error(`Failed to get volunteer: ${error.message}`);
    }
}

// ========================================
// UPDATE VOLUNTEER
// ========================================
/**
 * Update volunteer
 * @param {string} volunteerId - Volunteer ID
 * @param {object} updateData - Data to update
 * @returns {Promise<object>} - Updated volunteer
 */
async function updateVolunteer(volunteerId, updateData) {
    try {
        const volunteerIndex = volunteers.findIndex(v => v.id === volunteerId);
        
        if (volunteerIndex === -1) {
            throw new Error('Volunteer not found');
        }
        
        volunteers[volunteerIndex] = {
            ...volunteers[volunteerIndex],
            ...updateData,
            id: volunteerId,
            updatedAt: new Date().toISOString()
        };
        
        await saveVolunteersToFile();
        await fileOps.appendLog(`Volunteer updated: ${volunteers[volunteerIndex].name} (ID: ${volunteerId})`);
        
        return volunteers[volunteerIndex];
    } catch (error) {
        throw new Error(`Failed to update volunteer: ${error.message}`);
    }
}

// ========================================
// DELETE VOLUNTEER
// ========================================
/**
 * Delete volunteer
 * @param {string} volunteerId - Volunteer ID
 * @returns {Promise<object>} - Deletion result
 */
async function deleteVolunteer(volunteerId) {
    try {
        const volunteerIndex = volunteers.findIndex(v => v.id === volunteerId);
        
        if (volunteerIndex === -1) {
            throw new Error('Volunteer not found');
        }
        
        const deletedVolunteer = volunteers[volunteerIndex];
        volunteers.splice(volunteerIndex, 1);
        
        await saveVolunteersToFile();
        await fileOps.appendLog(`Volunteer deleted: ${deletedVolunteer.name} (ID: ${volunteerId})`);
        
        return { success: true, deletedVolunteer };
    } catch (error) {
        throw new Error(`Failed to delete volunteer: ${error.message}`);
    }
}

// ========================================
// SEARCH VOLUNTEERS BY SKILL
// ========================================
/**
 * Search volunteers by skill
 * Demonstrates array filtering with async
 * @param {string} skill - Skill to search for
 * @returns {Promise<Array>} - Matching volunteers
 */
async function searchVolunteersBySkill(skill) {
    return new Promise((resolve) => {
        setTimeout(() => {
            const results = volunteers.filter(v => 
                v.skills.some(s => s.toLowerCase().includes(skill.toLowerCase()))
            );
            resolve(results);
        }, 100);
    });
}

// ========================================
// ADD EVENT TO VOLUNTEER
// ========================================
/**
 * Add event assignment to volunteer
 * @param {string} volunteerId - Volunteer ID
 * @param {string} eventId - Event ID
 * @returns {Promise<object>} - Updated volunteer
 */
async function addEventToVolunteer(volunteerId, eventId) {
    try {
        const volunteer = await getVolunteerById(volunteerId);
        
        if (!volunteer) {
            throw new Error('Volunteer not found');
        }
        
        if (volunteer.eventsAssigned.includes(eventId)) {
            throw new Error('Event already assigned to this volunteer');
        }
        
        volunteer.eventsAssigned.push(eventId);
        
        return await updateVolunteer(volunteerId, { eventsAssigned: volunteer.eventsAssigned });
    } catch (error) {
        throw new Error(`Failed to add event to volunteer: ${error.message}`);
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
    addEventToVolunteer,
    initializeVolunteers
};
