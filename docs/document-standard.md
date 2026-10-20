# Estándar documental del SGC

## Configuración por empresa

La pantalla `/apoyo/estandar-documental` centraliza la identidad corporativa, el logo, el color, el pie de página, los tipos documentales y la regla de codificación.

- `GET /api/document-standard?tenantId=...` devuelve empresa, configuración, revisión y metadatos de formatos.
- `PUT /api/document-standard` exige administrador y revisión coincidente. Un conflicto devuelve `409`; debe recargarse antes de guardar.
- La configuración se persiste por empresa. No debe leerse de claves globales de `localStorage`.
- Los tipos tienen identificadores estables; los tipos en uso se desactivan, conservando su historial.
- El logo admite PNG/JPEG de hasta 512 KB o URL HTTPS. Para evitar restricciones de origen en la exportación, se recomienda cargar el archivo desde la pantalla de configuración.
- Guardar la configuración no aprueba documentos. La aprobación sigue el flujo de cada registro.
- El panel **Identificación de formatos por módulo** permite conservar o personalizar código, versión y fecha de aprobación del formato mediante `POST /api/formatos`. La fecha puede quedar vacía. No reemplaza la aprobación del contenido ni los metadatos de registros versionados, como las políticas y matrices de responsabilidades.

## Todo módulo documental nuevo

1. Registrar su entrada en `src/lib/document-catalog.ts` con `key`, `clause`, `title`, `href`, `group` y `typeId`. El catálogo alimenta el menú del dashboard.
2. Usar `downloadStandardPdf` de `src/lib/document-pdf.ts`. No crear encabezados ni instancias independientes de `jsPDF` en las pantallas.
3. Construir secciones con textos, tablas o imágenes a partir de datos reales del módulo. Nunca sustituir información faltante por datos de demostración.
4. Para documentos versionados, pasar su código, versión y estado persistidos en `metadata`. Pasar explícitamente `approvalDate: null` cuando el registro no esté aprobado, para no heredar la fecha de aprobación de un formato.
5. Capturar errores de exportación y mostrarlos al usuario. El logo no disponible o ilegible debe corregirse en el estándar, no omitirse silenciosamente.
6. Probar contenido extenso y documentos de varias páginas. El generador común reserva espacio y repite encabezado, pie y numeración.

Ejemplo:

```ts
await downloadStandardPdf({
  tenantId,
  moduleKey: '5.3',
  title: 'Matriz de responsabilidades y autoridades',
  filename: 'Matriz_responsabilidades.pdf',
  orientation: 'landscape',
  metadata: {
    code: matrix.code,
    version: matrix.version,
    status: matrix.status,
    approvalDate: matrix.approvedAt ?? null,
  },
  sections: [{
    title: 'Asignaciones',
    head: ['Cargo', 'Persona', 'Responsabilidad', 'Autoridad'],
    rows: assignments.map(item => [
      item.roleName, item.personName, item.responsibility, item.authority,
    ]),
  }],
});
```

`buildStandardPdf` es la variante pura, utilizada en pruebas. Las pantallas deben usar la descarga común para obtener la configuración vigente y preparar el logo.

## Dos clases de identificación

### Registros del listado maestro

Un documento nuevo puede enviarse a `POST /api/apoyo/documentos` con `documentTypeId` y código vacío. El servidor reserva de forma transaccional el consecutivo de la empresa y serie. Con los valores iniciales, un procedimiento obtiene un código como `SGC-PR-001`.

No calcular consecutivos contando filas del navegador. No renumerar documentos al cambiar el estándar. Un código manual existente se valida; una nueva versión conserva el código original. Los nombres y tipos históricos tienen su snapshot en el documento.

### Exportaciones de módulos

El generador utiliza, por prioridad:

1. Código y versión explícitos del registro.
2. Metadatos existentes en `FormatControl` para empresa y módulo.
3. Identificación estable del módulo: organización + tipo + `ISO` + numeral sin puntos; por ejemplo `SGC-MAT-ISO-41`.

El identificador de módulo no consume un consecutivo del listado maestro ni crea automáticamente un documento allí.

## Archivos originales y fichas

Los PDF generados por el sistema usan el estándar común. Un archivo original adjunto (Word, Excel, PDF u otro) se descarga intacto: no se modifica ni se presenta como si hubiese recibido un encabezado nuevo.

El listado maestro dispone de su propia exportación PDF y cada registro de una **ficha PDF** con identificación, estado, versión y trazabilidad. La ficha no sustituye el contenido del original. Descargar tampoco cambia el estado de revisión o aprobación.

## Comprobaciones de seguridad y compatibilidad

- El servidor verifica sesión, empresa, rol y estado del documento.
- Las pantallas de configuración y registro reinician su estado al cambiar de empresa; las lecturas pendientes se cancelan o descartan.
- Los tipos inactivos no se ofrecen para documentos nuevos. La edición o nueva versión del mismo documento conserva su clasificación histórica.
- Los permisos de aprobar no se deducen de la disponibilidad del botón de descarga.
- El estándar no supone por sí mismo certificación ni conformidad con todos los requisitos de ISO 9001.
