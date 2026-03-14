"use client";

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader2, AlertTriangle } from 'lucide-react';

const userSchema = z.object({
  name: z.string().min(2, 'El nombre es muy corto'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').optional().or(z.literal('')),
  role: z.enum(['SUPER_ADMIN', 'ADMIN_EMPRESA', 'USUARIO', 'AUDITOR_INTERNO', 'AUDITOR_EXTERNO']),
  tenantId: z.string().min(1, 'Debe seleccionar una empresa'),
  position: z.string().optional(),
  active: z.boolean(),
});

type UserFormValues = z.infer<typeof userSchema>;

interface UserDialogsProps {
  type: 'create' | 'edit' | 'delete';
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user?: any; // The user to edit or delete
}

export function UserDialogs({ type, isOpen, onClose, onSuccess, user }: UserDialogsProps) {
  const [loading, setLoading] = useState(false);
  const [tenants, setTenants] = useState<any[]>([]);

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'USUARIO',
      tenantId: '',
      position: '',
      active: true,
    },
  });

  useEffect(() => {
    if (isOpen) {
      fetchTenants();
      if (type === 'edit' && user) {
        form.reset({
          name: user.name,
          email: user.email,
          role: user.role,
          tenantId: user.tenantId,
          position: user.position || '',
          active: user.active,
          password: '', // Don't populate password
        });
      } else if (type === 'create') {
        form.reset({
          name: '',
          email: '',
          password: '',
          role: 'USUARIO',
          tenantId: '',
          position: '',
          active: true,
        });
      }
    }
  }, [isOpen, type, user, form]);

  async function fetchTenants() {
    try {
      const res = await fetch('/api/admin/tenants');
      const data = await res.json();
      setTenants(data);
    } catch (err) {
      console.error('Error fetching tenants:', err);
    }
  }

  async function onSubmit(values: UserFormValues) {
    try {
      setLoading(true);
      const url = type === 'create' ? '/api/admin/users' : `/api/admin/users/${user.id}`;
      const method = type === 'create' ? 'POST' : 'PATCH';

      // Remove empty password on edit
      const submissionData = { ...values };
      if (type === 'edit' && !submissionData.password) {
        delete submissionData.password;
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error en la operación');
      }

      toast.success(type === 'create' ? 'Usuario creado correctamente' : 'Usuario actualizado correctamente');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Error al eliminar');
      }

      toast.success('Usuario eliminado correctamente');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  if (type === 'delete') {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-[#0a1120] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="h-5 w-5" />
              Confirmar Eliminación
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              ¿Estás seguro de que deseas eliminar al usuario <strong>{user?.name}</strong>? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={onClose} disabled={loading} className="text-slate-400 hover:text-white hover:bg-white/5">
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading} className="gap-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Eliminar Permanentemente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#0a1120] border-white/10 text-white max-w-2xl backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold tracking-tight">
            {type === 'create' ? 'Nuevo Usuario Global' : 'Editar Usuario'}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {type === 'create' 
              ? 'Complete la información para registrar un nuevo usuario en QualityLink.' 
              : 'Actualice los datos del usuario seleccionado.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300">Nombre Completo</FormLabel>
                    <FormControl>
                      <Input {...field} className="bg-white/5 border-white/10 focus:ring-blue-500/50" placeholder="Ej. Juan Pérez" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300">Correo Electrónico</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" className="bg-white/5 border-white/10 focus:ring-blue-500/50" placeholder="usuario@ejemplo.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300">
                      Contraseña {type === 'edit' && <span className="text-[10px] text-blue-400 ml-1">(Dejar vacío para mantener actual)</span>}
                    </FormLabel>
                    <FormControl>
                      <Input {...field} type="password" className="bg-white/5 border-white/10 focus:ring-blue-500/50" placeholder="••••••••" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tenantId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300">Empresa / Sistema</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-white/5 border-white/10 focus:ring-blue-500/50 text-slate-200">
                          <SelectValue placeholder="Seleccionar empresa" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-[#111927] border-white/10 text-slate-200">
                        {tenants.map((t) => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300">Rol de Usuario</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-white/5 border-white/10 focus:ring-blue-500/50 text-slate-200">
                          <SelectValue placeholder="Seleccionar rol" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-[#111927] border-white/10 text-slate-200">
                        <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                        <SelectItem value="ADMIN_EMPRESA">Admin Empresa</SelectItem>
                        <SelectItem value="USUARIO">Usuario Estándar</SelectItem>
                        <SelectItem value="AUDITOR_INTERNO">Auditor Interno</SelectItem>
                        <SelectItem value="AUDITOR_EXTERNO">Auditor Externo</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300">Cargo / Posición</FormLabel>
                    <FormControl>
                      <Input {...field} className="bg-white/5 border-white/10 focus:ring-blue-500/50" placeholder="Ej. Gerente de Calidad" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-xl border border-white/5 p-4 bg-white/[0.02]">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base text-slate-200">Estado de Cuenta</FormLabel>
                      <div className="text-[12px] text-slate-500">Permitir el acceso al sistema</div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="pt-6 border-t border-white/5">
              <Button type="button" variant="ghost" onClick={onClose} disabled={loading} className="text-slate-400 hover:text-white hover:bg-white/5">
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-500 text-white min-w-[120px] gap-2">
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {type === 'create' ? 'Crear Usuario' : 'Guardar Cambios'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
