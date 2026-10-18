// Monta as partes copiadas dos mockups de luta (agente AL, 15/10/2026). Rode de novo sempre que mudar um ícone,
// o logo provisório ou o controle de página do novas.html:  node montar-mockups.mjs
//  - luta.html e entrada.html: o sprite (ícones gerais SEM os de musculação + os de luta + o logo provisório)
//    entre <!-- SPRITE:INICIO … --> e <!-- SPRITE:FIM -->;
//  - luta.html: o bloco de controles da página (tema, aparelho, movimento, transparência, fonte e moldura) do novas.html.
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const aqui = dirname(fileURLToPath(import.meta.url))
const design = join(aqui, '..', '..')
const mockups = join(aqui, '..', 'mockups')
const ler = (p) => readFileSync(p, 'utf8')

const SAIU = new Set(['inicio', 'inicio-cheio', 'plus', 'plus-cheio', 'anilha', 'anilha-cheio', 'barra', 'esteira', 'bicicleta', 'musculo'])
const luta = [...ler(join(design, 'icones', 'luta', 'sprite-luta.svg')).matchAll(/<symbol id="i-([\w-]+)"[\s\S]*?<\/symbol>/g)]
const deLuta = new Set(luta.map((m) => m[1]))
const gerais = [...ler(join(design, 'icones', 'sprite.svg')).matchAll(/<symbol id="i-([\w-]+)"[\s\S]*?<\/symbol>/g)]
  .filter((m) => !SAIU.has(m[1]) && !deLuta.has(m[1]))
const simbolo = ler(join(design, 'marca-e-proposta', 'logo-raca-fight', 'fonte', 'simbolo-mockup.svg.txt')).trim()
const sprite = [...gerais.map((m) => m[0]), ...luta.map((m) => m[0]), simbolo].join('\n')

function trocar(texto, ini, fim, novo) {
  const a = texto.indexOf(ini), b = texto.indexOf(fim, a)
  if (a < 0 || b < 0) throw new Error('marcador não achado: ' + ini)
  const fimIni = texto.indexOf('\n', a) + 1
  return texto.slice(0, fimIni) + novo + '\n' + texto.slice(b)
}

// controles da página, do novas.html
const novas = ler(join(mockups, 'novas.html'))
const c0 = novas.indexOf('  /* Página: tema, aparelho')
const c1 = novas.indexOf('\n  })();', c0) + '\n  })();'.length
const controles = novas.slice(c0, c1)

for (const f of ['luta.html', 'entrada.html']) {
  const p = join(mockups, f)
  let t = ler(p)
  if (t.includes('<!-- SPRITE:INICIO')) t = trocar(t, '<!-- SPRITE:INICIO', '<!-- SPRITE:FIM -->', sprite)
  if (t.includes('/* PAGINA:CONTROLES')) t = trocar(t, '/* PAGINA:CONTROLES', '</script>', controles)
  writeFileSync(p, t)
  console.log(f, `: ${gerais.length} ícones gerais, ${luta.length} de luta, logo provisório`)
}
