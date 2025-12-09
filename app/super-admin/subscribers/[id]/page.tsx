'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import SuperAdminLayout from '@/components/layout/super-admin-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  MapPin,
  Calendar,
  CreditCard,
  Edit,
  Trash2,
  Building,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle
} from 'lucide-react';

export default function SubscriberDetailPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [subscriber, setSubscriber] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);

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
      fetchSubscriber(params.id);
    }
  }, [session, status, router, params.id]);

  const fetchSubscriber = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/organizations/${id}`);
      if (response.ok) {
        const data = await response.json();
        setSubscriber(data);
      } else {
        console.error('Failed to fetch subscriber');
        router.push('/super-admin/subscribers');
      }
    } catch (error) {
      console.error('Error fetching subscriber:', error);
      router.push('/super-admin/subscribers');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    router.push(`/super-admin/subscribers/${params?.id}/edit`);
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this subscriber? This action cannot be undone.')) {
      try {
        const response = await fetch(`/api/organizations/${params?.id}`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          router.push('/super-admin/subscribers?success=Subscriber deleted successfully');
        } else {
          alert('Failed to delete subscriber');
        }
      } catch (error) {
        console.error('Error deleting subscriber:', error);
        alert('Error deleting subscriber');
      }
    }
  };

  const getStatusIcon = (isActive: boolean, subscription?: any) => {
    if (!subscription) {
      return isActive ? (
        <CheckCircle className="h-5 w-5 text-blue-500" />
      ) : (
        <XCircle className="h-5 w-5 text-gray-500" />
      );
    }

    const now = new Date();
    const endDate = new Date(subscription.endDate);

    if (subscription.status === 'trialing') {
      return <Clock className="h-5 w-5 text-blue-500" />;
    } else if (subscription.status === 'cancelled') {
      return <XCircle className="h-5 w-5 text-gray-500" />;
    } else if (endDate < now) {
      return <AlertTriangle className="h-5 w-5 text-red-500" />;
    } else if (subscription.status === 'active') {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }

    return isActive ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    );
  };

  const getStatusText = (isActive: boolean, subscription?: any) => {
    if (!subscription) {
      return isActive ? 'Trial' : 'No Subscription';
    }

    const now = new Date();
    const endDate = new Date(subscription.endDate);
    const trialEndDate = subscription.trialEndDate ? new Date(subscription.trialEndDate) : null;

    if (subscription.status === 'trialing') {
      const daysLeft = trialEndDate ? Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;
      return `Trial (${daysLeft} days left)`;
    } else if (subscription.status === 'cancelled') {
      return 'Cancelled';
    } else if (endDate < now) {
      return 'Expired';
    } else if (subscription.status === 'active') {
      return 'Active';
    }

    return isActive ? 'Active' : 'Inactive';
  };

  if (loading) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading subscriber...</p>
          </div>
        </div>
      </SuperAdminLayout>
    );
  }

  if (!subscriber) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Subscriber not found
            </h2>
            <Button onClick={() => router.push('/super-admin/subscribers')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Subscribers
            </Button>
          </div>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button 
              onClick={() => router.push('/super-admin/subscribers')}
              variant="outline"
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Subscribers
            </Button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {subscriber.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Subscriber details and subscription information
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              onClick={handleEdit}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button 
              onClick={handleDelete}
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Organization Information */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                <Building className="h-5 w-5" />
                Organization Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Name</label>
                  <p className="text-gray-900 dark:text-gray-100">{subscriber.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Email</label>
                  <p className="text-gray-900 dark:text-gray-100">{subscriber.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Phone</label>
                  <p className="text-gray-900 dark:text-gray-100">{subscriber.phone || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Created</label>
                  <p className="text-gray-900 dark:text-gray-100">
                    {new Date(subscriber.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              {subscriber.address && (
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Address</label>
                  <p className="text-gray-900 dark:text-gray-100">
                    {[
                      subscriber.address.street,
                      subscriber.address.city,
                      subscriber.address.state,
                      subscriber.address.zipCode,
                      subscriber.address.country
                    ].filter(Boolean).join(', ') || 'Not provided'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Subscription Status */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                <CreditCard className="h-5 w-5" />
                Subscription Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                {getStatusIcon(subscriber.isActive, subscriber.subscription)}
                <span className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {getStatusText(subscriber.isActive, subscriber.subscription)}
                </span>
              </div>

              {subscriber.subscription && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Plan</label>
                      <p className="text-gray-900 dark:text-gray-100">
                        {subscriber.subscription.status === 'trialing' 
                          ? 'Trial Plan' 
                          : (subscriber.subscription.plan?.name || 'Unknown Plan')
                        }
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Amount</label>
                      <p className="text-gray-900 dark:text-gray-100">
                        {subscriber.subscription.status === 'trialing' 
                          ? 'Free Trial' 
                          : `$${subscriber.subscription.amount || 0}/${subscriber.subscription.billingCycle === 'yearly' ? 'year' : 'month'}`
                        }
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Start Date</label>
                      <p className="text-gray-900 dark:text-gray-100">
                        {new Date(subscriber.subscription.startDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">End Date</label>
                      <p className="text-gray-900 dark:text-gray-100">
                        {new Date(subscriber.subscription.endDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  {subscriber.subscription.trialEndDate && (
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Trial End Date</label>
                      <p className="text-gray-900 dark:text-gray-100">
                        {new Date(subscriber.subscription.trialEndDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Owner Information */}
          {subscriber.owner && (
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                  <User className="h-5 w-5" />
                  Owner Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Name</label>
                    <p className="text-gray-900 dark:text-gray-100">{subscriber.owner.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Email</label>
                    <p className="text-gray-900 dark:text-gray-100">{subscriber.owner.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Phone</label>
                    <p className="text-gray-900 dark:text-gray-100">{subscriber.owner.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Role</label>
                    <p className="text-gray-900 dark:text-gray-100">{subscriber.owner.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* System Information */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                <Calendar className="h-5 w-5" />
                System Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Organization ID</label>
                  <p className="text-gray-900 dark:text-gray-100 font-mono text-sm">{subscriber._id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</label>
                  <p className="text-gray-900 dark:text-gray-100">
                    {subscriber.isActive ? 'Active' : 'Inactive'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Created At</label>
                  <p className="text-gray-900 dark:text-gray-100">
                    {new Date(subscriber.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Updated At</label>
                  <p className="text-gray-900 dark:text-gray-100">
                    {new Date(subscriber.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SuperAdminLayout>
  );
} 