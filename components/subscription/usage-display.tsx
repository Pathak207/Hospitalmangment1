'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  UserPlus, 
  Calendar, 
  AlertTriangle, 
  CheckCircle,
  Crown,
  Zap
} from 'lucide-react';

interface SubscriptionData {
  success: boolean;
  features: {
    maxPatients: number;
    maxUsers: number;
    maxAppointments: number;
    customBranding: boolean;
    apiAccess: boolean;
    prioritySupport: boolean;
    advancedReports: boolean;
    smsNotifications: boolean;
    emailNotifications: boolean;
    dataBackup: boolean;
  };
  plan: string;
  usage: {
    patients: number;
    users: number;
    appointments: number;
    monthPeriod?: {
      start: string;
      end: string;
      current: string;
    };
  };
  limits: {
    maxPatients: number;
    maxUsers: number;
    maxAppointments: number;
  };
}

export default function SubscriptionUsageDisplay() {
  const { data: session } = useSession();
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.role === 'super_admin') {
      setLoading(false);
      return;
    }

    fetchSubscriptionData();
  }, [session]);

  const fetchSubscriptionData = async () => {
    try {
      const response = await fetch('/api/subscription/features');
      const data = await response.json();
      
      if (response.ok) {
        setSubscriptionData(data);
      } else {
        setError(data.error || 'Failed to fetch subscription data');
      }
    } catch (err) {
      setError('Failed to fetch subscription data');
    } finally {
      setLoading(false);
    }
  };

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === -1) return 0; // Unlimited
    return Math.min((used / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (session?.user?.role === 'super_admin') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            Super Admin Access
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            You have unlimited access to all features as a super administrator.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Subscription Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!subscriptionData) {
    return null;
  }

  const { features, plan, usage, limits } = subscriptionData;

  return (
    <div className="space-y-6">
      {/* Plan Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-500" />
            Current Plan: {plan}
          </CardTitle>
          {usage.monthPeriod && (
            <p className="text-sm text-gray-600">
              Monthly usage for {new Date(usage.monthPeriod.start).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Patients Usage */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Patients</span>
                <span className="text-xs text-gray-500">(monthly)</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{usage.patients}</span>
                  <span className="text-gray-500">
                    {limits.maxPatients === -1 ? '∞' : `/${limits.maxPatients}`}
                  </span>
                </div>
                {limits.maxPatients !== -1 && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${getProgressColor(getUsagePercentage(usage.patients, limits.maxPatients))}`}
                      style={{ width: `${getUsagePercentage(usage.patients, limits.maxPatients)}%` }}
                    ></div>
                  </div>
                )}
              </div>
            </div>

            {/* Users Usage */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Users</span>
                <span className="text-xs text-gray-500">(total)</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{usage.users}</span>
                  <span className="text-gray-500">
                    {limits.maxUsers === -1 ? '∞' : `/${limits.maxUsers}`}
                  </span>
                </div>
                {limits.maxUsers !== -1 && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${getProgressColor(getUsagePercentage(usage.users, limits.maxUsers))}`}
                      style={{ width: `${getUsagePercentage(usage.users, limits.maxUsers)}%` }}
                    ></div>
                  </div>
                )}
              </div>
            </div>

            {/* Appointments Usage */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">Appointments</span>
                <span className="text-xs text-gray-500">(monthly)</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{usage.appointments}</span>
                  <span className="text-gray-500">
                    {limits.maxAppointments === -1 ? '∞' : `/${limits.maxAppointments}`}
                  </span>
                </div>
                {limits.maxAppointments !== -1 && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${getProgressColor(getUsagePercentage(usage.appointments, limits.maxAppointments))}`}
                      style={{ width: `${getUsagePercentage(usage.appointments, limits.maxAppointments)}%` }}
                    ></div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {usage.monthPeriod && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>Monthly Limits:</strong> Patient and appointment limits reset on the 1st of each month. 
                Current period: {new Date(usage.monthPeriod.start).toLocaleDateString()} - {new Date(usage.monthPeriod.end).toLocaleDateString()}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Features */}
      <Card>
        <CardHeader>
          <CardTitle>Available Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="flex items-center gap-2">
              {features.customBranding ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-gray-400" />
              )}
              <span className={`text-sm ${features.customBranding ? 'text-gray-900' : 'text-gray-400'}`}>
                Custom Branding
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {features.apiAccess ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-gray-400" />
              )}
              <span className={`text-sm ${features.apiAccess ? 'text-gray-900' : 'text-gray-400'}`}>
                API Access
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {features.prioritySupport ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-gray-400" />
              )}
              <span className={`text-sm ${features.prioritySupport ? 'text-gray-900' : 'text-gray-400'}`}>
                Priority Support
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {features.advancedReports ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-gray-400" />
              )}
              <span className={`text-sm ${features.advancedReports ? 'text-gray-900' : 'text-gray-400'}`}>
                Advanced Reports
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {features.smsNotifications ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-gray-400" />
              )}
              <span className={`text-sm ${features.smsNotifications ? 'text-gray-900' : 'text-gray-400'}`}>
                SMS Notifications
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {features.dataBackup ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-gray-400" />
              )}
              <span className={`text-sm ${features.dataBackup ? 'text-gray-900' : 'text-gray-400'}`}>
                Data Backup
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 