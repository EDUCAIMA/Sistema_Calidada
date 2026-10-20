"use client";

import { useCallback, useEffect, useState } from 'react';
import { Crown, Plus, Pencil, UserCheck, UserX } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import type { Role } from '@/lib/types';

const roles: Record<Exclude<Role, 'SUPER_ADMIN'>, string> = {
  ADMIN_EMPRESA: 'Administrador de empresa', USUARIO: 'Usuario',
  AUDITOR_INTERNO: 'Auditor interno · solo lectura', AUDITOR_EXTERNO: 'Auditor externo · solo lectura',
};
interface ManagedUser {
  id: string; tenantId: string; name: string; email: string; position: string | null;
  role: Role; topManagement: boolean; active: boolean; createdAt: string; updatedAt: string;
}
interface UserForm { name: string; email: string; position: string; role: Exclude<Role, 'SUPER_ADMIN'>; topManagement: boolean; password: string }
const blank: UserForm = { name: '', email: '', position: '', role: 'USUARIO', topManagement: false, password: '' };

export default function UsuariosPage() {
  const { tenant, currentUser, isLoading } = useApp();
  const canManage = currentUser?.role === 'ADMIN_EMPRESA' || currentUser?.role === 'SUPER_ADMIN';
  const [data, setData] = useState<{ tenantId: string; users: ManagedUser[] }>({ tenantId: '', users: [] });
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('TODOS');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ManagedUser | null>(null);
  const [form, setForm] = useState<UserForm>(blank);
  const [saving, setSaving] = useState(false);
  const [deactivating, setDeactivating] = useState<ManagedUser | null>(null);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    if (!tenant.id || !canManage) return;
    try {
      const response = await fetch(`/api/admin/users?tenantId=${encodeURIComponent(tenant.id)}&manage=true`, { signal });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'No se pudieron cargar los usuarios.');
      setData({ tenantId: tenant.id, users: result });
      setError('');
    } catch (err) {
      if (!signal?.aborted) setError(err instanceof Error ? err.message : 'No se pudieron cargar los usuarios.');
    }
  }, [tenant.id, canManage]);
  useEffect(() => {
    const controller = new AbortController();
    void refresh(controller.signal);
    return () => controller.abort();
  }, [refresh]);

  const users = data.tenantId === tenant.id ? data.users : [];
  const filtered = users.filter(user => (filter === 'TODOS' || user.active === (filter === 'ACTIVOS')) && `${user.name} ${user.email} ${user.position || ''}`.toLowerCase().includes(query.toLowerCase()));
  const loading = !tenant.id || (data.tenantId !== tenant.id && !error);
  const auditorSelected = form.role === 'AUDITOR_INTERNO' || form.role === 'AUDITOR_EXTERNO';

  function edit(user: ManagedUser | null) {
    if (user?.role === 'SUPER_ADMIN') return;
    setEditing(user);
    setForm(user ? { name: user.name, email: user.email, position: user.position || '', role: user.role as UserForm['role'], topManagement: user.topManagement, password: '' } : { ...blank });
    setOpen(true);
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await fetch(editing ? `/api/admin/users/${editing.id}` : '/api/admin/users', {
        method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: tenant.id, name: form.name.trim(), email: form.email.trim(), position: form.position.trim(), role: form.role, topManagement: form.topManagement, ...(form.password ? { password: form.password } : {}) }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'No se pudo guardar el usuario.');
      toast.success(editing ? 'Usuario actualizado.' : 'Usuario creado. Ya puede asignarle responsabilidades.');
      setOpen(false);
      await refresh();
    } catch (err) { toast.error(err instanceof Error ? err.message : 'No se pudo guardar.'); }
    finally { setSaving(false); }
  }

  async function setActive(user: ManagedUser, active: boolean) {
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: active ? 'PATCH' : 'DELETE',
        ...(active && { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: true }) }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'No se pudo cambiar el estado del usuario.');
      toast.success(active ? 'Usuario reactivado.' : 'Usuario desactivado. Sus responsabilidades e historial se conservan.');
      setDeactivating(null);
      await refresh();
    } catch (err) { toast.error(err instanceof Error ? err.message : 'No se pudo actualizar.'); }
    finally { setSaving(false); }
  }

  if (isLoading) return <p role="status">Cargando sesión…</p>;
  if (!canManage) return <div className="space-y-2"><h1 className="text-2xl font-bold">Gestión de usuarios</h1><p className="text-slate-600">La administración de usuarios está disponible para los administradores de la empresa.</p></div>;

  return <div className="space-y-6 pb-10">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-3xl font-bold">Usuarios de la empresa</h1><p className="mt-2 text-slate-600">{tenant.name} · Gestione las personas que participan en el sistema de calidad.</p></div><Button disabled={loading || saving} onClick={() => edit(null)}><Plus className="mr-2 h-4 w-4" />Crear usuario</Button></div>
    <p className="text-sm text-slate-500">Los cargos describen el puesto de trabajo; los roles controlan el acceso. La desactivación bloquea el ingreso y conserva las responsabilidades y el historial.</p>
    <div className="flex flex-wrap gap-3"><Input aria-label="Buscar usuarios" className="max-w-lg" placeholder="Buscar nombre, correo o cargo" value={query} onChange={event => setQuery(event.target.value)} /><select aria-label="Filtrar por estado" className="h-10 rounded-md border bg-background px-3 text-sm" value={filter} onChange={event => setFilter(event.target.value)}><option value="TODOS">Todos los estados</option><option value="ACTIVOS">Activos</option><option value="DESACTIVADOS">Desactivados</option></select></div>
    {error && <div role="alert" className="rounded border border-red-200 p-4 text-red-700">{error}<Button variant="outline" className="ml-3" onClick={() => void refresh()}>Reintentar</Button></div>}
    {loading && <p role="status">Cargando usuarios…</p>}
    {!loading && !error && <div className="overflow-x-auto rounded-lg border bg-white"><table className="w-full text-sm"><thead className="bg-slate-50 text-left"><tr><th className="p-4">Persona</th><th className="p-4">Cargo</th><th className="p-4">Rol</th><th className="p-4">Designación</th><th className="p-4">Estado</th><th className="p-4 text-right">Acciones</th></tr></thead><tbody>{filtered.map(user => <tr key={user.id} className="border-t"><td className="p-4"><p className="font-medium">{user.name}</p><p className="text-slate-500">{user.email}</p></td><td className="p-4">{user.position || 'Sin cargo registrado'}</td><td className="p-4">{user.role === 'SUPER_ADMIN' ? 'Administrador global' : roles[user.role]}</td><td className="p-4">{user.topManagement ? <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800"><Crown className="mr-1 h-3 w-3" />Alta dirección</Badge> : '—'}</td><td className="p-4"><Badge variant={user.active ? 'default' : 'secondary'}>{user.active ? 'Activo' : 'Desactivado'}</Badge></td><td className="p-4"><div className="flex justify-end gap-2">{user.role === 'SUPER_ADMIN' ? <span className="text-xs text-slate-500">Gestionar en el portal global</span> : <><Button size="sm" variant="outline" disabled={saving} onClick={() => edit(user)}><Pencil className="mr-2 h-4 w-4" />Editar</Button><Button size="sm" variant="outline" disabled={saving || user.id === currentUser?.id} onClick={() => user.active ? setDeactivating(user) : void setActive(user, true)}>{user.active ? <UserX className="mr-2 h-4 w-4" /> : <UserCheck className="mr-2 h-4 w-4" />}{user.active ? 'Desactivar' : 'Reactivar'}</Button></>}</div></td></tr>)}{!filtered.length && <tr><td colSpan={6} className="p-8 text-center text-slate-500">No hay usuarios que coincidan con la búsqueda.</td></tr>}</tbody></table></div>}
    <Dialog open={open} onOpenChange={value => { if (!saving) setOpen(value); }}><DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{editing ? 'Editar usuario' : 'Crear usuario'}</DialogTitle><DialogDescription>La persona pertenecerá a {tenant.name}.</DialogDescription></DialogHeader><form onSubmit={save} className="space-y-4">
      <label className="block space-y-1 text-sm">Nombre completo *<Input required minLength={2} maxLength={250} value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} /></label>
      <label className="block space-y-1 text-sm">Correo electrónico *<Input required type="email" maxLength={254} value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} /></label>
      <label className="block space-y-1 text-sm">Cargo<Input maxLength={250} value={form.position} onChange={event => setForm({ ...form, position: event.target.value })} /></label>
      <label className="block space-y-1 text-sm">Rol de acceso *<select required disabled={editing?.id === currentUser?.id} className="h-10 w-full rounded-md border bg-background px-3 text-sm disabled:opacity-50" value={form.role} onChange={event => { const role = event.target.value as UserForm['role']; setForm({ ...form, role, topManagement: role === 'AUDITOR_INTERNO' || role === 'AUDITOR_EXTERNO' ? false : form.topManagement }); }}>{Object.entries(roles).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <label className="flex items-start gap-3 rounded border p-3 text-sm"><input className="mt-1" type="checkbox" disabled={auditorSelected} checked={form.topManagement} onChange={event => setForm({ ...form, topManagement: event.target.checked })} /><span><strong>Designar como alta dirección</strong><span className="mt-1 block text-slate-500">Podrá aprobar y poner en vigencia la matriz de responsabilidades 5.3. Esta designación debe corresponder con la autoridad real de la organización y queda registrada en el historial. Los perfiles auditores son incompatibles con esta designación.</span></span></label>
      <label className="block space-y-1 text-sm">{editing ? 'Nueva contraseña (dejar vacía para conservarla)' : 'Contraseña inicial *'}<Input required={!editing} type="password" autoComplete="new-password" minLength={6} maxLength={72} value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} /></label>
      <div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={saving} onClick={() => setOpen(false)}>Cancelar</Button><Button disabled={saving} type="submit">{saving ? 'Guardando…' : 'Guardar usuario'}</Button></div>
    </form></DialogContent></Dialog>
    <Dialog open={!!deactivating} onOpenChange={value => { if (!value && !saving) setDeactivating(null); }}><DialogContent><DialogHeader><DialogTitle>Desactivar usuario</DialogTitle><DialogDescription>Se bloqueará el acceso de {deactivating?.name}. Sus responsabilidades y registros se conservarán. Puede reactivar la cuenta desde este listado.</DialogDescription></DialogHeader><div className="flex justify-end gap-2"><Button variant="outline" disabled={saving} onClick={() => setDeactivating(null)}>Cancelar</Button><Button variant="destructive" disabled={saving} onClick={() => deactivating && void setActive(deactivating, false)}>{saving ? 'Desactivando…' : 'Desactivar usuario'}</Button></div></DialogContent></Dialog>
  </div>;
}
