// Gera a página de uma proposta de importação/restauração a partir de um
// arquivo de dados do carro.
//
// Uso:   node scripts/gerar-proposta.mjs <slug>
// Ex.:   node scripts/gerar-proposta.mjs corvette-1954
//
// Lê:    _propostas/<slug>.json        (textos, valores, prazos, parcelas, fotos)
//        _propostas/empresa.json       (dados da Bomsenhor, iguais em todas)
//        _propostas/modelo/estilo.css  (visual)
//        _propostas/modelo/script.js   (galerias, comparativo, ampliar fotos)
// Gera:  proposta/<slug>/index.html
//
// As fotos já preparadas ficam em proposta/<slug>/img/ (veja
// scripts/preparar-fotos-proposta.py). O guia completo está em
// _propostas/GUIA.md. A pasta _propostas não é publicada no site.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const slug = process.argv[2];
if (!slug) {
  console.error('Uso: node scripts/gerar-proposta.mjs <slug>   (ex.: corvette-1954)');
  process.exit(1);
}

const lerJson = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
const d = lerJson(`_propostas/${slug}.json`);
const e = lerJson('_propostas/empresa.json');
const css = readFileSync(join(ROOT, '_propostas/modelo/estilo.css'), 'utf8').trimEnd();
const js = readFileSync(join(ROOT, '_propostas/modelo/script.js'), 'utf8').trimEnd();
const pasta = join(ROOT, 'proposta', slug);
const avisos = [];

// ── Formatação ─────────────────────────────────────────────────────
const attr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const milhar = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const brl = (n) => `R$ ${milhar(n)}`;
const curto = (n) => n >= 1e6
  ? `${String(Number((n / 1e6).toFixed(2))).replace('.', ',')} mi`
  : `${String(Number((n / 1e3).toFixed(1))).replace('.', ',')} mil`;
const pct = (x) => String(Number(x.toFixed(2)));
const ehNumero = (s) => /^[\d.,]+( mil)?$/.test(s);
const PALAVRAS = { 1: 'Uma', 2: 'Duas', 3: 'Três', 4: 'Quatro', 5: 'Cinco', 6: 'Seis', 7: 'Sete', 8: 'Oito', 9: 'Nove', 10: 'Dez', 11: 'Onze', 12: 'Doze' };
const v = d.versaoFotos ? `?v=${d.versaoFotos}` : '';
const site = e.site.replace(/\/$/, '');
const url = `${site}/proposta/${slug}/`;

// ── Conferências (avisam, não bloqueiam) ───────────────────────────
const total = d.investimento.custos.reduce((s, c) => s + c.valor, 0);
const totalParcelas = d.parcelas.reduce((s, p) => s + p.valor, 0);
if (totalParcelas !== total) avisos.push(`As parcelas somam ${brl(totalParcelas)}, mas o investimento soma ${brl(total)}.`);
const meses = d.prazos.fases.reduce((s, f) => s + f.meses, 0);
d.parcelas.forEach((p, i) => { if (p.mes < 0 || p.mes > meses) avisos.push(`Parcela ${i + 1}: mês ${p.mes} fora da linha do tempo (0 a ${meses}).`); });
const confere = (rel) => { if (!existsSync(join(pasta, rel))) avisos.push(`Foto não encontrada: proposta/${slug}/${rel}`); };
confere(d.capa.fotoHoje); confere(d.capa.fotoNovo);
d.galeriaHoje.fotos.forEach(([f]) => confere(`img/antes/${f}`));
d.galeriaReferencia?.fotos.forEach(([f]) => confere(`img/depois/${f}`));
d.comparativo?.pares.forEach(([id]) => { confere(`img/par/${id}-antes.jpg`); confere(`img/par/${id}-depois.jpg`); });

// ── Blocos ─────────────────────────────────────────────────────────
const destaquesCapa = d.capa.destaques.map(([val, rot]) =>
  `      <div><b${ehNumero(val) ? ' class="num"' : ''}>${val}</b><span>${rot}</span></div>`).join('\n');

const raridade = d.raridade ? `
<!-- ================= RARIDADE ================= -->
<section id="raridade">
  <div class="wrap rarity">
    <div class="rarity-copy">
      <span class="eyebrow">Raridade</span>
      <h2 style="font-size:clamp(30px,4.4vw,46px)">${d.raridade.titulo}</h2>
      <p class="lead">${d.raridade.lead}</p>
${(d.raridade.paragrafos || []).map((p) => `      <p>${p}</p>`).join('\n')}
${d.raridade.nota ? `      <p style="font-size:15px;color:var(--muted)">${d.raridade.nota}</p>` : ''}
    </div>
    <div class="counter">
${d.raridade.numeros.map(([n, t]) => `      <div class="counter-row"><b${ehNumero(n) ? ' class="num"' : ''}>${n}</b><span>${t}</span></div>`).join('\n')}
    </div>
  </div>
</section>
` : '';

const ficha = d.ficha.map(([k, val]) => `          <div><dt>${k}</dt><dd>${val}</dd></div>`).join('\n');
const destaques = d.destaques.map(([forte, resto]) => `          <li><span><strong>${forte}</strong> ${resto}</span></li>`).join('\n');

const comparativo = d.comparativo ? `
<!-- ================= ANTES x DEPOIS ================= -->
<section id="antes-depois">
  <div class="wrap">
    <div class="head">
      <h2>${d.comparativo.titulo}</h2>
      <p class="lead">${d.comparativo.lead}</p>
    </div>
    <div class="compare-wrap">
      <div class="compare-tabs" role="group" aria-label="Escolher ângulo" id="cmp-tabs"></div>
      <div class="compare" id="cmp" style="--pos:50%">
        <img class="before" id="cmp-a" src="img/par/${d.comparativo.pares[0][0]}-antes.jpg${v}" alt="Antes">
        <img class="after" id="cmp-d" src="img/par/${d.comparativo.pares[0][0]}-depois.jpg${v}" alt="Depois (simulação)">
        <span class="tag l">Hoje</span><span class="tag r">Como vai ficar</span>
        <div class="divider"><span class="knob" aria-hidden="true">↔</span></div>
        <input type="range" id="cmp-range" min="0" max="100" value="50" aria-label="Comparar antes e depois">
      </div>
      <p class="disclaimer">${d.comparativo.aviso}</p>
    </div>
  </div>
</section>
` : '';

const referencia = d.galeriaReferencia ? `
<!-- ================= REFERÊNCIAS ================= -->
<section id="resultado">
  <div class="wrap">
    <div class="head">
      <h2>${d.galeriaReferencia.titulo}</h2>
      <p class="lead">${d.galeriaReferencia.lead}</p>
    </div>
    <div class="gallery ref" id="g-depois"></div>
    <p class="disclaimer">${d.galeriaReferencia.aviso}</p>
  </div>
</section>
` : '';

const escopo = d.escopo.etapas.map((et, i) => `      <article>
        <span class="step">Etapa ${i + 1}</span>
        <h3>${et.titulo}</h3>
        <ul>
${et.itens.map((it) => `          <li>${it}</li>`).join('\n')}
        </ul>
${et.extra ? `        <p class="extra">${et.extra}</p>` : ''}
      </article>`).join('\n');

const CORES = ['var(--navy)', 'var(--gold-soft)', 'var(--red)', 'var(--muted)'];
const custos = d.investimento.custos.map((c) => `          <div class="ledger-row">
            <div><h3>${c.titulo}</h3><p>${c.detalhe}</p></div>
            <span class="val num">${brl(c.valor)}</span>
          </div>`).join('\n');
const barra = d.investimento.custos.map((c, i) => `          <i style="width:${pct(c.valor / total * 100)}%;background:${CORES[i % CORES.length]}"></i>`).join('\n');
const legenda = d.investimento.custos.map((c, i) => {
  const cor = CORES[i % CORES.length];
  const contorno = cor === 'var(--navy)' ? ';outline:1px solid rgba(244,241,232,.3)' : '';
  return `          <div><i style="background:${cor}${contorno}"></i><span>${c.legenda || c.titulo}</span><b>${Math.round(c.valor / total * 100)}%</b></div>`;
}).join('\n');

let mercado = '';
if (d.mercado) {
  const max = Math.max(...d.mercado.itens.map((m) => m.valor));
  const base = (d.mercado.itens.find((m) => m.esteProjeto) || { valor: total }).valor;
  const linhas = d.mercado.itens.map((m) => {
    const dif = m.valor - base;
    const sub = m.esteProjeto ? 'valor estimado' : `R$ ${curto(Math.abs(dif))} ${dif >= 0 ? 'acima' : 'abaixo'}`;
    return `      <div class="mk-row${m.esteProjeto ? ' is-this' : ''}">
        <div class="mk-info"><h3>${m.titulo}</h3><p>${m.detalhe}</p></div>
        <div class="mk-bar"><i style="width:${pct(m.valor / max * 100)}%"></i></div>
        <div class="mk-val"><b>R$ ${curto(m.valor)}</b><small>${sub}</small></div>
      </div>`;
  }).join('\n');
  mercado = `
<!-- ================= MERCADO ================= -->
<section id="mercado">
  <div class="wrap">
    <div class="head">
      <span class="eyebrow">Referência de mercado</span>
      <h2>${d.mercado.titulo}</h2>
      <p class="lead">${d.mercado.lead}</p>
    </div>
    <div class="market">
${linhas}
    </div>
    <p class="disclaimer">${d.mercado.aviso}</p>
  </div>
</section>
`;
}

// Linha do tempo: fases proporcionais aos meses; círculos = parcelas
const rotMeses = Array.from({ length: meses }, (_, i) => `<span>${i === 0 ? 'Mês 1' : i + 1}</span>`).join('');
let inicio = 0;
const fases = d.prazos.fases.map((f, i, arr) => {
  const left = inicio === 0 ? '0' : `calc(${inicio} / ${meses} * 100%)`;
  const ultimo = i === arr.length - 1;
  const width = `calc(${f.meses} / ${meses} * 100%${ultimo ? '' : ' - 4px'})`;
  inicio += f.meses;
  return `          <div class="tl-phase${i % 2 ? ' alt' : ''}" style="left:${left};width:${width}"><b>${f.nome}</b><small>${f.rotulo || `≈ ${f.meses} ${f.meses === 1 ? 'mês' : 'meses'}`}</small></div>`;
}).join('\n');
const marcas = d.parcelas.map((p, i) => {
  const mesmos = d.parcelas.filter((q) => q.mes === p.mes);
  const ordem = d.parcelas.slice(0, i).filter((q) => q.mes === p.mes).length;
  const desloc = mesmos.length > 1 ? (ordem - (mesmos.length - 1) / 2) * 30 : 0;
  let left;
  if (p.mes === 0) left = '0';
  else if (p.mes === meses) left = '100%';
  else left = `calc(${p.mes} / ${meses} * 100%${desloc ? ` ${desloc < 0 ? '-' : '+'} ${Math.abs(desloc)}px` : ''})`;
  return `          <span style="left:${left}">${i + 1}</span>`;
}).join('\n');
const etapas = d.prazos.etapas.map(([t, q, txt]) => `      <li><div><h3>${t}</h3><time>${q}</time><p>${txt}</p></div></li>`).join('\n');

let acumulado = 0;
const parcelas = d.parcelas.map((p, i) => {
  acumulado += p.valor;
  const fr = acumulado / totalParcelas * 100;
  return `      <div class="pay-row"><span class="n">${i + 1}</span><div><h3>${p.marco}</h3><p>${p.detalhe}</p></div><span class="amt">${brl(p.valor)}</span><div class="cum" style="--w:${pct(fr)}%"><i></i>R$ ${curto(acumulado)} · ${Math.round(fr)}%</div></div>`;
}).join('\n');
const nParcelas = PALAVRAS[d.parcelas.length] || String(d.parcelas.length);

const condicoes = d.condicoes.map(([t, txt]) => `      <div><h3>${t}</h3><p>${txt}</p></div>`).join('\n');
const numerosEmpresa = e.numeros.map(([n, r]) => `        <div><b>${n}</b><span>${r}</span></div>`).join('\n');
const whatsappLink = `https://wa.me/${e.whatsappNumero}?text=${encodeURIComponent(`Olá! Tenho interesse no ${d.titulo}.`)}`;

const dadosCliente = {
  versaoFotos: d.versaoFotos || 0,
  // "estudio": true no arquivo do carro quando as fotos de hoje passaram por scripts/estudio-fotos.py
  legendaHoje: d.galeriaHoje.estudio ? 'foto real do veículo, fundo tratado em estúdio' : 'foto real do veículo',
  galeriaHoje: d.galeriaHoje.fotos,
  galeriaReferencia: d.galeriaReferencia ? d.galeriaReferencia.fotos : [],
  pares: d.comparativo ? d.comparativo.pares : [],
};

// ── Página ─────────────────────────────────────────────────────────
const html = `<!doctype html>
<html lang="pt-BR">
<head>
<!-- Gerado por scripts/gerar-proposta.mjs a partir de _propostas/${slug}.json. Não edite este arquivo à mão: edite os dados e gere de novo. -->
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<meta name="description" content="${attr(d.descricao)}">
<meta property="og:type" content="website">
<meta property="og:locale" content="pt_BR">
<meta property="og:site_name" content="${attr(e.nome)}">
<meta property="og:title" content="${attr(`${d.titulo} · ${e.nome}`)}">
<meta property="og:description" content="${attr(d.descricao)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${url}${d.capa.fotoNovo}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/png" href="${e.logo}">
<style>
:root { color-scheme: light; padding-top: env(safe-area-inset-top, 0px); padding-bottom: env(safe-area-inset-bottom, 0px); }
body { margin: 0; }
[hidden] { display: none !important; }
</style>
<title>${d.titulo} · ${e.nome}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500;1,600&family=Outfit:wght@300;400;500;600&display=swap">
<style>
${css}
</style>
</head>
<body>

<!-- ================= CAPA ================= -->
<header class="cover">
  <div class="wrap">
    <div class="cover-bar">
      <a class="brand" href="${site}/" target="_blank" rel="noopener">
        <img src="${e.logo}" alt="${attr(e.nome)}">
        <span><b>${e.marca}</b>${e.complemento}</span>
      </a>
      <span class="cover-tag">${d.tipo}</span>
    </div>
    <div class="cover-grid">
      <div class="cover-copy">
        <h1>${d.capa.nome} <em>${d.capa.ano}</em></h1>
        <p>${d.capa.texto}</p>
      </div>
      <figure class="cover-photo" style="margin:0">
        <div class="compare cover-compare" style="--pos:50%">
          <img class="before" src="${d.capa.fotoHoje}${v}" alt="${attr(d.capa.altHoje)}" fetchpriority="high">
          <img class="after" src="${d.capa.fotoNovo}${v}" alt="${attr(d.capa.altNovo)}">
          <span class="tag l">Hoje</span><span class="tag r">Como vai ficar</span>
          <div class="divider"><span class="knob" aria-hidden="true">↔</span></div>
          <input type="range" id="cover-range" min="0" max="100" value="50" aria-label="Comparar o carro hoje com o resultado da restauração">
        </div>
        <figcaption>Arraste para comparar. À direita, simulação digital do resultado.</figcaption>
      </figure>
    </div>
    <div class="facts">
${destaquesCapa}
    </div>
  </div>
</header>

<main>${raridade}
<!-- ================= O VEÍCULO ================= -->
<section id="veiculo">
  <div class="wrap">
    <div class="head">
      <span class="eyebrow">O veículo</span>
      <h2>Ficha técnica</h2>
    </div>
    <div class="spec-grid">
      <div class="spec">
        <dl>
${ficha}
        </dl>
      </div>
      <div>
        <ul class="highlights">
${destaques}
        </ul>
${d.notaVeiculo ? `        <p class="note">${d.notaVeiculo}</p>` : ''}
      </div>
    </div>
  </div>
</section>

<!-- ================= ESTADO ATUAL ================= -->
<section id="estado-atual">
  <div class="wrap">
    <div class="head">
      <h2>${d.galeriaHoje.titulo}</h2>
      <p class="lead">${d.galeriaHoje.lead}</p>
    </div>
    <div class="gallery" id="g-antes"></div>
  </div>
</section>
${comparativo}${referencia}
<!-- ================= ESCOPO ================= -->
<section id="escopo">
  <div class="wrap">
    <div class="head">
      <span class="eyebrow">O que está incluso</span>
      <h2>${d.escopo.titulo}</h2>
    </div>
    <div class="scope">
${escopo}
    </div>
  </div>
</section>

<!-- ================= INVESTIMENTO ================= -->
<section id="investimento">
  <div class="wrap">
    <div class="head">
      <span class="eyebrow">Investimento</span>
      <h2>Valor do projeto</h2>
    </div>
    <div class="invest">
      <div>
        <div class="ledger">
${custos}
        </div>
        <div class="ledger-total"><span>Total estimado</span><span class="val num">${brl(total)}</span></div>
      </div>
      <aside class="split">
        <h3>Como o valor se divide</h3>
        <div class="split-bar" aria-hidden="true">
${barra}
        </div>
        <div class="split-legend">
${legenda}
        </div>
${d.investimento.nota ? `        <p>${d.investimento.nota}</p>` : ''}
      </aside>
    </div>
  </div>
</section>
${mercado}
<!-- ================= LINHA DO TEMPO ================= -->
<section id="prazos">
  <div class="wrap">
    <div class="head">
      <span class="eyebrow">Prazos</span>
      <h2>${d.prazos.titulo || `Cerca de ${meses} meses da assinatura à entrega`}</h2>
      <p class="lead">Os números nos círculos mostram em que ponto do projeto cada parcela é paga.</p>
    </div>
    <div class="tl-scroll">
      <div class="tl" style="--meses:${meses}">
        <div class="tl-months">${rotMeses}</div>
        <div class="tl-track">
${fases}
        </div>
        <div class="tl-marks" aria-hidden="true">
${marcas}
        </div>
      </div>
    </div>
    <ol class="steps">
${etapas}
    </ol>
  </div>
</section>

<!-- ================= PAGAMENTO ================= -->
<section id="pagamento">
  <div class="wrap">
    <div class="head">
      <span class="eyebrow">Forma de pagamento</span>
      <h2>${nParcelas} parcelas, uma para cada etapa</h2>
      <p class="lead">Você só paga a próxima parcela quando a etapa anterior foi cumprida.</p>
    </div>
    <div class="pay-head" aria-hidden="true"><span></span><span>Marco</span><span>Valor</span><span>Pago até aqui</span></div>
    <div class="pay">
${parcelas}
    </div>
  </div>
</section>

<!-- ================= CONDIÇÕES ================= -->
<section id="condicoes">
  <div class="wrap">
    <div class="head">
      <h2>Condições da proposta</h2>
    </div>
    <div class="terms">
${condicoes}
    </div>
  </div>
</section>

<!-- ================= SOBRE / CONTATO ================= -->
<section class="about" id="contato">
  <div class="wrap about-grid">
    <div class="about-copy">
      <span class="eyebrow">Quem faz</span>
      <h2>${e.nome}</h2>
      <p>${e.sobre}</p>
      <div class="about-stats">
${numerosEmpresa}
      </div>
    </div>
    <div class="contact">
      <h3>Contato</h3>
      <dl>
        <div><dt>WhatsApp</dt><dd>${e.whatsapp}</dd></div>
        <div><dt>E-mail</dt><dd>${e.email}</dd></div>
        <div><dt>Oficina</dt><dd>${e.cidade}</dd></div>
      </dl>
      <a class="btn" href="${whatsappLink}" target="_blank" rel="noopener">Falar no WhatsApp</a>
      <div class="links">
        <a href="${site}/" target="_blank" rel="noopener">${site.replace(/^https?:\/\//, '')}</a>
        <a href="https://instagram.com/${e.instagram}" target="_blank" rel="noopener">@${e.instagram}</a>
      </div>
    </div>
  </div>
</section>
</main>

<footer>
  <div class="wrap">
    <span>${d.titulo} · ${d.tipo}</span>
    <span>${e.nome} · ${e.cidade}</span>
  </div>
</footer>

<div class="lb" id="lb" hidden role="dialog" aria-modal="true" aria-label="Foto ampliada">
  <div class="lb-top"><span id="lb-cap"></span><button type="button" id="lb-close">Fechar ✕</button></div>
  <img id="lb-img" alt="">
  <div class="lb-nav"><button type="button" id="lb-prev">← Anterior</button><button type="button" id="lb-next">Próxima →</button></div>
</div>

<script>
window.DADOS = ${JSON.stringify(dadosCliente)};
${js}
</script>
</body>
</html>
`;

mkdirSync(pasta, { recursive: true });
writeFileSync(join(pasta, 'index.html'), html, 'utf8');
console.log(`Página gerada: proposta/${slug}/index.html`);
console.log(`Total: ${brl(total)} · ${d.parcelas.length} parcelas · ${meses} meses`);
if (avisos.length) {
  console.log('\nConfira antes de publicar:');
  avisos.forEach((a) => console.log(`  - ${a}`));
} else {
  console.log('Conferências: tudo certo (parcelas = total, fotos encontradas, marcos dentro do prazo).');
}
