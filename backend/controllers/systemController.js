const fs = require('fs');
const path = require('path');

const { getSupabase, getDatabaseStatus, getDatabaseStats } = require('../config/database');
const fileOps = require('../utils/fileOperations');
const { createPdfBuffer } = require('../utils/pdfReport');
const { mapAssignment, mapEvent, mapVolunteer } = require('../utils/supabaseRecords');
const systemInfo = require('../utils/systemInfo');

async function getSystemInfo(req, res) {
    try {
        res.status(200).json({
            success: true,
            message: 'System information retrieved successfully',
            data: systemInfo.getSystemInfo()
        });
    } catch (error) {
        console.error('Error in getSystemInfo controller:', error.message);
        res.status(500).json({ success: false, message: 'Failed to retrieve system information', data: null });
    }
}

async function getSystemReport(req, res) {
    try {
        res.status(200).json({
            success: true,
            message: 'System report generated successfully',
            data: systemInfo.getSystemReport()
        });
    } catch (error) {
        console.error('Error in getSystemReport controller:', error.message);
        res.status(500).json({ success: false, message: 'Failed to generate system report', data: null });
    }
}

async function getMemoryStats(req, res) {
    try {
        res.status(200).json({
            success: true,
            message: 'Memory statistics retrieved successfully',
            data: systemInfo.getMemoryStats()
        });
    } catch (error) {
        console.error('Error in getMemoryStats controller:', error.message);
        res.status(500).json({ success: false, message: 'Failed to retrieve memory statistics', data: null });
    }
}

async function getCPUInfo(req, res) {
    try {
        res.status(200).json({
            success: true,
            message: 'CPU information retrieved successfully',
            data: systemInfo.getCPUInfo()
        });
    } catch (error) {
        console.error('Error in getCPUInfo controller:', error.message);
        res.status(500).json({ success: false, message: 'Failed to retrieve CPU information', data: null });
    }
}

async function getLogs(req, res) {
    try {
        const result = await fileOps.readLogs();
        res.status(200).json({
            success: true,
            message: 'Logs retrieved successfully',
            data: { logs: result.logs }
        });
    } catch (error) {
        console.error('Error in getLogs controller:', error.message);
        res.status(500).json({ success: false, message: 'Failed to retrieve logs', data: null });
    }
}

async function getReportData() {
    const supabase = getSupabase();
    const [eventsRes, volunteersRes, assignmentsRes] = await Promise.all([
        supabase.from('events').select('*').order('date', { ascending: true }),
        supabase.from('volunteers').select('*').order('name', { ascending: true }),
        supabase.from('assignments').select('*').order('created_at', { ascending: false })
    ]);

    if (eventsRes.error) throw eventsRes.error;
    if (volunteersRes.error) throw volunteersRes.error;
    if (assignmentsRes.error) throw assignmentsRes.error;

    const eventsById = (eventsRes.data || []).reduce((acc, event) => {
        acc[event.id] = event;
        return acc;
    }, {});
    const volunteersById = (volunteersRes.data || []).reduce((acc, volunteer) => {
        acc[volunteer.id] = volunteer;
        return acc;
    }, {});

    const assignments = (assignmentsRes.data || []).map((assignment) =>
        mapAssignment(assignment, eventsById[assignment.event_id], volunteersById[assignment.volunteer_id])
    );
    const events = (eventsRes.data || []).map(mapEvent);
    const volunteers = (volunteersRes.data || []).map((volunteer) => {
        const assignedEventIds = assignments
            .filter(a => a.volunteer?.id === volunteer.id && a.status !== 'cancelled')
            .map(a => a.event?.id)
            .filter(Boolean);
        return mapVolunteer(volunteer, assignedEventIds);
    });

    return { assignments, events, volunteers };
}

async function generateVolunteerReport(req, res) {
    try {
        const { assignments, events, volunteers } = await getReportData();
        const stats = {
            total: assignments.length,
            pending: assignments.filter(a => a.status === 'pending').length,
            completed: assignments.filter(a => a.status === 'completed').length
        };

        const report = {
            reportType: 'Volunteer Coordination Report',
            generatedAt: new Date().toISOString(),
            summary: {
                totalEvents: events.length,
                totalVolunteers: volunteers.length,
                totalAssignments: assignments.length,
                completedAssignments: stats.completed,
                pendingAssignments: stats.pending,
                activeVolunteers: volunteers.filter(v => v.status === 'active').length
            }
        };

        const lines = [
            report.reportType,
            `Generated at: ${new Date(report.generatedAt).toLocaleString()}`,
            '',
            'Summary',
            `Total events: ${report.summary.totalEvents}`,
            `Total volunteers: ${report.summary.totalVolunteers}`,
            `Active volunteers: ${report.summary.activeVolunteers}`,
            `Total assignments: ${report.summary.totalAssignments}`,
            `Pending assignments: ${report.summary.pendingAssignments}`,
            `Completed assignments: ${report.summary.completedAssignments}`,
            '',
            'Events',
            ...events.flatMap((event) => [
                `${event.name} | ${new Date(event.date).toLocaleDateString()} | ${event.location} | ${event.status}`,
                `Assigned volunteers: ${assignments.filter(a => a.event?.id === event.id && a.status !== 'cancelled').length}`
            ]),
            '',
            'Volunteers',
            ...volunteers.map((volunteer) =>
                `${volunteer.name} | ${volunteer.email} | ${volunteer.status} | Skills: ${(volunteer.skills || []).join(', ') || 'None'}`
            ),
            '',
            'Assignments',
            ...assignments.map((assignment) =>
                `${assignment.event?.name || 'Deleted event'} -> ${assignment.volunteer?.name || 'Deleted volunteer'} | ${assignment.duty} | ${assignment.schedule} | ${assignment.status}`
            )
        ];

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `volunteer-report-${timestamp}.pdf`;
        const pdfBuffer = createPdfBuffer(lines);
        const filePath = path.join(fileOps.DATA_DIR, filename);

        await fs.promises.writeFile(filePath, pdfBuffer);
        await fileOps.appendLog(`Volunteer report generated: ${filename}`);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('X-Report-Filename', filename);
        res.status(200).send(pdfBuffer);
    } catch (error) {
        console.error('Error in generateVolunteerReport controller:', error.message);
        res.status(500).json({ success: false, message: 'Failed to generate volunteer report', data: null });
    }
}

async function listDataFiles(req, res) {
    try {
        const result = await fileOps.listFiles(fileOps.DATA_DIR);
        res.status(200).json({ success: true, message: 'Data files listed successfully', data: result.files });
    } catch (error) {
        console.error('Error in listDataFiles controller:', error.message);
        res.status(500).json({ success: false, message: 'Failed to list data files', data: null });
    }
}

async function getDatabaseHealth(req, res) {
    try {
        const status = getDatabaseStatus();
        let stats = null;
        let statsErrorMessage = null;

        if (status.isConfigured) {
            try {
                stats = await getDatabaseStats();
            } catch (statsError) {
                statsErrorMessage = statsError.message;
            }
        }

        const healthy = status.isConfigured && !statsErrorMessage;

        res.status(healthy ? 200 : 503).json({
            success: healthy,
            message: healthy ? 'Supabase is healthy' : 'Supabase configuration or table setup needs attention',
            data: {
                databaseType: 'Supabase',
                status: healthy ? 'Connected' : 'Needs attention',
                isConfigured: status.isConfigured,
                projectUrl: status.projectUrl,
                tables: status.tables,
                stats,
                error: statsErrorMessage
            }
        });
    } catch (error) {
        console.error('Error in getDatabaseHealth controller:', error.message);
        res.status(500).json({ success: false, message: 'Failed to check database health', error: error.message });
    }
}

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
