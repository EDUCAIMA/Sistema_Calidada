"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppProvider, useApp } from '@/context/app-context';

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, currentUser } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/');
      } else if (currentUser?.email !== 'admin@calidad.com' && currentUser?.role !== 'SUPER_ADMIN') {
        // Si está autenticado pero no es el super admin, redirigir al dashboard normal
        router.push('/dashboard');
      }
    }
  }, [isLoading, isAuthenticated, currentUser, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#000814] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <svg className="h-8 w-8 animate-spin text-blue-600" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
            <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
          </svg>
          <p className="text-sm text-slate-400 font-medium">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || (currentUser?.email !== 'admin@calidad.com' && currentUser?.role !== 'SUPER_ADMIN')) return null;

  return <>{children}</>;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </AppProvider>
  );
}
