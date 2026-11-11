(function () {
  // DADOS é preenchido pelo gerador (scripts/gerar-proposta.mjs) a partir do arquivo do carro.
  var D = window.DADOS;
  var v = D.versaoFotos ? '?v=' + D.versaoFotos : '';

  var antes = D.galeriaHoje.map(function (x) {
    return { src: 'img/antes/' + x[0] + v, cap: x[1] + ' · foto real do veículo', wide: x[2] };
  });
  var depois = D.galeriaReferencia.map(function (x) {
    return { src: 'img/depois/' + x[0] + v, cap: x[1] + ' · referência ilustrativa', wide: x[2] };
  });

  function build(id, list) {
    var el = document.getElementById(id);
    if (!el) return;
    list.forEach(function (it, i) {
      var b = document.createElement('button');
      b.type = 'button';
      if (it.wide) b.className = 'wide';
      b.setAttribute('aria-label', 'Ampliar: ' + it.cap);
      var img = document.createElement('img');
      img.src = it.src; img.alt = it.cap; img.loading = 'lazy'; img.decoding = 'async';
      b.appendChild(img);
      b.addEventListener('click', function () { open(list, i); });
      el.appendChild(b);
    });
  }
  build('g-antes', antes);
  build('g-depois', depois);

  var lb = document.getElementById('lb'), lbImg = document.getElementById('lb-img'), lbCap = document.getElementById('lb-cap');
  var cur = null, idx = 0, last = null;
  function show() { lbImg.src = cur[idx].src; lbImg.alt = cur[idx].cap; lbCap.textContent = (idx + 1) + ' / ' + cur.length + ' · ' + cur[idx].cap; }
  function open(list, i) { last = document.activeElement; cur = list; idx = i; show(); lb.hidden = false; document.body.style.overflow = 'hidden'; document.getElementById('lb-close').focus(); }
  function close() { lb.hidden = true; document.body.style.overflow = ''; if (last) last.focus(); }
  function step(d) { idx = (idx + d + cur.length) % cur.length; show(); }
  document.getElementById('lb-close').onclick = close;
  document.getElementById('lb-prev').onclick = function () { step(-1); };
  document.getElementById('lb-next').onclick = function () { step(1); };
  lb.addEventListener('click', function (e) { if (e.target === lb || e.target === lbImg) close(); });
  document.addEventListener('keydown', function (e) {
    if (lb.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
  });
  var tx = null;
  lb.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', function (e) { if (tx === null) return; var dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1); tx = null; });

  // Antes x depois (abas)
  var tabs = document.getElementById('cmp-tabs'), cmp = document.getElementById('cmp'), range = document.getElementById('cmp-range');
  if (tabs) {
    D.pares.forEach(function (p, i) {
      var b = document.createElement('button');
      b.type = 'button'; b.textContent = p[1]; b.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
      b.onclick = function () {
        document.getElementById('cmp-a').src = 'img/par/' + p[0] + '-antes.jpg' + v;
        document.getElementById('cmp-d').src = 'img/par/' + p[0] + '-depois.jpg' + v;
        tabs.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        range.value = 50; cmp.style.setProperty('--pos', '50%');
      };
      tabs.appendChild(b);
    });
    range.addEventListener('input', function () { cmp.style.setProperty('--pos', range.value + '%'); });
  }

  // Antes x depois da capa
  var cover = document.querySelector('.cover-compare'), coverRange = document.getElementById('cover-range');
  if (cover) coverRange.addEventListener('input', function () { cover.style.setProperty('--pos', coverRange.value + '%'); });
})();
