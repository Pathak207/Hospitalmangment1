const mongoose = require('mongoose');
const { Schema } = mongoose;
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Please define the MONGODB_URI environment variable in your .env.local file');
  process.exit(1);
}

const MedicationSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  genericName: {
    type: String,
  },
  category: {
    type: String,
  },
  formulation: {
    type: String,
    enum: ['Tablet', 'Capsule', 'Liquid', 'Injection', 'Topical', 'Inhalation', 'Other'],
    required: true,
  },
  strength: {
    type: String,
    required: true,
  },
  manufacturer: {
    type: String,
  },
  description: {
    type: String,
  },
  sideEffects: {
    type: [String],
    default: [],
  },
  contraindications: {
    type: [String],
    default: [],
  },
  interactions: {
    type: [String],
    default: [],
  },
  warnings: {
    type: [String],
    default: [],
  },
  commonDosages: {
    type: [String],
    default: [],
  },
  requiresPrescription: {
    type: Boolean,
    default: true,
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

// Use an existing model if available, or create a new one
let Medication;
try {
  Medication = mongoose.model('Medication');
} catch (error) {
  Medication = mongoose.model('Medication', MedicationSchema);
}

const sampleMedications = [
  {
    name: 'Lisinopril',
    genericName: 'Lisinopril',
    category: 'Antihypertensive',
    formulation: 'Tablet',
    strength: '10mg',
    manufacturer: 'Various',
    description: 'ACE inhibitor used to treat high blood pressure and heart failure',
    sideEffects: ['Dry cough', 'Dizziness', 'Headache', 'Fatigue'],
    contraindications: ['Pregnancy', 'History of angioedema'],
    interactions: ['NSAIDs', 'Potassium supplements', 'Lithium'],
    warnings: ['Monitor renal function', 'May cause hyperkalemia'],
    commonDosages: ['10mg once daily', '20mg once daily', '40mg once daily'],
    requiresPrescription: true
  },
  {
    name: 'Metformin',
    genericName: 'Metformin',
    category: 'Antidiabetic',
    formulation: 'Tablet',
    strength: '500mg',
    manufacturer: 'Various',
    description: 'First-line medication for the treatment of type 2 diabetes',
    sideEffects: ['Diarrhea', 'Nausea', 'Abdominal discomfort', 'Metallic taste'],
    contraindications: ['Renal impairment', 'Metabolic acidosis'],
    interactions: ['Cimetidine', 'Contrast media', 'Alcohol'],
    warnings: ['Lactic acidosis risk', 'Discontinue before radiologic studies with contrast'],
    commonDosages: ['500mg twice daily', '850mg twice daily', '1000mg twice daily'],
    requiresPrescription: true
  },
  {
    name: 'Atorvastatin',
    genericName: 'Atorvastatin',
    category: 'Statin',
    formulation: 'Tablet',
    strength: '20mg',
    manufacturer: 'Various',
    description: 'HMG-CoA reductase inhibitor used to lower blood cholesterol levels',
    sideEffects: ['Muscle pain', 'Fatigue', 'Digestive problems', 'Liver enzyme elevation'],
    contraindications: ['Liver disease', 'Pregnancy'],
    interactions: ['Grapefruit juice', 'Cyclosporine', 'Macrolide antibiotics'],
    warnings: ['Monitor liver function', 'Report unexplained muscle pain'],
    commonDosages: ['10mg once daily', '20mg once daily', '40mg once daily'],
    requiresPrescription: true
  },
  {
    name: 'Albuterol',
    genericName: 'Salbutamol',
    category: 'Bronchodilator',
    formulation: 'Inhalation',
    strength: '100mcg/puff',
    manufacturer: 'Various',
    description: 'Short-acting beta-agonist used to treat asthma and COPD',
    sideEffects: ['Tremor', 'Nervousness', 'Tachycardia', 'Headache'],
    contraindications: ['Hypersensitivity to albuterol'],
    interactions: ['Beta-blockers', 'MAO inhibitors', 'Tricyclic antidepressants'],
    warnings: ['Paradoxical bronchospasm', 'Cardiovascular effects'],
    commonDosages: ['1-2 puffs every 4-6 hours as needed'],
    requiresPrescription: true
  },
  {
    name: 'Amoxicillin',
    genericName: 'Amoxicillin',
    category: 'Antibiotic',
    formulation: 'Capsule',
    strength: '500mg',
    manufacturer: 'Various',
    description: 'Penicillin antibiotic used to treat bacterial infections',
    sideEffects: ['Diarrhea', 'Nausea', 'Rash', 'Vomiting'],
    contraindications: ['Penicillin allergy', 'Mononucleosis'],
    interactions: ['Probenecid', 'Oral contraceptives', 'Allopurinol'],
    warnings: ['Clostridium difficile-associated diarrhea', 'Hypersensitivity reactions'],
    commonDosages: ['250mg three times daily', '500mg three times daily', '875mg twice daily'],
    requiresPrescription: true
  },
  {
    name: 'Levothyroxine',
    genericName: 'Levothyroxine Sodium',
    category: 'Thyroid Hormone',
    formulation: 'Tablet',
    strength: '50mcg',
    manufacturer: 'Various',
    description: 'Synthetic thyroid hormone used to treat hypothyroidism',
    sideEffects: ['Weight loss', 'Increased appetite', 'Tremors', 'Insomnia'],
    contraindications: ['Uncorrected adrenal insufficiency', 'Acute myocardial infarction'],
    interactions: ['Calcium supplements', 'Iron supplements', 'Antacids'],
    warnings: ['Take on empty stomach', 'Monitor thyroid function tests'],
    commonDosages: ['25-100mcg once daily depending on TSH levels'],
    requiresPrescription: true
  },
  {
    name: 'Amlodipine',
    genericName: 'Amlodipine',
    category: 'Calcium Channel Blocker',
    formulation: 'Tablet',
    strength: '5mg',
    manufacturer: 'Various',
    description: 'Calcium channel blocker used to treat hypertension and angina',
    sideEffects: ['Edema', 'Flushing', 'Headache', 'Dizziness'],
    contraindications: ['Severe hypotension', 'Aortic stenosis'],
    interactions: ['Simvastatin', 'CYP3A4 inhibitors', 'Grapefruit juice'],
    warnings: ['May cause reflex tachycardia', 'Peripheral edema'],
    commonDosages: ['2.5mg once daily', '5mg once daily', '10mg once daily'],
    requiresPrescription: true
  },
  {
    name: 'Sertraline',
    genericName: 'Sertraline',
    category: 'SSRI Antidepressant',
    formulation: 'Tablet',
    strength: '50mg',
    manufacturer: 'Various',
    description: 'Selective serotonin reuptake inhibitor used to treat depression and anxiety disorders',
    sideEffects: ['Nausea', 'Insomnia', 'Diarrhea', 'Sexual dysfunction'],
    contraindications: ['MAO inhibitor use within 14 days', 'Pimozide treatment'],
    interactions: ['NSAIDs', 'Warfarin', 'Other serotonergic drugs'],
    warnings: ['Suicidal thoughts in young adults', 'Serotonin syndrome', 'Activation of mania/hypomania'],
    commonDosages: ['50mg once daily', '100mg once daily', '200mg once daily'],
    requiresPrescription: true
  },
  {
    name: 'Omeprazole',
    genericName: 'Omeprazole',
    category: 'Proton Pump Inhibitor',
    formulation: 'Capsule',
    strength: '20mg',
    manufacturer: 'Various',
    description: 'Proton pump inhibitor used to treat acid reflux and gastric ulcers',
    sideEffects: ['Headache', 'Abdominal pain', 'Diarrhea', 'Nausea'],
    contraindications: ['Hypersensitivity to proton pump inhibitors'],
    interactions: ['Clopidogrel', 'Diazepam', 'Phenytoin'],
    warnings: ['May increase risk of fractures', 'May increase risk of C. difficile infection'],
    commonDosages: ['20mg once daily', '40mg once daily'],
    requiresPrescription: true
  },
  {
    name: 'Furosemide',
    genericName: 'Furosemide',
    category: 'Loop Diuretic',
    formulation: 'Tablet',
    strength: '40mg',
    manufacturer: 'Various',
    description: 'Loop diuretic used to treat fluid overload and edema',
    sideEffects: ['Electrolyte imbalance', 'Dehydration', 'Dizziness', 'Increased urination'],
    contraindications: ['Anuria', 'Severe electrolyte depletion'],
    interactions: ['Lithium', 'Aminoglycoside antibiotics', 'NSAIDs'],
    warnings: ['Monitor electrolytes', 'Monitor renal function'],
    commonDosages: ['20mg once daily', '40mg once daily', '80mg once daily'],
    requiresPrescription: true
  }
];

async function seedMedications() {
  let connection = null;
  
  try {
    console.log('Connecting to MongoDB...');
    connection = await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully');

    // Check for existing medications
    const count = await Medication.countDocuments();
    console.log(`Found ${count} existing medications in database`);
    
    if (count > 0) {
      const shouldContinue = process.argv.includes('--force');
      if (!shouldContinue) {
        console.log('Database already has medications. Use --force to clear and reseed.');
        return;
      }
      
      // Clear existing medications
      await Medication.deleteMany({});
      console.log('Cleared existing medications');
    }

    // Add sample medications
    const medications = await Medication.create(sampleMedications);
    console.log(`Created ${medications.length} medications successfully`);

  } catch (error) {
    console.error('Error seeding medications:');
    console.error(error);
    process.exit(1);
  } finally {
    if (connection) {
      await mongoose.disconnect();
      console.log('Disconnected from MongoDB');
    }
    process.exit(0);
  }
}

seedMedications(); 