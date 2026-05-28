// ========================================
// MONGOOSE MODEL - models/Event.js
// ========================================
// This demonstrates:
// 1. Mongoose Schema definition
// 2. Schema data types and validation
// 3. Schema methods and virtuals
// 4. Mongoose model creation
// 5. Timestamps and default values
// ========================================

const mongoose = require('mongoose');

// ========================================
// EVENT SCHEMA DEFINITION
// ========================================

/**
 * Event Schema
 * Defines the structure of Event documents in MongoDB
 */
const eventSchema = new mongoose.Schema(
    {
        // Event name field with validation
        name: {
            type: String,           // Data type
            required: [true, 'Event name is required'],  // Validation
            trim: true,             // Remove whitespace
            minlength: [3, 'Event name must be at least 3 characters'],
            maxlength: [100, 'Event name cannot exceed 100 characters']
        },
        
        // Event date field
        date: {
            type: Date,
            required: [true, 'Event date is required'],
            validate: {
                // Custom validator - date must be in future
                validator: function(value) {
                    return value > new Date();
                },
                message: 'Event date must be in the future'
            }
        },
        
        // Event location
        location: {
            type: String,
            required: [true, 'Event location is required'],
            trim: true,
            minlength: [3, 'Location must be at least 3 characters']
        },
        
        // Event description
        description: {
            type: String,
            required: [true, 'Event description is required'],
            trim: true,
            minlength: [10, 'Description must be at least 10 characters'],
            maxlength: [1000, 'Description cannot exceed 1000 characters']
        },
        
        // Event status with enum validation
        status: {
            type: String,
            enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
            default: 'upcoming'
        },
        
        // Array of volunteer IDs (references to Volunteer model)
        volunteers: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Volunteer'  // Reference to Volunteer model
        }],
        
        // Event capacity (optional)
        capacity: {
            type: Number,
            min: [1, 'Capacity must be at least 1'],
            default: 50
        },
        
        // Event organizer info
        organizer: {
            name: {
                type: String,
                default: 'Admin'
            },
            email: {
                type: String,
                match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
            }
        }
    },
    {
        // Schema options
        timestamps: true,  // Automatically adds createdAt and updatedAt fields
        toJSON: { virtuals: true },   // Include virtuals when converting to JSON
        toObject: { virtuals: true }  // Include virtuals when converting to Object
    }
);

// ========================================
// VIRTUALS (Computed Properties)
// ========================================

/**
 * Virtual property: volunteersCount
 * Returns the number of volunteers assigned to this event
 */
eventSchema.virtual('volunteersCount').get(function() {
    return this.volunteers.length;
});

/**
 * Virtual property: isUpcoming
 * Returns true if event is in the future
 */
eventSchema.virtual('isUpcoming').get(function() {
    return this.date > new Date() && this.status === 'upcoming';
});

/**
 * Virtual property: daysUntilEvent
 * Returns number of days until the event
 */
eventSchema.virtual('daysUntilEvent').get(function() {
    const today = new Date();
    const eventDate = new Date(this.date);
    const diffTime = eventDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
});

// ========================================
// INSTANCE METHODS
// ========================================

/**
 * Add volunteer to event
 * @param {string} volunteerId - Volunteer ObjectId
 */
eventSchema.methods.addVolunteer = function(volunteerId) {
    if (!this.volunteers.includes(volunteerId)) {
        this.volunteers.push(volunteerId);
        return this.save();
    }
    return Promise.resolve(this);
};

/**
 * Remove volunteer from event
 * @param {string} volunteerId - Volunteer ObjectId
 */
eventSchema.methods.removeVolunteer = function(volunteerId) {
    this.volunteers = this.volunteers.filter(
        id => id.toString() !== volunteerId.toString()
    );
    return this.save();
};

/**
 * Check if event is full
 * @returns {boolean}
 */
eventSchema.methods.isFull = function() {
    return this.volunteers.length >= this.capacity;
};

// ========================================
// STATIC METHODS
// ========================================

/**
 * Find upcoming events
 * @returns {Promise<Array>} Array of upcoming events
 */
eventSchema.statics.findUpcoming = function() {
    return this.find({
        date: { $gte: new Date() },
        status: 'upcoming'
    }).sort({ date: 1 });
};

/**
 * Find events by location
 * @param {string} location - Location to search
 * @returns {Promise<Array>}
 */
eventSchema.statics.findByLocation = function(location) {
    return this.find({
        location: new RegExp(location, 'i')  // Case-insensitive search
    });
};

/**
 * Get events statistics
 * @returns {Promise<object>}
 */
eventSchema.statics.getStatistics = async function() {
    const total = await this.countDocuments();
    const upcoming = await this.countDocuments({ status: 'upcoming' });
    const ongoing = await this.countDocuments({ status: 'ongoing' });
    const completed = await this.countDocuments({ status: 'completed' });
    const cancelled = await this.countDocuments({ status: 'cancelled' });
    
    return { total, upcoming, ongoing, completed, cancelled };
};

// ========================================
// MIDDLEWARE (HOOKS)
// ========================================

// Pre-save middleware - runs before saving
eventSchema.pre('save', function(next) {
    console.log(`Saving event: ${this.name}`);
    next();
});

// Post-save middleware - runs after saving
eventSchema.post('save', function(doc) {
    console.log(`Event saved: ${doc.name} (ID: ${doc._id})`);
});

// Pre-remove middleware
eventSchema.pre('remove', function(next) {
    console.log(`Removing event: ${this.name}`);
    next();
});

// ========================================
// INDEXES
// ========================================

// Create indexes for better query performance
eventSchema.index({ date: 1 });           // Ascending index on date
eventSchema.index({ status: 1 });         // Index on status
eventSchema.index({ location: 1 });       // Index on location
eventSchema.index({ name: 'text' });      // Text index for searching

// ========================================
// MODEL CREATION AND EXPORT
// ========================================

// Create and export the Event model
const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
