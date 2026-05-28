// ========================================
// CUSTOM MODULE - utils/validators.js
// ========================================
// This demonstrates:
// 1. Custom module creation
// 2. Input validation functions
// 3. Error handling patterns
// ========================================

/**
 * Validate event data
 * @param {object} eventData - Event data to validate
 * @returns {object} - Validation result { valid: boolean, errors: Array }
 */
function validateEvent(eventData) {
    const errors = [];
    
    // Validate event name
    if (!eventData.name || typeof eventData.name !== 'string') {
        errors.push('Event name is required and must be a string');
    } else if (eventData.name.trim().length < 3) {
        errors.push('Event name must be at least 3 characters long');
    }
    
    // Validate event date
    if (!eventData.date) {
        errors.push('Event date is required');
    } else {
        const eventDate = new Date(eventData.date);
        if (isNaN(eventDate.getTime())) {
            errors.push('Event date must be a valid date');
        } else if (eventDate < new Date()) {
            errors.push('Event date must be in the future');
        }
    }
    
    // Validate location
    if (!eventData.location || typeof eventData.location !== 'string') {
        errors.push('Event location is required and must be a string');
    }
    
    // Validate description
    if (!eventData.description || typeof eventData.description !== 'string') {
        errors.push('Event description is required and must be a string');
    }
    
    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Validate volunteer data
 * @param {object} volunteerData - Volunteer data to validate
 * @returns {object} - Validation result
 */
function validateVolunteer(volunteerData) {
    const errors = [];
    
    // Validate name
    if (!volunteerData.name || typeof volunteerData.name !== 'string') {
        errors.push('Volunteer name is required and must be a string');
    } else if (volunteerData.name.trim().length < 2) {
        errors.push('Volunteer name must be at least 2 characters long');
    }
    
    // Validate email
    if (!volunteerData.email || typeof volunteerData.email !== 'string') {
        errors.push('Email is required and must be a string');
    } else if (!isValidEmail(volunteerData.email)) {
        errors.push('Email must be a valid email address');
    }
    
    // Validate phone
    if (!volunteerData.phone || typeof volunteerData.phone !== 'string') {
        errors.push('Phone is required and must be a string');
    } else if (!isValidPhone(volunteerData.phone)) {
        errors.push('Phone must be a valid phone number');
    }
    
    // Validate skills (optional but must be array if provided)
    if (volunteerData.skills && !Array.isArray(volunteerData.skills)) {
        errors.push('Skills must be an array');
    }
    
    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Validate assignment data
 * @param {object} assignmentData - Assignment data to validate
 * @returns {object} - Validation result
 */
function validateAssignment(assignmentData) {
    const errors = [];
    
    // Validate eventId
    if (!assignmentData.eventId || typeof assignmentData.eventId !== 'string') {
        errors.push('Event ID is required and must be a string');
    }
    
    // Validate volunteerId
    if (!assignmentData.volunteerId || typeof assignmentData.volunteerId !== 'string') {
        errors.push('Volunteer ID is required and must be a string');
    }
    
    // Validate duty
    if (!assignmentData.duty || typeof assignmentData.duty !== 'string') {
        errors.push('Duty is required and must be a string');
    }
    
    // Validate schedule
    if (!assignmentData.schedule || typeof assignmentData.schedule !== 'string') {
        errors.push('Schedule is required and must be a string');
    }
    
    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Check if email is valid
 * @param {string} email - Email to validate
 * @returns {boolean}
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Check if phone is valid (simple validation)
 * @param {string} phone - Phone to validate
 * @returns {boolean}
 */
function isValidPhone(phone) {
    const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
    return phoneRegex.test(phone);
}

/**
 * Sanitize string input
 * @param {string} input - Input to sanitize
 * @returns {string} - Sanitized string
 */
function sanitizeString(input) {
    if (typeof input !== 'string') {
        return '';
    }
    return input.trim().replace(/[<>]/g, '');
}

// Using module.exports to export validation functions
module.exports = {
    validateEvent,
    validateVolunteer,
    validateAssignment,
    isValidEmail,
    isValidPhone,
    sanitizeString
};
