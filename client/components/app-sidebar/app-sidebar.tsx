'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import { Library, Gauge, Search, Settings } from 'lucide-react';
import { useIsSignedIn } from '@coinbase/cdp-hooks';

import { NavItem, NavItems } from '@/components/app-sidebar/nav-items';

import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail, useSidebar } from '../ui/sidebar';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme-toggle';
import { WalletControls } from '@/components/wallet-controls';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { state } = useSidebar();
  const [isDark, setIsDark] = useState(false);
  const [logo, setLogo] = useState<string | null>(null);
  const { isSignedIn } = useIsSignedIn();

  const isExpanded = state === 'expanded';

  useEffect(() => {
    // Check initial theme
    setIsDark(document.documentElement.classList.contains('dark'));

    // Watch for theme changes
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  // Load logos based on theme
  useEffect(() => {
    const loadLogos = async () => {
      try {
        const logosResponse = await fetch('/api/logos');
        if (logosResponse.ok) {
          const logos = await logosResponse.json();
          // Use dark logo if dark mode, light logo if light mode
          setLogo(isDark ? logos.dark : logos.light);
        }
      } catch (error) {
        console.error('Error loading logos:', error);
      }
    };

    loadLogos();
  }, [isDark]);

  const baseNavItems: NavItem[] = [
    {
      name: 'Dashboard',
      url: '/dashboard',
      pathname: '/dashboard',
      icon: <Gauge width={20} height={20} className="stroke-[1.5]" />,
    },
    {
      name: 'Query',
      url: '/query',
      pathname: '/query',
      icon: <Search width={20} height={20} className="stroke-[1.5]" />,
    },
    {
      name: 'Widgets',
      url: '/widget',
      pathname: '/widget',
      icon: <Library width={20} height={20} className="stroke-[1.5]" />,
    },
  ];

  const settingsNavItem: NavItem = {
    name: 'Settings',
    url: '/settings',
    pathname: '/settings',
    icon: <Settings width={20} height={20} className="stroke-[1.5]" />,
  };

  const navItems = isSignedIn ? [...baseNavItems, settingsNavItem] : baseNavItems;

  return (
    <Sidebar className="bg-background relative" collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center justify-center px-2 my-6">
          <div className="w-[96%] flex items-center justify-center">
            {logo ? (
              <Image 
                src={logo} 
                alt="Organization Logo" 
                width={200}
                height={200}
                className="w-full h-auto object-contain"
                priority
              />
            ) : (
              <Image 
                src={isDark ? '/habeas-logos/dark/habeas-logo-dark-transparent.png' : '/habeas-logos/light/habeas-logo-light-transparent.png'} 
                alt="Habeas Logo" 
                width={200}
                height={200}
                className="w-full h-auto object-contain"
                priority
              />
            )}
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="mt-6">
        <NavItems items={navItems} />
      </SidebarContent>

      <SidebarFooter>
        <div className={cn('flex flex-col gap-2 px-2 py-2')}>
          <WalletControls />
          <div className={cn('flex items-center', isExpanded ? 'justify-start' : 'justify-center')}>
            <ThemeToggle />
            {isExpanded && <span className="ml-3 text-sm text-muted-foreground">Theme</span>}
          </div>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
