"use client";

import React, { useState } from 'react';
import { Plus, Search, Users as UsersIcon, Shield, Eye, Edit, Trash2, Save, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { mockUsers } from '@/lib/mock-data';
import type { User, Role } from '@/lib/types';
import { toast } from 'sonner';

const roleConfig: Record<Role, { label: string; color: string; bg: string; description: string }> = {
    SUPER_ADMIN: { label: 'Super Admin', color: 'text-purple-700', bg: 'bg-purple-100', description: 'Acceso total al sistema' },
    ADMIN_EMPRESA: { label: 'Admin Empresa', color: 'text-indigo-700', bg: 'bg-indigo-100', description: 'Administrador de la organización' },
    USUARIO: { label: 'Usuario', color: 'text-blue-700', bg: 'bg-blue-100', description: 'Acceso según puesto de trabajo' },
    AUDITOR_INTERNO: { label: 'Auditor Interno', color: 'text-emerald-700', bg: 'bg-emerald-100', description: 'Acceso a auditorías internas' },
    AUDITOR_EXTERNO: { label: 'Auditor Externo', color: 'text-amber-700', bg: 'bg-amber-100', description: 'Acceso de lectura para auditorías' },
};

export default function UsuariosPage() {
    const [users, setUsers] = useState<User[]>(mockUsers);
    const [search, setSearch] = useState('');
    const [showNew, setShowNew] = useState(false);
    const [newUser, setNewUser] = useState<Partial<User>>({ role: 'USUARIO' });

    const filtered = users.filter(u =>
        !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
    );

    const handleCreate = () => {
        if (!newUser.name || !newUser.email) { toast.error('Nombre y email son requeridos'); return; }
        const user: User = {
            id: `user-${Date.now()}`,
            tenantId: 'tenant-1',
            name: newUser.name!,
            email: newUser.email!,
            position: newUser.position,
            role: newUser.role as Role || 'USUARIO',
            active: true,
            createdAt: new Date(),
        };
        setUsers([...users, user]);
        setShowNew(false);
        setNewUser({ role: 'USUARIO' });
        toast.success(`Usuario "${user.name}" creado`);
    };

    const roleStats = Object.entries(roleConfig)
        .filter(([k]) => k !== 'SUPER_ADMIN')
        .map(([key, config]) => ({
            role: key,
            ...config,
            count: users.filter(u => u.role === key).length,
        }));

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Gestión de Usuarios</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Administrar usuarios y asignar roles según puesto de trabajo
                    </p>
                </div>
                <Button onClick={() => setShowNew(true)} className="shadow-md">
                    <Plus className="h-4 w-4 mr-2" />Nuevo Usuario
                </Button>
            </div>

            {/* Role Stats */}
            <div className="grid grid-cols-4 gap-4">
                {roleStats.map(s => (
                    <Card key={s.role} className="border-0 shadow-sm">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", s.bg)}>
                                <Shield className={cn("h-5 w-5", s.color)} />
                            </div>
                            <div>
                                <p className="text-xl font-bold">{s.count}</p>
                                <p className="text-[10px] text-muted-foreground font-medium">{s.label}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Search */}
            <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por nombre o correo..."
                            className="pl-9 h-9"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Users Table */}
            <Card className="border-0 shadow-sm">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="text-[10px] font-bold uppercase tracking-wider">Usuario</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase tracking-wider">Correo</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase tracking-wider">Cargo</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase tracking-wider">Rol</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase tracking-wider">Estado</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.map(user => {
                                const role = roleConfig[user.role];
                                const initials = user.name.split(' ').map(n => n[0]).join('').slice(0, 2);
                                return (
                                    <TableRow key={user.id} className="group">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">{initials}</AvatarFallback>
                                                </Avatar>
                                                <span className="text-xs font-medium">{user.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">{user.email}</TableCell>
                                        <TableCell className="text-xs">{user.position || '-'}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={cn("text-[10px] h-5", role.bg, role.color, "border-current/20")}>
                                                {role.label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={cn("text-[10px] h-5", user.active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600')}>
                                                {user.active ? 'Activo' : 'Inactivo'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="icon" className="h-7 w-7"><Edit className="h-3.5 w-3.5" /></Button>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* New User Dialog */}
            <Dialog open={showNew} onOpenChange={setShowNew}>
                <DialogContent className="max-w-lg">
                    <DialogHeader><DialogTitle>Nuevo Usuario</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold">Nombre completo *</Label>
                            <Input placeholder="Nombre del usuario" value={newUser.name || ''} onChange={e => setNewUser({ ...newUser, name: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold">Correo electrónico *</Label>
                            <Input type="email" placeholder="correo@empresa.com" value={newUser.email || ''} onChange={e => setNewUser({ ...newUser, email: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold">Cargo</Label>
                                <Input placeholder="Puesto de trabajo" value={newUser.position || ''} onChange={e => setNewUser({ ...newUser, position: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold">Rol *</Label>
                                <Select value={newUser.role} onValueChange={v => setNewUser({ ...newUser, role: v as Role })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(roleConfig).filter(([k]) => k !== 'SUPER_ADMIN').map(([k, v]) => (
                                            <SelectItem key={k} value={k}>
                                                <div>
                                                    <span className="font-medium">{v.label}</span>
                                                    <span className="text-muted-foreground ml-2 text-[10px]">— {v.description}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowNew(false)}>Cancelar</Button>
                        <Button onClick={handleCreate}><Save className="h-4 w-4 mr-2" />Crear Usuario</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
