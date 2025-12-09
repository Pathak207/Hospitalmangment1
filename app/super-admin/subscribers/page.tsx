'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import SuperAdminLayout from '@/components/layout/super-admin-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DeleteConfirmationModal } from '@/components/modals/delete-confirmation-modal';
import { useGlobalCurrency } from '@/lib/useGlobalCurrency';
import { 
  Users, 
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Mail,
  Calendar,
  CreditCard,
  Ban,
  CheckCircle
} from 'lucide-react';

// Dropdown Menu Component
const DropdownMenu = ({ subscriber, onDelete, onToggleStatus, onUpgrade }: { 
  subscriber: any, 
  onDelete: (id: string) => void,
  onToggleStatus: (id: string, isActive: boolean) => void,
  onUpgrade: (id: string) => void 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleDelete = () => {
      onDelete(subscriber._id);
    setIsOpen(false);
  };

  const handleToggleStatus = () => {
    onToggleStatus(subscriber._id, !subscriber.isActive);
    setIsOpen(false);
  };

  const handleUpgrade = () => {
    onUpgrade(subscriber._id);
    setIsOpen(false);
  };

  // Check if subscriber has a trial subscription - exclude deactivated organizations and unlimited subscribers
  const isTrialSubscription = subscriber.isActive && 
    subscriber.subscriptionType !== 'unlimited' && (
    !subscriber.subscription || 
    (subscriber.subscription && 
     (subscriber.subscription.status === 'trialing' || 
      subscriber.subscription.status === 'trial'))
  );

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
        title="More Actions"
      >
        <MoreVertical size={16} />
      </Button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-8 z-20 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg">
            <div className="py-1">
              <button
                onClick={handleToggleStatus}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                {subscriber.isActive ? (
                  <>
                    <Ban size={14} />
                    Deactivate
                  </>
                ) : (
                  <>
                    <CheckCircle size={14} />
                    Activate
                  </>
                )}
              </button>
              {isTrialSubscription && (
                <button
                  onClick={handleUpgrade}
                  className="w-full text-left px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center gap-2"
                >
                  <CreditCard size={14} />
                  Upgrade Plan
                </button>
              )}
                <button
                  onClick={handleDelete}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                >
                  <Trash2 size={14} />
                <div className="flex flex-col">
                  <span>{isTrialSubscription ? 'Delete Trial Account' : 'Delete Subscriber'}</span>
                  {!isTrialSubscription && subscriber.subscription?.status === 'active' && (
                    <span className="text-xs text-orange-600 dark:text-orange-400">
                      ⚠️ Active paid subscriber
                    </span>
                  )}
                </div>
                </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Subscriber Details Modal Component
const SubscriberDetailsModal = ({ subscriber, isOpen, onClose, formatAmount }: {
  subscriber: any;
  isOpen: boolean;
  onClose: () => void;
  formatAmount: (amount: number) => string;
}) => {
  if (!isOpen || !subscriber) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', label: 'Active' },
      trialing: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', label: 'Trial' },
      inactive: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400', label: 'Inactive' },
      cancelled: { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', label: 'Cancelled' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive;
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[120] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Subscriber Details
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            ×
          </Button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6">
          {/* Organization Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Organization Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Organization Name</label>
                <p className="text-gray-900 dark:text-gray-100">{subscriber.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
                <p className="text-gray-900 dark:text-gray-100">{subscriber.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</label>
                <p className="text-gray-900 dark:text-gray-100">{subscriber.phone || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Subscription Status</label>
                <div className="mt-1">
                  {subscriber.subscription ? getStatusBadge(subscriber.subscription.status) : (
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">
                      No Subscription
                    </span>
                  )}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Created Date</label>
                <p className="text-gray-900 dark:text-gray-100">{formatDate(subscriber.createdAt)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Currency</label>
                <p className="text-gray-900 dark:text-gray-100">{subscriber.currency || 'USD'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Address Info */}
          {subscriber.address && (
            <Card>
              <CardHeader>
                <CardTitle>Address Information</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Street</label>
                  <p className="text-gray-900 dark:text-gray-100">{subscriber.address.street || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">City</label>
                  <p className="text-gray-900 dark:text-gray-100">{subscriber.address.city || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">State</label>
                  <p className="text-gray-900 dark:text-gray-100">{subscriber.address.state || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">ZIP Code</label>
                  <p className="text-gray-900 dark:text-gray-100">{subscriber.address.zipCode || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Country</label>
                  <p className="text-gray-900 dark:text-gray-100">{subscriber.address.country || 'Not provided'}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Subscription Info */}
          {subscriber.subscription && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Subscription Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Plan</label>
                  <p className="text-gray-900 dark:text-gray-100">
                    {subscriber.subscription.plan?.name || 'Trial Account'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
                  <div className="mt-1">
                    {getStatusBadge(subscriber.subscription.status)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Billing Cycle</label>
                  <p className="text-gray-900 dark:text-gray-100">
                    {subscriber.subscription.billingCycle || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Amount</label>
                  <p className="text-gray-900 dark:text-gray-100">
                    {formatAmount(subscriber.subscription.amount || 0)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Start Date</label>
                  <p className="text-gray-900 dark:text-gray-100">
                    {subscriber.subscription.startDate ? formatDate(subscriber.subscription.startDate) : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">End Date</label>
                  <p className="text-gray-900 dark:text-gray-100">
                    {subscriber.subscription.endDate ? formatDate(subscriber.subscription.endDate) : 'N/A'}
                  </p>
                </div>
                {subscriber.subscription.trialEndDate && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Trial End Date</label>
                    <p className="text-gray-900 dark:text-gray-100">
                      {formatDate(subscriber.subscription.trialEndDate)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Owner Info */}
          {subscriber.owner && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Owner Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</label>
                  <p className="text-gray-900 dark:text-gray-100">{subscriber.owner.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
                  <p className="text-gray-900 dark:text-gray-100">{subscriber.owner.email}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button 
            onClick={() => {
              onClose();
              window.location.href = `/super-admin/subscribers/${subscriber._id}/edit`;
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Edit Subscriber
          </Button>
        </div>
      </div>
    </div>
  );
};

export default function SubscribersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { formatWithBilling, formatAmount } = useGlobalCurrency();
  const [loading, setLoading] = useState(true);
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [showModal, setShowModal] = useState(false);
  const [selectedSubscriber, setSelectedSubscriber] = useState<any>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [subscriberToDelete, setSubscriberToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
      fetchSubscribers();
    }
  }, [session, status, router, pagination.page, searchTerm, statusFilter]);

  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
      });

      const response = await fetch(`/api/organizations?${params}&populate=subscription`);
      if (response.ok) {
        const data = await response.json();
        setSubscribers(data.organizations || []);
        setPagination(data.pagination || { page: 1, limit: 10, total: 0, pages: 1 });
      }
    } catch (error) {
      console.error('Error fetching subscribers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubscriber = () => {
    router.push('/super-admin/subscribers/create');
  };

  const handleViewSubscriber = (id: string) => {
    const subscriber = subscribers.find(sub => sub._id === id);
    if (subscriber) {
      setSelectedSubscriber(subscriber);
      setShowModal(true);
    }
  };

  const handleEditSubscriber = (id: string) => {
    router.push(`/super-admin/subscribers/${id}/edit`);
  };

  const handleDeleteSubscriber = (id: string) => {
    const subscriber = subscribers.find(s => s._id === id);
    if (subscriber) {
      setSubscriberToDelete(subscriber);
      setDeleteModalOpen(true);
    }
  };

  const confirmDeleteSubscriber = async () => {
    if (!subscriberToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/organizations/${subscriberToDelete._id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        // Close modal and refresh the list
        setDeleteModalOpen(false);
        setSubscriberToDelete(null);
        fetchSubscribers();
        
        // Show success message
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        toast.textContent = `${subscriberToDelete.name} deleted successfully`;
        document.body.appendChild(toast);
        
        setTimeout(() => {
          if (document.body.contains(toast)) {
          document.body.removeChild(toast);
          }
        }, 3000);
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete subscriber');
      }
    } catch (error) {
      console.error('Error deleting subscriber:', error);
      alert(`Error deleting subscriber: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/organizations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive }),
      });
      
      if (response.ok) {
        // Refresh the list
        fetchSubscribers();
        // Show success message
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        toast.textContent = `Subscriber ${isActive ? 'activated' : 'deactivated'} successfully`;
        document.body.appendChild(toast);
        
        setTimeout(() => {
          document.body.removeChild(toast);
        }, 3000);
      } else {
        alert('Failed to update subscriber status');
      }
    } catch (error) {
      console.error('Error updating subscriber status:', error);
      alert('Error updating subscriber status');
    }
  };

  const handleUpgradeSubscriber = (id: string) => {
    // Navigate to upgrade page
    router.push(`/super-admin/subscribers/${id}/upgrade`);
  };

  const getStatusColor = (isActive: boolean, subscription?: any, subscriptionType?: string) => {
    // If organization is deactivated, show as deactivated regardless of subscription
    if (!isActive) {
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    }

    // If organization has unlimited subscription type, show as unlimited
    if (subscriptionType === 'unlimited') {
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
    }

    // If no subscription exists, check if this is a newly created subscriber
    if (!subscription) {
      // For newly created subscribers, show as Trial (blue) if they're active
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    }

    const now = new Date();
    const endDate = new Date(subscription.endDate);
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    if (subscription.status === 'trialing') {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    } else if (subscription.status === 'cancelled') {
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    } else if (endDate < now) {
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    } else if (endDate < sevenDaysFromNow) {
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    } else if (subscription.status === 'active') {
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    }

    return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
  };

  const getStatusText = (isActive: boolean, subscription?: any, subscriptionType?: string) => {
    // If organization is deactivated, show as deactivated regardless of subscription
    if (!isActive) {
      return 'Deactivated';
    }

    // If organization has unlimited subscription type, show as unlimited
    if (subscriptionType === 'unlimited') {
      return 'Unlimited';
    }

    // If no subscription exists, check if this is a newly created subscriber
    if (!subscription) {
      // For newly created subscribers, show as Trial if they're active
      return 'Trial';
    }

    const now = new Date();
    const endDate = new Date(subscription.endDate);
    const trialEndDate = subscription.trialEndDate ? new Date(subscription.trialEndDate) : null;
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    if (subscription.status === 'trialing') {
      const daysLeft = trialEndDate ? Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;
      return `Trial (${daysLeft}d left)`;
    } else if (subscription.status === 'cancelled') {
      return 'Cancelled';
    } else if (endDate < now) {
      return 'Expired';
    } else if (endDate < sevenDaysFromNow) {
      const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return `Expires in ${daysLeft}d`;
    } else if (subscription.status === 'active') {
      return 'Active';
    }

    return 'Active';
  };

  if (loading && subscribers.length === 0) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading subscribers...</p>
          </div>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <>
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Subscribers
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage all subscribers and their subscriptions
            </p>
          </div>
          <Button 
            onClick={handleCreateSubscriber}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Subscriber
          </Button>
        </div>

        {/* Filters */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
                <Input
                  placeholder="Search subscribers by name, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter size={18} />
                Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Subscribers List */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-gray-100">
              All Subscribers ({subscribers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {subscribers.length > 0 ? (
              <div className="space-y-4">
                {subscribers.map((subscriber) => (
                  <div
                    key={subscriber._id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                        <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                          {subscriber.name}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <Mail size={14} />
                            {subscriber.email}
                          </span>
                          {subscriber.subscription && (
                            <span className="flex items-center gap-1">
                              <CreditCard size={14} />
                              {subscriber.subscription.status === 'trialing' 
                                ? 'Trial Plan' 
                                : (subscriber.subscription.plan?.name || 'Unknown Plan')
                              } 
                              {subscriber.subscription.status === 'trialing' 
                                ? '' 
                                : ` - ${formatWithBilling(subscriber.subscription.amount || 0, subscriber.subscription.billingCycle)}`
                              }
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {new Date(subscriber.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(subscriber.isActive, subscriber.subscription, subscriber.subscriptionType)}`}>
                        {getStatusText(subscriber.isActive, subscriber.subscription, subscriber.subscriptionType)}
                      </span>
                        {subscriber.subscription?.status === 'active' && !['trialing'].includes(subscriber.subscription?.status) && (
                          <span className="px-2 py-1 rounded text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium" title="Paid Active Subscriber - Can be deleted with confirmation">
                            💳 PAID
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewSubscriber(subscriber._id)}
                          className="h-8 w-8 p-0"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditSubscriber(subscriber._id)}
                          className="h-8 w-8 p-0"
                          title="Edit Subscriber"
                        >
                          <Edit size={16} />
                        </Button>
                        <DropdownMenu 
                          subscriber={subscriber} 
                          onDelete={handleDeleteSubscriber}
                          onToggleStatus={handleToggleStatus}
                          onUpgrade={handleUpgradeSubscriber}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  No subscribers found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Get started by creating your first subscriber
                </p>
                <Button onClick={handleCreateSubscriber} className="bg-purple-600 hover:bg-purple-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Subscriber
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Page {pagination.page} of {pagination.pages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                    disabled={pagination.page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.min(pagination.pages, prev.page + 1) }))}
                    disabled={pagination.page === pagination.pages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </SuperAdminLayout>

    {/* Subscriber Details Modal - Outside layout for full page overlay */}
    <SubscriberDetailsModal
      subscriber={selectedSubscriber}
      isOpen={showModal}
      onClose={() => {
        setShowModal(false);
        setSelectedSubscriber(null);
      }}
      formatAmount={formatAmount}
    />

    {subscriberToDelete && (
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSubscriberToDelete(null);
        }}
        onConfirm={confirmDeleteSubscriber}
        subscriberData={{
          name: subscriberToDelete.name,
          email: subscriberToDelete.email,
          usersCount: subscriberToDelete.usersCount || 1,
          patientsCount: subscriberToDelete.patientsCount || 0,
          appointmentsCount: subscriberToDelete.appointmentsCount || 0,
          subscriptionStatus: subscriberToDelete.subscription?.status || 'unknown',
          planName: subscriberToDelete.subscription?.plan?.name || 'No Plan',
          isActive: subscriberToDelete.isActive !== false,
        }}
        isDeleting={isDeleting}
      />
    )}
    </>
  );
} 