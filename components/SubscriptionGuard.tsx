'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

interface ExtendedUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
  organization?: string;
}

interface ExtendedSession {
  user?: ExtendedUser;
  expires: string;
}

// Cache subscription status globally to prevent re-checking on every navigation
let subscriptionCache: { [key: string]: any } = {};
let lastCheckTime: { [key: string]: number } = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export default function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  const { data: session, status } = useSession() as { data: ExtendedSession | null; status: string };
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    const checkSubscription = async () => {
      // Skip check for super admin
      if (session?.user?.role === 'super_admin') {
        setIsChecking(false);
        return;
      }

      // Skip check if no organization
      if (!session?.user?.organization) {
        setIsChecking(false);
        return;
      }

      const orgId = session.user.organization;
      const now = Date.now();
      
      // Check if we have cached data that's still valid
      if (subscriptionCache[orgId] && lastCheckTime[orgId] && (now - lastCheckTime[orgId] < CACHE_DURATION)) {
        setSubscriptionStatus(subscriptionCache[orgId]);
        setIsChecking(false);
        
        if (!subscriptionCache[orgId].isActive) {
          // Redirect based on the reason for inactivity
          if (subscriptionCache[orgId].reason === 'Organization is inactive') {
            router.push('/subscription/organization-deactivated');
          } else {
            router.push('/subscription/expired');
          }
        }
        return;
      }

      // Only show loading on first check, not on subsequent navigations
      if (!hasCheckedRef.current) {
        setIsChecking(true);
      }

      try {
        const response = await fetch(`/api/subscription-status?organizationId=${orgId}`);
        const data = await response.json();
        
        // Cache the result
        subscriptionCache[orgId] = data;
        lastCheckTime[orgId] = now;
        
        setSubscriptionStatus(data);
        
        if (!data.isActive) {
          // Redirect based on the reason for inactivity
          if (data.reason === 'Organization is inactive') {
            router.push('/subscription/organization-deactivated');
          } else {
            router.push('/subscription/expired');
          }
          return;
        }
      } catch (error) {
        console.error('Error checking subscription:', error);
        // On error, allow access but log the issue
      } finally {
        setIsChecking(false);
        hasCheckedRef.current = true;
      }
    };

    // Wait for session to load
    if (status === 'loading') return;
    
    if (session) {
      checkSubscription();
    } else {
      setIsChecking(false);
    }
  }, [session, status, router]);

  // Show loading only on initial check, not on navigation
  if (isChecking && !hasCheckedRef.current) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking subscription status...</p>
        </div>
      </div>
    );
  }

  // Render children if subscription is active or user is super admin
  return <>{children}</>;
} 