/**
 * Folha inferior: o arrasto pela alça (agente AG, P11).
 *
 * O PanResponder era criado de novo a CADA desenho. Se a tela de trás
 * redesenha no meio do arrasto (o Modo treino redesenha uma vez por segundo
 * no descanso), o gesto novo começa com `dy` zerado e só conta o que o dedo
 * andou DEPOIS do redesenho: a folha pulava de volta para cima no meio do
 * arrasto e o "arrastar para baixo fecha" não fechava. O teste passa pela
 * sequência do sistema de responder, como o do `Deslizar`.
 */
import { act, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ProvedorDeTema } from '@/tema';
import { FolhaInferior } from './FolhaInferior';

type No = { type: unknown; props: Record<string, any> };
const acharHost = (teste: (n: No) => boolean): No => (screen.UNSAFE_root as unknown as { findAll: (f: (n: No) => boolean) => No[] }).findAll((n) => typeof n.type === 'string' && teste(n))[0];

/** Um dedo vertical no `touchHistory`, como o do React Native. */
function dedo(yInicial: number) {
  let t = 1;
  const toque = {
    touchActive: true,
    startPageX: 100,
    startPageY: yInicial,
    startTimeStamp: t,
    currentPageX: 100,
    currentPageY: yInicial,
    currentTimeStamp: t,
    previousPageX: 100,
    previousPageY: yInicial,
    previousTimeStamp: t,
  };
  const touchHistory = { numberActiveTouches: 1, indexOfSingleActiveTouch: 0, mostRecentTimeStamp: t, touchBank: [toque] };
  const evento = () => ({ nativeEvent: { touches: toque.touchActive ? [{ pageX: 100, pageY: toque.currentPageY }] : [], changedTouches: [], pageX: 100, pageY: toque.currentPageY, timestamp: t }, touchHistory });
  return {
    ir(y: number) {
      t += 16;
      toque.previousPageY = toque.currentPageY;
      toque.previousTimeStamp = toque.currentTimeStamp;
      toque.currentPageY = y;
      toque.currentTimeStamp = t;
      touchHistory.mostRecentTimeStamp = t;
      return evento();
    },
    soltar() {
      t += 16;
      toque.touchActive = false;
      touchHistory.numberActiveTouches = 0;
      touchHistory.mostRecentTimeStamp = t;
      return evento();
    },
  };
}

const alca = () => acharHost((n) => typeof n.props.onMoveShouldSetResponder === 'function');

describe('FolhaInferior', () => {
  test('a tela redesenhar no meio do arrasto não zera o arrasto: arrastar além da metade fecha', () => {
    const aoFechar = jest.fn();
    const arvore = (segundo: number) => (
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 393, height: 852 }, insets: { top: 59, left: 0, right: 0, bottom: 34 } }}>
      <ProvedorDeTema>
        <FolhaInferior visivel aoFechar={aoFechar} titulo="Treino de hoje">
          <Text>{`descanso ${segundo}`}</Text>
        </FolhaInferior>
      </ProvedorDeTema>
      </SafeAreaProvider>
    );
    render(arvore(60));
    const d = dedo(100);
    // pega o gesto e desce quase tudo
    let e = d.ir(110);
    const antes = alca();
    antes.props.onMoveShouldSetResponderCapture?.(e);
    expect(antes.props.onMoveShouldSetResponder(e)).toBe(true);
    act(() => void antes.props.onResponderGrant(e));
    for (let y = 150; y <= 1000; y += 50) act(() => void alca().props.onResponderMove(d.ir(y)));
    // o relógio do descanso redesenha a tela de trás
    screen.rerender(arvore(59));
    // mais 20 px e solta: ~900 px no total, bem além da metade da folha
    e = d.ir(1020);
    act(() => void alca().props.onResponderMove(e));
    act(() => void alca().props.onResponderRelease(d.soltar()));
    expect(aoFechar).toHaveBeenCalledTimes(1);
  });

  test('arrasto curto não fecha, mesmo com redesenho no meio (controle)', () => {
    const aoFechar = jest.fn();
    render(
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 393, height: 852 }, insets: { top: 59, left: 0, right: 0, bottom: 34 } }}>
      <ProvedorDeTema>
        <FolhaInferior visivel aoFechar={aoFechar} titulo="Fechar o treino">
          <Text>conteúdo</Text>
        </FolhaInferior>
      </ProvedorDeTema>
      </SafeAreaProvider>,
    );
    const d = dedo(100);
    const e = d.ir(110);
    alca().props.onMoveShouldSetResponderCapture?.(e);
    alca().props.onMoveShouldSetResponder(e);
    act(() => void alca().props.onResponderGrant(e));
    act(() => void alca().props.onResponderMove(d.ir(130)));
    act(() => void alca().props.onResponderRelease(d.soltar()));
    expect(aoFechar).not.toHaveBeenCalled();
  });
});

// Pedido do AH (P11): ao abrir, o foco caía no "Fechar" invisível da sobreposição (o primeiro elemento);
// e a alça era um bloco com rótulo e sem papel (axe: aria-prohibited-attr).
describe('FolhaInferior — foco e leitor de tela', () => {
  test('a sobreposição não recebe o foco do teclado, e a alça não tem rótulo solto', () => {
    render(
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 393, height: 852 }, insets: { top: 59, left: 0, right: 0, bottom: 34 } }}>
        <ProvedorDeTema>
          <FolhaInferior visivel aoFechar={() => {}} titulo="Fechar o treino">
            <Text>conteúdo</Text>
          </FolhaInferior>
        </ProvedorDeTema>
      </SafeAreaProvider>,
    );
    const fechar = screen.getByRole('button', { name: 'Fechar' });
    expect(fechar.props.focusable).toBe(false);
    expect(fechar.props.tabIndex).toBe(-1);
    expect(alca().props.accessibilityLabel).toBeUndefined();
  });
});
