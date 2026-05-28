// ========================================
// SERVICE MODULE - services/eventService.js
// ========================================
// This demonstrates:
// 1. Service layer pattern
// 2. Using custom modules with require()
// 3. Async/Await operations
// 4. Error handling with try-catch
// 5. setTimeout for simulating async operations
// ========================================

// Using uuid package for generating unique IDs
const { v4: uuidv4 } = require('uuid');

// Importing custom file operations module (demonstrates require())
const fileOps = require('../utils/fileOperations');

// Importing custom validators module
const validators = require('../utils/validators');

// In-memory storage (will be replaced with MongoDB later)
let events = [];

// Filename for persisting events
const EVENTS_FILE = 'events.json';

// ========================================
// INITIALIZE SERVICE
// ========================================
/**
 * Load events from file on startup
 * Demonstrates async/await and file reading
 */
async function initializeEvents() {
    try {
        // Using custom fileOps module to read from file
        const result = await fileOps.readFileAsync(EVENTS_FILE);
        
        if (result.data && Array.isArray(result.data)) {
            events = result.data;
            console.log(`✅ Loaded ${events.length} events from file`);
            
            // Log the operation
            await fileOps.appendLog(`Loaded ${events.length} events from file`);
        } else {
            events = [];
            console.log('📝 Starting with empty events list');
        }
    } catch (error) {
        console.error('❌ Error loading events:', error.message);
        events = [];
    }
}

// Call initialization
initializeEvents();

// ========================================
// SAVE TO FILE (Demonstrates Async Operations)
// ========================================
/**
 * Save events to file
 * Demonstrates async/await and error handling
 */
async function saveEventsToFile() {
    try {
        // Using custom fileOps module with async/await
        await fileOps.writeFileAsync(EVENTS_FILE, events);
        
        // Log the operation
        await fileOps.appendLog(`Saved ${events.length} events to file`);
        
        return { success: true };
    } catch (error) {
        console.error('Error saving events:', error.message);
        throw error;
    }
}

// ========================================
// CREATE EVENT
// ========================================
/**
 * Create a new event
 * Demonstrates validation, async operations, and setTimeout
 * @param {object} eventData - Event data
 * @returns {Promise<object>} - Created event
 */
async function createEvent(eventData) {
    // Using try-catch for error handling (demonstrates error handling)
    try {
        // Validate event data using custom validator
        const validation = validators.validateEvent(eventData);
        
        if (!validation.valid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }
        
        // Create new event object
        const newEvent = {
            id: uuidv4(), // Generate unique ID
            name: validators.sanitizeString(eventData.name),
            date: eventData.date,
            location: validators.sanitizeString(eventData.location),
            description: validators.sanitizeString(eventData.description),
            status: 'upcoming',
            volunteers: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // Add to in-memory storage
        events.push(newEvent);
        
        // Using setTimeout to simulate delayed file save (demonstrates timers)
        setTimeout(async () => {
            await saveEventsToFile();
            await fileOps.appendLog(`Event created: ${newEvent.name} (ID: ${newEvent.id})`);
        }, 500);
        
        return newEvent;
    } catch (error) {
        // Re-throw error for controller to handle
        throw new Error(`Failed to create event: ${error.message}`);
    }
}

// ========================================
// GET ALL EVENTS
// ========================================
/**
 * Get all events
 * Demonstrates async operations and Promise
 * @returns {Promise<Array>} - Array of events
 */
async function getAllEvents() {
    // Using Promise to wrap synchronous operation (demonstrates Promise pattern)
    return new Promise((resolve) => {
        // Simulate async operation with setTimeout
        setTimeout(() => {
            resolve([...events]); // Return copy of events array
        }, 100);
    });
}

// ========================================
// GET EVENT BY ID
// ========================================
/**
 * Get event by ID
 * Demonstrates async/await with array operations
 * @param {string} eventId - Event ID
 * @returns {Promise<object|null>} - Event or null
 */
async function getEventById(eventId) {
    try {
        // Simulate async database query with setTimeout
        return await new Promise((resolve) => {
            setTimeout(() => {
                const event = events.find(e => e.id === eventId);
                resolve(event || null);
            }, 100);
        });
    } catch (error) {
        throw new Error(`Failed to get event: ${error.message}`);
    }
}

// ========================================
// UPDATE EVENT
// ========================================
/**
 * Update an existing event
 * Demonstrates async operations and file writing
 * @param {string} eventId - Event ID
 * @param {object} updateData - Data to update
 * @returns {Promise<object>} - Updated event
 */
async function updateEvent(eventId, updateData) {
    try {
        const eventIndex = events.findIndex(e => e.id === eventId);
        
        if (eventIndex === -1) {
            throw new Error('Event not found');
        }
        
        // Update event
        events[eventIndex] = {
            ...events[eventIndex],
            ...updateData,
            id: eventId, // Preserve ID
            updatedAt: new Date().toISOString()
        };
        
        // Save to file asynchronously
        await saveEventsToFile();
        await fileOps.appendLog(`Event updated: ${events[eventIndex].name} (ID: ${eventId})`);
        
        return events[eventIndex];
    } catch (error) {
        throw new Error(`Failed to update event: ${error.message}`);
    }
}

// ========================================
// DELETE EVENT
// ========================================
/**
 * Delete an event
 * Demonstrates async operations and array manipulation
 * @param {string} eventId - Event ID
 * @returns {Promise<object>} - Deletion result
 */
async function deleteEvent(eventId) {
    try {
        const eventIndex = events.findIndex(e => e.id === eventId);
        
        if (eventIndex === -1) {
            throw new Error('Event not found');
        }
        
        const deletedEvent = events[eventIndex];
        
        // Remove from array
        events.splice(eventIndex, 1);
        
        // Save to file
        await saveEventsToFile();
        await fileOps.appendLog(`Event deleted: ${deletedEvent.name} (ID: ${eventId})`);
        
        return { success: true, deletedEvent };
    } catch (error) {
        throw new Error(`Failed to delete event: ${error.message}`);
    }
}

// ========================================
// ASSIGN VOLUNTEER TO EVENT
// ========================================
/**
 * Assign volunteer to event
 * @param {string} eventId - Event ID
 * @param {string} volunteerId - Volunteer ID
 * @returns {Promise<object>} - Updated event
 */
async function assignVolunteerToEvent(eventId, volunteerId) {
    try {
        const event = await getEventById(eventId);
        
        if (!event) {
            throw new Error('Event not found');
        }
        
        // Check if volunteer already assigned
        if (event.volunteers.includes(volunteerId)) {
            throw new Error('Volunteer already assigned to this event');
        }
        
        event.volunteers.push(volunteerId);
        
        return await updateEvent(eventId, { volunteers: event.volunteers });
    } catch (error) {
        throw new Error(`Failed to assign volunteer: ${error.message}`);
    }
}

// ========================================
// MODULE EXPORTS
// ========================================
// Using module.exports to export service functions
module.exports = {
    createEvent,
    getAllEvents,
    getEventById,
    updateEvent,
    deleteEvent,
    assignVolunteerToEvent,
    initializeEvents
};
