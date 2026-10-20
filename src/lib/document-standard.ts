import { z } from 'zod';

export const DOCUMENT_BASE_TYPES = [
  'MANUAL', 'PROCEDIMIENTO', 'INSTRUCTIVO', 'FORMATO', 'POLITICA', 'REGISTRO', 'OTRO', 'GUIA',
] as const;

const prefixSchema = z.string().trim().toUpperCase()
  .min(1, 'El prefijo es obligatorio.')
  .max(16, 'El prefijo admite hasta 16 caracteres.')
  .regex(/^[A-Z0-9]+$/, 'Los prefijos solo pueden contener letras A-Z y números.');

export const documentTypeDefinitionSchema = z.object({
  id: z.string().trim().toUpperCase().min(1).max(50)
    .regex(/^[A-Z0-9_]+$/, 'El identificador del tipo solo admite letras, números y guion bajo.'),
  name: z.string().trim().min(2, 'El nombre del tipo es obligatorio.').max(100),
  prefix: prefixSchema,
  baseType: z.enum(DOCUMENT_BASE_TYPES),
  active: z.boolean(),
}).strict();

export const documentStandardSchema = z.object({
  schemaVersion: z.literal(1),
  organizationPrefix: prefixSchema,
  separator: z.enum(['-', '_']),
  sequenceDigits: z.number().int().min(3).max(6),
  systemName: z.string().trim().min(3).max(160),
  footerText: z.string().trim().max(240),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Seleccione un color hexadecimal válido.'),
  documentTypes: z.array(documentTypeDefinitionSchema).min(1).max(100),
}).strict().superRefine((config, context) => {
  for (const key of ['id', 'prefix', 'name'] as const) {
    const used = new Set<string>();
    config.documentTypes.forEach((type, index) => {
      const value = type[key].toLocaleUpperCase('es');
      if (used.has(value)) {
        context.addIssue({
          code: 'custom',
          path: ['documentTypes', index, key],
          message: `Los tipos documentales deben tener ${key === 'name' ? 'nombres' : key === 'prefix' ? 'prefijos' : 'identificadores'} únicos.`,
        });
      }
      used.add(value);
    });
  }
  if (!config.documentTypes.some(type => type.active)) {
    context.addIssue({ code: 'custom', path: ['documentTypes'], message: 'Debe mantener al menos un tipo documental activo.' });
  }
});

export type DocumentTypeDefinition = z.infer<typeof documentTypeDefinitionSchema>;
export type DocumentStandardConfig = z.infer<typeof documentStandardSchema>;

export const DEFAULT_DOCUMENT_STANDARD: DocumentStandardConfig = {
  schemaVersion: 1,
  organizationPrefix: 'SGC',
  separator: '-',
  sequenceDigits: 3,
  systemName: 'Sistema de Gestión de la Calidad',
  footerText: 'Copia no controlada al descargar o imprimir. Consulte la versión vigente en el sistema.',
  primaryColor: '#1E3A5F',
  documentTypes: [
    { id: 'MANUAL', name: 'Manual', prefix: 'MA', baseType: 'MANUAL', active: true },
    { id: 'PROCEDIMIENTO', name: 'Procedimiento', prefix: 'PR', baseType: 'PROCEDIMIENTO', active: true },
    { id: 'INSTRUCTIVO', name: 'Instructivo', prefix: 'IN', baseType: 'INSTRUCTIVO', active: true },
    { id: 'FORMATO', name: 'Formato', prefix: 'FO', baseType: 'FORMATO', active: true },
    { id: 'POLITICA', name: 'Política', prefix: 'PO', baseType: 'POLITICA', active: true },
    { id: 'REGISTRO', name: 'Registro', prefix: 'RE', baseType: 'REGISTRO', active: true },
    { id: 'GUIA', name: 'Guía', prefix: 'GU', baseType: 'GUIA', active: true },
    { id: 'MATRIZ', name: 'Matriz', prefix: 'MAT', baseType: 'REGISTRO', active: true },
    { id: 'OTRO', name: 'Otro', prefix: 'OT', baseType: 'OTRO', active: true },
  ],
};

export function parseDocumentStandardConfig(value: unknown): DocumentStandardConfig {
  return documentStandardSchema.parse(value ?? DEFAULT_DOCUMENT_STANDARD);
}

export function formatDocumentCode(
  config: Pick<DocumentStandardConfig, 'organizationPrefix' | 'separator' | 'sequenceDigits'>,
  typePrefix: string,
  sequence: number,
) {
  if (!Number.isSafeInteger(sequence) || sequence < 1) throw new Error('El consecutivo debe ser un entero positivo.');
  return [config.organizationPrefix, typePrefix, String(sequence).padStart(config.sequenceDigits, '0')]
    .join(config.separator);
}
