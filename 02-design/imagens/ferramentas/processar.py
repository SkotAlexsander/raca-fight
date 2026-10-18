# recorta, desfoca marcas, dessatura de leve e grava WebP 1x/2x
import sys, os, json
from PIL import Image, ImageFilter, ImageEnhance, ImageDraw
ORIG = sys.argv[1]; SAIDA = sys.argv[2]
# (arquivo de saída, id da foto, caixa de recorte, tamanho 1x, desfoques)
BORRA = {
  "dHHcDjMcN_I": [(1270, 240, 1600, 370)],          # frase pintada na parede
  "Rm51wg8qk7g": [(840, 1215, 1030, 1335)],         # logo bordado na camisa
  "9aYRNhZ88wc": [(880, 1520, 1030, 1670)],         # logo do short
  "YFeoyqrFsGA": [(480, 960, 700, 1320)],           # nome do fabricante no banco
}
ITENS = [
  # capas por objetivo (16:9) e miniatura quadrada
  ("capas/emagrecer-capa", "dHHcDjMcN_I", (640, 120, 1600, 660), (344, 192)),
  ("capas/emagrecer-mini", "dHHcDjMcN_I", (900, 150, 1500, 750), (48, 48)),
  ("capas/ganhar-massa-capa", "IYLLF511aOY", (0, 60, 1600, 960), (344, 192)),
  ("capas/ganhar-massa-mini", "IYLLF511aOY", (560, 120, 1360, 920), (48, 48)),
  ("capas/condicionamento-capa", "Y3LhJWNjv0M", (0, 0, 1600, 900), (344, 192)),
  ("capas/condicionamento-mini", "Y3LhJWNjv0M", (820, 100, 1570, 850), (48, 48)),
  ("capas/iniciante-capa", "rYmhvp2ZC_c", (0, 560, 1600, 1460), (344, 192)),
  ("capas/iniciante-mini", "rYmhvp2ZC_c", (360, 650, 1460, 1750), (48, 48)),
  ("capas/iniciante-capa-alternativa", "gC3IVdTF2s0", (0, 500, 1600, 1400), (344, 192)),
  ("capas/saude-e-manutencao-capa", "tqTWbykzqNE", (0, 40, 1600, 940), (344, 192)),
  ("capas/saude-e-manutencao-mini", "tqTWbykzqNE", (500, 100, 1250, 850), (48, 48)),
  # convite ao Plus
  ("plus/convite-plus", "qbktVctZKL4", (0, 0, 1600, 900), (344, 192)),
  ("plus/convite-plus-mini", "qbktVctZKL4", (560, 0, 1460, 900), (48, 48)),
  # miniaturas de exercício
  ("exercicios/supino-reto", "Rm51wg8qk7g", (100, 520, 1100, 1520), (48, 48)),
  ("exercicios/supino-inclinado-com-halteres", "fGAgXh6QQEU", (50, 350, 1550, 1850), (48, 48)),
  ("exercicios/crucifixo-na-maquina", "jo6y5JxSxzE", (50, 280, 1550, 1780), (48, 48)),
  ("exercicios/triceps-corda", "9aYRNhZ88wc", (180, 1100, 880, 1800), (48, 48)),
  ("exercicios/agachamento-livre", "YFeoyqrFsGA", (300, 80, 1500, 1280), (48, 48)),
  ("exercicios/remada-curvada", "KaxVB5xh4Nw", (380, 180, 1260, 1060), (48, 48)),
  ("exercicios/esteira", "06EpjZiMz_E", (500, 330, 1500, 1330), (48, 48)),
]
def ajusta(caixa, alvo):
    x0, y0, x1, y1 = caixa; w, h = x1 - x0, y1 - y0; r = alvo[0] / alvo[1]
    if abs(w / h - r) > 0.01:
        if w / h > r: nw = h * r; x0 += (w - nw) / 2; x1 = x0 + nw
        else: nh = w / r; y0 += (h - nh) / 2; y1 = y0 + nh
    return tuple(int(round(v)) for v in (x0, y0, x1, y1))
rel = {}
for nome, fid, caixa, t1 in ITENS:
    im = Image.open(os.path.join(ORIG, fid + ".jpg")).convert("RGB")
    for b in BORRA.get(fid, []):
        reg = im.crop(b).filter(ImageFilter.GaussianBlur(18)); im.paste(reg, b[:2])
    im = ImageEnhance.Color(im).enhance(0.9)
    rec = im.crop(ajusta(caixa, t1))
    for esc in (1, 2):
        tam = (t1[0] * esc, t1[1] * esc)
        out = rec.resize(tam, Image.LANCZOS)
        if tam[0] <= 96: out = out.filter(ImageFilter.UnsharpMask(1, 40, 2))
        caminho = os.path.join(SAIDA, f"{nome}@{esc}x.webp"); os.makedirs(os.path.dirname(caminho), exist_ok=True)
        out.save(caminho, "WEBP", quality=80 if esc == 1 else 74, method=6)
        rel[f"{nome}@{esc}x.webp"] = {"foto": fid, "tamanho": tam, "bytes": os.path.getsize(caminho)}
json.dump(rel, open(os.path.join(sys.argv[3]), "w", encoding="utf-8"), indent=1)
print(sum(v["bytes"] for v in rel.values()), "bytes em", len(rel), "arquivos")
