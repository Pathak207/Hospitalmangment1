'use client';

import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useModal } from '@/components/ui/modal-provider';
import { Search, PlusCircle, FileText, Calendar, X, Download, Printer, MoreHorizontal, AlertCircle, Clock, User, CheckCircle, Pill, RefreshCw, AlertTriangle, Repeat, RotateCcw, BarChart, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { useSettings } from '@/lib/settings-context';
import { toast } from 'react-hot-toast';

export default function PrescriptionsPage() {
  const { openModal, closeModal } = useModal();
  const { data: session, status } = useSession();
  const { settings, formatDate } = useSettings();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [openPopoverId, setOpenPopoverId] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  const prescriptionRef = useRef(null);

  // Practice info from settings context
  const practiceInfo = {
    practiceName: settings.practiceName,
    taxId: settings.taxId,
    phone: settings.phone,
    email: settings.email,
    address: "123 Medical Center Dr.",
    city: "Healthville",
    state: "CA",
    zip: "12345"
  };

  useEffect(() => {
    if (status === 'authenticated') {
      // Debounce search to avoid too many API calls
      const debounceSearch = setTimeout(() => {
        fetchPrescriptions();
      }, searchQuery ? 300 : 0); // 300ms delay for search, immediate for initial load

      return () => clearTimeout(debounceSearch);
    }
  }, [session, pagination.page, searchQuery, status]);

  const fetchPrescriptions = async () => {
    if (status !== 'authenticated') return;

    try {
      setLoading(true);
      
      let queryParams = new URLSearchParams();
      queryParams.append('page', pagination.page.toString());
      queryParams.append('limit', pagination.limit.toString());
      
      if (searchQuery) {
        queryParams.append('search', searchQuery);
      }
      
      const response = await fetch(`/api/prescriptions?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch prescriptions');
      }
      
      const data = await response.json();
      setPrescriptions(data.prescriptions);
      setPagination(prev => ({
        ...prev,
        total: data.pagination.total,
        totalPages: data.pagination.totalPages
      }));
      
    } catch (err) {
      console.error('Error fetching prescriptions:', err);
      setError('Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handlePrintPrescription = (prescription) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      console.error('Unable to open print window');
      return;
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Prescription - ${prescription.patient?.name || 'Unknown Patient'}</title>
          <meta charset="utf-8">
          <style>
            @page {
              margin: 0.75in;
              size: A4;
            }
            
            body {
              font-family: 'Times New Roman', serif;
              font-size: 14px;
              line-height: 1.4;
              color: #000;
              margin: 0;
              padding: 20px;
              background: white;
            }
            
            .prescription-header {
              text-align: center;
              border-bottom: 2px solid #000;
              padding-bottom: 15px;
              margin-bottom: 20px;
            }
            
            .practice-name {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            
            .practice-info {
              font-size: 12px;
              color: #333;
            }
            
            .patient-info {
              display: flex;
              justify-content: space-between;
              margin-bottom: 20px;
              padding: 10px 0;
              border-bottom: 1px solid #ccc;
            }
            
            .medications-section {
              margin: 20px 0;
            }
            
            .medication-item {
              margin-bottom: 15px;
              padding: 10px;
              border: 1px solid #ddd;
            }
            
            .medication-name {
              font-weight: bold;
              font-size: 16px;
            }
            
            .medication-details {
              margin-top: 5px;
              color: #333;
            }
            
            .signature-section {
              margin-top: 40px;
              display: flex;
              justify-content: space-between;
              align-items: end;
            }
            
            .signature-line {
              border-top: 1px solid #000;
              width: 200px;
              text-align: center;
              padding-top: 5px;
              font-size: 12px;
            }
            
            .additional-info {
              margin: 15px 0;
              padding: 10px;
              background-color: #f9f9f9;
              border-left: 3px solid #007bff;
            }
            
            h1, h2, h3 {
              margin: 10px 0;
            }
            
            .prescription-id {
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="prescription-header">
            <div class="practice-name">${practiceInfo.practiceName}</div>
            <div class="practice-info">
              ${practiceInfo.address}, ${practiceInfo.city}, ${practiceInfo.state} ${practiceInfo.zip}<br>
              Phone: ${practiceInfo.phone} | Email: ${practiceInfo.email}<br>
              Tax ID: ${practiceInfo.taxId}
            </div>
          </div>

          <h2 style="text-align: center; margin: 20px 0;">PRESCRIPTION</h2>

          <div class="patient-info">
            <div>
              <strong>Patient:</strong> ${prescription.patient?.name || 'Unknown Patient'}<br>
              <strong>Patient ID:</strong> ${prescription.patient?.patientId || 'No ID'}<br>
              <strong>Age/Gender:</strong> ${prescription.patient?.age || '--'} y/o, ${prescription.patient?.gender || '--'}
            </div>
            <div style="text-align: right;">
              <div class="prescription-id">
                <strong>Prescription ID:</strong> ${prescription.prescriptionId || 'No ID'}<br>
                <strong>Date:</strong> ${prescription.prescriptionDate ? formatDate(prescription.prescriptionDate) : 'No Date'}<br>
                <strong>Status:</strong> ${prescription.status || 'Active'}
              </div>
            </div>
          </div>

          <div class="medications-section">
            <h3>MEDICATIONS PRESCRIBED:</h3>
            ${prescription.medications?.map((med, idx) => `
              <div class="medication-item">
                <div class="medication-name">${idx + 1}. ${med.name}</div>
                <div class="medication-details">
                  <strong>Dosage:</strong> ${med.dosage}<br>
                  <strong>Frequency:</strong> ${med.frequency}<br>
                  <strong>Duration:</strong> ${med.duration}
                  ${med.instructions ? `<br><strong>Instructions:</strong> ${med.instructions}` : ''}
                </div>
              </div>
            `).join('')}
          </div>

          ${prescription.diagnosis ? `
            <div class="additional-info">
              <strong>Diagnosis:</strong> ${prescription.diagnosis}
            </div>
          ` : ''}

          ${prescription.notes ? `
            <div class="additional-info">
              <strong>Notes:</strong> ${prescription.notes}
            </div>
          ` : ''}

          <div class="signature-section">
            <div>
              <strong>Prescriber:</strong> ${prescription.doctor?.name || prescription.prescribedBy?.name || 'Doctor'}
            </div>
            <div class="signature-line">
              Signature & Date
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Wait for content to load, then print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    };
  };

  const handleViewPrescription = (prescription) => {
    openModal({
      title: "Prescription Details",
      content: (
        <div className="space-y-6">
          {/* Practice Header */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="text-center mb-4 pb-4">
              <h1 className="text-xl font-bold text-gray-900">{practiceInfo.practiceName}</h1>
              <div className="text-sm text-gray-600 mt-2">
                <p>{practiceInfo.address}, {practiceInfo.city}, {practiceInfo.state} {practiceInfo.zip}</p>
                <p>Phone: {practiceInfo.phone} | Email: {practiceInfo.email}</p>
                <p>Tax ID: {practiceInfo.taxId}</p>
              </div>
            </div>
            
            {/* Prescription Header */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-lg font-bold">{prescription.patient?.name || 'Unknown Patient'}</h2>
                <div className="text-sm text-gray-600 mt-1">
                  <p><strong>Patient ID:</strong> {prescription.patient?.patientId || 'No ID'}</p>
                  <p><strong>Age/Gender:</strong> {prescription.patient?.age || '--'} y/o, {prescription.patient?.gender || '--'}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                  ${prescription.status === 'Completed' 
                    ? 'bg-green-100 text-green-800' 
                    : prescription.status === 'Pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : prescription.status === 'Discontinued'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-blue-100 text-blue-800'}`}
                >
                  {prescription.status}
                </span>
                <div className="mt-2 text-sm text-gray-600">
                  <p><strong>Rx #:</strong> {prescription.prescriptionId}</p>
                  <p><strong>Date:</strong> {prescription.prescriptionDate ? formatDate(prescription.prescriptionDate) : 'No Date'}</p>
                </div>
              </div>
            </div>
            
            {/* Medications */}
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-3 text-gray-900">Medications</h3>
              <div className="space-y-3">
                {prescription.medications?.map((med, idx) => (
                  <div key={idx} className="p-4 bg-white rounded-lg shadow-sm">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{med.name}</p>
                        <p className="text-sm text-gray-600 mt-1">{med.dosage}</p>
                        {med.instructions && (
                          <p className="text-sm text-gray-700 mt-2 italic">{med.instructions}</p>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 text-right ml-4">
                        <p><strong>Frequency:</strong> {med.frequency}</p>
                        <p><strong>Duration:</strong> {med.duration}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Diagnosis & Notes */}
            {prescription.diagnosis && (
              <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900">Diagnosis</h3>
                <p className="text-gray-700 mt-1">{prescription.diagnosis}</p>
              </div>
            )}
            
            {prescription.notes && (
              <div className="mb-4 p-4 bg-yellow-50 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900">Notes</h3>
                <p className="text-gray-700 mt-1">{prescription.notes}</p>
              </div>
            )}
            
            {/* Signature */}
            <div className="mt-6 pt-4 border-t">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-700"><strong>Prescriber:</strong> {prescription.doctor?.name || prescription.prescribedBy?.name || 'Doctor'}</p>
                <div className="text-sm text-gray-500">
                  Digital Prescription
                </div>
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button 
              variant="primary" 
              size="sm"
              className="flex items-center"
              onClick={() => {
                handlePrintPrescription(prescription);
              }}
            >
              <Printer size={16} className="mr-2" />
              Print
            </Button>
          </div>
        </div>
      ),
      size: "lg"
    });
  };
  
  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Prescriptions</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage patient prescriptions and medication orders</p>
        </div>
        <div className="flex gap-3">
          <Button variant="primary" onClick={() => openModal('newPrescription')}>
          <PlusCircle size={18} className="mr-2" />
          New Prescription
        </Button>
        </div>
      </div>
      
      {/* Prescription Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800/30">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Prescriptions</h3>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {loading ? '...' : prescriptions.length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 dark:bg-blue-800 dark:text-blue-200">
              <FileText size={20} />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800/30">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-medium text-emerald-700 dark:text-emerald-300">This Month</h3>
              <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                {loading ? '...' : prescriptions.filter(p => {
                  if (!p.prescriptionDate) return false;
                  const prescDate = new Date(p.prescriptionDate);
                  const currentDate = new Date();
                  return prescDate.getMonth() === currentDate.getMonth() && 
                         prescDate.getFullYear() === currentDate.getFullYear();
                }).length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-200 flex items-center justify-center text-emerald-700 dark:bg-emerald-800 dark:text-emerald-200">
              <Calendar size={20} />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800/30">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-medium text-amber-700 dark:text-amber-300">Total Medications</h3>
              <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                {loading ? '...' : prescriptions.reduce((total, p) => total + (p.medications?.length || 0), 0)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center text-amber-700 dark:bg-amber-800 dark:text-amber-200">
              <Pill size={20} />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800/30">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-medium text-purple-700 dark:text-purple-300">Unique Patients</h3>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {loading ? '...' : new Set(prescriptions.map(p => p.patient?.patientId).filter((id): id is string => Boolean(id))).size}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-purple-200 flex items-center justify-center text-purple-700 dark:bg-purple-800 dark:text-purple-200">
              <User size={20} />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Search and Filter */}
      <Card variant="bordered" className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <Input 
                className="pl-10" 
                placeholder="Search by patient, medication, or Rx ID..." 
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Display loading state */}
      {loading && (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      )}
      
      {/* Display error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-6 dark:bg-red-900/20 dark:border-red-700 dark:text-red-400">
          <div className="flex items-center">
            <AlertCircle size={18} className="mr-2" />
            <p>{error}</p>
          </div>
        </div>
      )}
      
      {/* Display no data state */}
      {!loading && !error && prescriptions.length === 0 && (
        <div className="text-center py-20 border border-dashed rounded-md border-gray-300 dark:border-gray-700">
          <FileText size={48} className="mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">No Prescriptions Found</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {searchQuery ? 
              'Try adjusting your search' : 
              'Create your first prescription to get started'
            }
          </p>
          <Button
            variant="primary"
            className="mt-4"
            onClick={() => openModal('newPrescription')}
          >
            <PlusCircle size={16} className="mr-2" />
            Create Prescription
          </Button>
        </div>
      )}
      
      {/* Prescriptions List */}
      {!loading && !error && prescriptions.length > 0 && (
      <div className="space-y-4">
        {prescriptions.map((prescription) => (
            <Card key={prescription._id} className="overflow-hidden">
            <div className={`w-1 absolute top-0 bottom-0 left-0 ${
                prescription.status === 'Completed' 
                ? 'bg-success-500' 
                  : prescription.status === 'Pending'
                    ? 'bg-warning-500'
                    : prescription.status === 'Discontinued'
                  ? 'bg-danger-500'
                      : 'bg-primary-500'
            }`}></div>
            <CardHeader className="flex flex-row items-start justify-between p-5">
              <div>
                <div className="flex items-center gap-3">
                    <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                      {prescription.patient?.name || 'Unknown Patient'}
                    </CardTitle>
                  <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded dark:bg-gray-700 dark:text-gray-300">
                      {prescription.patient?.patientId || 'No ID'}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                      {prescription.patient?.age || '--'} y/o • {prescription.patient?.gender || '--'}
                  </span>
                  <span 
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${prescription.status === 'Completed' 
                        ? 'bg-success-100 text-success-800 dark:bg-success-800/20 dark:text-success-400' 
                          : prescription.status === 'Pending'
                            ? 'bg-warning-100 text-warning-800 dark:bg-warning-800/20 dark:text-warning-400'
                            : prescription.status === 'Discontinued'
                              ? 'bg-danger-100 text-danger-800 dark:bg-danger-800/20 dark:text-danger-400'
                              : 'bg-primary-100 text-primary-800 dark:bg-primary-800/20 dark:text-primary-400'}`}
                  >
                    {prescription.status}
                    </span>
                </div>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <FileText size={14} />
                      {prescription.prescriptionId || 'No ID'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={14} />
                      {prescription.prescriptionDate ? formatDate(prescription.prescriptionDate) : 'No Date'}
                  </span>
                  <span className="flex items-center gap-1">
                    <User size={14} />
                      {prescription.doctor?.name || prescription.prescribedBy?.name || 'Doctor'}
                  </span>
                    <span className="flex items-center gap-1">
                      <Pill size={14} />
                      {prescription.medications?.length || 0} medication(s)
                    </span>
                  </div>
              </div>
              <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-gray-600"
                    onClick={() => handleViewPrescription(prescription)}
                  >
                    <FileText size={16} className="mr-1" />
                    View
                  </Button>
                  <Popover open={openPopoverId === prescription._id} onOpenChange={(open) => {
                    if (open) {
                      setOpenPopoverId(prescription._id);
                    } else {
                      setOpenPopoverId(null);
                    }
                  }}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="text-gray-600">
                        <MoreHorizontal size={16} />
                </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-0" align="end">
                      <div className="py-1">
                        <button 
                          className="flex w-full items-center px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                          onClick={() => {
                            setOpenPopoverId(null);
                            handlePrintPrescription(prescription);
                          }}
                        >
                          <Printer className="mr-2 h-4 w-4" />
                          Print
                        </button>
                      </div>
                    </PopoverContent>
                  </Popover>
              </div>
            </CardHeader>
            <CardContent className="p-5 pt-0">
                <div className="mt-3">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Medications</h4>
                  <div className="space-y-1.5">
                    {prescription.medications?.map((med, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm py-1">
                        <div className="flex items-center gap-2">
                          <Pill size={14} className="text-primary-500" />
                          <span className="font-medium text-gray-900 dark:text-white">{med.name}</span>
                          <span className="text-gray-500 dark:text-gray-400">{med.dosage} • {med.frequency}</span>
                        </div>
                        <div className="text-gray-500 dark:text-gray-400">
                          {med.duration}
                        </div>
                      </div>
                            ))}
                          </div>
                        </div>
                        
                {prescription.diagnosis && (
                  <div className="mt-3">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Diagnosis</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{prescription.diagnosis}</p>
                  </div>
                )}
                
                {prescription.notes && (
                  <div className="mt-3">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Notes</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{prescription.notes}</p>
              </div>
                )}
            </CardContent>
          </Card>
        ))}
      </div>
      )}
      
      {/* Pagination */}
      {!loading && !error && prescriptions.length > 0 && pagination.totalPages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Showing page {pagination.page} of {pagination.totalPages}
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              <ChevronLeft size={16} />
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
} 