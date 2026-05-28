require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');

const app = express();

// CONNECT DATABASE
connectDB();

// MIDDLEWARE
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// IMPORT ROUTES
const assignmentRoutes = require('./routes/assignmentRoutes');

// ADD MORE ROUTES LIKE THESE
// const eventRoutes = require('./routes/eventRoutes');
// const volunteerRoutes = require('./routes/volunteerRoutes');

// TEST ROUTE
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API Running Successfully'
  });
});

// REGISTER ROUTES
app.use('/api/assignments', assignmentRoutes);

// ADD THESE IF FILES EXIST
// app.use('/api/events', eventRoutes);
// app.use('/api/volunteers', volunteerRoutes);

// PORT
const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});