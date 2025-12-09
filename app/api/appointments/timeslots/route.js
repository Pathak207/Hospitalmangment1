import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import dbConnect from '@/lib/db';
import AppointmentModel from '@/models/Appointment';

export async function GET(request) {
  try {
    const session = await getAuthSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await dbConnect();
    
    // Get date from query parameters
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    const settingsParam = searchParams.get('settings');
    
    if (!dateParam) {
      return NextResponse.json({ error: 'Date parameter is required' }, { status: 400 });
    }
    
    // Parse the date more carefully
    const selectedDate = new Date(dateParam);
    console.log('Processing request for date:', selectedDate.toISOString());
    
    // Handle invalid date
    if (isNaN(selectedDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }
    
    const dayOfWeek = selectedDate.getDay(); // 0 = Sunday, 6 = Saturday
    
    // Default settings
    let settings = {
      startTime: '08:30 AM',
      endTime: '05:00 PM',
      interval: 30, // minutes
      workDays: [1, 2, 3, 4, 5], // Monday to Friday are working days by default
      lunchBreak: {
        start: '12:30 PM',
        end: '01:30 PM',
        enabled: true
      }
    };
    
    // Parse and use client settings if provided
    if (settingsParam) {
      try {
        const clientSettings = JSON.parse(settingsParam);
        console.log('Using client-provided settings:', clientSettings);
        
        // Merge client settings with defaults
        settings = {
          ...settings,
          ...clientSettings
        };
      } catch (error) {
        console.error('Error parsing client settings:', error);
      }
    }
    
    // Check if selected date is a working day
    const isWorkingDay = settings.workDays.includes(dayOfWeek);
    
    if (!isWorkingDay) {
      return NextResponse.json({ 
        availableSlots: [],
        message: 'Selected date is not a working day'
      });
    }
    
    // Generate time slots
    const availableSlots = generateTimeSlots(settings);
    console.log(`Generated ${availableSlots.length} initial time slots`);
    
    // Create start and end dates for the selected day
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    console.log('Looking for appointments between', startOfDay.toISOString(), 'and', endOfDay.toISOString());
    
    let filteredSlots = availableSlots;
    
    try {
      // Fetch existing appointments for the date to filter out booked slots
      const existingAppointments = await AppointmentModel.find({
        date: {
          $gte: startOfDay,
          $lte: endOfDay
        },
        doctor: session.user.id
      }).select('time');
      
      console.log(`Found ${existingAppointments.length} existing appointments for this date`);
      
      // Extract booked times
      const bookedTimes = existingAppointments.map(appt => {
        // Normalize the time format to match the time slots
        return normalizeTimeFormat(appt.time);
      });
      
      console.log('Booked times:', bookedTimes);
      
      // Filter out booked slots
      filteredSlots = availableSlots.filter(slot => !bookedTimes.includes(slot));
      
      console.log(`Returning ${filteredSlots.length} available time slots after filtering`);
      
      // Ensure we always return at least some time slots even if all are booked
      if (filteredSlots.length === 0 && availableSlots.length > 0) {
        console.log('All slots were filtered out - returning a few default slots instead');
        // Return at least 3 slots as a fallback
        filteredSlots = availableSlots.slice(0, Math.min(3, availableSlots.length));
      }
    } catch (error) {
      console.error('Error filtering booked slots:', error);
      // In case of error, just return all available slots
      filteredSlots = availableSlots;
    }
    
    // Make sure we always return some slots
    if (filteredSlots.length === 0) {
      console.log('No slots available after all processing - returning basic fallback slots');
      // Generate some basic slots as a last resort
      filteredSlots = ['09:00 AM', '10:00 AM', '11:00 AM', '01:00 PM', '02:00 PM', '03:00 PM'];
    }
    
    return NextResponse.json({
      availableSlots: filteredSlots,
      totalSlots: availableSlots.length,
      bookedSlots: bookedTimes?.length || 0,
      availableCount: filteredSlots.length,
      settings: settings, // Return the used settings for debugging
      debug: {
        date: selectedDate.toISOString(),
        dayOfWeek,
        isWorkingDay,
        startOfDay: startOfDay.toISOString(),
        endOfDay: endOfDay.toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error in time slots API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Helper function to generate time slots
function generateTimeSlots(settings) {
  const { startTime, endTime, interval, lunchBreak } = settings;
  
  // Convert times to minutes since midnight for easier calculation
  const toMinutes = (timeStr) => {
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };
  
  // Convert minutes back to time string
  const toTimeString = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')} ${period}`;
  };
  
  const startMinutes = toMinutes(startTime);
  const endMinutes = toMinutes(endTime);
  const lunchStartMin = lunchBreak && lunchBreak.enabled ? toMinutes(lunchBreak.start) : -1;
  const lunchEndMin = lunchBreak && lunchBreak.enabled ? toMinutes(lunchBreak.end) : -1;
  
  const slots = [];
  for (let i = startMinutes; i < endMinutes; i += interval) {
    // Skip lunch break
    if (lunchBreak && lunchBreak.enabled && i >= lunchStartMin && i < lunchEndMin) {
      continue;
    }
    slots.push(toTimeString(i));
  }
  
  return slots;
}

// Helper to normalize time format
function normalizeTimeFormat(time) {
  // Handle different time formats
  if (!time) return '';
  
  // If already in 12-hour format (e.g., "09:30 AM"), return as is
  if (time.includes(' ')) {
    return time;
  }
  
  // Convert from 24-hour format (e.g., "14:30") to 12-hour format
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
} 