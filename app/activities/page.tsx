'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Calendar, FileText, CheckCircle2, AlertTriangle, ClipboardCheck, Activity, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface ActivityType {
  id: string;
  title: string;
  description: string;
  time: string;
  icon: string;
  color: string;
  type: string;
  alert: boolean;
}

export default function ActivitiesPage() {
  const { data: session, status } = useSession();
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    if (status === 'authenticated') {
      fetchActivities();
    }
  }, [status, pagination.page, searchQuery, filterType]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      
      let queryParams = new URLSearchParams();
      queryParams.append('page', pagination.page.toString());
      queryParams.append('limit', pagination.limit.toString());
      
      if (searchQuery) {
        queryParams.append('search', searchQuery);
      }
      
      if (filterType !== 'all') {
        queryParams.append('type', filterType);
      }
      
      const response = await fetch(`/api/activities?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch activities');
      }
      
      const data = await response.json();
      setActivities(data.activities || []);
      setPagination(prev => ({
        ...prev,
        total: data.pagination?.total || 0,
        totalPages: data.pagination?.totalPages || 0
      }));
      
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError('Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setFilterType(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'FileSearch':
        return <FileText size={16} />;
      case 'CheckCircle2':
        return <CheckCircle2 size={16} />;
      case 'FileText':
        return <FileText size={16} />;
      case 'AlertTriangle':
        return <AlertTriangle size={16} />;
      case 'ClipboardCheck':
        return <ClipboardCheck size={16} />;
      default:
        return <Calendar size={16} />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'lab':
        return 'bg-blue-500';
      case 'appointment':
        return 'bg-green-500';
      case 'prescription':
        return 'bg-purple-500';
      case 'critical_alert':
        return 'bg-red-500';
      case 'referral':
        return 'bg-teal-500';
      default:
        return 'bg-amber-500';
    }
  };

  if (status === 'loading') {
    return <DashboardLayout><div className="flex justify-center items-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div></div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">All Activities</h1>
            <p className="text-gray-600 dark:text-gray-400">View all system activities and notifications</p>
          </div>
        </div>

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
                  placeholder="Search activities..." 
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </div>
              <div className="flex gap-3">
                <select 
                  className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                  value={filterType}
                  onChange={handleFilterChange}
                >
                  <option value="all">All Types</option>
                  <option value="appointment">Appointments</option>
                  <option value="prescription">Prescriptions</option>
                  <option value="lab">Lab Results</option>
                  <option value="critical_alert">Critical Alerts</option>
                  <option value="referral">Referrals</option>
                  <option value="note">Notes</option>
                  <option value="vitals">Vitals</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md dark:bg-red-900/20 dark:border-red-700 dark:text-red-400">
            <div className="flex items-center">
              <AlertTriangle size={18} className="mr-2" />
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* No Data State */}
        {!loading && !error && activities.length === 0 && (
          <div className="text-center py-20 border border-dashed rounded-md border-gray-300 dark:border-gray-700">
            <Activity size={48} className="mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">No Activities Found</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {searchQuery || filterType !== 'all' ? 
                'Try adjusting your search or filters' : 
                'No activities available at the moment'
              }
            </p>
          </div>
        )}

        {/* Activities List */}
        {!loading && !error && activities.length > 0 && (
          <div className="space-y-4">
            {activities.map((activity) => (
              <Card key={activity.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <div className={`${getActivityColor(activity.type)} h-10 w-10 rounded-full flex items-center justify-center shrink-0 text-white`}>
                      {getIconComponent(activity.icon)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className={`text-lg font-medium ${activity.alert ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                            {activity.title}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400 mt-1">
                            {activity.description}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <Calendar size={14} />
                              {activity.time}
                            </span>
                            <span className="capitalize px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs dark:bg-gray-800 dark:text-gray-300">
                              {activity.type}
                            </span>
                            {activity.alert && (
                              <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs dark:bg-red-900/20 dark:text-red-400">
                                Alert
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && activities.length > 0 && pagination.totalPages > 1 && (
          <div className="flex justify-between items-center mt-6">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total activities)
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
              <span className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded dark:bg-gray-800 dark:text-gray-300">
                {pagination.page}
              </span>
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
      </div>
    </DashboardLayout>
  );
} 