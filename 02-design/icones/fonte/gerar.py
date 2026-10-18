# -*- coding: utf-8 -*-
"""
Gerador dos ícones e ilustrações do Academia Plus (agente R, P09, 10/10/2026).

P12 (agente AM2, 15/10/2026): saíram os desenhos de musculação (o haltere da
aba Início, a anilha, a barra, a esteira, a bicicleta, o músculo, o "+" do
Plus e as 16 ilustrações de exercício). O Início e os ícones de luta estão em
../luta/ (gerar_luta.py).

A geometria é escrita à mão aqui; o script só embrulha cada desenho num SVG
limpo (viewBox 0 0 24 24, currentColor, sem transform, sem texto) e monta o
sprite e a galeria. Não edite os .svg gerados: edite este arquivo e rode

    python -I gerar.py

Os ícones de Lucide (ISC) e Tabler (MIT) entram com o traço trocado para o do
logo e, quando precisou, a geometria ajustada; a origem de cada um está em
FONTES abaixo e em ../CREDITOS.md.
"""
import math, os, sys, json

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(AQUI)  # 02-design/icones

# Traço: o braço do logo do caminho A tinha 120/1024 da arte (o final tem 128 e 160). Na área viva de um
# ícone (~20 de 24) isso dá 2,3; o padrão da casa fica em 2,25.
TRACO = float(os.environ.get('TRACO', '2.25'))
H = TRACO / 2  # meio traço, para desenhar cheios que somam o traço

def n(v):
    s = ('%.2f' % v).rstrip('0').rstrip('.')
    if s == '-0':
        s = '0'
    return s

# ---------------------------------------------------------------- utilitários
def rr(x, y, w, h, r):
    """retângulo arredondado como path (sentido horário)."""
    r = min(r, w / 2, h / 2)
    return ('M%s %sh%sa%s %s 0 0 1 %s %sv%sa%s %s 0 0 1 -%s %sh-%sa%s %s 0 0 1 -%s -%sv-%sa%s %s 0 0 1 %s -%sz' % (
        n(x + r), n(y), n(w - 2 * r), n(r), n(r), n(r), n(r), n(h - 2 * r), n(r), n(r), n(r), n(r),
        n(w - 2 * r), n(r), n(r), n(r), n(r), n(h - 2 * r), n(r), n(r), n(r), n(r))).replace('--', '')

def rot(px, py, cx, cy, ang):
    a = math.radians(ang)
    dx, dy = px - cx, py - cy
    return cx + dx * math.cos(a) - dy * math.sin(a), cy + dx * math.sin(a) + dy * math.cos(a)

def rr_rot(cx, cy, w, h, r, ang, ocx=12, ocy=12):
    """retângulo arredondado centrado em (cx,cy) girado 'ang' graus em volta de (ocx,ocy), sem transform."""
    x0, x1, y0, y1 = cx - w / 2, cx + w / 2, cy - h / 2, cy + h / 2
    pts = [((x0 + r, y0), (x1 - r, y0), (x1, y0 + r)), ((x1, y0 + r), (x1, y1 - r), (x1 - r, y1)),
           ((x1 - r, y1), (x0 + r, y1), (x0, y1 - r)), ((x0, y1 - r), (x0, y0 + r), (x0 + r, y0))]
    d = ''
    for i, (a, b, c) in enumerate(pts):
        A = rot(*a, ocx, ocy, ang); B = rot(*b, ocx, ocy, ang); C = rot(*c, ocx, ocy, ang)
        if i == 0:
            d += 'M%s %s' % (n(A[0]), n(A[1]))
        if (n(A[0]), n(A[1])) != (n(B[0]), n(B[1])):  # lado reto de comprimento zero não entra
            d += 'L%s %s' % (n(B[0]), n(B[1]))
        d += 'A%s %s 0 0 1 %s %s' % (n(r), n(r), n(C[0]), n(C[1]))
    return d + 'z'

def linha(*pts):
    return 'M' + 'L'.join('%s %s' % (n(x), n(y)) for x, y in pts)

P = lambda d: '<path d="%s"/>' % d
C = lambda cx, cy, r: '<circle cx="%s" cy="%s" r="%s"/>' % (n(cx), n(cy), n(r))
F = lambda d: '<path d="%s" fill="currentColor"/>' % d                       # cheio + traço
FO = lambda d: '<path d="%s" fill="currentColor" stroke="none" fill-rule="evenodd"/>' % d  # só cheio
FC = lambda cx, cy, r: '<circle cx="%s" cy="%s" r="%s" fill="currentColor"/>' % (n(cx), n(cy), n(r))

def arco(cx, cy, r, a0, a1):
    """arco no sentido horário de a0 a a1 (graus; 0 = 3h, 90 = 6h)."""
    x0, y0 = cx + r * math.cos(math.radians(a0)), cy + r * math.sin(math.radians(a0))
    x1, y1 = cx + r * math.cos(math.radians(a1)), cy + r * math.sin(math.radians(a1))
    grande = 1 if (a1 - a0) % 360 > 180 else 0
    return 'M%s %sA%s %s 0 %d 1 %s %s' % (n(x0), n(y0), n(r), n(r), grande, n(x1), n(y1))

# ------------------------------------------------------------- desenhos próprios
def anel_cronometro():
    # Assinatura: o anel de progresso do descanso com a coroa do cronômetro.
    return [P(arco(12, 13.5, 7.5, -60, 240)), P('M10 3h4'), P('M12 3v3'), P('M12 13.5l3-3')]

# ------------------------------------------------------------------ o conjunto
# (nome, grupo, contorno, cheio ou None, origem, alteração)
ICONES = []
def ic(nome, grupo, contorno, cheio, origem, alteracao):
    ICONES.append(dict(nome=nome, grupo=grupo, contorno=contorno, cheio=cheio, origem=origem, alteracao=alteracao))

# --- abas
ic('treinos', 'aba',
   [P(rr(4.5, 4, 15, 17.5, 2.5)), P(rr(8.5, 2.25, 7, 3.75, 1.5)), P('M8.5 11h.01'), P('M12 11h3.5'), P('M8.5 16h.01'), P('M12 16h3.5')],
   [FO(rr(4.5 - H, 4 - H, 15 + TRACO, 17.5 + TRACO, 2.5 + H) + rr(8, 9.6, 8, 2.8, 1.4) + rr(8, 15, 8, 2.8, 1.4)),
    '<path d="%s" fill="currentColor"/>' % rr(8.5, 2.25, 7, 3.75, 1.5)],
   'Lucide clipboard-list', 'Traço 2,25; prancheta mais estreita; no cheio, as linhas viram janelas vazadas.')
ic('perfil', 'aba', [C(12, 8, 4), P('M4.5 21a7.5 7.5 0 0 1 15 0')],
   [F('M%s %sa%s %s 0 1 0 %s 0a%s %s 0 1 0 -%s 0z' % (n(8), n(8), 4, 4, 8, 4, 4, 8)), F('M4.5 21a7.5 7.5 0 0 1 15 0z')],
   'Lucide user-round', 'Traço 2,25; cabeça r 4 e ombros r 7,5 para abrir respiro entre eles.')
ic('alunos', 'aba', [C(9.5, 8, 3.75), P('M2.75 21a6.75 6.75 0 0 1 13.5 0'), P('M15.5 4.5a3.75 3.75 0 0 1 0 7'), P('M18.5 15a6.75 6.75 0 0 1 2.75 6')],
   [F('M5.75 8a3.75 3.75 0 1 0 7.5 0a3.75 3.75 0 1 0 -7.5 0z'), F('M2.75 21a6.75 6.75 0 0 1 13.5 0z'), P('M15.5 4.5a3.75 3.75 0 0 1 0 7'), P('M18.5 15a6.75 6.75 0 0 1 2.75 6')],
   'Lucide users-round', 'Traço 2,25; a segunda pessoa fica só em contorno também no cheio, para não virar mancha.')
ic('academia', 'aba',
   [P('M3 8.5 5 3.5h14l2 5'), P('M3 8.5a3 3 0 0 0 6 0a3 3 0 0 0 6 0a3 3 0 0 0 6 0'), P('M5 12.5V21h14v-8.5'), P('M10 21v-4h4v4')],
   [F('M3 8.5 5 3.5h14l2 5a3 3 0 0 1 -6 0a3 3 0 0 1 -6 0a3 3 0 0 1 -6 0z'), F('M5 13.5V21h4.5v-3.5a1.5 1.5 0 0 1 1.5 -1.5h2a1.5 1.5 0 0 1 1.5 1.5V21H19v-7.5z')],
   'Tabler building-store', 'Traço 2,25; toldo com três ondas em vez de quatro; parede começa abaixo do toldo.')

# --- ações
ic('marcar', 'acao', [P('M4.5 12.5l5 5L19.5 7')], None, 'Lucide check', 'Traço 2,25; perna curta mais longa.')
ic('mais', 'acao', [P('M12 5v14'), P('M5 12h14')], None, 'Lucide plus', 'Traço 2,25.')
ic('menos', 'acao', [P('M5 12h14')], None, 'Lucide minus', 'Traço 2,25.')
ic('cronometro', 'acao', anel_cronometro(), None, 'próprio', 'Anel de progresso com coroa: assinatura do descanso.')
ic('pausar', 'acao', [P('M8.5 5v14'), P('M15.5 5v14')], [FO(rr(5, 3.5, 5, 17, 1.75) + rr(14, 3.5, 5, 17, 1.75))], 'Lucide pause', 'Contorno em duas barras de traço; cheio com retângulos.')
ic('comecar', 'acao', [P('M7 5.2v13.6a1 1 0 0 0 1.5.86l11-6.8a1 1 0 0 0 0-1.72l-11-6.8A1 1 0 0 0 7 5.2z')],
   [F('M7 5.2v13.6a1 1 0 0 0 1.5.86l11-6.8a1 1 0 0 0 0-1.72l-11-6.8A1 1 0 0 0 7 5.2z')], 'Lucide play', 'Traço 2,25; triângulo centrado opticamente.')
ic('pular', 'acao', [P('M4.5 6.2v11.6a1 1 0 0 0 1.53.85l9.2-5.8a1 1 0 0 0 0-1.7l-9.2-5.8A1 1 0 0 0 4.5 6.2z'), P('M19.5 5v14')], None, 'Lucide skip-forward', 'Traço 2,25; triângulo menor para abrir o respiro até a barra.')
ic('buscar', 'acao', [C(10.5, 10.5, 6.75), P('M15.5 15.5 20.5 20.5')], None, 'Lucide search', 'Traço 2,25.')
ic('filtro', 'acao', [P('M3.5 6h17'), P('M6.5 12h11'), P('M9.5 18h5')], None, 'Lucide list-filter', 'Traço 2,25; linhas mais curtas.')
ic('voltar', 'acao', [P('M15 5l-7 7 7 7')], None, 'Lucide chevron-left', 'Traço 2,25; chevron maior (14 de altura).')
ic('avancar', 'acao', [P('M9 5l7 7-7 7')], None, 'Lucide chevron-right', 'Traço 2,25; chevron maior.')
ic('menu', 'acao', [FC(5, 12, 1.25), FC(12, 12, 1.25), FC(19, 12, 1.25)], None, 'Lucide ellipsis', 'Pontos cheios com traço: 3,5 de diâmetro.')
ic('fechar', 'acao', [P('M6 6l12 12'), P('M18 6 6 18')], None, 'Lucide x', 'Traço 2,25.')
ic('vibrar', 'acao', [P(rr(8.5, 4.5, 7, 15, 1.5)), P('M2.5 8.5l2 1.75-2 1.75 2 1.75-2 1.75'), P('M21.5 8.5l-2 1.75 2 1.75-2 1.75 2 1.75')], None, 'Lucide vibrate', 'Traço 2,25; celular mais estreito para o zigue-zague respirar.')
ic('sino', 'acao', [P('M6 15.5V10a6 6 0 0 1 12 0v5.5l1.5 2h-15z'), P('M10 21h4')],
   [F('M6 15.5V10a6 6 0 0 1 12 0v5.5l1.5 2h-15z'), P('M10 21h4')], 'Lucide bell', 'Traço 2,25; badalo reto para não grudar no sino.')
ic('prato', 'acao', [P('M4.5 3v5.5a3 3 0 0 0 6 0V3'), P('M7.5 11.5V21'), P('M19.5 14.5V3a4.5 4.5 0 0 0-4.5 4.5v5.5a1.5 1.5 0 0 0 1.5 1.5h3zm0 0V21')], None, 'Lucide utensils', 'Traço 2,25; garfo de dois dentes (o terceiro sumia em 16 px).')
ic('grafico', 'acao', [P('M5.5 20V14'), P('M12 20V4.5'), P('M18.5 20V9.5')], None, 'Lucide chart-no-axes-column', 'Traço 2,25; barras com mais respiro.')
ic('camera', 'acao', [P('M3 9a2 2 0 0 1 2-2h2.5l1.6-2.5h5.8L16.5 7H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'), C(12, 13.25, 3)], None, 'Lucide camera', 'Traço 2,25; lente menor para não encostar no corpo.')
ic('cadeado', 'acao', [P(rr(4.5, 11, 15, 10, 2)), P('M8 11V7.5a4 4 0 0 1 8 0V11')], None, 'Lucide lock', 'Traço 2,25. Só na tela de convite, nunca sobre função "trancada".')
ic('email', 'acao', [P(rr(3, 5, 18, 14, 2)), P('M3.5 7.5 12 13l8.5-5.5')], None, 'Lucide mail', 'Traço 2,25.')
ic('apple', 'marca', ['<path d="M16.37 12.6c-.02-2.2 1.8-3.27 1.88-3.32-1.03-1.5-2.62-1.7-3.18-1.73-1.35-.14-2.64.8-3.33.8-.69 0-1.74-.78-2.86-.76-1.47.02-2.83.86-3.59 2.17-1.53 2.66-.39 6.6 1.1 8.76.73 1.06 1.6 2.24 2.73 2.2 1.1-.04 1.51-.71 2.84-.71 1.32 0 1.7.71 2.86.69 1.18-.02 1.93-1.07 2.65-2.13.84-1.22 1.18-2.41 1.2-2.47-.03-.01-2.3-.88-2.3-3.5zM14.2 6.13c.6-.73 1.01-1.75.9-2.76-.87.04-1.92.58-2.54 1.31-.56.64-1.05 1.67-.92 2.66.97.08 1.96-.49 2.56-1.21z" fill="currentColor" stroke="none"/>'], None,
   'próprio (marca registrada da Apple)', 'Silhueta simplificada só para o mockup. No app, o botão é o nativo (expo-apple-authentication).')
ic('google', 'marca', [P('M18.2 6.6A8.25 8.25 0 1 0 20.25 12H12.5')], None,
   'próprio (marca registrada do Google)', '"G" de traço só para o mockup. No app, o G oficial de quatro cores das diretrizes de marca do Google.')
ic('calendario', 'acao', [P(rr(3.5, 5, 17, 16, 2)), P('M3.5 10h17'), P('M8 2.75v4'), P('M16 2.75v4')], None, 'Lucide calendar', 'Traço 2,25.')

# --- ações que as páginas usavam com desenho provisório (acrescentadas pelo agente Q na junção do P09)
ic('baixo', 'acao', [P('M5 9l7 7 7-7')], None, 'Lucide chevron-down', 'Traço 2,25; chevron maior, como o voltar.')
ic('subir', 'acao', [P('M5 15l7-7 7 7')], None, 'Lucide chevron-up', 'Traço 2,25; chevron maior, como o voltar.')
ic('seta-direita', 'acao', [P('M4.5 12h15'), P('M13 5.5l6.5 6.5-6.5 6.5')], None, 'Lucide arrow-right', 'Traço 2,25; ponta maior. Para "seguir" dentro de botão; o avancar (chevron) fica para linha de lista.')
ic('lista', 'acao', [P('M9 6h11.5'), P('M9 12h11.5'), P('M9 18h11.5'), FC(4.25, 6, 1.25), FC(4.25, 12, 1.25), FC(4.25, 18, 1.25)], None, 'Lucide list', 'Traço 2,25; marcadores em ponto cheio de 3,5 (o ponto de traço sumia em 16 px).')
ic('conversa', 'acao', [P('M7.9 20A9 9 0 1 0 4 16.1L2.5 21.5z')], None, 'Lucide message-circle', 'Traço 2,25; ponta do balão recolhida para dentro da área viva.')
ic('desfazer', 'acao', [P('M9 14 4 9l5-5'), P('M4 9h10.5a5.5 5.5 0 0 1 0 11H11')], None, 'Lucide undo-2', 'Traço 2,25.')
ic('trocar', 'acao', [P('M7 20V4'), P('M3 8l4-4 4 4'), P('M17 4v16'), P('M13 16l4 4 4-4')], None, 'Lucide arrow-up-down', 'Traço 2,25.')
ic('alerta', 'acao', [P('M10.27 4.5a2 2 0 0 1 3.46 0l7.6 13.25A2 2 0 0 1 19.6 20.75H4.4a2 2 0 0 1-1.73-3z'), P('M12 9.5v4'), FC(12, 17, 1.25)], None, 'Lucide triangle-alert', 'Traço 2,25; ponto em círculo cheio.')
ic('alca', 'acao', [FC(9, 6, 1.25), FC(15, 6, 1.25), FC(9, 12, 1.25), FC(15, 12, 1.25), FC(9, 18, 1.25), FC(15, 18, 1.25)], None, 'Lucide grip-vertical', 'Pontos cheios de 3,5, como o menu.')
ic('nuvem', 'acao', [P('M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9z')], None, 'Lucide cloud', 'Traço 2,25.')
ic('olho', 'acao', [P('M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z'), C(12, 12, 3)], None, 'Lucide eye', 'Traço 2,25; contorno simplificado.')
ic('escudo', 'acao', [P('M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z')], None, 'Lucide shield', 'Traço 2,25. Privacidade ("Quem pode ver").')
ic('convite', 'acao', [P('M2.5 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h15a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2h-15a2 2 0 0 0-2 2z'), P('M13 5v2'), P('M13 11v2'), P('M13 17v2')], None, 'Lucide ticket', 'Traço 2,25. Convite ou código de equipe.')
ic('relogio', 'acao', [C(12, 12, 9), P('M12 7v5l3.25 2')], None, 'Lucide clock', 'Traço 2,25. Duração ("50 min"); o descanso usa o cronometro.')
ic('estrela', 'acao', [P('M12 2.75l2.78 5.64 6.22.9-4.5 4.39 1.06 6.2L12 16.95l-5.56 2.93 1.06-6.2L3 9.29l6.22-.9z')], None, 'Lucide star', 'Traço 2,25; pontas retas. Só no exemplo do selo; a aba Plus usa o plus.')

# --- temáticos (academia, treino, alimentação)
ic('corrida', 'tema', [FC(14, 4.5, 2), P('M4 17l5 1 .75-1.5'), P('M15 21v-4l-4-3 1-6'), P('M7 12V9l5-1 3 3 3 1')], None, 'Tabler run', 'Traço 2,25; cabeça cheia.')
ic('alongamento', 'tema', [FC(11, 5.5, 2), P('M6.5 21l3.5-5'), P('M5 11l7-2'), P('M16 21l-4-7V9l7-4')], None, 'Tabler stretching-2', 'Traço 2,25; cabeça cheia.')
ic('balanca', 'tema', [P(rr(3.5, 3.5, 17, 17, 4)), P('M12 8a6 6 0 0 1 4.3 1.8l-2.6 2.6a2.4 2.4 0 0 0-3.4 0L7.7 9.8A6 6 0 0 1 12 8z')], None,
   'Tabler scale-outline', 'Traço 2,25. Só no registro de peso que a pessoa pediu; nunca como tema de tela.')
ic('medida', 'tema', [P('M4 12h16a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1z'), P('M7.5 12v3'), P('M12 12v3'), P('M16.5 12v3'), P('M3 3.5v4'), P('M3 5.5h18'), P('M21 3.5v4')], None,
   'Tabler ruler-measure', 'Traço 2,25; três marcas em vez de cinco.')
ic('frequencia', 'tema', [P('M2.5 9.5a5.25 5.25 0 0 1 9.1-3.6.55.55 0 0 0 .8 0A5.25 5.25 0 0 1 21.5 9.5c0 2.2-1.45 3.85-2.9 5.3l-5.2 5.1a2 2 0 0 1-2.8 0l-5.2-5.1C3.95 13.35 2.5 11.7 2.5 9.5'), P('M6 12.5h3l1.5-2.5 3 5 1.5-2.5h3')], None,
   'Lucide heart-pulse', 'Traço 2,25; pulso mais simples, dentro do coração.')
ic('sequencia', 'tema', [P('M12 3q1 4 4 6.5t3 5.5a7 7 0 0 1-14 0 5 5 0 0 1 1-3 2.5 2.5 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4z')],
   [F('M12 3q1 4 4 6.5t3 5.5a7 7 0 0 1-14 0 5 5 0 0 1 1-3 2.5 2.5 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4z')], 'Lucide flame', 'Traço 2,25. Sequência de dias treinados, nunca "queimar".')
ic('trofeu', 'tema', [P('M7 4h10v5a5 5 0 0 1-10 0z'), P('M7 6.5H4.5v1.5a3 3 0 0 0 3 3'), P('M17 6.5h2.5v1.5a3 3 0 0 1-3 3'), P('M12 14v4'), P('M8 21h8'), P('M9.5 18h5')], None,
   'Lucide trophy', 'Traço 2,25; alças simplificadas. Só conquista pessoal; nunca ranking.')
ic('garrafa', 'tema', [P('M10 2.75h4'), P('M10.25 2.75v2.5c0 1.2-.6 2-1.5 3.2A6 6 0 0 0 7.5 12v7.5a2 2 0 0 0 2 2h5a2 2 0 0 0 2-2V12a6 6 0 0 0-1.25-3.55c-.9-1.2-1.5-2-1.5-3.2v-2.5'), P('M7.5 14.5c1.5-1 3-1 4.5 0s3 1 4.5 0')], None,
   'Tabler bottle', 'Traço 2,25; tampa e onda simplificadas.')
ic('personal', 'tema', [P('M9.5 6.5v3.5'), P('M21 6.5a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-5.7A6.75 6.75 0 1 1 9 6.5z')], None,
   'Lucide whistle', 'Traço 2,25. Apito = personal / instrutor.')
ic('grafico-linha', 'tema', [P('M3.5 3.5V19a1.5 1.5 0 0 0 1.5 1.5h15.5'), P('M7.5 15l4-4.5 3 3 5-6')], None, 'próprio', 'Linha de evolução de carga com eixo, na gramática do Lucide chart-line (não copiado).')

ICONES = [i for i in ICONES if i]

# ------------------------------------------------------------- ilustrações 48
# As 16 ilustrações de exercício de musculação SAÍRAM na virada para a academia
# de luta (P12, agente AM2, a lista do AL em ../luta/CREDITOS.md): o app não
# tem mais catálogo de exercícios. Os ícones de luta moram em ../luta/.
ILUS = []

# ------------------------------------------------------------------ saída
CAB24 = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" '
         'stroke="currentColor" stroke-width="%s" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' % n(TRACO))
CAB48 = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48" fill="none" '
         'stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="%s">')

def escrever(caminho, texto):
    os.makedirs(os.path.dirname(caminho), exist_ok=True)
    with open(caminho, 'w', encoding='utf-8', newline='\n') as f:
        f.write(texto)

def principal(destino=RAIZ):
    simbolos = []
    for i in ICONES:
        corpo = ''.join(i['contorno'])
        escrever(os.path.join(destino, 'contorno', i['nome'] + '.svg'), CAB24 + corpo + '</svg>\n')
        simbolos.append('<symbol id="i-%s" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="%s" stroke-linecap="round" stroke-linejoin="round">%s</symbol>' % (i['nome'], n(TRACO), corpo))
        if i['cheio']:
            corpo = ''.join(i['cheio'])
            escrever(os.path.join(destino, 'cheio', i['nome'] + '.svg'), CAB24 + corpo + '</svg>\n')
            simbolos.append('<symbol id="i-%s-cheio" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="%s" stroke-linecap="round" stroke-linejoin="round">%s</symbol>' % (i['nome'], n(TRACO), corpo))
    for e in ILUS:
        escrever(os.path.join(destino, 'exercicios', e['nome'] + '.svg'), (CAB48 % e['titulo']) + e['corpo'] + '</svg>\n')
        simbolos.append('<symbol id="ex-%s" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">%s</symbol>' % (e['nome'], e['corpo']))
    sprite = ('<svg xmlns="http://www.w3.org/2000/svg" style="display:none">\n<!-- Academia Plus — ícones (i-*, i-*-cheio) e ilustrações de exercício (ex-*). Gerado por fonte/gerar.py; não editar à mão. -->\n'
              + '\n'.join(simbolos) + '\n</svg>\n')
    escrever(os.path.join(destino, 'sprite.svg'), sprite)
    meta = dict(traco=TRACO, icones=[{k: i[k] for k in ('nome', 'grupo', 'origem', 'alteracao')} | {'cheio': bool(i['cheio'])} for i in ICONES],
                ilustracoes=[{k: e[k] for k in ('nome', 'titulo', 'musculo')} for e in ILUS])
    escrever(os.path.join(destino, 'fonte', 'lista.json'), json.dumps(meta, ensure_ascii=False, indent=1))
    # galeria: o sprite vai embutido (file:// não deixa <use> buscar outro arquivo)
    with open(os.path.join(AQUI, 'galeria-modelo.html'), encoding='utf-8') as f:
        modelo = f.read()
    escrever(os.path.join(destino, 'galeria.html'), modelo.replace('<!--SPRITE-->', sprite).replace('/*DADOS*/', 'const DADOS = ' + json.dumps(meta, ensure_ascii=False) + ';'))
    print('ícones:', len(ICONES), 'cheios:', sum(1 for i in ICONES if i['cheio']), 'ilustrações:', len(ILUS), 'traço:', TRACO)

if __name__ == '__main__':
    principal(sys.argv[1] if len(sys.argv) > 1 else RAIZ)
