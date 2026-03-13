"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import { User, Tenant } from '@/lib/types';
import { mockCurrentUser, mockTenant } from '@/lib/mock-data';

interface AppContextType {
    currentUser: User;
    tenant: Tenant;
    setCurrentUser: (user: User) => void;
    sidebarCollapsed: boolean;
    toggleSidebar: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
    const [currentUser, setCurrentUser] = useState<User>(mockCurrentUser);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const toggleSidebar = useCallback(() => {
        setSidebarCollapsed(prev => !prev);
    }, []);

    return (
        <AppContext.Provider value={{
            currentUser,
            tenant: mockTenant,
            setCurrentUser,
            sidebarCollapsed,
            toggleSidebar,
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
