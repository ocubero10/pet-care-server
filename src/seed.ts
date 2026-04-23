import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './models/User';
import Pet from './models/Pet';
import Order from './models/Order';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pet-care-db';

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB at:', MONGODB_URI);

    // Clear existing data
    await User.deleteMany({});
    await Pet.deleteMany({});
    await Order.deleteMany({});
    console.log('Cleared existing data.');

    // --- Create Users ---
    const owner = await User.create({
      name: 'Maria Lopez',
      email: 'maria@example.com',
      password: 'password123',
      phone: '5551234567',
      role: 'owner',
    });

    const staff = await User.create({
      name: 'Carlos Jimenez',
      email: 'carlos@example.com',
      password: 'password123',
      phone: '5559876543',
      role: 'staff',
    });

    const driver = await User.create({
      name: 'Ana Rodriguez',
      email: 'ana@example.com',
      password: 'password123',
      phone: '5555551234',
      role: 'driver',
    });

    console.log('Created users:');
    console.log(`  Owner:  ${owner.name} (${owner.email})`);
    console.log(`  Staff:  ${staff.name} (${staff.email})`);
    console.log(`  Driver: ${driver.name} (${driver.email})`);

    // --- Create Pets ---
    const pet1 = await Pet.create({
      ownerId: owner._id,
      name: 'Luna',
      breed: 'Golden Retriever',
      age: 3,
      size: 'large',
      specialNotes: 'Very friendly, loves treats. Scared of loud noises.',
    });

    const pet2 = await Pet.create({
      ownerId: owner._id,
      name: 'Coco',
      breed: 'Poodle',
      age: 5,
      size: 'medium',
      specialNotes: 'Needs hypoallergenic shampoo. Has sensitive skin.',
    });

    console.log('Created pets:');
    console.log(`  ${pet1.name} (${pet1.breed}, ${pet1.size})`);
    console.log(`  ${pet2.name} (${pet2.breed}, ${pet2.size})`);

    // --- Create Orders ---
    const now = new Date();
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    const order1 = await Order.create({
      petId: pet1._id,
      ownerId: owner._id,
      driverId: driver._id,
      staffId: staff._id,
      services: ['grooming', 'bath', 'nails'],
      requirements: {
        grooming: 'Full body trim, keep tail long',
        bath: 'Use oatmeal shampoo only',
        nails: 'Trim short but careful, she pulls away',
        temperamentNotes: 'Friendly but nervous at first. Give her a minute to warm up.',
        medicalConditions: 'None',
      },
      status: 'confirmed',
      pickupDateTime: now,
      estimatedCompletionTime: twoHoursLater,
      notes: 'Owner prefers pickup before 10am',
    });

    const order2 = await Order.create({
      petId: pet2._id,
      ownerId: owner._id,
      driverId: driver._id,
      staffId: staff._id,
      services: ['haircut', 'bath'],
      requirements: {
        haircut: 'Puppy cut style, even all around',
        bath: 'MUST use hypoallergenic shampoo - sensitive skin',
        dietaryNeeds: 'No treats with chicken - allergic',
        medicalConditions: 'Skin allergies, check for redness after bath',
      },
      status: 'pending',
      pickupDateTime: new Date(now.getTime() + 24 * 60 * 60 * 1000), // tomorrow
      estimatedCompletionTime: new Date(now.getTime() + 26 * 60 * 60 * 1000),
      clarificationRequests: [
        {
          id: 'clarification-1',
          question: 'How short should the puppy cut be? Any reference photo?',
          askedAt: now,
        },
      ],
    });

    console.log('Created orders:');
    console.log(`  Order 1: ${pet1.name} - [${order1.services.join(', ')}] - Status: ${order1.status}`);
    console.log(`  Order 2: ${pet2.name} - [${order2.services.join(', ')}] - Status: ${order2.status}`);

    // --- Summary ---
    console.log('\n========================================');
    console.log('  DATABASE SEEDED SUCCESSFULLY');
    console.log('========================================');
    console.log(`  Users:  ${await User.countDocuments()}`);
    console.log(`  Pets:   ${await Pet.countDocuments()}`);
    console.log(`  Orders: ${await Order.countDocuments()}`);
    console.log('========================================');
    console.log('\nTest credentials (all use password: password123):');
    console.log(`  Owner:  maria@example.com`);
    console.log(`  Staff:  carlos@example.com`);
    console.log(`  Driver: ana@example.com`);
    console.log('========================================\n');

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seed();
