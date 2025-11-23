'use client';

import { Geist, Geist_Mono } from 'next/font/google';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, Suspense, useState } from 'react';

import { AppSidebar } from '@/components/app-sidebar/app-sidebar';

import './global.css';

import { Toaster } from 'sonner';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Header } from '@/components/header/header';
import type { Config } from "@coinbase/cdp-core";
import { CDPHooksProvider } from "@coinbase/cdp-hooks";

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const config: Config = {
  projectId: process.env.NEXT_PUBLIC_CDP_PROJECT_ID!,
  ethereum: {
    createOnLogin: "eoa",
  },
};

// Validate CDP Project ID on client side
if (typeof window !== 'undefined' && !process.env.NEXT_PUBLIC_CDP_PROJECT_ID) {
  console.error('⚠️ NEXT_PUBLIC_CDP_PROJECT_ID is not set in .env.local');
  console.error('Please add NEXT_PUBLIC_CDP_PROJECT_ID to your .env.local file and restart the dev server');
}

function Providers({ children }: { children: ReactNode }) {
  return (
    <CDPHooksProvider config={config}>
      {children}
    </CDPHooksProvider>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Create the query client once and set it directly
  const queryClient = new QueryClient();

  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme') || 'dark';
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full overflow-hidden`}
      >
        <Suspense fallback={<p>Loading...</p>}>
          <QueryClientProvider client={queryClient}>
            <Providers>
              <SidebarProvider className="relative h-svh flex">
                <AppSidebar className="hidden lg:block" />
                <div className="block lg:hidden">
                  <Header />
                </div>

                <SidebarInset className="overflow-y-auto h-full">
                  <div className="flex flex-1 flex-col gap-4 p-2 lg:p-6 pt-0 mt-16 lg:mt-0">{children}</div>
                </SidebarInset>
              </SidebarProvider>
              <Toaster />
            </Providers>
          </QueryClientProvider>
        </Suspense>
      </body>
    </html>
  );
}
