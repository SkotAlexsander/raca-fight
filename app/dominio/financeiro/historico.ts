/**
 * Histórico de tudo (RA9): quem mudou o quê e quando.
 *
 * No banco, quem grava é um GATILHO em cada tabela do admin (a tela não
 * consegue pular). Estas funções servem para mostrar o histórico e para o
 * repositório local de exemplo gravar do mesmo jeito.
 *
 * O registro é dado financeiro: nunca vai para console, Sentry ou analytics.
 */

import type { DataISO, Id, InstanteISO } from '../tipos.ts';
import { formatarDinheiro, formatarPontosBase } from './dinheiro.ts';
import { ehCompetencia, ehDataISO, formatarDataBR, nomeDaCompetencia } from './datas.ts';
import type { AcaoDoHistorico, MudancaDeCampo, RegistroDoHistorico } from './tipos.ts';

const IGNORAR = new Set(['atualizadoEm', 'atualizadaEm']);

const igual = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** Campo a campo (raso; listas e objetos comparados inteiros), em ordem alfabética. */
export function diferencas(antes: object | undefined, depois: object | undefined): MudancaDeCampo[] {
  const a = (antes ?? {}) as Record<string, unknown>;
  const d = (depois ?? {}) as Record<string, unknown>;
  const campos = [...new Set([...Object.keys(a), ...Object.keys(d)])].filter((c) => !IGNORAR.has(c)).sort();
  return campos.filter((c) => !igual(a[c], d[c])).map((campo) => ({ campo, de: a[campo], para: d[campo] }));
}

type Registravel = { id: Id; arquivado?: boolean; arquivada?: boolean };

export function registroDeMudanca<T extends Registravel>(entrada: {
  tabela: string;
  academiaId: Id;
  antes: T | undefined;
  depois: T | undefined;
  porId: Id;
  em: InstanteISO;
  gerarId: () => Id;
  acao?: AcaoDoHistorico;
  motivo?: string;
}): RegistroDoHistorico | null {
  const { antes, depois } = entrada;
  const alvo = depois ?? antes;
  if (!alvo) return null;
  const mudancas = diferencas(antes, depois);
  if (!mudancas.length && !entrada.acao) return null;
  const arquivou = !!antes && !!depois && !(antes.arquivado || antes.arquivada) && !!(depois.arquivado || depois.arquivada);
  const acao: AcaoDoHistorico = entrada.acao ?? (!antes ? 'criou' : arquivou ? 'arquivou' : 'mudou');
  return {
    id: entrada.gerarId(), academiaId: entrada.academiaId, tabela: entrada.tabela, registroId: alvo.id, acao, mudancas,
    porId: entrada.porId, em: entrada.em, ...(entrada.motivo ? { motivo: entrada.motivo } : {}),
  };
}

/** O nome de cada campo na tela (AR, 15/10: nada de `trancadaAte` cru). */
const ROTULOS: Record<string, string> = {
  // lançamento e cobrança
  valorCentavos: 'Valor', valorBrutoCentavos: 'Valor sem desconto', descontoCentavos: 'Desconto', valorPagoCentavos: 'Valor pago',
  data: 'Data', descricao: 'Descrição', categoriaId: 'Categoria', tipo: 'Tipo', formaDePagamento: 'Forma de pagamento',
  pessoaId: 'Pessoa', alunoPessoaId: 'Aluno', situacao: 'Situação', vencimento: 'Vencimento', competencia: 'Mês',
  estado: 'Estado', pagaEm: 'Paga em', lancamentoId: 'Lançamento', cobrancaId: 'Cobrança', matriculaId: 'Matrícula',
  despesaFixaId: 'Despesa fixa', importacaoId: 'Importação', eventoId: 'Evento', reparticao: 'Repartição por modalidade',
  origem: 'Origem', estimado: 'Estimado', observacao: 'Observação', arquivado: 'Arquivado', arquivada: 'Arquivada',
  // matrícula e plano
  planoId: 'Plano', pagadorPessoaId: 'Quem paga', inicio: 'Início', fim: 'Fim', diaDeVencimento: 'Dia de vencimento',
  descontos: 'Descontos', trancadaDe: 'Trancada desde', trancadaAte: 'Trancada até', isentarTaxaDeMatricula: 'Isenta da taxa de matrícula',
  nome: 'Nome', modalidadeIds: 'Modalidades', aulasPorSemana: 'Aulas por semana', periodicidade: 'Periodicidade',
  taxaDeMatriculaCentavos: 'Taxa de matrícula', pesos: 'Pesos do combo', ativo: 'Ativo', ativa: 'Ativa', ordem: 'Ordem',
  // pessoa e funcionário
  telefone: 'Telefone', email: 'E-mail', documento: 'Documento', dataNascimento: 'Data de nascimento',
  responsavelPessoaId: 'Responsável', usuarioId: 'Conta do app', ehAluno: 'É aluno', ehFuncionario: 'É funcionário',
  ehResponsavel: 'É responsável', funcao: 'Função', remuneracao: 'Remuneração', desde: 'Desde', ate: 'Até',
  // despesa fixa e regras de cobrança
  variavel: 'Valor variável', primeiroMes: 'Primeiro mês', atraso: 'Multa e juros', gerarSozinhoNoDia1: 'Gerar sozinho no dia 1',
  diasParaRetornoDaExperimental: 'Dias para chamar de volta', descontoFamilia: 'Desconto família', descontoIndicacao: 'Desconto da indicação',
  whatsappDaAcademia: 'WhatsApp da academia',
  // anotações
  texto: 'Texto', titulo: 'Título', detalhe: 'Detalhe', hora: 'Hora', repeticao: 'Repetição', diaDoMes: 'Dia do mês',
  avisarDiasAntes: 'Avisar antes (dias)', fixada: 'Fixada', concluidoEm: 'Concluído em', ultimaConclusaoEm: 'Última conclusão',
  prazo: 'Prazo', feitaEm: 'Feita em', interessadoId: 'Interessado',
  // fechamento e importação
  totais: 'Totais', porCategoria: 'Por categoria', aReceberEmAberto: 'A receber em aberto', fechadoEm: 'Fechado em',
  fechadoPor: 'Fechado por', reabertoEm: 'Reaberto em', reabertoPor: 'Reaberto por', motivoDaReabertura: 'Motivo da reabertura',
  arquivoNome: 'Arquivo', formato: 'Formato', linhasGravadas: 'Linhas gravadas', linhasLidas: 'Linhas lidas',
  // funil
  whatsapp: 'WhatsApp', contatoEm: 'Contato em', matriculadoEm: 'Matriculado em', desistiuEm: 'Desistiu em',
  motivoDaDesistencia: 'Motivo da desistência', indicadoPorPessoaId: 'Indicado por',
  // grade de aulas, graduação e as tabelas que a integração (AU) pôs no histórico
  turmaId: 'Turma', horarioId: 'Horário', publico: 'Público', nivel: 'Nível', professorId: 'Professor', auxiliarIds: 'Auxiliares',
  capacidade: 'Capacidade', idadeMinima: 'Idade mínima', idadeMaxima: 'Idade máxima', exigencia: 'Exigência', dia: 'Dia',
  duracaoMinutos: 'Duração (minutos)', chave: 'Chave', papel: 'Papel', anuladaEm: 'Anulada em', sistemaId: 'Régua de graduação',
  nivelId: 'Faixa', grau: 'Grau', publicada: 'Publicada', visivel: 'Visível', pergunta: 'Pergunta', resposta: 'Resposta',
};

const TABELAS: Record<string, string> = {
  lancamentos: 'o lançamento', cobrancas: 'a cobrança', matriculas: 'a matrícula', pessoas: 'o cadastro',
  planos: 'o plano', categorias: 'a categoria', despesas_fixas: 'a despesa fixa', fechamentos: 'o fechamento',
  notas: 'a nota', lembretes: 'o lembrete', tarefas: 'a tarefa', interessados: 'o interessado', funcionarios: 'o funcionário',
  importacoes: 'a importação', regras_de_cobranca: 'as regras de cobrança', modalidades: 'a modalidade',
  filtros_salvos: 'o filtro salvo', aulas_experimentais: 'a aula experimental',
  // as que a integração (AU, 16/10) pôs no gatilho do histórico
  vinculos: 'o vínculo', turmas: 'a turma', horarios: 'o horário', alunos_das_turmas: 'o aluno da turma', atletas: 'o atleta',
  sistemas_de_graduacao: 'a régua de graduação', ajustes_de_aula: 'o ajuste de aula', graduacoes: 'a graduação', exames: 'o exame',
  candidatos_do_exame: 'o candidato do exame', lutas: 'a luta', consentimentos_de_atleta: 'o consentimento do atleta', tecnicas: 'a técnica',
  perguntas_frequentes: 'a pergunta do Raça Responde', indicacoes: 'a indicação', avisos_da_academia: 'o aviso da academia',
  perfis_profissionais: 'o perfil profissional', eventos: 'o evento',
};

const VERBOS: Record<AcaoDoHistorico, string> = {
  criou: 'criou', mudou: 'mudou', arquivou: 'arquivou', anulou: 'anulou', fechou: 'fechou', reabriu: 'reabriu', importou: 'importou', desfez_importacao: 'desfez',
};

/** Valores de código que têm nome próprio na tela (em minúscula, porque vão no meio da frase). */
const VALORES: Record<string, string> = {
  saida: 'saída', cartao_credito: 'cartão de crédito', cartao_debito: 'cartão de débito', transferencia: 'transferência',
  familia: 'família', indicacao: 'indicação', funcionario: 'funcionário', nao_repete: 'não repete', recepcao: 'recepção',
  despesa_fixa: 'despesa fixa', importacao: 'importação', remuneracao: 'remuneração',
  a_partir_do_proximo: 'a partir do próximo mês', fixo_mais_comissao: 'fixo + comissão', comissao: 'comissão', por_aula: 'por aula',
  sem_remuneracao: 'sem remuneração', matricula: 'matrícula', graduacao: 'graduação', passou_na_porta: 'passou na porta',
};

type DescontoGuardado = { tipo?: string; pontosBase?: number; centavos?: number; motivo?: string };

function formatarDesconto(d: DescontoGuardado): string {
  const motivo = d.motivo ? (VALORES[d.motivo] ?? d.motivo.replace(/_/g, ' ')) : 'desconto';
  const valor = d.tipo === 'percentual' && typeof d.pontosBase === 'number' ? formatarPontosBase(d.pontosBase)
    : typeof d.centavos === 'number' ? formatarDinheiro(d.centavos) : '';
  return `${motivo} ${valor}`.trim();
}

const INSTANTE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

/** O banco grava o campo em snake_case (`valor_centavos`): vira o nome do domínio antes de tudo (AO). */
const doBanco = (campo: string) => campo.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());

function formatarValor(campoCru: string, v: unknown, nomeDe: (id: Id) => string): string {
  const campo = doBanco(campoCru);
  if (v == null || v === '') return '—';
  if (campo === 'descontos' && Array.isArray(v)) return v.length ? v.map((d) => formatarDesconto(d as DescontoGuardado)).join('; ') : 'nenhum';
  if (/Centavos$/.test(campo) && typeof v === 'number') return formatarDinheiro(v);
  if (/PontosBase$/.test(campo) && typeof v === 'number') return formatarPontosBase(v);
  if (/(Id|Por)$/.test(campo) && typeof v === 'string') return nomeDe(v);
  if (ehDataISO(v)) return formatarDataBR(v);
  if (typeof v === 'string' && INSTANTE.test(v)) return `${formatarDataBR(v.slice(0, 10))} às ${v.slice(11, 16)}`;
  if (ehCompetencia(v)) return nomeDaCompetencia(v);
  if (typeof v === 'boolean') return v ? 'sim' : 'não';
  if (Array.isArray(v)) return v.length ? `${v.length} ${v.length === 1 ? 'item' : 'itens'}` : 'nenhum';
  if (typeof v === 'object') return 'alterado';
  if (typeof v === 'string') return VALORES[v] ?? v.replace(/_/g, ' ');
  return String(v);
}

/** Campo sem rótulo conhecido: "algumCampoNovo" → "Algum campo novo" (nunca o nome cru). */
function rotuloDoCampo(campoCru: string): string {
  const campo = doBanco(campoCru);
  if (ROTULOS[campo]) return ROTULOS[campo];
  const palavras = campo.replace(/(Centavos|PontosBase|Id)$/, '').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ').toLowerCase();
  return palavras.charAt(0).toUpperCase() + palavras.slice(1);
}

function competenciaDoRegistro(r: RegistroDoHistorico, opcoes: OpcoesDaDescricao): string | undefined {
  const m = r.mudancas.find((x) => x.campo === 'competencia');
  const v = m?.para ?? m?.de ?? opcoes.competenciaDe?.(r.registroId);
  return ehCompetencia(v) ? v : undefined;
}

export interface OpcoesDaDescricao {
  /** Nome de quem fez e de qualquer id citado (pessoa, lançamento…). */
  nomeDe: (id: Id) => string;
  /** O nome da coisa mudada ("Aluguel da sala", "outubro.csv"), quando a tela sabe. */
  nomeDoRegistro?: (tabela: string, registroId: Id) => string | undefined;
  /** Fechamento sem o campo `competencia` nas mudanças: o mês dele. */
  competenciaDe?: (registroId: Id) => string | undefined;
  rotuloDe?: (campo: string, v: unknown) => string | undefined;
}

/**
 * Linhas para a tela, em frase (RA9.3): "Alex mudou o lançamento "Luz" em
 * 15/10/2026 às 10:00", "Valor: R$ 220,00 → R$ 240,00". O fechamento diz o
 * mês ("Alex fechou setembro de 2026"), nunca "fechou o fechamento" (AR).
 */
export function descreverRegistro(r: RegistroDoHistorico, opcoes: OpcoesDaDescricao): string[] {
  const quando = `em ${formatarDataBR(r.em.slice(0, 10))} às ${r.em.slice(11, 16)}`;
  const quem = opcoes.nomeDe(r.porId);
  const motivo = r.motivo ? [`Motivo: ${r.motivo}`] : [];

  if (r.tabela === 'fechamentos') {
    const comp = competenciaDoRegistro(r, opcoes);
    const mes = comp ? nomeDaCompetencia(comp) : 'o mês';
    const reabriu = r.acao === 'reabriu' || (r.acao === 'mudou' && r.mudancas.some((m) => m.campo === 'reabertoEm' && m.para));
    return [`${quem} ${reabriu ? 'reabriu' : 'fechou'} ${mes} ${quando}`, ...motivo];
  }

  const nome = opcoes.nomeDoRegistro?.(r.tabela, r.registroId);
  const alvo = `${TABELAS[r.tabela] ?? `um registro de ${r.tabela.replace(/_/g, ' ')}`}${nome ? ` "${nome}"` : ''}`;
  const linhas = [`${quem} ${VERBOS[r.acao]} ${alvo} ${quando}`];
  if (r.acao !== 'importou' && r.acao !== 'desfez_importacao') {
    for (const m of r.mudancas) {
      const f = (v: unknown) => opcoes.rotuloDe?.(m.campo, v) ?? formatarValor(m.campo, v, opcoes.nomeDe);
      linhas.push(`${rotuloDoCampo(m.campo)}: ${f(m.de)} → ${f(m.para)}`);
    }
  }
  return [...linhas, ...motivo];
}

export function filtrarHistorico(
  registros: readonly RegistroDoHistorico[],
  f: { registroId?: Id; tabela?: string; porId?: Id; de?: DataISO; ate?: DataISO },
): RegistroDoHistorico[] {
  return registros
    .filter((r) => (!f.registroId || r.registroId === f.registroId)
      && (!f.tabela || r.tabela === f.tabela)
      && (!f.porId || r.porId === f.porId)
      && (!f.de || r.em.slice(0, 10) >= f.de)
      && (!f.ate || r.em.slice(0, 10) <= f.ate))
    .sort((a, b) => Date.parse(b.em) - Date.parse(a.em));
}
