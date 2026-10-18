# baixa os escolhidos em 1600 px para uma quarentena nova; confere premium de novo pela API da foto
import json, sys, os, urllib.request, glob
from playwright.sync_api import sync_playwright
ids = sys.argv[2:]; dest = sys.argv[1]; os.makedirs(dest, exist_ok=True)
exe = glob.glob(os.path.expandvars(r"%LOCALAPPDATA%\ms-playwright\chromium-1234\chrome-win*\chrome.exe"))[0]
meta = {}
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=exe, headless=True, args=["--disable-blink-features=AutomationControlled"])
    pg = b.new_page(user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36")
    pg.goto("https://unsplash.com/s/photos/gym", wait_until="domcontentloaded", timeout=60000); pg.wait_for_timeout(6000)
    for i in ids:
        if os.path.exists(os.path.join(dest, i + ".jpg")) and os.path.exists(dest + ".json") and i in json.load(open(dest + ".json", encoding="utf-8")): continue
        d = pg.evaluate("async(u)=>{const r=await fetch(u);return r.json()}", "/napi/photos/" + i)
        if "user" not in d:
            print("FALHOU", i, str(d)[:200]); pg.wait_for_timeout(3000); continue
        m = {"id": i, "premium": d.get("premium"), "plus": d.get("plus"), "autor": d["user"]["name"], "usuario": d["user"]["username"],
             "pagina": d["links"]["html"], "raw": d["urls"]["raw"], "alt": d.get("alt_description"), "descricao": d.get("description"),
             "w": d["width"], "h": d["height"], "tags": [t.get("title") for t in d.get("tags", [])][:8]}
        meta[i] = m
        print(i, m["premium"], m["plus"], m["autor"], "|", m["alt"])
        if m["premium"] or m["plus"] or "plus.unsplash" in m["raw"]: continue
        u = m["raw"] + "&w=1600&q=85&fm=jpg"
        open(os.path.join(dest, i + ".jpg"), "wb").write(urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0"}), timeout=90).read())
    b.close()
old = json.load(open(dest + ".json", encoding="utf-8")) if os.path.exists(dest + ".json") else {}
old.update(meta); json.dump(old, open(dest + ".json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
