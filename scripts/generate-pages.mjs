// Gera arquivos HTML estáticos e reais para cada página do site (inclusive
// uma página por veículo/projeto do acervo), a partir dos mesmos dados e
// das mesmas funções de renderização usadas pelo site (app.js). Isso faz
// o Google conseguir indexar cada veículo/projeto com sua própria URL.
//
// Quando rodar: sempre que data/veiculos.js ou data/projetos.js mudarem
// (veículo/projeto novo, editado ou removido), ou se app.js/styles.css
// mudarem. Comando: node scripts/generate-pages.mjs
//
// Antes de gerar, roda scripts/validate-photos.mjs automaticamente (ele
// corrige sozinho fotos com extensão em maiúscula e avisa se alguma foto
// referenciada não existir em disco) — não precisa rodar isso à parte.
//
// Não precisa de instalação (usa só o módulo "vm" nativo do Node).

import { writeFileSync, mkdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSiteData } from './lib/load-site-data.mjs';
import { validatePhotos } from './validate-photos.mjs';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const SITE_URL = 'https://bomsenhorrestauracoes.com.br';

const { missing } = validatePhotos();
if (missing.length) {
  console.log('\nGerando as páginas mesmo assim, mas confira os avisos acima — alguma foto pode ficar quebrada.\n');
}

const { VEICULOS, PROJETOS, HERO_SETS, FAQS, ETAPAS_IMPORTACAO, render } = loadSiteData(ROOT);

// ── Dados da empresa (schema.org) ─────────────────────────────────
// Usados nos dados estruturados que o Google e as IAs leem. Preencha
// "rua", "cep" e "horarios" quando tiver os dados; campos vazios são
// omitidos automaticamente.
const EMPRESA = {
  nome: 'Bomsenhor Restaurações',
  descricao: 'Restauração de carros e motos clássicos e importação de veículos dos EUA, com oficina em Gaspar, SC, e projetos para todo o Brasil. Desde 2015.',
  telefone: '+55 47 99174-2031',
  email: 'bomsenhor10@icloud.com',
  rua: 'R. Antônio Weidgenannt, 185 - Gasparinho',
  cep: '89112-316',
  cidade: 'Gaspar',
  estado: 'SC',
  // Ex.: [{ dias: ['Monday','Tuesday','Wednesday','Thursday','Friday'], abre: '08:00', fecha: '18:00' }]
  horarios: [
    { dias: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], abre: '07:00', fecha: '12:00' },
    { dias: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], abre: '13:00', fecha: '17:30' },
  ],
  fundacao: '2015',
  fundadores: ['Vanderlei Bomsenhor', 'Edi Clea Bomsenhor'],
  redes: ['https://instagram.com/bomsenhorrestauracoes', 'https://maps.app.goo.gl/JuU8ReXoNPPCCW1s5'],
  hasMap: 'https://maps.app.goo.gl/JuU8ReXoNPPCCW1s5',
};

function truncate(s, n) {
  const clean = s.replace(/\s+/g, ' ').trim();
  return clean.length > n ? clean.slice(0, n - 1).trim() + '…' : clean;
}

function smUrl(url) {
  const i = url.lastIndexOf('.');
  return url.slice(0, i) + '-sm' + url.slice(i);
}

// ── Shell comum a todas as páginas (idêntico ao index.html) ──────────
const abs = u => u.startsWith('http') ? u : SITE_URL + u;
const escHtml = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

function empresaSchema() {
  const e = EMPRESA;
  const address = { '@type': 'PostalAddress', addressLocality: e.cidade, addressRegion: e.estado, addressCountry: 'BR' };
  if (e.rua) address.streetAddress = e.rua;
  if (e.cep) address.postalCode = e.cep;
  const o = {
    '@type': 'AutoRepair', '@id': SITE_URL + '/#empresa', name: e.nome, description: e.descricao,
    url: SITE_URL + '/', logo: SITE_URL + '/images/logo.png', image: SITE_URL + '/images/equipe/fundadores.jpg',
    telephone: e.telefone, email: e.email, address, areaServed: { '@type': 'Country', name: 'Brasil' }, foundingDate: e.fundacao,
    founder: e.fundadores.map(name => ({ '@type': 'Person', name })), sameAs: e.redes, hasMap: e.hasMap,
  };
  if (e.horarios.length) o.openingHoursSpecification = e.horarios.map(h => ({ '@type': 'OpeningHoursSpecification', dayOfWeek: h.dias, opens: h.abre, closes: h.fecha }));
  return o;
}
function breadcrumb(items) {
  return { '@type': 'BreadcrumbList', itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: SITE_URL + path })) };
}
function precoNumero(preco) {
  const m = String(preco || '').match(/[\d.]+(,\d+)?/);
  return m ? m[0].replace(/\./g, '').replace(',', '.') : null;
}
function veiculoSchema(v) {
  const [marca, ...resto] = v.nome.replace(/"/g, '').split(' ');
  const o = { '@type': ['Product', v.tipo === 'moto' ? 'Motorcycle' : 'Car'], name: `${v.nome} ${v.ano}`,
    brand: { '@type': 'Brand', name: marca }, model: resto.join(' '), vehicleModelDate: String(v.ano), description: v.descricao.replace(/\s+/g, ' ').trim(),
    image: (v.fotos || []).slice(0, 6).map(f => `${SITE_URL}/images/acervo/${v.id}/${f}`), category: v.tipo === 'moto' ? 'Motocicleta clássica' : 'Carro clássico',
    url: `${SITE_URL}/acervo/${v.id}/` };
  if (v.cor) o.color = v.cor;
  const km = String(v.km || '').match(/^([\d.]+)\s*km/i);
  if (km) o.mileageFromOdometer = { '@type': 'QuantitativeValue', value: Number(km[1].replace(/\./g, '')), unitCode: 'KMT' };
  const valor = precoNumero(v.preco);
  o.offers = { '@type': 'Offer', priceCurrency: 'BRL', url: o.url,
    availability: v.status === 'vendido' ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
    itemCondition: 'https://schema.org/UsedCondition', seller: { '@id': SITE_URL + '/#empresa' } };
  if (valor && v.status !== 'vendido') o.offers.price = valor;
  return o;
}
function howToSchema() {
  return { '@type': 'HowTo', name: 'Como importar um carro clássico dos EUA com a Bomsenhor',
    totalTime: 'P3M', step: ETAPAS_IMPORTACAO.map(([n, name, text], i) => ({ '@type': 'HowToStep', position: i + 1, name, text })) };
}
// Data da última alteração (git) dos arquivos que formam a página; se
// houver mudança ainda não salva no git, usa a data de hoje.
function lastmod(paths) {
  try {
    const q = paths.map(p => `"${p}"`).join(' ');
    if (execSync(`git status --porcelain -- ${q}`, { cwd: ROOT }).toString().trim()) return new Date().toISOString().slice(0, 10);
    return execSync(`git log -1 --format=%cs -- ${q}`, { cwd: ROOT }).toString().trim() || null;
  } catch { return null; }
}
function faqSchema(grupo) {
  return { '@type': 'FAQPage', mainEntity: FAQS.filter(f => f[0] === grupo).map(([, q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) };
}

function pageShell({ title, description, canonicalPath, bodyHTML, heroImage, heroWidths = [960, 1920], ogType = 'website', schema = [] }) {
  const heroFull = heroImage;
  const ld = { '@context': 'https://schema.org', '@graph': [empresaSchema(), ...schema] };
  const ogTitle = title.replace(/ \| Bomsenhor Restaurações$/, '');
  const heroSm = smUrl(heroFull);
  const [wSm, wFull] = heroWidths;
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<meta name="description" content="${description.replace(/"/g, '&quot;')}">
<link rel="canonical" href="${SITE_URL}${canonicalPath}">
<meta property="og:type" content="${ogType}">
<meta property="og:site_name" content="Bomsenhor Restaurações">
<meta property="og:locale" content="pt_BR">
<meta property="og:title" content="${escHtml(ogTitle)}">
<meta property="og:description" content="${escHtml(description)}">
<meta property="og:url" content="${SITE_URL}${canonicalPath}">
<meta property="og:image" content="${abs(heroFull)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escHtml(ogTitle)}">
<meta name="twitter:description" content="${escHtml(description)}">
<meta name="twitter:image" content="${abs(heroFull)}">
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>
<link rel="icon" type="image/png" href="/images/logo.png">
<link rel="apple-touch-icon" href="/images/logo.png">
<link rel="preload" as="image" href="${heroSm}" imagesrcset="${heroSm} ${wSm}w, ${heroFull} ${wFull}w" imagesizes="100vw" fetchpriority="high">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,700;1,400;1,500&family=Outfit:wght@300;400;500;600&display=swap">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,700;1,400;1,500&family=Outfit:wght@300;400;500;600&display=swap" rel="stylesheet" media="print" onload="this.media='all'">
<noscript><link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,700;1,400;1,500&family=Outfit:wght@300;400;500;600&display=swap" rel="stylesheet"></noscript>
<link rel="stylesheet" href="/styles.css">
</head>
<body>

<nav id="nav">
  <div class="nav-inner">
    <a class="nav-logo" href="/">
      <img id="navLogo" alt="Bomsenhor">
    </a>
    <div class="nav-links" id="navLinks">
      <a href="/acervo/" data-page="acervo">Acervo</a>
      <a href="/projetos/" data-page="projetos">Projetos</a>
      <a href="/importacao/" data-page="importacao">Importação</a>
      <a href="/sobre/" data-page="sobre">Sobre</a>
      <a href="/contato/" data-page="contato">Contato</a>
    </div>
    <button class="hamburger" id="hamburger" aria-label="Menu"><span></span><span></span><span></span></button>
  </div>
</nav>

<div id="mobileMenu">
  <a href="/acervo/">Acervo</a>
  <a href="/projetos/">Projetos</a>
  <a href="/importacao/">Importação</a>
  <a href="/sobre/">Sobre</a>
  <a href="/contato/">Contato</a>
  <a href="https://wa.me/5547991742031?text=Olá! Vim pelo site e gostaria de tirar algumas dúvidas." class="wa-mob" target="_blank" rel="noopener">WhatsApp</a>
</div>

<main id="app">${bodyHTML}</main>

<div id="lightbox" class="lightbox" onclick="if(event.target===this)closeLightbox()">
  <button class="lightbox-close" onclick="closeLightbox()" aria-label="Fechar">&times;</button>
  <button class="lightbox-prev" onclick="lightboxNav(-1)" aria-label="Foto anterior">&larr;</button>
  <img id="lightboxImg" alt="">
  <p id="lightboxCaption" class="lightbox-caption"></p>
  <button class="lightbox-next" onclick="lightboxNav(1)" aria-label="Próxima foto">&rarr;</button>
</div>

<footer id="footer">
  <div class="footer-inner">
    <div class="footer-top">
      <div>
        <div class="footer-brand-name">Bomsenhor Restaurações</div>
        <p class="footer-tagline">Restauração e importação de veículos clássicos em Gaspar, SC.</p>
      </div>
      <div class="footer-nav">
        <span class="s-tag on-dark">Navegação</span>
        <a href="/acervo/">Acervo</a>
        <a href="/projetos/">Projetos</a>
        <a href="/importacao/">Importação</a>
        <a href="/sobre/">Sobre</a>
        <a href="/contato/">Contato</a>
      </div>
      <div class="footer-nav">
        <span class="s-tag on-dark">Contato</span>
        <a href="https://wa.me/5547991742031?text=Olá! Vim pelo site e gostaria de tirar algumas dúvidas." target="_blank">WhatsApp</a>
        <a href="https://instagram.com/bomsenhorrestauracoes" target="_blank">Instagram</a>
        <a href="mailto:bomsenhor10@icloud.com">E-mail</a>
        <span class="footer-hours">Seg. a sex.: 7h–12h e 13h–17h30</span>
      </div>
    </div>
    <div class="footer-bottom">
      <p class="footer-copy">© 2026 Bomsenhor Restaurações. Todos os direitos reservados.</p>
      <p class="footer-loc"><a href="https://maps.app.goo.gl/JuU8ReXoNPPCCW1s5" target="_blank" rel="noopener">R. Antônio Weidgenannt, 185 - Gasparinho, Gaspar - SC, 89112-316</a></p>
    </div>
  </div>
</footer>

<a class="wa-float" href="https://wa.me/5547991742031?text=Olá! Vim pelo site e gostaria de tirar algumas dúvidas." target="_blank" rel="noopener" aria-label="WhatsApp">
  <svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
</a>

<script src="/app.js"></script>
<script src="/data/veiculos.js"></script>
<script src="/data/projetos.js"></script>
</body>
</html>
`;
}

function writePage(relPath, html) {
  const full = join(ROOT, relPath);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, html, 'utf8');
}

// ── Tabela de rotas ────────────────────────────────────────────────
function heroFirst(pagina) {
  return `/images/hero/${pagina}/${HERO_SETS[pagina][0]}`;
}
function coverPhoto(item, tipo) {
  return `/images/${tipo}/${item.id}/${item.fotos[0]}`;
}

const routes = [];

routes.push({
  path: '/', file: 'index.html',
  title: 'Importação e Restauração de Carros e Motos em Gaspar, SC | Bomsenhor',
  description: 'Restauração e importação de carros e motos clássicos, com oficina em Gaspar, SC, e projetos para todo o Brasil. Desde 2015, mais de 45 veículos restaurados.',
  heroImage: heroFirst('home'),
  html: () => render('renderHome'),
});

routes.push({
  path: '/acervo/', file: 'acervo/index.html',
  title: 'Acervo de veículos clássicos à venda | Bomsenhor Restaurações',
  description: 'Carros e motos clássicos à venda no acervo da Bomsenhor, em Gaspar, SC: veículos com procedência, revisados e entregues para todo o Brasil.',
  heroImage: heroFirst('acervo'),
  html: () => render('renderAcervo'),
});
for (const v of VEICULOS) {
  const statusTxt = v.status === 'vendido' ? 'vendido' : 'à venda';
  routes.push({
    path: `/acervo/${v.id}/`, file: `acervo/${v.id}/index.html`,
    title: `${v.nome} ${v.ano} ${statusTxt} em Gaspar, SC | Bomsenhor`,
    description: truncate(v.descricao, 155),
    heroImage: v.fotos && v.fotos.length ? coverPhoto(v, 'acervo') : heroFirst('acervo'),
    heroWidths: v.fotos && v.fotos.length ? [800, 1600] : [960, 1920],
    ogType: 'product',
    schema: [veiculoSchema(v), breadcrumb([['Início', '/'], ['Acervo', '/acervo/'], [`${v.nome} ${v.ano}`, `/acervo/${v.id}/`]])],
    html: () => render('renderVeiculoDetalhe', v.id),
  });
}

routes.push({
  path: '/projetos/', file: 'projetos/index.html',
  title: 'Projetos de Restauração de Carros e Motos | Bomsenhor',
  description: 'Projetos de restauração de carros e motos clássicos da Bomsenhor, em Gaspar, SC: etapas documentadas em fotos e vídeos para clientes de todo o Brasil.',
  heroImage: heroFirst('projetos'),
  schema: [faqSchema('projetos')],
  html: () => render('renderProjetos'),
});
for (const p of PROJETOS) {
  routes.push({
    path: `/projetos/${p.id}/`, file: `projetos/${p.id}/index.html`,
    title: `${p.nome} ${p.ano}: restauração | Bomsenhor`,
    description: truncate(p.descricao, 155),
    heroImage: p.fotos && p.fotos.length ? coverPhoto(p, 'projetos') : heroFirst('projetos'),
    heroWidths: p.fotos && p.fotos.length ? [800, 1600] : [960, 1920],
    schema: [breadcrumb([['Início', '/'], ['Projetos', '/projetos/'], [`${p.nome} ${p.ano}`, `/projetos/${p.id}/`]])],
    html: () => render('renderProjetoDetalhe', p.id),
  });
}

routes.push({
  path: '/importacao/', file: 'importacao/index.html',
  title: 'Importação de Carros Clássicos dos EUA | Bomsenhor',
  description: 'Importação de clássicos dos EUA com restauração no Brasil: economia de 40% a 60%, do garimpo à placa preta, com toda a logística e documentação.',
  heroImage: heroFirst('importacao'),
  schema: [howToSchema(), faqSchema('importacao')],
  html: () => render('renderImportacao'),
});
routes.push({
  path: '/sobre/', file: 'sobre/index.html',
  title: 'Sobre a Bomsenhor: Restauração Desde 2015 em Gaspar, SC',
  description: 'Do primeiro Opala, em 2013, a 575 m² de oficina: a história da Bomsenhor Restaurações em Gaspar, SC, que atende clientes de todo o Brasil.',
  heroImage: heroFirst('sobre'),
  html: () => render('renderSobre'),
});
routes.push({
  path: '/contato/', file: 'contato/index.html',
  title: 'Contato e Endereço em Gaspar, SC | Bomsenhor Restaurações',
  description: 'Fale com a Bomsenhor Restaurações: WhatsApp (47) 99174-2031, endereço em Gaspar, SC, horário de atendimento e respostas às dúvidas mais comuns.',
  heroImage: heroFirst('contato'),
  schema: [faqSchema('contato')],
  html: () => render('renderContato'),
});

for (const r of routes) {
  const base = ['app.js', 'styles.css', 'scripts/generate-pages.mjs'];
  const m = r.path.match(/^\/(acervo|projetos)\/([^/]+)\/$/);
  r.lastmod = lastmod(m ? [...base, m[1] === 'acervo' ? 'data/veiculos.js' : 'data/projetos.js', `images/${m[1]}/${m[2]}`] : base);
}

// ── Gera cada página ───────────────────────────────────────────────
for (const r of routes) {
  const html = pageShell({
    title: r.title,
    description: r.description,
    canonicalPath: r.path,
    heroImage: r.heroImage,
    heroWidths: r.heroWidths,
    ogType: r.ogType,
    schema: r.schema,
    bodyHTML: r.html(),
  });
  writePage(r.file, html);
}

// ── Regenera o sitemap.xml com todas as URLs reais ──────────────────
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map(r => `  <url>
    <loc>${SITE_URL}${r.path}</loc>
${r.lastmod ? `    <lastmod>${r.lastmod}</lastmod>\n` : ''}    <changefreq>weekly</changefreq>
    <priority>${r.path === '/' ? '1.0' : '0.7'}</priority>
  </url>`).join('\n')}
</urlset>
`;
writeFileSync(join(ROOT, 'sitemap.xml'), sitemap, 'utf8');

console.log(`Geradas ${routes.length} páginas + sitemap.xml`);
