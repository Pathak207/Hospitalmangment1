import React, { useState, useEffect, memo } from 'react';
import { cn } from '@/lib/utils';
import { Toaster } from 'react-hot-toast';
import SuperAdminSidebar from './super-admin-sidebar';
import SuperAdminHeader from './super-admin-header';

interface SuperAdminLayoutProps {
  children: React.ReactNode;
}

// Use memo to prevent unnecessary re-renders
const SuperAdminLayout = memo(function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#363636',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
          loading: {
            iconTheme: {
              primary: '#3b82f6',
              secondary: '#fff',
            },
          },
        }}
      />
      
      {/* Sidebar */}
      <SuperAdminSidebar />
      
      {/* Background elements */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2 opacity-60"></div>
        <div className="absolute bottom-0 left-0 w-[30rem] h-[30rem] bg-indigo-500/5 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2 opacity-60"></div>
        
        <div className="absolute inset-0 opacity-[0.01] dark:opacity-[0.02]">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="superAdminGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#superAdminGrid)" />
          </svg>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="lg:pl-72 min-h-screen flex flex-col relative z-10">
        {/* Header */}
        <SuperAdminHeader />
        
        {/* Main Content */}
        <main className="flex-1 p-6 relative z-20">
          <div className="w-full max-w-7xl mx-auto">
            {children}
          </div>
        </main>
        
        {/* Footer */}
        <footer className="py-4 px-6 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 relative z-10">
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} DoctorCare. All rights reserved.
          </div>
        </footer>
      </div>
    </div>
  );
});

export default SuperAdminLayout; 