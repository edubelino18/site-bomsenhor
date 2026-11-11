"""Padroniza as fotos de "hoje" de um carro como fotos de estúdio, sem abrir a tela.

Uso:
    python scripts/estudio-fotos.py "<pasta do carro>" [--modelo nano-2k] [--refazer]

Lê   <pasta do carro>/hoje/        (as fotos como o vendedor mandou)
Grava <pasta do carro>/hoje-estudio/ (mesmo nome de arquivo, .jpg) e relatorio.json

É o mesmo processo da tela do Estúdio Veicular (_estudio/), feito sozinho:
  1. classifica todas as fotos numa chamada barata (exterior, detalhe, cabine,
     interior, motor, embaixo; ângulo; problemas como sombra do fotógrafo)
  2. escolhe o cenário pelo tom da pintura (claro/médio -> concreto médio,
     escuro -> concreto claro)
  3. para cada foto monta o pedido com os mesmos textos da tela
     (_estudio/public/prompts.js) e até 2 fotos vizinhas do mesmo carro como
     referência; fotos de baixo do carro recebem só um ajuste local, sem IA
  4. salva o resultado e o relatório (categoria, ângulo, custo, erros)

Fotos já processadas são puladas (use --refazer para gerar de novo).
O servidor do Estúdio (node _estudio/server.mjs) é aberto e fechado sozinho.
As chaves de API ficam em _estudio/.env, que não vai para o GitHub.

Revisão: a IA pode mudar o carro. Compare cada foto com a original antes de
usar (o roteiro está em _propostas/GUIA.md e na skill nova-proposta).
"""

import argparse
import base64
import io
import json
import re
import subprocess
import sys
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from PIL import Image, ImageEnhance, ImageOps

RAIZ = Path(__file__).resolve().parent.parent
ESTUDIO = RAIZ / '_estudio'
SERVIDOR = 'http://127.0.0.1:4173'
EXT = {'.jpg', '.jpeg', '.png', '.webp'}
MAX_SIDE, SMALL_SIDE = 2048, 511
CONCORRENCIA = 4


# ── Servidor do Estúdio ───────────────────────────────────────────────
def chamar(caminho, dados=None, tempo=200):
    req = urllib.request.Request(SERVIDOR + caminho)
    if dados is not None:
        req.data = json.dumps(dados).encode()
        req.add_header('content-type', 'application/json')
    with urllib.request.urlopen(req, timeout=tempo) as r:
        corpo = r.read()
        return json.loads(corpo) if r.headers.get_content_type() == 'application/json' else corpo


def erro_http(e):
    try:
        return json.loads(e.read()).get('error', str(e))
    except Exception:
        return str(e)


def garantir_servidor():
    try:
        return chamar('/api/config', tempo=5), None
    except Exception:
        pass
    proc = subprocess.Popen(['node', 'server.mjs'], cwd=ESTUDIO,
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    for _ in range(30):
        time.sleep(0.5)
        try:
            return chamar('/api/config', tempo=5), proc
        except Exception:
            continue
    proc.kill()
    sys.exit('Não consegui abrir o servidor do Estúdio (node _estudio/server.mjs).')


# ── Imagens ───────────────────────────────────────────────────────────
def b64(im, lado, qualidade=88):
    im = im.copy()
    im.thumbnail((lado, lado), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, 'JPEG', quality=qualidade)
    return base64.b64encode(buf.getvalue()).decode()


def orientacao(w, h):
    r = w / h
    return 'landscape' if r > 1.15 else 'portrait' if r < 0.87 else 'square'


def proporcao(w, h):
    import math
    opcoes = [(1, 1), (2, 3), (3, 2), (3, 4), (4, 3), (4, 5), (5, 4), (9, 16), (16, 9)]
    alvo = math.log(w / h)
    a, b = min(opcoes, key=lambda o: abs(math.log(o[0] / o[1]) - alvo))
    return f'{a}:{b}'


def ajuste_local(im):
    """Mesmo ajuste grátis da tela: níveis, balanço de branco leve e +8% de saturação."""
    amostra = im.copy()
    amostra.thumbnail((600, 600))
    cinza = amostra.convert('L').histogram()
    total = sum(cinza)

    def percentil(p):
        acc = 0
        for v, n in enumerate(cinza):
            acc += n
            if acc >= total * p:
                return v
        return 255
    baixo, alto = min(percentil(0.005), 40), max(percentil(0.995), 200)
    medias = [sum(i * n for i, n in enumerate(c.histogram())) / max(1, sum(c.histogram())) for c in amostra.split()]
    media = sum(medias) / 3
    ganhos = [min(1.08, max(0.92, media / (m or 1))) for m in medias]
    canais = []
    for c, g in zip(im.split(), ganhos):
        canais.append(c.point(lambda v, g=g: max(0, min(255, int((v - baixo) * 255 / (alto - baixo) * g)))))
    return ImageEnhance.Color(Image.merge('RGB', canais)).enhance(1.08)


# ── Processo ──────────────────────────────────────────────────────────
def main():
    sys.stdout.reconfigure(encoding='utf-8')
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('pasta')
    ap.add_argument('--modelo', default='nano-2k', help='nano-2k (padrão), nano-1k, qwen-turbo, seedream-lite...')
    ap.add_argument('--refazer', action='store_true', help='gera de novo mesmo as fotos já processadas')
    ap.add_argument('--cenario', help='nome do cenário (padrão: automático pelo tom da pintura)')
    args = ap.parse_args()

    pasta = Path(args.pasta)
    entrada, saida = pasta / 'hoje', pasta / 'hoje-estudio'
    fotos = sorted(p for p in entrada.glob('*') if p.suffix.lower() in EXT)
    if not fotos:
        sys.exit(f'Nenhuma foto em {entrada}')
    saida.mkdir(exist_ok=True)

    T = json.loads(subprocess.run(['node', str(ESTUDIO / 'textos.mjs')], capture_output=True, check=True).stdout)
    config, proc = garantir_servidor()
    try:
        modelos = {m['key']: m for m in config['models']}
        if args.modelo not in modelos or modelos[args.modelo].get('mode') == 'batch':
            sys.exit(f'Modelo inválido: {args.modelo}. Opções: {", ".join(k for k, m in modelos.items() if m.get("mode") != "batch")}')
        if not modelos[args.modelo]['available']:
            sys.exit(f'Falta {modelos[args.modelo]["missingKey"]} em _estudio/.env')
        if not config['classifier']:
            sys.exit('Falta GEMINI_API_KEY em _estudio/.env (usada para classificar as fotos).')
        pequeno = bool(modelos[args.modelo].get('smallInputs'))

        print(f'{len(fotos)} fotos em {entrada}')
        imgs = [ImageOps.exif_transpose(Image.open(p)).convert('RGB') for p in fotos]
        grandes = [b64(im, MAX_SIDE) for im in imgs]
        pequenas = [b64(im, SMALL_SIDE) for im in imgs]

        print('Classificando...')
        cls = {'photos': [], 'notes': '', 'tone': None, 'cost': 0}
        for i in range(0, len(fotos), 60):
            r = chamar('/api/classify', {'images': [{'mime': 'image/jpeg', 'data': d} for d in pequenas[i:i + 60]]})
            for f in r['photos']:
                f['index'] += i
            cls['photos'] += r['photos']
            cls['notes'] = cls['notes'] or r.get('notes', '')
            cls['tone'] = cls['tone'] or r.get('tone')
            cls['cost'] += r.get('cost') or 0
        cenario = args.cenario or ('Concreto claro' if cls['tone'] == 'dark' else 'Concreto médio')
        print(f'  cenário: {cenario} · características a preservar: {cls["notes"] or "nenhuma listada"}')

        cats, ordem = T['CATEGORIES'], T['ANGLE_ORDER']
        marca, pessoa = re.compile(T['MARK_ISSUE'], re.I), re.compile(T['PERSON_ISSUE'], re.I)
        slots = [{'i': i, 'cat': c['category'], 'angulo': c['angle'], 'avisos': c['issues']}
                 for i, c in enumerate(sorted(cls['photos'], key=lambda c: c['index']))]

        def usa_ia(s):
            return cats[s['cat']]['ai'] or any(marca.search(a) for a in s['avisos'])

        def referencias(s):
            grupo = cats[s['cat']]['group']

            def dist(o):
                a = ordem.index(s['angulo']) if s['angulo'] in ordem else -1
                b = ordem.index(o['angulo']) if o['angulo'] in ordem else -1
                if grupo != 'exterior' or a < 0 or b < 0:
                    return 99
                d = abs(a - b)
                return min(d, len(ordem) - d)
            outros = [o for o in slots if o is not s and cats[o['cat']]['group'] == grupo and cats[o['cat']]['ai']]
            outros.sort(key=lambda o: (dist(o), 0 if o['cat'] == 'exterior' else 1, abs(o['i'] - s['i'])))
            return outros[:2]

        def pedido(s):
            texto = T['PROMPTS'][s['cat']].replace('{ESTUDIO}', T['PRESETS'][cenario]).replace('{NOTAS}', cls['notes'] or 'none listed')
            if cats[s['cat']]['ai'] and any(marca.search(a) for a in s['avisos']):
                texto += '\n\n' + T['REMOVE_MARKS']
            if any(pessoa.search(a) for a in s['avisos']):
                texto += '\n\n' + T['REMOVE_PERSON']
            refs = referencias(s)
            if refs:
                texto += '\n\n' + T['NEIGHBOR_NOTE'].replace('{N}', str(len(refs) + 1))
            dados = pequenas if pequeno else grandes
            w, h = imgs[s['i']].size
            return {'angle': f'foto-{s["i"] + 1}', 'prompt': texto, 'aspect': proporcao(w, h),
                    'orientation': orientacao(w, h), 'model': args.modelo,
                    'images': [{'mime': 'image/jpeg', 'data': dados[k]} for k in [s['i']] + [o['i'] for o in refs]]}

        relatorio = []

        def processar(s):
            foto = fotos[s['i']]
            destino = saida / (foto.stem + '.jpg')
            item = {'arquivo': foto.name, 'resultado': destino.name, 'categoria': cats[s['cat']]['label'],
                    'angulo': s['angulo'], 'avisos': s['avisos'], 'modelo': None, 'custo': 0, 'erro': None}
            if destino.exists() and not args.refazer:
                item['modelo'] = 'já existia'
                return item
            if not usa_ia(s):
                ajuste_local(imgs[s['i']]).save(destino, 'JPEG', quality=92)
                item['modelo'] = 'ajuste local (sem IA)'
                return item
            for tentativa in (1, 2):
                try:
                    r = chamar('/api/generate', pedido(s))
                    Image.open(io.BytesIO(chamar(r['url']))).convert('RGB').save(destino, 'JPEG', quality=92)
                    item.update(modelo=args.modelo, custo=r.get('cost') or 0, erro=None)
                    return item
                except urllib.error.HTTPError as e:
                    item['erro'] = erro_http(e)
                except Exception as e:  # noqa: BLE001
                    item['erro'] = str(e)
                time.sleep(3)
            return item

        print(f'Gerando com {modelos[args.modelo]["label"]}...')
        with ThreadPoolExecutor(CONCORRENCIA) as ex:
            for item in ex.map(processar, slots):
                relatorio.append(item)
                status = f'ERRO: {item["erro"]}' if item['erro'] else item['modelo']
                print(f'  {item["arquivo"]:<28} {item["categoria"]:<22} {status}')

        custo = sum(i['custo'] for i in relatorio) + (cls['cost'] or 0)
        (saida / 'relatorio.json').write_text(json.dumps({
            'cenario': cenario, 'modelo': args.modelo, 'caracteristicas': cls['notes'],
            'custo_usd': round(custo, 4), 'fotos': relatorio}, ensure_ascii=False, indent=2), encoding='utf-8')
        erros = [i for i in relatorio if i['erro']]
        print(f'\nPronto: {len(relatorio) - len(erros)} de {len(relatorio)} fotos em {saida}')
        print(f'Custo estimado: US$ {custo:.3f}')
        if erros:
            print('Com erro (a original continua sendo usada):', ', '.join(i['arquivo'] for i in erros))
    finally:
        if proc:
            proc.terminate()


if __name__ == '__main__':
    main()
