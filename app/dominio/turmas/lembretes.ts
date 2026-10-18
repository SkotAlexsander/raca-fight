/**
 * O lembrete de AULA (R22.4), que substitui o lembrete de treino: local,
 * desligado por padrão, por turma, com a antecedência escolhida (30 min, 1 h
 * ou 2 h). Pela grade, no fuso da academia.
 *
 * - Não toca se a aula foi cancelada (o aviso do R22.2 já foi);
 * - respeita o silêncio das 22h às 7h (o lembrete que cairia ali é
 *   DESCARTADO, nunca movido, como o R10.4 manda para os locais);
 * - no máximo 3 lembretes locais por dia (R10.6);
 * - o texto não leva nome de aluno (o responsável recebe o primeiro nome do
 *   dependente, R20.4, que quem chama passa).
 */
import type { Id } from '../tipos.ts';
import { dentroDoSilencio, LIMITE_DE_LEMBRETES_POR_DIA } from '../avisos.ts';
import { dataNoFuso, escreverHora, minutosNoFuso, somarDias } from './horario.ts';
import { aulasEntre, type AjusteDeAula, type Aula, type Turma } from './turmas.ts';

export interface LembreteDeAula {
  /** Estável, para cancelar e reagendar: `lembrete-aula:<aula>`. */
  id: string;
  aulaId: Id;
  instanteMs: number;
  titulo: string;
  texto: string;
}

export interface EntradaDosLembretes {
  turmas: readonly Turma[];
  turmaIds: readonly Id[];
  antecedenciaMinutos: number;
  agoraMs: number;
  fuso: string;
  ajustes?: readonly AjusteDeAula[];
  /** Quantos dias à frente agendar (o iPhone guarda 64 pendentes por app). */
  dias?: number;
  /** "do Pedro": quando o lembrete é do dependente. */
  deQuem?: string;
}

export function lembretesDeAula(e: EntradaDosLembretes): LembreteDeAula[] {
  const hoje = dataNoFuso(e.agoraMs, e.fuso);
  const escolhidas = e.turmas.filter((t) => e.turmaIds.includes(t.id));
  const aulas: Aula[] = aulasEntre(escolhidas, hoje, somarDias(hoje, e.dias ?? 7), e.fuso, e.ajustes ?? []);
  const porDia = new Map<string, number>();
  const saida: LembreteDeAula[] = [];
  for (const a of aulas) {
    if (a.cancelada) continue;
    const quando = a.inicioMs - e.antecedenciaMinutos * 60_000;
    if (quando <= e.agoraMs) continue;
    if (dentroDoSilencio(escreverHora(minutosNoFuso(quando, e.fuso)))) continue;
    const dia = dataNoFuso(quando, e.fuso);
    const n = porDia.get(dia) ?? 0;
    if (n >= LIMITE_DE_LEMBRETES_POR_DIA) continue;
    porDia.set(dia, n + 1);
    const turma = escolhidas.find((t) => t.id === a.turmaId)!;
    const antes = e.antecedenciaMinutos >= 60 ? `${e.antecedenciaMinutos / 60} h` : `${e.antecedenciaMinutos} min`;
    saida.push({ id: `lembrete-aula:${a.id}`, aulaId: a.id, instanteMs: quando, titulo: turma.nome, texto: `Aula${e.deQuem ? ` ${e.deQuem}` : ''} às ${a.hora}, daqui a ${antes}.` });
  }
  return saida;
}
