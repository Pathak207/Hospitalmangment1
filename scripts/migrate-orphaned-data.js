#!/usr/bin/env node

/**
 * Migration script to associate orphaned data with admin@dms.com organization
 * This script will:
 * 1. Find the admin@dms.com user and their organization
 * 2. Update all records without organization to belong to this organization
 * 3. Update appointments to have admin@dms.com as the doctor
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/doctor-care';
const ADMIN_EMAIL = 'admin@dms.com';

// Define schemas directly in the script to avoid import issues
const { Schema } = mongoose;

// User Schema
const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['doctor', 'nurse', 'admin', 'staff', 'super_admin'], default: 'doctor' },
  organization: { type: Schema.Types.ObjectId, ref: 'Organization' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Organization Schema
const OrganizationSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now }
});

// Patient Schema
const PatientSchema = new Schema({
  organization: { type: Schema.Types.ObjectId, ref: 'Organization' },
  name: { type: String, required: true },
  patientId: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, enum: ['male', 'female', 'other'], required: true },
  contactNumber: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Appointment Schema
const AppointmentSchema = new Schema({
  organization: { type: Schema.Types.ObjectId, ref: 'Organization' },
  patient: { type: Schema.Types.ObjectId, ref: 'Patient' },
  doctor: { type: Schema.Types.ObjectId, ref: 'User' },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  type: { type: String, required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['Confirmed', 'Pending', 'Cancelled', 'Completed', 'No-show'], default: 'Pending' },
  createdAt: { type: Date, default: Date.now }
});

// Prescription Schema
const PrescriptionSchema = new Schema({
  organization: { type: Schema.Types.ObjectId, ref: 'Organization' },
  patient: { type: Schema.Types.ObjectId, ref: 'Patient' },
  doctor: { type: Schema.Types.ObjectId, ref: 'User' },
  prescriptionId: { type: String, required: true },
  medications: [{ name: String, dosage: String, frequency: String }],
  createdAt: { type: Date, default: Date.now }
});

// LabResult Schema
const LabResultSchema = new Schema({
  organization: { type: Schema.Types.ObjectId, ref: 'Organization' },
  patient: { type: Schema.Types.ObjectId, ref: 'Patient' },
  orderedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  testName: { type: String, required: true },
  category: { type: String, required: true },
  status: { type: String, enum: ['Ordered', 'In Progress', 'Completed', 'Cancelled'], default: 'Ordered' },
  createdAt: { type: Date, default: Date.now }
});

// ClinicalNote Schema
const ClinicalNoteSchema = new Schema({
  organization: { type: Schema.Types.ObjectId, ref: 'Organization' },
  patient: { type: Schema.Types.ObjectId, ref: 'Patient' },
  doctor: { type: Schema.Types.ObjectId, ref: 'User' },
  note: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Payment Schema
const PaymentSchema = new Schema({
  organization: { type: Schema.Types.ObjectId, ref: 'Organization' },
  patient: { type: Schema.Types.ObjectId, ref: 'Patient' },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

// Activity Schema
const ActivitySchema = new Schema({
  organization: { type: Schema.Types.ObjectId, ref: 'Organization' },
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  title: { type: String, required: true },
  description: { type: String },
  type: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Vitals Schema
const VitalsSchema = new Schema({
  organization: { type: Schema.Types.ObjectId, ref: 'Organization' },
  patient: { type: Schema.Types.ObjectId, ref: 'Patient' },
  bloodPressure: { type: String },
  heartRate: { type: Number },
  temperature: { type: Number },
  createdAt: { type: Date, default: Date.now }
});

// Report Schema
const ReportSchema = new Schema({
  organization: { type: Schema.Types.ObjectId, ref: 'Organization' },
  patient: { type: Schema.Types.ObjectId, ref: 'Patient' },
  doctor: { type: Schema.Types.ObjectId, ref: 'User' },
  title: { type: String, required: true },
  content: { type: String },
  createdAt: { type: Date, default: Date.now }
});

// Create models
const User = mongoose.model('User', UserSchema);
const Organization = mongoose.model('Organization', OrganizationSchema);
const Patient = mongoose.model('Patient', PatientSchema);
const Appointment = mongoose.model('Appointment', AppointmentSchema);
const Prescription = mongoose.model('Prescription', PrescriptionSchema);
const LabResult = mongoose.model('LabResult', LabResultSchema);
const ClinicalNote = mongoose.model('ClinicalNote', ClinicalNoteSchema);
const Payment = mongoose.model('Payment', PaymentSchema);
const Activity = mongoose.model('Activity', ActivitySchema);
const Vitals = mongoose.model('Vitals', VitalsSchema);
const Report = mongoose.model('Report', ReportSchema);

async function connectToDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function findAdminUserAndOrganization() {
  console.log(`🔍 Finding admin user: ${ADMIN_EMAIL}`);
  
  const adminUser = await User.findOne({ email: ADMIN_EMAIL });
  if (!adminUser) {
    console.error(`❌ Admin user ${ADMIN_EMAIL} not found!`);
    process.exit(1);
  }

  console.log(`✅ Found admin user: ${adminUser.name} (${adminUser.email})`);
  
  if (!adminUser.organization) {
    console.error(`❌ Admin user ${ADMIN_EMAIL} has no organization!`);
    process.exit(1);
  }

  const organization = await Organization.findById(adminUser.organization);
  if (!organization) {
    console.error(`❌ Organization not found for admin user!`);
    process.exit(1);
  }

  console.log(`✅ Found organization: ${organization.name} (${organization.email})`);
  
  return { adminUser, organization };
}

async function migrateModel(Model, modelName, adminUser, organization) {
  console.log(`\n🔄 Migrating ${modelName}...`);
  
  // Find records without organization
  const orphanedRecords = await Model.find({
    $or: [
      { organization: { $exists: false } },
      { organization: null }
    ]
  });

  console.log(`📊 Found ${orphanedRecords.length} orphaned ${modelName} records`);

  if (orphanedRecords.length === 0) {
    console.log(`✅ No orphaned ${modelName} records found`);
    return;
  }

  // Update records
  const updateData = { organization: organization._id };
  
  // For appointments, also set the doctor to admin user
  if (modelName === 'Appointment') {
    updateData.doctor = adminUser._id;
  }
  
  // For prescriptions and lab results, set the doctor/orderedBy to admin user
  if (modelName === 'Prescription') {
    updateData.doctor = adminUser._id;
  }
  
  if (modelName === 'LabResult') {
    updateData.orderedBy = adminUser._id;
  }

  // For clinical notes and reports, set the doctor to admin user
  if (modelName === 'ClinicalNote' || modelName === 'Report') {
    updateData.doctor = adminUser._id;
  }

  const result = await Model.updateMany(
    {
      $or: [
        { organization: { $exists: false } },
        { organization: null }
      ]
    },
    { $set: updateData }
  );

  console.log(`✅ Updated ${result.modifiedCount} ${modelName} records`);
}

async function migrateOrphanedData() {
  console.log('🚀 Starting orphaned data migration...\n');

  // Find admin user and organization
  const { adminUser, organization } = await findAdminUserAndOrganization();

  // Models to migrate (in order of dependencies)
  const modelsToMigrate = [
    { Model: Patient, name: 'Patient' },
    { Model: Appointment, name: 'Appointment' },
    { Model: Prescription, name: 'Prescription' },
    { Model: LabResult, name: 'LabResult' },
    { Model: ClinicalNote, name: 'ClinicalNote' },
    { Model: Payment, name: 'Payment' },
    { Model: Activity, name: 'Activity' },
    { Model: Vitals, name: 'Vitals' },
    { Model: Report, name: 'Report' }
  ];

  // Migrate each model
  for (const { Model, name } of modelsToMigrate) {
    try {
      await migrateModel(Model, name, adminUser, organization);
    } catch (error) {
      console.error(`❌ Error migrating ${name}:`, error);
    }
  }

  console.log('\n✅ Migration completed successfully!');
}

async function main() {
  try {
    await connectToDatabase();
    await migrateOrphanedData();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('📦 Database connection closed');
  }
}

// Run the migration
main().catch(console.error); 