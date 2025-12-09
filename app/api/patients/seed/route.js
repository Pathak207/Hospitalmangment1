import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import PatientModel from '@/models/Patient';

export async function POST(request) {
  try {
    await dbConnect();
    
    // Sample patients with dob and bloodType
    const samplePatients = [
      {
        name: 'John Doe',
        email: 'john.doe@example.com',
        contactNumber: '+1-555-0123',
        dob: new Date('1985-03-15'),
        age: 39,
        gender: 'male',
        bloodType: 'A+',
        address: '123 Main St, Anytown, USA',
        allergies: ['Penicillin', 'Shellfish'],
        medicalHistory: ['Hypertension', 'Diabetes Type 2']
      },
      {
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        contactNumber: '+1-555-0124',
        dob: new Date('1992-07-22'),
        age: 32,
        gender: 'female',
        bloodType: 'O-',
        address: '456 Oak Ave, Somewhere, USA',
        allergies: ['Latex'],
        medicalHistory: ['Asthma']
      },
      {
        name: 'Robert Johnson',
        email: 'robert.johnson@example.com',
        contactNumber: '+1-555-0125',
        dob: new Date('1978-11-08'),
        age: 45,
        gender: 'male',
        bloodType: 'B+',
        address: '789 Pine St, Elsewhere, USA',
        allergies: [],
        medicalHistory: ['High Cholesterol']
      }
    ];
    
    // Add unique patient IDs
    for (let i = 0; i < samplePatients.length; i++) {
      const count = await PatientModel.countDocuments();
      samplePatients[i].patientId = `PAT-${(1000 + count + i + 1).toString()}`;
    }
    
    // Check if patients already exist
    const existingPatients = await PatientModel.find({
      email: { $in: samplePatients.map(p => p.email) }
    });
    
    if (existingPatients.length > 0) {
      return NextResponse.json({
        message: 'Sample patients already exist',
        existing: existingPatients.map(p => ({ name: p.name, email: p.email }))
      });
    }
    
    // Create the patients
    const createdPatients = await PatientModel.insertMany(samplePatients);
    
    return NextResponse.json({
      message: 'Sample patients created successfully',
      patients: createdPatients.map(p => ({
        id: p._id,
        name: p.name,
        email: p.email,
        patientId: p.patientId,
        dob: p.dob,
        bloodType: p.bloodType
      }))
    });
    
  } catch (error) {
    console.error('Error seeding patients:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 