"use client";

import React, { useState, useEffect } from 'react';
import {
    Settings, User as UserIcon, Building, Bell, Shield, PaintBucket, Globe, Loader2, CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

export default function ConfiguracionPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [userData, setUserData] = useState<any>(null);
    const [tenantData, setTenantData] = useState<any>(null);

    // Form states
    const [userForm, setUserForm] = useState({
        name: '',
        position: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });

    const [tenantForm, setTenantForm] = useState({
        name: '',
        industry: '',
        timezone: 'America/Bogota',
        currency: 'USD',
        phone: ''
    });

    useEffect(() => {
        const loadData = async () => {
            try {
                const storedUser = localStorage.getItem('sgc_user');
                const storedTenant = localStorage.getItem('sgc_tenant');

                if (storedUser && storedTenant) {
                    const u = JSON.parse(storedUser);
                    const t = JSON.parse(storedTenant);

                    // Fetch fresh data from API
                    const [userRes, tenantRes] = await Promise.all([
                        fetch(`/api/admin/users/${u.id}`),
                        fetch(`/api/admin/tenants/${t.id}`)
                    ]);

                    if (userRes.ok && tenantRes.ok) {
                        const userFull = await userRes.json();
                        const tenantFull = await tenantRes.json();

                        setUserData(userFull);
                        setTenantData(tenantFull);

                        setUserForm({
                            name: userFull.name || '',
                            position: userFull.position || '',
                            phone: userFull.phone || '',
                            password: '',
                            confirmPassword: ''
                        });

                        setTenantForm({
                            name: tenantFull.name || '',
                            industry: tenantFull.industry || '',
                            timezone: tenantFull.timezone || 'America/Bogota',
                            currency: tenantFull.currency || 'USD',
                            phone: tenantFull.phone || ''
                        });
                    }
                }
            } catch (error) {
                console.error('Error loading settings:', error);
                toast.error('Error al cargar la configuración');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    const handleSaveUser = async () => {
        if (userForm.password && userForm.password !== userForm.confirmPassword) {
            toast.error('Las contraseñas no coinciden');
            return;
        }

        setSaving(true);
        try {
            const res = await fetch(`/api/admin/users/${userData.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: userForm.name,
                    position: userForm.position,
                    phone: userForm.phone,
                    ...(userForm.password ? { password: userForm.password } : {})
                })
            });

            if (!res.ok) throw new Error('Error al guardar');
            
            const updated = await res.json();
            setUserData(updated);
            localStorage.setItem('sgc_user', JSON.stringify(updated));
            toast.success('Perfil actualizado correctamente');
        } catch (error) {
            toast.error('Error al actualizar el perfil');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveTenant = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/admin/tenants/${tenantData.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(tenantForm)
            });

            if (!res.ok) throw new Error('Error al guardar');
            
            const updated = await res.json();
            setTenantData(updated);
            localStorage.setItem('sgc_tenant', JSON.stringify(updated));
            toast.success('Configuración de empresa actualizada');
        } catch (error) {
            toast.error('Error al actualizar la empresa');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Configuración</h2>
                    <p className="text-muted-foreground mt-1">
                        Administra los ajustes de tu cuenta y las preferencias del Sistema de Gestión.
                    </p>
                </div>
            </div>

            <Tabs defaultValue="perfil" className="space-y-6">
                <TabsList className="bg-slate-100/50 dark:bg-slate-800/50 border shadow-sm w-full justify-start overflow-x-auto">
                    <TabsTrigger value="perfil" className="data-[state=active]:bg-white data-[state=active]:shadow-sm gap-2">
                        <UserIcon className="w-4 h-4" /> Perfil de Usuario
                    </TabsTrigger>
                    <TabsTrigger value="empresa" className="data-[state=active]:bg-white data-[state=active]:shadow-sm gap-2">
                        <Building className="w-4 h-4" /> Datos de la Empresa
                    </TabsTrigger>
                    <TabsTrigger value="notificaciones" className="data-[state=active]:bg-white data-[state=active]:shadow-sm gap-2">
                        <Bell className="w-4 h-4" /> Notificaciones
                    </TabsTrigger>
                    <TabsTrigger value="seguridad" className="data-[state=active]:bg-white data-[state=active]:shadow-sm gap-2">
                        <Shield className="w-4 h-4" /> Seguridad
                    </TabsTrigger>
                    <TabsTrigger value="apariencia" className="data-[state=active]:bg-white data-[state=active]:shadow-sm gap-2">
                        <PaintBucket className="w-4 h-4" /> Apariencia
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="perfil" className="space-y-4 m-0">
                    <Card className="border-none shadow-md bg-white/50 backdrop-blur-sm dark:bg-slate-900/50">
                        <CardHeader className="pb-4 border-b border-border/50">
                            <CardTitle className="text-lg font-medium">Información Personal</CardTitle>
                            <CardDescription>Actualiza tu foto y tus datos personales.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            <div className="flex items-center gap-6">
                                <div className="h-24 w-24 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-3xl font-bold text-blue-600">
                                    {userForm.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div className="space-y-2">
                                    <Button variant="outline" size="sm">Cambiar Avatar</Button>
                                    <p className="text-xs text-muted-foreground">Recomendado 256x256px. JPG o PNG.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">Nombre Completo</Label>
                                    <Input id="firstName" value={userForm.name} onChange={(e) => setUserForm({...userForm, name: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="position">Cargo / Puesto</Label>
                                    <Input id="position" value={userForm.position} onChange={(e) => setUserForm({...userForm, position: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Correo Electrónico</Label>
                                    <Input id="email" type="email" value={userData?.email} disabled />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Teléfono de Contacto</Label>
                                    <Input id="phone" type="tel" value={userForm.phone} onChange={(e) => setUserForm({...userForm, phone: e.target.value})} placeholder="+1 (555) 000-0000" />
                                </div>
                            </div>
                            <div className="pt-4">
                                <Button onClick={handleSaveUser} disabled={saving} className="gap-2">
                                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                                    Guardar Perfil
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="empresa" className="space-y-4 m-0">
                    <Card className="border-none shadow-md bg-white/50 backdrop-blur-sm dark:bg-slate-900/50">
                        <CardHeader className="pb-4 border-b border-border/50">
                            <CardTitle className="text-lg font-medium">Perfil de la Organización</CardTitle>
                            <CardDescription>Ajustes generales que aplican a todo el entorno de trabajo.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="companyName">Nombre de la Empresa</Label>
                                    <Input id="companyName" value={tenantForm.name} onChange={(e) => setTenantForm({...tenantForm, name: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="industry">Sector Industrial</Label>
                                    <Input id="industry" value={tenantForm.industry} onChange={(e) => setTenantForm({...tenantForm, industry: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="timezone">Zona Horaria Global</Label>
                                    <div className="relative">
                                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input id="timezone" value={tenantForm.timezone} onChange={(e) => setTenantForm({...tenantForm, timezone: e.target.value})} className="pl-9" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="currency">Moneda Principal</Label>
                                    <Input id="currency" value={tenantForm.currency} onChange={(e) => setTenantForm({...tenantForm, currency: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="tenantPhone">Teléfono Corporativo</Label>
                                    <Input id="tenantPhone" value={tenantForm.phone} onChange={(e) => setTenantForm({...tenantForm, phone: e.target.value})} />
                                </div>
                            </div>
                            <div className="pt-4">
                                <Button onClick={handleSaveTenant} disabled={saving} className="gap-2">
                                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                                    Guardar Datos de Empresa
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="notificaciones" className="space-y-4 m-0">
                    <Card className="border-none shadow-md bg-white/50 backdrop-blur-sm dark:bg-slate-900/50">
                        <CardHeader className="pb-4 border-b border-border/50">
                            <CardTitle className="text-lg font-medium">Preferencias de Alertas</CardTitle>
                            <CardDescription>Controla qué información recibes y a través de qué canales.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Notificaciones por Correo</Label>
                                        <p className="text-sm text-muted-foreground">Alertas críticas sobre documentos y auditorías.</p>
                                    </div>
                                    <Switch defaultChecked />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Recordatorios de Mantenimiento</Label>
                                        <p className="text-sm text-muted-foreground">Alertas 7 días antes de fechas de mantenimiento de infraestructura.</p>
                                    </div>
                                    <Switch defaultChecked />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Modificaciones en Roles</Label>
                                        <p className="text-sm text-muted-foreground">Avisar si hay cambios en permisos del sistema.</p>
                                    </div>
                                    <Switch />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="seguridad" className="space-y-4 m-0">
                    <Card className="border-none shadow-md bg-white/50 backdrop-blur-sm dark:bg-slate-900/50">
                        <CardHeader className="pb-4 border-b border-border/50">
                            <CardTitle className="text-lg font-medium">Seguridad de la Cuenta</CardTitle>
                            <CardDescription>Gestiona tu contraseña y los dispositivos autorizados.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            <div className="grid grid-cols-1 gap-6 max-w-xl">
                                <div className="space-y-2">
                                    <Label htmlFor="newPassword">Nueva Contraseña (dejar en blanco si no se desea cambiar)</Label>
                                    <Input id="newPassword" type="password" value={userForm.password} onChange={(e) => setUserForm({...userForm, password: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
                                    <Input id="confirmPassword" type="password" value={userForm.confirmPassword} onChange={(e) => setUserForm({...userForm, confirmPassword: e.target.value})} />
                                </div>
                                <Button onClick={handleSaveUser} disabled={saving} className="w-max shadow-sm">Actualizar Contraseña</Button>
                            </div>

                            <div className="border-t border-border/50 pt-6 mt-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h4 className="text-sm font-medium">Autenticación en Dos Pasos (2FA)</h4>
                                        <p className="text-xs text-muted-foreground mt-0.5">Añade una capa extra de seguridad a tu cuenta.</p>
                                    </div>
                                    <Button variant="outline" className="shadow-sm">Activar 2FA</Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="apariencia" className="space-y-4 m-0">
                    <Card className="border-none shadow-md bg-white/50 backdrop-blur-sm dark:bg-slate-900/50">
                        <CardHeader className="pb-4 border-b border-border/50">
                            <CardTitle className="text-lg font-medium">Personalización de Interfaz</CardTitle>
                            <CardDescription>Adapta los colores y el tema de la aplicación a tus preferencias locales.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-8">
                            <div className="space-y-3">
                                <Label>Tema Visual</Label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg">
                                    <Button variant="outline" className="h-20 flex flex-col gap-2 justify-center border-2 border-primary bg-primary/5">
                                        <div className="h-4 w-4 rounded-full bg-slate-900" /> Claro
                                    </Button>
                                    <Button variant="outline" className="h-20 flex flex-col gap-2 justify-center text-muted-foreground">
                                        <div className="h-4 w-4 rounded-full bg-slate-100 border" /> Oscuro
                                    </Button>
                                    <Button variant="outline" className="h-20 flex flex-col gap-2 justify-center text-muted-foreground">
                                        <Settings className="h-4 w-4" /> Sistema
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label>Densidad de Información</Label>
                                <div className="flex items-center justify-between max-w-sm">
                                    <div className="space-y-0.5">
                                        <p className="text-sm font-medium">Modo Compacto</p>
                                        <p className="text-xs text-muted-foreground">Reduce el padding en tablas y listas.</p>
                                    </div>
                                    <Switch />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

            </Tabs>
        </div>
    );
}

