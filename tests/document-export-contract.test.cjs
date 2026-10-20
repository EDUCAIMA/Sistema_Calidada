const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('todos los PDF usan el generador corporativo compartido', () => {
  const source = path.join(__dirname, '..', 'src');
  function walk(directory) {
    return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
      const target = path.join(directory, entry.name);
      return entry.isDirectory() ? walk(target) : /\.tsx?$/.test(entry.name) ? [target] : [];
    });
  }
  const bypasses = walk(source).filter(file => {
    if (file === path.join(source, 'lib', 'document-pdf.ts')) return false;
    return /(?:from\s*|require\s*\(|import\s*\()\s*['"](?:jspdf|jspdf-autotable)['"]/.test(fs.readFileSync(file, 'utf8'));
  });
  assert.deepEqual(bypasses.map(file => path.relative(source, file)), [],
    'Un módulo nuevo debe usar downloadStandardPdf: no cree encabezados PDF independientes.');
});
