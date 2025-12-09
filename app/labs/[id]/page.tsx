'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSettings } from '@/lib/settings-context';
import { 
  TestTube, 
  ArrowLeft,
  Download,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Calendar,
  User,
  FileText
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface LabResult {
  _id: string;
  patient: {
    _id: string;
    name: string;
    patientId: string;
    age: number;
  };
  orderedBy: {
    _id: string;
    name: string;
  };
  testName: string;
  category: string;
  status: 'Ordered' | 'In Progress' | 'Completed' | 'Cancelled';
  orderedAt: string;
  completedAt?: string;
  urgency: 'Routine' | 'Urgent' | 'STAT';
  results?: Record<string, any>;
  resultSummary?: string;
  notes?: string;
}

export default function LabDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { formatDate } = useSettings();
  const [labResult, setLabResult] = useState<LabResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params?.id) {
      fetchLabResult(params.id as string);
    }
  }, [params?.id]);

  const fetchLabResult = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/labs/${id}`);
      const data = await response.json();
      
      if (response.ok) {
        setLabResult(data.labResult);
      } else {
        toast.error(data.error || 'Failed to fetch lab result');
        router.push('/labs');
      }
    } catch (error) {
      console.error('Error fetching lab result:', error);
      toast.error('Failed to fetch lab result');
      router.push('/labs');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'Ordered':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'Cancelled':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'STAT':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'Urgent':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'Routine':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle2 size={16} className="text-green-500" />;
      case 'In Progress':
        return <Clock size={16} className="text-blue-500" />;
      case 'Ordered':
        return <AlertTriangle size={16} className="text-yellow-500" />;
      case 'Cancelled':
        return <XCircle size={16} className="text-gray-500" />;
      default:
        return <Clock size={16} className="text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading lab result...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!labResult) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <TestTube size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Lab result not found
            </h3>
            <Button onClick={() => router.push('/labs')}>
              <ArrowLeft size={16} className="mr-2" />
              Back to Labs
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="outline"
            onClick={() => router.push('/labs')}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Back to Labs
          </Button>
        </div>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Lab Result Details</h1>
            <p className="text-gray-600 dark:text-gray-400">
              {labResult.testName} - {labResult.category}
            </p>
          </div>
          
          <div className="flex gap-2">
            <Badge className={getStatusColor(labResult.status)}>
              {getStatusIcon(labResult.status)}
              <span className="ml-1">{labResult.status}</span>
            </Badge>
            {labResult.urgency !== 'Routine' && (
              <Badge className={getUrgencyColor(labResult.urgency)}>
                {labResult.urgency}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Test Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube size={20} />
                Test Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Test Name</label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{labResult.testName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Category</label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{labResult.category}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Ordered Date</label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{formatDate(labResult.orderedAt)}</p>
                </div>
                {labResult.completedAt && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Completed Date</label>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{formatDate(labResult.completedAt)}</p>
                  </div>
                )}
              </div>
              
              {labResult.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Notes</label>
                  <p className="text-gray-900 dark:text-white mt-1">{labResult.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results */}
          {labResult.status === 'Completed' && labResult.results && Object.keys(labResult.results).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText size={20} />
                  Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Test
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Result
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Units
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Reference Range
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Flag
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {Object.entries(labResult.results).map(([testName, result]: [string, any]) => (
                        <tr key={testName}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {testName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {result.value}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {result.unit || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {result.referenceRange || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge className={
                              result.flag === 'High' || result.flag === 'Critical High' 
                                ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                : result.flag === 'Low' || result.flag === 'Critical Low'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                                : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            }>
                              {result.flag || 'Normal'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {labResult.resultSummary && (
                  <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Summary</h4>
                    <p className="text-gray-700 dark:text-gray-300">{labResult.resultSummary}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Patient Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User size={20} />
                Patient Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</label>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{labResult.patient.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Patient ID</label>
                <p className="text-gray-900 dark:text-white">{labResult.patient.patientId}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Age</label>
                <p className="text-gray-900 dark:text-white">{labResult.patient.age} years</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Ordered By</label>
                <p className="text-gray-900 dark:text-white">{labResult.orderedBy.name}</p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {labResult.status === 'Completed' && (
                <Button className="w-full flex items-center gap-2">
                  <Download size={16} />
                  Download Report
                </Button>
              )}
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => router.push(`/patients/${labResult.patient._id}`)}
              >
                View Patient
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
} 