import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Appointment from '@/models/Appointment';
import Prescription from '@/models/Prescription';
import Patient from '@/models/Patient';
import Payment from '@/models/Payment';

export async function GET(request) {
  try {
    await dbConnect();
    
    // Get current month and previous month dates
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    
    // Fetch patient visits (appointments) for current month
    const currentMonthVisits = await Appointment.countDocuments({
      date: { $gte: currentMonthStart, $lte: now }
    });
    
    // Fetch patient visits for previous month
    const previousMonthVisits = await Appointment.countDocuments({
      date: { $gte: previousMonthStart, $lte: previousMonthEnd }
    });
    
    // Calculate visit change percentage
    const visitChangePercentage = previousMonthVisits > 0 
      ? Math.round(((currentMonthVisits - previousMonthVisits) / previousMonthVisits) * 100) 
      : 0;

    // Fetch revenue data from actual payments
    const currentMonthPayments = await Payment.find({
      $and: [
        {
          $or: [
            { date: { $gte: currentMonthStart, $lte: now } },
            { createdAt: { $gte: currentMonthStart, $lte: now } }
          ]
        },
        {
          status: { $in: ['Paid', 'Completed', 'paid'] }
        }
      ]
    });

    const previousMonthPayments = await Payment.find({
      $and: [
        {
          $or: [
            { date: { $gte: previousMonthStart, $lte: previousMonthEnd } },
            { createdAt: { $gte: previousMonthStart, $lte: previousMonthEnd } }
          ]
        },
        {
          status: { $in: ['Paid', 'Completed', 'paid'] }
        }
      ]
    });

    const currentMonthRevenue = currentMonthPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    const previousMonthRevenue = previousMonthPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);

    const revenueChangePercentage = previousMonthRevenue > 0 
      ? Math.round(((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100) 
      : 0;
    
    // Fetch average wait time from appointments
    const appointments = await Appointment.find({
      date: { $gte: currentMonthStart, $lte: now }
    });
    
    // Calculate actual wait time from appointments
    let totalWaitTime = 0;
    appointments.forEach(appointment => {
      // Use actual waitTime field if it exists, otherwise calculate it
      if (appointment.waitTime) {
        totalWaitTime += appointment.waitTime;
      } else if (appointment.actualStartTime && appointment.scheduledTime) {
        // Calculate wait time as the difference between actual and scheduled times in minutes
        const waitTimeMs = new Date(appointment.actualStartTime) - new Date(appointment.scheduledTime);
        const waitTimeMinutes = Math.max(0, Math.round(waitTimeMs / (1000 * 60)));
        totalWaitTime += waitTimeMinutes;
      }
    });
    
    const avgWaitTime = appointments.length > 0 ? Math.round(totalWaitTime / appointments.length) : 0;
    
    // Calculate wait time change percentage by getting previous month data
    const previousMonthAppointments = await Appointment.find({
      date: { $gte: previousMonthStart, $lte: previousMonthEnd }
    });
    
    let previousTotalWaitTime = 0;
    previousMonthAppointments.forEach(appointment => {
      if (appointment.waitTime) {
        previousTotalWaitTime += appointment.waitTime;
      } else if (appointment.actualStartTime && appointment.scheduledTime) {
        const waitTimeMs = new Date(appointment.actualStartTime) - new Date(appointment.scheduledTime);
        const waitTimeMinutes = Math.max(0, Math.round(waitTimeMs / (1000 * 60)));
        previousTotalWaitTime += waitTimeMinutes;
      }
    });
    
    const prevAvgWaitTime = previousMonthAppointments.length > 0 
      ? Math.round(previousTotalWaitTime / previousMonthAppointments.length)
      : 0;
    
    const waitTimeChangePercentage = prevAvgWaitTime > 0
      ? Math.round(((avgWaitTime - prevAvgWaitTime) / prevAvgWaitTime) * 100)
      : 0;
    
    // Fetch prescription count
    const currentMonthPrescriptions = await Prescription.countDocuments({
      createdAt: { $gte: currentMonthStart, $lte: now }
    });
    
    const previousMonthPrescriptions = await Prescription.countDocuments({
      createdAt: { $gte: previousMonthStart, $lte: previousMonthEnd }
    });
    
    const prescriptionChangePercentage = previousMonthPrescriptions > 0 
      ? Math.round(((currentMonthPrescriptions - previousMonthPrescriptions) / previousMonthPrescriptions) * 100) 
      : 0;
    
    // Fetch referral count from appointments
    const currentMonthReferrals = await Appointment.countDocuments({
      date: { $gte: currentMonthStart, $lte: now },
      referral: { $exists: true, $ne: null }
    });
    
    const previousMonthReferrals = await Appointment.countDocuments({
      date: { $gte: previousMonthStart, $lte: previousMonthEnd },
      referral: { $exists: true, $ne: null }
    });
    
    const referralChangePercentage = previousMonthReferrals > 0 
      ? Math.round(((currentMonthReferrals - previousMonthReferrals) / previousMonthReferrals) * 100) 
      : 0;
    
    // Construct metrics response
    const metrics = [
      {
        title: 'Patient Visits',
        value: currentMonthVisits.toString(),
        change: `${visitChangePercentage > 0 ? '+' : ''}${visitChangePercentage}%`,
        trend: visitChangePercentage >= 0 ? 'up' : 'down',
        color: 'from-blue-500 to-blue-600',
        icon: 'Users'
      },
      {
        title: 'Monthly Revenue',
        value: `$${currentMonthRevenue.toLocaleString()}`,
        change: `${revenueChangePercentage > 0 ? '+' : ''}${revenueChangePercentage}%`,
        trend: revenueChangePercentage >= 0 ? 'up' : 'down',
        color: 'from-green-500 to-green-600',
        icon: 'DollarSign'
      },
      {
        title: 'Avg. Wait Time',
        value: `${avgWaitTime} min`,
        change: `${waitTimeChangePercentage <= 0 ? '' : '+'}${waitTimeChangePercentage}%`,
        trend: waitTimeChangePercentage <= 0 ? 'down' : 'up',
        color: 'from-amber-500 to-amber-600',
        icon: 'Clock'
      },
      {
        title: 'Prescriptions',
        value: currentMonthPrescriptions.toString(),
        change: `${prescriptionChangePercentage > 0 ? '+' : ''}${prescriptionChangePercentage}%`,
        trend: prescriptionChangePercentage >= 0 ? 'up' : 'down',
        color: 'from-emerald-500 to-emerald-600',
        icon: 'FileText'
      }
    ];
    
    return NextResponse.json({ metrics });
  } catch (error) {
    console.error('Error fetching report metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch report metrics' },
      { status: 500 }
    );
  }
} 