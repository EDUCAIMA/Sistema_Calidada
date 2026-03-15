import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Download, Filter, MoreVertical, ExternalLink } from 'lucide-react';
import { useApp } from '@/context/app-context';
import { useRouter } from 'next/navigation';
import { Tenant } from '@/lib/types';

interface TenantReal extends Tenant {
  _count?: {
    users: number;
  };
}

interface SystemsTableProps {
  searchTerm: string;
}

export function SystemsTable({ searchTerm }: SystemsTableProps) {
  const { setTenant } = useApp();
  const router = useRouter();
  const [tenants, setTenants] = useState<TenantReal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTenants() {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/tenants');
        if (!response.ok) throw new Error('Error al cargar empresas');
        const data = await response.json();
        setTenants(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchTenants();
  }, []);

  const handleEnterSystem = (system: TenantReal) => {
    setTenant(system);
    router.push('/dashboard');
  };

  const filteredSystems = useMemo(() => {
    const lowerTerm = searchTerm.toLowerCase();
    return tenants.filter(sys => 
      sys.name.toLowerCase().includes(lowerTerm) || 
      sys.slug.toLowerCase().includes(lowerTerm)
    );
  }, [tenants, searchTerm]);

  if (loading) return (
    <div className="flex items-center justify-center p-20">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <Card className="bg-white border-slate-200 shadow-sm mb-8">
      <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50">
        <div>
          <CardTitle className="text-xl font-bold text-slate-900 tracking-tight">
            Sistemas QMS Activos
          </CardTitle>
          <CardDescription className="text-slate-500 text-xs">
            Detalle por empresa y nivel de cumplimiento normativo ({filteredSystems.length} resultados)
          </CardDescription>
        </div>
        <div className="flex gap-3">
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
                <th className="text-left py-4 pl-6 font-bold">Empresa / Sistema</th>
                <th className="text-left py-4 font-bold">Slug / Identificador</th>
                <th className="text-left py-4 font-bold">Estado</th>
                <th className="text-left py-4 font-bold">Implementación</th>
                <th className="text-left py-4 font-bold">Usuarios</th>
                <th className="text-right py-4 pr-6 font-bold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSystems.length > 0 ? (
                filteredSystems.map((system) => (
                  <tr key={system.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 pl-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{system.name}</span>
                        <span className="text-[10px] text-slate-400 mt-0.5 uppercase">ID: {system.id.slice(-8).toUpperCase()}</span>
                      </div>
                    </td>
                    <td className="py-4 text-sm text-slate-600 font-medium">{system.slug}</td>
                    <td className="py-4">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${  
                        system.active ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                        'bg-red-50 text-red-600 border-red-100'
                      }`}>
                        <div className={`w-1 h-1 rounded-full ${
                          system.active ? 'bg-emerald-500' : 'bg-red-500'
                        }`} />
                        {system.active ? 'Activo' : 'Inactivo'}
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="w-32 flex flex-col gap-1.5">
                        <div className="flex justify-between items-center text-[10px] font-bold">
                          <span className="text-slate-500">75%</span>
                          <span className="text-slate-400 italic">{system.plan}</span>
                        </div>
                        <Progress value={75} className="h-1.5 bg-slate-100" />
                      </div>
                    </td>
                    <td className="py-4 text-sm text-slate-600 font-bold">{system._count?.users || 0}</td>
                    <td className="py-4 pr-6 text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 text-[10px] font-bold uppercase tracking-widest text-blue-600 hover:text-white hover:bg-blue-600 gap-2 border border-blue-100 rounded-lg px-3"
                          onClick={() => handleEnterSystem(system)}
                        >
                          <ExternalLink className="h-3 w-3" />
                          Ingresar
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-sm">
                    No se encontraron sistemas QMS que coincidan con la búsqueda.
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
