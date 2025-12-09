'use client';

import React, { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Building, LogOut, Mail, Phone, Clock } from 'lucide-react';

export default function OrganizationDeactivatedPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [organizationInfo, setOrganizationInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.role === 'super_admin') {
      router.push('/super-admin');
      return;
    }

    fetchOrganizationInfo();
  }, [session, router]);

  const fetchOrganizationInfo = async () => {
    try {
      if (session?.user?.organization) {
        const response = await fetch(`/api/organizations/${session.user.organization}`);
        if (response.ok) {
          const data = await response.json();
          setOrganizationInfo(data);
        }
      }
    } catch (error) {
      console.error('Error fetching organization info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading organization details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6">
        {/* Main Alert Card */}
        <Card className="border-orange-200 dark:border-orange-800 bg-white dark:bg-gray-800 shadow-xl">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-4">
              <AlertTriangle className="h-8 w-8 text-orange-600 dark:text-orange-400" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Organization Access Suspended
            </CardTitle>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Your organization account has been temporarily deactivated
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Status Information */}
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Building className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">
                    Account Status
                  </h3>
                  <p className="text-sm text-orange-800 dark:text-orange-200 mb-3">
                    Your organization "{organizationInfo?.name || 'Unknown'}" has been deactivated by the system administrator.
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500"></span>
                      <span className="text-orange-700 dark:text-orange-300">Status: Deactivated</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-orange-600" />
                      <span className="text-orange-700 dark:text-orange-300">
                        Effective immediately
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* What This Means */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                What this means:
              </h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 flex-shrink-0"></span>
                  Access to all system features has been temporarily suspended
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 flex-shrink-0"></span>
                  Patient data and records remain secure and unchanged
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 flex-shrink-0"></span>
                  No billing or subscription charges will occur during deactivation
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 flex-shrink-0"></span>
                  Account can be reactivated by the administrator
                </li>
              </ul>
            </div>

            {/* Contact Information */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Contact Your Administrator
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                To reactivate your account or resolve this issue, please contact your system administrator:
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                  <Mail className="h-4 w-4" />
                  <span>admin@{organizationInfo?.email?.split('@')[1] || 'yourorganization.com'}</span>
                </div>
                {organizationInfo?.phone && (
                  <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                    <Phone className="h-4 w-4" />
                    <span>{organizationInfo.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Organization Details */}
            {organizationInfo && (
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Organization Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Name:</span>
                    <span className="ml-2 text-gray-900 dark:text-gray-100">{organizationInfo.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Email:</span>
                    <span className="ml-2 text-gray-900 dark:text-gray-100">{organizationInfo.email}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Created:</span>
                    <span className="ml-2 text-gray-900 dark:text-gray-100">
                      {new Date(organizationInfo.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Status:</span>
                    <span className="ml-2 text-red-600 dark:text-red-400 font-medium">Deactivated</span>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  className="flex items-center gap-2 border-gray-300 dark:border-gray-600"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
                <div className="flex-1"></div>
                <p className="text-xs text-gray-500 dark:text-gray-400 self-center">
                  Need help? Contact your administrator
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            This is a temporary suspension. Your data is safe and secure.
          </p>
        </div>
      </div>
    </div>
  );
} 