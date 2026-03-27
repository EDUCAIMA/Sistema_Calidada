"use client";

import React, { useState, useEffect } from 'react';
import {
    Building2, Plus, Search, Filter, MoreVertical,
    Edit, Trash2, Eye, Wrench, CheckCircle2, AlertCircle,
    Users as UsersIcon, Thermometer, Ruler, PenTool, BookOpen,
    Info, LayoutGrid, Clock, Download, HelpCircle, 
    Settings, Upload, Activity, ShieldAlert,
    UserPlus, Building, KeyRound, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';

// Mock data
const mockInfra = [
    { id: 'INF-001', name: 'Servidor Principal ERP', type: 'Tecnología', status: 'Operativo', maintenanceDate: '15/05/2026', responsible: 'Área TI' },
    { id: 'INF-002', name: 'Planta Eléctrica de Respaldo', type: 'Equipos', status: 'Mantenimiento Pendiente', maintenanceDate: '01/03/2026', responsible: 'Mantenimiento' },
    { id: 'INF-003', name: 'Vehículo de Reparto 01', type: 'Transporte', status: 'Operativo', maintenanceDate: '20/04/2026', responsible: 'Logística' },
];

const mockMeasurement = [
    { id: 'CAL-001', name: 'Balanza Electrónica', brand: 'Mettler Toledo', nextCal: '12/10/2025', status: 'Certificado' },
    { id: 'CAL-002', name: 'Calibrador Vernier', brand: 'Mitutoyo', nextCal: '05/06/2025', status: 'Vencido' },
];

const mockCargos = [
    { id: 'c1', name: 'Gerente General', process: 'Estratégico', jefe: 'Junta Directiva', count: 1 },
    { id: 'c2', name: 'Director de Calidad', process: 'Evaluación', jefe: 'Gerente General', count: 1 },
    { id: 'c3', name: 'Auditor Interno SGC', process: 'Evaluación', jefe: 'Director de Calidad', count: 3 },
    { id: 'c4', name: 'Coordinador de Operaciones', process: 'Misional', jefe: 'Gerente General', count: 2 },
    { id: 'c5', name: 'Operario de Producción', process: 'Misional', jefe: 'Jefe de Planta', count: 5 },
];

const mockUsuarios = [
    { id: 'u1', name: 'Carlos Mendoza', email: 'cmendoza@empresa.com', cargo: 'Gerente General', date: '12/01/2020', status: 'Activo' },
    { id: 'u2', name: 'Ana Gómez', email: 'agomez@empresa.com', cargo: 'Coordinador de Calidad', date: '05/06/2022', status: 'Activo' },
    { id: 'u3', name: 'Luis Felipe', email: 'lfelipe@empresa.com', cargo: 'Operario de Producción', date: '21/08/2023', status: 'Inactivo' },
];

export default function RecursosPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [showISOInfo, setShowISOInfo] = useState(false);
    
    // States for 7.1.2 Personas
    const [activePersonasTab, setActivePersonasTab] = useState('organigrama');
    const [cargos, setCargos] = useState(mockCargos);
    const [usuarios, setUsuarios] = useState(mockUsuarios);
    const [showNewCargoModal, setShowNewCargoModal] = useState(false);
    const [showNewUserModal, setShowNewUserModal] = useState(false);
    const [newCargo, setNewCargo] = useState({ name: '', process: 'Misional', jefe: '' });
    const [newUser, setNewUser] = useState({ name: '', email: '', cargo: '', status: 'Activo' });

    // Matrix Permissions State (LCMAE)
    const [permissions, setPermissions] = useState<Record<string, Record<string, string[]>>>(() => {
        // Inicializar con algo coherente si no hay en localStorage
        const initial: Record<string, Record<string, string[]>> = {};
        const modules = ['G. Documental', 'Indicadores', 'Auditorías', 'Riesgos'];
        
        mockCargos.forEach(c => {
            initial[c.name] = {};
            modules.forEach(m => {
                if (c.name === 'Gerente General') {
                    initial[c.name][m] = ['L', 'C', 'M', 'A'];
                } else if (c.name === 'Director de Calidad') {
                    initial[c.name][m] = ['L', 'C', 'M', 'A'];
                } else {
                    initial[c.name][m] = ['L'];
                }
            });
        });
        return initial;
    });

    const handlePermissionChange = (cargoName: string, module: string, perm: string, checked: boolean) => {
        setPermissions(prev => {
            const cargoPerms = { ...(prev[cargoName] || {}) };
            const modulePerms = [...(cargoPerms[module] || [])];
            
            if (checked) {
                if (!modulePerms.includes(perm)) modulePerms.push(perm);
            } else {
                const index = modulePerms.indexOf(perm);
                if (index > -1) modulePerms.splice(index, 1);
            }
            
            return {
                ...prev,
                [cargoName]: {
                    ...cargoPerms,
                    [module]: modulePerms
                }
            };
        });
    };

    const saveMatrix = () => {
        try {
            localStorage.setItem('sig_permissions_matrix', JSON.stringify(permissions));
            toast.success("Matriz de permisos guardada exitosamente", {
                description: "Los cambios han sido persistidos localmente."
            });
        } catch (e) {
            toast.error("Error al guardar la matriz");
        }
    };

    // Cargar matriz guardada al montar
    useEffect(() => {
        const saved = localStorage.getItem('sig_permissions_matrix');
        if (saved) {
            try {
                setPermissions(JSON.parse(saved));
            } catch (e) {
                console.error("Error parsing saved permissions");
            }
        }
    }, []);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Operativo':
            case 'Certificado':
            case 'Activo':
                return <Badge variant="default" className="bg-emerald-50 text-emerald-600 border border-emerald-200 gap-1 font-bold shadow-sm"><CheckCircle2 className="w-3 h-3" /> {status}</Badge>;
            case 'Mantenimiento Pendiente':
            case 'Inactivo':
                return <Badge variant="secondary" className="bg-amber-50 text-amber-600 border border-amber-200 gap-1 font-bold shadow-sm"><AlertCircle className="w-3 h-3" /> {status === 'Inactivo' ? 'Inactivo' : 'Pendiente'}</Badge>;
            case 'Vencido':
                return <Badge variant="destructive" className="bg-rose-50 text-rose-600 border border-rose-200 gap-1 font-bold shadow-sm"><AlertCircle className="w-3 h-3" /> Vencido</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] -m-6 p-8 font-sans text-slate-900 pb-20">
            {/* Page Header (Matching Contexto) */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-[900] text-slate-900 tracking-tight uppercase">Apoyo y Recursos</h1>
                        <button
                            onClick={() => setShowISOInfo(true)}
                            className="p-1.5 rounded-full hover:bg-blue-50 text-blue-400 hover:text-blue-600 transition-all active:scale-95"
                            title="Ver información normativa ISO 9001:2015"
                        >
                            <HelpCircle className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="bg-[#136dec]/10 text-[#136dec] text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">Cláusula 7.1</span>
                        <span className="text-slate-500 text-xs font-semibold uppercase tracking-widest">Gestión de Apoyo</span>
                        <div className="w-px h-4 bg-slate-300 mx-1"></div>
                        <div className="flex items-center gap-2 group cursor-pointer">
                            <span className="bg-white border border-slate-200 text-slate-600 text-[10px] font-bold px-2 py-1 rounded shadow-sm uppercase group-hover:border-blue-400 group-hover:text-blue-600 transition-colors">Código: SIG-REC-01</span>
                        </div>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="personas" className="space-y-6">
                <TabsList className="bg-white p-1.5 border border-slate-200 h-auto flex flex-wrap gap-1.5 justify-start rounded-xl shadow-sm">
                    <TabsTrigger value="generalidades" className="gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wide data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all rounded-lg"><Info className="w-4 h-4" /> 7.1.1 Generalidades</TabsTrigger>
                    <TabsTrigger value="personas" className="gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wide data-[state=active]:bg-[#136dec] data-[state=active]:text-white transition-all rounded-lg"><UsersIcon className="w-4 h-4" /> 7.1.2 Personas</TabsTrigger>
                    <TabsTrigger value="infraestructura" className="gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wide data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all rounded-lg"><Building2 className="w-4 h-4" /> 7.1.3 Infra</TabsTrigger>
                    <TabsTrigger value="ambiente" className="gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wide data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all rounded-lg"><Thermometer className="w-4 h-4" /> 7.1.4 Ambiente</TabsTrigger>
                    <TabsTrigger value="medicion" className="gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wide data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all rounded-lg"><Ruler className="w-4 h-4" /> 7.1.5 Medición</TabsTrigger>
                    <TabsTrigger value="conocimientos" className="gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wide data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all rounded-lg"><BookOpen className="w-4 h-4" /> 7.1.6 Conocimientos</TabsTrigger>
                </TabsList>

                {/* 7.1.2 PERSONAS (REDISEÑO PRINCIPAL) */}
                <TabsContent value="personas" className="space-y-6 mt-6">
                    {/* Header Personas */}
                    <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                                <UsersIcon className="h-6 w-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Gestión de Personas (IAM)</h2>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Numeral 7.1.2 — Determinación y provisión de personal</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex flex-col items-end">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Cargos Estructurados</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl font-black text-slate-800">{cargos.length}</span>
                                    <span className="text-xs text-emerald-500 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">100% Cubiertos</span>
                                </div>
                            </div>
                            <div className="w-px h-12 bg-slate-200"></div>
                            <div className="flex flex-col items-end">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Usuarios Activos</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl font-black text-[#136dec]">{usuarios.filter(u => u.status === 'Activo').length}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sub-Tabs Personas */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="border-b border-slate-100 bg-slate-50/50 flex">
                            <button 
                                onClick={() => setActivePersonasTab('organigrama')}
                                className={cn(
                                    "flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all border-b-2 flex items-center justify-center gap-2",
                                    activePersonasTab === 'organigrama' ? "border-[#136dec] text-[#136dec] bg-white" : "border-transparent text-slate-500 hover:bg-slate-100"
                                )}
                            >
                                <Building className="w-4 h-4" /> La Estructura (Cargos)
                            </button>
                            <button 
                                onClick={() => setActivePersonasTab('usuarios')}
                                className={cn(
                                    "flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all border-b-2 flex items-center justify-center gap-2",
                                    activePersonasTab === 'usuarios' ? "border-[#136dec] text-[#136dec] bg-white" : "border-transparent text-slate-500 hover:bg-slate-100"
                                )}
                            >
                                <UserPlus className="w-4 h-4" /> Las Personas (Usuarios)
                            </button>
                            <button 
                                onClick={() => setActivePersonasTab('permisos')}
                                className={cn(
                                    "flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all border-b-2 flex items-center justify-center gap-2",
                                    activePersonasTab === 'permisos' ? "border-[#136dec] text-[#136dec] bg-white" : "border-transparent text-slate-500 hover:bg-slate-100"
                                )}
                            >
                                <KeyRound className="w-4 h-4" /> El Control (Permisos)
                            </button>
                        </div>

                        <div className="p-6">
                            {/* PESTAÑA 1: ORGANIGRAMA / CARGOS */}
                            {activePersonasTab === 'organigrama' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="flex justify-between items-center">
                                        <p className="text-sm font-medium text-slate-500 max-w-2xl">
                                            Define la estructura organizacional antes de asignar usuarios. Cada cargo creado servirá como base para definir responsabilidades (Num 5.3) y asignar accesos.
                                        </p>
                                        <Button 
                                            onClick={() => setShowNewCargoModal(true)}
                                            className="bg-[#136dec] hover:bg-blue-700 text-white font-bold uppercase text-xs tracking-wider shadow-lg shadow-blue-600/20 h-10 px-6 rounded-xl"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Crear Perfil de Cargo
                                        </Button>
                                    </div>

                                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="bg-slate-50 border-b border-slate-200">
                                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Nombre del Cargo</th>
                                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Macroproceso (4.4)</th>
                                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Jefe Inmediato</th>
                                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Personas Asignadas</th>
                                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 bg-white">
                                                {cargos.map((cargo) => (
                                                    <tr key={cargo.id} className="hover:bg-slate-50 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="font-bold text-slate-800">{cargo.name}</div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <Badge variant="outline" className="bg-slate-50 font-bold border-slate-200 text-slate-600 uppercase text-[9px] tracking-wider">{cargo.process}</Badge>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-slate-600 font-medium">{cargo.jefe}</td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className="inline-flex items-center justify-center bg-blue-50 text-blue-600 font-black text-xs h-6 w-6 rounded-full">{cargo.count}</span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-[#136dec] hover:bg-blue-50">
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* PESTAÑA 2: USUARIOS / COLABORADORES */}
                            {activePersonasTab === 'usuarios' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                <Input placeholder="Buscar por nombre o correo..." className="pl-9 w-64 h-10 border-slate-200 bg-slate-50 focus-visible:ring-[#136dec] rounded-xl text-sm" />
                                            </div>
                                            <Select defaultValue="all">
                                                <SelectTrigger className="w-[180px] h-10 border-slate-200 bg-slate-50 rounded-xl text-sm font-medium">
                                                    <SelectValue placeholder="Filtrar por Proceso" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">Todos los Procesos</SelectItem>
                                                    <SelectItem value="prod">Misionales</SelectItem>
                                                    <SelectItem value="strat">Estratégicos</SelectItem>
                                                    <SelectItem value="eval">Evaluación</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Button variant="outline" className="h-10 px-4 text-xs font-bold uppercase tracking-wider border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-emerald-600 rounded-xl shadow-sm">
                                                <Upload className="w-4 h-4 mr-2" /> Cargar Excel
                                            </Button>
                                            <Button 
                                                onClick={() => setShowNewUserModal(true)}
                                                className="bg-[#136dec] hover:bg-blue-700 text-white font-bold uppercase text-xs tracking-wider shadow-lg shadow-blue-600/20 h-10 px-6 rounded-xl"
                                            >
                                                <UserPlus className="w-4 h-4 mr-2" />
                                                Nuevo Usuario
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="bg-slate-50 border-b border-slate-200">
                                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Usuario</th>
                                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Cargo Asignado</th>
                                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Fecha Ingreso</th>
                                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Firma</th>
                                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Estado</th>
                                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Detalle</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 bg-white">
                                                {usuarios.map((usr) => (
                                                    <tr key={usr.id} className="hover:bg-slate-50 transition-colors group">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-black text-xs border border-indigo-200">
                                                                    {usr.name.split(' ').map(n => n[0]).join('')}
                                                                </div>
                                                                <div>
                                                                    <div className="font-bold text-slate-800 text-sm">{usr.name}</div>
                                                                    <div className="text-xs text-slate-500">{usr.email}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="text-sm font-semibold text-slate-700">{usr.cargo}</span>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-slate-500 font-medium">{usr.date}</td>
                                                        <td className="px-6 py-4">
                                                            {usr.status === 'Activo' ? 
                                                                <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-none font-bold text-[9px] uppercase"><Check className="w-3 h-3 mr-1"/> Registrada</Badge> 
                                                                : <Badge variant="outline" className="text-slate-400 border-dashed text-[9px] uppercase font-bold">Pendiente</Badge>
                                                            }
                                                        </td>
                                                        <td className="px-6 py-4">{getStatusBadge(usr.status)}</td>
                                                        <td className="px-6 py-4 text-right">
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-[#136dec] hover:bg-blue-50">
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* PESTAÑA 3: MATRIZ DE PERMISOS */}
                            {activePersonasTab === 'permisos' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="flex justify-between items-center bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                        <div className="flex items-start gap-3">
                                            <ShieldAlert className="w-5 h-5 text-blue-600 mt-0.5" />
                                            <div>
                                                <h4 className="font-bold text-blue-900 text-sm">Control de Accesos (RBAC)</h4>
                                                <p className="text-xs text-blue-700 mt-1 max-w-3xl leading-relaxed">
                                                    Garantice la integridad de su SGC definiendo qué puede hacer cada cargo dentro del sistema corporativo. 
                                                    Los usuarios heredarán automáticamente los permisos del cargo que tengan asignado.
                                                </p>
                                            </div>
                                        </div>
                                        <Button 
                                            onClick={saveMatrix}
                                            className="bg-slate-900 hover:bg-slate-800 text-white font-bold uppercase text-[10px] tracking-widest h-10 px-6 rounded-xl"
                                        >
                                            Guardar Matriz
                                        </Button>
                                    </div>

                                    <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
                                        <table className="w-full text-left bg-white border-collapse min-w-[800px]">
                                            <thead>
                                                <tr className="bg-slate-800 text-white">
                                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest w-[200px] border-r border-slate-700">CARGO \ MÓDULO</th>
                                                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-center border-r border-slate-700">G. Documental</th>
                                                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-center border-r border-slate-700">Indicadores</th>
                                                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-center border-r border-slate-700">Auditorías</th>
                                                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-center">Riesgos</th>
                                                </tr>
                                                <tr className="bg-slate-700 text-slate-300 border-b border-slate-600">
                                                    <th className="px-6 py-2 border-r border-slate-600"></th>
                                                    {['G. Documental', 'Indicadores', 'Auditorías', 'Riesgos'].map((mod, i) => (
                                                        <th key={i} className="px-2 py-2 border-r border-slate-600 last:border-0">
                                                            <div className="flex justify-around text-[9px] font-black uppercase">
                                                                <span title="Leer">L</span>
                                                                <span title="Crear">C</span>
                                                                <span title="Modificar">M</span>
                                                                <span title="Aprobar" className="text-emerald-400">A</span>
                                                                <span title="Eliminar" className="text-rose-400">E</span>
                                                            </div>
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {cargos.map((cargo) => (
                                                    <tr key={cargo.id} className="hover:bg-slate-50">
                                                        <td className="px-6 py-4 border-r border-slate-100 font-bold text-slate-700 text-sm">
                                                            {cargo.name}
                                                        </td>
                                                        {['G. Documental', 'Indicadores', 'Auditorías', 'Riesgos'].map((mod) => (
                                                            <td key={mod} className="px-2 py-4 border-r border-slate-100 last:border-0">
                                                                <div className="flex justify-around items-center">
                                                                    {['L', 'C', 'M', 'A', 'E'].map(p => (
                                                                        <Checkbox 
                                                                            key={p}
                                                                            checked={(permissions[cargo.name]?.[mod] || []).includes(p)}
                                                                            onCheckedChange={(checked) => handlePermissionChange(cargo.name, mod, p, checked as boolean)}
                                                                            className={cn(
                                                                                "border-slate-300",
                                                                                p === 'A' && "data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500",
                                                                                p === 'E' && "data-[state=checked]:bg-rose-500 data-[state=checked]:border-rose-500"
                                                                            )} 
                                                                        />
                                                                    ))}
                                                                </div>
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="p-6 bg-slate-50 border-x border-b border-slate-200 rounded-b-xl">
                                        <div className="flex items-center gap-12 justify-center">
                                            {[
                                                { l: 'L', d: 'Leer', c: 'text-slate-600', desc: 'Ver registros' },
                                                { l: 'C', d: 'Crear', c: 'text-slate-600', desc: 'Registrar nuevos' },
                                                { l: 'M', d: 'Modificar', c: 'text-slate-600', desc: 'Editar existentes' },
                                                { l: 'A', d: 'Aprobar', c: 'text-emerald-600', desc: 'Firmar oficial' },
                                                { l: 'E', d: 'Eliminar', c: 'text-rose-600', desc: 'Borrar rastro' }
                                            ].map(leg => (
                                                <div key={leg.l} className="flex items-center gap-3">
                                                    <span className={cn("flex items-center justify-center h-6 w-6 rounded-md bg-white border border-slate-200 text-[11px] font-black italic shadow-sm", leg.c)}>{leg.l}</span>
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-700 leading-none">{leg.d}</p>
                                                        <p className="text-[9px] text-slate-400 font-medium grayscale opacity-70 leading-none mt-1">{leg.desc}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </TabsContent>

                {/* 7.1.1 GENERALIDADES (Stylized stub) */}
                <TabsContent value="generalidades" className="space-y-4 mt-6">
                    <Card className="border-2 border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white">
                        <CardHeader className="bg-slate-50 border-b border-slate-100 px-6 py-5">
                            <CardTitle className="text-lg font-black text-slate-800 uppercase tracking-tight">7.1.1 Generalidades de los Recursos</CardTitle>
                            <CardDescription className="text-xs font-bold uppercase tracking-widest text-slate-500 mt-1">Capacidad y limitaciones organizacionales</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-6 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                                    <h4 className="font-black text-xs uppercase tracking-widest mb-3 text-indigo-900 border-b border-indigo-200 pb-2 flex items-center gap-2"><Building2 className="w-4 h-4"/> Capacidades Internas</h4>
                                    <p className="text-sm text-indigo-700/80 leading-relaxed font-medium">
                                        Análisis de los recursos que la organización puede proporcionar por sus propios medios para establecer, implementar y mantener el SGC.
                                    </p>
                                </div>
                                <div className="p-6 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                                    <h4 className="font-black text-xs uppercase tracking-widest mb-3 text-emerald-900 border-b border-emerald-200 pb-2 flex items-center gap-2"><UsersIcon className="w-4 h-4"/> Proveedores Externos</h4>
                                    <p className="text-sm text-emerald-700/80 leading-relaxed font-medium">
                                        Identificación de aquellos recursos que deben obtenerse de proveedores externos garantizando la continuidad operativa.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* 7.1.3 INFRAESTRUCTURA */}
                <TabsContent value="infraestructura" className="space-y-4 mt-6">
                    <Card className="border-none shadow-sm bg-white border border-slate-200 rounded-2xl">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 p-6">
                            <div>
                                <CardTitle className="text-lg font-black uppercase text-slate-800 tracking-tight">Inventario de Infraestructura</CardTitle>
                                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-1">Numeral 7.1.3</p>
                            </div>
                            <Button className="bg-slate-900 hover:bg-slate-800 text-white font-bold uppercase text-xs h-10 px-6 rounded-xl gap-2 tracking-wider">
                                <Plus className="w-4 h-4" /> Nuevo Activo
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 font-medium">
                                    <tr className="border-b border-slate-100">
                                        <th className="p-4 px-6 text-[10px] font-black uppercase tracking-widest">Código</th>
                                        <th className="p-4 text-[10px] font-black uppercase tracking-widest">Nombre del Activo</th>
                                        <th className="p-4 text-[10px] font-black uppercase tracking-widest">Tipo</th>
                                        <th className="p-4 text-[10px] font-black uppercase tracking-widest">Estado</th>
                                        <th className="p-4 text-[10px] font-black uppercase tracking-widest">Responsable</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {mockInfra.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="p-4 px-6 font-black text-slate-700 tracking-wider text-xs">{item.id}</td>
                                            <td className="p-4 font-bold text-slate-800">{item.name}</td>
                                            <td className="p-4"><Badge variant="outline" className="font-bold text-[9px] uppercase">{item.type}</Badge></td>
                                            <td className="p-4">{getStatusBadge(item.status)}</td>
                                            <td className="p-4 font-medium text-slate-600 text-xs">{item.responsible}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Additional tabs stubs (Ambiente, Medicion, Conocimientos) matching styles... */}
                {/* 7.1.4 AMBIENTE */}
                <TabsContent value="ambiente" className="space-y-4 mt-6">
                    <Card className="border border-slate-200 shadow-sm rounded-2xl bg-white overflow-hidden">
                        <CardHeader className="bg-slate-50 border-b border-slate-100 p-6">
                            <CardTitle className="text-lg font-black uppercase text-slate-800 tracking-tight">Ambiente de Operación</CardTitle>
                            <CardDescription className="text-xs font-bold uppercase tracking-widest text-slate-500 mt-1">Factores sociales, psicológicos y físicos (7.1.4)</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-center p-12 text-center text-slate-400 flex-col gap-4">
                                <Thermometer className="w-12 h-12 text-slate-200"/>
                                <p className="font-bold uppercase tracking-widest text-xs">Módulo en construcción o pendiente de registro</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="medicion" className="space-y-4 mt-6">
                     <Card className="border border-slate-200 shadow-sm rounded-2xl bg-white overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 p-6">
                            <div>
                                <CardTitle className="text-lg font-black uppercase text-slate-800 tracking-tight">Equipos de Medición</CardTitle>
                                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-1">Control de calibración (7.1.5)</p>
                            </div>
                             <Button variant="outline" className="font-bold uppercase text-xs h-10 px-6 rounded-xl gap-2 tracking-wider border-slate-200 text-slate-600">
                                <Ruler className="w-4 h-4" /> Plan Control
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                                    <tr>
                                        <th className="p-4 px-6 text-[10px] font-black uppercase tracking-widest">Equipo</th>
                                        <th className="p-4 text-[10px] font-black uppercase tracking-widest">Próx. Calibración</th>
                                        <th className="p-4 text-[10px] font-black uppercase tracking-widest">Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {mockMeasurement.map(eq => (
                                        <tr key={eq.id} className="border-b last:border-0 border-slate-100">
                                            <td className="p-4 px-6 font-bold">{eq.name} <span className="text-xs text-slate-400 font-normal ml-2">{eq.brand}</span></td>
                                            <td className="p-4 font-mono text-xs">{eq.nextCal}</td>
                                            <td className="p-4">{getStatusBadge(eq.status)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="conocimientos" className="space-y-4 mt-6">
                     <Card className="border border-slate-200 shadow-sm rounded-2xl bg-white overflow-hidden">
                        <CardHeader className="bg-slate-50 border-b border-slate-100 p-6">
                            <CardTitle className="text-lg font-black uppercase text-slate-800 tracking-tight">Conocimientos de la Organización</CardTitle>
                            <CardDescription className="text-xs font-bold uppercase tracking-widest text-slate-500 mt-1">Capital intelectual (7.1.6)</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-center p-12 text-center text-slate-400 flex-col gap-4">
                                <BookOpen className="w-12 h-12 text-slate-200"/>
                                <p className="font-bold uppercase tracking-widest text-xs">Módulo pendiente de poblar</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

            </Tabs>

            {/* DIALOG CREAR USUARIO */}
            <Dialog open={showNewUserModal} onOpenChange={setShowNewUserModal}>
                <DialogContent className="max-w-md border-none shadow-2xl rounded-3xl p-0 overflow-hidden font-sans">
                    <header className="bg-indigo-900 text-white p-8">
                        <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">Nuevo Colaborador</DialogTitle>
                        <DialogDescription className="text-indigo-400 font-bold uppercase tracking-widest text-[10px] mt-2">Gestión de identidad y acceso (ISO 7.1.2)</DialogDescription>
                    </header>
                    
                    <div className="p-8 space-y-6 bg-white">
                        <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Nombre Completo *</label>
                             <Input 
                                placeholder="Ej: Eduardo Caicedo" 
                                className="h-11 bg-slate-50 border-none rounded-xl font-bold focus-visible:ring-indigo-500"
                                value={newUser.name}
                                onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                             />
                        </div>

                        <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Correo Electrónico *</label>
                             <Input 
                                type="email"
                                placeholder="usuario@empresa.com" 
                                className="h-11 bg-slate-50 border-none rounded-xl font-bold focus-visible:ring-indigo-500"
                                value={newUser.email}
                                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                             />
                        </div>

                        <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Cargo a Asignar *</label>
                             <Select value={newUser.cargo} onValueChange={(v) => setNewUser({...newUser, cargo: v})}>
                                <SelectTrigger className="h-11 bg-slate-50 border-none rounded-xl font-bold">
                                    <SelectValue placeholder="Seleccione un cargo..." />
                                </SelectTrigger>
                                <SelectContent className="font-sans">
                                    {cargos.map((c) => (
                                        <SelectItem key={c.id} value={c.name} className="font-bold">
                                            {c.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                             </Select>
                        </div>
                    </div>

                    <DialogFooter className="p-8 pt-0 bg-white">
                        <Button 
                            variant="ghost" 
                            className="font-bold uppercase text-[10px] tracking-widest text-slate-400 hover:text-slate-600"
                            onClick={() => setShowNewUserModal(false)}
                        >
                            Ignorar
                        </Button>
                        <Button 
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-xs h-12 px-10 rounded-2xl shadow-xl shadow-indigo-600/20"
                            onClick={() => {
                                if(!newUser.name || !newUser.email || !newUser.cargo) {
                                    toast.error("Complete todos los campos obligatorios");
                                    return;
                                }
                                setUsuarios([...usuarios, { ...newUser, id: `u-${Date.now()}`, date: new Date().toLocaleDateString() } as any]);
                                setShowNewUserModal(false);
                                setNewUser({ name: '', email: '', cargo: '', status: 'Activo' });
                                toast.success("Colaborador registrado correctamente");
                            }}
                        >
                            Vincular Persona
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* DIALOG CREAR CARGO */}
            <Dialog open={showNewCargoModal} onOpenChange={setShowNewCargoModal}>
                <DialogContent className="max-w-md border-none shadow-2xl rounded-3xl p-0 overflow-hidden font-sans">
                    <DialogHeader className="bg-slate-900 text-white p-8">
                        <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">Nuevo Perfil de Cargo</DialogTitle>
                        <DialogDescription className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">Definición de estructura organizacional (ISO 7.1.2)</DialogDescription>
                    </DialogHeader>
                    
                    <div className="p-8 space-y-6 bg-white">
                        <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Nombre del Cargo *</label>
                             <Input 
                                placeholder="Ej: Jefe de Producción" 
                                className="h-11 bg-slate-50 border-none rounded-xl font-bold focus-visible:ring-blue-500"
                                value={newCargo.name}
                                onChange={(e) => setNewCargo({...newCargo, name: e.target.value})}
                             />
                        </div>

                        <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Macroproceso Asociado *</label>
                             <Select value={newCargo.process} onValueChange={(v) => setNewCargo({...newCargo, process: v})}>
                                <SelectTrigger className="h-11 bg-slate-50 border-none rounded-xl font-bold">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="font-sans">
                                    <SelectItem value="Estratégico" className="font-bold">Estratégico</SelectItem>
                                    <SelectItem value="Misional" className="font-bold">Misional</SelectItem>
                                    <SelectItem value="Apoyo" className="font-bold">Apoyo</SelectItem>
                                    <SelectItem value="Evaluación" className="font-bold">Evaluación</SelectItem>
                                </SelectContent>
                             </Select>
                        </div>

                        <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Jefe Inmediato *</label>
                             <Select value={newCargo.jefe} onValueChange={(v) => setNewCargo({...newCargo, jefe: v})}>
                                <SelectTrigger className="h-11 bg-slate-50 border-none rounded-xl font-bold">
                                    <SelectValue placeholder="Seleccione el jefe inmediato..." />
                                </SelectTrigger>
                                <SelectContent className="font-sans">
                                    <SelectItem value="N/A (Nivel Superior)" className="font-bold text-blue-600 italic underline">N/A (Nivel Superior)</SelectItem>
                                    <Separator className="my-2" />
                                    {cargos.map((c) => (
                                        <SelectItem key={c.id} value={c.name} className="font-bold">
                                            {c.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                             </Select>
                        </div>
                    </div>

                    <DialogFooter className="p-8 pt-0 bg-white">
                        <Button 
                            variant="ghost" 
                            className="font-bold uppercase text-[10px] tracking-widest text-slate-400 hover:text-slate-600"
                            onClick={() => setShowNewCargoModal(false)}
                        >
                            Ignorar
                        </Button>
                        <Button 
                            className="bg-[#136dec] hover:bg-blue-700 text-white font-black uppercase text-xs h-12 px-10 rounded-2xl shadow-xl shadow-blue-600/20"
                            onClick={() => {
                                if(!newCargo.name || !newCargo.jefe) {
                                    toast.error("Complete los campos obligatorios");
                                    return;
                                }
                                setCargos([...cargos, { ...newCargo, id: `c-${Date.now()}`, count: 0 }]);
                                
                                // Inicializar permisos para el nuevo cargo
                                setPermissions(prev => ({
                                    ...prev,
                                    [newCargo.name]: {
                                        'G. Documental': ['L'],
                                        'Indicadores': ['L'],
                                        'Auditorías': ['L'],
                                        'Riesgos': ['L']
                                    }
                                }));

                                setShowNewCargoModal(false);
                                setNewCargo({ name: '', process: 'Misional', jefe: '' });
                                toast.success("Perfil de cargo creado correctamente");
                            }}
                        >
                            Guardar Perfil
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ISO Info Dialog */}
            <Dialog open={showISOInfo} onOpenChange={setShowISOInfo}>
                <DialogContent className="w-[70vw] sm:max-w-[70vw] bg-white border border-gray-200 shadow-sm rounded-3xl overflow-hidden flex flex-col p-0 gap-0 font-sans">
                    <header className="px-6 pt-8 pb-4 border-b border-gray-50 bg-white">
                        <div className="flex flex-col gap-2">
                            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">7.1 Recursos</h1>
                            <h2 className="text-lg font-medium text-blue-600 uppercase tracking-widest">ISO 9001:2015 Requerimientos</h2>
                        </div>
                    </header>
                    <div className="px-6 pt-4 pb-8 space-y-6 bg-white overflow-y-auto max-h-[60vh]">
                        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 space-y-4">
                            <p className="text-lg text-gray-800 leading-relaxed italic">
                                La organización <strong className="font-black text-gray-900 not-italic uppercase">debe</strong> determinar y proporcionar los recursos necesarios para el establecimiento, implementación, mantenimiento y mejora continua del SGC.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-slate-700 font-medium text-sm">
                                <div className="p-3 bg-white rounded-xl border border-blue-100 flex gap-3">
                                    <span className="font-black text-blue-600">7.1.2</span>
                                    <span>Personas: La organización debe proporcionar las personas necesarias para la operación eficaz del SGC.</span>
                                </div>
                                <div className="p-3 bg-white rounded-xl border border-blue-100 flex gap-3">
                                    <span className="font-black text-blue-600">7.1.3</span>
                                    <span>Infraestructura: Mantener edificios, equipos, transporte y TIC.</span>
                                </div>
                                <div className="p-3 bg-white rounded-xl border border-blue-100 flex gap-3">
                                    <span className="font-black text-blue-600">7.1.4</span>
                                    <span>Ambiente para la operación: Factores sociales, psicológicos y físicos.</span>
                                </div>
                                <div className="p-3 bg-white rounded-xl border border-blue-100 flex gap-3">
                                    <span className="font-black text-blue-600">7.1.5</span>
                                    <span>Recursos de Seguimiento y Medición.</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <footer className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex justify-end items-center">
                        <Button onClick={() => setShowISOInfo(false)} className="bg-slate-900 hover:bg-black text-white font-black py-3 px-10 rounded shadow-md h-auto uppercase tracking-wider text-xs">Entendido</Button>
                    </footer>
                </DialogContent>
            </Dialog>
        </div>
    );
}
