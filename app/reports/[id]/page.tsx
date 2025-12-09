'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, BarChart3, Activity, FileText, PieChart, ArrowLeft, Printer, Download } from 'lucide-react';

export default function ReportDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;
  
  type Report = {
    reportId: string;
    title: string;
    description?: string;
    category?: 'Clinical' | 'Administrative' | 'Operations' | string;
    status?: string;
    date?: string;
    insights?: string[];
    updatedAt?: string;
  };
  
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/reports/${id}`);
        if (!res.ok) {
          throw new Error('Failed to fetch report');
        }
        const data = await res.json();
        setReport(data.report as Report);
      } catch (error) {
        console.error('Error fetching report:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchReport();
    }
  }, [id]);
  
  // Get category icon
  const getCategoryIcon = (category) => {
    switch(category) {
      case 'Clinical':
        return <Activity size={20} className="text-blue-500" />;
      case 'Administrative':
        return <FileText size={20} className="text-purple-500" />;
      case 'Operations':
        return <BarChart3 size={20} className="text-amber-500" />;
      default:
        return <BarChart3 size={20} className="text-gray-500" />;
    }
  };
  
  // Print report function
  const printReport = () => {
    window.print();
  };
  
  // Download report as PDF (placeholder function)
  const downloadReport = () => {
    alert('This feature is coming soon: Download report as PDF');
  };
  
  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-96">
          <div className="animate-pulse text-center">
            <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded mx-auto mb-4"></div>
            <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded mx-auto"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  if (!report) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-96">
          <FileText size={48} className="text-gray-400 mb-4" />
          <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Report Not Found</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">The report you're looking for doesn't exist or has been deleted.</p>
          <Button onClick={() => router.push('/reports')}>
            <ArrowLeft size={16} className="mr-2" />
            Back to Reports
          </Button>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push('/reports')}>
            <ArrowLeft size={16} className="mr-1" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Report Details
          </h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={printReport}>
            <Printer size={16} className="mr-2" />
            Print
          </Button>
          <Button variant="primary" onClick={downloadReport}>
            <Download size={16} className="mr-2" />
            Download PDF
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              report.category === 'Clinical' ? 'bg-blue-100 text-blue-700' :
              report.category === 'Administrative' ? 'bg-purple-100 text-purple-700' :
              report.category === 'Operations' ? 'bg-amber-100 text-amber-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {getCategoryIcon(report.category)}
            </div>
            <CardTitle className="text-xl">{report.title}</CardTitle>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <Calendar size={14} />
              {report.date ? new Date(report.date).toLocaleString() : 'No date'}
            </span>
            <span className="flex items-center gap-1">
              ID: {report.reportId}
            </span>
            <span className={`px-2 py-0.5 rounded-full ${
              report.status === 'Complete' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
              report.status === 'In Progress' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
              'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
            }`}>
              {report.status}
            </span>
            <span>{report.category}</span>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          <p className="text-gray-600 dark:text-gray-400 mb-6">{report.description}</p>
          
          <div className="mt-6">
            <div className="flex items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
                <PieChart size={18} className="text-blue-500" />
                Key Insights
              </h3>
            </div>
            
            {report.insights && report.insights.length > 0 ? (
              <ul className="space-y-2">
                {report.insights.map((insight, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0"></div>
                    <span className="text-gray-700 dark:text-gray-300">{insight}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 italic">No insights available for this report.</p>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="bg-gray-50 dark:bg-gray-800/30 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <p>Auto-generated report based on database data</p>
            {report.updatedAt && (
              <p>Generated on: {new Date(report.updatedAt).toLocaleString()}</p>
            )}
          </div>
        </CardFooter>
      </Card>
    </DashboardLayout>
  );
} 