// ========================================
// ROUTES - routes/reportRoutes.js
// ========================================
// Demonstrates file generation routes
// ========================================

const express = require('express');
const router = express.Router();

const systemController = require('../controllers/systemController');

// POST generate volunteer report
// Demonstrates fs.writeFile for report generation
router.post('/volunteer-report', systemController.generateVolunteerReport);
router.get('/volunteer-report', systemController.generateVolunteerReport);

module.exports = router;
