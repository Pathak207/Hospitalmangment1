import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { FileSearch, Calendar, Clock, User, AlertTriangle, Download, ChevronDown, ChevronUp, Plus, FlaskConical, Loader2, Search, Trash2, Edit3, MoreVertical } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useModal } from '@/components/ui/modal-provider';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';

interface LabsTabProps {
  patient: any;
}

export function LabsTab({ patient }: LabsTabProps) {
  const { openModal } = useModal();
  const [labResults, setLabResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Fetch lab results data
  useEffect(() => {
    if (patient?._id) {
      fetchLabResults();
    }
  }, [patient?._id]);

  // Close dropdown menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('[id^="lab-menu-"]') && !target.closest('button[data-dropdown-trigger]')) {
        // Close all dropdown menus
        document.querySelectorAll('[id^="lab-menu-"]').forEach(menu => {
          menu.classList.add('hidden');
        });
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const fetchLabResults = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/labs?patientId=${patient._id}`);
      if (response.ok) {
        const data = await response.json();
        setLabResults(data.labs || []);
      } else {
        console.error('Failed to fetch lab results');
        toast.error('Failed to load lab results');
      }
    } catch (error) {
      console.error('Error fetching lab results:', error);
      toast.error('Failed to load lab results');
    } finally {
      setLoading(false);
    }
  };

  // Format date with time
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Delete lab order
  const handleDeleteLabOrder = async (labId: string) => {
    if (!window.confirm('Are you sure you want to delete this lab order? This action cannot be undone.')) {
      return;
    }

    try {
      const loadingToast = toast.loading('Deleting lab order...');
      
      const response = await fetch(`/api/labs/${labId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.dismiss(loadingToast);
        toast.success('Lab order deleted successfully!');
        fetchLabResults(); // Refresh the list
      } else {
        const error = await response.json();
        toast.dismiss(loadingToast);
        throw new Error(error.error || 'Failed to delete lab order');
      }
    } catch (error) {
      console.error('Error deleting lab order:', error);
      toast.error(error.message || 'Failed to delete lab order');
    }
  };

  // Edit lab order
  const handleEditLabOrder = (lab: any) => {
    openModal({
      title: 'Edit Lab Order',
      content: (
        <EditLabOrderForm 
          lab={lab}
          patient={patient} 
          onSuccess={() => {
            fetchLabResults();
            toast.success('Lab order updated successfully!');
            // Return to patient details modal
            openModal('viewPatientDetails', {
              ...patient,
              returnToPatient: patient.returnToPatient || true
            });
          }} 
          onCancel={() => {
            // Return to patient details modal
            openModal('viewPatientDetails', {
              ...patient,
              returnToPatient: patient.returnToPatient || true
            });
          }}
        />
      )
    });
  };

  // Edit lab results
  const handleEditLabResult = (lab: any) => {
    openModal({
      title: 'Edit Lab Results',
      content: (
        <EnterLabResultsForm 
          lab={lab} 
          isEditing={true}
          onSuccess={() => {
            fetchLabResults();
            toast.success('Lab results updated successfully!');
            // Return to patient details modal
            openModal('viewPatientDetails', {
              ...patient,
              returnToPatient: patient.returnToPatient || true
            });
          }}
          onCancel={() => {
            // Return to patient details modal
            openModal('viewPatientDetails', {
              ...patient,
              returnToPatient: patient.returnToPatient || true
            });
          }} 
        />
      )
    });
  };

  // Download lab report as PDF
  const downloadLabReport = async (lab: any) => {
    try {
      if (lab.status !== 'Completed') {
        toast.error('Lab results must be completed to download');
        return;
      }

      // Fetch institution details from settings
      const [brandingResponse, settingsResponse] = await Promise.all([
        fetch('/api/settings/branding'),
        // Get practice settings from localStorage as fallback
        Promise.resolve(localStorage.getItem('practiceSettings'))
      ]);

      let institutionDetails = {
        name: 'Medical Center',
        phone: '(555) 123-4567',
        email: 'info@medicalcenter.com',
        address: '123 Medical Center Dr, Healthcare City, HC 12345'
      };

      // Get branding info
      if (brandingResponse.ok) {
        const branding = await brandingResponse.json();
        institutionDetails.name = branding.appName || 'Medical Center';
      }

      // Get practice settings
      if (settingsResponse) {
        try {
          const practiceSettings = JSON.parse(settingsResponse);
          if (practiceSettings.practiceName) institutionDetails.name = practiceSettings.practiceName;
          if (practiceSettings.phone) institutionDetails.phone = practiceSettings.phone;
          if (practiceSettings.email) institutionDetails.email = practiceSettings.email;
        } catch (error) {
          console.warn('Could not parse practice settings:', error);
        }
      }

      // Create a new PDF document
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Set up styling
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      let yPosition = margin;

      // Helper function to add text with word wrapping
      const addText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 10, style: 'normal' | 'bold' = 'normal') => {
        pdf.setFontSize(fontSize);
        pdf.setFont('helvetica', style);
        const lines = pdf.splitTextToSize(text, maxWidth);
        pdf.text(lines, x, y);
        return y + (lines.length * fontSize * 0.4);
      };

      // Institution Header with Blue Background
      pdf.setFillColor(59, 130, 246); // Blue background
      pdf.rect(0, 0, pageWidth, 50, 'F');
      
      // Institution Name (Large, White)
      pdf.setTextColor(255, 255, 255); // White text
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text(institutionDetails.name, margin, 20);
      
      // Institution Contact Info (Smaller, White)
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Phone: ${institutionDetails.phone}`, margin, 30);
      pdf.text(`Email: ${institutionDetails.email}`, margin, 37);
      pdf.text(institutionDetails.address, margin, 44);

      // Lab Report Title (White, Bold)
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      const titleWidth = pdf.getTextWidth('LAB RESULT REPORT');
      pdf.text('LAB RESULT REPORT', pageWidth - margin - titleWidth, 25);
      
      // Reset text color for body
      pdf.setTextColor(0, 0, 0);
      yPosition = 65; // Start below the header

      // Patient Information Section
      yPosition = addText('PATIENT INFORMATION', margin, yPosition, pageWidth - 2 * margin, 14, 'bold');
      yPosition += 5;
      
      // Patient details in two columns
      const leftColumn = margin;
      const rightColumn = pageWidth / 2;
      
      let leftY = yPosition;
      let rightY = yPosition;
      
      leftY = addText(`Name: ${patient.name}`, leftColumn, leftY, (pageWidth / 2) - margin - 5, 10);
      rightY = addText(`Patient ID: ${patient.patientId || patient._id}`, rightColumn, rightY, (pageWidth / 2) - margin - 5, 10);
      
      leftY = addText(`Age: ${patient.age || 'N/A'} years`, leftColumn, leftY + 5, (pageWidth / 2) - margin - 5, 10);
      rightY = addText(`Ordered By: ${lab.orderedBy?.name || 'Staff'}`, rightColumn, rightY + 5, (pageWidth / 2) - margin - 5, 10);
      
      yPosition = Math.max(leftY, rightY) + 10;

      // Test Information Section
      yPosition = addText('TEST INFORMATION', margin, yPosition, pageWidth - 2 * margin, 14, 'bold');
      yPosition += 5;
      
      leftY = yPosition;
      rightY = yPosition;
      
      leftY = addText(`Test Name: ${lab.testName}`, leftColumn, leftY, (pageWidth / 2) - margin - 5, 10);
      rightY = addText(`Category: ${lab.category}`, rightColumn, rightY, (pageWidth / 2) - margin - 5, 10);
      
      leftY = addText(`Status: ${lab.status}`, leftColumn, leftY + 5, (pageWidth / 2) - margin - 5, 10);
      rightY = addText(`Urgency: ${lab.urgency}`, rightColumn, rightY + 5, (pageWidth / 2) - margin - 5, 10);
      
      leftY = addText(`Ordered Date: ${formatDate(lab.orderedAt)}`, leftColumn, leftY + 5, (pageWidth / 2) - margin - 5, 10);
      if (lab.completedAt) {
        rightY = addText(`Completed Date: ${formatDate(lab.completedAt)}`, rightColumn, rightY + 5, (pageWidth / 2) - margin - 5, 10);
      }
      
      yPosition = Math.max(leftY, rightY) + 15;

      // Lab Results Section (if available)
      if (lab.results && Object.keys(lab.results).length > 0) {
        yPosition = addText('LAB RESULTS', margin, yPosition, pageWidth - 2 * margin, 14, 'bold');
        yPosition += 10;

        // Table header
        pdf.setFillColor(245, 245, 245);
        pdf.rect(margin, yPosition - 5, pageWidth - 2 * margin, 15, 'F');
        
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Test', margin + 5, yPosition + 5);
        pdf.text('Result', margin + 50, yPosition + 5);
        pdf.text('Units', margin + 80, yPosition + 5);
        pdf.text('Reference Range', margin + 110, yPosition + 5);
        pdf.text('Flag', margin + 150, yPosition + 5);
        
        yPosition += 15;

        // Table rows
        Object.entries(lab.results).forEach(([testName, result]: [string, any]) => {
          if (yPosition > pageHeight - 30) {
            pdf.addPage();
            yPosition = margin;
            
            // Add institution header on new page (simplified)
            pdf.setFillColor(59, 130, 246);
            pdf.rect(0, 0, pageWidth, 30, 'F');
            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'bold');
            pdf.text(institutionDetails.name, margin, 20);
            pdf.setTextColor(0, 0, 0);
            yPosition = 40;
          }

          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(8);
          
          // Add some padding between rows
          if (yPosition > 80) {
            pdf.setDrawColor(230, 230, 230);
            pdf.line(margin, yPosition - 2, pageWidth - margin, yPosition - 2);
          }
          
          pdf.text(testName.substring(0, 20), margin + 5, yPosition + 5);
          pdf.text(String(result.value || ''), margin + 50, yPosition + 5);
          pdf.text(String(result.unit || '-'), margin + 80, yPosition + 5);
          pdf.text(String(result.referenceRange || '-').substring(0, 15), margin + 110, yPosition + 5);
          
          // Color code the flag
          const flag = result.flag || 'Normal';
          if (flag === 'High' || flag === 'Critical High') {
            pdf.setTextColor(220, 38, 38); // Red
          } else if (flag === 'Low' || flag === 'Critical Low') {
            pdf.setTextColor(245, 158, 11); // Yellow/Orange
          } else {
            pdf.setTextColor(34, 197, 94); // Green
          }
          pdf.text(flag, margin + 150, yPosition + 5);
          pdf.setTextColor(0, 0, 0); // Reset to black
          
          yPosition += 12;
        });

        yPosition += 10;
      }

      // Result Summary Section
      if (lab.resultSummary) {
        if (yPosition > pageHeight - 50) {
          pdf.addPage();
          // Add institution header on new page (simplified)
          pdf.setFillColor(59, 130, 246);
          pdf.rect(0, 0, pageWidth, 30, 'F');
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(14);
          pdf.setFont('helvetica', 'bold');
          pdf.text(institutionDetails.name, margin, 20);
          pdf.setTextColor(0, 0, 0);
          yPosition = 40;
        }
        
        yPosition = addText('SUMMARY', margin, yPosition, pageWidth - 2 * margin, 14, 'bold');
        yPosition += 5;
        yPosition = addText(lab.resultSummary, margin, yPosition, pageWidth - 2 * margin, 10);
        yPosition += 10;
      }

      // Notes Section
      if (lab.notes) {
        if (yPosition > pageHeight - 50) {
          pdf.addPage();
          // Add institution header on new page (simplified)
          pdf.setFillColor(59, 130, 246);
          pdf.rect(0, 0, pageWidth, 30, 'F');
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(14);
          pdf.setFont('helvetica', 'bold');
          pdf.text(institutionDetails.name, margin, 20);
          pdf.setTextColor(0, 0, 0);
          yPosition = 40;
        }
        
        yPosition = addText('NOTES', margin, yPosition, pageWidth - 2 * margin, 14, 'bold');
        yPosition += 5;
        yPosition = addText(lab.notes, margin, yPosition, pageWidth - 2 * margin, 10);
        yPosition += 10;
      }

      // Footer
      const footerY = pageHeight - 20;
      pdf.setFontSize(8);
      pdf.setTextColor(128, 128, 128);
      pdf.text(`Generated on: ${new Date().toLocaleString()}`, margin, footerY);
      pdf.text(`Page 1`, pageWidth - margin - 20, footerY);

      // Generate filename
      const filename = `lab-report-${patient.patientId || patient._id}-${lab.testName.replace(/\s+/g, '-')}.pdf`;

      // Save the PDF
      pdf.save(filename);
      
      toast.success('Lab report downloaded successfully');
    } catch (error) {
      console.error('Error downloading lab report:', error);
      toast.error('Failed to download lab report');
    }
  };

  // Handle ordering new lab
  const handleOrderLab = () => {
    openModal({
      title: 'Order Lab Test',
      content: (
        <OrderLabForm 
          patient={patient} 
          onSuccess={() => {
            fetchLabResults();
            toast.success('Lab test ordered successfully!');
            // Return to patient details modal
            openModal('viewPatientDetails', {
              ...patient,
              returnToPatient: patient.returnToPatient || true
            });
          }} 
          onCancel={() => {
            // Return to patient details modal
            openModal('viewPatientDetails', {
              ...patient,
              returnToPatient: patient.returnToPatient || true
            });
          }}
        />
      )
    });
  };

  // Handle adding lab results
  const handleAddLabResult = (lab: any) => {
    openModal({
      title: 'Enter Lab Results',
      content: (
        <EnterLabResultsForm 
          lab={lab} 
          isEditing={false}
          onSuccess={() => {
            fetchLabResults();
            toast.success('Lab results saved successfully!');
            // Return to patient details modal
            openModal('viewPatientDetails', {
              ...patient,
              returnToPatient: patient.returnToPatient || true
            });
          }}
          onCancel={() => {
            // Return to patient details modal
            openModal('viewPatientDetails', {
              ...patient,
              returnToPatient: patient.returnToPatient || true
            });
          }} 
        />
      )
    });
  };

  // Toggle expanded result
  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-success-100 text-success-800 dark:bg-success-900/20 dark:text-success-400';
      case 'In Progress':
        return 'bg-primary-100 text-primary-800 dark:bg-primary-900/20 dark:text-primary-400';
      case 'Ordered':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
      case 'Cancelled':
        return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  // Get urgency color
  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'STAT':
        return 'bg-danger-100 text-danger-800 dark:bg-danger-900/20 dark:text-danger-400';
      case 'Urgent':
        return 'bg-warning-100 text-warning-800 dark:bg-warning-900/20 dark:text-warning-400';
      case 'Routine':
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Lab Results</h3>
        <Button size="sm" variant="outline" className="flex items-center gap-2" onClick={handleOrderLab}>
          <Plus size={16} />
          Order New Lab
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      ) : (
        <>
          {labResults.length > 0 ? (
            <div className="space-y-4" style={{ overflow: 'visible' }}>
              {labResults.map((lab) => (
                <div 
                  key={lab._id} 
                  className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
                  style={{ position: 'relative', zIndex: 'auto' }}
                >
                  {/* Lab Header */}
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <FlaskConical size={18} className="text-primary-500" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {lab.testName}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(lab.status)}`}>
                            {lab.status}
                          </span>
                          {lab.urgency && (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getUrgencyColor(lab.urgency)}`}>
                              {lab.urgency}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            Ordered: {formatDateTime(lab.orderedAt)}
                          </span>
                          <span>{lab.category}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Action Menu */}
                      <div className="relative z-[100]">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          data-dropdown-trigger
                          onClick={() => {
                            const menu = document.getElementById(`lab-menu-${lab._id}`);
                            if (menu) {
                              menu.classList.toggle('hidden');
                            }
                          }}
                        >
                          <MoreVertical size={16} />
                        </Button>
                        <div 
                          id={`lab-menu-${lab._id}`}
                          className="hidden absolute right-0 top-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-xl z-[200] min-w-32"
                        >
                          {lab.status !== 'Completed' && (
                            <button
                              onClick={() => {
                                handleEditLabOrder(lab);
                                document.getElementById(`lab-menu-${lab._id}`)?.classList.add('hidden');
                              }}
                              className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                            >
                              <Edit3 size={14} />
                              Edit Order
                            </button>
                          )}
                          {lab.status === 'Completed' && (
                            <button
                              onClick={() => {
                                handleEditLabResult(lab);
                                document.getElementById(`lab-menu-${lab._id}`)?.classList.add('hidden');
                              }}
                              className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                            >
                              <Edit3 size={14} />
                              Edit Results
                            </button>
                          )}
                          <button
                            onClick={() => {
                              handleDeleteLabOrder(lab._id);
                              document.getElementById(`lab-menu-${lab._id}`)?.classList.add('hidden');
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => toggleExpand(lab._id)}
                      >
                        {expandedId === lab._id ? (
                          <ChevronUp size={16} />
                        ) : (
                          <ChevronDown size={16} />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Lab Content */}
                  <div className={`p-3 ${expandedId === lab._id ? 'block' : 'hidden'}`}>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Ordered Date</p>
                        <p className="text-sm text-gray-900 dark:text-white">{formatDate(lab.orderedAt)}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Ordered By</p>
                        <p className="text-sm text-gray-900 dark:text-white flex items-center gap-1">
                          <User size={12} />
                          {lab.orderedBy?.name || 'Staff'}
                        </p>
                      </div>
                    </div>

                    {lab.status === 'Completed' && lab.results && Object.keys(lab.results).length > 0 ? (
                      <div className="mt-3">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Results</p>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                              <tr>
                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                  Test
                                </th>
                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                  Result
                                </th>
                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                  Units
                                </th>
                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                  Reference Range
                                </th>
                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                  Flag
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                              {Object.entries(lab.results).map(([key, value]: [string, any]) => (
                                <tr key={key}>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                    {key}
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                    {value.value}
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    {value.unit}
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    {value.referenceRange}
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm">
                                    {value.flag === 'High' && <span className="text-danger-600 dark:text-danger-400">↑ High</span>}
                                    {value.flag === 'Low' && <span className="text-warning-600 dark:text-warning-400">↓ Low</span>}
                                    {value.flag === 'Critical High' && <span className="text-danger-600 dark:text-danger-400 font-bold">⚠️ Critical High</span>}
                                    {value.flag === 'Critical Low' && <span className="text-danger-600 dark:text-danger-400 font-bold">⚠️ Critical Low</span>}
                                    {value.flag === 'Normal' && <span className="text-success-600 dark:text-success-400">Normal</span>}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        {lab.status === 'Completed' 
                          ? 'Results have been recorded but details are not available.'
                          : lab.status === 'Cancelled'
                          ? 'This lab order was cancelled.'
                          : 'Results pending. The lab has been ordered and is awaiting processing.'}
                      </div>
                    )}

                    {lab.notes && (
                      <div className="mt-3 border-t border-gray-200 dark:border-gray-700 pt-3">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Notes</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{lab.notes}</p>
                      </div>
                    )}

                    <div className="mt-4 flex justify-end gap-2">
                      {lab.status === 'Completed' && (
                        <Button variant="outline" size="sm" className="flex items-center gap-1" onClick={() => downloadLabReport(lab)}>
                          <Download size={14} />
                          Download Report
                        </Button>
                      )}
                      {['Ordered', 'In Progress'].includes(lab.status) && (
                        <Button variant="outline" size="sm" onClick={() => handleAddLabResult(lab)}>
                          Enter Results
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <FileSearch size={32} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
              <p className="text-gray-500 dark:text-gray-400">No lab results found</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Click "Order New Lab" to request a lab test</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Form for ordering new lab
function OrderLabForm({ patient, onSuccess, onCancel }: { patient: any, onSuccess: () => void, onCancel: () => void }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    patient: patient._id,
    testName: '',
    category: '',
    urgency: 'Routine',
    notes: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      // Validate required fields
      if (!formData.testName || !formData.category) {
        toast.error('Please fill in all required fields: Test Name and Category');
        return;
      }

      setLoading(true);
      
      // Show loading toast
      const loadingToast = toast.loading('Ordering lab test...');

      const response = await fetch('/api/labs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.dismiss(loadingToast);
        onSuccess(); // This will handle modal closing and show success toast
      } else {
        const error = await response.json();
        toast.dismiss(loadingToast);
        throw new Error(error.error || 'Failed to order lab test');
      }
    } catch (error) {
      console.error('Error ordering lab test:', error);
      toast.error(error.message || 'Failed to order lab test');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Test Name *
        </label>
        <Input 
          type="text" 
          name="testName"
          placeholder="e.g., Complete Blood Count (CBC)" 
          value={formData.testName}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Category *
        </label>
        <select
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          name="category"
          value={formData.category}
          onChange={handleChange}
          required
        >
          <option value="">Select category</option>
          <option value="Hematology">Hematology</option>
          <option value="Chemistry">Chemistry</option>
          <option value="Microbiology">Microbiology</option>
          <option value="Immunology">Immunology</option>
          <option value="Urinalysis">Urinalysis</option>
          <option value="Pathology">Pathology</option>
          <option value="Radiology">Radiology</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Urgency
        </label>
        <select
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          name="urgency"
          value={formData.urgency}
          onChange={handleChange}
        >
          <option value="Routine">Routine</option>
          <option value="Urgent">Urgent</option>
          <option value="STAT">STAT</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Notes
        </label>
        <textarea 
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          name="notes"
          placeholder="Additional instructions or notes for the lab"
          rows={3}
          value={formData.notes}
          onChange={handleChange}
        ></textarea>
      </div>

      <div className="flex justify-end space-x-2 pt-2">
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Ordering...
            </>
          ) : (
            'Order Lab Test'
          )}
        </Button>
      </div>
    </div>
  );
}

// Form for entering lab results
function EnterLabResultsForm({ lab, isEditing, onSuccess, onCancel }: { lab: any, isEditing: boolean, onSuccess: () => void, onCancel: () => void }) {
  const [loading, setLoading] = useState(false);
  const [resultFields, setResultFields] = useState<{ name: string, value: string, unit: string, referenceRange: string, flag: string }[]>([]);
  const [resultSummary, setResultSummary] = useState('');

  // Initialize form with existing data when editing
  useEffect(() => {
    if (isEditing && lab.results && Object.keys(lab.results).length > 0) {
      const existingResults = Object.entries(lab.results).map(([name, data]: [string, any]) => ({
        name,
        value: data.value || '',
        unit: data.unit || '',
        referenceRange: data.referenceRange || '',
        flag: data.flag || 'Normal'
      }));
      setResultFields(existingResults);
      setResultSummary(lab.resultSummary || '');
    } else {
      setResultFields([{ name: '', value: '', unit: '', referenceRange: '', flag: 'Normal' }]);
      setResultSummary('');
    }
  }, [isEditing, lab]);

  const handleAddResultField = () => {
    setResultFields([...resultFields, { name: '', value: '', unit: '', referenceRange: '', flag: 'Normal' }]);
  };

  const handleRemoveResultField = (index: number) => {
    const newResultFields = [...resultFields];
    newResultFields.splice(index, 1);
    setResultFields(newResultFields);
  };

  const handleResultFieldChange = (index: number, field: string, value: string) => {
    const newResultFields = [...resultFields];
    newResultFields[index][field] = value;
    setResultFields(newResultFields);
  };

  const handleSubmit = async () => {
    try {
      // Validate required fields
      const invalidResults = resultFields.some(field => !field.name || !field.value);
      if (invalidResults) {
        toast.error('Please fill in all result fields with at least a name and value');
        return;
      }

      setLoading(true);
      
      // Show loading toast
      const loadingToast = toast.loading(isEditing ? 'Updating lab results...' : 'Saving lab results...');

      // Convert result fields to the expected format
      const results = {};
      resultFields.forEach(field => {
        results[field.name] = {
          value: field.value,
          unit: field.unit,
          referenceRange: field.referenceRange,
          flag: field.flag
        };
      });

      const updateData: any = {
        results,
        resultSummary
      };

      // Only update status and completion date if not editing
      if (!isEditing) {
        updateData.status = 'Completed';
        updateData.completedAt = new Date().toISOString();
      }

      const response = await fetch(`/api/labs/${lab._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        toast.dismiss(loadingToast);
        onSuccess(); // This will handle modal closing and show success toast
      } else {
        const error = await response.json();
        toast.dismiss(loadingToast);
        throw new Error(error.error || 'Failed to save lab results');
      }
    } catch (error) {
      console.error('Error saving lab results:', error);
      toast.error(error.message || 'An error occurred while saving the lab results');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md mb-4">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{lab.testName} ({lab.category})</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {isEditing ? 'Editing results for lab' : 'Entering results for lab'} ordered on {new Date(lab.orderedAt).toLocaleDateString()}
        </p>
      </div>

      <div className="space-y-4">
        {resultFields.map((field, index) => (
          <div key={index} className="p-3 border border-gray-200 dark:border-gray-700 rounded-md">
            <div className="flex justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Result #{index + 1}</h4>
              {resultFields.length > 1 && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleRemoveResultField(index)}
                  className="h-6 w-6 p-0"
                >
                  ✕
                </Button>
              )}
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Test Name
                </label>
                <Input 
                  type="text" 
                  placeholder="e.g., Hemoglobin" 
                  value={field.name}
                  onChange={(e) => handleResultFieldChange(index, 'name', e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Value
                  </label>
                  <Input 
                    type="text" 
                    placeholder="e.g., 14.2" 
                    value={field.value}
                    onChange={(e) => handleResultFieldChange(index, 'value', e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Unit
                  </label>
                  <Input 
                    type="text" 
                    placeholder="e.g., g/dL" 
                    value={field.unit}
                    onChange={(e) => handleResultFieldChange(index, 'unit', e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Reference Range
                  </label>
                  <Input 
                    type="text" 
                    placeholder="e.g., 12.0-15.5" 
                    value={field.referenceRange}
                    onChange={(e) => handleResultFieldChange(index, 'referenceRange', e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Flag
                </label>
                <select
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                  value={field.flag}
                  onChange={(e) => handleResultFieldChange(index, 'flag', e.target.value)}
                >
                  <option value="Normal">Normal</option>
                  <option value="Low">Low</option>
                  <option value="High">High</option>
                  <option value="Critical Low">Critical Low</option>
                  <option value="Critical High">Critical High</option>
                </select>
              </div>
            </div>
          </div>
        ))}
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleAddResultField}
          className="w-full"
        >
          Add Another Result
        </Button>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Result Summary
        </label>
        <textarea 
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          placeholder="Summary of findings and recommendations"
          rows={3}
          value={resultSummary}
          onChange={(e) => setResultSummary(e.target.value)}
        ></textarea>
      </div>

      <div className="flex justify-end space-x-2 pt-2">
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEditing ? 'Updating...' : 'Saving...'}
            </>
          ) : (
            isEditing ? 'Update Results' : 'Save Results'
          )}
        </Button>
      </div>
    </div>
  );
}

// Form for editing lab order
function EditLabOrderForm({ lab, patient, onSuccess, onCancel }: { lab: any, patient: any, onSuccess: () => void, onCancel: () => void }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    testName: lab.testName || '',
    category: lab.category || '',
    urgency: lab.urgency || 'Routine',
    notes: lab.notes || ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      // Validate required fields
      if (!formData.testName || !formData.category) {
        toast.error('Please fill in all required fields: Test Name and Category');
        return;
      }

      setLoading(true);
      
      // Show loading toast
      const loadingToast = toast.loading('Updating lab order...');

      const response = await fetch(`/api/labs/${lab._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.dismiss(loadingToast);
        onSuccess(); // This will handle modal closing and show success toast
      } else {
        const error = await response.json();
        toast.dismiss(loadingToast);
        throw new Error(error.error || 'Failed to update lab order');
      }
    } catch (error) {
      console.error('Error updating lab order:', error);
      toast.error(error.message || 'Failed to update lab order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md mb-4">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Editing order for {patient.name}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Originally ordered on {new Date(lab.orderedAt).toLocaleDateString()}</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Test Name *
        </label>
        <Input 
          type="text" 
          name="testName"
          placeholder="e.g., Complete Blood Count (CBC)" 
          value={formData.testName}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Category *
        </label>
        <select
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          name="category"
          value={formData.category}
          onChange={handleChange}
          required
        >
          <option value="">Select category</option>
          <option value="Hematology">Hematology</option>
          <option value="Chemistry">Chemistry</option>
          <option value="Microbiology">Microbiology</option>
          <option value="Immunology">Immunology</option>
          <option value="Urinalysis">Urinalysis</option>
          <option value="Pathology">Pathology</option>
          <option value="Radiology">Radiology</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Urgency
        </label>
        <select
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          name="urgency"
          value={formData.urgency}
          onChange={handleChange}
        >
          <option value="Routine">Routine</option>
          <option value="Urgent">Urgent</option>
          <option value="STAT">STAT</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Notes
        </label>
        <textarea 
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          name="notes"
          placeholder="Additional instructions or notes for the lab"
          rows={3}
          value={formData.notes}
          onChange={handleChange}
        ></textarea>
      </div>

      <div className="flex justify-end space-x-2 pt-2">
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating...
            </>
          ) : (
            'Update Lab Order'
          )}
        </Button>
      </div>
    </div>
  );
} 