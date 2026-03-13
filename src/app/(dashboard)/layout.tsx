"use client";

import React from 'react';
import { AppProvider } from '@/context/app-context';
import { AppSidebar, AppHeader } from '@/components/layout/app-shell';
import { cn } from '@/lib/utils';
import { useApp } from '@/context/app-context';

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
    const { sidebarCollapsed } = useApp();

    return (
        <div className="min-h-screen bg-background">
            <AppSidebar />
            <AppHeader />
            <main className={cn(
                "pt-16 min-h-screen transition-all duration-300",
                sidebarCollapsed ? "pl-16" : "pl-64"
            )}>
                <div className="p-6">
                    {children}
                </div>
            </main>
        </div>
    );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <AppProvider>
            <DashboardLayoutInner>{children}</DashboardLayoutInner>
        </AppProvider>
    );
}
