function bg(h1,h2,s1,s2,l1,l2){return`linear-gradient(135deg,hsl(${h1},${s1}%,${l1}%) 0%,hsl(${h2},${s2}%,${l2}%) 100%)`}

const LOGO = '/images/logo.png';
document.getElementById('navLogo').src = LOGO;

// ── FOTOS DO HERO (topo de cada página) ────────────────────────
// Cada página tem sua própria pasta em images/hero/<pagina>/ com
// fotos que fazem sentido só para ela. Para adicionar mais fotos:
//   1. Coloque o arquivo dentro da pasta da página (qualquer nome).
//   2. Liste o nome do arquivo aqui embaixo, na página certa.
// Com 2+ fotos numa página, elas alternam automaticamente (fade)
// no topo dela. Com 1 foto só, fica estática, sem problema.
const HERO_SETS={
  home:['1.jpg','2.jpg','3.jpg','4.jpg'],
  acervo:['1.jpg','2.jpg','4.jpg'],
  projetos:['1.jpg','2.jpg','3.jpg','4.jpg'],
  sobre:['1.jpg','2.jpg','3.jpg'],
  importacao:['1.jpg','2.jpg','3.jpg'],
  contato:['1.jpg','2.jpg','3.jpg','5.jpg']
};
function heroUrls(pagina){
  return HERO_SETS[pagina].map(f=>`/images/hero/${pagina}/${f}`);
}

// ── ROUTER ──────────────────────────────────────────────────
function getRoute(){
  const parts=location.pathname.split('/').filter(Boolean);
  const[p,id]=parts;
  return{page:p||'home',id:id||null};
}
function navigate(page,id){
  const path=page==='home'?'/':(id?`/${page}/${id}/`:`/${page}/`);
  if(location.pathname===path)return;
  history.pushState(null,'',path);
  router();
}
function router(){
  const{page,id}=getRoute();
  updateNav(page);
  const map={home:renderHome,acervo:id?()=>renderVeiculoDetalhe(id):renderAcervo,
    projetos:id?()=>renderProjetoDetalhe(id):renderProjetos,
    importacao:renderImportacao,sobre:renderSobre,contato:renderContato};
  (map[page]||renderHome)();
  window.scrollTo({top:0,behavior:'instant'});
  initReveal();
  startHeroSlideshow();
}
window.addEventListener('popstate',router);
window.addEventListener('DOMContentLoaded',router);
document.addEventListener('click',e=>{
  const a=e.target.closest('a[href^="/"]');
  if(a&&!a.target){e.preventDefault();history.pushState(null,'',a.getAttribute('href'));router();}
});

function updateNav(p){
  document.querySelectorAll('[data-page]').forEach(a=>a.classList.toggle('active',a.dataset.page===p));
}

// ── UTILS ────────────────────────────────────────────────────
const DEFAULT_BG=bg(210,210,10,10,25,18);
function fotoUrl(item,tipo,arquivo){
  return`/images/${tipo}/${item.id}/${arquivo}`;
}
function smUrl(url){
  const i=url.lastIndexOf('.');
  return url.slice(0,i)+'-sm'+url.slice(i);
}
function escAttr(s){
  return s.replace(/&/g,'&amp;').replace(/"/g,'&quot;');
}
function cardImg(item,tipo){
  const capa=item.fotos&&item.fotos[0];
  if(!capa){
    return`<div class="card-img" style="background:${item.bg||DEFAULT_BG}"><span class="card-img-ghost">${item.ano}</span></div>`;
  }
  const urls=item.fotos.map(f=>fotoUrl(item,tipo,f));
  const hover=urls.length>1?` onmouseenter="cardCycleStart(this)" onmouseleave="cardCycleStop(this)" data-fotos="${escAttr(JSON.stringify(urls))}"`:'';
  return`<div class="card-img" style="background:${item.bg||DEFAULT_BG}"${hover}><img class="card-img-photo" src="${smUrl(urls[0])}" srcset="${smUrl(urls[0])} 800w, ${urls[0]} 1600w" sizes="(max-width:640px) 90vw, (max-width:1200px) 45vw, 320px" alt="${item.nome}" loading="lazy"></div>`;
}

// ── CARD HOVER PHOTO CYCLE ─────────────────────────────────────
const CARD_CYCLES=new WeakMap();
function cardCycleStart(el){
  if(CARD_CYCLES.has(el))return;
  const urls=JSON.parse(el.dataset.fotos||'[]').map(smUrl);
  if(urls.length<2)return;
  const img=el.querySelector('.card-img-photo');
  const original=img.currentSrc||img.src;
  let idx=0;
  const id=setInterval(()=>{
    idx=(idx+1)%urls.length;
    img.src=urls[idx];
  },700);
  CARD_CYCLES.set(el,{id,img,original});
}
function cardCycleStop(el){
  const state=CARD_CYCLES.get(el);
  if(!state)return;
  clearInterval(state.id);
  state.img.src=state.original;
  CARD_CYCLES.delete(el);
}

// ── HERO SLIDESHOW ───────────────────────────────────────────
let CURRENT_HERO_PHOTOS=[];
function heroSrcset(u){
  return`${smUrl(u)} 960w, ${u} 1920w`;
}
function heroSlidesHtml(urls,extraClass){
  CURRENT_HERO_PHOTOS=urls;
  const cls=extraClass?' '+extraClass:'';
  return`<img class="hero-slide${cls} active" id="heroSlideA" src="${smUrl(urls[0])}" srcset="${heroSrcset(urls[0])}" sizes="100vw" alt="">
    <img class="hero-slide${cls}" id="heroSlideB" sizes="100vw" alt="">`;
}
let HERO_INTERVAL=null;
function startHeroSlideshow(){
  clearInterval(HERO_INTERVAL);
  const a=document.getElementById('heroSlideA'),b=document.getElementById('heroSlideB');
  if(!a||!b||CURRENT_HERO_PHOTOS.length<2)return;
  let idx=0,showingA=true;
  const preload=u=>{new Image().src=smUrl(u);};
  preload(CURRENT_HERO_PHOTOS[1]);
  HERO_INTERVAL=setInterval(()=>{
    idx=(idx+1)%CURRENT_HERO_PHOTOS.length;
    const next=showingA?b:a,curr=showingA?a:b;
    next.src=smUrl(CURRENT_HERO_PHOTOS[idx]);
    next.srcset=heroSrcset(CURRENT_HERO_PHOTOS[idx]);
    next.classList.add('active');
    curr.classList.remove('active');
    showingA=!showingA;
    preload(CURRENT_HERO_PHOTOS[(idx+1)%CURRENT_HERO_PHOTOS.length]);
  },3000);
}
function detailHeroHtml(item,tipo,{always='',fallbackOnly=''}={}){
  const capa=item.fotos&&item.fotos[0];
  const full=capa?fotoUrl(item,tipo,capa):'';
  // Capa quadrada/vertical (ex.: fotos de celular) seria cortada no banner 16:7:
  // heroFit mostra a foto inteira sobre um fundo desfocado da própria foto.
  const foto=capa?`<img class="detail-hero-bg" src="${smUrl(full)}" alt="" aria-hidden="true"><img class="detail-hero-img" src="${smUrl(full)}" srcset="${smUrl(full)} 800w, ${full} 1600w" sizes="(min-width:1280px) 1100px, 96vw" alt="${escAttr(item.nome+' '+item.ano)}" onload="window.heroFit&&heroFit(this)">`:'';
  return`<div class="detail-hero reveal" style="background:${item.bg||DEFAULT_BG}">${foto}${always}${capa?'':fallbackOnly}</div>`;
}
function heroFit(img){
  if(img.naturalWidth/img.naturalHeight<1.2)img.parentElement.classList.add('hero-fit');
}
function galleryHtml(item,tipo){
  if(item.fotos&&item.fotos.length){
    CURRENT_GALLERY=item.fotos.map(f=>fotoUrl(item,tipo,f));
    CURRENT_CAPTIONS=item.fotos.map((f,i)=>(item.legendas&&item.legendas[i])||'');
    return CURRENT_GALLERY.map((u,i)=>{
      const leg=CURRENT_CAPTIONS[i];
      const foto=`<div class="gallery-item${leg?'':' reveal'}" onclick="openLightbox(${i})"><img src="${smUrl(u)}" srcset="${smUrl(u)} 800w, ${u} 1600w" sizes="(max-width:640px) 46vw, 260px" alt="${escAttr(leg||`${item.nome} ${item.ano} — foto ${i+1}`)}" loading="lazy" style="width:100%;height:100%;object-fit:cover"></div>`;
      return leg?`<figure class="gallery-fig reveal">${foto}<figcaption>${leg}</figcaption></figure>`:foto;
    }).join('');
  }
  CURRENT_GALLERY=[];
  CURRENT_CAPTIONS=[];
  const h1=parseInt((item.bg||DEFAULT_BG).match(/hsl\((\d+)/)[1]);
  const gals=[bg(h1+15,h1+25,45,35,25,16),bg(h1-10,h1,30,20,18,12),bg(h1+30,h1+10,55,40,28,18)];
  return gals.map(g=>`<div class="gallery-item no-photo reveal" style="background:${g}"></div>`).join('');
}

// ── LIGHTBOX ─────────────────────────────────────────────────
let CURRENT_GALLERY=[];
let CURRENT_CAPTIONS=[];
let lightboxIndex=0;
function openLightbox(index){
  if(!CURRENT_GALLERY.length)return;
  lightboxIndex=index;
  updateLightbox();
  document.getElementById('lightbox').classList.add('open');
  document.body.style.overflow='hidden';
}
function closeLightbox(){
  document.getElementById('lightbox').classList.remove('open');
  document.body.style.overflow='';
}
function lightboxNav(dir){
  lightboxIndex=(lightboxIndex+dir+CURRENT_GALLERY.length)%CURRENT_GALLERY.length;
  updateLightbox();
}
function updateLightbox(){
  document.getElementById('lightboxImg').src=CURRENT_GALLERY[lightboxIndex];
  const leg=CURRENT_CAPTIONS[lightboxIndex]||'';
  document.getElementById('lightboxImg').alt=leg;
  const cap=document.getElementById('lightboxCaption');
  if(cap){cap.textContent=leg;cap.style.display=leg?'block':'none';}
  const multi=CURRENT_GALLERY.length>1;
  document.querySelector('.lightbox-prev').style.display=multi?'flex':'none';
  document.querySelector('.lightbox-next').style.display=multi?'flex':'none';
}
document.addEventListener('keydown',e=>{
  if(!document.getElementById('lightbox').classList.contains('open'))return;
  if(e.key==='Escape')closeLightbox();
  if(e.key==='ArrowLeft')lightboxNav(-1);
  if(e.key==='ArrowRight')lightboxNav(1);
});
function bdg(s){
  const m={disponivel:['badge-disponivel','Disponível'],vendido:['badge-vendido','Vendido'],
    projeto:['badge-projeto','Projeto'],concluido:['badge-concluido','Concluído'],andamento:['badge-andamento','Em andamento']};
  const[c,l]=m[s]||['badge-vendido',s];
  return`<span class="badge ${c}">${l}</span>`;
}

// ── HOME ─────────────────────────────────────────────────────
const SERVICOS=[
  ['Funilaria','Recuperação e moldagem da lataria, com solda e maquinário especializado em parceria com a Backstage Metal Shaping.'],
  ['Pintura','Preparação completa da carroceria e pintura, seguindo as cores e o acabamento do projeto.'],
  ['Tapeçaria','Bancos, forros de porta, carpetes e tapetes costurados na própria oficina.'],
  ['Mecânica','Revisão e manutenção de motor, câmbio, suspensão e freios.'],
  ['Elétrica','Revisão e manutenção de todo o sistema elétrico do veículo.'],
  ['Importação','Garimpo, compra e importação de clássicos e peças dos EUA, com entrega em placa preta.']
];
function renderHome(){
  const featured=VEICULOS.filter(v=>v.destaque).slice(0,4);
  document.getElementById('app').innerHTML=`
<section class="hero">
  <div class="hero-img-wrap" style="background:#333333">
    ${heroSlidesHtml(heroUrls('home'))}
    <div style="position:absolute;inset:0;background:linear-gradient(to bottom,rgba(51,51,51,0.12) 0%,rgba(51,51,51,0.55) 100%)"></div>
  </div>
  <div class="hero-content">
    <span class="s-tag reveal">Restauração &amp; Importação</span>
    <h1 class="hero-h1 reveal">Veículos que<br><em>contam histórias</em><br>únicas</h1>
    <p class="hero-p reveal">Restauração e importação de carros e motos clássicos, com oficina em Gaspar, SC, e projetos para todo o Brasil. Mais de 25 anos de ofício a serviço de cada detalhe.</p>
    <div class="hero-btns reveal">
      <a href="/acervo/" class="btn-p">Ver acervo</a>
      <a href="/projetos/" class="btn-o">Nossos projetos</a>
    </div>
    <div class="stats-row reveal">
      <div class="stat-item"><div class="stat-n">2015</div><div class="stat-l">Fundação</div></div>
      <div class="stat-item"><div class="stat-n">45+</div><div class="stat-l">Restaurados</div></div>
      <div class="stat-item"><div class="stat-n">SC</div><div class="stat-l">Gaspar</div></div>
    </div>
  </div>
</section>

<section class="section" style="background:#FFFFFF">
  <div class="section-inner">
    <div style="max-width:680px;margin-bottom:2rem">
      <span class="s-tag reveal">O que fazemos</span>
      <h2 class="s-title reveal" style="margin-bottom:1.25rem">Restauração completa, <em>de ponta a ponta</em></h2>
      <p class="reveal" style="font-size:15px;color:#707070;line-height:1.9">De pequenos reparos a restaurações completas, cuidamos de carros e motos antigos, clássicos, neoclássicos e exclusivos em uma oficina de 575 m² em Gaspar, Santa Catarina. Atendemos clientes de todo o território nacional.</p>
    </div>
    <div class="services">
      ${SERVICOS.map(([t,d])=>`<div class="service reveal"><h3>${t}</h3><p>${d}</p></div>`).join('')}
    </div>
  </div>
</section>

<section class="section" style="background:#FAF9F6">
  <div class="section-inner">
    <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:2rem;flex-wrap:wrap;gap:1rem">
      <div>
        <span class="s-tag reveal">Recém chegados</span>
        <h2 class="s-title reveal">Últimas <em>oportunidades</em></h2>
      </div>
      <a href="/acervo/" class="btn-o reveal" style="font-size:11px;padding:10px 18px">Ver todos →</a>
    </div>
    <div class="v-grid">${featured.map(vCard).join('')}</div>
  </div>
</section>

<section class="section section-dark">
  <div class="section-inner"><div style="max-width:680px">
    <span class="s-tag reveal">Nossa história</span>
    <h2 class="s-title reveal" style="margin-bottom:1.25rem">Do primeiro Opala a <em>575 m² de oficina</em></h2>
    <p class="reveal" style="font-size:15px;color:rgba(250,249,246,0.6);line-height:1.9;margin-bottom:2rem">Tudo começou em 2013, com um Opala Coupé 1979 restaurado nas horas vagas. Hoje são dois galpões em Gaspar, SC, e quase 50 carros e motos entregues, cada um com a mesma paixão do primeiro.</p>
    <a href="/sobre/" class="btn-gold reveal">Conheça nossa história</a>
  </div></div>
</section>

<section class="section" style="background:#FFFFFF">
  <div class="section-inner" style="text-align:center">
    <span class="s-tag reveal" style="justify-content:center">Ateliê Bomsenhor</span>
    <h2 class="s-title reveal" style="margin-bottom:1.25rem">Acompanhe nossas<br><em>restaurações em curso</em></h2>
    <p class="reveal" style="font-size:14px;color:#707070;max-width:420px;margin:0 auto 2rem">De pequenos reparos a restaurações completas, cada projeto é único. Conheça os bastidores do nosso trabalho.</p>
    <div style="display:flex;gap:1rem;justify-content:center;flex-wrap:wrap" class="reveal">
      <a href="/projetos/" class="btn-p">Ver projetos</a>
      <a href="/importacao/" class="btn-o">Importação</a>
    </div>
  </div>
</section>`;
}

// ── VEHICLE CARD ─────────────────────────────────────────────
function vCard(v){
  const motor=v.motor?v.motor.split(' ').slice(0,3).join(' '):'';
  return`<div class="v-card reveal" onclick="navigate('acervo','${v.id}')">
  <div class="card-img-wrap">${cardImg(v,'acervo')}</div>
  <div class="v-card-body">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:.5rem">
      <div class="v-card-name">${v.nome} <span class="v-card-year">${v.ano}</span></div>
      ${bdg(v.status)}
    </div>
    <div class="v-card-specs">
      ${motor?`<span class="spec-tag">${motor}</span>`:''}
      ${v.cor?`<span class="spec-tag">${v.cor}</span>`:''}
      ${v.procedencia?`<span class="spec-tag">${v.procedencia.split('—')[0].trim()}</span>`:''}
    </div>
    <div class="v-card-footer">
      <div class="v-card-price"><small>${v.status!=='vendido'&&v.preco.startsWith('R$')?'a partir de':''}</small>${v.status==='vendido'?'Vendido':v.preco}</div>
      <span style="font-size:12px;color:#8A6D1E">Ver detalhes →</span>
    </div>
  </div>
</div>`;
}

// ── ACERVO ───────────────────────────────────────────────────
let acFilter='todos';
function renderAcervo(){
  document.getElementById('app').innerHTML=`
<div class="page-hero">
  ${heroSlidesHtml(heroUrls('acervo'),'ph-img')}
  <div class="ph-dim"></div>
  <div class="page-hero-content">
    <span class="s-tag on-dark">Veículos disponíveis</span>
    <h1 class="page-hero-title">Nosso <em>acervo</em></h1>
  </div>
</div>
<section class="section">
  <div class="section-inner">
    <div style="max-width:680px;margin-bottom:2.5rem">
      <span class="s-tag reveal">Carros e motos à venda</span>
      <h2 class="s-title reveal" style="margin-bottom:1.25rem">Clássicos com <em>procedência</em></h2>
      <p class="reveal" style="font-size:15px;color:#707070;line-height:1.9;margin-bottom:1.25rem">Os carros e motos à venda fazem parte do acervo da Bomsenhor. Dependendo do caso, passaram por um processo de restauro na nossa própria oficina, em Gaspar, SC.</p>
      <p class="reveal" style="font-size:15px;color:#707070;line-height:1.9">Todos os veículos têm procedência, são revisados e entregues nas melhores condições do mercado. Somos especialistas no que fazemos, e cada clássico do acervo passa pelo mesmo cuidado dos nossos projetos de restauração.</p>
    </div>
    <div class="filters" id="acFilters">
      ${['todos','carros','motos','vendidos'].map(f=>`<button class="filter-btn${acFilter===f?' active':''}" data-f="${f}">${f==='todos'?'Todos':f==='carros'?'Carros':f==='motos'?'Motos':'Vendidos'}</button>`).join('')}
    </div>
    <div class="v-grid" id="acGrid">${filteredV(acFilter).map(vCard).join('')}</div>
  </div>
</section>`;
  document.querySelectorAll('.filter-btn').forEach(b=>{
    b.addEventListener('click',()=>{
      acFilter=b.dataset.f;
      document.querySelectorAll('.filter-btn').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
      document.getElementById('acGrid').innerHTML=filteredV(acFilter).map(vCard).join('');
      initReveal();
    });
  });
}
function filteredV(f){
  if(f==='carros')return VEICULOS.filter(v=>v.tipo==='carro'&&v.status!=='vendido');
  if(f==='motos')return VEICULOS.filter(v=>v.tipo==='moto'&&v.status!=='vendido');
  if(f==='vendidos')return VEICULOS.filter(v=>v.status==='vendido');
  return VEICULOS.filter(v=>v.status!=='vendido');
}

// ── VEÍCULO DETALHE ──────────────────────────────────────────
// Texto padrão de compra de cada veículo, montado a partir da ficha.
function compraHtml(v){
  const ficha=[['motor',v.motor],['transmissão',v.transmissao],['cor',v.cor],['quilometragem',v.km]]
    .filter(([,x])=>x&&!/não informad/i.test(x)).map(([k,x])=>`${k} ${k==='cor'||k==='transmissão'||(k==='quilometragem'&&!/^\d/.test(x))?x.toLowerCase():x}`).join(', ');
  if(v.status==='vendido'){
    return `<p>Este ${v.nome} ${v.ano} já foi vendido, mas o acervo da Bomsenhor recebe novos clássicos com frequência. Se você procura um modelo parecido, fale conosco pelo WhatsApp: também podemos encontrar o veículo ideal nos EUA pelo nosso <a href="/importacao/">serviço de importação</a>.</p>`;
  }
  return `<p>Este ${v.nome} ${v.ano} faz parte do acervo da Bomsenhor Restaurações, em Gaspar (SC), e é vendido com procedência e revisado${ficha?`. Ficha: ${ficha}`:''}.</p>
<p>Atendemos compradores de todo o Brasil. Fale conosco pelo WhatsApp para tirar dúvidas, pedir mais fotos e vídeos ou agendar uma visita à oficina, de segunda a sexta, das 7h às 17h30.</p>`;
}
function renderVeiculoDetalhe(id){
  const v=VEICULOS.find(x=>x.id===id);
  if(!v){navigate('acervo');return;}
  const vendido=v.status==='vendido';
  document.getElementById('app').innerHTML=`
<section class="section" style="padding-top:calc(var(--nav-h) + 2.5rem)">
  <div class="section-inner">
    <a href="/acervo/" class="detail-back">← Voltar ao acervo</a>
    ${detailHeroHtml(v,'acervo',{always:`<div style="position:absolute;bottom:1.5rem;left:1.5rem">${bdg(v.status)}</div>`,fallbackOnly:`<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center"><span style="font-family:var(--fd);font-size:clamp(3rem,8vw,6rem);color:rgba(255,255,255,0.07);font-weight:700">${v.ano}</span></div>`})}
    <div class="detail-info-grid">
      <div>
        <span class="s-tag">Sobre o veículo</span>
        <h1 style="font-family:var(--fd);font-size:clamp(1.8rem,4vw,2.8rem);font-weight:400;line-height:1.15;margin-bottom:1.5rem">
          ${v.nome} <em style="color:#8A6D1E;font-style:italic">${v.ano}</em>
        </h1>
        <div class="detail-desc">
          ${v.descricao.split('\n').filter(Boolean).map(p=>`<p>${p}</p>`).join('')}
        </div>
        ${v.destaques?.length?`
        <div style="margin-top:2rem">
          <h2 class="detail-h2">${vendido?'Características (histórico)':'Destaques'}</h2>
          <div style="display:flex;flex-wrap:wrap;gap:8px">
            ${v.destaques.map(d=>`<span class="spec-tag" style="font-size:12px;padding:5px 12px">${d}</span>`).join('')}
          </div>
        </div>`:''}
        <div style="margin-top:2rem">
          <h2 class="detail-h2">${vendido?'Procura um veículo parecido?':'Como comprar'}</h2>
          <div class="detail-desc">${compraHtml(v)}</div>
        </div>
      </div>
      <div>
        <div class="detail-specs">
          <div style="margin-bottom:1.25rem;padding-bottom:1.25rem;border-bottom:1px solid #D3D3D3">
            <div style="font-family:var(--fd);font-size:1.6rem;color:#333333">${vendido?'Vendido':v.preco}</div>
            <div style="font-size:11px;color:#707070;margin-top:4px">${vendido?'Status':'Valor de referência'}</div>
          </div>
          <h2 class="detail-h2" style="margin-bottom:.25rem">Ficha técnica</h2>
          ${[['Motor',v.motor],['Transmissão',v.transmissao],['Cor',v.cor],['Quilometragem',v.km],['Procedência',v.procedencia],['Carroceria',v.carroceria]].filter(([,val])=>val).map(([k,val])=>`
          <div class="spec-row"><span class="spec-key">${k}</span><span class="spec-val">${val}</span></div>`).join('')}
          <div style="margin-top:1.5rem;display:flex;flex-direction:column;gap:.75rem">
            ${vendido?`
            <a href="/acervo/" class="btn-gold" style="justify-content:center;width:100%">Ver veículos disponíveis →</a>
            <a href="https://wa.me/5547991742031?text=Olá! Tenho interesse em veículos parecidos com o ${encodeURIComponent(v.nome+' '+v.ano)} (já vendido)" target="_blank" class="btn-o" style="justify-content:center;width:100%">Avise-me sobre veículos parecidos</a>
            `:`
            <a href="https://wa.me/5547991742031?text=Olá! Tenho interesse no ${encodeURIComponent(v.nome+' '+v.ano)}" target="_blank" class="btn-gold" style="justify-content:center;width:100%">Tenho interesse</a>
                        `}
          </div>
        </div>
      </div>
    </div>
    <h3 style="font-family:var(--fd);font-size:1.3rem;font-weight:400;margin-bottom:1.5rem" class="reveal">Galeria de fotos</h3>
    <div class="gallery">
      ${galleryHtml(v,'acervo')}
    </div>
    <p style="font-size:12px;color:#707070;margin-top:1rem;text-align:center">Solicite mais fotos e vídeos via WhatsApp</p>
  </div>
</section>`;
}

// ── PROJETOS ─────────────────────────────────────────────────
function pCard(p){
  return`<div class="v-card reveal" onclick="navigate('projetos','${p.id}')">
  <div class="card-img-wrap">${cardImg(p,'projetos')}</div>
  <div class="v-card-body">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:.5rem">
      <div class="v-card-name">${p.nome} <span class="v-card-year">${p.ano}</span></div>
      ${bdg(p.status)}
    </div>
    <div class="v-card-specs">
      ${p.duracao?`<span class="spec-tag">${p.duracao}</span>`:''}
      ${p.tipo?`<span class="spec-tag">${p.tipo}</span>`:''}
    </div>
    <div class="v-card-footer">
      <div style="font-size:13px;color:#707070">${p.etapas.length} etapas</div>
      <span style="font-size:12px;color:#8A6D1E">Ver projeto →</span>
    </div>
  </div>
</div>`;
}
function renderProjetos(){
  const c=PROJETOS.filter(p=>p.status==='concluido');
  const a=PROJETOS.filter(p=>p.status==='andamento');
  document.getElementById('app').innerHTML=`
<div class="page-hero">
  ${heroSlidesHtml(heroUrls('projetos'),'ph-img')}
  <div class="ph-dim"></div>
  <div class="page-hero-content">
    <span class="s-tag on-dark">Ateliê Bomsenhor</span>
    <h1 class="page-hero-title">Nossos <em>projetos</em></h1>
  </div>
</div>
<section class="section">
  <div class="section-inner">
    <div style="max-width:680px;margin-bottom:3rem">
      <span class="s-tag reveal">Como trabalhamos</span>
      <h2 class="s-title reveal" style="margin-bottom:1.25rem">Do pequeno reparo à <em>restauração completa</em></h2>
      <p class="reveal" style="font-size:15px;color:#707070;line-height:1.9;margin-bottom:1.25rem">Somos especializados em clássicos, mas atendemos praticamente todo tipo de serviço em carros e motos antigos, clássicos, neoclássicos e exclusivos, e, conforme o caso, até em carros mais novos e raros, que poucas oficinas aceitam. Cada projeto é único e avaliado individualmente.</p>
      <p class="reveal" style="font-size:15px;color:#707070;line-height:1.9;margin-bottom:1.25rem">Todo serviço começa com uma avaliação detalhada do veículo. A partir dela, montamos o orçamento de acordo com o projeto do cliente, com prazo e valores estimados, até chegarmos a um acordo e definirmos a data de início.</p>
      <p class="reveal" style="font-size:15px;color:#707070;line-height:1.9">Durante o trabalho, todas as etapas são documentadas e enviadas ao cliente em fotos e vídeos, para que ele acompanhe e comprove o andamento, esteja onde estiver no Brasil.</p>
    </div>
    ${a.length?`<div style="margin-bottom:3rem">
      <span class="s-tag reveal">Em andamento</span>
      <h2 class="s-title reveal" style="margin-bottom:2rem">Projetos <em>em execução</em></h2>
      <div class="v-grid p-grid">${a.map(pCard).join('')}</div>
    </div>`:''}
    <span class="s-tag reveal">Portfólio</span>
    <h2 class="s-title reveal" style="margin-bottom:2rem">Projetos <em>concluídos</em></h2>
    <div class="v-grid p-grid">${c.map(pCard).join('')}</div>
  </div>
</section>
<section class="section" style="background:#FFFFFF">
  <div class="section-inner"><div style="max-width:780px">
    <span class="s-tag reveal">Dúvidas sobre restauração</span>
    <h2 class="s-title reveal" style="margin-bottom:2rem">Perguntas <em>frequentes</em></h2>
    <div class="faq-list">${faqHtml('projetos')}</div>
  </div></div>
</section>`;
}

// ── PROJETO DETALHE ──────────────────────────────────────────
function renderProjetoDetalhe(id){
  const p=PROJETOS.find(x=>x.id===id);
  if(!p){navigate('projetos');return;}
  document.getElementById('app').innerHTML=`
<section class="section" style="padding-top:calc(var(--nav-h) + 2.5rem)">
  <div class="section-inner">
    <a href="/projetos/" class="detail-back">← Voltar aos projetos</a>
    <div style="display:flex;gap:1rem;align-items:center;flex-wrap:wrap;margin-bottom:2rem">
      <h1 style="font-family:var(--fd);font-size:clamp(1.8rem,4vw,2.8rem);font-weight:400;line-height:1.1">
        ${p.nome} <em style="color:#8A6D1E;font-style:italic">${p.ano}</em>
      </h1>
      ${bdg(p.status)}
    </div>
    ${detailHeroHtml(p,'projetos',{fallbackOnly:`<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center"><span style="font-family:var(--fd);font-size:clamp(3rem,8vw,6rem);color:rgba(255,255,255,0.07);font-weight:700">${p.ano}</span></div>`})}
    <div class="detail-info-grid" style="margin-bottom:3rem">
      <div class="detail-desc">
        ${p.descricao.split('\n').filter(Boolean).map(par=>`<p>${par}</p>`).join('')}
        ${p.resultado?`<div style="margin-top:2rem;padding:1.5rem;background:#FEF9EC;border-radius:var(--rl);border:1px solid #D3D3D3">
          <div style="font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#8A6D1E;margin-bottom:.5rem">Resultado</div>
          <p style="color:#707070;font-style:italic">${p.resultado}</p>
        </div>`:''}
      </div>
      <div class="detail-specs">
        ${[['Veículo',`${p.nome} ${p.ano}`],['Status',p.status==='concluido'?'Concluído':'Em andamento'],['Duração',p.duracao],['Serviço',p.tipo]].filter(([,v])=>v).map(([k,v])=>`
        <div class="spec-row"><span class="spec-key">${k}</span><span class="spec-val">${v}</span></div>`).join('')}
        <div style="margin-top:1.5rem">
          <a href="https://wa.me/5547991742031?text=Olá! Quero orçar uma restauração similar ao ${encodeURIComponent(p.nome+' '+p.ano)}" target="_blank" class="btn-gold" style="justify-content:center;width:100%">Orçar projeto similar</a>
        </div>
      </div>
    </div>
    <span class="s-tag reveal">Processo</span>
    <h2 class="s-title reveal" style="margin-bottom:2rem">Etapas ${p.servico?'do':'da'} <em>${p.servico||'restauração'}</em></h2>
    <div class="timeline">
      ${p.etapas.map(e=>`<div class="timeline-item reveal${e.status==='atual'?' timeline-current':e.status==='futura'?' timeline-future':''}">
        <div class="timeline-num">${e.num}</div>
        <div class="timeline-content">
          <div class="timeline-date">${e.data}</div>
          <h4>${e.titulo}</h4><p>${e.desc}</p>
        </div>
      </div>`).join('')}
    </div>
    <div style="margin-top:3rem">
      <h3 class="reveal" style="font-family:var(--fd);font-size:1.3rem;font-weight:400;margin-bottom:1.5rem">Registros fotográficos</h3>
      <div class="gallery">
        ${galleryHtml(p,'projetos')}
      </div>
      <p style="font-size:12px;color:#707070;margin-top:1rem;text-align:center">Solicite o álbum completo via WhatsApp</p>
    </div>
  </div>
</section>`;
}

// ── IMPORTAÇÃO ───────────────────────────────────────────────
// Etapas da importação: aparecem na página e viram schema HowTo.
const ETAPAS_IMPORTACAO=[['01','Consulta e garimpo','Você nos conta o sonho. Buscamos nos EUA os melhores exemplares, pronto ou projeto, com fotos e histórico de cada um.'],
  ['02','Orçamento comparativo','Montamos o custo completo de cada caminho, lado a lado, para você decidir com clareza.'],
  ['03','Negociação e compra','Com o seu aceite, negociamos diretamente com o vendedor nos EUA e fechamos a compra.'],
  ['04','Transporte e documentação','O veículo segue para nosso armazém parceiro na Flórida, onde cuidamos de toda a burocracia pré-embarque.'],
  ['05','Embarque e desembaraço','O carro embarca em Miami e desembarca no porto de Itajaí. Fazemos o desembaraço aduaneiro e a retirada no porto.'],
  ['06','Restauração e entrega','Em Gaspar, SC, nossa equipe executa a restauração combinada, que você acompanha de perto. Entregamos com placa preta.']
  ];
function renderImportacao(){
  document.getElementById('app').innerHTML=`
<div class="page-hero">
  ${heroSlidesHtml(heroUrls('importacao'),'ph-img')}
  <div class="ph-dim"></div>
  <div class="page-hero-content">
    <span class="s-tag on-dark">Serviço especializado</span>
    <h1 class="page-hero-title">Importação <em>de veículos e peças</em></h1>
  </div>
</div>
<section class="section" style="background:#FFFFFF">
  <div class="section-inner">
    <div style="max-width:680px">
      <span class="s-tag reveal">Por que importar com a gente</span>
      <h2 class="s-title reveal" style="margin-bottom:1.25rem">O clássico importado, <em>mais perto da realidade</em></h2>
      <p class="reveal" style="font-size:15px;color:#707070;line-height:1.9;margin-bottom:1.25rem">O grande vilão do sonho do clássico importado é o preço de compra nos EUA. Os impostos incidem sobre o valor do carro somado ao frete, então quanto mais caro ele é lá fora, mais caro chega aqui.</p>
      <p class="reveal" style="font-size:15px;color:#707070;line-height:1.9;margin-bottom:1.25rem">Nossa proposta inverte essa conta: garimpamos um carro de projeto nos EUA e fazemos a restauração aqui no Brasil, onde a mão de obra custa muito menos. Nossa equipe é especializada em encontrar os melhores exemplares, com uma economia que costuma ficar entre 35% e 45% do custo final, em relação a importar o mesmo carro já pronto.</p>
      <p class="reveal" style="font-size:15px;color:#707070;line-height:1.9">Também importamos carros prontos e peças. Mas, se você tiver um pouco de tempo, economiza mais e ainda acompanha de perto cada etapa da restauração. Todos os carros importados saem com placa preta, direto para a sua garagem.</p>
    </div>
  </div>
</section>
<section class="section" style="background:#FAF9F6">
  <div class="section-inner"><div style="max-width:900px">
    <span class="s-tag reveal">Na ponta do lápis</span>
    <h2 class="s-title reveal" style="margin-bottom:1.25rem">Pronto ou projeto: <em>a diferença</em></h2>
    <p class="reveal" style="font-size:15px;color:#707070;line-height:1.9;margin-bottom:2rem">Exemplo: Chevrolet Chevelle Malibu Coupé 1968, V8, um dos clássicos americanos mais procurados.</p>
    <div class="cmp-wrap reveal">
      <table class="cmp-table">
        <thead><tr><th scope="col"><span class="sr-only">Item</span></th><th scope="col"><span class="cmp-tag">Caminho tradicional</span>Comprado pronto nos EUA</th><th scope="col" class="hl"><span class="cmp-tag">Com a Bomsenhor</span>Garimpado como projeto</th></tr></thead>
        <tbody>
        <tr><th scope="row">Preço nos EUA</th><td>US$ 30 mil<small>já restaurado</small></td><td class="hl">US$ 10 mil<small>carro de projeto</small></td></tr>
        <tr><th scope="row">Valor importado</th><td>R$ 450–480 mil</td><td class="hl">R$ 160–180 mil</td></tr>
        <tr><th scope="row">Restauração</th><td>Feita por terceiros, nos EUA</td><td class="hl">Cerca de R$ 100 mil, em Gaspar</td></tr>
        <tr><th scope="row">Procedência</th><td>Difícil de comprovar: pode haver surpresas</td><td class="hl">Conhecida do início ao fim</td></tr>
        <tr><th scope="row">Acompanhamento</th><td>Você recebe o carro pronto</td><td class="hl">Cada etapa em fotos e vídeos</td></tr>
        <tr><th scope="row">Prazo total</th><td>Cerca de 3 meses</td><td class="hl">9 a 15 meses</td></tr>
        </tbody>
        <tfoot><tr><th scope="row">Total</th><td>R$ 450–480 mil</td><td class="hl">R$ 260–280 mil</td></tr></tfoot>
      </table>
    </div>
    <div class="cmp-why reveal">
      <h3>Por que restaurar aqui faz diferença</h3>
      <p>Mesmo restaurado, um carro comprado pronto nos EUA pode esconder surpresas: é muito difícil saber exatamente como o trabalho foi feito e de onde veio cada peça. Quando a restauração completa acontece na Bomsenhor, você acompanha tudo nos mínimos detalhes e sabe de cada parafuso que entrou no projeto.</p>
    </div>
    <div class="imp-save reveal">Economia que pode passar de <em>R$ 200 mil</em></div>
    <p class="imp-note reveal">Valores estimados. Variam conforme câmbio, frete e estado do veículo.</p>
  </div></div>
</section>
<section class="section" style="background:#FFFFFF">
  <div class="section-inner">
    <span class="s-tag reveal">O processo</span>
    <h2 class="s-title reveal" style="margin-bottom:2rem">Nosso <em>método</em></h2>
    <div class="steps steps-3">
      ${ETAPAS_IMPORTACAO.map(([n,t,d])=>`<div class="step reveal"><div class="step-num">${n}</div><h4>${t}</h4><p>${d}</p></div>`).join('')}
    </div>
    <p class="reveal" style="margin-top:1.5rem;font-size:14px;color:#707070">Do fechamento do orçamento ao desembarque no Brasil: <strong style="color:#333333">até 3 meses</strong>.</p>
  </div>
</section>
<section class="section" style="background:#FAF9F6">
  <div class="section-inner"><div style="max-width:680px">
    <span class="s-tag reveal">Caso real</span>
    <h2 class="s-title reveal" style="margin-bottom:1.25rem">Cadillac DeVille Coupé <em>1957</em></h2>
    <p class="reveal" style="font-size:15px;color:#707070;line-height:1.9;margin-bottom:1.25rem">Parado havia mais de seis anos em um galpão, o Cadillac já tinha passado por uma restauração anterior e rodado por alguns lugares antes de chegar à Bomsenhor. Chegou sem motor, sem câmbio, sem vidros, sem interior e, principalmente, sem as peças de acabamento.</p>
    <p class="reveal" style="font-size:15px;color:#707070;line-height:1.9;margin-bottom:1.25rem">O primeiro caminho foi orçar tudo peça por peça, nos EUA e no Brasil, e a conta ficou alta. Então buscamos nos EUA um carro doador completo e apresentamos os dois orçamentos lado a lado ao cliente. Importar o doador saiu cerca de 40% mais barato e ainda poupa tempo.</p>
    <p class="reveal" style="font-size:15px;color:#707070;line-height:1.9">Como a carroceria do cliente já estava no Brasil, a funilaria e a pintura seguem em Gaspar enquanto o doador faz a viagem da Flórida até Itajaí.</p>
    <div class="case-photos">
      <figure class="reveal"><img src="/images/projetos/cadillac-deville-1957/doador-1-sm.jpg" srcset="/images/projetos/cadillac-deville-1957/doador-1-sm.jpg 800w, /images/projetos/cadillac-deville-1957/doador-1.jpg 1600w" sizes="(max-width:639px) 90vw, 340px" alt="Cadillac DeVille 1957 doador, nos EUA" loading="lazy"><figcaption>O doador completo, nos EUA</figcaption></figure>
      <figure class="reveal"><img src="/images/projetos/cadillac-deville-1957/carroceria-1-sm.jpg" srcset="/images/projetos/cadillac-deville-1957/carroceria-1-sm.jpg 800w, /images/projetos/cadillac-deville-1957/carroceria-1.jpg 1600w" sizes="(max-width:639px) 90vw, 340px" alt="Carroceria do Cadillac DeVille 1957 do cliente na oficina em Gaspar" loading="lazy"><figcaption>A carroceria do cliente, em Gaspar</figcaption></figure>
    </div>
    <div class="imp-facts">
      ${[['~40%','de economia em relação à compra das peças avulsas'],
         ['3 meses','no máximo, do orçamento aprovado ao desembarque'],
         ['Em paralelo','funilaria e pintura avançam durante a importação']
        ].map(([n,l])=>`<div class="imp-fact reveal"><div class="imp-fact-n">${n}</div><div class="imp-fact-l">${l}</div></div>`).join('')}
    </div>
    <a href="/projetos/cadillac-deville-1957/" class="btn-o reveal">Acompanhe o projeto →</a>
    <p class="reveal" style="font-size:15px;color:#707070;line-height:1.9;margin-top:2rem">Não tem um projeto? Fazemos o orçamento da importação e da restauração do mesmo carro.</p>
  </div></div>
</section>
<section class="section" style="background:#FFFFFF">
  <div class="section-inner"><div style="max-width:780px">
    <span class="s-tag reveal">Dúvidas sobre importação</span>
    <h2 class="s-title reveal" style="margin-bottom:2rem">Perguntas <em>frequentes</em></h2>
    <div class="faq-list">${faqHtml('importacao')}</div>
  </div></div>
</section>
<section class="section section-dark">
  <div class="section-inner"><div style="max-width:680px">
    <span class="s-tag reveal">Pronto para começar?</span>
    <h2 class="s-title reveal" style="margin-bottom:1.25rem">Encontre seu <em>clássico</em></h2>
    <p class="reveal" style="font-size:15px;color:rgba(250,249,246,0.6);line-height:1.9;margin-bottom:2rem">Conte-nos sobre o veículo dos seus sonhos. Nossa equipe responde em até 24 horas com as primeiras opções encontradas.</p>
    <div style="display:flex;gap:1rem;flex-wrap:wrap" class="reveal">
      <a href="https://wa.me/5547991742031" target="_blank" class="btn-gold">Falar no WhatsApp</a>
      <a href="/contato/" class="btn-o" style="border-color:rgba(255,255,255,0.2);color:rgba(250,249,246,0.7)">Enviar e-mail</a>
    </div>
  </div></div>
</section>`;
}

// ── MARCAS PARCEIRAS ─────────────────────────────────────────
// Para adicionar uma marca parceira:
//   1. Coloque o logo dela (de preferência PNG com fundo transparente)
//      dentro de images/parceiros/, com qualquer nome de arquivo.
//   2. Adicione um item na lista abaixo com o nome da marca e o nome
//      do arquivo do logo. "url" é opcional (site da marca; se
//      preenchido, o logo/nome vira um link que abre em nova aba).
// Se não tiver o arquivo do logo ainda, pode deixar "logo" vazio
// ('') que o site mostra só o nome da marca no lugar da imagem.
// A seção "Marcas parceiras" só aparece no site (página Sobre)
// quando tiver pelo menos um item aqui.
const PARCEIROS=[
  {nome:'Backstage Metal Shaping Tools',logo:'backstage.png',url:'https://backstage.ind.br/'},
  {nome:'H-7 Desengraxante',logo:'h7.png',url:'https://www.h7desengraxante.com.br/'},
  {nome:'WD-40',logo:'wd40.png',url:'https://wd40.com.br/'}
];
function parceirosHtml(){
  return PARCEIROS.map(p=>{
    const nome=escAttr(p.nome);
    const conteudo=p.logo?`<img src="/images/parceiros/${p.logo}" alt="${nome}" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'partner-logo-name',textContent:this.alt}))">`:`<span class="partner-logo-name">${p.nome}</span>`;
    const tag=p.url?'a':'div';
    const linkAttrs=p.url?` href="${escAttr(p.url)}" target="_blank" rel="noopener"`:'';
    return`<${tag} class="partner-logo reveal" title="${nome}"${linkAttrs}>${conteudo}</${tag}>`;
  }).join('');
}

// ── SOBRE ────────────────────────────────────────────────────
function renderSobre(){
  document.getElementById('app').innerHTML=`
<div class="page-hero">
  ${heroSlidesHtml(heroUrls('sobre'),'ph-img')}
  <div class="ph-dim"></div>
  <div class="page-hero-content">
    <span class="s-tag on-dark">Nossa história</span>
    <h1 class="page-hero-title">Uma paixão que<em> virou legado</em></h1>
  </div>
</div>
<section class="section" style="background:#FFFFFF">
  <div class="section-inner">
    <div style="max-width:680px">
      <p class="reveal" style="font-size:16px;color:#707070;line-height:1.9;margin-bottom:1.25rem">A história da Bomsenhor começa muito antes do nome na fachada. Foram 15 anos de ofício na antiga RH Restaurações, onde Vanderlei aprendeu, na prática, o que separa um carro reformado de um carro restaurado.</p>
      <p class="reveal" style="font-size:16px;color:#707070;line-height:1.9;margin-bottom:1.25rem">Em 2013, nas horas vagas, veio o primeiro trabalho por conta própria: a funilaria completa de um Opala Coupé 1979. Dois anos depois, a Bomsenhor nasceu oficialmente, começando pelos painéis de instrumentos e, passo a passo, assumindo o carro inteiro.</p>
      <p class="reveal" style="font-size:16px;color:#707070;line-height:1.9">Hoje são dois galpões em Gaspar, SC, somando 575 m² dedicados à restauração, uma equipe em crescimento e cerca de 37 carros e 12 motos que já passaram pelas nossas mãos.</p>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:#D3D3D3;border-radius:var(--rl);overflow:hidden;margin-top:2rem">
      ${[['2015','Fundação'],['45+','Carros e motos restaurados'],['575<span style="font-size:.45em;margin-left:.1em">m²</span>','De oficina em Gaspar, SC']].map(([n,l])=>`
      <div style="background:#0F1E33;padding:1.75rem 1rem;text-align:center" class="reveal">
        <div style="font-family:var(--fd);font-size:clamp(1.9rem,7vw,2.5rem);font-weight:400;color:#FAF9F6;line-height:1;white-space:nowrap">${n}</div>
        <div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#707070;margin-top:6px">${l}</div>
      </div>`).join('')}
    </div>
  </div>
</section>

<section class="section" style="background:#FAF9F6">
  <div class="section-inner">
    <div class="founders">
      <div class="founders-photo reveal"><img src="/images/equipe/fundadores-sm.jpg" srcset="/images/equipe/fundadores-sm.jpg 800w, /images/equipe/fundadores.jpg 1164w" sizes="(max-width:767px) 90vw, 340px" alt="Vanderlei e Edi Clea Bomsenhor na oficina" loading="lazy"></div>
      <div>
        <span class="s-tag reveal">Quem faz a Bomsenhor</span>
        <h2 class="s-title reveal" style="margin-bottom:1.25rem">Uma empresa <em>de família</em></h2>
        <p class="reveal" style="font-size:16px;color:#707070;line-height:1.9;margin-bottom:1.25rem">Por trás de cada projeto estão Vanderlei e Edi Clea Bomsenhor, um casal que divide a vida e a oficina.</p>
        <p class="reveal" style="font-size:16px;color:#707070;line-height:1.9">Ele traz uma vida inteira no meio automotivo, do pneu à pintura. Ela trouxe da moda o olhar para o detalhe e o acabamento. Juntos, transformaram um trabalho de horas vagas em uma oficina de 575 m² em Gaspar.</p>
      </div>
    </div>
  </div>
</section>
<section class="section" style="background:#FFFFFF">
  <div class="section-inner">
    <div class="story">
      <div>
        <span class="s-tag reveal">Uma vida no meio automotivo</span>
        <h2 class="s-title reveal" style="margin-bottom:1.25rem">Vanderlei <em>Bomsenhor</em></h2>
        <p class="reveal" style="font-size:16px;color:#707070;line-height:1.9;margin-bottom:1.25rem">Vanderlei começou aos 12 anos na borracharia dos pais, trocando pneus e fazendo outros serviços. Quando a família mudou de ramo e abriu uma funilaria e pintura, foi trabalhar com eles e teve ali o primeiro contato com a lataria e a tinta.</p>
        <p class="reveal" style="font-size:16px;color:#707070;line-height:1.9;margin-bottom:1.25rem">Depois de se casar, passou por outras empresas do ramo e, por mais de 10 anos, trabalhou com instalação e manutenção de peças e acessórios automotivos.</p>
        <p class="reveal" style="font-size:16px;color:#707070;line-height:1.9">Na antiga RH Restaurações voltou à funilaria e à pintura, e por mais de 15 anos aprendeu tudo o que o universo da restauração pode ensinar. É essa bagagem, de quem conhece o carro por inteiro, que ele coloca hoje em cada projeto da Bomsenhor.</p>
      </div>
      <div class="story-photos story-photos-tall reveal">
        <img src="/images/equipe/vanderlei-solda-sm.jpg" srcset="/images/equipe/vanderlei-solda-sm.jpg 800w, /images/equipe/vanderlei-solda.jpg 1500w" sizes="(max-width:1023px) 50vw, 25vw" alt="Vanderlei Bomsenhor soldando a lataria de um clássico" loading="lazy">
        <img src="/images/equipe/vanderlei-bancada-sm.jpg" srcset="/images/equipe/vanderlei-bancada-sm.jpg 800w, /images/equipe/vanderlei-bancada.jpg 1600w" sizes="(max-width:1023px) 50vw, 25vw" alt="Vanderlei Bomsenhor moldando uma peça na bancada" loading="lazy">
        <img src="/images/equipe/vanderlei-funilaria-sm.jpg" srcset="/images/equipe/vanderlei-funilaria-sm.jpg 800w, /images/equipe/vanderlei-funilaria.jpg 1500w" sizes="(max-width:1023px) 50vw, 25vw" alt="Vanderlei Bomsenhor acertando a funilaria com martelo" loading="lazy">
      </div>
    </div>
  </div>
</section>
<section class="section" style="background:#FAF9F6">
  <div class="section-inner">
    <div class="story story-reverse">
      <div>
        <span class="s-tag reveal">Da moda à oficina</span>
        <h2 class="s-title reveal" style="margin-bottom:1.25rem">Edi Clea <em>Bomsenhor</em></h2>
        <p class="reveal" style="font-size:16px;color:#707070;line-height:1.9;margin-bottom:1.25rem">Durante anos, Edi Clea trabalhou no mundo da moda, como estilista. Na restauração, começou pelo mais difícil: a funilaria. Aprendeu praticamente sozinha, muitas vezes com a supervisão à distância de Vanderlei, que ainda trabalhava em tempo integral na RH Restaurações. Rebater, moldar e soldar: ela encarou as partes mais pesadas do trabalho.</p>
        <p class="reveal" style="font-size:16px;color:#707070;line-height:1.9;margin-bottom:1.25rem">Em 2021, quando a empresa ganhou o primeiro galpão, tornou-se a primeira funcionária oficial da Bomsenhor.</p>
        <p class="reveal" style="font-size:16px;color:#707070;line-height:1.9">Hoje já passou por praticamente todas as etapas de uma restauração e se especializou em funilaria e tapeçaria. A experiência com vestuário ganhou um novo destino: carpetes, tapetes, bancos e forros de porta costurados por ela.</p>
      </div>
      <div class="story-photos reveal">
        <img src="/images/equipe/edi-clea-sm.jpg" srcset="/images/equipe/edi-clea-sm.jpg 800w, /images/equipe/edi-clea.jpg 1600w" sizes="(max-width:767px) 90vw, 45vw" alt="Edi Clea Bomsenhor na bancada da oficina" loading="lazy">
        <img src="/images/equipe/edi-clea-funilaria-sm.jpg" srcset="/images/equipe/edi-clea-funilaria-sm.jpg 800w, /images/equipe/edi-clea-funilaria.jpg 1600w" sizes="(max-width:767px) 45vw, 22vw" alt="Edi Clea moldando uma chapa de metal" loading="lazy">
        <img src="/images/equipe/edi-clea-molde-sm.jpg" srcset="/images/equipe/edi-clea-molde-sm.jpg 800w, /images/equipe/edi-clea-molde.jpg 1600w" sizes="(max-width:767px) 45vw, 22vw" alt="Edi Clea comparando um molde com a peça original" loading="lazy">
      </div>
    </div>
    <blockquote class="story-quote story-quote-wide reveal">
      <p>“O que mais me encanta na restauração é que todos os dias aprendemos coisas novas. Uma peça que fazemos para um carro dificilmente será replicada em outro. Estamos sempre em constante mudança e evolução.”</p>
      <cite>Edi Clea Bomsenhor</cite>
    </blockquote>
  </div>
</section>
<section style="position:relative;height:420px;overflow:hidden">
  <img src="/images/equipe/equipe-sm.jpg" srcset="/images/equipe/equipe-sm.jpg 960w, /images/equipe/equipe.jpg 1376w" sizes="100vw" alt="Ilustração em aquarela da equipe Bomsenhor Restaurações" loading="lazy" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 30%">
  <div style="position:absolute;inset:0;background:rgba(51,51,51,0.5)"></div>
  <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;text-align:center;padding:2rem;z-index:1">
    <span class="s-tag on-dark reveal" style="justify-content:center">Nossa equipe</span>
    <h2 class="reveal" style="font-family:var(--fd);font-size:clamp(1.8rem,5vw,3rem);font-weight:400;color:#FFFFFF;line-height:1.1;max-width:580px;text-shadow:0 1px 6px rgba(51,51,51,0.5)">Especialistas <em style="color:#F4C542">apaixonados</em> pelo que fazem</h2>
  </div>
</section>
<section class="section" style="background:#FAF9F6">
  <div class="section-inner">
    <span class="s-tag reveal">Linha do tempo</span>
    <h2 class="s-title reveal" style="margin-bottom:2rem">Nossa <em>trajetória</em></h2>
    <div>
      ${[['2013','O primeiro projeto','Um Opala Coupé 1979, do sobrinho de Vanderlei, recebe funilaria completa. Feito nas horas vagas, ainda em paralelo aos 15 anos de trabalho na antiga RH Restaurações, foi o primeiro trabalho por conta própria.'],
         ['2015','Nasce a Bomsenhor','Início formal como empresa, com foco na restauração de painéis de instrumentos e dezenas de trabalhos entregues.'],
         ['2016','O carro por inteiro','A empresa passa a restaurar todos os acabamentos do carro. Em paralelo começam as motos, em projetos pessoais feitos nas horas vagas, muitas vezes em casa.'],
         ['2021','Primeiro galpão','A Bomsenhor ganha seu primeiro galpão. Edi Clea deixa a carreira de estilista no mundo da moda para se dedicar à restauração e se torna a primeira funcionária oficial da empresa.'],
         ['2022','Um espaço maior','Com o aumento da demanda, a empresa troca o primeiro galpão por um maior, de 260 m², com capacidade para mais projetos. A equipe começa a crescer.'],
         ['2024','Capacidade dobrada','Um segundo galpão, de 315 m², soma 575 m² dedicados à restauração. Ano a ano, novos maquinários elevam a qualidade do trabalho, com forte parceria com a Backstage Metal Shaping.'],
         ['2025','Primeiras importações','Começam as importações próprias da empresa, inicialmente focadas em peças.'],
         ['2026','Importação de carros','Chegam os primeiros veículos importados e o primeiro grande projeto unindo importação e restauração: um Cadillac DeVille Coupé 1957.'],
         ['Hoje','Quase 50 histórias','Cerca de 37 carros e 12 motos restaurados, cada um com o mesmo cuidado do primeiro Opala.']
        ].map(([a,t,d])=>`<div class="about-tl-item reveal">
          <div class="about-tl-year">${a}</div>
          <div class="about-tl-body"><h4>${t}</h4><p>${d}</p></div>
        </div>`).join('')}
    </div>
  </div>
</section>
<section class="section section-dark">
  <div class="section-inner">
    <span class="s-tag reveal">O que nos guia</span>
    <h2 class="s-title reveal" style="margin-bottom:2rem">Nossos <em>valores</em></h2>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:1px;background:rgba(255,255,255,0.06);border-radius:var(--rl);overflow:hidden">
      ${[['Autenticidade','Preservamos a identidade original de cada veículo com técnicas e peças fiéis ao período.'],
         ['Transparência','Documentação completa e comunicação aberta em cada etapa do projeto.'],
         ['Excelência','Mais de 25 anos de ofício e investimento contínuo em maquinário e técnica.'],
         ['Paixão','Cada veículo que passa pelo nosso ateliê é tratado como uma obra de arte.']
        ].map(([t,d])=>`<div style="background:rgba(255,255,255,0.04);padding:1.75rem 1.5rem" class="reveal">
          <h4 style="color:#FFFFFF;margin-bottom:6px;font-weight:600">${t}</h4>
          <p style="font-size:13px;color:rgba(250,249,246,0.5);line-height:1.7">${d}</p>
        </div>`).join('')}
    </div>
  </div>
</section>
${PARCEIROS.length?`
<section class="section" style="background:#FFFFFF">
  <div class="section-inner">
    <span class="s-tag reveal">Parcerias de confiança</span>
    <h2 class="s-title reveal" style="margin-bottom:2rem">Marcas <em>parceiras</em></h2>
    <div class="partners-grid">
      ${parceirosHtml()}
    </div>
  </div>
</section>`:''}`;
}

// ── CONTATO ──────────────────────────────────────────────────
// ── PERGUNTAS FREQUENTES ─────────────────────────────────────
// Cada pergunta tem o grupo da página onde aparece ('contato',
// 'projetos' ou 'importacao') e vira dados estruturados (FAQPage)
// só naquela página. Para editar, mude o texto aqui e gere as páginas.
const FAQS=[
  ['contato','Vocês restauram carros e motos?','Sim. A Bomsenhor faz desde pequenos reparos até restaurações completas em carros e motos antigos, clássicos, neoclássicos e exclusivos, com funilaria, pintura, tapeçaria, mecânica, elétrica e acabamentos. Desde 2015 já passaram pela oficina cerca de 37 carros e 12 motos.'],
  ['projetos','Vocês fazem só restaurações completas?','Não. Fazemos desde pequenos reparos até grandes projetos de restauração. Somos especializados em clássicos, mas avaliamos cada caso, inclusive carros mais novos e raros que outras oficinas não aceitam, como uma Mercedes-Benz SLK 200 Cabriolet 2006 que está recebendo reparo na frente e peças importadas da Alemanha e dos EUA.'],
  ['contato','Onde fica a Bomsenhor Restaurações?','Na R. Antônio Weidgenannt, 185, bairro Gasparinho, em Gaspar (SC), CEP 89112-316. São dois galpões que somam 575 m² dedicados à restauração. Visitas ao ateliê são feitas mediante agendamento prévio.'],
  ['contato','Vocês atendem clientes de fora de Santa Catarina?','Sim. A oficina fica em Gaspar (SC), mas fazemos projetos para clientes de todo o território nacional.'],
  ['projetos','Como funciona o orçamento de uma restauração?','O processo começa com uma avaliação detalhada do veículo. Com base nela, montamos o orçamento de acordo com o projeto do cliente, com prazo e valores estimados, até chegarmos a um acordo e definirmos a data de início.'],
  ['projetos','Quanto tempo leva uma restauração?','Depende do estado do veículo e do que será feito. Como referência, o reparo da frente de uma Mercedes-Benz SLK 200 2006, com importação de peças, tem previsão de 3 a 5 meses; já o Cadillac Eldorado Brougham 1958, com revisão mecânica e elétrica, repintura de componentes e acabamentos, levou cerca de um ano.'],
  ['contato','Qual o horário de atendimento?','De segunda a sexta-feira, das 7h às 12h e das 13h às 17h30. Pelo WhatsApp (47) 99174-2031 respondemos em horário comercial.'],
  ['projetos','Posso acompanhar a restauração do meu veículo?','Sim. Todas as etapas são documentadas e enviadas ao cliente em fotos e vídeos, para comprovar o andamento do projeto.'],
  ['importacao','Como funciona a importação de um carro clássico?','Buscamos o carro nos EUA, montamos um orçamento comparativo e, com o seu aceite, negociamos e compramos. O veículo segue para um armazém parceiro na Flórida, embarca em Miami e chega ao porto de Itajaí, onde fazemos o desembaraço e a retirada. Do fechamento do orçamento ao desembarque leva até 3 meses.'],
  ['importacao','Vale mais a pena importar um carro pronto ou um projeto?','Os impostos incidem sobre o valor do carro somado ao frete, então um carro de projeto, mais barato lá fora, chega bem mais barato aqui. Restaurado no Brasil, a economia costuma ficar entre 35% e 45% do custo final em relação a importar o mesmo carro já pronto. Também importamos carros prontos.'],
  ['importacao','Os carros importados saem com placa preta?','Sim. Todos os carros importados pela Bomsenhor saem com placa preta, direto para a garagem do cliente.'],
  ['contato','Vocês vendem veículos clássicos?','Sim. O acervo reúne carros e motos clássicos selecionados e revisados, prontos para rodar. Os veículos disponíveis estão na página Acervo.']
];
function faqHtml(grupo){
  return FAQS.filter(f=>f[0]===grupo).map(([,q,a])=>`<details class="faq-item reveal"><summary><h3>${q}</h3></summary><p>${a}</p></details>`).join('');
}

function renderContato(){
  document.getElementById('app').innerHTML=`
<div class="page-hero">
  ${heroSlidesHtml(heroUrls('contato'),'ph-img')}
  <div class="ph-dim"></div>
  <div class="page-hero-content">
    <span class="s-tag on-dark">Fale conosco</span>
    <h1 class="page-hero-title">Entre em <em>contato</em></h1>
  </div>
</div>
<section class="section">
  <div class="section-inner">
    <div style="max-width:680px;margin-bottom:3rem">
      <p class="reveal" style="font-size:15px;color:#707070;line-height:1.9">Tem interesse em algum veículo do acervo, quer orçar uma restauração ou consultar sobre importação? Nossa equipe está pronta para atendê-lo.</p>
    </div>
    <div class="contact-grid">
      <div class="contact-card reveal">
        <h3>WhatsApp</h3>
        <p style="margin-bottom:.5rem">A forma mais rápida de falar conosco. Respondemos em horário comercial.</p>
        <p style="margin-bottom:1.25rem"><a href="tel:+5547991742031">(47) 99174-2031</a></p>
        <a href="https://wa.me/5547991742031?text=Olá! Vim pelo site e gostaria de tirar algumas dúvidas." target="_blank" class="btn-gold">Iniciar conversa →</a>
      </div>
      <div class="contact-card reveal">
        <h3>E-mail</h3>
        <p style="margin-bottom:.5rem">Para consultas e orçamentos:</p>
        <p><a href="mailto:bomsenhor10@icloud.com">bomsenhor10@icloud.com</a></p>
      </div>
      <div class="contact-card reveal">
        <h3>Localização e horário</h3>
        <p>R. Antônio Weidgenannt, 185 - Gasparinho<br>Gaspar - SC, 89112-316</p>
        <p style="margin-top:.75rem">Segunda a sexta: 7h às 12h e 13h às 17h30</p>
        <p style="margin-top:.75rem;font-size:13px;color:#707070">Visitas ao ateliê mediante agendamento prévio.</p>
        <a href="https://maps.app.goo.gl/JuU8ReXoNPPCCW1s5" target="_blank" rel="noopener" class="btn-o" style="margin-top:1.25rem;width:100%;justify-content:center">Ver no mapa →</a>
      </div>
      <div class="contact-card reveal">
        <h3>Instagram</h3>
        <p style="margin-bottom:1.25rem">Acompanhe projetos em andamento e o acervo de veículos.</p>
        <a href="https://instagram.com/bomsenhorrestauracoes" target="_blank" class="btn-o" style="width:100%;justify-content:center">@bomsenhorrestauracoes →</a>
      </div>
    </div>
  </div>
</section>
<section class="section" style="background:#FAF9F6">
  <div class="section-inner"><div style="max-width:780px">
    <span class="s-tag reveal">Dúvidas</span>
    <h2 class="s-title reveal" style="margin-bottom:2rem">Perguntas <em>frequentes</em></h2>
    <div class="faq-list">${faqHtml('contato')}</div>
    <div class="reveal" style="margin-top:2rem;display:flex;gap:1rem;flex-wrap:wrap;align-items:center">
      <span style="font-size:14px;color:#707070">Já é cliente ou conhece nosso trabalho?</span>
      <a href="https://maps.app.goo.gl/JuU8ReXoNPPCCW1s5" target="_blank" rel="noopener" class="btn-o">Veja e deixe sua avaliação no Google →</a>
    </div>
  </div></div>
</section>`;
}

// ── SCROLL REVEAL ────────────────────────────────────────────
function initReveal(){
  const els=document.querySelectorAll('.reveal:not(.in)');
  if(!('IntersectionObserver' in window)){els.forEach(e=>e.classList.add('in'));return;}
  const obs=new IntersectionObserver(entries=>{
    entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');obs.unobserve(e.target);}});
  },{threshold:0.08});
  els.forEach(e=>obs.observe(e));
}

// ── HAMBURGER ────────────────────────────────────────────────
const HB=document.getElementById('hamburger');
const MM=document.getElementById('mobileMenu');
HB.addEventListener('click',()=>{HB.classList.toggle('open');MM.classList.toggle('open');});
MM.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{HB.classList.remove('open');MM.classList.remove('open');}));
