/**
 * AO (16/10): a data que o dono digita nas gavetas (pagar, lembrar, adiar,
 * tarefa). Antes cada gaveta lia de um jeito: o lembrete aceitava "20/10",
 * a tarefa e o adiar não; e "20/10" digitado em dezembro virava um lembrete
 * já atrasado.
 */

import { describe, expect, test } from 'vitest';
import { lerDataDigitada } from './datas-digitadas.ts';

describe('a data digitada nas gavetas', () => {
  test('dd/mm/aaaa, d/m/aa e as palavras hoje, amanhã e ontem', () => {
    expect(lerDataDigitada('05/10/2026', '2026-10-15')).toBe('2026-10-05');
    expect(lerDataDigitada('5/10/26', '2026-10-15')).toBe('2026-10-05');
    expect(lerDataDigitada(' hoje ', '2026-10-15')).toBe('2026-10-15');
    expect(lerDataDigitada('amanhã', '2026-12-31')).toBe('2027-01-01');
    expect(lerDataDigitada('Amanha', '2026-10-15')).toBe('2026-10-16');
    expect(lerDataDigitada('ontem', '2026-03-01')).toBe('2026-02-28');
    expect(lerDataDigitada('31/02/2026', '2026-10-15')).toBeNull();
    expect(lerDataDigitada('', '2026-10-15')).toBeNull();
  });

  test('sem ano: o ano de hoje; para o que é futuro (lembrete, tarefa, adiar), a próxima vez que o dia chega', () => {
    expect(lerDataDigitada('20/10', '2026-10-15')).toBe('2026-10-20');
    expect(lerDataDigitada('10/01', '2026-12-16')).toBe('2026-01-10');
    expect(lerDataDigitada('10/01', '2026-12-16', { futuro: true })).toBe('2027-01-10');
    expect(lerDataDigitada('16/12', '2026-12-16', { futuro: true })).toBe('2026-12-16');
    expect(lerDataDigitada('29/02', '2026-03-01', { futuro: true })).toBeNull();
    // o dia sozinho: deste mês (ou do próximo, para o futuro)
    expect(lerDataDigitada('20', '2026-10-15')).toBe('2026-10-20');
    expect(lerDataDigitada('5', '2026-10-15', { futuro: true })).toBe('2026-11-05');
    expect(lerDataDigitada('31', '2026-11-15')).toBeNull();
  });
});
