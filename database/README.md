# Database Management Scripts

This folder contains scripts to manage the MongoDB database for the Event Volunteer System.

## 📁 Files

```
database/
├── init-db.js            # Initialize database with sample data
├── reset-db.js           # Clear all database data
├── backup-db.js          # Backup data to JSON files
├── mongodb-queries.md    # MongoDB query reference
├── package.json          # Dependencies
└── README.md             # This file
```

---

## 🚀 Setup

### Install Dependencies:
```bash
cd database
npm install
```

This installs:
- `mongoose` - MongoDB ODM
- `dotenv` - Environment variable management

---

## 🎯 Scripts

### 1. Initialize Database (npm run init)

**What it does:**
- Connects to MongoDB
- Clears existing data
- Inserts 5 sample events
- Inserts 5 sample volunteers
- Creates 5 sample assignments
- Links all relationships

**How to run:**
```bash
npm run init
```

**Sample Data Created:**

**Events:**
1. Community Cleanup Day (Central Park)
2. Food Drive (Community Center)
3. Youth Mentorship Program (Local High School)
4. Beach Cleanup (Sunset Beach)
5. Senior Care Visit (Sunny Days Senior Center)

**Volunteers:**
1. John Doe - john.doe@example.com
2. Jane Smith - jane.smith@example.com
3. Mike Johnson - mike.johnson@example.com
4. Sarah Williams - sarah.williams@example.com
5. David Brown - david.brown@example.com

**Assignments:**
- Each volunteer is assigned to one event with specific duties

---

### 2. Reset Database (npm run reset)

**What it does:**
- ⚠️ WARNING: Deletes ALL data from database
- Clears events collection
- Clears volunteers collection
- Clears assignments collection

**How to run:**
```bash
npm run reset
```

**Use this when:**
- Starting fresh
- Clearing test data
- Before reinitializing

---

### 3. Backup Database (npm run backup)

**What it does:**
- Exports all data to JSON files
- Creates timestamped backup folder
- Saves events, volunteers, assignments
- Creates metadata file

**How to run:**
```bash
npm run backup
```

**Backup location:**
```
database/backups/backup-YYYY-MM-DD-HH-MM-SS/
├── events.json
├── volunteers.json
├── assignments.json
└── metadata.json
```

---

## 📊 MongoDB Collections

### events
```javascript
{
  _id: ObjectId("..."),
  name: "Community Cleanup Day",
  date: ISODate("2026-06-15"),
  location: "Central Park",
  description: "Help clean our community park",
  status: "upcoming",
  volunteers: [ObjectId("...")],
  capacity: 50,
  organizer: { name: "Admin", email: "admin@example.com" },
  createdAt: ISODate("..."),
  updatedAt: ISODate("...")
}
```

### volunteers
```javascript
{
  _id: ObjectId("..."),
  name: "John Doe",
  email: "john.doe@example.com",
  phone: "1234567890",
  skills: ["Event Planning", "Leadership"],
  availability: "flexible",
  status: "active",
  eventsAssigned: [ObjectId("...")],
  totalHours: 0,
  rating: 5,
  address: { ... },
  createdAt: ISODate("..."),
  updatedAt: ISODate("...")
}
```

### assignments
```javascript
{
  _id: ObjectId("..."),
  event: ObjectId("..."),
  volunteer: ObjectId("..."),
  duty: "Event Coordinator",
  schedule: "9:00 AM - 1:00 PM",
  status: "pending",
  priority: "high",
  notes: "Lead the cleanup efforts",
  hoursWorked: 0,
  createdAt: ISODate("..."),
  updatedAt: ISODate("...")
}
```

---

## 🔍 Viewing Data

### Using MongoDB Shell:
```bash
mongosh
use event_volunteer_db

# View all events
db.events.find().pretty()

# View all volunteers
db.volunteers.find().pretty()

# View all assignments
db.assignments.find().pretty()

# Count documents
db.events.countDocuments()
```

### Using MongoDB Compass:
1. Open MongoDB Compass
2. Connect to: `mongodb://localhost:27017`
3. Select database: `event_volunteer_db`
4. Browse collections

---

## 📝 Common MongoDB Queries

See `mongodb-queries.md` for comprehensive query examples.

### Quick Examples:

**Find upcoming events:**
```javascript
db.events.find({ status: "upcoming" })
```

**Find volunteers with specific skill:**
```javascript
db.volunteers.find({ skills: "Event Planning" })
```

**Find completed assignments:**
```javascript
db.assignments.find({ status: "completed" })
```

**Count assignments per event:**
```javascript
db.assignments.aggregate([
  { $group: { _id: "$event", count: { $sum: 1 } } }
])
```

---

## 🛠️ Configuration

Scripts read MongoDB connection from `backend/.env`:

```env
MONGODB_URI=mongodb://localhost:27017/event_volunteer_db
```

For MongoDB Atlas:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/event_volunteer_db
```

---

## ⚠️ Important Notes

1. **Reset Script**: Deletes ALL data - use with caution!
2. **Backup**: Always backup before major changes
3. **Init Script**: Can be run multiple times (clears first, then inserts)
4. **Connection**: Ensure MongoDB is running before running scripts

---

## 🐛 Troubleshooting

### "Cannot connect to MongoDB":
- Check MongoDB is running
- Verify connection string in backend/.env
- For Atlas: Check IP whitelist and credentials

### "Module not found":
```bash
npm install
```

### "Permission denied":
- Check file permissions
- Run with appropriate user privileges

---

## 🎯 Workflow

**Initial Setup:**
```bash
npm install
npm run init
```

**Daily Development:**
```bash
# Make changes via API or UI
# No script needed
```

**Testing/Reset:**
```bash
npm run reset
npm run init
```

**Before Major Changes:**
```bash
npm run backup
# Make changes
```

**View Data:**
```bash
mongosh
use event_volunteer_db
db.events.find()
```

---

## 📚 Resources

- MongoDB Shell Reference: `mongodb-queries.md`
- MongoDB Docs: https://docs.mongodb.com/
- Mongoose Docs: https://mongoosejs.com/

---

**Database scripts ready to use! 🎉**
