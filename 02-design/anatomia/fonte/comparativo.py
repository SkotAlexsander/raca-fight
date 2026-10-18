"""Gera 02-design/anatomia/comparativo.html (abre por file://).

    python -I comparativo.py        (depois do gerar.py)

A (mapa em vetor) e B (imagem de IA, de ../ia/<caso>.jpg, se existir) lado a
lado, nos tamanhos de uso, nos dois temas e dentro da linha do app.
"""
import html
import json
import pathlib
import sys

AQUI = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(AQUI))
import gerar as g  # noqa: E402

RAIZ = AQUI.parent
ICONES = RAIZ.parent / 'icones' / 'exercicios'

V = g.carregar_base()
MAPA = json.loads((AQUI / 'musculos-por-exercicio.json').read_text(encoding='utf8'))['exercicios']
CAT = {e['id']: e for e in json.loads(g.CATALOGO.read_text(encoding='utf8'))['exercicios']}
RESUMO = json.loads((RAIZ / 'dados' / 'resumo-exercicios.json').read_text(encoding='utf8'))
CONTRASTE = json.loads((RAIZ / 'dados' / 'contraste.json').read_text(encoding='utf8'))
NOME_GRUPO = {'peito': 'Peito', 'costas': 'Costas', 'ombros': 'Ombros', 'biceps': 'Bíceps', 'triceps': 'Tríceps',
              'pernas': 'Pernas', 'gluteos': 'Glúteos', 'abdomen': 'Abdômen', 'cardio': 'Cardio', 'corpo_inteiro': 'Corpo inteiro'}


def sprite():
    defs = []
    for q, v in V.items():
        defs.append(f'<path id="am-corpo-{q}" d="{v["corpo"]}"/>')
        defs.append(f'<path id="am-linhas-{q}" d="{v["linhas"]}"/>')
        for n, (_, d) in enumerate(v['camadas']):
            defs.append(f'<path id="am-{q}-{n}" d="{d}"/>')
    return '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>' + ''.join(defs) + '</defs></svg>'


def mapa(quais, estado, zona='inteiro', detalhe=False, altura=None, largura=None, rotulo=''):
    vao = 36
    caixas = [g.recorte(V[q], zona) for q in quais]
    W = sum(c[2] for c in caixas) + vao * (len(quais) - 1)
    H = max(c[3] for c in caixas)
    tam = ''
    if altura:
        tam = f' height="{altura}" width="{round(altura * W / H, 1)}"'
    elif largura:
        tam = f' width="{largura}" height="{round(largura * H / W, 1)}"'
    filhos, x = [], 0
    sw = g.ESPESSURA_SILHUETA
    for q, c in zip(quais, caixas):
        v = V[q]
        p = [f'<use href="#am-corpo-{q}" class="am-borda" stroke-width="{sw + 2 * g.CONTORNO}" stroke-linejoin="round"/>',
             f'<use href="#am-corpo-{q}" class="am-corpo" stroke-width="{sw}" stroke-linejoin="round"/>']
        for n, (reg, _) in enumerate(v['camadas']):
            e = estado.get(reg)
            if e:
                p.append(f'<use href="#am-{q}-{n}" class="am-{e}"/>')
            elif g._cobre(reg, estado, v):
                p.append(f'<use href="#am-{q}-{n}" class="am-corpo" stroke-width="0"/>')
        if detalhe:
            p.append(f'<use href="#am-linhas-{q}" class="am-linha" stroke-width="{g.LINHA}" stroke-linejoin="round"/>')
        vb = ' '.join(str(round(n)) for n in c)
        filhos.append(f'<svg x="{round(x)}" y="0" width="{round(c[2])}" height="{round(c[3])}" viewBox="{vb}">{"".join(p)}</svg>')
        x += c[2] + vao
    aria = f' role="img" aria-label="{html.escape(rotulo)}"' if rotulo else ' aria-hidden="true"'
    return f'<svg viewBox="0 0 {round(W)} {round(H)}"{tam}{aria}>{"".join(filhos)}</svg>'


def do_exercicio(i, **kw):
    m = MAPA[i]
    r = RESUMO[i]
    return mapa(r['vistas'], g.estado_das_regioes(m['principal'], m['secundarios']), r['zona'], **kw)


def ladrilho(conteudo, tam, cls=''):
    return f'<span class="ladrilho {cls}" style="width:{tam}px;height:{tam}px">{conteudo}</span>'


def mini_a(i, tam):
    r = RESUMO[i]
    # a figura cabe no ladrilho com 3 px de folga
    caixas = [g.recorte(V[q], r['zona']) for q in r['vistas']]
    W = sum(c[2] for c in caixas) + 36 * (len(caixas) - 1)
    H = max(c[3] for c in caixas)
    util = tam - 6
    kw = {'largura': util} if W / H >= 1 else {'altura': util}
    return ladrilho(do_exercicio(i, **kw), tam)


def mini_b(caso, tam):
    return ladrilho(f'<img src="ia/{caso}.jpg" alt="" loading="lazy" onerror="this.parentNode.classList.add(\'vazio\');this.remove()">', tam, 'b')


def hoje(i):
    nome = CAT[i]['ilustracao']
    if not nome:
        return '<span class="ladrilho hoje" style="width:56px;height:56px"><span class="sem">sem desenho</span></span>'
    s = (ICONES / f'{nome}.svg').read_text(encoding='utf8')
    s = s.replace('width="48" height="48"', 'width="56" height="56"')
    return f'<span class="ladrilho hoje" style="width:56px;height:56px">{s}</span>'


def linha(icone, titulo, apoio):
    return (f'<div class="linha">{icone}<span class="linha__texto"><span class="linha__titulo">{html.escape(titulo)}</span>'
            f'<span class="linha__apoio">{html.escape(apoio)}</span></span><span class="seta" aria-hidden="true">›</span></div>')


CASOS = [  # caso da IA, exercício que mostra o mesmo músculo, rótulo
    ('peitoral', 'supino-reto', 'Peitoral'),
    ('grande-dorsal', 'puxada-frontal', 'Grande dorsal'),
    ('quadriceps', 'cadeira-extensora', 'Quadríceps'),
    ('gluteos', 'elevacao-pelvica', 'Glúteos'),
    ('biceps', 'rosca-com-halteres', 'Bíceps'),
    ('deltoide', 'elevacao-lateral', 'Deltoide'),
]


def bloco_caso(caso, ex, rotulo, tema):
    nome = CAT[ex]['nome']
    grupo = NOME_GRUPO[CAT[ex]['grupoMuscular']]
    a = (f'<div class="lado"><p class="lado__t">A · vetor</p>'
         f'<div class="minis">{mini_a(ex, 48)}{mini_a(ex, 56)}{mini_a(ex, 64)}</div>'
         f'<div class="cartao">{linha(mini_a(ex, 56), nome, f"{grupo} · 3 × 10")}</div>'
         f'<div class="detalhe">{mapa(["frente", "costas"], g.estado_das_regioes(MAPA[ex]["principal"], MAPA[ex]["secundarios"]), "inteiro", True, altura=220, rotulo=nome)}</div></div>')
    b = (f'<div class="lado"><p class="lado__t">B · IA</p>'
         f'<div class="minis">{mini_b(caso, 48)}{mini_b(caso, 56)}{mini_b(caso, 64)}</div>'
         f'<div class="cartao">{linha(mini_b(caso, 56), nome, f"{grupo} · 3 × 10")}</div>'
         f'<div class="detalhe"><span class="grande b"><img src="ia/{caso}.jpg" alt="" loading="lazy" onerror="this.parentNode.classList.add(\'vazio\');this.remove()"></span></div></div>')
    return f'<div class="caso"><h4>{rotulo} <span>· {html.escape(nome)}</span></h4><div class="ab">{a}{b}</div></div>'


def painel(tema, corpo):
    return f'<div class="painel tema-{tema}"><p class="painel__t">{"Claro" if tema == "claro" else "Escuro"}</p>{corpo}</div>'


def secao_casos():
    out = []
    for tema in ('claro', 'escuro'):
        out.append(painel(tema, ''.join(bloco_caso(c, e, r, tema) for c, e, r in CASOS)))
    return '<div class="dois">' + ''.join(out) + '</div>'


def secao_contexto():
    treino = ['supino-reto', 'supino-inclinado-com-halteres', 'crucifixo-na-maquina', 'triceps-corda']
    paineis = []
    for tema in ('claro', 'escuro'):
        hoje_l = ''.join(linha(hoje(i), CAT[i]['nome'], f'{NOME_GRUPO[CAT[i]["grupoMuscular"]]} · 3 × 10') for i in treino)
        a_l = ''.join(linha(mini_a(i, 56), CAT[i]['nome'], f'{NOME_GRUPO[CAT[i]["grupoMuscular"]]} · 3 × 10') for i in treino)
        palco = (f'<div class="palco">{mini_a("supino-reto", 64)}<span><span class="linha__titulo">Supino reto</span>'
                 f'<span class="linha__apoio">Peito · 15 kg</span></span></div>')
        corpo = (f'<div class="ab"><div class="lado"><p class="lado__t">Hoje (boneco do agente R)</p><div class="cartao">{hoje_l}</div></div>'
                 f'<div class="lado"><p class="lado__t">A · mapa muscular</p><div class="cartao">{a_l}</div>'
                 f'<p class="lado__t">Modo treino</p><div class="cartao">{palco}</div></div></div>')
        paineis.append(painel(tema, corpo))
    return '<div class="dois">' + ''.join(paineis) + '</div>'


def secao_filtros_e_evolucao():
    grupos = ['peito', 'costas', 'ombros', 'biceps', 'triceps', 'pernas', 'gluteos', 'abdomen']
    dados = json.loads((RAIZ / 'dados' / 'mapa-muscular.json').read_text(encoding='utf8'))['grupos']
    volume = [('Pernas', 'pernas', 4820), ('Costas', 'costas', 3150), ('Peito', 'peito', 2400), ('Ombros e braços', 'ombros', 1310)]
    paineis = []
    for tema in ('claro', 'escuro'):
        chips = []
        for gr in grupos:
            d = dados[gr]
            est = {r: 'p' for r in g.regioes_de(d['musculos'])}
            chips.append(f'<span class="chip{" chip--sel" if gr == "costas" else ""}">{mapa(d["vistas"], est, d["zona"], altura=24)}{NOME_GRUPO[gr]}</span>')
        chips.append('<span class="chip">Cardio</span>')
        # Evolução: o grupo de mais volume em vermelho, os outros com volume em vermelho claro
        est = {}
        for n, (_, gr, _) in enumerate(volume):
            regs = g.regioes_de(g.GRUPOS[gr] + (['biceps', 'triceps'] if gr == 'ombros' else []) + (['gluteos'] if gr == 'pernas' else []))
            for r in regs:
                est.setdefault(r, 'p' if n == 0 else 's')
        lista = ''.join(f'<li><span class="pt {"pt--p" if n == 0 else "pt--s"}"></span>{nome}<b>{kg:,} kg</b></li>'.replace(',', '.')
                        for n, (nome, _, kg) in enumerate(volume))
        evol = (f'<div class="cartao evol"><p class="linha__titulo">Volume por grupo · 4 sem.</p>'
                f'<div class="evol__in">{mapa(["frente", "costas"], est, "inteiro", True, altura=170, rotulo="Volume por grupo nas últimas 4 semanas")}'
                f'<ul>{lista}</ul></div></div>')
        corpo = (f'<p class="lado__t">Filtro da escolha de exercício (mini corpo de 24 px)</p><div class="chips">{"".join(chips)}</div>'
                 f'<p class="lado__t">Evolução: a rosca vira o corpo pintado</p>{evol}')
        paineis.append(painel(tema, corpo))
    return '<div class="dois">' + ''.join(paineis) + '</div>'


def secao_todos():
    paineis = []
    for tema in ('claro', 'escuro'):
        itens = ''.join(f'<figure>{mini_a(i, 56)}<figcaption>{html.escape(CAT[i]["nome"])}</figcaption></figure>' for i in CAT)
        paineis.append(painel(tema, f'<div class="grade">{itens}</div>'))
    return '<div class="dois">' + ''.join(paineis) + '</div>'


def tabela_contraste():
    linhas = []
    for tema in ('claro', 'escuro'):
        for k, v in CONTRASTE[tema].items():
            ok = '' if not (k.startswith('principal/') and 'secundario' not in k) else (' ✔' if v >= 3 else ' ✘')
            linhas.append(f'<tr><td>{tema}</td><td>{k}</td><td>{v}:1{ok}</td></tr>')
    for k, v in CONTRASTE['pedido-original'].items():
        linhas.append(f'<tr><td>pedido</td><td>{k}</td><td>{v}:1</td></tr>')
    return '<table><thead><tr><th>Tema</th><th>Par</th><th>Contraste</th></tr></thead><tbody>' + ''.join(linhas) + '</tbody></table>'


def css():
    c, e = g.CORES['claro'], g.CORES['escuro']
    return f"""
@font-face{{font-family:Figtree;font-weight:400;src:url("../sistema-de-design/mockups/fontes/figtree-latin-400-normal.woff2") format("woff2")}}
@font-face{{font-family:Figtree;font-weight:600;src:url("../sistema-de-design/mockups/fontes/figtree-latin-600-normal.woff2") format("woff2")}}
@font-face{{font-family:Archivo;font-weight:800;src:url("../sistema-de-design/mockups/fontes/archivo-latin-800-normal.woff2") format("woff2")}}
:root{{--pg-fundo:#F4F8F7;--pg-texto:#131D1C;--pg-sec:#4A5958;--pg-borda:#D0DAD9;--pg-sup:#FFFFFF;color-scheme:light}}
@media (prefers-color-scheme:dark){{:root:not([data-theme="light"]){{--pg-fundo:#070C0C;--pg-texto:#E9F2F1;--pg-sec:#A3B1B0;--pg-borda:#2A3433;--pg-sup:#121A19;color-scheme:dark}}}}
:root[data-theme="dark"]{{--pg-fundo:#070C0C;--pg-texto:#E9F2F1;--pg-sec:#A3B1B0;--pg-borda:#2A3433;--pg-sup:#121A19;color-scheme:dark}}
*{{box-sizing:border-box}}
body{{margin:0;background:var(--pg-fundo);color:var(--pg-texto);font:16px/1.5 Figtree,system-ui,sans-serif}}
main{{max-width:1500px;margin:0 auto;padding:24px 16px 64px}}
h1{{font:800 2rem/1.15 Archivo,Figtree,sans-serif;margin:0 0 8px}}
h2{{font:800 1.35rem/1.2 Archivo,Figtree,sans-serif;margin:40px 0 8px}}
h4{{margin:0 0 8px;font-size:1rem}} h4 span{{font-weight:400;color:var(--t2)}}
p{{max-width:72ch}} .sec{{color:var(--pg-sec)}}
.resumo{{background:var(--pg-sup);border:1px solid var(--pg-borda);border-radius:16px;padding:16px 20px;max-width:900px}}
.resumo li{{margin:4px 0}}
.dois{{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,640px),1fr));gap:16px}}
.painel{{border-radius:16px;padding:16px;background:var(--fundo);color:var(--t);border:1px solid var(--pg-borda)}}
.painel__t{{margin:0 0 12px;font-weight:600;color:var(--t2)}}
.tema-claro{{--fundo:#F4F8F7;--sup:#FFFFFF;--t:#131D1C;--t2:#4A5958;--borda:#D0DAD9;--lad:#E6F1EF;--marca:#007761;--ilustracao-destaque:#007761;
  --am-corpo:{c['corpo']};--am-contorno:{c['contorno']};--am-principal:{c['principal']};--am-secundario:{c['secundario']};color-scheme:light}}
.tema-escuro{{--fundo:#070C0C;--sup:#121A19;--t:#E9F2F1;--t2:#A3B1B0;--borda:#2A3433;--lad:#222D2C;--marca:#39F0CD;--ilustracao-destaque:#39F0CD;
  --am-corpo:{e['corpo']};--am-contorno:{e['contorno']};--am-principal:{e['principal']};--am-secundario:{e['secundario']};color-scheme:dark}}
.am-corpo{{fill:var(--am-corpo);stroke:var(--am-corpo)}} .am-borda{{fill:var(--am-contorno);stroke:var(--am-contorno)}}
.am-linha{{fill:none;stroke:var(--am-contorno);stroke-opacity:.6}} .am-p{{fill:var(--am-principal)}} .am-s{{fill:var(--am-secundario)}}
.caso{{padding:12px 0;border-top:1px solid var(--borda)}} .caso:first-of-type{{border-top:0}}
.ab{{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr));gap:16px}}
.lado__t{{margin:4px 0 8px;font-size:13px;font-weight:600;color:var(--t2);letter-spacing:.01em}}
.minis{{display:flex;gap:10px;align-items:flex-end;margin-bottom:10px}}
.ladrilho{{display:inline-flex;align-items:center;justify-content:center;border-radius:12px;background:var(--lad);overflow:hidden;flex:none;color:var(--t)}}
.ladrilho.b img{{width:100%;height:100%;object-fit:cover;display:block}}
.ladrilho.vazio,.grande.vazio{{background:repeating-linear-gradient(45deg,var(--lad),var(--lad) 6px,transparent 6px,transparent 12px);outline:1px dashed var(--t2);outline-offset:-1px}}
.grande{{display:flex;width:220px;height:220px;border-radius:16px;background:var(--lad);overflow:hidden}}
.grande img{{width:100%;height:100%;object-fit:contain}}
.grande.vazio::after{{content:"sem imagem: o token do .env não tem Workers AI";margin:auto;padding:16px;text-align:center;font-size:13px;color:var(--t2)}}
.detalhe{{margin-top:10px;display:flex;justify-content:flex-start}}
.cartao{{background:var(--sup);border-radius:16px;box-shadow:0 1px 2px rgba(0,0,0,.08),0 4px 12px rgba(0,0,0,.06);overflow:hidden}}
.tema-escuro .cartao{{box-shadow:none;border:1px solid var(--borda)}}
.linha{{display:flex;align-items:center;gap:12px;min-height:72px;padding:8px 16px}}
.linha+.linha{{border-top:1px solid var(--borda)}}
.linha__texto{{display:flex;flex-direction:column;flex:1;min-width:0}}
.linha__titulo{{font-weight:600;font-size:17px;line-height:22px;display:block}}
.linha__apoio{{font-size:13px;line-height:18px;color:var(--t2);display:block}}
.seta{{color:var(--t2);font-size:22px}}
.hoje svg{{color:var(--t)}} .sem{{font-size:11px;color:var(--t2);text-align:center}}
.palco{{display:flex;align-items:center;gap:12px;padding:12px 16px}}
.chips{{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px}}
.chip{{display:inline-flex;align-items:center;gap:6px;height:40px;padding:0 14px 0 8px;border-radius:999px;border:1px solid var(--borda);background:var(--sup);font-size:15px}}
.chip--sel{{border-color:var(--marca);box-shadow:inset 0 0 0 1px var(--marca)}}
.evol{{padding:16px}} .evol__in{{display:flex;gap:20px;align-items:center;flex-wrap:wrap}}
.evol ul{{list-style:none;margin:0;padding:0;display:grid;gap:6px;min-width:200px}}
.evol li{{display:flex;align-items:center;gap:8px}} .evol li b{{margin-left:auto;font-variant-numeric:tabular-nums}}
.pt{{width:12px;height:12px;border-radius:3px;flex:none}} .pt--p{{background:var(--am-principal)}} .pt--s{{background:var(--am-secundario)}}
.grade{{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:12px}}
figure{{margin:0;display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center}}
figcaption{{font-size:12px;line-height:15px;color:var(--t2)}}
table{{border-collapse:collapse;font-size:14px}} td,th{{border-bottom:1px solid var(--pg-borda);padding:4px 12px 4px 0;text-align:left}}
code{{font-size:.9em}}
@media (max-width:480px){{h1{{font-size:1.6rem}} .grande{{width:100%;max-width:220px}}}}
"""


def main():
    ia = sorted(p.name for p in (RAIZ / 'ia').glob('*.jpg')) if (RAIZ / 'ia').exists() else []
    estado_b = (f'{len(ia)} imagens em <code>ia/</code>.' if ia else
                'Não gerou. O token do <code>A:\\Claude\\.env</code> está ativo, mas sem permissão de Workers AI: '
                '<code>403</code> em <code>/ai/models/search</code> e <code>401 Authentication error</code> em '
                '<code>/ai/run/@cf/black-forest-labs/flux-1-schnell</code>. Os quadros listrados abaixo são os lugares onde a imagem entraria. '
                'Com o token liberado, <code>python -I fonte/testar-ia.py gerar @cf/black-forest-labs/flux-1-schnell ia</code> preenche esta página sozinho.')
    pagina = f"""<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Mapa muscular: A × B</title><style>{css()}</style></head>
<body>{sprite()}<main>
<h1>Mapa muscular: vetor (A) × IA (B)</h1>
<p class="sec">Agente AD, 11/10/2026. Pedido do Alex: "uma demonstração do corpo em cinza e o músculo em vermelho" em todo lugar onde aparece músculo. Gerado por <code>fonte/comparativo.py</code>; não edite à mão.</p>
<div class="resumo">
<p><b>Recomendação: A em todos os tamanhos.</b> B fica em aberto até o token ter Workers AI, e mesmo então só para imagem grande de detalhe, se acertar a anatomia nos seis casos.</p>
<ul>
<li><b>A</b>: o mesmo corpo nas 28 miniaturas, o músculo exato (paths do MuscleMap, MIT) e os músculos de cada exercício conferidos no ExRx.net. Pesa ~100 KB de dados para o app inteiro e troca de tema só pela cor.</li>
<li><b>B</b>: {estado_b}</li>
<li><b>Cores</b>: o par do pedido (<code>#E5484D</code> sobre <code>#9AA3A7</code>) dá 1,52:1 e não passa nos 3:1. Ficou o corpo <code>{g.CORES['claro']['corpo']}</code> com o músculo <code>{g.CORES['claro']['principal']}</code> (3,45:1) no claro, e <code>{g.CORES['escuro']['corpo']}</code> com <code>{g.CORES['escuro']['principal']}</code> (3,46:1) no escuro. O <code>#9AA3A7</code> virou a borda do corpo.</li>
<li><b>Miniatura</b>: recortada na metade que importa (tronco ou pernas). O corpo inteiro em 48 px deixava o bíceps com 3 px.</li>
</ul></div>

<h2>1. Os seis casos, nos tamanhos de uso</h2>
<p class="sec">Ladrilho de 48, 56 e 64, a linha da lista (72 de altura, ladrilho de 56) e o detalhe grande (frente e costas, com as divisões dos músculos). Vermelho forte é o músculo principal; vermelho claro (no escuro, vermelho fundo) são os que ajudam.</p>
{secao_casos()}

<h2>2. No contexto do app: hoje × A</h2>
<p class="sec">Treino A, peito e tríceps, como está na lista do treino, e o palco do modo treino ("Peito · 15 kg").</p>
{secao_contexto()}

<h2>3. Filtros e Evolução</h2>
<p class="sec">O chip do filtro ganha um mini corpo de 24 px. Cardio não é músculo e fica só com o texto ou o ícone <code>frequencia</code>. Na Evolução, o corpo mostra onde foi o volume: o grupo de mais volume em vermelho, os outros que treinaram em vermelho claro, os sem volume em cinza. O número continua escrito ao lado, porque a cor nunca é a única informação.</p>
{secao_filtros_e_evolucao()}

<h2>4. Os 28 exercícios do catálogo (A, 56 px)</h2>
{secao_todos()}

<h2>5. Contraste medido</h2>
<p class="sec">WCAG 2.x, luminância relativa. O mínimo para gráfico é 3:1 (1.4.11). O corpo contra o fundo fica abaixo de 3:1 de propósito, porque é contexto e não informação; a borda <code>contorno</code> ajuda a ver a silhueta.</p>
{tabela_contraste()}
</main></body></html>
"""
    (RAIZ / 'comparativo.html').write_text(pagina, encoding='utf8')
    print('comparativo.html', len(pagina) // 1024, 'KB')


if __name__ == '__main__':
    main()
