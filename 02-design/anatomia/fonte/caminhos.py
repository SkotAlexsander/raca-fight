"""Leitura de `d` de path SVG: converte tudo para absoluto, desloca, arredonda
e mede a caixa. Só os comandos que a base usa (M L H V C S Q T A Z, maiúsculos
ou minúsculos); as flags do arco (`a`) podem vir coladas ("012.89" = 0, 1, 2.89).
"""
import re

_NUM = re.compile(r'[-+]?(?:\d+\.\d*|\.\d+|\d+)(?:[eE][-+]?\d+)?')
_SEP = re.compile(r'[\s,]*')
_PARAMS = {'M': 2, 'L': 2, 'H': 1, 'V': 1, 'C': 6, 'S': 4, 'Q': 4, 'T': 2, 'A': 7, 'Z': 0}


def _ler(d):
    i, n = 0, len(d)
    cmd = None
    while True:
        i = _SEP.match(d, i).end()
        if i >= n:
            return
        if d[i].isalpha():
            cmd = d[i]
            i += 1
            if cmd in 'Zz':
                yield cmd, []
                continue
        elif cmd is None:
            raise ValueError('path sem comando inicial')
        q = _PARAMS[cmd.upper()]
        vals = []
        for k in range(q):
            i = _SEP.match(d, i).end()
            if cmd in 'Aa' and k in (3, 4):
                vals.append(float(d[i]))
                i += 1
                continue
            m = _NUM.match(d, i)
            if not m:
                raise ValueError(f'número esperado em {i}: {d[i:i+20]!r}')
            vals.append(float(m.group()))
            i = m.end()
        yield cmd, vals
        # repetição implícita: m vira l
        if cmd == 'm':
            cmd = 'l'
        elif cmd == 'M':
            cmd = 'L'


def _f(x):
    s = f'{round(x, 1):.1f}'.rstrip('0').rstrip('.')
    return '0' if s in ('-0', '') else s


def absoluto(d, dx=0.0, dy=0.0):
    """Devolve (d absoluto deslocado e arredondado, caixa [x0, y0, x1, y1])."""
    out = []
    cx = cy = sx = sy = 0.0
    xs, ys = [], []

    def pt(x, y):
        xs.append(x); ys.append(y)
        return f'{_f(x + dx)} {_f(y + dy)}'

    for cmd, v in _ler(d):
        rel = cmd.islower()
        C = cmd.upper()
        ox, oy = (cx, cy) if rel else (0.0, 0.0)
        if C == 'Z':
            out.append('Z'); cx, cy = sx, sy
        elif C == 'M':
            cx, cy = v[0] + ox, v[1] + oy; sx, sy = cx, cy
            out.append('M' + pt(cx, cy))
        elif C == 'L' or C == 'T':
            cx, cy = v[0] + ox, v[1] + oy
            out.append(C + pt(cx, cy))
        elif C == 'H':
            cx = v[0] + (cx if rel else 0.0)
            out.append('L' + pt(cx, cy))
        elif C == 'V':
            cy = v[0] + (cy if rel else 0.0)
            out.append('L' + pt(cx, cy))
        elif C == 'C':
            a = pt(v[0] + ox, v[1] + oy); b = pt(v[2] + ox, v[3] + oy)
            cx, cy = v[4] + ox, v[5] + oy
            out.append(f'C{a} {b} {pt(cx, cy)}')
        elif C in ('S', 'Q'):
            a = pt(v[0] + ox, v[1] + oy)
            cx, cy = v[2] + ox, v[3] + oy
            out.append(f'{C}{a} {pt(cx, cy)}')
        elif C == 'A':
            cx, cy = v[5] + ox, v[6] + oy
            out.append(f'A{_f(v[0])} {_f(v[1])} {_f(v[2])} {int(v[3])} {int(v[4])} {pt(cx, cy)}')
    caixa = [min(xs), min(ys), max(xs), max(ys)] if xs else [0, 0, 0, 0]
    return ''.join(out), caixa
