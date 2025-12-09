'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Eye, Edit, Trash2, FlaskConical, FileText, Calendar, Filter, Download, Printer, RefreshCw, AlertCircle, CheckCircle, Clock, X } from 'lucide-react';
import { useModal } from '@/components/ui/modal-provider';
import toast from 'react-hot-toast';
import { formatDateTime } from '@/lib/utils';

export default function LabsPage() {
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [selectedLabs, setSelectedLabs] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Use the modal provider instead of custom modal state
  const { openModal } = useModal();

  // Fetch labs from API
  const fetchLabs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/labs');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to fetch labs: ${errorData.error || response.statusText}`);
      }
      const data = await response.json();
      console.log('Labs API response:', data);
      setLabs(data.labs || []);
    } catch (error) {
      console.error('Error fetching labs:', error);
      toast.error(`Failed to load lab tests: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchLabs();
  }, []);

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchLabs();
    setRefreshing(false);
    toast.success('Lab tests refreshed');
  };

  // Filter labs based on search and filters
  const filteredLabs = labs.filter(lab => {
    const matchesSearch = lab.testName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lab.patient?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lab.patient?.patientId?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || lab.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || lab.category === categoryFilter;
    const matchesUrgency = urgencyFilter === 'all' || lab.urgency === urgencyFilter;
    
    return matchesSearch && matchesStatus && matchesCategory && matchesUrgency;
  });

  // Get unique values for filters
  const uniqueCategories = [...new Set(labs.map(lab => lab.category).filter(Boolean))];
  const uniqueUrgencies = [...new Set(labs.map(lab => lab.urgency).filter(Boolean))];

  // Handle lab selection
  const handleLabSelection = (labId) => {
    setSelectedLabs(prev => {
      if (prev.includes(labId)) {
        return prev.filter(id => id !== labId);
      } else {
        return [...prev, labId];
      }
    });
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedLabs.length === filteredLabs.length) {
      setSelectedLabs([]);
    } else {
      setSelectedLabs(filteredLabs.map(lab => lab._id));
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedLabs.length === 0) {
      toast.error('No labs selected');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedLabs.length} lab test(s)?`)) {
      return;
    }

    try {
      const deletePromises = selectedLabs.map(labId => 
        fetch(`/api/labs/${labId}`, { method: 'DELETE' })
      );
      
      await Promise.all(deletePromises);
      
      toast.success(`${selectedLabs.length} lab test(s) deleted successfully`);
      setSelectedLabs([]);
      fetchLabs();
    } catch (error) {
      console.error('Error deleting labs:', error);
      toast.error('Failed to delete lab tests');
    }
  };

  // Handle delete single lab
  const handleDeleteLab = async (labId) => {
    if (!confirm('Are you sure you want to delete this lab test?')) {
      return;
    }

    try {
      const response = await fetch(`/api/labs/${labId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete lab test');
      }

      toast.success('Lab test deleted successfully');
      fetchLabs();
    } catch (error) {
      console.error('Error deleting lab:', error);
      toast.error('Failed to delete lab test');
    }
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'Completed': return 'success';
      case 'Pending': return 'warning';
      case 'In Progress': return 'info';
      case 'Cancelled': return 'danger';
      default: return 'default';
    }
  };

  // Get urgency badge variant
  const getUrgencyBadgeVariant = (urgency) => {
    switch (urgency) {
      case 'STAT': return 'danger';
      case 'Urgent': return 'warning';
      case 'Routine': return 'default';
      default: return 'default';
    }
  };

  // Export functionality
  const handleExport = () => {
    try {
      // Prepare data for export
      const exportData = filteredLabs.map(lab => ({
        'Patient Name': lab.patient?.name || 'Unknown',
        'Patient ID': lab.patient?.patientId || 'N/A',
        'Test Name': lab.testName,
        'Category': lab.category || 'N/A',
        'Urgency': lab.urgency,
        'Status': lab.status,
        'Ordered Date': formatDateTime(lab.createdAt),
        'Completed Date': lab.completedAt ? formatDateTime(lab.completedAt) : 'N/A',
        'Notes': lab.notes || 'N/A',
        'Results': lab.results && Object.keys(lab.results).length > 0 
          ? Object.entries(lab.results).map(([name, data]) => 
              `${name}: ${data.value} ${data.unit || ''} (${data.flag})`
            ).join('; ')
          : 'No results',
        'Summary': lab.resultSummary || 'N/A'
      }));

      // Convert to CSV
      const headers = Object.keys(exportData[0]);
      const csvContent = [
        headers.join(','),
        ...exportData.map(row => 
          headers.map(header => {
            const value = row[header] || '';
            // Escape quotes and wrap in quotes if contains comma
            return value.includes(',') || value.includes('"') 
              ? `"${value.replace(/"/g, '""')}"` 
              : value;
          }).join(',')
        )
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `lab-results-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Lab results exported successfully!');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export lab results');
    }
  };

  // Print functionality
  const handlePrint = () => {
    try {
      // Create printable content
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Lab Results Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .summary { margin-bottom: 20px; display: flex; gap: 20px; }
            .summary-card { flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 5px; text-align: center; }
            .summary-card h3 { margin: 0; color: #333; }
            .summary-card p { margin: 5px 0; font-size: 24px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 8px; text-align: left; border: 1px solid #ddd; }
            th { background-color: #f5f5f5; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .status-pending { color: #d97706; }
            .status-completed { color: #059669; }
            .status-progress { color: #2563eb; }
            .status-cancelled { color: #dc2626; }
            .urgency-stat { color: #dc2626; font-weight: bold; }
            .urgency-urgent { color: #d97706; }
            .print-date { text-align: right; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Lab Results Report</h1>
            <p>Generated on ${new Date().toLocaleString()}</p>
          </div>
          
          <div class="summary">
            <div class="summary-card">
              <h3>Total Labs</h3>
              <p>${labs.length}</p>
            </div>
            <div class="summary-card">
              <h3>Pending</h3>
              <p style="color: #d97706;">${labs.filter(l => l.status === 'Pending').length}</p>
            </div>
            <div class="summary-card">
              <h3>Completed</h3>
              <p style="color: #059669;">${labs.filter(l => l.status === 'Completed').length}</p>
            </div>
            <div class="summary-card">
              <h3>STAT Orders</h3>
              <p style="color: #dc2626;">${labs.filter(l => l.urgency === 'STAT').length}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Test Name</th>
                <th>Category</th>
                <th>Urgency</th>
                <th>Status</th>
                <th>Ordered Date</th>
                <th>Results</th>
              </tr>
            </thead>
            <tbody>
              ${filteredLabs.map(lab => `
                <tr>
                  <td>
                    <strong>${lab.patient?.name || 'Unknown'}</strong><br>
                    <small>${lab.patient?.patientId || 'N/A'}</small>
                  </td>
                  <td>
                    <strong>${lab.testName}</strong>
                    ${lab.notes ? `<br><small>${lab.notes}</small>` : ''}
                  </td>
                  <td>${lab.category || 'N/A'}</td>
                  <td class="urgency-${lab.urgency?.toLowerCase()}">${lab.urgency}</td>
                  <td class="status-${lab.status?.toLowerCase().replace(' ', '')}">${lab.status}</td>
                  <td>${formatDateTime(lab.createdAt)}</td>
                  <td>
                    ${lab.results && Object.keys(lab.results).length > 0 
                      ? Object.entries(lab.results).map(([name, data]) => 
                          `<div><strong>${name}:</strong> ${data.value} ${data.unit || ''} (${data.flag})</div>`
                        ).join('')
                      : 'No results'}
                    ${lab.resultSummary ? `<div><em>${lab.resultSummary}</em></div>` : ''}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="print-date">
            Report printed on ${new Date().toLocaleString()}
          </div>
        </body>
        </html>
      `;

      // Open print window
      const printWindow = window.open('', '_blank');
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      
      toast.success('Print dialog opened');
    } catch (error) {
      console.error('Error printing:', error);
      toast.error('Failed to open print dialog');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Lab Tests</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage laboratory tests and results</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center"
            >
              <RefreshCw size={16} className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="primary"
              onClick={() => openModal('orderLab')}
              className="flex items-center"
            >
              <Plus size={16} className="mr-2" />
              Order New Lab
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 dark:text-blue-400">Total Labs</p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{labs.length}</p>
                </div>
                <FlaskConical className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">Pending</p>
                  <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{labs.filter(l => l.status === 'Pending').length}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 dark:text-green-400">Completed</p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">{labs.filter(l => l.status === 'Completed').length}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-red-200 dark:border-red-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600 dark:text-red-400">STAT Orders</p>
                  <p className="text-2xl font-bold text-red-900 dark:text-red-100">{labs.filter(l => l.urgency === 'STAT').length}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filters</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedLabs.length > 0 && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleBulkDelete}
                    className="flex items-center"
                  >
                    <Trash2 size={14} className="mr-1" />
                    Delete Selected ({selectedLabs.length})
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Search */}
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search labs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Status</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Categories</option>
                {uniqueCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>

              {/* Urgency Filter */}
              <select
                value={urgencyFilter}
                onChange={(e) => setUrgencyFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Urgency</option>
                {uniqueUrgencies.map(urgency => (
                  <option key={urgency} value={urgency}>{urgency}</option>
                ))}
              </select>

              {/* Clear Filters */}
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setCategoryFilter('all');
                  setUrgencyFilter('all');
                }}
                className="flex items-center"
              >
                <X size={14} className="mr-1" />
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Labs Table */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center">
                <FlaskConical size={20} className="mr-2 text-primary-500" />
                Lab Tests ({filteredLabs.length})
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download size={14} className="mr-1" />
                  Export
                </Button>
                <Button variant="outline" size="sm" onClick={handlePrint}>
                  <Printer size={14} className="mr-1" />
                  Print
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                <span className="ml-2 text-gray-600 dark:text-gray-400">Loading lab tests...</span>
              </div>
            ) : filteredLabs.length === 0 ? (
              <div className="text-center py-8">
                <FlaskConical className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No lab tests found</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all' || urgencyFilter !== 'all'
                    ? 'No lab tests match your current filters.'
                    : 'Get started by ordering your first lab test.'}
                </p>
                <Button
                  variant="primary"
                  onClick={() => openModal('orderLab')}
                  className="flex items-center"
                >
                  <Plus size={16} className="mr-2" />
                  Order New Lab
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                        <input
                          type="checkbox"
                          checked={selectedLabs.length === filteredLabs.length}
                          onChange={handleSelectAll}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Patient</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Test Name</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Category</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Urgency</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Ordered Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLabs.map((lab) => (
                      <tr key={lab._id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={selectedLabs.includes(lab._id)}
                            onChange={() => handleLabSelection(lab._id)}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-sm font-medium mr-3 dark:bg-primary-900 dark:text-primary-300">
                              {lab.patient?.name?.split(' ').map(n => n[0]).join('') || 'P'}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">{lab.patient?.name || 'Unknown'}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">{lab.patient?.patientId || 'N/A'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-900 dark:text-white">{lab.testName}</div>
                          {lab.notes && (
                            <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">{lab.notes}</div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-gray-600 dark:text-gray-400">{lab.category || 'N/A'}</span>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={getUrgencyBadgeVariant(lab.urgency)}>
                            {lab.urgency}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={getStatusBadgeVariant(lab.status)}>
                            {lab.status === 'Completed' && <CheckCircle size={12} className="mr-1" />}
                            {lab.status === 'Pending' && <Clock size={12} className="mr-1" />}
                            {lab.status === 'In Progress' && <RefreshCw size={12} className="mr-1" />}
                            {lab.status === 'Cancelled' && <AlertCircle size={12} className="mr-1" />}
                            {lab.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {formatDateTime(lab.createdAt)}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openModal('viewLabDetails', lab)}
                              className="text-blue-600 hover:text-blue-700"
                              title="View Details"
                            >
                              <Eye size={14} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openModal('addLabResults', lab)}
                              className="text-green-600 hover:text-green-700"
                              title="Add/Edit Results"
                            >
                              <FileText size={14} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteLab(lab._id)}
                              className="text-red-600 hover:text-red-700"
                              title="Delete Order"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
} 