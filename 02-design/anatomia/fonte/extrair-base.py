"""Extrai os paths do corpo masculino (frente e costas) do MuscleMap
(melihcolpan/MuscleMap, MIT, commit cdcecf72) para `base-musclemap.json`.

Rodado UMA vez, sobre o clone em quarentena; o projeto guarda só o JSON.
Não executa nada do repositório: lê os .swift como texto.

    python -I extrair-base.py <clone do MuscleMap> base-musclemap.json
"""
import json, re, sys, pathlib

origem = pathlib.Path(sys.argv[1]) / 'Sources/MuscleMap/Data'
destino = pathlib.Path(sys.argv[2])
PATH_RE = re.compile(r'"([Mm][^"]{10,})"')
SLUG_RE = re.compile(r'slug:\s*\.([A-Za-z]+)')
PROIBIDO = re.compile(r'<script|href|on[a-z]+=|foreignObject|data:|url\(|javascript', re.I)


def partes(texto):
    r = {}
    marcas = [(m.start(), m.group(1)) for m in SLUG_RE.finditer(texto)]
    for i, (ini, nome) in enumerate(marcas):
        bloco = texto[ini:marcas[i + 1][0] if i + 1 < len(marcas) else len(texto)]
        lados = {'common': [], 'left': [], 'right': []}
        for lado in lados:
            m = re.search(lado + r'\s*:\s*\[(.*?)\]', bloco, re.S)
            if m:
                lados[lado] = PATH_RE.findall(m.group(1))
        r[nome] = lados
    return r


dados = {
    'front': partes((origem / 'MaleFrontPaths.swift').read_text(encoding='utf8')),
    'back': partes((origem / 'MaleBackPaths.swift').read_text(encoding='utf8')),
}
assert not PROIBIDO.search(json.dumps(dados)), 'conteúdo suspeito na base'
destino.write_text(json.dumps({'viewBox': {'front': '0 95 727 1280', 'back': '718 95 727 1280'}, 'partes': dados}), encoding='utf8')
print({k: len(v) for k, v in dados.items()})
