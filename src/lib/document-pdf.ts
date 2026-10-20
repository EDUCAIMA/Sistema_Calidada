import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DOCUMENT_CATALOG } from '@/lib/document-catalog';
import { parseDocumentStandardConfig, type DocumentStandardConfig } from '@/lib/document-standard';

export interface PdfSection {
  title?: string;
  text?: string | string[];
  head?: string[];
  rows?: Array<Array<string | number>>;
  image?: { dataUrl: string; width?: number; height?: number };
}
export interface PdfMetadata {
  code?: string;
  version?: string | number;
  status?: string;
  approvalDate?: string | Date | null;
  approvedBy?: string | null;
}
export interface StandardPdfOptions {
  tenantId: string;
  moduleKey: string;
  title: string;
  filename: string;
  orientation?: 'portrait' | 'landscape';
  metadata?: PdfMetadata;
  sections: PdfSection[];
}
export interface DocumentStandardContext {
  tenant: { id: string; name: string; logo: string | null };
  config: DocumentStandardConfig;
  revision: number;
  formats: Array<{ moduleKey: string; code: string; version: string; approvalDate: string }>;
}

// Helvetica's WinAnsi supports Spanish; normalize typographic separators and list marks.
export function pdfText(value: unknown): string {
  return String(value ?? '').normalize('NFC')
    .replace(/[\u2010-\u2015\u2212]/g, '-').replace(/\u2026/g, '...')
    .replace(/[\u2018\u2019]/g, "'").replace(/[\u201c\u201d]/g, '"')
    .replace(/[✓✔]/g, 'Sí').replace(/[✗✘]/g, 'No')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '')
    .replace(/[^\u0009\u000a\u000d\u0020-\u00ff€]/g, '');
}

export function pdfDate(value?: string | Date | null): string {
  if (!value) return 'Sin aprobación registrada';
  const date = value instanceof Date ? value : new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value);
  return Number.isNaN(date.getTime()) ? 'Sin aprobación registrada' : date.toLocaleDateString('es-CO');
}

export async function loadDocumentStandard(tenantId: string): Promise<DocumentStandardContext> {
  const response = await fetch(`/api/document-standard?tenantId=${encodeURIComponent(tenantId)}`, { cache: 'no-store' });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'No se pudo cargar el estándar documental.');
  if (result.tenant?.id !== tenantId) throw new Error('El estándar no corresponde a la empresa seleccionada.');
  return { ...result, config: parseDocumentStandardConfig(result.config) };
}

function fitText(pdf: jsPDF, text: string, width: number, maxLines: number, initialSize: number) {
  let size = initialSize;
  pdf.setFontSize(size);
  let lines: string[] = pdf.splitTextToSize(pdfText(text), width);
  while (lines.length > maxLines && size > 6) {
    pdf.setFontSize(--size);
    lines = pdf.splitTextToSize(pdfText(text), width);
  }
  // Header metadata is bounded in the settings schema. Keep the body untruncated.
  if (lines.length > maxLines) lines = [...lines.slice(0, maxLines - 1), `${lines[maxLines - 1].slice(0, -3)}...`];
  return { size, lines };
}

/**
 * Pure renderer, also used by regression tests. Downloaded copies do not constitute
 * approval. Pass record metadata for versioned documents; it always wins over a format.
 */
export function buildStandardPdf(
  options: StandardPdfOptions,
  context: DocumentStandardContext,
  exportedAt = new Date(),
): jsPDF {
  const config = parseDocumentStandardConfig(context.config);
  const entry = DOCUMENT_CATALOG.find(item => item.key === options.moduleKey);
  const format = context.formats.find(item => item.moduleKey === options.moduleKey);
  const definition = config.documentTypes.find(item => item.id === entry?.typeId);
  const code = options.metadata?.code || format?.code || [
    config.organizationPrefix, definition?.prefix || 'DOC', 'ISO', options.moduleKey.replace(/[^A-Za-z0-9]/g, ''),
  ].join(config.separator);
  const version = options.metadata?.version ?? format?.version ?? '01';
  const explicitApproval = options.metadata && Object.prototype.hasOwnProperty.call(options.metadata, 'approvalDate');
  const approvalDate = explicitApproval ? options.metadata?.approvalDate : format?.approvalDate;
  const status = options.metadata?.status || (pdfDate(approvalDate) !== 'Sin aprobación registrada' ? 'Formato controlado' : 'Documento de trabajo');
  const pdf = new jsPDF({ orientation: options.orientation || 'portrait', unit: 'mm', format: 'a4', compress: true });
  pdf.setProperties({ title: pdfText(options.title), subject: pdfText(`${code} - ${status}`), author: pdfText(context.tenant.name), creator: 'Sistema de Gestión de la Calidad' });
  const width = pdf.internal.pageSize.getWidth();
  const height = pdf.internal.pageSize.getHeight();
  const margin = 14;
  const bodyWidth = width - margin * 2;
  const top = 54;
  const bottom = 24;
  const color = config.primaryColor;
  let cursor = top;
  const table = (section: PdfSection) => {
    const head = [
      ...(section.title ? [[{ content: pdfText(section.title), colSpan: section.head?.length || section.rows?.[0]?.length || 1 }]] : []),
      ...(section.head ? [section.head.map(pdfText)] : []),
    ];
    const body = section.text !== undefined
      ? (Array.isArray(section.text) ? section.text : [section.text]).map(text => [pdfText(text) || 'Sin información registrada.'])
      : section.rows?.length ? section.rows.map(row => row.map(pdfText)) : section.image ? [] : [['Sin registros.']];
    autoTable(pdf, {
      startY: cursor,
      margin: { top, bottom, left: margin, right: margin },
      head, body,
      theme: section.text !== undefined ? 'plain' : 'grid',
      styles: { font: 'helvetica', fontSize: 9, cellPadding: 2.5, overflow: 'linebreak', textColor: [30, 41, 59], lineColor: [215, 223, 232], lineWidth: 0.15, valign: 'top' },
      headStyles: { fillColor: color, textColor: 255, fontStyle: 'bold', fontSize: 9 },
      alternateRowStyles: section.text === undefined ? { fillColor: [247, 249, 252] } : {},
      rowPageBreak: 'avoid',
      showHead: 'everyPage',
      didDrawPage: data => { cursor = data.cursor?.y || top; },
    });
    cursor += 6;
  };
  for (const section of options.sections) {
    if (section.text !== undefined || section.head || section.rows) table(section);
    else if (section.title) table(section);
    if (section.image) {
      const properties = pdf.getImageProperties(section.image.dataUrl);
      const ratio = properties.width / properties.height;
      let imageWidth = Math.min(bodyWidth, section.image.width || bodyWidth);
      let imageHeight = section.image.height || imageWidth / ratio;
      const available = height - top - bottom;
      if (imageHeight > available) { imageWidth *= available / imageHeight; imageHeight = available; }
      if (cursor + imageHeight > height - bottom) { pdf.addPage(); cursor = top; }
      pdf.addImage(section.image.dataUrl, properties.fileType, margin + (bodyWidth - imageWidth) / 2, cursor, imageWidth, imageHeight);
      cursor += imageHeight + 6;
    }
  }
  if (!options.sections.length) table({ text: 'Sin información registrada.' });
  // Draw header/footer after pagination: total pages are now exact on every page.
  const total = pdf.getNumberOfPages();
  for (let page = 1; page <= total; page++) {
    pdf.setPage(page);
    const y = 12, headerHeight = 35;
    const logoWidth = 40, metaWidth = 65, titleWidth = bodyWidth - logoWidth - metaWidth;
    const titleX = margin + logoWidth, metaX = width - margin - metaWidth;
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(color);
    pdf.setLineWidth(0.35);
    pdf.rect(margin, y, bodyWidth, headerHeight, 'FD');
    pdf.line(titleX, y, titleX, y + headerHeight);
    pdf.line(metaX, y, metaX, y + headerHeight);
    pdf.setFillColor(color);
    pdf.rect(margin, y, bodyWidth, 1.2, 'F');
    if (context.tenant.logo) {
      const logo = pdf.getImageProperties(context.tenant.logo);
      const scale = Math.min((logoWidth - 8) / logo.width, 19 / logo.height);
      pdf.addImage(context.tenant.logo, logo.fileType, margin + (logoWidth - logo.width * scale) / 2, y + 4, logo.width * scale, logo.height * scale);
    }
    pdf.setTextColor(30, 41, 59);
    pdf.setFont('helvetica', 'bold');
    const company = fitText(pdf, context.tenant.name, logoWidth - 6, context.tenant.logo ? 2 : 4, 9);
    pdf.text(company.lines, margin + logoWidth / 2, y + (context.tenant.logo ? 27 : 13), { align: 'center', lineHeightFactor: 1.1 });
    pdf.setFont('helvetica', 'normal');
    const system = fitText(pdf, config.systemName, titleWidth - 8, 2, 8);
    pdf.text(system.lines, titleX + titleWidth / 2, y + 6, { align: 'center', lineHeightFactor: 1.1 });
    pdf.setFont('helvetica', 'bold');
    const title = fitText(pdf, options.title, titleWidth - 8, 3, 11);
    pdf.text(title.lines, titleX + titleWidth / 2, y + 15, { align: 'center', lineHeightFactor: 1.15 });
    pdf.setFont('helvetica', 'normal').setFontSize(7.5);
    pdf.text(pdfText(`ISO 9001:2015 | ${entry?.clause || options.moduleKey}`), titleX + titleWidth / 2, y + 32, { align: 'center' });
    const metadata = [`Código: ${code}`, `Versión: ${version}`, `Estado: ${status}`, `${explicitApproval ? 'Aprobación' : 'Aprobación formato'}: ${pdfDate(approvalDate)}`];
    metadata.forEach((line, index) => {
      if (index) pdf.line(metaX, y + index * headerHeight / 4, width - margin, y + index * headerHeight / 4);
      pdf.setFont('helvetica', index === 0 ? 'bold' : 'normal');
      const fitted = fitText(pdf, line, metaWidth - 6, 2, 8);
      pdf.text(fitted.lines, metaX + 3, y + 5 + index * headerHeight / 4, { lineHeightFactor: 1.1 });
    });
    pdf.setDrawColor(190, 202, 216).setLineWidth(0.2);
    pdf.line(margin, height - 19, width - margin, height - 19);
    pdf.setFont('helvetica', 'normal').setTextColor(90, 105, 125).setFontSize(7);
    const footer = fitText(pdf, config.footerText, bodyWidth - 30, 2, 7);
    pdf.text(footer.lines, margin, height - 15, { lineHeightFactor: 1.1 });
    pdf.setFontSize(7);
    pdf.text(`Página ${page} de ${total}`, width - margin, height - 15, { align: 'right' });
    const identification = fitText(pdf, `Descarga: ${exportedAt.toLocaleString('es-CO')} | ${code} | v${version}`, bodyWidth, 1, 7);
    pdf.text(identification.lines, margin, height - 6);
  }
  return pdf;
}

async function printableLogo(source: string | null): Promise<string | null> {
  if (!source) return null;
  if (/^data:image\/(png|jpeg);base64,/i.test(source)) return source;
  // Browser-only conversion supports legacy logos; no server-side URL fetch or SSRF.
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    const timer = window.setTimeout(() => { image.src = ''; reject(new Error('El logo no respondió. Revise el logo en Estándar documental.')); }, 10000);
    image.onerror = () => { clearTimeout(timer); reject(new Error('No se pudo cargar el logo corporativo. Cargue un PNG o JPG en Estándar documental.')); };
    image.onload = () => {
      clearTimeout(timer);
      try {
        const canvas = document.createElement('canvas');
        const scale = Math.min(1, 1000 / Math.max(image.naturalWidth, image.naturalHeight));
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('No se pudo preparar el logo corporativo.');
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/png'));
      } catch { reject(new Error('El origen del logo no permite exportarlo. Cargue un PNG o JPG en Estándar documental.')); }
    };
    image.src = source;
  });
}

export async function downloadStandardPdf(options: StandardPdfOptions): Promise<void> {
  const context = await loadDocumentStandard(options.tenantId);
  context.tenant.logo = await printableLogo(context.tenant.logo);
  const pdf = buildStandardPdf(options, context);
  const filename = options.filename.replace(/\.pdf$/i, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9_-]+/g, '-');
  pdf.save(`${filename || 'documento-sgc'}.pdf`);
}
