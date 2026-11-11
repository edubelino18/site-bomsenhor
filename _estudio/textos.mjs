// Imprime em JSON os textos e categorias de public/prompts.js, para o modo
// automático (scripts/estudio-fotos.py) montar os pedidos exatamente como a tela.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const code = readFileSync(path.join(here, 'public', 'prompts.js'), 'utf8');
const result = vm.runInNewContext(`${code}
;({ AUTO_PRESET, PRESETS, CATEGORIES, ANGLE_ORDER, PROMPTS, REMOVE_MARKS, REMOVE_PERSON,
   PERSON_ISSUE: PERSON_ISSUE.source, MARK_ISSUE: MARK_ISSUE.source, NEIGHBOR_NOTE, STUDIO_REF_NOTE })`);
process.stdout.write(JSON.stringify(result));
