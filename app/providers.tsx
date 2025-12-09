"use client";

import React, { memo } from 'react';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { ModalProvider } from '@/components/ui/modal-provider';
import { SettingsProvider } from '@/lib/settings-context';
import { SWRConfig } from 'swr';

interface ProvidersProps {
  children: React.ReactNode;
}

// Configure global fetcher for SWR
const fetcher = (url: string) => 
  fetch(url)
    .then(res => {
      if (!res.ok) throw new Error('An error occurred while fetching the data.');
      return res.json();
    });

// Memoize Providers to prevent unnecessary re-renders
const Providers = memo(function Providers({ children }: ProvidersProps) {
  return (
    <SWRConfig 
      value={{
        fetcher,
        revalidateOnFocus: false,
        revalidateIfStale: false,
        dedupingInterval: 60000, // 1 minute
        errorRetryCount: 3
      }}
    >
      <SessionProvider>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <SettingsProvider>
            <ModalProvider>
              {children}
            </ModalProvider>
          </SettingsProvider>
        </ThemeProvider>
      </SessionProvider>
    </SWRConfig>
  );
});

Providers.displayName = 'Providers';

export default Providers; 