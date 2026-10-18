# -*- coding: utf-8 -*-
"""
Ícones de luta da Raça Fight (agente AL, P12, 15/10/2026).

Mesma gramática do conjunto do agente R (../fonte/gerar.py): grade 24, traço 2,25, pontas e junções
redondas, currentColor, sem transform e sem texto. Os de biblioteca vêm de Lucide (ISC) e Tabler (MIT),
com a licença em ../licencas/ e a origem de cada um em CREDITOS.md; os que nenhuma biblioteca tem
(luva, faixa, tatame, saco, gongo, kimono, caneleira, cronômetro de round) são desenho próprio.

Uso:  python -I gerar_luta.py   (grava os .svg, o sprite-luta.svg e a galeria.html nesta pasta)
"""
import math, os, json

AQUI = os.path.dirname(os.path.abspath(__file__))
TRACO = 2.25


def n(v):
    s = ('%.2f' % v).rstrip('0').rstrip('.')
    return '0' if s == '-0' else s


def arco(cx, cy, r, a0, a1):
    """arco de a0 a a1 graus (0 = topo, sentido horário) como path."""
    p = lambda a: (cx + r * math.sin(math.radians(a)), cy - r * math.cos(math.radians(a)))
    x0, y0 = p(a0); x1, y1 = p(a1)
    grande = 1 if (a1 - a0) % 360 > 180 else 0
    return 'M%s %sA%s %s 0 %d 1 %s %s' % (n(x0), n(y0), n(r), n(r), grande, n(x1), n(y1))


# nome: (origem, alteração, [traços], [cheios]); traço = path com stroke; cheio = path preenchido (fill currentColor)
ICONES = {
    # ---- abas e navegação
    'inicio': ('Lucide house', 'Traço 2,25. Substitui o haltere da aba Início (musculação).',
               ['M15 21v-7.5a1 1 0 0 0 -1 -1h-4a1 1 0 0 0 -1 1V21',
                'M3 10a2 2 0 0 1 .71 -1.53l7 -6a2 2 0 0 1 2.58 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1 -2 2H5a2 2 0 0 1 -2 -2z'], []),
    'inicio-cheio': ('Lucide house (cheio próprio)', 'A casa cheia com a porta vazada (regra evenodd), para a aba ativa.',
                     [], ['M3 10a2 2 0 0 1 .71 -1.53l7 -6a2 2 0 0 1 2.58 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1 -2 2H5a2 2 0 0 1 -2 -2zM10 14v6h4v-6z']),
    'horarios': ('Lucide calendar-clock', 'Traço 2,25; o relógio um pouco menor (r 5,5) para não encostar na borda.',
                 ['M21 7.5V6a2 2 0 0 0 -2 -2H5a2 2 0 0 0 -2 2v14a2 2 0 0 0 2 2h3.5', 'M16 2v4', 'M8 2v4', 'M3 10h5',
                  'M17.5 17.5 16 16.3V14', 'M10.5 16a5.5 5.5 0 1 0 11 0a5.5 5.5 0 1 0 -11 0'], []),
    'horarios-cheio': ('Lucide calendar-clock (cheio próprio)', 'Calendário em contorno e o relógio cheio, com os ponteiros vazados.',
                       ['M21 7.5V6a2 2 0 0 0 -2 -2H5a2 2 0 0 0 -2 2v14a2 2 0 0 0 2 2h3.5', 'M16 2v4', 'M8 2v4', 'M3 10h5'],
                       ['M9.4 16a6.6 6.6 0 1 0 13.2 0a6.6 6.6 0 1 0 -13.2 0zM15.1 13.2v3.6l2.6 2 .9 -1.2 -2.1 -1.6v-2.8z']),
    'hoje': ('Lucide clock', 'Traço 2,25. Aba Hoje do professor (a aula da hora).',
             ['M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0', 'M12 7v5l3 2'], []),
    'hoje-cheio': ('Lucide clock (cheio próprio)', 'Círculo cheio com os ponteiros vazados.',
                   [], ['M1.9 12a10.1 10.1 0 1 0 20.2 0a10.1 10.1 0 1 0 -20.2 0zM10.9 6.5v6.1l3.6 2.4 1.2 -1.9 -2.6 -1.7V6.5z']),
    'check-in': ('Lucide calendar-check', 'Traço 2,25. "Estou na aula" e a presença confirmada.',
                 ['M8 2v4', 'M16 2v4', 'M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2H5a2 2 0 0 1 -2 -2V6a2 2 0 0 1 2 -2z', 'M3 10h18', 'm9 16 2 2 4 -4'], []),
    'modalidade': ('Tabler karate', 'Traço 2,25; a cabeça com r 1,25 para não sumir em 16 px.',
                   ['M16.75 4a1.25 1.25 0 1 0 2.5 0a1.25 1.25 0 1 0 -2.5 0', 'M3 9l4.5 1l3 2.5', 'M13 21v-8l3 -5.5', 'M8 4.5l4 2l4 1l4 3.5l-2 3.5'], []),
    # ---- desenho próprio (nenhuma biblioteca com licença livre tem)
    'luva': ('próprio', 'Luva de boxe de lado: a mão fechada, o polegar colado e o punho com a faixa de velcro.',
             ['M8.5 3h4.5a6 6 0 0 1 6 6v3.5a4.5 4.5 0 0 1 -4.5 4.5H8.5a3.5 3.5 0 0 1 -3.5 -3.5V6.5a3.5 3.5 0 0 1 3.5 -3.5z',
              'M5 11.5h3.5a2 2 0 0 0 2 -2V8', 'M7.5 17v2.5a1.5 1.5 0 0 0 1.5 1.5h6a1.5 1.5 0 0 0 1.5 -1.5V17'], []),
    'faixa': ('próprio', 'Faixa amarrada de frente: a volta na cintura, o nó e as duas pontas. É também a aba Graduação.',
              ['M2.5 8h7', 'M14.5 8h7', 'M2.5 12h7', 'M14.5 12h7', 'M11 6h2a1.5 1.5 0 0 1 1.5 1.5v5a1.5 1.5 0 0 1 -1.5 1.5h-2a1.5 1.5 0 0 1 -1.5 -1.5v-5A1.5 1.5 0 0 1 11 6z',
               'M10.5 14l-2.5 7', 'M13.5 14l2.5 7'], []),
    'faixa-cheio': ('próprio', 'A faixa com o nó cheio, para a aba Graduação ativa.',
                    ['M2.5 8h7', 'M14.5 8h7', 'M2.5 12h7', 'M14.5 12h7', 'M10.5 14l-2.5 7', 'M13.5 14l2.5 7'],
                    ['M11 4.9h2a2.6 2.6 0 0 1 2.6 2.6v5a2.6 2.6 0 0 1 -2.6 2.6h-2a2.6 2.6 0 0 1 -2.6 -2.6v-5A2.6 2.6 0 0 1 11 4.9z']),
    'tatame': ('próprio', 'Tatame em perspectiva com as placas (2 × 3).',
               ['M6 7.5h15l-3 11H3z', 'M11 7.5l-3 11', 'M16 7.5l-3 11', 'M4.5 13h15'], []),
    'saco': ('próprio', 'Saco de pancada pendurado: corrente em V, o saco em cápsula e as duas costuras.',
             ['M12 2.5v2', 'M8.5 7.5 12 4.5l3.5 3', 'M11 7.5h2a4 4 0 0 1 4 4v6a4 4 0 0 1 -4 4h-2a4 4 0 0 1 -4 -4v-6a4 4 0 0 1 4 -4z',
              'M7 11.5h10', 'M7 17.5h10'], []),
    'cronometro-round': ('próprio, a partir do Tabler stopwatch (MIT)', 'O cronômetro com o mostrador em 3 rounds (3 arcos com vão) e o ponteiro. Atalho do Cronômetro de rounds.',
                         [arco(12, 13.5, 7.5, 12, 108), arco(12, 13.5, 7.5, 132, 228), arco(12, 13.5, 7.5, 252, 348),
                          'M10 2.5h4', 'M12 2.5v3.5', 'M12 13.5l2.5 -2.5'], []),
    'gongo': ('próprio', 'Gongo na moldura: o disco pendurado por dois fios, o miolo e os pés.',
              ['M4.5 21V4h15v17', 'M3 21h3', 'M18 21h3', 'M9.5 4l1 3.5', 'M14.5 4l-1 3.5', 'M7 13a5 5 0 1 0 10 0a5 5 0 1 0 -10 0', 'M12 13h.01'], []),
    'kimono': ('próprio', 'Kimono (gi) de frente: ombros, mangas, a gola cruzada e a faixa.',
               ['M8.5 3.5 3.5 6.5l1.5 5.5 2.5 -1v10.5h9V11l2.5 1 1.5 -5.5 -5 -3', 'M8.5 3.5 12 9l3.5 -5.5', 'M12 9l-3.5 6', 'M7.5 15h9'], []),
    'caneleira': ('próprio', 'Caneleira de Muay Thai: a placa da canela, as duas tiras e o peito do pé.',
                  ['M8 3.5h8v9.5a5 5 0 0 1 -1.6 3.7L13.5 17.5h-3l-.9 -.8A5 5 0 0 1 8 13z', 'M8 7.5h8', 'M8 11.5h8', 'M10.5 17.5v3h3v-3'], []),
}


def svg_de(tracos, cheios):
    corpo = ''.join('<path d="%s"/>' % d for d in tracos)
    corpo += ''.join('<path d="%s" fill="currentColor" stroke="none" fill-rule="evenodd"/>' % d for d in cheios)
    return corpo


cab = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="%s" stroke-linecap="round" stroke-linejoin="round">' % n(TRACO)
simbolos = []
for nome, (origem, alt, tracos, cheios) in ICONES.items():
    corpo = svg_de(tracos, cheios)
    with open(os.path.join(AQUI, nome + '.svg'), 'w', encoding='utf-8', newline='\n') as f:
        f.write(cab + corpo + '</svg>\n')
    simbolos.append('<symbol id="i-%s" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="%s" stroke-linecap="round" stroke-linejoin="round">%s</symbol>' % (nome, n(TRACO), corpo))

with open(os.path.join(AQUI, 'sprite-luta.svg'), 'w', encoding='utf-8', newline='\n') as f:
    f.write('<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute" aria-hidden="true">\n' + '\n'.join(simbolos) + '\n</svg>\n')

with open(os.path.join(AQUI, 'lista-luta.json'), 'w', encoding='utf-8') as f:
    json.dump({'traco': TRACO, 'icones': [{'nome': k, 'origem': v[0], 'alteracao': v[1]} for k, v in ICONES.items()]}, f, ensure_ascii=False, indent=1)

# galeria: 16, 24 e 32 px, claro e escuro
cel = ''.join('<figure><div class="t">%s</div><figcaption><b>%s</b><span>%s</span></figcaption></figure>' % (
    ''.join('<svg width="%d" height="%d"><use href="#i-%s"/></svg>' % (s, s, k) for s in (16, 24, 32)), k, v[0]) for k, v in ICONES.items())
html = '''<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Ícones de luta</title><style>
:root{--f:#F5F5F5;--s:#FFFFFF;--t:#1C1C1C;--t2:#545454;--m:#C42024}
@media (prefers-color-scheme:dark){:root{--f:#141414;--s:#1C1C1C;--t:#F5F5F5;--t2:#ADADAD;--m:#FF6B6B}}
body{margin:0;padding:16px;background:var(--f);color:var(--t);font:16px/24px system-ui,sans-serif}
h1{font-size:25px;line-height:32px;margin:0 0 4px}p{color:var(--t2);margin:0 0 16px;max-width:70ch}
.g{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px}
figure{margin:0;background:var(--s);border-radius:16px;padding:16px;display:grid;gap:8px}
.t{display:flex;align-items:end;gap:16px;color:var(--t)}.t svg:last-child{color:var(--m)}
figcaption{display:grid}figcaption span{font-size:13px;line-height:20px;color:var(--t2)}
</style></head><body>
''' + open(os.path.join(AQUI, 'sprite-luta.svg'), encoding='utf-8').read() + '''
<h1>Ícones de luta (Raça Fight)</h1><p>Grade 24, traço 2,25, pontas redondas, em 16, 24 e 32 px (o de 32 na cor da marca). Origem e licença em CREDITOS.md. Gerados por gerar_luta.py.</p>
<div class="g">''' + cel + '</div></body></html>\n'
with open(os.path.join(AQUI, 'galeria.html'), 'w', encoding='utf-8', newline='\n') as f:
    f.write(html)
print(len(ICONES), 'ícones')
