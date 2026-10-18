# Fundo da entrada: recorta em tela cheia (440 x 956, a maior tela da moldura), borra marcas,
# aplica o tratamento escuro (escurecer, luz lateral, gradiente) e o claro, e grava WebP 1x/2x,
# nítido e desfocado. uso: python -I entrada_processar.py <originais> <saida>
import sys, os, json
from PIL import Image, ImageFilter, ImageEnhance, ImageDraw, ImageChops

ORIG, SAIDA = sys.argv[1], sys.argv[2]
L1, A1 = 440, 956  # 1x

FOTOS = {
    # nome: (id, centro x no original, caixas para borrar)
    "entrada-fundo": ("9D_rUDe7xvA", 640, [(100, 700, 300, 820)]),            # texto do saco de pancada
    "entrada-fundo-alternativa": ("5Rm-EapWm7M", 790, [(800, 755, 875, 835),  # logo na camiseta
                                                         (370, 1770, 440, 1860),  # logo no tênis esquerdo
                                                         (1205, 1890, 1270, 1995),  # logo na meia/tênis direito
                                                         (1290, 1440, 1460, 1500)]),  # texto no banco
}

def recorte(im, cx):
    w, h = im.size; nw = round(h * L1 / A1)
    x0 = max(0, min(w - nw, cx - nw // 2))
    return im.crop((x0, 0, x0 + nw, h))

def mascara_gradiente(tam, pontos):
    # pontos: lista (posição 0..1 de cima para baixo, alfa 0..255)
    w, h = tam; m = Image.new("L", (1, h)); px = m.load()
    for y in range(h):
        t = y / (h - 1)
        for (p0, a0), (p1, a1) in zip(pontos, pontos[1:]):
            if p0 <= t <= p1:
                k = (t - p0) / (p1 - p0 or 1); px[0, y] = round(a0 + (a1 - a0) * k); break
    return m.resize((w, h))

def luz_lateral(tam, lado="esquerda", forca=1.0):
    # luz que vem de um lado: 1.0 no lado da luz, cai para o outro
    w, h = tam; m = Image.new("L", (w, 1)); px = m.load()
    for x in range(w):
        t = x / (w - 1); t = 1 - t if lado == "esquerda" else t
        px[x, 0] = round(255 * (0.55 + 0.45 * t ** 1.4))
    return m.resize((w, h))

def vinheta(tam):
    w, h = tam; m = Image.new("L", (w, h), 0); d = ImageDraw.Draw(m)
    d.ellipse((-w * 0.35, -h * 0.15, w * 1.35, h * 1.05), fill=255)
    return m.filter(ImageFilter.GaussianBlur(w * 0.18))

def escuro(im):
    im = ImageEnhance.Color(im).enhance(0.78)
    im = ImageEnhance.Contrast(im).enhance(1.10)
    im = ImageEnhance.Brightness(im).enhance(0.62)
    # luz lateral (a esquerda fica como está, a direita escurece) e vinheta
    preto = Image.new("RGB", im.size, (4, 9, 9))
    im = Image.composite(im, preto, luz_lateral(im.size, "esquerda"))
    im = Image.composite(im, preto, vinheta(im.size))
    # leve verde-petróleo nas sombras, da cor do fundo do app (#0B1313)
    tinta = Image.new("RGB", im.size, (11, 30, 29))
    im = ImageChops.screen(im, tinta)
    # gradiente: topo levemente escuro (barra de status) e base fechando no fundo do app
    fundo = Image.new("RGB", im.size, (7, 12, 12))
    m = mascara_gradiente(im.size, [(0, 110), (0.12, 0), (0.42, 0), (0.70, 150), (1, 235)])
    return Image.composite(fundo, im, m)

def claro(im):
    im = ImageEnhance.Color(im).enhance(0.82)
    im = ImageEnhance.Contrast(im).enhance(0.92)
    branco = Image.new("RGB", im.size, (244, 248, 247))
    # véu claro geral (12 %) e base fechando no fundo claro do app (#F4F8F7)
    im = Image.blend(im, branco, 0.12)
    m = mascara_gradiente(im.size, [(0, 70), (0.12, 0), (0.45, 0), (0.72, 140), (1, 225)])
    return Image.composite(branco, im, m)

rel = {}
for nome, (fid, cx, borra) in FOTOS.items():
    im = Image.open(os.path.join(ORIG, fid + ".jpg")).convert("RGB")
    for b in borra:
        reg = im.crop(b).filter(ImageFilter.GaussianBlur(16)); im.paste(reg, b[:2])
    base = recorte(im, cx)
    for tema, f in (("escuro", escuro), ("claro", claro)):
        for esc in (1, 2):
            tam = (L1 * esc, A1 * esc)
            nit = f(base.resize(tam, Image.LANCZOS))
            # desfocado: o mesmo, com desfoque de 28 pt (o vidro da ref. 02); feito sobre a foto tratada
            des = nit.filter(ImageFilter.GaussianBlur(28 * esc))
            # no claro, a desfocada ainda clareia 35 % (o texto dos passos fica direto sobre ela)
            if tema == "claro": des = Image.blend(des, Image.new("RGB", des.size, (244, 248, 247)), 0.35)
            for sufixo, img, q in (("", nit, 78), ("-desfocado", des, 70)):
                cam = os.path.join(SAIDA, f"{nome}-{tema}{sufixo}@{esc}x.webp")
                os.makedirs(SAIDA, exist_ok=True)
                img.save(cam, "WEBP", quality=q if esc == 1 else q - 4, method=6)
                rel[os.path.basename(cam)] = {"foto": fid, "tamanho": tam, "bytes": os.path.getsize(cam)}
json.dump(rel, open(os.path.join(SAIDA, "ferramentas", "relatorio.json"), "w", encoding="utf-8"), indent=1)
print(sum(v["bytes"] for v in rel.values()), "bytes em", len(rel), "arquivos")
