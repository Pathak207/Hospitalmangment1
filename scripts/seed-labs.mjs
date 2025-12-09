import mongoose from 'mongoose';
import LabResult from '../models/LabResult.js';
import Patient from '../models/Patient.js';
import User from '../models/User.js';
import Organization from '../models/Organization.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function seedLabs() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get a sample organization, user, and patient
    const organization = await Organization.findOne();
    if (!organization) {
      console.log('No organization found. Please create an organization first.');
      return;
    }

    const user = await User.findOne({ organization: organization._id });
    if (!user) {
      console.log('No user found for this organization.');
      return;
    }

    const patient = await Patient.findOne({ organization: organization._id });
    if (!patient) {
      console.log('No patient found for this organization.');
      return;
    }

    console.log(`Using organization: ${organization.name}`);
    console.log(`Using user: ${user.name}`);
    console.log(`Using patient: ${patient.name}`);

    // Sample lab data
    const labData = [
      {
        organization: organization._id,
        patient: patient._id,
        orderedBy: user._id,
        testName: 'Complete Blood Count (CBC)',
        category: 'Hematology',
        status: 'Completed',
        urgency: 'Routine',
        orderedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        results: new Map([
          ['White Blood Cells', { value: '7.2', unit: 'K/uL', referenceRange: '4.0-11.0', flag: 'Normal' }],
          ['Red Blood Cells', { value: '4.5', unit: 'M/uL', referenceRange: '4.2-5.4', flag: 'Normal' }],
          ['Hemoglobin', { value: '14.2', unit: 'g/dL', referenceRange: '12.0-16.0', flag: 'Normal' }],
          ['Hematocrit', { value: '42.1', unit: '%', referenceRange: '36.0-46.0', flag: 'Normal' }],
          ['Platelets', { value: '285', unit: 'K/uL', referenceRange: '150-450', flag: 'Normal' }]
        ]),
        resultSummary: 'All values within normal limits. No signs of anemia or infection.',
        notes: 'Routine annual checkup. Patient feeling well.'
      },
      {
        organization: organization._id,
        patient: patient._id,
        orderedBy: user._id,
        testName: 'Basic Metabolic Panel',
        category: 'Chemistry',
        status: 'Completed',
        urgency: 'Routine',
        orderedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        results: new Map([
          ['Glucose', { value: '95', unit: 'mg/dL', referenceRange: '70-100', flag: 'Normal' }],
          ['Sodium', { value: '140', unit: 'mEq/L', referenceRange: '136-145', flag: 'Normal' }],
          ['Potassium', { value: '4.1', unit: 'mEq/L', referenceRange: '3.5-5.0', flag: 'Normal' }],
          ['Chloride', { value: '102', unit: 'mEq/L', referenceRange: '98-107', flag: 'Normal' }],
          ['BUN', { value: '18', unit: 'mg/dL', referenceRange: '7-20', flag: 'Normal' }],
          ['Creatinine', { value: '1.0', unit: 'mg/dL', referenceRange: '0.6-1.2', flag: 'Normal' }]
        ]),
        resultSummary: 'Normal kidney function and electrolyte balance.',
        notes: 'Follow-up for diabetes monitoring. Results are excellent.'
      },
      {
        organization: organization._id,
        patient: patient._id,
        orderedBy: user._id,
        testName: 'Lipid Panel',
        category: 'Chemistry',
        status: 'Pending',
        urgency: 'Routine',
        orderedAt: new Date(), // Today
        notes: 'Cardiovascular risk assessment. Patient has family history of heart disease.'
      },
      {
        organization: organization._id,
        patient: patient._id,
        orderedBy: user._id,
        testName: 'Thyroid Function Tests',
        category: 'Endocrinology',
        status: 'In Progress',
        urgency: 'Urgent',
        orderedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        notes: 'Patient reporting fatigue and weight changes. Checking thyroid function.'
      },
      {
        organization: organization._id,
        patient: patient._id,
        orderedBy: user._id,
        testName: 'Urinalysis',
        category: 'Microbiology',
        status: 'Completed',
        urgency: 'STAT',
        orderedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        results: new Map([
          ['Color', { value: 'Yellow', unit: '', referenceRange: 'Yellow', flag: 'Normal' }],
          ['Clarity', { value: 'Clear', unit: '', referenceRange: 'Clear', flag: 'Normal' }],
          ['Specific Gravity', { value: '1.020', unit: '', referenceRange: '1.003-1.030', flag: 'Normal' }],
          ['Protein', { value: 'Negative', unit: '', referenceRange: 'Negative', flag: 'Normal' }],
          ['Glucose', { value: 'Negative', unit: '', referenceRange: 'Negative', flag: 'Normal' }],
          ['Bacteria', { value: 'Few', unit: '', referenceRange: 'Few', flag: 'Normal' }]
        ]),
        resultSummary: 'Normal urinalysis. No signs of infection or kidney issues.',
        notes: 'STAT order due to patient symptoms. Results are reassuring.'
      }
    ];

    // Clear existing lab data for this organization
    await LabResult.deleteMany({ organization: organization._id });
    console.log('Cleared existing lab data');

    // Insert new lab data
    const createdLabs = await LabResult.insertMany(labData);
    console.log(`Created ${createdLabs.length} lab results`);

    // Display created labs
    createdLabs.forEach((lab, index) => {
      console.log(`${index + 1}. ${lab.testName} - ${lab.status} (${lab.urgency})`);
    });

  } catch (error) {
    console.error('Error seeding labs:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seeding function
seedLabs(); 