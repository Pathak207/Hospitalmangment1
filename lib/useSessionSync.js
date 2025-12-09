import { useSession } from 'next-auth/react';
import { useEffect, useCallback } from 'react';

export function useSessionSync() {
  const { data: session, update } = useSession();

  const syncSession = useCallback(async () => {
    try {
      console.log('Syncing session with database...');
      await update();
      console.log('Session synced successfully');
    } catch (error) {
      console.error('Failed to sync session:', error);
    }
  }, [update]);

  // Listen for profile update events
  useEffect(() => {
    const handleProfileUpdate = () => {
      console.log('Profile update event detected, syncing session...');
      syncSession();
    };

    // Listen for custom profile update events
    window.addEventListener('profileUpdated', handleProfileUpdate);
    
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, [syncSession]);

  return { syncSession };
} 