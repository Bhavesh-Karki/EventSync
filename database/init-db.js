const mongoose = require('mongoose');
const path = require('path');

// ✅ CHANGE: use path.resolve(__dirname) so this works regardless of
// which directory you run the script from
require('dotenv').config({ path: path.resolve(__dirname, '../backend/.env') });

// Import models from backend
const Event = require('../backend/models/Event');
const Volunteer = require('../backend/models/Volunteer');
const Assignment = require('../backend/models/Assignment');

// ✅ CHANGE: no localhost fallback — fail explicitly if env var missing
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI is not set. Check backend/.env');
    process.exit(1);
}
// ========================================
// SAMPLE DATA
// ========================================

const sampleEvents = [
    {
        name: "Community Cleanup Day",
        date: new Date("2026-06-15"),
        location: "Central Park",
        description: "Join us for a community cleanup event to make our park beautiful and green. Bring your energy and enthusiasm!",
        status: "upcoming",
        volunteers: [],
        capacity: 50,
        organizer: {
            name: "Admin",
            email: "admin@example.com"
        }
    },
    {
        name: "Food Drive",
        date: new Date("2026-07-20"),
        location: "Community Center",
        description: "Help collect and distribute food to families in need. Every contribution makes a difference!",
        status: "upcoming",
        volunteers: [],
        capacity: 30,
        organizer: {
            name: "Admin",
            email: "admin@example.com"
        }
    },
    {
        name: "Youth Mentorship Program",
        date: new Date("2026-08-10"),
        location: "Local High School",
        description: "Mentor high school students and help guide them towards their future careers.",
        status: "upcoming",
        volunteers: [],
        capacity: 20,
        organizer: {
            name: "Admin",
            email: "admin@example.com"
        }
    },
    {
        name: "Beach Cleanup",
        date: new Date("2026-09-05"),
        location: "Sunset Beach",
        description: "Help keep our beaches clean and protect marine life. Family-friendly event!",
        status: "upcoming",
        volunteers: [],
        capacity: 40,
        organizer: {
            name: "Admin",
            email: "admin@example.com"
        }
    },
    {
        name: "Senior Care Visit",
        date: new Date("2026-09-25"),
        location: "Sunny Days Senior Center",
        description: "Spend quality time with seniors, share stories, play games, and bring joy to their day.",
        status: "upcoming",
        volunteers: [],
        capacity: 15,
        organizer: {
            name: "Admin",
            email: "admin@example.com"
        }
    }
];

const sampleVolunteers = [
    {
        name: "John Doe",
        email: "john.doe@example.com",
        phone: "1234567890",
        skills: ["Event Planning", "Leadership", "Public Speaking"],
        availability: "flexible",
        status: "active",
        eventsAssigned: [],
        totalHours: 0,
        rating: 5,
        address: {
            street: "123 Main St",
            city: "Springfield",
            state: "IL",
            zipCode: "62701",
            country: "USA"
        }
    },
    {
        name: "Jane Smith",
        email: "jane.smith@example.com",
        phone: "0987654321",
        skills: ["Catering", "Coordination", "First Aid"],
        availability: "weekends",
        status: "active",
        eventsAssigned: [],
        totalHours: 0,
        rating: 5,
        address: {
            street: "456 Oak Ave",
            city: "Springfield",
            state: "IL",
            zipCode: "62702",
            country: "USA"
        }
    },
    {
        name: "Mike Johnson",
        email: "mike.johnson@example.com",
        phone: "5551234567",
        skills: ["Photography", "Social Media", "Design"],
        availability: "weekdays",
        status: "active",
        eventsAssigned: [],
        totalHours: 0,
        rating: 5
    },
    {
        name: "Sarah Williams",
        email: "sarah.williams@example.com",
        phone: "5559876543",
        skills: ["Teaching", "Mentoring", "Communication"],
        availability: "flexible",
        status: "active",
        eventsAssigned: [],
        totalHours: 0,
        rating: 5
    },
    {
        name: "David Brown",
        email: "david.brown@example.com",
        phone: "5555555555",
        skills: ["Construction", "Manual Labor", "Team Building"],
        availability: "weekends",
        status: "active",
        eventsAssigned: [],
        totalHours: 0,
        rating: 5
    }
];

// ========================================
// DATABASE INITIALIZATION FUNCTION
// ========================================

async function initializeDatabase() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Clear existing data
        console.log('🗑️  Clearing existing data...');
        await Event.deleteMany({});
        await Volunteer.deleteMany({});
        await Assignment.deleteMany({});
        console.log('✅ Existing data cleared');

        // Insert sample events
        console.log('📅 Inserting sample events...');
        const events = await Event.insertMany(sampleEvents);
        console.log(`✅ Inserted ${events.length} events`);

        // Insert sample volunteers
        console.log('👥 Inserting sample volunteers...');
        const volunteers = await Volunteer.insertMany(sampleVolunteers);
        console.log(`✅ Inserted ${volunteers.length} volunteers`);

        // Create sample assignments
        console.log('✅ Creating sample assignments...');
        
        const sampleAssignments = [
            {
                event: events[0]._id,
                volunteer: volunteers[0]._id,
                duty: "Event Coordinator",
                schedule: "9:00 AM - 1:00 PM",
                status: "pending",
                priority: "high",
                notes: "Lead the cleanup efforts and coordinate teams"
            },
            {
                event: events[0]._id,
                volunteer: volunteers[1]._id,
                duty: "Registration Desk",
                schedule: "8:00 AM - 10:00 AM",
                status: "pending",
                priority: "medium",
                notes: "Check in volunteers and distribute supplies"
            },
            {
                event: events[1]._id,
                volunteer: volunteers[2]._id,
                duty: "Photography",
                schedule: "10:00 AM - 2:00 PM",
                status: "pending",
                priority: "low",
                notes: "Document the event for social media"
            },
            {
                event: events[2]._id,
                volunteer: volunteers[3]._id,
                duty: "Mentor Coordinator",
                schedule: "2:00 PM - 5:00 PM",
                status: "pending",
                priority: "high",
                notes: "Pair mentors with students"
            },
            {
                event: events[3]._id,
                volunteer: volunteers[4]._id,
                duty: "Cleanup Team Leader",
                schedule: "7:00 AM - 11:00 AM",
                status: "pending",
                priority: "medium",
                notes: "Lead beach cleanup team"
            }
        ];

        const assignments = await Assignment.insertMany(sampleAssignments);
        console.log(`✅ Inserted ${assignments.length} assignments`);

        // Update events with volunteers
        for (const assignment of assignments) {
            await Event.findByIdAndUpdate(
                assignment.event,
                { $addToSet: { volunteers: assignment.volunteer } }
            );
            await Volunteer.findByIdAndUpdate(
                assignment.volunteer,
                { $addToSet: { eventsAssigned: assignment.event } }
            );
        }
        console.log('✅ Updated event and volunteer relationships');

        // Display summary
        console.log('\n📊 Database Initialization Summary:');
        console.log('═══════════════════════════════════');
        console.log(`Events:      ${events.length}`);
        console.log(`Volunteers:  ${volunteers.length}`);
        console.log(`Assignments: ${assignments.length}`);
        console.log('═══════════════════════════════════');
        console.log('\n🎉 Database initialized successfully!');
        console.log('\nYou can now:');
        console.log('1. Start the backend server: cd backend && npm start');
        console.log('2. Start the frontend: cd frontend && npm start');
        console.log('3. Visit: http://localhost:3000');

    } catch (error) {
        console.error('❌ Error initializing database:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Disconnected from MongoDB');
        process.exit(0);
    }
}

// Run initialization
console.log('╔════════════════════════════════════════╗');
console.log('║  Event Volunteer System - Database    ║');
console.log('║  Initialization Script                 ║');
console.log('╚════════════════════════════════════════╝\n');

initializeDatabase();
