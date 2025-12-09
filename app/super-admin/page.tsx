'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import SuperAdminLayout from '@/components/layout/super-admin-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useGlobalCurrency } from '@/lib/useGlobalCurrency';
import { 
  Users, 
  Building, 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  Plus,
  Settings,
  BarChart,
  ArrowUpRight,
  Activity
} from 'lucide-react';

export default function SuperAdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { formatAmount } = useGlobalCurrency();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSubscribers: 0,
    activeSubscriptions: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
  });
  const [recentSubscribers, setRecentSubscribers] = useState<any[]>([]);

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
      fetchDashboardData();
    }
  }, [session, status, router]);

  const fetchDashboardData = async () => {
    try {
      // Fetch dashboard stats
      const [orgsResponse, subsResponse] = await Promise.all([
        fetch('/api/organizations?limit=5'),
        fetch('/api/subscriptions?limit=5'),
      ]);

      if (orgsResponse.ok) {
        const orgsData = await orgsResponse.json();
        setRecentSubscribers(orgsData.organizations || []);
        setStats(prev => ({
          ...prev,
          totalSubscribers: orgsData.pagination?.total || 0,
        }));
      }

      if (subsResponse.ok) {
        const subsData = await subsResponse.json();
        
        // Calculate stats from subscriptions - exclude trialing from active count
        const activeSubscriptions = subsData.subscriptions.filter(
          sub => sub.status === 'active'
        ).length;
        
        const totalRevenue = subsData.subscriptions.reduce(
          (sum, sub) => sum + (sub.amount || 0), 0
        );

        // Calculate monthly revenue from subscriptions with recent payments
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        
        const monthlyRevenue = subsData.subscriptions.filter(sub => {
          const paymentDate = sub.lastPaymentDate ? new Date(sub.lastPaymentDate) : null;
          return paymentDate && 
                 paymentDate.getMonth() === currentMonth && 
                 paymentDate.getFullYear() === currentYear;
        }).reduce((sum, sub) => sum + (sub.amount || 0), 0);

        setStats(prev => ({
          ...prev,
          activeSubscriptions,
          totalRevenue,
          monthlyRevenue,
        }));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubscriber = () => {
    router.push('/super-admin/subscribers/create');
  };

  const handleManageSubscribers = () => {
    router.push('/super-admin/subscribers');
  };

  const handleManagePlans = () => {
    router.push('/super-admin/subscription-plans');
  };

  if (loading) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
          </div>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Super Admin Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage subscribers, subscriptions, and platform analytics
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              onClick={handleCreateSubscriber}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Subscriber
            </Button>
            <Button 
              variant="outline" 
              onClick={handleManagePlans}
              className="border-purple-200 text-purple-600 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-400 dark:hover:bg-purple-900/20"
            >
              <Settings className="h-4 w-4 mr-2" />
              Manage Plans
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Subscribers</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalSubscribers}</p>
                  <p className="text-xs text-green-600 dark:text-green-400 flex items-center mt-1">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    +12% from last month
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Active Subscriptions</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.activeSubscriptions}</p>
                  <p className="text-xs text-green-600 dark:text-green-400 flex items-center mt-1">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    +8% from last month
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatAmount(stats.totalRevenue)}</p>
                  <p className="text-xs text-green-600 dark:text-green-400 flex items-center mt-1">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    +15% from last month
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Monthly Revenue</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatAmount(stats.monthlyRevenue)}</p>
                  <p className="text-xs text-green-600 dark:text-green-400 flex items-center mt-1">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    +22% from last month
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card 
            className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-lg transition-shadow group" 
            onClick={handleManageSubscribers}
          >
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform">
                <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Manage Subscribers</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">View and manage all subscribers and their subscriptions</p>
            </CardContent>
          </Card>

          <Card 
            className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-lg transition-shadow group" 
            onClick={handleManagePlans}
          >
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform">
                <BarChart className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Subscription Plans</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Configure pricing and features</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 gap-6">
          {/* Recent Subscribers */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="text-gray-900 dark:text-gray-100">Recent Subscribers & Their Subscriptions</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleManageSubscribers}
                  className="border-gray-200 dark:border-gray-700"
                >
                  View All
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentSubscribers.length > 0 ? (
                  recentSubscribers.map((subscriber) => (
                    <div key={subscriber._id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-gray-100">{subscriber.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{subscriber.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(subscriber.createdAt).toLocaleDateString()}
                        </p>
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                          subscriber.isActive 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {subscriber.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">No subscribers yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SuperAdminLayout>
  );
} 