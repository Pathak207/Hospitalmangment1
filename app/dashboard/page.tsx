'use client';

import React, { useState, useCallback, useMemo } from 'react';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useModal } from '@/components/ui/modal-provider';
import useSWR from 'swr';
import { 
  Users, 
  Calendar, 
  FileText, 
  Pill, 
  TrendingUp, 
  Clock, 
  AlertTriangle,
  Activity,
  Bell,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Timer,
  Stethoscope,
  ClipboardCheck,
  FileSearch,
  HeartPulse,
  User,
  DollarSign,
  CreditCard
} from 'lucide-react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { format, parseISO } from 'date-fns';
import { useSettings } from '@/lib/settings-context';
import { useRouter } from 'next/navigation';

// Define interfaces for type safety
interface StatCardProps {
  stat: {
    title: string;
    value: string;
    change: string;
    trend: 'up' | 'down';
    icon: string;
    color: string;
    link: string;
  };
  index: number;
}

interface AppointmentItemProps {
  appointment: {
    id: string;
    patient: string;
    time: string;
    type: string;
    reason?: string;
    status: string;
    duration: string | number;
  };
}

// Create a simple data fetcher
const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error('Failed to fetch data');
  return res.json();
});

// Define iconComponents as a function that returns components to avoid serialization issues
const getIconComponent = (iconName: string) => {
  switch (iconName) {
    case 'Users':
      return <Users className="h-6 w-6 text-white" />;
    case 'FileSearch':
      return <FileSearch className="h-6 w-6 text-white" />;
    case 'FileText':
      return <FileText className="h-6 w-6 text-white" />;
    case 'Pill':
      return <Pill className="h-6 w-6 text-white" />;
    case 'DollarSign':
      return <DollarSign className="h-6 w-6 text-white" />;
    case 'CheckCircle2':
      return <CheckCircle2 size={16} />;
    case 'AlertTriangle':
      return <AlertTriangle size={16} />;
    case 'ClipboardCheck':
      return <ClipboardCheck size={16} />;
    case 'Calendar':
      return <Calendar size={16} />;
    case 'User':
      return <User size={18} className="text-primary-500" />;
    case 'Clock':
      return <Clock size={18} className="text-warning-500" />;
    default:
      return null;
  }
};

// Memoize commonly used components to reduce re-renders
const StatCard = React.memo(({ stat, index }: StatCardProps) => {
  return (
    <Link href={stat.link} className="block">
      <Card 
        className={`hover:shadow-lg transition-all overflow-hidden h-full animate-fade-in [animation-delay:${index * 0.1}s] border-0 group relative`}
      >
        <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-90 group-hover:opacity-100 transition-opacity`}></div>
        <div className="absolute inset-0 bg-[url('/images/noise.png')] opacity-5"></div>
        <CardContent className="p-6 relative z-10">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-white/90">{stat.title}</p>
              <h3 className="text-3xl font-bold mt-1 text-white">{stat.value}</h3>
              <p className={`text-xs mt-1 flex items-center ${stat.trend === 'up' ? 'text-white/90' : 'text-white/90'}`}>
                {stat.trend === 'up' ? (
                  <TrendingUp size={12} className="mr-1" />
                ) : (
                  <TrendingUp size={12} className="mr-1 transform rotate-180" />
                )}
                {stat.change}
              </p>
            </div>
            <div className="p-3 rounded-full bg-white/20 backdrop-blur-sm">
              {getIconComponent(stat.icon)}
            </div>
          </div>
          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <ArrowUpRight size={18} className="text-white" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
});

StatCard.displayName = 'StatCard';

// Memoize appointment component to reduce re-renders
const AppointmentItem = React.memo(({ appointment }: AppointmentItemProps) => (
  <div 
    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
  >
    <div className="flex items-start gap-4">
      <div className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center text-white font-medium
        ${appointment.status === 'Confirmed' 
          ? 'bg-primary-500' 
          : appointment.status === 'Completed' 
            ? 'bg-green-500' 
            : appointment.status === 'Cancelled' 
              ? 'bg-red-500' 
              : 'bg-amber-500'}`}
      >
        <span className="text-xs">{appointment.time.split(' ')[0]}</span>
        <span className="text-sm">{appointment.time.split(' ')[1]}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
            {appointment.patient}
          </h4>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            appointment.status === 'Confirmed' 
              ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300' 
              : appointment.status === 'Completed' 
                ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300' 
                : appointment.status === 'Cancelled' 
                  ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300' 
                  : 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300'
          }`}>
            {appointment.status}
          </span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {appointment.type} • {appointment.duration} min
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
          {appointment.reason || 'No reason provided'}
        </p>
      </div>
    </div>
  </div>
));

AppointmentItem.displayName = 'AppointmentItem';

export default function DashboardPage() {
  const { openModal } = useModal();
  const { data: session, status } = useSession();
  const { formatCurrency } = useSettings();
  const router = useRouter();
  const [trialInfo, setTrialInfo] = useState(null);
  
  // Redirect super admin to their dashboard
  React.useEffect(() => {
    if (session?.user?.role === 'super_admin') {
      window.location.href = '/super-admin';
    }
  }, [session]);

  // Fetch trial/subscription status
  React.useEffect(() => {
    const fetchTrialStatus = async () => {
      if (session?.user?.organization) {
        try {
          const response = await fetch(`/api/subscription-status?organizationId=${session.user.organization}`);
          if (response.ok) {
            const data = await response.json();
            // Only show trial banner for actual trial accounts, not unlimited accounts
            if (data.subscription?.status === 'trialing' && 
                data.organization?.subscriptionType !== 'unlimited' &&
                data.subscription?.status !== 'unlimited') {
              setTrialInfo(data.subscription);
            }
          }
        } catch (error) {
          console.error('Error fetching trial status:', error);
        }
      }
    };

    if (session?.user?.organization) {
      fetchTrialStatus();
    }
  }, [session]);
  
  // Use SWR for data fetching with automatic revalidation and caching
  const { data: dashboardData, error, isLoading, mutate } = useSWR(
    '/api/dashboard', 
    fetcher, 
    { 
      revalidateOnFocus: true, // Refresh when window gets focus
      revalidateIfStale: true, // Refresh if data is stale
      dedupingInterval: 5000, // 5 seconds - reduced for real-time feel
      refreshInterval: 30000, // 30 seconds - more frequent updates
      errorRetryCount: 3
    }
  );
  
  // Add effect to refresh data when component mounts (navigation)
  React.useEffect(() => {
    // Force refresh when component mounts
    mutate();
  }, [mutate]);
  
  // Function to get the current date in a formatted way - memoize the result
  const currentDate = useMemo(() => {
    const options = { 
      weekday: 'long' as const, 
      month: 'long' as const, 
      day: 'numeric' as const, 
      year: 'numeric' as const 
    };
    return new Date().toLocaleDateString('en-US', options);
  }, []);
  
  // Callback for checking auth status
  const checkAuthStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/check-session');
      const data = await response.json();
      console.log('Session status:', data);
      alert(`Auth status: ${data.authenticated ? 'Authenticated' : 'Not authenticated'}`);
    } catch (error) {
      console.error('Error checking session:', error);
      alert('Error checking session');
    }
  }, []);
  
  // If still loading, show a simple loading state
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </DashboardLayout>
    );
  }
  
  // If there was an error fetching data
  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-screen gap-4">
          <div className="text-center p-8 text-red-500">Error loading dashboard: {error.message}</div>
          <Button variant="primary" onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </DashboardLayout>
    );
  }
  
  // If data is available, render the dashboard
  const { dashboardStats, upcomingAppointments, activities, pendingTasks } = dashboardData || {
    dashboardStats: [],
    upcomingAppointments: [],
    activities: [],
    pendingTasks: [],
    practiceMetrics: []
  };
  
  return (
    <DashboardLayout>
      {/* Trial Status Banner */}
      {trialInfo && (
        <div className="mb-6 animate-fade-in">
          <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                      Trial Period Active
                    </h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {trialInfo.daysRemaining > 0 
                        ? `${trialInfo.daysRemaining} days remaining in your trial period`
                        : 'Your trial period expires today'
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={() => router.push('/billing/upgrade')}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    size="sm"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Upgrade Now
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="mb-8 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome back, {session?.user?.name || 'Doctor'}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{currentDate}</p>
          </div>
          <div className="flex items-center justify-end gap-3">
            <div className="p-3 rounded-lg bg-white dark:bg-gray-800 shadow-sm animate-pulse-slow border border-gray-200 dark:border-gray-700">
              <div className="text-center">
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Next appointment</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {upcomingAppointments?.length > 0 
                    ? upcomingAppointments[0].time 
                    : 'No appointments'}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {upcomingAppointments?.length > 0 
                    ? `${upcomingAppointments[0].patient} • ${upcomingAppointments[0].date ? format(parseISO(upcomingAppointments[0].date), 'MMM dd, yyyy') : 'No date'}` 
                    : 'N/A'}
                </div>
              </div>
            </div>
            <button 
              className="p-3 rounded-full bg-primary-50 dark:bg-gray-800 text-primary-500 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-gray-700 transition-colors relative"
              onClick={() => openModal('newAppointment')}
            >
              <Bell size={20} />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-danger-500 ring-2 ring-white dark:ring-gray-800"></span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Stats Grid - use memoized components */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        {dashboardStats?.map((stat, index) => {
          // Format currency for revenue stat
          const formattedStat = stat.icon === 'DollarSign' 
            ? { ...stat, value: formatCurrency(stat.value) }
            : stat;
          
          return <StatCard key={stat.title} stat={formattedStat} index={index} />
        })}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
        {/* Today's Appointments */}
        <Card className="col-span-1 lg:col-span-2 animate-fade-in animate-slide-up shadow-md">
          <CardHeader className="px-6 py-4 flex flex-row items-center justify-between bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <Stethoscope size={18} className="text-primary-500" />
              <CardTitle className="text-lg font-semibold">Today's Appointments</CardTitle>
            </div>
            <button 
              onClick={() => openModal('viewCalendar')}
              className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 flex items-center gap-1"
            >
              View all
              <ArrowUpRight size={14} />
            </button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {upcomingAppointments?.length > 0 ? (
                upcomingAppointments.map((appointment) => (
                  <AppointmentItem key={appointment.id} appointment={appointment} />
                ))
              ) : (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                  No appointments for today
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Activity Feed */}
        <Card className="col-span-1 animate-fade-in animate-slide-up shadow-md">
          <CardHeader className="px-6 py-4 flex flex-row items-center justify-between bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <Activity size={18} className="text-primary-500" />
              <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {activities?.map((activity) => (
                <div key={activity.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="flex gap-3">
                    <div className={`w-8 h-8 rounded-full ${activity.color} flex items-center justify-center shrink-0`}>
                      {getIconComponent(activity.icon)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {activity.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 mb-1">
                        {activity.type === 'payment' && activity.amount 
                          ? `${formatCurrency(activity.amount)} ${activity.description}`
                          : activity.description
                        }
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Quick View Section */}
      <Card className="mb-8 animate-fade-in animate-slide-up shadow-md">
        <CardHeader className="px-6 py-4 flex flex-row items-center justify-between bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <BarChart3 size={18} className="text-primary-500" />
            <CardTitle className="text-lg font-semibold">Quick View</CardTitle>
          </div>
          <button 
            onClick={() => openModal({ 
              title: "Quick View Dashboard",
              content: (
                <div>
                  <p>Access all quick view features and shortcuts here.</p>
                </div>
              ),
              size: "lg"
            })}
            className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 flex items-center gap-1"
          >
            View all
            <ArrowUpRight size={14} />
          </button>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Users size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    Patient Management
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Quick access to patient records
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Link href="/profile" className="text-xs px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
                      View Patients
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 flex items-center justify-center shrink-0">
                  <Calendar size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    Appointments
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Schedule and manage appointments
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Link href="/appointments" className="text-xs px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors">
                      View Calendar
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <Pill size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    Prescriptions
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Manage medication prescriptions
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Link href="/prescriptions" className="text-xs px-2 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors">
                      View Prescriptions
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <FileText size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    Reports
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Generate and view reports
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Link href="/reports" className="text-xs px-2 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors">
                      View Reports
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
} 













































































































































