/**
 * Aviso rápido com "Desfazer": o toque chama a ação UMA vez e o aviso some;
 * sem toque, o aviso some sozinho no tempo de vida e a ação não é chamada.
 */
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { duracao, ProvedorDeTema } from '@/tema';
import { ProvedorDeAvisoRapido, useAvisoRapido, type DadosDoAviso } from './AvisoRapido';

function Disparador({ aviso }: { aviso: DadosDoAviso }) {
  const { mostrar } = useAvisoRapido();
  return (
    <Pressable accessibilityRole="button" onPress={() => mostrar(aviso)}>
      <Text>Apagar série</Text>
    </Pressable>
  );
}

function montar(aviso: DadosDoAviso) {
  render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 393, height: 852 }, insets: { top: 59, left: 0, right: 0, bottom: 34 } }}>
      <ProvedorDeTema>
        <ProvedorDeAvisoRapido>
          <Disparador aviso={aviso} />
        </ProvedorDeAvisoRapido>
      </ProvedorDeTema>
    </SafeAreaProvider>,
  );
  fireEvent.press(screen.getByRole('button', { name: 'Apagar série' }));
}

beforeEach(() => jest.useFakeTimers());
afterEach(() => {
  act(() => {
    jest.runOnlyPendingTimers();
  });
  jest.useRealTimers();
});

test('tocar em "Desfazer" chama a ação uma vez e o aviso some', () => {
  const desfazer = jest.fn();
  montar({ texto: 'Série apagada', acao: { rotulo: 'Desfazer', aoTocar: desfazer } });
  expect(screen.getByText('Série apagada')).toBeTruthy();

  fireEvent.press(screen.getByRole('button', { name: 'Desfazer' }));
  expect(desfazer).toHaveBeenCalledTimes(1);
  act(() => {
    jest.advanceTimersByTime(duracao.rapida + 50); // a saída (8 px, `rapida`)
  });
  expect(screen.queryByText('Série apagada')).toBeNull();
  expect(screen.queryByRole('button', { name: 'Desfazer' })).toBeNull();

  // o tempo de vida que sobrou não chama a ação de novo
  act(() => {
    jest.advanceTimersByTime(duracao.toast * 2);
  });
  expect(desfazer).toHaveBeenCalledTimes(1);
});

test(`sem toque, some sozinho em ${duracao.toast} ms e a ação NÃO é chamada`, () => {
  const desfazer = jest.fn();
  montar({ texto: 'Série apagada', acao: { rotulo: 'Desfazer', aoTocar: desfazer } });
  act(() => {
    jest.advanceTimersByTime(duracao.toast - 100);
  });
  expect(screen.getByText('Série apagada')).toBeTruthy();
  act(() => {
    jest.advanceTimersByTime(100 + duracao.rapida + 50);
  });
  expect(screen.queryByText('Série apagada')).toBeNull();
  expect(desfazer).not.toHaveBeenCalled();
});

test('erro fica 8 s', () => {
  montar({ texto: 'Não salvou', tipo: 'erro' });
  act(() => {
    jest.advanceTimersByTime(duracao.toast + 500);
  });
  expect(screen.getByText('Não salvou')).toBeTruthy();
  act(() => {
    jest.advanceTimersByTime(8000 - duracao.toast + duracao.rapida);
  });
  expect(screen.queryByText('Não salvou')).toBeNull();
});

test('com o dedo em cima o tempo pausa; ao soltar recomeça a contar', () => {
  montar({ texto: 'Série apagada', acao: { rotulo: 'Desfazer', aoTocar: () => {} } });
  const aviso = screen.getByRole('alert');
  fireEvent(aviso, 'pressIn');
  act(() => {
    jest.advanceTimersByTime(duracao.toast * 3);
  });
  expect(screen.getByText('Série apagada')).toBeTruthy();
  fireEvent(aviso, 'pressOut');
  act(() => {
    jest.advanceTimersByTime(duracao.toast + duracao.rapida + 50);
  });
  expect(screen.queryByText('Série apagada')).toBeNull();
});
