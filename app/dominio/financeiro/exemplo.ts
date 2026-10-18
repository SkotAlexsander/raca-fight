/**
 * Dados de EXEMPLO da área do administrador, no molde da Raça Fight Gravataí
 * (modalidades e turmas reais, tiradas do perfil; `02-design/referencias/
 * raca-fight/01-DADOS-REAIS.md`).
 *
 * Os NOMES DE PESSOAS são fictícios: os treinadores e atletas reais só entram
 * com autorização deles (LGPD e direito de imagem). Os VALORES também são de
 * exemplo: os preços reais da academia ainda não foram informados.
 *
 * Serve aos testes do domínio e pode servir de dado de exemplo no admin.
 */

import type {
  Categoria, Cobranca, DespesaFixa, Evento, Funcionario, Lancamento, Matricula, Modalidade, Pessoa, Plano,
} from './tipos.ts';

export const ACADEMIA = 'raca-fight';
const EM = '2026-10-01T09:00:00-03:00';

export const MODALIDADES: Modalidade[] = [
  { id: 'muay-thai', academiaId: ACADEMIA, nome: 'Muay Thai', ativa: true },
  { id: 'boxe', academiaId: ACADEMIA, nome: 'Boxe', ativa: true },
  { id: 'jiu-jitsu', academiaId: ACADEMIA, nome: 'Jiu-Jitsu', ativa: true },
  { id: 'luta-livre', academiaId: ACADEMIA, nome: 'Luta Livre', ativa: true },
  { id: 'mma', academiaId: ACADEMIA, nome: 'MMA', ativa: true },
];

const plano = (p: Omit<Plano, 'academiaId' | 'ativo'>): Plano => ({ academiaId: ACADEMIA, ativo: true, ...p });

export const PLANOS: Plano[] = [
  plano({ id: 'muay-thai-livre', nome: 'Muay Thai livre', modalidadeIds: ['muay-thai'], periodicidade: 'mensal', valorCentavos: 15000, taxaDeMatriculaCentavos: 5000 }),
  plano({ id: 'muay-thai-2x', nome: 'Muay Thai 2×', modalidadeIds: ['muay-thai'], aulasPorSemana: 2, periodicidade: 'mensal', valorCentavos: 12000 }),
  plano({ id: 'jiu-jitsu-livre', nome: 'Jiu-Jitsu / Luta Livre', modalidadeIds: ['jiu-jitsu', 'luta-livre'], periodicidade: 'mensal', valorCentavos: 14000 }),
  plano({ id: 'mma', nome: 'MMA', modalidadeIds: ['mma'], periodicidade: 'mensal', valorCentavos: 16000 }),
  plano({ id: 'boxe-2x', nome: 'Boxe 2×', modalidadeIds: ['boxe'], aulasPorSemana: 2, periodicidade: 'mensal', valorCentavos: 12000 }),
  plano({ id: 'combo-2', nome: 'Combo 2 modalidades', modalidadeIds: ['muay-thai', 'jiu-jitsu'], periodicidade: 'mensal', valorCentavos: 22000 }),
  plano({ id: 'muay-thai-kids', nome: 'Muay Thai Kids', modalidadeIds: ['muay-thai'], aulasPorSemana: 2, periodicidade: 'mensal', valorCentavos: 11000 }),
  plano({ id: 'jiu-jitsu-kids', nome: 'Jiu-Jitsu Kids', modalidadeIds: ['jiu-jitsu'], aulasPorSemana: 2, periodicidade: 'mensal', valorCentavos: 11000 }),
  plano({ id: 'muay-thai-trimestral', nome: 'Muay Thai trimestral', modalidadeIds: ['muay-thai'], periodicidade: 'trimestral', valorCentavos: 40500 }),
  plano({ id: 'experimental', nome: 'Aula experimental', modalidadeIds: ['muay-thai', 'boxe', 'jiu-jitsu', 'luta-livre', 'mma'], periodicidade: 'gratuito', valorCentavos: 0 }),
];

const pessoa = (id: string, nome: string, extra: Partial<Pessoa> = {}): Pessoa => ({
  id, academiaId: ACADEMIA, nome, ehAluno: true, ehFuncionario: false, criadaEm: EM, atualizadaEm: EM, ...extra,
});

export const PESSOAS: Pessoa[] = [
  pessoa('bruno', 'Bruno Almeida', { telefone: '(51) 90000-0001' }),
  pessoa('carla', 'Carla Souza'),
  pessoa('fernanda', 'Fernanda Lima', { ehAluno: false, ehResponsavel: true }),
  pessoa('davi', 'Davi Lima', { dataNascimento: '2016-03-10', responsavelPessoaId: 'fernanda' }),
  pessoa('elisa', 'Elisa Lima', { dataNascimento: '2018-07-22', responsavelPessoaId: 'fernanda' }),
  pessoa('otavio', 'Otávio Rocha'),
  pessoa('gabriel', 'Gabriel Teixeira', { ehAluno: false, ehFuncionario: true }),
  pessoa('helena', 'Helena Martins', { ehAluno: true, ehFuncionario: true }),
  pessoa('igor', 'Igor Pereira', { ehAluno: false, ehFuncionario: true }),
];

export const FUNCIONARIOS: Funcionario[] = [
  { id: 'f-gabriel', academiaId: ACADEMIA, pessoaId: 'gabriel', funcao: 'professor', modalidadeIds: ['muay-thai'], remuneracao: { tipo: 'comissao', comissaoPontosBase: 4000 }, desde: '2025-01-01' },
  { id: 'f-helena', academiaId: ACADEMIA, pessoaId: 'helena', funcao: 'professor', modalidadeIds: ['jiu-jitsu'], remuneracao: { tipo: 'fixo_mais_comissao', fixoCentavos: 80000, comissaoPontosBase: 2000 }, desde: '2025-06-01' },
  { id: 'f-igor', academiaId: ACADEMIA, pessoaId: 'igor', funcao: 'recepcao', modalidadeIds: [], remuneracao: { tipo: 'fixo', fixoCentavos: 160000 }, desde: '2026-02-01' },
];

const matricula = (m: Omit<Matricula, 'academiaId' | 'estado' | 'descontos' | 'pagadorPessoaId'> & Partial<Matricula>): Matricula => ({
  academiaId: ACADEMIA, estado: 'ativa', descontos: [], pagadorPessoaId: m.pessoaId, ...m,
});

export const MATRICULAS: Matricula[] = [
  matricula({ id: 'm-bruno', pessoaId: 'bruno', planoId: 'muay-thai-livre', inicio: '2026-03-02', diaDeVencimento: 10 }),
  matricula({ id: 'm-carla', pessoaId: 'carla', planoId: 'combo-2', inicio: '2025-11-05', diaDeVencimento: 5 }),
  matricula({ id: 'm-davi', pessoaId: 'davi', pagadorPessoaId: 'fernanda', planoId: 'muay-thai-kids', inicio: '2026-02-01', diaDeVencimento: 10 }),
  matricula({ id: 'm-elisa', pessoaId: 'elisa', pagadorPessoaId: 'fernanda', planoId: 'jiu-jitsu-kids', inicio: '2026-08-01', diaDeVencimento: 10, descontos: [{ tipo: 'percentual', pontosBase: 1000, motivo: 'familia' }] }),
  matricula({ id: 'm-otavio', pessoaId: 'otavio', planoId: 'boxe-2x', inicio: '2026-01-15', diaDeVencimento: 15, estado: 'trancada', trancadaDe: '2026-10-01', trancadaAte: '2026-11-30' }),
  matricula({ id: 'm-helena', pessoaId: 'helena', planoId: 'muay-thai-2x', inicio: '2026-06-01', diaDeVencimento: 10, descontos: [{ tipo: 'percentual', pontosBase: 10000, motivo: 'funcionario' }] }),
];

const categoria = (id: string, nome: string, tipo: 'entrada' | 'saida', ordem: number): Categoria => ({
  id, academiaId: ACADEMIA, nome, tipo, ordem, arquivada: false,
});

/** Proposta de categorias para começar; o dono edita (RA4.6). */
export const CATEGORIAS: Categoria[] = [
  categoria('mensalidades', 'Mensalidades', 'entrada', 1),
  categoria('matriculas', 'Taxas de matrícula', 'entrada', 2),
  categoria('graduacoes', 'Exames de graduação', 'entrada', 3),
  categoria('eventos-entrada', 'Eventos e campeonatos (entradas)', 'entrada', 4),
  categoria('produtos', 'Venda de produtos', 'entrada', 5),
  categoria('aulas-avulsas', 'Aulas avulsas e particulares', 'entrada', 6),
  categoria('outras-entradas', 'Outras entradas', 'entrada', 7),
  categoria('aluguel', 'Aluguel', 'saida', 10),
  categoria('salarios', 'Salários', 'saida', 11),
  categoria('comissoes', 'Comissão de professores', 'saida', 12),
  categoria('luz', 'Luz', 'saida', 13),
  categoria('agua', 'Água', 'saida', 14),
  categoria('internet', 'Internet e telefone', 'saida', 15),
  categoria('equipamento', 'Equipamento (tatame, luvas, sacos)', 'saida', 16),
  categoria('limpeza', 'Limpeza e manutenção', 'saida', 17),
  categoria('estoque', 'Produtos para revenda', 'saida', 18),
  categoria('eventos-saida', 'Eventos e campeonatos (saídas)', 'saida', 19),
  categoria('impostos', 'Impostos e taxas', 'saida', 20),
  categoria('contador', 'Contador', 'saida', 21),
  categoria('marketing', 'Divulgação', 'saida', 22),
  categoria('outras-saidas', 'Outras saídas', 'saida', 23),
];

const despesa = (d: Omit<DespesaFixa, 'academiaId' | 'ativa' | 'variavel' | 'desde'> & Partial<DespesaFixa>): DespesaFixa => ({
  academiaId: ACADEMIA, ativa: true, variavel: false, desde: '2026-01', ...d,
});

export const DESPESAS_FIXAS: DespesaFixa[] = [
  despesa({ id: 'd-aluguel', descricao: 'Aluguel da sala', categoriaId: 'aluguel', valorCentavos: 350000, diaDeVencimento: 10, formaDePagamento: 'pix' }),
  despesa({ id: 'd-luz', descricao: 'Luz', categoriaId: 'luz', valorCentavos: 45000, diaDeVencimento: 20, variavel: true }),
  despesa({ id: 'd-internet', descricao: 'Internet', categoriaId: 'internet', valorCentavos: 12000, diaDeVencimento: 15 }),
  despesa({ id: 'd-igor', descricao: 'Salário — Igor Pereira', categoriaId: 'salarios', valorCentavos: 160000, diaDeVencimento: 5, pessoaId: 'igor' }),
];

export const EVENTOS: Evento[] = [
  { id: 'ev-lomba', academiaId: ACADEMIA, nome: 'Card de lutas — Lomba do Pinheiro', tipo: 'luta', data: '2026-11-21', local: 'Lomba do Pinheiro', modalidadeIds: ['muay-thai'], arquivado: false },
];

/** Monta um lançamento de exemplo com o mínimo. */
export function lancamentoDeExemplo(l: Partial<Lancamento> & Pick<Lancamento, 'id' | 'data' | 'tipo' | 'valorCentavos'>): Lancamento {
  return {
    academiaId: ACADEMIA, descricao: l.id, situacao: 'pago', origem: 'manual', criadoPor: 'dono', criadoEm: EM, atualizadoEm: EM, ...l,
  };
}

/** Monta uma cobrança de exemplo com o mínimo. */
export function cobrancaDeExemplo(c: Partial<Cobranca> & Pick<Cobranca, 'id' | 'pessoaId' | 'vencimento' | 'valorCentavos'>): Cobranca {
  return {
    academiaId: ACADEMIA, tipo: 'mensalidade', competencia: c.vencimento.slice(0, 7), descricao: 'Mensalidade',
    valorBrutoCentavos: c.valorCentavos, descontoCentavos: 0, estado: 'aberta', reparticao: [], criadaEm: EM, ...c,
  };
}
