// Servidor local do teste. Sem dependências: basta Node 22 ou mais novo.
// As chaves ficam no .env e nunca são enviadas ao navegador.
import http from 'node:http';
import { promises as fs, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(ROOT, 'public');
const OUT_DIR = path.join(ROOT, 'resultados');
const LOG_FILE = path.join(OUT_DIR, 'log.csv');
const HOST = '127.0.0.1';
const PORT = 4173;
const BATCH_DIR = path.join(OUT_DIR, 'lotes');
const RUNS_DIR = path.join(OUT_DIR, 'execucoes');
const MAX_BODY_BYTES = 60 * 1024 * 1024;
const MAX_BATCH_BODY_BYTES = 512 * 1024 * 1024;
const PROVIDER_TIMEOUT_MS = 180_000;
const BATCH_REFRESH_MS = 30_000;

const GOOGLE_HOST = 'https://generativelanguage.googleapis.com';
const GEMINI_URL = `${GOOGLE_HOST}/v1beta/interactions`;
const FAL_URL = 'https://fal.run/';
const QWEN_URL = 'https://ap-southeast-1.maas.qwencloudapi.com/api/v1/services/aigc/multimodal-generation/generation';
const CLOUDFLARE_URL = 'https://api.cloudflare.com/client/v4/accounts/';
const SIZES_1MP = { '1:1': '1024*1024', '2:3': '832*1248', '3:2': '1248*832', '3:4': '864*1152', '4:3': '1152*864', '4:5': '896*1120', '5:4': '1120*896', '9:16': '768*1344', '16:9': '1344*768' };
const ASPECTS = new Set(['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9']);
const ORIENTATIONS = new Set(['square', 'landscape', 'portrait']);
const MIMES = new Set(['image/jpeg', 'image/png']);
const GPT_SIZES = { square: '1024x1024', landscape: '1536x1024', portrait: '1024x1536' };

const flat = (value) => ({ square: value, landscape: value, portrait: value });

// Classificação das fotos: modelo de leitura barato, preço por 1M de tokens consultado em 10/11/2026.
const CLASSIFY_MODEL = 'gemini-3.5-flash-lite';
const CLASSIFY_PRICE = { input: 0.3, output: 2.5 };
const CATEGORY_KEYS = ['exterior', 'exterior_detail', 'open_cabin', 'interior_detail', 'engine', 'underside'];
const TONE_KEYS = ['light', 'medium', 'dark'];
const ANGLE_KEYS = ['front', 'front_left', 'left', 'rear_left', 'rear', 'rear_right', 'right', 'front_right', 'top', 'unknown'];
const CLASSIFY_PROMPT = `You sort photos of one vehicle for a studio photo editing pipeline. The photos are numbered from 0. Return exactly one entry per photo.

Categories:
- exterior: the whole vehicle seen from outside, or nearly all of it with only a small part cut off by the frame.
- exterior_detail: a close-up of part of the exterior (a corner, rear or front end, panel, bumper, wheel or lights) where a large part of the vehicle is outside the frame and some background or ground is still visible.
- open_cabin: the cabin as a whole, seen from outside, from above, through an open door or over an open top, with outdoor surroundings visible.
- interior_detail: a close-up of interior items (dashboard, gauges, shifter, seat, door panel, carpet) with little or no outside surroundings.
- engine: the engine bay seen from above or from the side, with the hood open.
- underside: any photo taken from below the vehicle (chassis, suspension, exhaust, axle, fuel tank, and also the engine or transmission when seen from underneath), usually on a lift.

For exterior and exterior_detail, give the camera angle around the vehicle. Left and right are the vehicle's own sides, as seen by someone sitting in it and facing forward. Use front, front_left, left, rear_left, rear, rear_right, right, front_right, top (seen from above) or unknown. For the other categories use unknown.

issues: short notes in Brazilian Portuguese, only when clearly present, chosen from: "Sombra do fotógrafo" (the shadow of a person on the ground), "Pessoa ou parte do corpo na foto" (including a foot, leg, shoe or hand at the edge of the frame), "Foto tremida", "Reflexos fortes", "Sombras duras de sol" (a large hard shadow of the vehicle on the ground), "Veículo cortado no enquadramento", "Marca d'água ou logo na foto" (a watermark, logo, timestamp or text overlaid on the image itself), "Propaganda de loja ou oficina" (a dealer or workshop name or logo on a plate, plate frame, sticker or sign; not the manufacturer's own emblems or the official license plate). Do not comment on resolution.

vehicle_tone: how light the vehicle's main paint color is: light (white, cream, silver, yellow, light pastel), medium (red, orange, mid blue, mid green, mid gray) or dark (black, dark blue, dark green, dark gray, dark brown).

vehicle_notes: one line in Brazilian Portuguese listing distinctive visible features that an editor must preserve, such as paint color and condition, patina, numbers or lettering, wheel and tire style, interior color. Do not guess make, model or year.

missing_angles: exterior views not covered by any photo, in Brazilian Portuguese, chosen from "Frente", "3/4 dianteira esquerda", "Lateral esquerda", "3/4 traseira esquerda", "Traseira", "3/4 traseira direita", "Lateral direita", "3/4 dianteira direita".`;
const CLASSIFY_SCHEMA = {
  type: 'object',
  properties: {
    photos: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          index: { type: 'integer' },
          category: { type: 'string', enum: CATEGORY_KEYS },
          angle: { type: 'string', enum: ANGLE_KEYS },
          issues: { type: 'array', items: { type: 'string' } },
        },
        required: ['index', 'category', 'angle', 'issues'],
      },
    },
    vehicle_tone: { type: 'string', enum: TONE_KEYS },
    vehicle_notes: { type: 'string' },
    missing_angles: { type: 'array', items: { type: 'string' } },
  },
  required: ['photos', 'vehicle_tone', 'vehicle_notes', 'missing_angles'],
};

// Preços em dólar por imagem gerada, consultados em 09/11/2026.
const MODELS = [
  { key: 'simulado', label: 'Simulado', provider: 'mock', price: flat(0), note: 'Devolve a foto original. Não usa IA nem gasta nada.' },
  { key: 'nano-lote', label: 'Nano Banana 2.1 · Lote 1K', provider: 'gemini', mode: 'batch', id: 'gemini-nano-banana-2.1', size: '1K', price: flat(0.0168), note: 'Google, em lote. Metade do preço, mas pode levar até 24 h.' },
  { key: 'nano-1k', label: 'Nano Banana 2.1 · 1K', provider: 'gemini', id: 'gemini-nano-banana-2.1', size: '1K', price: flat(0.0336), note: 'Google, API direta.' },
  { key: 'nano-2k', label: 'Nano Banana 2.1 · 2K', provider: 'gemini', id: 'gemini-nano-banana-2.1', size: '2K', price: flat(0.0504), note: 'Google, API direta.' },
  { key: 'klein-4b', label: 'FLUX.2 Klein 4B', provider: 'cloudflare', id: '@cf/black-forest-labs/flux-2-klein-4b', smallInputs: true, price: flat(0.002), note: 'Cloudflare, com cota grátis diária. Preço estimado. Recebe as fotos com menos de 512 px.' },
  { key: 'qwen-turbo', label: 'Qwen-Image-2.1 Turbo', provider: 'qwen', id: 'qwen-image-2.1-turbo', price: flat(0.016), note: 'Qwen Cloud, em tempo real. 10 imagens grátis por 90 dias.' },
  { key: 'qwen-pro', label: 'Qwen-Image-2.1 Pro', provider: 'qwen', id: 'qwen-image-2.1-pro', price: flat(0.04), note: 'Qwen Cloud, em tempo real. 10 imagens grátis por 90 dias.' },
  { key: 'seedream-lite', label: 'Seedream 5.0 Lite', provider: 'fal', id: 'fal-ai/bytedance/seedream/v5/lite/edit', price: flat(0.035), note: 'Via fal.' },
  { key: 'gpt15-low', label: 'GPT Image 1.5 · baixa', provider: 'fal', id: 'fal-ai/gpt-image-1.5/edit', quality: 'low', price: { square: 0.009, landscape: 0.013, portrait: 0.013 }, note: 'Via fal. A fal cobra também tokens de entrada.' },
  { key: 'gpt15-medium', label: 'GPT Image 1.5 · média', provider: 'fal', id: 'fal-ai/gpt-image-1.5/edit', quality: 'medium', price: { square: 0.034, landscape: 0.05, portrait: 0.051 }, note: 'Via fal. A fal cobra também tokens de entrada.' },
];

const KEY_NAMES = { gemini: 'GEMINI_API_KEY', fal: 'FAL_KEY', qwen: 'QWEN_API_KEY', cloudflare: 'CLOUDFLARE_ACCOUNT_ID e CLOUDFLARE_API_TOKEN' };

// O .env é relido a cada uso para a chave valer sem reiniciar o servidor.
function readKeys() {
  const fromFile = {};
  try {
    for (const line of readFileSync(path.join(ROOT, '.env'), 'utf8').split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
      if (match) fromFile[match[1]] = match[2].replace(/^["']|["']$/g, '');
    }
  } catch { /* sem .env: só o modo simulado fica disponível */ }
  const account = process.env.CLOUDFLARE_ACCOUNT_ID || fromFile.CLOUDFLARE_ACCOUNT_ID || '';
  const token = process.env.CLOUDFLARE_API_TOKEN || fromFile.CLOUDFLARE_API_TOKEN || '';
  return {
    cloudflare: account && token ? { account, token } : '',
    gemini: process.env.GEMINI_API_KEY || fromFile.GEMINI_API_KEY || '',
    fal: process.env.FAL_KEY || fromFile.FAL_KEY || '',
    qwen: process.env.QWEN_API_KEY || fromFile.QWEN_API_KEY || '',
  };
}

function providerError(provider, status, bodyText) {
  let detail = bodyText;
  try {
    const parsed = JSON.parse(bodyText);
    const raw = parsed.error?.message ?? parsed.error ?? parsed.errors?.[0]?.message ?? parsed.detail ?? parsed.message;
    if (raw) detail = typeof raw === 'string' ? raw : JSON.stringify(raw);
  } catch { /* resposta não era JSON */ }
  const hints = {
    401: 'A chave foi recusada. ',
    403: 'A chave não tem permissão ou o saldo acabou. ',
    429: 'Limite de uso atingido ou saldo insuficiente. ',
  };
  return new Error(`${hints[status] ?? ''}${provider} respondeu ${status}: ${String(detail).slice(0, 400)}`);
}

async function callGemini(model, job, key) {
  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': key, 'Api-Revision': '2026-05-20' },
    signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
    body: JSON.stringify({
      model: model.id,
      input: [
        { type: 'text', text: job.prompt },
        ...job.images.map((image) => ({ type: 'image', mime_type: image.mime, data: image.data })),
      ],
      response_format: { type: 'image', aspect_ratio: job.aspect, image_size: model.size },
    }),
  });
  const text = await response.text();
  if (!response.ok) throw providerError('Google', response.status, text);

  const result = JSON.parse(text);
  const outputs = (result.steps ?? []).filter((step) => step.type === 'model_output').flatMap((step) => step.content ?? []);
  const image = outputs.filter((block) => block.type === 'image' && block.data).at(-1);
  const base64 = image?.data ?? result.output_image?.data;
  if (!base64) {
    const said = outputs.filter((block) => block.type === 'text').map((block) => block.text).join(' ');
    throw new Error(`O Google não devolveu imagem. ${said.slice(0, 300)}`);
  }
  return Buffer.from(base64, 'base64');
}

async function callFal(model, job, key, orientation) {
  const body = {
    prompt: job.prompt,
    image_urls: job.images.map((image) => `data:${image.mime};base64,${image.data}`),
    num_images: 1,
    output_format: 'jpeg',
  };
  if (model.quality) Object.assign(body, { quality: model.quality, input_fidelity: 'high', image_size: GPT_SIZES[orientation] });

  const response = await fetch(FAL_URL + model.id, {
    method: 'POST',
    headers: { 'content-type': 'application/json', Authorization: `Key ${key}` },
    signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
    body: JSON.stringify(body),
  });
  const text = await response.text();
  if (!response.ok) throw providerError('fal', response.status, text);

  const imageUrl = JSON.parse(text).images?.[0]?.url;
  if (!imageUrl) throw new Error('A fal não devolveu imagem.');
  return downloadImage(imageUrl);
}

async function downloadImage(imageUrl) {
  if (!/^(https?:|data:)/.test(imageUrl)) throw new Error('O endereço da imagem gerada é inválido.');
  const download = await fetch(imageUrl, { signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS) });
  if (!download.ok) throw new Error(`Não consegui baixar a imagem gerada (${download.status}).`);
  return Buffer.from(await download.arrayBuffer());
}

async function callCloudflare(model, job, { account, token }) {
  const [width, height] = SIZES_1MP[job.aspect].split('*');
  const form = new FormData();
  // A numeração nativa do modelo começa em 0, e os prompts do app começam em 1.
  form.append('prompt', `Images are numbered from 1 in the order provided.\n\n${job.prompt}`);
  form.append('width', width);
  form.append('height', height);
  job.images.slice(0, 4).forEach((image, index) => {
    form.append(`input_image_${index}`, new Blob([Buffer.from(image.data, 'base64')], { type: image.mime }), `input_${index}.jpg`);
  });

  const response = await fetch(`${CLOUDFLARE_URL}${encodeURIComponent(account)}/ai/run/${model.id}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
    body: form,
  });
  const text = await response.text();
  if (!response.ok) throw providerError('Cloudflare', response.status, text);

  const base64 = JSON.parse(text).result?.image;
  if (!base64) throw new Error('A Cloudflare não devolveu imagem.');
  return Buffer.from(base64, 'base64');
}

async function callQwen(model, job, key) {
  const response = await fetch(QWEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json', Authorization: `Bearer ${key}` },
    signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
    body: JSON.stringify({
      model: model.id,
      input: {
        messages: [{
          role: 'user',
          content: [
            ...job.images.map((image) => ({ image: `data:${image.mime};base64,${image.data}` })),
            { text: job.prompt },
          ],
        }],
      },
      // Sem reescrita do prompt: as instruções de fidelidade precisam chegar como foram escritas.
      parameters: { n: 1, size: SIZES_1MP[job.aspect], prompt_extend: false, enable_thinking: false, watermark: false },
    }),
  });
  const text = await response.text();
  if (!response.ok) throw providerError('Qwen', response.status, text);

  const imageUrl = JSON.parse(text).output?.choices?.[0]?.message?.content?.find((part) => part.image)?.image;
  if (!imageUrl) throw new Error('O Qwen não devolveu imagem.');
  return downloadImage(imageUrl);
}

function isValidJob({ prompt, images, aspect, orientation }) {
  const validImages = Array.isArray(images) && images.length > 0 && images.length <= 10
    && images.every((image) => MIMES.has(image?.mime) && typeof image?.data === 'string');
  return typeof prompt === 'string' && Boolean(prompt.trim()) && validImages && ASPECTS.has(aspect) && ORIENTATIONS.has(orientation);
}

const safeAngle = (value) => String(value ?? 'foto').replace(/[^a-z0-9-]/gi, '').slice(0, 40) || 'foto';

function imageExtension(buffer) {
  if (buffer[0] === 0x89 && buffer[1] === 0x50) return 'png';
  return buffer.subarray(8, 12).toString('latin1') === 'WEBP' ? 'webp' : 'jpg';
}

async function appendLog(angle, modelKey, ms, cost, fileName) {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const hasLog = await fs.access(LOG_FILE).then(() => true, () => false);
  const header = hasLog ? '' : 'data,angulo,modelo,tempo_ms,custo_usd,arquivo\n';
  await fs.appendFile(LOG_FILE, `${header}${new Date().toISOString()},${angle},${modelKey},${ms},${cost},${fileName}\n`);
}

async function generate(payload) {
  const model = MODELS.find((item) => item.key === payload.model && item.mode !== 'batch');
  const { images, orientation } = payload;
  if (!model || !isValidJob(payload)) {
    throw Object.assign(new Error('Pedido inválido.'), { status: 400 });
  }

  const key = model.provider === 'mock' ? '' : readKeys()[model.provider];
  if (model.provider !== 'mock' && !key) {
    throw Object.assign(new Error(`Falta ${KEY_NAMES[model.provider]} no arquivo .env.`), { status: 400 });
  }

  const started = performance.now();
  let buffer;
  if (model.provider === 'gemini') buffer = await callGemini(model, payload, key);
  else if (model.provider === 'fal') buffer = await callFal(model, payload, key, orientation);
  else if (model.provider === 'qwen') buffer = await callQwen(model, payload, key);
  else if (model.provider === 'cloudflare') buffer = await callCloudflare(model, payload, key);
  else {
    await new Promise((resolve) => setTimeout(resolve, 700 + Math.random() * 1200));
    buffer = Buffer.from(images[0].data, 'base64');
  }
  const ms = Math.round(performance.now() - started);
  const cost = model.price[orientation];

  const angle = safeAngle(payload.angle);
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `${stamp}_${angle}_${model.key}.${imageExtension(buffer)}`;

  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.writeFile(path.join(OUT_DIR, fileName), buffer);
  await appendLog(angle, model.key, ms, cost, fileName);

  return { url: `/resultados/${encodeURIComponent(fileName)}`, ms, cost };
}

async function classifyPhotos({ images }) {
  const valid = Array.isArray(images) && images.length > 0 && images.length <= 60
    && images.every((image) => MIMES.has(image?.mime) && typeof image?.data === 'string');
  if (!valid) throw Object.assign(new Error('Pedido inválido.'), { status: 400 });
  const key = readKeys().gemini;
  if (!key) throw Object.assign(new Error('Falta GEMINI_API_KEY no arquivo .env.'), { status: 400 });

  const input = [{ type: 'text', text: CLASSIFY_PROMPT }];
  images.forEach((image, index) => input.push(
    { type: 'text', text: `Photo ${index}:` },
    { type: 'image', mime_type: image.mime, data: image.data },
  ));
  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': key, 'Api-Revision': '2026-05-20' },
    signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
    body: JSON.stringify({
      model: CLASSIFY_MODEL,
      input,
      response_format: { type: 'text', mime_type: 'application/json', schema: CLASSIFY_SCHEMA },
    }),
  });
  const text = await response.text();
  if (!response.ok) throw providerError('Google', response.status, text);

  const result = JSON.parse(text);
  const outputText = result.output_text ?? (result.steps ?? [])
    .filter((step) => step.type === 'model_output')
    .flatMap((step) => step.content ?? [])
    .filter((block) => block.type === 'text' && !block.thought)
    .map((block) => block.text)
    .join('');
  const parsed = JSON.parse(outputText);

  const photos = images.map((_, index) => {
    const item = parsed.photos?.find((photo) => photo.index === index) ?? {};
    return {
      index,
      category: CATEGORY_KEYS.includes(item.category) ? item.category : 'exterior',
      angle: ANGLE_KEYS.includes(item.angle) ? item.angle : 'unknown',
      issues: (Array.isArray(item.issues) ? item.issues : []).map((issue) => String(issue).slice(0, 80)).slice(0, 4),
    };
  });

  const usage = result.usage ?? result.usage_metadata ?? {};
  const inputTokens = usage.total_input_tokens ?? usage.input_tokens ?? usage.prompt_token_count;
  const outputTokens = usage.total_output_tokens ?? usage.output_tokens ?? usage.candidates_token_count;
  const cost = Number.isFinite(inputTokens) && Number.isFinite(outputTokens)
    ? (inputTokens * CLASSIFY_PRICE.input + outputTokens * CLASSIFY_PRICE.output) / 1e6
    : null;

  return {
    photos,
    notes: String(parsed.vehicle_notes ?? '').slice(0, 400),
    tone: TONE_KEYS.includes(parsed.vehicle_tone) ? parsed.vehicle_tone : null,
    missing: (Array.isArray(parsed.missing_angles) ? parsed.missing_angles : []).map(String).slice(0, 8),
    cost,
  };
}

// Modo lote. Só existe no formato generateContent, e o lote de imagens vai como arquivo JSONL.
function googleFetch(url, key, init = {}) {
  return fetch(url, {
    ...init,
    headers: { 'x-goog-api-key': key, ...init.headers },
    signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
  });
}

async function uploadBatchFile(key, content, displayName) {
  const start = await googleFetch(`${GOOGLE_HOST}/upload/v1beta/files`, key, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'X-Goog-Upload-Protocol': 'resumable',
      'X-Goog-Upload-Command': 'start',
      'X-Goog-Upload-Header-Content-Length': String(content.length),
      'X-Goog-Upload-Header-Content-Type': 'application/jsonl',
    },
    body: JSON.stringify({ file: { display_name: displayName } }),
  });
  if (!start.ok) throw providerError('Google', start.status, await start.text());
  const uploadUrl = start.headers.get('x-goog-upload-url');
  if (!uploadUrl) throw new Error('O Google não devolveu o endereço de envio do lote.');

  const upload = await googleFetch(uploadUrl, key, {
    method: 'POST',
    headers: { 'X-Goog-Upload-Offset': '0', 'X-Goog-Upload-Command': 'upload, finalize' },
    body: content,
  });
  const text = await upload.text();
  if (!upload.ok) throw providerError('Google', upload.status, text);
  const fileName = JSON.parse(text).file?.name;
  if (!fileName) throw new Error('O Google não confirmou o arquivo do lote.');
  return fileName;
}

const metaPath = (id) => path.join(BATCH_DIR, id, 'lote.json');
const saveBatch = (meta) => fs.writeFile(metaPath(meta.id), JSON.stringify(meta, null, 2));
const batchUrl = (id, fileName) => `/resultados/lotes/${encodeURIComponent(id)}/${encodeURIComponent(fileName)}`;
const normalizeState = (raw) => String(raw ?? '').replace(/^(JOB|BATCH)_STATE_/, '');
const isFinalState = (state) => ['SUCCEEDED', 'FAILED', 'CANCELLED', 'EXPIRED'].includes(state);

async function createBatch({ jobs }) {
  const model = MODELS.find((item) => item.mode === 'batch');
  if (!Array.isArray(jobs) || !jobs.length || !jobs.every(isValidJob)) throw Object.assign(new Error('Pedido inválido.'), { status: 400 });
  const key = readKeys()[model.provider];
  if (!key) throw Object.assign(new Error(`Falta ${KEY_NAMES[model.provider]} no arquivo .env.`), { status: 400 });

  const id = `lote-${new Date().toISOString().replace(/[:.]/g, '-')}`;
  const content = Buffer.from(jobs.map((job) => JSON.stringify({
    key: safeAngle(job.angle),
    request: {
      contents: [{
        parts: [
          { text: job.prompt },
          ...job.images.map((image) => ({ inline_data: { mime_type: image.mime, data: image.data } })),
        ],
      }],
      generation_config: {
        responseModalities: ['TEXT', 'IMAGE'],
        imageConfig: { aspectRatio: job.aspect, imageSize: model.size },
      },
    },
  })).join('\n') + '\n');

  const fileName = await uploadBatchFile(key, content, id);
  const response = await googleFetch(`${GOOGLE_HOST}/v1beta/models/${model.id}:batchGenerateContent`, key, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ batch: { display_name: id, input_config: { file_name: fileName } } }),
  });
  const text = await response.text();
  if (!response.ok) throw providerError('Google', response.status, text);
  const created = JSON.parse(text);
  if (!created.name) throw new Error('O Google não confirmou a criação do lote.');

  await fs.mkdir(path.join(BATCH_DIR, id), { recursive: true });
  const items = [];
  for (const job of jobs) {
    const angle = safeAngle(job.angle);
    const originalName = `original_${angle}.jpg`;
    await fs.writeFile(path.join(BATCH_DIR, id, originalName), Buffer.from(job.images[0].data, 'base64'));
    items.push({ key: angle, label: String(job.label ?? angle).slice(0, 40), cost: model.price[job.orientation], original: batchUrl(id, originalName), url: null, ms: null, error: null });
  }
  const meta = { id, name: created.name, model: model.key, createdAt: Date.now(), checkedAt: Date.now(), state: 'PENDING', warning: null, error: null, items };
  await saveBatch(meta);
  return meta;
}

function readBatchLine(line) {
  const response = line.response;
  const parts = (response?.candidates?.[0]?.content?.parts ?? []).filter((part) => !part.thought);
  const inline = parts.map((part) => part.inlineData ?? part.inline_data).filter((data) => data?.data).at(-1);
  if (inline) return { base64: inline.data };
  const said = parts.map((part) => part.text).filter(Boolean).join(' ');
  const reason = line.error?.message ?? line.status?.message ?? response?.promptFeedback?.blockReason ?? response?.candidates?.[0]?.finishReason ?? said;
  return { error: `O Google não devolveu imagem. ${String(reason ?? '').slice(0, 300)}` };
}

async function saveBatchResults(meta, key, responsesFile) {
  const download = await googleFetch(`${GOOGLE_HOST}/download/v1beta/${responsesFile}:download?alt=media`, key);
  const text = await download.text();
  if (!download.ok) throw providerError('Google', download.status, text);

  const elapsed = Date.now() - meta.createdAt;
  const lines = text.split('\n').filter((line) => line.trim()).map((line) => JSON.parse(line));
  for (const [index, line] of lines.entries()) {
    const item = meta.items.find((candidate) => candidate.key === line.key) ?? meta.items[index];
    if (!item) continue;
    const outcome = readBatchLine(line);
    if (outcome.error) {
      item.error = outcome.error;
      continue;
    }
    const buffer = Buffer.from(outcome.base64, 'base64');
    const fileName = `gerada_${item.key}.${imageExtension(buffer)}`;
    await fs.writeFile(path.join(BATCH_DIR, meta.id, fileName), buffer);
    item.url = batchUrl(meta.id, fileName);
    item.ms = elapsed;
    await appendLog(item.key, meta.model, elapsed, item.cost, `lotes/${meta.id}/${fileName}`);
  }
  for (const item of meta.items) {
    if (!item.url && !item.error) item.error = 'O Google não devolveu resultado para esta foto.';
  }
}

async function refreshBatch(meta) {
  const key = readKeys().gemini;
  if (!key) return meta;
  meta.checkedAt = Date.now();
  try {
    const response = await googleFetch(`${GOOGLE_HOST}/v1beta/${meta.name}`, key);
    const text = await response.text();
    if (!response.ok) throw providerError('Google', response.status, text);
    const remote = JSON.parse(text);
    const state = normalizeState(remote.state ?? remote.metadata?.state);
    if (state === 'SUCCEEDED') {
      const responsesFile = remote.dest?.fileName ?? remote.response?.responsesFile ?? remote.metadata?.output?.responsesFile;
      if (!responsesFile) throw new Error('O Google concluiu o lote, mas não informou o arquivo de resultados.');
      await saveBatchResults(meta, key, responsesFile);
    } else if (isFinalState(state)) {
      meta.error = remote.error?.message ?? null;
    }
    if (state) meta.state = state;
    meta.warning = null;
  } catch (error) {
    // Falha temporária: o lote continua no Google e será consultado de novo.
    meta.warning = `Não consegui consultar o lote agora: ${error.message}`;
  }
  await saveBatch(meta);
  return meta;
}

const refreshing = new Set();

async function listBatches() {
  const entries = await fs.readdir(BATCH_DIR).catch(() => []);
  const batches = [];
  for (const id of entries.sort().reverse()) {
    let meta;
    try {
      meta = JSON.parse(await fs.readFile(metaPath(id), 'utf8'));
    } catch {
      continue;
    }
    const due = !isFinalState(meta.state) && Date.now() - meta.checkedAt >= BATCH_REFRESH_MS;
    if (due && !refreshing.has(id)) {
      refreshing.add(id);
      try { meta = await refreshBatch(meta); } finally { refreshing.delete(id); }
    }
    batches.push(meta);
  }
  return batches;
}

// ---------- Histórico de execuções ----------
// Cada clique em "Gerar" vira uma execução com o estado de cada foto e a foto original,
// para ver os motivos de erro e refazer depois de fechar a página.

const RUN_STATUSES = ['queued', 'running', 'batch', 'ready', 'saved', 'error'];
const RUN_MODES = ['live', 'batch', 'local'];
const safeKey = (value) => String(value ?? '').replace(/[^a-zA-Z0-9-]/g, '_').slice(0, 80);
const runFile = (id) => path.join(RUNS_DIR, path.basename(id), 'execucao.json');
const runLocks = new Map();

// Serializa leituras e gravações de uma mesma execução: várias fotos terminam ao mesmo tempo.
function withRunLock(id, task) {
  const previous = runLocks.get(id) ?? Promise.resolve();
  const next = previous.then(task, task);
  runLocks.set(id, next.catch(() => {}));
  return next;
}

async function createRun({ folder, notes, items, originals }) {
  const validOriginals = Object.entries(originals ?? {}).every(([, image]) => MIMES.has(image?.mime) && typeof image?.data === 'string');
  if (!Array.isArray(items) || !items.length || items.length > 500 || !validOriginals) {
    throw Object.assign(new Error('Pedido inválido.'), { status: 400 });
  }
  const id = `execucao-${new Date().toISOString().replace(/[:.]/g, '-')}-${Math.random().toString(36).slice(2, 6)}`;
  const dir = path.join(RUNS_DIR, id);
  await fs.mkdir(dir, { recursive: true });
  const originalUrls = {};
  for (const [slotId, image] of Object.entries(originals ?? {})) {
    const fileName = `original_${safeKey(slotId)}.jpg`;
    await fs.writeFile(path.join(dir, fileName), Buffer.from(image.data, 'base64'));
    originalUrls[slotId] = `/resultados/execucoes/${encodeURIComponent(id)}/${encodeURIComponent(fileName)}`;
  }
  const run = {
    id,
    createdAt: Date.now(),
    folder: String(folder ?? '').slice(0, 80),
    notes: String(notes ?? '').slice(0, 400),
    items: items.map((item) => ({
      key: String(item.key ?? '').slice(0, 120),
      slotId: String(item.slotId ?? '').slice(0, 80),
      label: String(item.label ?? '').slice(0, 80),
      category: CATEGORY_KEYS.includes(item.category) ? item.category : 'exterior',
      modelKey: String(item.modelKey ?? '').slice(0, 40),
      mode: RUN_MODES.includes(item.mode) ? item.mode : 'live',
      original: originalUrls[item.slotId] ?? null,
      // Para refações: "execução-ou-lote|chave" da foto original, para não oferecer refazer duas vezes.
      source: item.source ? String(item.source).slice(0, 200) : null,
      // Instrução exata enviada à IA, para conferir depois por que uma imagem saiu de um jeito.
      prompt: item.prompt ? String(item.prompt).slice(0, 8000) : null,
      status: 'queued', error: null, url: null, fileName: null, cost: null, batchId: null, retried: false,
    })),
  };
  await fs.writeFile(runFile(id), JSON.stringify(run, null, 2));
  return run;
}

function applyRunUpdate(item, update) {
  if (RUN_STATUSES.includes(update.status)) item.status = update.status;
  for (const field of ['error', 'fileName', 'batchId']) {
    if (field in update) item[field] = update[field] == null ? null : String(update[field]).slice(0, 400);
  }
  // Só endereços do próprio servidor: imagens locais em base64 não entram no histórico.
  if (typeof update.url === 'string' && update.url.startsWith('/resultados/')) item.url = update.url;
  if (Number.isFinite(update.cost)) item.cost = update.cost;
  if (update.retried === true) item.retried = true;
}

async function updateRun(id, updates) {
  if (!Array.isArray(updates)) throw Object.assign(new Error('Pedido inválido.'), { status: 400 });
  return withRunLock(id, async () => {
    const run = JSON.parse(await fs.readFile(runFile(id), 'utf8'));
    for (const update of updates) {
      const item = run.items.find((candidate) => candidate.key === update?.key);
      if (item) applyRunUpdate(item, update);
    }
    await fs.writeFile(runFile(id), JSON.stringify(run, null, 2));
    return run;
  });
}

// Liga os resultados dos lotes concluídos às execuções, mesmo com a página fechada.
async function linkRunToBatches(run, batches) {
  const pending = run.items.filter((item) => item.status === 'batch' && item.batchId);
  const updates = [];
  for (const item of pending) {
    const batch = batches.find((candidate) => candidate.id === item.batchId);
    if (!batch || !isFinalState(batch.state)) continue;
    const result = batch.items.find((candidate) => candidate.key === safeAngle(item.slotId));
    updates.push(result?.url
      ? { key: item.key, status: 'ready', url: result.url, cost: result.cost }
      : { key: item.key, status: 'error', error: result?.error || batch.error || `Lote terminou como ${batch.state}.` });
  }
  return updates.length ? updateRun(run.id, updates) : run;
}

async function listHistory() {
  const batches = await listBatches();
  const entries = await fs.readdir(RUNS_DIR).catch(() => []);
  const runs = [];
  for (const id of entries.sort().reverse()) {
    try {
      const run = JSON.parse(await fs.readFile(runFile(id), 'utf8'));
      runs.push(await linkRunToBatches(run, batches));
    } catch { /* execução incompleta ou corrompida: ignora */ }
  }
  return { runs, batches };
}

async function cancelBatch(id) {
  const key = readKeys().gemini;
  const meta = JSON.parse(await fs.readFile(metaPath(path.basename(id)), 'utf8'));
  const response = await googleFetch(`${GOOGLE_HOST}/v1beta/${meta.name}:cancel`, key, { method: 'POST' });
  if (!response.ok) throw providerError('Google', response.status, await response.text());
  return refreshBatch(meta);
}

const CONTENT_TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8','.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.csv': 'text/csv; charset=utf-8' };

async function serveFile(res, filePath) {
  try {
    const data = await fs.readFile(filePath);
    res.writeHead(200, { 'content-type': CONTENT_TYPES[path.extname(filePath)] ?? 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(data);
  } catch {
    sendJson(res, 404, { error: 'Não encontrado.' });
  }
}

function sendJson(res, status, value) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(value));
}

async function readJson(req, maxBytes = MAX_BODY_BYTES) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBytes) throw Object.assign(new Error('Fotos grandes demais.'), { status: 413 });
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${HOST}:${PORT}`);

  // Impede que outro site, aberto no navegador, gaste sua cota por este servidor.
  const hostName = (req.headers.host ?? '').split(':')[0];
  if (hostName !== HOST && hostName !== 'localhost') return sendJson(res, 403, { error: 'Host não permitido.' });

  if (req.method === 'GET' && url.pathname === '/') return serveFile(res, path.join(PUBLIC_DIR, 'index.html'));
  if (req.method === 'GET' && url.pathname === '/prompts.js') return serveFile(res, path.join(PUBLIC_DIR, 'prompts.js'));

  if (req.method === 'GET' && url.pathname === '/api/config') {
    const keys = readKeys();
    return sendJson(res, 200, {
      classifier: Boolean(keys.gemini),
      models: MODELS.map(({ key, label, provider, mode, smallInputs, price, note }) => ({
        key, label, provider, mode, smallInputs, price, note,
        available: provider === 'mock' || Boolean(keys[provider]),
        missingKey: provider === 'mock' || keys[provider] ? null : KEY_NAMES[provider],
      })),
    });
  }

  if (req.method === 'GET' && url.pathname.startsWith('/resultados/lotes/')) {
    const [batchId, fileName] = url.pathname.split('/').slice(3).map((part) => path.basename(decodeURIComponent(part)));
    return serveFile(res, path.join(BATCH_DIR, batchId ?? '', fileName ?? ''));
  }

  if (req.method === 'GET' && url.pathname.startsWith('/resultados/execucoes/')) {
    const [runId, fileName] = url.pathname.split('/').slice(3).map((part) => path.basename(decodeURIComponent(part)));
    return serveFile(res, path.join(RUNS_DIR, runId ?? '', fileName ?? ''));
  }

  if (req.method === 'GET' && url.pathname === '/api/history') {
    return sendJson(res, 200, await listHistory());
  }

  if (req.method === 'POST' && url.pathname === '/api/runs') {
    if (!req.headers['content-type']?.startsWith('application/json')) return sendJson(res, 415, { error: 'Use JSON.' });
    try {
      return sendJson(res, 200, await createRun(await readJson(req, MAX_BATCH_BODY_BYTES)));
    } catch (error) {
      return sendJson(res, error.status ?? 500, { error: error.message });
    }
  }

  const runUpdateMatch = url.pathname.match(/^\/api\/runs\/([^/]+)\/update$/);
  if (req.method === 'POST' && runUpdateMatch) {
    if (!req.headers['content-type']?.startsWith('application/json')) return sendJson(res, 415, { error: 'Use JSON.' });
    try {
      const { updates } = await readJson(req);
      await updateRun(path.basename(decodeURIComponent(runUpdateMatch[1])), updates);
      return sendJson(res, 200, { ok: true });
    } catch (error) {
      return sendJson(res, error.status ?? (error.code === 'ENOENT' ? 404 : 500), { error: error.message });
    }
  }

  if (req.method === 'GET' && url.pathname.startsWith('/resultados/')) {
    const name = path.basename(decodeURIComponent(url.pathname));
    return serveFile(res, path.join(OUT_DIR, name));
  }

  if (req.method === 'POST' && url.pathname === '/api/classify') {
    if (!req.headers['content-type']?.startsWith('application/json')) return sendJson(res, 415, { error: 'Use JSON.' });
    try {
      return sendJson(res, 200, await classifyPhotos(await readJson(req)));
    } catch (error) {
      const timedOut = error.name === 'TimeoutError';
      return sendJson(res, error.status ?? 502, { error: timedOut ? 'A classificação demorou demais.' : error.message });
    }
  }

  if (req.method === 'GET' && url.pathname === '/api/batches') {
    return sendJson(res, 200, { batches: await listBatches() });
  }

  if (req.method === 'POST' && url.pathname === '/api/batches') {
    if (!req.headers['content-type']?.startsWith('application/json')) return sendJson(res, 415, { error: 'Use JSON.' });
    try {
      return sendJson(res, 200, await createBatch(await readJson(req, MAX_BATCH_BODY_BYTES)));
    } catch (error) {
      return sendJson(res, error.status ?? 502, { error: error.name === 'TimeoutError' ? 'O envio do lote demorou demais.' : error.message });
    }
  }

  const cancelMatch = url.pathname.match(/^\/api\/batches\/([^/]+)\/cancel$/);
  if (req.method === 'POST' && cancelMatch) {
    if (!req.headers['content-type']?.startsWith('application/json')) return sendJson(res, 415, { error: 'Use JSON.' });
    try {
      return sendJson(res, 200, await cancelBatch(decodeURIComponent(cancelMatch[1])));
    } catch (error) {
      return sendJson(res, 502, { error: error.message });
    }
  }

  if (req.method === 'POST' && url.pathname === '/api/generate') {
    if (!req.headers['content-type']?.startsWith('application/json')) return sendJson(res, 415, { error: 'Use JSON.' });
    try {
      return sendJson(res, 200, await generate(await readJson(req)));
    } catch (error) {
      const timedOut = error.name === 'TimeoutError';
      return sendJson(res, error.status ?? 502, { error: timedOut ? 'O modelo demorou mais de 3 minutos.' : error.message });
    }
  }

  return sendJson(res, 404, { error: 'Não encontrado.' });
});

server.on('error', (error) => {
  console.error(error.code === 'EADDRINUSE' ? `A porta ${PORT} já está em uso. Feche a outra janela do teste.` : error.message);
  process.exit(1);
});

server.listen(PORT, HOST, () => console.log(`Teste rodando em http://${HOST}:${PORT}`));
