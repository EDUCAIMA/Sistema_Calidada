# Sistema de gestión de calidad

Next.js, React, Prisma y PostgreSQL. Liderazgo y planificación mantienen la edición ISO 9001:2015 utilizada por el proyecto; estos cambios no constituyen una certificación ni una migración a otra edición de la norma.

## Liderazgo y planificación

| Numeral | Pantalla | Registro y control |
| --- | --- | --- |
| 5.1 | /liderazgo/compromisos | Compromisos de dirección y enfoque al cliente: responsable, plazo, evidencia y evaluación de cierre. |
| 5.2 | /liderazgo/politicas | Borrador → revisión → aprobación o ajustes → comunicación. Versiones, decisiones y evidencias de comprensión. |
| 5.3 | /liderazgo/roles | Matriz versionada por proceso y cargo: RACI, responsabilidades, autoridades, deberes a–e del SGC, revisión, aprobación por alta dirección, comunicación y confirmación personal del titular. |
| 6.1 | /planificacion/riesgos | Riesgos y oportunidades separados, origen, tratamiento, integración, recursos y evaluación de eficacia. |
| 6.2 | /planificacion/objetivos | Meta, indicador, acciones, responsable, recursos, plazo, comunicación y mediciones evidenciadas. |
| 6.3 | /planificacion/cambios | Propósito, consecuencias, integridad del SGC, recursos, responsabilidades, implementación y evaluación. |

Los registros se aíslan por empresa. Los auditores consultan; los usuarios operan los planes; los administradores gestionan usuarios y asignaciones. La aprobación de la matriz 5.3 exige que el usuario haya sido designado expresamente como alta dirección en Administración → Usuarios. El titular confirma personalmente sus responsabilidades. La sesión se valida en el servidor, no mediante el rol guardado en el navegador.

Una ejecución al 100 % no demuestra cumplimiento de una meta. Riesgos, oportunidades y cambios solo cierran con una evaluación eficaz y evidencia. Objetivos, cargos, procesos y usuarios se archivan o desactivan sin borrar su historial. Una revisión de política no reemplaza la versión vigente hasta aprobarse.

Las evidencias de estos módulos son referencias o descripciones verificables: no son firmas electrónicas ni un repositorio de adjuntos. La organización debe aportar los documentos, demostrar la comprensión de la política y verificar los resultados reales.

## Ejecución

Configure `DATABASE_URL` para PostgreSQL y un `AUTH_SECRET` privado y estable para firmar sesiones. No incluya secretos en el repositorio. Los usuarios con sesiones anteriores a la implementación de la cookie de sesión deben volver a iniciar sesión.

```bash
npm install
npm run db:deploy
npm run dev
```

Abra `http://localhost:3000`. Para producción: `npm run build` y `npm start`. La compilación descarga las fuentes de Google utilizadas por el proyecto.

`db:deploy` aplica migraciones incrementales a una base que ya tiene las tablas originales del sistema. **No es un inicializador de bases vacías.** Registra nombre y checksum en `_sgc_migrations`, usa exclusión mutua y una transacción por migración; repetirlo no vuelve a aplicar las registradas. Realice una copia de seguridad antes de actualizar un entorno real. No use `prisma db push --accept-data-loss` sobre datos reales.

La migración `20261018000000_leadership_planning` agrega los registros de 5.1, 5.3 y 6.3, y amplía políticas, riesgos y objetivos. `20261019000000_responsibility_matrix_workflow` convierte 5.3 en una matriz controlada por versiones; la migración previa `20261017020000_preserve_legacy_leadership_tables` conserva con nombre `Legacy…` cualquier tabla histórica incompatible antes de crear las estructuras nuevas. Los objetivos legados marcados como cumplidos sin evaluación explícita vuelven a `EN_PROGRESO`; sus mediciones se conservan.

La migración de la matriz mantiene deliberadamente en SQL restricciones `CHECK` e índices parciales o funcionales que Prisma no puede representar: una sola versión vigente, una sola revisión abierta y ninguna asignación activa duplicada por empresa. No los elimine al generar migraciones futuras.

## Validaciones

```bash
npm test
npx tsc --noEmit
npm run build
```

Sin `TEST_DATABASE_URL`, se ejecutan las pruebas unitarias y se omiten explícitamente las de integración. Para estas últimas, utilice una base **desechable** en `localhost` o `127.0.0.1` cuyo nombre comience por `sgc_validation`, con el esquema actualizado:

```bash
TEST_DATABASE_URL='postgresql://USUARIO:CLAVE@127.0.0.1:PUERTO/sgc_validation' npm test
```

Las pruebas crean empresas, usuarios y registros sintéticos únicamente en esa base. Cubren autorización, aislamiento entre empresas, referencias válidas, historial, evidencias obligatorias, transiciones, versiones obsoletas y escrituras concurrentes. No apuntarlas a producción.
