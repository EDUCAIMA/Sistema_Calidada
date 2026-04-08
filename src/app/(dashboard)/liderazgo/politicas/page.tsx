"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/app-context';
import {
  FileText, Plus, Search, Edit, Trash2, Download, Eye, Save,
  HelpCircle, Clock, Settings, Shield, BookOpen, Scale,
  Leaf, Info, CheckCircle2, AlertTriangle, Megaphone, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Type definitions
interface PolicyCommunication {
  id: string;
  policyId: string;
  audience: string;
  method: string;
  date: string;
  evidence?: string | null;
  responsibleName: string;
  notes?: string | null;
  createdAt: string;
}

interface Policy {
  id: string;
  title: string;
  content: string;
  version: string;
  status: 'VIGENTE' | 'EN_REVISION' | 'OBSOLETA';
  author: string;
  type: string;
  objectives?: string[];
  createdAt: string;
  updatedAt: string;
  communications?: PolicyCommunication[];
}

const statusMap: Record<string, string> = {
  'VIGENTE': 'Vigente',
  'EN_REVISION': 'En Revisión',
  'OBSOLETA': 'Obsoleta',
};

const statusReverseMap: Record<string, string> = {
  'Vigente': 'VIGENTE',
  'En Revisión': 'EN_REVISION',
  'Obsoleta': 'OBSOLETA',
};

// Category icons and colors
const typeConfig: Record<string, { icon: React.ReactNode; color: string; bg: string; softBg: string; border: string }> = {
  'General': {
    icon: <Shield className="h-5 w-5" />,
    color: 'text-blue-600', bg: 'bg-blue-600', softBg: 'bg-blue-50', border: 'border-blue-200',
  },
  'Seguridad': {
    icon: <Scale className="h-5 w-5" />,
    color: 'text-indigo-600', bg: 'bg-indigo-600', softBg: 'bg-indigo-50', border: 'border-indigo-200',
  },
  'Riesgos': {
    icon: <AlertTriangle className="h-5 w-5" />,
    color: 'text-amber-600', bg: 'bg-amber-600', softBg: 'bg-amber-50', border: 'border-amber-200',
  },
  'Sostenibilidad': {
    icon: <Leaf className="h-5 w-5" />,
    color: 'text-emerald-600', bg: 'bg-emerald-600', softBg: 'bg-emerald-50', border: 'border-emerald-200',
  },
};

const defaultTypeConfig = {
  icon: <BookOpen className="h-5 w-5" />,
  color: 'text-slate-600', bg: 'bg-slate-600', softBg: 'bg-slate-50', border: 'border-slate-200',
};

export default function PoliticasPage() {
  const { tenant } = useApp();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showISOInfo, setShowISOInfo] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [newPolicy, setNewPolicy] = useState<Partial<Policy>>({ type: 'General', status: 'EN_REVISION' });
  const [showCommunication, setShowCommunication] = useState(false);
  const [newComm, setNewComm] = useState({ audience: '', method: '', date: '', evidence: '', responsibleName: '', notes: '' });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Document Metadata State
  const [docMetadata, setDocMetadata] = useState({
    code: 'DIR-REG-005',
    version: '01',
    approvalDate: '2026-03-21'
  });

  // Coding Standard States
  const [processes, setProcesses] = useState<any[]>([]);
  const [catPrefixes, setCatPrefixes] = useState<any>(null);
  const [docTypePrefixes, setDocTypePrefixes] = useState<any>(null);
  const [builder, setBuilder] = useState({
      processId: '',
      type: 'REGISTRO',
      consecutive: '001'
  });

  useEffect(() => {
    if (tenant?.id) {
      // Fetch policies from API
      const fetchPolicies = async () => {
        try {
          const res = await fetch(`/api/liderazgo/politicas?tenantId=${tenant.id}`);
          const data = await res.json();
          if (data && !data.error) setPolicies(data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
      };
      fetchPolicies();

      // Fetch standards for coding
      const savedCats = localStorage.getItem('sgc_cat_prefixes');
      const savedDocs = localStorage.getItem('sgc_doc_prefixes');
      if (savedCats) setCatPrefixes(JSON.parse(savedCats));
      if (savedDocs) setDocTypePrefixes(JSON.parse(savedDocs));

      const fetchProcesses = async () => {
        try {
          const res = await fetch(`/api/procesos?tenantId=${tenant.id}`);
          const data = await res.json();
          if (data && !data.error) setProcesses(data);
        } catch (e) { console.error(e); }
      };
      fetchProcesses();

      // Fetch metadata
      const fetchMetadata = async () => {
        try {
          const res = await fetch(`/api/formatos?tenantId=${tenant.id}&moduleKey=5.2`);
          const data = await res.json();
          if (data && !data.error) {
            setDocMetadata({
              code: data.code,
              version: data.version,
              approvalDate: data.approvalDate
            });
          }
        } catch (error) { console.error(error); }
      };
      fetchMetadata();
    }
  }, [tenant?.id]);

  // Auto-generate code when builder changes
  useEffect(() => {
    if (showConfig && builder.processId && catPrefixes && docTypePrefixes) {
      const process = processes.find(p => p.id === builder.processId);
      if (process) {
        const macro = catPrefixes[process.category] || 'GN';
        const procCode = process.code || 'PROC';
        const type = docTypePrefixes[builder.type] || 'RE';
        const generated = `${macro}.${procCode}.${type}.${builder.consecutive}`;
        setDocMetadata(prev => ({ ...prev, code: generated }));
      }
    }
  }, [builder, showConfig, catPrefixes, docTypePrefixes, processes]);

  const filteredPolicies = policies.filter(policy =>
    policy.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    policy.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    policy.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusConfig = (status: string) => {
    const displayStatus = statusMap[status] || status;
    switch (displayStatus) {
      case 'Vigente':
        return { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200', icon: <CheckCircle2 className="w-3 h-3" />, label: 'Vigente' };
      case 'En Revisión':
        return { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200', icon: <Clock className="w-3 h-3" />, label: 'En Revisión' };
      case 'Obsoleta':
        return { bg: 'bg-rose-100', text: 'text-rose-800', border: 'border-rose-200', icon: <AlertTriangle className="w-3 h-3" />, label: 'Obsoleta' };
      default:
        return { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', icon: null, label: status };
    }
  };

  const handleCreate = async () => {
    if (!newPolicy.title) { toast.error('El título es requerido'); return; }
    if (!newPolicy.content) { toast.error('El contenido es requerido'); return; }

    try {
      const res = await fetch('/api/liderazgo/politicas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedPolicy?.id || undefined,
          tenantId: tenant?.id,
          title: newPolicy.title,
          content: newPolicy.content,
          type: newPolicy.type || 'General',
          version: newPolicy.version || '1.0',
          status: newPolicy.status || 'EN_REVISION',
          author: newPolicy.author || 'Sin asignar',
          objectives: newPolicy.objectives || [],
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      if (selectedPolicy) {
        setPolicies(policies.map(p => p.id === data.id ? data : p));
        toast.success('Política actualizada exitosamente');
      } else {
        setPolicies([data, ...policies]);
        toast.success('Política creada exitosamente');
      }

      setShowNew(false);
      setNewPolicy({ type: 'General', status: 'EN_REVISION' });
      setSelectedPolicy(null);
    } catch (error) {
      toast.error('Error al guardar la política');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/liderazgo/politicas?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPolicies(policies.filter(p => p.id !== id));
      toast.success('Política eliminada');
    } catch (error) {
      toast.error('Error al eliminar la política');
    }
  };

  const handleAddCommunication = async () => {
    if (!selectedPolicy || !newComm.audience || !newComm.method || !newComm.date) {
      toast.error('Complete los campos obligatorios'); return;
    }
    
    setUploading(true);
    try {
      let finalEvidence = newComm.evidence;
      
      // If there's a file selected, upload it first
      const file = fileInputRef.current?.files?.[0];
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (uploadData.error) throw new Error(uploadData.error);
        finalEvidence = uploadData.url;
      }

      const res = await fetch('/api/liderazgo/politicas/comunicaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          policyId: selectedPolicy.id, 
          ...newComm,
          evidence: finalEvidence 
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Update local state
      const updatedComms = [...(selectedPolicy.communications || []), data];
      const updatedPolicy = { ...selectedPolicy, communications: updatedComms };
      setSelectedPolicy(updatedPolicy);
      setPolicies(policies.map(p => p.id === updatedPolicy.id ? updatedPolicy : p));
      setNewComm({ audience: '', method: '', date: '', evidence: '', responsibleName: '', notes: '' });
      if (fileInputRef.current) fileInputRef.current.value = '';
      setShowCommunication(false);
      toast.success('Comunicación registrada exitosamente con evidencia');
    } catch (error: any) {
      toast.error(`Error: ${error.message || 'Error al registrar la comunicación'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteCommunication = async (commId: string) => {
    if (!selectedPolicy) return;
    try {
      const res = await fetch(`/api/liderazgo/politicas/comunicaciones?id=${commId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const updatedComms = (selectedPolicy.communications || []).filter(c => c.id !== commId);
      const updatedPolicy = { ...selectedPolicy, communications: updatedComms };
      setSelectedPolicy(updatedPolicy);
      setPolicies(policies.map(p => p.id === updatedPolicy.id ? updatedPolicy : p));
      toast.success('Comunicación eliminada');
    } catch (error) {
      toast.error('Error al eliminar la comunicación');
    }
  };

  const handleDownloadPDF = () => {
    try {
      const safeTenantName = tenant?.name || "SGC";

      const doc = new jsPDF('p', 'mm', 'letter');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;

      // --- HEADER ---
      const headerHeight = 22;
      doc.setDrawColor(30, 41, 59);
      doc.setLineWidth(0.4);
      doc.rect(margin, margin, pageWidth - (margin * 2), headerHeight);

      const col1Width = 40;
      const col3Width = 60;
      const col2Width = pageWidth - (margin * 2) - col1Width - col3Width;

      doc.line(margin + col1Width, margin, margin + col1Width, margin + headerHeight);
      doc.line(margin + col1Width + col2Width, margin, margin + col1Width + col2Width, margin + headerHeight);

      if (tenant?.logo) {
        try {
          doc.addImage(tenant.logo, 'PNG', margin + 2, margin + 2, col1Width - 4, headerHeight - 4, undefined, 'FAST');
        } catch (e) {
          doc.setFontSize(9).setFont('helvetica', 'bold');
          doc.text(safeTenantName.toUpperCase(), margin + col1Width / 2, margin + headerHeight / 2 + 2, { align: 'center', maxWidth: col1Width - 4 });
        }
      } else {
        doc.setFontSize(9).setFont('helvetica', 'bold');
        doc.text(safeTenantName.toUpperCase(), margin + col1Width / 2, margin + headerHeight / 2 + 2, { align: 'center', maxWidth: col1Width - 4 });
      }

      doc.setFontSize(14).text("Políticas Institucionales", margin + col1Width + col2Width / 2, margin + 14, { align: 'center' });

      doc.setFontSize(8).setFont('helvetica', 'normal');
      const metaX = margin + col1Width + col2Width + 4;
      doc.text(`Código: ${docMetadata.code}`, metaX, margin + 5);
      doc.text(`Versión: ${docMetadata.version}`, metaX, margin + 9.5);
      doc.text(`Fecha: ${docMetadata.approvalDate}`, metaX, margin + 14);
      doc.text(`Página: 1 de 1`, metaX, margin + 18.5);

      let currentY = margin + headerHeight + 10;

      // --- POLICIES TABLE ---
      autoTable(doc, {
        startY: currentY,
        head: [['Código', 'Política', 'Tipo', 'Versión', 'Estado', 'Responsable', 'Fecha']],
        body: policies.map(p => [
          p.id, p.title, p.type, `v${p.version}`, statusMap[p.status] || p.status, p.author, new Date(p.createdAt).toLocaleDateString()
        ]),
        styles: { fontSize: 8, cellPadding: 3, textColor: [30, 41, 59] },
        headStyles: { fillColor: [19, 109, 236], textColor: [255, 255, 255], fontStyle: 'bold' },
        margin: { left: margin, right: margin },
        columnStyles: {
          0: { cellWidth: 18 },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 22 },
          3: { cellWidth: 15 },
          4: { cellWidth: 20 },
          5: { cellWidth: 30 },
          6: { cellWidth: 22 },
        }
      });

      currentY = (doc as any).lastAutoTable.finalY + 15;

      // --- DETAIL FOR EACH POLICY ---
      policies.forEach((policy) => {
        if (currentY > pageHeight - 60) {
          doc.addPage();
          currentY = margin + 10;
        }

        doc.setFontSize(11).setFont('helvetica', 'bold');
        doc.setTextColor(19, 109, 236);
        doc.text(`${policy.id} — ${policy.title}`, margin, currentY);
        currentY += 6;

        doc.setFontSize(9).setFont('helvetica', 'normal');
        doc.setTextColor(30, 41, 59);
        const contentLines = doc.splitTextToSize(policy.content, pageWidth - margin * 2);
        doc.text(contentLines, margin, currentY);
        currentY += contentLines.length * 4.5 + 8;

        if (policy.objectives && policy.objectives.length > 0) {
          doc.setFontSize(9).setFont('helvetica', 'bold');
          doc.text('Objetivos:', margin, currentY);
          currentY += 5;
          doc.setFont('helvetica', 'normal');
          policy.objectives.forEach((obj) => {
            doc.text(`• ${obj}`, margin + 4, currentY);
            currentY += 4.5;
          });
          currentY += 8;
        }
      });

      doc.save(`Politicas_${safeTenantName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
      toast.success('Documento descargado exitosamente');
    } catch (error: any) {
      console.error('ERROR_PDF:', error);
      toast.error('Error al descargar');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] -m-6 p-8 font-sans text-slate-900 pb-20">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-[900] text-slate-900 tracking-tight uppercase">Políticas Institucionales</h1>
            <button
              onClick={() => setShowISOInfo(true)}
              className="p-1.5 rounded-full hover:bg-blue-50 text-blue-400 hover:text-blue-600 transition-all active:scale-95"
              title="Ver información normativa ISO 9001:2015"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <span className="bg-[#136dec]/10 text-[#136dec] text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">Cláusula 5.2</span>
            <span className="text-slate-500 text-xs font-semibold uppercase tracking-widest">Política de la Calidad</span>

            <div className="w-px h-4 bg-slate-300 mx-1"></div>

            {/* UI Document Metadata (Dynamic) */}
            <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setShowConfig(true)}>
              <span className="bg-white border border-slate-200 text-slate-600 text-[10px] font-bold px-2 py-1 rounded shadow-sm uppercase group-hover:border-blue-400 group-hover:text-blue-600 transition-colors">Código: {docMetadata.code}</span>
              <span className="bg-white border border-slate-200 text-slate-600 text-[10px] font-bold px-2 py-1 rounded shadow-sm uppercase group-hover:border-blue-400 group-hover:text-blue-600 transition-colors">Versión: {docMetadata.version}</span>
              <span className="bg-white border border-slate-200 text-slate-600 text-[10px] font-bold px-2 py-1 rounded shadow-sm uppercase group-hover:border-blue-400 group-hover:text-blue-600 transition-colors">Aprobación: {docMetadata.approvalDate}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="flex items-center gap-2 px-4 py-2 bg-white border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-bold text-xs transition-all shadow-sm h-10"
          >
            <Clock className="w-4 h-4" />
            HISTORIAL
          </Button>
          <Button
            onClick={handleDownloadPDF}
            variant="outline"
            className="flex items-center gap-2 px-4 py-2 bg-white border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-bold text-xs transition-all shadow-sm h-10"
          >
            <Download className="w-4 h-4 text-red-500" />
            PDF
          </Button>
          <Button
            onClick={() => { setSelectedPolicy(null); setNewPolicy({ type: 'General', status: 'EN_REVISION' }); setShowNew(true); }}
            className="flex items-center gap-2 px-5 py-2 bg-[#136dec] text-white rounded-lg hover:bg-blue-600 font-bold text-xs shadow-lg shadow-blue-600/20 transition-all h-10 uppercase tracking-wider"
          >
            <Plus className="w-4 h-4" />
            NUEVA POLÍTICA
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <div className="relative max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar por código, título o tipo de política..."
            className="pl-12 h-11 bg-white border-slate-200 rounded-xl text-slate-700 focus-visible:ring-1 focus-visible:ring-[#136dec] shadow-sm"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Policies Grid */}
      <div className="space-y-6">
        {filteredPolicies.length > 0 ? (
          filteredPolicies.map((policy) => {
            const tConfig = typeConfig[policy.type] || defaultTypeConfig;
            const sConfig = getStatusConfig(policy.status);

            return (
              <section key={policy.id} className="bg-white rounded-xl border-2 border-slate-200 overflow-hidden shadow-sm transition-all hover:shadow-md">
                {/* Card Header */}
                <div className={cn("px-6 py-4 border-b-2 border-slate-100 flex items-center justify-between", tConfig.softBg)}>
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg", tConfig.softBg, tConfig.color)}>
                      {tConfig.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded border", tConfig.color, tConfig.border, tConfig.softBg)}>
                          {policy.id}
                        </span>
                        <span className={cn("text-[10px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1", sConfig.bg, sConfig.text, sConfig.border)}>
                          {sConfig.icon}
                          {sConfig.label}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-800 uppercase tracking-wide text-sm">{policy.title}</h3>
                    </div>
                  </div>
                  <span className={cn("text-[10px] font-bold px-3 py-1 rounded-full border border-current/20", tConfig.softBg, tConfig.color)}>
                    {policy.type}
                  </span>
                </div>

                {/* Card Body */}
                <div className="px-6 py-5">
                  <p className="text-sm text-slate-600 leading-relaxed mb-5 line-clamp-3">
                    {policy.content}
                  </p>

                  {/* Objectives preview */}
                  {policy.objectives && policy.objectives.length > 0 && (
                    <div className="bg-slate-50 rounded-lg p-4 mb-5 border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Objetivos Asociados</p>
                      <div className="flex flex-wrap gap-2">
                        {policy.objectives.slice(0, 3).map((obj, i) => (
                          <span key={i} className="text-[11px] bg-white border border-slate-200 text-slate-600 px-3 py-1 rounded-lg font-medium">
                            {obj}
                          </span>
                        ))}
                        {policy.objectives.length > 3 && (
                          <span className="text-[11px] bg-blue-50 border border-blue-100 text-blue-600 px-3 py-1 rounded-lg font-bold">
                            +{policy.objectives.length - 3} más
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Communications badge */}
                  {(policy.communications || []).length > 0 && (
                    <div className="flex items-center gap-2 mb-3">
                      <Megaphone className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-[11px] font-bold text-amber-600">
                        {(policy.communications || []).length} Comunicaciones registradas
                      </span>
                    </div>
                  )}

                  {/* Meta row */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <span>v{policy.version}</span>
                      <span>{new Date(policy.createdAt).toLocaleDateString()}</span>
                      <span>{policy.author}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        onClick={() => { setSelectedPolicy(policy); setShowDetail(true); }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-[#136dec] hover:bg-blue-50 rounded-lg transition-all"
                        onClick={() => { setSelectedPolicy(policy); setNewPolicy(policy); setShowNew(true); }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        onClick={() => handleDelete(policy.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </section>
            );
          })
        ) : (
          <div className="p-20 text-center bg-white rounded-xl border border-dashed border-slate-200 shadow-sm">
            <Info className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">No se encontraron políticas</p>
            <p className="text-xs text-slate-300 font-medium mt-2">Intente con otros términos de búsqueda o cree una nueva política.</p>
            <Button
              variant="outline"
              className="mt-6 border-slate-200 text-slate-500 rounded-lg text-xs font-bold uppercase tracking-wider"
              onClick={() => setSearchTerm('')}
            >
              Limpiar búsqueda
            </Button>
          </div>
        )}
      </div>

      {/* ═══ CREATE / EDIT DIALOG ═══ */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-2xl sm:max-w-2xl w-[90vw] bg-white border-none p-0 overflow-hidden rounded-3xl shadow-2xl font-sans">
          <div className="px-6 py-6 border-b border-slate-100 flex items-center justify-between bg-white">
            <div className="flex items-center gap-3">
              <div className="bg-[#136dec] p-1.5 rounded-md shadow-lg shadow-blue-600/20">
                <Plus className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-extrabold text-[#1e293b] tracking-tight uppercase leading-none">
                  {selectedPolicy ? 'MODIFICAR POLÍTICA' : 'REGISTRAR NUEVA POLÍTICA'}
                </DialogTitle>
                <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wide">
                  ISO 9001:2015 — CLÁUSULA 5.2 POLÍTICA DE LA CALIDAD
                </p>
              </div>
            </div>
          </div>

          <div className="px-6 py-8 space-y-8 overflow-y-auto max-h-[70vh] bg-[#fcfdfe]">
            {/* Title */}
            <div className="space-y-3">
              <Label className="text-[11px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                <span className="h-4 w-4 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">1</span>
                TÍTULO DE LA POLÍTICA *
              </Label>
              <Input
                className="bg-white border-slate-200 rounded-xl h-12 focus-visible:ring-1 focus-visible:ring-[#136dec] font-bold text-slate-700 uppercase"
                placeholder="Ej: POLÍTICA DE CALIDAD INSTITUCIONAL"
                value={newPolicy.title || ''}
                onChange={e => setNewPolicy({ ...newPolicy, title: e.target.value })}
              />
            </div>

            {/* Type & Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <Label className="text-[11px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">2</span>
                  CATEGORÍA
                </Label>
                <Select value={newPolicy.type} onValueChange={v => setNewPolicy({ ...newPolicy, type: v })}>
                  <SelectTrigger className="h-12 bg-white border-slate-200 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="General">General</SelectItem>
                    <SelectItem value="Seguridad">Seguridad</SelectItem>
                    <SelectItem value="Riesgos">Riesgos</SelectItem>
                    <SelectItem value="Sostenibilidad">Sostenibilidad</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <Label className="text-[11px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">3</span>
                  VERSIÓN
                </Label>
                <Input
                  className="bg-white border-slate-200 rounded-xl h-12 focus-visible:ring-1 focus-visible:ring-[#136dec] font-bold"
                  placeholder="Ej: 1.0"
                  value={newPolicy.version || ''}
                  onChange={e => setNewPolicy({ ...newPolicy, version: e.target.value })}
                />
              </div>
              <div className="space-y-3">
                <Label className="text-[11px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">4</span>
                  RESPONSABLE
                </Label>
                <Input
                  className="bg-white border-slate-200 rounded-xl h-12 focus-visible:ring-1 focus-visible:ring-[#136dec] font-bold text-xs uppercase"
                  placeholder="Ej: DIRECCIÓN GENERAL"
                  value={newPolicy.author || ''}
                  onChange={e => setNewPolicy({ ...newPolicy, author: e.target.value })}
                />
              </div>
            </div>

            {/* Content */}
            <div className="space-y-3">
              <Label className="text-[11px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                <span className="h-4 w-4 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">5</span>
                DECLARACIÓN DE LA POLÍTICA *
              </Label>
              <Textarea
                className="resize-none bg-white border-slate-200 rounded-xl p-5 focus-visible:ring-1 focus-visible:ring-[#136dec] font-medium text-slate-700 min-h-[140px]"
                placeholder="Redacte la declaración formal de la política..."
                value={newPolicy.content || ''}
                onChange={e => setNewPolicy({ ...newPolicy, content: e.target.value })}
              />
            </div>

            {/* Objectives */}
            <div className="space-y-3 pb-4">
              <Label className="text-[11px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                <span className="h-4 w-4 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">6</span>
                OBJETIVOS ASOCIADOS (uno por línea)
              </Label>
              <Textarea
                className="resize-none bg-white border-slate-200 rounded-xl p-5 focus-visible:ring-1 focus-visible:ring-[#136dec] font-medium text-slate-700 min-h-[100px] text-sm"
                placeholder="Garantizar la satisfacción del cliente&#10;Cumplir requisitos legales&#10;Mejorar continuamente"
                value={newPolicy.objectives?.join('\n') || ''}
                onChange={e => setNewPolicy({ ...newPolicy, objectives: e.target.value.split('\n').filter(o => o.trim()) })}
              />
            </div>
          </div>

          <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end items-center gap-3">
            <Button variant="ghost" className="text-slate-500 font-bold uppercase text-[10px] tracking-widest h-11 px-8" onClick={() => setShowNew(false)}>Descartar</Button>
            <Button className="bg-[#136dec] hover:bg-blue-700 text-white font-bold uppercase text-[10px] tracking-widest h-11 px-10 shadow-lg shadow-blue-600/20" onClick={handleCreate}>
              <Save className="h-4 w-4 mr-2" />
              {selectedPolicy ? 'Actualizar Política' : 'Guardar Política'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ DETAIL DIALOG ═══ */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-4xl max-h-[90vh] bg-white border-none p-0 overflow-hidden rounded-3xl shadow-2xl font-sans flex flex-col">
          <ScrollArea className="flex-1">
          {selectedPolicy && (() => {
            const tConfig = typeConfig[selectedPolicy.type] || defaultTypeConfig;
            const sConfig = getStatusConfig(selectedPolicy.status);
            return (
              <>
                <div className={cn("h-1.5 w-full", tConfig.bg)} />
                <div className="p-5">
                  <div className="flex items-center gap-4 mb-4">
                    <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md", tConfig.bg)}>
                      {React.cloneElement(tConfig.icon as React.ReactElement, { className: "w-6 h-6" })}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={cn("border-none uppercase text-[9px] tracking-widest font-black px-3 py-1", tConfig.bg)}>{selectedPolicy.type}</Badge>
                        <span className={cn("text-[10px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1", sConfig.bg, sConfig.text, sConfig.border)}>
                          {sConfig.icon}
                          {sConfig.label}
                        </span>
                      </div>
                      <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight truncate">{selectedPolicy.title}</h2>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/50">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Declaración de la Política</p>
                      <p className="text-xs font-medium text-slate-600 leading-relaxed">{selectedPolicy.content}</p>
                    </div>

                    {selectedPolicy.objectives && selectedPolicy.objectives.length > 0 && (
                      <div className="bg-[#136dec]/5 rounded-xl p-4 border border-blue-100/50">
                        <p className="text-[9px] font-black text-[#136dec] uppercase tracking-widest mb-1.5">Objetivos Asociados</p>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                          {selectedPolicy.objectives.map((obj, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-[11px] font-medium text-slate-700">
                              <CheckCircle2 className="w-3 h-3 text-[#136dec] shrink-0 mt-0.5" />
                              {obj}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* ═══ COMUNICACIÓN DE LA POLÍTICA (5.2.2) ═══ */}
                    <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-100/50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Megaphone className="w-3.5 h-3.5 text-amber-600" />
                          <p className="text-[9px] font-black text-amber-700 uppercase tracking-widest">Comunicación (5.2.2)</p>
                          <span className="text-[8px] font-bold bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded-full">
                            {(selectedPolicy.communications || []).length} registros
                          </span>
                        </div>
                        <Button
                          size="sm"
                          className="bg-amber-600 hover:bg-amber-700 text-white text-[9px] font-bold uppercase tracking-wider h-7 px-3 rounded-lg"
                          onClick={() => setShowCommunication(true)}
                        >
                          <Plus className="w-2.5 h-2.5 mr-1" /> Registrar
                        </Button>
                      </div>

                      {(selectedPolicy.communications || []).length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-white/60">
                                <th className="px-3 py-2 text-[9px] font-bold text-slate-500 uppercase tracking-widest border-b border-amber-100">Audiencia</th>
                                <th className="px-3 py-2 text-[9px] font-bold text-slate-500 uppercase tracking-widest border-b border-amber-100">Método</th>
                                <th className="px-3 py-2 text-[9px] font-bold text-slate-500 uppercase tracking-widest border-b border-amber-100">Fecha</th>
                                <th className="px-3 py-2 text-[9px] font-bold text-slate-500 uppercase tracking-widest border-b border-amber-100">Responsable</th>
                                <th className="px-3 py-2 text-[9px] font-bold text-slate-500 uppercase tracking-widest border-b border-amber-100">Evidencia</th>
                                <th className="px-3 py-2 text-[9px] font-bold text-slate-500 uppercase tracking-widest border-b border-amber-100 text-right">Acción</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-amber-50">
                              {(selectedPolicy.communications || []).map((comm) => (
                                <tr key={comm.id} className="hover:bg-white/40 transition-colors">
                                  <td className="px-3 py-1.5 text-[11px] font-medium text-slate-700">{comm.audience}</td>
                                  <td className="px-3 py-1.5 text-[11px] text-slate-600">{comm.method}</td>
                                  <td className="px-3 py-1.5 text-[11px] text-slate-500 font-bold">{new Date(comm.date).toLocaleDateString()}</td>
                                  <td className="px-3 py-1.5 text-[11px] text-slate-500 uppercase">{comm.responsibleName}</td>
                                  <td className="px-3 py-1.5 text-[11px] text-slate-400 italic">
                                    {comm.evidence ? (
                                      comm.evidence.startsWith('/uploads') ? (
                                        <a 
                                          href={comm.evidence} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:underline flex items-center gap-1 font-bold not-italic"
                                        >
                                          <Download className="w-2.5 h-2.5" /> Ver PDF
                                        </a>
                                      ) : comm.evidence
                                    ) : '—'}
                                  </td>
                                  <td className="px-3 py-1.5 text-right">
                                    <Button variant="ghost" size="icon" className="h-5 w-5 text-slate-300 hover:text-red-500 hover:bg-red-50" onClick={() => handleDeleteCommunication(comm.id)}>
                                      <Trash2 className="h-2.5 w-2.5" />
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-xs text-amber-600/60 italic text-center py-4">No se han registrado comunicaciones de esta política.</p>
                      )}

                      {/* Inline add communication form */}
                      {showCommunication && (
                        <div className="mt-4 bg-white rounded-xl p-4 border border-amber-200 space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Nueva Comunicación</p>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowCommunication(false)}><X className="h-3 h-3" /></Button>
                          </div>
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                            <Input className="h-7 text-[10px] border-slate-200" placeholder="Audiencia" value={newComm.audience} onChange={e => setNewComm({...newComm, audience: e.target.value})} />
                            <Input className="h-7 text-[10px] border-slate-200" placeholder="Método" value={newComm.method} onChange={e => setNewComm({...newComm, method: e.target.value})} />
                            <Input type="date" className="h-7 text-[10px] border-slate-200" value={newComm.date} onChange={e => setNewComm({...newComm, date: e.target.value})} />
                            <Input className="h-7 text-[10px] border-slate-200" placeholder="Responsable" value={newComm.responsibleName} onChange={e => setNewComm({...newComm, responsibleName: e.target.value})} />
                            <div className="flex flex-col gap-0.5 lg:col-span-2">
                              <input 
                                type="file" 
                                accept=".pdf"
                                ref={fileInputRef}
                                className="h-7 text-[8px] block w-full text-slate-500 file:mr-2 file:py-0 file:px-2 file:rounded-full file:border-0 file:text-[8px] file:font-semibold file:bg-blue-50 file:text-blue-700 border border-slate-200 rounded-md p-1" 
                              />
                            </div>
                            <Input className="h-7 text-[10px] border-slate-200 lg:col-span-2" placeholder="Notas adicionales..." value={newComm.notes} onChange={e => setNewComm({...newComm, notes: e.target.value})} />
                          </div>
                          <div className="flex justify-end">
                            <Button 
                              size="sm" 
                              className="bg-amber-600 hover:bg-amber-700 text-white text-[9px] font-bold uppercase h-7 px-4" 
                              onClick={handleAddCommunication}
                              disabled={uploading}
                            >
                              {uploading ? (
                                <><div className="animate-spin rounded-full h-2 w-2 border-b-2 border-white mr-1.5"></div> Subiendo...</>
                              ) : (
                                <><Save className="w-2.5 h-2.5 mr-1" /> Guardar</>
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Responsable</p>
                        <p className="text-sm font-bold text-slate-700 uppercase">{selectedPolicy.author}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Versión</p>
                        <p className="text-sm font-bold text-slate-500">v{selectedPolicy.version}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Fecha</p>
                        <p className="text-sm font-bold text-slate-500">{new Date(selectedPolicy.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <Button onClick={() => setShowDetail(false)} className="bg-slate-900 hover:bg-black text-white px-6 h-10 font-bold uppercase text-[9px] tracking-widest rounded-xl">Cerrar Ficha</Button>
                  </div>
                </div>
              </>
            );
          })()}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* ═══ ISO INFO DIALOG ═══ */}
      <Dialog open={showISOInfo} onOpenChange={setShowISOInfo}>
        <DialogContent className="w-[70vw] sm:max-w-[70vw] bg-white border border-gray-200 shadow-sm rounded-3xl overflow-hidden flex flex-col p-0 gap-0 font-sans">
          <header className="px-6 pt-8 pb-4 border-b border-gray-50 bg-white">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                5 Liderazgo
              </h1>
              <h2 className="text-xl font-medium text-[#1e3a8a]">
                5.2 Política
              </h2>
            </div>
          </header>
          <div className="px-6 pt-4 pb-8 space-y-8 bg-white overflow-y-auto max-h-[60vh]">
            <div className="bg-slate-100/80 border border-slate-200 rounded-2xl p-5 space-y-4">
              <section className="space-y-6">
                <p className="text-lg text-gray-800 leading-relaxed italic font-bold">
                  5.2.1 Establecimiento de la política de la calidad
                </p>
                <p className="text-lg text-gray-800 leading-relaxed italic">
                  La alta dirección <strong className="font-black text-gray-900 not-italic">debe</strong> establecer, implementar y mantener una política de la calidad que:
                </p>
                <div className="flex flex-col gap-4 text-gray-600 text-sm md:text-lg leading-relaxed italic md:ml-6">
                  <p>a) sea apropiada al propósito y contexto de la organización y apoye su dirección estratégica;</p>
                  <p>b) proporcione un marco de referencia para el establecimiento de los objetivos de la calidad;</p>
                  <p>c) incluya un compromiso de cumplir los requisitos aplicables;</p>
                  <p>d) incluya un compromiso de mejora continua del sistema de gestión de la calidad.</p>
                </div>
              </section>
              <section className="space-y-6 pt-4">
                <p className="text-lg text-gray-800 leading-relaxed italic font-bold">
                  5.2.2 Comunicación de la política de la calidad
                </p>
                <p className="text-lg text-gray-800 leading-relaxed italic">
                  La política de la calidad <strong className="font-black text-gray-900 not-italic">debe</strong>:
                </p>
                <div className="flex flex-col gap-4 text-gray-600 text-sm md:text-lg leading-relaxed italic md:ml-6">
                  <p>a) estar disponible y mantenerse como información documentada;</p>
                  <p>b) comunicarse, entenderse y aplicarse dentro de la organización;</p>
                  <p>c) estar disponible para las partes interesadas pertinentes, según corresponda.</p>
                </div>
              </section>
            </div>
          </div>
          <footer className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
            <div className="text-xs text-gray-400 font-bold tracking-tight uppercase">
              SISTEMA DE GESTIÓN DE LA CALIDAD (SGC)
            </div>
            <Button
              onClick={() => setShowISOInfo(false)}
              className="bg-[#1e3a8a] hover:bg-[#1e40af] text-white font-bold py-3 px-10 rounded shadow-md transition-all duration-200 ease-in-out active:scale-95 h-auto uppercase tracking-wider"
            >
              ENTENDIDO
            </Button>
          </footer>
        </DialogContent>
      </Dialog>

      {/* ═══ CONFIG DIALOG ═══ */}
      <Dialog open={showConfig} onOpenChange={setShowConfig}>
        <DialogContent className="max-w-md bg-white border-none rounded-3xl shadow-2xl p-0 overflow-hidden">
          <div className="bg-slate-900 p-6 text-white flex items-center gap-3">
            <Settings className="w-6 h-6 text-blue-400" />
            <div>
              <h2 className="text-xl font-bold uppercase tracking-tight italic">Configurar Documento</h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Metadatos de Políticas Institucionales</p>
            </div>
          </div>

          <div className="p-8 space-y-6 bg-white text-slate-900">
            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl space-y-4">
              <p className="text-[10px] font-black uppercase text-indigo-400 mb-2">Asistente de Codificación Estándar</p>
              
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-black uppercase text-slate-500 ml-1">Seleccionar Proceso Responsable</Label>
                  <Select value={builder.processId} onValueChange={(val) => setBuilder({...builder, processId: val})}>
                    <SelectTrigger className="h-10 bg-white border-slate-200 font-bold text-xs uppercase">
                      <SelectValue placeholder="SELECCIONAR PROCESO" />
                    </SelectTrigger>
                    <SelectContent>
                      {processes.map(p => (
                        <SelectItem key={p.id} value={p.id} className="text-xs font-bold uppercase">
                          {p.name} ({p.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase text-slate-500 ml-1">Tipo Documental</Label>
                    <Select value={builder.type} onValueChange={(val) => setBuilder({...builder, type: val})}>
                      <SelectTrigger className="h-10 bg-white border-slate-200 font-bold text-xs uppercase">
                        <SelectValue placeholder="TIPO" />
                      </SelectTrigger>
                      <SelectContent>
                        {docTypePrefixes && Object.keys(docTypePrefixes).map(t => (
                          <SelectItem key={t} value={t} className="text-xs font-bold uppercase">{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase text-slate-500 ml-1">Consecutivo</Label>
                    <Input 
                      value={builder.consecutive}
                      onChange={e => setBuilder({...builder, consecutive: e.target.value})}
                      className="h-10 bg-white border-slate-200 font-bold text-xs text-center"
                      placeholder="001"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Código Final (Generado o Manual)</Label>
              <Input
                value={docMetadata.code}
                onChange={e => setDocMetadata({ ...docMetadata, code: e.target.value.toUpperCase() })}
                className="h-12 border-slate-100 bg-slate-50 font-black text-[#136dec] uppercase text-center text-lg"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Versión</Label>
                <Input
                  value={docMetadata.version}
                  onChange={e => setDocMetadata({ ...docMetadata, version: e.target.value })}
                  className="h-12 border-slate-100 bg-slate-50 font-black"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fecha de Aprobación</Label>
                <Input
                  type="date"
                  value={docMetadata.approvalDate}
                  onChange={e => setDocMetadata({ ...docMetadata, approvalDate: e.target.value })}
                  className="h-12 border-slate-100 bg-slate-50 font-bold"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-between items-center text-[10px] text-slate-300 italic">
              <p>* Estos datos se verán reflejados en el encabezado oficial del PDF.</p>
            </div>
          </div>

          <div className="p-6 bg-slate-50 flex justify-end gap-3 border-t">
            <Button onClick={() => setShowConfig(false)} className="bg-slate-900 text-white font-black uppercase text-[10px] px-8 h-12 rounded-xl">Aplicar Configuración</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
