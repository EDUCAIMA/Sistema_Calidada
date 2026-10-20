// Local TypeScript loader for Node's test runner; no additional runtime dependencies.
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const resolve = Module._resolveFilename;
Module._resolveFilename = function (specifier, parent, ...rest) {
  return resolve.call(this, specifier.startsWith('@/')
    ? path.join(__dirname, '..', 'src', specifier.slice(2))
    : specifier, parent, ...rest);
};
require.extensions['.ts'] = (module, filename) => {
  const result = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    fileName: filename,
  });
  module._compile(result.outputText, filename);
};
