// ========================================
// STORAGE CONFIGURATION - config/storage.js
// ========================================
// This file allows easy switching between
// file-based storage and MongoDB storage
// ========================================

// Set storage type here:
// 'file' = JSON file storage (original)
// 'mongodb' = MongoDB database storage
const STORAGE_TYPE = process.env.STORAGE_TYPE || 'mongodb';

// ========================================
// IMPORT APPROPRIATE SERVICES
// ========================================

let eventService;
let volunteerService;
let assignmentService;

if (STORAGE_TYPE === 'mongodb') {
    console.log('📊 Using MongoDB storage');
    eventService = require('../services/eventServiceMongo');
    volunteerService = require('../services/volunteerServiceMongo');
    assignmentService = require('../services/assignmentServiceMongo');
} else {
    console.log('📁 Using file-based storage');
    eventService = require('../services/eventService');
    volunteerService = require('../services/volunteerService');
    assignmentService = require('../services/assignmentService');
}

// ========================================
// EXPORT CONFIGURED SERVICES
// ========================================

module.exports = {
    STORAGE_TYPE,
    eventService,
    volunteerService,
    assignmentService
};
