"use client";

import React, { useState, useEffect, useCallback, memo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Users, 
  CalendarClock, 
  FileText, 
  Pill, 
  BarChart3, 
  Settings, 
  Menu, 
  X,
  LogOut,
  Receipt,
  User,
  FlaskConical,
  CreditCard
} from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
}

// Memoize SidebarItem to prevent unnecessary re-renders
const SidebarItem = memo(({ icon, label, href, active }: SidebarItemProps) => {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(href);
  };
  
  return (
    <div 
      onClick={handleClick}
      className={cn(
        "flex items-center gap-2 p-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative overflow-hidden group cursor-pointer",
        active 
          ? "bg-gradient-to-r from-primary-500/20 to-primary-700/20 text-primary-600 dark:from-primary-600/30 dark:to-primary-800/30 dark:text-primary-300 shadow-sm" 
          : "text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50/50 dark:hover:bg-primary-900/20"
      )}
    >
      {/* Simplified hover effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-primary-400/0 via-primary-500/5 to-primary-600/0 blur-md"></div>
      </div>
      
      {/* Active indicator */}
      {active && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-gradient-to-b from-primary-400 to-primary-600 rounded-r-md shadow-md"></div>
      )}
      
      <div className={cn(
        "w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 z-10",
        active 
          ? "bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-md" 
          : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 group-hover:bg-primary-500 group-hover:text-white"
      )}>
        {icon}
      </div>
      <span className="z-10">{label}</span>
    </div>
  );
});

SidebarItem.displayName = 'SidebarItem';

// Memoize the main Sidebar component to prevent unnecessary re-renders
const Sidebar = memo(function Sidebar() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  // State for branding settings
  const [brandingSettings, setBrandingSettings] = useState({
    appName: 'DoctorCare',
    appTagline: 'Practice Management',
    logoText: 'DC',
    footerText: 'DoctorCare. All rights reserved.'
  });
  
  useEffect(() => {
    // Load branding settings
    const loadBrandingSettings = async () => {
      try {
        const response = await fetch('/api/settings/branding');
        if (response.ok) {
          const settings = await response.json();
          setBrandingSettings({
            appName: settings.appName || 'DoctorCare',
            appTagline: settings.appTagline || 'Practice Management',
            logoText: settings.logoText || 'DC',
            footerText: settings.footerText || 'DoctorCare. All rights reserved.'
          });
        }
      } catch (error) {
        console.error('Error loading branding settings:', error);
      }
    };
    
    loadBrandingSettings();
    
    // Listen for branding updates
    const handleBrandingUpdate = () => {
      loadBrandingSettings();
    };
    
    window.addEventListener('brandingUpdated', handleBrandingUpdate);
    
    return () => {
      window.removeEventListener('brandingUpdated', handleBrandingUpdate);
    };
  }, []);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileOpen(prev => !prev);
  }, []);

  // Get user's initials from name - memoize this function
  const getUserInitials = useCallback(() => {
    if (!session?.user?.name) return 'U';
    return session.user.name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  }, [session?.user?.name]);

  const handleLogout = useCallback(async () => {
    await signOut({ redirect: false });
    router.push('/login');
  }, [router]);

  // Memoize sidebar items to prevent recreation on each render
  const sidebarItems = React.useMemo(() => [
    {
      icon: <LayoutDashboard size={18} />,
      label: "Dashboard",
      href: "/dashboard",
    },
    {
      icon: <Users size={18} />,
      label: "Patients",
      href: "/patients",
    },
    {
      icon: <CalendarClock size={18} />,
      label: "Appointments",
      href: "/appointments",
    },
    {
      icon: <FlaskConical size={18} />,
      label: "Lab Results",
      href: "/labs",
    },
    {
      icon: <FileText size={18} />,
      label: "Prescriptions",
      href: "/prescriptions",
    },
    {
      icon: <Receipt size={18} />,
      label: "Payments",
      href: "/payments",
    },
    {
      icon: <Pill size={18} />,
      label: "Medications",
      href: "/medications",
    },
    {
      icon: <BarChart3 size={18} />,
      label: "Reports",
      href: "/reports",
    },
    {
      icon: <CreditCard size={18} />,
      label: "Bill & Subscription",
      href: "/billing",
    },
    {
      icon: <User size={18} />,
      label: "Profile",
      href: "/profile",
    },
    {
      icon: <Settings size={18} />,
      label: "Settings",
      href: "/settings",
    },
  ], []);

  return (
    <>
      {/* Mobile menu button */}
      <button 
        onClick={toggleMobileMenu}
        className="lg:hidden fixed top-5 left-5 z-[110] p-2.5 rounded-xl bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700"
      >
        <Menu size={22} className="text-primary-600 dark:text-primary-400" />
      </button>

      {/* Overlay */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-gray-900/60 backdrop-blur-sm dark:bg-black/70 z-[90]"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-[100] h-full w-72 transition-transform duration-200 ease-in-out",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          "overflow-hidden"
        )}
        style={{ pointerEvents: 'auto', position: 'fixed', zIndex: 100 }}
      >
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 z-0">
          <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="sidebarGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#sidebarGrid)" />
            </svg>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-[20%] right-[10%] w-24 h-24 rounded-full bg-primary-500/5 blur-2xl opacity-100"></div>
        
        {/* Content container */}
        <div className="relative h-full flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 shadow-2xl shadow-gray-200/50 dark:shadow-black/30 z-20" style={{ pointerEvents: 'auto', position: 'relative' }}>
          {/* Close button (mobile only) */}
          <button 
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden absolute top-4 right-4 p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <X size={18} />
          </button>

          {/* Logo */}
          <div className="flex items-center gap-3 px-5 pt-6 pb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold shadow-md shadow-primary-500/20">
              {brandingSettings.logoText}
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent dark:from-primary-400 dark:to-primary-600">
                {brandingSettings.appName}
              </h1>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium tracking-wider uppercase mt-0.5">
                {brandingSettings.appTagline}
              </p>
            </div>
          </div>

          {/* Navigation */}
          <div className="px-4 flex-1 overflow-y-auto thin-scrollbar">
            {/* Main Navigation */}
            <div className="pb-2">
              <div className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 px-3 pb-2">
                Main Navigation
              </div>
              <nav className="space-y-0.5">
                {sidebarItems.map((item, index) => (
                  <SidebarItem
                    key={item.href}
                    icon={item.icon}
                    label={item.label}
                    href={item.href}
                    active={pathname ? (
                      pathname === item.href || 
                      (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`))
                    ) : false}
                  />
                ))}
              </nav>
            </div>
          </div>

          {/* User profile */}
          <div className="mt-auto bg-gray-50/80 dark:bg-gray-800/50 p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="shrink-0 w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 flex items-center justify-center text-sm font-semibold shadow-sm">
                {getUserInitials()}
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {session?.user?.name || 'User'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {session?.user?.email || 'user@example.com'}
                </p>
              </div>
              <button 
                onClick={handleLogout}
                className="ml-2 p-2 rounded-lg text-gray-500 hover:text-red-500 hover:bg-red-50 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-colors"
                aria-label="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
});

export default Sidebar; 