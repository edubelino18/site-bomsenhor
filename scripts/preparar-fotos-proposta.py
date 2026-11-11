"""Prepara as fotos de uma proposta para o site (tamanho, peso e recortes).

Uso:
    python scripts/preparar-fotos-proposta.py <slug> "<pasta com as fotos originais>"

Ex.:
    python scripts/preparar-fotos-proposta.py corvette-1954 "C:/Users/.../Imagens/Corvette 1954"

A pasta de origem (fora do projeto, ex.: OneDrive/Imagens) deve ter:

    hoje/           fotos reais do carro como está hoje (galeria "Como está hoje")
    hoje-estudio/   (opcional) as mesmas fotos padronizadas em estúdio por
                    scripts/estudio-fotos.py; quando existe, substitui a de hoje/
    referencias/    fotos de um carro igual já restaurado (galeria "Como vai ficar")
    comparativo/    pares para a barra de arrastar, sempre no mesmo ângulo:
                      capa-hoje.jpg     + capa-novo.png       (comparativo da capa)
                      <id>-hoje.jpg     + <id>-novo.png       (um par por aba)
                    os <id> são os mesmos de "comparativo.pares" no arquivo do carro

Saída em proposta/<slug>/img/:
    antes/   (até 1200 px)     depois/  (até 1600 px)
    par/<id>-antes.jpg e <id>-depois.jpg  (1200x900, recorte 4:3 idêntico nos dois)
    capa/hoje.jpg e capa/restaurado.jpg   (recorte 5:4 idêntico nos dois)

Ajustes por par (opcional) no arquivo do carro, em "ajustesFotos":
    "lateral":  {"foco": 0.55}      altura do centro do recorte (0 = topo, 1 = base)
    "interior": {"semMarca": true}  corta ~9% da direita/baixo (esconde a estrela do Gemini)

Depois de rodar, o script imprime os nomes das fotos no formato do arquivo do
carro, prontos para colar em "galeriaHoje.fotos" e "galeriaReferencia.fotos"
(é só escrever a legenda de cada uma).
"""

import json
import re
import sys
import unicodedata
from pathlib import Path

from PIL import Image, ImageOps

RAIZ = Path(__file__).resolve().parent.parent
EXT = {'.jpg', '.jpeg', '.png', '.webp'}


def nome_web(p: Path) -> str:
    base = unicodedata.normalize('NFKD', p.stem).encode('ascii', 'ignore').decode()
    base = re.sub(r'[^a-z0-9]+', '-', base.lower()).strip('-') or 'foto'
    return base + '.jpg'


def abrir(p: Path) -> Image.Image:
    return ImageOps.exif_transpose(Image.open(p)).convert('RGB')


def salvar(im: Image.Image, destino: Path, lado_max=None, qualidade=80):
    destino.parent.mkdir(parents=True, exist_ok=True)
    if lado_max:
        im = im.copy()
        im.thumbnail((lado_max, lado_max), Image.LANCZOS)
    im.save(destino, 'JPEG', quality=qualidade, optimize=True, progressive=True)


def recorte(im: Image.Image, proporcao: float, foco=0.5, sem_marca=False) -> Image.Image:
    w, h = im.size
    if sem_marca:  # tira a faixa da direita e de baixo, onde fica a estrela do Gemini
        im = im.crop((0, 0, int(w * 0.91), int(h * 0.91)))
        w, h = im.size
    if w / h > proporcao:
        nw = int(h * proporcao)
        x = (w - nw) // 2
        return im.crop((x, 0, x + nw, h))
    nh = int(w / proporcao)
    y = max(0, min(h - nh, int(foco * h - nh / 2)))
    return im.crop((0, y, w, y + nh))


def achar(pasta: Path, base: str):
    for ext in ('.png', '.jpg', '.jpeg', '.webp'):
        p = pasta / f'{base}{ext}'
        if p.exists():
            return p
    return None


def par(origem: Path, base: str, proporcao: float, tamanho, ajuste: dict, saidas):
    hoje, novo = achar(origem, f'{base}-hoje'), achar(origem, f'{base}-novo')
    if not hoje or not novo:
        print(f'  ! faltando comparativo/{base}-hoje e/ou {base}-novo')
        return
    a = abrir(hoje)
    b = abrir(novo).resize(a.size, Image.LANCZOS)  # mesma escala para alinhar
    foco, sem = ajuste.get('foco', 0.5), ajuste.get('semMarca', False)
    for im, destino in zip((a, b), saidas):
        salvar(recorte(im, proporcao, foco, sem).resize(tamanho, Image.LANCZOS), destino, qualidade=82)
    print(f'  ok  {base}')


def main():
    sys.stdout.reconfigure(encoding='utf-8')
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)
    slug, origem = sys.argv[1], Path(sys.argv[2])
    dados = json.loads((RAIZ / '_propostas' / f'{slug}.json').read_text(encoding='utf-8'))
    ajustes = dados.get('ajustesFotos', {})
    img = RAIZ / 'proposta' / slug / 'img'

    listas = {}
    for sub, destino, lado in (('hoje', 'antes', 1200), ('referencias', 'depois', 1600)):
        fotos = sorted(p for p in (origem / sub).glob('*') if p.suffix.lower() in EXT)
        listas[destino] = []
        estudio = 0
        for p in fotos:
            nome = nome_web(p)
            # Versão padronizada em estúdio (scripts/estudio-fotos.py), quando existe e foi aprovada
            tratada = origem / 'hoje-estudio' / (p.stem + '.jpg')
            if sub == 'hoje' and tratada.exists():
                p, estudio = tratada, estudio + 1
            salvar(abrir(p), img / destino / nome, lado)
            listas[destino].append(nome)
        extra = f' ({estudio} na versão de estúdio)' if sub == 'hoje' and estudio else ''
        print(f'{sub}/: {len(fotos)} fotos -> img/{destino}/{extra}')

    comp = origem / 'comparativo'
    print('comparativo/:')
    par(comp, 'capa', 5 / 4, (1200, 960), ajustes.get('capa', {}),
        (img / 'capa' / 'hoje.jpg', img / 'capa' / 'restaurado.jpg'))
    for pid, _rotulo in dados.get('comparativo', {}).get('pares', []):
        par(comp, pid, 4 / 3, (1200, 900), ajustes.get(pid, {}),
            (img / 'par' / f'{pid}-antes.jpg', img / 'par' / f'{pid}-depois.jpg'))

    print('\nPara colar no arquivo do carro (complete as legendas):')
    for chave, destino in (('galeriaHoje.fotos', 'antes'), ('galeriaReferencia.fotos', 'depois')):
        print(f'\n{chave}:')
        print(',\n'.join(f'  ["{n}", ""]' for n in listas[destino]))
    print('\nLembre de subir "versaoFotos" no arquivo do carro quando trocar fotos já publicadas.')


if __name__ == '__main__':
    main()
