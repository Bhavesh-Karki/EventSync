// ========================================
// DATABASE BACKUP SCRIPT
// database/backup-db.js
// ========================================
// This script exports all data to JSON files
// ========================================

const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: '../backend/.env' });

const Event = require('../backend/models/Event');
const Volunteer = require('../backend/models/Volunteer');
const Assignment = require('../backend/models/Assignment');

const MONGODB_URI = process.env.MONGODB_URI;
const BACKUP_DIR = path.join(__dirname, 'backups');

async function backupDatabase() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Create backup directory with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(BACKUP_DIR, `backup-${timestamp}`);
        await fs.mkdir(backupPath, { recursive: true });

        console.log(`📁 Creating backup at: ${backupPath}`);

        // Backup events
        console.log('📅 Backing up events...');
        const events = await Event.find();
        await fs.writeFile(
            path.join(backupPath, 'events.json'),
            JSON.stringify(events, null, 2)
        );
        console.log(`✅ Backed up ${events.length} events`);

        // Backup volunteers
        console.log('👥 Backing up volunteers...');
        const volunteers = await Volunteer.find();
        await fs.writeFile(
            path.join(backupPath, 'volunteers.json'),
            JSON.stringify(volunteers, null, 2)
        );
        console.log(`✅ Backed up ${volunteers.length} volunteers`);

        // Backup assignments
        console.log('✅ Backing up assignments...');
        const assignments = await Assignment.find();
        await fs.writeFile(
            path.join(backupPath, 'assignments.json'),
            JSON.stringify(assignments, null, 2)
        );
        console.log(`✅ Backed up ${assignments.length} assignments`);

        // Create metadata file
        const metadata = {
            backupDate: new Date().toISOString(),
            collections: {
                events: events.length,
                volunteers: volunteers.length,
                assignments: assignments.length
            }
        };
        await fs.writeFile(
            path.join(backupPath, 'metadata.json'),
            JSON.stringify(metadata, null, 2)
        );

        console.log('\n📊 Backup Summary:');
        console.log('═══════════════════════════════════');
        console.log(`Events:      ${events.length}`);
        console.log(`Volunteers:  ${volunteers.length}`);
        console.log(`Assignments: ${assignments.length}`);
        console.log(`Location:    ${backupPath}`);
        console.log('═══════════════════════════════════');
        
        console.log('\n✅ Backup completed successfully!');

    } catch (error) {
        console.error('❌ Error backing up database:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Disconnected from MongoDB');
        process.exit(0);
    }
}

console.log('╔════════════════════════════════════════╗');
console.log('║  Event Volunteer System - Database    ║');
console.log('║  Backup Script                         ║');
console.log('╚════════════════════════════════════════╝\n');

backupDatabase();
