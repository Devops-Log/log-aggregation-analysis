import mongoose from 'mongoose';
import { User } from '../models/User';
import { Log } from '../models/Log';
import { seedDatabase } from './seed';

let isEventListenersAttached = false;

function attachEventListeners(): void {
  if (isEventListenersAttached) return;

  mongoose.connection.on('error', (err) => {
    console.error('[Database] Connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[Database] Disconnected from MongoDB. Attempting auto-reconnection...');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('[Database] Reconnected to MongoDB successfully.');
  });

  isEventListenersAttached = true;
}

export const connectDB = async (): Promise<void> => {
  try {
    const connStr = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/centrallog';
    attachEventListeners();

    await mongoose.connect(connStr);
    console.log(`[Database] Connected successfully to MongoDB at ${connStr}`);

    // Automated database bootstrapper check
    const userCount = await User.countDocuments();
    const logCount = await Log.countDocuments();

    if (userCount === 0 || logCount === 0) {
      console.log('[Database] Uninitialized database detected. Bootstrapping initial seed data...');
      await seedDatabase(false);
      console.log('[Database] Bootstrapper seeding completed.');
    }
  } catch (error) {
    console.error('[Database] Connection failed:', error);
    process.exit(1);
  }
};
