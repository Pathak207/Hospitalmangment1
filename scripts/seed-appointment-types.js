require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const { hash } = require('bcrypt');

// Define the schema here for the seed script
const AppointmentTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Appointment type name is required'],
    trim: true,
  },
  duration: {
    type: Number,
    required: [true, 'Duration is required'],
    min: [5, 'Duration must be at least 5 minutes'],
    max: [240, 'Duration cannot exceed 240 minutes'],
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
  },
  color: {
    type: String,
    required: [true, 'Color is required'],
    match: [/^#[0-9A-F]{6}$/i, 'Color must be a valid hex color code'],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  sortOrder: {
    type: Number,
    default: 0,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const AppointmentType = mongoose.models.AppointmentType || mongoose.model('AppointmentType', AppointmentTypeSchema);
const User = mongoose.models.User || mongoose.model('User', UserSchema);

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Please define the MONGODB_URI environment variable in your .env.local file');
  process.exit(1);
}

async function seedAppointmentTypes() {
  try {
    await mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });

    console.log('Connected to MongoDB');

    // Find the first admin user (or create one if none exists)
    let adminUser = await User.findOne({ role: 'admin' });
    
    if (!adminUser) {
      console.log('No admin user found, creating default admin...');
      const hashedPassword = await hash('12345', 10);
      adminUser = await User.create({
        name: 'Dr. Carter',
        email: 'admin@dms.com',
        password: hashedPassword,
        role: 'admin',
      });
    }

    console.log('Using admin user:', adminUser.name, '(', adminUser._id, ')');

    // Check if appointment types already exist
    const existingTypes = await AppointmentType.find({ createdBy: adminUser._id });
    
    if (existingTypes.length > 0) {
      console.log('Appointment types already exist:', existingTypes.length, 'types found');
      console.log('Existing types:');
      existingTypes.forEach(type => {
        console.log(`  - ${type.name} (${type.duration} min) - ${type.color}`);
      });
      return;
    }

    // Create default appointment types
    const defaultAppointmentTypes = [
      {
        name: 'New Patient Visit',
        duration: 60,
        price: 250,
        color: '#3B82F6', // Blue
        sortOrder: 1,
        createdBy: adminUser._id,
      },
      {
        name: 'Follow-Up Visit',
        duration: 30,
        price: 150,
        color: '#10B981', // Green
        sortOrder: 2,
        createdBy: adminUser._id,
      },
      {
        name: 'Annual Physical',
        duration: 45,
        price: 300,
        color: '#F59E0B', // Amber
        sortOrder: 3,
        createdBy: adminUser._id,
      },
      {
        name: 'Consultation',
        duration: 45,
        price: 200,
        color: '#8B5CF6', // Purple
        sortOrder: 4,
        createdBy: adminUser._id,
      },
      {
        name: 'Urgent Care',
        duration: 20,
        price: 175,
        color: '#EF4444', // Red
        sortOrder: 5,
        createdBy: adminUser._id,
      },
      {
        name: 'Specialty Referral',
        duration: 30,
        price: 180,
        color: '#6366F1', // Indigo
        sortOrder: 6,
        createdBy: adminUser._id,
      }
    ];

    console.log('Creating default appointment types...');
    const createdTypes = await AppointmentType.insertMany(defaultAppointmentTypes);
    
    console.log('✅ Successfully created', createdTypes.length, 'appointment types:');
    createdTypes.forEach(type => {
      console.log(`  - ${type.name} (${type.duration} min) - ${type.color}`);
    });

  } catch (error) {
    console.error('❌ Error seeding appointment types:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seed function
seedAppointmentTypes(); 