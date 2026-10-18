// Os números do PDF do admin, CALCULADOS pelo domínio financeiro (app/dominio/financeiro/), nunca digitados à mão.
// Agente AR, P13, 15/10/2026.
//
// Monta uma Raça Fight de exemplo (nomes FICTÍCIOS, preços de EXEMPLO de exemplo.ts) e roda 13 meses de academia
// (out/2025 a 15/out/2026) passando pelas mesmas funções que o Admin vai chamar: gerar mensalidades, marcar como paga,
// despesas fixas, remuneração, fechamento, funil, filtros, importação, exportação, histórico e painel.
// O sorteio usa semente fixa: rodar de novo dá os mesmos números.
//
// Uso: node dados.mjs   → _dados/dados.json (o montar.mjs lê) e _dados/planilha-de-exemplo.csv
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const aqui = dirname(fileURLToPath(import.meta.url))
const dom = (f) => import(pathToFileURL(join(aqui, '..', '..', '..', 'app', 'dominio', 'financeiro', f)).href)

const { MODALIDADES, PLANOS, CATEGORIAS, ACADEMIA } = await dom('exemplo.ts')
const { gerarMensalidadesDoMes, descontosDaIndicacao, sugerirDescontoFamilia } = await dom('mensalidades.ts')
const { marcarComoPaga, listarInadimplentes, taxaDeInadimplencia, situacaoDaCobranca, calcularEncargos, validarRegraDeAtraso } = await dom('cobrancas.ts')
const { gerarDespesasFixasDoMes } = await dom('despesas-fixas.ts')
const { totaisDoPeriodo, somarPor, quantoEntrouPorModalidade, resultadoPorEvento } = await dom('totais.ts')
const { calcularRemuneracaoDoMes } = await dom('remuneracao.ts')
const { fecharMes, pendenciasAntesDeFechar } = await dom('fechamento.ts')
const { linhasDeAlunos, filtrarAlunos, quantoEntrou, filtrarLancamentos, exportarAlunos } = await dom('filtros.ts')
const { conversaoDoFunil, retornosPendentes, lembreteDeRetorno, etapaDoInteressado } = await dom('funil.ts')
const { lembretesDoDia, tarefasAbertas, validarLembrete } = await dom('anotacoes.ts')
const { resumoDoPainel } = await dom('painel.ts')
const { registroDeMudanca, descreverRegistro } = await dom('historico.ts')
const { lerCSV, acharCabecalho, detectarColunas, conferirImportacao } = await dom('importacao.ts')
const { exportarLancamentos } = await dom('exportacao.ts')
const { colarNaGrade, editarCelula } = await dom('grade.ts')
const { formatarDinheiro, formatarPontosBase } = await dom('dinheiro.ts')
const { somarDias, somarMeses, dataNaCompetencia, periodoDaCompetencia, diasNoMes, formatarDataBR, nomeDaCompetencia, competenciaDe, diasEntre } = await dom('datas.ts')

// ---------------------------------------------------------------- sorteio com semente
let semente = 20261015
const sortear = () => { semente |= 0; semente = (semente + 0x6D2B79F5) | 0; let t = Math.imul(semente ^ (semente >>> 15), 1 | semente); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
const entre = (a, b) => a + Math.floor(sortear() * (b - a + 1))
const um = (xs) => xs[Math.floor(sortear() * xs.length)]
const peso = (pares) => { const t = pares.reduce((s, [, p]) => s + p, 0); let r = sortear() * t; for (const [v, p] of pares) { if ((r -= p) < 0) return v } return pares.at(-1)[0] }

// ---------------------------------------------------------------- o calendário do exemplo
const HOJE = '2026-10-15'
const MES = '2026-10'
const INICIO_DA_SIMULACAO = '2025-10'
const MESES = Array.from({ length: 13 }, (_, i) => somarMeses(INICIO_DA_SIMULACAO, i))
const R = (c) => formatarDinheiro(c)
let nId = 0
const gerarId = () => `x${++nId}`
const em = (data, hora = '10:00') => `${data}T${hora}:00-03:00`

// ---------------------------------------------------------------- nomes fictícios
// Sem nenhum nome ou sobrenome das pessoas reais que aparecem no perfil da academia (professores e atletas).
const PROIBIDOS = /\b(rafael|jo[aã]o|thales|juliana|richard|norton|arthur|leonardo|bruno|carlos|caio|gerson|erick|moreschi|toledo|cardozo|duarte|rodrigues|schutz|cesar)\b/i
const NOMES_M = ['Lucas', 'Mateus', 'Gustavo', 'Felipe', 'Henrique', 'Rodrigo', 'Eduardo', 'Marcelo', 'André', 'Tiago', 'Renan', 'Igor', 'Samuel', 'Vitor', 'Daniel', 'Guilherme', 'Murilo', 'Otávio', 'Pedro', 'Luiz', 'Alan', 'Wesley', 'Kauã', 'Emerson', 'Fernando', 'Ricardo', 'Jonas', 'Maurício', 'Anderson', 'Cristian', 'Douglas', 'Hugo', 'Jefferson', 'Márcio', 'Nicolas', 'Ramon', 'Sandro', 'Valter', 'Yuri', 'Alisson']
const NOMES_F = ['Ana', 'Beatriz', 'Camila', 'Débora', 'Elisa', 'Fernanda', 'Gabriela', 'Helena', 'Isadora', 'Jéssica', 'Larissa', 'Mariana', 'Natália', 'Patrícia', 'Raquel', 'Sabrina', 'Tainá', 'Vanessa', 'Aline', 'Bianca', 'Carolina', 'Daniela', 'Eduarda', 'Franciele', 'Letícia', 'Priscila', 'Rosana', 'Simone', 'Talita', 'Vitória']
const NOMES_KIDS = ['Davi', 'Enzo', 'Lorenzo', 'Theo', 'Miguel', 'Benício', 'Heitor', 'Gael', 'Valentina', 'Alice', 'Laura', 'Manuela', 'Sofia', 'Antônio', 'Bernardo', 'Joaquim', 'Cecília', 'Lívia', 'Isaac', 'Ravi']
const SOBRENOMES = ['Silva', 'Souza', 'Oliveira', 'Pereira', 'Lima', 'Ferreira', 'Costa', 'Martins', 'Araújo', 'Ribeiro', 'Almeida', 'Carvalho', 'Gomes', 'Barbosa', 'Rocha', 'Dias', 'Teixeira', 'Moreira', 'Cardoso', 'Machado', 'Fontoura', 'Kunz', 'Becker', 'Schmidt', 'Weber', 'Pacheco', 'Brum', 'Fagundes', 'Medeiros', 'Vargas', 'Bittencourt', 'Lemos', 'Prates', 'Quadros', 'Saldanha']
const usados = new Set()
function nomeNovo(lista) {
  for (;;) {
    const n = `${um(lista)} ${um(SOBRENOMES)}`
    if (!usados.has(n) && !PROIBIDOS.test(n)) { usados.add(n); return n }
  }
}

// ---------------------------------------------------------------- cadastro
const pessoas = []
const matriculas = []
const perfil = new Map() // pagador → como paga
const devedorDesde = new Map() // pagador → competência a partir da qual não paga mais
const nova = (nome, extra = {}) => {
  const p = { id: gerarId(), academiaId: ACADEMIA, nome, ehAluno: true, ehFuncionario: false, criadaEm: em('2026-01-01'), atualizadaEm: em('2026-01-01'), ...extra }
  pessoas.push(p); return p
}
const telefone = () => `(51) 9${entre(8000, 9999)}-${String(entre(0, 9999)).padStart(4, '0')}`

// equipe (fictícia)
const EQUIPE = [
  ['Diego Ramos', 'professor', ['muay-thai'], { tipo: 'comissao', comissaoPontosBase: 4000 }, '2023-03-01'],
  ['Paulo Vieira', 'professor', ['boxe'], { tipo: 'comissao', comissaoPontosBase: 4000 }, '2024-02-01'],
  ['Fábio Nunes', 'professor', ['jiu-jitsu', 'luta-livre'], { tipo: 'fixo_mais_comissao', fixoCentavos: 120000, comissaoPontosBase: 2500 }, '2023-08-01'],
  ['Vinícius Prado', 'professor', ['mma'], { tipo: 'por_aula', valorPorAulaCentavos: 6000 }, '2026-01-15'],
  ['Tatiane Moura', 'recepcao', [], { tipo: 'fixo', fixoCentavos: 160000 }, '2025-05-01'],
  ['Sônia Barros', 'limpeza', [], { tipo: 'fixo', fixoCentavos: 90000 }, '2024-09-01'],
]
const funcionarios = EQUIPE.map(([nome, funcao, modalidadeIds, remuneracao, desde]) => {
  usados.add(nome)
  const p = nova(nome, { ehAluno: false, ehFuncionario: true, telefone: telefone() })
  return { id: gerarId(), academiaId: ACADEMIA, pessoaId: p.id, funcao, modalidadeIds, remuneracao, desde }
})
const funcPorNome = Object.fromEntries(EQUIPE.map(([n], i) => [n, funcionarios[i]]))

const PLANO_PESO = [['muay-thai-livre', 25], ['muay-thai-2x', 17], ['muay-thai-trimestral', 4], ['boxe-2x', 13], ['jiu-jitsu-livre', 14], ['mma', 7], ['combo-2', 8], ['muay-thai-kids', 7], ['jiu-jitsu-kids', 6]]
const planoPorId = Object.fromEntries(PLANOS.map((p) => [p.id, p]))
const ehKids = (planoId) => planoId.endsWith('-kids')
const DIA_VETERANO = [[5, 30], [10, 45], [15, 10], [20, 10], [25, 5]]

function matricular({ planoId, inicio, dia, pessoa, pagador, descontos = [], extra = {} }) {
  const m = {
    id: gerarId(), academiaId: ACADEMIA, pessoaId: pessoa.id, pagadorPessoaId: (pagador ?? pessoa).id, planoId, inicio,
    estado: 'ativa', diaDeVencimento: dia, descontos, ...extra,
  }
  matriculas.push(m)
  const quem = m.pagadorPessoaId
  if (!perfil.has(quem)) perfil.set(quem, peso([['pontual', 68], ['leve', 25], ['esquecido', 7]]))
  return m
}

/** Um aluno (ou uma criança com o responsável) num plano. */
function aluno(planoId, inicio, dia, opcoes = {}) {
  if (ehKids(planoId)) {
    const resp = opcoes.responsavel ?? nova(nomeNovo(sortear() < 0.7 ? NOMES_F : NOMES_M), { ehAluno: false, ehResponsavel: true, telefone: telefone() })
    const sobrenome = resp.nome.split(' ').at(-1)
    let nomeKid; do { nomeKid = `${um(NOMES_KIDS)} ${sobrenome}` } while (usados.has(nomeKid)); usados.add(nomeKid)
    const kid = nova(nomeKid, { dataNascimento: `${entre(2014, 2020)}-${String(entre(1, 12)).padStart(2, '0')}-${String(entre(1, 28)).padStart(2, '0')}`, responsavelPessoaId: resp.id })
    return { pessoa: kid, responsavel: resp, matricula: matricular({ planoId, inicio, dia, pessoa: kid, pagador: resp, descontos: opcoes.descontos }) }
  }
  const p = nova(opcoes.nome ?? nomeNovo(sortear() < 0.62 ? NOMES_M : NOMES_F), { telefone: telefone() })
  return { pessoa: p, matricula: matricular({ planoId, inicio, dia, pessoa: p, descontos: opcoes.descontos, extra: opcoes.extra }) }
}

// 150 veteranos (entraram antes de outubro de 2025)
const veteranos = []
for (let i = 0; i < 150; i++) {
  const planoId = peso(PLANO_PESO)
  const inicio = `${entre(2022, 2025)}-${String(entre(1, 9)).padStart(2, '0')}-${String(entre(1, 28)).padStart(2, '0')}`
  veteranos.push(aluno(planoId, inicio, peso(DIA_VETERANO)))
}
// irmãos: 4 responsáveis com a segunda criança, 10 % de família na segunda (sugerirDescontoFamilia aponta; o dono aplicou)
for (const v of veteranos.filter((x) => x.responsavel).slice(0, 4)) {
  aluno(ehKids(v.matricula.planoId) && v.matricula.planoId === 'muay-thai-kids' ? 'jiu-jitsu-kids' : 'muay-thai-kids', v.matricula.inicio, v.matricula.diaDeVencimento,
    { responsavel: v.responsavel, descontos: [{ tipo: 'percentual', pontosBase: 1000, motivo: 'familia' }] })
}
// atletas da equipe de competição com 50 % e um bolsista Kids com 100 %
const adultosVet = veteranos.filter((v) => !v.responsavel)
for (const v of adultosVet.filter((x) => x.matricula.planoId === 'muay-thai-livre').slice(0, 3)) v.matricula.descontos.push({ tipo: 'percentual', pontosBase: 5000, motivo: 'atleta' })
const kidsVet = veteranos.filter((v) => v.responsavel)
kidsVet.at(-1).matricula.descontos.push({ tipo: 'percentual', pontosBase: 10000, motivo: 'bolsista' })
// trancados hoje (viagem, lesão): 6
const trancaveis = adultosVet.filter((v) => !v.matricula.descontos.length).slice(10, 16)
trancaveis.forEach((v, i) => Object.assign(v.matricula, { estado: 'trancada', trancadaDe: i % 2 ? '2026-10-01' : '2026-09-20', trancadaAte: i % 3 ? '2026-11-30' : '2026-12-31' }))
// devedores (param de pagar a partir de um mês)
const pegar = (planoId, dia, n = 0) => veteranos.filter((v) => v.matricula.planoId === planoId && v.matricula.diaDeVencimento === dia && !v.matricula.descontos.length && v.matricula.estado === 'ativa')[n]
const DEVEDORES = [[pegar('muay-thai-livre', 10), '2026-08'], [pegar('muay-thai-2x', 5), '2026-09'], [pegar('boxe-2x', 10), '2026-09'], [pegar('muay-thai-kids', 10), '2026-10'], [pegar('jiu-jitsu-livre', 5), '2026-10']]
for (const [v, desde] of DEVEDORES) devedorDesde.set(v.matricula.pagadorPessoaId, desde)
const protegidos = new Set([...DEVEDORES.map(([v]) => v.matricula.id), ...trancaveis.map((v) => v.matricula.id)])

// ---------------------------------------------------------------- funil (ago a out/2026), que dá as matrículas novas desses meses
const interessados = []
const experimentais = []
const ORIGEM = [['instagram', 45], ['whatsapp', 25], ['indicacao', 18], ['passou_na_porta', 8], [undefined, 4]]
const CONVERTE = { instagram: 0.42, whatsapp: 0.5, indicacao: 0.68, passou_na_porta: 0.55, undefined: 0.3 }
const CONTATOS = { '2026-08': 22, '2026-09': 25, '2026-10': 15 }
const novosDoFunil = { '2026-08': [], '2026-09': [], '2026-10': [] }
for (const [comp, n] of Object.entries(CONTATOS)) {
  const ultimoDia = comp === MES ? 15 : diasNoMes(comp)
  for (let k = 0; k < n; k++) {
    const origem = peso(ORIGEM)
    const contatoEm = dataNaCompetencia(comp, entre(1, ultimoDia))
    const crianca = sortear() < 0.2
    const nome = nomeNovo(sortear() < 0.6 ? NOMES_M : NOMES_F)
    const modalidade = crianca ? um(['muay-thai', 'jiu-jitsu']) : peso([['muay-thai', 45], ['boxe', 18], ['jiu-jitsu', 20], ['mma', 10], ['luta-livre', 7]])
    const i = { id: gerarId(), academiaId: ACADEMIA, nome, whatsapp: telefone(), modalidadeIds: [modalidade], ...(origem ? { origem } : {}), contatoEm,
      ...(crianca ? { crianca: { nome: um(NOMES_KIDS), idade: entre(6, 12) } } : {}) }
    interessados.push(i)
    if (sortear() > 0.82) continue // não marcou aula
    const data = somarDias(contatoEm, entre(1, 5))
    let estado = data > HOJE ? 'agendada' : sortear() < 0.76 ? 'compareceu' : 'faltou'
    experimentais.push({ id: gerarId(), academiaId: ACADEMIA, interessadoId: i.id, data, modalidadeId: modalidade, estado, marcadaPor: funcPorNome['Tatiane Moura'].pessoaId })
    const exp = experimentais.at(-1)
    if (estado !== 'compareceu') continue
    const decide = somarDias(data, entre(0, 6))
    if (decide <= HOJE && sortear() < CONVERTE[origem]) {
      i.matriculadoEm = decide; exp.estado = 'matriculou'
      novosDoFunil[competenciaDe(decide)]?.push(i)
    } else if (somarDias(data, 5) <= HOJE && sortear() < 0.55) {
      exp.estado = 'nao_seguiu'; i.desistiuEm = somarDias(data, 5); i.motivoDaDesistencia = um(['horário não fecha', 'achou caro', 'não respondeu'])
    }
  }
}
// quem foi indicado aponta para um aluno veterano que indicou
for (const i of interessados.filter((x) => x.origem === 'indicacao')) i.indicadoPorPessoaId = um(adultosVet.filter((v) => v.matricula.estado === 'ativa' && !devedorDesde.has(v.matricula.pagadorPessoaId) && !protegidos.has(v.matricula.id))).pessoa.id

// ---------------------------------------------------------------- despesas fixas
const despesa = (descricao, categoriaId, valorCentavos, diaDeVencimento, extra = {}) => ({ id: gerarId(), academiaId: ACADEMIA, descricao, categoriaId, valorCentavos, diaDeVencimento, ativa: true, variavel: false, desde: '2025-01', ...extra })
const despesasFixas = [
  despesa('Aluguel da sala', 'aluguel', 350000, 10, { formaDePagamento: 'pix' }),
  despesa('Salário — Tatiane Moura (recepção)', 'salarios', 160000, 5, { pessoaId: funcPorNome['Tatiane Moura'].pessoaId, formaDePagamento: 'pix' }),
  despesa('Salário — Sônia Barros (limpeza)', 'salarios', 90000, 5, { pessoaId: funcPorNome['Sônia Barros'].pessoaId, formaDePagamento: 'pix' }),
  despesa('Contador', 'contador', 35000, 10, { formaDePagamento: 'pix' }),
  despesa('Internet', 'internet', 12000, 15, { formaDePagamento: 'boleto' }),
  despesa('Luz', 'luz', 48000, 20, { variavel: true, formaDePagamento: 'boleto' }),
  despesa('Água', 'agua', 11000, 20, { variavel: true, formaDePagamento: 'boleto' }),
  despesa('Divulgação no Instagram', 'marketing', 20000, 1, { formaDePagamento: 'cartao_credito' }),
]
const LUZ = { '01': 61000, '02': 63500, '03': 57000, '04': 49000, '05': 42500, '06': 44000, '07': 46500, '08': 45000, '09': 43800, '10': 47200, '11': 52000, '12': 58500 }
const AGUA = { '01': 13800, '02': 14200, '03': 12500, '04': 11000, '05': 10200, '06': 9800, '07': 9900, '08': 10100, '09': 10600, '10': 11200, '11': 12100, '12': 13300 }

// ---------------------------------------------------------------- eventos e lançamentos avulsos
const eventos = [
  { id: 'ev-graduacao-jj', academiaId: ACADEMIA, nome: 'Graduação de Jiu-Jitsu (dez/25)', tipo: 'exame', data: '2025-12-13', modalidadeIds: ['jiu-jitsu'], arquivado: false },
  { id: 'ev-cordoes-mt', academiaId: ACADEMIA, nome: 'Exame de cordões do Muay Thai (jun/26)', tipo: 'exame', data: '2026-06-20', modalidadeIds: ['muay-thai'], arquivado: false },
  { id: 'ev-copa', academiaId: ACADEMIA, nome: 'Copa Gravataí de Jiu-Jitsu (ago/26)', tipo: 'campeonato', data: '2026-08-22', modalidadeIds: ['jiu-jitsu'], arquivado: false },
  { id: 'ev-lomba', academiaId: ACADEMIA, nome: 'Card de lutas — Lomba do Pinheiro (21/11)', tipo: 'luta', data: '2026-11-21', local: 'Lomba do Pinheiro', modalidadeIds: ['muay-thai'], arquivado: false },
]
const lancamentos = []
const manual = (data, descricao, categoriaId, tipo, valorCentavos, extra = {}) => {
  const l = { id: gerarId(), academiaId: ACADEMIA, data, descricao, categoriaId, tipo, valorCentavos, situacao: data <= HOJE ? 'pago' : 'pendente', origem: 'manual', formaDePagamento: 'pix', criadoPor: 'dono', criadoEm: em(data), atualizadoEm: em(data), ...extra }
  lancamentos.push(l); return l
}
const PRODUTOS = [['Luvas de treino', 18000], ['Bandagem', 3500], ['Protetor bucal', 2500], ['Camiseta Raça Fight', 8000], ['Kimono', 32000], ['Caneleira', 15000]]
function avulsos(comp) {
  const fim = comp === MES ? 15 : diasNoMes(comp)
  for (let k = entre(3, 7); k > 0; k--) { const [n, v] = um(PRODUTOS); manual(dataNaCompetencia(comp, entre(1, fim)), `Venda — ${n}`, 'produtos', 'entrada', v, { formaDePagamento: um(['pix', 'pix', 'dinheiro', 'cartao_debito']) }) }
  for (let k = entre(0, 2); k > 0; k--) manual(dataNaCompetencia(comp, entre(1, fim)), 'Aula particular', 'aulas-avulsas', 'entrada', 10000, { formaDePagamento: 'pix' })
  if (['2025-10', '2026-01', '2026-04', '2026-07', '2026-10'].includes(comp)) manual(dataNaCompetencia(comp, 8), 'Reposição de estoque (luvas, bandagens, camisetas)', 'estoque', 'saida', entre(80, 110) * 1000)
  if (comp !== MES || HOJE >= dataNaCompetencia(comp, 12)) manual(dataNaCompetencia(comp, 12), 'Produtos de limpeza', 'limpeza', 'saida', entre(14, 22) * 1000)
}
const ESPECIAIS = {
  '2025-12': () => { for (let k = 0; k < 14; k++) manual('2025-12-13', 'Taxa de graduação — Jiu-Jitsu', 'graduacoes', 'entrada', 10000, { eventoId: 'ev-graduacao-jj', reparticao: [{ modalidadeId: 'jiu-jitsu', centavos: 10000 }] }); manual('2025-12-10', 'Faixas para a graduação (14)', 'eventos-saida', 'saida', 56000, { eventoId: 'ev-graduacao-jj' }) },
  '2026-03': () => manual('2026-03-16', 'Tatame novo (20 placas)', 'equipamento', 'saida', 240000, { formaDePagamento: 'cartao_credito' }),
  '2026-06': () => { for (let k = 0; k < 18; k++) manual('2026-06-20', 'Taxa do exame de cordão — Muay Thai', 'graduacoes', 'entrada', 8000, { eventoId: 'ev-cordoes-mt', reparticao: [{ modalidadeId: 'muay-thai', centavos: 8000 }] }); manual('2026-06-15', 'Cordões (18)', 'eventos-saida', 'saida', 45000, { eventoId: 'ev-cordoes-mt' }) },
  '2026-07': () => manual('2026-07-21', 'Sacos de pancada (2)', 'equipamento', 'saida', 110000, { formaDePagamento: 'cartao_credito' }),
  '2026-08': () => { for (let k = 0; k < 9; k++) manual('2026-08-14', 'Inscrição na Copa Gravataí', 'eventos-entrada', 'entrada', 9000, { eventoId: 'ev-copa' }); manual('2026-08-15', 'Taxas de inscrição repassadas à organização (9)', 'eventos-saida', 'saida', 72000, { eventoId: 'ev-copa' }); manual('2026-08-22', 'Van para a Copa Gravataí', 'eventos-saida', 'saida', 45000, { eventoId: 'ev-copa' }) },
  '2026-10': () => { manual('2026-10-14', 'Luvas de aula (6 pares)', 'equipamento', 'saida', 72000, { formaDePagamento: 'cartao_credito' }); manual('2026-10-02', 'Reforma do vestiário (pintura)', 'limpeza', 'saida', 65000) },
}

// ---------------------------------------------------------------- a simulação, mês a mês
const cobrancas = []
const FORMAS = [['pix', 68], ['dinheiro', 14], ['cartao_debito', 10], ['cartao_credito', 8]]
const NOVOS = { '2025-10': 6, '2025-11': 7, '2025-12': 5, '2026-01': 4, '2026-02': 6, '2026-03': 11, '2026-04': 9, '2026-05': 8, '2026-06': 7, '2026-07': 6 }
const SAIDAS = { '2025-10': 4, '2025-11': 4, '2025-12': 6, '2026-01': 7, '2026-02': 6, '2026-03': 4, '2026-04': 3, '2026-05': 4, '2026-06': 4, '2026-07': 3, '2026-08': 4, '2026-09': 3, '2026-10': 0 }
const AULAS_MMA = (comp) => { let n = 0; for (let d = 1; d <= diasNoMes(comp); d++) { const dia = new Date(`${dataNaCompetencia(comp, d)}T12:00:00Z`).getUTCDay(); if (dia === 2 || dia === 4) n++ } return n }
const geracoes = {}
const remuneracoes = {}
const indicacoesDeOutubro = []

for (const comp of MESES) {
  const fim = comp === MES ? 15 : diasNoMes(comp)
  // 1. matrículas novas do mês
  if (novosDoFunil[comp]) {
    for (const i of novosDoFunil[comp]) {
      const dia = Number(i.matriculadoEm.slice(8))
      const mod = i.modalidadeIds[0]
      const planoId = i.crianca ? `${mod}-kids` : mod === 'muay-thai' ? peso([['muay-thai-livre', 55], ['muay-thai-2x', 35], ['combo-2', 10]]) : mod === 'boxe' ? 'boxe-2x' : mod === 'mma' ? 'mma' : 'jiu-jitsu-livre'
      const novo = aluno(planoId, i.matriculadoEm, dia, i.crianca ? {} : { nome: i.nome })
      i.pessoaId = novo.pessoa.id
      if (comp === MES && i.origem === 'indicacao' && i.indicadoPorPessoaId) {
        // "Traga um amiguinho" (promoção do Dia das Crianças): R$ 30 para os dois até 30/11 — valor de EXEMPLO, [decidir] A9
        const indicador = matriculas.find((m) => m.pessoaId === i.indicadoPorPessoaId && m.estado === 'ativa')
        if (indicador) {
          const r = descontosDaIndicacao({ indicador, novo: novo.matricula, desconto: { tipo: 'valor', centavos: 3000 }, ate: '2026-11-30', interessadoId: i.id })
          Object.assign(indicador, r.indicador); Object.assign(novo.matricula, r.novo)
          indicacoesDeOutubro.push({ indicador: pessoas.find((p) => p.id === indicador.pessoaId).nome, novo: novo.pessoa.nome })
        }
      }
    }
  } else {
    for (let k = NOVOS[comp] ?? 0; k > 0; k--) { const d = entre(1, fim); aluno(peso(PLANO_PESO), dataNaCompetencia(comp, d), d) }
  }
  // 2. mensalidades do mês (regra do primeiro mês: "cheio", a recomendação da A7 — [decidir])
  const vivas = matriculas.filter((m) => !(m.fim && m.fim < `${comp}-01`) && m.inicio <= dataNaCompetencia(comp, 31))
  const g = gerarMensalidadesDoMes({ competencia: comp, matriculas: vivas, planos: PLANOS, existentes: cobrancas, primeiroMes: 'cheio', gerarId, em: em(`${comp}-01`, '06:00') })
  geracoes[comp] = { novas: g.novas.length, mensalidades: g.novas.filter((c) => c.tipo === 'mensalidade').length, taxas: g.novas.filter((c) => c.tipo === 'matricula').length,
    valor: g.novas.reduce((s, c) => s + c.valorCentavos, 0), descontos: g.novas.reduce((s, c) => s + c.descontoCentavos, 0),
    puladas: g.puladas.reduce((o, p) => ({ ...o, [p.motivo]: (o[p.motivo] ?? 0) + 1 }), {}) }
  // 3. quem paga e quando
  for (const c of g.novas) {
    cobrancas.push(c)
    const desde = devedorDesde.get(c.pessoaId)
    if (desde && comp >= desde) continue
    const p = perfil.get(c.pessoaId)
    const atraso = p === 'pontual' ? entre(-5, 1) : p === 'leve' ? entre(1, 9) : entre(8, 25)
    let data = somarDias(c.vencimento, atraso)
    if (data < `${comp}-01`) data = `${comp}-01`
    if (data > HOJE) continue
    const r = marcarComoPaga(c, { data, forma: peso(FORMAS), categoriaId: c.tipo === 'matricula' ? 'matriculas' : 'mensalidades', porId: 'dono', em: em(data, '18:30'), gerarId })
    Object.assign(c, r.cobranca)
    lancamentos.push(r.lancamento)
  }
  // 4. despesas fixas (geradas pendentes; as que já venceram foram pagas pelo valor da conta)
  for (const l of gerarDespesasFixasDoMes({ competencia: comp, despesas: despesasFixas, lancamentos, porId: 'dono', em: em(`${comp}-01`, '06:00'), gerarId })) {
    if (l.data <= HOJE) {
      l.situacao = 'pago'
      const mm = comp.slice(5)
      if (l.despesaFixaId === despesasFixas[5].id) { l.valorCentavos = LUZ[mm]; delete l.estimado }
      if (l.despesaFixaId === despesasFixas[6].id) { l.valorCentavos = AGUA[mm]; delete l.estimado }
    }
    lancamentos.push(l)
  }
  // 5. remuneração dos professores do mês anterior, lançada pelo dono no dia 5 (RA6.5: o Admin calcula, o dono lança)
  const anterior = somarMeses(comp, -1)
  if (comp > INICIO_DA_SIMULACAO) {
    remuneracoes[anterior] = []
    for (const f of funcionarios.filter((x) => x.funcao === 'professor' && x.desde <= dataNaCompetencia(anterior, 31))) {
      const r = calcularRemuneracaoDoMes(f, lancamentos, anterior, f.remuneracao.tipo === 'por_aula' ? { aulasDadas: AULAS_MMA(anterior) } : {})
      const nome = pessoas.find((p) => p.id === f.pessoaId).nome
      remuneracoes[anterior].push({ nome, modalidades: f.modalidadeIds, tipo: f.remuneracao.tipo, ...r, aulas: f.remuneracao.tipo === 'por_aula' ? AULAS_MMA(anterior) : null })
      const dia5 = dataNaCompetencia(comp, 5)
      if (r.fixoCentavos) manual(dia5, `Fixo de ${nomeDaCompetencia(anterior)} — ${nome}`, 'salarios', 'saida', r.fixoCentavos, { pessoaId: f.pessoaId, origem: 'remuneracao' })
      const variavel = r.comissaoCentavos + r.porAulaCentavos
      if (variavel) manual(dia5, `${r.porAulaCentavos ? 'Aulas' : 'Comissão'} de ${nomeDaCompetencia(anterior)} — ${nome}`, 'comissoes', 'saida', variavel, { pessoaId: f.pessoaId, origem: 'remuneracao' })
    }
    // imposto do Simples (DAS) sobre o que entrou no mês anterior: 6 % (exemplo)
    const entrou = totaisDoPeriodo(lancamentos, periodoDaCompetencia(anterior)).entradas
    manual(dataNaCompetencia(comp, 20), `DAS (Simples Nacional) — ${nomeDaCompetencia(anterior)}`, 'impostos', 'saida', Math.round(entrou * 0.06), { formaDePagamento: 'boleto' })
  }
  // 6. o resto do mês
  avulsos(comp)
  ESPECIAIS[comp]?.()
  // 7. quem saiu no mês (a última mensalidade foi gerada; a matrícula encerra no fim do mês)
  for (let k = SAIDAS[comp] ?? 0; k > 0; k--) {
    const cand = matriculas.filter((m) => m.estado === 'ativa' && m.inicio < `${comp}-01` && !protegidos.has(m.id) && !devedorDesde.has(m.pagadorPessoaId))
    const m = um(cand)
    Object.assign(m, { estado: 'encerrada', fim: dataNaCompetencia(comp, 31) })
  }
}

// ---------------------------------------------------------------- fechamentos (nov/25 a set/26), cada um no dia 3 do mês seguinte
const fechamentos = []
const comoEstavaEm = (data) => cobrancas.map((c) => (c.estado === 'paga' && c.pagaEm > data ? { ...c, estado: 'aberta' } : c))
for (const comp of MESES.slice(1, -1)) {
  const dia = dataNaCompetencia(somarMeses(comp, 1), 3)
  fechamentos.push(fecharMes({ id: gerarId(), academiaId: ACADEMIA, competencia: comp, lancamentos: lancamentos.filter((l) => l.data <= dia), cobrancas: comoEstavaEm(dia), porId: 'dono', em: em(dia, '21:10'), fechamentos }))
}

// ---------------------------------------------------------------- anotar e lembrar
const nomeDe = (id) => pessoas.find((p) => p.id === id)?.nome ?? (id === 'dono' ? 'Você' : id)
const primeiro = (id) => nomeDe(id).split(' ')[0]
const lembretes = []
const lembrete = (l) => { const x = { id: gerarId(), academiaId: ACADEMIA, criadoPor: 'dono', criadoEm: em('2026-10-01'), avisarDiasAntes: 0, repeticao: 'nao_repete', ...l }; const e = validarLembrete(x); if (e.length) throw new Error(e.join('; ')); lembretes.push(x); return x }
const devA = DEVEDORES[0][0].matricula.pagadorPessoaId
lembrete({ titulo: `Cobrar ${nomeDe(devA)}`, data: '2026-10-13', pessoaId: devA })
lembrete({ titulo: 'Renovar o alvará dos bombeiros', data: HOJE, repeticao: 'anual', avisarDiasAntes: 30 })
lembrete({ titulo: 'Vence: Luz e água', data: '2026-10-20', repeticao: 'mensal', diaDoMes: 20, avisarDiasAntes: 5 })
lembrete({ titulo: 'Card da Lomba do Pinheiro: fechar a van', data: '2026-11-10', avisarDiasAntes: 30 })
lembrete({ titulo: 'Vence: Aluguel da sala', data: '2026-11-10', repeticao: 'mensal', diaDoMes: 10, avisarDiasAntes: 3, valorCentavos: 350000 })
const retornos = retornosPendentes(interessados, experimentais, HOJE, { diasDepois: 3 }) // 3 dias é a proposta da A15 — [decidir]
for (const r of retornos.filter((x) => x.compareceuEm >= '2026-10-01')) lembretes.push(lembreteDeRetorno(r.interessado, r.compareceuEm, { diasDepois: 3, gerarId, porId: 'dono', em: em(r.compareceuEm) }))
const tarefa = (titulo, prazo, resp) => ({ id: gerarId(), academiaId: ACADEMIA, titulo, ...(prazo ? { prazo } : {}), ...(resp ? { responsavelPessoaId: funcPorNome[resp].pessoaId } : {}), criadaPor: 'dono', criadaEm: em('2026-10-05') })
const tarefas = [tarefa('Trocar 4 placas do tatame', '2026-10-12'), tarefa('Comprar bandagens para a loja', '2026-10-18', 'Tatiane Moura'), tarefa('Mandar o fechamento de setembro ao contador', '2026-10-20'), tarefa('Orçamento de ventiladores novos')]
const notas = [
  { texto: `${primeiro(DEVEDORES[4][0].matricula.pagadorPessoaId)} combinou pagar a mensalidade no dia 20.`, pessoa: nomeDe(DEVEDORES[4][0].matricula.pagadorPessoaId), data: '2026-10-11', fixada: true },
  { texto: 'Card de 21/11: 6 atletas confirmados, falta o exame médico de 2.', pessoa: null, data: '2026-10-09', fixada: true },
  { texto: 'Fornecedor de luvas novo: pedir orçamento de 10 pares antes de dezembro.', pessoa: null, data: '2026-10-02', fixada: false },
]

// ---------------------------------------------------------------- o painel (a mesma chamada que a tela fará)
const painel = resumoDoPainel({ pessoas, matriculas, planos: PLANOS, cobrancas, funcionarios, lancamentos, despesasFixas, categorias: CATEGORIAS, interessados, experimentais, lembretes, tarefas, competencia: MES, hoje: HOJE })
const dia = lembretesDoDia(lembretes, HOJE)

// ---------------------------------------------------------------- relatórios
const SET = '2026-09'
const pSet = periodoDaCompetencia(SET)
const pOut = periodoDaCompetencia(MES)
const tri = { de: '2026-07-01', ate: '2026-09-30' }
const nomeMod = Object.fromEntries(MODALIDADES.map((m) => [m.id, m.nome]))
const nomeCat = Object.fromEntries(CATEGORIAS.map((c) => [c.id, c.nome]))
const porModalidade = (periodo) => {
  const m = quantoEntrouPorModalidade(lancamentos, periodo)
  const total = totaisDoPeriodo(lancamentos, periodo).entradas
  const comMod = [...m.values()].reduce((s, v) => s + v, 0)
  return { linhas: MODALIDADES.map((x) => ({ id: x.id, nome: x.nome, centavos: m.get(x.id) ?? 0, texto: R(m.get(x.id) ?? 0) })).sort((a, b) => b.centavos - a.centavos),
    semModalidade: { centavos: total - comMod, texto: R(total - comMod) }, total: { centavos: total, texto: R(total) } }
}
const porCategoria = (periodo) => [...somarPor(lancamentos, periodo, (l) => l.categoriaId ?? 'sem_categoria')].map(([id, v]) => ({ id, nome: nomeCat[id] ?? 'Sem categoria', ...v, entradasTexto: R(v.entradas), saidasTexto: R(v.saidas) }))
const porForma = [...somarPor(lancamentos, pSet, (l) => (l.tipo === 'entrada' ? l.formaDePagamento : undefined))].map(([id, v]) => ({ id, centavos: v.entradas, texto: R(v.entradas) })).sort((a, b) => b.centavos - a.centavos)
const eventosRes = [...resultadoPorEvento(lancamentos)].map(([id, v]) => ({ id, nome: eventos.find((e) => e.id === id).nome, ...v, entradasTexto: R(v.entradas), saidasTexto: R(v.saidas), resultadoTexto: R(v.resultado) }))

const tot = (p) => { const t = totaisDoPeriodo(lancamentos, p); return { ...t, entradasTexto: R(t.entradas), saidasTexto: R(t.saidas), resultadoTexto: R(t.resultado), entradasPendentesTexto: R(t.entradasPendentes), saidasPendentesTexto: R(t.saidasPendentes) } }
const fechSet = fechamentos.find((f) => f.competencia === SET)

// inadimplência
const inad = listarInadimplentes(cobrancas, HOJE).map((i) => {
  const cs = cobrancas.filter((c) => i.cobrancaIds.includes(c.id))
  const alunos = [...new Set(cs.filter((c) => c.alunoPessoaId).map((c) => nomeDe(c.alunoPessoaId)))]
  const planos = [...new Set(cs.map((c) => matriculas.find((m) => m.id === c.matriculaId)?.planoId))].map((id) => planoPorId[id]?.nome)
  return { nome: nomeDe(i.pessoaId), alunos, planos, cobrancas: cs.length, totalCentavos: i.totalCentavos, total: R(i.totalCentavos), dias: i.diasDoAtrasoMaisAntigo, vencimento: formatarDataBR(i.vencimentoMaisAntigo) }
})
const taxaSet = taxaDeInadimplencia(cobrancas, SET, HOJE)
const taxaOut = taxaDeInadimplencia(cobrancas, MES, HOJE)
const maisDe30 = listarInadimplentes(cobrancas, HOJE, { haMaisDeDias: 30 })

// encargos, SE a academia decidir cobrar (A3): o teto que as fontes citam e 5 dias de tolerância
const REGRA = { multaPontosBase: 200, jurosAoMesPontosBase: 100, diasDeTolerancia: 5 }
if (validarRegraDeAtraso(REGRA).length) throw new Error('regra de atraso inválida')
const enc = calcularEncargos(15000, '2026-09-10', HOJE, REGRA)

// filtros totais
const linhas = linhasDeAlunos({ pessoas, matriculas, planos: PLANOS, cobrancas }, HOJE)
const mt30 = filtrarAlunos(linhas, { modalidadeIds: ['muay-thai'], inadimplenteHaMaisDeDias: 30 })
const kidsLinhas = filtrarAlunos(linhas, { situacoes: ['matriculado'], planoIds: ['muay-thai-kids', 'jiu-jitsu-kids'] })
const novosOut = filtrarAlunos(linhas, { novosDesde: '2026-10-01' })
const jjTri = quantoEntrou(lancamentos, { periodo: tri, modalidadeIds: ['jiu-jitsu'] })
const boxeTri = quantoEntrou(lancamentos, { periodo: tri, modalidadeIds: ['boxe'] })
const equipAno = filtrarLancamentos(lancamentos, { periodo: { de: '2026-01-01', ate: HOJE }, categoriaIds: ['equipamento'] })
const alunosPorModalidade = MODALIDADES.map((m) => ({ nome: m.nome, n: filtrarAlunos(linhas, { situacoes: ['matriculado'], modalidadeIds: [m.id] }).length }))

// funil
const funilOut = conversaoDoFunil(interessados, experimentais, pOut)
const funil3 = conversaoDoFunil(interessados, experimentais, { de: '2026-08-01', ate: HOJE })
const pb = (x) => formatarPontosBase(x)
const fmtFunil = (n) => ({ ...n, expMat: pb(n.experimentalParaMatriculaPontosBase), contMat: pb(n.contatoParaMatriculaPontosBase) })
const ROT_ORIGEM = { instagram: 'Instagram', whatsapp: 'WhatsApp', indicacao: 'Indicação', passou_na_porta: 'Passou na porta', outro: 'Outro', nao_informado: 'Não informado' }
const retornosLista = retornos.map((r) => ({ nome: r.interessado.nome, modalidade: nomeMod[r.interessado.modalidadeIds[0]], fez: formatarDataBR(r.compareceuEm), dias: diasEntre(r.compareceuEm, HOJE), origem: ROT_ORIGEM[r.interessado.origem ?? 'nao_informado'] }))

// cobranças de outubro: uma amostra de cada situação
const ROT_SIT = { a_vencer: 'A vencer', vence_hoje: 'Vence hoje', atrasada: 'Atrasada', paga: 'Paga', cancelada: 'Cancelada' }
const cobOut = cobrancas.filter((c) => c.competencia === MES)
const contaSit = cobOut.reduce((o, c) => { const s = situacaoDaCobranca(c, HOJE).estado; o[s] = (o[s] ?? 0) + 1; return o }, {})
const somaSit = cobOut.reduce((o, c) => { const s = situacaoDaCobranca(c, HOJE).estado; o[s] = (o[s] ?? 0) + c.valorCentavos; return o }, {})
const amostraCob = []
for (const s of ['atrasada', 'vence_hoje', 'paga', 'a_vencer']) {
  const xs = cobOut.filter((c) => situacaoDaCobranca(c, HOJE).estado === s && c.tipo === 'mensalidade')
  const pegar2 = s === 'paga' ? [xs.find((c) => c.descontoCentavos), xs.find((c) => c.alunoPessoaId), xs[3]] : s === 'atrasada' ? [xs.find((c) => c.alunoPessoaId) ?? xs[0], xs[1]] : [xs[0], xs.find((c) => c.alunoPessoaId) ?? xs[1]]
  for (const c of pegar2.filter(Boolean)) {
    const st = situacaoDaCobranca(c, HOJE)
    const m = matriculas.find((x) => x.id === c.matriculaId)
    const motivo = m?.descontos.filter((d) => !d.ate || d.ate >= c.vencimento).map((d) => d.motivo)
    amostraCob.push({ nome: nomeDe(c.pessoaId), aluno: c.alunoPessoaId ? nomeDe(c.alunoPessoaId) : null, plano: planoPorId[m.planoId].nome, vencimento: formatarDataBR(c.vencimento), bruto: R(c.valorBrutoCentavos), desconto: c.descontoCentavos ? `${R(c.descontoCentavos)} (${motivo.join(', ')})` : '—', valor: R(c.valorCentavos), situacao: ROT_SIT[st.estado], dias: st.diasDeAtraso, pagaEm: c.pagaEm ? formatarDataBR(c.pagaEm) : null, forma: c.formaDePagamento ?? null, reparticao: c.reparticao.map((p) => `${nomeMod[p.modalidadeId]} ${R(p.centavos)}`).join(' + ') })
  }
}
const combo = cobOut.find((c) => matriculas.find((m) => m.id === c.matriculaId)?.planoId === 'combo-2' && !c.descontoCentavos)

// a grade de outubro (as linhas mais recentes, como a tela abriria)
const ROT_FORMA = { pix: 'Pix', dinheiro: 'Dinheiro', cartao_credito: 'Crédito', cartao_debito: 'Débito', boleto: 'Boleto', transferencia: 'Transferência', outro: 'Outro' }
const linhaGrade = (l) => ({ data: formatarDataBR(l.data), descricao: l.descricao, categoria: nomeCat[l.categoriaId] ?? '', tipo: l.tipo === 'entrada' ? 'Entrada' : 'Saída', valor: R(l.valorCentavos), forma: ROT_FORMA[l.formaDePagamento] ?? '', pessoa: l.pessoaId ? nomeDe(l.pessoaId) : '', situacao: l.situacao === 'pago' ? 'Pago' : 'Pendente', estimado: !!l.estimado, origem: l.origem })
const doMes = lancamentos.filter((l) => l.data.startsWith(MES))
const grade = [...doMes.filter((l) => l.data >= '2026-10-13' && l.data <= HOJE).sort((a, b) => b.data.localeCompare(a.data) || a.tipo.localeCompare(b.tipo)).slice(0, 9), ...doMes.filter((l) => l.situacao === 'pendente').sort((a, b) => a.data.localeCompare(b.data))].map(linhaGrade)

// colar do Excel: 5 linhas, uma com erro
const ctxGrade = { categorias: CATEGORIAS, pessoas, hoje: HOJE, academiaId: ACADEMIA, porId: 'dono', em: em(HOJE), gerarId }
const COLADO = ['13/10\tVenda — Bandagem\tVenda de produtos\tEntrada\t35,00\tpix', '13/10\tVenda — Protetor bucal\tVenda de produtos\tEntrada\t25\tdinheiro', '14/10\tGás do bebedouro\tOutras saídas\tSaída\t-110,00\tpix', '14/10\tAula particular\tAulas avulsas\tEntrada\t100\tpix', '31/09\tTaxa da maquininha\tImpostos\tSaída\t42,90\tdébito'].join('\n')
const colado = colarNaGrade(COLADO, 'data', ctxGrade)
const edicoes = [['valor', '160'], ['valor', 'R$ 1.600'], ['valor', '-20'], ['data', '5/10'], ['forma', 'espécie'], ['valor', 'doze']].map(([col, t]) => {
  const base = { id: 'e', academiaId: ACADEMIA, data: HOJE, descricao: 'x', tipo: 'entrada', valorCentavos: 100, situacao: 'pago', origem: 'manual', criadoPor: 'dono', criadoEm: '', atualizadoEm: '' }
  const r = editarCelula(base, col, t, ctxGrade)
  return { digitou: t, coluna: col, vira: r.ok ? (col === 'valor' ? `${r.lancamento.tipo === 'saida' ? 'saída de ' : ''}${R(r.lancamento.valorCentavos)}` : col === 'data' ? formatarDataBR(r.lancamento.data) : ROT_FORMA[r.lancamento.formaDePagamento]) : `não grava: ${r.erro}` }
})

// importar: a "planilhazinha" de setembro, montada com 40 linhas reais do exemplo + total + 2 linhas com problema
const ROT_PAGO = ['sim', 'ok', 'pago', '']
const setLinhas = lancamentos.filter((l) => l.data.startsWith(SET) && l.situacao === 'pago').sort((a, b) => a.data.localeCompare(b.data))
const amostra = setLinhas.filter((_, i) => i % 4 === 0).slice(0, 40)
const csv = ['Controle financeiro — setembro 2026;;;;;', 'Data;Descrição;Entrada;Saída;Categoria;Pago?']
for (const l of amostra) {
  const desc = l.origem === 'mensalidade' ? `Mensalidade ${nomeDe(l.pessoaId).split(' ')[0]} ${nomeDe(l.pessoaId).split(' ').at(-1)[0]}.` : l.descricao
  const cat = l.categoriaId === 'produtos' && /Kimono/.test(l.descricao) ? 'Kimonos' : nomeCat[l.categoriaId]?.replace(/ \(.*\)$/, '')
  const v = formatarDinheiro(l.valorCentavos, { semSimbolo: true })
  csv.push(`${formatarDataBR(l.data)};"${desc}";${l.tipo === 'entrada' ? v : ''};${l.tipo === 'saida' ? v : ''};${cat ?? ''};${um(ROT_PAGO)}`)
}
csv.splice(12, 0, '12/09/2026;Kimono vendido (A2);320,00;;Kimonos;sim')
csv.push('31/09/2026;Mensalidade Gisele R.;150,00;;Mensalidades;sim', '18/09/2026;Uniforme da equipe;;a combinar;Equipamento;', ';TOTAL;;;;')
const planilha = csv.join('\r\n')
const celulas = lerCSV(planilha)
const cab = acharCabecalho(celulas)
const colunasDet = detectarColunas(celulas, cab)
const conf = conferirImportacao({ linhas: celulas, indiceDoCabecalho: cab, colunas: colunasDet, categorias: CATEGORIAS, pessoas, modalidades: MODALIDADES, existentes: [], hoje: HOJE })
const comAviso = conf.linhas.filter((l) => l.avisos.length && !l.erros.length).length
const confRepetida = conferirImportacao({ linhas: celulas, indiceDoCabecalho: cab, colunas: colunasDet, categorias: CATEGORIAS, pessoas, modalidades: MODALIDADES, existentes: lancamentos, hoje: HOJE })

// exportar: as 5 primeiras linhas de outubro como o Excel vai ver
const pagosOut = doMes.filter((l) => l.situacao === 'pago').sort((a, b) => a.data.localeCompare(b.data))
const exportado = exportarLancamentos([...pagosOut.filter((l) => l.tipo === 'entrada').slice(0, 4), ...pagosOut.filter((l) => l.tipo === 'saida').slice(0, 3)], { categorias: CATEGORIAS, pessoas, modalidades: MODALIDADES })

// histórico em frase
const luvas = lancamentos.find((l) => l.descricao === 'Luvas de aula (6 pares)')
const hist = []
const reg = (x) => { const r = registroDeMudanca({ academiaId: ACADEMIA, gerarId, ...x }); hist.push(descreverRegistro(r, { nomeDe, rotuloDe: (campo, v) => (campo === 'estado' ? { ativa: 'ativa', trancada: 'trancada', aberta: 'aberta', paga: 'paga' }[v] : campo === 'formaDePagamento' ? ROT_FORMA[v] : undefined) })) }
reg({ tabela: 'lancamentos', antes: luvas, depois: { ...luvas, valorCentavos: 76000 }, porId: 'dono', em: em('2026-10-14', '18:22') })
const trancada = trancaveis[1].matricula
reg({ tabela: 'matriculas', antes: { ...trancada, estado: 'ativa', trancadaDe: undefined, trancadaAte: undefined }, depois: trancada, porId: 'dono', em: em('2026-10-01', '09:40') })
const umaPaga = cobOut.find((c) => c.estado === 'paga' && c.pagaEm === '2026-10-14')
reg({ tabela: 'cobrancas', antes: { ...umaPaga, estado: 'aberta', pagaEm: undefined, formaDePagamento: undefined, valorPagoCentavos: undefined, lancamentoId: undefined }, depois: umaPaga, porId: 'dono', em: em('2026-10-14', '19:05') })
reg({ tabela: 'fechamentos', antes: undefined, depois: fechSet, porId: 'dono', em: fechSet.fechadoEm, acao: 'fechou' })
const ultimoInteressado = interessados.filter((i) => i.contatoEm <= HOJE).sort((a, b) => b.contatoEm.localeCompare(a.contatoEm))[0]
reg({ tabela: 'interessados', antes: undefined, depois: ultimoInteressado, porId: funcPorNome['Tatiane Moura'].pessoaId, em: em(ultimoInteressado.contatoEm, '15:12') })

// cobrar no WhatsApp: o texto pronto (RA5.5), sem dado de saúde
const d5 = inad.find((i) => i.dias > 0 && i.dias < 15) ?? inad.at(-1)
const cobD5 = cobrancas.find((c) => nomeDe(c.pessoaId) === d5.nome && situacaoDaCobranca(c, HOJE).estado === 'atrasada')
const whats = `Olá, ${d5.nome.split(' ')[0]}! A mensalidade de ${nomeDaCompetencia(cobD5.competencia).split(' ')[0]} da Raça Fight venceu em ${formatarDataBR(cobD5.vencimento).slice(0, 5)}, no valor de ${R(cobD5.valorCentavos)}. Se já pagou, desconsidere.`

// funcionários
const ROT_FUNCAO = { professor: 'Professor', recepcao: 'Recepção', limpeza: 'Limpeza', administrativo: 'Administrativo', outro: 'Outro' }
const ROT_REM = (r) => r.tipo === 'comissao' ? `Comissão de ${pb(r.comissaoPontosBase)}` : r.tipo === 'fixo_mais_comissao' ? `${R(r.fixoCentavos)} + ${pb(r.comissaoPontosBase)}` : r.tipo === 'por_aula' ? `${R(r.valorPorAulaCentavos)} por aula` : r.tipo === 'fixo' ? `Fixo de ${R(r.fixoCentavos)}` : 'Sem remuneração'
const equipe = funcionarios.map((f) => {
  const nome = nomeDe(f.pessoaId)
  const rem = remuneracoes[SET].find((r) => r.nome === nome)
  return { nome, funcao: ROT_FUNCAO[f.funcao], modalidades: f.modalidadeIds.map((m) => nomeMod[m]).join(' e ') || '—', regra: ROT_REM(f.remuneracao), desde: formatarDataBR(f.desde),
    setembro: rem ? R(rem.totalCentavos) : R(f.remuneracao.fixoCentavos ?? 0), detalhe: rem ? (rem.aulas != null ? `${rem.aulas} aulas` : rem.baseDaComissaoCentavos ? `base ${R(rem.baseDaComissaoCentavos)}` : '') : 'despesa fixa' }
})
const folhaSet = equipe.reduce((s, e) => s + Number(e.setembro.replace(/[^\d]/g, '')), 0)

// despesas fixas de novembro (o que vai virar linha pendente sozinho; luz e água pela média de 3 meses)
const novembro = gerarDespesasFixasDoMes({ competencia: '2026-11', despesas: despesasFixas, lancamentos, porId: 'dono', em: em('2026-11-01'), gerarId: () => 'previa' })
  .map((l) => ({ descricao: l.descricao, categoria: nomeCat[l.categoriaId], valor: R(l.valorCentavos), centavos: l.valorCentavos, dia: formatarDataBR(l.data).slice(0, 5), estimado: !!l.estimado }))

// alunos: uma amostra para a lista, e a ficha de uma família do Kids
const ROT_SITA = { matriculado: 'Matriculado', trancado: 'Trancado', inativo: 'Inativo' }
const linhaAluno = (x) => ({ nome: x.pessoa.nome, telefone: x.pessoa.telefone ?? '', situacao: ROT_SITA[x.situacao], planos: x.planoIds.map((id) => planoPorId[id].nome).join(' + '),
  responsavel: x.pessoa.responsavelPessoaId ? nomeDe(x.pessoa.responsavelPessoaId) : '', atraso: x.emAtrasoCentavos ? R(x.emAtrasoCentavos) : '—', dias: x.diasDeAtraso,
  desconto: x.motivosDeDesconto.join(', '), desde: x.desde ? formatarDataBR(x.desde) : '' })
const porNome = (n) => linhas.find((x) => x.pessoa.nome === n)
const famInad = inad.find((i) => i.alunos.length >= 2) ?? inad.find((i) => i.alunos.length)
const kidsDaFamilia = famInad.alunos.map(porNome)
const escolhidos = [
  porNome(inad[0].nome), ...kidsDaFamilia, linhas.find((x) => x.situacao === 'trancado'),
  porNome(indicacoesDeOutubro[0]?.novo), linhas.find((x) => x.situacao === 'matriculado' && x.planoIds.includes('combo-2') && !x.diasDeAtraso),
  linhas.find((x) => x.situacao === 'matriculado' && x.planoIds.includes('mma') && !x.diasDeAtraso),
  linhas.find((x) => x.situacao === 'matriculado' && x.planoIds.includes('boxe-2x') && !x.diasDeAtraso),
  linhas.find((x) => x.situacao === 'matriculado' && x.motivosDeDesconto.includes('atleta')),
].filter(Boolean)
const alunosAmostra = [...new Set(escolhidos)].sort((a, b) => a.pessoa.nome.localeCompare(b.pessoa.nome)).map(linhaAluno)
const resp = pessoas.find((p) => p.nome === famInad.nome)
const fichaCobs = cobrancas.filter((c) => c.pessoaId === resp.id && c.competencia >= '2026-08').sort((a, b) => b.vencimento.localeCompare(a.vencimento) || (a.alunoPessoaId ?? '').localeCompare(b.alunoPessoaId ?? ''))
const ficha = {
  responsavel: resp.nome, telefone: resp.telefone,
  dependentes: matriculas.filter((m) => m.pagadorPessoaId === resp.id && m.estado !== 'encerrada').map((m) => ({ nome: nomeDe(m.pessoaId), plano: planoPorId[m.planoId].nome, desde: formatarDataBR(m.inicio), dia: m.diaDeVencimento,
    desconto: m.descontos.map((d) => (d.tipo === 'percentual' ? `${pb(d.pontosBase)} (${d.motivo === 'familia' ? 'família' : d.motivo})` : `${R(d.centavos)} (${d.motivo})`)).join(', ') })),
  cobrancas: fichaCobs.map((c) => { const s = situacaoDaCobranca(c, HOJE); return { aluno: nomeDe(c.alunoPessoaId).split(' ')[0], mes: nomeDaCompetencia(c.competencia, true), valor: R(c.valorCentavos), situacao: ROT_SIT[s.estado], dias: s.diasDeAtraso, pagaEm: c.pagaEm ? formatarDataBR(c.pagaEm) : null } }),
}

// ---------------------------------------------------------------- saída
const evolucao = painel.evolucao.map((e) => ({ ...e, nome: nomeDaCompetencia(e.competencia, true), entradasTexto: R(e.entradas), saidasTexto: R(e.saidas), resultadoTexto: R(e.resultado) }))
const varTexto = (v) => ({ ...v, diferencaTexto: R(v.diferenca), pbTexto: v.pontosBase == null ? '—' : pb(v.pontosBase) })
const dados = {
  geradoEm: new Date().toISOString(), hoje: HOJE, hojeBR: formatarDataBR(HOJE), mes: MES, mesNome: nomeDaCompetencia(MES), setNome: nomeDaCompetencia(SET),
  regraDoPrimeiroMes: 'cheio',
  planos: PLANOS.map((p) => ({ nome: p.nome, valor: R(p.valorCentavos), periodicidade: p.periodicidade, taxa: p.taxaDeMatriculaCentavos ? R(p.taxaDeMatriculaCentavos) : null, modalidades: p.modalidadeIds.map((m) => nomeMod[m]) })),
  contagem: { pessoas: pessoas.length, matriculas: matriculas.length, cobrancas: cobrancas.length, lancamentos: lancamentos.length, interessados: interessados.length },
  painel: {
    ...painel,
    mesTexto: { entradas: R(painel.mes.entradas), saidas: R(painel.mes.saidas), resultado: R(painel.mes.resultado), entradasPendentes: R(painel.mes.entradasPendentes), saidasPendentes: R(painel.mes.saidasPendentes) },
    comparacaoTexto: { entradas: varTexto(painel.comparacao.entradas), saidas: varTexto(painel.comparacao.saidas), resultado: varTexto(painel.comparacao.resultado) },
    previsaoTexto: Object.fromEntries(Object.entries(painel.previsao).map(([k, v]) => [k, R(v)])),
    inadimplentesTexto: R(painel.inadimplentes.centavos),
    funilTexto: fmtFunil(painel.funil),
  },
  hojeLista: { atrasados: dia.atrasados.map((l) => l.titulo), hoje: dia.hoje.map((l) => l.titulo), emBreve: dia.emBreve.map((l) => ({ titulo: l.titulo, data: formatarDataBR(l.data) })),
    tarefas: tarefasAbertas(tarefas, HOJE).map((t) => ({ titulo: t.tarefa.titulo, prazo: t.tarefa.prazo ? formatarDataBR(t.tarefa.prazo) : null, atrasada: t.atrasada, resp: t.tarefa.responsavelPessoaId ? nomeDe(t.tarefa.responsavelPessoaId) : null })) },
  notas,
  evolucao,
  geracaoOut: geracoes[MES], geracaoOutTexto: R(geracoes[MES].valor), descontosOutTexto: R(geracoes[MES].descontos),
  cobrancasOut: { total: cobOut.length, contaSit, somaSit: Object.fromEntries(Object.entries(somaSit).map(([k, v]) => [k, R(v)])), amostra: amostraCob,
    combo: combo ? { descricao: combo.descricao, valor: R(combo.valorCentavos), partes: combo.reparticao.map((p) => `${nomeMod[p.modalidadeId]}: ${R(p.centavos)}`) } : null },
  indicacoesDeOutubro,
  setembro: { ...tot(pSet), porCategoria: porCategoria(pSet), fechadoEm: formatarDataBR(fechSet.fechadoEm.slice(0, 10)), aReceberEmAberto: R(fechSet.aReceberEmAberto) },
  outubro: tot(pOut),
  pendenciasOut: pendenciasAntesDeFechar(MES, lancamentos, cobrancas, HOJE).map((p) => ({ ...p, texto: R(p.centavos) })),
  fechamentos: fechamentos.map((f) => ({ mes: nomeDaCompetencia(f.competencia, true), em: formatarDataBR(f.fechadoEm.slice(0, 10)), entradas: R(f.totais.entradas), saidas: R(f.totais.saidas), resultado: R(f.totais.resultado), resultadoCentavos: f.totais.resultado })),
  inadimplentes: inad, maisDe30: maisDe30.length, maisDe30Texto: R(maisDe30.reduce((s, i) => s + i.totalCentavos, 0)),
  taxaSet: { ...taxaSet, texto: pb(taxaSet.pontosBase), vencido: R(taxaSet.vencidoCentavos), atraso: R(taxaSet.emAtrasoCentavos) },
  taxaOut: { ...taxaOut, texto: pb(taxaOut.pontosBase), vencido: R(taxaOut.vencidoCentavos), atraso: R(taxaOut.emAtrasoCentavos) },
  encargos: { regra: '2 % de multa, 1 % ao mês de juros, 5 dias de tolerância', valor: R(15000), vencimento: '10/09/2026', pagoEm: formatarDataBR(HOJE), multa: R(enc.multaCentavos), juros: R(enc.jurosCentavos), total: R(15000 + enc.totalCentavos), dias: enc.diasDeAtraso },
  whats,
  porModalidadeSet: porModalidade(pSet), porModalidadeTri: porModalidade(tri), porFormaSet: porForma, eventos: eventosRes,
  filtros: {
    mt30: { n: mt30.length, total: R(mt30.reduce((s, x) => s + x.emAtrasoCentavos, 0)), nomes: mt30.map((x) => ({ nome: x.pessoa.nome, dias: x.diasDeAtraso, total: R(x.emAtrasoCentavos) })) },
    jjTri: R(jjTri), boxeTri: R(boxeTri), kids: kidsLinhas.length, novosOut: novosOut.length,
    equipAno: { n: equipAno.length, total: R(equipAno.reduce((s, l) => s + l.valorCentavos, 0)) },
    alunosPorModalidade,
  },
  funilOut: { total: fmtFunil(funilOut.total), porOrigem: Object.fromEntries(Object.entries(funilOut.porOrigem).map(([k, v]) => [k, fmtFunil(v)])) },
  funil3: { total: fmtFunil(funil3.total), porOrigem: Object.entries(funil3.porOrigem).map(([k, v]) => ({ origem: ROT_ORIGEM[k], ...fmtFunil(v) })).filter((x) => x.contatos) },
  retornos: retornosLista,
  equipe, folhaSet: R(folhaSet), professoresSetTotal: R(remuneracoes[SET].reduce((s, r) => s + r.totalCentavos, 0)), remuneracoesSet: remuneracoes[SET].map((r) => ({ ...r, totalTexto: R(r.totalCentavos), baseTexto: R(r.baseDaComissaoCentavos), comissaoTexto: R(r.comissaoCentavos), fixoTexto: R(r.fixoCentavos), porAulaTexto: R(r.porAulaCentavos) })),
  despesasNovembro: novembro, despesasNovembroTotal: R(novembro.reduce((s, x) => s + x.centavos, 0)),
  grade, outubroTotais: tot(pOut),
  colado: colado.linhas.map((l) => ({ ok: !l.erros.length, erros: l.erros, descricao: l.lancamento?.descricao, valor: l.lancamento ? R(l.lancamento.valorCentavos) : null, tipo: l.lancamento?.tipo })),
  edicoes,
  importacao: { colunas: colunasDet.map((c) => ({ cabecalho: c.cabecalho, papel: c.papel, exemplo: c.exemplo })), resumo: conf.resumo, comAviso, categoriasNovas: conf.categoriasNovas, erros: conf.linhas.filter((l) => l.erros.length).map((l) => ({ numero: l.numero, erros: l.erros })), repetidasSeJaExiste: confRepetida.resumo.repetidas },
  exportado: exportado.replace(/^﻿/, '').split('\r\n').filter(Boolean),
  historico: hist,
  alunosAmostra, ficha, alunosTotal: linhas.length,
  sugestaoFamilia: sugerirDescontoFamilia(matriculas.filter((m) => m.estado !== 'encerrada')).length,
}
mkdirSync(join(aqui, '_dados'), { recursive: true })
writeFileSync(join(aqui, '_dados', 'dados.json'), JSON.stringify(dados, null, 1))
writeFileSync(join(aqui, '_dados', 'planilha-de-exemplo.csv'), `﻿${planilha}\r\n`)
const p = dados.painel
console.log(`ok · ${pessoas.length} pessoas, ${matriculas.length} matrículas, ${cobrancas.length} cobranças, ${lancamentos.length} lançamentos`)
console.log(`painel ${MES}: matriculados ${p.alunos.matriculados} · trancados ${p.alunos.trancados} · inativos ${p.alunos.inativos} · novos ${p.alunos.novosNoMes} · funcionários ${p.funcionarios.total}`)
console.log(`mês: entrou ${p.mesTexto.entradas} · saiu ${p.mesTexto.saidas} · resultado ${p.mesTexto.resultado} · previsto ${p.previsaoTexto.resultadoPrevisto}`)
console.log(`setembro: entrou ${dados.setembro.entradasTexto} · saiu ${dados.setembro.saidasTexto} · resultado ${dados.setembro.resultadoTexto}`)
console.log(`inadimplentes ${p.inadimplentes.pessoas} (${p.inadimplentesTexto}) · +30 dias ${dados.maisDe30} · MT +30 ${dados.filtros.mt30.n} ${dados.filtros.mt30.total} · JJ tri ${dados.filtros.jjTri}`)
console.log(`funil out: ${JSON.stringify(dados.funilOut.total)}`)
console.log(`geração out: ${JSON.stringify(dados.geracaoOut)} · importação ${JSON.stringify(dados.importacao.resumo)} aviso ${comAviso}`)
console.log('evolução:', evolucao.map((e) => `${e.nome} ${e.resultadoTexto}`).join(' | '))
