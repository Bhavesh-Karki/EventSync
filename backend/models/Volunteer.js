// ========================================
// MONGOOSE MODEL - models/Volunteer.js
// ========================================
// Demonstrates Mongoose schema for Volunteer data
// ========================================

const mongoose = require('mongoose');

// ========================================
// VOLUNTEER SCHEMA DEFINITION
// ========================================

const volunteerSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Volunteer name is required'],
            trim: true,
            minlength: [2, 'Name must be at least 2 characters'],
            maxlength: [100, 'Name cannot exceed 100 characters']
        },
        
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,  // Ensure unique emails
            lowercase: true,  // Convert to lowercase
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
        },
        
        phone: {
            type: String,
            required: [true, 'Phone number is required'],
            trim: true,
            match: [/^[\d\s\-\+\(\)]{10,}$/, 'Please enter a valid phone number']
        },
        
        skills: [{
            type: String,
            trim: true
        }],
        
        availability: {
            type: String,
            enum: ['weekdays', 'weekends', 'flexible', 'custom'],
            default: 'flexible'
        },
        
        status: {
            type: String,
            enum: ['active', 'inactive', 'pending'],
            default: 'active'
        },
        
        // Array of event IDs this volunteer is assigned to
        eventsAssigned: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Event'
        }],
        
        // Address (subdocument)
        address: {
            street: String,
            city: String,
            state: String,
            zipCode: String,
            country: {
                type: String,
                default: 'USA'
            }
        },
        
        // Emergency contact
        emergencyContact: {
            name: String,
            phone: String,
            relationship: String
        },
        
        // Date joined
        dateJoined: {
            type: Date,
            default: Date.now
        },
        
        // Hours volunteered
        totalHours: {
            type: Number,
            default: 0,
            min: 0
        },
        
        // Rating (1-5 stars)
        rating: {
            type: Number,
            min: 1,
            max: 5,
            default: 5
        },
        
        // Notes about the volunteer
        notes: {
            type: String,
            maxlength: 500
        }
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// ========================================
// VIRTUALS
// ========================================

// Number of events assigned
volunteerSchema.virtual('eventsCount').get(function() {
    return this.eventsAssigned.length;
});

// Full name with email
volunteerSchema.virtual('displayName').get(function() {
    return `${this.name} (${this.email})`;
});

// Check if volunteer is experienced (more than 50 hours)
volunteerSchema.virtual('isExperienced').get(function() {
    return this.totalHours >= 50;
});

// ========================================
// INSTANCE METHODS
// ========================================

/**
 * Add event to volunteer's assignments
 */
volunteerSchema.methods.assignEvent = function(eventId) {
    if (!this.eventsAssigned.includes(eventId)) {
        this.eventsAssigned.push(eventId);
        return this.save();
    }
    return Promise.resolve(this);
};

/**
 * Remove event from volunteer's assignments
 */
volunteerSchema.methods.unassignEvent = function(eventId) {
    this.eventsAssigned = this.eventsAssigned.filter(
        id => id.toString() !== eventId.toString()
    );
    return this.save();
};

/**
 * Add volunteered hours
 */
volunteerSchema.methods.addHours = function(hours) {
    this.totalHours += hours;
    return this.save();
};

/**
 * Update rating
 */
volunteerSchema.methods.updateRating = function(newRating) {
    if (newRating >= 1 && newRating <= 5) {
        this.rating = newRating;
        return this.save();
    }
    return Promise.reject(new Error('Rating must be between 1 and 5'));
};

// ========================================
// STATIC METHODS
// ========================================

/**
 * Find volunteers by skill
 */
volunteerSchema.statics.findBySkill = function(skill) {
    return this.find({
        skills: new RegExp(skill, 'i'),
        status: 'active'
    });
};

/**
 * Find active volunteers
 */
volunteerSchema.statics.findActive = function() {
    return this.find({ status: 'active' });
};

/**
 * Find available volunteers (not fully booked)
 */
volunteerSchema.statics.findAvailable = function() {
    return this.find({
        status: 'active',
        $expr: { $lt: [{ $size: '$eventsAssigned' }, 5] }  // Less than 5 events
    });
};

/**
 * Get volunteer statistics
 */
volunteerSchema.statics.getStatistics = async function() {
    const total = await this.countDocuments();
    const active = await this.countDocuments({ status: 'active' });
    const inactive = await this.countDocuments({ status: 'inactive' });
    const pending = await this.countDocuments({ status: 'pending' });
    
    // Calculate average hours
    const volunteers = await this.find();
    const totalHours = volunteers.reduce((sum, v) => sum + v.totalHours, 0);
    const averageHours = volunteers.length > 0 ? totalHours / volunteers.length : 0;
    
    return { total, active, inactive, pending, averageHours: averageHours.toFixed(2) };
};

/**
 * Find top volunteers by hours
 */
volunteerSchema.statics.findTopVolunteers = function(limit = 10) {
    return this.find({ status: 'active' })
        .sort({ totalHours: -1 })
        .limit(limit);
};

// ========================================
// MIDDLEWARE
// ========================================

// Pre-save middleware
volunteerSchema.pre('save', function(next) {
    console.log(`Saving volunteer: ${this.name}`);
    next();
});

// Post-save middleware
volunteerSchema.post('save', function(doc) {
    console.log(`Volunteer saved: ${doc.name} (ID: ${doc._id})`);
});

// ========================================
// INDEXES
// ========================================

volunteerSchema.index({ email: 1 }, { unique: true });
volunteerSchema.index({ status: 1 });
volunteerSchema.index({ skills: 1 });
volunteerSchema.index({ name: 'text' });

// ========================================
// MODEL EXPORT
// ========================================

const Volunteer = mongoose.model('Volunteer', volunteerSchema);

module.exports = Volunteer;
