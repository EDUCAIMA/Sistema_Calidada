"use client";

import React from 'react';
import { AppProvider, useApp } from '@/context/app-context';
import { AppSidebar, AppHeader } from '@/components/layout/app-shell';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
    const { sidebarCollapsed, isAuthenticated, isLoading } = useApp();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/');
        }
    }, [isLoading, isAuthenticated, router]);

    // Mostrar loader mientras se verifica autenticación
    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <svg className="h-8 w-8 animate-spin text-blue-600" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                        <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
                    </svg>
                    <p className="text-sm text-muted-foreground font-medium">Verificando sesión...</p>
                </div>
            </div>
        );
    }

    // Si no está autenticado, no renderizar nada (se está redirigiendo)
    if (!isAuthenticated) {
        return null;
    }

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
