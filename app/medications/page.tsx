'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useModal } from '@/components/ui/modal-provider';
import { Search, PlusCircle, Filter, Edit, Trash2, ChevronLeft, ChevronRight, Pill, AlignJustify } from 'lucide-react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

export default function MedicationsPage() {
  const { openModal } = useModal();
  const { data: session, status } = useSession();
  const [medications, setMedications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedFormulation, setSelectedFormulation] = useState('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [categories, setCategories] = useState<string[]>([]);
  const [formulations, setFormulations] = useState<string[]>([]);

  // Fetch medications on page load and when filters change
  useEffect(() => {
    if (status === 'authenticated' && session) {
      // Clear any previous error when we have a valid session
      setError('');
      fetchMedications();
    } else if (status === 'unauthenticated') {
      setLoading(false);
      setError('You must be logged in to view medications');
    }
    // Don't do anything when status is 'loading' - let it load
  }, [pagination.page, selectedCategory, selectedFormulation, searchQuery, status, session]);

  // Listen for medication updates
  useEffect(() => {
    const handleMedicationUpdate = () => {
      if (status === 'authenticated' && session) {
        // Clear any errors and refetch
        setError('');
        fetchMedications();
      }
    };

    window.addEventListener('medicationUpdated', handleMedicationUpdate);
    return () => {
      window.removeEventListener('medicationUpdated', handleMedicationUpdate);
    };
  }, [status, session]);

  const fetchMedications = async () => {
    try {
      setLoading(true);
      
      // Double-check session before API call
      if (status !== 'authenticated' || !session) {
        // Only set error if we're definitely unauthenticated, not just loading
        if (status === 'unauthenticated') {
          setError('You must be logged in to view medications');
        }
        setLoading(false);
        return;
      }
      
      // Build query string
      let queryParams = new URLSearchParams();
      queryParams.append('page', pagination.page.toString());
      queryParams.append('limit', pagination.limit.toString());
      
      if (searchQuery) {
        queryParams.append('search', searchQuery);
      }
      
      if (selectedCategory !== 'all') {
        queryParams.append('category', selectedCategory);
      }
      
      if (selectedFormulation !== 'all') {
        queryParams.append('formulation', selectedFormulation);
      }
      
      const response = await fetch(`/api/medications?${queryParams.toString()}`);
      
      if (!response.ok) {
        if (response.status === 401) {
          setError('Session expired. Please refresh the page and log in again.');
          return;
        }
        throw new Error('Failed to fetch medications');
      }
      
      const data = await response.json();
      setMedications(data.medications);
      setPagination(data.pagination);
      
      // Clear any previous errors
      setError('');
      
      // Set filter options if available
      if (data.filters) {
        if (data.filters.categories) {
          setCategories(data.filters.categories);
        }
        if (data.filters.formulations) {
          setFormulations(data.filters.formulations);
        }
      }
      
    } catch (error) {
      console.error('Error fetching medications:', error);
      setError('Failed to load medications');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page on search change
  };

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleFormulationChange = (e) => {
    setSelectedFormulation(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleEditMedication = (medication) => {
    openModal('addMedication', medication);
  };

  const handleDeleteMedication = async (medicationId) => {
    if (!confirm('Are you sure you want to delete this medication? This action cannot be undone.')) {
      return;
    }
    
    try {
      const loadingToast = toast.loading('Deleting medication...');
      
      const response = await fetch(`/api/medications/${medicationId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete medication');
      }
      
      toast.dismiss(loadingToast);
      toast.success('Medication deleted successfully!');
      
      // Refresh the medication list
      fetchMedications();
      
    } catch (error) {
      console.error('Error deleting medication:', error);
      toast.error(error.message || 'Failed to delete medication');
    }
  };

  return (
    <DashboardLayout>
      {status === 'loading' ? (
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      ) : status === 'unauthenticated' ? (
        <div className="flex flex-col justify-center items-center h-screen gap-4">
          <div className="text-center p-8 text-red-500">You must be logged in to view medications</div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Medications</h1>
              <p className="text-gray-600 dark:text-gray-400">Manage medication catalog</p>
            </div>
            <div className="flex gap-2">
              <Button variant="primary" onClick={() => openModal('addMedication')}>
                <PlusCircle size={18} className="mr-2" />
                Add Medication
              </Button>
            </div>
          </div>
          
          {/* Search and Filters */}
          <Card className="mb-6 shadow-sm">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={16} className="text-gray-400" />
                  </div>
                  <Input 
                    type="text" 
                    placeholder="Search medications..." 
                    className="pl-10"
                    value={searchQuery}
                    onChange={handleSearchChange}
                  />
                </div>
                
                <div className="flex items-center">
                  <Filter size={16} className="text-gray-400 mr-2" />
                  <select 
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                    value={selectedCategory}
                    onChange={handleCategoryChange}
                  >
                    <option value="all">All Categories</option>
                    {categories.map((category, index) => (
                      <option key={index} value={category}>{category || 'Uncategorized'}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-center">
                  <AlignJustify size={16} className="text-gray-400 mr-2" />
                  <select 
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                    value={selectedFormulation}
                    onChange={handleFormulationChange}
                  >
                    <option value="all">All Formulations</option>
                    {formulations.map((formulation, index) => (
                      <option key={index} value={formulation}>{formulation}</option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Medications List */}
          <Card className="shadow-md">
            <CardHeader className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <CardTitle className="text-lg font-semibold">Medication Catalog</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex justify-center items-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                </div>
              ) : error ? (
                <div className="text-center p-8 text-red-500">{error}</div>
              ) : medications.length === 0 ? (
                <div className="text-center p-8 text-gray-500 dark:text-gray-400">
                  No medications found. {searchQuery || selectedCategory !== 'all' || selectedFormulation !== 'all' ? 'Try adjusting your filters.' : ''}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800/70 text-left">
                      <tr>
                        <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Formulation
                        </th>
                        <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Strength
                        </th>
                        <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Manufacturer
                        </th>
                        <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {medications.map((medication) => (
                        <tr 
                          key={medication._id} 
                          className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="p-2 rounded-full bg-primary-100 dark:bg-primary-900/20 mr-3">
                                <Pill size={16} className="text-primary-500" />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white">{medication.name}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">{medication.genericName || '-'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                              {medication.formulation}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {medication.strength}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {medication.category || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {medication.manufacturer || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEditMedication(medication)}
                            >
                              <Edit size={16} className="text-gray-500" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteMedication(medication._id)}
                              className="text-danger-500 hover:text-danger-700 hover:bg-danger-50 dark:hover:bg-danger-900/20"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              {/* Pagination */}
              {medications.length > 0 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Showing {((pagination.page - 1) * pagination.limit) + 1}-
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} medications
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                    >
                      <ChevronLeft size={16} />
                    </Button>
                    <div className="text-sm text-gray-800 dark:text-gray-200">
                      Page {pagination.page} of {pagination.totalPages}
                    </div>
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
            </CardContent>
          </Card>
        </>
      )}
    </DashboardLayout>
  );
} 