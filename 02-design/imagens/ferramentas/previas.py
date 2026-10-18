# baixa prévias pequenas para a quarentena e monta folhas de contato por consulta
import json, sys, os, urllib.request, io, concurrent.futures as cf
from PIL import Image, ImageDraw, ImageFont
cand = json.load(open(sys.argv[1], encoding="utf-8")); q_dir = sys.argv[2]; folhas = sys.argv[3]
os.makedirs(q_dir, exist_ok=True); os.makedirs(folhas, exist_ok=True)
def baixa(it):
    dest = os.path.join(q_dir, it["id"] + ".jpg")
    if not os.path.exists(dest):
        u = it["raw"] + ("&" if "?" in it["raw"] else "?") + "w=320&q=60&fm=jpg"
        req = urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0"})
        open(dest, "wb").write(urllib.request.urlopen(req, timeout=60).read())
    return dest
todos = {it["id"]: it for l in cand.values() for it in l}
with cf.ThreadPoolExecutor(8) as ex: list(ex.map(baixa, todos.values()))
fonte = ImageFont.truetype("arial.ttf", 16)
for qi, (q, l) in enumerate(cand.items()):
    if not l: continue
    cols = 5; cel = 320; linhas = (len(l)+cols-1)//cols
    folha = Image.new("RGB", (cols*cel, linhas*(cel+24)), "white")
    for i, it in enumerate(l):
        im = Image.open(os.path.join(q_dir, it["id"] + ".jpg")).convert("RGB"); im.thumbnail((cel, cel))
        x, y = (i%cols)*cel, (i//cols)*(cel+24)
        folha.paste(im, (x, y+24)); ImageDraw.Draw(folha).text((x+4, y+4), f"{i} {it['id']}", fill="black", font=fonte)
    folha.save(os.path.join(folhas, f"{qi:02d}-{q.replace(' ','_')}.jpg"), quality=70)
print("ok", len(todos))
