# -*- coding: utf-8 -*-
"""Confere os PNG do app (app/recursos/) depois do exportar-png.mjs: tamanho, canal alfa,
cor do que é desenhado e se o símbolo cabe na área segura. Uso: python -I verificar-png.py"""
import math, os, sys
sys.stdout.reconfigure(encoding='utf-8')
from PIL import Image

AQUI = os.path.dirname(os.path.abspath(__file__))
REC = os.path.abspath(os.path.join(AQUI, '..', '..', '..', '..', 'app', 'recursos'))

# [png, lado, alfa?, cor do desenho, raio máximo permitido (fração do lado) ou None]
# Adaptativo: o círculo seguro do Android tem 66 de 108 dp → raio 0,3056 do lado.
# Abertura: o Android 12+ mostra o círculo central de 2/3 da arte → raio 1/3 do lado.
REGRAS = [
    ('icone.png', 1024, False, None, None),
    ('icone-adaptativo.png', 1024, True, (255, 255, 255), 66 / 108 / 2),
    ('icone-notificacao.png', 96, True, (255, 255, 255), None),
    ('abertura-simbolo-claro.png', 1024, True, (255, 255, 255), 1 / 3),
    ('abertura-simbolo-escuro.png', 1024, True, (0x39, 0xF0, 0xCD), 1 / 3),
]

falhas = 0
for nome, lado, alfa, cor, raio in REGRAS:
    caminho = os.path.join(REC, nome)
    im = Image.open(caminho)
    probs = []
    if im.size != (lado, lado):
        probs.append('tamanho %s, esperado %d' % (im.size, lado))
    tem_alfa = im.mode in ('RGBA', 'LA') or 'transparency' in im.info
    if tem_alfa != alfa:
        probs.append('canal alfa: %s, esperado %s' % (tem_alfa, alfa))
    info = ''
    if alfa:
        rgba = im.convert('RGBA')
        px = rgba.load()
        c = lado / 2
        rmax, opacos, cores_erradas, cantos = 0, 0, 0, []
        for y in range(lado):
            for x in range(lado):
                r, g, b, a = px[x, y]
                if a > 8:
                    opacos += 1
                    rmax = max(rmax, math.hypot(x + 0.5 - c, y + 0.5 - c))
                    if a > 250 and cor and max(abs(r - cor[0]), abs(g - cor[1]), abs(b - cor[2])) > 2:
                        cores_erradas += 1
        transp = rgba.getchannel('A').histogram()[0]
        bbox = rgba.getchannel('A').getbbox()
        info = 'desenho %s · %.1f %% transparente · raio máx. %.0f px (%.3f do lado)' % (
            'x'.join(str(bbox[i + 2] - bbox[i]) for i in (0, 1)) if bbox else '-', 100 * transp / lado / lado, rmax, rmax / lado)
        if cores_erradas:
            probs.append('%d pixels opacos fora da cor %s' % (cores_erradas, '#%02X%02X%02X' % cor))
        if raio and rmax > raio * lado:
            probs.append('passa da área segura: raio %.0f > %.0f' % (rmax, raio * lado))
        if transp == 0:
            probs.append('nenhum pixel transparente')
    else:
        rgb = im.convert('RGB')
        info = 'opaco, canto %s' % ('#%02X%02X%02X' % rgb.getpixel((0, 0)))
    tam = os.path.getsize(caminho)
    print('%-30s %4dx%-4d %-5s %6.1f KB  %s%s' % (nome, im.size[0], im.size[1], im.mode, tam / 1024, info, ('  ← ' + '; '.join(probs)) if probs else '  ok'))
    falhas += bool(probs)
sys.exit(1 if falhas else 0)
