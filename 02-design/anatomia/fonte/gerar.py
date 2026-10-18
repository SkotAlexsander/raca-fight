"""Mapa muscular do Academia Plus (agente AD, 11/10/2026).

A FONTE é este arquivo + `base-musclemap.json` (os paths do MuscleMap, MIT)
+ `musculos-por-exercicio.json` (o que acende em cada exercício, com a página
do ExRx). Nunca edite os .svg gerados; rode:

    python -I gerar.py

Saída (em 02-design/anatomia/):
    mapa/frente.svg, mapa/costas.svg     o mapa inteiro, um <path id> por região
    exercicios/<id>.svg                  miniatura: a vista do músculo principal
    exercicios/<id>-duplo.svg            detalhe: frente e costas lado a lado
    grupos/<grupo>.svg                   mini corpo dos filtros e da rosca
    dados/mapa-muscular.json             o que o componente do app desenha
    dados/contraste.json                 as medidas de contraste
"""
import json
import pathlib
import sys

AQUI = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(AQUI))
from caminhos import absoluto  # noqa: E402

RAIZ = AQUI.parent
CATALOGO = RAIZ.parents[1] / 'app' / 'dominio' / 'catalogo' / 'exercicios.json'

# ---------------------------------------------------------------------------
# Cores (medidas em dados/contraste.json; o mínimo é 3:1, WCAG 1.4.11)
# ---------------------------------------------------------------------------
CORES = {
    'claro': {
        'fundo': '#E6F1EF',        # = ilustracao.fundo (o ladrilho do app)
        'corpo': '#CDD3D6',        # o corpo, cinza claro
        'contorno': '#9AA3A7',     # a borda do corpo e as divisões (o cinza do pedido)
        'principal': '#CE2C31',    # o músculo trabalhado
        'secundario': '#F07579',   # o que ajuda
    },
    'escuro': {
        'fundo': '#222D2C',
        'corpo': '#3A4446',
        'contorno': '#5E6A6D',
        'principal': '#FF6369',
        'secundario': '#C2383D',
    },
}
SUPERFICIES = {'claro': {'ladrilho': '#E6F1EF', 'superficie': '#FFFFFF', 'fundo': '#F4F8F7'},
               'escuro': {'ladrilho': '#222D2C', 'superficie': '#121A19', 'fundo': '#070C0C', 'superficieElevada': '#1B2423'}}

# ---------------------------------------------------------------------------
# Regiões: cada camada da base vira UMA região do app. A ordem é a de pintura
# (a de cima cobre a de baixo): 'deltoids' da frente é o ombro inteiro, e o
# 'frontDeltoid' por cima deixa à mostra só a parte lateral.
# ---------------------------------------------------------------------------
REGIOES = {
    'front': [
        ('chest', 'peitoral-esternal'), ('lowerChest', 'peitoral-esternal'), ('upperChest', 'peitoral-clavicular'),
        ('deltoids', 'deltoide-lateral'), ('frontDeltoid', 'deltoide-anterior'),
        ('trapezius', 'trapezio-superior'), ('upperTrapezius', 'trapezio-superior'),
        ('biceps', 'biceps'), ('triceps', 'triceps'), ('forearm', 'antebraco'),
        ('abs', 'reto-abdominal'), ('upperAbs', 'reto-abdominal'), ('lowerAbs', 'reto-abdominal'),
        ('obliques', 'obliquos'), ('serratus', 'serratil'),
        ('quadriceps', 'quadriceps'), ('innerQuad', 'quadriceps'), ('outerQuad', 'quadriceps'),
        ('hipFlexors', 'flexores-do-quadril'), ('adductors', 'adutores'),
        ('calves', 'panturrilha'), ('tibialis', 'tibial-anterior'),
    ],
    'back': [
        ('trapezius', 'trapezio-medio'), ('upperTrapezius', 'trapezio-superior'),
        ('rhomboids', 'romboides'), ('lowerTrapezius', 'trapezio-inferior'),
        ('deltoids', 'deltoide-posterior'), ('rearDeltoid', 'deltoide-posterior'),
        ('rotatorCuff', 'infraespinal'), ('upperBack', 'grande-dorsal'), ('lowerBack', 'lombar'),
        ('triceps', 'triceps'), ('forearm', 'antebraco'),
        ('gluteal', 'gluteos'), ('hamstring', 'posteriores-da-coxa'),
        ('adductors', 'adutores'), ('calves', 'panturrilha'),
    ],
}
# o resto da base (cabeça, cabelo, pescoço, mãos, pés, joelhos, tornozelos) é só corpo
VISTA = {'front': 'frente', 'back': 'costas'}

# Músculos que o app nomeia: nome na tela, regiões, vista preferida
MUSCULOS = {
    'peitoral':            ('Peitoral', ['peitoral-esternal', 'peitoral-clavicular'], 'frente'),
    'peitoral-superior':   ('Peitoral (parte de cima)', ['peitoral-clavicular'], 'frente'),
    'peitoral-esternal':   ('Peitoral (parte de baixo)', ['peitoral-esternal'], 'frente'),
    'deltoide-anterior':   ('Deltoide anterior', ['deltoide-anterior'], 'frente'),
    'deltoide-lateral':    ('Deltoide lateral', ['deltoide-lateral'], 'frente'),
    'deltoide-posterior':  ('Deltoide posterior', ['deltoide-posterior'], 'costas'),
    'deltoide':            ('Ombros', ['deltoide-anterior', 'deltoide-lateral', 'deltoide-posterior'], 'frente'),
    'biceps':              ('Bíceps', ['biceps'], 'frente'),
    'triceps':             ('Tríceps', ['triceps'], 'costas'),
    'antebraco':           ('Antebraço', ['antebraco'], 'frente'),
    'trapezio':            ('Trapézio', ['trapezio-superior', 'trapezio-medio', 'romboides', 'trapezio-inferior'], 'costas'),
    'trapezio-superior':   ('Trapézio (parte de cima)', ['trapezio-superior'], 'costas'),
    'trapezio-medio':      ('Trapézio médio', ['trapezio-medio', 'romboides'], 'costas'),
    'trapezio-inferior':   ('Trapézio inferior', ['trapezio-inferior'], 'costas'),
    'grande-dorsal':       ('Grande dorsal', ['grande-dorsal', 'infraespinal'], 'costas'),
    'meio-das-costas':     ('Meio das costas (romboides)', ['romboides', 'trapezio-medio'], 'costas'),
    'lombar':              ('Lombar', ['lombar'], 'costas'),
    'reto-abdominal':      ('Reto abdominal', ['reto-abdominal'], 'frente'),
    'obliquos':            ('Oblíquos', ['obliquos'], 'frente'),
    'serratil':            ('Serrátil', ['serratil'], 'frente'),
    'gluteos':             ('Glúteos', ['gluteos'], 'costas'),
    'quadriceps':          ('Quadríceps', ['quadriceps'], 'frente'),
    'posteriores-da-coxa': ('Posteriores da coxa', ['posteriores-da-coxa'], 'costas'),
    'adutores':            ('Adutores', ['adutores'], 'frente'),
    'panturrilha':         ('Panturrilha', ['panturrilha'], 'costas'),
    'flexores-do-quadril': ('Flexores do quadril', ['flexores-do-quadril'], 'frente'),
}

# Os grupos do app (dominio/tipos.ts › GrupoMuscular) no mapa
GRUPOS = {
    'peito': ['peitoral'],
    'costas': ['grande-dorsal', 'meio-das-costas', 'trapezio-inferior', 'lombar'],
    'ombros': ['deltoide'],
    'biceps': ['biceps'],
    'triceps': ['triceps'],
    'pernas': ['quadriceps', 'posteriores-da-coxa', 'adutores', 'panturrilha'],
    'gluteos': ['gluteos'],
    'abdomen': ['reto-abdominal', 'obliquos'],
    'corpo_inteiro': list(MUSCULOS),
    # 'cardio' não é músculo: o filtro segue com o ícone `frequencia`
}

ESPESSURA_SILHUETA = 14   # fecha os vãos entre as peças da base (unidades da base)
CONTORNO = 4              # a borda do corpo, para fora da silhueta
LINHA = 2.2               # as divisões entre músculos (só no tamanho grande)
MARGEM = 18


# ---------------------------------------------------------------------------
def contraste(a, b):
    def lum(h):
        h = h.lstrip('#')
        r, g, bb = (int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))
        f = lambda c: c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4  # noqa: E731
        return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(bb)
    x, y = sorted((lum(a), lum(b)))
    return round((y + 0.05) / (x + 0.05), 2)


# camadas que são SUBDIVISÃO de outra na base (pintadas por cima): sem linha própria
SUBDIVISOES = {'lowerChest', 'upperChest', 'frontDeltoid', 'rearDeltoid', 'upperTrapezius', 'lowerTrapezius',
               'rhomboids', 'upperAbs', 'lowerAbs', 'innerQuad', 'outerQuad', 'serratus', 'hipFlexors', 'rotatorCuff'}


def _uniao(cs):
    return [min(c[0] for c in cs), min(c[1] for c in cs), max(c[2] for c in cs), max(c[3] for c in cs)]


def carregar_base():
    base = json.loads((AQUI / 'base-musclemap.json').read_text(encoding='utf8'))['partes']
    vistas = {}
    for lado in ('front', 'back'):
        partes = base[lado]
        x0, y0, x1, y1 = _uniao([absoluto(d)[1] for p in partes.values() for d in p['common'] + p['left'] + p['right']])
        dx, dy = MARGEM - x0, MARGEM - y0
        caixas, ds = {}, {}
        for slug, p in partes.items():
            pares = [absoluto(s, dx, dy) for s in p['common'] + p['left'] + p['right']]
            ds[slug] = ''.join(a for a, _ in pares)
            caixas[slug] = [round(v + (dx if i % 2 == 0 else dy)) for i, v in enumerate(_uniao([c for _, c in pares]))]
        usados = {slug for slug, _ in REGIOES[lado]}
        vistas[VISTA[lado]] = {
            'nome': VISTA[lado],
            'largura': round(x1 - x0 + 2 * MARGEM),
            'altura': round(y1 - y0 + 2 * MARGEM),
            # a silhueta: todas as peças menos as subdivisões (que ficam dentro de outra)
            'corpo': ''.join(d for s, d in ds.items() if s not in SUBDIVISOES),
            # ordem de pintura: [região, d]
            'camadas': [[reg, ds[slug]] for slug, reg in REGIOES[lado]],
            'linhas': ''.join(ds[slug] for slug, _ in REGIOES[lado] if slug not in SUBDIVISOES),
            'caixas': caixas,
            'naoUsados': sorted(set(partes) - usados),
        }
    h = max(v['altura'] for v in vistas.values())
    for v in vistas.values():
        v['altura'] = h   # mesma escala lado a lado
    return vistas


def recorte(v, zona):
    """Caixa [x, y, largura, altura] da zona: 'inteiro', 'superior' (cabeça até as mãos)
    ou 'inferior' (do quadril aos pés, só as pernas)."""
    c = v['caixas']
    if zona == 'inteiro':
        return [0, 0, v['largura'], v['altura']]
    if zona == 'superior':
        return [0, 0, v['largura'], c['hands'][3] + 14]
    nomes = ('calves', 'feet', 'adductors') + (('quadriceps',) if 'quadriceps' in c else ('hamstring', 'gluteal'))
    pernas = _uniao([c[s] for s in nomes])
    topo = (c['hipFlexors'][1] if 'hipFlexors' in c else c['gluteal'][1]) - 40
    x0, x1 = pernas[0] - 22, pernas[2] + 22
    return [x0, topo, x1 - x0, v['altura'] - topo]


def regioes_de(musculos):
    r = []
    for m in musculos:
        r += MUSCULOS[m][1]
    return r


def estado_das_regioes(principal, secundarios):
    est = {}
    for r in regioes_de(secundarios):
        est[r] = 's'
    for r in regioes_de(principal):
        est[r] = 'p'
    return est


ESTILO = ('<style>'
          '.am-corpo{fill:var(--am-corpo,%(c_corpo)s);stroke:var(--am-corpo,%(c_corpo)s)}'
          '.am-borda{fill:var(--am-contorno,%(c_contorno)s);stroke:var(--am-contorno,%(c_contorno)s)}'
          '.am-linha{fill:none;stroke:var(--am-contorno,%(c_contorno)s);stroke-opacity:.6}'
          '.am-p{fill:var(--am-principal,%(c_principal)s)}'
          '.am-s{fill:var(--am-secundario,%(c_secundario)s)}'
          '@media (prefers-color-scheme:dark){'
          '.am-corpo{fill:var(--am-corpo,%(e_corpo)s);stroke:var(--am-corpo,%(e_corpo)s)}'
          '.am-borda{fill:var(--am-contorno,%(e_contorno)s);stroke:var(--am-contorno,%(e_contorno)s)}'
          '.am-linha{stroke:var(--am-contorno,%(e_contorno)s)}'
          '.am-p{fill:var(--am-principal,%(e_principal)s)}'
          '.am-s{fill:var(--am-secundario,%(e_secundario)s)}'
          '}</style>') % {
    **{f'c_{k}': v for k, v in CORES['claro'].items()},
    **{f'e_{k}': v for k, v in CORES['escuro'].items()},
}

SOBREPOSICOES = [('frente', 'deltoide-anterior', 'deltoide-lateral'), ('frente', 'peitoral-clavicular', 'peitoral-esternal'),
                 ('costas', 'trapezio-superior', 'trapezio-medio'), ('costas', 'romboides', 'trapezio-medio'),
                 ('costas', 'trapezio-inferior', 'trapezio-medio'), ('costas', 'infraespinal', 'grande-dorsal')]


def _cobre(reg, estado, v):
    """Região apagada pintada por cima de uma acesa (camadas sobrepostas da base): volta ao cinza."""
    return any(reg == de_cima and v['nome'] == vista and estado.get(de_baixo)
               for vista, de_cima, de_baixo in SOBREPOSICOES)


def desenhar_vista(v, estado, detalhe, ids=False, prefixo=''):
    sw = ESPESSURA_SILHUETA
    ref = f'{prefixo}c-{v["nome"]}'
    partes = [f'<defs><path id="{ref}" d="{v["corpo"]}"/></defs>',
              f'<use href="#{ref}" class="am-borda" stroke-width="{sw + 2 * CONTORNO}" stroke-linejoin="round"/>',
              f'<use href="#{ref}" class="am-corpo" stroke-width="{sw}" stroke-linejoin="round"/>']
    if ids:
        por_regiao = {}
        for reg, d in v['camadas']:
            por_regiao.setdefault(reg, []).append(d)
        for reg, ds in por_regiao.items():
            partes.append(f'<path id="{reg}" class="am-corpo" stroke-width="0" d="{"".join(ds)}"/>')
    else:
        for reg, d in v['camadas']:
            e = estado.get(reg)
            if e:
                partes.append(f'<path class="am-{e}" data-m="{reg}" d="{d}"/>')
            elif _cobre(reg, estado, v):
                partes.append(f'<path class="am-corpo" stroke-width="0" d="{d}"/>')
    if detalhe or ids:
        partes.append(f'<path class="am-linha" stroke-width="{LINHA}" stroke-linejoin="round" d="{v["linhas"]}"/>')
    return ''.join(partes)


def svg(vistas, quais, estado, zona='inteiro', detalhe=False, titulo='', ids=False, prefixo=''):
    """`quais`: as vistas lado a lado; cada uma recortada na zona, todas na mesma escala."""
    vao = 36
    caixas = [recorte(vistas[q], zona) for q in quais]
    largura = round(sum(c[2] for c in caixas) + vao * (len(quais) - 1))
    altura = round(max(c[3] for c in caixas))
    filhos, x = [], 0
    for q, c in zip(quais, caixas):
        vb = ' '.join(str(round(n)) for n in c)
        filhos.append(f'<svg x="{round(x)}" y="0" width="{round(c[2])}" height="{round(c[3])}" viewBox="{vb}" data-vista="{q}">'
                      + desenhar_vista(vistas[q], estado, detalhe, ids, prefixo) + '</svg>')
        x += c[2] + vao
    t = f'<title>{titulo}</title>' if titulo else ''
    rotulo = f' aria-label="{titulo}"' if titulo else ''
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {largura} {altura}" role="img"{rotulo}>'
            f'{t}{ESTILO}{"".join(filhos)}</svg>\n')


def zona_de(regioes, vistas, quais):
    """'superior', 'inferior' ou 'inteiro', pela altura das regiões acesas nas vistas mostradas."""
    cs = []
    for q in quais:
        lado = 'front' if q == 'frente' else 'back'
        cs += [vistas[q]['caixas'][s] for s, reg in REGIOES[lado] if reg in regioes]
    if not cs:
        return 'inteiro'
    topo, base = min(c[1] for c in cs), max(c[3] for c in cs)
    # o quadril: topo do flexor do quadril (frente) ou do glúteo (costas)
    quadril = min(vistas[q]['caixas']['hipFlexors' if q == 'frente' else 'gluteal'][1] for q in quais)
    if base <= quadril + 60:
        return 'superior'
    if topo >= quadril - 60:
        return 'inferior'
    return 'inteiro'


def vistas_do_exercicio(principal, secundarios, vistas):
    """A menor lista de vistas que mostra todos os principais. Uma vista só, se der
    (a preferida do primeiro músculo vem antes); senão frente e costas."""
    tem = {q: {reg for reg, _ in vistas[q]['camadas']} for q in ('frente', 'costas')}
    preferida = MUSCULOS[principal[0]][2]
    for q in (preferida, 'costas' if preferida == 'frente' else 'frente'):
        if all(set(MUSCULOS[m][1]) & tem[q] for m in principal):
            # e a vista preferida de cada principal: um músculo de costas não vai para a frente
            if all(MUSCULOS[m][2] == q or not (set(MUSCULOS[m][1]) - tem[q]) and _visto_bem(m, q) for m in principal):
                return [q]
    return ['frente', 'costas']


def _visto_bem(musculo, vista):
    """Panturrilha, tríceps, adutores, antebraço e trapézio de cima aparecem nas duas vistas."""
    return musculo in ('panturrilha', 'triceps', 'antebraco', 'adutores', 'trapezio-superior', 'deltoide')


def _dentro(caixa, rec):
    x, y, w, h = rec
    return caixa[2] > x and caixa[0] < x + w and caixa[3] > y and caixa[1] < y + h


def main():
    vistas = carregar_base()
    mapa = json.loads((AQUI / 'musculos-por-exercicio.json').read_text(encoding='utf8'))['exercicios']
    catalogo = json.loads(CATALOGO.read_text(encoding='utf8'))['exercicios']
    ids_cat = [e['id'] for e in catalogo]

    # conferências
    falta = [i for i in ids_cat if i not in mapa]
    sobra = [i for i in mapa if i not in ids_cat]
    assert not falta and not sobra, f'mapa x catálogo: falta {falta}, sobra {sobra}'
    for i, m in mapa.items():
        for mm in m['principal'] + m['secundarios']:
            assert mm in MUSCULOS, f'{i}: músculo desconhecido {mm}'
    todas = {reg for v in vistas.values() for reg, _ in v['camadas']}
    for mid, (_, regs, _) in MUSCULOS.items():
        for r in regs:
            assert r in todas, f'{mid}: região {r} não existe'

    for pasta in ('mapa', 'exercicios', 'grupos', 'dados'):
        (RAIZ / pasta).mkdir(exist_ok=True)

    # mapa de referência
    for q in ('frente', 'costas'):
        (RAIZ / 'mapa' / f'{q}.svg').write_text(svg(vistas, [q], {}, detalhe=True, titulo=f'Mapa muscular, {q}', ids=True), encoding='utf8')

    nomes = {e['id']: e['nome'] for e in catalogo}
    resumo = {}
    for i in ids_cat:
        m = mapa[i]
        estado = estado_das_regioes(m['principal'], m['secundarios'])
        quais = vistas_do_exercicio(m['principal'], m['secundarios'], vistas)
        zona = zona_de(regioes_de(m['principal']), vistas, quais)
        visiveis = {reg for q in quais for s, reg in REGIOES['front' if q == 'frente' else 'back']
                    if _dentro(vistas[q]['caixas'][s], recorte(vistas[q], zona))}
        escondidos = [s for s in m['secundarios'] if not set(MUSCULOS[s][1]) & visiveis]
        titulo = nomes[i] + ': ' + ', '.join(MUSCULOS[x][0] for x in m['principal'])
        (RAIZ / 'exercicios' / f'{i}.svg').write_text(svg(vistas, quais, estado, zona=zona, titulo=titulo), encoding='utf8')
        (RAIZ / 'exercicios' / f'{i}-duplo.svg').write_text(svg(vistas, ['frente', 'costas'], estado, detalhe=True, titulo=titulo), encoding='utf8')
        resumo[i] = {'nome': nomes[i], 'vistas': quais, 'zona': zona, 'principal': m['principal'], 'secundarios': m['secundarios'],
                     'secundariosForaDaMiniatura': escondidos, 'fonte': m['fonte']}

    grupos_zona = {}
    for g, ms in GRUPOS.items():
        estado = {r: 'p' for r in regioes_de(ms)}
        quais = vistas_do_exercicio(ms, [], vistas) if g != 'corpo_inteiro' else ['frente', 'costas']
        zona = zona_de(regioes_de(ms), vistas, quais)
        grupos_zona[g] = {'vistas': quais, 'zona': zona, 'musculos': ms}
        (RAIZ / 'grupos' / f'{g}.svg').write_text(svg(vistas, quais, estado, zona=zona, titulo=g), encoding='utf8')

    # dados para o app (o componente MapaMuscular desenha a partir daqui)
    dados = {
        'versao': mapa and '2026-10-11',
        'sobre': 'Gerado por 02-design/anatomia/fonte/gerar.py. Base: MuscleMap (MIT) sobre react-native-body-highlighter (MIT); ver CREDITOS.md.',
        'espessuras': {'silhueta': ESPESSURA_SILHUETA, 'contorno': CONTORNO, 'linha': LINHA},
        'cores': CORES,
        'vistas': {q: {'largura': v['largura'], 'altura': v['altura'], 'corpo': v['corpo'], 'linhas': v['linhas'], 'camadas': v['camadas'],
                       'recortes': {z: recorte(v, z) for z in ('inteiro', 'superior', 'inferior')}} for q, v in vistas.items()},
        'sobreposicoes': [list(s) for s in SOBREPOSICOES],
        'musculos': {k: {'nome': n, 'regioes': r, 'vista': v} for k, (n, r, v) in MUSCULOS.items()},
        'grupos': grupos_zona,
        'exercicios': {i: {'vistas': r['vistas'], 'zona': r['zona'], 'principal': r['principal'], 'secundarios': r['secundarios']} for i, r in resumo.items()},
    }
    (RAIZ / 'dados' / 'mapa-muscular.json').write_text(json.dumps(dados, ensure_ascii=False, separators=(',', ':')), encoding='utf8')

    medidas = {}
    for tema, c in CORES.items():
        s = SUPERFICIES[tema]
        medidas[tema] = {
            'principal/corpo': contraste(c['principal'], c['corpo']),
            'secundario/corpo': contraste(c['secundario'], c['corpo']),
            'principal/secundario': contraste(c['principal'], c['secundario']),
            **{f'principal/{k}': contraste(c['principal'], v) for k, v in s.items()},
            **{f'corpo/{k}': contraste(c['corpo'], v) for k, v in s.items()},
            **{f'contorno/{k}': contraste(c['contorno'], v) for k, v in s.items()},
        }
        assert medidas[tema]['principal/corpo'] >= 3, (tema, medidas[tema])
        for k, v in s.items():
            assert medidas[tema][f'principal/{k}'] >= 3, (tema, k)
    medidas['pedido-original'] = {'#E5484D/#9AA3A7': contraste('#E5484D', '#9AA3A7'),
                                  '#E5484D/#FFFFFF': contraste('#E5484D', '#FFFFFF'),
                                  '#9AA3A7/#FFFFFF': contraste('#9AA3A7', '#FFFFFF')}
    (RAIZ / 'dados' / 'contraste.json').write_text(json.dumps(medidas, ensure_ascii=False, indent=2), encoding='utf8')
    (RAIZ / 'dados' / 'resumo-exercicios.json').write_text(json.dumps(resumo, ensure_ascii=False, indent=2), encoding='utf8')
    print('ok:', len(resumo), 'exercícios,', len(GRUPOS), 'grupos; base sem uso:', {q: v['naoUsados'] for q, v in vistas.items()})
    print(json.dumps(medidas, ensure_ascii=False))


if __name__ == '__main__':
    main()
