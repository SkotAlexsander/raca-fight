/**
 * A Raça Fight DE EXEMPLO do modo local (agente AM1, 15/10/2026).
 *
 * - Modalidades, turmas e planos na forma real (`app/dominio/financeiro/exemplo.ts`).
 * - NOMES DE PESSOAS FICTÍCIOS. Nenhum professor ou aluno real (LGPD, direito de imagem).
 * - VALORES DE EXEMPLO: os preços reais ainda não chegaram (A18, A19).
 *
 * Nada é digitado à mão: 13 meses de academia saem das funções do domínio
 * (gerar mensalidades, marcar como paga, despesas fixas, remuneração, fechar o
 * mês), com sorteio de semente fixa. O mesmo `hoje` dá sempre os mesmos dados.
 */

import { marcarComoPaga } from '@dominio/financeiro/cobrancas.ts';
import { competenciaDe, dataNaCompetencia, somarDias, somarMeses } from '@dominio/financeiro/datas.ts';
import { gerarDespesasFixasDoMes } from '@dominio/financeiro/despesas-fixas.ts';
import { ACADEMIA, CATEGORIAS, EVENTOS, MODALIDADES, PLANOS } from '@dominio/financeiro/exemplo.ts';
import { fecharMes } from '@dominio/financeiro/fechamento.ts';
import { registroDeMudanca } from '@dominio/financeiro/historico.ts';
import { gerarMensalidadesDoMes } from '@dominio/financeiro/mensalidades.ts';
import { calcularRemuneracaoDoMes } from '@dominio/financeiro/remuneracao.ts';
import { gradeDaRacaFight } from '@dominio/turmas/grade-raca-fight.ts';
import type {
  AulaExperimental, Cobranca, DespesaFixa, FechamentoDoMes, Funcionario, Interessado, Lancamento, Lembrete, Matricula, Nota, Pessoa,
  RegistroDoHistorico, Tarefa,
} from '@dominio/financeiro/tipos.ts';
import type { DataISO } from '@dominio/tipos.ts';
import { regrasProvisorias } from '../regras-provisorias.ts';
import type { DadosDaAcademia } from '../tipos.ts';

export const DONO_ID = 'dono-alex';

/** Sorteio com semente (mulberry32): o mesmo número sempre dá a mesma academia. */
function sorteio(semente: number) {
  let a = semente >>> 0;
  const r = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    r,
    inteiro: (min: number, max: number) => min + Math.floor(r() * (max - min + 1)),
    um: <T>(xs: readonly T[]) => xs[Math.floor(r() * xs.length)]!,
    chance: (p: number) => r() < p,
  };
}

const NOMES = ['Breno', 'Carla', 'Otávio', 'Renan', 'Vinícius', 'Diego', 'Larissa', 'Rafaela', 'Matheus', 'Leandro', 'Jordana', 'Tatiane',
  'Pedro Henrique', 'Aline', 'Camila', 'Thiago', 'Fábio', 'Priscila', 'Eduardo', 'Gustavo', 'Marina', 'Bianca', 'Rodrigo', 'Natália', 'Felipe',
  'Jéssica', 'André', 'Letícia', 'Maurício', 'Vanessa', 'Ricardo', 'Daniela', 'Lucas', 'Amanda', 'Célio', 'Patrícia', 'Wagner', 'Simone',
  'Douglas', 'Karina', 'Henrique', 'Talita', 'Murilo', 'Elaine', 'Sérgio', 'Roberta', 'Alexandre', 'Cíntia'];
const SOBRENOMES = ['Almeida', 'Souza', 'Rocha', 'Dutra', 'Hoffmann', 'Fontoura', 'Becker', 'Nunes', 'Kunz', 'Vieira', 'Prates', 'Moura', 'Sá',
  'Castro', 'Machado', 'Schneider', 'Pacheco', 'Ramos', 'Teles', 'Bittencourt', 'Lemos', 'Farias', 'Goulart', 'Dornelles', 'Quadros', 'Brum'];
const CRIANCAS = ['Davi', 'Elisa', 'Sofia', 'Miguel', 'Laura', 'Otto', 'Helena', 'Theo', 'Valentina', 'Benício', 'Alice', 'Heitor'];

const EM_BASE = (d: DataISO, h = '09:00') => `${d}T${h}:00-03:00`;

export function gerarExemplo(hoje: DataISO): DadosDaAcademia {
  const s = sorteio(20261015);
  let n = 0;
  const id = (p: string) => `${p}-${(++n).toString(36)}`;
  const compHoje = competenciaDe(hoje);
  const comecoDoHistorico = somarMeses(compHoje, -12);

  const pessoas: Pessoa[] = [];
  const pessoa = (nome: string, extra: Partial<Pessoa> = {}): Pessoa => {
    const p: Pessoa = {
      id: id('p'), academiaId: ACADEMIA, nome, ehAluno: true, ehFuncionario: false,
      telefone: `(51) 9${s.inteiro(8000, 9999)}-${s.inteiro(1000, 9999)}`, criadaEm: EM_BASE(`${comecoDoHistorico}-01`), atualizadaEm: EM_BASE(`${comecoDoHistorico}-01`), ...extra,
    };
    pessoas.push(p);
    return p;
  };

  // --- a equipe (nomes inventados) ---
  const dono = pessoa('Alex', { id: DONO_ID, ehAluno: false, telefone: undefined });
  void dono;
  const equipe: { p: Pessoa; f: Omit<Funcionario, 'id' | 'academiaId' | 'pessoaId'> }[] = [
    { p: pessoa('Gabriel Teixeira', { ehAluno: false, ehFuncionario: true }), f: { funcao: 'professor', modalidadeIds: ['muay-thai'], remuneracao: { tipo: 'comissao', comissaoPontosBase: 3000 }, desde: '2025-01-01' } },
    { p: pessoa('Helena Martins', { ehFuncionario: true }), f: { funcao: 'professor', modalidadeIds: ['jiu-jitsu', 'luta-livre'], remuneracao: { tipo: 'fixo_mais_comissao', fixoCentavos: 80000, comissaoPontosBase: 2000 }, desde: '2025-06-01' } },
    { p: pessoa('Rodrigo Saldanha', { ehAluno: false, ehFuncionario: true }), f: { funcao: 'professor', modalidadeIds: ['boxe'], remuneracao: { tipo: 'comissao', comissaoPontosBase: 3500 }, desde: '2025-03-01' } },
    { p: pessoa('Paulo Viana', { ehAluno: false, ehFuncionario: true }), f: { funcao: 'professor', modalidadeIds: ['mma'], remuneracao: { tipo: 'comissao', comissaoPontosBase: 3500 }, desde: '2025-08-01' } },
    { p: pessoa('Marcelo Trindade', { ehAluno: false, ehFuncionario: true }), f: { funcao: 'professor', modalidadeIds: ['muay-thai'], remuneracao: { tipo: 'sem_remuneracao' }, desde: '2026-02-01' } },
    { p: pessoa('Igor Pereira', { ehAluno: false, ehFuncionario: true }), f: { funcao: 'recepcao', modalidadeIds: [], remuneracao: { tipo: 'fixo', fixoCentavos: 160000 }, desde: '2026-02-01' } },
    { p: pessoa('Bruna Oliveira', { ehAluno: false, ehFuncionario: true }), f: { funcao: 'recepcao', modalidadeIds: [], remuneracao: { tipo: 'fixo', fixoCentavos: 90000 }, desde: '2026-05-01' } },
    { p: pessoa('Sandra Ribeiro', { ehAluno: false, ehFuncionario: true }), f: { funcao: 'limpeza', modalidadeIds: [], remuneracao: { tipo: 'fixo', fixoCentavos: 90000 }, desde: '2025-01-01' } },
    { p: pessoa('Luiza Fagundes', { ehAluno: false, ehFuncionario: true }), f: { funcao: 'administrativo', modalidadeIds: [], remuneracao: { tipo: 'fixo', fixoCentavos: 120000 }, desde: '2026-01-01' } },
  ];
  const funcionarios: Funcionario[] = equipe.map(({ p, f }) => ({ id: `f-${p.id}`, academiaId: ACADEMIA, pessoaId: p.id, ...f }));

  // --- alunos e matrículas ---
  const matriculas: Matricula[] = [];
  const planosAdulto = ['muay-thai-livre', 'muay-thai-livre', 'muay-thai-2x', 'muay-thai-2x', 'jiu-jitsu-livre', 'jiu-jitsu-livre', 'boxe-2x', 'mma', 'combo-2', 'muay-thai-trimestral'];
  const dias = [5, 5, 10, 10, 10, 15, 20];
  const usados = new Set<string>();
  const nomeNovo = () => {
    for (;;) {
      const nome = `${s.um(NOMES)} ${s.um(SOBRENOMES)}`;
      if (!usados.has(nome)) { usados.add(nome); return nome; }
    }
  };
  const inicioSorteado = () => {
    // 6 em cada 10 já treinavam antes do histórico: a academia é estabelecida
    const meses = s.chance(0.6) ? s.inteiro(14, 30) : s.inteiro(0, 13);
    const comp = somarMeses(compHoje, -meses);
    const ini = dataNaCompetencia(comp, s.inteiro(1, 28));
    return ini > hoje ? hoje : ini;
  };

  for (let i = 0; i < 190; i++) {
    const p = pessoa(nomeNovo());
    const planoId = s.um(planosAdulto);
    const inicio = inicioSorteado();
    p.criadaEm = EM_BASE(inicio);
    const m: Matricula = {
      id: id('m'), academiaId: ACADEMIA, pessoaId: p.id, pagadorPessoaId: p.id, planoId, inicio, estado: 'ativa',
      diaDeVencimento: s.um(dias), descontos: [],
    };
    const sorte = s.r();
    if (sorte < 0.09) {
      // trancou por um tempo (viagem, lesão)
      m.estado = 'trancada';
      m.trancadaDe = dataNaCompetencia(compHoje, 1);
      m.trancadaAte = dataNaCompetencia(somarMeses(compHoje, 1), 31);
    } else if (sorte < 0.2 && inicio < dataNaCompetencia(somarMeses(compHoje, -3), 1)) {
      m.estado = 'encerrada';
      m.fim = dataNaCompetencia(somarMeses(compHoje, -s.inteiro(1, 3)), 28);
    }
    if (s.chance(0.05)) m.descontos.push({ tipo: 'percentual', pontosBase: 5000, motivo: 'bolsista' });
    else if (s.chance(0.04)) m.descontos.push({ tipo: 'percentual', pontosBase: 3000, motivo: 'atleta' });
    matriculas.push(m);
  }

  // --- famílias Kids: o responsável paga, a criança treina ---
  for (let f = 0; f < 14; f++) {
    const sobrenome = SOBRENOMES[(f * 7 + 3) % SOBRENOMES.length]!;
    const resp = pessoa(f === 0 ? 'Fernanda Lima' : `${s.um(NOMES)} ${sobrenome}`, { ehAluno: false, ehResponsavel: true });
    const filhos = f === 0 ? 2 : s.chance(0.35) ? 2 : 1;
    for (let k = 0; k < filhos; k++) {
      const nomeCrianca = f === 0 ? (k === 0 ? 'Davi Lima' : 'Elisa Lima') : `${s.um(CRIANCAS)} ${sobrenome}`;
      const c = pessoa(nomeCrianca, { telefone: undefined, responsavelPessoaId: resp.id, dataNascimento: `${s.inteiro(2014, 2019)}-0${s.inteiro(1, 9)}-1${s.inteiro(0, 9)}` });
      const planoId = f === 0 ? (k === 0 ? 'muay-thai-kids' : 'jiu-jitsu-kids') : s.chance(0.5) ? 'muay-thai-kids' : 'jiu-jitsu-kids';
      matriculas.push({
        id: id('m'), academiaId: ACADEMIA, pessoaId: c.id, pagadorPessoaId: resp.id, planoId, inicio: inicioSorteado(), estado: 'ativa',
        diaDeVencimento: 10, descontos: k > 0 ? [{ tipo: 'percentual', pontosBase: 1000, motivo: 'familia' }] : [],
      });
    }
  }
  // a professora que treina Muay Thai (desconto de funcionário: isenta)
  const helena = equipe[1]!.p;
  matriculas.push({ id: id('m'), academiaId: ACADEMIA, pessoaId: helena.id, pagadorPessoaId: helena.id, planoId: 'muay-thai-2x', inicio: '2026-06-01', estado: 'ativa', diaDeVencimento: 10, descontos: [{ tipo: 'percentual', pontosBase: 10000, motivo: 'funcionario' }] });

  // --- despesas fixas (valores de exemplo) ---
  const desp = (d: Omit<DespesaFixa, 'academiaId' | 'ativa' | 'variavel' | 'desde' | 'id'> & Partial<DespesaFixa>): DespesaFixa => ({
    id: id('d'), academiaId: ACADEMIA, ativa: true, variavel: false, desde: comecoDoHistorico, ...d,
  });
  const pessoaDe = (nome: string) => pessoas.find((p) => p.nome === nome)!.id;
  const despesasFixas: DespesaFixa[] = [
    desp({ descricao: 'Aluguel da sala', categoriaId: 'aluguel', valorCentavos: 350000, diaDeVencimento: 10, formaDePagamento: 'pix' }),
    desp({ descricao: 'Luz', categoriaId: 'luz', valorCentavos: 45000, diaDeVencimento: 20, variavel: true, formaDePagamento: 'boleto' }),
    desp({ descricao: 'Água', categoriaId: 'agua', valorCentavos: 18000, diaDeVencimento: 18, variavel: true, formaDePagamento: 'boleto' }),
    desp({ descricao: 'Internet', categoriaId: 'internet', valorCentavos: 12000, diaDeVencimento: 15, formaDePagamento: 'boleto' }),
    desp({ descricao: 'Contador', categoriaId: 'contador', valorCentavos: 45000, diaDeVencimento: 28, formaDePagamento: 'pix' }),
    desp({ descricao: 'Salário — Igor Pereira', categoriaId: 'salarios', valorCentavos: 160000, diaDeVencimento: 5, pessoaId: pessoaDe('Igor Pereira'), formaDePagamento: 'pix', desde: '2026-02' }),
    desp({ descricao: 'Salário — Bruna Oliveira', categoriaId: 'salarios', valorCentavos: 90000, diaDeVencimento: 5, pessoaId: pessoaDe('Bruna Oliveira'), formaDePagamento: 'pix', desde: '2026-05' }),
    desp({ descricao: 'Salário — Sandra Ribeiro', categoriaId: 'salarios', valorCentavos: 90000, diaDeVencimento: 5, pessoaId: pessoaDe('Sandra Ribeiro'), formaDePagamento: 'pix' }),
    desp({ descricao: 'Salário — Luiza Fagundes', categoriaId: 'salarios', valorCentavos: 120000, diaDeVencimento: 5, pessoaId: pessoaDe('Luiza Fagundes'), formaDePagamento: 'pix', desde: '2026-01' }),
    desp({ descricao: 'Fixo — Helena Martins', categoriaId: 'salarios', valorCentavos: 80000, diaDeVencimento: 5, pessoaId: helena.id, formaDePagamento: 'pix' }),
  ];

  // --- 13 meses de caixa ---
  const cobrancas: Cobranca[] = [];
  const lancamentos: Lancamento[] = [];
  const fechamentos: FechamentoDoMes[] = [];
  const historico: RegistroDoHistorico[] = [];
  const regras = regrasProvisorias(ACADEMIA, EM_BASE(`${comecoDoHistorico}-01`));
  const avulso = (data: DataISO, descricao: string, categoriaId: string, tipo: 'entrada' | 'saida', valorCentavos: number, extra: Partial<Lancamento> = {}) => {
    if (data > hoje) return;
    lancamentos.push({
      id: id('l'), academiaId: ACADEMIA, data, descricao, categoriaId, tipo, valorCentavos, situacao: 'pago', origem: 'manual',
      formaDePagamento: s.um(['pix', 'pix', 'dinheiro', 'cartao_debito', 'cartao_credito'] as const),
      criadoPor: DONO_ID, criadoEm: EM_BASE(data, '18:30'), atualizadoEm: EM_BASE(data, '18:30'), ...extra,
    });
  };

  for (let k = 0; k <= 12; k++) {
    const comp = somarMeses(comecoDoHistorico, k);
    const ger = gerarMensalidadesDoMes({ competencia: comp, matriculas, planos: PLANOS, existentes: cobrancas, primeiroMes: regras.primeiroMes, gerarId: () => id('c'), em: EM_BASE(`${comp}-01`, '07:00') });
    for (const c of ger.novas) {
      let pagar: DataISO | null = null;
      if (c.vencimento < hoje) {
        const atrasa = comp === compHoje ? 0.07 : comp === somarMeses(compHoje, -1) ? 0.05 : comp === somarMeses(compHoje, -2) ? 0.015 : 0;
        if (!s.chance(atrasa)) pagar = somarDias(c.vencimento, s.inteiro(-4, 3));
      } else if (s.chance(0.12)) pagar = somarDias(c.vencimento, -s.inteiro(1, 6));
      if (pagar && pagar > hoje) pagar = hoje;
      if (!pagar) { cobrancas.push(c); continue; }
      const r = marcarComoPaga(c, {
        data: pagar, forma: s.um(['pix', 'pix', 'pix', 'dinheiro', 'cartao_debito', 'cartao_credito'] as const),
        categoriaId: c.tipo === 'matricula' ? 'matriculas' : 'mensalidades', porId: DONO_ID, em: EM_BASE(pagar, '19:10'), gerarId: () => id('l'),
      });
      cobrancas.push(r.cobranca);
      lancamentos.push(r.lancamento);
    }

    // despesas fixas: a linha nasce pendente; a que já venceu foi paga (a variável com o valor da conta)
    const fixas = gerarDespesasFixasDoMes({ competencia: comp, despesas: despesasFixas, lancamentos, porId: DONO_ID, em: EM_BASE(`${comp}-01`, '07:00'), gerarId: () => id('l') });
    for (const l of fixas) {
      if (l.data <= hoje && !(comp === compHoje && l.data === hoje)) {
        l.situacao = 'pago';
        if (l.estimado) { l.valorCentavos = Math.round((l.valorCentavos * s.inteiro(88, 114)) / 100); delete l.estimado; }
      }
      lancamentos.push(l);
    }

    // comissão do mês anterior, lançada no dia 5 (RA6.5: o dono confere e lança)
    const anterior = somarMeses(comp, -1);
    const dia5 = dataNaCompetencia(comp, 5);
    if (anterior >= comecoDoHistorico && dia5 <= hoje) {
      for (const f of funcionarios) {
        if (f.remuneracao.tipo !== 'comissao' && f.remuneracao.tipo !== 'fixo_mais_comissao') continue;
        const rem = calcularRemuneracaoDoMes(f, lancamentos, anterior);
        if (!rem.comissaoCentavos) continue;
        const nome = pessoas.find((p) => p.id === f.pessoaId)!.nome;
        avulso(dia5, `Comissão ${anterior.slice(5)}/${anterior.slice(0, 4)} — ${nome}`, 'comissoes', 'saida', Math.round(rem.comissaoCentavos / 100) * 100, { origem: 'remuneracao', pessoaId: f.pessoaId, formaDePagamento: 'pix' });
      }
    }

    // o que não se repete: vendas, exames, equipamento, eventos
    for (let v = 0; v < s.inteiro(2, 5); v++) {
      const produto = s.um([['Luvas 12 oz', 19000], ['Bandagem par', 3500], ['Protetor bucal', 2500], ['Kimono A2 branco', 32000], ['Faixa', 4500], ['Caneleira', 16000], ['Camiseta Raça Fight', 7500]] as const);
      avulso(dataNaCompetencia(comp, s.inteiro(1, 28)), produto[0], 'produtos', 'entrada', produto[1]);
    }
    if (k % 3 === 1) avulso(dataNaCompetencia(comp, 12), `Exame de graduação — ${s.um(['Muay Thai', 'Jiu-Jitsu'])} (${s.inteiro(3, 8)} alunos)`, 'graduacoes', 'entrada', 15000 * s.inteiro(3, 6));
    if (k % 4 === 2) avulso(dataNaCompetencia(comp, 8), s.um(['Sacos de pancada 1,20 m', 'Tatame EVA 1 m² × 6', 'Luvas de treino (estoque)']), 'equipamento', 'saida', s.inteiro(60, 120) * 1000);
    if (s.chance(0.6)) avulso(dataNaCompetencia(comp, s.inteiro(2, 26)), 'Bandagens e protetores (revenda)', 'estoque', 'saida', s.inteiro(20, 45) * 1000);
    if (s.chance(0.5)) avulso(dataNaCompetencia(comp, 4), 'Aula particular', 'aulas-avulsas', 'entrada', 15000);
    if (comp.endsWith('-07')) {
      avulso(dataNaCompetencia(comp, 18), 'Viagem do campeonato estadual (van e hotel)', 'eventos-saida', 'saida', 620000);
      avulso(dataNaCompetencia(comp, 18), 'Inscrições do estadual (8 atletas)', 'eventos-saida', 'saida', 160000);
    }
    avulso(dataNaCompetencia(comp, 20), 'DAS do Simples', 'impostos', 'saida', s.inteiro(120, 160) * 1000, { formaDePagamento: 'boleto' });
    if (s.chance(0.5)) avulso(dataNaCompetencia(comp, 25), 'Impulsionar post no Instagram', 'marketing', 'saida', 15000, { formaDePagamento: 'cartao_credito' });

    // fecha o mês que já passou, no dia 3 do seguinte
    const diaDeFechar = dataNaCompetencia(somarMeses(comp, 1), 3);
    if (comp < compHoje && diaDeFechar <= hoje) {
      const em = EM_BASE(diaDeFechar, '18:12');
      const f = fecharMes({ id: id('fe'), academiaId: ACADEMIA, competencia: comp, lancamentos, cobrancas, porId: DONO_ID, em, fechamentos });
      fechamentos.push(f);
      historico.push({ id: id('h'), academiaId: ACADEMIA, tabela: 'fechamentos', registroId: f.id, acao: 'fechou', mudancas: [{ campo: 'competencia', de: undefined, para: comp }], porId: DONO_ID, em });
    }
  }

  // o evento real do perfil, em novembro (sem valores ainda)
  const eventos = EVENTOS.map((e) => ({ ...e }));

  // --- funil: os últimos 3 meses de interessados ---
  const interessados: Interessado[] = [];
  const experimentais: AulaExperimental[] = [];
  const origens = ['instagram', 'instagram', 'instagram', 'whatsapp', 'whatsapp', 'indicacao', 'passou_na_porta', undefined] as const;
  for (let i = 0; i < 70; i++) {
    const contatoEm = somarDias(hoje, -s.inteiro(0, 80));
    const origem = s.um(origens);
    const it: Interessado = {
      id: id('i'), academiaId: ACADEMIA, nome: nomeNovo(), whatsapp: `5551${s.inteiro(980000000, 999999999)}`,
      modalidadeIds: [s.um(['muay-thai', 'muay-thai', 'jiu-jitsu', 'boxe', 'mma'])], contatoEm, ...(origem ? { origem } : {}),
    };
    interessados.push(it);
    if (s.chance(0.58)) {
      const data = somarDias(contatoEm, s.inteiro(1, 6));
      const passou = data < hoje;
      const e: AulaExperimental = { id: id('e'), academiaId: ACADEMIA, interessadoId: it.id, data: passou ? data : somarDias(hoje, s.inteiro(0, 4)), modalidadeId: it.modalidadeIds[0], estado: 'agendada', marcadaPor: DONO_ID };
      if (passou) {
        const r = s.r();
        if (r < 0.15) e.estado = 'faltou';
        else {
          e.estado = 'compareceu';
          const dep = s.r();
          if (dep < 0.5 && somarDias(data, 2) <= hoje) { e.estado = 'matriculou'; it.matriculadoEm = somarDias(data, s.inteiro(0, 2)); }
          else if (dep < 0.65) e.estado = 'nao_seguiu';
        }
      }
      experimentais.push(e);
    } else if (s.chance(0.25)) it.desistiuEm = somarDias(contatoEm, 3);
  }

  // --- anotar e lembrar ---
  const fernanda = pessoas.find((p) => p.nome === 'Fernanda Lima')!;
  const devedor = cobrancas.filter((c) => c.estado === 'aberta' && c.vencimento < hoje).sort((a, b) => a.vencimento.localeCompare(b.vencimento))[0];
  const nomeDevedor = devedor ? pessoas.find((p) => p.id === devedor.pessoaId)!.nome : 'Renan Dutra';
  const quem = (dias: number, h = '10:00') => EM_BASE(somarDias(hoje, -dias), h);
  const notas: Nota[] = [
    { id: id('n'), academiaId: ACADEMIA, texto: 'Combinou pagar as duas mensalidades (Davi e Elisa) no dia 20.', pessoaId: fernanda.id, fixada: true, arquivada: false, criadaPor: DONO_ID, criadaEm: quem(3), atualizadaEm: quem(3) },
    { id: id('n'), academiaId: ACADEMIA, texto: 'Orçamento do tatame novo: R$ 1.140,00 em 6 placas, entrega em 10 dias.', fixada: true, arquivada: false, criadaPor: DONO_ID, criadaEm: quem(6), atualizadaEm: quem(6) },
    { id: id('n'), academiaId: ACADEMIA, texto: 'Ver com o contador se a multa de 2 % pode entrar já no mês que vem.', fixada: false, arquivada: false, criadaPor: DONO_ID, criadaEm: quem(1), atualizadaEm: quem(1) },
    { id: id('n'), academiaId: ACADEMIA, texto: 'Sexta OPEN lotou: pensar numa segunda turma às 20h.', data: somarDias(hoje, -2), fixada: false, arquivada: false, criadaPor: DONO_ID, criadaEm: quem(2), atualizadaEm: quem(2) },
  ];
  const lembretes: Lembrete[] = [
    { id: id('le'), academiaId: ACADEMIA, titulo: `Cobrar ${nomeDevedor}`, data: somarDias(hoje, -3), repeticao: 'nao_repete', avisarDiasAntes: 0, ...(devedor ? { pessoaId: devedor.pessoaId } : {}), criadoPor: DONO_ID, criadoEm: quem(5) },
    { id: id('le'), academiaId: ACADEMIA, titulo: 'Vence: Internet (boleto)', data: dataNaCompetencia(compHoje, 15) < hoje ? dataNaCompetencia(somarMeses(compHoje, 1), 15) : dataNaCompetencia(compHoje, 15), repeticao: 'mensal', diaDoMes: 15, avisarDiasAntes: 2, valorCentavos: 12000, despesaFixaId: despesasFixas[3]!.id, criadoPor: DONO_ID, criadoEm: quem(40) },
    { id: id('le'), academiaId: ACADEMIA, titulo: 'Vence: Aluguel da sala', data: dataNaCompetencia(compHoje, 10) < hoje ? dataNaCompetencia(somarMeses(compHoje, 1), 10) : dataNaCompetencia(compHoje, 10), repeticao: 'mensal', diaDoMes: 10, avisarDiasAntes: 3, valorCentavos: 350000, despesaFixaId: despesasFixas[0]!.id, criadoPor: DONO_ID, criadoEm: quem(60) },
    { id: id('le'), academiaId: ACADEMIA, titulo: 'Renovar o seguro da sala', data: somarDias(hoje, 20), repeticao: 'anual', avisarDiasAntes: 30, criadoPor: DONO_ID, criadoEm: quem(90) },
    { id: id('le'), academiaId: ACADEMIA, titulo: 'Fotos do card da Lomba: pedir autorização dos atletas', data: hoje, hora: '18:00', repeticao: 'nao_repete', avisarDiasAntes: 0, criadoPor: DONO_ID, criadoEm: quem(2) },
  ];
  const igor = pessoas.find((p) => p.nome === 'Igor Pereira')!;
  const tarefas: Tarefa[] = [
    { id: id('t'), academiaId: ACADEMIA, titulo: 'Trocar 6 placas de tatame', prazo: somarDias(hoje, 3), responsavelPessoaId: igor.id, criadaPor: DONO_ID, criadaEm: quem(4) },
    { id: id('t'), academiaId: ACADEMIA, titulo: 'Mandar a planilha do mês para o contador', prazo: somarDias(hoje, -1), criadaPor: DONO_ID, criadaEm: quem(9) },
    { id: id('t'), academiaId: ACADEMIA, titulo: 'Cotar luvas 14 oz para revenda', criadaPor: DONO_ID, criadaEm: quem(12) },
  ];

  // um pouco de histórico recente, gravado como o gatilho grava
  const ultimas = lancamentos.filter((l) => l.data <= hoje && l.origem === 'manual').slice(-3);
  for (const l of ultimas) {
    const r = registroDeMudanca({ tabela: 'lancamentos', academiaId: ACADEMIA, antes: undefined, depois: l, porId: DONO_ID, em: l.criadoEm, gerarId: () => id('h') });
    if (r) historico.push({ ...r, mudancas: [] });
  }

  const professorDe = (modalidadeId: string) => funcionarios.find((f) => f.funcao === 'professor' && f.modalidadeIds.includes(modalidadeId))?.pessoaId ?? null;
  return {
    academia: { id: ACADEMIA, nome: 'Raça Fight Gravataí' },
    modalidades: MODALIDADES.map((m) => ({ ...m })),
    planos: PLANOS.map((p) => ({ ...p })),
    pessoas, funcionarios, matriculas, cobrancas, lancamentos,
    categorias: CATEGORIAS.map((c) => ({ ...c })),
    // a grade real do cartaz; a duração das aulas de turma é [decidir] L1 (60 min, como o seed do banco)
    turmas: gradeDaRacaFight({ academiaId: ACADEMIA, duracaoDaAulaMinutos: 60, professores: {
      muayThai: professorDe('muay-thai'), boxe: professorDe('boxe'), jiuJitsu: professorDe('jiu-jitsu'), mma: professorDe('mma'),
      muayThaiKids: professorDe('muay-thai'), jiuJitsuKids: professorDe('jiu-jitsu'),
    } }),
    despesasFixas, fechamentos, importacoes: [], eventos, interessados, experimentais, notas, lembretes, tarefas,
    filtrosSalvos: [
      { id: 'fs-inad', academiaId: ACADEMIA, nome: 'Inadimplentes há mais de 30 dias', alvo: 'alunos', filtro: { inadimplenteHaMaisDeDias: 30 }, criadoPor: DONO_ID, criadoEm: EM_BASE(comecoDoHistorico + '-01') },
      { id: 'fs-novos', academiaId: ACADEMIA, nome: 'Novos do mês', alvo: 'alunos', filtro: { novosDesde: `${compHoje}-01` }, criadoPor: DONO_ID, criadoEm: EM_BASE(comecoDoHistorico + '-01') },
      { id: 'fs-kids', academiaId: ACADEMIA, nome: 'Kids', alvo: 'alunos', filtro: { planoIds: ['muay-thai-kids', 'jiu-jitsu-kids'] }, criadoPor: DONO_ID, criadoEm: EM_BASE(comecoDoHistorico + '-01') },
      { id: 'fs-tranc', academiaId: ACADEMIA, nome: 'Trancados', alvo: 'alunos', filtro: { situacoes: ['trancado'] }, criadoPor: DONO_ID, criadoEm: EM_BASE(comecoDoHistorico + '-01') },
    ],
    historico: historico.sort((a, b) => b.em.localeCompare(a.em)),
    regras,
  };
}
