// Capturas do app CONSTRUÍDO (app/, export web do Expo), para os PDFs do professor e do aluno. Agente AV, 16/10/2026.
// Mesmo método do roteiro do AM2 (docs/revisao/AM2-capturas/fluxos.mjs): o export web em 390 × 844, as contas de
// exemplo (nomes fictícios) e o relógio parado na quinta, 15/10/2026, 20:05 em Gravataí (o Muay Thai das 20h rolando).
//
// Uso (de dentro desta pasta):  node capturar-app.mjs [pasta-do-export]     → <id>.png (390 × 844, escala 2, tema escuro)
// Sem argumento usa ../../../app/dist (o `npx expo export --platform web` do app). Nada é escrito em app/.
// Os ids são os mesmos dos quadros de tela dos PDFs (professor/paginas.mjs e aluno/paginas.mjs): quando existe
// <id>.png aqui, o montar.mjs de cada PDF usa a captura real.
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { abrirNavegador, servirPasta } from '../admin/navegador.mjs'

const aqui = dirname(fileURLToPath(import.meta.url))
const DIST = resolve(process.argv[2] ?? join(aqui, '..', '..', '..', 'app', 'dist'))
const SO = process.env.SO?.split(',')
const QUINTA = new Date('2026-10-15T23:05:00Z')

const srv = await servirPasta(DIST, { spa: true })
const nav = await abrirNavegador()
const espera = (p, ms = 900) => p.waitForTimeout(ms)
const tid = (p, id) => p.locator(`[data-testid="${id}"]`).first()
const texto = (p, t, exato = true) => p.getByText(t, { exact: exato }).first()

async function nova({ conta = null, tema = 'dark', largura = 390, altura = 844 } = {}) {
  const ctx = await nav.newContext({ viewport: { width: largura, height: altura }, deviceScaleFactor: 2, colorScheme: tema, timezoneId: 'America/Sao_Paulo', locale: 'pt-BR', serviceWorkers: 'block' })
  const p = await ctx.newPage()
  await p.clock.install({ time: QUINTA })
  if (conta) { await p.goto(`${srv.base}/contas-de-exemplo`); await espera(p, 2500); await texto(p, conta).click(); await espera(p, 1500) }
  return { ctx, p }
}
const ir = async (p, rota, ms = 1600) => { await p.goto(`${srv.base}${rota}`); await espera(p, ms) }
/** Toca "Estou na aula" e, se abrir a folha "Hoje você treina…", escolhe a primeira turma. */
async function checkin(p) {
  await tid(p, 'estou-na-aula').click(); await espera(p, 1200)
  if (await p.getByText(/Hoje você treina/).isVisible().catch(() => false)) { await p.getByRole('button').filter({ hasText: /Muay Thai/ }).first().click(); await espera(p, 1000) }
}

// [id, conta, preparar(p)] — conta '' = sem entrar (a entrada e a vitrine)
const TELAS = [
  // entrada
  ['boas-vindas', '', async (p) => { await ir(p, '/boas-vindas', 3000) }],
  ['equipe-entrar', '', async (p) => { await ir(p, '/boas-vindas', 3000); await texto(p, 'Sou da equipe').click(); await espera(p, 1500) }],
  ['equipe-convite', '', async (p) => { await ir(p, '/codigo-da-equipe'); await p.keyboard.type('T9K2WM'); await espera(p, 1200) }],
  ['equipe-pendente', '', async (p) => {
    await ir(p, '/codigo-da-equipe'); await p.keyboard.type('T9K2WM'); await espera(p, 1000)
    const prof = p.getByRole('button', { name: /^Professor/ }).first(); if (await prof.isVisible().catch(() => false)) await prof.click()
    await espera(p, 400); await texto(p, 'Pedir para entrar').click(); await espera(p, 1800)
  }],
  ['conheca', '', async (p) => { await ir(p, '/conheca', 2500) }],
  ['qual-modalidade', '', async (p) => { await ir(p, '/conheca', 2500); await tid(p, 'agendar-experimental').click(); await espera(p, 1000) }],
  ['conheca-horarios', '', async (p) => { await ir(p, '/conheca/horarios') }],
  ['objetivo', '', async (p) => { await ir(p, '/objetivo') }],
  // aluno
  ['aluno-inicio', 'Lucas Ferraz', async (p) => { await ir(p, '/inicio') }],
  ['aluno-checkin-feito', 'Lucas Ferraz', async (p) => { await ir(p, '/inicio'); await checkin(p) }],
  ['aluno-inicio-rolado', 'Lucas Ferraz', async (p) => { await ir(p, '/inicio'); await p.mouse.move(195, 500); await p.mouse.wheel(0, 420); await espera(p, 800) }],
  ['aluno-sem-sinal', 'Lucas Ferraz', async (p) => { await ir(p, '/inicio'); await p.context().setOffline(true); await checkin(p) }],
  ['horarios', 'Lucas Ferraz', async (p) => { await ir(p, '/horarios') }],
  ['horarios-todas', 'Lucas Ferraz', async (p) => { await ir(p, '/horarios'); await texto(p, 'Todas').click(); await espera(p, 800) }],
  ['treinos', 'Lucas Ferraz', async (p) => { await ir(p, '/treinos') }],
  ['treinos-jj', 'Lucas Ferraz', async (p) => { await ir(p, '/treinos'); await texto(p, 'Jiu-Jitsu').click(); await espera(p, 900) }],
  ['academia', 'Lucas Ferraz', async (p) => { await ir(p, '/academia') }],
  ['professores', 'Lucas Ferraz', async (p) => { await ir(p, '/academia/professores') }],
  ['atletas', 'Lucas Ferraz', async (p) => { await ir(p, '/academia/atletas') }],
  ['eventos-aluno', 'Lucas Ferraz', async (p) => { await ir(p, '/academia/eventos') }],
  ['tecnicas-aluno', 'Lucas Ferraz', async (p) => { await ir(p, '/academia/tecnicas') }],
  ['responde', 'Lucas Ferraz', async (p) => { await ir(p, '/academia/responde'); await texto(p, 'A aula experimental é grátis?').click(); await espera(p, 800) }],
  ['perfil-aluno', 'Lucas Ferraz', async (p) => { await ir(p, '/perfil') }],
  ['indicar', 'Lucas Ferraz', async (p) => { await ir(p, '/perfil'); await texto(p, 'Indicar um amigo').click(); await espera(p, 1500) }],
  ['avisos-aluno', 'Lucas Ferraz', async (p) => { await ir(p, '/perfil/avisos') }],
  ['meus-dados', 'Lucas Ferraz', async (p) => { await ir(p, '/perfil/meus-dados') }],
  ['quem-pode-ver', 'Lucas Ferraz', async (p) => { await ir(p, '/perfil/quem-pode-ver') }],
  ['cronometro', 'Lucas Ferraz', async (p) => { await ir(p, '/cronometro'); await tid(p, 'cronometro-iniciar').click(); await espera(p, 600); await p.clock.runFor(275000); await espera(p, 900) }],
  ['cronometro-escolher', 'Lucas Ferraz', async (p) => { await ir(p, '/cronometro') }],
  // responsável do Kids
  ['kids-inicio', 'Carla Nunes', async (p) => { await ir(p, '/inicio') }],
  ['kids-dependentes', 'Carla Nunes', async (p) => { await ir(p, '/perfil/dependentes') }],
  ['kids-dependente', 'Carla Nunes', async (p) => { await ir(p, '/perfil/dependentes'); await texto(p, 'Pedro Nunes').click(); await espera(p, 1500) }],
  // professor
  ['hoje', 'Diego Moura', async (p) => { await ir(p, '/hoje', 1800) }],
  ['chamada', 'Diego Moura', async (p) => { await ir(p, '/hoje', 1800); await tid(p, 'abrir-chamada').click(); await espera(p, 1500) }],
  ['chamada-fechar', 'Diego Moura', async (p) => { await ir(p, '/hoje', 1800); await tid(p, 'abrir-chamada').click(); await espera(p, 1500); await tid(p, 'fechar-chamada').click(); await espera(p, 900) }],
  ['turmas', 'Diego Moura', async (p) => { await ir(p, '/turmas') }],
  ['turma', 'Diego Moura', async (p) => { await ir(p, '/turmas'); await texto(p, 'Muay Thai Kids').click(); await espera(p, 1500) }],
  ['turma-cancelar', 'Diego Moura', async (p) => { await ir(p, '/turmas'); await texto(p, 'Muay Thai Kids').click(); await espera(p, 1500); await p.getByRole('button', { name: 'Cancelar', exact: true }).first().click(); await espera(p, 900) }],
  ['turma-passar', 'Diego Moura', async (p) => { await ir(p, '/turmas'); await texto(p, 'Muay Thai Kids').click(); await espera(p, 1500); await p.getByRole('button', { name: 'Passar', exact: true }).first().click(); await espera(p, 900) }],
  ['alunos', 'Diego Moura', async (p) => { await ir(p, '/alunos') }],
  ['ficha', 'Diego Moura', async (p) => { await ir(p, '/alunos'); await texto(p, 'Camila Moura').click(); await espera(p, 1500) }],
  ['aviso', 'Diego Moura', async (p) => {
    await ir(p, '/turmas'); await texto(p, 'Muay Thai — noite 1').click(); await espera(p, 1500)
    await p.getByRole('button', { name: 'Aviso para a turma' }).first().click(); await espera(p, 1500)
    await p.locator('textarea').first().fill('Hoje é sparring: tragam protetor bucal e caneleira.'); await espera(p, 600)
  }],
  ['tecnicas', 'Diego Moura', async (p) => { await ir(p, '/turmas/tecnicas') }],
  ['eventos', 'Diego Moura', async (p) => { await ir(p, '/hoje/eventos') }],
  ['evento', 'Diego Moura', async (p) => { await ir(p, '/hoje/eventos'); await texto(p, 'Noite de lutas').click(); await espera(p, 1500) }],
  ['perfil', 'Diego Moura', async (p) => { await ir(p, '/perfil-da-equipe/meu-perfil-profissional') }],
  ['avisos-equipe', 'Diego Moura', async (p) => { await ir(p, '/perfil-da-equipe/avisos-da-equipe') }],
  // professor de Jiu-Jitsu: a graduação (a régua IBJJF existe; a do Muay Thai está "a confirmar")
  ['graduacao', 'Márcio Teles', async (p) => { await ir(p, '/graduacao') }],
  ['graduacao-rolada', 'Márcio Teles', async (p) => { await ir(p, '/graduacao'); await p.mouse.move(195, 500); await p.mouse.wheel(0, 700); await espera(p, 800) }],
  ['registrar', 'Márcio Teles', async (p) => { await ir(p, '/graduacao'); await texto(p, 'Lucas Ferraz').click(); await espera(p, 1500); await tid(p, 'registrar-jiu-jitsu').click(); await espera(p, 900) }],
  ['ficha-jj', 'Márcio Teles', async (p) => { await ir(p, '/graduacao'); await texto(p, 'Lucas Ferraz').click(); await espera(p, 1500) }],
  ['exame', 'Márcio Teles', async (p) => { await ir(p, '/graduacao'); await p.getByText(/^Jiu-Jitsu · 25 de out/).first().click(); await espera(p, 1500) }],
  ['regua', 'Márcio Teles', async (p) => { await ir(p, '/graduacao'); await p.mouse.move(195, 500); await p.mouse.wheel(0, 900); await espera(p, 600); await p.getByText(/IBJJF/).first().click(); await espera(p, 1500) }],
  // recepção
  ['recepcao-hoje', 'Simone Alves', async (p) => { await ir(p, '/hoje', 1800) }],
  ['recepcao-balcao', 'Simone Alves', async (p) => { await ir(p, '/hoje', 1800); await tid(p, 'abrir-chamada').click(); await espera(p, 1500) }],
  ['recepcao-alunos', 'Simone Alves', async (p) => { await ir(p, '/alunos') }],
  ['experimentais', 'Simone Alves', async (p) => { await ir(p, '/experimentais') }],
  ['experimental-nova', 'Simone Alves', async (p) => {
    await ir(p, '/experimentais/nova')
    await p.getByLabel('Nome', { exact: true }).fill('Marina Lopes')
    await p.getByLabel('WhatsApp com DDD').fill('51 90000-0002')
    await p.getByRole('switch').first().click(); await espera(p, 600)
    await p.getByRole('button', { name: 'Jiu-Jitsu', exact: true }).first().click(); await espera(p, 600)
    await p.getByLabel('Nome da criança').fill('Nina'); await p.getByLabel('Idade').fill('8'); await espera(p, 400)
  }],
  ['aluno-kids', 'Simone Alves', async (p) => { await ir(p, '/alunos'); await texto(p, 'Kids').click(); await espera(p, 800); await p.getByText(/^Pedro \(Kids\)/).first().click(); await espera(p, 1500) }],
  ['dono', 'Sérgio Vargas', async (p) => { await ir(p, '/hoje', 1500) }],
]

const log = []
let n = 0
for (const [id, conta, preparar] of TELAS) {
  if (SO && !SO.includes(id)) continue
  const { ctx, p } = await nova({ conta })
  const erros = []
  p.on('pageerror', (e) => erros.push(e.message))
  try { await preparar(p) } catch (e) { console.warn(`  ${id}: o preparo falhou (${e.message.split('\n')[0]})`) }
  await p.screenshot({ path: join(aqui, `${id}.png`) })
  const corpo = (await p.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 700)
  log.push(`## ${id} (${conta || 'sem conta'}) ${p.url().replace(srv.base, '')}${erros.length ? ` ERROS: ${erros.join(' / ')}` : ''}\n${corpo}\n`)
  n++
  await ctx.close()
}
await nav.close(); srv.fechar()
writeFileSync(join(aqui, '_textos.md'), log.join('\n'))
console.log(`ok · ${n} capturas do app em ${aqui} (o texto de cada tela em _textos.md)`)
