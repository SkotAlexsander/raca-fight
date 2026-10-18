/**
 * Datas como texto (`AAAA-MM-DD`) e competência (`AAAA-MM`). Toda conta é em
 * UTC sobre o texto: nada aqui lê o relógio nem o fuso do aparelho. O "hoje"
 * entra sempre como parâmetro (teste com TZ=Asia/Tokyo prova).
 *
 * Adaptado de `Valores/nucleo/dominio/datas.ts`. Diferença: a leitura de data
 * da planilha é estrita (sem "26/10" sem ano, que no Valores assume o ano
 * corrente) e aceita o número de série do Excel, que é como uma célula de
 * data chega de um XLSX lido sem formatação.
 */

import type { DataISO } from '../tipos.ts';
import type { Competencia, Periodo } from './tipos.ts';

const MS_DIA = 86_400_000;
/** O dia zero do Excel no Windows (por causa do bug de 1900, é 30/12/1899). */
const EXCEL_DIA_ZERO = Date.UTC(1899, 11, 30);

const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

function paraMs(iso: DataISO): number {
  const [a, m, d] = iso.split('-').map(Number);
  return Date.UTC(a, m - 1, d);
}

function deMs(ms: number): DataISO {
  const d = new Date(ms);
  return `${String(d.getUTCFullYear()).padStart(4, '0')}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

/** Verdadeiro se é `AAAA-MM-DD` e a data existe. */
export function ehDataISO(t: unknown): t is DataISO {
  return typeof t === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(t) && deMs(paraMs(t)) === t;
}

export function ehCompetencia(t: unknown): t is Competencia {
  return typeof t === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(t);
}

export function somarDias(iso: DataISO, dias: number): DataISO {
  return deMs(paraMs(iso) + dias * MS_DIA);
}

/** Dias de `de` até `ate` (negativo se `ate` vem antes). */
export function diasEntre(de: DataISO, ate: DataISO): number {
  return Math.round((paraMs(ate) - paraMs(de)) / MS_DIA);
}

export function competenciaDe(iso: DataISO): Competencia {
  return iso.slice(0, 7);
}

export function somarMeses(comp: Competencia, n: number): Competencia {
  const [a, m] = comp.split('-').map(Number);
  const total = a * 12 + (m - 1) + n;
  return `${Math.floor(total / 12)}-${String((total % 12 + 12) % 12 + 1).padStart(2, '0')}`;
}

/** Meses de `de` até `ate` (2026-10 → 2027-01 = 3). */
export function mesesEntre(de: Competencia, ate: Competencia): number {
  const [a1, m1] = de.split('-').map(Number);
  const [a2, m2] = ate.split('-').map(Number);
  return (a2 - a1) * 12 + (m2 - m1);
}

export function diasNoMes(comp: Competencia): number {
  const [a, m] = comp.split('-').map(Number);
  return new Date(Date.UTC(a, m, 0)).getUTCDate();
}

/** Dia N da competência, encurtando quando o mês não tem o dia (31 → 30, 28/29). */
export function dataNaCompetencia(comp: Competencia, dia: number): DataISO {
  return `${comp}-${String(Math.min(Math.max(1, dia), diasNoMes(comp))).padStart(2, '0')}`;
}

export function periodoDaCompetencia(comp: Competencia): Periodo {
  return { de: `${comp}-01`, ate: dataNaCompetencia(comp, 31) };
}

export function periodoDoTrimestre(iso: DataISO): Periodo {
  const ano = iso.slice(0, 4);
  const mes = Number(iso.slice(5, 7));
  const primeiro = Math.floor((mes - 1) / 3) * 3 + 1;
  const ultimo = `${ano}-${String(primeiro + 2).padStart(2, '0')}`;
  return { de: `${ano}-${String(primeiro).padStart(2, '0')}-01`, ate: dataNaCompetencia(ultimo, 31) };
}

export function periodoDoAno(iso: DataISO): Periodo {
  const ano = iso.slice(0, 4);
  return { de: `${ano}-01-01`, ate: `${ano}-12-31` };
}

export function dentroDoPeriodo(iso: DataISO, p: Periodo): boolean {
  return iso >= p.de && iso <= p.ate;
}

/** As N competências que terminam em `ate`, da mais antiga para a mais nova. */
export function ultimasCompetencias(ate: Competencia, n: number): Competencia[] {
  return Array.from({ length: n }, (_, i) => somarMeses(ate, i - n + 1));
}

/** "2026-10" → "outubro de 2026". */
export function nomeDaCompetencia(comp: Competencia, curto = false): string {
  const nome = MESES[Number(comp.slice(5, 7)) - 1];
  return curto ? `${nome.slice(0, 3)}/${comp.slice(2, 4)}` : `${nome} de ${comp.slice(0, 4)}`;
}

/** "2026-10" → "outubro/2026" (a descrição da mensalidade e o CSV; nunca "2026-10"). */
export function nomeDoMesComAno(comp: Competencia): string {
  return `${MESES[Number(comp.slice(5, 7)) - 1]}/${comp.slice(0, 4)}`;
}

/**
 * Do dia 1 do mês até `hoje`, se `hoje` está nele; o mês inteiro, se já
 * passou; só o dia 1, se ainda não começou. É o "até hoje" do painel.
 */
export function periodoAteODia(comp: Competencia, hoje: DataISO): Periodo {
  const p = periodoDaCompetencia(comp);
  if (hoje >= p.ate) return p;
  if (hoje < p.de) return { de: p.de, ate: p.de };
  return { de: p.de, ate: hoje };
}

/**
 * O mesmo trecho no mês anterior (AR, 15/10): 1 a 15/10 → 1 a 15/09. Se o
 * período vai até o último dia do mês, o par é o mês anterior inteiro
 * (31/03 → 28/02; 30/09 → 31/08). O dia que não existe encurta.
 */
export function mesmoPeriodoDoMesAnterior(p: Periodo): Periodo {
  const comp = somarMeses(competenciaDe(p.de), -1);
  const fimDoMes = p.ate === dataNaCompetencia(competenciaDe(p.ate), 31);
  return {
    de: dataNaCompetencia(comp, Number(p.de.slice(8))),
    ate: fimDoMes ? dataNaCompetencia(comp, 31) : dataNaCompetencia(comp, Number(p.ate.slice(8))),
  };
}

/** "05/10/2026" (a data como o Brasil lê). */
export function formatarDataBR(iso: DataISO): string {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
}

/**
 * Célula de data de planilha → ISO. Aceita `dd/mm/aaaa`, `d/m/aa`,
 * `dd-mm-aaaa`, `dd.mm.aaaa`, `AAAA-MM-DD` e o número de série do Excel
 * (entre 1/1/1955 e 31/12/2099, para não confundir com valor). `null` se
 * não for data ou não existir.
 */
export function lerDataDaPlanilha(valor: string | number | null | undefined): DataISO | null {
  if (valor == null) return null;
  const serie = typeof valor === 'number' ? valor : /^\d{5}(\.\d+)?$/.test(valor.trim()) ? Number(valor.trim()) : null;
  if (serie != null) {
    if (!Number.isFinite(serie) || serie < 20090 || serie > 73050) return null;
    return deMs(EXCEL_DIA_ZERO + Math.floor(serie) * MS_DIA);
  }
  let t = String(valor).trim();
  // a hora que o extrato e o sistema de cartão põem depois da data sai ("05/10/2026 14:30", "2026-10-05T14:30:00")
  const comHora = /^(\S+?)(?:[ T]|\s+)([01]?\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?(?:Z|[+-]\d\d:?\d\d)?$/.exec(t);
  if (comHora) t = comHora[1]!;
  else if (/\d:\d/.test(t)) return null;
  if (ehDataISO(t)) return t;
  const m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2}|\d{4})$/.exec(t);
  if (!m) return null;
  let ano = Number(m[3]);
  if (m[3].length === 2) ano += 2000;
  const iso = `${ano}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  return ehDataISO(iso) ? iso : null;
}
