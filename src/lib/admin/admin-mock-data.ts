export interface KPI {
  title: string;
  value: string;
  icon: any; // We'll type this as LucideIcon later if needed
  trend: string;
  color: string;
}

export interface ChartData {
  name: string;
  valor: number;
}

export interface SystemData {
  id: number;
  name: string;
  industry: string;
  implementation: number;
  users: number;
  status: 'Active' | 'Warning' | 'Critical';
  lastUpdate: string;
}

export interface ActivityLog {
  company: string;
  action: string;
  time: string;
  icon: any;
  iconColor: string;
  bg: string;
}

// Re-using the lucide-react icons from the page for the mock data
import { Building2, Users, Activity as ActivityIcon, Bell, CheckCircle2, AlertCircle, LifeBuoy } from 'lucide-react';

export const kpiData: KPI[] = [
  { title: 'Sistemas Registrados', value: '42', icon: Building2, trend: '+12%', color: 'blue' },
  { title: 'Usuarios Activos', value: '1,284', icon: Users, trend: '+8.4%', color: 'indigo' },
  { title: 'Promedio Implementación', value: '64.2%', icon: ActivityIcon, trend: '+5.2%', color: 'emerald' },
  { title: 'Alertas de Sistema', value: '03', icon: Bell, trend: '-2', color: 'amber' },
];

export const chartData: ChartData[] = [
  { name: 'Ene', valor: 45 },
  { name: 'Feb', valor: 52 },
  { name: 'Mar', valor: 48 },
  { name: 'Abr', valor: 61 },
  { name: 'May', valor: 67 },
  { name: 'Jun', valor: 75 },
];

export const recentActivityData: ActivityLog[] = [
  { company: 'Corporación Alpha', action: 'Completó nivel 3', time: 'Hace 5min', icon: CheckCircle2, iconColor: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { company: 'Alimentos Vida', action: 'Inactividad detectada', time: 'Hace 2h', icon: AlertCircle, iconColor: 'text-amber-500', bg: 'bg-amber-500/10' },
  { company: 'Constructora Pilar', action: 'Superó límite usuarios', time: 'Hace 4h', icon: Bell, iconColor: 'text-blue-500', bg: 'bg-blue-500/10' },
  { company: 'Tecnologías Globales', action: 'Solicitud de soporte', time: 'Hace 1d', icon: LifeBuoy, iconColor: 'text-slate-400', bg: 'bg-white/5' },
];

export const systemsData: SystemData[] = [
  { id: 1, name: 'Corporación Alpha', industry: 'Manufactura', implementation: 85, users: 120, status: 'Active', lastUpdate: 'Hace 2 horas' },
  { id: 2, name: 'Tecnologías Globales', industry: 'Servicios IT', implementation: 42, users: 45, status: 'Warning', lastUpdate: 'Hace 5 horas' },
  { id: 3, name: 'Suministros del Norte', industry: 'Logística', implementation: 92, users: 88, status: 'Active', lastUpdate: 'Hace 1 día' },
  { id: 4, name: 'Alimentos Vida', industry: 'Alimentaria', implementation: 15, users: 12, status: 'Critical', lastUpdate: 'Hace 3 días' },
  { id: 5, name: 'Constructora Pilar', industry: 'Construcción', implementation: 68, users: 210, status: 'Active', lastUpdate: 'Hace 4 horas' },
];
