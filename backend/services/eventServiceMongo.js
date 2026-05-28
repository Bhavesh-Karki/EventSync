// ========================================
// SERVICE MODULE - services/eventServiceMongo.js
// ========================================
// This demonstrates:
// 1. MongoDB operations with Mongoose
// 2. CRUD operations with database
// 3. Async/Await with database queries
// 4. Error handling with database operations
// 5. Mongoose model methods
// ========================================

// Importing Event model (demonstrates Mongoose model usage)
const Event = require('../models/Event');

// Importing custom modules
const fileOps = require('../utils/fileOperations');
const validators = require('../utils/validators');

// ========================================
// CREATE EVENT (MongoDB)
// ========================================
/**
 * Create a new event in MongoDB
 * Demonstrates Mongoose create operation
 * @param {object} eventData - Event data
 * @returns {Promise<object>} - Created event
 */
async function createEvent(eventData) {
    try {
        // Validate event data using custom validator
        const validation = validators.validateEvent(eventData);
        
        if (!validation.valid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }
        
        // Create new event in MongoDB using Mongoose create method
        const newEvent = await Event.create({
            name: eventData.name,
            date: eventData.date,
            location: eventData.location,
            description: eventData.description,
            status: 'upcoming',
            volunteers: [],
            capacity: eventData.capacity || 50,
            organizer: {
                name: eventData.organizerName || 'Admin',
                email: eventData.organizerEmail
            }
        });
        
        // Log the operation (demonstrates file operations)
        await fileOps.appendLog(`Event created in MongoDB: ${newEvent.name} (ID: ${newEvent._id})`);
        
        return newEvent;
    } catch (error) {
        // Handle MongoDB errors
        if (error.name === 'ValidationError') {
            throw new Error(`Validation error: ${error.message}`);
        }
        throw new Error(`Failed to create event: ${error.message}`);
    }
}

// ========================================
// GET ALL EVENTS (MongoDB)
// ========================================
/**
 * Get all events from MongoDB
 * Demonstrates Mongoose find operation
 * @returns {Promise<Array>} - Array of events
 */
async function getAllEvents() {
    try {
        // Using Mongoose find() method to get all events
        // .populate() is used to get volunteer details instead of just IDs
        const events = await Event.find()
            .populate('volunteers', 'name email')  // Populate volunteer details
            .sort({ date: 1 });  // Sort by date ascending
        
        return events;
    } catch (error) {
        throw new Error(`Failed to get events: ${error.message}`);
    }
}

// ========================================
// GET EVENT BY ID (MongoDB)
// ========================================
/**
 * Get event by ID from MongoDB
 * Demonstrates Mongoose findById operation
 * @param {string} eventId - Event ID (MongoDB ObjectId)
 * @returns {Promise<object|null>} - Event or null
 */
async function getEventById(eventId) {
    try {
        // Using Mongoose findById() method
        const event = await Event.findById(eventId)
            .populate('volunteers', 'name email phone skills');
        
        return event;
    } catch (error) {
        if (error.name === 'CastError') {
            throw new Error('Invalid event ID format');
        }
        throw new Error(`Failed to get event: ${error.message}`);
    }
}

// ========================================
// UPDATE EVENT (MongoDB)
// ========================================
/**
 * Update an existing event in MongoDB
 * Demonstrates Mongoose update operation
 * @param {string} eventId - Event ID
 * @param {object} updateData - Data to update
 * @returns {Promise<object>} - Updated event
 */
async function updateEvent(eventId, updateData) {
    try {
        // Using Mongoose findByIdAndUpdate() method
        // { new: true } returns the updated document
        // { runValidators: true } runs schema validation on update
        const updatedEvent = await Event.findByIdAndUpdate(
            eventId,
            { $set: updateData },
            { 
                new: true,           // Return updated document
                runValidators: true  // Run schema validators
            }
        ).populate('volunteers', 'name email');
        
        if (!updatedEvent) {
            throw new Error('Event not found');
        }
        
        // Log the operation
        await fileOps.appendLog(`Event updated in MongoDB: ${updatedEvent.name} (ID: ${eventId})`);
        
        return updatedEvent;
    } catch (error) {
        if (error.name === 'CastError') {
            throw new Error('Invalid event ID format');
        }
        if (error.name === 'ValidationError') {
            throw new Error(`Validation error: ${error.message}`);
        }
        throw new Error(`Failed to update event: ${error.message}`);
    }
}

// ========================================
// DELETE EVENT (MongoDB)
// ========================================
/**
 * Delete an event from MongoDB
 * Demonstrates Mongoose delete operation
 * @param {string} eventId - Event ID
 * @returns {Promise<object>} - Deletion result
 */
async function deleteEvent(eventId) {
    try {
        // Using Mongoose findByIdAndDelete() method
        const deletedEvent = await Event.findByIdAndDelete(eventId);
        
        if (!deletedEvent) {
            throw new Error('Event not found');
        }
        
        // Log the operation
        await fileOps.appendLog(`Event deleted from MongoDB: ${deletedEvent.name} (ID: ${eventId})`);
        
        return { success: true, deletedEvent };
    } catch (error) {
        if (error.name === 'CastError') {
            throw new Error('Invalid event ID format');
        }
        throw new Error(`Failed to delete event: ${error.message}`);
    }
}

// ========================================
// ASSIGN VOLUNTEER TO EVENT (MongoDB)
// ========================================
/**
 * Assign volunteer to event
 * Demonstrates updating array fields in MongoDB
 * @param {string} eventId - Event ID
 * @param {string} volunteerId - Volunteer ID
 * @returns {Promise<object>} - Updated event
 */
async function assignVolunteerToEvent(eventId, volunteerId) {
    try {
        // Find the event
        const event = await Event.findById(eventId);
        
        if (!event) {
            throw new Error('Event not found');
        }
        
        // Check if event is full
        if (event.isFull()) {
            throw new Error('Event is at full capacity');
        }
        
        // Use instance method to add volunteer
        await event.addVolunteer(volunteerId);
        
        // Log the operation
        await fileOps.appendLog(`Volunteer ${volunteerId} assigned to event ${eventId}`);
        
        return event;
    } catch (error) {
        throw new Error(`Failed to assign volunteer: ${error.message}`);
    }
}

// ========================================
// REMOVE VOLUNTEER FROM EVENT (MongoDB)
// ========================================
/**
 * Remove volunteer from event
 * @param {string} eventId - Event ID
 * @param {string} volunteerId - Volunteer ID
 * @returns {Promise<object>} - Updated event
 */
async function removeVolunteerFromEvent(eventId, volunteerId) {
    try {
        const event = await Event.findById(eventId);
        
        if (!event) {
            throw new Error('Event not found');
        }
        
        // Use instance method to remove volunteer
        await event.removeVolunteer(volunteerId);
        
        await fileOps.appendLog(`Volunteer ${volunteerId} removed from event ${eventId}`);
        
        return event;
    } catch (error) {
        throw new Error(`Failed to remove volunteer: ${error.message}`);
    }
}

// ========================================
// GET UPCOMING EVENTS (MongoDB)
// ========================================
/**
 * Get upcoming events
 * Demonstrates using static methods
 * @returns {Promise<Array>} - Array of upcoming events
 */
async function getUpcomingEvents() {
    try {
        // Using static method defined in Event model
        const upcomingEvents = await Event.findUpcoming();
        return upcomingEvents;
    } catch (error) {
        throw new Error(`Failed to get upcoming events: ${error.message}`);
    }
}

// ========================================
// SEARCH EVENTS BY LOCATION (MongoDB)
// ========================================
/**
 * Search events by location
 * Demonstrates MongoDB text search
 * @param {string} location - Location to search
 * @returns {Promise<Array>} - Matching events
 */
async function searchEventsByLocation(location) {
    try {
        // Using static method from Event model
        const events = await Event.findByLocation(location);
        return events;
    } catch (error) {
        throw new Error(`Failed to search events: ${error.message}`);
    }
}

// ========================================
// GET EVENT STATISTICS (MongoDB)
// ========================================
/**
 * Get event statistics
 * Demonstrates aggregation with static methods
 * @returns {Promise<object>} - Statistics
 */
async function getEventStatistics() {
    try {
        // Using static method from Event model
        const stats = await Event.getStatistics();
        return stats;
    } catch (error) {
        throw new Error(`Failed to get statistics: ${error.message}`);
    }
}

// ========================================
// UPDATE EVENT STATUS (MongoDB)
// ========================================
/**
 * Update event status
 * @param {string} eventId - Event ID
 * @param {string} status - New status
 * @returns {Promise<object>} - Updated event
 */
async function updateEventStatus(eventId, status) {
    try {
        const validStatuses = ['upcoming', 'ongoing', 'completed', 'cancelled'];
        
        if (!validStatuses.includes(status)) {
            throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
        }
        
        const event = await Event.findByIdAndUpdate(
            eventId,
            { status },
            { new: true, runValidators: true }
        );
        
        if (!event) {
            throw new Error('Event not found');
        }
        
        await fileOps.appendLog(`Event status updated: ${eventId} -> ${status}`);
        
        return event;
    } catch (error) {
        throw new Error(`Failed to update event status: ${error.message}`);
    }
}

// ========================================
// BULK CREATE EVENTS (MongoDB)
// ========================================
/**
 * Create multiple events at once
 * Demonstrates bulk operations
 * @param {Array} eventsData - Array of event data
 * @returns {Promise<Array>} - Created events
 */
async function bulkCreateEvents(eventsData) {
    try {
        // Using Mongoose insertMany for bulk insert
        const events = await Event.insertMany(eventsData, { 
            ordered: false  // Continue even if some fail
        });
        
        await fileOps.appendLog(`Bulk created ${events.length} events`);
        
        return events;
    } catch (error) {
        throw new Error(`Failed to bulk create events: ${error.message}`);
    }
}

// ========================================
// MODULE EXPORTS
// ========================================
module.exports = {
    createEvent,
    getAllEvents,
    getEventById,
    updateEvent,
    deleteEvent,
    assignVolunteerToEvent,
    removeVolunteerFromEvent,
    getUpcomingEvents,
    searchEventsByLocation,
    getEventStatistics,
    updateEventStatus,
    bulkCreateEvents
};
