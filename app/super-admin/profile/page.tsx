'use client';

import React, { useState, useEffect } from 'react';
import SuperAdminLayout from '@/components/layout/super-admin-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, Save, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSession, signOut, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  
  // const [loading, setLoading] = useState(false);
  // const [profile, setProfile] = useState({
  //   name: '',
  //   email: '',
  //   phone: '',
  //   role: 'super_admin',
  //   lastLogin: '',
  //   createdAt: '',
  // });
  // const [isEditing, setIsEditing] = useState(false);


const [loading, setLoading] = useState(false);
const [profile, setProfile] = useState({
  name: '',
  email: '',
  phone: '',
  role: 'super_admin',
  lastLogin: '',
  createdAt: '',
});
const [isEditing, setIsEditing] = useState(false);
const [saving, setSaving] = useState(false);
const [profileSettings, setProfileSettings] = useState({
  name: '',
  email: ''
});
const [newPassword, setNewPassword] = useState('');
  useEffect(() => {
    // Wait for session to load before making any decisions
    if (status === 'loading') return;
    
    // Only redirect if session is loaded and user is not super admin
    if (status === 'unauthenticated' || (session && session.user?.role !== 'super_admin')) {
      router.push('/login');
      return;
    }

    // If we get here, user is authenticated as super admin
    if (session?.user?.role === 'super_admin') {
      loadProfile();
    }
  }, [session, status, router]);

  const loadProfile = async () => {
    try {
      const response = await fetch('/api/auth/profile');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          setProfile(data.user);
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

  // Save profile to database
  const saveProfile = async () => {
    setSaving(true);
    try {
      const dataToSave: any = {
        name: profileSettings.name,
        email: profileSettings.email
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
            // Trigger NextAuth client session refresh which will refresh JWT token
            await getSession();
            
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
  if (loading || status === 'loading') {
    return (
      <SuperAdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <User className="h-7 w-7 text-purple-600" />
                Super Admin Profile
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage your super administrator account information
              </p>
            </div>
          </div>
          
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </SuperAdminLayout>
    );
  }

  // Don't render if user is not super admin
  if (status === 'authenticated' && session?.user?.role !== 'super_admin') {
    return null;
  }

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <User className="h-7 w-7 text-purple-600" />
              Super Admin Profile
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage your super administrator account information
            </p>
          </div>
          <Button 
            onClick={saveProfile}
            disabled={saving}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader className="border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-gray-900 dark:text-gray-100">Administrator Profile</CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">Update your super admin account details</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {/* Profile Avatar */}
                <div className="flex items-center justify-center">
                  <div className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full h-20 w-20 flex items-center justify-center text-2xl font-semibold">
                    {profileSettings.name ? profileSettings.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'SA'}
                  </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Administrator Name
                    </label>
                    <div className="relative">
                      <Input 
                        className="w-full pl-10 text-gray-900 dark:text-gray-100 focus:ring-purple-500 focus:border-purple-500" 
                        placeholder="Enter your full name" 
                        value={profileSettings.name}
                        onChange={(e) => setProfileSettings(prev => ({ ...prev, name: e.target.value }))}
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <User size={16} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Input 
                        className="w-full pl-10 text-gray-900 dark:text-gray-100 focus:ring-purple-500 focus:border-purple-500" 
                        placeholder="Enter your email address" 
                        type="email"
                        value={profileSettings.email}
                        onChange={(e) => setProfileSettings(prev => ({ ...prev, email: e.target.value }))}
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                        </svg>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">You'll need to log out and log back in if you change your email</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <Input 
                        className="w-full pl-10 text-gray-900 dark:text-gray-100 focus:ring-purple-500 focus:border-purple-500"
                        type="password"
                        placeholder="Leave blank to keep current password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Leave blank to keep your current password</p>
                  </div>
                </div>

                {/* Save Button */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button 
                    onClick={saveProfile}
                    disabled={saving}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving Changes...' : 'Save Profile'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SuperAdminLayout>
  );
} 