import sys; sys.stdout.reconfigure(encoding="utf-8")
import json, sys, glob, os, re
from PIL import Image
d = sys.argv[1]
def lin(c):
    c = c / 255; return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
def L(rgb): return 0.2126 * lin(rgb[0]) + 0.7152 * lin(rgb[1]) + 0.0722 * lin(rgb[2])
def cr(a, b): a, b = sorted((a, b), reverse=True); return (a + 0.05) / (b + 0.05)
res = {}
for f in sorted(glob.glob(os.path.join(d, 'itens-*.json'))):
    nome = f.split('itens-')[1][:-5]; itens = json.load(open(f, encoding='utf-8'))
    im = Image.open(os.path.join(d, f'fundo-{nome}.png')).convert('RGB'); px = im.load()
    piores = []; falhas = []
    for it in itens:
        m = re.findall(r'[\d.]+', it['cor']); rgb = tuple(float(x) for x in m[:3]); a = float(m[3]) if len(m) > 3 else 1
        if a < 0.05: continue  # invisível de propósito (check da opção não marcada)
        Lt = L(rgb); pior = 99; worstpx = None
        for x0, y0, x1, y1 in it['rects']:
            for y in range(int(y0) + 1, int(y1) - 1):
                for x in range(int(x0) + 1, int(x1) - 1, 1):
                    if 0 <= x < im.width and 0 <= y < im.height:
                        c = cr(Lt, L(px[x, y]))
                        if c < pior: pior = c; worstpx = px[x, y]
        if pior == 99: continue
        minimo = 3 if it['grande'] or it['tipo'] == 'icone' else 4.5
        reg = (round(pior, 2), minimo, it['tela'], it['texto'], it['cor'], worstpx)
        piores.append(reg)
        if pior < minimo: falhas.append(reg)
    piores.sort()
    res[nome] = {'medidos': len(piores), 'falhas': falhas, 'cinco_piores': piores[:5]}
    print(f'== {nome}: {len(piores)} medidos, {len(falhas)} abaixo do mínimo')
    for r in (falhas or piores[:4]): print('  ', r)
json.dump(res, open(os.path.join(d, 'contraste.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1, default=str)
