/**
 * A planilha pelo teclado (AK-ADMIN-TELAS.md, seção 2): andar, editar, gravar,
 * erro na célula, colar várias linhas do Excel, desfazer e refazer, e o mês
 * fechado. Roda a tela de verdade (moldura + Lançamentos) sobre o repositório
 * local, como o dono usa.
 */

import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test } from 'vitest';
import { Telas } from '../App.tsx';
import { armazenamentoNaMemoria } from '../dados/local/armazenamento.ts';
import { criarRepositorioLocal } from '../dados/local/repositorio-local.ts';
import { ProvedorDaLoja } from '../estado/loja.tsx';

const HOJE = '2026-10-15';

function montar() {
  let n = 0;
  const repo = criarRepositorioLocal({ armazenamento: armazenamentoNaMemoria(), hoje: () => HOJE, agora: () => `${HOJE}T10:42:00-03:00`, gerarId: () => `t-${++n}` });
  location.hash = '#/financeiro/lancamentos';
  render(
    <ProvedorDaLoja repositorio={repo} sessao={{ usuarioId: 'dono-alex', nome: 'Alex', papel: 'dono', academiaId: 'raca-fight' }} hoje={HOJE}>
      <Telas />
    </ProvedorDaLoja>,
  );
  return repo;
}

const grade = () => screen.getByRole('grid');
const ativa = () => within(grade()).getAllByRole('gridcell').find((c) => c.getAttribute('tabindex') === '0')!;
const posicao = (td: HTMLElement) => [Number(td.dataset.r), Number(td.dataset.c)];

async function abrir() {
  const r = montar();
  await screen.findByRole('grid', {}, { timeout: 20000 });
  return r;
}

describe('a planilha de lançamentos, pelo teclado', () => {
  beforeEach(() => { location.hash = ''; });

  test('setas, Home, End e Tab andam com um foco só (tabindex 0 numa célula)', async () => {
    await abrir();
    const u = userEvent.setup();
    ativa().focus();
    expect(posicao(ativa())).toEqual([0, 4]);
    await u.keyboard('{ArrowRight}{ArrowDown}{ArrowDown}');
    expect(posicao(ativa())).toEqual([2, 5]);
    await u.keyboard('{Home}');
    expect(posicao(ativa())).toEqual([2, 0]);
    await u.keyboard('{End}');
    expect(posicao(ativa())).toEqual([2, 8]);
    await u.keyboard('{Control>}{Home}{/Control}');
    expect(posicao(ativa())).toEqual([0, 0]);
    await u.keyboard('{Tab}');
    expect(posicao(ativa())).toEqual([0, 1]);
    expect(within(grade()).getAllByRole('gridcell').filter((c) => c.getAttribute('tabindex') === '0')).toHaveLength(1);
  }, 60000);

  test('Ctrl+Enter abre linha nova; Enter grava e desce; valor errado mostra o erro e não grava; Ctrl+Z desfaz, Ctrl+Y refaz', async () => {
    const repo = await abrir();
    const u = userEvent.setup();
    ativa().focus();
    await u.keyboard('{Control>}{Enter}{/Control}');
    const desc = await within(grade()).findByLabelText('Descrição, linha 1');
    await u.type(desc, 'Luvas 14 oz para revenda');
    await u.keyboard('{Tab}');
    // ainda sem valor: o rascunho fica na tela, sem gravar
    expect((await repo.carregar()).lancamentos.some((l) => l.descricao === 'Luvas 14 oz para revenda')).toBe(false);
    await u.keyboard('{ArrowRight}{ArrowRight}{Enter}');
    const valor = within(grade()).getByLabelText('Valor, linha 1');
    await u.type(valor, '12,345');
    await u.keyboard('{Enter}');
    expect(await within(grade()).findByRole('alert')).toHaveTextContent('Valor inválido');
    expect((await repo.carregar()).lancamentos.some((l) => l.descricao === 'Luvas 14 oz para revenda')).toBe(false);
    await u.clear(within(grade()).getByLabelText('Valor, linha 1'));
    await u.type(within(grade()).getByLabelText('Valor, linha 1'), '-190');
    await u.keyboard('{Enter}');
    await waitFor(async () => expect((await repo.carregar()).lancamentos.find((l) => l.descricao === 'Luvas 14 oz para revenda')).toBeTruthy());
    const criada = (await repo.carregar()).lancamentos.find((l) => l.descricao === 'Luvas 14 oz para revenda')!;
    expect(criada.valorCentavos).toBe(19000);
    expect(criada.tipo).toBe('saida');
    expect(await screen.findByText(/Linha nova "Luvas 14 oz para revenda"/)).toBeInTheDocument();
    expect(within(grade()).getByText('Luvas 14 oz para revenda')).toBeInTheDocument();

    // desfazer = arquivar a linha criada (nada se apaga); refazer traz de volta
    ativa().focus();
    await u.keyboard('{Control>}z{/Control}');
    await waitFor(async () => expect((await repo.carregar()).lancamentos.find((l) => l.id === criada.id)!.arquivado).toBe(true));
    await waitFor(() => expect(within(grade()).queryByText('Luvas 14 oz para revenda')).not.toBeInTheDocument());
    ativa().focus();
    await u.keyboard('{Control>}y{/Control}');
    await waitFor(async () => expect((await repo.carregar()).lancamentos.find((l) => l.id === criada.id)!.arquivado).toBeFalsy());
    // o histórico guardou as três ações
    const h = (await repo.carregar()).historico.filter((x) => x.registroId === criada.id);
    expect(h.map((x) => x.acao)).toEqual(['mudou', 'arquivou', 'criou']);
  }, 60000);

  test('editar uma célula e Esc cancela sem mexer; Enter grava a mudança', async () => {
    const repo = await abrir();
    const u = userEvent.setup();
    // acha uma linha digitada (não a cobrança, que não edita)
    const d = await repo.carregar();
    const alvo = d.lancamentos.filter((l) => l.data.startsWith('2026-10') && l.origem === 'manual' && !l.arquivado).sort((a, b) => b.data.localeCompare(a.data))[0]!;
    const td = within(grade()).getAllByText(alvo.descricao)[0]!.closest('td')!;
    fireEvent.mouseDown(td);
    td.focus();
    await u.keyboard('{Enter}');
    const campo = within(grade()).getByDisplayValue(alvo.descricao);
    await u.clear(campo);
    await u.type(campo, 'Nada disso');
    await u.keyboard('{Escape}');
    expect(within(grade()).queryByDisplayValue('Nada disso')).not.toBeInTheDocument();
    expect((await repo.carregar()).lancamentos.find((l) => l.id === alvo.id)!.descricao).toBe(alvo.descricao);
    ativa().focus();
    await u.keyboard('{Enter}');
    const campo2 = within(grade()).getByDisplayValue(alvo.descricao);
    await u.clear(campo2);
    await u.type(campo2, `${alvo.descricao} (conferido)`);
    await u.keyboard('{Enter}');
    await waitFor(async () => expect((await repo.carregar()).lancamentos.find((l) => l.id === alvo.id)!.descricao).toBe(`${alvo.descricao} (conferido)`));
  }, 60000);

  test('Ctrl+V de várias linhas do Excel: prévia com o erro na célula, nada gravado até confirmar, e gravar é uma ação só', async () => {
    const repo = await abrir();
    const u = userEvent.setup();
    const idsAntes = new Set((await repo.carregar()).lancamentos.map((l) => l.id));
    const antes = idsAntes.size;
    await u.keyboard('{Home}');
    const td = ativa();
    td.focus();
    await u.keyboard('{Home}');
    const texto = ['05/10\tKimono A2 branco\tVenda de produtos\tEntrada\t320,00\tPix', '31/09\tFaixa preta\tVenda de produtos\tEntrada\t90,00\tPix', '06/10\tProtetor bucal\tVenda de produtos\tEntrada\t25,00\tDinheiro'].join('\r\n');
    act(() => { fireEvent.paste(grade(), { clipboardData: { getData: () => texto } }); });
    expect(await screen.findByText(/Você colou 3 linhas do Excel: 2 prontas e 1 com erro/)).toBeInTheDocument();
    expect(within(grade()).getByText(/31\/09 · Data inválida/)).toBeInTheDocument();
    expect((await repo.carregar()).lancamentos.length).toBe(antes);
    await u.click(screen.getByRole('button', { name: 'Gravar as 2 linhas' }));
    await waitFor(async () => expect((await repo.carregar()).lancamentos.length).toBe(antes + 2));
    const novas = (await repo.carregar()).lancamentos.filter((l) => !idsAntes.has(l.id));
    expect(novas.map((l) => l.descricao).sort()).toEqual(['Kimono A2 branco', 'Protetor bucal']);
    // uma ação só: um Ctrl+Z tira as duas
    ativa().focus();
    await u.keyboard('{Control>}z{/Control}');
    await waitFor(async () => {
      const d = await repo.carregar();
      expect(novas.every((n) => d.lancamentos.find((l) => l.id === n.id)!.arquivado)).toBe(true);
    });
  }, 60000);

  test('mês fechado: só leitura, a tecla não edita e o aviso diz que nada mudou', async () => {
    const repo = await abrir();
    const u = userEvent.setup();
    await u.click(screen.getByRole('button', { name: 'Mês anterior' }));
    expect(await screen.findByText(/Setembro está fechado desde 03\/10\/2026, 18:12/)).toBeInTheDocument();
    expect(grade()).toHaveAttribute('aria-readonly', 'true');
    const antes = JSON.stringify((await repo.carregar()).lancamentos);
    ativa().focus();
    await u.keyboard('{Enter}');
    expect(await screen.findByText('Setembro está fechado: nada foi mudado.')).toBeInTheDocument();
    expect(within(grade()).queryByRole('textbox')).not.toBeInTheDocument();
    act(() => { fireEvent.paste(grade(), { clipboardData: { getData: () => 'a\tb\nc\td' } }); });
    expect(JSON.stringify((await repo.carregar()).lancamentos)).toBe(antes);
    // reabrir pede motivo, e aí a linha volta a editar
    await u.click(screen.getByRole('button', { name: 'Reabrir setembro' }));
    await u.click(screen.getByRole('button', { name: 'Reabrir' }));
    expect(await screen.findByText('Escreva o motivo: ele fica no histórico.')).toBeInTheDocument();
    await u.type(screen.getByLabelText('Motivo'), 'Faltou a venda de luvas');
    await u.click(screen.getByRole('button', { name: 'Reabrir' }));
    await waitFor(() => expect(grade()).not.toHaveAttribute('aria-readonly'));
    expect((await repo.carregar()).historico[0]!.motivo).toBe('Faltou a venda de luvas');
  }, 60000);
});
