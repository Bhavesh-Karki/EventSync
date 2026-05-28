// ========================================
// DATABASE RESET SCRIPT
// database/reset-db.js
// ========================================
// This script clears all data from the database
// USE WITH CAUTION!
// ========================================

const mongoose = require('mongoose');
require('dotenv').config({ path: '../backend/.env' });

const Event = require('../backend/models/Event');
const Volunteer = require('../backend/models/Volunteer');
const Assignment = require('../backend/models/Assignment');

const MONGODB_URI = process.env.MONGODB_URI ;

async function resetDatabase() {
    try {
        console.log('⚠️  WARNING: This will delete ALL data from the database!');
        console.log('🔌 Connecting to MongoDB...');
        
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        console.log('🗑️  Deleting all data...');
        
        const eventsDeleted = await Event.deleteMany({});
        const volunteersDeleted = await Volunteer.deleteMany({});
        const assignmentsDeleted = await Assignment.deleteMany({});

        console.log('\n📊 Deletion Summary:');
        console.log('═══════════════════════════════════');
        console.log(`Events deleted:      ${eventsDeleted.deletedCount}`);
        console.log(`Volunteers deleted:  ${volunteersDeleted.deletedCount}`);
        console.log(`Assignments deleted: ${assignmentsDeleted.deletedCount}`);
        console.log('═══════════════════════════════════');
        
        console.log('\n✅ Database reset complete!');
        console.log('\nTo reinitialize with sample data, run:');
        console.log('npm run init');

    } catch (error) {
        console.error('❌ Error resetting database:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Disconnected from MongoDB');
        process.exit(0);
    }
}

console.log('╔════════════════════════════════════════╗');
console.log('║  Event Volunteer System - Database    ║');
console.log('║  Reset Script                          ║');
console.log('╚════════════════════════════════════════╝\n');

resetDatabase();
