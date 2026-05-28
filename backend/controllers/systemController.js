// ========================================
// CONTROLLER - controllers/systemController.js
// ========================================
// This demonstrates:
// 1. Using OS module through custom utility
// 2. File system operations for reports
// 3. Async operations for system info
// ========================================

// Importing custom modules
const systemInfo = require('../utils/systemInfo');
const fileOps = require('../utils/fileOperations');

// Importing services using storage configuration
const { eventService, volunteerService, assignmentService } = require('../config/storage');

// Using Path module
const path = require('path');

// ========================================
// GET SYSTEM INFORMATION
// ========================================
/**
 * Get basic system information
 * Demonstrates OS module usage through utility
 */
async function getSystemInfo(req, res) {
    try {
        // Using custom systemInfo module (demonstrates OS module usage)
        const sysInfo = systemInfo.getSystemInfo();
        
        res.status(200).json({
            success: true,
            message: 'System information retrieved successfully',
            data: sysInfo
        });
    } catch (error) {
        console.error('Error in getSystemInfo controller:', error.message);
        
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve system information',
            data: null
        });
    }
}

// ========================================
// GET DETAILED SYSTEM REPORT
// ========================================
/**
 * Get comprehensive system report
 * Demonstrates multiple OS module methods
 */
async function getSystemReport(req, res) {
    try {
        // Get complete system report
        const report = systemInfo.getSystemReport();
        
        res.status(200).json({
            success: true,
            message: 'System report generated successfully',
            data: report
        });
    } catch (error) {
        console.error('Error in getSystemReport controller:', error.message);
        
        res.status(500).json({
            success: false,
            message: 'Failed to generate system report',
            data: null
        });
    }
}

// ========================================
// GET MEMORY STATISTICS
// ========================================
/**
 * Get memory statistics
 * Demonstrates os.totalmem() and os.freemem()
 */
async function getMemoryStats(req, res) {
    try {
        const memStats = systemInfo.getMemoryStats();
        
        res.status(200).json({
            success: true,
            message: 'Memory statistics retrieved successfully',
            data: memStats
        });
    } catch (error) {
        console.error('Error in getMemoryStats controller:', error.message);
        
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve memory statistics',
            data: null
        });
    }
}

// ========================================
// GET CPU INFORMATION
// ========================================
/**
 * Get CPU information
 * Demonstrates os.cpus() usage
 */
async function getCPUInfo(req, res) {
    try {
        const cpuInfo = systemInfo.getCPUInfo();
        
        res.status(200).json({
            success: true,
            message: 'CPU information retrieved successfully',
            data: cpuInfo
        });
    } catch (error) {
        console.error('Error in getCPUInfo controller:', error.message);
        
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve CPU information',
            data: null
        });
    }
}

// ========================================
// GET APPLICATION LOGS
// ========================================
/**
 * Get application logs
 * Demonstrates fs.readFile for logs
 */
async function getLogs(req, res) {
    try {
        // Using file operations to read logs (demonstrates fs module)
        const result = await fileOps.readLogs();
        
        res.status(200).json({
            success: true,
            message: 'Logs retrieved successfully',
            data: {
                logs: result.logs
            }
        });
    } catch (error) {
        console.error('Error in getLogs controller:', error.message);
        
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve logs',
            data: null
        });
    }
}

// ========================================
// GENERATE VOLUNTEER REPORT
// ========================================
/**
 * Generate comprehensive volunteer report and save to file
 * Demonstrates fs.writeFile with complex data
 */
async function generateVolunteerReport(req, res) {
    try {
        // Gather data from all services
        const events = await eventService.getAllEvents();
        const volunteers = await volunteerService.getAllVolunteers();
        const assignments = await assignmentService.getAllAssignments();
        const stats = await assignmentService.getAssignmentStats();
        
        // Create comprehensive report
        const report = {
            reportType: 'Volunteer Coordination Report',
            generatedAt: new Date().toISOString(),
            generatedBy: 'System',
            summary: {
                totalEvents: events.length,
                totalVolunteers: volunteers.length,
                totalAssignments: assignments.length,
                completedAssignments: stats.completed,
                pendingAssignments: stats.pending,
                activeVolunteers: volunteers.filter(v => v.status === 'active').length
            },
            events: events.map(e => ({
                id: e.id,
                name: e.name,
                date: e.date,
                location: e.location,
                status: e.status,
                volunteersAssigned: e.volunteers.length
            })),
            volunteers: volunteers.map(v => ({
                id: v.id,
                name: v.name,
                email: v.email,
                skills: v.skills,
                eventsCount: v.eventsAssigned.length,
                status: v.status
            })),
            assignments: assignments.map(a => ({
                id: a.id,
                eventName: a.eventName,
                volunteerName: a.volunteerName,
                duty: a.duty,
                status: a.status,
                schedule: a.schedule
            })),
            systemInfo: systemInfo.getSystemInfo()
        };
        
        // Generate filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `volunteer-report-${timestamp}.json`;
        
        // Using file operations to write report (demonstrates fs.writeFile)
        await fileOps.writeFileAsync(filename, report);
        
        // Log the report generation
        await fileOps.appendLog(`Volunteer report generated: ${filename}`);
        
        res.status(200).json({
            success: true,
            message: 'Volunteer report generated and saved successfully',
            data: {
                filename,
                filePath: path.join(fileOps.DATA_DIR, filename),
                reportSummary: report.summary
            }
        });
    } catch (error) {
        console.error('Error in generateVolunteerReport controller:', error.message);
        
        res.status(500).json({
            success: false,
            message: 'Failed to generate volunteer report',
            data: null
        });
    }
}

// ========================================
// LIST DATA FILES
// ========================================
/**
 * List all data files
 * Demonstrates fs.readdir usage
 */
async function listDataFiles(req, res) {
    try {
        // Using file operations to list files (demonstrates fs.readdir)
        const result = await fileOps.listFiles(fileOps.DATA_DIR);
        
        res.status(200).json({
            success: true,
            message: 'Data files listed successfully',
            data: result.files
        });
    } catch (error) {
        console.error('Error in listDataFiles controller:', error.message);
        
        res.status(500).json({
            success: false,
            message: 'Failed to list data files',
            data: null
        });
    }
}

// ========================================
// GET DATABASE HEALTH STATUS
// ========================================
/**
 * Get MongoDB connection health status
 * Demonstrates database connection verification
 */
async function getDatabaseHealth(req, res) {
    try {
        const { getDatabaseStatus, getDatabaseStats, mongoose } = require('../config/database');
        
        const status = getDatabaseStatus();
        let stats = null;
        
        if (status.isConnected) {
            try {
                stats = await getDatabaseStats();
            } catch (statsError) {
                console.warn('Could not retrieve database stats:', statsError.message);
            }
        }
        
        const health = {
            databaseType: 'MongoDB',
            status: status.isConnected ? 'Connected ✅' : 'Disconnected ⚠️',
            isConnected: status.isConnected,
            readyState: status.readyState,
            readyStateDescription: {
                0: 'Disconnected',
                1: 'Connected',
                2: 'Connecting',
                3: 'Disconnecting'
            }[status.readyState],
            host: status.host || 'N/A',
            port: status.port || 'N/A',
            database: status.name || 'N/A',
            models: status.models,
            mongooseVersion: mongoose.version,
            stats: stats
        };
        
        res.status(status.isConnected ? 200 : 503).json({
            success: status.isConnected,
            message: status.isConnected ? 'Database is healthy' : 'Database connection issue',
            data: health
        });
    } catch (error) {
        console.error('Error in getDatabaseHealth controller:', error.message);
        
        res.status(500).json({
            success: false,
            message: 'Failed to check database health',
            error: error.message
        });
    }
}

// Module exports
module.exports = {
    getSystemInfo,
    getSystemReport,
    getMemoryStats,
    getCPUInfo,
    getLogs,
    generateVolunteerReport,
    listDataFiles,
    getDatabaseHealth
};
