# -*- coding: utf-8 -*-
"""
Fotos da Raça Fight otimizadas por uso (agente AL, P12, 15/10/2026).

Fonte: 02-design/referencias/raca-fight/fotos/raca-NN.jpg (o perfil do Instagram; a academia autorizou o uso).
Saída: esta pasta, em WebP (o app) e JPEG (o PDF e o que não lê WebP), @1x e @2x quando a foto tem
resolução para isso. NUNCA se aumenta uma foto nítida: se o recorte é menor que o @2x, o @2x não sai
(o índice diz quais). As versões desfocadas podem ser aumentadas (o desfoque esconde).

Regras:
- nenhum rosto de criança em uso público (as fotos com criança ficam só no índice, "só com autorização");
- nenhum texto de cartaz, nome de atleta nem marca d'água no recorte;
- o recorte é feito aqui (caixa em fração da foto), não no app.

Uso:  python -I gerar.py
"""
import os, json
from PIL import Image, ImageFilter, ImageEnhance

AQUI = os.path.dirname(os.path.abspath(__file__))
FONTE = os.path.join(AQUI, '..', '..', 'referencias', 'raca-fight', 'fotos')

# tamanhos de uso (px de CSS / pt), tirados do tokens.json e dos mockups
TAM = {
    'tela': (390, 844),        # tela cheia (abertura, entrada, cronômetro de rounds)
    'capa': (358, 300),        # herói do Início (telas.capaInicio = 300; coluna de 358)
    'cartao': (358, 200),      # cartão de modalidade, evento, aula
    'mini': (96, 96),          # miniatura de lista (modalidade, aula)
    'retrato': (240, 320),     # professor no perfil
    'avatar': (96, 96),        # professor na lista (64 na tela; 96 cobre o @1,5x)
    'faixa-admin': (2040, 320),  # o topo do admin no ultrawide do Alex
}

# (nome, foto, caixa (x0, y0, x1, y1) em fração, tamanhos, opções)
USOS = [
    ('entrada-fundo', 'raca-54', (0.08, 0.0, 0.92, 1.0), ['tela'], {'desfocado': True}),
    ('inicio-capa', 'raca-14', (0.0, 0.30, 1.0, 0.86), ['capa', 'cartao'], {}),
    ('aula-capa', 'raca-09', (0.0, 0.36, 1.0, 0.74), ['capa', 'cartao'], {}),
    ('modalidade-muay-thai', 'raca-40', {'cartao': (0.0, 0.29, 1.0, 0.60), 'mini': (0.15, 0.30, 0.95, 0.75)}, ['cartao', 'mini'], {}),
    ('modalidade-boxe', 'raca-20', (0.0, 0.22, 1.0, 0.80), ['cartao', 'mini'], {}),
    ('modalidade-jiu-jitsu', 'raca-54', (0.0, 0.42, 1.0, 1.0), ['cartao', 'mini'], {}),
    ('modalidade-mma', 'raca-02', {'cartao': (0.0, 0.03, 1.0, 0.45), 'mini': (0.0, 0.10, 0.70, 0.50)}, ['cartao', 'mini'], {}),
    ('modalidade-kids', 'raca-11', (0.10, 0.20, 0.95, 0.80), ['cartao', 'mini'], {}),
    ('graduacao-cordao', 'raca-11', (0.0, 0.18, 1.0, 0.95), ['capa', 'cartao'], {}),
    ('cronometro-fundo', 'raca-40', (0.0, 0.29, 1.0, 1.0), ['tela'], {'desfocado': True}),
    ('professor-a', 'raca-45', {'retrato': (0.10, 0.12, 1.0, 0.95), 'avatar': (0.18, 0.14, 0.78, 0.48)}, ['retrato', 'avatar'], {}),
    ('professor-b', 'raca-12', (0.12, 0.22, 0.90, 0.62), ['retrato', 'avatar'], {}),
    ('evento-noite-de-luta', 'raca-47', (0.0, 0.0, 1.0, 1.0), ['cartao'], {}),
    ('evento-entrada-do-atleta', 'raca-52', (0.0, 0.18, 1.0, 0.82), ['cartao', 'capa'], {}),
    ('admin-fundo', 'raca-01', (0.0, 0.46, 1.0, 1.0), ['faixa-admin', 'cartao'], {'desfocado': True}),
]


def recorte_para(im, alvo):
    """corta no centro da caixa para a proporção do alvo (cover)."""
    w, h = im.size
    pa = alvo[0] / alvo[1]
    if w / h > pa:
        nw = round(h * pa); x = (w - nw) // 2
        return im.crop((x, 0, x + nw, h))
    nh = round(w / pa); y = (h - nh) // 2
    return im.crop((0, y, w, y + nh))


def salvar(im, base):
    im.save(base + '.webp', 'WEBP', quality=78, method=6)
    im.convert('RGB').save(base + '.jpg', 'JPEG', quality=80, optimize=True, progressive=True)
    return [os.path.basename(base) + '.webp', os.path.basename(base) + '.jpg']


manifesto = []
for nome, foto, caixa, tamanhos, op in USOS:
    im = Image.open(os.path.join(FONTE, foto + '.jpg')).convert('RGB')
    W, H = im.size
    for t in tamanhos:
        cx = caixa[t] if isinstance(caixa, dict) else caixa
        rc = im.crop((round(cx[0] * W), round(cx[1] * H), round(cx[2] * W), round(cx[3] * H)))
        alvo = TAM[t]
        base = recorte_para(rc, alvo)
        item = {'nome': f'{nome}-{t}', 'foto': foto, 'uso': t, 'tamanho': list(alvo), 'recorte_px': list(base.size), 'arquivos': [], 'sem2x': False}
        nitido = t != 'faixa-admin'
        for esc in (1, 2):
            w, h = alvo[0] * esc, alvo[1] * esc
            if nitido and (base.size[0] < w * 0.98):
                if esc == 1:
                    item['aumentado1x'] = True  # mesmo o @1x é maior que a foto: sai assim mesmo, marcado
                else:
                    item['sem2x'] = True; continue
            r = base.resize((w, h), Image.LANCZOS)
            if not nitido:
                r = r.filter(ImageFilter.GaussianBlur(28 * esc))
            item['arquivos'] += salvar(r, os.path.join(AQUI, f'{nome}-{t}@{esc}x'))
        if op.get('desfocado') and t == 'tela':
            r = base.resize(alvo, Image.LANCZOS).filter(ImageFilter.GaussianBlur(18))
            item['arquivos'] += salvar(r, os.path.join(AQUI, f'{nome}-{t}-desfocado@1x'))
            # tratamento por tema (como as fotos da entrada do agente O): no escuro a foto desce de brilho (o vermelho
            # do capacete passava de 250 de luz e apagava o título com a fonte a 160 %); no claro ela vai para o claro
            # (misturada com o fundo #F5F5F5), para o texto escuro ler em qualquer pixel
            nitida = base.resize(alvo, Image.LANCZOS)
            for tema, fn in (('escuro', lambda im: ImageEnhance.Brightness(ImageEnhance.Color(im).enhance(0.85)).enhance(0.5)),
                             ('claro', lambda im: Image.blend(ImageEnhance.Color(im).enhance(0.6), Image.new('RGB', im.size, (245, 245, 245)), 0.68))):
                item['arquivos'] += salvar(fn(nitida), os.path.join(AQUI, f'{nome}-{t}-{tema}@1x'))
                item['arquivos'] += salvar(fn(nitida).filter(ImageFilter.GaussianBlur(18)), os.path.join(AQUI, f'{nome}-{t}-{tema}-desfocado@1x'))
        manifesto.append(item)

with open(os.path.join(AQUI, 'manifesto.json'), 'w', encoding='utf-8') as f:
    json.dump({'data': '2026-10-15', 'fonte': '02-design/referencias/raca-fight/fotos', 'itens': manifesto}, f, ensure_ascii=False, indent=1)
tot = sum(os.path.getsize(os.path.join(AQUI, a)) for it in manifesto for a in it['arquivos'])
print(f'{len(manifesto)} usos, {sum(len(i["arquivos"]) for i in manifesto)} arquivos, {tot/1024:.0f} KB')
for it in manifesto:
    if it['sem2x'] or it.get('aumentado1x'):
        print('  ', it['nome'], 'recorte', it['recorte_px'], 'sem @2x' if it['sem2x'] else '', 'aumentado no @1x' if it.get('aumentado1x') else '')
