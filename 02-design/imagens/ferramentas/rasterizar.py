import glob, os, io, sys
from playwright.sync_api import sync_playwright
from PIL import Image
pasta = sys.argv[1]; prev = sys.argv[2]
exe = glob.glob(os.path.expandvars(r"%LOCALAPPDATA%\ms-playwright\chromium-1234\chrome-win*\chrome.exe"))[0]
cores = {"claro": "#006B5F", "escuro": "#6BD3C2"}
svgs = sorted(glob.glob(os.path.join(pasta, "*.svg")))
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=exe, headless=True)
    for esc in (1, 2):
        pg = b.new_page(device_scale_factor=esc, viewport={"width": 400, "height": 200})
        for s in svgs:
            corpo = open(s, encoding="utf-8").read()
            for tema, cor in cores.items():
                pg.set_content(f'<html><body style="margin:0;background:transparent"><div id="a" style="width:120px;height:120px;color:{cor}">{corpo}</div></body></html>')
                png = pg.locator("#a").screenshot(omit_background=True)
                im = Image.open(io.BytesIO(png)).convert("RGBA")
                nome = os.path.splitext(os.path.basename(s))[0]
                im.save(os.path.join(pasta, f"{nome}-{tema}@{esc}x.webp"), "WEBP", quality=90, method=6)
    b.close()
# folha de prévia sobre os fundos dos dois temas
fs = [os.path.splitext(os.path.basename(s))[0] for s in svgs]
W = Image.new("RGB", (len(fs) * 250, 520), "white")
for i, n in enumerate(fs):
    for j, (tema, fundo) in enumerate((("claro", "#F4F8F7"), ("escuro", "#0B1313"))):
        bg = Image.new("RGB", (250, 260), fundo); im = Image.open(os.path.join(pasta, f"{n}-{tema}@2x.webp"))
        bg.paste(im, (5, 10), im); W.paste(bg, (i * 250, j * 260))
W.save(prev)
