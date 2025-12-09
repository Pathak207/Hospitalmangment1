'use client';

import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSession, signOut, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  
  // Simplified state to store only essential profile settings
  const [profileSettings, setProfileSettings] = useState({
    name: '',
    email: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  // Fetch user profile data on component mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch('/api/auth/profile');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user) {
            const user = data.user;
            setProfileSettings({
              name: user.name || '',
              email: user.email || ''
            });
          }
        } else {
          console.error('Failed to fetch user profile');
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);
  
  // Save profile to database
  const saveProfile = async () => {
    setSaving(true);
    try {
      const dataToSave: any = {
        name: profileSettings.name,
        email: profileSettings.email,
        profilePicture: session?.user?.image || null
      };

      // Add password change if provided
      if (newPassword) {
        dataToSave.newPassword = newPassword;
      }

      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSave),
      });

      const result = await response.json();
      
      if (result.success) {
        // Check if session refresh is required (name was updated)
        if (result.sessionRefreshRequired) {
          toast.success('Profile updated successfully! Updating your session...');
          
          try {
            // Trigger NextAuth session update which will refresh JWT token
            await update();
            
            // Dispatch custom event to notify other components
            window.dispatchEvent(new CustomEvent('profileUpdated', {
              detail: { user: result.user }
            }));
            
            // Small delay to ensure update completes
            setTimeout(() => {
              toast.success('Session updated successfully!');
              // Force refresh to ensure all components see the change
              window.location.reload();
            }, 500);
          } catch (error) {
            console.error('Error updating session:', error);
            toast.error('Profile updated but session refresh failed. Please refresh the page.');
          }
        } else {
          toast.success('Profile updated successfully! If you changed your email, please log out and log back in.');
        }
        // Clear password field
        setNewPassword('');
      } else {
        toast.error(result.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Error saving profile');
    } finally {
      setSaving(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <DashboardLayout>
        <div className="mb-8">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary-100 to-primary-50 dark:from-primary-900/30 dark:to-gray-900/20 h-40 rounded-xl z-0"></div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 pt-10 pb-8 relative z-10">
              <div className="mb-4 md:mb-0">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                  <div className="p-2 mr-3 bg-primary-100 dark:bg-primary-900/50 rounded-lg text-primary-600 dark:text-primary-300">
                    <User size={24} />
                  </div>
                  Profile
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1 ml-1 max-w-md">
                  Manage your personal information
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <Card className="shadow-lg border border-gray-100 dark:border-gray-800 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-8">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-100 to-primary-50 dark:from-primary-900/30 dark:to-gray-900/20 h-40 rounded-xl z-0"></div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 pt-10 pb-8 relative z-10">
            <div className="mb-4 md:mb-0">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                <div className="p-2 mr-3 bg-primary-100 dark:bg-primary-900/50 rounded-lg text-primary-600 dark:text-primary-300">
                  <User size={24} />
                </div>
                Profile
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1 ml-1 max-w-md">
                Manage your personal information
              </p>
            </div>
            <Button 
              variant="primary" 
              className="shadow-md hover:shadow-lg flex items-center px-5 py-2.5" 
              onClick={saveProfile}
              disabled={saving}
            >
              <Save size={18} className="mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>

      <Card className="shadow-lg border border-gray-100 dark:border-gray-800 overflow-hidden max-w-2xl mx-auto">
        <CardHeader className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="flex items-center">
            <div className="p-2 mr-3 bg-primary-100 dark:bg-primary-900/50 rounded-lg text-primary-600 dark:text-primary-300">
              <User size={20} />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">Doctor Profile</CardTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Update your basic information</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 bg-gray-50/50 dark:bg-gray-900/30">
          <div className="space-y-6">
            {/* Profile Avatar */}
            <div className="flex items-center justify-center">
              <div className="bg-primary-100 text-primary-600 rounded-full h-20 w-20 flex items-center justify-center text-2xl font-semibold">
                {profileSettings.name ? profileSettings.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'DR'}
              </div>
            </div>

            {/* Simple Form Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Doctor Name
                </label>
                <div className="relative">
                  <Input 
                    className="w-full pl-10 focus:ring-primary-500 focus:border-primary-500" 
                    placeholder="Enter your full name" 
                    value={profileSettings.name}
                    onChange={(e) => setProfileSettings(prev => ({ ...prev, name: e.target.value }))}
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user">
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Input 
                    className="w-full pl-10 focus:ring-primary-500 focus:border-primary-500" 
                    placeholder="Enter your email address" 
                    type="email"
                    value={profileSettings.email}
                    onChange={(e) => setProfileSettings(prev => ({ ...prev, email: e.target.value }))}
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mail">
                      <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                    </svg>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">You'll need to log out and log back in if you change your email</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Input 
                    className="w-full pl-10 focus:ring-primary-500 focus:border-primary-500"
                    type="password"
                    placeholder="Leave blank to keep current password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-lock">
                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">Leave blank to keep your current password</p>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button 
                onClick={saveProfile}
                disabled={saving}
                className="w-full"
                variant="primary"
              >
                <Save size={18} className="mr-2" />
                {saving ? 'Saving Changes...' : 'Save Profile'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
} 