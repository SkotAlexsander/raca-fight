/**
 * Campo numérico +/−: o passo, os limites, a digitação, o toque longo que
 * repete e a área de toque dos botões (36 de desenho + hitSlop = 48).
 */
import { useState } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet, type Insets, type ViewStyle } from 'react-native';
import { alvo, ProvedorDeTema } from '@/tema';
import { CampoNumerico, type PropsDoCampoNumerico } from './CampoNumerico';

type Extras = Partial<Omit<PropsDoCampoNumerico, 'valor' | 'aoMudar'>>;

/** O campo controlado, como numa tela de verdade: o valor volta pelo estado. */
function CampoControlado({ inicial, espiao, ...props }: Extras & { inicial: number | undefined; espiao: jest.Mock }) {
  const [valor, setValor] = useState<number | undefined>(inicial);
  return (
    <CampoNumerico
      rotulo="Carga"
      passo={2500}
      minimo={0}
      maximo={10000}
      {...props}
      valor={valor}
      aoMudar={(v) => {
        espiao(v);
        setValor(v);
      }}
    />
  );
}

function montar(inicial: number | undefined, extras: Extras = {}) {
  const espiao = jest.fn();
  render(
    <ProvedorDeTema>
      <CampoControlado inicial={inicial} espiao={espiao} {...extras} />
    </ProvedorDeTema>,
  );
  return espiao;
}

const mais = () => screen.getByRole('button', { name: 'Aumentar carga' });
const menos = () => screen.getByRole('button', { name: 'Diminuir carga' });

describe('Campo numérico — passo e limites', () => {
  test('"+" e "−" mudam o valor pelo passo', () => {
    const espiao = montar(5000);
    fireEvent.press(mais());
    expect(espiao).toHaveBeenLastCalledWith(7500);
    fireEvent.press(menos());
    fireEvent.press(menos());
    expect(espiao.mock.calls.map((c) => c[0])).toEqual([7500, 5000, 2500]);
  });

  test('no máximo o "+" fica desabilitado e não passa do limite', () => {
    const espiao = montar(10000);
    expect(mais()).toBeDisabled();
    fireEvent.press(mais());
    expect(espiao).not.toHaveBeenCalled();
    expect(menos()).toBeEnabled();
  });

  test('no mínimo o "−" fica desabilitado e não passa do limite', () => {
    const espiao = montar(0);
    expect(menos()).toBeDisabled();
    fireEvent.press(menos());
    expect(espiao).not.toHaveBeenCalled();
  });

  test('perto do limite o passo para no limite (não passa)', () => {
    const espiao = montar(9000);
    fireEvent.press(mais());
    expect(espiao).toHaveBeenLastCalledWith(10000);
    expect(mais()).toBeDisabled();
  });

  test('as ações do leitor de tela (increment/decrement) usam o mesmo passo e limites', () => {
    const espiao = montar(7500);
    const centro = screen.getByRole('adjustable');
    fireEvent(centro, 'accessibilityAction', { nativeEvent: { actionName: 'increment' } });
    fireEvent(centro, 'accessibilityAction', { nativeEvent: { actionName: 'increment' } });
    expect(espiao.mock.calls.map((c) => c[0])).toEqual([10000]);
    fireEvent(centro, 'accessibilityAction', { nativeEvent: { actionName: 'decrement' } });
    expect(espiao).toHaveBeenLastCalledWith(7500);
  });
});

/** Um tique de 150 ms por vez: no aparelho cada tique é uma tarefa e a tela redesenha entre eles. */
function tiques(n: number) {
  for (let i = 0; i < n; i++)
    act(() => {
      jest.advanceTimersByTime(150);
    });
}

describe('Campo numérico — toque longo', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  test('segurar o "+" repete o passo a cada 150 ms e para no máximo', () => {
    const espiao = montar(0);
    fireEvent(mais(), 'longPress');
    tiques(3);
    expect(espiao.mock.calls.map((c) => c[0])).toEqual([2500, 5000, 7500]);
    tiques(5);
    expect(espiao).toHaveBeenLastCalledWith(10000);
    expect(espiao.mock.calls.every((c) => c[0] <= 10000)).toBe(true);
  });

  test('soltar o dedo para a repetição', () => {
    const espiao = montar(0);
    fireEvent(mais(), 'longPress');
    tiques(1);
    fireEvent(mais(), 'pressOut');
    tiques(4);
    expect(espiao).toHaveBeenCalledTimes(1);
  });
});

describe('Campo numérico — digitação', () => {
  // vírgula decimal em quilos → gramas (o que dominio/unidades.ts faz)
  const lerQuilos = (t: string) => {
    const n = Number(t.replace(',', '.'));
    return Number.isFinite(n) && t.trim() !== '' ? Math.round(n * 1000) : null;
  };
  const formatar = (g: number) => String(g / 1000).replace('.', ',');

  test('o que é digitado é lido e vai para o valor', () => {
    const espiao = montar(5000, { lerTexto: lerQuilos, formatar, unidade: 'kg' });
    fireEvent.press(screen.getByRole('adjustable'));
    const entrada = screen.getByDisplayValue('5');
    fireEvent.changeText(entrada, '7,5');
    fireEvent(entrada, 'submitEditing');
    expect(espiao).toHaveBeenCalledWith(7500);
    expect(screen.queryByDisplayValue('7,5')).toBeNull(); // o campo fecha
    expect(screen.getByText('7,5')).toBeTruthy();
  });

  test('fora dos limites não muda e mostra o erro', () => {
    const espiao = montar(5000, { lerTexto: lerQuilos, formatar, unidade: 'kg' });
    fireEvent.press(screen.getByRole('adjustable'));
    const entrada = screen.getByDisplayValue('5');
    fireEvent.changeText(entrada, '11');
    fireEvent(entrada, 'submitEditing');
    expect(espiao).not.toHaveBeenCalled();
    expect(screen.getByText('Entre 0 e 10 kg')).toBeTruthy();
  });

  test('texto que não é número não muda o valor', () => {
    const espiao = montar(5000, { lerTexto: lerQuilos, formatar });
    fireEvent.press(screen.getByRole('adjustable'));
    const entrada = screen.getByDisplayValue('5');
    fireEvent.changeText(entrada, 'abc');
    fireEvent(entrada, 'submitEditing');
    expect(espiao).not.toHaveBeenCalled();
  });
});

describe('Campo numérico — área de toque', () => {
  test('os botões "+" e "−" têm alvo ≥ 48 (desenho + hitSlop)', () => {
    montar(5000);
    for (const botao of [mais(), menos()]) {
      const f = botao.props.hitSlop as number | Insets;
      const folga: Insets = typeof f === 'number' ? { top: f, bottom: f, left: f, right: f } : f;
      const filho = botao.children[0];
      const corpo = StyleSheet.flatten(typeof filho === 'string' ? {} : filho.props.style) as ViewStyle;
      expect((corpo.height as number) + (folga.top ?? 0) + (folga.bottom ?? 0)).toBeGreaterThanOrEqual(alvo.minimo);
      expect((corpo.width as number) + (folga.left ?? 0) + (folga.right ?? 0)).toBeGreaterThanOrEqual(alvo.minimo);
    }
  });

  test('o centro tocável tem altura mínima de 48', () => {
    montar(5000);
    const estilo = StyleSheet.flatten(screen.getByRole('adjustable').props.style) as ViewStyle;
    expect(estilo.minHeight).toBeGreaterThanOrEqual(alvo.minimo);
  });
});

/**
 * Revisão AE (C10; R1.14, R12.1): sem carga planejada nem histórico, o campo
 * vinha com 0 kg, que é "peso do corpo". Agora fica VAZIO ("—") até a pessoa
 * pôr um número, e o vazio nunca vira 0 sozinho.
 */
describe('Campo numérico — vazio', () => {
  test('mostra "—" e nenhum número', () => {
    montar(undefined, { formatar: (g) => String(g / 1000), unidade: 'kg' });
    expect(screen.getByText('—')).toBeTruthy();
    expect(screen.queryByText('0')).toBeNull();
  });

  test('o "−" fica desabilitado; o "+" começa do mínimo mais um passo', () => {
    const espiao = montar(undefined);
    expect(menos()).toBeDisabled();
    fireEvent.press(mais());
    expect(espiao).toHaveBeenLastCalledWith(2500);
  });

  test('o leitor de tela ouve "vazio", não "0"', () => {
    montar(undefined, { falar: (g) => `${g / 1000} quilos` });
    const centro = screen.getByRole('adjustable', { name: 'Carga' });
    expect(centro.props['aria-valuetext']).toBe('vazio');
    expect(centro.props['aria-valuenow']).toBeUndefined();
  });

  test('abrir o teclado e confirmar sem digitar continua vazio', () => {
    const espiao = montar(undefined, { lerTexto: (t) => (t.trim() ? Number(t) * 1000 : null) });
    fireEvent.press(screen.getByRole('adjustable', { name: 'Carga' }));
    const entrada = screen.getByDisplayValue('');
    act(() => {
      fireEvent(entrada, 'submitEditing');
    });
    expect(espiao).not.toHaveBeenCalled();
    expect(screen.queryByText(/Entre/)).toBeNull();
  });
});

// Agente AG (P11, pedido do AH): o número DIGITADO crescia sem o teto de ampliação que o número mostrado tem
// (numeroCarga: 1,5); com a fonte do sistema no máximo, o campo pulava de tamanho ao tocar para digitar.
test('o número em edição tem o mesmo teto de ampliação do número mostrado', () => {
  montar(5000, { lerTexto: (t: string) => Math.round(Number(t.replace(',', '.')) * 1000), formatar: (g: number) => String(g / 1000).replace('.', ',') });
  fireEvent.press(screen.getByRole('adjustable'));
  expect(screen.getByDisplayValue('5').props.maxFontSizeMultiplier).toBe(1.5);
});
