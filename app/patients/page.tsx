'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useModal } from '@/components/ui/modal-provider';
import { Search, PlusCircle, Filter, MoreHorizontal, FileText, Calendar, Phone, Mail, Heart, User, AlertCircle, Activity, FileCheck2, Loader2, Pill } from 'lucide-react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

export default function PatientsPage() {
  const { openModal, closeModal } = useModal();
  const { data: session, status } = useSession();
  
  // State for patients data
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for pagination and filtering
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [conditionFilter, setConditionFilter] = useState('all');
  
  // Stats counters
  const [stats, setStats] = useState({
    totalPatients: 0,
    activePatients: 0,
    pendingLabResults: 0,
    criticalFollowups: 0
  });

  // Fetch patients data from API
  const fetchPatients = async () => {
    try {
      setLoading(true);
      // Construct query parameters
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      const response = await fetch(`/api/patients?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch patients');
      }
      
      const data = await response.json();
      setPatients(data.patients);
      setTotal(data.pagination.total);
      setTotalPages(data.pagination.totalPages);
      
      // Calculate stats
      setStats({
        totalPatients: data.pagination.total,
        activePatients: data.patients.filter(p => !p.inactive).length,
        pendingLabResults: data.patients.filter(p => p.pendingLabResults).length || 0,
        criticalFollowups: data.patients.filter(p => p.criticalFollowup).length || 0
      });
      
      // Clear any previous errors
      setError(null);
      
    } catch (err) {
      console.error('Error fetching patients:', err);
      setError((err as Error).message);
      toast.error('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1); // Reset to first page when searching
  };

  // Handle filter changes
  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
    setPage(1);
  };

  const handleConditionFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setConditionFilter(e.target.value);
    setPage(1);
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // Fetch patients on component mount and when filters change
  useEffect(() => {
    if (status !== 'authenticated') return;

    // For search terms, add a debounce delay
    if (searchTerm !== '' && searchTerm.length > 0) {
      const timeoutId = setTimeout(() => {
        fetchPatients();
      }, 300); // 300ms delay for search

      return () => clearTimeout(timeoutId);
    } else {
      // For immediate changes (page, filters, or empty search), fetch immediately
      fetchPatients();
    }
  }, [page, limit, status, searchTerm, statusFilter, conditionFilter]);

  // Listen for patient updates
  useEffect(() => {
    const handlePatientAdded = () => {
      fetchPatients();
    };

    const handlePatientUpdated = () => {
      fetchPatients();
    };

    window.addEventListener('patientAdded', handlePatientAdded);
    window.addEventListener('patientUpdated', handlePatientUpdated);
    
    return () => {
      window.removeEventListener('patientAdded', handlePatientAdded);
      window.removeEventListener('patientUpdated', handlePatientUpdated);
    };
  }, []);

  // Loading state
  if (loading && patients.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 size={40} className="animate-spin text-primary-500 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading patients...</p>
        </div>
      </DashboardLayout>
    );
  }
  
  // Error state
  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <AlertCircle size={40} className="text-red-500 mb-4" />
          <p className="text-red-500 mb-2">Error loading patients</p>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <Button variant="primary" onClick={() => fetchPatients()}>
            Try Again
          </Button>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Patients</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your patient records</p>
        </div>
        <Button variant="primary" onClick={() => openModal('addPatient')}>
          <PlusCircle size={18} className="mr-2" />
          Add Patient
        </Button>
      </div>
      
      {/* Enhanced Filters */}
      <Card variant="bordered" className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <Input 
                className="pl-10" 
                placeholder="Search patients by name, ID, email, contact..." 
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Patient Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800/30">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Patients</h3>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.totalPatients}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 dark:bg-blue-800 dark:text-blue-200">
              <User size={20} />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800/30">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Active Patients</h3>
              <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">{stats.activePatients}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-200 flex items-center justify-center text-emerald-700 dark:bg-emerald-800 dark:text-emerald-200">
              <Activity size={20} />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800/30">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-medium text-amber-700 dark:text-amber-300">Pending Lab Results</h3>
              <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">{stats.pendingLabResults}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center text-amber-700 dark:bg-amber-800 dark:text-amber-200">
              <FileCheck2 size={20} />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800/30">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-medium text-red-700 dark:text-red-300">Critical Follow-ups</h3>
              <p className="text-2xl font-bold text-red-900 dark:text-red-100">{stats.criticalFollowups}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-red-200 flex items-center justify-center text-red-700 dark:bg-red-800 dark:text-red-200">
              <AlertCircle size={20} />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Patient Table */}
      <Card variant="bordered">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Medical Info</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {patients.length > 0 ? (
                  patients.map((patient) => (
                    <tr 
                      key={patient._id} 
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300 flex items-center justify-center font-medium">
                            {patient.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'P'}
                          </div>
                          <div className="ml-3">
                            <p className="font-medium text-gray-900 dark:text-white">{patient.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{patient.patientId}</p>
                            <div className="flex items-center mt-1">
                              <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">{patient.age} years</span>
                              <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">{patient.gender}</span>
                        </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center">
                            <Phone size={14} className="text-gray-400 mr-1.5" />
                            <span className="text-sm text-gray-600 dark:text-gray-300">{patient.contactNumber}</span>
                      </div>
                          {patient.email && (
                            <div className="flex items-center">
                              <Mail size={14} className="text-gray-400 mr-1.5" />
                              <span className="text-sm text-gray-600 dark:text-gray-300">{patient.email}</span>
                        </div>
                          )}
                      </div>
                    </td>
                      <td className="py-3 px-4">
                        <div>
                          {patient.medicalHistory && patient.medicalHistory.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-1.5">
                              {patient.medicalHistory.slice(0, 2).map((condition, i) => (
                                <span 
                                  key={i} 
                                  className="text-xs px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                                >
                                {condition}
                              </span>
                            ))}
                              {patient.medicalHistory.length > 2 && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  +{patient.medicalHistory.length - 2} more
                                </span>
                        )}
                          </div>
                        )}
                          
                          {patient.allergies && patient.allergies.length > 0 && (
                            <div className="flex items-center">
                              <span className="flex items-center text-xs text-rose-600 dark:text-rose-400 mr-1">
                                <AlertCircle size={12} className="mr-0.5" /> Allergies:
                              </span>
                              <span className="text-xs text-gray-600 dark:text-gray-300">
                                {patient.allergies.slice(0, 2).join(', ')}
                                {patient.allergies.length > 2 && ` +${patient.allergies.length - 2} more`}
                              </span>
                          </div>
                        )}
                      </div>
                    </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => openModal('viewPatientDetails', patient)}
                          >
                          View
                        </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => openModal('patientActions', patient)}
                          >
                          <MoreHorizontal size={16} />
                        </Button>
                      </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-500 dark:text-gray-400">
                      {loading ? (
                        <div className="flex justify-center items-center">
                          <Loader2 size={24} className="animate-spin mr-2 text-gray-500" />
                          Loading patients...
                        </div>
                      ) : (
                        'No patients found. Add a new patient to get started.'
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400">
                Showing {patients.length} of {total} patients
            </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1 || loading}
                >
                Previous
              </Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  // Handle display of page buttons for many pages
                  let pageNum = i + 1;
                  if (totalPages > 5) {
                    if (page > 3 && page < totalPages - 1) {
                      pageNum = [1, page-1, page, page+1, totalPages][i];
                    } else if (page >= totalPages - 1) {
                      pageNum = [1, totalPages-3, totalPages-2, totalPages-1, totalPages][i];
                    }
                  }
                  
                  // Only show dots for gaps in pagination
                  if (i === 1 && pageNum !== 2 && pageNum !== page-1) {
                    return (
                      <span key="dots1" className="px-2 py-1 text-gray-500 dark:text-gray-400">
                        ...
                      </span>
                    );
                  }
                  
                  if (i === 3 && pageNum !== totalPages-1 && pageNum !== page+1) {
                    return (
                      <span key="dots2" className="px-2 py-1 text-gray-500 dark:text-gray-400">
                        ...
                      </span>
                    );
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                      disabled={loading}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages || loading}
                >
                Next
              </Button>
            </div>
          </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
} 