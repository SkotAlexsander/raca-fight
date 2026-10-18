# símbolo A (barra e mais) em PNG 1024 transparente para o expo-splash-screen;
# o desenho cabe no círculo central de 2/3 da tela (máscara do Android 12+)
import sys, os, math
from PIL import Image, ImageDraw
saida = sys.argv[1]
RECTS = [(96,352,216,672,60),(808,352,928,672,60),(180,452,844,572,0),(452,192,572,832,60)]
# ponto mais distante do centro: canto da anilha (96,352) -> raio 446; círculo útil = 1024/3 = 341.3
esc = (1024/3) / math.hypot(512-96, 512-352)
for nome, cor in (("abertura-simbolo-claro", (255,255,255,255)), ("abertura-simbolo-escuro", None)):
    cor = cor or (0x39,0xF0,0xCD,255)
    S = 4; im = Image.new("RGBA", (1024*S,1024*S), (0,0,0,0)); d = ImageDraw.Draw(im)
    for x0,y0,x1,y1,r in RECTS:
        t = lambda v: (512 + (v-512)*esc)*S
        d.rounded_rectangle((t(x0),t(y0),t(x1),t(y1)), radius=r*esc*S, fill=cor)
    im = im.resize((1024,1024), Image.LANCZOS); im.save(os.path.join(saida, nome + ".png"), optimize=True)
print("escala", round(esc,4), "largura do símbolo", round(832*esc), "px de 1024")
