'use client';

import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useModal } from '@/components/ui/modal-provider';
import { useSettings } from '@/lib/settings-context';
import { Search, PlusCircle, Clock, User, Check, X, ChevronLeft, ChevronRight, FileText, AlertCircle, MoreHorizontal, Pill, HeartPulse, Stethoscope, DollarSign, Printer, FileDown, Receipt, Copy, Trash2, Plus } from 'lucide-react';
import { format, isToday, isThisWeek, parseISO, startOfDay } from 'date-fns';
import { formatDate, formatTime, formatDateTime, formatCurrency, convertTo24HourFormat } from '@/lib/utils';
import { getAppointmentTypes, getDefaultAppointmentTypes } from '@/lib/appointment-types';
import toast from 'react-hot-toast';
import { useSession } from 'next-auth/react';
import { Eye, Edit, Filter, Download, Calendar as CalendarIcon, Bell, CheckCircle, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// Sample weekdays and dates for calendar UI (will be replaced with dynamic data)
const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const dates = ['15', '16', '17', '18', '19', '20', '21'];
const todayIndex = 2; // Wednesday is today in this example

// More realistic time slots with smaller intervals
const generateTimeSlots = (settings: any): string[] => {
  // Provide default values if settings are incomplete
  const defaultSettings = {
    startTime: '08:00 AM',
    endTime: '05:00 PM',
    interval: 30,
    lunchBreak: {
      start: '12:00 PM',
      end: '01:00 PM',
      enabled: false
    }
  };

  // Merge with defaults to ensure all required properties exist
  const safeSettings = {
    ...defaultSettings,
    ...settings,
    lunchBreak: {
      ...defaultSettings.lunchBreak,
      ...(settings?.lunchBreak || {})
    }
  };

  const { startTime, endTime, interval, lunchBreak } = safeSettings;
  
  // Function to convert time string to minutes with error handling
  const toMinutes = (timeStr: string): number => {
    if (!timeStr || typeof timeStr !== 'string') {
      console.warn('Invalid time string provided:', timeStr);
      return 0;
    }

    const parts = timeStr.split(' ');
    if (parts.length !== 2) {
      console.warn('Invalid time format, expected "HH:MM AM/PM":', timeStr);
      return 0;
    }

    const [time, period] = parts;
    const timeParts = time.split(':');
    if (timeParts.length !== 2) {
      console.warn('Invalid time format, expected "HH:MM":', time);
      return 0;
    }

    let [hours, minutes] = timeParts.map(Number);
    
    if (isNaN(hours) || isNaN(minutes)) {
      console.warn('Invalid time values:', timeStr);
      return 0;
    }
    
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    
    return hours * 60 + minutes;
  };

  // Function to convert minutes to time string
  const toTimeString = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    
    return `${displayHours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')} ${period}`;
  };

  const startMinutes = toMinutes(startTime);
  const endMinutes = toMinutes(endTime);
  
  // Validate that we have valid time ranges
  if (startMinutes >= endMinutes) {
    console.warn('Invalid time range: start time must be before end time');
    return [];
  }

  const lunchStartMin = lunchBreak.enabled && lunchBreak.start ? toMinutes(lunchBreak.start) : null;
  const lunchEndMin = lunchBreak.enabled && lunchBreak.end ? toMinutes(lunchBreak.end) : null;

  const slots: string[] = [];
  
  for (let i = startMinutes; i < endMinutes; i += interval) {
    // Skip lunch break
    if (lunchBreak.enabled && lunchStartMin !== null && lunchEndMin !== null && i >= lunchStartMin && i < lunchEndMin) {
      continue;
    }
    slots.push(toTimeString(i));
  }
  
  return slots;
};

// Get appointment type color from database appointment types using inline mapping
const getAppointmentTypeColorFromHex = (color: string) => {
  if (!color) return 'bg-gray-500';
  
  const colorMap: { [key: string]: string } = {
    '#3B82F6': 'bg-blue-500',    // Blue
    '#10B981': 'bg-green-500',   // Green
    '#F59E0B': 'bg-amber-500',   // Amber
    '#8B5CF6': 'bg-purple-500',  // Purple
    '#EF4444': 'bg-red-500',     // Red
    '#6366F1': 'bg-indigo-500',  // Indigo
  };
  
  return colorMap[color] || 'bg-gray-500';
};

// Define appointment types with appropriate colors - Now loaded dynamically
// const appointmentTypes = [
//   { value: 'all', label: 'All Types' },
//   { value: 'Follow-up', label: 'Follow-up', color: 'bg-green-500' },
//   { value: 'Consultation', label: 'Consultation', color: 'bg-purple-500' },
//   { value: 'Annual physical', label: 'Annual Physical', color: 'bg-amber-500' },
//   { value: 'Specialty', label: 'Specialty', color: 'bg-indigo-500' },
//   { value: 'Emergency', label: 'Emergency', color: 'bg-red-500' },
// ];

// Get appointment type color from database appointment types
const getAppointmentTypeColor = (type: string, appointmentTypes: any[]) => {
  const typeObj = appointmentTypes.find(t => t.name === type);
  return typeObj ? getAppointmentTypeColorFromHex(typeObj.color) : 'bg-gray-500';
};

// Add a DropdownMenu component
interface DropdownMenuProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const DropdownMenu = ({ isOpen, onClose, children }: DropdownMenuProps) => {
  if (!isOpen) return null;
  
  return (
    <div className="relative">
      <div 
        className="fixed inset-0 z-40"
        onClick={onClose}
      ></div>
      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        {children}
      </div>
    </div>
  );
};

interface DropdownMenuItemProps {
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick: () => void;
}

const DropdownMenuItem = ({ icon, children, onClick }: DropdownMenuItemProps) => {
  return (
    <button
      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
      onClick={onClick}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};

// Appointment interface based on the model
interface Appointment {
  _id: string;
  patient: {
    _id: string;
    name: string;
    patientId: string;
    age: number;
    gender: string;
    vitals?: {
      bp: string;
      hr: string;
      temp: string;
    }
  };
  date: string;
  time: string;
  type: string;
  reason: string;
  status: 'Confirmed' | 'Pending' | 'Cancelled' | 'Completed' | 'No-show';
  duration: string;
  notes?: string;
  alerts?: string[];
  doctor: string;
  paid?: boolean;
  paymentAmount?: number;
  paymentDate?: string;
  paymentMethod?: string;
}

// Get appointment type fee based on appointment types loaded from database
const getAppointmentFee = (type: string, appointmentTypes: any[]) => {
  const typeObj = appointmentTypes.find(t => t.name === type);
  return typeObj ? typeObj.price : 150; // Default to $150 if type not found
};

export default function AppointmentsPage() {
  const { openModal } = useModal();
  const { formatDate, formatCurrency } = useSettings();
  const { data: session } = useSession();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  
  // Schedule settings default values
  const [scheduleSettings, setScheduleSettings] = useState({
    startTime: '08:30 AM',
    endTime: '05:00 PM',
    interval: 30, // minutes
    workDays: [0, 1, 2, 3, 4, 5, 6], // All days are working days by default (0 = Sunday, 6 = Saturday)
    lunchBreak: {
      start: '12:30 PM',
      end: '01:30 PM',
      enabled: true
    }
  });
  
  // State for time slots that depends on schedule settings
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  
  // State for data
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for appointment types
  const [appointmentTypes, setAppointmentTypes] = useState<any[]>([]);
  const [appointmentTypesLoading, setAppointmentTypesLoading] = useState(true);
  
  // State for search and filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [viewAllAppointments, setViewAllAppointments] = useState<boolean>(true);
  
  // State for counts/stats
  const [todayCount, setTodayCount] = useState<number>(0);
  const [confirmedCount, setConfirmedCount] = useState<number>(0);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [availableSlots, setAvailableSlots] = useState<number>(0);
  
  // State to store the appointment time map
  const [appointmentMap, setAppointmentMap] = useState(new Map());
  
  // Load settings and generate time slots
  useEffect(() => {
    const loadSettings = () => {
      try {
        const saved = localStorage.getItem('scheduleSettings');
        if (saved) {
          const settings = JSON.parse(saved);
          // Ensure we have all required properties
          const completeSettings = {
            startTime: '08:00 AM',
            endTime: '05:00 PM',
            interval: 30,
            workDays: [1, 2, 3, 4, 5], // Monday to Friday by default
            ...settings,
            lunchBreak: {
              start: '12:00 PM',
              end: '01:00 PM',
              enabled: false,
              ...(settings.lunchBreak || {})
            }
          };
          setScheduleSettings(completeSettings);
          console.log('Loaded schedule settings:', completeSettings);
        } else {
          // Set default settings if none exist
          const defaultSettings = {
            startTime: '08:00 AM',
            endTime: '05:00 PM',
            interval: 30,
            workDays: [1, 2, 3, 4, 5], // Monday to Friday
            lunchBreak: {
              start: '12:00 PM',
              end: '01:00 PM',
              enabled: false
            }
          };
          setScheduleSettings(defaultSettings);
          console.log('Using default schedule settings:', defaultSettings);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        // Set default settings on error
        const defaultSettings = {
          startTime: '08:00 AM',
          endTime: '05:00 PM',
          interval: 30,
          workDays: [1, 2, 3, 4, 5], // Monday to Friday
          lunchBreak: {
            start: '12:00 PM',
            end: '01:00 PM',
            enabled: false
          }
        };
        setScheduleSettings(defaultSettings);
      }
    };

    loadSettings();
    loadAppointmentTypes();
    
    // Listen for appointment types updates
    const handleAppointmentTypesUpdate = () => {
      loadAppointmentTypes();
    };

    document.addEventListener('appointmentTypesUpdated', handleAppointmentTypesUpdate);
    
    return () => {
      document.removeEventListener('appointmentTypesUpdated', handleAppointmentTypesUpdate);
    };
  }, []);

  // Update time slots when settings or appointments change
  useEffect(() => {
    if (!scheduleSettings) return;
    
    const slots = generateTimeSlots(scheduleSettings);
    console.log('Generated slots for today:', slots);
    
    setTimeSlots(slots);
    
    // Update available slots count based on today's appointments
    const today = format(new Date(), 'yyyy-MM-dd');
    const todayAppointments = appointments.filter(a => 
      format(new Date(a.date), 'yyyy-MM-dd') === today
    );
    setAvailableSlots(slots.length - todayAppointments.length);
  }, [scheduleSettings, appointments]);
  
  // Helper function to normalize time format
  const normalizeTimeFormat = (timeStr) => {
    // Handle various time formats and normalize to "HH:MM AM/PM"
    if (!timeStr) return "";
    
    // First try to split by space to separate time and AM/PM
    let [time, period] = timeStr.split(' ');
    
    // If period exists, make it uppercase
    if (period) {
      period = period.toUpperCase();
    } else {
      // Try to determine if it's a 24-hour format
      const [hours] = time.split(':').map(Number);
      if (hours >= 12) {
        period = 'PM';
        const displayHours = hours === 12 ? 12 : hours - 12;
        time = `${displayHours}:${time.split(':')[1]}`;
      } else {
        period = 'AM';
        if (hours === 0) {
          time = `12:${time.split(':')[1]}`;
        }
      }
    }
    
    // Split hours and minutes
    let [hours, minutes] = time.split(':').map(Number);
    
    // Ensure hours is in 12-hour format
    if (hours > 12) {
      hours = hours - 12;
    } else if (hours === 0) {
      hours = 12;
    }
    
    // Format with padding
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  // Reference to fetchAppointments function for refreshing appointments
  const fetchAppointmentsRef = React.useRef<(() => Promise<void>) | null>(null);
  
  // Fetch appointments
  useEffect(() => {
    async function fetchAppointments() {
      try {
        setLoading(true);
        // Build query parameters
        const params = new URLSearchParams();
        
        // For the appointments list - apply filter based on toggle state
        if (!viewAllAppointments) {
          // Only show today's appointments when not viewing all
          const todayStr = format(new Date(), 'yyyy-MM-dd');
          params.append('date', todayStr);
        } else {
          // For "All Appointments" view, don't filter by date
          console.log('Fetching all appointments without date filter');
        }
        
        if (searchTerm) {
          params.append('search', searchTerm);
        }
        
        const response = await fetch(`/api/appointments?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch appointments');
        }
        
        const data = await response.json();
        
        // Normalize time format in appointments to match our time slots
        const normalizedAppointments = data.appointments.map(appt => {
          return {
            ...appt,
            time: normalizeTimeFormat(appt.time)
          };
        });
        
        console.log('Fetched appointments with normalized times:', 
          normalizedAppointments.map(a => ({
            id: a._id, 
            time: a.time, 
            originalTime: data.appointments.find(orig => orig._id === a._id).time,
            patient: a.patient.name
          }))
        );
        
        setAppointments(normalizedAppointments);
        
        // Calculate counts
        calculateCounts(normalizedAppointments);
        
      } catch (err) {
        setError(err.message);
        console.error('Error fetching appointments:', err);
      } finally {
        setLoading(false);
      }
    }
    
    // Store the fetchAppointments function in the ref
    fetchAppointmentsRef.current = fetchAppointments;
    
    // Execute the function
    fetchAppointments();
  }, [searchTerm, viewAllAppointments, appointmentTypes]);
  
  // Listen to a custom event for appointment creation
  useEffect(() => {
    // Create a refresh function
    const refreshAppointments = () => {
      console.log("Refreshing appointments after new appointment creation");
      if (fetchAppointmentsRef.current) {
        fetchAppointmentsRef.current();
      }
    };
    
    // Handle payment processed events
    const handlePaymentProcessed = (event: CustomEvent) => {
      console.log("Payment processed event received:", event.detail);
      // Since payment status is now determined dynamically by checking the Payment collection,
      // we just need to refresh the appointments list to get updated payment info
      refreshAppointments();
      toast.success('Payment processed successfully');
    };
    
    // Add event listeners
    window.addEventListener('appointment-created', refreshAppointments);
    window.addEventListener('payment-processed', handlePaymentProcessed as EventListener);
    
    // Clean up event listeners
    return () => {
      window.removeEventListener('appointment-created', refreshAppointments);
      window.removeEventListener('payment-processed', handlePaymentProcessed as EventListener);
    };
  }, [appointmentTypes]);
  
  // Calculate counts for stats
  const calculateCounts = (appts: Appointment[]) => {
    // Today's appointments (already filtered by date in the API)
    setTodayCount(appts.length);
    
    // Count by status
    setConfirmedCount(appts.filter(a => a.status === 'Confirmed').length);
    setPendingCount(appts.filter(a => a.status === 'Pending').length);
    
    // Available slots (assumption: 17 total slots in a day - number of appointments)
    setAvailableSlots(timeSlots.length - appts.length);
  };
  
  // Handlers
  const toggleDropdown = (id: string) => {
    setActiveDropdown(activeDropdown === id ? null : id);
  };
  
  const closeDropdown = () => {
    setActiveDropdown(null);
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  const handleStatusChange = async (appointmentId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update appointment');
      }
      
      // Update local state
      setAppointments(prevAppts => 
        prevAppts.map(appt => 
          appt._id === appointmentId ? { ...appt, status: newStatus as any } : appt
        )
      );
      
      // Recalculate counts
      calculateCounts(appointments);
      
    } catch (err) {
      console.error('Error updating appointment:', err);
    }
  };
  
  // Format date for display
  const formatDateDisplay = (dateString: string) => {
    return formatDate(dateString);
  };
  
  // View invoice
  const viewInvoice = (appointment: Appointment) => {
    openModal('viewInvoice', {
      patientName: appointment.patient.name,
      patientId: appointment.patient.patientId,
      type: appointment.type,
      dateTime: formatDateTime(appointment.date, appointment.time),
      amount: getAppointmentFee(appointment.type, appointmentTypes),
      date: formatDateTime(appointment.date, appointment.time),
      time: appointment.time,
      provider: appointment.doctor || session?.user?.name || 'Doctor',
      id: appointment._id,
      paid: appointment.paid,
      paymentDate: appointment.paymentDate,
      method: appointment.paymentMethod || 'Card',
      paymentAmount: appointment.paymentAmount,
      description: `${appointment.type} - ${formatDateTime(appointment.date, appointment.time)}`
    });
    closeDropdown();
  };
  
  // Print invoice
  const printInvoice = (appointment: Appointment) => {
    // Create invoice data
    const invoiceDate = new Date().toLocaleDateString();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${appointment._id || Math.floor(Math.random() * 10000)}`;
    const appointmentFee = getAppointmentFee(appointment.type, appointmentTypes);
    const totalAmount = appointmentFee; // No service fee
    const paymentStatus = appointment.paid ? 'Paid' : 'Unpaid';
    const paymentDate = appointment.paid ? (appointment.paymentDate ? new Date(appointment.paymentDate).toLocaleDateString() : new Date().toLocaleDateString()) : 'Not paid';
    const formattedAppointmentFee = formatCurrency(appointmentFee);
    const formattedTotalAmount = formatCurrency(totalAmount);
    
    // Create a new window
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
      alert('Please allow popups for this website to print invoices');
      return;
    }
    
    // Build a simple clean HTML for printing
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Invoice - ${appointment.patient.name}</title>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              color: #333;
              line-height: 1.5;
              margin: 0;
              padding: 20px;
            }
            .container {
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              display: flex;
              justify-content: space-between;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 1px solid #ddd;
            }
            h1 {
              margin: 0 0 10px 0;
              color: #222;
            }
            p {
              margin: 5px 0;
            }
            .invoice-label {
              background-color: #f0f7ff;
              color: #1a56db;
              padding: 8px 12px;
              border-radius: 4px;
              font-weight: bold;
              display: inline-block;
            }
            .details {
              display: flex;
              justify-content: space-between;
              margin-bottom: 30px;
            }
            .details > div {
              flex: 1;
            }
            h3 {
              color: #555;
              font-size: 14px;
              margin-bottom: 8px;
              text-transform: uppercase;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            th {
              background-color: #f9fafb;
              text-align: left;
              padding: 12px;
              border-bottom: 1px solid #ddd;
            }
            td {
              padding: 12px;
              border-bottom: 1px solid #ddd;
            }
            .text-right {
              text-align: right;
            }
            .total-row {
              background-color: #f9fafb;
              font-weight: bold;
            }
            .status {
              padding: 15px;
              margin-bottom: 20px;
              background-color: #ecfdf5;
              border: 1px solid #10b981;
              border-radius: 4px;
              color: #065f46;
            }
            .notes {
              border-top: 1px solid #ddd;
              padding-top: 20px;
              color: #666;
              font-size: 14px;
            }
            @media print {
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body onload="setTimeout(function() { window.print(); setTimeout(function() { window.close(); }, 500); }, 300);">
          <div class="container">
            <div class="header">
              <div>
                <h1>DoctorCare Medical Center</h1>
                <p>123 Medical Center Dr.</p>
                <p>Healthville, CA 12345</p>
                <p>(555) 123-4567</p>
              </div>
              <div style="text-align: right;">
                <div class="invoice-label">INVOICE</div>
                <p style="margin-top: 10px;"><strong>Invoice #:</strong> ${invoiceNumber}</p>
                <p><strong>Date:</strong> ${invoiceDate}</p>
                <p><strong>Due Date:</strong> ${invoiceDate}</p>
              </div>
            </div>

            <div class="details">
              <div>
                <h3>Bill To:</h3>
                <p><strong>${appointment.patient.name}</strong></p>
                <p>Patient ID: ${appointment.patient.patientId}</p>
              </div>
              <div>
                <h3>Service Details:</h3>
                <p><strong>Type:</strong> ${appointment.type || 'Medical Service'}</p>
                <p><strong>Date:</strong> ${formatDateTime(appointment.date, appointment.time)}</p>
                <p><strong>Provider:</strong> ${appointment.doctor || session?.user?.name || 'Doctor'}</p>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th class="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>${appointment.type || 'Medical Service'} - ${formatDateTime(appointment.date, appointment.time)}</td>
                  <td class="text-right">${formattedAppointmentFee}</td>
                </tr>
                <tr class="total-row">
                  <td>Total</td>
                  <td class="text-right">${formattedTotalAmount}</td>
                </tr>
              </tbody>
            </table>

            <div class="status">
              <strong>${paymentStatus === 'Paid' ? '✓ Payment Processed' : '⚠ Payment Pending'}</strong>
              <span style="float: right;">${paymentStatus === 'Paid' ? `Paid on ${paymentDate}` : 'Not paid yet'}</span>
            </div>

            <div class="notes">
              <p><strong>Note:</strong> Thank you for choosing DoctorCare Medical Center for your healthcare needs.</p>
              <p style="margin-top: 10px;"><strong>Payment Terms:</strong> Payment is due upon receipt of this invoice.</p>
            </div>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    closeDropdown();
  };
  
  // Download invoice as PDF
  const downloadInvoicePDF = (appointment: Appointment) => {
    // Create invoice data
    const invoiceDate = new Date().toLocaleDateString();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${appointment._id || Math.floor(Math.random() * 10000)}`;
    const appointmentFee = getAppointmentFee(appointment.type, appointmentTypes);
    const totalAmount = appointmentFee; // No service fee
    const paymentStatus = appointment.paid ? 'Paid' : 'Unpaid';
    const paymentDate = appointment.paid ? (appointment.paymentDate ? new Date(appointment.paymentDate).toLocaleDateString() : new Date().toLocaleDateString()) : 'Not paid';
    const formattedAppointmentFee = formatCurrency(appointmentFee);
    const formattedTotalAmount = formatCurrency(totalAmount);
    
    // Create a new window with optimized content
    const pdfWindow = window.open('', '_blank');
    if (!pdfWindow) {
      alert('Please allow popups to download the invoice');
      return;
    }
    
    // Write the invoice content to the new window
    pdfWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Download Invoice - ${appointment.patient.name}</title>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              color: #333;
              line-height: 1.5;
              margin: 0;
              padding: 20px;
            }
            .container {
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              display: flex;
              justify-content: space-between;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 1px solid #ddd;
            }
            h1 {
              margin: 0 0 10px 0;
              color: #222;
            }
            p {
              margin: 5px 0;
            }
            .invoice-label {
              background-color: #f0f7ff;
              color: #1a56db;
              padding: 8px 12px;
              border-radius: 4px;
              font-weight: bold;
              display: inline-block;
            }
            .details {
              display: flex;
              justify-content: space-between;
              margin-bottom: 30px;
            }
            .details > div {
              flex: 1;
            }
            h3 {
              color: #555;
              font-size: 14px;
              margin-bottom: 8px;
              text-transform: uppercase;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            th {
              background-color: #f9fafb;
              text-align: left;
              padding: 12px;
              border-bottom: 1px solid #ddd;
            }
            td {
              padding: 12px;
              border-bottom: 1px solid #ddd;
            }
            .text-right {
              text-align: right;
            }
            .total-row {
              background-color: #f9fafb;
              font-weight: bold;
            }
            .status {
              padding: 15px;
              margin-bottom: 20px;
              background-color: #ecfdf5;
              border: 1px solid #10b981;
              border-radius: 4px;
              color: #065f46;
            }
            .notes {
              border-top: 1px solid #ddd;
              padding-top: 20px;
              color: #666;
              font-size: 14px;
            }
            #loading {
              position: fixed;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background-color: rgba(255,255,255,0.9);
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              z-index: 9999;
            }
            .spinner {
              border: 6px solid #f3f3f3;
              border-top: 6px solid #3498db;
              border-radius: 50%;
              width: 50px;
              height: 50px;
              animation: spin 1s linear infinite;
              margin-bottom: 15px;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            .download-btn {
              display: flex;
              justify-content: center;
              margin-top: 20px;
            }
            button {
              padding: 10px 20px;
              background-color: #0066cc;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-size: 16px;
            }
            button:hover {
              background-color: #0052a3;
            }
          </style>
          <!-- Load jsPDF directly -->
          <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
        </head>
        <body>
          <div id="loading">
            <div class="spinner"></div>
            <p>Preparing your invoice for download...</p>
          </div>
          
          <div id="invoice" class="container">
            <div class="header">
              <div>
                <h1>DoctorCare Medical Center</h1>
                <p>123 Medical Center Dr.</p>
                <p>Healthville, CA 12345</p>
                <p>(555) 123-4567</p>
              </div>
              <div style="text-align: right;">
                <div class="invoice-label">INVOICE</div>
                <p style="margin-top: 10px;"><strong>Invoice #:</strong> ${invoiceNumber}</p>
                <p><strong>Date:</strong> ${invoiceDate}</p>
                <p><strong>Due Date:</strong> ${invoiceDate}</p>
              </div>
            </div>

            <div class="details">
              <div>
                <h3>Bill To:</h3>
                <p><strong>${appointment.patient.name}</strong></p>
                <p>Patient ID: ${appointment.patient.patientId}</p>
              </div>
              <div>
                <h3>Service Details:</h3>
                <p><strong>Type:</strong> ${appointment.type || 'Medical Service'}</p>
                <p><strong>Date:</strong> ${formatDateTime(appointment.date, appointment.time)}</p>
                <p><strong>Provider:</strong> ${appointment.doctor || session?.user?.name || 'Doctor'}</p>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th class="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>${appointment.type || 'Medical Service'} - ${formatDateTime(appointment.date, appointment.time)}</td>
                  <td class="text-right">${formattedAppointmentFee}</td>
                </tr>
                <tr class="total-row">
                  <td>Total</td>
                  <td class="text-right">${formattedTotalAmount}</td>
                </tr>
              </tbody>
            </table>

            <div class="status">
              <strong>${paymentStatus === 'Paid' ? '✓ Payment Processed' : '⚠ Payment Pending'}</strong>
              <span style="float: right;">${paymentStatus === 'Paid' ? `Paid on ${paymentDate}` : 'Not paid yet'}</span>
            </div>

            <div class="notes">
              <p><strong>Note:</strong> Thank you for choosing DoctorCare Medical Center for your healthcare needs.</p>
              <p style="margin-top: 10px;"><strong>Payment Terms:</strong> Payment is due upon receipt of this invoice.</p>
            </div>
          </div>
          
          <script>
            // Function to generate and download PDF
            function downloadPDF() {
              const { jsPDF } = window.jspdf;
              const invoice = document.getElementById('invoice');
              
              // Generate PDF
              window.html2canvas(invoice, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
              }).then(canvas => {
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF({
                  orientation: 'portrait',
                  unit: 'mm',
                  format: 'a4'
                });
                
                const imgWidth = 210; // A4 width in mm
                const pageHeight = 297; // A4 height in mm
                const imgHeight = canvas.height * imgWidth / canvas.width;
                
                pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
                
                // Handle multi-page
                if (imgHeight > pageHeight) {
                  let heightLeft = imgHeight - pageHeight;
                  let position = -pageHeight;
                  
                  while (heightLeft > 0) {
                    position = position - pageHeight;
                    pdf.addPage();
                    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                    heightLeft -= pageHeight;
                  }
                }
                
                // Download the PDF
                pdf.save('Invoice-${appointment.patient.name?.replace(/\s+/g, '-')}-${invoiceNumber}.pdf');
                
                // Hide loading indicator and close window after download
                document.getElementById('loading').style.display = 'none';
                
                // Close the window after download
                setTimeout(() => {
                  window.close();
                }, 500);
              });
            }
            
            // Auto-download after page loads
            window.onload = function() {
              setTimeout(downloadPDF, 1000);
            };
          </script>
        </body>
      </html>
    `);
    
    pdfWindow.document.close();
    closeDropdown();
  };
  
  // Process payment
  const processPayment = (appointment: Appointment) => {
    console.log('Processing payment for:', appointment.patient.name);
    openModal('appointmentPayment', appointment);
    closeDropdown();
  };

  // Delete appointment
  const deleteAppointment = async (appointment: Appointment) => {
    if (!confirm(`Are you sure you want to delete the appointment for ${appointment.patient.name} on ${formatDateDisplay(appointment.date)} at ${appointment.time}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/appointments/${appointment._id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete appointment');
      }

      toast.success('Appointment deleted successfully');
      
      // Refresh the appointments list
      const refreshResponse = await fetch('/api/appointments');
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        setAppointments(data.appointments || []);
      }
    } catch (error) {
      console.error('Error deleting appointment:', error);
      toast.error('Failed to delete appointment');
    } finally {
      closeDropdown();
    }
  };
  
  // After fetching appointments
  useEffect(() => {
    // Create a map of appointment times for fast lookup
    const appointmentTimeMap = new Map();
    
    // For each appointment, normalize and add to the map
    appointments.forEach(appointment => {
      const date = format(new Date(appointment.date), 'yyyy-MM-dd');
      const today = format(new Date(), 'yyyy-MM-dd');
      
      // Only create mappings for today's appointments
      if (date === today) {
        const parts = extractTimeParts(appointment.time);
        if (parts) {
          // Create a consistent key format for lookup
          const timeKey = `${parts.hours.toString().padStart(2, '0')}:${parts.minutes.toString().padStart(2, '0')} ${parts.period}`;
          appointmentTimeMap.set(timeKey, appointment);
          console.log(`Mapped appointment at ${timeKey} for ${appointment.patient.name}`);
        }
      }
    });
    
    // Save the map for use in the getAppointmentAtTime function
    setAppointmentMap(appointmentTimeMap);
    
  }, [appointments]);
  
  // Extract time parts for consistent comparison
  const extractTimeParts = (timeStr) => {
    // Handle different formats by extracting hour, minute and period
    const timeMatch = timeStr.match(/(\d+):(\d+)\s*(AM|PM|am|pm)/i);
    if (!timeMatch) return null;
    
    let [_, hours, minutes, period] = timeMatch;
    hours = parseInt(hours);
    minutes = parseInt(minutes);
    period = period.toUpperCase();
    
    return { hours, minutes, period };
  };
  
  // Check if we have appointments at a specific time slot
  const getAppointmentAtTime = (time: string) => {
    // Parse the current time slot
    const slotParts = extractTimeParts(time);
    if (!slotParts) return null;
    
    // Create a consistent key format for lookup
    const timeKey = `${slotParts.hours.toString().padStart(2, '0')}:${slotParts.minutes.toString().padStart(2, '0')} ${slotParts.period}`;
    
    // Check if we have an appointment at this exact time
    return appointmentMap.get(timeKey);
  };

  // Check if a time slot is occupied by any appointment (including duration)
  const isSlotOccupied = (timeSlot: string) => {
    const slotParts = extractTimeParts(timeSlot);
    if (!slotParts) return false;

    // Convert slot time to minutes since midnight
    let slotHour = slotParts.hours;
    if (slotParts.period === 'PM' && slotHour !== 12) slotHour += 12;
    if (slotParts.period === 'AM' && slotHour === 12) slotHour = 0;
    const slotTotalMinutes = slotHour * 60 + slotParts.minutes;

    // Check all appointments for today
    const today = format(new Date(), 'yyyy-MM-dd');
    const todaysAppointments = appointments.filter(apt => 
      format(new Date(apt.date), 'yyyy-MM-dd') === today
    );

    return todaysAppointments.some(appointment => {
      const aptParts = extractTimeParts(appointment.time);
      if (!aptParts) return false;

      // Convert appointment time to minutes since midnight
      let aptHour = aptParts.hours;
      if (aptParts.period === 'PM' && aptHour !== 12) aptHour += 12;
      if (aptParts.period === 'AM' && aptHour === 12) aptHour = 0;
      const aptTotalMinutes = aptHour * 60 + aptParts.minutes;

      // Get duration in minutes
      const durationStr = appointment.duration || '30 min';
      const durationMinutes = parseInt(durationStr.replace(/[^\d]/g, '')) || 30;

      // Check if this slot falls within the appointment duration
      return slotTotalMinutes >= aptTotalMinutes && slotTotalMinutes < (aptTotalMinutes + durationMinutes);
    });
  };
  
  // Generate display slots for Today's Schedule
  const getDisplayTimeSlots = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Check if scheduleSettings exists and has required properties
    if (!scheduleSettings || !scheduleSettings.workDays) {
      console.warn('Schedule settings not loaded or incomplete');
      return [];
    }
    
    // Check if today is a working day according to settings
    const isWorkingDay = scheduleSettings.workDays.includes(dayOfWeek);
    
    if (!isWorkingDay) {
      return []; // Return empty array if today is not a working day
    }
    
    // Generate time slots and add appointment/occupancy info
    try {
      const slots = generateTimeSlots(scheduleSettings);
      return slots.map(slot => {
        const appointment = getAppointmentAtTime(slot);
        const isOccupied = isSlotOccupied(slot);
        
        return {
          time: slot,
          appointment,
          isOccupied,
          isAvailable: !isOccupied && !appointment
        };
      });
    } catch (error) {
      console.error('Error generating time slots:', error);
      return [];
    }
  };

  // Function to handle time slot click
  const handleTimeSlotClick = (timeSlot: string) => {
    if (!getAppointmentAtTime(timeSlot) && !isSlotOccupied(timeSlot)) {
      // Open appointment form with pre-selected time and today's date
      openModal('newAppointment', {
        time: timeSlot,
        date: format(new Date(), 'yyyy-MM-dd')
      });
    }
  };

  // Get the appropriate time slots for today
  const displayTimeSlots = getDisplayTimeSlots();
  
  // Check if today is a working day
  const today = new Date();
  const dayOfWeek = today.getDay();
  const isWorkingDay = scheduleSettings.workDays.includes(dayOfWeek);
  
  // Day name for display
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = dayNames[dayOfWeek];
  
  // Load appointment types
  const loadAppointmentTypes = async () => {
    try {
      setAppointmentTypesLoading(true);
      const types = await getAppointmentTypes();
      setAppointmentTypes(types);
    } catch (error) {
      console.error('Error loading appointment types:', error);
      setAppointmentTypes(getDefaultAppointmentTypes());
    } finally {
      setAppointmentTypesLoading(false);
    }
  };

  // Get appointment type color for display
  const getTypeColor = (type: string) => {
    const typeObj = appointmentTypes.find(t => t.name === type);
    return typeObj ? getAppointmentTypeColorFromHex(typeObj.color) : 'bg-gray-500';
  };


  // Load appointments when settings, date, or filters change
  useEffect(() => {
    async function fetchAppointments() {
      try {
        setLoading(true);
        // Build query parameters
        const params = new URLSearchParams();
        
        // For the appointments list - apply filter based on toggle state
        if (!viewAllAppointments) {
          // Only show today's appointments when not viewing all
          const todayStr = format(new Date(), 'yyyy-MM-dd');
          params.append('date', todayStr);
        } else {
          // For "All Appointments" view, don't filter by date
          console.log('Fetching all appointments without date filter');
        }
        
        if (searchTerm) {
          params.append('search', searchTerm);
        }
        
        const response = await fetch(`/api/appointments?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch appointments');
        }
        
        const data = await response.json();
        
        // Normalize time format in appointments to match our time slots
        const normalizedAppointments = data.appointments.map(appt => {
          return {
            ...appt,
            time: normalizeTimeFormat(appt.time)
          };
        });
        
        console.log('Fetched appointments with normalized times:', 
          normalizedAppointments.map(a => ({
            id: a._id, 
            time: a.time, 
            originalTime: data.appointments.find(orig => orig._id === a._id).time,
            patient: a.patient.name
          }))
        );
        
        setAppointments(normalizedAppointments);
        
        // Calculate counts
        calculateCounts(normalizedAppointments);
        
      } catch (err) {
        setError(err.message);
        console.error('Error fetching appointments:', err);
      } finally {
        setLoading(false);
      }
    }
    
    // Store the fetchAppointments function in the ref
    fetchAppointmentsRef.current = fetchAppointments;
    
    // Execute the function
    fetchAppointments();
  }, [searchTerm, viewAllAppointments, appointmentTypes]);

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Appointments</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your schedule and patient appointments</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => openModal('viewCalendar')}>
            <CalendarIcon size={16} className="mr-2" />
            View Calendar
          </Button>
          <Button variant="primary" onClick={() => {
            try {
              console.log('Opening new appointment modal with date:', selectedDate);
              openModal('newAppointment', { date: selectedDate });
            } catch (error) {
              console.error('Error opening new appointment modal:', error);
            }
          }}>
            <PlusCircle size={18} className="mr-2" />
            New Appointment
          </Button>
        </div>
      </div>
      
      {/* Appointment Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800/30">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-medium text-indigo-700 dark:text-indigo-300">Today's Appts</h3>
              <p className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">{todayCount}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 dark:bg-indigo-800 dark:text-indigo-200">
              <CalendarIcon size={20} />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800/30">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Confirmed</h3>
              <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">{confirmedCount}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-200 flex items-center justify-center text-emerald-700 dark:bg-emerald-800 dark:text-emerald-200">
              <Check size={20} />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800/30">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-medium text-amber-700 dark:text-amber-300">Pending</h3>
              <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">{pendingCount}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center text-amber-700 dark:bg-amber-800 dark:text-amber-200">
              <Clock size={20} />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800/30">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-medium text-red-700 dark:text-red-300">Available Slots</h3>
              <p className="text-2xl font-bold text-red-900 dark:text-red-100">{availableSlots}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-red-200 flex items-center justify-center text-red-700 dark:bg-red-800 dark:text-red-200">
              <Stethoscope size={20} />
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Time Slots */}
        <div className="lg:col-span-1">
          <Card variant="bordered" className="h-full">
            <CardHeader className="px-6 py-4 flex flex-row items-center justify-between">
              <CardTitle className="text-lg">
                <span>
                  Today's Schedule 
                  <span className="ml-1 text-sm font-normal text-gray-500">
                    ({todayName}, {format(today, 'MMM d')})
                    {!isWorkingDay && <span className="ml-1 text-red-500">Closed</span>}
                  </span>
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {loading ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
                </div>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                  {!isWorkingDay ? (
                    <div className="text-center py-10 text-gray-500">
                      <Clock size={28} className="mx-auto mb-3" />
                      <h3 className="text-lg font-medium mb-1">Office is closed today</h3>
                      <p>No appointments are available on {todayName}s</p>
                    </div>
                  ) : displayTimeSlots.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                      <Clock size={28} className="mx-auto mb-3" />
                      <h3 className="text-lg font-medium mb-1">No time slots available</h3>
                      <p>Please check the schedule settings</p>
                    </div>
                  ) : (
                    displayTimeSlots.map(({ time, appointment, isOccupied, isAvailable }) => {
                      // Find appointment at this time slot
                      const appt = getAppointmentAtTime(time);
                      
                      const isBooked = !!appt; // Only true if appointment STARTS at this time
                      const isPending = appt && appt.status === 'Pending';
                      
                      return (
                        <div 
                          key={`time-${time}`} 
                          className={`p-3 rounded-md border flex flex-col
                            ${isBooked 
                              ? isPending
                                ? 'bg-warning-50 border-warning-200 dark:bg-warning-900/20 dark:border-warning-800/30 cursor-pointer'
                                : 'bg-gray-50 border-gray-200 dark:bg-gray-800/50 dark:border-gray-700 cursor-pointer' 
                              : isOccupied
                                ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800/30 cursor-not-allowed'
                                : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700 hover:border-primary-200 dark:hover:border-primary-800/30 cursor-pointer'
                            }`}
                          onClick={() => {
                            if (!isBooked && !isOccupied) {
                              try {
                                console.log('Opening appointment modal with time:', {
                                  originalTime: time,
                                  selectedDate
                                });
                                
                                openModal('newAppointment', { 
                                  time: time, // Pass the original 12-hour format time directly
                                  date: selectedDate
                                });
                              } catch (error) {
                                console.error('Error opening time slot:', error);
                                // Fallback to just opening the modal without time
                                openModal('newAppointment', { date: selectedDate });
                              }
                            } else if (appt) {
                              // Open appointment details for booked slots
                              console.log('Opening appointment details:', appt);
                              // Using dedicated appointment payment modal
                              openModal('appointmentPayment', appt);
                            }
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Clock size={16} className={
                                isBooked 
                                  ? isPending 
                                    ? 'text-warning-500' 
                                    : 'text-gray-400 dark:text-gray-500' 
                                  : isOccupied
                                    ? 'text-red-400 dark:text-red-500'
                                    : 'text-primary-500'
                              } />
                              <span className={`${
                                isBooked 
                                  ? isPending 
                                    ? 'text-warning-600 dark:text-warning-400' 
                                    : 'text-gray-600 dark:text-gray-400' 
                                  : isOccupied
                                    ? 'text-red-600 dark:text-red-400'
                                    : 'text-gray-900 dark:text-gray-100'
                              }`}>
                                {time}
                              </span>
                            </div>
                            {isBooked ? (
                              <span className={`text-xs px-2 py-1 rounded ${
                                isPending 
                                  ? 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400' 
                                  : appt?.status === 'Confirmed'
                                    ? 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400'
                                    : appt?.status === 'Cancelled'
                                    ? 'bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400'
                                    : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                              }`}>
                                {isPending ? 'Pending' : appt?.status || 'Booked'}
                              </span>
                            ) : isOccupied ? (
                              <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded dark:bg-red-900/30 dark:text-red-400">
                                Occupied
                              </span>
                            ) : (
                              <span className="text-xs bg-success-100 text-success-700 px-2 py-1 rounded dark:bg-success-900/30 dark:text-success-400">
                                Available
                              </span>
                            )}
                          </div>
                          
                          {isBooked && appt && (
                            <div className="mt-2 pl-6">
                              <div className="flex items-center gap-1">
                                <User size={14} className="text-gray-400" />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{appt.patient.name}</span>
                                {appt.patient.patientId && (
                                  <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded dark:bg-gray-700 dark:text-gray-300 ml-1">
                                    {appt.patient.patientId}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 mt-1">
                                <FileText size={14} className="text-gray-400" />
                                <span className="text-xs text-gray-500 dark:text-gray-400">{appt.type} • {appt.duration}</span>
                              </div>
                              {appt.reason && (
                                <div className="flex items-start gap-1 mt-1">
                                  <span className="text-gray-400 mt-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clipboard-list">
                                      <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/>
                                      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                                      <path d="M12 11h4"/>
                                      <path d="M12 16h4"/>
                                      <path d="M8 11h.01"/>
                                      <path d="M8 16h.01"/>
                                    </svg>
                                  </span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{appt.reason}</span>
                                </div>
                              )}
                              {appt.alerts && appt.alerts.length > 0 && (
                                <div className="mt-1 flex items-center gap-1">
                                  <AlertCircle size={14} className="text-warning-500" />
                                  <span className="text-xs text-warning-600 dark:text-warning-400">{appt.alerts.length} alert{appt.alerts.length > 1 ? 's' : ''}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Appointments List */}
        <div className="lg:col-span-2">
          <Card variant="bordered">
            <CardHeader className="px-6 py-4 flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center">
                <span>Appointments</span>
                <div className="relative ml-3">
                  <select 
                    className="px-3 py-1 text-xs font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:focus:ring-primary-400"
                    value={viewAllAppointments ? 'all' : 'today'}
                    onChange={(e) => setViewAllAppointments(e.target.value === 'all')}
                  >
                    <option value="today">Today Only</option>
                    <option value="all">View All</option>
                  </select>
                </div>
              </CardTitle>
              <div className="flex gap-3">
                <div className="relative w-64">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={16} className="text-gray-400" />
                  </div>
                  <Input 
                    className="pl-10 h-9 text-sm" 
                    placeholder="Search appointments..." 
                    value={searchTerm}
                    onChange={handleSearchChange}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
                </div>
              ) : error ? (
                <div className="text-center py-8 text-red-500">
                  <AlertCircle className="mx-auto mb-2" size={24} />
                  <p>{error}</p>
                </div>
              ) : appointments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CalendarIcon className="mx-auto mb-2" size={24} />
                  <p>No appointments found for this day</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {appointments.map((appointment) => (
                    <div key={appointment._id} className="p-5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex gap-4">
                          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium dark:bg-primary-900 dark:text-primary-300">
                            {appointment.patient.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                            <h3 className="font-medium text-gray-900 dark:text-white">{appointment.patient.name}</h3>
                              <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded dark:bg-gray-700 dark:text-gray-300">
                                {appointment.patient.patientId}
                              </span>
                            </div>
                            
                            <div className="flex gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                              <span className="flex items-center gap-1">
                                <Clock size={14} />
                                {appointment.time}
                              </span>
                              <span className="flex items-center gap-1">
                                <User size={14} />
                                {appointment.patient.age} • {appointment.duration}
                              </span>
                              <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium text-white ${getTypeColor(appointment.type)}`}>
                                {appointment.type}
                              </span>
                              {/* Payment status indicator */}
                              {appointment.paid ? (
                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                  <DollarSign size={12} />
                                  Paid
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                                  <DollarSign size={12} />
                                  Unpaid
                                </span>
                              )}
                            </div>
                            
                            <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2">
                              <div className="text-sm">
                                <div className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Visit Reason</div>
                                <div className="text-gray-700 dark:text-gray-300">{appointment.reason}</div>
                              </div>
                              
                              <div className="text-sm">
                                <div className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Provider</div>
                                <div className="text-gray-700 dark:text-gray-300">Dr. {appointment.doctor || session?.user?.name || 'Doctor'}</div>
                              </div>
                              
                              <div className="text-sm">
                                <div className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Date</div>
                                <div className="text-gray-700 dark:text-gray-300">{formatDateDisplay(appointment.date)}</div>
                              </div>
                              
                              <div className="text-sm">
                                <div className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Patient ID</div>
                                <div className="text-gray-700 dark:text-gray-300">{appointment.patient.patientId}</div>
                              </div>
                            </div>
                            
                            {appointment.patient.vitals && (
                              <div className="mt-3 flex gap-4">
                                {appointment.patient.vitals.bp && (
                                  <div className="flex items-center gap-1">
                                    <HeartPulse size={14} className="text-danger-500" />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">BP: {appointment.patient.vitals.bp}</span>
                                  </div>
                                )}
                                {appointment.patient.vitals.hr && (
                                  <div className="flex items-center gap-1">
                                    <HeartPulse size={14} className="text-warning-500" />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">HR: {appointment.patient.vitals.hr}</span>
                                  </div>
                                )}
                                {appointment.patient.vitals.temp && (
                                  <div className="flex items-center gap-1">
                                    <HeartPulse size={14} className="text-info-500" />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">Temp: {appointment.patient.vitals.temp}</span>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {appointment.notes && (
                              <div className="mt-3">
                                <div className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Notes</div>
                                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 border-l-2 border-gray-300 dark:border-gray-600 pl-3">
                                {appointment.notes}
                              </p>
                              </div>
                            )}
                            
                            {appointment.alerts && appointment.alerts.length > 0 && (
                              <div className="mt-3">
                                <div className="text-xs font-medium uppercase text-warning-500">Alerts</div>
                                <div className="mt-1">
                                  {appointment.alerts.map((alert, idx) => (
                                    <div key={idx} className="flex items-center gap-1 text-sm text-warning-600 dark:text-warning-400">
                                      <AlertCircle size={14} />
                                      <span>{alert}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          <span 
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                              ${appointment.status === 'Confirmed' 
                                ? 'bg-success-100 text-success-800 dark:bg-success-800/20 dark:text-success-400' 
                                : appointment.status === 'Pending'
                                ? 'bg-warning-100 text-warning-800 dark:bg-warning-800/20 dark:text-warning-400'
                                : appointment.status === 'Cancelled'
                                ? 'bg-danger-100 text-danger-800 dark:bg-danger-800/20 dark:text-danger-400'
                                : appointment.status === 'Completed'
                                ? 'bg-info-100 text-info-800 dark:bg-info-800/20 dark:text-info-400'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-800/20 dark:text-gray-400'
                              }`}
                          >
                            {appointment.status}
                          </span>
                          
                          <div className="flex gap-1">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleStatusChange(appointment._id, 'Confirmed')}
                              disabled={appointment.status === 'Confirmed'}
                            >
                              <Check size={14} className="text-success-500" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleStatusChange(appointment._id, 'Cancelled')}
                              disabled={appointment.status === 'Cancelled'}
                            >
                              <X size={14} className="text-danger-500" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => processPayment(appointment)}
                              disabled={appointment.paid}
                              className={appointment.paid 
                                ? "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-800/20 dark:border-gray-600 dark:text-gray-500"
                                : "bg-green-50 border-green-200 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:border-green-800/30 dark:text-green-400 dark:hover:bg-green-900/30"
                              }
                              title={appointment.paid ? "Payment already processed" : "Process payment"}
                            >
                              <DollarSign size={14} />
                            </Button>
                            <div className="relative">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => toggleDropdown(appointment._id)}
                              >
                                <MoreHorizontal size={14} />
                              </Button>
                              <DropdownMenu 
                                isOpen={activeDropdown === appointment._id}
                                onClose={closeDropdown}
                              >
                                <DropdownMenuItem 
                                  icon={<Receipt size={14} className="text-primary-500" />}
                                  onClick={() => viewInvoice(appointment)}
                                >
                                  View Invoice
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  icon={<Printer size={14} className="text-gray-500" />}
                                  onClick={() => printInvoice(appointment)}
                                >
                                  Print Invoice
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  icon={<FileDown size={14} className="text-green-500" />}
                                  onClick={() => downloadInvoicePDF(appointment)}
                                >
                                  Download PDF
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  icon={<Trash2 size={14} className="text-red-500" />}
                                  onClick={() => deleteAppointment(appointment)}
                                >
                                  Delete Appointment
                                </DropdownMenuItem>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
} 