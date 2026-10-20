const assert = require('node:assert/strict');
const { test } = require('node:test');
const {
  DEFAULT_DOCUMENT_STANDARD,
  parseDocumentStandardConfig,
  formatDocumentCode,
} = require('../src/lib/document-standard.ts');

const config = () => structuredClone(DEFAULT_DOCUMENT_STANDARD);

test('estándar documental: valores iniciales y códigos consecutivos uniformes', () => {
  const defaults = parseDocumentStandardConfig(null);
  assert.equal(defaults.schemaVersion, 1);
  assert.equal(defaults.documentTypes.find(type => type.id === 'MATRIZ').baseType, 'REGISTRO');
  assert.equal(formatDocumentCode(defaults, 'MAT', 1), 'SGC-MAT-001');
  assert.equal(formatDocumentCode({ ...defaults, organizationPrefix: 'ACME', separator: '_', sequenceDigits: 6 }, 'PR', 12), 'ACME_PR_000012');
  assert.equal(formatDocumentCode(defaults, 'RE', 1234), 'SGC-RE-1234');
  assert.throws(() => formatDocumentCode(defaults, 'RE', 0));
  assert.throws(() => formatDocumentCode(defaults, 'RE', 1.5));
});

test('estándar documental: valida duplicados, contenido, tipos y normaliza prefijos', () => {
  const valid = config();
  valid.organizationPrefix = ' acme ';
  valid.documentTypes[0].prefix = ' man ';
  const normalized = parseDocumentStandardConfig(valid);
  assert.equal(normalized.organizationPrefix, 'ACME');
  assert.equal(normalized.documentTypes[0].prefix, 'MAN');
  for (const key of ['id', 'name', 'prefix']) {
    const input = config();
    input.documentTypes[1][key] = input.documentTypes[0][key].toLowerCase();
    assert.throws(() => parseDocumentStandardConfig(input));
  }
  for (const change of [
    { documentTypes: [] },
    { primaryColor: 'red' },
    { organizationPrefix: 'ACME/../../' },
    { sequenceDigits: 2 },
    { separator: '/' },
    { footerText: 'a'.repeat(241) },
    { documentTypes: config().documentTypes.map(type => ({ ...type, active: false })) },
    { schemaVersion: 2 },
    { unauthorizedSetting: true },
  ]) assert.throws(() => parseDocumentStandardConfig({ ...config(), ...change }));
});
