"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Download, 
  Filter, 
  MoreVertical, 
  Mail, 
  Shield, 
  Building2,
  CheckCircle2,
  XCircle,
  Plus,
  Pencil,
  Trash2
} from 'lucide-react';
import { UserDialogs } from './UserDialogs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface User {
  id: string;
  email: string;
  name: string;
  position: string | null;
  role: string;
  active: boolean;
  createdAt: string;
  tenantId: string;
  tenant: {
    name: string;
    slug: string;
  };
}

interface UsersTableProps {
  searchTerm: string;
}

export function UsersTable({ searchTerm: externalSearchTerm }: UsersTableProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'create' | 'edit' | 'delete'>('create');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users');
      if (!response.ok) throw new Error('Error al cargar usuarios');
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      console.error(err);
      setError('No se pudieron cargar los usuarios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const lowerTerm = externalSearchTerm.toLowerCase();
    return users.filter(user => 
      user.name.toLowerCase().includes(lowerTerm) || 
      user.email.toLowerCase().includes(lowerTerm) ||
      user.tenant.name.toLowerCase().includes(lowerTerm) ||
      user.role.toLowerCase().includes(lowerTerm)
    );
  }, [users, externalSearchTerm]);

  const handleCreate = () => {
    setDialogType('create');
    setSelectedUser(null);
    setDialogOpen(true);
  };

  const handleEdit = (user: User) => {
    setDialogType('edit');
    setSelectedUser(user);
    setDialogOpen(true);
  };

  const handleDelete = (user: User) => {
    setDialogType('delete');
    setSelectedUser(user);
    setDialogOpen(true);
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center p-20 text-blue-500">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-current"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-10 text-center text-red-500 bg-red-500/10 rounded-xl border border-red-500/20">
        {error}
      </div>
    );
  }

  return (
    <>
      <Card className="bg-white border-slate-200 shadow-sm mb-8 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 pb-6">
          <div>
            <CardTitle className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Usuarios Globales
            </CardTitle>
            <CardDescription className="text-slate-500 text-xs">
              Gestión centralizada de todos los usuarios registrados en la plataforma ({filteredUsers.length} usuarios)
            </CardDescription>
          </div>
          <div className="flex gap-3">
            <Button 
                onClick={handleCreate}
                className="bg-blue-600 hover:bg-blue-500 text-white h-9 px-4 rounded-xl text-xs gap-2 shadow-lg shadow-blue-600/20"
            >
                <Plus className="h-3.5 w-3.5" />
                Agregar Usuario
            </Button>
            <Button variant="outline" size="sm" className="bg-white border-slate-200 hover:bg-slate-50 h-9 rounded-xl text-xs gap-2">
              <Filter className="h-3.5 w-3.5" />
              Filtrar
            </Button>
            <Button variant="outline" size="sm" className="bg-white border-slate-200 hover:bg-slate-50 h-9 rounded-xl text-xs gap-2">
              <Download className="h-3.5 w-3.5" />
              Exportar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/50 text-slate-500 text-[11px] uppercase tracking-widest font-bold border-b border-slate-100">
                  <th className="text-left py-4 pl-6">Usuario</th>
                  <th className="text-left py-4">Empresa / Tenant</th>
                  <th className="text-left py-4">Rol / Cargo</th>
                  <th className="text-left py-4">Estado</th>
                  <th className="text-left py-4">Registro</th>
                  <th className="text-right py-4 pr-6">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold uppercase transition-transform group-hover:scale-105">
                            {user.name.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{user.name}</span>
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Building2 className="h-4 w-4 text-slate-400" />
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-900">{user.tenant.name}</span>
                            <span className="text-[10px] text-slate-500 uppercase">{user.tenant.slug}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-blue-600 uppercase tracking-tight flex items-center gap-1">
                            <Shield className="h-3 w-3" />
                            {user.role.replace(/_/g, ' ')}
                          </span>
                          <span className="text-[11px] text-slate-500">{user.position || 'No especificado'}</span>
                        </div>
                      </td>
                      <td className="py-4">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${  
                          user.active ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                          'bg-red-50 text-red-600 border-red-100'
                        }`}>
                          {user.active ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              Activo
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" />
                              Inactivo
                            </>
                          )}
                        </div>
                      </td>
                      <td className="py-4 text-xs text-slate-500">
                        {new Date(user.createdAt).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="py-4 pr-6 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-white border-slate-200 text-slate-800">
                            <DropdownMenuItem 
                                onClick={() => handleEdit(user)}
                                className="gap-2 focus:bg-slate-50 focus:text-blue-600 cursor-pointer"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Editar Usuario
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                                onClick={() => handleDelete(user)}
                                className="gap-2 focus:bg-red-50 focus:text-red-600 cursor-pointer text-red-600"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Eliminar Usuario
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 text-sm">
                      No se encontraron usuarios que coincidan con la búsqueda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <UserDialogs
        type={dialogType}
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={fetchUsers}
        user={selectedUser}
      />
    </>
  );
}
