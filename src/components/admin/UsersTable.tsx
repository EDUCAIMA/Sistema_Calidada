"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  Search, 
  Download, 
  Filter, 
  MoreVertical, 
  Mail, 
  Shield, 
  Building2,
  CheckCircle2,
  XCircle
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string;
  position: string | null;
  role: string;
  active: boolean;
  createdAt: string;
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

  useEffect(() => {
    async function fetchUsers() {
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
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
    <Card className="bg-[#111927]/60 backdrop-blur-md border-white/5 shadow-xl mb-8 overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 pb-6">
        <div>
          <CardTitle className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-400" />
            Usuarios Globales
          </CardTitle>
          <CardDescription className="text-slate-500 text-xs">
            Gestión centralizada de todos los usuarios registrados en la plataforma ({filteredUsers.length} usuarios)
          </CardDescription>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" className="bg-white/5 border-white/5 h-9 rounded-xl text-xs gap-2">
            <Filter className="h-3.5 w-3.5" />
            Filtrar
          </Button>
          <Button variant="outline" size="sm" className="bg-white/5 border-white/5 h-9 rounded-xl text-xs gap-2">
            <Download className="h-3.5 w-3.5" />
            Exportar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-white/[0.02] text-slate-500 text-[11px] uppercase tracking-widest font-bold">
                <th className="text-left py-4 pl-6">Usuario</th>
                <th className="text-left py-4">Empresa / Tenant</th>
                <th className="text-left py-4">Rol / Cargo</th>
                <th className="text-left py-4">Estado</th>
                <th className="text-left py-4">Registro</th>
                <th className="text-right py-4 pr-6">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold uppercase">
                          {user.name.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{user.name}</span>
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {user.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Building2 className="h-4 w-4 text-slate-500" />
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-300">{user.tenant.name}</span>
                          <span className="text-[10px] text-slate-500 uppercase">{user.tenant.slug}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-blue-400/80 uppercase tracking-tight flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          {user.role.replace('_', ' ')}
                        </span>
                        <span className="text-[11px] text-slate-500">{user.position || 'No especificado'}</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${  
                        user.active ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                        'bg-red-500/10 text-red-500 border-red-500/20'
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
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="py-4 pr-6 text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-white hover:bg-white/10 rounded-lg">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 text-sm">
                    No se encontraron usuarios que coincidan con la búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
