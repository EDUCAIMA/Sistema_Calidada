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
  type: 'create' | 'edit' | 'deactivate';
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user?: (Omit<UserFormValues, 'password' | 'position'> & { id: string; position?: string | null }) | null;
}

export function UserDialogs({ type, isOpen, onClose, onSuccess, user }: UserDialogsProps) {
  const [loading, setLoading] = useState(false);
  const [tenants, setTenants] = useState<{ id: string; name: string }[]>([]);

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
      if (type !== 'deactivate') void fetchTenants();
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
      if (!res.ok) throw new Error(data.error || 'No se pudieron cargar las empresas.');
      setTenants(data);
    } catch (err) {
      console.error('Error fetching tenants:', err);
    }
  }

  async function onSubmit(values: UserFormValues) {
    try {
      setLoading(true);
      if (type !== 'create' && !user) throw new Error('Seleccione un usuario.');
      const url = type === 'create' ? '/api/admin/users' : `/api/admin/users/${user!.id}`;
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
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo guardar el usuario.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeactivate() {
    try {
      if (!user) throw new Error('Seleccione un usuario.');
      setLoading(true);
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'No se pudo desactivar el usuario.');
      }

      toast.success('Usuario desactivado. Sus responsabilidades e historial se conservan.');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo desactivar el usuario.');
    } finally {
      setLoading(false);
    }
  }

  if (type === 'deactivate') {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-white border-slate-200 text-slate-900">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Desactivar usuario
            </DialogTitle>
            <DialogDescription className="text-slate-600">
              Al desactivar a <strong>{user?.name}</strong>, se bloqueará su acceso al sistema. Sus responsabilidades y registros históricos se conservarán. Podrás reactivar la cuenta desde Editar usuario.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={onClose} disabled={loading} className="text-slate-500 hover:text-slate-900 hover:bg-slate-100">
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeactivate} disabled={loading} className="gap-2 bg-red-600 hover:bg-red-700">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Desactivar usuario
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white border-slate-200 text-slate-900 max-w-2xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold tracking-tight text-slate-900">
            {type === 'create' ? 'Nuevo Usuario Global' : 'Editar Usuario'}
          </DialogTitle>
          <DialogDescription className="text-slate-500">
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
                    <FormLabel className="text-slate-700 font-medium">Nombre Completo</FormLabel>
                    <FormControl>
                      <Input {...field} className="bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500/20" placeholder="Ej. Juan Pérez" />
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
                    <FormLabel className="text-slate-700 font-medium">Correo Electrónico</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" className="bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500/20" placeholder="usuario@ejemplo.com" />
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
                    <FormLabel className="text-slate-700 font-medium">
                      Contraseña {type === 'edit' && <span className="text-[10px] text-blue-600 ml-1">(Dejar vacío para mantener actual)</span>}
                    </FormLabel>
                    <FormControl>
                      <Input {...field} type="password" className="bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500/20" placeholder="••••••••" />
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
                    <FormLabel className="text-slate-700 font-medium">Empresa / Sistema</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 text-slate-900">
                          <SelectValue placeholder="Seleccionar empresa" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white border-slate-200 text-slate-900">
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
                    <FormLabel className="text-slate-700 font-medium">Rol de Usuario</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 text-slate-900">
                          <SelectValue placeholder="Seleccionar rol" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white border-slate-200 text-slate-900">
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
                    <FormLabel className="text-slate-700 font-medium">Cargo / Posición</FormLabel>
                    <FormControl>
                      <Input {...field} className="bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500/20" placeholder="Ej. Gerente de Calidad" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-xl border border-slate-100 p-4 bg-slate-50/50">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base text-slate-900 font-medium">Estado de Cuenta</FormLabel>
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

            <DialogFooter className="pt-6 border-t border-slate-100">
              <Button type="button" variant="ghost" onClick={onClose} disabled={loading} className="text-slate-500 hover:text-slate-900 hover:bg-slate-100">
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 min-w-[120px] gap-2">
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
