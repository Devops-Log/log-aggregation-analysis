import mongoose from 'mongoose';
import { User } from '../models/User';

export const connectDB = async (): Promise<void> => {
  try {
    const connStr = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/centrallog';
    await mongoose.connect(connStr);
    console.log(`[Database] Connected successfully to MongoDB at ${connStr}`);

    // Initial seeder check
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('[Database] No existing users found. Seeding default admin user...');
      await User.create({
        name: 'DevOps Lead',
        email: 'admin@centrallog.local',
        password: 'password123',
        role: 'admin',
      });
      console.log('[Database] Default admin created: admin@centrallog.local / password123');
    }
  } catch (error) {
    console.error('[Database] Connection failed:', error);
    process.exit(1);
  }
};
