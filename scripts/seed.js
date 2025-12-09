const { hash } = require('bcrypt');
const mongoose = require('mongoose');
const { Schema } = mongoose;
const dotenv = require('dotenv');
const Task = require('../models/Task.js');
const Activity = require('../models/Activity.js');
const LabResult = require('../models/LabResult.js');

// Load environment variables
dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Please define the MONGODB_URI environment variable in your .env.local file');
  process.exit(1);
}

// Define schemas
const UserSchema = new Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const PatientSchema = new Schema({
  name: String,
  patientId: String,
  age: Number,
  gender: String,
  contactNumber: String,
  email: String,
  address: String,
  medicalHistory: [String],
  allergies: [String],
  medications: [
    {
      name: String,
      dosage: String,
      frequency: String,
      startDate: Date,
      endDate: Date,
    },
  ],
  vitals: {
    bp: String,
    hr: String,
    temp: String,
    lastUpdated: Date,
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const AppointmentSchema = new Schema({
  patient: { type: Schema.Types.ObjectId, ref: 'Patient' },
  doctor: { type: Schema.Types.ObjectId, ref: 'User' },
  date: Date,
  time: String,
  type: String,
  reason: String,
  status: String,
  duration: String,
  notes: String,
  alerts: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const TaskSchema = new Schema({
  title: String,
  description: String,
  patient: { type: Schema.Types.ObjectId, ref: 'Patient' },
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
  dueDate: Date,
  priority: String,
  type: String,
  status: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const ActivitySchema = new Schema({
  title: String,
  description: String,
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  patient: { type: Schema.Types.ObjectId, ref: 'Patient' },
  type: String,
  alert: Boolean,
  relatedTo: {
    model: String,
    id: Schema.Types.ObjectId,
  },
  createdAt: { type: Date, default: Date.now },
});

// Register models
const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Patient = mongoose.models.Patient || mongoose.model('Patient', PatientSchema);
const Appointment = mongoose.models.Appointment || mongoose.model('Appointment', AppointmentSchema);
const Task = mongoose.models.Task || mongoose.model('Task', TaskSchema);
const Activity = mongoose.models.Activity || mongoose.model('Activity', ActivitySchema);

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Patient.deleteMany({});
    await Appointment.deleteMany({});
    await Task.deleteMany({});
    await Activity.deleteMany({});
    console.log('Cleared existing data');

    // Create users
    const hashedPassword = await hash('Admin123!', 10);
    
    const doctor = await User.create({
      name: 'Dr. Carter',
      email: 'dr.carter@doctorcare.com',
      password: hashedPassword,
      role: 'admin',
    });

    console.log('Created user:', doctor.name);

    // Create patients
    const patients = await Patient.create([
      {
        name: 'Emily Johnson',
        patientId: 'PAT-1001',
        age: 42,
        gender: 'female',
        contactNumber: '555-123-4567',
        email: 'emily.johnson@example.com',
        address: '123 Main St, Anytown, USA',
        medicalHistory: ['Hypertension', 'Asthma'],
        allergies: ['Penicillin'],
        vitals: {
          bp: '138/85',
          hr: '78',
          temp: '98.6°F',
          lastUpdated: new Date(),
        },
      },
      {
        name: 'Robert Smith',
        patientId: 'PAT-1002',
        age: 58,
        gender: 'male',
        contactNumber: '555-987-6543',
        email: 'robert.smith@example.com',
        address: '456 Oak Dr, Somewhere, USA',
        medicalHistory: ['Diabetes Type 2', 'Hypertension'],
        allergies: ['Sulfa drugs', 'Peanuts'],
        vitals: {
          bp: '145/90',
          hr: '82',
          temp: '98.4°F',
          lastUpdated: new Date(),
        },
      },
      {
        name: 'Sophia Williams',
        patientId: 'PAT-1003',
        age: 35,
        gender: 'female',
        contactNumber: '555-555-5555',
        email: 'sophia.williams@example.com',
        address: '789 Pine St, Nowhere, USA',
        medicalHistory: ['Anxiety', 'Migraines'],
        allergies: ['Latex'],
        vitals: {
          bp: '120/80',
          hr: '70',
          temp: '98.2°F',
          lastUpdated: new Date(),
        },
      },
      {
        name: 'Michael Brown',
        patientId: 'PAT-1004',
        age: 62,
        gender: 'male',
        contactNumber: '555-111-2222',
        email: 'michael.brown@example.com',
        address: '321 Elm St, Anytown, USA',
        medicalHistory: ['Coronary Artery Disease', 'Hyperlipidemia'],
        allergies: ['NSAIDs'],
        vitals: {
          bp: '132/78',
          hr: '68',
          temp: '98.8°F',
          lastUpdated: new Date(),
        },
      },
     
    ]);

    console.log(`Created ${patients.length} patients`);

    // Create today and tomorrow dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Create appointments
    const appointments = await Appointment.create([
      {
        patient: patients[0]._id,
        doctor: doctor._id,
        date: today,
        time: '09:00 AM',
        type: 'Follow-up',
        reason: 'Blood pressure monitoring',
        status: 'Confirmed',
        duration: '30 min',
        alerts: ['Medication review needed'],
      },
      {
        patient: patients[1]._id,
        doctor: doctor._id,
        date: today,
        time: '10:30 AM',
        type: 'Consultation',
        reason: 'Knee pain assessment',
        status: 'Confirmed',
        duration: '45 min',
        alerts: ['Diabetes Type 2', 'Hypertension'],
      },
      {
        patient: patients[2]._id,
        doctor: doctor._id,
        date: today,
        time: '11:45 AM',
        type: 'Follow-up',
        reason: 'Medication review',
        status: 'Pending',
        duration: '30 min',
        alerts: ['Recent medication change', 'Blood work pending'],
      },
      {
        patient: patients[3]._id,
        doctor: doctor._id,
        date: today,
        time: '02:15 PM',
        type: 'Annual physical',
        reason: 'Annual examination',
        status: 'Confirmed',
        duration: '45 min',
        alerts: ['Due for colonoscopy', 'NSAID allergy'],
      },
      {
        patient: patients[4]._id,
        doctor: doctor._id,
        date: today,
        time: '03:30 PM',
        type: 'Consultation',
        reason: 'Lab result review',
        status: 'Confirmed',
        duration: '30 min',
        alerts: ['Recent ER visit for asthma attack (09/01/2023)'],
      },
      // Add one appointment for tomorrow
      {
        patient: patients[0]._id,
        doctor: doctor._id,
        date: tomorrow,
        time: '10:00 AM',
        type: 'Follow-up',
        reason: 'Review test results',
        status: 'Confirmed',
        duration: '30 min',
        alerts: [],
      },


      
    ]);

    console.log(`Created ${appointments.length} appointments`);

    // Create tasks
    const tasks = await Task.create([
      {
        title: 'Review lab results',
        description: 'Review CBC and metabolic panel for Emily Johnson',
        patient: patients[0]._id,
        assignedTo: doctor._id,
        dueDate: today,
        priority: 'High',
        type: 'Lab Review',
        status: 'Pending',
      },
      {
        title: 'Process referral request',
        description: 'Send cardiology referral for Michael Brown',
        patient: patients[3]._id,
        assignedTo: doctor._id,
        dueDate: today,
        priority: 'Medium',
        type: 'Referral',
        status: 'Pending',
      },
      {
        title: 'Prescription renewal',
        description: 'Renew anti-anxiety medication for Sophia Williams',
        patient: patients[2]._id,
        assignedTo: doctor._id,
        dueDate: tomorrow,
        priority: 'Medium',
        type: 'Prescription',
        status: 'Pending',
      },
      {
        title: 'Complete FMLA paperwork',
        description: 'Fill out FMLA forms for Robert Smith',
        patient: patients[1]._id,
        assignedTo: doctor._id,
        dueDate: tomorrow,
        priority: 'Low',
        type: 'Documentation',
        status: 'Pending',
      },
    ]);

    console.log(`Created ${tasks.length} tasks`);

    // Create lab results
    const labResults = await LabResult.create([
      {
        patient: patients[0]._id,
        orderedBy: doctor._id,
        testName: 'Complete Blood Count (CBC)',
        category: 'Hematology',
        status: 'Ordered',
        orderedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        urgency: 'Routine',
        notes: 'Routine annual screening'
      },
      {
        patient: patients[1]._id,
        orderedBy: doctor._id,
        testName: 'Comprehensive Metabolic Panel',
        category: 'Chemistry',
        status: 'In Progress',
        orderedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        urgency: 'Urgent',
        notes: 'Follow-up for diabetes management'
      },
      {
        patient: patients[2]._id,
        orderedBy: doctor._id,
        testName: 'Thyroid Function Panel',
        category: 'Endocrinology',
        status: 'Completed',
        orderedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        urgency: 'Routine',
        results: {
          'TSH': {
            value: '2.5',
            unit: 'mIU/L',
            referenceRange: '0.4-4.0',
            flag: 'Normal'
          },
          'Free T4': {
            value: '1.2',
            unit: 'ng/dL',
            referenceRange: '0.8-1.8',
            flag: 'Normal'
          }
        },
        resultSummary: 'Thyroid function within normal limits',
        notes: 'Annual screening for anxiety management'
      },
      {
        patient: patients[3]._id,
        orderedBy: doctor._id,
        testName: 'Lipid Panel',
        category: 'Chemistry',
        status: 'Completed',
        orderedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        urgency: 'Routine',
        results: {
          'Total Cholesterol': {
            value: '210',
            unit: 'mg/dL',
            referenceRange: '<200',
            flag: 'High'
          },
          'LDL': {
            value: '145',
            unit: 'mg/dL',
            referenceRange: '<100',
            flag: 'High'
          },
          'HDL': {
            value: '45',
            unit: 'mg/dL',
            referenceRange: '>40',
            flag: 'Normal'
          },
          'Triglycerides': {
            value: '180',
            unit: 'mg/dL',
            referenceRange: '<150',
            flag: 'High'
          }
        },
        resultSummary: 'Elevated cholesterol and triglycerides. Recommend dietary changes and consider statin therapy.',
        notes: 'Follow-up for coronary artery disease'
      },
      {
        patient: patients[0]._id,
        orderedBy: doctor._id,
        testName: 'Hemoglobin A1C',
        category: 'Chemistry',
        status: 'Ordered',
        orderedAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
        urgency: 'STAT',
        notes: 'STAT order for suspected diabetes'
      },
      {
        patient: patients[1]._id,
        orderedBy: doctor._id,
        testName: 'Urinalysis',
        category: 'Urology',
        status: 'In Progress',
        orderedAt: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
        urgency: 'Urgent',
        notes: 'Suspected UTI'
      }
    ]);

    console.log(`Created ${labResults.length} lab results`);

    // Create activities
    const activities = await Activity.create([
      {
        title: 'New lab results received',
        description: 'Blood work results for Emily Johnson',
        user: doctor._id,
        patient: patients[0]._id,
        type: 'lab',
        alert: false,
        relatedTo: {
          model: 'Patient',
          id: patients[0]._id,
        },
        createdAt: new Date(Date.now() - 10 * 60 * 1000), // 10 mins ago
      },
      {
        title: 'Patient checked in',
        description: 'Robert Smith arrived for 10:30 AM appointment',
        user: doctor._id,
        patient: patients[1]._id,
        type: 'appointment',
        alert: false,
        relatedTo: {
          model: 'Appointment',
          id: appointments[1]._id,
        },
        createdAt: new Date(Date.now() - 25 * 60 * 1000), // 25 mins ago
      },
      {
        title: 'Prescription issued',
        description: 'Atorvastatin 20mg for David Wilson',
        user: doctor._id,
        type: 'prescription',
        alert: false,
        createdAt: new Date(Date.now() - 45 * 60 * 1000), // 45 mins ago
      },
      {
        title: 'Critical lab alert',
        description: 'Elevated potassium (5.8 mmol/L) for Michael Brown',
        user: doctor._id,
        patient: patients[3]._id,
        type: 'critical_alert',
        alert: true,
        relatedTo: {
          model: 'Patient',
          id: patients[3]._id,
        },
        createdAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
      },
      {
        title: 'Referral approved',
        description: 'Cardiology referral for Sophia Williams',
        user: doctor._id,
        patient: patients[2]._id,
        type: 'referral',
        alert: false,
        relatedTo: {
          model: 'Patient',
          id: patients[2]._id,
        },
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      },
      {
        title: 'Appointment rescheduled',
        description: 'Jessica Davis moved from 09/18 to 09/20',
        user: doctor._id,
        patient: patients[4]._id,
        type: 'appointment',
        alert: false,
        relatedTo: {
          model: 'Appointment',
          id: appointments[4]._id,
        },
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
      },
    ]);

    console.log(`Created ${activities.length} activities`);

    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

seed(); 