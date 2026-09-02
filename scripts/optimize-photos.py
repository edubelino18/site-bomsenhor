# Otimiza as fotos do site: redimensiona para um tamanho máximo
# sensato, recomprime como JPEG e gera a variante "-sm" (usada nas
# telas menores/miniaturas via srcset) de cada foto.
#
# Quando rodar: toda vez que fotos novas forem adicionadas em
# images/acervo/<id>/, images/projetos/<id>/ ou images/hero/<pagina>/,
# antes de gerar as páginas estáticas (scripts/generate-pages.mjs) e
# comitar. Pode rodar de novo a qualquer momento sem problema: fotos
# que já estão dentro do tamanho esperado são ignoradas.
#
# Requisitos: Python 3 + Pillow (pip install pillow).
# Comando: python scripts/optimize-photos.py

import os
from PIL import Image, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMAGES = os.path.join(ROOT, 'images')

HERO_MAX_W = 1920
PHOTO_MAX_W = 1600
HERO_SM_W = 960
PHOTO_SM_W = 800
QUALITY = 80
SM_QUALITY = 78
SKIP_DIRS = {'parceiros'}
# Foto já otimizada (mesma largura-alvo, arquivo pequeno) não precisa
# ser recomprimida nesta passada.
SKIP_IF_UNDER_KB = 500


def is_photo(name):
    n = name.lower()
    return n.endswith('.jpg') or n.endswith('.jpeg')


def process_main(path, max_w):
    size_kb = os.path.getsize(path) / 1024
    with Image.open(path) as im:
        im = ImageOps.exif_transpose(im)
        w, h = im.size
        needs_resize = w > max_w
        if not needs_resize and size_kb <= SKIP_IF_UNDER_KB:
            return False
        if needs_resize:
            new_h = round(h * max_w / w)
            im = im.resize((max_w, new_h), Image.LANCZOS)
        if im.mode in ('RGBA', 'P'):
            im = im.convert('RGB')
        im.save(path, 'JPEG', quality=QUALITY, optimize=True)
    return True


def ensure_sm(path, sm_w):
    base, ext = os.path.splitext(path)
    sm_path = f'{base}-sm{ext}'
    with Image.open(path) as im:
        im = ImageOps.exif_transpose(im)
        w, h = im.size
        if w > sm_w:
            new_h = round(h * sm_w / w)
            im = im.resize((sm_w, new_h), Image.LANCZOS)
        if im.mode in ('RGBA', 'P'):
            im = im.convert('RGB')
        im.save(sm_path, 'JPEG', quality=SM_QUALITY, optimize=True)


def main():
    processed = 0
    sm_made = 0
    for dirpath, dirnames, filenames in os.walk(IMAGES):
        rel = os.path.relpath(dirpath, IMAGES)
        if rel.split(os.sep)[0] in SKIP_DIRS:
            continue
        is_hero = rel.split(os.sep)[0] == 'hero'
        max_w = HERO_MAX_W if is_hero else PHOTO_MAX_W
        sm_w = HERO_SM_W if is_hero else PHOTO_SM_W
        for f in filenames:
            if not is_photo(f) or f.lower().endswith(('-sm.jpg', '-sm.jpeg')):
                continue
            path = os.path.join(dirpath, f)
            if process_main(path, max_w):
                processed += 1
            ensure_sm(path, sm_w)
            sm_made += 1
    print(f'{processed} foto(s) recomprimida(s)/redimensionada(s); {sm_made} variante(s) -sm atualizada(s).')


if __name__ == '__main__':
    main()
