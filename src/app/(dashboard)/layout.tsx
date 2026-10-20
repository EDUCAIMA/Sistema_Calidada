"use client";

import React from 'react';
import { AppProvider, useApp } from '@/context/app-context';
import { AppSidebar, AppHeader } from '@/components/layout/app-shell';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
    const { sidebarCollapsed, isAuthenticated, isLoading } = useApp();
    const router = useRouter();
    const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

    useEffect(() => {
        const desktop = window.matchMedia('(min-width: 768px)');
        const closeMobileMenu = (event: MediaQueryListEvent) => {
            if (event.matches) setMobileMenuOpen(false);
        };
        desktop.addEventListener('change', closeMobileMenu);
        return () => desktop.removeEventListener('change', closeMobileMenu);
    }, []);

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
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetContent side="left" className="w-72 gap-0 p-0 md:hidden">
                    <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
                    <SheetDescription className="sr-only">Acceda a los numerales del sistema de gestión de calidad.</SheetDescription>
                    <AppSidebar mobile onNavigate={() => setMobileMenuOpen(false)} />
                </SheetContent>
            </Sheet>
            <AppHeader onMobileMenu={() => setMobileMenuOpen(true)} />
            <main className={cn(
                "min-w-0 pt-16 min-h-screen transition-all duration-300",
                sidebarCollapsed ? "md:pl-16" : "md:pl-64"
            )}>
                <div className="min-w-0 p-3 sm:p-6">
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
