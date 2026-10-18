# -*- coding: utf-8 -*-
"""
Gerador do logo do Academia Plus (agente W, P11, 11/10/2026).

A geometria é escrita à mão aqui, em números redondos numa grade de 1024; o script
só embrulha cada desenho num SVG limpo (sem transform, sem texto vivo, sem estilo
embutido) e converte o wordmark e o selo em contorno a partir das fontes do app
(app/recursos/fontes). Não edite os .svg gerados: edite este arquivo e rode

    python -I gerar.py

Saída (pasta logo/):
  variacoes/   as 3 variações estudadas (símbolo e ícone de cada uma)
  simbolo*.svg, wordmark*.svg, selo-plus.svg     a versão final
  app/         as artes que viram os PNG do app (exportar-png.mjs)
"""
import math, os, sys

AQUI = os.path.dirname(os.path.abspath(__file__))
LOGO = os.path.dirname(AQUI)                                   # 02-design/marca-e-proposta/logo
RAIZ = os.path.abspath(os.path.join(LOGO, '..', '..', '..'))   # Academia Plus
FONTES = os.path.join(RAIZ, 'app', 'recursos', 'fontes')

# Cores (tokens-marca.json 1.2.0 = tokens.json 1.8.0)
MARCA, VIVA, TEXTO, TEXTO_ESCURO = '#007761', '#39F0CD', '#131D1C', '#E9F2F1'
PROFUNDO = '#0A332C'            # marcaSuave do escuro: o fundo da abertura no escuro
PLUS, PLUS_TEXTO = '#EAB444', '#3A2B0D'
BRANCO = '#FFFFFF'


def n(v):
    s = ('%.2f' % v).rstrip('0').rstrip('.')
    return '0' if s == '-0' else s


def rect(x, y, w, h, r):
    return '<rect x="%s" y="%s" width="%s" height="%s" rx="%s"/>' % (n(x), n(y), n(w), n(h), n(r))


def rr_path(x, y, w, h, r):
    """retângulo arredondado como subcaminho (horário), para juntar num path só."""
    r = min(r, w / 2, h / 2)
    return ('M%s %sH%sA%s %s 0 0 1 %s %sV%sA%s %s 0 0 1 %s %sH%sA%s %s 0 0 1 %s %sV%sA%s %s 0 0 1 %s %sZ' % (
        n(x + r), n(y), n(x + w - r), n(r), n(r), n(x + w), n(y + r), n(y + h - r), n(r), n(r), n(x + w - r), n(y + h),
        n(x + r), n(r), n(r), n(x), n(y + h - r), n(y + r), n(r), n(r), n(x + r), n(y)))


def circulo_path(cx, cy, r, anti=False):
    s = 0 if anti else 1
    return 'M%s %sA%s %s 0 1 %d %s %sA%s %s 0 1 %d %s %sZ' % (
        n(cx - r), n(cy), n(r), n(r), s, n(cx + r), n(cy), n(r), n(r), s, n(cx - r), n(cy))


# ======================================================================= variações
# Grade de 1024, centro em 512. Cada variação devolve a lista de formas (fill = currentColor).

def v1_barra_mais():
    """1 · Barra e mais, robusta. Um "+" de quatro braços do mesmo comprimento (832, de ponta a
    ponta da arte) e pontas redondas; o braço horizontal é a barra, com uma anilha de cada lado
    e a ponta da barra aparecendo para fora dela, como na barra de verdade. O braço vertical é o
    traço mais grosso (160 contra 128 da barra) e passa muito acima e abaixo das anilhas (832
    contra 384): é o "exagerar o braço vertical" do 03-LOGO.md. Lê "+" primeiro e barra logo
    depois; sem o vertical, sobraria a barra, nunca o haltere de ícone genérico (duas anilhas
    em degrau de cada lado, refs. 03 e 04)."""
    return [
        rect(96, 448, 832, 128, 64),         # a barra = braço horizontal, pontas redondas
        rect(200, 320, 120, 384, 44),        # anilha esquerda
        rect(704, 320, 120, 384, 44),        # anilha direita
        rect(432, 96, 160, 832, 80),         # o braço vertical do "+"
    ]


def mais_path(cx, cy, braco, meia, r_canto=0):
    """um "+" de pontas redondas como contorno único (para vazar sem o centro voltar a encher)."""
    a, L = braco / 2, meia
    x, y = cx, cy
    return ('M%s %sA%s %s 0 0 1 %s %sV%sH%sA%s %s 0 0 1 %s %sH%sV%sA%s %s 0 0 1 %s %sV%sH%sA%s %s 0 0 1 %s %sH%sV%sZ' % (
        n(x - a), n(y - L + a), n(a), n(a), n(x + a), n(y - L + a),
        n(y - a), n(x + L - a), n(a), n(a), n(x + L - a), n(y + a),
        n(x + a), n(y + L - a), n(a), n(a), n(x - a), n(y + L - a),
        n(y + a), n(x - L + a), n(a), n(a), n(x - L + a), n(y - a),
        n(x - a), n(y - L + a)))


def v2_anilha():
    """2 · Anilha com o "+" vazado. Disco com a borda em relevo (o sulco a 3/4 do raio) e o
    furo do centro em forma de "+", largo o bastante para ler em 24 px. O sulco é o que faz
    o disco ser anilha, e não botão ou moeda."""
    d = (circulo_path(512, 512, 448) + circulo_path(512, 512, 380, True) + circulo_path(512, 512, 348)
         + mais_path(512, 512, 152, 232)[:-1] + 'Z')
    return ['<path fill-rule="evenodd" d="%s"/>' % d]


def v3_a_mais():
    """3 · Monograma A+ com a barra. Um "A" pesado sem travessão; no lugar dele, a barra
    com uma anilha para fora de cada perna; o "+" no canto de cima, como em "A+"."""
    a = 'M424 176H600L872 880H704L512 376L320 880H152Z'
    return ['<path d="%s"/>' % a,
            rect(88, 616, 848, 72, 20),       # a barra (o travessão)
            rect(88, 516, 96, 272, 36),       # anilha esquerda
            rect(840, 516, 96, 272, 36),      # anilha direita
            '<path d="%s"/>' % mais_path(800, 248, 80, 128)]


VARIACOES = [
    ('v1-barra-mais', 'Barra e mais, robusta', v1_barra_mais),
    ('v2-anilha', 'Anilha com o + vazado', v2_anilha),
    ('v3-a-mais', 'Monograma A+ com a barra', v3_a_mais),
]

ESCOLHIDA = 'v1-barra-mais'
SIMBOLO = dict((k, f) for k, _, f in VARIACOES)[ESCOLHIDA]


# ======================================================================= saída
CAB = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="%s" width="%s" height="%s" role="img" aria-label="%s">'


def svg(viewbox, w, h, rotulo, titulo, corpo):
    return (CAB % (viewbox, n(w), n(h), rotulo)) + '\n  <title>%s</title>\n%s\n</svg>\n' % (titulo, corpo)


def grupo(formas, cor=None, indent='  '):
    attr = ' fill="currentColor"' + (' color="%s"' % cor if cor else '')
    return '%s<g%s>\n%s\n%s</g>' % (indent, attr, '\n'.join(indent + '  ' + f for f in formas), indent)


def escalar(formas, s, dx, dy):
    """formas na grade 1024 → <g> com a escala aplicada nas coordenadas (sem transform)."""
    out = []
    for f in formas:
        if f.startswith('<rect'):
            import re
            v = dict(re.findall(r'(\w+)="([-\d.]+)"', f))
            out.append(rect(float(v['x']) * s + dx, float(v['y']) * s + dy, float(v['width']) * s, float(v['height']) * s, float(v['rx']) * s))
        else:
            import re
            m = re.search(r' d="([^"]+)"', f)
            out.append(f.replace(m.group(1), escalar_path(m.group(1), s, dx, dy)))
    return out


def escalar_path(d, s, dx, dy):
    """escala um path com comandos absolutos M L H V A Z (os únicos que este gerador usa)."""
    import re
    toks = re.findall(r'[MLHVAZ]|-?[\d.]+', d)
    out, i, cmd = [], 0, None
    while i < len(toks):
        t = toks[i]
        if t in 'MLHVAZ':
            cmd = t; out.append(t); i += 1
            if t == 'Z':
                continue
        if cmd in 'ML':
            out.append('%s %s' % (n(float(toks[i]) * s + dx), n(float(toks[i + 1]) * s + dy))); i += 2
        elif cmd == 'H':
            out.append(n(float(toks[i]) * s + dx)); i += 1
        elif cmd == 'V':
            out.append(n(float(toks[i]) * s + dy)); i += 1
        elif cmd == 'A':
            rx, ry, rot, la, sw, x, y = toks[i:i + 7]
            out.append('%s %s %s %s %s %s %s' % (n(float(rx) * s), n(float(ry) * s), rot, la, sw, n(float(x) * s + dx), n(float(y) * s + dy))); i += 7
    return ''.join(o if o in 'MLHVAZ' else (o if (out[k - 1] in 'MLHVAZ') else ' ' + o) for k, o in enumerate(out))


def escrever(caminho, texto):
    os.makedirs(os.path.dirname(caminho), exist_ok=True)
    with open(caminho, 'w', encoding='utf-8', newline='\n') as f:
        f.write(texto)
    return caminho


# ----------------------------------------------------------------- wordmark em contorno
def texto_em_contorno(arquivo_fonte, texto, tamanho, x0, linha_base, espacamento=0):
    """Converte `texto` em paths com a fonte de verdade (fontTools), com o kerning do GPOS.
    Devolve (lista de (caractere, d), largura)."""
    from fontTools.ttLib import TTFont
    from fontTools.pens.svgPathPen import SVGPathPen
    from fontTools.pens.transformPen import TransformPen
    fonte = TTFont(os.path.join(FONTES, arquivo_fonte))
    upm = fonte['head'].unitsPerEm
    s = tamanho / upm
    cmap = fonte.getBestCmap()
    gs = fonte.getGlyphSet()
    hmtx = fonte['hmtx']
    nomes = [cmap[ord(c)] for c in texto]
    kern = kerning_gpos(fonte)
    x = x0
    saida = []
    for i, (c, g) in enumerate(zip(texto, nomes)):
        if c != ' ':
            pen = SVGPathPen(gs, ntos=lambda v: n(v))
            gs[g].draw(TransformPen(pen, (s, 0, 0, -s, x, linha_base)))
            saida.append((c, pen.getCommands()))
        x += hmtx[g][0] * s + espacamento
        if i + 1 < len(nomes):
            x += kern(g, nomes[i + 1]) * s
    return saida, x - x0 - espacamento


def kerning_gpos(fonte):
    """par de kerning (PairPos formatos 1 e 2, inclusive dentro de Extension) → função (a, b) → unidades."""
    if 'GPOS' not in fonte:
        return lambda a, b: 0
    gpos = fonte['GPOS'].table
    tabelas = []
    feats = [fr.Feature for fr in gpos.FeatureList.FeatureRecord if fr.FeatureTag == 'kern']
    idx = sorted({i for f in feats for i in f.LookupListIndex})
    for i in idx:
        lk = gpos.LookupList.Lookup[i]
        for st in lk.SubTable:
            if lk.LookupType == 9:
                st = st.ExtSubTable
            if getattr(st, 'LookupType', 2) == 2 or lk.LookupType in (2, 9):
                tabelas.append(st)

    def valor(v):
        return getattr(v, 'XAdvance', 0) or 0 if v is not None else 0

    def k(a, b):
        for st in tabelas:
            cov = st.Coverage.glyphs
            if a not in cov:
                continue
            if st.Format == 1:
                ps = st.PairSet[cov.index(a)]
                for pv in ps.PairValueRecord:
                    if pv.SecondGlyph == b:
                        return valor(pv.Value1)
            elif st.Format == 2:
                c1 = st.ClassDef1.classDefs.get(a, 0)
                c2 = st.ClassDef2.classDefs.get(b, 0)
                v = valor(st.Class1Record[c1].Class2Record[c2].Value1)
                if v:
                    return v
        return 0
    return k


# ----------------------------------------------------------------- o wordmark
def wordmark(cor_simbolo, cor_texto, cor_plus, rotulo_tema):
    """Símbolo + "Academia Plus" em Archivo ExtraBold (800), "Plus" na cor do símbolo.
    Altura do símbolo = 1,5 × altura de maiúscula; vão = 0,5 da altura do símbolo... medido
    na arte: símbolo 160, letras de 104 de caixa-alta, vão de 48."""
    alto = 160                       # altura do símbolo (832 da grade → 160)
    s = alto / 832
    margem = 24
    formas = escalar(SIMBOLO(), s, margem - 96 * s, margem - 96 * s)
    tamanho = 152                    # caixa-alta da Archivo = 0,686 em → 104
    base = margem + alto / 2 + 0.686 * tamanho / 2
    x_texto = margem + alto + 40
    letras, largura = texto_em_contorno('Archivo-ExtraBold.ttf', 'Academia Plus', tamanho, x_texto, base, espacamento=-0.01 * tamanho)
    academia = ''.join(d for c, d in letras[:8])
    plus = ''.join(d for c, d in letras[8:])
    W = math.ceil(x_texto + largura + margem)
    H = alto + 2 * margem
    corpo = []
    if cor_simbolo == 'currentColor':
        corpo.append('  <g fill="currentColor">\n%s\n    <path d="%s"/>\n    <path d="%s"/>\n  </g>' % (
            '\n'.join('    ' + f for f in formas), academia, plus))
    else:
        corpo.append('  <g fill="%s">\n%s\n    <path d="%s"/>\n  </g>' % (cor_simbolo, '\n'.join('    ' + f for f in formas), plus))
        corpo.append('  <path fill="%s" d="%s"/>' % (cor_texto, academia))
    titulo = 'Academia Plus — wordmark%s (Archivo ExtraBold em contorno)' % rotulo_tema
    return svg('0 0 %d %d' % (W, H), W, H, 'Academia Plus', titulo, '\n'.join(corpo)), (W, H)


def selo_plus():
    """A pílula dourada com a PALAVRA Plus (Figtree Bold em contorno), nunca o sinal."""
    W, H = 120, 40
    letras, largura = texto_em_contorno('Figtree-Bold.ttf', 'Plus', 20, 0, 0, espacamento=0.5)
    x0 = (W - largura) / 2
    letras, _ = texto_em_contorno('Figtree-Bold.ttf', 'Plus', 20, x0, 27, espacamento=0.5)
    d = ''.join(d for _, d in letras)
    corpo = ('  <!-- O selo usa a PALAVRA, nunca o sinal de mais: o "+" do logo é da marca, o "Plus" dourado é do plano. -->\n'
             '  <rect width="120" height="40" rx="20" fill="%s"/>\n  <path fill="%s" d="%s"/>' % (PLUS, PLUS_TEXTO, d))
    return svg('0 0 120 40', 120, 40, 'Plano Plus', 'Selo Plus — o distintivo do plano pago', corpo)


# ----------------------------------------------------------------- artes do app
def arte_icone(formas, fundo, cor, fracao, lado=1024, arredondar=0):
    """ícone quadrado: fundo cheio (sem transparência) e o símbolo centrado, ocupando `fracao` do lado."""
    s = fracao * lado / 832
    dx = dy = lado / 2 - 512 * s
    corpo = ('  <rect width="%d" height="%d"%s fill="%s"/>\n' % (lado, lado, ' rx="%s"' % n(arredondar) if arredondar else '', fundo)
             + grupo(escalar(formas, s, dx, dy), cor))
    return corpo


def arte_frente(formas, cor, fracao, lado=1024):
    """só o símbolo, fundo transparente (adaptativo do Android, abertura, notificação), ocupando `fracao` do lado."""
    s = fracao * lado / 832
    dx = dy = lado / 2 - 512 * s
    return grupo(escalar(formas, s, dx, dy), cor)


# Frações do lado da arte que o símbolo (832 de 1024 na grade) ocupa:
# iOS: o símbolo com 640 de 1024 (62,5 %), o respiro de ícone de app da Apple.
# Android adaptativo: a camada tem 108 dp e a máscara mostra os 72 dp do meio; o círculo seguro
#   é de 66 dp (61 %). O símbolo cabe no círculo de raio 0,30 × 1024 com folga (medido no exportar-png).
# Abertura: o símbolo com 637 de 1024 de largura (04-APLICACAO.md e entrada.html: imageWidth 154 → 96 pt).
ESC_IOS = 640 / 1024
ESC_ADAPTATIVO = 0.44        # símbolo de 450 px: a ponta do braço fica a 225 do centro (círculo seguro: 313)
ESC_ABERTURA = 637 / 1024
ESC_NOTIFICACAO = 80 / 96         # 96 px, o símbolo em 80 (área viva 20 de 24 dp)


# ----------------------------------------------------------------- comparativo.html
DESCRICOES = {
    'v1-barra-mais': 'Um "+" de quatro braços iguais e pontas redondas; o braço horizontal é a barra, com uma anilha de cada lado e a ponta para fora. O vertical é o traço mais grosso e passa muito das anilhas.',
    'v2-anilha': 'Uma anilha de frente, com o sulco da borda e o furo do centro em forma de "+". Redonda, boa de avatar; em 16 px vira um "+" num círculo, que é o sinal de farmácia e de "adicionar".',
    'v3-a-mais': 'Um "A" pesado sem travessão; no lugar dele, a barra com uma anilha para fora de cada perna, e o "+" no canto, como em "A+". Bonito grande; em 16 e 24 px o "+" some e sobra um "A" borrado.',
}


def superelipse(expoente, pontos=96):
    """máscara em coordenadas de 0 a 1 (clipPathUnits=objectBoundingBox)."""
    out = []
    for i in range(pontos):
        t = 2 * math.pi * i / pontos
        c, s_ = math.cos(t), math.sin(t)
        x = 0.5 + 0.5 * math.copysign(abs(c) ** (2 / expoente), c)
        y = 0.5 + 0.5 * math.copysign(abs(s_) ** (2 / expoente), s_)
        out.append('%.4f %.4f' % (x, y))
    return 'M' + 'L'.join(out) + 'Z'


def app(chave, classes='', tamanho=None, titulo=None):
    t = ' t%d' % tamanho if tamanho else ''
    rot = ' role="img" aria-label="%s"' % titulo if titulo else ' aria-hidden="true"'
    return '<span class="app%s%s"%s><svg><use href="#s-%s"/></svg></span>' % (classes and ' ' + classes, t, rot, chave)


SECAO = '''<section class="caminho%s" id="variacao-%d">
  <h2>%d · %s%s</h2>
  <p>%s</p>
  <div class="linha">
    <figure><div class="quadro quadro--claro">%s</div><figcaption>símbolo no claro</figcaption></figure>
    <figure><div class="quadro quadro--escuro">%s</div><figcaption>símbolo no escuro</figcaption></figure>
    <figure><div class="quadro quadro--icone">%s</div><figcaption>ícone do app</figcaption></figure>
    <figure><div class="quadro pequenos">%s%s%s</div><figcaption>48 · 24 · 16 px</figcaption></figure>
  </div>
</section>'''

TAMANHOS = '''<h3>%d · %s</h3>
  <div class="faixa lista">%s</div>
  <details><summary>Abrir o de 1024 em tamanho real</summary><div class="rola lista">%s</div></details>'''

CELULAR = '''<h3>%d · %s</h3>
  <div class="telas">
    <div class="inicial inicial--claro"><h3>iPhone, claro</h3><figure>%s%s</figure>%s</div>
    <div class="inicial inicial--escuro"><h3>iPhone, escuro</h3><figure>%s%s</figure>%s</div>
    <div class="inicial inicial--claro"><h3>Android, claro</h3><figure>%s%s</figure><figure>%s%s</figure>%s</div>
    <div class="inicial inicial--escuro"><h3>Android, escuro</h3><figure>%s%s</figure><figure>%s%s</figure>%s</div>
  </div>'''


def comparativo():
    import re
    curtas = {'v1-barra-mais': 'v1', 'v2-anilha': 'v2', 'v3-a-mais': 'v3'}
    # símbolos e máscaras, embutidos (por file:// o Chrome não busca <use> em outro arquivo)
    defs = ['<svg width="0" height="0" style="position:absolute" aria-hidden="true">']
    for chave, nome, f in VARIACOES:
        defs.append('  <symbol id="s-%s" viewBox="0 0 1024 1024" fill="currentColor">%s</symbol>' % (curtas[chave], ''.join(f())))
    wm, (W, H) = wordmark('currentColor', None, None, '')
    corpo = re.search(r'<g fill="currentColor">([\s\S]*)</g>', wm).group(1)
    paths = re.findall(r'<path d="([^"]+)"/>', corpo)
    retangulos = re.findall(r'<rect [^>]+/>', corpo)
    defs.append('  <symbol id="w-final" viewBox="0 0 %d %d" fill="currentColor">%s<path style="fill:var(--wm-texto, currentColor)" d="%s"/><path d="%s"/></symbol>' % (
        W, H, ''.join(retangulos), paths[0], paths[1]))
    defs.append('  <clipPath id="mascara-ios" clipPathUnits="objectBoundingBox"><path d="%s"/></clipPath>' % superelipse(5))
    defs.append('  <clipPath id="mascara-squircle" clipPathUnits="objectBoundingBox"><path d="%s"/></clipPath>' % superelipse(4))
    defs.append('</svg>')
    wm_html = '<svg class="wm" viewBox="0 0 %d %d" style="--wm-proporcao:%d / %d" role="img" aria-label="Academia Plus"><use href="#w-final"/></svg>' % (W, H, W, H)

    secoes, tamanhos, celular, refs = [], [], [], []
    for i, (chave, nome, f) in enumerate(VARIACOES, 1):
        k = curtas[chave]
        escolhida = chave == ESCOLHIDA
        use = '<svg aria-hidden="true"><use href="#s-%s"/></svg>' % k
        secoes.append(SECAO % (' escolhida' if escolhida else '', i, i, nome, ' <small>(escolhida)</small>' if escolhida else '', DESCRICOES[chave],
                               use, use, app(k), app(k, tamanho=48), app(k, tamanho=24), app(k, tamanho=16)))
        tamanhos.append(TAMANHOS % (i, nome, ''.join('<figure>%s<figcaption>%d</figcaption></figure>' % (app(k, tamanho=t), t) for t in (16, 24, 32, 48, 64, 180)),
                                    app(k, tamanho=1024)))
        vazios = '<figure><span class="vazio"></span></figure>'
        rotulo = '<figcaption>Academia Plus</figcaption>'
        celular.append(CELULAR % (
            i, nome,
            app(k, tamanho=60, titulo='Academia Plus'), rotulo, vazios * 3,
            app(k, 'app--escuro', 60, 'Academia Plus'), rotulo, vazios * 3,
            app(k, 'app--android app--redondo', 60, 'Academia Plus'), '<figcaption>círculo</figcaption>',
            app(k, 'app--android app--squircle', 60, 'Academia Plus'), '<figcaption>squircle</figcaption>', vazios * 2,
            app(k, 'app--android app--redondo', 60, 'Academia Plus'), '<figcaption>círculo</figcaption>',
            app(k, 'app--android app--squircle', 60, 'Academia Plus'), '<figcaption>squircle</figcaption>', vazios * 2))
    for arq, rot, txt in (('ref-03-icone.png', 'Ícone da ref. 03', 'ref. 03: o haltere com duas anilhas em degrau'),
                          ('ref-04-icone.png', 'Ícone da ref. 04', 'ref. 04: o mesmo haltere, num quadrado com borda')):
        refs.append('<div class="ref"><div class="ref__linha">%s</div><span class="legenda">%s</span></div>' % (
            ''.join('<span class="app app--ref t%d"><img src="referencias/%s" width="%d" height="%d" alt="%s"></span>' % (t, arq, t, t, rot) for t in (60, 24)), txt))
    refs.append('<div class="ref"><div class="ref__linha">%s%s</div><span class="legenda">Academia Plus, variação 1: o "+" com a barra</span></div>' % (
        app('v1', tamanho=60, titulo='Academia Plus'), app('v1', tamanho=24)))

    with open(os.path.join(AQUI, 'comparativo-modelo.html'), encoding='utf-8') as fh:
        html = fh.read()
    html = (html.replace('<!--SIMBOLOS-->', '\n'.join(defs)).replace('<!--VARIACOES-->', '\n\n'.join(secoes))
            .replace('<!--WM-->', wm_html).replace('<!--TAMANHOS-->', '\n  '.join(tamanhos))
            .replace('<!--CELULAR-->', '\n  '.join(celular)).replace('<!--REFS-->', '\n    '.join(refs)))
    return escrever(os.path.join(LOGO, 'comparativo.html'), html)


def principal():
    feitos = []
    # variações
    for chave, nome, f in VARIACOES:
        formas = f()
        feitos.append(escrever(os.path.join(LOGO, 'variacoes', chave + '-simbolo.svg'),
                               svg('0 0 1024 1024', 1024, 1024, 'Academia Plus — ' + nome, 'Variação: ' + nome, grupo(formas))))
        feitos.append(escrever(os.path.join(LOGO, 'variacoes', chave + '-icone.svg'),
                               svg('0 0 1024 1024', 1024, 1024, 'Ícone — ' + nome, 'Variação: ' + nome + ' — ícone do app', arte_icone(formas, MARCA, BRANCO, ESC_IOS))))
    formas = SIMBOLO()
    # símbolo final: currentColor com a cor da marca de padrão
    feitos.append(escrever(os.path.join(LOGO, 'simbolo.svg'), svg('0 0 1024 1024', 1024, 1024, 'Academia Plus', 'Academia Plus — símbolo', grupo(formas, MARCA))))
    feitos.append(escrever(os.path.join(LOGO, 'simbolo-escuro.svg'), svg('0 0 1024 1024', 1024, 1024, 'Academia Plus', 'Academia Plus — símbolo, tema escuro', grupo(formas, VIVA))))
    feitos.append(escrever(os.path.join(LOGO, 'simbolo-mono.svg'), svg('0 0 1024 1024', 1024, 1024, 'Academia Plus', 'Academia Plus — símbolo em uma cor (herda a cor do texto)', grupo(formas))))
    for nome, args, rot in (('wordmark', (MARCA, TEXTO, MARCA), ''), ('wordmark-escuro', (VIVA, TEXTO_ESCURO, VIVA), ', tema escuro'),
                            ('wordmark-mono', ('currentColor', None, None), ', uma cor')):
        texto, _ = wordmark(*args, rotulo_tema=rot)
        feitos.append(escrever(os.path.join(LOGO, nome + '.svg'), texto))
    feitos.append(escrever(os.path.join(LOGO, 'selo-plus.svg'), selo_plus()))
    # artes do app (exportar-png.mjs transforma em PNG)
    A = os.path.join(LOGO, 'app')
    feitos.append(escrever(os.path.join(A, 'icone.svg'), svg('0 0 1024 1024', 1024, 1024, 'Academia Plus', 'Ícone do app (iOS e loja): 1024, fundo cheio na cor da marca, sem transparência', arte_icone(formas, MARCA, BRANCO, ESC_IOS))))
    feitos.append(escrever(os.path.join(A, 'icone-adaptativo.svg'), svg('0 0 1024 1024', 1024, 1024, 'Academia Plus', 'Android: camada da frente do ícone adaptativo (fundo transparente; a cor de fundo vai no app.json)', arte_frente(formas, BRANCO, ESC_ADAPTATIVO))))
    feitos.append(escrever(os.path.join(A, 'icone-notificacao.svg'), svg('0 0 96 96', 96, 96, 'Academia Plus', 'Android: ícone de notificação, branco sobre transparente', arte_frente(formas, BRANCO, ESC_NOTIFICACAO, 96))))
    feitos.append(escrever(os.path.join(A, 'abertura-simbolo-claro.svg'), svg('0 0 1024 1024', 1024, 1024, 'Academia Plus', 'Abertura, tema claro: símbolo branco (fundo #007761 no app.json)', arte_frente(formas, BRANCO, ESC_ABERTURA))))
    feitos.append(escrever(os.path.join(A, 'abertura-simbolo-escuro.svg'), svg('0 0 1024 1024', 1024, 1024, 'Academia Plus', 'Abertura, tema escuro: símbolo verde vivo (fundo #0A332C no app.json)', arte_frente(formas, VIVA, ESC_ABERTURA))))
    feitos.append(comparativo())
    for f in feitos:
        print(os.path.relpath(f, LOGO))


if __name__ == '__main__':
    principal()
