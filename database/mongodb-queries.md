# MongoDB Queries Reference
# database/mongodb-queries.md

This file contains useful MongoDB queries for the Event Volunteer System.

## 🔌 Connect to MongoDB

### Using MongoDB Shell (mongosh):
```bash
mongosh
```

### Connect to specific database:
```javascript
use event_volunteer_db
```

---

## 📊 View Data

### Show all collections:
```javascript
show collections
```

### Count documents in each collection:
```javascript
db.events.countDocuments()
db.volunteers.countDocuments()
db.assignments.countDocuments()
```

### View all events:
```javascript
db.events.find().pretty()
```

### View all volunteers:
```javascript
db.volunteers.find().pretty()
```

### View all assignments:
```javascript
db.assignments.find().pretty()
```

---

## 🔍 Search Queries

### Find upcoming events:
```javascript
db.events.find({ 
    status: "upcoming",
    date: { $gte: new Date() }
}).pretty()
```

### Find active volunteers:
```javascript
db.volunteers.find({ 
    status: "active" 
}).pretty()
```

### Find volunteers with specific skill:
```javascript
db.volunteers.find({ 
    skills: "Event Planning" 
}).pretty()
```

### Find completed assignments:
```javascript
db.assignments.find({ 
    status: "completed" 
}).pretty()
```

### Find events at specific location:
```javascript
db.events.find({ 
    location: /park/i  // case-insensitive
}).pretty()
```

### Find volunteers by availability:
```javascript
db.volunteers.find({ 
    availability: "weekends" 
}).pretty()
```

---

## ➕ Insert Data

### Insert a new event:
```javascript
db.events.insertOne({
    name: "New Event",
    date: new Date("2026-12-31"),
    location: "Event Center",
    description: "Description of the event",
    status: "upcoming",
    volunteers: [],
    capacity: 30,
    organizer: {
        name: "Admin",
        email: "admin@example.com"
    },
    createdAt: new Date(),
    updatedAt: new Date()
})
```

### Insert a new volunteer:
```javascript
db.volunteers.insertOne({
    name: "New Volunteer",
    email: "newvolunteer@example.com",
    phone: "1234567890",
    skills: ["Skill1", "Skill2"],
    availability: "flexible",
    status: "active",
    eventsAssigned: [],
    totalHours: 0,
    rating: 5,
    dateJoined: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
})
```

### Insert multiple events:
```javascript
db.events.insertMany([
    {
        name: "Event 1",
        date: new Date("2026-10-01"),
        location: "Location 1",
        description: "Description 1",
        status: "upcoming",
        volunteers: [],
        capacity: 25,
        organizer: { name: "Admin", email: "admin@example.com" },
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        name: "Event 2",
        date: new Date("2026-11-01"),
        location: "Location 2",
        description: "Description 2",
        status: "upcoming",
        volunteers: [],
        capacity: 35,
        organizer: { name: "Admin", email: "admin@example.com" },
        createdAt: new Date(),
        updatedAt: new Date()
    }
])
```

---

## ✏️ Update Data

### Update event status:
```javascript
db.events.updateOne(
    { name: "Community Cleanup Day" },
    { $set: { status: "ongoing" } }
)
```

### Update volunteer status:
```javascript
db.volunteers.updateOne(
    { email: "john.doe@example.com" },
    { $set: { status: "inactive" } }
)
```

### Update assignment status:
```javascript
db.assignments.updateOne(
    { duty: "Event Coordinator" },
    { $set: { status: "in-progress" } }
)
```

### Add skill to volunteer:
```javascript
db.volunteers.updateOne(
    { email: "jane.smith@example.com" },
    { $push: { skills: "New Skill" } }
)
```

### Increase volunteer hours:
```javascript
db.volunteers.updateOne(
    { email: "john.doe@example.com" },
    { $inc: { totalHours: 5 } }
)
```

### Update multiple documents:
```javascript
db.events.updateMany(
    { status: "upcoming" },
    { $set: { capacity: 50 } }
)
```

---

## 🗑️ Delete Data

### Delete one event:
```javascript
db.events.deleteOne({ 
    name: "Old Event" 
})
```

### Delete volunteer:
```javascript
db.volunteers.deleteOne({ 
    email: "oldvolunteer@example.com" 
})
```

### Delete all cancelled events:
```javascript
db.events.deleteMany({ 
    status: "cancelled" 
})
```

### Delete all inactive volunteers:
```javascript
db.volunteers.deleteMany({ 
    status: "inactive" 
})
```

---

## 📈 Aggregation Queries

### Count assignments per event:
```javascript
db.assignments.aggregate([
    {
        $group: {
            _id: "$event",
            count: { $sum: 1 }
        }
    }
])
```

### Count assignments per volunteer:
```javascript
db.assignments.aggregate([
    {
        $group: {
            _id: "$volunteer",
            count: { $sum: 1 }
        }
    }
])
```

### Average rating of volunteers:
```javascript
db.volunteers.aggregate([
    {
        $group: {
            _id: null,
            averageRating: { $avg: "$rating" },
            totalVolunteers: { $sum: 1 }
        }
    }
])
```

### Total hours worked by all volunteers:
```javascript
db.volunteers.aggregate([
    {
        $group: {
            _id: null,
            totalHours: { $sum: "$totalHours" }
        }
    }
])
```

### Events by status count:
```javascript
db.events.aggregate([
    {
        $group: {
            _id: "$status",
            count: { $sum: 1 }
        }
    }
])
```

### Assignments by status count:
```javascript
db.assignments.aggregate([
    {
        $group: {
            _id: "$status",
            count: { $sum: 1 }
        }
    }
])
```

---

## 🔗 Advanced Queries with Lookup (Join)

### Get assignments with event details:
```javascript
db.assignments.aggregate([
    {
        $lookup: {
            from: "events",
            localField: "event",
            foreignField: "_id",
            as: "eventDetails"
        }
    },
    {
        $unwind: "$eventDetails"
    }
])
```

### Get assignments with volunteer details:
```javascript
db.assignments.aggregate([
    {
        $lookup: {
            from: "volunteers",
            localField: "volunteer",
            foreignField: "_id",
            as: "volunteerDetails"
        }
    },
    {
        $unwind: "$volunteerDetails"
    }
])
```

### Get events with all their volunteers:
```javascript
db.events.aggregate([
    {
        $lookup: {
            from: "volunteers",
            localField: "volunteers",
            foreignField: "_id",
            as: "volunteerList"
        }
    }
])
```

---

## 🔍 Index Management

### Create indexes for better performance:
```javascript
// Index on event date
db.events.createIndex({ date: 1 })

// Index on volunteer email (unique)
db.volunteers.createIndex({ email: 1 }, { unique: true })

// Index on assignment status
db.assignments.createIndex({ status: 1 })

// Compound index
db.assignments.createIndex({ event: 1, volunteer: 1 })

// Text index for searching
db.events.createIndex({ name: "text", description: "text" })
```

### View existing indexes:
```javascript
db.events.getIndexes()
db.volunteers.getIndexes()
db.assignments.getIndexes()
```

### Drop an index:
```javascript
db.events.dropIndex("date_1")
```

---

## 🛠️ Database Maintenance

### Get database statistics:
```javascript
db.stats()
```

### Get collection statistics:
```javascript
db.events.stats()
db.volunteers.stats()
db.assignments.stats()
```

### Backup specific collection:
```bash
# In terminal (not mongo shell)
mongodump --db event_volunteer_db --collection events --out /backup
```

### Restore collection:
```bash
mongorestore --db event_volunteer_db --collection events /backup/event_volunteer_db/events.bson
```

### Export to JSON:
```bash
mongoexport --db event_volunteer_db --collection events --out events.json --pretty
```

### Import from JSON:
```bash
mongoimport --db event_volunteer_db --collection events --file events.json
```

---

## 🧹 Clear All Data

### Delete all documents from all collections:
```javascript
db.events.deleteMany({})
db.volunteers.deleteMany({})
db.assignments.deleteMany({})
```

### Drop entire collections:
```javascript
db.events.drop()
db.volunteers.drop()
db.assignments.drop()
```

### Drop entire database:
```javascript
db.dropDatabase()
```

---

## 📊 Useful Statistics Queries

### Get total events by month:
```javascript
db.events.aggregate([
    {
        $group: {
            _id: { 
                month: { $month: "$date" },
                year: { $year: "$date" }
            },
            count: { $sum: 1 }
        }
    },
    {
        $sort: { "_id.year": 1, "_id.month": 1 }
    }
])
```

### Most active volunteers (by assignments):
```javascript
db.assignments.aggregate([
    {
        $group: {
            _id: "$volunteer",
            assignmentCount: { $sum: 1 }
        }
    },
    {
        $sort: { assignmentCount: -1 }
    },
    {
        $limit: 10
    }
])
```

### Events with most volunteers:
```javascript
db.events.aggregate([
    {
        $project: {
            name: 1,
            volunteerCount: { $size: "$volunteers" }
        }
    },
    {
        $sort: { volunteerCount: -1 }
    }
])
```

---

## 💡 Tips

1. Always use `.pretty()` for readable output
2. Use `limit()` to limit results: `db.events.find().limit(5)`
3. Use `sort()` to sort results: `db.events.find().sort({ date: 1 })`
4. Use `projection` to select specific fields: `db.events.find({}, { name: 1, date: 1 })`
5. Combine methods: `db.events.find({ status: "upcoming" }).sort({ date: 1 }).limit(5).pretty()`

---

## 🎯 Quick Commands Reference

```javascript
// Connection
use event_volunteer_db

// View
show collections
db.collection.find()
db.collection.find().count()

// Insert
db.collection.insertOne({...})
db.collection.insertMany([...])

// Update
db.collection.updateOne({filter}, {update})
db.collection.updateMany({filter}, {update})

// Delete
db.collection.deleteOne({filter})
db.collection.deleteMany({filter})

// Operators
$set      // Set value
$inc      // Increment
$push     // Add to array
$pull     // Remove from array
$gte      // Greater than or equal
$lte      // Less than or equal
$in       // In array
$regex    // Pattern match
```

---

**For more MongoDB queries and operations, visit:**
- MongoDB Documentation: https://docs.mongodb.com/manual/
- MongoDB Shell Docs: https://docs.mongodb.com/mongodb-shell/
