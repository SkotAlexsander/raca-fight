/**
 * Textos e formatos de TELA das duas visões (aluno, academia e entrada) e dos
 * componentes: nomes dos objetivos, especialidades, papéis e turnos; datas;
 * peso e tempo. (A carga, a série e o grupo muscular saíram com a musculação.) Só apresentação: a regra mora em
 * `dominio/` e a gravação em `dados/`.
 *
 * Um arquivo só (agente AA, P11): juntou `telas/aluno/comum/formatos.ts`
 * (agente Y) e `telas/academia/formatos.ts` (agente Z), que repetiam os nomes
 * dos objetivos, níveis, especialidades e turnos. Os nomes dos objetivos
 * seguem [decidir] (P00): são os da proposta da marca, como no mockup.
 */
import type { ChaveDoObjetivo, DataISO, Especialidade, PapelNaAcademia, PeriodoDoDia, DiaDaSemana } from '@/dominio/tipos';
import { formatarNumero, gramasParaQuilos, lerNumero, quilosParaGramas } from '@/dominio/unidades';
import { formatarCronometro } from '@/dominio/cronometro';

/** R14.10: os objetivos de luta, a PROPOSTA do AJ ([decidir] L9), os mesmos da entrada aprovada (`entrada.html`). */
export const NOME_DO_OBJETIVO: Record<ChaveDoObjetivo, string> = {
  aprender_a_lutar: 'Aprender a lutar',
  condicionamento: 'Condicionamento',
  defesa_pessoal: 'Defesa pessoal',
  competir: 'Competir',
  perder_peso: 'Perder peso',
  saude_e_disciplina: 'Saúde e disciplina',
};

export const ORDEM_DOS_OBJETIVOS: ChaveDoObjetivo[] = ['aprender_a_lutar', 'condicionamento', 'defesa_pessoal', 'competir', 'perder_peso', 'saude_e_disciplina'];

export const NOME_DA_ESPECIALIDADE: Record<Especialidade, string> = {
  musculacao: 'Musculação',
  funcional: 'Funcional',
  hiit: 'HIIT',
  reabilitacao: 'Reabilitação',
  idosos: 'Idosos',
  iniciantes: 'Iniciantes',
  outra: 'Outra',
};

export const NOME_DO_PERIODO: Record<PeriodoDoDia, string> = { manha: 'Manhã', tarde: 'Tarde', noite: 'Noite' };

/** Os rótulos de "Entrar como…" e de "Trocar de visão" (minúsculos). */
export const NOME_DO_PAPEL: Readonly<Record<PapelNaAcademia, string>> = {
  aluno: 'aluno',
  recepcao: 'recepção',
  instrutor: 'instrutor',
  personal: 'personal',
  dono: 'dono',
};

/** O papel como a equipe lê ("Professor · Raça Fight"). */
export const NOME_DO_PAPEL_NA_EQUIPE: Readonly<Record<PapelNaAcademia, string>> = {
  aluno: 'Aluno',
  recepcao: 'Recepção',
  instrutor: 'Instrutor',
  personal: 'Personal',
  dono: 'Dono',
};

/** Segunda primeiro, como o mockup ("S T Q Q S S D"). */
export const SEMANA_DE_SEGUNDA: DiaDaSemana[] = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];
export const LETRA_DO_DIA: Record<DiaDaSemana, string> = { seg: 'S', ter: 'T', qua: 'Q', qui: 'Q', sex: 'S', sab: 'S', dom: 'D' };
export const NOME_DO_DIA: Record<DiaDaSemana, string> = { seg: 'Segunda', ter: 'Terça', qua: 'Quarta', qui: 'Quinta', sex: 'Sexta', sab: 'Sábado', dom: 'Domingo' };
export const NOME_CURTO_DO_DIA: Record<DiaDaSemana, string> = { seg: 'Seg', ter: 'Ter', qua: 'Qua', qui: 'Qui', sex: 'Sex', sab: 'Sáb', dom: 'Dom' };

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const MESES_CURTOS = ['jan.', 'fev.', 'mar.', 'abr.', 'maio', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.'];
const DIAS_JS: DiaDaSemana[] = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];

/** Data do calendário local, `AAAA-MM-DD` (o fuso do aparelho, R1.17). */
export function dataLocal(d: Date = new Date()): DataISO {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** `AAAA-MM-DD` → Date ao meio-dia local (sem tropeçar no horário de verão). */
export function lerData(data: DataISO): Date {
  const [a, m, d] = data.split('-').map(Number);
  return new Date(a, m - 1, d, 12);
}

export function somarDias(data: DataISO, dias: number): DataISO {
  const d = lerData(data);
  d.setDate(d.getDate() + dias);
  return dataLocal(d);
}

/** Dias inteiros de `de` até `ate` (datas do calendário, sem fuso). */
export function diasEntre(de: DataISO, ate: DataISO): number {
  const a = Date.UTC(+de.slice(0, 4), +de.slice(5, 7) - 1, +de.slice(8, 10));
  const b = Date.UTC(+ate.slice(0, 4), +ate.slice(5, 7) - 1, +ate.slice(8, 10));
  return Math.round((b - a) / 86400000);
}

/** "hoje", "ontem", "há 3 dias" (por data; `haQuanto` é por instante). */
export function haQuantoTempo(data: DataISO | undefined, hoje: DataISO): string {
  if (!data) return 'nunca';
  const d = diasEntre(data, hoje);
  if (d <= 0) return 'hoje';
  if (d === 1) return 'ontem';
  return `há ${d} dias`;
}

export function diaDaSemana(data: DataISO): DiaDaSemana {
  return DIAS_JS[lerData(data).getDay()];
}

/** A segunda-feira da semana da data. */
export function segundaDaSemana(data: DataISO): DataISO {
  const d = lerData(data);
  const recuo = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - recuo);
  return dataLocal(d);
}

/** "Quarta, 14 de out." (a saudação do Início). */
export function dataDaSaudacao(data: DataISO): string {
  const d = lerData(data);
  return `${NOME_DO_DIA[DIAS_JS[d.getDay()]]}, ${d.getDate()} de ${MESES_CURTOS[d.getMonth()]}`;
}

/** "20 de jul." */
export function dataCurta(data: DataISO): string {
  const d = lerData(data);
  return `${d.getDate()} de ${MESES_CURTOS[d.getMonth()]}`;
}

/** "14/10" (eixo dos gráficos). */
export function diaMes(data: DataISO): string {
  const d = lerData(data);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

export function nomeDoMes(data: DataISO): string {
  const nome = MESES[lerData(data).getMonth()];
  return nome.charAt(0).toLocaleUpperCase('pt-BR') + nome.slice(1);
}

/** "há 2 h", "há 5 min", "ontem" (aviso da academia). */
export function haQuanto(instante: string, agora = Date.now()): string {
  const ms = agora - Date.parse(instante);
  const min = Math.max(0, Math.round(ms / 60000));
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? 'ontem' : `há ${d} dias`;
}

// --- carga, repetições, tempo -------------------------------------------------

/** 22500 → "22,5" (sem a unidade). */
export const kg = (g: number) => formatarNumero(gramasParaQuilos(g), 1);
/** "22,5" → 22500; null se não entendeu. */
export const lerKg = (t: string) => {
  const n = lerNumero(t);
  if (Number.isNaN(n) || n < 0) return null;
  try {
    return quilosParaGramas(Math.round(n * 10) / 10);
  } catch {
    return null;
  }
};
export const lerInteiro = (t: string) => {
  const n = lerNumero(t);
  return Number.isInteger(n) ? n : null;
};
/** Segundos como "1:30" (o mesmo jeito do cronômetro). */
export const mmss = (s: number) => formatarCronometro(Math.max(0, Math.round(s)));
/** "1:30" ou "90" → segundos. */
export const lerMmss = (t: string): number | null => {
  const limpo = t.trim();
  const m = /^(\d{1,3}):([0-5]\d)$/.exec(limpo);
  if (m) return Number(m[1]) * 60 + Number(m[2]);
  const n = lerNumero(limpo);
  return Number.isInteger(n) && n >= 0 ? n : null;
};

/** "9:41" */
export function hora(d: Date): string {
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Primeiro nome ("Ana Souza" → "Ana"). */
export const primeiroNome = (nome: string) => nome.split(/\s+/)[0] ?? nome;

/** "1 aluno" · "2 alunos". */
export const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;
