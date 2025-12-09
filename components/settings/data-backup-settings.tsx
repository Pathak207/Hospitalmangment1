'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database, Shield, Download, FileText, AlertCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

interface DataBackupSettingsProps {
  openModal: any;
}

export default function DataBackupSettings({ openModal }: DataBackupSettingsProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [backupPreview, setBackupPreview] = useState<any>(null);
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  const [hasBackupAccess, setHasBackupAccess] = useState(true);
  const [featureError, setFeatureError] = useState<string | null>(null);

  // Check backup feature access on component mount
  useEffect(() => {
    checkBackupAccess();
  }, []);

  const checkBackupAccess = async () => {
    try {
      const response = await fetch('/api/subscription/features');
      const data = await response.json();
      
      if (response.ok) {
        setHasBackupAccess(data.features?.dataBackup || false);
      } else {
        setHasBackupAccess(false);
        setFeatureError(data.error || 'Unable to check backup access');
      }
    } catch (error) {
      console.error('Error checking backup access:', error);
      setHasBackupAccess(false);
      setFeatureError('Unable to check backup access');
    }
  };

  const generateBackupPreview = async () => {
    if (!hasBackupAccess) return;
    
    setIsGenerating(true);
    try {
      const response = await fetch('/api/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (response.ok) {
        setBackupPreview(data.preview);
        toast.success('Backup preview generated successfully');
      } else {
        if (data.code === 'FEATURE_NOT_AVAILABLE') {
          setHasBackupAccess(false);
          setFeatureError(data.error);
        }
        toast.error(data.error || 'Failed to generate backup preview');
      }
    } catch (error) {
      console.error('Error generating backup preview:', error);
      toast.error('Failed to generate backup preview');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadBackup = async (format: 'json' | 'csv') => {
    if (!hasBackupAccess) return;
    
    setIsGenerating(true);
    try {
      const response = await fetch(`/api/backup?format=${format}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        // Get filename from Content-Disposition header
        const contentDisposition = response.headers.get('Content-Disposition');
        const filename = contentDisposition
          ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
          : `backup-${new Date().toISOString().split('T')[0]}.${format}`;
        
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        setLastBackup(new Date().toISOString());
        toast.success(`Backup downloaded successfully as ${format.toUpperCase()}`);
      } else {
        const data = await response.json();
        if (data.code === 'FEATURE_NOT_AVAILABLE') {
          setHasBackupAccess(false);
          setFeatureError(data.error);
        }
        toast.error(data.error || 'Failed to download backup');
      }
    } catch (error) {
      console.error('Error downloading backup:', error);
      toast.error('Failed to download backup');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!hasBackupAccess) {
    return (
      <Card className="shadow-lg border border-gray-100 dark:border-gray-800 overflow-hidden">
        <CardHeader className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="flex items-center">
            <div className="p-2 mr-3 bg-red-100 dark:bg-red-900/50 rounded-lg text-red-600 dark:text-red-400">
              <AlertCircle size={20} />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">Data Backup</CardTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Export and backup your organization's data</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 bg-gray-50/50 dark:bg-gray-900/30">
          <div className="text-center py-8">
            <div className="p-3 bg-red-100 dark:bg-red-900/50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Shield className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Data Backup Not Available
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md mx-auto">
              {featureError || 'Data backup feature is not available in your current subscription plan.'}
            </p>
            <Button variant="outline" onClick={() => window.location.href = '/billing/upgrade'}>
              Upgrade Subscription
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border border-gray-100 dark:border-gray-800 overflow-hidden">
      <CardHeader className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="flex items-center">
          <div className="p-2 mr-3 bg-primary-100 dark:bg-primary-900/50 rounded-lg text-primary-600 dark:text-primary-300">
            <Database size={20} />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold">Data Backup</CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Export and backup your organization's data</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 bg-gray-50/50 dark:bg-gray-900/30">
        <div className="space-y-6">
          {/* Backup Information */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start">
              <div className="p-1 bg-blue-100 dark:bg-blue-900/50 rounded-lg mr-3">
                <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                  Secure Data Export
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                  Your backup will include all data associated with your organization only. No other organization's data will be included.
                </p>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• Patient records and medical information</li>
                  <li>• Appointments and scheduling data</li>
                  <li>• Prescriptions and medication history</li>
                  <li>• Lab results and clinical notes</li>
                  <li>• Payment records and billing information</li>
                  <li>• User accounts and activity logs</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Backup Preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">Backup Preview</h3>
              <Button 
                variant="outline" 
                onClick={generateBackupPreview}
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Preview
                  </>
                )}
              </Button>
              
              {backupPreview && (
                <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    {backupPreview.organizationName}
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Patients:</span>
                      <span className="font-medium">{backupPreview.recordCounts.patients}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Appointments:</span>
                      <span className="font-medium">{backupPreview.recordCounts.appointments}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Prescriptions:</span>
                      <span className="font-medium">{backupPreview.recordCounts.prescriptions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Lab Results:</span>
                      <span className="font-medium">{backupPreview.recordCounts.labResults}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Clinical Notes:</span>
                      <span className="font-medium">{backupPreview.recordCounts.clinicalNotes}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Payments:</span>
                      <span className="font-medium">{backupPreview.recordCounts.payments}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Users:</span>
                      <span className="font-medium">{backupPreview.recordCounts.users}</span>
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                      <div className="flex justify-between font-medium">
                        <span className="text-gray-900 dark:text-white">Total Records:</span>
                        <span className="text-primary-600 dark:text-primary-400">{backupPreview.totalRecords}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">Download Backup</h3>
              <div className="space-y-3">
                <Button 
                  variant="primary" 
                  onClick={() => downloadBackup('json')}
                  disabled={isGenerating}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Download JSON
                    </>
                  )}
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => downloadBackup('csv')}
                  disabled={isGenerating}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Download CSV
                    </>
                  )}
                </Button>
              </div>
              
              {lastBackup && (
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-sm text-green-800 dark:text-green-300">
                    <strong>Last backup:</strong> {new Date(lastBackup).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Backup Guidelines */}
          <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">Backup Guidelines</h3>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p>• <strong>JSON Format:</strong> Complete data export with full structure, ideal for system migration or detailed analysis</p>
              <p>• <strong>CSV Format:</strong> Simplified tabular format, suitable for spreadsheet applications and basic reporting</p>
              <p>• <strong>Security:</strong> All backups are generated in real-time and contain only your organization's data</p>
              <p>• <strong>Privacy:</strong> Backup files are not stored on our servers - they're generated and downloaded directly</p>
              <p>• <strong>Frequency:</strong> You can generate backups as often as needed based on your subscription plan</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 