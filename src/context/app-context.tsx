"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Tenant } from '@/lib/types';

interface AppContextType {
    currentUser: User | null;
    tenant: Tenant;
    setCurrentUser: (user: User | null) => void;
    setTenant: (tenant: Tenant) => void;
    sidebarCollapsed: boolean;
    toggleSidebar: () => void;
    logout: () => void;
    isAuthenticated: boolean;
    isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const defaultTenant: Tenant = {
    id: '',
    name: '',
    slug: '',
    plan: 'BASICO',
    active: false,
    createdAt: new Date(),
};

export function AppProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [tenant, setTenant] = useState<Tenant>(defaultTenant);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Al montar, leer sesión desde localStorage
    useEffect(() => {
        try {
            const savedUser = localStorage.getItem('sgc_user');
            const savedTenant = localStorage.getItem('sgc_tenant');

            if (savedUser && savedTenant) {
                setCurrentUser(JSON.parse(savedUser));
                setTenant(JSON.parse(savedTenant));
            }
        } catch (error) {
            console.error('Error loading session:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Sincronizar cambios de user/tenant a localStorage
    useEffect(() => {
        if (currentUser && tenant.id) {
            localStorage.setItem('sgc_user', JSON.stringify(currentUser));
            localStorage.setItem('sgc_tenant', JSON.stringify(tenant));
        }
    }, [currentUser, tenant]);

    const toggleSidebar = useCallback(() => {
        setSidebarCollapsed(prev => !prev);
    }, []);

    const logout = useCallback(() => {
        setCurrentUser(null);
        setTenant(defaultTenant);
        localStorage.removeItem('sgc_user');
        localStorage.removeItem('sgc_tenant');
        router.push('/');
    }, [router]);

    const isAuthenticated = !!currentUser && !!tenant.id;

    return (
        <AppContext.Provider value={{
            currentUser,
            tenant,
            setCurrentUser,
            setTenant,
            sidebarCollapsed,
            toggleSidebar,
            logout,
            isAuthenticated,
            isLoading,
        }}>
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    const context = useContext(AppContext);
    if (!context) throw new Error('useApp must be used within AppProvider');
    return context;
}
