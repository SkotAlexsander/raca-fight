import os, json, glob, html
R = r"A:/Claude/03-projetos/Academia Plus/02-design/imagens"
def kb(p): return os.path.getsize(os.path.join(R, p)) / 1024
OBJ = [("emagrecer", "Perder peso", "emagrecer", "Centre for Ageing Better", "dHHcDjMcN_I"),
       ("ganhar-massa", "Ganhar massa", "ganhar_massa", "Land O'Lakes, Inc.", "IYLLF511aOY"),
       ("condicionamento", "Condicionamento", "condicionamento", "Vitaly Gariev", "Y3LhJWNjv0M"),
       ("iniciante", "Começar a treinar", "iniciante", "Ahmet Kurt", "rYmhvp2ZC_c"),
       ("saude-e-manutencao", "Manter", "saude_e_manutencao", "Centre for Ageing Better", "tqTWbykzqNE")]
EX = [("supino-reto", "Supino reto", "Sergio Kian", "Rm51wg8qk7g"),
      ("supino-inclinado-com-halteres", "Supino inclinado com halteres", "Federico Faccipieri", "fGAgXh6QQEU"),
      ("crucifixo-na-maquina", "Crucifixo na máquina", "Alan Quirvan", "jo6y5JxSxzE"),
      ("triceps-corda", "Tríceps corda", "Bandan Mohammed", "9aYRNhZ88wc"),
      ("agachamento-livre", "Agachamento livre", "Alef Morais", "YFeoyqrFsGA"),
      ("remada-curvada", "Remada curvada", "Mariah Krafft", "KaxVB5xh4Nw"),
      ("esteira", "Esteira", "Mike Cox", "06EpjZiMz_E")]
VZ = [("primeiro-treino", "Primeiro uso: nenhum treino ainda"), ("historico-vazio", "Histórico: nenhum treino fechado"),
      ("sem-plus-alimentacao", "Sem Plus: alimentação com acompanhamento"), ("sem-plano", "Sem plano: o personal ainda não montou"),
      ("aguardando-personal", "Aguardando seu personal"), ("busca-sem-resultado", "Busca sem resultado"),
      ("erro-carregar", "Erro: não deu para carregar"), ("sem-conexao", "Sem conexão"),
      ("nenhum-aluno", "Academia: nenhum aluno vinculado"), ("biblioteca-vazia", "Academia: nenhum treino pronto")]

man = {"versao": "2026-10-10",
       "tamanhos": {"capa": [344, 192], "mini": [48, 48], "exercicio": [48, 48], "estadoVazio": [120, 120], "plus": [344, 192]},
       "capas": {}, "exercicios": {}, "estadosVazios": {}, "plus": {}}
for slug, rot, chave, aut, fid in OBJ:
    man["capas"][chave] = {"rotulo": rot,
                          "capa": {e: f"capas/{slug}-capa@{e}.webp" for e in ("1x", "2x")},
                          "mini": {e: f"capas/{slug}-mini@{e}.webp" for e in ("1x", "2x")}}
man["capas"]["iniciante"]["capaAlternativa"] = {e: f"capas/iniciante-capa-alternativa@{e}.webp" for e in ("1x", "2x")}
for slug, rot, aut, fid in EX:
    man["exercicios"][slug] = {"nome": rot, **{e: f"exercicios/{slug}@{e}.webp" for e in ("1x", "2x")}}
for slug, rot in VZ:
    man["estadosVazios"][slug] = {"uso": rot, "svg": f"estados-vazios/{slug}.svg",
        **{f"{t}{e}": f"estados-vazios/{slug}-{t}@{e}.webp" for t in ("claro", "escuro") for e in ("1x", "2x")}}
man["plus"]["convite"] = {"capa": {e: f"plus/convite-plus@{e}.webp" for e in ("1x", "2x")},
                          "mini": {e: f"plus/convite-plus-mini@{e}.webp" for e in ("1x", "2x")}}
# agente S (10/10/2026): preserva as chaves que outros agentes acrescentaram (treinos, exerciciosHeroi, exerciciosIlustracao, avisos)
_antigo = os.path.join(R, "manifesto.json")
if os.path.exists(_antigo):
    _velho = json.load(open(_antigo, encoding="utf-8"))
    for _k, _v in _velho.items():
        if _k not in man: man[_k] = _v
    for _k, _v in _velho.get("tamanhos", {}).items(): man["tamanhos"].setdefault(_k, _v)
    if "_aviso" in _velho.get("exercicios", {}): man["exercicios"]["_aviso"] = _velho["exercicios"]["_aviso"]
json.dump(man, open(os.path.join(R, "manifesto.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=2)


def fig(src2, src1, w, h, leg, extra=""):
    return (f'<figure><img src="{src2}" srcset="{src1} 1x, {src2} 2x" width="{w}" height="{h}" alt="">'
            f'<figcaption><b>{html.escape(leg)}</b><span>{w}×{h} · 1× {kb(src1):.1f} KB · 2× {kb(src2):.1f} KB</span>{extra}</figcaption></figure>')


cap = "".join(fig(f"capas/{s}-capa@2x.webp", f"capas/{s}-capa@1x.webp", 344, 192, r,
                  f'<span>Foto: {html.escape(a)} · Unsplash</span>') for s, r, c, a, f in OBJ)
cap += fig("capas/iniciante-capa-alternativa@2x.webp", "capas/iniciante-capa-alternativa@1x.webp", 344, 192,
           "Começar a treinar (alternativa)", "<span>Foto: Febrian Zakaria · Unsplash</span>")
mini = "".join(fig(f"capas/{s}-mini@2x.webp", f"capas/{s}-mini@1x.webp", 48, 48, r) for s, r, c, a, f in OBJ)
ex = "".join(fig(f"exercicios/{s}@2x.webp", f"exercicios/{s}@1x.webp", 48, 48, r,
                 f'<span>Foto: {html.escape(a)}</span>') for s, r, a, f in EX)
vz = "".join(
    f'<figure class="vz"><div class="ilus">'
    f'<img class="so-claro" src="estados-vazios/{s}-claro@2x.webp" srcset="estados-vazios/{s}-claro@1x.webp 1x, estados-vazios/{s}-claro@2x.webp 2x" width="120" height="120" alt="">'
    f'<img class="so-escuro" src="estados-vazios/{s}-escuro@2x.webp" srcset="estados-vazios/{s}-escuro@1x.webp 1x, estados-vazios/{s}-escuro@2x.webp 2x" width="120" height="120" alt="">'
    f'</div><figcaption><b>{html.escape(r)}</b><span>{s} · 120×120 · SVG {kb(f"estados-vazios/{s}.svg"):.1f} KB</span></figcaption></figure>'
    for s, r in VZ)
plus = (fig("plus/convite-plus@2x.webp", "plus/convite-plus@1x.webp", 344, 192, "Convite ao Plus",
            "<span>Foto: Vitaly Gariev · Unsplash</span>")
        + fig("plus/convite-plus-mini@2x.webp", "plus/convite-plus-mini@1x.webp", 48, 48, "Convite ao Plus (mini)"))
arqs = glob.glob(R + "/**/*.webp", recursive=True)
total = sum(os.path.getsize(p) for p in arqs) / 1024
n = len(arqs)

CSS = """
:root{--fundo:#F4F8F7;--superficie:#FFFFFF;--texto:#131D1C;--texto2:#556463;--marca:#006B5F;--borda:#D0DAD9;--plusSuave:#FCF2E1}
@media (prefers-color-scheme: dark){:root:not([data-tema="claro"]){--fundo:#0B1313;--superficie:#1B2423;--texto:#E7F1F0;--texto2:#A1AEAD;--marca:#6BD3C2;--borda:#313A39;--plusSuave:#332710}}
:root[data-tema="escuro"]{--fundo:#0B1313;--superficie:#1B2423;--texto:#E7F1F0;--texto2:#A1AEAD;--marca:#6BD3C2;--borda:#313A39;--plusSuave:#332710}
*{box-sizing:border-box}
body{margin:0;background:var(--fundo);color:var(--texto);font:15px/1.45 Figtree,system-ui,sans-serif;padding:24px 16px 64px}
main{max-width:1180px;margin:0 auto}
h1{font-size:28px;margin:0 0 4px;text-wrap:balance}h2{font-size:20px;margin:40px 0 4px}
p.apoio{color:var(--texto2);margin:0 0 16px;max-width:70ch}
header{display:flex;flex-wrap:wrap;gap:12px;align-items:end;justify-content:space-between}
button{font:600 15px Figtree,system-ui,sans-serif;min-height:48px;padding:0 18px;border-radius:12px;border:1px solid var(--borda);background:var(--superficie);color:var(--texto);cursor:pointer}
button:focus-visible{outline:2px solid var(--marca);outline-offset:2px}
.grade{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(344px,100%),1fr));gap:16px}
.grade.peq{grid-template-columns:repeat(auto-fill,minmax(160px,1fr))}
figure{margin:0;background:var(--superficie);border:1px solid var(--borda);border-radius:16px;padding:12px;display:flex;flex-direction:column;gap:8px;min-width:0}
figure img{border-radius:8px;max-width:100%;height:auto;align-self:flex-start}
figcaption{display:flex;flex-direction:column;gap:2px}
figcaption span{color:var(--texto2);font-size:13px;font-variant-numeric:tabular-nums}
.vz .ilus{display:flex;justify-content:center;padding:8px 0;background:var(--fundo);border-radius:8px}
.vz .ilus img{align-self:center;border-radius:0}
.so-escuro{display:none}
:root[data-tema="escuro"] .so-claro{display:none}:root[data-tema="escuro"] .so-escuro{display:block}
:root[data-tema="claro"] .so-claro{display:block}:root[data-tema="claro"] .so-escuro{display:none}
@media (prefers-color-scheme: dark){:root:not([data-tema]) .so-claro{display:none}:root:not([data-tema]) .so-escuro{display:block}}
#plus figure:first-child{background:var(--plusSuave)}
"""
JS = """
(function(){var r=document.documentElement,b=document.getElementById('tema');
try{var s=localStorage.getItem('galeria-tema');if(s)r.setAttribute('data-tema',s)}catch(e){}
b.addEventListener('click',function(){var a=r.getAttribute('data-tema');var escuro=a?a==='escuro':matchMedia('(prefers-color-scheme: dark)').matches;var n=escuro?'claro':'escuro';r.setAttribute('data-tema',n);try{localStorage.setItem('galeria-tema',n)}catch(e){}});})();
"""
pagina = f"""<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Banco de imagens</title>
<style>{CSS}</style></head><body><main>
<header><div><h1>Banco de imagens do Academia Plus</h1>
<p class="apoio">{n} arquivos WebP, {total:.0f} KB no total. Fotos do Unsplash (licença Unsplash), ilustrações desenhadas para o app. Créditos em CREDITOS.md; tamanhos e uso em 00-LEIA-ME.md.</p></div>
<button id="tema" type="button">Trocar tema</button></header>
<h2>Capa do treino pronto, por objetivo</h2><p class="apoio">Topo do cartão de treino pronto, largura total. 344×192 (1×) e 688×384 (2×).</p><div class="grade">{cap}</div>
<h2>Miniatura do objetivo</h2><p class="apoio">Imagem 48×48 do cartão de treino pronto (componente 8). 48 e 96 px.</p><div class="grade peq">{mini}</div>
<h2>Miniatura de exercício</h2><p class="apoio">Cabeçalho do cartão de exercício (componente 5), 48×48, raio 8. 48 e 96 px.</p><div class="grade peq">{ex}</div>
<h2>Estados vazios</h2><p class="apoio">Traço de 2 px na cor de marca, objetos da sala, sem personagem. SVG com currentColor e WebP em claro e escuro, 120 e 240 px.</p><div class="grade peq">{vz}</div>
<h2>Convite ao Plus</h2><p class="apoio">Topo da folha de convite e da tela Plus — apresentação. 344×192.</p><div class="grade" id="plus">{plus}</div>
</main><script>{JS}</script></body></html>
"""
open(os.path.join(R, "galeria.html"), "w", encoding="utf-8").write(pagina)
print(n, round(total, 1))
