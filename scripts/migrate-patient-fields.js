/**
 * Migration script to add missing dob and bloodType fields to existing patients
 * Run with: node scripts/migrate-patient-fields.js
 */

const mongoose = require('mongoose');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/doctorcare');
    console.log('📡 Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

// Patient Schema (simplified version)
const PatientSchema = new mongoose.Schema({
  name: String,
  age: Number,
  dob: Date,
  gender: String,
  bloodType: String,
  // ... other fields
}, { strict: false }); // Allow additional fields

const Patient = mongoose.model('Patient', PatientSchema);

async function migratePatientFields() {
  try {
    console.log('🚀 Starting patient field migration...');
    
    await connectDB();
    
    // Find all patients
    const patients = await Patient.find({});
    console.log(`📊 Found ${patients.length} patients to check`);
    
    let updatedCount = 0;
    
    for (const patient of patients) {
      const updates = {};
      let needsUpdate = false;
      
      // If no dob field exists, calculate it from age if available
      if (!patient.dob && patient.age) {
        const currentYear = new Date().getFullYear();
        const birthYear = currentYear - patient.age;
        const estimatedDob = new Date(birthYear, 0, 1); // January 1st of birth year
        updates.dob = estimatedDob;
        needsUpdate = true;
        console.log(`  📅 Adding estimated DOB for ${patient.name}: ${estimatedDob.toISOString().split('T')[0]}`);
      }
      
      // If no bloodType field exists, leave it empty (user can fill it later)
      if (!patient.bloodType) {
        // Don't set a default blood type, leave it null so user can choose
        console.log(`  🩸 Patient ${patient.name} missing blood type (will remain empty)`);
      }
      
      // If gender field has wrong case, fix it
      if (patient.gender && typeof patient.gender === 'string') {
        const lowerGender = patient.gender.toLowerCase();
        if (patient.gender !== lowerGender && ['male', 'female', 'other'].includes(lowerGender)) {
          updates.gender = lowerGender;
          needsUpdate = true;
          console.log(`  ⚧️ Fixing gender case for ${patient.name}: ${patient.gender} -> ${lowerGender}`);
        }
      }
      
      // Apply updates if needed
      if (needsUpdate) {
        await Patient.findByIdAndUpdate(patient._id, { $set: updates });
        updatedCount++;
        console.log(`  ✅ Updated ${patient.name}`);
      }
    }
    
    console.log(`🎉 Migration completed! Updated ${updatedCount} patients`);
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the migration if this file is executed directly
if (require.main === module) {
  migratePatientFields();
}

module.exports = migratePatientFields; 