/**
 * Conversão e formatação de unidades.
 *
 * O armazenamento é sempre em unidade inteira (gramas, milímetros, segundos).
 * Estas funções fazem a ponte com o que a pessoa lê e digita na tela.
 * TypeScript puro: sem React, sem dependência. Testado em `unidades.test.ts`.
 */

import type { Centavos, DataISO, Gramas, InstanteISO, Milimetros, Segundos } from './tipos.ts';

// ---------------------------------------------------------------------------
// Ajudantes
// ---------------------------------------------------------------------------

/**
 * Revisão T (S1): o que o erro diz do valor recusado, SEM o valor. Peso,
 * altura e data de nascimento são dado de saúde (R6.1), e R6.2 proíbe dado de
 * saúde em mensagem de erro: o `redigir.ts` limpa campos pelo nome, não o
 * texto de um `Error`, que vai inteiro para o Sentry.
 */
function comoVeio(valor: unknown): string {
  if (typeof valor !== 'number') return `veio ${typeof valor}`;
  if (Number.isNaN(valor)) return 'veio NaN';
  if (!Number.isFinite(valor)) return 'veio infinito';
  return valor < 0 ? 'veio negativo' : 'veio fora do intervalo';
}

/** Arredonda para inteiro e garante que não vem NaN nem negativo. */
function inteiroNaoNegativo(valor: number, nome: string): number {
  if (!Number.isFinite(valor)) {
    throw new RangeError(`${nome} precisa ser um número finito; ${comoVeio(valor)}`);
  }
  if (valor < 0) {
    throw new RangeError(`${nome} não pode ser negativo`);
  }
  return Math.round(valor);
}

/** Garante que uma medida a ser mostrada é um número finito, zero ou mais. */
function exigirMedida(valor: number, nome: string): void {
  if (typeof valor !== 'number' || !Number.isFinite(valor) || valor < 0) {
    throw new RangeError(`${nome} precisa ser um número finito, zero ou mais; ${comoVeio(valor)}`);
  }
}

/**
 * Arredonda para `casas` decimais, meio para cima (em módulo), olhando o número
 * decimal que a pessoa vê e não o binário: `toFixed` sozinho dá 1,45 → "1,4"
 * (porque 1,45 vira 1,4499… em binário) e 2,45 → "2,5". Revisão A, 10/10/2026.
 */
function arredondarDecimal(valor: number, casas: number): number {
  const modulo = Math.abs(valor);
  const texto = String(modulo);
  if (texto.includes('e')) {
    // Notação científica (muito grande ou muito pequeno): a conta por texto não serve.
    return Math.sign(valor) * Number(modulo.toFixed(casas));
  }
  const arredondado = Number(`${Math.round(Number(`${texto}e${casas}`))}e-${casas}`);
  return valor < 0 && arredondado !== 0 ? -arredondado : arredondado;
}

/**
 * Formata um número em português do Brasil: vírgula decimal, sem separador de
 * milhar (fica mais legível em telefone). Tira zeros à direita só se `casas`
 * permitir (ex.: 72,0 kg vira "72 kg" com `cortarZeros`). Arredonda meio para
 * cima no decimal (ver `arredondarDecimal`).
 */
export function formatarNumero(valor: number, casas: number, cortarZeros = true): string {
  // Revisão T (T8): NaN e Infinity viravam o texto "NaN" na tela.
  if (typeof valor !== 'number' || !Number.isFinite(valor)) {
    throw new RangeError(`número para formatar precisa ser finito; veio ${String(valor)}`);
  }
  let texto = arredondarDecimal(valor, casas).toFixed(casas);
  if (cortarZeros && casas > 0) {
    texto = texto.replace(/\.?0+$/, '');
  }
  return texto.replace('.', ',');
}

/** Lê um número digitado em PT-BR ("72,5" ou "72.5"). Retorna NaN se não der. */
export function lerNumero(texto: string): number {
  const limpo = texto.trim().replace(/\s/g, '').replace(',', '.');
  if (limpo === '' || !/^-?\d*\.?\d+$/.test(limpo)) {
    return Number.NaN;
  }
  const numero = Number(limpo);
  // Revisão T (T7): 400 dígitos davam Infinity, que não é "NaN se não der".
  return Number.isFinite(numero) ? numero : Number.NaN;
}

// ---------------------------------------------------------------------------
// Massa: gramas ↔ quilos
// ---------------------------------------------------------------------------

export const GRAMAS_POR_QUILO = 1000;

export function gramasParaQuilos(gramas: Gramas): number {
  return gramas / GRAMAS_POR_QUILO;
}

export function quilosParaGramas(quilos: number): Gramas {
  return inteiroNaoNegativo(quilos * GRAMAS_POR_QUILO, 'quilos');
}

/**
 * R7 (tabela da seção 7): peso corporal "kg com uma casa" — "72,4 kg", "80,0 kg".
 * O zero fica: numa lista de pesagens as vírgulas se alinham e "80,0" diz que a
 * balança mediu o décimo. A carga de musculação ("20 kg") saiu com o treino (P12).
 */
export function formatarPeso(gramas: Gramas, casas = 1): string {
  exigirMedida(gramas, 'peso em gramas');
  return `${formatarNumero(gramasParaQuilos(gramas), casas, false)} kg`;
}

// ---------------------------------------------------------------------------
// Comprimento: milímetros ↔ centímetros ↔ metros
// ---------------------------------------------------------------------------

export const MILIMETROS_POR_CENTIMETRO = 10;
export const MILIMETROS_POR_METRO = 1000;

export function milimetrosParaCentimetros(milimetros: Milimetros): number {
  return milimetros / MILIMETROS_POR_CENTIMETRO;
}

export function centimetrosParaMilimetros(centimetros: number): Milimetros {
  return inteiroNaoNegativo(centimetros * MILIMETROS_POR_CENTIMETRO, 'centímetros');
}

export function milimetrosParaMetros(milimetros: Milimetros): number {
  return milimetros / MILIMETROS_POR_METRO;
}

export function metrosParaMilimetros(metros: number): Milimetros {
  return inteiroNaoNegativo(metros * MILIMETROS_POR_METRO, 'metros');
}

/** Altura de pessoa: "1,75 m". Sempre 2 casas, sem cortar zero ("1,70 m"). */
export function formatarAltura(milimetros: Milimetros): string {
  exigirMedida(milimetros, 'altura em milímetros');
  return `${formatarNumero(milimetrosParaMetros(milimetros), 2, false)} m`;
}

/** Medida de fita: "82,5 cm", "82 cm". */
export function formatarCircunferencia(milimetros: Milimetros): string {
  exigirMedida(milimetros, 'circunferência em milímetros');
  return `${formatarNumero(milimetrosParaCentimetros(milimetros), 1)} cm`;
}

// ---------------------------------------------------------------------------
// Tempo: segundos ↔ "mm:ss" ↔ "1h 05min"
// ---------------------------------------------------------------------------

export const SEGUNDOS_POR_MINUTO = 60;
export const SEGUNDOS_POR_HORA = 3600;

/** 90 → "01:30"; 3725 → "62:05" (minutos passam de 59 sem virar hora). */
export function segundosParaMinutosSegundos(segundos: Segundos): string {
  const total = inteiroNaoNegativo(segundos, 'segundos');
  const minutos = Math.floor(total / SEGUNDOS_POR_MINUTO);
  const resto = total % SEGUNDOS_POR_MINUTO;
  return `${String(minutos).padStart(2, '0')}:${String(resto).padStart(2, '0')}`;
}

/**
 * "01:30" → 90; "1:30" → 90; "90" → 90 (só segundos); "1:02:03" → 3723.
 * Lança erro se o texto não for um tempo.
 */
export function minutosSegundosParaSegundos(texto: string): Segundos {
  const partes = texto.trim().split(':');
  if (partes.length === 0 || partes.length > 3 || partes.some((p) => !/^\d+$/.test(p))) {
    throw new RangeError(`tempo inválido: "${texto}" (esperado mm:ss)`);
  }
  const numeros = partes.map(Number);
  // Revisão T (T9): "99999999999999999999" passava e virava um número inexato.
  if (numeros.some((n) => !Number.isSafeInteger(n))) {
    throw new RangeError(`tempo inválido: "${texto}" (número grande demais)`);
  }
  if (numeros.length === 1) {
    return numeros[0];
  }
  if (numeros.length === 2) {
    const [minutos, segundos] = numeros;
    if (segundos > 59) {
      throw new RangeError(`tempo inválido: "${texto}" (segundos acima de 59)`);
    }
    return minutos * SEGUNDOS_POR_MINUTO + segundos;
  }
  const [horas, minutos, segundos] = numeros;
  if (minutos > 59 || segundos > 59) {
    throw new RangeError(`tempo inválido: "${texto}" (minutos ou segundos acima de 59)`);
  }
  return horas * SEGUNDOS_POR_HORA + minutos * SEGUNDOS_POR_MINUTO + segundos;
}

/**
 * R7: tempo na tela é `mm:ss` abaixo de 1 h e `h:mm:ss` a partir de 1 h.
 * 90 → "01:30"; 3725 → "1:02:05".
 */
export function formatarTempo(segundos: Segundos): string {
  const total = inteiroNaoNegativo(segundos, 'segundos');
  if (total < SEGUNDOS_POR_HORA) {
    return segundosParaMinutosSegundos(total);
  }
  const horas = Math.floor(total / SEGUNDOS_POR_HORA);
  const minutos = Math.floor((total % SEGUNDOS_POR_HORA) / SEGUNDOS_POR_MINUTO);
  const resto = total % SEGUNDOS_POR_MINUTO;
  return `${horas}:${String(minutos).padStart(2, '0')}:${String(resto).padStart(2, '0')}`;
}

/**
 * Duração para leitura corrida (resumo de treino, "cerca de 45 min"): 45 → "45 s";
 * 90 → "1 min 30 s"; 600 → "10 min"; 3900 → "1 h 05 min"; 7200 → "2 h".
 * Unidade sempre com espaço (tom de voz, princípio 8; revisão AE: antes "46min").
 */
export function formatarDuracao(segundos: Segundos): string {
  const total = inteiroNaoNegativo(segundos, 'segundos');
  const horas = Math.floor(total / SEGUNDOS_POR_HORA);
  const minutos = Math.floor((total % SEGUNDOS_POR_HORA) / SEGUNDOS_POR_MINUTO);
  const resto = total % SEGUNDOS_POR_MINUTO;

  if (horas > 0) {
    return minutos > 0 ? `${horas} h ${String(minutos).padStart(2, '0')} min` : `${horas} h`;
  }
  if (minutos > 0) {
    return resto > 0 ? `${minutos} min ${resto} s` : `${minutos} min`;
  }
  return `${resto} s`;
}

// ---------------------------------------------------------------------------
// Décimos e outras frações inteiras
// ---------------------------------------------------------------------------

/** 185 (décimos) → "18,5 %". Usado para gordura corporal. */
export function formatarPercentualDecimos(decimos: number): string {
  exigirMedida(decimos, 'percentual em décimos');
  return `${formatarNumero(decimos / 10, 1)} %`;
}

/** R7: calorias em kcal inteiro. 320 → "320 kcal". */
export function formatarCalorias(kcal: number): string {
  return `${inteiroNaoNegativo(kcal, 'kcal')} kcal`;
}

// ---------------------------------------------------------------------------
// Dinheiro e datas (R7)
// ---------------------------------------------------------------------------

export const CENTAVOS_POR_REAL = 100;

/** 4990 → "R$ 49,90". Sempre 2 casas. */
export function formatarReais(centavos: Centavos): string {
  // Revisão T (T8): inteiro SEGURO; 1e300 é "inteiro" e saía "R$ 1e+298,00".
  if (!Number.isSafeInteger(centavos) || centavos < 0) {
    throw new RangeError(`centavos precisa ser inteiro, zero ou mais; veio ${String(centavos)}`);
  }
  const total = centavos;
  const reais = Math.floor(total / CENTAVOS_POR_REAL);
  const resto = total % CENTAVOS_POR_REAL;
  return `R$ ${reais},${String(resto).padStart(2, '0')}`;
}

/** Dias de cada mês, considerando ano bissexto (calendário gregoriano). */
function diasNoMes(ano: number, mes: number): number {
  if (mes === 2) {
    const bissexto = (ano % 4 === 0 && ano % 100 !== 0) || ano % 400 === 0;
    return bissexto ? 29 : 28;
  }
  return [4, 6, 9, 11].includes(mes) ? 30 : 31;
}

/** Verdadeiro se dia/mês/ano existem no calendário (recusa 31/02, 29/02/2025, mês 13). */
function dataExiste(ano: number, mes: number, dia: number): boolean {
  return mes >= 1 && mes <= 12 && dia >= 1 && dia <= diasNoMes(ano, mes);
}

/** Lê `AAAA-MM-DD` e confere que a data existe. Lança erro se não. */
function lerDataISO(data: DataISO): [number, number, number] {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(data);
  if (!partes) {
    throw new RangeError('data inválida (esperado AAAA-MM-DD)');
  }
  const ano = Number(partes[1]);
  const mes = Number(partes[2]);
  const dia = Number(partes[3]);
  if (!dataExiste(ano, mes, dia)) {
    throw new RangeError('data inválida: não existe no calendário');
  }
  return [ano, mes, dia];
}

/** "2026-10-10" → "10/10/2026". Lança erro se não for `AAAA-MM-DD` ou se a data não existir. */
export function formatarData(data: DataISO): string {
  lerDataISO(data);
  const [ano, mes, dia] = data.split('-');
  return `${dia}/${mes}/${ano}`;
}

/** "10/10/2026" → "2026-10-10". Lança erro se não for `DD/MM/AAAA`. */
export function lerDataBrasileira(texto: string): DataISO {
  const partes = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto.trim());
  if (!partes) {
    throw new RangeError('data inválida (esperado DD/MM/AAAA)');
  }
  const [, dia, mes, ano] = partes;
  if (!dataExiste(Number(ano), Number(mes), Number(dia))) {
    throw new RangeError('data inválida: não existe no calendário');
  }
  return `${ano}-${mes}-${dia}`;
}

/**
 * R7: idade não se armazena; deriva da data de nascimento na data de referência.
 * Quem nasceu em 29/02 completa ano em 01/03 nos anos não bissextos
 * (Código Civil, art. 132, § 3º) — importa para a regra do menor de 18 (R6.11).
 */
export function calcularIdade(dataNascimento: DataISO, hoje: DataISO): number {
  const [anoN, mesN, diaN] = lerDataISO(dataNascimento);
  const [anoH, mesH, diaH] = lerDataISO(hoje);
  let idade = anoH - anoN;
  if (mesH < mesN || (mesH === mesN && diaH < diaN)) {
    idade -= 1;
  }
  if (!Number.isFinite(idade) || idade < 0) {
    throw new RangeError('não dá para calcular a idade: a data de nascimento é depois da data de referência');
  }
  return idade;
}

/**
 * R7.4: instante ISO 8601 na hora LOCAL do aparelho, com o deslocamento
 * explícito: `2026-10-10T22:30:00-03:00`. `Date.toISOString()` daria
 * `2026-10-11T01:30:00.000Z` — perde o fuso do aluno e, à noite, troca o dia.
 */
export function instanteComFuso(data: Date): InstanteISO {
  // Revisão T (T8): data inválida dava "0NaN-NaN-NaNTNaN:NaN:NaN-NaN:NaN".
  if (!(data instanceof Date) || Number.isNaN(data.getTime())) {
    throw new RangeError('instante inválido: a data não existe');
  }
  const dois = (n: number): string => String(n).padStart(2, '0');
  const deslocamento = -data.getTimezoneOffset();
  const sinal = deslocamento >= 0 ? '+' : '-';
  const absoluto = Math.abs(deslocamento);
  return (
    `${String(data.getFullYear()).padStart(4, '0')}-${dois(data.getMonth() + 1)}-${dois(data.getDate())}` +
    `T${dois(data.getHours())}:${dois(data.getMinutes())}:${dois(data.getSeconds())}` +
    `${sinal}${dois(Math.floor(absoluto / 60))}:${dois(absoluto % 60)}`
  );
}

// ---------------------------------------------------------------------------
// IMC (índice de massa corporal) — cálculo, não diagnóstico
// ---------------------------------------------------------------------------

/**
 * IMC = peso (kg) / altura (m)². Retorna com 1 casa. Lança erro se faltar
 * altura. Quem mostra o número decide se mostra: é dado de saúde.
 */
export function calcularImc(pesoGramas: Gramas, alturaMilimetros: Milimetros): number {
  // `!(x > 0)` pega também NaN e undefined (campo opcional vazio), que `x <= 0` deixava passar.
  if (typeof alturaMilimetros !== 'number' || !(alturaMilimetros > 0) || !Number.isFinite(alturaMilimetros)) {
    throw new RangeError('altura precisa ser maior que zero para calcular o IMC');
  }
  exigirMedida(pesoGramas, 'peso em gramas');
  const metros = milimetrosParaMetros(alturaMilimetros);
  const imc = gramasParaQuilos(pesoGramas) / (metros * metros);
  return Math.round(imc * 10) / 10;
}
