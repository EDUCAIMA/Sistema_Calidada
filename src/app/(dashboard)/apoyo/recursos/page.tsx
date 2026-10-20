"use client";

import { ModulePage, ModuleHeader, ModuleContent } from "@/components/sgc/module-layout";

import React, { useState, useEffect } from 'react';
import { Building2, Plus, Search, Edit, Eye, CheckCircle2, AlertCircle, Users as UsersIcon, Thermometer, Ruler, BookOpen, Info, HelpCircle, Upload, ShieldAlert, UserPlus, Building, KeyRound, Check } from 'lucide-react';
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
        } catch {
            toast.error("Error al guardar la matriz");
        }
    };

    // Cargar matriz guardada al montar
    useEffect(() => {
        const saved = localStorage.getItem('sig_permissions_matrix');
        if (saved) {
            try {
                // Rehidratar la matriz local después del montaje evita diferencias con el HTML del servidor.
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setPermissions(JSON.parse(saved));
            } catch {
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
        <ModulePage>
            {/* Page Header (Matching Contexto) */}
            <ModuleHeader
                clause="7.1"
                title="Recursos"
                description="Gestione las personas, la infraestructura y los recursos necesarios para el sistema de gestión. Código: SIG-REC-01."
                actions={<>

                    <Button variant="outline" aria-label="Ver información normativa ISO 9001:2015" title="Ver información normativa ISO 9001:2015" onClick={() => setShowISOInfo(true)}>
                        <HelpCircle className="h-4 w-4" /> Información ISO
                    </Button>
                </>}
            />
            <ModuleContent>

            <Tabs defaultValue="personas" className="space-y-6">
                <TabsList className="p-1.5 border border-slate-100 h-auto flex flex-wrap justify-start rounded-xl shadow-sm w-full gap-2 bg-slate-50">
                    <TabsTrigger value="generalidades" className="gap-2 px-4 py-2.5 transition-all min-h-11 rounded-xl text-sm font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm"><Info className="w-4 h-4" /> 7.1.1 Generalidades</TabsTrigger>
                    <TabsTrigger value="personas" className="gap-2 px-4 py-2.5 transition-all min-h-11 rounded-xl text-sm font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm"><UsersIcon className="w-4 h-4" /> 7.1.2 Personas</TabsTrigger>
                    <TabsTrigger value="infraestructura" className="gap-2 px-4 py-2.5 transition-all min-h-11 rounded-xl text-sm font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm"><Building2 className="w-4 h-4" /> 7.1.3 Infra</TabsTrigger>
                    <TabsTrigger value="ambiente" className="gap-2 px-4 py-2.5 transition-all min-h-11 rounded-xl text-sm font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm"><Thermometer className="w-4 h-4" /> 7.1.4 Ambiente</TabsTrigger>
                    <TabsTrigger value="medicion" className="gap-2 px-4 py-2.5 transition-all min-h-11 rounded-xl text-sm font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm"><Ruler className="w-4 h-4" /> 7.1.5 Medición</TabsTrigger>
                    <TabsTrigger value="conocimientos" className="gap-2 px-4 py-2.5 transition-all min-h-11 rounded-xl text-sm font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm"><BookOpen className="w-4 h-4" /> 7.1.6 Conocimientos</TabsTrigger>
                </TabsList>

                {/* 7.1.2 PERSONAS (REDISEÑO PRINCIPAL) */}
                <TabsContent value="personas" className="space-y-6 mt-6">
                    {/* Header Personas */}
                    <div className="flex flex-col gap-5 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6 xl:flex-row xl:items-center xl:justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                                <UsersIcon className="h-6 w-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-slate-800">Gestión de Personas (IAM)</h2>
                                <p className="text-xs font-bold text-slate-500 mt-1">Numeral 7.1.2 — Determinación y provisión de personal</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex flex-col items-end">
                                <p className="text-xs font-bold text-slate-400 mb-1">Cargos Estructurados</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl font-semibold text-slate-800">{cargos.length}</span>
                                    <span className="text-xs text-emerald-500 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">100% Cubiertos</span>
                                </div>
                            </div>
                            <div className="w-px h-12 bg-slate-200"></div>
                            <div className="flex flex-col items-end">
                                <p className="text-xs font-bold text-slate-400 mb-1">Usuarios Activos</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl font-semibold text-blue-600">{usuarios.filter(u => u.status === 'Activo').length}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sub-Tabs Personas */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="flex flex-wrap gap-2 border-b border-slate-100 bg-slate-50/50 p-2">
                            <button
                                onClick={() => setActivePersonasTab('organigrama')}
                                className={cn(
                                    "flex-1 py-4 transition-all border-b-2 flex items-center justify-center gap-2 h-11 rounded-xl font-medium text-sm",
                                    activePersonasTab === 'organigrama' ? "border-blue-600 text-blue-600 bg-white h-11 rounded-xl font-medium text-sm" : "border-transparent text-slate-500 hover:bg-slate-100 h-11 rounded-xl font-medium text-sm"
                                )}
                            >
                                <Building className="w-4 h-4" /> La Estructura (Cargos)
                            </button>
                            <button
                                onClick={() => setActivePersonasTab('usuarios')}
                                className={cn(
                                    "flex-1 py-4 transition-all border-b-2 flex items-center justify-center gap-2 h-11 rounded-xl font-medium text-sm",
                                    activePersonasTab === 'usuarios' ? "border-blue-600 text-blue-600 bg-white h-11 rounded-xl font-medium text-sm" : "border-transparent text-slate-500 hover:bg-slate-100 h-11 rounded-xl font-medium text-sm"
                                )}
                            >
                                <UserPlus className="w-4 h-4" /> Las Personas (Usuarios)
                            </button>
                            <button
                                onClick={() => setActivePersonasTab('permisos')}
                                className={cn(
                                    "flex-1 py-4 transition-all border-b-2 flex items-center justify-center gap-2 h-11 rounded-xl font-medium text-sm",
                                    activePersonasTab === 'permisos' ? "border-blue-600 text-blue-600 bg-white h-11 rounded-xl font-medium text-sm" : "border-transparent text-slate-500 hover:bg-slate-100 h-11 rounded-xl font-medium text-sm"
                                )}
                            >
                                <KeyRound className="w-4 h-4" /> El Control (Permisos)
                            </button>
                        </div>

                        <div className="p-6">
                            {/* PESTAÑA 1: ORGANIGRAMA / CARGOS */}
                            {activePersonasTab === 'organigrama' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="flex justify-between items-center flex-wrap gap-3">
                                        <p className="text-sm font-medium text-slate-500 max-w-2xl">
                                            Define la estructura organizacional antes de asignar usuarios. Cada cargo creado servirá como base para definir responsabilidades (Num 5.3) y asignar accesos.
                                        </p>
                                        <Button
                                            onClick={() => setShowNewCargoModal(true)}
                                            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm px-6 rounded-xl h-11 font-medium text-sm"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Crear Perfil de Cargo
                                        </Button>
                                    </div>

                                    <div className="overflow-x-auto rounded-xl border border-slate-100">
                                        <table className="w-full min-w-[640px] text-left text-sm">
                                            <thead>
                                                <tr className="bg-slate-50 border-b border-slate-100">
                                                    <th className="px-6 py-4 font-semibold text-sm text-slate-600">Nombre del Cargo</th>
                                                    <th className="px-6 py-4 font-semibold text-sm text-slate-600">Macroproceso (4.4)</th>
                                                    <th className="px-6 py-4 font-semibold text-sm text-slate-600">Jefe Inmediato</th>
                                                    <th className="px-6 py-4 font-semibold text-center text-sm text-slate-600">Personas Asignadas</th>
                                                    <th className="px-6 py-4 font-semibold text-right text-sm text-slate-600">Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 bg-white">
                                                {cargos.map((cargo) => (
                                                    <tr key={cargo.id} className="hover:bg-slate-50 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="font-bold text-slate-800">{cargo.name}</div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <Badge variant="outline" className="bg-slate-50 font-bold border-slate-100 text-slate-600 text-xs">{cargo.process}</Badge>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-slate-600 font-medium">{cargo.jefe}</td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className="inline-flex items-center justify-center bg-blue-50 text-blue-600 font-semibold text-xs h-6 w-6 rounded-full">{cargo.count}</span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-[#136dec] hover:bg-blue-50 font-medium text-sm">
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
                                                <Input placeholder="Buscar por nombre o correo..." className="pl-9 w-64 focus-visible:ring-[#136dec] rounded-xl h-11 font-medium text-sm border border-slate-200 bg-white" />
                                            </div>
                                            <Select defaultValue="all">
                                                <SelectTrigger className="w-[180px] rounded-xl font-medium h-11 text-sm border border-slate-200 bg-white">
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
                                            <Button variant="outline" className="px-4 border-slate-100 text-slate-600 hover:bg-slate-50 hover:text-emerald-600 rounded-xl shadow-sm h-11 font-medium text-sm">
                                                <Upload className="w-4 h-4 mr-2" /> Cargar Excel
                                            </Button>
                                            <Button
                                                onClick={() => setShowNewUserModal(true)}
                                                className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm px-6 rounded-xl h-11 font-medium text-sm"
                                            >
                                                <UserPlus className="w-4 h-4 mr-2" />
                                                Nuevo Usuario
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto rounded-2xl border border-slate-100 shadow-sm">
                                        <table className="w-full min-w-[720px] text-left text-sm">
                                            <thead>
                                                <tr className="bg-slate-50 border-b border-slate-100">
                                                    <th className="px-6 py-4 font-semibold text-sm text-slate-600">Usuario</th>
                                                    <th className="px-6 py-4 font-semibold text-sm text-slate-600">Cargo Asignado</th>
                                                    <th className="px-6 py-4 font-semibold text-sm text-slate-600">Fecha Ingreso</th>
                                                    <th className="px-6 py-4 font-semibold text-sm text-slate-600">Firma</th>
                                                    <th className="px-6 py-4 font-semibold text-sm text-slate-600">Estado</th>
                                                    <th className="px-6 py-4 font-semibold text-right text-sm text-slate-600">Detalle</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 bg-white">
                                                {usuarios.map((usr) => (
                                                    <tr key={usr.id} className="hover:bg-slate-50 transition-colors group">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-xs border border-indigo-200">
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
                                                                <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-none font-bold text-xs"><Check className="w-3 h-3 mr-1"/> Registrada</Badge>
                                                                : <Badge variant="outline" className="text-slate-400 border-dashed text-xs font-bold">Pendiente</Badge>
                                                            }
                                                        </td>
                                                        <td className="px-6 py-4">{getStatusBadge(usr.status)}</td>
                                                        <td className="px-6 py-4 text-right">
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-[#136dec] hover:bg-blue-50 font-medium text-sm">
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
                                    <div className="flex justify-between items-center bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex-wrap gap-3">
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
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-xl h-11 font-medium text-sm"
                                        >
                                            Guardar Matriz
                                        </Button>
                                    </div>

                                    <div className="border border-slate-100 rounded-xl overflow-x-auto shadow-sm">
                                        <table className="w-full text-left bg-white border-collapse min-w-[800px]">
                                            <thead>
                                                <tr className="bg-slate-50 text-slate-600">
                                                    <th className="w-[200px] border-r border-slate-100 px-6 py-4 text-sm font-semibold">Cargo / Módulo</th>
                                                    <th className="border-r border-slate-100 px-4 py-3 text-center text-sm font-semibold">G. Documental</th>
                                                    <th className="border-r border-slate-100 px-4 py-3 text-center text-sm font-semibold">Indicadores</th>
                                                    <th className="border-r border-slate-100 px-4 py-3 text-center text-sm font-semibold">Auditorías</th>
                                                    <th className="px-4 py-3 font-semibold text-center text-sm text-slate-600">Riesgos</th>
                                                </tr>
                                                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-600">
                                                    <th className="border-r border-slate-100 px-6 py-2 text-sm font-semibold"></th>
                                                    {['G. Documental', 'Indicadores', 'Auditorías', 'Riesgos'].map((mod, i) => (
                                                        <th key={i} className="border-r border-slate-100 px-2 py-2 text-sm font-semibold last:border-0">
                                                            <div className="flex justify-around text-xs font-semibold">
                                                                <span title="Leer">L</span>
                                                                <span title="Crear">C</span>
                                                                <span title="Modificar">M</span>
                                                                <span title="Aprobar" className="text-emerald-700">A</span>
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
                                    <div className="p-6 bg-slate-50 border-x border-b border-slate-100 rounded-b-xl">
                                        <div className="flex items-center gap-12 justify-center">
                                            {[
                                                { l: 'L', d: 'Leer', c: 'text-slate-600', desc: 'Ver registros' },
                                                { l: 'C', d: 'Crear', c: 'text-slate-600', desc: 'Registrar nuevos' },
                                                { l: 'M', d: 'Modificar', c: 'text-slate-600', desc: 'Editar existentes' },
                                                { l: 'A', d: 'Aprobar', c: 'text-emerald-600', desc: 'Firmar oficial' },
                                                { l: 'E', d: 'Eliminar', c: 'text-rose-600', desc: 'Borrar rastro' }
                                            ].map(leg => (
                                                <div key={leg.l} className="flex items-center gap-3">
                                                    <span className={cn("flex items-center justify-center h-6 w-6 rounded-md bg-white border border-slate-100 text-xs font-semibold shadow-sm", leg.c)}>{leg.l}</span>
                                                    <div>
                                                        <p className="text-xs font-semibold text-slate-700 leading-none">{leg.d}</p>
                                                        <p className="text-xs text-slate-400 font-medium grayscale opacity-70 leading-none mt-1">{leg.desc}</p>
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
                    <Card className="border border-slate-100 shadow-sm rounded-2xl overflow-hidden bg-white">
                        <CardHeader className="bg-slate-50 border-b border-slate-100 px-6 py-5">
                            <CardTitle className="text-lg font-semibold text-slate-800">7.1.1 Generalidades de los Recursos</CardTitle>
                            <CardDescription className="text-xs font-bold text-slate-500 mt-1">Capacidad y limitaciones organizacionales</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-6 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                                    <h4 className="font-semibold text-xs mb-3 text-indigo-900 border-b border-indigo-200 pb-2 flex items-center gap-2"><Building2 className="w-4 h-4"/> Capacidades Internas</h4>
                                    <p className="text-sm text-indigo-700/80 leading-relaxed font-medium">
                                        Análisis de los recursos que la organización puede proporcionar por sus propios medios para establecer, implementar y mantener el SGC.
                                    </p>
                                </div>
                                <div className="p-6 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                                    <h4 className="font-semibold text-xs mb-3 text-emerald-900 border-b border-emerald-200 pb-2 flex items-center gap-2"><UsersIcon className="w-4 h-4"/> Proveedores Externos</h4>
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
                    <Card className="shadow-sm bg-white border border-slate-100 rounded-2xl">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 p-6 flex-wrap gap-3">
                            <div>
                                <CardTitle className="text-lg font-semibold text-slate-800">Inventario de Infraestructura</CardTitle>
                                <p className="text-xs font-bold text-slate-400 mt-1">Numeral 7.1.3</p>
                            </div>
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-xl gap-2 h-11 font-medium text-sm">
                                <Plus className="w-4 h-4" /> Nuevo Activo
                            </Button>
                        </CardHeader>
                        <CardContent className="overflow-x-auto p-0">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 font-medium">
                                    <tr className="border-b border-slate-100">
                                        <th className="p-4 px-6 font-semibold text-sm text-slate-600">Código</th>
                                        <th className="p-4 font-semibold text-sm text-slate-600">Nombre del Activo</th>
                                        <th className="p-4 font-semibold text-sm text-slate-600">Tipo</th>
                                        <th className="p-4 font-semibold text-sm text-slate-600">Estado</th>
                                        <th className="p-4 font-semibold text-sm text-slate-600">Responsable</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {mockInfra.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="p-4 px-6 font-semibold text-slate-700 text-xs">{item.id}</td>
                                            <td className="p-4 font-bold text-slate-800">{item.name}</td>
                                            <td className="p-4"><Badge variant="outline" className="font-bold text-xs">{item.type}</Badge></td>
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
                    <Card className="border border-slate-100 shadow-sm rounded-2xl bg-white overflow-hidden">
                        <CardHeader className="bg-slate-50 border-b border-slate-100 p-6">
                            <CardTitle className="text-lg font-semibold text-slate-800">Ambiente de Operación</CardTitle>
                            <CardDescription className="text-xs font-bold text-slate-500 mt-1">Factores sociales, psicológicos y físicos (7.1.4)</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-center p-12 text-center text-slate-400 flex-col gap-4">
                                <Thermometer className="w-12 h-12 text-slate-200"/>
                                <p className="font-bold text-xs">Módulo en construcción o pendiente de registro</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="medicion" className="space-y-4 mt-6">
                     <Card className="border border-slate-100 shadow-sm rounded-2xl bg-white overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 p-6 flex-wrap gap-3">
                            <div>
                                <CardTitle className="text-lg font-semibold text-slate-800">Equipos de Medición</CardTitle>
                                <p className="text-xs font-bold text-slate-400 mt-1">Control de calibración (7.1.5)</p>
                            </div>
                             <Button variant="outline" className="px-6 rounded-xl gap-2 border-slate-100 text-slate-600 h-11 font-medium text-sm">
                                <Ruler className="w-4 h-4" /> Plan Control
                            </Button>
                        </CardHeader>
                        <CardContent className="overflow-x-auto p-0">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                                    <tr>
                                        <th className="p-4 px-6 font-semibold text-sm text-slate-600">Equipo</th>
                                        <th className="p-4 font-semibold text-sm text-slate-600">Próx. Calibración</th>
                                        <th className="p-4 font-semibold text-sm text-slate-600">Estado</th>
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
                     <Card className="border border-slate-100 shadow-sm rounded-2xl bg-white overflow-hidden">
                        <CardHeader className="bg-slate-50 border-b border-slate-100 p-6">
                            <CardTitle className="text-lg font-semibold text-slate-800">Conocimientos de la Organización</CardTitle>
                            <CardDescription className="text-xs font-bold text-slate-500 mt-1">Capital intelectual (7.1.6)</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-center p-12 text-center text-slate-400 flex-col gap-4">
                                <BookOpen className="w-12 h-12 text-slate-200"/>
                                <p className="font-bold text-xs">Módulo pendiente de poblar</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

            </Tabs>

            {/* DIALOG CREAR USUARIO */}
            <Dialog open={showNewUserModal} onOpenChange={setShowNewUserModal}>
                <DialogContent className="max-w-md border-none shadow-2xl p-0 overflow-hidden font-sans w-[calc(100vw-2rem)] max-h-[90vh] rounded-3xl grid grid-rows-[auto_minmax(0,1fr)_auto] gap-0">
                    <header className="border-b border-slate-100 bg-gradient-to-r from-blue-50 via-white to-slate-50 px-4 py-5 pr-11 text-slate-900 sm:px-6 sm:pr-12">
                        <DialogTitle className="text-2xl font-semibold">Nuevo Colaborador</DialogTitle>
                        <DialogDescription className="mt-2 text-sm text-slate-500">Gestión de identidad y acceso (ISO 7.1.2)</DialogDescription>
                    </header>

                    <div className="space-y-5 overflow-y-auto bg-white p-4 sm:p-6">
                        <div className="space-y-2">
                             <label className="font-semibold text-sm text-slate-700">Nombre Completo *</label>
                             <Input
                                placeholder="Ej: Eduardo Caicedo"
                                className="h-11 rounded-xl font-medium text-sm border border-slate-200 bg-white"
                                value={newUser.name}
                                onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                             />
                        </div>

                        <div className="space-y-2">
                             <label className="font-semibold text-sm text-slate-700">Correo Electrónico *</label>
                             <Input
                                type="email"
                                placeholder="usuario@empresa.com"
                                className="h-11 rounded-xl font-medium text-sm border border-slate-200 bg-white"
                                value={newUser.email}
                                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                             />
                        </div>

                        <div className="space-y-2">
                             <label className="font-semibold text-sm text-slate-700">Cargo a Asignar *</label>
                             <Select value={newUser.cargo} onValueChange={(v) => setNewUser({...newUser, cargo: v})}>
                                <SelectTrigger className="h-11 rounded-xl font-medium text-sm border border-slate-200 bg-white">
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

                    <DialogFooter className="border-t border-slate-100 bg-slate-50/50 px-4 py-4 sm:px-6">
                        <Button
                            variant="ghost"
                            className="text-slate-400 hover:text-slate-600 h-11 rounded-xl font-medium text-sm"
                            onClick={() => setShowNewUserModal(false)}
                        >
                            Ignorar
                        </Button>
                        <Button
                            className="bg-blue-600 hover:bg-blue-700 text-white px-10 shadow-xl h-11 rounded-xl font-medium text-sm"
                            onClick={() => {
                                if(!newUser.name || !newUser.email || !newUser.cargo) {
                                    toast.error("Complete todos los campos obligatorios");
                                    return;
                                }
                                setUsuarios([...usuarios, { ...newUser, id: `u-${Date.now()}`, date: new Date().toLocaleDateString() }]);
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
                <DialogContent className="max-w-md border-none shadow-2xl p-0 overflow-hidden font-sans w-[calc(100vw-2rem)] max-h-[90vh] rounded-3xl grid grid-rows-[auto_minmax(0,1fr)_auto] gap-0">
                    <DialogHeader className="border-b border-slate-100 bg-gradient-to-r from-blue-50 via-white to-slate-50 px-4 py-5 pr-11 text-slate-900 sm:px-6 sm:pr-12">
                        <DialogTitle className="text-2xl font-semibold">Nuevo Perfil de Cargo</DialogTitle>
                        <DialogDescription className="mt-2 text-sm text-slate-500">Definición de estructura organizacional (ISO 7.1.2)</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-5 overflow-y-auto bg-white p-4 sm:p-6">
                        <div className="space-y-2">
                             <label className="font-semibold text-sm text-slate-700">Nombre del Cargo *</label>
                             <Input
                                placeholder="Ej: Jefe de Producción"
                                className="h-11 rounded-xl focus-visible:ring-blue-500 font-medium text-sm border border-slate-200 bg-white"
                                value={newCargo.name}
                                onChange={(e) => setNewCargo({...newCargo, name: e.target.value})}
                             />
                        </div>

                        <div className="space-y-2">
                             <label className="font-semibold text-sm text-slate-700">Macroproceso Asociado *</label>
                             <Select value={newCargo.process} onValueChange={(v) => setNewCargo({...newCargo, process: v})}>
                                <SelectTrigger className="h-11 rounded-xl font-medium text-sm border border-slate-200 bg-white">
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
                             <label className="font-semibold text-sm text-slate-700">Jefe Inmediato *</label>
                             <Select value={newCargo.jefe} onValueChange={(v) => setNewCargo({...newCargo, jefe: v})}>
                                <SelectTrigger className="h-11 rounded-xl font-medium text-sm border border-slate-200 bg-white">
                                    <SelectValue placeholder="Seleccione el jefe inmediato..." />
                                </SelectTrigger>
                                <SelectContent className="font-sans">
                                    <SelectItem value="N/A (Nivel Superior)" className="font-bold text-blue-600 underline">N/A (Nivel Superior)</SelectItem>
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

                    <DialogFooter className="border-t border-slate-100 bg-slate-50/50 px-4 py-4 sm:px-6">
                        <Button
                            variant="ghost"
                            className="text-slate-400 hover:text-slate-600 h-11 rounded-xl font-medium text-sm"
                            onClick={() => setShowNewCargoModal(false)}
                        >
                            Ignorar
                        </Button>
                        <Button
                            className="bg-blue-600 hover:bg-blue-700 text-white px-10 shadow-xl h-11 rounded-xl font-medium text-sm"
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
                <DialogContent className="bg-white border border-gray-200 shadow-sm overflow-hidden flex flex-col p-0 gap-0 font-sans w-[calc(100vw-2rem)] max-h-[90vh] sm:max-w-4xl rounded-3xl">
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
                        <Button onClick={() => setShowISOInfo(false)} className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-10 shadow-sm h-11 rounded-xl font-medium text-sm">Entendido</Button>
                    </footer>
                </DialogContent>
            </Dialog>
        </ModuleContent>
        </ModulePage>
    );
}
