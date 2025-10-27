require('dotenv').config();
const mongoose = require('mongoose');

console.log('🔍 Testing MongoDB Connection...\n');

const testConnection = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      console.log('❌ No MONGODB_URI found in .env file');
      console.log('⚠️  Application will run in in-memory mode');
      process.exit(0);
    }

    console.log('📡 Attempting to connect to MongoDB...');
    console.log(`🔗 URI: ${mongoURI.replace(/:[^:@]+@/, ':****@')}\n`); // Hide password in output

    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
    });

    console.log('✅ SUCCESS! MongoDB Connected');
    console.log(`📊 Database Host: ${conn.connection.host}`);
    console.log(`📦 Database Name: ${conn.connection.name}`);
    console.log(`✨ Connection State: ${conn.connection.readyState === 1 ? 'Connected' : 'Unknown'}\n`);
    
    console.log('🎉 Your MongoDB connection is working perfectly!');
    
    // Close the connection
    await mongoose.connection.close();
    console.log('\n🔌 Connection closed');
    process.exit(0);

  } catch (error) {
    console.error('❌ ERROR: Failed to connect to MongoDB\n');
    console.error('Error Message:', error.message);
    
    if (error.message.includes('authentication')) {
      console.log('\n💡 Tip: Check your username and password in the connection string');
    } else if (error.message.includes('ENOTFOUND')) {
      console.log('\n💡 Tip: Check your cluster URL and network connection');
    } else if (error.message.includes('IP')) {
      console.log('\n💡 Tip: Make sure your IP address is whitelisted in MongoDB Atlas');
      console.log('   Go to: Network Access → Add IP Address → Allow Access from Anywhere (0.0.0.0/0)');
    }
    
    console.log('\n⚠️  Application will fall back to in-memory storage mode');
    process.exit(1);
  }
};

testConnection();
