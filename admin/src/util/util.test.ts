import { describe, expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const raiz = resolve(process.cwd());
import { celulaDoXlsx, decodificarTexto, lerPlanilha, ErroDeArquivo } from '../arquivos/ler-planilha.ts';
import { percentual } from './formatar.ts';
import { campoFinanceiro, redigir, redigirErro } from './registrar.ts';
import { linkDoWhatsapp, mensagemDeCobranca, numeroDoWhatsapp } from './whatsapp.ts';

describe('dado financeiro nunca vai para log (RA1.5)', () => {
  test('valor, descrição, nota e telefone saem redigidos; o erro leva só o nome e o código', () => {
    const r = redigir({ id: 'l1', valorCentavos: 19000, descricao: 'Luvas', pessoa: { nome: 'Bruno', telefone: '(51) 9' }, mudancas: [{ campo: 'valorCentavos' }] }) as Record<string, unknown>;
    expect(JSON.stringify(r)).not.toMatch(/19000|Luvas|Bruno|\(51\)/);
    expect(campoFinanceiro('aReceberEmAberto')).toBe(true);
    expect(redigirErro({ name: 'PostgrestError', code: '23514', message: 'Failing row contains (Luvas, 19000)' })).toEqual({ nome: 'PostgrestError', codigo: '23514' });
  });
});

describe('ler a planilha', () => {
  test('célula do XLSX: a data vira AAAA-MM-DD; número fica número', () => {
    expect(celulaDoXlsx(new Date(Date.UTC(2026, 9, 5)))).toBe('2026-10-05');
    expect(celulaDoXlsx(150.5)).toBe(150.5);
    expect(celulaDoXlsx(true)).toBe('sim');
    expect(celulaDoXlsx(null)).toBeNull();
  });

  test('CSV em UTF-8 e no Windows-1252 do Excel antigo', () => {
    expect(decodificarTexto(new TextEncoder().encode('Descrição;Água').buffer)).toBe('Descrição;Água');
    const latin1 = new Uint8Array([0x41, 0x67, 0x75, 0x61, 0x3b, 0xc1, 0x67, 0x75, 0x61]); // "Agua;Água" em 1252
    expect(decodificarTexto(latin1.buffer)).toBe('Agua;Água');
  });

  test('arquivo CSV vira grade; .xls antigo e arquivo grande são recusados com frase', async () => {
    const csv = new File(['﻿Data;Descrição;Valor\r\n01/10/2026;Mensal Bruno;150,00\r\n'], 'caixa.csv', { type: 'text/csv' });
    const p = await lerPlanilha(csv);
    expect(p.linhas).toEqual([['Data', 'Descrição', 'Valor'], ['01/10/2026', 'Mensal Bruno', '150,00']]);
    await expect(lerPlanilha(new File(['x'], 'velho.xls'))).rejects.toBeInstanceOf(ErroDeArquivo);
    const grande = new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'grande.csv');
    await expect(lerPlanilha(grande)).rejects.toThrow(/5 MB/);
  });

  test('XLSX de verdade (o arquivo de exemplo da pasta e2e) chega como grade com a data e o número', async () => {
    const bytes = readFileSync(resolve(raiz, 'e2e/planilha-de-exemplo.xlsx'));
    const p = await lerPlanilha(new File([bytes], 'planilha-de-exemplo.xlsx'));
    expect(p.formato).toBe('xlsx');
    expect(p.linhas[0]).toEqual(['Data', 'Histórico', 'Entrada', 'Saída', 'Categoria']);
    expect(p.linhas[1]).toEqual(['2026-10-01', 'Mensal Bruno', 150, null, 'Mensalidades']);
  });
});

describe('cobrar no WhatsApp (RA5.5)', () => {
  test('o número ganha o 55 e a mensagem vai pronta', () => {
    expect(numeroDoWhatsapp('(51) 98196-2077')).toBe('5551981962077');
    expect(numeroDoWhatsapp('9999')).toBeNull();
    const m = mensagemDeCobranca({ nome: 'Bruno Almeida', mes: 'outubro', vencimento: '2026-10-10', centavos: 15000, academia: 'Raça Fight' });
    expect(m).toBe('Olá, Bruno! A mensalidade de outubro da Raça Fight venceu em 10/10, no valor de R$ 150,00. Se já pagou, desconsidere.');
    expect(linkDoWhatsapp('5551981962077', 'Olá!')).toBe('https://wa.me/5551981962077?text=Ol%C3%A1!');
  });

  test('percentual de uma casa, e "—" sem base', () => {
    expect(percentual({ atual: 1, anterior: 1, diferenca: 0, pontosBase: 1390 })).toBe('+13,9 %');
    expect(percentual({ atual: 1, anterior: 1, diferenca: 0, pontosBase: -310 })).toBe('−3,1 %');
    expect(percentual({ atual: 1, anterior: 0, diferenca: 1, pontosBase: null })).toBe('—');
  });
});

describe('o tema vem do tokens.json', () => {
  test('o tokens.css gerado tem as cores dos dois temas e o vermelho da marca', () => {
    const css = readFileSync(resolve(raiz, 'src/estilos/tokens.css'), 'utf8');
    expect(css).toMatch(/GERADO por ferramentas\/gerar-tokens-css\.mjs/);
    expect(css).toMatch(/--rf-vermelho: #C42024/);
    expect(css).toMatch(/--ad-fundo: #141414/);
    expect(css).toMatch(/--ad-fundo: #F5F5F5/);
    expect(css).toMatch(/--ad-marca: #FF6B6B/);
  });
});
