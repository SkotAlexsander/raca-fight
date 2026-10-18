# -*- coding: utf-8 -*-
"""
Logo PROVISÓRIO da Raça Fight Gravataí (agente AL, P12, 15/10/2026).

Reconstrução em vetor do logo que aparece nas fotos do Instagram (raca-37, rodapé da grade de
horários; raca-01, letreiro na parede; a foto de perfil de 100 px). O original em alta resolução
ainda não chegou: TUDO o que sai daqui é PROVISÓRIO e deve ser trocado pelo arquivo da academia.

- "RAÇA": desenho geométrico à mão (as letras largas do letreiro: R aberto em cima à esquerda,
  A em triângulo com o miolo triangular, Ç com a cedilha caindo dentro da faixa).
- "FIGHT", "CENTRO DE TREINAMENTO" e "GRAVATAÍ": Archivo (SIL OFL 1.1) na largura 125 e peso 800,
  convertida em contorno (nenhum SVG daqui depende de fonte instalada).
- A faixa: o contorno com a ponta cortada em diagonal à esquerda e, na direita, a ponta vermelha
  #C42024 com o fecho da faixa.

Uso:  python -I gerar_logo.py      (grava os SVG na pasta de cima)
"""
import os, sys
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

AQUI = os.path.dirname(os.path.abspath(__file__))
SAIDA = os.path.dirname(AQUI)
VERMELHO, PRETO, BRANCO = '#C42024', '#1C1C1C', '#FFFFFF'

fonte = instantiateVariableFont(TTFont(os.path.join(AQUI, 'Archivo-variavel.ttf')), {'wght': 800, 'wdth': 125})
glifos = fonte.getGlyphSet()
cmap = fonte.getBestCmap()
UPM = fonte['head'].unitsPerEm
CAP = fonte['OS/2'].sCapHeight


def n(v):
    s = ('%.2f' % v).rstrip('0').rstrip('.')
    return '0' if s == '-0' else s


def largura_texto(txt, altura_maiuscula, espaco):
    esc = altura_maiuscula / CAP
    w = 0
    for i, ch in enumerate(txt):
        w += glifos[cmap[ord(ch)]].width * esc + (espaco if i < len(txt) - 1 else 0)
    return w


def texto(txt, x, linha_base, altura_maiuscula, espaco=0.0, alinhar='esquerda', largura=None):
    """Texto em contorno. altura_maiuscula em unidades do logo; espaco = espaço extra entre letras.
    largura: se dada, o espaço entre letras é calculado para o texto ocupar exatamente essa largura."""
    if largura is not None and len(txt) > 1:
        sem = largura_texto(txt, altura_maiuscula, 0)
        espaco = (largura - sem) / (len(txt) - 1)
    w = largura_texto(txt, altura_maiuscula, espaco)
    if alinhar == 'centro':
        x -= w / 2
    elif alinhar == 'direita':
        x -= w
    esc = altura_maiuscula / CAP
    d = []
    for ch in txt:
        g = glifos[cmap[ord(ch)]]
        pen = SVGPathPen(glifos, n)
        g.draw(TransformPen(pen, (esc, 0, 0, -esc, x, linha_base)))
        d.append(pen.getCommands())
        x += g.width * esc + espaco
    return ''.join(d)


# ---------------------------------------------------------------- RAÇA (unidades: maiúscula 140, traço 32)
T = 32
R = ('M30 0H182A40 40 0 0 1 222 40V44A40 40 0 0 1 182 84H0V52H182A8 8 0 0 0 190 44V40A8 8 0 0 0 182 32H14Z'
     'M0 52H32V140H0Z'
     'M120 84H162L234 140H192Z')


def letra_a(x0):
    # triângulo com o miolo triangular; a ponta é achatada e puxada para a direita, como no letreiro
    ext = 'M%s 140L%s 0H%sL%s 140Z' % (n(x0), n(x0 + 124), n(x0 + 160), n(x0 + 236))
    mio = 'M%s 108H%sL%s 46Z' % (n(x0 + 66), n(x0 + 184), n(x0 + 138))
    return ext + mio


A1 = letra_a(256)
C = ('M738 0H566A46 46 0 0 0 520 46V94A46 46 0 0 0 566 140H738V108H566A14 14 0 0 1 552 94V46A14 14 0 0 1 566 32H738Z')
CEDILHA = 'M622 150H642L636 190H616Z'
A2 = letra_a(754)
RACA = R + A1 + C + A2
CEDILHA_D = CEDILHA
LARGURA_RACA = 990  # de 0 a 990 (o A final termina em 754 + 236)

# ---------------------------------------------------------------- a faixa
# contorno: canto de cima à esquerda (-24, 172), desce em diagonal até (66, 252); direita reta em 1000
FAIXA_Y0, FAIXA_Y1, TRACO_FAIXA = 168, 256, 8
def faixa_contorno():
    # contorno cheio (o anel entre o polígono de fora e o de dentro), regra evenodd
    fora = 'M-30 %sH1000V%sH58Z' % (FAIXA_Y0, FAIXA_Y1)
    t = TRACO_FAIXA
    # o de dentro: a diagonal recua para manter a espessura constante (a diagonal tem inclinação 88/88)
    dentro = 'M%s %sH%sV%sH%sZ' % (n(-30 + t * 2.414), FAIXA_Y0 + t, 1000 - t, FAIXA_Y1 - t, n(58 + t * 0.414))
    return fora + dentro

PONTA = (838, FAIXA_Y0 + 16, 122, FAIXA_Y1 - FAIXA_Y0 - 32)  # o bloco vermelho (x, y, w, h); depois dele, o vão preto e a borda da faixa
def ponta_contorno(t=6):
    x, y, w, h = PONTA
    return 'M%s %sH%sV%sH%sZM%s %sV%sH%sV%sZ' % (x - t, y - t, x + w + t, y + h + t, x - t, x, y, y + h, x + w, y)
PONTA_MIOLO = 'M%s %sH%sV%sH%sZ' % (PONTA[0], PONTA[1], PONTA[0] + PONTA[2], PONTA[1] + PONTA[3], PONTA[0])

FIGHT = texto('FIGHT', 104, 230, 40, espaco=6)
CENTRO = texto('CENTRO DE TREINAMENTO', 495, -26, 30, largura=760, alinhar='centro')
GRAVATAI = texto('GRAVATAÍ', 1000, 314, 34, espaco=6, alinhar='direita')


def svg(conteudo, caixa, titulo, extra=''):
    x, y, w, h = caixa
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="%s %s %s %s" width="%s" height="%s" role="img" aria-labelledby="t"%s>'
            '<title id="t">%s</title>%s</svg>\n') % (n(x), n(y), n(w), n(h), n(w), n(h), extra, titulo, conteudo)


def pecas(cor, cor_ponta=VERMELHO, completo=True):
    """cor = cor das letras e da faixa; cor_ponta = o bloco da ponta (None = da mesma cor, versão de uma cor só)."""
    p = ['<path fill="%s" d="%s"/>' % (cor, RACA + CEDILHA_D),
         '<path fill="%s" fill-rule="evenodd" d="%s"/>' % (cor, faixa_contorno()),
         '<path fill="%s" d="%s"/>' % (cor, FIGHT),
         '<path fill="%s" fill-rule="evenodd" d="%s"/>' % (cor, ponta_contorno()),
         '<path fill="%s" d="%s"/>' % (cor_ponta or cor, PONTA_MIOLO)]
    if completo:
        p += ['<path fill="%s" d="%s"/>' % (cor, CENTRO), '<path fill="%s" d="%s"/>' % (cor, GRAVATAI)]
    return ''.join(p)


MARGEM = 24
CAIXA_COMPLETO = (-30 - MARGEM, -26 - 30 - MARGEM, 1030 + 2 * MARGEM, 314 + 26 + 30 + 2 * MARGEM)
CAIXA_COMPACTO = (-30 - MARGEM, 0 - MARGEM, 1030 + 2 * MARGEM, FAIXA_Y1 + 2 * MARGEM)
AVISO = '<!-- PROVISÓRIO: reconstrução do logo da Raça Fight a partir das fotos do Instagram (agente AL, 15/10/2026). Trocar pelo arquivo original da academia. -->'

arquivos = {
    'raca-fight-completo-escuro.svg': svg(AVISO + pecas(BRANCO), CAIXA_COMPLETO, 'Centro de Treinamento Raça Fight Gravataí (logo provisório)'),
    'raca-fight-completo-claro.svg': svg(AVISO + pecas(PRETO), CAIXA_COMPLETO, 'Centro de Treinamento Raça Fight Gravataí (logo provisório)'),
    'raca-fight-compacto-escuro.svg': svg(AVISO + pecas(BRANCO, completo=False), CAIXA_COMPACTO, 'Raça Fight (logo compacto provisório)'),
    'raca-fight-compacto-claro.svg': svg(AVISO + pecas(PRETO, completo=False), CAIXA_COMPACTO, 'Raça Fight (logo compacto provisório)'),
    'raca-fight-compacto-uma-cor.svg': svg(AVISO + pecas('currentColor', cor_ponta=None, completo=False), CAIXA_COMPACTO, 'Raça Fight (logo compacto de uma cor, provisório)'),
}

# ícone do app (iOS e lojas): 1024 × 1024, preto da marca, o compacto com 84 % da largura
def icone(fundo=PRETO, cor=BRANCO, lado=1024, ocupa=0.84):
    cx, cy, cw, ch = CAIXA_COMPACTO
    esc = lado * ocupa / cw
    tx = (lado - cw * esc) / 2 - cx * esc
    ty = (lado - ch * esc) / 2 - cy * esc
    corpo = '<rect width="%s" height="%s" fill="%s"/><g transform="translate(%s %s) scale(%s)">%s</g>' % (lado, lado, fundo, n(tx), n(ty), '%.5f' % esc, pecas(cor, completo=False))
    return svg(AVISO + corpo, (0, 0, lado, lado), 'Ícone do app Raça Fight (provisório)')

arquivos['raca-fight-icone-app.svg'] = icone()
# primeiro plano do ícone adaptativo do Android (fundo transparente; o fundo é a cor #1C1C1C)
cx, cy, cw, ch = CAIXA_COMPACTO
esc = 1024 * 0.62 / cw  # os cantos do compacto ficam dentro do círculo seguro de 2/3 (raio 338 de 1024)
arquivos['raca-fight-icone-app-primeiro-plano.svg'] = svg(AVISO + '<g transform="translate(%s %s) scale(%s)">%s</g>' % (
    n((1024 - cw * esc) / 2 - cx * esc), n((1024 - ch * esc) / 2 - cy * esc), '%.5f' % esc, pecas(BRANCO, completo=False)), (0, 0, 1024, 1024), 'Ícone adaptativo, primeiro plano (provisório)')

# o símbolo do mockup (<symbol id="s-simbolo">): uma cor só (currentColor via fill herdado) e a ponta em var(--logo-ponta)
simbolo = ('<symbol id="s-simbolo" viewBox="%s %s %s %s">' % tuple(n(v) for v in CAIXA_COMPACTO) +
           '<path d="%s"/>' % (RACA + CEDILHA_D) + '<path fill-rule="evenodd" d="%s"/>' % faixa_contorno() + '<path d="%s"/>' % FIGHT +
           '<path fill-rule="evenodd" d="%s"/>' % ponta_contorno() + '<path style="fill:var(--logo-ponta, currentColor)" d="%s"/>' % PONTA_MIOLO + '</symbol>')

for nome, conteudo in arquivos.items():
    with open(os.path.join(SAIDA, nome), 'w', encoding='utf-8', newline='\n') as f:
        f.write(conteudo)
with open(os.path.join(AQUI, 'simbolo-mockup.svg.txt'), 'w', encoding='utf-8', newline='\n') as f:
    f.write(simbolo + '\n')
print('proporção do compacto: %.4f (largura/altura)' % (CAIXA_COMPACTO[2] / CAIXA_COMPACTO[3]))
print('gravados:', ', '.join(arquivos))
