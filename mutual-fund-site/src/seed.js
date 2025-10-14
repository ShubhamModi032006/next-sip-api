// src/seed.js

const mongoose = require('mongoose');
// Change 1: The path needs to point to the project root directory from `src`
require('dotenv').config({ path: './.env.local' });

// The paths to your models are correct since they are in a sibling folder
const User = require('./models/User').default;
const VirtualPortfolio = require('./models/VirtualPortfolio').default;

// Change 2: The variable name MUST exactly match the one in your .env.local file
const MONGODB_URI = process.env.MONGODB_URI;

const seedDatabase = async () => {
  // This error check is now correct
  if (!MONGODB_URI) {
    console.error('Error: MONGODB_URI is not defined in your .env.local file.');
    process.exit(1);
  }

  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGODB_URI);
    console.log('Database connected successfully.');

    console.log('Clearing old data...');
    await User.deleteMany({});
    await VirtualPortfolio.deleteMany({});
    console.log('Old data cleared.');

    console.log('Creating dummy user...');
    const dummyUser = await User.create({
      email: 'testuser@example.com',
      username: 'testuser123',
    });
    console.log(`Dummy user created with ID: ${dummyUser._id}`);

    console.log('Creating dummy portfolio holding...');
    const dummyHolding = await VirtualPortfolio.create({
      userId: dummyUser._id,
      schemeCode: '119554',
      schemeName: 'Quant Small Cap Fund Direct Plan-Growth',
      units: 150.75,
      avgPrice: 255.50,
      investmentDate: new Date('2024-05-20'),
    });
    console.log(`Dummy holding created for user ${dummyUser.username}.`);

    console.log('\n✅ Database seeded successfully!');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Database connection closed.');
  }
};

seedDatabase();