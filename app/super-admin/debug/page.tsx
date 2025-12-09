'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import SuperAdminLayout from '@/components/layout/super-admin-layout';

export default function DebugPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Debug Information
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Current session and routing information
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Session Status</h2>
          <div className="space-y-2">
            <p><strong>Status:</strong> {status}</p>
            <p><strong>User Role:</strong> {session?.user?.role || 'Not available'}</p>
            <p><strong>User Name:</strong> {session?.user?.name || 'Not available'}</p>
            <p><strong>User Email:</strong> {session?.user?.email || 'Not available'}</p>
            <p><strong>Current Path:</strong> {pathname}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Session Object</h2>
          <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(session, null, 2)}
          </pre>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Tests</h2>
          <div className="space-y-2">
            <button 
              onClick={() => router.push('/super-admin')}
              className="bg-purple-600 text-white px-4 py-2 rounded mr-2"
            >
              Go to Dashboard
            </button>
            <button 
              onClick={() => router.push('/super-admin/profile')}
              className="bg-purple-600 text-white px-4 py-2 rounded mr-2"
            >
              Go to Profile
            </button>
            <button 
              onClick={() => router.push('/super-admin/settings')}
              className="bg-purple-600 text-white px-4 py-2 rounded mr-2"
            >
              Go to Settings
            </button>
            <button 
              onClick={() => router.push('/super-admin/analytics')}
              className="bg-purple-600 text-white px-4 py-2 rounded"
            >
              Go to Analytics
            </button>
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
} 