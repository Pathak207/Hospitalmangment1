import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, PlusCircle, FileText, Calendar, X, Download, Printer, MoreHorizontal, AlertCircle, Clock, User, CheckCircle, Pill, RefreshCw, AlertTriangle, Repeat } from 'lucide-react';
import { useModal } from '@/components/ui/modal-provider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useSettings } from '@/lib/settings-context';
import toast from 'react-hot-toast';

interface PrescriptionsTabProps {
  patient: any;
}

export function PrescriptionsTab({ patient }: PrescriptionsTabProps) {
  const { openModal } = useModal();
  const { settings, formatDate } = useSettings();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);

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
    if (patient?._id) {
      fetchPrescriptions();
    }
  }, [patient?._id, searchQuery, statusFilter]);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      let queryParams = new URLSearchParams();
      queryParams.append('patientId', patient._id);
      
      if (searchQuery) {
        queryParams.append('search', searchQuery);
      }
      
      if (statusFilter !== 'all') {
        queryParams.append('status', statusFilter);
      }
      
      const response = await fetch(`/api/prescriptions?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch prescriptions');
      }
      const data = await response.json();
      
      // Sort prescriptions by date in descending order (newest first)
      const sortedPrescriptions = (data.prescriptions || []).sort((a, b) => {
        return new Date(b.prescriptionDate).getTime() - new Date(a.prescriptionDate).getTime();
      });
      
      setPrescriptions(sortedPrescriptions);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      setError('Failed to load prescriptions');
      toast.error('Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
  };

  const handleViewPrescription = (prescription: any) => {
    openModal({
      title: "Prescription Details",
      content: (
        <div className="space-y-6">
          <div className="bg-gray-100 p-5 rounded-lg shadow-inner">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h2 className="text-base font-bold">{prescription.patient?.name || patient.name}</h2>
                <div className="text-xs text-gray-600">
                  <p><strong>Patient ID:</strong> {prescription.patient?.patientId || patient.patientId}</p>
                  <p><strong>Age/Gender:</strong> {patient.age} y/o, {patient.gender}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(prescription.status)}`}>
                  {prescription.status}
                </span>
                <div className="mt-1 text-xs">
                  <p><strong>Rx #:</strong> {prescription.prescriptionId}</p>
                  <p><strong>Date:</strong> {new Date(prescription.prescriptionDate).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
            
            <div className="mb-4 pt-4">
              <h3 className="text-md font-semibold mb-2">Medications</h3>
              <div className="rounded-md space-y-2">
                {prescription.medications?.map((med: any, idx: number) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{med.name}</p>
                        <p className="text-sm text-gray-500">{med.dosage}</p>
                      </div>
                      <div className="text-sm text-gray-500 text-right">
                        <p>{med.frequency}</p>
                        <p>{med.duration}</p>
                      </div>
                    </div>
                    {med.instructions && (
                      <p className="text-sm text-gray-600 mt-1">{med.instructions}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {prescription.diagnosis && (
              <div className="mb-4">
                <h3 className="text-md font-semibold">Diagnosis</h3>
                <p className="text-sm text-gray-600 mt-1">{prescription.diagnosis}</p>
              </div>
            )}
            
            {prescription.notes && (
              <div className="mb-4">
                <h3 className="text-md font-semibold">Notes</h3>
                <p className="text-sm text-gray-600 mt-1">{prescription.notes}</p>
              </div>
            )}
          </div>
        </div>
      )
    });
  };

  const handlePrintPrescription = (prescription: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      console.error('Unable to open print window');
      return;
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Prescription - ${prescription.patient?.name || patient.name}</title>
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
              Phone: ${practiceInfo.phone || 'N/A'} | Email: ${practiceInfo.email || 'N/A'}<br>
              Tax ID: ${practiceInfo.taxId || 'N/A'}
            </div>
          </div>

          <h2 style="text-align: center; margin: 20px 0;">PRESCRIPTION</h2>

          <div class="patient-info">
            <div>
              <strong>Patient:</strong> ${prescription.patient?.name || patient.name}<br>
              <strong>Patient ID:</strong> ${prescription.patient?.patientId || patient.patientId}<br>
              <strong>Age/Gender:</strong> ${patient.age || '--'} y/o, ${patient.gender || '--'}
            </div>
            <div style="text-align: right;">
              <div class="prescription-id">
                <strong>Prescription ID:</strong> ${prescription.prescriptionId || 'N/A'}<br>
                <strong>Date:</strong> ${prescription.prescriptionDate ? formatDate(prescription.prescriptionDate) : 'No Date'}<br>
                <strong>Status:</strong> ${prescription.status || 'N/A'}
              </div>
            </div>
          </div>

          <div class="medications-section">
            <h3>MEDICATIONS PRESCRIBED:</h3>
            ${prescription.medications?.map((med: any, idx: number) => `
              <div class="medication-item">
                <div class="medication-name">${idx + 1}. ${med.name || 'Unknown medication'}</div>
                <div class="medication-details">
                  <strong>Dosage:</strong> ${med.dosage || 'N/A'}<br>
                  <strong>Frequency:</strong> ${med.frequency || 'N/A'}<br>
                  <strong>Duration:</strong> ${med.duration || 'N/A'}
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

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-success-100 text-success-800 dark:bg-success-900/20 dark:text-success-400';
      case 'completed':
        return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
      case 'discontinued':
        return 'bg-danger-100 text-danger-800 dark:bg-danger-900/20 dark:text-danger-400';
      case 'pending':
        return 'bg-warning-100 text-warning-800 dark:bg-warning-900/20 dark:text-warning-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <Input 
                className="pl-10" 
                placeholder="Search prescriptions..." 
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <select 
                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                value={statusFilter}
                onChange={handleStatusChange}
              >
                <option value="all">All Status</option>
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
                <option value="Discontinued">Discontinued</option>
              </select>
              <Button 
                variant="primary"
                onClick={() => openModal('newPrescription', { 
                  patientId: patient._id, 
                  patientName: patient.name,
                  returnToPatient: true
                })}
              >
                <PlusCircle size={16} className="mr-2" />
                New Prescription
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Display loading state */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
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
        <div className="text-center py-12 border border-dashed rounded-md border-gray-300 dark:border-gray-700">
          <FileText size={48} className="mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">No Prescriptions Found</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {searchQuery || statusFilter !== 'all' ? 
              'Try adjusting your search or filters' : 
              'Create a new prescription to get started'
            }
          </p>
          <Button
            variant="primary"
            className="mt-4"
            onClick={() => openModal('newPrescription', { 
              patientId: patient._id, 
              patientName: patient.name,
              returnToPatient: true
            })}
          >
            <PlusCircle size={16} className="mr-2" />
            Create Prescription
          </Button>
        </div>
      )}

      {/* Prescriptions List */}
      {!loading && !error && prescriptions.length > 0 && (
        <div className="space-y-4">
          {prescriptions.map((prescription, index) => (
            <Card key={prescription._id} className={`relative overflow-hidden ${index === 0 ? 'ring-2 ring-blue-200 bg-blue-50/30 dark:ring-blue-800 dark:bg-blue-900/10' : ''}`}>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Patient Info Column */}
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                      {patient.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {patient.patientId}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {patient.age} y/o • {patient.gender}
                    </p>
                  </div>

                  {/* Prescription Info Column */}
                  <div>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(prescription.status)}`}>
                        {prescription.status}
                      </span>
                      {/* Latest prescription badge positioned next to status */}
                      {index === 0 && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-600 text-white shadow-sm">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Latest
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-medium">Rx ID:</span> {prescription.prescriptionId}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-medium">Date:</span> {new Date(prescription.prescriptionDate).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-medium">Doctor:</span> {prescription.doctor || 'Doctor'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-medium">Medications:</span> {prescription.medications?.length || 0} medication(s)
                    </p>
                  </div>

                  {/* Actions Column */}
                  <div className="flex justify-end items-start space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewPrescription(prescription)}
                    >
                      View Details
                    </Button>
                    
                    {/* Dropdown for additional actions */}
                    <div className="relative">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setOpenPopoverId(openPopoverId === prescription._id ? null : prescription._id)}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                      
                      {openPopoverId === prescription._id && (
                        <>
                          {/* Backdrop to close dropdown */}
                          <div 
                            className="fixed inset-0 z-10" 
                            onClick={() => setOpenPopoverId(null)}
                          />
                          
                          {/* Dropdown menu */}
                          <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-20">
                            <div className="py-1">
                              <button 
                                className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                onClick={() => {
                                  setOpenPopoverId(null);
                                  handlePrintPrescription(prescription);
                                }}
                              >
                                <Printer className="mr-2 h-4 w-4" />
                                Print
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Medications Section */}
                <div className="mt-6">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                    <Pill className="w-4 h-4 mr-2 text-blue-500" />
                    Medications
                  </h4>
                  {prescription.medications?.map((med: any, idx: number) => (
                    <div key={idx} className="mb-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {idx + 1}. {med.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        <span className="font-medium">Dosage:</span> {med.dosage} | 
                        <span className="font-medium"> Frequency:</span> {med.frequency} | 
                        <span className="font-medium"> Duration:</span> {med.duration}
                      </p>
                      {med.instructions && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 italic">
                          <span className="font-medium">Instructions:</span> {med.instructions}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Diagnosis Section */}
                {prescription.diagnosis && (
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                      <FileText className="w-4 h-4 mr-2 text-blue-500" />
                      Diagnosis
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {prescription.diagnosis}
                    </p>
                  </div>
                )}

                {/* Notes Section */}
                {prescription.notes && (
                  <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-2 text-yellow-500" />
                      Notes
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {prescription.notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 