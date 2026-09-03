// Carrega VEICULOS, PROJETOS, HERO_SETS e as funções render*() de app.js
// rodando os arquivos reais do site num sandbox mínimo (sem navegador).
// Usado por generate-pages.mjs e validate-photos.mjs para não duplicar
// essa "ponte" entre o site e scripts Node.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';

export function loadSiteData(root) {
  let capturedHTML = '';
  const noop = () => {};
  const dummyEl = () => ({
    addEventListener: noop, removeEventListener: noop,
    classList: { add: noop, remove: noop, toggle: noop, contains: () => false },
    style: {}, dataset: {}, textContent: '',
    querySelectorAll: () => [], querySelector: () => null,
  });
  const appEl = {
    get innerHTML() { return capturedHTML; },
    set innerHTML(v) { capturedHTML = v; },
  };
  const sandbox = {
    document: {
      getElementById: (id) => (id === 'app' ? appEl : dummyEl()),
      querySelectorAll: () => [],
      querySelector: () => null,
      addEventListener: noop,
      createElement: () => dummyEl(),
      body: { style: {} },
    },
    window: { addEventListener: noop, scrollTo: noop, innerWidth: 1280, devicePixelRatio: 1 },
    history: { pushState: noop },
    location: { pathname: '/', hash: '' },
    Image: function () { return { set src(v){}, set srcset(v){}, set sizes(v){} }; },
    IntersectionObserver: function () { return { observe: noop, unobserve: noop }; },
    setInterval: () => 0,
    clearInterval: noop,
    console,
  };
  vm.createContext(sandbox);
  for (const file of ['app.js', 'data/veiculos.js', 'data/projetos.js']) {
    vm.runInContext(readFileSync(join(root, file), 'utf8'), sandbox, { filename: file });
  }
  // `const`/`let` de topo-nível não viram propriedades do objeto global do
  // vm automaticamente — expõe explicitamente o que os scripts precisam.
  vm.runInContext('globalThis.VEICULOS=VEICULOS;globalThis.PROJETOS=PROJETOS;globalThis.HERO_SETS=HERO_SETS;', sandbox);

  return {
    VEICULOS: sandbox.VEICULOS,
    PROJETOS: sandbox.PROJETOS,
    HERO_SETS: sandbox.HERO_SETS,
    render(fn, ...args) {
      capturedHTML = '';
      sandbox[fn](...args);
      return capturedHTML;
    },
  };
}
