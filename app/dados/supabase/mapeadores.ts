/**
 * A tradução na BORDA entre o app e o Supabase (pedidos do AU, revisão AN;
 * `03-arquitetura/06-INTEGRACAO.md`, seção 5).
 *
 * O domínio do app continua com os ids de texto (`muay-thai`,
 * `muay-thai-noite-1`, `muay-thai-noite-1-seg-20`): no banco eles são a
 * `chave`, e o id é o uuid fixo do `seed.sql`. Trocar os ids do domínio
 * inteiro mexeria em centenas de testes; traduzir aqui, só na ida e na volta,
 * deixa o resto do app igual. Id que já é uuid (dado real) passa como está.
 *
 * A presença vai no formato da função `registrar_presencas`: SEM o id
 * `aula|aluno` (não é uuid; o servidor junta pelo par aula + pessoa), com
 * `pessoa_id`, `horario_id` + `data`, e sem o que o servidor calcula.
 */
import { gradeDaRacaFight } from '../../dominio/turmas/grade-raca-fight.ts';
import type { ErroDeEnvio } from '../../dominio/sincronizacao.ts';
import type { Presenca } from '../../dominio/presenca/presenca.ts';
import type { Id } from '../../dominio/tipos.ts';

export type TipoDeId = 'academia' | 'modalidade' | 'turma' | 'horario';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const doSeed = (prefixo: string, final: string) => `${prefixo}0000000-0000-4000-8000-${final.padStart(12, '0')}`;

function montarTabela(): Record<TipoDeId, Map<string, string>> {
  const t: Record<TipoDeId, Map<string, string>> = { academia: new Map(), modalidade: new Map(), turma: new Map(), horario: new Map() };
  t.academia.set('raca-fight', doSeed('a', '1'));
  t.academia.set('raca-fight-gravatai', doSeed('a', '1'));
  ['muay-thai', 'boxe', 'jiu-jitsu', 'luta-livre', 'mma'].forEach((m, i) => t.modalidade.set(m, doSeed('b', String(i + 1))));
  // a ordem de `grade-raca-fight.ts` é a do seed (turma NN, horário h → …NN0h)
  const grade = gradeDaRacaFight({ academiaId: 'raca-fight', professores: { muayThai: null, boxe: null, jiuJitsu: null, mma: null, muayThaiKids: null, jiuJitsuKids: null }, duracaoDaAulaMinutos: 60 });
  grade.forEach((turma, i) => {
    const nn = String(i + 1).padStart(2, '0');
    t.turma.set(turma.id, doSeed('c', nn));
    turma.horarios.forEach((h, j) => t.horario.set(h.id, doSeed('d', `${nn}0${j + 1}`)));
  });
  return t;
}

const IDA = montarTabela();
const VOLTA = Object.fromEntries(Object.entries(IDA).map(([tipo, m]) => [tipo, new Map([...m].map(([k, v]) => [v, k]))])) as Record<TipoDeId, Map<string, string>>;

/** O id que o banco usa: o uuid do seed para a chave conhecida; o uuid real passa igual. */
export function idNoServidor(tipo: TipoDeId, id: Id): string {
  if (UUID.test(id)) return id;
  const u = IDA[tipo].get(id);
  if (!u) throw new RangeError(`sem uuid para ${tipo} "${id}": dado novo precisa nascer com crypto.randomUUID()`);
  return u;
}

/** A volta: o uuid do seed vira a chave de texto do app; o resto passa igual. */
export function chaveDoServidor(tipo: TipoDeId, id: string): Id {
  return VOLTA[tipo].get(id) ?? id;
}

/** `horario@AAAA-MM-DD` → as duas colunas de verdade do banco. */
export function horarioEDataDaAula(aulaId: Id): { horario_id: string; data: string } {
  const m = /^(.+)@(\d{4}-\d{2}-\d{2})$/.exec(aulaId);
  if (!m) throw new RangeError(`id de aula fora do formato horario@data: ${aulaId}`);
  return { horario_id: idNoServidor('horario', m[1]!), data: m[2]! };
}

export interface PresencaNoServidor {
  horario_id: string;
  data: string;
  pessoa_id: string;
  modalidade_id: string;
  origem: Presenca['origem'];
  estado: Presenca['estado'];
  motivo_da_retirada?: NonNullable<Presenca['motivoDaRetirada']>;
  registrada_em: string;
  atualizada_em: string;
  experimental_id?: string;
}

/** Um item de `rpc('registrar_presencas', { p_presencas: [...] })`. */
export function presencaParaOServidor(p: Presenca): PresencaNoServidor {
  return {
    ...horarioEDataDaAula(p.aulaId),
    // a ficha do app chama de alunoId o que no banco é a PESSOA (minhas_fichas)
    pessoa_id: p.alunoId,
    modalidade_id: idNoServidor('modalidade', p.modalidadeId),
    origem: p.origem,
    estado: p.estado,
    ...(p.motivoDaRetirada ? { motivo_da_retirada: p.motivoDaRetirada } : {}),
    registrada_em: p.registradaEm,
    atualizada_em: p.atualizadaEm,
    ...(p.experimentalId ? { experimental_id: p.experimentalId } : {}),
  };
}

/** As palavras-código que as funções do banco devolvem para regra (não para rede). */
export const CODIGOS_DE_REGRA_DO_SERVIDOR = ['fora_da_janela', 'aula_cancelada', 'sem_a_modalidade', 'so_atletas', 'so_kids', 'fora_do_prazo', 'aula_futura', 'sem_permissao'] as const;

/** O erro é de regra (o item sai da fila marcado como falhou, sem repetir)? */
export function ehErroDeRegraDoServidor(erro: ErroDeEnvio): boolean {
  const texto = `${erro.mensagem ?? ''} ${erro.detalhe ?? ''}`;
  const palavras = new Set(texto.split(/[^a-z_]+/));
  return CODIGOS_DE_REGRA_DO_SERVIDOR.some((c) => palavras.has(c));
}
