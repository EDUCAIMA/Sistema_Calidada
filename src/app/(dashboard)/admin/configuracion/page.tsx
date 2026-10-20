"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
    Settings, User as UserIcon, Building, Bell, Shield, PaintBucket, Globe, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useApp } from '@/context/app-context';
import { ModulePage, ModuleHeader, ModuleContent } from '@/components/sgc/module-layout';
import type { Tenant, User } from '@/lib/types';

export default function ConfiguracionPage() {
    const { currentUser, tenant, setTenant } = useApp();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [userData, setUserData] = useState<User | null>(null);
    const [tenantData, setTenantData] = useState<Tenant | null>(null);

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
        phone: '',
        logo: ''
    });

    useEffect(() => {
        if (currentUser && tenant.id) {
            setUserData(currentUser);
            setTenantData(tenant);
            
            setUserForm({
                name: currentUser.name || '',
                position: currentUser.position || '',
                phone: currentUser.phone || '',
                password: '',
                confirmPassword: ''
            });

            setTenantForm({
                name: tenant.name || '',
                industry: tenant.industry || '',
                timezone: tenant.timezone || 'America/Bogota',
                currency: tenant.currency || 'USD',
                phone: tenant.phone || '',
                logo: tenant.logo || ''
            });
            
            setLoading(false);
        }
    }, [currentUser, tenant]);

    const handleSaveUser = async () => {
        if (!userData) return;
        console.log('Saving user...', userData?.id);
        if (userForm.password && userForm.password !== userForm.confirmPassword) {
            toast.error('Las contraseñas no coinciden');
            return;
        }

        setSaving(true);
        try {
            const url = `/api/admin/users/${userData.id}`;
            console.log('PATCH to', url);
            const res = await fetch(url, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: userForm.name,
                    position: userForm.position,
                    phone: userForm.phone,
                    ...(userForm.password ? { password: userForm.password } : {})
                })
            });

            console.log('Response status:', res.status);
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                console.error('Save user failed:', errData);
                throw new Error('Error al guardar');
            }
            
            const updated = await res.json();
            setUserData(updated);
            try {
                localStorage.setItem('sgc_user', JSON.stringify(updated));
            } catch (e) {
                console.error('LocalStorage user error:', e);
            }
            toast.success('Perfil actualizado correctamente');
        } catch (error) {
            console.error('handleSaveUser error:', error);
            toast.error('Error al actualizar el perfil');
        } finally {
            setSaving(false);
        }
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !tenantData) return;

        if (file.size > 1024 * 1024) { // 1MB limit
            toast.error('La imagen es demasiado grande. Máximo 1MB.');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64Logo = reader.result as string;
            setTenantForm({ ...tenantForm, logo: base64Logo });
            
            // Auto-save logo
            try {
                const res = await fetch(`/api/admin/tenants/${tenantData.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...tenantForm, logo: base64Logo })
                });

                if (res.ok) {
                    const updated = await res.json();
                    setTenant(updated);
                    toast.success('Logo actualizado y guardado');
                } else {
                    throw new Error('Error al guardar el logo');
                }
            } catch (error) {
                console.error('Error auto-saving logo:', error);
                toast.error('No se pudo guardar el logo automáticamente');
            }
        };
        reader.readAsDataURL(file);
    };

    const handleSaveTenant = async () => {
        console.log('Saving tenant...', tenantData?.id);
        if (!tenantData?.id) {
            console.error('No tenant ID found');
            toast.error('Error de sesión: No hay ID de empresa');
            return;
        }

        setSaving(true);
        try {
            const url = `/api/admin/tenants/${tenantData.id}`;
            console.log('PATCH to', url);
            const res = await fetch(url, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(tenantForm)
            });

            console.log('Response status:', res.status);
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                console.error('Save tenant failed:', errData);
                throw new Error('Error al guardar');
            }
            
            const updated = await res.json();
            setTenantData(updated);
            setTenant(updated); // Actualizar contexto global
            
            toast.success('Configuración de empresa actualizada');
        } catch (error) {
            console.error('handleSaveTenant error:', error);
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
        <ModulePage>
            <ModuleHeader
                title="Configuración"
                description="Administre los ajustes de su cuenta y las preferencias del sistema de gestión."
            />
            <ModuleContent>

            <Tabs defaultValue="perfil" className="space-y-6">
                <TabsList className="flex h-auto min-h-11 w-full flex-wrap justify-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1.5">
                    <TabsTrigger value="perfil" className="min-h-10 flex-none rounded-lg px-4 py-2 text-sm font-medium text-slate-600 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">
                        <UserIcon className="w-4 h-4" /> Perfil de Usuario
                    </TabsTrigger>
                    <TabsTrigger value="empresa" className="min-h-10 flex-none rounded-lg px-4 py-2 text-sm font-medium text-slate-600 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">
                        <Building className="w-4 h-4" /> Datos de la Empresa
                    </TabsTrigger>
                    <TabsTrigger value="notificaciones" className="min-h-10 flex-none rounded-lg px-4 py-2 text-sm font-medium text-slate-600 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">
                        <Bell className="w-4 h-4" /> Notificaciones
                    </TabsTrigger>
                    <TabsTrigger value="seguridad" className="min-h-10 flex-none rounded-lg px-4 py-2 text-sm font-medium text-slate-600 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">
                        <Shield className="w-4 h-4" /> Seguridad
                    </TabsTrigger>
                    <TabsTrigger value="apariencia" className="min-h-10 flex-none rounded-lg px-4 py-2 text-sm font-medium text-slate-600 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">
                        <PaintBucket className="w-4 h-4" /> Apariencia
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="perfil" className="space-y-4 m-0">
                    <Card className="dark:bg-slate-900/50 min-w-0 rounded-2xl border border-slate-100 bg-white shadow-sm">
                        <CardHeader className="pb-4 border-b border-border/50 min-w-0">
                            <CardTitle className="text-lg font-medium">Información Personal</CardTitle>
                            <CardDescription>Actualiza tu foto y tus datos personales.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6 min-w-0">
                            <div className="flex flex-wrap items-center gap-6">
                                <div className="h-24 w-24 shrink-0 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-3xl font-semibold text-blue-600">
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
                                <Button onClick={handleSaveUser} disabled={saving} className="gap-2 rounded-xl text-sm font-medium">
                                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                                    Guardar Perfil
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="empresa" className="space-y-4 m-0">
                    <Card className="dark:bg-slate-900/50 min-w-0 rounded-2xl border border-slate-100 bg-white shadow-sm">
                        <CardHeader className="pb-4 border-b border-border/50 min-w-0">
                            <CardTitle className="text-lg font-medium">Perfil de la Organización</CardTitle>
                            <CardDescription>Ajustes generales que aplican a todo el entorno de trabajo.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6 min-w-0">
                            <div className="flex flex-wrap items-center gap-6 pb-6 border-b border-border/50">
                                <div className="h-24 w-24 shrink-0 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden bg-white shadow-sm">
                                    {tenantForm.logo ? (
                                        <Image src={tenantForm.logo} alt="Logo corporativo" width={96} height={96} unoptimized className="h-full w-full object-contain p-2" />
                                    ) : (
                                        <Building className="h-10 w-10 text-slate-400" />
                                    )}
                                </div>
                                <div className="min-w-0 space-y-3">
                                    <Label className="text-sm font-semibold text-slate-500">Logo Corporativo</Label>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <Input 
                                            type="file" 
                                            accept="image/*" 
                                            onChange={handleLogoUpload} 
                                            className="max-w-full sm:w-[250px] cursor-pointer h-11 rounded-xl text-sm"
                                        />
                                        {tenantForm.logo && (
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                onClick={() => setTenantForm({...tenantForm, logo: ''})}
                                                className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl text-sm font-medium"
                                            >
                                                Eliminar
                                            </Button>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground font-semibold">Recomendado: PNG fondo transparente (Máx. 1MB)</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
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
                                        <Input id="timezone" value={tenantForm.timezone} onChange={(e) => setTenantForm({...tenantForm, timezone: e.target.value})} className="pl-9 h-11 rounded-xl text-sm" />
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
                                <Button onClick={handleSaveTenant} disabled={saving} className="gap-2 rounded-xl text-sm font-medium">
                                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                                    Guardar Datos de Empresa
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="notificaciones" className="space-y-4 m-0">
                    <Card className="dark:bg-slate-900/50 min-w-0 rounded-2xl border border-slate-100 bg-white shadow-sm">
                        <CardHeader className="pb-4 border-b border-border/50 min-w-0">
                            <CardTitle className="text-lg font-medium">Preferencias de Alertas</CardTitle>
                            <CardDescription>Controla qué información recibes y a través de qué canales.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6 min-w-0">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Notificaciones por Correo</Label>
                                        <p className="text-sm text-muted-foreground">Alertas críticas sobre documentos y auditorías.</p>
                                    </div>
                                    <Switch defaultChecked />
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Recordatorios de Mantenimiento</Label>
                                        <p className="text-sm text-muted-foreground">Alertas 7 días antes de fechas de mantenimiento de infraestructura.</p>
                                    </div>
                                    <Switch defaultChecked />
                                </div>
                                <div className="flex items-center justify-between gap-4">
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
                    <Card className="dark:bg-slate-900/50 min-w-0 rounded-2xl border border-slate-100 bg-white shadow-sm">
                        <CardHeader className="pb-4 border-b border-border/50 min-w-0">
                            <CardTitle className="text-lg font-medium">Seguridad de la Cuenta</CardTitle>
                            <CardDescription>Gestiona tu contraseña y los dispositivos autorizados.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6 min-w-0">
                            <div className="grid grid-cols-1 gap-6 max-w-xl">
                                <div className="space-y-2">
                                    <Label htmlFor="newPassword">Nueva Contraseña (dejar en blanco si no se desea cambiar)</Label>
                                    <Input id="newPassword" type="password" value={userForm.password} onChange={(e) => setUserForm({...userForm, password: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
                                    <Input id="confirmPassword" type="password" value={userForm.confirmPassword} onChange={(e) => setUserForm({...userForm, confirmPassword: e.target.value})} />
                                </div>
                                <Button onClick={handleSaveUser} disabled={saving} className="w-max shadow-sm rounded-xl text-sm font-medium">Actualizar Contraseña</Button>
                            </div>

                            <div className="border-t border-border/50 pt-6 mt-6">
                                <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                                    <div>
                                        <h4 className="text-sm font-medium">Autenticación en Dos Pasos (2FA)</h4>
                                        <p className="text-xs text-muted-foreground mt-0.5">Añade una capa extra de seguridad a tu cuenta.</p>
                                    </div>
                                    <Button variant="outline" className="shadow-sm rounded-xl text-sm font-medium">Activar 2FA</Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="apariencia" className="space-y-4 m-0">
                    <Card className="dark:bg-slate-900/50 min-w-0 rounded-2xl border border-slate-100 bg-white shadow-sm">
                        <CardHeader className="pb-4 border-b border-border/50 min-w-0">
                            <CardTitle className="text-lg font-medium">Personalización de Interfaz</CardTitle>
                            <CardDescription>Adapta los colores y el tema de la aplicación a tus preferencias locales.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-8 min-w-0">
                            <div className="space-y-3">
                                <Label>Tema Visual</Label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg">
                                    <Button variant="outline" className="h-20 flex flex-col gap-2 justify-center border-2 border-primary bg-primary/5 rounded-xl text-sm font-medium">
                                        <div className="h-4 w-4 rounded-full bg-slate-900" /> Claro
                                    </Button>
                                    <Button variant="outline" className="h-20 flex flex-col gap-2 justify-center text-muted-foreground rounded-xl text-sm font-medium">
                                        <div className="h-4 w-4 rounded-full bg-slate-100 border" /> Oscuro
                                    </Button>
                                    <Button variant="outline" className="h-20 flex flex-col gap-2 justify-center text-muted-foreground rounded-xl text-sm font-medium">
                                        <Settings className="h-4 w-4" /> Sistema
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label>Densidad de Información</Label>
                                <div className="flex max-w-sm items-center justify-between gap-4">
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
            </ModuleContent>
        </ModulePage>
    );
}
