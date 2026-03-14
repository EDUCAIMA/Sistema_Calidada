"use client";

import React, { useState } from 'react';
import {
  Shield,
  Users,
  Building2,
  Activity,
  Search,
  Bell,
  Settings,
  MoreVertical,
  LayoutDashboard,
  LogOut,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import Link from 'next/link';

// Import refactored components
import { StatCard } from '@/components/admin/StatCard';
import { ActivityFeed } from '@/components/admin/ActivityFeed';
import { SystemsTable } from '@/components/admin/SystemsTable';
import { UsersTable } from '@/components/admin/UsersTable';


// Import mock data
import {
  kpiData,
  chartData,
  recentActivityData,
  systemsData
} from '@/lib/admin/admin-mock-data';

import { useApp } from '@/context/app-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminPortal() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'systems' | 'logs'>('dashboard');
  const [counts, setCounts] = useState({ users: 0, tenants: 0 });
  const { logout, currentUser } = useApp();
  const router = useRouter();

  useEffect(() => {
    async function fetchStats() {
      try {
        const [usersRes, tenantsRes] = await Promise.all([
          fetch('/api/admin/users'),
          fetch('/api/admin/tenants')
        ]);
        
        const users = await usersRes.json();
        const tenants = await tenantsRes.json();
        
        setCounts({
          users: Array.isArray(users) ? users.length : 0,
          tenants: Array.isArray(tenants) ? tenants.length : 0
        });
      } catch (err) {
        console.error('Error fetching admin stats:', err);
      }
    }
    fetchStats();
  }, []);

  const realKpiData = [
    { title: 'Sistemas Registrados', value: counts.tenants.toString(), icon: Building2, trend: '+1', color: 'blue' },
    { title: 'Usuarios Activos', value: counts.users.toString(), icon: Users, trend: '+1', color: 'indigo' },
    { title: 'Promedio Implementación', value: '75%', icon: Activity, trend: 'N/A', color: 'emerald' },
    { title: 'Alertas de Sistema', value: '0', icon: Bell, trend: '0', color: 'amber' },
  ];
  return (
    <div className="min-h-screen bg-[#000814] text-slate-200 font-sans flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0a1120]/50 backdrop-blur-xl border-r border-white/5 flex flex-col z-20">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-1.5 rounded-lg shadow-lg shadow-blue-600/30">
              <Shield className="h-6 w-6 text-white" fill="currentColor" fillOpacity={0.2} />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-white leading-tight">AdminPortal</span>
              <span className="text-[10px] text-blue-400 font-semibold uppercase tracking-widest">QualityLink QMS</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider px-2 py-3">Menú Principal</div>
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${
              activeTab === 'dashboard' 
                ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' 
                : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <LayoutDashboard className="h-5 w-5" />
            <span className="font-medium">Panel de Control</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('systems')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${
              activeTab === 'systems' 
                ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' 
                : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <Building2 className="h-5 w-5" />
            <span className="font-medium">Sistemas QMS</span>
          </button>

          <button 
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${
              activeTab === 'users' 
                ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' 
                : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <Users className="h-5 w-5" />
            <span className="font-medium">Usuarios Globales</span>
          </button>

          <button 
            onClick={() => setActiveTab('logs')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${
              activeTab === 'logs' 
                ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' 
                : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <Activity className="h-5 w-5" />
            <span className="font-medium">Logs de Actividad</span>
          </button>


          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider px-2 py-3 mt-4">Configuración</div>
          <Link href="#" className="flex items-center gap-3 px-3 py-2.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all group">
            <Settings className="h-5 w-5" />
            <span className="font-medium">Ajustes Globales</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="bg-white/5 rounded-2xl p-4 mb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold uppercase">
                {currentUser?.name?.charAt(0) || 'A'}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-white truncate max-w-[120px]">{currentUser?.name || 'Super Admin'}</span>
                <span className="text-[10px] text-slate-500 truncate max-w-[120px]">{currentUser?.email || 'admin@calidad.com'}</span>
              </div>
            </div>
            <Button 
                variant="ghost" 
                size="sm" 
                onClick={logout}
                className="w-full text-xs text-slate-400 hover:text-red-400 hover:bg-red-400/10 gap-2 h-8"
            >
              <LogOut className="h-3.5 w-3.5" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative">
        {/* Background Gradients */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
          <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[120px] rounded-full" />
        </div>

        {/* Header */}
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-[#000814]/50 backdrop-blur-md z-10">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Buscar sistemas (ej. Alpha) o industria..."
                className="bg-[#111927]/50 border-white/5 pl-10 h-10 w-full focus:ring-blue-500/20"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[#000814]" />
            </Button>
            <div className="h-8 w-[1px] bg-white/5 mx-2" />
            <Button className="bg-blue-600 hover:bg-blue-500 text-white gap-2 h-10 px-4 rounded-xl shadow-lg shadow-blue-600/20">
              Nuevo Sistema QMS
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-y-auto p-8 z-10 custom-scrollbar">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
              {activeTab === 'dashboard' && "Consola de Administración"}
              {activeTab === 'users' && "Gestión de Usuarios"}
              {activeTab === 'systems' && "Sistemas QMS Globales"}
              {activeTab === 'logs' && "Registro de Actividad"}
            </h1>
            <p className="text-slate-400">
              {activeTab === 'dashboard' && "Monitorización global de sistemas registrados y estados de implementación."}
              {activeTab === 'users' && "Listado completo de todos los usuarios registrados en el ecosistema QualityLink."}
              {activeTab === 'systems' && "Directorio de todas las empresas y sistemas de gestión de calidad activos."}
              {activeTab === 'logs' && "Historial detallado de operaciones y cambios críticos en la plataforma."}
            </p>
          </div>

          {activeTab === 'dashboard' && (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {realKpiData.map((kpi, idx) => (
                  <StatCard key={idx} {...kpi} />
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* Chart Area */}
                <Card className="lg:col-span-2 bg-[#111927]/60 backdrop-blur-md border-white/5 shadow-xl">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-bold text-white">Progreso Global de Implementación</CardTitle>
                      <CardDescription className="text-slate-500 text-xs">Histórico de avance porcentual en los últimos 6 meses</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="bg-white/5 border-white/5 text-xs">Mensual</Button>
                      <Button variant="outline" size="sm" className="bg-white/5 border-white/5 text-xs">Semanal</Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] w-full pt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#0071c5" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#0071c5" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                          <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 11 }}
                            dy={10}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 11 }}
                            dx={-10}
                            tickFormatter={(val) => `${val}%`}
                          />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#111927', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                            itemStyle={{ color: '#00c7fd' }}
                          />
                          <Area
                            type="monotone"
                            dataKey="valor"
                            stroke="#0071c5"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorVal)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Notifications/Activity Area */}
                <ActivityFeed activities={recentActivityData} />
              </div>

              {/* Table Area extracted into a component to separate concerns */}
              <SystemsTable searchTerm={searchTerm} />
            </>
          )}

          {activeTab === 'users' && (
            <UsersTable searchTerm={searchTerm} />
          )}

          {activeTab === 'systems' && (
            <SystemsTable searchTerm={searchTerm} />
          )}

          {activeTab === 'logs' && (
            <div className="p-12 text-center bg-white/5 rounded-2xl border border-dashed border-white/10">
              <Activity className="h-12 w-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white mb-1">Módulo de Logs en Desarrollo</h3>
              <p className="text-slate-500 max-w-sm mx-auto">Próximamente podrá visualizar todos los eventos de auditoría y cambios en los sistemas.</p>
            </div>
          )}
        </div>

      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  );
}
