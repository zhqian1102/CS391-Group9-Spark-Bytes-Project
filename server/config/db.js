const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // If MONGODB_URI is not set, use in-memory mode warning
    if (!process.env.MONGODB_URI) {
      console.log('⚠️  WARNING: No MongoDB connection string found.');
      console.log('⚠️  Running in development mode without database.');
      console.log('⚠️  Set MONGODB_URI in .env to enable database functionality.');
      return null;
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    console.log('⚠️  Running in development mode without database.');
    return null;
  }
};

module.exports = connectDB;
