"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User, Tenant } from '@/lib/types';
import { mockCurrentUser, mockTenant } from '@/lib/mock-data';

interface AppContextType {
    currentUser: User | null;
    tenant: Tenant;
    setCurrentUser: (user: User | null) => void;
    sidebarCollapsed: boolean;
    toggleSidebar: () => void;
    logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState<User | null>(mockCurrentUser);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const toggleSidebar = useCallback(() => {
        setSidebarCollapsed(prev => !prev);
    }, []);

    const logout = useCallback(() => {
        setCurrentUser(null);
        router.push('/');
    }, [router]);

    return (
        <AppContext.Provider value={{
            currentUser,
            tenant: mockTenant,
            setCurrentUser,
            sidebarCollapsed,
            toggleSidebar,
            logout,
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
