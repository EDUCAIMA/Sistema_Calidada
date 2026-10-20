const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { ModulePage, ModuleHeader, ModuleToolbar, ModuleContent, ModulePanel } = require('../src/components/sgc/module-layout.tsx');
const { Button } = require('../src/components/ui/button.tsx');
const { Input } = require('../src/components/ui/input.tsx');
const { Textarea } = require('../src/components/ui/textarea.tsx');
const { Table, TableHeader, TableHead, TableRow, TableBody, TableCell } = require('../src/components/ui/table.tsx');
const h = React.createElement;
const render = (component, props, ...children) => renderToStaticMarkup(h(component, props, ...children));

test('module structure has a single semantic title and a consistent action region', () => {
  const html = render(ModulePage, null,
    h(ModuleHeader, { clause: '5.3', title: 'Responsabilidades y autoridades', description: 'Versiones y aprobación', actions: h(Button, { disabled: true }, 'Enviar a revisión') }),
    h(ModuleToolbar, null, h(Input, { 'aria-label': 'Buscar registros' })),
    h(ModuleContent, null, h(ModulePanel, null, 'Contenido')),
  );
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  for (const slot of ['page', 'header', 'actions', 'toolbar', 'content', 'panel']) {
    assert.match(html, new RegExp(`data-slot="module-${slot}"`));
  }
  assert.match(html, /5\.3/);
  assert.match(html, /Responsabilidades y autoridades/);
  assert.match(html, /disabled=""/);
  assert.match(html, /flex-wrap/);
  assert.match(html, /lg:px-8/);
});

test('module headers support missing clauses/actions and escape dynamic titles', () => {
  const html = render(ModuleHeader, { title: '<script>contenido</script>', description: 'Descripción' });
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /<script>/);
  assert.doesNotMatch(html, /data-slot="module-actions"/);
  assert.doesNotMatch(html, /uppercase|italic|tracking-widest/);
  assert.match(html, /text-2xl/);
  assert.match(html, /sm:text-3xl/);
});

test('buttons share readable rounded controls while preserving variants and semantics', () => {
  const primary = render(Button, { type: 'submit', disabled: true }, 'Guardar');
  assert.match(primary, /bg-primary/);
  assert.match(primary, /min-h-11/);
  assert.match(primary, /rounded-xl/);
  assert.match(primary, /relative inline-flex/);
  assert.match(primary, /type="submit"/);
  assert.match(primary, /disabled=""/);
  const secondary = render(Button, { variant: 'outline' }, 'Descargar PDF');
  assert.match(secondary, /data-variant="outline"/);
  assert.match(secondary, /bg-white/);
  assert.doesNotMatch(secondary, /bg-primary /);
  const destructive = render(Button, { variant: 'destructive' }, 'Eliminar');
  assert.match(destructive, /bg-destructive/);
});

test('form controls retain constraints, labels and accessible focus styles', () => {
  const input = render(Input, { id: 'name', required: true, maxLength: 100, 'aria-invalid': true });
  assert.match(input, /h-11/);
  assert.match(input, /rounded-xl/);
  assert.match(input, /focus-visible:ring/);
  assert.match(input, /required=""/);
  assert.match(input, /maxLength="100"/);
  assert.match(input, /aria-invalid="true"/);
  const textarea = render(Textarea, { readOnly: true, defaultValue: 'Evidencia guardada' });
  assert.match(textarea, /readOnly=""/);
  assert.match(textarea, /Evidencia guardada/);
  assert.match(textarea, /min-w-0/);
});

test('tables have contained horizontal scrolling and readable header/body styles', () => {
  const html = render(Table, null,
    h(TableHeader, null, h(TableRow, null, h(TableHead, null, 'Responsable'))),
    h(TableBody, null, h(TableRow, null, h(TableCell, null, 'Dirección'))),
  );
  assert.match(html, /overflow-x-auto/);
  assert.match(html, /bg-slate-50\/80/);
  assert.match(html, /text-sm/);
  assert.match(html, /py-4/);
  assert.match(html, /<th /);
  assert.match(html, /<td /);
});

test('every dashboard submenu uses the shared module layout directly or through PlanningWorkspace', () => {
  const root = path.join(__dirname, '../src/app/(dashboard)');
  const pages = [];
  const visit = dir => {
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      const target = path.join(dir, item.name);
      if (item.isDirectory()) visit(target);
      else if (item.name === 'page.tsx') pages.push(target);
    }
  };
  visit(root);
  assert.equal(pages.length, 30);
  for (const page of pages) {
    const source = fs.readFileSync(page, 'utf8');
    assert.ok(source.includes('<ModuleHeader') || source.includes('<PlanningWorkspace'), path.relative(root, page));
    assert.ok(source.includes('<ModulePage') || source.includes('<PlanningWorkspace'), path.relative(root, page));
  }
});

test('the shell provides mobile navigation without squeezing the main content', () => {
  const layout = fs.readFileSync(path.join(__dirname, '../src/app/(dashboard)/layout.tsx'), 'utf8');
  assert.match(layout, /<Sheet open=\{mobileMenuOpen\}/);
  assert.match(layout, /<SheetTitle/);
  assert.match(layout, /<AppSidebar mobile/);
  assert.match(layout, /matchMedia\('\(min-width: 768px\)'\)/);
  assert.match(layout, /if \(event\.matches\) setMobileMenuOpen\(false\)/);
  assert.match(layout, /md:pl-64/);
  assert.doesNotMatch(layout, /["']pl-64["']/);
  const css = fs.readFileSync(path.join(__dirname, '../src/app/globals.css'), 'utf8');
  assert.match(css, /--primary: #2563eb/);
  assert.match(css, /prefers-reduced-motion/);
});

test('wide document configuration tables contain their accessible hidden headings', () => {
  const source = fs.readFileSync(path.join(__dirname, '../src/app/(dashboard)/apoyo/estandar-documental/page.tsx'), 'utf8');
  assert.match(source, /<CardContent className="relative overflow-x-auto"/);
  assert.match(source, /<div className="relative overflow-x-auto"/);
});
