# Agente P (P09): recorta, borra marca, aplica o tratamento escuro (escurecer, luz lateral, vinheta) e grava WebP 1x/2x
# uso: python -I processar_telas.py <pasta-orig> <pasta-saida> <relatorio.json>
import sys, os, json
from PIL import Image, ImageFilter, ImageEnhance, ImageChops
ORIG, SAIDA, REL = sys.argv[1:4]
BORRA = {"5Rm-EapWm7M": [(1180, 1100, 1350, 1250)]}  # logo no peito da camisa
# nome, id, caixa (x0,y0,x1,y1) na foto de 2400 px, tamanho 1x, lado da luz ('esq'|'dir'), escurecer (0..1)
ITENS = [
  ("modo-treino-crucifixo-no-cabo", "Ivu2SWRyFxQ", (536, 260, 1784, 2960), (390, 844), "dir", 0.80),
  ("inicio-treino-hoje",            "5Rm-EapWm7M", (0, 520, 2400, 2120),   (360, 240), "esq", 0.78),
  ("evolucao-agachamento",          "IYLLF511aOY", (220, 0, 2300, 1600),   (390, 300), "esq", 0.60),
  ("painel-dono-sala",              "-F0Wi89XZHI", (0, 120, 1640, 1297),   (390, 280), "dir", 0.78),
]
def ajusta(c, alvo):
    x0, y0, x1, y1 = c; w, h = x1-x0, y1-y0; r = alvo[0]/alvo[1]
    if w/h > r: nw = h*r; x0 += (w-nw)/2; x1 = x0+nw
    else: nh = w/r; y0 += (h-nh)/2; y1 = y0+nh
    return tuple(int(round(v)) for v in (x0, y0, x1, y1))
def mascara_luz(tam, lado):
    # luz lateral: 1.0 no lado da luz, cai para 0.55 do outro; vinheta embaixo e em cima
    w, h = tam; m = Image.new("L", (w, h))
    px = m.load()
    for y in range(h):
        fy = y / (h-1)
        v_y = 1 - 0.35*max(0, fy-0.55)/0.45 - 0.15*max(0, 0.12-fy)/0.12
        for x in range(w):
            fx = x/(w-1); fx = fx if lado == "dir" else 1-fx
            v = (0.55 + 0.45*fx**1.6) * v_y
            px[x, y] = int(255*max(0, min(1, v)))
    return m
rel = {}
for nome, fid, caixa, t1, lado, esc in ITENS:
    im = Image.open(os.path.join(ORIG, fid + ".jpg")).convert("RGB")
    for b in BORRA.get(fid, []):
        im.paste(im.crop(b).filter(ImageFilter.GaussianBlur(14)), b[:2])
    im = im.crop(ajusta(caixa, t1))
    for k in (1, 2):
        tam = (t1[0]*k, t1[1]*k)
        out = im.resize(tam, Image.LANCZOS)
        out = ImageEnhance.Color(out).enhance(0.82)
        out = ImageEnhance.Contrast(out).enhance(1.06)
        out = ImageEnhance.Brightness(out).enhance(esc)
        luz = mascara_luz((tam[0]//4, tam[1]//4), lado).resize(tam, Image.BICUBIC).convert("RGB")
        out = ImageChops.multiply(out, luz)
        c = os.path.join(SAIDA, f"{nome}@{k}x.webp"); os.makedirs(SAIDA, exist_ok=True)
        out.save(c, "WEBP", quality=78 if k == 1 else 70, method=6)
        rel[f"{nome}@{k}x.webp"] = {"foto": fid, "tamanho": tam, "bytes": os.path.getsize(c)}
json.dump(rel, open(REL, "w", encoding="utf-8"), indent=1)
print(sum(v["bytes"] for v in rel.values()), "bytes em", len(rel))
