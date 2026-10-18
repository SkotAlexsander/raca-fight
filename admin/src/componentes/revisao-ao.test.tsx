/**
 * Revisão AO (16/10): a planilha como o dono usa o Excel (colar uma coluna por
 * cima das linhas, Delete limpa a célula), a gaveta que não rouba o foco e o
 * botão que não grava duas vezes. Nomes fictícios, repositório local.
 */

import { act, fireEvent, render, renderHook, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test } from 'vitest';
import { Telas } from '../App.tsx';
import { armazenamentoNaMemoria } from '../dados/local/armazenamento.ts';
import { criarRepositorioLocal } from '../dados/local/repositorio-local.ts';
import { useEnvio } from '../estado/envio.ts';
import { ProvedorDaLoja } from '../estado/loja.tsx';
import { Gaveta } from './basicos.tsx';

const HOJE = '2026-10-15';

function montar() {
  let n = 0;
  const repo = criarRepositorioLocal({ armazenamento: armazenamentoNaMemoria(), hoje: () => HOJE, agora: () => `${HOJE}T10:42:00-03:00`, gerarId: () => `ao-${++n}` });
  location.hash = '#/financeiro/lancamentos';
  render(
    <ProvedorDaLoja repositorio={repo} sessao={{ usuarioId: 'dono-alex', nome: 'Alex', papel: 'dono', academiaId: 'raca-fight' }} hoje={HOJE}>
      <Telas />
    </ProvedorDaLoja>,
  );
  return repo;
}

const grade = () => screen.getByRole('grid');

/** As N primeiras linhas SEGUIDAS que são lançamentos (não cobrança virtual), pelo índice da tela. */
function linhasSeguidas(n: number): number[] {
  const trs = [...grade().querySelectorAll('tbody tr')];
  for (let i = 0; i + n <= trs.length; i++) {
    if (trs.slice(i, i + n).every((tr) => !tr.classList.contains('ad-linha-virtual'))) return Array.from({ length: n }, (_, j) => i + j);
  }
  throw new Error('não achei linhas seguidas');
}
const celula = (r: number, c: number) => grade().querySelector<HTMLElement>(`td[data-r="${r}"][data-c="${c}"]`)!;
const descricaoDa = (r: number) => celula(r, 1).textContent ?? '';
/** O lançamento da linha r da tela: a descrição e o dia (a mesma descrição se repete todo mês). */
async function lancamentoDa(repo: ReturnType<typeof montar>, r: number) {
  const [dia, mes] = (celula(r, 0).textContent ?? '').split('/');
  const data = `2026-${mes}-${dia}`;
  const descricao = descricaoDa(r);
  const achados = (await repo.carregar()).lancamentos.filter((l) => l.descricao === descricao && l.data === data && !l.arquivado);
  expect(achados).toHaveLength(1);
  return achados[0]!;
}

describe('AO — a planilha faz o que o Excel faz', () => {
  beforeEach(() => { location.hash = ''; });

  test('colar UMA coluna de valores preenche para baixo as linhas que já existem, como uma ação só (antes: linhas novas, todas com erro)', async () => {
    const repo = montar();
    await screen.findByRole('grid', {}, { timeout: 20000 });
    const u = userEvent.setup();
    const [r0, r1, r2] = linhasSeguidas(3) as [number, number, number];
    const ids = [(await lancamentoDa(repo, r0)).id, (await lancamentoDa(repo, r1)).id, (await lancamentoDa(repo, r2)).id];
    const antes = (await repo.carregar()).lancamentos.length;
    fireEvent.mouseDown(celula(r0, 5));
    celula(r0, 5).focus();
    act(() => { fireEvent.paste(grade(), { clipboardData: { getData: () => 'Dinheiro\r\nDinheiro\r\nDinheiro\r\n' } }); });
    await waitFor(async () => {
      const d = await repo.carregar();
      for (const id of ids) expect(d.lancamentos.find((l) => l.id === id)!.formaDePagamento).toBe('dinheiro');
    });
    expect((await repo.carregar()).lancamentos.length).toBe(antes);
    expect(screen.queryByText(/Você colou/)).not.toBeInTheDocument();
    // um Ctrl+Z desfaz as três
    celula(r0, 5).focus();
    await u.keyboard('{Control>}z{/Control}');
    await waitFor(async () => {
      const d = await repo.carregar();
      expect(ids.filter((id) => d.lancamentos.find((l) => l.id === id)!.formaDePagamento === 'dinheiro').length).toBeLessThan(3);
    });
  }, 60000);

  test('Delete limpa a forma de pagamento da célula; na descrição, explica como arquivar', async () => {
    const repo = montar();
    await screen.findByRole('grid', {}, { timeout: 20000 });
    const u = userEvent.setup();
    const [r] = linhasSeguidas(1) as [number];
    const alvo = await lancamentoDa(repo, r);
    expect(alvo.formaDePagamento).toBeTruthy();
    fireEvent.mouseDown(celula(r, 5));
    celula(r, 5).focus();
    await u.keyboard('{Delete}');
    await waitFor(async () => expect((await repo.carregar()).lancamentos.find((l) => l.id === alvo.id)!.formaDePagamento).toBeUndefined());
    fireEvent.mouseDown(celula(r, 1));
    celula(r, 1).focus();
    await u.keyboard('{Delete}');
    expect(await screen.findByText(/Para arquivar a linha, marque com Shift\+Espaço/)).toBeInTheDocument();
    expect((await repo.carregar()).lancamentos.find((l) => l.id === alvo.id)!.arquivado).toBeFalsy();
  }, 60000);

  test('clicar noutra célula com a edição aberta grava e vai para ela', async () => {
    const repo = montar();
    await screen.findByRole('grid', {}, { timeout: 20000 });
    const u = userEvent.setup();
    const [r0, r1] = linhasSeguidas(2) as [number, number];
    const desc = descricaoDa(r0);
    const { id } = await lancamentoDa(repo, r0);
    fireEvent.mouseDown(celula(r0, 1));
    celula(r0, 1).focus();
    await u.keyboard('{Enter}');
    const campo = within(grade()).getByDisplayValue(desc);
    await u.type(campo, ' (conferido)');
    fireEvent.mouseDown(celula(r1, 3));
    await waitFor(async () => expect((await repo.carregar()).lancamentos.find((l) => l.id === id)!.descricao).toBe(`${desc} (conferido)`));
    await waitFor(() => expect(within(grade()).queryByRole('textbox')).not.toBeInTheDocument());
    expect(celula(r1, 3)).toHaveAttribute('tabindex', '0');
  }, 60000);
});

describe('AO — a gaveta e o botão', () => {
  test('a gaveta não rouba o foco quando a tela de trás redesenha (antes o foco pulava para o primeiro campo)', () => {
    const G = () => <Gaveta titulo="Lembrar" aoFechar={() => {}}><input aria-label="Primeiro" /><input aria-label="Segundo" /></Gaveta>;
    const { rerender } = render(<G />);
    const segundo = screen.getByLabelText('Segundo');
    segundo.focus();
    rerender(<G />);
    rerender(<G />);
    expect(document.activeElement).toBe(segundo);
  });

  test('um envio por vez: o duplo clique roda a gravação uma vez só', async () => {
    const { result } = renderHook(() => useEnvio());
    let vezes = 0;
    let soltar = () => {};
    const gravacao = () => new Promise<void>((ok) => { vezes += 1; soltar = ok; });
    let a: Promise<unknown> = Promise.resolve();
    let b: Promise<unknown> = Promise.resolve();
    act(() => { a = result.current.enviar(gravacao); b = result.current.enviar(gravacao); });
    expect(vezes).toBe(1);
    await waitFor(() => expect(result.current.enviando).toBe(true));
    await act(async () => { soltar(); await a; await b; });
    expect(result.current.enviando).toBe(false);
    await act(async () => { const c = result.current.enviar(async () => { vezes += 1; }); await c; });
    expect(vezes).toBe(2);
  });
});

describe('AO/AU — Ajustes › Turmas e horários', () => {
  test('mostra a semana da grade e a turma nova sem nome não grava', async () => {
    let n = 0;
    const repo = criarRepositorioLocal({ armazenamento: armazenamentoNaMemoria(), hoje: () => HOJE, agora: () => `${HOJE}T10:42:00-03:00`, gerarId: () => `tu-${++n}` });
    location.hash = '#/ajustes/turmas';
    render(
      <ProvedorDaLoja repositorio={repo} sessao={{ usuarioId: 'dono-alex', nome: 'Alex', papel: 'dono', academiaId: 'raca-fight' }} hoje={HOJE}>
        <Telas />
      </ProvedorDaLoja>,
    );
    expect(await screen.findByRole('heading', { name: /A semana · \d+ turmas ativas/ }, { timeout: 20000 })).toBeInTheDocument();
    expect(screen.getAllByText('Sexta OPEN').length).toBeGreaterThan(0);
    const u = userEvent.setup();
    await u.click(screen.getByRole('button', { name: 'Turma' }));
    const gaveta = screen.getByRole('dialog', { name: 'Turma nova' });
    await u.click(within(gaveta).getByRole('button', { name: 'Guardar' }));
    expect(await within(gaveta).findByText('Escreva o nome da turma.')).toBeInTheDocument();
    const antes = (await repo.carregar()).turmas.length;
    await u.type(within(gaveta).getByLabelText('Nome'), 'Boxe — sábado');
    await u.click(within(gaveta).getByLabelText('Boxe'));
    await u.click(within(gaveta).getByRole('button', { name: 'Guardar' }));
    await waitFor(async () => expect((await repo.carregar()).turmas.length).toBe(antes + 1));
  }, 60000);
});
