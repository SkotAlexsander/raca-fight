/**
 * Graduação (regras R16.4 a R16.15): a faixa atual, o histórico, "atingiu os
 * mínimos" e o exame.
 *
 * O ponto que não se negocia: **o app nunca gradua sozinho** (R16.11). Ele só
 * lista quem cumpre os mínimos; quem registra é o professor (`registrarGraduacao`).
 *
 * - O tempo conta da data REGISTRADA NO APP (R16.7): serve para a academia se
 *   organizar e não prova nada perante a federação. A tela diz isso.
 * - Mínimo da federação (idade, tempo) e da academia (presenças) são separados
 *   (R16.3) e a avaliação diz qual falta.
 * - Graduação não se apaga: anula-se com motivo (R16.13).
 */
import type { DataISO, Id, InstanteISO } from '../tipos.ts';
import type { ContagemDaIdade, NivelDeGraduacao, SistemaDeGraduacao } from './sistemas.ts';

export type OrigemDaGraduacao = 'promocao' | 'exame' | 'inicial' | 'anterior' | 'correcao';

export const LIMITE_DA_OBSERVACAO = 140;

export interface Graduacao {
  id: Id;
  academiaId: Id;
  alunoId: Id;
  modalidadeId: Id;
  sistemaId: Id;
  nivelId: Id;
  grau: number;
  /** A data da graduação (nunca futura). É dela que o tempo conta (R16.7). */
  data: DataISO;
  /** Quem graduou (padrão: quem registra). Pode ser um nome de fora (mestre convidado no exame). */
  graduadoPorId: Id | null;
  graduadoPorNome?: string;
  observacao?: string;
  origem: OrigemDaGraduacao;
  /** Faixa trazida de outra academia (R16.8). */
  academiaDeOrigem?: string;
  exameId?: Id;
  registradaPorId: Id;
  registradaEm: InstanteISO;
  anulada?: { porId: Id; em: InstanteISO; motivo: string };
}

export interface Passo {
  nivelId: Id;
  grau: number;
}

export class ErroDeGraduacao extends Error {
  readonly codigo: 'data_futura' | 'observacao_longa' | 'nivel_desconhecido' | 'grau_invalido' | 'motivo_vazio' | 'exame_fechado' | 'sem_resultado';
  constructor(codigo: ErroDeGraduacao['codigo'], mensagem: string) {
    super(mensagem);
    this.codigo = codigo;
  }
}

// ---------------------------------------------------------------------------
// Leitura: a atual, o histórico, o texto
// ---------------------------------------------------------------------------

const valida = (g: Graduacao) => !g.anulada;
const ordem = (a: Graduacao, b: Graduacao) => (a.data === b.data ? (a.registradaEm < b.registradaEm ? -1 : a.registradaEm > b.registradaEm ? 1 : 0) : a.data < b.data ? -1 : 1);

/** R16.4: uma graduação atual por modalidade: a mais recente não anulada. */
export function graduacaoAtual(graduacoes: readonly Graduacao[], alunoId: Id, modalidadeId: Id): Graduacao | null {
  return graduacoes.filter((g) => g.alunoId === alunoId && g.modalidadeId === modalidadeId && valida(g)).sort(ordem).at(-1) ?? null;
}

/** O histórico em ordem. O aluno não vê as anuladas (R16.13); a equipe vê, riscadas. */
export function historicoDeGraduacao(graduacoes: readonly Graduacao[], alunoId: Id, modalidadeId: Id, incluirAnuladas = false): Graduacao[] {
  return graduacoes.filter((g) => g.alunoId === alunoId && g.modalidadeId === modalidadeId && (incluirAnuladas || valida(g))).sort(ordem);
}

export function nivelDoSistema(sistema: SistemaDeGraduacao, nivelId: Id): NivelDeGraduacao | null {
  return sistema.niveis.find((n) => n.id === nivelId) ?? null;
}

export function indiceDoNivel(sistema: SistemaDeGraduacao, nivelId: Id): number | null {
  const i = sistema.niveis.findIndex((n) => n.id === nivelId);
  return i < 0 ? null : i;
}

const maiuscula = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * R16.9: a palavra vem do sistema. "Faixa branca, 2º grau" · "Faixa azul" ·
 * "Kruang amarelo". Sem nível conhecido: o nome cru.
 */
export function descreverGraduacao(sistema: SistemaDeGraduacao, nivelId: Id, grau: number): string {
  const nivel = nivelDoSistema(sistema, nivelId);
  const base = `${maiuscula(sistema.palavraDoNivel)} ${nivel?.nome ?? nivelId}`;
  if (!sistema.palavraDoGrau || grau <= 0) return base;
  return `${base}, ${grau}º ${sistema.palavraDoGrau}`;
}

// ---------------------------------------------------------------------------
// Idade e tempo
// ---------------------------------------------------------------------------

/** R16.5: na IBJJF a idade é ano atual − ano de nascimento; nas outras, a do aniversário. */
export function idadeNoSistema(nascimento: DataISO, hoje: DataISO, contagem: ContagemDaIdade): number {
  const anos = +hoje.slice(0, 4) - +nascimento.slice(0, 4);
  if (contagem === 'ano_civil') return anos;
  return hoje.slice(5) >= nascimento.slice(5) ? anos : anos - 1;
}

/** Meses inteiros de `de` até `ate` (o dia do mês conta). */
export function mesesEntre(de: DataISO, ate: DataISO): number {
  const m = (+ate.slice(0, 4) - +de.slice(0, 4)) * 12 + (+ate.slice(5, 7) - +de.slice(5, 7));
  return ate.slice(8) >= de.slice(8) ? m : m - 1;
}

/** A data `meses` depois (no último dia do mês, se o dia não existe). */
export function somarMeses(data: DataISO, meses: number): DataISO {
  const a = +data.slice(0, 4);
  const m = +data.slice(5, 7) - 1 + meses;
  const d = +data.slice(8, 10);
  const ano = a + Math.floor(m / 12);
  const mes = ((m % 12) + 12) % 12;
  const ultimo = new Date(Date.UTC(ano, mes + 1, 0)).getUTCDate();
  return new Date(Date.UTC(ano, mes, Math.min(d, ultimo))).toISOString().slice(0, 10);
}

/** R16.5: no sistema IBJJF, o kids passa ao adulto no ano em que completa 16. */
export function passaAoAdultoEsteAno(nascimento: DataISO, hoje: DataISO): boolean {
  return idadeNoSistema(nascimento, hoje, 'ano_civil') === 16;
}

// ---------------------------------------------------------------------------
// O próximo passo e os mínimos (R16.11)
// ---------------------------------------------------------------------------

/** O próximo grau, ou a faixa seguinte com grau 0. Nulo no topo ou em régua sem níveis. */
export function proximoPasso(sistema: SistemaDeGraduacao, atual: Passo | null): Passo | null {
  if (sistema.niveis.length === 0) return null;
  if (!atual) return { nivelId: sistema.niveis[0]!.id, grau: 0 };
  const i = indiceDoNivel(sistema, atual.nivelId);
  if (i === null) return null;
  const nivel = sistema.niveis[i]!;
  if (atual.grau < nivel.grausMaximos) return { nivelId: nivel.id, grau: atual.grau + 1 };
  const seguinte = sistema.niveis[i + 1];
  return seguinte ? { nivelId: seguinte.id, grau: 0 } : null;
}

export type MinimoQueFalta = 'tempo' | 'presencas' | 'idade';

export interface AvaliacaoDosMinimos {
  passo: Passo | null;
  /** O passo tem algum mínimo (federação ou academia). */
  temMinimos: boolean;
  cumpre: boolean;
  faltam: MinimoQueFalta[];
  /** Desde quando cumpre tudo (para "há mais tempo cumprindo primeiro"). */
  cumpreDesde: DataISO | null;
  presencas: number;
  meses: number;
  /** De onde vem cada mínimo (a tela diz qual é qual, R16.3). */
  origens: Partial<Record<MinimoQueFalta, 'federacao' | 'academia'>>;
}

export interface EntradaDaAvaliacao {
  sistema: SistemaDeGraduacao;
  /** A graduação atual (com a data); nula = ainda sem faixa registrada. */
  atual: Graduacao | null;
  /** As datas das presenças que contam na modalidade DEPOIS da graduação atual, em ordem. */
  datasDasPresencas: readonly DataISO[];
  nascimento?: DataISO;
  hoje: DataISO;
}

/**
 * Atingiu os mínimos? Passando de grau, valem a regra dos graus; passando de
 * nível, o tempo mínimo no nível atual, as presenças mínimas (academia) e a
 * idade mínima do próximo. Sem a data de nascimento, a idade não trava (a
 * tela pede a data à recepção), mas fica marcada como mínimo desconhecido.
 */
export function avaliarMinimos(e: EntradaDaAvaliacao): AvaliacaoDosMinimos {
  const atualPasso = e.atual ? { nivelId: e.atual.nivelId, grau: e.atual.grau } : null;
  const passo = proximoPasso(e.sistema, atualPasso);
  const desde = e.atual?.data ?? null;
  const presencas = e.datasDasPresencas.length;
  const meses = desde ? mesesEntre(desde, e.hoje) : 0;
  const base: AvaliacaoDosMinimos = { passo, temMinimos: false, cumpre: false, faltam: [], cumpreDesde: null, presencas, meses, origens: {} };
  if (!passo) return base;
  const nivelAtual = e.atual ? nivelDoSistema(e.sistema, e.atual.nivelId) : null;
  const proximoNivel = nivelDoSistema(e.sistema, passo.nivelId)!;
  const mudaDeNivel = !e.atual || passo.nivelId !== e.atual.nivelId;

  let mesesMinimos: number | undefined;
  let presencasMinimas: number | undefined;
  let idadeMinima: number | undefined;
  const origens: AvaliacaoDosMinimos['origens'] = {};
  if (mudaDeNivel) {
    if (nivelAtual?.mesesMinimos) {
      mesesMinimos = nivelAtual.mesesMinimos.meses;
      origens.tempo = nivelAtual.mesesMinimos.origem;
    }
    if (nivelAtual?.presencasMinimas !== undefined) {
      presencasMinimas = nivelAtual.presencasMinimas;
      origens.presencas = 'academia';
    }
    if (proximoNivel.idadeMinima !== undefined) {
      idadeMinima = proximoNivel.idadeMinima;
      origens.idade = 'federacao';
    }
  } else {
    const regra = nivelAtual?.regraDosGraus;
    const m = regra?.mesesPorGrau?.[passo.grau - 1];
    if (m !== undefined) {
      mesesMinimos = m;
      origens.tempo = regra!.origem;
    }
    if (regra?.presencasPorGrau !== undefined) {
      presencasMinimas = regra.presencasPorGrau;
      origens.presencas = 'academia';
    }
  }
  const temMinimos = mesesMinimos !== undefined || presencasMinimas !== undefined || idadeMinima !== undefined;
  const faltam: MinimoQueFalta[] = [];
  const marcos: DataISO[] = [];
  if (mesesMinimos !== undefined) {
    const quando = desde ? somarMeses(desde, mesesMinimos) : null;
    if (!quando || quando > e.hoje) faltam.push('tempo');
    else marcos.push(quando);
  }
  if (presencasMinimas !== undefined) {
    if (presencas < presencasMinimas) faltam.push('presencas');
    else if (presencasMinimas > 0) marcos.push(e.datasDasPresencas[presencasMinimas - 1]!);
  }
  if (idadeMinima !== undefined && e.nascimento) {
    const idade = idadeNoSistema(e.nascimento, e.hoje, e.sistema.contagemDaIdade);
    if (idade < idadeMinima) faltam.push('idade');
    else marcos.push(e.sistema.contagemDaIdade === 'ano_civil' ? `${+e.nascimento.slice(0, 4) + idadeMinima}-01-01` : somarMeses(e.nascimento, idadeMinima * 12));
  }
  const cumpre = faltam.length === 0;
  const cumpreDesde = cumpre && temMinimos ? ([...marcos, desde ?? e.hoje].sort().at(-1) ?? null) : null;
  return { passo, temMinimos, cumpre, faltam, cumpreDesde, presencas, meses, origens };
}

export interface CandidatoAAvaliacao<T> {
  aluno: T;
  avaliacao: AvaliacaoDosMinimos;
}

/**
 * A lista "Atingiram os mínimos" (R16.11): só quem cumpre. Os de passo COM
 * mínimos vêm primeiro, há mais tempo cumprindo primeiro; os de passo SEM
 * nenhum mínimo definido vêm depois, por presenças desde a última graduação.
 * Quem está no topo da régua (sem próximo passo) não entra.
 */
export function prontosParaAvaliar<T>(candidatos: readonly CandidatoAAvaliacao<T>[]): CandidatoAAvaliacao<T>[] {
  const comPasso = candidatos.filter((c) => c.avaliacao.passo && c.avaliacao.cumpre);
  const com = comPasso.filter((c) => c.avaliacao.temMinimos).sort((a, b) => (a.avaliacao.cumpreDesde! < b.avaliacao.cumpreDesde! ? -1 : a.avaliacao.cumpreDesde! > b.avaliacao.cumpreDesde! ? 1 : 0));
  const sem = comPasso.filter((c) => !c.avaliacao.temMinimos).sort((a, b) => b.avaliacao.presencas - a.avaliacao.presencas);
  return [...com, ...sem];
}

// ---------------------------------------------------------------------------
// Registrar, faixa inicial, faixa anterior, anular (R16.4, R16.6, R16.8, R16.13)
// ---------------------------------------------------------------------------

export interface RegistroDeGraduacao {
  id: Id;
  academiaId: Id;
  alunoId: Id;
  modalidadeId: Id;
  sistema: SistemaDeGraduacao;
  passo: Passo;
  data: DataISO;
  hoje: DataISO;
  graduadoPorId: Id | null;
  graduadoPorNome?: string;
  observacao?: string;
  origem: Exclude<OrigemDaGraduacao, 'inicial'>;
  academiaDeOrigem?: string;
  exameId?: Id;
  registradaPorId: Id;
  em: InstanteISO;
}

/** O professor registra (R16.6). Confere a régua, a data e a observação; NÃO confere filiação na federação. */
export function registrarGraduacao(r: RegistroDeGraduacao): Graduacao {
  if (r.data > r.hoje) throw new ErroDeGraduacao('data_futura', 'A data da graduação não pode ser no futuro.');
  const nivel = nivelDoSistema(r.sistema, r.passo.nivelId);
  if (!nivel) throw new ErroDeGraduacao('nivel_desconhecido', 'Essa faixa não está na régua desta modalidade.');
  if (!Number.isInteger(r.passo.grau) || r.passo.grau < 0 || r.passo.grau > nivel.grausMaximos) throw new ErroDeGraduacao('grau_invalido', `A ${nivel.nome} vai até ${nivel.grausMaximos} graus.`);
  const obs = r.observacao?.trim();
  if (obs && [...obs].length > LIMITE_DA_OBSERVACAO) throw new ErroDeGraduacao('observacao_longa', `A observação tem até ${LIMITE_DA_OBSERVACAO} caracteres.`);
  return {
    id: r.id,
    academiaId: r.academiaId,
    alunoId: r.alunoId,
    modalidadeId: r.modalidadeId,
    sistemaId: r.sistema.id,
    nivelId: r.passo.nivelId,
    grau: r.passo.grau,
    data: r.data,
    graduadoPorId: r.graduadoPorId,
    ...(r.graduadoPorNome?.trim() ? { graduadoPorNome: r.graduadoPorNome.trim() } : {}),
    ...(obs ? { observacao: obs } : {}),
    origem: r.origem,
    ...(r.academiaDeOrigem?.trim() ? { academiaDeOrigem: r.academiaDeOrigem.trim() } : {}),
    ...(r.exameId ? { exameId: r.exameId } : {}),
    registradaPorId: r.registradaPorId,
    registradaEm: r.em,
  };
}

/** R16.4: na primeira presença numa modalidade com régua, o primeiro nível com grau 0. Régua vazia: nada. */
export function graduacaoInicial(d: { id: Id; academiaId: Id; alunoId: Id; modalidadeId: Id; sistema: SistemaDeGraduacao; data: DataISO; em: InstanteISO }): Graduacao | null {
  const primeiro = d.sistema.niveis[0];
  if (!primeiro) return null;
  return { id: d.id, academiaId: d.academiaId, alunoId: d.alunoId, modalidadeId: d.modalidadeId, sistemaId: d.sistema.id, nivelId: primeiro.id, grau: 0, data: d.data, graduadoPorId: null, origem: 'inicial', registradaPorId: 'sistema', registradaEm: d.em };
}

/** R16.13: anular com motivo (o professor ou o dono). Ela some do aluno e fica, riscada, no histórico da equipe. */
export function anularGraduacao(g: Graduacao, porId: Id, motivo: string, em: InstanteISO): Graduacao {
  if (!motivo.trim()) throw new ErroDeGraduacao('motivo_vazio', 'Diga o motivo para anular.');
  return { ...g, anulada: { porId, em, motivo: motivo.trim() } };
}

// ---------------------------------------------------------------------------
// Exame de graduação (R16.12)
// ---------------------------------------------------------------------------

export type ResultadoDoExame = 'aprovado' | 'nao_aprovado' | 'faltou';

export interface CandidatoDoExame {
  alunoId: Id;
  resultado?: ResultadoDoExame;
  /** Para qual faixa ou grau, quando aprovado. */
  para?: Passo;
}

export interface Exame {
  id: Id;
  academiaId: Id;
  modalidadeId: Id;
  sistemaId: Id;
  data: DataISO;
  hora: string;
  local: string;
  avaliadorIds: Id[];
  candidatos: CandidatoDoExame[];
  fechadoEm?: InstanteISO;
}

export function definirResultado(exame: Exame, alunoId: Id, resultado: ResultadoDoExame, para?: Passo): Exame {
  if (exame.fechadoEm) throw new ErroDeGraduacao('exame_fechado', 'O exame já foi fechado.');
  return { ...exame, candidatos: exame.candidatos.map((c) => (c.alunoId === alunoId ? { alunoId, resultado, ...(resultado === 'aprovado' && para ? { para } : {}) } : c)) };
}

/** "Fechar o exame": cria as graduações dos aprovados (origem `exame`) de uma vez. Todos precisam de resultado. */
export function fecharExame(d: { exame: Exame; sistema: SistemaDeGraduacao; hoje: DataISO; porId: Id; em: InstanteISO; gerarId: () => Id }): { exame: Exame; graduacoes: Graduacao[] } {
  if (d.exame.fechadoEm) throw new ErroDeGraduacao('exame_fechado', 'O exame já foi fechado.');
  if (d.exame.candidatos.some((c) => !c.resultado || (c.resultado === 'aprovado' && !c.para))) throw new ErroDeGraduacao('sem_resultado', 'Falta o resultado de algum candidato.');
  const graduacoes = d.exame.candidatos
    .filter((c) => c.resultado === 'aprovado')
    .map((c) =>
      registrarGraduacao({
        id: d.gerarId(),
        academiaId: d.exame.academiaId,
        alunoId: c.alunoId,
        modalidadeId: d.exame.modalidadeId,
        sistema: d.sistema,
        passo: c.para!,
        data: d.exame.data,
        hoje: d.hoje,
        graduadoPorId: d.exame.avaliadorIds[0] ?? d.porId,
        origem: 'exame',
        exameId: d.exame.id,
        registradaPorId: d.porId,
        em: d.em,
      }),
    );
  return { exame: { ...d.exame, fechadoEm: d.em }, graduacoes };
}

/** As datas das presenças DEPOIS da graduação (para `avaliarMinimos`). */
export function datasDepoisDe(datas: readonly DataISO[], desde: DataISO | null): DataISO[] {
  return datas.filter((d) => desde === null || d > desde).sort();
}
