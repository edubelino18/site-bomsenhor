// Valida e corrige automaticamente o tipo de problema que já nos pegou
// uma vez: fotos com a extensão salva em MAIÚSCULA (ex: "7.JPG") no Git.
// No Windows isso passa despercebido (o sistema de arquivos não liga pra
// caixa), mas o GitHub Pages roda em Linux e É sensível a isso — a foto
// simplesmente não é encontrada no site publicado, mesmo funcionando
// perfeitamente aqui na sua máquina.
//
// O que este script faz sozinho, sem precisar de nada manual:
//   1. Procura toda foto em images/acervo/, images/projetos/ e
//      images/hero/ cuja extensão não esteja em minúsculo, e já
//      renomeia para minúsculo (preservando o histórico no Git).
//   2. Confere se toda foto listada nos "fotos:[...]" de
//      data/veiculos.js / data/projetos.js, e toda foto listada em
//      HERO_SETS (dentro de app.js), realmente existe em disco com
//      esse nome exato — isso pega tanto erro de digitação quanto
//      foto que foi removida mas ainda está referenciada.
//
// Roda automaticamente toda vez que scripts/generate-pages.mjs roda,
// então normalmente você não precisa executar isto à parte. Rodar na
// mão: node scripts/validate-photos.mjs

import { readdirSync, renameSync, existsSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { loadSiteData } from './lib/load-site-data.mjs';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const IMAGE_SUBDIRS = ['images/acervo', 'images/projetos', 'images/hero'];

function isGitTracked(relPath) {
  try {
    execFileSync('git', ['ls-files', '--error-unmatch', relPath], { cwd: ROOT, stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function gitMv(fromRel, toRel) {
  execFileSync('git', ['mv', fromRel, toRel], { cwd: ROOT, stdio: 'ignore' });
}

// ── 1. Normaliza extensões maiúsculas para minúsculo ──────────────────
function fixExtensionCase() {
  const fixed = [];
  for (const sub of IMAGE_SUBDIRS) {
    const base = join(ROOT, sub);
    if (!existsSync(base)) continue;
    walk(base, (fullPath) => {
      const name = fullPath.split(/[\\/]/).pop();
      const dot = name.lastIndexOf('.');
      if (dot === -1) return;
      const ext = name.slice(dot);
      const extLower = ext.toLowerCase();
      if (ext === extLower) return;
      if (!['.jpg', '.jpeg', '.png'].includes(extLower)) return;

      const dir = dirname(fullPath);
      const newName = name.slice(0, dot) + extLower;
      const relOld = relPath(fullPath);
      const relNew = relPath(join(dir, newName));

      if (isGitTracked(relOld)) {
        const relTmp = relPath(join(dir, name.slice(0, dot) + '.__casefix__'));
        gitMv(relOld, relTmp);
        gitMv(relTmp, relNew);
      } else {
        renameSync(fullPath, join(dir, newName));
      }
      fixed.push({ from: relOld, to: relNew });
    });
  }
  return fixed;
}

function walk(dir, onFile) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, onFile);
    else onFile(full);
  }
}

function relPath(absPath) {
  return absPath.slice(ROOT.length + 1).split('\\').join('/');
}

// ── 2. Confere se toda foto referenciada existe de verdade, com o nome
// exato (maiúscula/minúscula inclusas) ────────────────────────────────
function dirEntriesExact(absDir) {
  return existsSync(absDir) ? new Set(readdirSync(absDir)) : new Set();
}

function smName(filename) {
  const dot = filename.lastIndexOf('.');
  return filename.slice(0, dot) + '-sm' + filename.slice(dot);
}

function checkReferences({ VEICULOS, PROJETOS, HERO_SETS }) {
  const missing = [];

  function checkItem(item, tipo) {
    if (!item.fotos || !item.fotos.length) return;
    const absDir = join(ROOT, 'images', tipo, item.id);
    const entries = dirEntriesExact(absDir);
    for (const f of item.fotos) {
      if (!entries.has(f)) missing.push(`images/${tipo}/${item.id}/${f}  (referenciado em ${item.id})`);
      const sm = smName(f);
      if (!entries.has(sm)) missing.push(`images/${tipo}/${item.id}/${sm}  (variante -sm de ${item.id}, rode optimize-photos.py)`);
    }
  }
  for (const v of VEICULOS) checkItem(v, 'acervo');
  for (const p of PROJETOS) checkItem(p, 'projetos');

  for (const pagina of Object.keys(HERO_SETS)) {
    const absDir = join(ROOT, 'images', 'hero', pagina);
    const entries = dirEntriesExact(absDir);
    for (const f of HERO_SETS[pagina]) {
      if (!entries.has(f)) missing.push(`images/hero/${pagina}/${f}  (referenciado em HERO_SETS.${pagina})`);
      const sm = smName(f);
      if (!entries.has(sm)) missing.push(`images/hero/${pagina}/${sm}  (variante -sm de HERO_SETS.${pagina}, rode optimize-photos.py)`);
    }
  }
  return missing;
}

export function validatePhotos({ quiet = false } = {}) {
  const fixed = fixExtensionCase();
  // Recarrega os dados depois do possível rename (o conteúdo de
  // veiculos.js/projetos.js/app.js não muda, mas os arquivos em disco sim).
  const data = loadSiteData(ROOT);
  const missing = checkReferences(data);

  if (!quiet) {
    if (fixed.length) {
      console.log(`Corrigido(s) automaticamente ${fixed.length} arquivo(s) com extensão maiúscula:`);
      for (const { from, to } of fixed) console.log(`  ${from} -> ${to}`);
    } else {
      console.log('Nenhum arquivo com extensão maiúscula encontrado.');
    }
    if (missing.length) {
      console.log(`\nATENÇÃO: ${missing.length} referência(s) sem arquivo correspondente:`);
      for (const m of missing) console.log(`  ${m}`);
    } else {
      console.log('Todas as fotos referenciadas em data/veiculos.js, data/projetos.js e HERO_SETS existem.');
    }
  }
  return { fixed, missing };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { missing } = validatePhotos();
  if (missing.length) process.exitCode = 1;
}
