import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getAuthSession } from '@/lib/auth';
import PatientModel from '@/models/Patient';
import AppointmentModel from '@/models/Appointment';
import TaskModel from '@/models/Task';
import ActivityModel from '@/models/Activity';
import UserModel from '@/models/User';
import PaymentModel from '@/models/Payment';
import LabResultModel from '@/models/LabResult';
import mongoose from 'mongoose';

// Add in-memory cache with shorter expiration for real-time updates
const CACHE_TTL = 10 * 1000; // 10 seconds in milliseconds for real-time feel
const cache = new Map();

function getCacheKey(userId) {
  return `dashboard_${userId}_${Math.floor(Date.now() / CACHE_TTL)}`;
}

export async function GET(request) {
  try {
    // Check authentication
    const session = await getAuthSession();
    
    console.log('Dashboard GET - Session:', session);
    
    if (!session) {
      console.log('Dashboard GET - No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const doctorId = session.user.id;
    console.log('Dashboard GET - User ID:', doctorId);
    
    // Check for force refresh parameter
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';
    
    // Check cache first (unless force refresh is requested)
    const cacheKey = getCacheKey(doctorId);
    if (!forceRefresh && cache.has(cacheKey)) {
      console.log('Dashboard GET - Returning cached data');
      return NextResponse.json(cache.get(cacheKey));
    }
    
    await dbConnect();
    
    // Get today's date (start and end)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Get yesterday's date
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Use Promise.all to parallelize database queries
    const [
      patientsToday,
      patientsYesterday,
      pendingLabResults,
      prescriptionsToday,
      revenueToday,
      appointments,
      tasks
    ] = await Promise.all([
      // Count patients today
      AppointmentModel.countDocuments({
        doctor: doctorId,
        date: {
          $gte: today,
          $lt: tomorrow
        }
      }),
      
      // Count patients yesterday
      AppointmentModel.countDocuments({
        doctor: doctorId,
        date: {
          $gte: yesterday,
          $lt: today
        }
      }),
      
      // Count pending lab results - Use actual lab results instead of tasks
      LabResultModel.countDocuments({
        orderedBy: new mongoose.Types.ObjectId(doctorId),
        status: { $in: ['Ordered', 'In Progress'] }
      }),
      
      // Count prescriptions today
      ActivityModel.countDocuments({
        user: doctorId,
        type: 'prescription',
        createdAt: {
          $gte: today,
          $lt: tomorrow
        }
      }),
      
      // Calculate revenue today from appointment payments only (exclude subscription payments)
      PaymentModel.aggregate([
        {
          $match: {
            organization: new mongoose.Types.ObjectId(session.user.organization),
            appointment: { $ne: null }, // Only appointment payments
            date: {
              $gte: today,
              $lt: tomorrow
            },
            status: 'Completed'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]).then(result => result.length > 0 ? result[0].total : 0),
      
      // Get today's appointments - optimize fields
      AppointmentModel.find({
        doctor: doctorId,
        date: {
          $gte: today,
          $lt: tomorrow
        }
      })
      .sort({ date: 1, time: 1 })
      .populate({
        path: 'patient',
        select: 'name patientId age vitals' // Select only needed fields
      })
      .limit(5)
      .lean(), // Use lean() to get plain javascript objects (faster)
      
      // Get pending tasks
      TaskModel.find({
        assignedTo: doctorId,
        status: 'Pending'
      })
      .sort({ dueDate: 1, priority: -1 })
      .populate({
        path: 'patient',
        select: 'name' // Select only the name field
      })
      .limit(4)
      .lean() // Use lean() for better performance
    ]);
    
    // Get patient IDs from appointments for activities query
    const patientIds = appointments.map(a => a.patient._id);
    
    // Get recent activities and payments in parallel
    const [activities, recentPayments] = await Promise.all([
      // Get regular activities
      ActivityModel.find({
        organization: session.user.organization,
      })
      .sort({ createdAt: -1 })
      .limit(8) // Increased since we're not mixing with payment activities
      .lean(),
      
      // Get recent appointment payments for this organization (excluding subscription payments)
      PaymentModel.find({
        organization: session.user.organization,
        // Only include appointment-related payments, not subscription payments
        appointment: { $ne: null }
      })
      .populate('patient', 'name')
      .populate('appointment')
      .sort({ createdAt: -1 })
      .limit(4) // Get recent appointment payments only
      .lean()
    ]);
    
    // Format appointments
    const formattedAppointments = appointments.map(appt => {
      return {
        id: appt._id.toString(),
        patient: appt.patient.name,
        patientId: appt.patient.patientId,
        age: appt.patient.age,
        avatar: appt.patient.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
        date: appt.date,
        time: appt.time,
        type: appt.type,
        reason: appt.reason,
        status: appt.status,
        duration: appt.duration,
        alerts: appt.alerts,
        vitals: appt.patient.vitals
      };
    });
    
    // Format activities (combine regular activities and payment activities)
    const allActivities = [
      // Format regular activities
      ...activities.map(activity => {
        // Calculate time difference
        const now = new Date();
        const diff = Math.floor((now - activity.createdAt) / 1000 / 60); // in minutes
        
        let timeAgo;
        if (diff < 60) {
          timeAgo = `${diff} mins ago`;
        } else if (diff < 24 * 60) {
          timeAgo = `${Math.floor(diff / 60)} hours ago`;
        } else {
          timeAgo = `${Math.floor(diff / (60 * 24))} days ago`;
        }
        
        let icon, color;
        switch (activity.type) {
          case 'lab':
            icon = 'FileSearch';
            color = 'bg-blue-500';
            break;
          case 'appointment':
            icon = 'CheckCircle2';
            color = 'bg-green-500';
            break;
          case 'prescription':
            icon = 'FileText';
            color = 'bg-purple-500';
            break;
          case 'critical_alert':
            icon = 'AlertTriangle';
            color = 'bg-red-500';
            break;
          case 'referral':
            icon = 'ClipboardCheck';
            color = 'bg-teal-500';
            break;
          default:
            icon = 'Calendar';
            color = 'bg-amber-500';
        }
        
        return {
          id: activity._id.toString(),
          title: activity.title,
          description: activity.description,
          time: timeAgo,
          icon,
          color,
          alert: activity.alert,
          createdAt: activity.createdAt,
          type: 'activity'
        };
      }),
      
      // Format payment activities
      ...recentPayments.map(payment => {
        // Calculate time difference
        const now = new Date();
        const diff = Math.floor((now - payment.createdAt) / 1000 / 60); // in minutes
        
        let timeAgo;
        if (diff < 60) {
          timeAgo = `${diff} mins ago`;
        } else if (diff < 24 * 60) {
          timeAgo = `${Math.floor(diff / 60)} hours ago`;
        } else {
          timeAgo = `${Math.floor(diff / (60 * 24))} days ago`;
        }
        
        return {
          id: `payment-${payment._id.toString()}`,
          title: 'Payment Received',
          description: `Payment received from ${payment.patient?.name || 'Unknown Patient'} via ${payment.paymentMethod}`,
          amount: payment.amount,
          time: timeAgo,
          icon: 'DollarSign',
          color: 'bg-green-500',
          alert: false,
          createdAt: payment.createdAt,
          type: 'payment'
        };
      })
    ];
    
    // Sort all activities by creation date and limit to 6 most recent
    const formattedActivities = allActivities
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 6)
      .map(activity => {
        // Remove createdAt from final output as it's only used for sorting
        const { createdAt, ...activityWithoutDate } = activity;
        return activityWithoutDate;
      });
    
    // Format tasks
    const formattedTasks = tasks.map(task => {
      // Format due date
      const now = new Date();
      const dueDate = new Date(task.dueDate);
      
      let dueDateStr;
      if (dueDate.toDateString() === now.toDateString()) {
        dueDateStr = 'Today';
      } else {
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        if (dueDate.toDateString() === tomorrow.toDateString()) {
          dueDateStr = 'Tomorrow';
        } else {
          dueDateStr = dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
      }
      
      return {
        id: task._id.toString(),
        title: task.title,
        patient: task.patient.name,
        dueDate: dueDateStr,
        priority: task.priority,
        type: task.type
      };
    });
    
    // Get yesterday's data for comparison - also run in parallel
    const [prescriptionsYesterday, pendingLabResultsYesterday, revenueYesterday] = await Promise.all([
      ActivityModel.countDocuments({
        user: doctorId,
        type: 'prescription',
        createdAt: {
          $gte: yesterday,
          $lt: today
        }
      }),
      
      LabResultModel.countDocuments({
        orderedBy: new mongoose.Types.ObjectId(doctorId),
        status: { $in: ['Ordered', 'In Progress'] },
        orderedAt: {
          $lt: today
        }
      }),
      
      // Calculate revenue yesterday from appointment payments only (exclude subscription payments)
      PaymentModel.aggregate([
        {
          $match: {
            organization: new mongoose.Types.ObjectId(session.user.organization),
            appointment: { $ne: null }, // Only appointment payments
            date: {
              $gte: yesterday,
              $lt: today
            },
            status: 'Completed'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]).then(result => result.length > 0 ? result[0].total : 0)
    ]);
    
    // Dashboard stats
    const dashboardStats = [
      {
        title: 'Patients Today',
        value: patientsToday.toString(),
        change: patientsYesterday > 0 
          ? `${Math.round((patientsToday - patientsYesterday) / patientsYesterday * 100)}% from yesterday` 
          : 'No data for yesterday',
        trend: patientsToday >= patientsYesterday ? 'up' : 'down',
        icon: 'Users',
        color: 'from-blue-500 to-blue-700',
        link: '/patients'
      },
      {
        title: 'Pending Results',
        value: pendingLabResults.toString(),
        change: pendingLabResultsYesterday > 0 
          ? `${Math.round((pendingLabResults - pendingLabResultsYesterday) / pendingLabResultsYesterday * 100)}% from yesterday` 
          : 'No data for yesterday',
        trend: pendingLabResults <= pendingLabResultsYesterday ? 'up' : 'down',
        icon: 'FileSearch',
        color: 'from-amber-500 to-amber-700',
        link: '/labs'
      },
      {
        title: 'Prescriptions',
        value: prescriptionsToday.toString(),
        change: prescriptionsYesterday > 0 
          ? `${Math.round((prescriptionsToday - prescriptionsYesterday) / prescriptionsYesterday * 100)}% from yesterday` 
          : 'No data for yesterday',
        trend: prescriptionsToday >= prescriptionsYesterday ? 'up' : 'down',
        icon: 'FileText',
        color: 'from-purple-500 to-purple-700',
        link: '/prescriptions'
      },
      {
        title: 'Revenue Today',
        value: revenueToday,
        change: revenueYesterday > 0 
          ? `${Math.round((revenueToday - revenueYesterday) / revenueYesterday * 100)}% from yesterday` 
          : 'No data for yesterday',
        trend: revenueToday >= revenueYesterday ? 'up' : 'down',
        icon: 'DollarSign',
        color: 'from-green-500 to-green-700',
        link: '/payments'
      }
    ];
    
    // Calculate practice metrics (this is just for illustration)
    const practiceMetrics = [
      {
        title: 'Patients Seen',
        value: 246,
        change: '+12%',
        icon: 'Users'
      },
      {
        title: 'Avg. Visit Time',
        value: '24 min',
        change: '-2 min',
        icon: 'Clock'
      },
      {
        title: 'Satisfaction',
        value: '94%',
        change: '+2%',
        icon: 'Heart'
      }
    ];
    
    const responseData = {
      dashboardStats,
      upcomingAppointments: formattedAppointments,
      activities: formattedActivities,
      pendingTasks: formattedTasks,
      practiceMetrics
    };
    
    // Save to cache
    cache.set(cacheKey, responseData);
    
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error in dashboard route:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
} 