import mongoose from 'mongoose';

// Use environment variable for the MongoDB URI
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable in your .env.local file');
}

// Connection options for better performance
const options = {
  bufferCommands: false,
  maxPoolSize: 20, // Increase connection pool size
  minPoolSize: 5,  // Maintain minimum connections
  connectTimeoutMS: 10000, // 10 seconds
  socketTimeoutMS: 45000, // 45 seconds
  family: 4 // Force IPv4
};

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { 
    conn: null, 
    promise: null,
    isConnecting: false
  };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  // If a connection is in progress, wait for it to complete instead of starting a new one
  if (cached.isConnecting) {
    if (!cached.promise) {
      throw new Error('Connection in progress but no promise found');
    }
    return cached.promise;
  }

  cached.isConnecting = true;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, options)
      .then((mongoose) => {
        console.log('MongoDB connected successfully');

        // Handle connection events for better error tracking
        mongoose.connection.on('error', (err) => {
          console.error('MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
          console.log('MongoDB disconnected');
        });

        // Handle graceful shutdown
        process.on('SIGINT', async () => {
          await mongoose.connection.close();
          console.log('MongoDB connection closed due to application termination');
          process.exit(0);
        });

        return mongoose;
      })
      .catch((err) => {
        console.error('MongoDB connection error:', err);
        cached.isConnecting = false;
        cached.promise = null;
        throw err;
      })
      .finally(() => {
        cached.isConnecting = false;
      });
  }
  
  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    cached.isConnecting = false;
    throw error;
  }
}

export default dbConnect; 