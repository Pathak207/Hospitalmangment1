import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { validateFeatureAccess } from '@/lib/subscription-utils';
import PatientModel from '@/models/Patient';
import AppointmentModel from '@/models/Appointment';
import PrescriptionModel from '@/models/Prescription';
import LabResultModel from '@/models/LabResult';
import ClinicalNoteModel from '@/models/ClinicalNote';
import PaymentModel from '@/models/Payment';
import VitalsModel from '@/models/Vitals';
import ActivityModel from '@/models/Activity';
import UserModel from '@/models/User';
import OrganizationModel from '@/models/Organization';

// GET - Generate and download organization data backup
export async function GET(request) {
  try {
    const session = await getAuthSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Super admin cannot access organization-specific backups
    if (session.user.role === 'super_admin') {
      return NextResponse.json({ error: 'Super admin cannot access organization backups' }, { status: 403 });
    }

    if (!session.user.organization) {
      return NextResponse.json({ error: 'No organization associated with user' }, { status: 403 });
    }

    await dbConnect();

    const organizationId = session.user.organization;
    
    // Get organization details first to check trial status
    const organization = await OrganizationModel.findById(organizationId)
      .populate('subscription', 'status')
      .select('name email phone address subscription');
    
    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Check if user has access to data backup feature (skip for trial accounts)
    const isTrialAccount = organization?.subscription?.status === 'trial' || 
                          organization?.subscription?.status === 'trialing' ||
                          !organization?.subscription; // New accounts without subscription are also considered trial
    
    if (!isTrialAccount) {
      try {
        const hasAccess = await validateFeatureAccess(session.user.organization, 'dataBackup');
        if (!hasAccess) {
          return NextResponse.json({ 
            error: 'Data backup feature not available in your subscription plan',
            code: 'FEATURE_NOT_AVAILABLE',
            feature: 'dataBackup'
          }, { status: 403 });
        }
      } catch (error) {
        return NextResponse.json({ 
          error: error.message,
          code: 'SUBSCRIPTION_CHECK_FAILED'
        }, { status: 403 });
      }
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json'; // json or csv

    // Get all users in the organization
    const orgUsers = await UserModel.find({ organization: organizationId }).select('_id');
    const userIds = orgUsers.map(user => user._id);

    // Fetch all organization data
    const [
      patients,
      appointments,
      prescriptions,
      labResults,
      clinicalNotes,
      payments,
      vitals,
      activities,
      users
    ] = await Promise.all([
      PatientModel.find({ organization: organizationId }).lean(),
      AppointmentModel.find({ doctor: { $in: userIds } }).populate('patient', 'name patientId').lean(),
      PrescriptionModel.find({ doctor: { $in: userIds } }).populate('patient', 'name patientId').lean(),
      LabResultModel.find({ orderedBy: { $in: userIds } }).populate('patient', 'name patientId').lean(),
      ClinicalNoteModel.find({ author: { $in: userIds } }).populate('patient', 'name patientId').lean(),
      PaymentModel.find({ organization: organizationId }).populate('patient', 'name patientId').lean(),
      VitalsModel.find({ organization: organizationId }).populate('patient', 'name patientId').lean(),
      ActivityModel.find({ organization: organizationId }).lean(),
      UserModel.find({ organization: organizationId }).select('-password').lean()
    ]);

    // Create backup data structure
    const backupData = {
      metadata: {
        organizationName: organization.name,
        exportDate: new Date().toISOString(),
        exportedBy: session.user.name,
        version: '1.0',
        recordCounts: {
          patients: patients.length,
          appointments: appointments.length,
          prescriptions: prescriptions.length,
          labResults: labResults.length,
          clinicalNotes: clinicalNotes.length,
          payments: payments.length,
          vitals: vitals.length,
          activities: activities.length,
          users: users.length
        }
      },
      organization: organization,
      data: {
        patients,
        appointments,
        prescriptions,
        labResults,
        clinicalNotes,
        payments,
        vitals,
        activities,
        users
      }
    };

    if (format === 'csv') {
      // Generate CSV format
      const csvData = generateCSVBackup(backupData);
      
      return new NextResponse(csvData, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="backup-${organization.name.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    } else {
      // Generate JSON format
      const jsonData = JSON.stringify(backupData, null, 2);
      
      return new NextResponse(jsonData, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="backup-${organization.name.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.json"`
        }
      });
    }

  } catch (error) {
    console.error('Error generating backup:', error);
    return NextResponse.json({ 
      error: 'Failed to generate backup',
      details: error.message 
    }, { status: 500 });
  }
}

// Helper function to generate CSV backup
function generateCSVBackup(backupData) {
  const { data } = backupData;
  let csvContent = '';
  
  // Add metadata
  csvContent += `Backup Export Report\n`;
  csvContent += `Organization: ${backupData.metadata.organizationName}\n`;
  csvContent += `Export Date: ${backupData.metadata.exportDate}\n`;
  csvContent += `Exported By: ${backupData.metadata.exportedBy}\n\n`;
  
  // Add record counts
  csvContent += `Record Counts:\n`;
  Object.entries(backupData.metadata.recordCounts).forEach(([key, count]) => {
    csvContent += `${key}: ${count}\n`;
  });
  csvContent += `\n`;
  
  // Add patients data
  if (data.patients.length > 0) {
    csvContent += `PATIENTS\n`;
    csvContent += `Patient ID,Name,Email,Phone,Date of Birth,Gender,Address,Emergency Contact\n`;
    data.patients.forEach(patient => {
      const address = patient.address ? `"${patient.address.street || ''} ${patient.address.city || ''} ${patient.address.state || ''} ${patient.address.zipCode || ''}"` : '';
      const emergencyContact = patient.emergencyContact ? `"${patient.emergencyContact.name || ''} - ${patient.emergencyContact.phone || ''}"` : '';
      csvContent += `${patient.patientId || ''},${patient.name || ''},${patient.email || ''},${patient.contactNumber || ''},${patient.dateOfBirth || ''},${patient.gender || ''},${address},${emergencyContact}\n`;
    });
    csvContent += `\n`;
  }
  
  // Add appointments data
  if (data.appointments.length > 0) {
    csvContent += `APPOINTMENTS\n`;
    csvContent += `Date,Time,Patient,Type,Status,Notes\n`;
    data.appointments.forEach(appointment => {
      const patientName = appointment.patient?.name || 'Unknown';
      csvContent += `${appointment.date || ''},${appointment.time || ''},${patientName},${appointment.type || ''},${appointment.status || ''},"${appointment.notes || ''}"\n`;
    });
    csvContent += `\n`;
  }
  
  // Add prescriptions data
  if (data.prescriptions.length > 0) {
    csvContent += `PRESCRIPTIONS\n`;
    csvContent += `Patient,Medication,Dosage,Frequency,Duration,Instructions,Status\n`;
    data.prescriptions.forEach(prescription => {
      const patientName = prescription.patient?.name || 'Unknown';
      csvContent += `${patientName},${prescription.medication || ''},${prescription.dosage || ''},${prescription.frequency || ''},${prescription.duration || ''},"${prescription.instructions || ''}",${prescription.status || ''}\n`;
    });
    csvContent += `\n`;
  }
  
  // Add lab results data
  if (data.labResults.length > 0) {
    csvContent += `LAB RESULTS\n`;
    csvContent += `Patient,Test Name,Result,Reference Range,Status,Ordered Date,Completed Date,Ordered By\n`;
    data.labResults.forEach(lab => {
      const patientName = lab.patient?.name || 'Unknown';
      csvContent += `${patientName},"${lab.testName || ''}","${lab.result || ''}","${lab.referenceRange || ''}",${lab.status || ''},${lab.orderedAt || ''},${lab.completedAt || ''},${lab.orderedBy?.name || ''}\n`;
    });
    csvContent += `\n`;
  }
  
  // Add clinical notes data
  if (data.clinicalNotes.length > 0) {
    csvContent += `CLINICAL NOTES\n`;
    csvContent += `Patient,Type,Title,Content,Author,Date,Private\n`;
    data.clinicalNotes.forEach(note => {
      const patientName = note.patient?.name || 'Unknown';
      const content = (note.content || '').replace(/"/g, '""'); // Escape quotes in content
      csvContent += `${patientName},${note.type || ''},"${note.title || ''}","${content}",${note.author?.name || ''},${note.createdAt || ''},${note.private ? 'Yes' : 'No'}\n`;
    });
    csvContent += `\n`;
  }
  
  // Add payments data
  if (data.payments.length > 0) {
    csvContent += `PAYMENTS\n`;
    csvContent += `Patient,Patient ID,Amount,Method,Description,Status,Date,Transaction ID\n`;
    data.payments.forEach(payment => {
      const patientName = payment.patient?.name || 'Unknown';
      const patientId = payment.patient?.patientId || '';
      csvContent += `${patientName},${patientId},${payment.amount || ''},${payment.paymentMethod || ''},"${payment.description || ''}",${payment.status || ''},${payment.date || ''},${payment.transactionId || ''}\n`;
    });
    csvContent += `\n`;
  }
  
  // Add vitals data
  if (data.vitals.length > 0) {
    csvContent += `VITALS\n`;
    csvContent += `Patient,Blood Pressure (Systolic),Blood Pressure (Diastolic),Heart Rate,Temperature,Weight,Height,BMI,Recorded Date,Recorded By\n`;
    data.vitals.forEach(vital => {
      const patientName = vital.patient?.name || 'Unknown';
      const systolic = vital.bloodPressure?.systolic || '';
      const diastolic = vital.bloodPressure?.diastolic || '';
      csvContent += `${patientName},${systolic},${diastolic},${vital.heartRate || ''},${vital.temperature || ''},${vital.weight || ''},${vital.height || ''},${vital.bmi || ''},${vital.recordedAt || ''},${vital.recordedBy?.name || ''}\n`;
    });
    csvContent += `\n`;
  }
  
  // Add activities data
  if (data.activities.length > 0) {
    csvContent += `ACTIVITIES\n`;
    csvContent += `Title,Description,Type,User,Patient,Date,Alert\n`;
    data.activities.forEach(activity => {
      const description = (activity.description || '').replace(/"/g, '""'); // Escape quotes
      csvContent += `"${activity.title || ''}","${description}",${activity.type || ''},${activity.user?.name || ''},${activity.patient?.name || ''},${activity.createdAt || ''},${activity.alert ? 'Yes' : 'No'}\n`;
    });
    csvContent += `\n`;
  }
  
  // Add users data
  if (data.users.length > 0) {
    csvContent += `USERS\n`;
    csvContent += `Name,Email,Role,Phone,Specialization,License Number,Department,Active,Last Login,Created Date\n`;
    data.users.forEach(user => {
      csvContent += `${user.name || ''},${user.email || ''},${user.role || ''},${user.phone || ''},${user.specialization || ''},${user.licenseNumber || ''},${user.department || ''},${user.isActive ? 'Yes' : 'No'},${user.lastLogin || ''},${user.createdAt || ''}\n`;
    });
    csvContent += `\n`;
  }
  
  return csvContent;
}

// POST - Request backup generation (for async processing if needed)
export async function POST(request) {
  try {
    const session = await getAuthSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role === 'super_admin') {
      return NextResponse.json({ error: 'Super admin cannot access organization backups' }, { status: 403 });
    }

    if (!session.user.organization) {
      return NextResponse.json({ error: 'No organization associated with user' }, { status: 403 });
    }

    await dbConnect();

    const organizationId = session.user.organization;
    
    // Get organization details first to check trial status
    const organization = await OrganizationModel.findById(organizationId)
      .populate('subscription', 'status')
      .select('name subscription');
    
    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Check if user has access to data backup feature (skip for trial accounts)
    const isTrialAccount = organization?.subscription?.status === 'trial' || 
                          organization?.subscription?.status === 'trialing' ||
                          !organization?.subscription; // New accounts without subscription are also considered trial
    
    if (!isTrialAccount) {
      try {
        const hasAccess = await validateFeatureAccess(session.user.organization, 'dataBackup');
        if (!hasAccess) {
          return NextResponse.json({ 
            error: 'Data backup feature not available in your subscription plan',
            code: 'FEATURE_NOT_AVAILABLE',
            feature: 'dataBackup'
          }, { status: 403 });
        }
      } catch (error) {
        return NextResponse.json({ 
          error: error.message,
          code: 'SUBSCRIPTION_CHECK_FAILED'
        }, { status: 403 });
      }
    }

    // Get basic stats for backup preview
    const orgUsers = await UserModel.find({ organization: organizationId }).select('_id');
    const userIds = orgUsers.map(user => user._id);

    const [
      patientCount,
      appointmentCount,
      prescriptionCount,
      labResultCount,
      clinicalNoteCount,
      paymentCount,
      vitalCount,
      activityCount,
      userCount
    ] = await Promise.all([
      PatientModel.countDocuments({ organization: organizationId }),
      AppointmentModel.countDocuments({ doctor: { $in: userIds } }),
      PrescriptionModel.countDocuments({ doctor: { $in: userIds } }),
      LabResultModel.countDocuments({ orderedBy: { $in: userIds } }),
      ClinicalNoteModel.countDocuments({ author: { $in: userIds } }),
      PaymentModel.countDocuments({ organization: organizationId }),
      VitalsModel.countDocuments({ organization: organizationId }),
      ActivityModel.countDocuments({ organization: organizationId }),
      UserModel.countDocuments({ organization: organizationId })
    ]);

    return NextResponse.json({
      success: true,
      message: 'Backup preview generated successfully',
      preview: {
        organizationName: organization.name,
        recordCounts: {
          patients: patientCount,
          appointments: appointmentCount,
          prescriptions: prescriptionCount,
          labResults: labResultCount,
          clinicalNotes: clinicalNoteCount,
          payments: paymentCount,
          vitals: vitalCount,
          activities: activityCount,
          users: userCount
        },
        totalRecords: patientCount + appointmentCount + prescriptionCount + labResultCount + clinicalNoteCount + paymentCount + vitalCount + activityCount + userCount
      }
    });

  } catch (error) {
    console.error('Error generating backup preview:', error);
    return NextResponse.json({ 
      error: 'Failed to generate backup preview',
      details: error.message 
    }, { status: 500 });
  }
} 