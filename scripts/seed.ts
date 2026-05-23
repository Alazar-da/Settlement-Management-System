import dbConnect from '../lib/dbConnect';
import User from '../models/User';
import bcrypt from 'bcryptjs';

async function seed() {
  await dbConnect();
  
  // Create admin user if not exists
  const adminExists = await User.findOne({ userName: 'admin' });
  if (!adminExists) {
    await User.create({
      userName: 'admin',
      password: 'Admin123!',
    });
    console.log('Admin user created: admin / Admin123!');
  }
  
  console.log('Database seeded successfully');
  process.exit(0);
}

seed().catch(console.error);