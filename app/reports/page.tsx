'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSettings } from '@/lib/settings-context';
import { 
  Calendar, 
  Users, 
  DollarSign, 
  Pill, 
  TrendingUp, 
  Download,
  RefreshCw,
  BarChart3,
  PieChart,
  Activity,
  Clock,
  UserCheck,
  FileText,
  Search,
  CalendarRange
} from 'lucide-react';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO, isWithinInterval } from 'date-fns';

interface ReportData {
  // Patient Stats
  totalPatients: number;
  newPatientsInRange: number;
  patientsByAge: { ageGroup: string; count: number }[];
  patientsByGender: { gender: string; count: number }[];
  
  // Appointment Stats
  totalAppointments: number;
  appointmentsInRange: number;
  appointmentsByType: { type: string; count: number }[];
  appointmentsByStatus: { status: string; count: number }[];
  
  // Revenue Stats
  totalRevenue: number;
  revenueInRange: number;
  revenueByType: { type: string; revenue: number }[];
  
  // Prescription Stats
  totalPrescriptions: number;
  prescriptionsInRange: number;
  topMedications: { medication: string; count: number }[];
  
  // Daily/Weekly trends
  dailyAppointments: { date: string; count: number }[];
  weeklyRevenue: { week: string; revenue: number }[];
}

export default function ReportsPage() {
  const { formatDate, formatCurrency } = useSettings();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Date filter states
  const [fromDate, setFromDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd')); // Default to last 30 days
  const [toDate, setToDate] = useState(format(new Date(), 'yyyy-MM-dd')); // Default to today
  
  // Fetch report data
  const fetchReportData = async () => {
    try {
      setLoading(true);
      
      // Fetch data from multiple endpoints
      const [patientsRes, appointmentsRes, prescriptionsRes, paymentsRes] = await Promise.all([
        fetch('/api/patients?limit=1000'),
        fetch('/api/appointments?limit=1000'),
        fetch('/api/prescriptions?limit=1000'),
        fetch('/api/payments?limit=1000').catch(() => ({ ok: false, json: () => Promise.resolve({ payments: [] }) })) // Payments might not exist
      ]);
      
      const patientsData = patientsRes.ok ? await patientsRes.json() : { patients: [] };
      const appointmentsData = appointmentsRes.ok ? await appointmentsRes.json() : { appointments: [] };
      const prescriptionsData = prescriptionsRes.ok ? await prescriptionsRes.json() : { prescriptions: [] };
      const paymentsData = paymentsRes.ok ? await paymentsRes.json() : { payments: [] };
      
      // Process and calculate statistics
      const processedData = processReportData({
        patients: patientsData.patients || [],
        appointments: appointmentsData.appointments || [],
        prescriptions: prescriptionsData.prescriptions || [],
        payments: paymentsData.payments || []
      });
      
      setReportData(processedData);
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Process raw data into report statistics
  const processReportData = (data: any): ReportData => {
    const dateRange = { start: parseISO(fromDate), end: parseISO(toDate) };
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    
    // Patient statistics
    const totalPatients = data.patients.length || 0;
    const newPatientsInRange = data.patients.filter((p: any) => {
      try {
        if (!p.registrationDate && !p.createdAt) return false;
        const registrationDate = parseISO(p.registrationDate || p.createdAt);
        return isWithinInterval(registrationDate, dateRange);
      } catch {
        return false;
      }
    }).length;
    
    // Age group categorization
    const patientsByAge = data.patients.reduce((acc: any, p: any) => {
      let ageGroup = 'Unknown';
      if (p.age) {
        if (p.age < 18) ageGroup = '0-17';
        else if (p.age < 35) ageGroup = '18-34';
        else if (p.age < 50) ageGroup = '35-49';
        else if (p.age < 65) ageGroup = '50-64';
      else ageGroup = '65+';
      }
      acc[ageGroup] = (acc[ageGroup] || 0) + 1;
      return acc;
    }, {});
    
    // Gender categorization
    const patientsByGender = data.patients.reduce((acc: any, p: any) => {
      const gender = p.gender || 'Unknown';
      acc[gender] = (acc[gender] || 0) + 1;
      return acc;
    }, {});
    
    // Appointment statistics
    const totalAppointments = data.appointments.length || 0;
    const appointmentsInRange = data.appointments.filter((a: any) => {
      try {
        const appointmentDate = parseISO(a.date);
        return isWithinInterval(appointmentDate, dateRange);
      } catch {
        return false;
      }
    });
    const appointmentsInRangeCount = appointmentsInRange.length;
    
    const appointmentsByType = appointmentsInRange.reduce((acc: any, apt: any) => {
      const type = apt.type || apt.appointmentType || 'General';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    
    const appointmentsByStatus = appointmentsInRange.reduce((acc: any, apt: any) => {
      const status = apt.status || 'Unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    
    // Revenue calculations from actual payment data
    const payments = data.payments || [];
    
    // Calculate total revenue from all payments
    const totalRevenue = payments.reduce((sum: number, payment: any) => {
      // Only count completed/paid payments
      if (payment.status === 'Paid' || payment.status === 'Completed' || payment.status === 'paid') {
        return sum + (payment.amount || 0);
      }
      return sum;
    }, 0);
    
    // Calculate revenue in selected date range from payments
    const paymentsInRange = payments.filter((payment: any) => {
      try {
        if (!payment.date && !payment.createdAt) return false;
        const paymentDate = parseISO(payment.date || payment.createdAt);
        return isWithinInterval(paymentDate, dateRange);
      } catch {
        return false;
      }
    });
    
    const revenueInRange = paymentsInRange.reduce((sum: number, payment: any) => {
      // Only count completed/paid payments
      if (payment.status === 'Paid' || payment.status === 'Completed' || payment.status === 'paid') {
        return sum + (payment.amount || 0);
      }
      return sum;
    }, 0);
    
    // Revenue by payment method or service type
    const revenueByTypeObj = paymentsInRange.reduce((acc: Record<string, { type: string; revenue: number }>, payment: any) => {
      if (payment.status === 'Paid' || payment.status === 'Completed' || payment.status === 'paid') {
        const type = payment.description || payment.paymentMethod || 'Unknown';
        if (!acc[type]) {
          acc[type] = { type, revenue: 0 };
        }
        acc[type].revenue += (payment.amount || 0);
      }
      return acc;
    }, {});
    
    const revenueByType: { type: string; revenue: number }[] = Object.values(revenueByTypeObj);
    
    // Prescription statistics
    const totalPrescriptions = data.prescriptions.length || 0;
    const prescriptionsInRange = data.prescriptions.filter((p: any) => {
      try {
        if (!p.date && !p.createdAt) return false;
        const prescriptionDate = parseISO(p.date || p.createdAt);
        return isWithinInterval(prescriptionDate, dateRange);
      } catch {
        return false;
      }
    }).length;
    
    const medicationCounts = data.prescriptions.reduce((acc: Record<string, number>, prescription: any) => {
      try {
        // Handle both single medication and medications array
        let medications: any[] = [];
        
        if (prescription.medications && Array.isArray(prescription.medications)) {
          medications = prescription.medications;
        } else if (prescription.medication) {
          medications = [prescription.medication];
        } else if (prescription.medicationName) {
          medications = [prescription.medicationName];
        }
        
        medications.filter(Boolean).forEach((med: any) => {
          let medName = 'Unknown';
          if (typeof med === 'string') {
            medName = med;
          } else if (med && typeof med === 'object') {
            medName = med.name || med.medication || med.medicationName || 'Unknown';
          }
          
          acc[medName] = (acc[medName] || 0) + 1;
        });
      } catch (error) {
        console.warn('Error processing prescription medications:', error);
      }
      return acc;
    }, {});
    
    const topMedications = Object.entries(medicationCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 10)
      .map(([medication, count]) => ({ medication, count: count as number }));
    
    // Daily appointments trend (for the selected date range)
    const daysDiff = Math.min(Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)), 30); // Max 30 days
    const dailyAppointments = Array.from({ length: Math.max(daysDiff + 1, 1) }, (_, i) => {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const count = appointmentsInRange.filter((a: any) => {
        try {
          return a.date === dateStr || format(parseISO(a.date), 'yyyy-MM-dd') === dateStr;
        } catch {
          return false;
        }
      }).length;
      return { date: format(date, 'MMM dd'), count };
    });
    
    // Weekly revenue trend (for the selected date range, max 8 weeks)
    const weeksDiff = Math.min(Math.max(Math.ceil(daysDiff / 7), 1), 8);
    const weeklyRevenue = Array.from({ length: weeksDiff }, (_, i) => {
      const weekStart = new Date(startDate);
      weekStart.setDate(weekStart.getDate() + (i * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      // Ensure week end doesn't exceed our end date
      if (weekEnd > endDate) {
        weekEnd.setTime(endDate.getTime());
      }
      
      // Get payments in this week range
      const weekPayments = paymentsInRange.filter((payment: any) => {
        try {
          const paymentDate = parseISO(payment.date || payment.createdAt);
          return paymentDate >= weekStart && paymentDate <= weekEnd;
        } catch {
          return false;
        }
      });
      
      const revenue = weekPayments.reduce((sum: number, payment: any) => {
        if (payment.status === 'Paid' || payment.status === 'Completed' || payment.status === 'paid') {
          return sum + (payment.amount || 0);
        }
        return sum;
      }, 0);
      
      return { 
        week: `${format(weekStart, 'MMM dd')} - ${format(weekEnd, 'MMM dd')}`, 
        revenue 
      };
    });
    
    return {
      totalPatients,
      newPatientsInRange,
      patientsByAge: Object.entries(patientsByAge).map(([ageGroup, count]) => ({ ageGroup, count: count as number })),
      patientsByGender: Object.entries(patientsByGender).map(([gender, count]) => ({ gender, count: count as number })),
      
      totalAppointments,
      appointmentsInRange: appointmentsInRangeCount,
      appointmentsByType: Object.entries(appointmentsByType).map(([type, count]) => ({ type, count: count as number })),
      appointmentsByStatus: Object.entries(appointmentsByStatus).map(([status, count]) => ({ status, count: count as number })),
      
      totalRevenue,
      revenueInRange,
      revenueByType,
      
      totalPrescriptions,
      prescriptionsInRange,
      topMedications,
      
      dailyAppointments,
      weeklyRevenue
    };
  };
  
  useEffect(() => {
    fetchReportData();
  }, [fromDate, toDate]); // Refetch when date range changes
  
  // Export data as CSV
  const exportToCSV = (data: any[], filename: string) => {
    if (!data.length) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header]}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${fromDate}-to-${toDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };
  
  // Download as PDF
  const downloadPDF = () => {
    if (!reportData) return;
    
    // Create a new window with the report content
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to download the PDF');
      return;
    }
    
    // Write the PDF-optimized HTML
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Practice Reports - ${format(parseISO(fromDate), 'MMM dd, yyyy')} to ${format(parseISO(toDate), 'MMM dd, yyyy')}</title>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              color: #333;
              line-height: 1.5;
              margin: 20px;
              padding: 0;
            }
            .container {
              max-width: 800px;
              margin: 0 auto;
            }
            h1 {
              color: #222;
              margin-bottom: 10px;
            }
            h2 {
              color: #444;
              margin: 30px 0 15px 0;
              padding-bottom: 10px;
              border-bottom: 2px solid #ddd;
              font-size: 20px;
            }
            .subtitle {
              color: #666;
              margin-bottom: 30px;
            }
            .grid {
              display: grid;
              gap: 20px;
              margin-bottom: 30px;
            }
            .card {
              border: 1px solid #ddd;
              border-radius: 8px;
              padding: 20px;
              background: #fff;
            }
            .card-header {
              margin-bottom: 15px;
              padding-bottom: 10px;
              border-bottom: 1px solid #eee;
            }
            .card-title {
              font-size: 18px;
              font-weight: 600;
              color: #333;
            }
            .metric-card {
              text-align: center;
              padding: 30px 20px;
            }
            .metric-value {
              font-size: 32px;
              font-weight: bold;
              margin: 10px 0;
            }
            .metric-label {
              font-size: 14px;
              color: #666;
              margin-bottom: 5px;
            }
            .metric-sub {
              font-size: 12px;
              color: #888;
            }
            .chart-item {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 8px 0;
              border-bottom: 1px solid #f0f0f0;
            }
            .chart-item:last-child {
              border-bottom: none;
            }
            .chart-label {
              font-weight: 500;
            }
            .chart-value {
              font-weight: bold;
            }
            .chart-percent {
              font-size: 12px;
              color: #666;
              margin-left: 8px;
            }
            @media print {
              body { margin: 0; }
              .container { max-width: none; }
            }
          </style>
        </head>
        <body onload="setTimeout(function() { window.print(); setTimeout(function() { window.close(); }, 500); }, 300);">
          <div class="container">
            <h1>Practice Reports</h1>
            <p class="subtitle">Generated on ${new Date().toLocaleDateString()}</p>
            
            <h2>Overall Practice Statistics (All Time)</h2>
            <div class="grid" style="grid-template-columns: repeat(4, 1fr);">
              <div class="card metric-card" style="background: #f0f7ff; border-color: #3b82f6;">
                <div class="metric-label">Total Patients</div>
                <div class="metric-value" style="color: #1d4ed8;">${reportData.totalPatients}</div>
              </div>
              <div class="card metric-card" style="background: #f0fdf4; border-color: #10b981;">
                <div class="metric-label">Total Revenue</div>
                <div class="metric-value" style="color: #047857;">$${formatCurrency(reportData.totalRevenue)}</div>
              </div>
              <div class="card metric-card" style="background: #faf5ff; border-color: #8b5cf6;">
                <div class="metric-label">Total Appointments</div>
                <div class="metric-value" style="color: #7c3aed;">${reportData.totalAppointments}</div>
              </div>
              <div class="card metric-card" style="background: #fff7ed; border-color: #f59e0b;">
                <div class="metric-label">Total Prescriptions</div>
                <div class="metric-value" style="color: #d97706;">${reportData.totalPrescriptions}</div>
              </div>
            </div>
            
            <div class="card">
              <div class="card-header">
                <div class="card-title">Patient Demographics (All Time)</div>
              </div>
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 40px;">
                <div>
                  <div style="font-weight: 600; margin-bottom: 15px;">By Age Group</div>
                  ${reportData.patientsByAge.map(item => `
                    <div class="chart-item">
                      <span>${item.ageGroup}</span>
                      <span class="chart-value">${item.count}</span>
                    </div>
                  `).join('')}
                </div>
                <div>
                  <div style="font-weight: 600; margin-bottom: 15px;">By Gender</div>
                  ${reportData.patientsByGender.map(item => `
                    <div class="chart-item">
                      <span>${item.gender}</span>
                      <span class="chart-value">${item.count}</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
            
            <h2>Date Range Analysis: ${format(parseISO(fromDate), 'MMM dd, yyyy')} to ${format(parseISO(toDate), 'MMM dd, yyyy')}</h2>
            <div class="grid" style="grid-template-columns: repeat(4, 1fr);">
              <div class="card metric-card" style="background: #f0f7ff; border-color: #3b82f6;">
                <div class="metric-label">New Patients</div>
                <div class="metric-value" style="color: #1d4ed8;">${reportData.newPatientsInRange}</div>
              </div>
              <div class="card metric-card" style="background: #f0fdf4; border-color: #10b981;">
                <div class="metric-label">Revenue</div>
                <div class="metric-value" style="color: #047857;">$${formatCurrency(reportData.revenueInRange)}</div>
              </div>
              <div class="card metric-card" style="background: #faf5ff; border-color: #8b5cf6;">
                <div class="metric-label">Appointments</div>
                <div class="metric-value" style="color: #7c3aed;">${reportData.appointmentsInRange}</div>
              </div>
              <div class="card metric-card" style="background: #fff7ed; border-color: #f59e0b;">
                <div class="metric-label">Prescriptions</div>
                <div class="metric-value" style="color: #d97706;">${reportData.prescriptionsInRange}</div>
              </div>
            </div>
            
            <div class="grid" style="grid-template-columns: repeat(2, 1fr);">
              <div class="card">
                <div class="card-header">
                  <div class="card-title">Appointments by Type</div>
                </div>
                ${reportData.appointmentsByType.length > 0 ? reportData.appointmentsByType.map(item => `
                  <div class="chart-item">
                    <span class="chart-label">${item.type}</span>
                    <span>
                      <span class="chart-value">${item.count}</span>
                      <span class="chart-percent">${((item.count / Math.max(reportData.appointmentsInRange, 1)) * 100).toFixed(1)}%</span>
                    </span>
                  </div>
                `).join('') : '<div style="text-align: center; color: #666;">No appointments in this date range</div>'}
              </div>
              
              <div class="card">
                <div class="card-header">
                  <div class="card-title">Revenue by Service</div>
                </div>
                ${reportData.revenueByType.length > 0 ? reportData.revenueByType.map(item => `
                  <div class="chart-item">
                    <span class="chart-label">${item.type}</span>
                    <span>
                      <span class="chart-value">$${item.revenue.toLocaleString()}</span>
                      <span class="chart-percent">${reportData.revenueInRange > 0 ? ((item.revenue / reportData.revenueInRange) * 100).toFixed(1) : '0'}%</span>
                    </span>
                  </div>
                `).join('') : '<div style="text-align: center; color: #666;">No revenue in this date range</div>'}
              </div>
            </div>
            
            <div class="card">
              <div class="card-header">
                <div class="card-title">Most Prescribed Medications (Date Range)</div>
              </div>
              ${reportData.topMedications.length > 0 ? reportData.topMedications.slice(0, 10).map((item, index) => `
                <div class="chart-item">
                  <span class="chart-label">${index + 1}. ${item.medication}</span>
                  <span class="chart-value">${item.count}</span>
                </div>
              `).join('') : '<div style="text-align: center; color: #666;">No prescriptions in this date range</div>'}
            </div>
            
            <div style="margin-top: 30px; text-align: center; color: #666; font-size: 12px;">
              DoctorCare Medical Practice - Practice Report
            </div>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  };
  
  // Quick date range presets
  const setQuickRange = (days: number) => {
    const end = new Date();
    const start = subDays(end, days);
    setFromDate(format(start, 'yyyy-MM-dd'));
    setToDate(format(end, 'yyyy-MM-dd'));
  };
  
  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
        </div>
      </DashboardLayout>
    );
  }
  
  if (!reportData) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <p className="text-gray-500">Failed to load report data</p>
          <Button onClick={fetchReportData} className="mt-4">
            <RefreshCw size={16} className="mr-2" />
            Retry
          </Button>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <style jsx>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-container {
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>
      
      <div className="no-print flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Practice Reports</h1>
          <p className="text-gray-600 dark:text-gray-400">Real-time analytics from your practice data</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchReportData}>
            <RefreshCw size={16} className="mr-2" />
            Refresh Data
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <Download size={16} className="mr-2" />
            Print
          </Button>
          <Button variant="primary" onClick={downloadPDF}>
            <Download size={16} className="mr-2" />
            Download PDF
          </Button>
        </div>
      </div>
      
      <div id="report-content" className="print-container">
      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Patients</p>
                <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{reportData.totalPatients}</p>
                <p className="text-xs text-blue-600 dark:text-blue-400">+{reportData.newPatientsInRange} in date range</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-300">Total Revenue</p>
                <p className="text-3xl font-bold text-green-900 dark:text-green-100">{formatCurrency(reportData.totalRevenue)}</p>
                <p className="text-xs text-green-600 dark:text-green-400">{formatCurrency(reportData.revenueInRange)} in date range</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Appointments</p>
                <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">{reportData.totalAppointments}</p>
                <p className="text-xs text-purple-600 dark:text-purple-400">{reportData.appointmentsInRange} in date range</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
                <div>
                <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Prescriptions</p>
                <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">{reportData.totalPrescriptions}</p>
                <p className="text-xs text-orange-600 dark:text-orange-400">{reportData.prescriptionsInRange} in date range</p>
              </div>
              <Pill className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Date Range Filter */}
      <Card className="no-print mb-6">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center">
            <CalendarRange size={20} className="mr-2" />
            Date Range Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                From Date
              </label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                To Date
              </label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setQuickRange(7)}>
                Last 7 Days
              </Button>
              <Button variant="outline" size="sm" onClick={() => setQuickRange(30)}>
                Last 30 Days
              </Button>
              <Button variant="outline" size="sm" onClick={() => setQuickRange(90)}>
                Last 3 Months
              </Button>
            </div>
          </div>
          <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            Showing data from <strong>{format(parseISO(fromDate), 'MMM dd, yyyy')}</strong> to <strong>{format(parseISO(toDate), 'MMM dd, yyyy')}</strong>
          </div>
        </CardContent>
      </Card>
      
      {/* Charts and Detailed Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Appointment Types Chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Appointments by Type (Date Range)</CardTitle>
            <Button variant="outline" size="sm" onClick={() => exportToCSV(reportData.appointmentsByType, 'appointments-by-type')}>
              <Download size={14} className="mr-1" />
              Export
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportData.appointmentsByType.length > 0 ? reportData.appointmentsByType.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${
                      ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 'bg-purple-500'][index % 5]
                    }`}></div>
                    <span className="text-sm font-medium">{item.type}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold">{item.count}</span>
                    <span className="text-xs text-gray-500 ml-2">
                      {((item.count / Math.max(reportData.appointmentsInRange, 1)) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-gray-500">
                  No appointments found in the selected date range
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Revenue by Service Type */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Revenue by Service (Date Range)</CardTitle>
            <Button variant="outline" size="sm" onClick={() => exportToCSV(reportData.revenueByType, 'revenue-by-type')}>
              <Download size={14} className="mr-1" />
              Export
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportData.revenueByType.length > 0 ? reportData.revenueByType.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${
                      ['bg-emerald-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-pink-500', 'bg-amber-500'][index % 5]
                    }`}></div>
                    <span className="text-sm font-medium">{item.type}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold">${item.revenue.toLocaleString()}</span>
                    <span className="text-xs text-gray-500 ml-2">
                      {reportData.revenueInRange > 0 ? ((item.revenue / reportData.revenueInRange) * 100).toFixed(1) : '0'}%
                    </span>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-gray-500">
                  No revenue data found in the selected date range
                </div>
              )}
              </div>
            </CardContent>
          </Card>
      </div>
      
      {/* Patient Demographics and Top Medications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Patient Demographics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Patient Demographics (All Time)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              {/* Age Groups */}
              <div>
                <h4 className="font-medium mb-3">By Age Group</h4>
                <div className="space-y-2">
                  {reportData.patientsByAge.map((item, index) => (
                    <div key={index} className="flex justify-between">
                      <span className="text-sm">{item.ageGroup}</span>
                      <span className="text-sm font-medium">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Gender */}
              <div>
                <h4 className="font-medium mb-3">By Gender</h4>
                <div className="space-y-2">
                  {reportData.patientsByGender.map((item, index) => (
                    <div key={index} className="flex justify-between">
                      <span className="text-sm">{item.gender}</span>
                      <span className="text-sm font-medium">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Top Medications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Most Prescribed Medications (Date Range)</CardTitle>
            <Button variant="outline" size="sm" onClick={() => exportToCSV(reportData.topMedications, 'top-medications')}>
              <Download size={14} className="mr-1" />
              Export
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reportData.topMedications.length > 0 ? reportData.topMedications.slice(0, 8).map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-4 text-center mr-3">
                      {index + 1}
                    </span>
                    <span className="text-sm">{item.medication}</span>
                  </div>
                  <span className="text-sm font-bold">{item.count}</span>
                </div>
              )) : (
                <div className="text-center py-8 text-gray-500">
                  No prescriptions found in the selected date range
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Appointments Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Daily Appointments (Date Range)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reportData.dailyAppointments.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm">{item.date}</span>
                  <div className="flex items-center">
                    <div className="w-20 h-4 bg-gray-200 dark:bg-gray-700 rounded-full mr-3">
                      <div 
                        className="h-4 bg-blue-500 rounded-full" 
                        style={{ width: `${Math.max((item.count / Math.max(...reportData.dailyAppointments.map(d => d.count), 1)) * 100, 5)}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium w-8 text-right">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Weekly Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Weekly Revenue Trend (Date Range)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reportData.weeklyRevenue.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-xs">{item.week}</span>
                  <div className="flex items-center">
                    <div className="w-20 h-4 bg-gray-200 dark:bg-gray-700 rounded-full mr-3">
                      <div 
                        className="h-4 bg-green-500 rounded-full" 
                        style={{ width: `${Math.max((item.revenue / Math.max(...reportData.weeklyRevenue.map(w => w.revenue), 1)) * 100, 5)}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">${item.revenue.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </DashboardLayout>
  );
} 