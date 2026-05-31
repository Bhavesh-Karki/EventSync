
const express = require('express');
const router = express.Router();

const systemController = require('../controllers/systemController');

// GET basic system information
// Demonstrates OS module usage
router.get('/info', systemController.getSystemInfo);

// GET comprehensive system report
router.get('/report', systemController.getSystemReport);

// GET memory statistics
router.get('/memory', systemController.getMemoryStats);

// GET CPU information
router.get('/cpu', systemController.getCPUInfo);

// GET application logs
// Demonstrates fs.readFile for logs
router.get('/logs', systemController.getLogs);

// GET list of data files
// Demonstrates fs.readdir usage
router.get('/files', systemController.listDataFiles);

// GET database health status
// Check Supabase configuration and table health
router.get('/health/database', systemController.getDatabaseHealth);

module.exports = router;
