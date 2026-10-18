/**
 * As contas da dieta do dia (R3.6, R3.7): as refeições marcadas (gravadas pelo
 * repositório, uma por refeição e data); a refeição opcional não conta na adesão.
 */
import type { DataISO, PlanoDeDieta, Refeicao, RefeicaoRegistrada } from '@/dominio/tipos';

export function registrosDoDia(doRepositorio: readonly RefeicaoRegistrada[], locais: readonly RefeicaoRegistrada[], data: DataISO): Map<string, RefeicaoRegistrada> {
  const m = new Map<string, RefeicaoRegistrada>();
  for (const r of doRepositorio) if (r.data === data) m.set(r.refeicaoId, r);
  for (const r of locais) if (r.data === data) m.set(r.refeicaoId, r);
  return m;
}

export interface ResumoDaDieta {
  feitas: number;
  total: number;
  proxima?: Refeicao;
}

export function resumirDieta(plano: PlanoDeDieta | null | undefined, registros: Map<string, RefeicaoRegistrada>): ResumoDaDieta | null {
  if (!plano) return null;
  const contam = plano.refeicoes.filter((r) => !r.opcional);
  const feitas = contam.filter((r) => registros.get(r.id)?.estado === 'feita').length;
  const proxima = [...plano.refeicoes].sort((a, b) => a.ordem - b.ordem).find((r) => !registros.has(r.id));
  return { feitas, total: contam.length, proxima };
}

/** "lanche da tarde, 16:00" */
export function textoDaRefeicao(r: Refeicao): string {
  const nome = r.nome.charAt(0).toLocaleLowerCase('pt-BR') + r.nome.slice(1);
  return r.horarioSugerido ? `${nome}, ${r.horarioSugerido}` : nome;
}
