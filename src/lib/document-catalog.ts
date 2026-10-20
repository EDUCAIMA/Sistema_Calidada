/** Register each generated document here and export it through document-pdf.ts. */
export const DOCUMENT_CATALOG = [
  { key: '4.1', clause: '4.1', title: 'Análisis del contexto (DOFA)', href: '/contexto/organizacional', group: 'Contexto', typeId: 'MATRIZ' },
  { key: '4.2', clause: '4.2', title: 'Partes interesadas', href: '/contexto/partes-interesadas', group: 'Contexto', typeId: 'MATRIZ' },
  { key: '4.3', clause: '4.3', title: 'Alcance del SGC', href: '/contexto/alcance', group: 'Contexto', typeId: 'MANUAL' },
  { key: '4.4', clause: '4.4', title: 'Mapa y caracterización de procesos', href: '/contexto/procesos', group: 'Contexto', typeId: 'FORMATO' },
  { key: '5.1', clause: '5.1', title: 'Compromisos de la dirección', href: '/liderazgo/compromisos', group: 'Liderazgo', typeId: 'REGISTRO' },
  { key: '5.2', clause: '5.2', title: 'Políticas del sistema', href: '/liderazgo/politicas', group: 'Liderazgo', typeId: 'POLITICA' },
  { key: '5.3', clause: '5.3', title: 'Matriz de responsabilidades y autoridades', href: '/liderazgo/roles', group: 'Liderazgo', typeId: 'MATRIZ' },
  { key: '6.1', clause: '6.1', title: 'Riesgos y oportunidades', href: '/planificacion/riesgos', group: 'Planificación', typeId: 'MATRIZ' },
  { key: '6.2', clause: '6.2', title: 'Objetivos de calidad', href: '/planificacion/objetivos', group: 'Planificación', typeId: 'FORMATO' },
  { key: '6.3', clause: '6.3', title: 'Planificación de cambios', href: '/planificacion/cambios', group: 'Planificación', typeId: 'FORMATO' },
  { key: '7.5', clause: '7.5', title: 'Listado maestro y documentos', href: '/apoyo/documentos', group: 'Apoyo', typeId: 'REGISTRO' },
  { key: '7.5.2', clause: '7.5.2', title: 'Estándar documental y codificación', href: '/apoyo/estandar-documental', group: 'Apoyo', typeId: 'MANUAL' },
] as const;
