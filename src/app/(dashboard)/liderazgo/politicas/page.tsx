"use client";

import React, { useState } from 'react';
import {
  FileText, Plus, Search, Filter, MoreVertical,
  Edit, Trash2, Download, Eye, CheckCircle2, XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

// Mock data for policies
const mockPolicies = [
  {
    id: 'POL-001',
    title: 'Política de Calidad Institucional',
    version: '2.0',
    status: 'Vigente',
    date: '15/01/2026',
    author: 'Dirección General',
    type: 'General',
  },
  {
    id: 'POL-002',
    title: 'Política de Seguridad de la Información',
    version: '1.5',
    status: 'Vigente',
    date: '10/11/2025',
    author: 'Comité de Seguridad',
    type: 'Seguridad',
  },
  {
    id: 'POL-003',
    title: 'Política de Gestión de Riesgos',
    version: '1.0',
    status: 'En Revisión',
    date: '20/02/2026',
    author: 'Área de Planificación',
    type: 'Riesgos',
  },
  {
    id: 'POL-004',
    title: 'Política Ambiental',
    version: '1.2',
    status: 'Vigente',
    date: '05/08/2025',
    author: 'Dirección General',
    type: 'Sostenibilidad',
  }
];

export default function PoliticasPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPolicies = mockPolicies.filter(policy =>
    policy.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    policy.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    policy.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Vigente':
        return <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200 rounded-none font-bold text-[10px] uppercase px-3 shadow-none">Vigente</Badge>;
      case 'En Revisión':
        return <Badge className="bg-amber-50 text-amber-600 border-amber-200 rounded-none font-bold text-[10px] uppercase px-3 shadow-none">En Revisión</Badge>;
      case 'Obsoleta':
        return <Badge className="bg-rose-50 text-rose-600 border-rose-200 rounded-none font-bold text-[10px] uppercase px-3 shadow-none">Obsoleta</Badge>;
      default:
        return <Badge className="bg-slate-50 text-slate-400 border-slate-200 rounded-none font-bold text-[10px] uppercase px-3 shadow-none">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10 bg-slate-50 min-h-screen -m-6 p-10">
      <div className="flex items-center justify-between border-b border-slate-200 pb-8">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase italic leading-none">Políticas <span className="text-blue-600">Institucionales</span></h1>
          <div className="flex items-center gap-3 mt-4">
            <Badge className="bg-white border-slate-200 text-slate-500 rounded-none font-bold text-[10px] uppercase tracking-[0.2em] px-3 shadow-sm">ISO 9001:2015</Badge>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Cláusula 5.2 — Política de la Calidad</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" className="border-slate-200 text-slate-400 hover:bg-white rounded-none h-12 px-6 font-bold uppercase text-[10px] tracking-widest shadow-none">
            <Download className="w-4 h-4 mr-2" /> Exportar Listado
          </Button>
          <Button className="bg-blue-600 text-white hover:bg-blue-700 rounded-none px-8 h-12 font-bold uppercase italic tracking-wider transition-all shadow-lg hover:shadow-blue-100">
            <Plus className="h-4 w-4 mr-2" /> Nueva Política
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 p-6 flex items-center gap-6 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar por código, título, tipo de política..."
            className="pl-12 h-14 bg-slate-50 border-slate-200 rounded-none text-slate-900 focus:ring-blue-500"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="h-14 w-14 border-slate-200 text-slate-400 hover:bg-slate-50 rounded-none shrink-0 shadow-none">
          <Filter className="h-5 w-5" />
        </Button>
      </div>

      {/* Policies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredPolicies.length > 0 ? (
          filteredPolicies.map((policy) => (
            <div key={policy.id} className="group bg-white border border-slate-200 overflow-hidden relative transition-all hover:shadow-xl hover:border-slate-300">
              <div className="h-1.5 w-full bg-blue-600" />
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 border border-blue-100 mb-2 inline-block">
                      {policy.id}
                    </span>
                    <h3 className="text-xl font-black text-slate-900 italic uppercase tracking-tighter leading-tight">
                      {policy.title}
                    </h3>
                  </div>
                  {getStatusBadge(policy.status)}
                </div>

                <div className="grid grid-cols-2 gap-px bg-slate-100 border border-slate-100 mb-6">
                  <div className="bg-white p-4">
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1">Categoría</p>
                    <p className="text-xs font-bold text-slate-700 uppercase tracking-tight">{policy.type}</p>
                  </div>
                  <div className="bg-white p-4">
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1">Versión</p>
                    <p className="text-xs font-bold text-slate-900">v{policy.version}</p>
                  </div>
                  <div className="bg-white p-4">
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1">Última Revisión</p>
                    <p className="text-xs font-bold text-slate-700 italic">{policy.date}</p>
                  </div>
                  <div className="bg-white p-4">
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1">Responsable</p>
                    <p className="text-xs font-bold text-slate-900 uppercase truncate">{policy.author}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-none shadow-none border-0">
                      <Eye className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-none shadow-none border-0">
                      <Edit className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-none shadow-none border-0">
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                  <Button variant="ghost" className="h-10 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-none shadow-none border-0">
                    <Download className="h-4 w-4 mr-2" /> PDF
                  </Button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-1 md:col-span-2 bg-white border border-slate-200 p-20 flex flex-col items-center justify-center shadow-sm">
            <FileText className="h-16 w-16 text-slate-200 mb-6" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-sm text-center">
              No se encontraron registros de políticas activos
            </p>
            <Button variant="outline" className="mt-8 border-slate-200 text-slate-400 hover:bg-slate-50 rounded-none uppercase font-bold text-[10px] tracking-widest px-8 shadow-none" onClick={() => setSearchTerm('')}>
              Limpiar filtros
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
