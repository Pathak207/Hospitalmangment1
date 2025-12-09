"use client";

import React, { useState, useEffect, useRef, memo } from 'react';
import { Bell, Search, Calendar, LogOut, User, Settings, ChevronDown, FileSearch, CheckCircle2, FileText, AlertTriangle, ClipboardCheck, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeSwitcher } from '../theme-switcher';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useModal } from '@/components/ui/modal-provider';

// Extend the session user type to include role
declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
    }
  }
}

interface HeaderProps {
  className?: string;
}

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

// Memoize the header component to prevent unnecessary re-renders
const Header = memo(function Header({ className }: HeaderProps) {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const { openModal } = useModal();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any>({
    patients: [],
    appointments: [],
    medications: [],
    prescriptions: []
  });
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const [activities, setActivities] = useState<ActivityType[]>([]);
  
  // Auto-sync session when profile is updated
  useEffect(() => {
    const handleProfileUpdate = async () => {
      console.log('Profile update detected in header, syncing session...');
      try {
        await update();
        console.log('Header session synced successfully');
      } catch (error) {
        console.error('Failed to sync session in header:', error);
      }
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);
    
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, [update]);
  
  // Get user's initials from name
  const getUserInitials = () => {
    if (!session?.user?.name) return 'U';
    return session.user.name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };
  
  useEffect(() => {
    
    // Add scroll event listener for shadow effect
    const handleScroll = () => {
      const header = document.getElementById('main-header');
      if (header) {
        if (window.scrollY > 10) {
          header.classList.add('shadow-md');
        } else {
          header.classList.remove('shadow-md');
        }
      }
    };
    
    // Add click outside listener for user menu, search results and notifications
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch activities when notifications are opened
  useEffect(() => {
    if (notificationsOpen && activities.length === 0) {
      const fetchActivities = async () => {
        try {
          const response = await fetch('/api/dashboard');
          if (response.ok) {
            const data = await response.json();
            setActivities(data.activities || []);
          }
        } catch (error) {
          console.error('Error fetching activities:', error);
        }
      };

      fetchActivities();
    }
  }, [notificationsOpen, activities.length]);

  // Fetch search results when query changes
  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!searchQuery.trim() || searchQuery.length < 2) {
        setSearchResults({
          patients: [],
          appointments: [],
          medications: [],
          prescriptions: []
        });
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
        if (response.ok) {
          const data = await response.json();
          setSearchResults(data);
        }
      } catch (error) {
        console.error('Error fetching search results:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceSearch = setTimeout(() => {
      fetchSearchResults();
    }, 300);

    return () => clearTimeout(debounceSearch);
  }, [searchQuery]);

  // Check if there are any search results
  const hasSearchResults = Object.values(searchResults).some(
    (category: any) => category.length > 0
  );

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // If there's a single search result, navigate directly to it
    const allResults = [
      ...searchResults.patients,
      ...searchResults.appointments,
      ...searchResults.medications,
      ...searchResults.prescriptions
    ];
    
    if (allResults.length === 1) {
      const result = allResults[0];
      if (result._id) {
        let route = '';
        if (searchResults.patients.length === 1) route = `/patients/${result._id}`;
        else if (searchResults.appointments.length === 1) route = `/appointments/${result._id}`;
        else if (searchResults.medications.length === 1) route = `/medications/${result._id}`;
        else if (searchResults.prescriptions.length === 1) route = `/prescriptions/${result._id}`;
        
        if (route) {
          setSearchQuery('');
          setShowSearchResults(false);
          router.push(route);
        }
      }
    }
  };

  const handleCalendarClick = () => {
    openModal('viewCalendar');
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch('/api/activities', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        // Refresh activities to reflect changes
        const updatedActivities = activities.map(activity => ({
          ...activity,
          alert: false
        }));
        setActivities(updatedActivities);
      }
    } catch (error) {
      console.error('Error marking activities as read:', error);
    }
  };

  return (
    <header 
      id="main-header"
      className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        "bg-white dark:bg-gray-900",
        "border-b border-gray-200 dark:border-gray-800",
        "py-4 px-6",
      className
      )}
    >
      <div className="flex items-center justify-between">
        {/* Search */}
        <div 
          ref={searchRef}
          className="relative w-full max-w-md mr-auto"
        >
          <form onSubmit={handleSearch}>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400 dark:text-gray-500" />
            </div>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value.trim().length > 0) {
                  setShowSearchResults(true);
                } else {
                  setShowSearchResults(false);
                }
              }}
              onFocus={() => {
                if (searchQuery.trim().length > 0) {
                  setShowSearchResults(true);
                }
              }}
              placeholder="Search patients, appointments, medications..."
              className={cn(
                "pl-10 pr-4 py-2.5 w-full",
                "rounded-xl border border-gray-200 dark:border-gray-700",
                "bg-gray-50 dark:bg-gray-800/50",
                "text-gray-700 dark:text-gray-200 text-sm",
                "placeholder:text-gray-400 dark:placeholder:text-gray-500",
                "focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500",
                "transition-all duration-300 shadow-sm"
              )}
            />
          </form>

          {/* Search Results Dropdown */}
          {showSearchResults && (
            <div className="absolute left-0 right-0 top-12 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-[9999]">
              {isSearching ? (
                <div className="flex items-center justify-center p-4">
                  <div className="animate-spin h-5 w-5 border-2 border-primary-500 rounded-full border-t-transparent mr-2"></div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Searching...</span>
                </div>
              ) : !hasSearchResults ? (
                <div className="p-4 text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">No results found</p>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  {/* Patients */}
                  {searchResults.patients.length > 0 && (
                    <div className="p-2">
                      <div className="px-2 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Patients
                      </div>
                      {searchResults.patients.map((patient: any) => (
                        <button
                          key={patient._id}
                          onClick={() => {
                            setSearchQuery('');
                            setShowSearchResults(false);
                            openModal('viewPatientDetails', patient);
                          }}
                          className="block w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-left"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 shrink-0">
                              <User size={16} />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white text-sm">
                                {patient.firstName && patient.lastName 
                                  ? `${patient.firstName} ${patient.lastName}`
                                  : patient.name || 'Unknown Patient'}
                              </div>
                              {patient.email && <div className="text-xs text-gray-500 dark:text-gray-400">{patient.email}</div>}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Appointments */}
                  {searchResults.appointments.length > 0 && (
                    <div className="p-2 border-t border-gray-100 dark:border-gray-700">
                      <div className="px-2 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Appointments
                      </div>
                      {searchResults.appointments.map((appointment: any) => (
                        <Link
                          key={appointment._id}
                          href={`/appointments/${appointment._id}`}
                          onClick={() => {
                            setSearchQuery('');
                            setShowSearchResults(false);
                          }}
                          className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white text-sm">{appointment.title}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{appointment.patientName}</div>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {appointment.date && <div>{appointment.date}</div>}
                              {appointment.time && <div>{appointment.time}</div>}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Medications */}
                  {searchResults.medications.length > 0 && (
                    <div className="p-2 border-t border-gray-100 dark:border-gray-700">
                      <div className="px-2 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Medications
                      </div>
                      {searchResults.medications.map((medication: any) => (
                        <Link
                          key={medication._id}
                          href={`/medications/${medication._id}`}
                          onClick={() => {
                            setSearchQuery('');
                            setShowSearchResults(false);
                          }}
                          className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                        >
                          <div className="font-medium text-gray-900 dark:text-white text-sm">{medication.name}</div>
                          {medication.description && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">{medication.description.substring(0, 60)}{medication.description.length > 60 ? '...' : ''}</div>
                          )}
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Prescriptions */}
                  {searchResults.prescriptions.length > 0 && (
                    <div className="p-2 border-t border-gray-100 dark:border-gray-700">
                      <div className="px-2 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Prescriptions
                      </div>
                      {searchResults.prescriptions.map((prescription: any) => (
                        <Link
                          key={prescription._id}
                          href={`/prescriptions/${prescription._id}`}
                          onClick={() => {
                            setSearchQuery('');
                            setShowSearchResults(false);
                          }}
                          className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white text-sm">{prescription.medicationName}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">For: {prescription.patientName}</div>
                            </div>
                            {prescription.issueDate && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {prescription.issueDate}
                              </div>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Right side actions */}
        <div className="flex items-center gap-4">
          {/* Quick Actions */}
          <div className="hidden md:flex items-center gap-1">
            <button 
              onClick={handleCalendarClick}
              className="p-2 rounded-lg text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:text-gray-400 dark:hover:text-primary-400 dark:hover:bg-gray-800 transition-colors"
            >
              <Calendar size={20} />
            </button>
          </div>
          
          {/* Theme Switcher */}
          <div>
            <ThemeSwitcher />
          </div>
          
          {/* Notifications */}
          <div 
            ref={notificationsRef}
            className="relative"
          >
            <button 
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="p-2 rounded-lg text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:text-gray-400 dark:hover:text-primary-400 dark:hover:bg-gray-800 transition-colors relative"
            >
              <Bell size={20} />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-danger-500 ring-2 ring-white dark:ring-gray-900"></span>
            </button>

            {/* Notifications dropdown */}
            {notificationsOpen && (
              <div className="absolute right-0 top-12 w-80 rounded-lg bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-[9999]">
                <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <p className="font-medium text-sm text-gray-800 dark:text-white">Recent Activities</p>
                  <button 
                    className="text-xs text-primary-600 hover:text-primary-700"
                    onClick={handleMarkAllAsRead}
                  >
                    Mark all as read
                  </button>
                </div>
                <div className="max-h-96 overflow-y-auto p-3">
                  <div className="space-y-4">
                    {activities.length > 0 ? (
                      activities.map((activity) => {
                        // Dynamically render the appropriate icon component
                        let IconComponent;
                        switch (activity.icon) {
                          case 'FileSearch':
                            IconComponent = FileSearch;
                            break;
                          case 'CheckCircle2':
                            IconComponent = CheckCircle2;
                            break;
                          case 'FileText':
                            IconComponent = FileText;
                            break;
                          case 'AlertTriangle':
                            IconComponent = AlertTriangle;
                            break;
                          case 'ClipboardCheck':
                            IconComponent = ClipboardCheck;
                            break;
                          default:
                            IconComponent = Calendar;
                        }
                        
                        return (
                          <div key={activity.id} className="flex gap-3">
                            <div className={`${activity.color} h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-white`}>
                              <IconComponent size={16} />
                            </div>
                            <div>
                              <h4 className={`text-sm font-medium ${activity.alert ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}`}>
                                {activity.title}
                              </h4>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {activity.description}
                              </p>
                              <span className="text-xs text-gray-400 dark:text-gray-500 mt-1 block">
                                {activity.time}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-4">
                        <Activity size={24} className="mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500">Loading activities...</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 text-center">
                  <Link href="/activities" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                    View All Activities
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Avatar/Profile */}
          <div 
            ref={userMenuRef}
            className="relative flex items-center gap-3"
          >
            <button 
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 focus:outline-none"
            >
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-medium shadow-sm">
                {getUserInitials()}
              </div>
              <div className="hidden md:block">
                <div className="flex items-center gap-1">
                  <p className="text-sm font-medium text-gray-800 dark:text-white">
                    {session?.user?.name || 'Guest User'}
                  </p>
                  <ChevronDown 
                    size={16} 
                    className={`text-gray-500 dark:text-gray-400 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} 
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {session?.user?.role || 'User'}
                </p>
              </div>
            </button>

            {/* User dropdown menu */}
            {userMenuOpen && (
              <div className="absolute right-0 top-12 w-48 rounded-lg bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-[9999]">
                <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                  <p className="font-medium text-sm text-gray-800 dark:text-white">
                    {session?.user?.name || 'Guest User'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {session?.user?.email || ''}
                  </p>
                </div>
                <div className="pt-2">
                  <Link href="/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <User size={16} />
                    <span>Profile</span>
                  </Link>
                  <Link href="/settings" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <Settings size={16} />
                    <span>Settings</span>
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <LogOut size={16} />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
});

export default Header; 