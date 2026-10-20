"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, Download, Loader2, Plus, Save, Settings2, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { DOCUMENT_CATALOG } from '@/lib/document-catalog';
import { documentStandardSchema, formatDocumentCode, type DocumentStandardConfig, type DocumentTypeDefinition } from '@/lib/document-standard';
import { downloadStandardPdf } from '@/lib/document-pdf';
import type { DocumentType } from '@/lib/types';

const BASE_TYPES: Record<DocumentType, string> = {
    MANUAL: 'Manual', PROCEDIMIENTO: 'Procedimiento', INSTRUCTIVO: 'Instructivo',
    FORMATO: 'Formato', POLITICA: 'Política', GUIA: 'Guía', REGISTRO: 'Registro', OTRO: 'Otro',
};
type FormatDraft = { code: string; version: string; approvalDate: string };
type ModuleDefinition = (typeof DOCUMENT_CATALOG)[number];

export default function EstandarDocumentalPage() {
    const { tenant } = useApp();
    return <EstandarDocumentalContent key={tenant.id} />;
}

function EstandarDocumentalContent() {
    const { tenant, currentUser, setTenant } = useApp();
    const mounted = useRef(true);
    const [config, setConfig] = useState<DocumentStandardConfig | null>(null);
    const [revision, setRevision] = useState(0);
    const [logo, setLogo] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [dirty, setDirty] = useState(false);
    const [error, setError] = useState('');
    const [conflict, setConflict] = useState(false);
    const [savedTypeIds, setSavedTypeIds] = useState<string[]>([]);
    const [formats, setFormats] = useState<Record<string, FormatDraft>>({});
    const [formatDirty, setFormatDirty] = useState<Record<string, boolean>>({});
    const [savingFormat, setSavingFormat] = useState('');
    const [formatError, setFormatError] = useState('');
    const canEdit = currentUser?.role === 'ADMIN_EMPRESA' || currentUser?.role === 'SUPER_ADMIN';

    const loadStandard = useCallback(async (signal?: AbortSignal) => {
        if (!tenant.id) return;
        setLoading(true);
        setError('');
        try {
            const response = await fetch(`/api/document-standard?tenantId=${encodeURIComponent(tenant.id)}`, { signal, cache: 'no-store' });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'No fue posible cargar el estándar documental.');
            if (!mounted.current || signal?.aborted) return;
            if (data.tenant?.id !== tenant.id) throw new Error('El estándar no corresponde a esta empresa.');
            setConfig(data.config);
            setSavedTypeIds(data.config.documentTypes.map((type: DocumentTypeDefinition) => type.id));
            setFormats(Object.fromEntries((data.formats || []).map((format: FormatDraft & { moduleKey: string }) => [format.moduleKey, { code: format.code, version: format.version, approvalDate: format.approvalDate }])));
            setFormatDirty({});
            setFormatError('');
            setRevision(data.revision);
            setLogo(data.tenant.logo || '');
            setCompanyName(data.tenant.name);
            setDirty(false);
            setConflict(false);
        } catch (cause) {
            if (!mounted.current || signal?.aborted) return;
            setError(cause instanceof Error ? cause.message : 'No fue posible cargar el estándar.');
        } finally {
            if (mounted.current && !signal?.aborted) setLoading(false);
        }
    }, [tenant.id]);

    useEffect(() => {
        mounted.current = true;
        const controller = new AbortController();
        void loadStandard(controller.signal);
        return () => { mounted.current = false; controller.abort(); };
    }, [loadStandard]);

    const updateConfig = (patch: Partial<DocumentStandardConfig>) => {
        setConfig(previous => previous ? { ...previous, ...patch } : previous);
        setDirty(true);
    };

    const updateType = (id: string, patch: Partial<DocumentTypeDefinition>) => {
        if (!config) return;
        updateConfig({ documentTypes: config.documentTypes.map(type => type.id === id ? { ...type, ...patch } : type) });
    };

    const moduleFallbackCode = (module: ModuleDefinition) => {
        if (!config) return '';
        const type = config.documentTypes.find(item => item.id === module.typeId);
        return [config.organizationPrefix, type?.prefix || 'DOC', 'ISO', module.key.replace(/[^A-Za-z0-9]/g, '')].join(config.separator);
    };

    const updateFormat = (moduleKey: string, patch: Partial<FormatDraft>) => {
        setFormats(previous => ({ ...previous, [moduleKey]: { ...(previous[moduleKey] || { code: '', version: '01', approvalDate: '' }), ...patch } }));
        setFormatDirty(previous => ({ ...previous, [moduleKey]: true }));
    };

    const saveFormat = async (module: ModuleDefinition) => {
        if (!canEdit || dirty || saving || savingFormat) return;
        const draft = formats[module.key] || { code: '', version: '01', approvalDate: '' };
        if (!draft.version.trim()) { setFormatError('Indique la versión del formato.'); return; }
        setSavingFormat(module.key);
        setFormatError('');
        try {
            const response = await fetch('/api/formatos', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tenantId: tenant.id, moduleKey: module.key,
                    code: draft.code.trim() || moduleFallbackCode(module),
                    version: draft.version.trim(), approvalDate: draft.approvalDate,
                }),
            });
            const data = await response.json();
            if (!mounted.current) return;
            if (!response.ok) throw new Error(data.error || 'No fue posible guardar la identificación del formato.');
            setFormats(previous => ({ ...previous, [module.key]: { code: data.code, version: data.version, approvalDate: data.approvalDate } }));
            setFormatDirty(previous => ({ ...previous, [module.key]: false }));
            toast.success(`Identificación del formato ${module.clause} guardada. No cambia la aprobación de sus registros.`);
        } catch (cause) {
            if (mounted.current) setFormatError(cause instanceof Error ? cause.message : 'No fue posible guardar el formato.');
        } finally {
            if (mounted.current) setSavingFormat('');
        }
    };

    const uploadLogo = async (file?: File) => {
        if (!file) return;
        if (!['image/png', 'image/jpeg'].includes(file.type) || file.size > 512 * 1024) {
            toast.error('Seleccione un logo PNG o JPEG de máximo 512 KB.');
            return;
        }
        try {
            const source = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(String(reader.result));
                reader.onerror = () => reject(new Error('No fue posible leer el logo.'));
                reader.readAsDataURL(file);
            });
            if (!mounted.current) return;
            setLogo(source);
            setDirty(true);
        } catch (cause) {
            toast.error(cause instanceof Error ? cause.message : 'No fue posible cargar el logo.');
        }
    };

    const saveStandard = async () => {
        if (!config || !canEdit) return;
        const validation = documentStandardSchema.safeParse(config);
        if (!validation.success) {
            setError(validation.error.issues.map(issue => issue.message).join(' '));
            return;
        }
        setSaving(true);
        setError('');
        try {
            const response = await fetch('/api/document-standard', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tenantId: tenant.id, revision, config: validation.data, logo: logo || null }),
            });
            const data = await response.json();
            if (!mounted.current) return;
            if (!response.ok) {
                if (response.status === 409) setConflict(true);
                throw new Error(data.error || 'No fue posible guardar el estándar.');
            }
            setConfig(data.config);
            setSavedTypeIds(data.config.documentTypes.map((type: DocumentTypeDefinition) => type.id));
            setRevision(data.revision);
            setLogo(data.tenant.logo || '');
            setTenant({ ...tenant, name: data.tenant.name, logo: data.tenant.logo || undefined, logoUrl: data.tenant.logo || undefined });
            setDirty(false);
            setConflict(false);
            toast.success('Estándar documental guardado para esta empresa.');
        } catch (cause) {
            if (!mounted.current) return;
            setError(cause instanceof Error ? cause.message : 'No fue posible guardar el estándar.');
        } finally {
            if (mounted.current) setSaving(false);
        }
    };

    const downloadStandard = async () => {
        if (!config) return;
        setExporting(true);
        try {
            await downloadStandardPdf({
                tenantId: tenant.id, moduleKey: '7.5.2', title: 'Estándar documental y catálogo de tipos',
                filename: 'Estandar_documental.pdf',
                sections: [
                    { title: 'Reglas de identificación', text: [
                        `Sistema: ${config.systemName}`,
                        `Estructura: prefijo de organización + separador + prefijo del tipo documental + separador + consecutivo de ${config.sequenceDigits} dígitos.`,
                        'Los formatos de módulo sin código personalizado se identifican como organización-tipo-ISO-numeral, por ejemplo SGC-MAT-ISO-41. Esta identificación no consume consecutivos del listado maestro.',
                        `Ejemplo ilustrativo: ${formatDocumentCode(config, config.documentTypes[0]?.prefix || 'FO', 1)}. El código definitivo se reserva al guardar cada documento.`,
                        'Los cambios de codificación aplican a nuevos documentos; no renumeran documentos históricos. Guardar este estándar no equivale a aprobar documentos.',
                    ] },
                    { title: 'Tipos documentales', head: ['Nombre', 'Prefijo', 'Clasificación base', 'Estado'],
                        rows: config.documentTypes.map(type => [type.name, type.prefix, BASE_TYPES[type.baseType], type.active ? 'Activo' : 'Inactivo']) },
                    { title: 'Identificación de formatos del sistema', head: ['Numeral', 'Documento', 'Código / fuente', 'Versión', 'Aprobación del formato'],
                        rows: DOCUMENT_CATALOG.map(document => {
                            const controlled = document.key === '5.2' || document.key === '5.3';
                            return [document.clause, document.title, controlled ? 'Según registro del módulo' : formats[document.key]?.code || moduleFallbackCode(document), controlled ? 'Según registro' : formats[document.key]?.version || '01', controlled ? 'Según flujo del registro' : formats[document.key]?.approvalDate || 'Sin aprobación registrada'];
                        }) },
                ],
            });
        } catch (cause) {
            toast.error(cause instanceof Error ? cause.message : 'No fue posible descargar el PDF.');
        } finally {
            setExporting(false);
        }
    };

    if (loading) return <div className="flex items-center gap-3 p-8 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /> Cargando estándar documental...</div>;
    if (!config) return <Card><CardContent className="space-y-4 p-6"><p role="alert">{error || 'No se encontró el estándar.'}</p><Button onClick={() => void loadStandard()}>Reintentar</Button></CardContent></Card>;
    const example = formatDocumentCode(config, config.documentTypes.find(type => type.active)?.prefix || 'FO', 1);

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <Link href="/apoyo/documentos" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Listado maestro</Link>
                    <h1 className="text-2xl font-bold">Estándar documental</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Identidad, encabezados y codificación de {companyName}. Numeral 7.5.2.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {(dirty || Object.values(formatDirty).some(Boolean)) && <Badge variant="secondary">Cambios sin guardar</Badge>}
                    <Button variant="outline" disabled={dirty || exporting || saving || !!savingFormat || Object.values(formatDirty).some(Boolean)} onClick={() => void downloadStandard()}><Download className="mr-2 h-4 w-4" /> {exporting ? 'Generando...' : 'Descargar estándar PDF'}</Button>
                    {canEdit && <Button disabled={!dirty || saving || conflict || !!savingFormat} onClick={() => void saveStandard()}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Guardar estándar</Button>}
                </div>
            </div>

            {!canEdit && <p className="rounded-lg border bg-muted/30 p-4 text-sm">Puede consultar el estándar. Su modificación corresponde al administrador de la empresa.</p>}
            {error && <div role="alert" className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"><p className="flex gap-2"><AlertCircle className="h-5 w-5 shrink-0" />{error}</p>{conflict && <Button variant="outline" onClick={() => void loadStandard()}>Recargar versión vigente (descarta cambios locales)</Button>}</div>}

            <fieldset disabled={!canEdit || saving} className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader><CardTitle className="text-lg">Identidad corporativa y encabezado</CardTitle><CardDescription>Se comparte en los PDF generados por el sistema.</CardDescription></CardHeader>
                    <CardContent className="space-y-5">
                        <div className="space-y-2"><Label htmlFor="standard-system-name">Nombre del sistema</Label><Input id="standard-system-name" value={config.systemName} maxLength={120} onChange={event => updateConfig({ systemName: event.target.value })} /></div>
                        <div className="space-y-2">
                            <Label htmlFor="standard-logo">Logo corporativo (PNG o JPEG, máximo 512 KB)</Label>
                            <div className="flex flex-wrap items-center gap-3"><Upload className="h-5 w-5 text-muted-foreground" /><Input id="standard-logo" type="file" accept="image/png,image/jpeg" onChange={event => void uploadLogo(event.target.files?.[0])} className="max-w-sm" />{logo && <Button type="button" variant="ghost" onClick={() => { setLogo(''); setDirty(true); }}>Quitar logo</Button>}</div>
                            <p className="text-xs text-muted-foreground">Este logo también actualiza la identidad corporativa de la empresa. Sin logo se mostrará su nombre.</p>
                        </div>
                        <div className="space-y-2"><Label htmlFor="standard-color">Color corporativo</Label><div className="flex gap-3"><Input id="standard-color" type="color" value={config.primaryColor} className="h-10 w-16 p-1" onChange={event => updateConfig({ primaryColor: event.target.value })} /><Input aria-label="Color corporativo hexadecimal" value={config.primaryColor} maxLength={7} onChange={event => updateConfig({ primaryColor: event.target.value })} className="max-w-40 font-mono" /></div></div>
                        <div className="space-y-2"><Label htmlFor="standard-footer">Leyenda del pie de página</Label><Input id="standard-footer" value={config.footerText} maxLength={180} onChange={event => updateConfig({ footerText: event.target.value })} /><p className="text-xs text-muted-foreground">El PDF también identifica su estado y número de página. La descarga no cambia el estado de aprobación.</p></div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle className="text-lg">Regla de codificación</CardTitle><CardDescription>Consecutivos asignados en el servidor para evitar duplicados.</CardDescription></CardHeader>
                    <CardContent className="space-y-5">
                        <div className="space-y-2"><Label htmlFor="standard-prefix">Prefijo de la organización</Label><Input id="standard-prefix" value={config.organizationPrefix} maxLength={12} onChange={event => updateConfig({ organizationPrefix: event.target.value.toUpperCase() })} /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label htmlFor="standard-separator">Separador</Label><select id="standard-separator" className="h-10 w-full rounded-md border bg-background px-3" value={config.separator} onChange={event => updateConfig({ separator: event.target.value as '-' | '_' })}><option value="-">Guion (-)</option><option value="_">Guion bajo (_)</option></select></div>
                            <div className="space-y-2"><Label htmlFor="standard-digits">Dígitos del consecutivo</Label><select id="standard-digits" className="h-10 w-full rounded-md border bg-background px-3" value={config.sequenceDigits} onChange={event => updateConfig({ sequenceDigits: Number(event.target.value) })}>{[3, 4, 5, 6].map(value => <option key={value} value={value}>{value}</option>)}</select></div>
                        </div>
                        <div className="rounded-xl border bg-muted/30 p-5"><p className="text-xs text-muted-foreground">Ejemplo ilustrativo; no reserva un código</p><p className="mt-2 break-all font-mono text-2xl font-bold">{example}</p><p className="mt-3 text-xs text-muted-foreground">Organización · Tipo documental · Consecutivo</p></div>
                        <p className="text-sm text-muted-foreground">Los códigos existentes se conservan. Una nueva versión mantiene el código del documento original. Desactive tipos que ya no utilice en lugar de eliminar su historial.</p>
                    </CardContent>
                </Card>
            </fieldset>

            <Card>
                <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3"><div><CardTitle className="text-lg">Tipos documentales</CardTitle><CardDescription>Cree categorías propias y su prefijo, conservando una clasificación base.</CardDescription></div>{canEdit && <Button variant="outline" disabled={saving} onClick={() => updateConfig({ documentTypes: [...config.documentTypes, { id: `TIPO_${crypto.randomUUID().replaceAll('-', '').toUpperCase()}`, name: '', prefix: '', baseType: 'OTRO', active: true }] })}><Plus className="mr-2 h-4 w-4" /> Agregar tipo</Button>}</CardHeader>
                <CardContent className="overflow-x-auto">
                    <table className="w-full min-w-[620px] text-left text-sm"><thead><tr className="border-b"><th className="p-2">Nombre</th><th className="w-28 p-2">Prefijo</th><th className="w-44 p-2">Clasificación base</th><th className="w-28 p-2">Estado</th><th className="w-12 p-2"><span className="sr-only">Acciones</span></th></tr></thead><tbody>{config.documentTypes.map(type => <tr key={type.id} className="border-b last:border-0">
                        <td className="p-2"><Input aria-label={`Nombre del tipo ${type.name || 'nuevo'}`} value={type.name} maxLength={80} disabled={!canEdit || saving} onChange={event => updateType(type.id, { name: event.target.value })} /></td>
                        <td className="p-2"><Input aria-label={`Prefijo de ${type.name || 'nuevo tipo'}`} value={type.prefix} maxLength={10} disabled={!canEdit || saving} className="font-mono uppercase" onChange={event => updateType(type.id, { prefix: event.target.value.toUpperCase() })} /></td>
                        <td className="p-2"><select aria-label={`Clasificación base de ${type.name || 'nuevo tipo'}`} className="h-10 w-full rounded-md border bg-background px-2" value={type.baseType} disabled={!canEdit || saving} onChange={event => updateType(type.id, { baseType: event.target.value as DocumentType })}>{Object.entries(BASE_TYPES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></td>
                        <td className="p-2"><label className="flex cursor-pointer items-center gap-2"><input type="checkbox" checked={type.active} disabled={!canEdit || saving} onChange={event => updateType(type.id, { active: event.target.checked })} />{type.active ? 'Activo' : 'Inactivo'}</label></td>
                        <td className="p-2">{canEdit && !savedTypeIds.includes(type.id) && <Button type="button" variant="ghost" size="icon" disabled={saving} aria-label={`Descartar tipo nuevo ${type.name}`} title="Descartar tipo nuevo sin guardar" onClick={() => updateConfig({ documentTypes: config.documentTypes.filter(item => item.id !== type.id) })}><Trash2 className="h-4 w-4 text-red-500" /></Button>}</td>
                    </tr>)}</tbody></table>
                    <p className="mt-4 text-xs text-muted-foreground">Los tipos inactivos permanecen en documentos históricos, pero no se ofrecen para nuevos registros. Los nombres y prefijos deben ser únicos.</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle className="text-lg">Identificación de formatos por módulo</CardTitle><CardDescription>Defina el código y la versión del formato usado por cada módulo. Estos identificadores son distintos de los consecutivos del listado maestro.</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                    <p className="rounded-lg border bg-muted/30 p-3 text-sm">La fecha corresponde a la aprobación del <strong>formato</strong>, no de sus registros. Déjela vacía si no existe una aprobación documentada. Las políticas, matrices y otros registros versionados conservan su código, versión y aprobación propios.</p>
                    {dirty && <p role="status" className="text-sm text-amber-700">Guarde primero los cambios del estándar corporativo antes de guardar identificaciones de formatos.</p>}
                    {formatError && <p role="alert" className="text-sm text-red-700">{formatError}</p>}
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[840px] text-left text-sm">
                            <thead><tr className="border-b"><th className="p-2">Módulo</th><th className="min-w-48 p-2">Código del formato</th><th className="w-24 p-2">Versión</th><th className="w-44 p-2">Aprobación del formato</th><th className="w-28 p-2"><span className="sr-only">Guardar</span></th></tr></thead>
                            <tbody>{DOCUMENT_CATALOG.map(module => {
                                const sourceControlled = module.key === '5.2' || module.key === '5.3';
                                const draft = formats[module.key] || { code: '', version: '01', approvalDate: '' };
                                return <tr key={module.key} className="border-b align-top last:border-0">
                                    <td className="p-2"><Link href={module.href} className="font-medium hover:underline">{module.clause} · {module.title}</Link></td>
                                    {sourceControlled ? <td colSpan={4} className="p-2 text-xs text-muted-foreground">Código, versión y aprobación tomados del registro en su módulo. No se sustituyen desde esta pantalla.</td> : <>
                                        <td className="p-2"><Input aria-label={`Código del formato ${module.clause}`} value={draft.code} placeholder={moduleFallbackCode(module)} maxLength={100} disabled={!canEdit || saving || !!savingFormat} onChange={event => updateFormat(module.key, { code: event.target.value.toUpperCase() })} /><p className="mt-1 text-[11px] text-muted-foreground">{draft.code ? 'Identificación guardada o personalizada.' : 'Sin personalización: se usa el código automático del módulo.'}</p></td>
                                        <td className="p-2"><Input aria-label={`Versión del formato ${module.clause}`} value={draft.version} maxLength={30} disabled={!canEdit || saving || !!savingFormat} onChange={event => updateFormat(module.key, { version: event.target.value })} /></td>
                                        <td className="p-2"><Input aria-label={`Fecha de aprobación del formato ${module.clause}`} type="date" value={/^\d{4}-\d{2}-\d{2}/.test(draft.approvalDate) ? draft.approvalDate.slice(0, 10) : ''} disabled={!canEdit || saving || !!savingFormat} onChange={event => updateFormat(module.key, { approvalDate: event.target.value })} />{draft.approvalDate && !/^\d{4}-\d{2}-\d{2}/.test(draft.approvalDate) && <p className="mt-1 text-xs text-muted-foreground">Fecha histórica: {draft.approvalDate}. Se conserva hasta seleccionar una nueva fecha.</p>}</td>
                                        <td className="p-2">{canEdit && <Button variant="outline" size="sm" disabled={!formatDirty[module.key] || dirty || saving || !!savingFormat} onClick={() => void saveFormat(module)}>{savingFormat === module.key ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />} Guardar</Button>}</td>
                                    </>}
                                </tr>;
                            })}</tbody>
                        </table>
                    </div>
                    <p className="text-xs text-muted-foreground">Ejemplo: {moduleFallbackCode(DOCUMENT_CATALOG[0])} identifica el formato del módulo; {example} es un ejemplo de registro numerado. Guardar un formato no crea un documento ni consume un consecutivo.</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Settings2 className="h-5 w-5" /> Vista previa del encabezado</CardTitle><CardDescription>Ejemplo de presentación, no es un documento aprobado. El encabezado y la paginación se repiten en cada página del PDF.</CardDescription></CardHeader>
                <CardContent>
                    <div className="grid min-h-32 overflow-hidden rounded-lg border text-center sm:grid-cols-[1fr_2fr_1fr]" style={{ borderColor: config.primaryColor }}>
                        <div className="flex flex-col items-center justify-center gap-2 border-b p-4 sm:border-b-0 sm:border-r" style={{ borderColor: config.primaryColor }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            {logo && <img src={logo} alt={`Logo de ${companyName}`} className="max-h-16 max-w-36 object-contain" />}
                            <span className="text-xs font-semibold">{companyName}</span>
                        </div>
                        <div className="flex flex-col justify-center gap-2 border-b p-4 sm:border-b-0 sm:border-r" style={{ borderColor: config.primaryColor }}><p className="text-xs text-muted-foreground">{config.systemName}</p><p className="font-bold" style={{ color: config.primaryColor }}>Título del documento</p><p className="text-xs">Numeral ISO · Estado: Borrador</p></div>
                        <div className="flex flex-col justify-center gap-2 p-4 text-left text-xs"><p><strong>Código:</strong> {example}</p><p><strong>Versión:</strong> 1</p><p><strong>Aprobación:</strong> Pendiente</p></div>
                    </div>
                    <p className="mt-3 text-center text-xs text-muted-foreground">{config.footerText} · Página 1 de 1</p>
                    <p className="mt-5 text-xs text-muted-foreground">Los archivos originales adjuntos mantienen su formato. El listado maestro y sus fichas PDF usan este estándar sin modificar los originales.</p>
                </CardContent>
            </Card>
        </div>
    );
}
