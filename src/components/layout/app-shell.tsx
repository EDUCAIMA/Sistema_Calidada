"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard, ShieldAlert, ClipboardCheck,
    Building2, Users, Settings, ChevronDown, LogOut,
    Target, BookOpen, Briefcase, Scale, TrendingUp, Search, Bell, Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApp } from '@/context/app-context';
import { useRouter } from 'next/navigation';
import type { Tenant, User } from '@/lib/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
    Collapsible, CollapsibleContent, CollapsibleTrigger
} from '@/components/ui/collapsible';

interface NavItem {
    title: string;
    href?: string;
    icon: React.ReactNode;
    clause?: string;
    children?: { title: string; href: string }[];
}

const navItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: <LayoutDashboard className="h-4.5 w-4.5" />,
    },
    {
        title: 'Contexto',
        icon: <Building2 className="h-4.5 w-4.5" />,
        clause: '4',
        children: [
            { title: '4.1 Contexto organizacional', href: '/contexto/organizacional' },
            { title: '4.2 Partes interesadas', href: '/contexto/partes-interesadas' },
            { title: '4.3 Alcance del SGC', href: '/contexto/alcance' },
            { title: '4.4 Mapa de procesos', href: '/contexto/procesos' },
        ],
    },
    {
        title: 'Liderazgo',
        icon: <Target className="h-4.5 w-4.5" />,
        clause: '5',
        children: [
            { title: '5.1 Liderazgo y cliente', href: '/liderazgo/compromisos' },
            { title: '5.2 Política', href: '/liderazgo/politicas' },
            { title: '5.3 Roles y responsabilidades', href: '/liderazgo/roles' },
        ],
    },
    {
        title: 'Planificación',
        icon: <ShieldAlert className="h-4.5 w-4.5" />,
        clause: '6',
        children: [
            { title: '6.1 Riesgos y oportunidades', href: '/planificacion/riesgos' },
            { title: '6.2 Objetivos de calidad', href: '/planificacion/objetivos' },
            { title: '6.3 Planificación de cambios', href: '/planificacion/cambios' },
        ],
    },
    {
        title: 'Apoyo',
        icon: <BookOpen className="h-4.5 w-4.5" />,
        clause: '7',
        children: [
            { title: '7 Vista general', href: '/apoyo' },
            { title: '7.1 Recursos', href: '/apoyo/recursos' },
            { title: '7.1.6 Conocimiento', href: '/apoyo/conocimiento' },
            { title: '7.2 Competencia', href: '/apoyo/competencias' },
            { title: '7.3 Toma de conciencia', href: '/apoyo/conciencia' },
            { title: '7.4 Comunicación', href: '/apoyo/comunicacion' },
            { title: '7.5 Info. Documentada', href: '/apoyo/documentos' },
            { title: '7.5.2 Estándar documental', href: '/apoyo/estandar-documental' },
        ],
    },
    {
        title: 'Operación',
        icon: <Briefcase className="h-4.5 w-4.5" />,
        clause: '8',
        children: [
            { title: '8.1 Control operacional', href: '/operacion/control' },
            { title: '8.4 Control de proveedores', href: '/operacion/proveedores' },
            { title: '8.7 Salidas no conformes', href: '/operacion/pnc' },
        ],
    },
    {
        title: 'Evaluación',
        icon: <ClipboardCheck className="h-4.5 w-4.5" />,
        clause: '9',
        children: [
            { title: '9.2 Auditorías', href: '/evaluacion/auditorias' },
            { title: '9.1 Indicadores', href: '/evaluacion/indicadores' },
            { title: '9.3 Revisión por la dirección', href: '/evaluacion/revision' },
        ],
    },
    {
        title: 'Mejora',
        icon: <TrendingUp className="h-4.5 w-4.5" />,
        clause: '10',
        children: [
            { title: '10.2 No conformidades', href: '/mejora/no-conformidades' },
            { title: '10.2 Acciones correctivas', href: '/mejora/acciones' },
            { title: '10.3 Mejora continua', href: '/mejora/continua' },
        ],
    },
];

const bottomNavItems: NavItem[] = [
    { title: 'Usuarios', href: '/admin/usuarios', icon: <Users className="h-4.5 w-4.5" /> },
    { title: 'Configuración', href: '/admin/configuracion', icon: <Settings className="h-4.5 w-4.5" /> },
];

function NavLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
    const pathname = usePathname();
    const isActive = item.href ? pathname === item.href : false;

    if (collapsed) {
        return (
            <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                    <Link
                        href={item.href || '#'}
                        className={cn(
                            "flex items-center justify-center h-10 w-10 rounded-lg transition-all duration-200 mx-auto",
                            isActive
                                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                                : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                        )}
                    >
                        {item.icon}
                    </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                    {item.title}
                </TooltipContent>
            </Tooltip>
        );
    }

    return (
        <Link
            href={item.href || '#'}
            className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            )}
        >
            {item.icon}
            <span>{item.title}</span>
        </Link>
    );
}

function NavGroup({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
    const pathname = usePathname();
    const isChildActive = item.children?.some(child => pathname.startsWith(child.href));
    const [open, setOpen] = React.useState(isChildActive || false);

    if (collapsed) {
        return (
            <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                    <Link
                        href={item.children?.[0]?.href || '#'}
                        className={cn(
                            "flex items-center justify-center h-10 w-10 rounded-lg transition-all duration-200 mx-auto relative",
                            isChildActive
                                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                                : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                        )}
                    >
                        {item.icon}
                        {item.clause && (
                            <span className="absolute -top-1 -right-1 text-[9px] font-bold bg-sidebar-primary/30 text-sidebar-primary-foreground rounded-full w-3.5 h-3.5 flex items-center justify-center">
                                {item.clause}
                            </span>
                        )}
                    </Link>
                </TooltipTrigger>
                <TooltipContent side="right">
                    <p className="font-semibold mb-1">{item.clause ? `${item.clause}. ${item.title}` : item.title}</p>
                    {item.children?.map(child => (
                        <Link key={child.href} href={child.href} className="block py-0.5 text-xs hover:underline">
                            {child.title}
                        </Link>
                    ))}
                </TooltipContent>
            </Tooltip>
        );
    }

    return (
        <Collapsible open={open} onOpenChange={setOpen}>
            <div className="flex items-center gap-1">
                <CollapsibleTrigger asChild>
                    {item.href ? (
                        <Link
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex-1",
                                isChildActive || pathname === item.href
                                    ? "text-sidebar-foreground bg-sidebar-accent"
                                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                            )}
                        >
                            {item.icon}
                            <span className="flex-1 text-left">
                                {item.clause && (
                                    <span className="text-[10px] font-bold opacity-50 mr-1.5">{item.clause}.</span>
                                )}
                                {item.title}
                            </span>
                            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200 ml-auto", open && "rotate-180")} />
                        </Link>
                    ) : (
                        <button
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 w-full",
                                isChildActive
                                    ? "text-sidebar-foreground bg-sidebar-accent"
                                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                            )}
                        >
                            {item.icon}
                            <span className="flex-1 text-left">
                                {item.clause && (
                                    <span className="text-[10px] font-bold opacity-50 mr-1.5">{item.clause}.</span>
                                )}
                                {item.title}
                            </span>
                            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", open && "rotate-180")} />
                        </button>
                    )}
                </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-up data-[state=open]:slide-down">
                <div className="ml-4 pl-4 border-l border-sidebar-border/50 mt-1 mb-1 space-y-0.5">
                    {item.children?.map(child => {
                        const isActive = pathname === child.href || (child.href !== '/apoyo' && pathname.startsWith(child.href + '/'));
                        return (
                            <Link
                                key={child.title}
                                href={child.href}
                                className={cn(
                                    "block px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                                    isActive
                                        ? "text-sidebar-primary-foreground bg-sidebar-primary shadow-sm"
                                        : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/70"
                                )}
                            >
                                {child.title}
                            </Link>
                        );
                    })}
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
}

export function AppSidebar({ mobile = false, onNavigate }: { mobile?: boolean; onNavigate?: () => void }) {
    const { currentUser, tenant, sidebarCollapsed: collapsed, logout } = useApp();
    const sidebarCollapsed = mobile ? false : collapsed;
    if (!currentUser) return null;
    const initials = currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2);

    return (
        <aside
            aria-label="Navegación principal"
            onClickCapture={(event) => { if ((event.target as HTMLElement).closest('a')) onNavigate?.(); }}
            className={cn(
                "bg-sidebar border-sidebar-border flex-col transition-all duration-300 overflow-hidden",
                mobile ? "relative flex h-full w-full" : "fixed left-0 top-0 z-40 hidden h-screen border-r md:flex",
                !mobile && (sidebarCollapsed ? "w-16" : "w-64")
            )}
        >
            {/* Logo / Brand */}
            <div className={cn(
                "flex items-center h-16 px-4 border-b border-sidebar-border/50",
                sidebarCollapsed ? "justify-center" : "gap-3"
            )}>
                <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-sidebar-primary to-sidebar-primary/60 flex items-center justify-center shadow-lg flex-shrink-0">
                    <Scale className="h-5 w-5 text-sidebar-primary-foreground" />
                </div>
                {!sidebarCollapsed && (
                    <div className="animate-fade-in">
                        <p className="text-sm font-bold text-sidebar-foreground">SGC SaaS</p>
                        <p className="text-xs text-sidebar-foreground/60">Sistema de Gestión</p>
                    </div>
                )}
            </div>

            {/* Tenant */}
            {!sidebarCollapsed && (
                <div className="px-3 py-3 border-b border-sidebar-border/30">
                    <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-md bg-sidebar-accent/50 overflow-hidden">
                        {(tenant.logo || tenant.logoUrl) ? (
                            <div className="h-7 w-auto max-w-[120px] flex items-center justify-center">
                                <img 
                                    src={tenant.logo || tenant.logoUrl} 
                                    alt={`Logo de ${tenant.name}`}
                                    className="max-h-full max-w-full object-contain"
                                />
                            </div>
                        ) : (
                            <>
                                <Building2 className="h-3.5 w-3.5 text-sidebar-foreground/50 flex-shrink-0" />
                                <span className="text-xs font-medium text-sidebar-foreground/80 truncate">{tenant.name}</span>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Navigation */}
            <ScrollArea className="flex-1 py-3 px-2 min-h-0">
                <div className="space-y-1">
                    {navItems.map(item => (
                        item.children ? (
                            <NavGroup key={item.title} item={item} collapsed={sidebarCollapsed} />
                        ) : (
                            <NavLink key={item.title} item={item} collapsed={sidebarCollapsed} />
                        )
                    ))}
                </div>

                <Separator className="my-3 bg-sidebar-border/30" />

                <div className="space-y-1">
                    {bottomNavItems.map(item => (
                        <NavLink key={item.title} item={item} collapsed={sidebarCollapsed} />
                    ))}
                </div>
            </ScrollArea>

            {/* User */}
            <div className={cn(
                "border-t border-sidebar-border/50 p-3",
                sidebarCollapsed ? "flex justify-center" : ""
            )}>
                {sidebarCollapsed ? (
                    <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                            <Avatar className="h-9 w-9 cursor-pointer">
                                <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs font-bold">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                            <p className="font-medium">{currentUser.name}</p>
                            <p className="text-xs opacity-60">{currentUser.position}</p>
                        </TooltipContent>
                    </Tooltip>
                ) : (
                    <div className="flex items-center gap-3 px-2">
                        <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs font-bold">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-sidebar-foreground truncate">{currentUser.name}</p>
                            <p className="text-[10px] text-sidebar-foreground/50 truncate">{currentUser.position}</p>
                        </div>
                        <Button 
                            aria-label="Cerrar sesión"
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-sidebar-foreground/40 hover:text-sidebar-foreground"
                            onClick={logout}
                        >
                            <LogOut className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                )}
            </div>
        </aside>
    );
}

export function AppHeader({ onMobileMenu }: { onMobileMenu?: () => void }) {
    const { sidebarCollapsed, toggleSidebar, setCurrentUser, setTenant } = useApp();
    const router = useRouter();
    const [adminSession, setAdminSession] = React.useState<{ user: User; tenant: Tenant } | null>(null);

    React.useEffect(() => {
        // En un entorno real esto sería más seguro, por ahora usamos localStorage
        const session = localStorage.getItem('sgc_admin_session');
        if (session) {
            setAdminSession(JSON.parse(session));
        }
    }, []);

    const handleBackToAdmin = () => {
        if (adminSession) {
            setCurrentUser(adminSession.user);
            setTenant(adminSession.tenant);
            localStorage.removeItem('sgc_admin_session');
            router.push('/admin-portal');
        }
    };

    return (
        <header className={cn(
            "fixed top-0 right-0 left-0 h-16 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-b border-border/50 flex items-center justify-between px-4 sm:px-6 z-30 transition-all duration-300",
            sidebarCollapsed ? "md:left-16" : "md:left-64"
        )}>
            <div className="flex min-w-0 items-center gap-3">
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Abrir o contraer menú de navegación"
                    onClick={() => {
                        if (window.matchMedia('(max-width: 767px)').matches) onMobileMenu?.();
                        else toggleSidebar();
                    }}
                >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                    </svg>
                </Button>
                <span className="text-sm font-semibold text-slate-700 md:hidden">Sistema de calidad</span>
                <div className="relative hidden lg:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <input
                        type="text"
                        aria-label="Buscar en el sistema"
                        className="h-11 w-64 rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-blue-600 xl:w-80"
                        placeholder="Buscar procesos, documentos, riesgos..."
                    />
                </div>
                {adminSession && (
                    <Button 
                        variant="secondary" 
                        size="sm" 
                        className="h-9 px-4 animate-pulse hover:animate-none rounded-xl gap-2 font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20"
                        onClick={handleBackToAdmin}
                    >
                        <Shield className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Volver a Administración</span>
                        <span className="sm:hidden">Volver</span>
                    </Button>
                )}
            </div>
            <div className="flex items-center gap-2">
                <Button aria-label="Notificaciones" variant="ghost" size="icon" className="relative">
                    <Bell className="h-4 w-4" />
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
                </Button>
            </div>
        </header>
    );
}
