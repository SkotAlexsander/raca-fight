/**
 * Perfil profissional e a lista da Equipe da academia.
 * Regras: seção 11 de `01-especificacao/03-REGRAS.md` (R11.x citadas abaixo).
 * Modelo e RLS: `03-arquitetura/01-MODELO-DE-DADOS.md`, seção 23.
 *
 * `podeVerPerfil` ESPELHA a RLS para a tela decidir o que mostrar (link no
 * "Montado por", bloco "Meu personal"). Quem protege o dado é a RLS; esta
 * função nunca substitui a política. Puro, sem relógio: quem chama passa `agora`.
 * Testado em `perfil-profissional.test.ts`.
 */

import type {
  Especialidade,
  Id,
  InstanteISO,
  PapelNaAcademia,
  PerfilProfissional,
  TurnoNaAcademia,
  Vinculo,
} from './tipos.ts';
import { DIAS_DA_SEMANA, ESPECIALIDADES, PERIODOS_DO_DIA } from './tipos.ts';
import { temLink } from './avisos.ts';

// ---------------------------------------------------------------------------
// Limites (R11.2)
// ---------------------------------------------------------------------------

export const LIMITE_DO_NOME_DE_EXIBICAO = 60;
export const LIMITE_DA_FORMACAO = 60;
export const LIMITE_DO_SOBRE = 280;
export const LIMITE_DA_ESPECIALIDADE_OUTRA = 30;

/** R11.1: papéis de equipe que podem ter perfil. */
export const PAPEIS_COM_PERFIL: readonly PapelNaAcademia[] = ['recepcao', 'instrutor', 'personal', 'dono'];

/** Quem está olhando: a conta logada e os vínculos dela. */
export interface QuemVe {
  usuarioId: Id;
  vinculos: readonly Vinculo[];
}

// ---------------------------------------------------------------------------
// Texto
// ---------------------------------------------------------------------------

/** Conta caractere (code point), não unidade UTF-16: "é" e "💪" contam 1. */
const tamanho = (texto: string): number => Array.from(texto).length;

/**
 * Invisíveis que não servem num perfil e enganam quem lê: largura zero
 * (U+200B–U+200D, U+2060, U+FEFF) e os controles de direção (U+202A–U+202E,
 * U+2066–U+2069), que invertem o texto na tela ("trojan source").
 */
const INVISIVEIS = /[​-‍⁠﻿‪-‮⁦-⁩]/g;
/** Controles, menos a quebra de linha. */
const CONTROLES = /[\u0000-\u0009\u000B-\u001F\u007F]/g;

function limparLinha(texto: string): string {
  return texto.normalize('NFC').replace(INVISIVEIS, '').replace(CONTROLES, ' ').replace(/[  ]+/g, ' ').trim();
}

export type ProblemaDoSobre = 'longo_demais' | 'tem_contato';

/** E-mail, telefone (8 dígitos ou mais), "@usuario" ou link: contato pessoal (R11.6). */
function temContato(texto: string): boolean {
  if (/[\w.+-]+@[\w-]+\.[\w.-]+/.test(texto)) return true;
  if (/(^|\s)@[\w.]{3,}/.test(texto)) return true;
  for (const trecho of texto.match(/\+?\d[\d\s().-]{6,}\d/g) ?? []) {
    if (trecho.replace(/\D/g, '').length >= 8) return true;
  }
  return temLink(texto);
}

/**
 * "Sobre mim": limpa espaço repetido, linha em branco demais (no máximo uma
 * entre parágrafos) e caractere invisível; aponta o que passa do limite e o
 * contato pessoal. A tela mostra o contador ("112 de 280") com o texto limpo.
 */
export function limparSobre(texto: string): { texto: string; problemas: ProblemaDoSobre[] } {
  const linhas = texto.replace(/\r\n?/g, '\n').split('\n').map(limparLinha);
  const limpo = linhas.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  const problemas: ProblemaDoSobre[] = [];
  if (tamanho(limpo) > LIMITE_DO_SOBRE) problemas.push('longo_demais');
  if (temContato(limpo)) problemas.push('tem_contato');
  return { texto: limpo, problemas };
}

// ---------------------------------------------------------------------------
// CREF
// ---------------------------------------------------------------------------

/** As 27 unidades da federação. */
const UFS = new Set([
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB',
  'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
]);

/**
 * Lê o CREF no formato do CONFEF: número (até 6 dígitos), categoria `G`
 * (graduado) ou `P` (provisionado) e UF — `012345-G/SP`. Aceita o prefixo
 * "CREF", minúscula e espaço no lugar do hífen e da barra. Devolve a forma
 * canônica, com o número COMO FOI ESCRITO (sem completar zeros, R11.2), ou
 * `null` se não for um CREF. Não confere se o registro existe ([decidir]).
 */
export function lerCref(texto: string): string | null {
  if (typeof texto !== 'string') return null;
  const achou = /^(?:CREF\s*:?\s*)?(\d{1,6})\s*[-\s]\s*([GP])\s*[/\s]\s*([A-Z]{2})$/.exec(texto.trim().toUpperCase());
  if (!achou || !UFS.has(achou[3])) return null;
  return `${achou[1]}-${achou[2]}/${achou[3]}`;
}

// ---------------------------------------------------------------------------
// Quem pode ter, ver e editar
// ---------------------------------------------------------------------------

/** R11.1: só vínculo de equipe ATIVO tem perfil. */
export function podeTerPerfil(vinculo: Vinculo): boolean {
  return vinculo.estado === 'ativo' && PAPEIS_COM_PERFIL.includes(vinculo.papel);
}

function temVinculoAtivo(quem: QuemVe, academiaId: Id, papeis: readonly PapelNaAcademia[]): boolean {
  return quem.vinculos.some(
    (v) => v.usuarioId === quem.usuarioId && v.academiaId === academiaId && v.estado === 'ativo' && papeis.includes(v.papel),
  );
}

/** R11.4: chave ligada, não escondido pelo dono e o vínculo de equipe ativo. */
export function perfilVisivelAosAlunos(perfil: PerfilProfissional, vinculoDoPerfil: Vinculo): boolean {
  exigirVinculoDoPerfil(perfil, vinculoDoPerfil);
  return perfil.visivelAosAlunos && !perfil.ocultadoPeloDono && vinculoDoPerfil.estado === 'ativo';
}

/**
 * Espelho da RLS de `perfis_profissionais` (modelo, seção 23):
 * - o próprio profissional vê sempre o seu;
 * - o dono com vínculo ativo na academia vê todos, com o estado;
 * - aluno ou equipe com vínculo ATIVO na mesma academia vê só o perfil visível (R11.4, R11.5);
 * - ninguém mais (aluno pendente, sem academia, de outra academia).
 */
export function podeVerPerfil(perfil: PerfilProfissional, quem: QuemVe, vinculoDoPerfil: Vinculo): boolean {
  exigirVinculoDoPerfil(perfil, vinculoDoPerfil);
  if (quem.usuarioId === perfil.usuarioId) return true;
  if (temVinculoAtivo(quem, perfil.academiaId, ['dono'])) return true;
  return (
    temVinculoAtivo(quem, perfil.academiaId, ['aluno', 'recepcao', 'instrutor', 'personal']) &&
    perfilVisivelAosAlunos(perfil, vinculoDoPerfil)
  );
}

function exigirVinculoDoPerfil(perfil: PerfilProfissional, vinculo: Vinculo): void {
  if (vinculo.id !== perfil.vinculoId || vinculo.usuarioId !== perfil.usuarioId || vinculo.academiaId !== perfil.academiaId) {
    throw new Error(`o vínculo "${vinculo.id}" não é o do perfil "${perfil.id}"`);
  }
}

// ---------------------------------------------------------------------------
// Criar e editar
// ---------------------------------------------------------------------------

/** O que o profissional muda. `null` apaga um campo opcional. */
export interface MudancasNoPerfil {
  nomeExibicao?: string;
  fotoUrl?: string | null;
  formacao?: string;
  cref?: string | null;
  especialidades?: Especialidade[];
  especialidadeOutra?: string | null;
  sobre?: string;
  turnos?: TurnoNaAcademia[];
  visivelAosAlunos?: boolean;
  /** Luta (R16.14): as modalidades que o professor dá. */
  modalidadeIds?: Id[];
  /** Luta (R16.14): a graduação dele em cada modalidade, informada por ele ("Faixa preta, 2º grau"). */
  graduacaoInformada?: { modalidadeId: Id; texto: string }[];
  /** Só o dono. */
  ocultadoPeloDono?: boolean;
  /** Ninguém pelo app: só o servidor, se a conferência existir ([decidir]). */
  crefConferido?: boolean;
}

const CAMPOS_DO_PROFISSIONAL: readonly (keyof MudancasNoPerfil)[] = [
  'nomeExibicao', 'fotoUrl', 'formacao', 'cref', 'especialidades', 'especialidadeOutra', 'sobre', 'turnos', 'visivelAosAlunos', 'modalidadeIds', 'graduacaoInformada',
];

/** R16.14: o texto da graduação do professor ("Faixa preta, 2º grau"). */
export const LIMITE_DA_GRADUACAO_INFORMADA = 40;

/** Perfil novo (F14.1): invisível, não escondido, CREF não conferido. */
export function criarPerfilProfissional(
  vinculo: Vinculo,
  dados: { id: Id; nomeExibicao: string; formacao: string },
  agora: InstanteISO,
): PerfilProfissional {
  if (!podeTerPerfil(vinculo)) {
    throw new Error(`só vínculo de equipe ativo tem perfil profissional (R11.1); veio ${vinculo.papel} ${vinculo.estado}`);
  }
  const base: PerfilProfissional = {
    id: dados.id,
    vinculoId: vinculo.id,
    usuarioId: vinculo.usuarioId,
    academiaId: vinculo.academiaId,
    nomeExibicao: '',
    formacao: '',
    crefConferido: false,
    especialidades: [],
    sobre: '',
    turnos: [],
    visivelAosAlunos: false,
    ocultadoPeloDono: false,
    atualizadoEm: agora,
  };
  return aplicar(base, { nomeExibicao: dados.nomeExibicao, formacao: dados.formacao }, agora);
}

/**
 * Aplica as mudanças de quem está editando, com as regras de quem escreve o
 * quê (a RLS e o gatilho do banco fazem o mesmo, seção 23 do modelo):
 * - o profissional edita o seu perfil, menos `ocultadoPeloDono` e `crefConferido`;
 *   com o perfil escondido, a chave dele fica travada (R11.7);
 * - o dono (vínculo ativo na academia) só muda `ocultadoPeloDono`;
 * - ninguém marca `crefConferido` pelo app; trocar o CREF desfaz a conferência.
 * Devolve um perfil NOVO; o recebido não muda. Lança se algo não vale.
 */
export function editarPerfilProfissional(
  perfil: PerfilProfissional,
  mudancas: MudancasNoPerfil,
  quem: QuemVe,
  agora: InstanteISO,
): PerfilProfissional {
  const campos = Object.keys(mudancas) as (keyof MudancasNoPerfil)[];
  if (campos.includes('crefConferido')) {
    throw new Error('crefConferido só muda pelo servidor, na conferência do CREF ([decidir])');
  }
  const ehDono = quem.usuarioId !== perfil.usuarioId && temVinculoAtivo(quem, perfil.academiaId, ['dono']);
  const ehOProprio = quem.usuarioId === perfil.usuarioId;
  if (!ehOProprio && !ehDono) {
    throw new Error(`"${quem.usuarioId}" não pode editar o perfil de "${perfil.usuarioId}"`);
  }
  if (ehDono) {
    const outros = campos.filter((c) => c !== 'ocultadoPeloDono');
    if (outros.length > 0) throw new Error(`o dono só esconde ou mostra o perfil; não muda ${outros.join(', ')}`);
    if (typeof mudancas.ocultadoPeloDono !== 'boolean') throw new RangeError('ocultadoPeloDono precisa ser verdadeiro ou falso');
    return { ...perfil, ocultadoPeloDono: mudancas.ocultadoPeloDono, atualizadoEm: agora };
  }
  const proibidos = campos.filter((c) => !CAMPOS_DO_PROFISSIONAL.includes(c));
  if (proibidos.length > 0) throw new Error(`o profissional não muda ${proibidos.join(', ')} (só o dono)`);
  if (perfil.ocultadoPeloDono && campos.includes('visivelAosAlunos')) {
    throw new Error('perfil escondido pelo dono: a chave fica travada até ele mostrar de novo (R11.7)');
  }
  return aplicar(perfil, mudancas, agora);
}

function aplicar(perfil: PerfilProfissional, m: MudancasNoPerfil, agora: InstanteISO): PerfilProfissional {
  const novo: PerfilProfissional = { ...perfil, especialidades: [...perfil.especialidades], turnos: perfil.turnos.map((t) => ({ ...t })) };

  if (m.nomeExibicao !== undefined) novo.nomeExibicao = textoCurto(m.nomeExibicao, 'nomeExibicao', LIMITE_DO_NOME_DE_EXIBICAO);
  if (m.formacao !== undefined) novo.formacao = textoCurto(m.formacao, 'formacao', LIMITE_DA_FORMACAO);

  if (m.fotoUrl === null) delete novo.fotoUrl;
  else if (m.fotoUrl !== undefined) novo.fotoUrl = urlDaFoto(m.fotoUrl);

  if (m.cref === null || (typeof m.cref === 'string' && m.cref.trim() === '')) {
    delete novo.cref;
    novo.crefConferido = false;
  } else if (m.cref !== undefined) {
    const cref = lerCref(m.cref);
    if (cref === null) throw new RangeError(`CREF fora do formato do CONFEF (ex.: 012345-G/SP): "${m.cref}"`);
    if (cref !== perfil.cref) novo.crefConferido = false;
    novo.cref = cref;
  }

  if (m.especialidades !== undefined) {
    const vistas = new Set<Especialidade>();
    for (const e of m.especialidades) {
      if (!ESPECIALIDADES.includes(e)) throw new RangeError(`especialidade fora da lista (R11.3): ${String(e)}`);
      if (vistas.has(e)) throw new RangeError(`especialidade repetida: ${e}`);
      vistas.add(e);
    }
    novo.especialidades = ESPECIALIDADES.filter((e) => vistas.has(e));
  }
  if (m.especialidadeOutra === null) delete novo.especialidadeOutra;
  else if (m.especialidadeOutra !== undefined) {
    novo.especialidadeOutra = textoCurto(m.especialidadeOutra, 'especialidadeOutra', LIMITE_DA_ESPECIALIDADE_OUTRA);
  }
  if (novo.especialidades.includes('outra') && !novo.especialidadeOutra) {
    throw new RangeError('especialidadeOutra é obrigatória quando a especialidade "outra" está marcada');
  }
  if (!novo.especialidades.includes('outra')) delete novo.especialidadeOutra;

  if (m.sobre !== undefined) {
    const { texto, problemas } = limparSobre(m.sobre);
    if (problemas.includes('longo_demais')) throw new RangeError(`sobre passa de ${LIMITE_DO_SOBRE} caracteres`);
    if (problemas.includes('tem_contato')) throw new RangeError('sobre não pode ter contato pessoal: telefone, e-mail, @ ou link (R11.6)');
    novo.sobre = texto;
  }

  if (m.turnos !== undefined) novo.turnos = turnosValidos(m.turnos);

  if (m.modalidadeIds !== undefined) novo.modalidadeIds = [...new Set(m.modalidadeIds)];
  if (m.graduacaoInformada !== undefined) {
    novo.graduacaoInformada = m.graduacaoInformada
      .filter((g) => typeof g.texto === 'string' && g.texto.trim() !== '')
      .map((g) => ({ modalidadeId: g.modalidadeId, texto: textoCurto(g.texto, 'graduacaoInformada', LIMITE_DA_GRADUACAO_INFORMADA) }));
  }

  if (m.visivelAosAlunos !== undefined) {
    if (typeof m.visivelAosAlunos !== 'boolean') throw new RangeError('visivelAosAlunos precisa ser verdadeiro ou falso');
    if (m.visivelAosAlunos && !perfil.visivelAosAlunos) novo.visivelDesde = agora;
    novo.visivelAosAlunos = m.visivelAosAlunos;
  }

  novo.atualizadoEm = agora;
  return novo;
}

function textoCurto(texto: string, campo: string, limite: number): string {
  const limpo = typeof texto === 'string' ? limparLinha(texto) : '';
  if (limpo === '') throw new RangeError(`${campo} não pode ficar vazio`);
  if (tamanho(limpo) > limite) throw new RangeError(`${campo} passa de ${limite} caracteres`);
  return limpo;
}

/** Só `https://` (a foto vem do Storage do Supabase): nada de `javascript:`, `data:` nem `http://`. */
function urlDaFoto(url: string): string {
  let lida: URL;
  try {
    lida = new URL(url);
  } catch {
    throw new RangeError(`fotoUrl não é um endereço: "${url}"`);
  }
  if (lida.protocol !== 'https:') throw new RangeError(`fotoUrl precisa ser https; veio ${lida.protocol}`);
  return lida.toString();
}

function turnosValidos(turnos: TurnoNaAcademia[]): TurnoNaAcademia[] {
  const vistos = new Set<string>();
  for (const t of turnos) {
    if (!DIAS_DA_SEMANA.includes(t.dia) || !PERIODOS_DO_DIA.includes(t.periodo)) {
      throw new RangeError(`turno inválido: ${JSON.stringify(t)}`);
    }
    const chave = `${t.dia}:${t.periodo}`;
    if (vistos.has(chave)) throw new RangeError(`turno repetido: ${chave}`);
    vistos.add(chave);
  }
  // Ordem fixa da grade: segunda a domingo, manhã, tarde, noite.
  const ordemDoDia = (d: TurnoNaAcademia['dia']) => (DIAS_DA_SEMANA.indexOf(d) + 6) % 7;
  return turnos
    .map((t) => ({ dia: t.dia, periodo: t.periodo }))
    .sort((a, b) => ordemDoDia(a.dia) - ordemDoDia(b.dia) || PERIODOS_DO_DIA.indexOf(a.periodo) - PERIODOS_DO_DIA.indexOf(b.periodo));
}

// ---------------------------------------------------------------------------
// A lista da Equipe (F14.2)
// ---------------------------------------------------------------------------

const comparar = new Intl.Collator('pt-BR', { sensitivity: 'base' }).compare;

/**
 * R11.9 e R11.13: os perfis visíveis em ordem alfabética do nome de exibição
 * (acento e maiúscula não mudam a ordem), filtrados por especialidade. Quem
 * chama passa os perfis que a RLS devolveu; os invisíveis ou escondidos que
 * vierem por engano saem daqui também. Devolve uma lista nova.
 */
export function equipeParaMostrar(
  perfis: readonly PerfilProfissional[],
  filtro: { especialidade?: Especialidade } = {},
): PerfilProfissional[] {
  return perfis
    .filter((p) => p.visivelAosAlunos && !p.ocultadoPeloDono)
    .filter((p) => filtro.especialidade === undefined || p.especialidades.includes(filtro.especialidade))
    .sort((a, b) => comparar(a.nomeExibicao, b.nomeExibicao) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

/** R11.13: os chips do filtro — só as especialidades que alguém marcou, na ordem da lista fixa. */
export function especialidadesDaEquipe(perfis: readonly PerfilProfissional[]): Especialidade[] {
  const marcadas = new Set(equipeParaMostrar(perfis).flatMap((p) => p.especialidades));
  return ESPECIALIDADES.filter((e) => marcadas.has(e));
}
