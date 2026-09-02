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
  const foto=capa?`<img src="${smUrl(full)}" srcset="${smUrl(full)} 800w, ${full} 1600w" sizes="(min-width:1280px) 1100px, 96vw" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">`:'';
  return`<div class="detail-hero reveal" style="background:${item.bg||DEFAULT_BG}">${foto}${always}${capa?'':fallbackOnly}</div>`;
}
function galleryHtml(item,tipo){
  if(item.fotos&&item.fotos.length){
    CURRENT_GALLERY=item.fotos.map(f=>fotoUrl(item,tipo,f));
    return CURRENT_GALLERY.map((u,i)=>`<div class="gallery-item reveal" onclick="openLightbox(${i})"><img src="${smUrl(u)}" srcset="${smUrl(u)} 800w, ${u} 1600w" sizes="(max-width:640px) 46vw, 260px" alt="" loading="lazy" style="width:100%;height:100%;object-fit:cover"></div>`).join('');
  }
  CURRENT_GALLERY=[];
  const h1=parseInt((item.bg||DEFAULT_BG).match(/hsl\((\d+)/)[1]);
  const gals=[bg(h1+15,h1+25,45,35,25,16),bg(h1-10,h1,30,20,18,12),bg(h1+30,h1+10,55,40,28,18)];
  return gals.map(g=>`<div class="gallery-item no-photo reveal" style="background:${g}"></div>`).join('');
}

// ── LIGHTBOX ─────────────────────────────────────────────────
let CURRENT_GALLERY=[];
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
    <p class="hero-p reveal">Especializados na restauração e importação de automóveis clássicos em Gaspar, SC. Cada veículo selecionado com rigor, paixão e 15 anos de expertise.</p>
    <div class="hero-btns reveal">
      <a href="/acervo/" class="btn-p">Ver acervo</a>
      <a href="/projetos/" class="btn-o">Nossos projetos</a>
    </div>
    <div class="stats-row reveal">
      <div class="stat-item"><div class="stat-n">15+</div><div class="stat-l">Anos</div></div>
      <div class="stat-item"><div class="stat-n">120+</div><div class="stat-l">Entregues</div></div>
      <div class="stat-item"><div class="stat-n">SC</div><div class="stat-l">Gaspar</div></div>
    </div>
  </div>
</section>

<section class="section" style="background:#FFFFFF">
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
  <div class="section-inner" style="max-width:640px">
    <span class="s-tag reveal">Nossa história</span>
    <h2 class="s-title reveal" style="margin-bottom:1.25rem">15 anos <em>restaurando paixão</em></h2>
    <p class="reveal" style="font-size:15px;color:rgba(250,249,246,0.6);line-height:1.9;margin-bottom:2rem">Nascemos em Gaspar, SC, com uma missão clara: dar nova vida a automóveis que contam histórias. Mais de 120 veículos entregues depois, seguimos com a mesma paixão do primeiro dia.</p>
    <a href="/sobre/" class="btn-gold reveal">Conheça nossa história</a>
  </div>
</section>

<section class="section" style="background:#FAF9F6">
  <div class="section-inner" style="text-align:center">
    <span class="s-tag reveal" style="justify-content:center">Ateliê Bomsenhor</span>
    <h2 class="s-title reveal" style="margin-bottom:1rem">Acompanhe nossas<br><em>restaurações em curso</em></h2>
    <p class="reveal" style="font-size:14px;color:#707070;max-width:420px;margin:0 auto 2rem">Cada projeto é uma jornada de meses de trabalho artesanal. Conheça os bastidores das nossas restaurações.</p>
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
      <div class="v-card-price"><small>${v.preco.startsWith('R$')?'a partir de':''}</small>${v.preco}</div>
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
          <p style="font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#707070;margin-bottom:.75rem">${vendido?'Características (histórico)':'Destaques'}</p>
          <div style="display:flex;flex-wrap:wrap;gap:8px">
            ${v.destaques.map(d=>`<span class="spec-tag" style="font-size:12px;padding:5px 12px">${d}</span>`).join('')}
          </div>
        </div>`:''}
      </div>
      <div>
        <div class="detail-specs">
          <div style="margin-bottom:1.25rem;padding-bottom:1.25rem;border-bottom:1px solid #D3D3D3">
            <div style="font-family:var(--fd);font-size:1.6rem;color:#333333">${v.preco}</div>
            <div style="font-size:11px;color:#707070;margin-top:4px">${vendido?'Status':'Valor de referência'}</div>
          </div>
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
      <span class="spec-tag">${p.duracao}</span>
      ${p.cliente?`<span class="spec-tag">${p.cliente.split('—')[0].trim()}</span>`:''}
    </div>
    <div class="v-card-footer">
      <div style="font-size:13px;color:#707070">${p.etapas.length} etapas</div>
      <span style="font-size:12px;color:#8A6D1E">Ver restauração →</span>
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
    ${a.length?`<div style="margin-bottom:3rem">
      <span class="s-tag reveal">Em andamento</span>
      <h2 class="s-title reveal" style="margin-bottom:2rem">Projetos <em>em execução</em></h2>
      <div class="v-grid">${a.map(pCard).join('')}</div>
    </div>`:''}
    <span class="s-tag reveal">Portfólio</span>
    <h2 class="s-title reveal" style="margin-bottom:2rem">Projetos <em>concluídos</em></h2>
    <div class="v-grid">${c.map(pCard).join('')}</div>
  </div>
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
        ${[['Veículo',`${p.nome} ${p.ano}`],['Status',p.status==='concluido'?'Concluído':'Em andamento'],['Duração',p.duracao],['Cliente',p.cliente]].filter(([,v])=>v).map(([k,v])=>`
        <div class="spec-row"><span class="spec-key">${k}</span><span class="spec-val">${v}</span></div>`).join('')}
        <div style="margin-top:1.5rem">
          <a href="https://wa.me/5547991742031?text=Olá! Quero orçar uma restauração similar ao ${encodeURIComponent(p.nome+' '+p.ano)}" target="_blank" class="btn-gold" style="justify-content:center;width:100%">Orçar projeto similar</a>
        </div>
      </div>
    </div>
    <span class="s-tag reveal">Processo</span>
    <h2 class="s-title reveal" style="margin-bottom:2rem">Etapas da <em>restauração</em></h2>
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
    <div style="max-width:680px;margin-bottom:3rem">
      <span class="s-tag reveal">Como funciona</span>
      <h2 class="s-title reveal" style="margin-bottom:1.5rem">Do sonho à <em>garagem</em></h2>
      <p class="reveal" style="font-size:15px;color:#707070;line-height:1.9;margin-bottom:1rem">Importamos veículos clássicos ou peças específicas diretamente dos EUA, Europa e Japão. Cuidamos de cada detalhe: pesquisa, negociação, transporte marítimo, desembaraço aduaneiro e regularização no Brasil.</p>
      <p class="reveal" style="font-size:15px;color:#707070;line-height:1.9">Realizamos projetos personalizados unindo importação + restauração, muitas vezes reduzindo o tempo e o preço final do projeto em até 50%.</p>
<p class="reveal" style="font-size:15px;color:#707070;line-height:1.9;margin-bottom:1rem"></p>
      <p class="reveal" style="font-size:15px;color:#707070;line-height:1.9">
Você nos diz o que precisa e nós cuidamos de todo o resto — com transparência total em cada etapa.</p>
    </div>
    <span class="s-tag reveal">O processo</span>
    <h2 class="s-title reveal" style="margin-bottom:2rem">Nosso <em>método</em></h2>
    <div class="steps">
      ${[['01','Consulta inicial','Você nos conta qual projeto deseja. Discutimos especificações, condição, orçamento e expectativas.'],
         ['02','Pesquisa e avaliação','Nossa rede internacional localiza o exemplar ideal. Você recebe fotos, histórico e todos os detalhes antes de qualquer decisão.'],
         ['03','Aquisição, transporte e entrega','Cuidamos da compra, seguro de transporte e logística marítima do ponto de origem até o porto brasileiro com desembaraço alfandegário, homologação e documentação completa.'],
         ['04','Restauração e entrega','Nesta etapa nossa equipe no Brasil fará todo o processo de restauração de acordo com o projeto estipulado, entregando ao final o seu carro emplacado, com placa preta e totalmente restaurado.']
        ].map(([n,t,d])=>`<div class="step reveal"><div class="step-num">${n}</div><h4>${t}</h4><p>${d}</p></div>`).join('')}
    </div>
  </div>
</section>
<section class="section section-dark">
  <div class="section-inner" style="max-width:640px">
    <span class="s-tag reveal">Pronto para começar?</span>
    <h2 class="s-title reveal" style="margin-bottom:1.25rem">Encontre seu <em>clássico</em></h2>
    <p class="reveal" style="font-size:15px;color:rgba(250,249,246,0.6);line-height:1.9;margin-bottom:2rem">Conte-nos sobre o veículo dos seus sonhos. Nossa equipe responde em até 24 horas com as primeiras opções encontradas.</p>
    <div style="display:flex;gap:1rem;flex-wrap:wrap" class="reveal">
      <a href="https://wa.me/5547991742031" target="_blank" class="btn-gold">Falar no WhatsApp</a>
      <a href="/contato/" class="btn-o" style="border-color:rgba(255,255,255,0.2);color:rgba(250,249,246,0.7)">Enviar e-mail</a>
    </div>
  </div>
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
      <p class="reveal" style="font-size:16px;color:#707070;line-height:1.9;margin-bottom:1.25rem">A Bomsenhor Restaurações nasceu em 2009 da paixão de seu fundador por automóveis clássicos. O que começou como um projeto de restauração em uma pequena oficina em Gaspar, SC, cresceu para se tornar uma das referências em restauração e importação de clássicos no Sul do Brasil.</p>
      <p class="reveal" style="font-size:16px;color:#707070;line-height:1.9">Hoje, com mais de 15 anos de experiência, somos reconhecidos pela excelência técnica, pelo cuidado artesanal com cada projeto e pela dedicação em preservar a história automotiva que cada veículo carrega.</p>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:#D3D3D3;border-radius:var(--rl);overflow:hidden;margin-top:2rem">
      ${[['15+','Anos de experiência'],['120+','Veículos restaurados'],['Gaspar','Santa Catarina']].map(([n,l])=>`
      <div style="background:#0F1E33;padding:1.75rem 1rem;text-align:center" class="reveal">
        <div style="font-family:var(--fd);font-size:2.5rem;font-weight:400;color:#FAF9F6;line-height:1">${n}</div>
        <div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#707070;margin-top:6px">${l}</div>
      </div>`).join('')}
    </div>
  </div>
</section>

<section style="position:relative;height:420px;overflow:hidden">
  <img src="${smUrl(heroUrls('sobre')[0])}" srcset="${heroSrcset(heroUrls('sobre')[0])}" sizes="100vw" alt="Equipe Bomsenhor" loading="lazy" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 30%">
  <div style="position:absolute;inset:0;background:rgba(51,51,51,0.5)"></div>
  <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;text-align:center;padding:2rem;z-index:1">
    <span class="s-tag on-dark reveal" style="justify-content:center">Nossa equipe</span>
    <h2 class="reveal" style="font-family:var(--fd);font-size:clamp(1.8rem,5vw,3rem);font-weight:400;color:#FFFFFF;line-height:1.1;max-width:580px;text-shadow:0 1px 6px rgba(51,51,51,0.5)">Especialistas <em style="color:#F4C542">apaixonados</em> pelo que fazem</h2>
  </div>
</section>
<section class="section" style="background:#FAF9F6">
  <div class="section-inner">
    <span class="s-tag reveal">Linha do tempo</span>
    <h2 class="s-title reveal" style="margin-bottom:2.5rem">Nossa <em>trajetória</em></h2>
    <div>
      ${[['2009','Fundação','Início das operações em Gaspar, SC, com foco em restauração de clássicos nacionais.'],
         ['2012','Primeira importação','Chegada dos primeiros veículos importados dos EUA, abrindo nova frente de negócio.'],
         ['2015','Novo ateliê','Ampliação do espaço com inauguração do novo ateliê de restauração.'],
         ['2019','Expansão da equipe','Contratação de especialistas em mecânica, pintura e funilaria.'],
         ['2023','100º veículo','Marco histórico: centésimo veículo restaurado e entregue com excelência.'],
         ['2025','Hoje','Referência regional em restauração e importação de clássicos no Sul do Brasil.']
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
         ['Excelência','Equipe especializada com décadas de experiência em mecânica e restauração.'],
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
        <p style="margin-bottom:1.25rem">A forma mais rápida de falar conosco. Respondemos em horário comercial.</p>
        <a href="https://wa.me/5547991742031?text=Olá! Vim pelo site e gostaria de tirar algumas dúvidas." target="_blank" class="btn-gold">Iniciar conversa →</a>
      </div>
      <div class="contact-card reveal">
        <h3>E-mail</h3>
        <p style="margin-bottom:.5rem">Para consultas e orçamentos:</p>
        <p><a href="mailto:bomsenhor10@icloud.com">bomsenhor10@icloud.com</a></p>
      </div>
      <div class="contact-card reveal">
        <h3>Localização</h3>
        <p>Gaspar, Santa Catarina<br>Brasil</p>
        <p style="margin-top:1rem;font-size:13px;color:#707070">Visitas ao ateliê mediante agendamento prévio.</p>
      </div>
      <div class="contact-card reveal">
        <h3>Instagram</h3>
        <p style="margin-bottom:1.25rem">Acompanhe projetos em andamento e o acervo de veículos.</p>
        <a href="https://instagram.com/bomsenhorrestauracoes" target="_blank" class="btn-o" style="width:100%;justify-content:center">@bomsenhorrestauracoes →</a>
      </div>
    </div>
  </div>
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
