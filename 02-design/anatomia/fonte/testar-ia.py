"""Workers AI: lista os modelos de imagem e gera os casos. Lê o token do .env
sem imprimir. uso:
  python -I testar-ia.py modelos
  python -I testar-ia.py gerar @cf/black-forest-labs/flux-1-schnell ../ia [semente]

Caminho B do comparativo (agente AD, 11/10/2026). Em 11/10 o token do .env estava
ATIVO mas SEM permissão de Workers AI: 403 em /ai/models/search e 401 em /ai/run.
Para rodar, o token precisa de "Workers AI: Read" e "Workers AI: Edit" na conta.
As imagens caem em ../ia/<caso>.jpg e o comparativo.html as mostra sozinho.
Prompt e semente fixos: a mesma entrada dá a mesma imagem, e o teste é repetível.
"""
import base64, json, pathlib, sys, urllib.request, urllib.error

def env():
    v = {}
    for linha in pathlib.Path('A:/Claude/.env').read_text(encoding='utf8').splitlines():
        if '=' in linha and not linha.lstrip().startswith('#'):
            k, _, x = linha.partition('=')
            v[k.strip()] = x.strip().strip('"').strip("'")
    return v['CLOUDFLARE_API_TOKEN'], v['CLOUDFLARE_ACCOUNT_ID']

TOKEN, CONTA = env()
BASE = f'https://api.cloudflare.com/client/v4/accounts/{CONTA}/ai'

def chamar(url, corpo=None, bruto=False):
    req = urllib.request.Request(url, data=json.dumps(corpo).encode() if corpo is not None else None,
                                 headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req, timeout=180) as r:
            dados = r.read()
            tipo = r.headers.get('Content-Type', '')
            return r.status, tipo, dados
    except urllib.error.HTTPError as e:
        return e.code, e.headers.get('Content-Type', ''), e.read()

PROMPT = ('Medical anatomy diagram of a neutral human body, {vista}, standing straight, arms slightly away from the body. '
          'The whole body is flat light gray, smooth, no skin texture, no face, no hair, no genitals, average non-athletic proportions. '
          'Only the {musculo} is colored solid red; every other muscle stays gray. '
          'Clean flat vector illustration, plain white background, centered, full body visible, no text, no labels, no letters, no arrows.')

CASOS = [
    ('peitoral', 'front view', 'pectoralis major (chest muscle)'),
    ('grande-dorsal', 'back view', 'latissimus dorsi (the large wing-shaped muscles of the mid back)'),
    ('quadriceps', 'front view', 'quadriceps (front of both thighs)'),
    ('gluteos', 'back view', 'gluteus maximus (buttocks)'),
    ('biceps', 'front view', 'biceps brachii (front of both upper arms)'),
    ('deltoide', 'front view', 'deltoid (the cap of both shoulders)'),
]

if sys.argv[1] == 'modelos':
    st, tipo, d = chamar(BASE + '/models/search?task=Text-to-Image&per_page=50')
    j = json.loads(d)
    print('status', st, 'sucesso', j.get('success'), [e.get('message') for e in j.get('errors', [])])
    for m in j.get('result', []) or []:
        props = {p['property_id']: p['value'] for p in m.get('properties', [])}
        print(m['name'], '|', props.get('terms', ''), '|', props.get('info', ''), '|', (m.get('description') or '')[:90])
else:
    modelo, saida = sys.argv[2], pathlib.Path(sys.argv[3])
    semente = int(sys.argv[4]) if len(sys.argv) > 4 else 20261011
    saida.mkdir(parents=True, exist_ok=True)
    registro = []
    for nome, vista, musculo in CASOS:
        prompt = PROMPT.format(vista=vista, musculo=musculo)
        corpo = {'prompt': prompt, 'seed': semente}
        if 'schnell' in modelo:
            corpo['steps'] = 8
        st, tipo, d = chamar(f'{BASE}/run/{modelo}', corpo)
        if 'json' in tipo:
            j = json.loads(d)
            if not j.get('success', True) or st != 200:
                print(nome, 'ERRO', st, [e.get('message') for e in j.get('errors', [])])
                registro.append({'caso': nome, 'erro': st}); continue
            img = base64.b64decode(j['result']['image'])
        else:
            img = d
        ext = 'png' if img[:4] == b'\x89PNG' else 'jpg'
        arq = saida / f'{nome}.{ext}'
        arq.write_bytes(img)
        print(nome, st, len(img), arq.name)
        registro.append({'caso': nome, 'arquivo': arq.name, 'modelo': modelo, 'semente': semente, 'prompt': prompt})
    (saida / 'registro.json').write_text(json.dumps(registro, ensure_ascii=False, indent=2), encoding='utf8')
