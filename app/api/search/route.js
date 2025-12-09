import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Patient from '@/models/Patient';
import Appointment from '@/models/Appointment';
import Medication from '@/models/Medication';
import Prescription from '@/models/Prescription';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    
    if (!query) {
      return NextResponse.json(
        { 
          patients: [], 
          appointments: [], 
          medications: [], 
          prescriptions: [] 
        }, 
        { status: 200 }
      );
    }

    await dbConnect();
    
    // Prepare the search regex - case insensitive search
    const searchRegex = new RegExp(query, 'i');
    
    // Search across various collections in parallel
    const [patients, appointments, medications, prescriptions] = await Promise.all([
      // Search patients by name, email, phone, etc.
      Patient.find({
        $or: [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { email: searchRegex },
          { phoneNumber: searchRegex },
          { medicalRecordNumber: searchRegex },
          { notes: searchRegex }
        ]
      }).limit(10).lean(),
      
      // Search appointments by title, patient name, notes, etc.
      Appointment.find({
        $or: [
          { title: searchRegex },
          { patientName: searchRegex },
          { doctorName: searchRegex },
          { notes: searchRegex },
          { status: searchRegex }
        ]
      }).limit(10).lean(),
      
      // Search medications by name, description, etc.
      Medication.find({
        $or: [
          { name: searchRegex },
          { description: searchRegex },
          { category: searchRegex },
          { manufacturer: searchRegex }
        ]
      }).limit(10).lean(),
      
      // Search prescriptions by medication name, patient name, etc.
      Prescription.find({
        $or: [
          { medicationName: searchRegex },
          { patientName: searchRegex },
          { doctorName: searchRegex },
          { notes: searchRegex }
        ]
      }).limit(10).lean()
    ]);
    
    return NextResponse.json({
      patients,
      appointments,
      medications,
      prescriptions
    }, { status: 200 });
    
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 