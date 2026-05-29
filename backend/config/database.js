require('dotenv').config({ override: true });

const mongoose = require('mongoose');

const DEFAULT_DB_NAME = 'event_volunteer_db';

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not configured');
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.MONGODB_DB_NAME || DEFAULT_DB_NAME,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000
    });

    console.log('MongoDB connected successfully');
    console.log(`Database: ${conn.connection.name}`);
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected from MongoDB');
});

const getDatabaseStatus = () => {
  const { connection } = mongoose;

  return {
    isConnected: connection.readyState === 1,
    readyState: connection.readyState,
    host: connection.host,
    port: connection.port,
    name: connection.name,
    models: Object.keys(connection.models || {})
  };
};

const getDatabaseStats = async () => {
  if (mongoose.connection.readyState !== 1) {
    throw new Error('MongoDB is not connected');
  }

  return mongoose.connection.db.stats();
};

module.exports = connectDB;
module.exports.getDatabaseStatus = getDatabaseStatus;
module.exports.getDatabaseStats = getDatabaseStats;
module.exports.mongoose = mongoose;
