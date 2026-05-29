// ========================================
// MONGOOSE MODEL - models/Assignment.js
// ========================================
// Demonstrates Mongoose schema with references
// ========================================

const mongoose = require('mongoose');

// ========================================
// ASSIGNMENT SCHEMA DEFINITION
// ========================================

const assignmentSchema = new mongoose.Schema(
    {
        // Reference to Event model
        event: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Event',
            required: [true, 'Event is required']
        },
        
        // Reference to Volunteer model
        volunteer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Volunteer',
            required: [true, 'Volunteer is required']
        },
        
        // Duty/Role assigned to volunteer
        duty: {
            type: String,
            required: [true, 'Duty is required'],
            trim: true,
            minlength: [3, 'Duty must be at least 3 characters'],
            maxlength: [200, 'Duty cannot exceed 200 characters']
        },
        
        // Schedule/Time slot
        schedule: {
            type: String,
            required: [true, 'Schedule is required'],
            trim: true
        },
        
        // Assignment status
        status: {
            type: String,
            enum: ['pending', 'in-progress', 'completed', 'cancelled'],
            default: 'pending'
        },
        
        // Priority level
        priority: {
            type: String,
            enum: ['low', 'medium', 'high', 'urgent'],
            default: 'medium'
        },
        
        // Notes for this assignment
        notes: {
            type: String,
            maxlength: 500
        },
        
        // Start time (when volunteer started the task)
        startedAt: {
            type: Date
        },
        
        // Completion time
        completedAt: {
            type: Date
        },
        
        // Hours worked
        hoursWorked: {
            type: Number,
            min: 0,
            default: 0
        },
        
        // Feedback from volunteer
        feedback: {
            rating: {
                type: Number,
                min: 1,
                max: 5
            },
            comment: String,
            submittedAt: Date
        },
        
        // Check-in status
        checkedIn: {
            type: Boolean,
            default: false
        },
        
        checkInTime: {
            type: Date
        },
        
        checkOutTime: {
            type: Date
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

// Check if assignment is active
assignmentSchema.virtual('isActive').get(function() {
    return this.status === 'in-progress';
});

// Check if assignment is overdue
assignmentSchema.virtual('isOverdue').get(function() {
    if (this.status === 'completed' || this.status === 'cancelled') {
        return false;
    }
    // This would need the event date to properly determine
    return false;
});

// Duration of work (if completed)
assignmentSchema.virtual('duration').get(function() {
    if (this.startedAt && this.completedAt) {
        const diff = this.completedAt - this.startedAt;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    }
    return null;
});

// ========================================
// INSTANCE METHODS
// ========================================

/**
 * Start the assignment
 */
assignmentSchema.methods.start = function() {
    this.status = 'in-progress';
    this.startedAt = new Date();
    return this.save();
};

/**
 * Complete the assignment
 */
assignmentSchema.methods.complete = function() {
    this.status = 'completed';
    this.completedAt = new Date();
    
    // Calculate hours worked
    if (this.startedAt) {
        const diff = this.completedAt - this.startedAt;
        this.hoursWorked = diff / (1000 * 60 * 60); // Convert to hours
    }
    
    return this.save();
};

/**
 * Cancel the assignment
 */
assignmentSchema.methods.cancel = function(reason) {
    this.status = 'cancelled';
    if (reason) {
        this.notes = (this.notes ? this.notes + '\n' : '') + `Cancelled: ${reason}`;
    }
    return this.save();
};

/**
 * Check in volunteer
 */
assignmentSchema.methods.checkIn = function() {
    this.checkedIn = true;
    this.checkInTime = new Date();
    return this.save();
};

/**
 * Check out volunteer
 */
assignmentSchema.methods.checkOut = function() {
    this.checkOutTime = new Date();
    
    // Calculate hours if both check-in and check-out exist
    if (this.checkInTime && this.checkOutTime) {
        const diff = this.checkOutTime - this.checkInTime;
        this.hoursWorked = diff / (1000 * 60 * 60);
    }
    
    return this.save();
};

/**
 * Submit feedback
 */
assignmentSchema.methods.submitFeedback = function(rating, comment) {
    this.feedback = {
        rating,
        comment,
        submittedAt: new Date()
    };
    return this.save();
};

// ========================================
// STATIC METHODS
// ========================================

/**
 * Find assignments by event
 */
assignmentSchema.statics.findByEvent = function(eventId) {
    return this.find({ event: eventId })
        .populate('volunteer', 'name email phone')
        .populate('event', 'name date location');
};

/**
 * Find assignments by volunteer
 */
assignmentSchema.statics.findByVolunteer = function(volunteerId) {
    return this.find({ volunteer: volunteerId })
        .populate('event', 'name date location status')
        .sort({ createdAt: -1 });
};

/**
 * Find assignments by status
 */
assignmentSchema.statics.findByStatus = function(status) {
    return this.find({ status })
        .populate('event', 'name date')
        .populate('volunteer', 'name email');
};

/**
 * Get assignment statistics
 */
assignmentSchema.statics.getStatistics = async function() {
    const total = await this.countDocuments();
    const pending = await this.countDocuments({ status: 'pending' });
    const inProgress = await this.countDocuments({ status: 'in-progress' });
    const completed = await this.countDocuments({ status: 'completed' });
    const cancelled = await this.countDocuments({ status: 'cancelled' });
    
    // Calculate total hours worked
    const assignments = await this.find({ status: 'completed' });
    const totalHours = assignments.reduce((sum, a) => sum + (a.hoursWorked || 0), 0);
    
    return { 
        total, 
        pending, 
        inProgress, 
        completed, 
        cancelled,
        totalHoursWorked: totalHours.toFixed(2)
    };
};

/**
 * Find upcoming assignments (for reminders)
 */
assignmentSchema.statics.findUpcoming = function() {
    return this.find({ 
        status: { $in: ['pending', 'in-progress'] }
    })
    .populate('event', 'name date location')
    .populate('volunteer', 'name email phone')
    .sort({ 'event.date': 1 });
};

/**
 * Check for assignment conflicts
 */
assignmentSchema.statics.checkConflicts = async function(volunteerId, eventId) {
    const count = await this.countDocuments({
        volunteer: volunteerId,
        event: eventId,
        status: { $ne: 'cancelled' }
    });
    
    return count > 0;
};

// ========================================
// MIDDLEWARE
// ========================================

// Pre-save middleware - validate no duplicate assignments
assignmentSchema.pre('save', async function() {
    if (this.isNew) {
        const existing = await this.constructor.findOne({
            event: this.event,
            volunteer: this.volunteer,
            duty: this.duty,
            status: { $ne: 'cancelled' }
        });
        
        if (existing) {
            throw new Error('This assignment already exists');
        }
    }
});

// Post-save middleware
assignmentSchema.post('save', function(doc) {
    console.log(`Assignment saved: ${doc._id} (Status: ${doc.status})`);
});

// Post-save middleware to update volunteer's total hours
assignmentSchema.post('save', async function(doc) {
    if (doc.status === 'completed' && doc.hoursWorked > 0) {
        const Volunteer = mongoose.model('Volunteer');
        const volunteer = await Volunteer.findById(doc.volunteer);
        if (volunteer) {
            await volunteer.addHours(doc.hoursWorked);
        }
    }
});

// ========================================
// INDEXES
// ========================================

assignmentSchema.index({ event: 1, volunteer: 1 });
assignmentSchema.index({ status: 1 });
assignmentSchema.index({ volunteer: 1 });
assignmentSchema.index({ event: 1 });

// Compound index for finding unique assignments
assignmentSchema.index({ event: 1, volunteer: 1, duty: 1 }, { unique: true });

// ========================================
// MODEL EXPORT
// ========================================

const Assignment = mongoose.model('Assignment', assignmentSchema);

module.exports = Assignment;
