"use client";

import React from 'react';
import {
    Settings, User, Building, Bell, Shield, PaintBucket, Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ConfiguracionPage() {
    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Configuración</h2>
                    <p className="text-muted-foreground mt-1">
                        Administra los ajustes de tu cuenta y las preferencias del Sistema de Gestión.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button className="shadow-md">
                        Guardar Cambios
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="perfil" className="space-y-6">
                <TabsList className="bg-slate-100/50 dark:bg-slate-800/50 border shadow-sm w-full justify-start overflow-x-auto">
                    <TabsTrigger value="perfil" className="data-[state=active]:bg-white data-[state=active]:shadow-sm gap-2">
                        <User className="w-4 h-4" /> Perfil de Usuario
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
                                <div className="h-24 w-24 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-3xl font-bold text-slate-400">
                                    AD
                                </div>
                                <div className="space-y-2">
                                    <Button variant="outline" size="sm">Cambiar Avatar</Button>
                                    <p className="text-xs text-muted-foreground">Recomendado 256x256px. JPG o PNG.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">Nombre Completo</Label>
                                    <Input id="firstName" defaultValue="Admin User" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="position">Cargo / Puesto</Label>
                                    <Input id="position" defaultValue="Administrador del Sistema" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Correo Electrónico</Label>
                                    <Input id="email" type="email" defaultValue="admin@empresa.com" disabled />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Teléfono de Contacto</Label>
                                    <Input id="phone" type="tel" placeholder="+1 (555) 000-0000" />
                                </div>
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
                                    <Label htmlFor="companyName">Nombre de la Empresa o Tenant</Label>
                                    <Input id="companyName" defaultValue="Mi Empresa S.A." disabled />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="industry">Sector Industrial</Label>
                                    <Input id="industry" defaultValue="Tecnología" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="timezone">Zona Horaria Global</Label>
                                    <div className="relative">
                                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input id="timezone" defaultValue="America/Bogota" className="pl-9" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="currency">Moneda Módulo de Costos</Label>
                                    <Input id="currency" defaultValue="USD" />
                                </div>
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
                                    <Label htmlFor="currentPassword">Contraseña Actual</Label>
                                    <Input id="currentPassword" type="password" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="newPassword">Nueva Contraseña</Label>
                                    <Input id="newPassword" type="password" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
                                    <Input id="confirmPassword" type="password" />
                                </div>
                                <Button className="w-max shadow-sm">Actualizar Contraseña</Button>
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
