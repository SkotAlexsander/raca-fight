# uso: python -I buscar.py saida.json "consulta1" "consulta2" ...
import json, sys, glob, os, urllib.parse
from playwright.sync_api import sync_playwright
exe = glob.glob(os.path.expandvars(r"%LOCALAPPDATA%\ms-playwright\chromium-1234\chrome-win*\chrome.exe"))[0]
saida = sys.argv[1]; consultas = sys.argv[2:]
res = json.load(open(saida, encoding="utf-8")) if os.path.exists(saida) else {}
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=exe, headless=True, args=["--disable-blink-features=AutomationControlled"])
    pg = b.new_page(user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36")
    pg.goto("https://unsplash.com/s/photos/gym", wait_until="domcontentloaded", timeout=60000)
    pg.wait_for_timeout(6000)
    for q in consultas:
        url = "/napi/search/photos?per_page=30&query=" + urllib.parse.quote(q)
        d = pg.evaluate("async(u)=>{const r=await fetch(u);return r.json()}", url)
        lst = []
        for x in d.get("results", []):
            if x.get("premium") or x.get("plus") or "plus.unsplash" in x["urls"]["raw"]:
                continue
            lst.append({"id": x["id"], "autor": x["user"]["name"], "usuario": x["user"]["username"],
                        "alt": x.get("alt_description"), "raw": x["urls"]["raw"], "pagina": x["links"]["html"],
                        "w": x["width"], "h": x["height"]})
        res[q] = lst
        print(q, len(lst))
    b.close()
json.dump(res, open(saida, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
