/**
 * Revisão AN (P12, onda 4): os achados de tela da varredura de bugs, com os
 * dados de exemplo da Raça Fight (nomes fictícios), numa quinta às 19:50 de
 * Gravataí. Cada teste foi escrito antes da correção e falhava antes dela.
 */
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { useEffect, type ReactNode } from 'react';
import { Image, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { EstadoVazio, ProvedorDeAvisoRapido } from '@/componentes';
import { ProvedorDeDados, useExperimentais, useSessao } from '@/dados';
import { TelaSuaAcademia } from './aluno/perfil/TelaSuaAcademia';
import { TelaTreinos } from './aluno/TelaTreinos';
import { TelaCodigoDaEquipe } from './entrada/TelasDaEquipe';
import { TelaChamada } from './equipe/TelaChamada';
import { TelaNovaExperimental } from './equipe/TelasDasExperimentais';
import { ProvedorDeTema } from '@/tema';

const QUINTA_19H50 = new Date('2026-10-15T22:50:00Z');
let mockParametros: Record<string, string> = {};
const mockRouter = { push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: () => true };

jest.mock('@/dados/armazenamento/banco', () => {
  const { criarArmazenamentoEmMemoria } = jest.requireActual('@/dados/armazenamento/memoria');
  return { abrirArmazenamentoLocal: () => criarArmazenamentoEmMemoria() };
});
jest.mock('expo-sqlite', () => ({}));
jest.mock('@react-navigation/native', () => ({ ...jest.requireActual('@react-navigation/native'), useScrollToTop: () => {} }));
jest.mock('expo-audio', () => ({ useAudioPlayer: () => ({ play: jest.fn(), seekTo: jest.fn() }), setAudioModeAsync: jest.fn() }));
jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => mockParametros,
  usePathname: () => '/hoje',
  Redirect: () => null,
  Link: ({ children }: { children: ReactNode }) => children,
}));

function Entrar({ como, children }: { como: string; children: ReactNode }) {
  const { entrar, usuario, carregando } = useSessao();
  useEffect(() => {
    if (!usuario) void entrar(como);
  }, [usuario, entrar, como]);
  if (carregando || !usuario) return null;
  return <>{children}</>;
}

function Base({ children }: { children: ReactNode }) {
  return (
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, left: 0, right: 0, bottom: 34 } }}>
      <ProvedorDeTema>
        <ProvedorDeDados>
          <ProvedorDeAvisoRapido>{children}</ProvedorDeAvisoRapido>
        </ProvedorDeDados>
      </ProvedorDeTema>
    </SafeAreaProvider>
  );
}

const montar = (como: string, tela: ReactNode) =>
  render(
    <Base>
      <Entrar como={como}>{tela}</Entrar>
    </Base>,
  );

jest.setTimeout(30000);

beforeAll(() => {
  jest.useFakeTimers({ now: QUINTA_19H50, doNotFake: ['nextTick', 'setImmediate', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'queueMicrotask'] });
});
afterAll(() => jest.useRealTimers());
beforeEach(() => {
  mockRouter.back.mockClear();
  mockRouter.push.mockClear();
  mockRouter.replace.mockClear();
  try {
    globalThis.localStorage?.clear();
  } catch {
    // sem localStorage: a memória basta
  }
});

const MUSCULACAO = /treino livre|treinos prontos|personal|muscula|s[ée]ries|carga/i;

test('AN-4: tocar duas vezes em "Fechar" fecha a chamada uma vez só e volta UMA tela', async () => {
  mockParametros = { id: 'muay-thai-kids-qui-19@2026-10-15' };
  montar('usuario-diego', <TelaChamada />);
  fireEvent.press(await screen.findByTestId('fechar-chamada', {}, { timeout: 5000 }));
  const confirmar = await screen.findByTestId('confirmar-fechar-chamada');
  await act(async () => {
    fireEvent.press(confirmar);
    fireEvent.press(confirmar);
  });
  await act(async () => {});
  fireEvent.press(confirmar);
  await act(async () => {});
  expect(mockRouter.back).toHaveBeenCalledTimes(1);
});

test('AN-5: os estados vazios não usam as ilustrações verdes de academia de musculação (bancos, anilha)', () => {
  render(
    <ProvedorDeTema>
      <EstadoVazio ilustracao="nenhum-aluno" titulo="Nenhum aluno" />
      <EstadoVazio ilustracao="erro-carregar" titulo="Não deu" />
      <EstadoVazio ilustracao="historico-vazio" titulo="Vazio" />
    </ProvedorDeTema>,
  );
  expect(screen.UNSAFE_queryAllByType(Image)).toHaveLength(0);
  expect(screen.getAllByTestId('estado-vazio-icone', { includeHiddenElements: true })).toHaveLength(3);
});

test('AN-6: "Sua academia" com o pedido pendente não fala de treino livre nem de treinos prontos', async () => {
  montar('usuario-rita', <TelaSuaAcademia />);
  await screen.findByText('Cancelar o pedido', {}, { timeout: 5000 });
  expect(screen.queryAllByText(MUSCULACAO)).toHaveLength(0);
  expect(screen.getByText(/horários/)).toBeTruthy();
});

test('AN-7: o código da equipe pede "Recepção" ou "Professor" (o personal saiu com a musculação)', async () => {
  render(
    <Base>
      <TelaCodigoDaEquipe />
    </Base>,
  );
  const campo = await screen.findByLabelText('Código da equipe', {}, { timeout: 5000 });
  fireEvent.changeText(campo, 'T9K2WM');
  await waitFor(() => expect(screen.getByText('Professor')).toBeTruthy(), { timeout: 5000 });
  expect(screen.getByText('Recepção')).toBeTruthy();
  expect(screen.queryByText('Personal')).toBeNull();
  expect(screen.queryAllByText(MUSCULACAO)).toHaveLength(0);
});

test('AN-8: Treinos de quem ainda não tem faixa registrada não mostra "0 meses na faixa" nem "desde a última graduação"', async () => {
  // Elisa (fictícia): Muay Thai, sem graduação registrada
  montar('usuario-elisa', <TelaTreinos />);
  await screen.findByText('Sem graduação', {}, { timeout: 5000 });
  expect(screen.queryByText('Tempo na faixa')).toBeNull();
  expect(screen.queryByText('Aulas desde a última graduação')).toBeNull();
  expect(screen.getByText('Aulas desde o começo')).toBeTruthy();
});

test('AN-9: dois toques rápidos em "Marcar a experimental" marcam UMA experimental (antes eram duas, com dois interessados)', async () => {
  function Contagem() {
    const n = useExperimentais().data?.length;
    return n === undefined ? null : <ContagemTexto n={n} />;
  }
  function ContagemTexto({ n }: { n: number }) {
    return <Text testID="contagem-exp">{String(n)}</Text>;
  }
  montar(
    'usuario-simone',
    <>
      <TelaNovaExperimental />
      <Contagem />
    </>,
  );
  const antes = Number((await screen.findByTestId('contagem-exp', {}, { timeout: 5000 })).props.children);
  fireEvent.changeText(screen.getByLabelText('Nome'), 'Teo Exemplo');
  fireEvent.changeText(screen.getByLabelText('WhatsApp com DDD'), '(51) 90000-1234');
  fireEvent.press(screen.getByText('Boxe'));
  fireEvent.press(await screen.findByText('Hoje 21:00'));
  const botao = screen.getByTestId('salvar-experimental');
  await act(async () => {
    fireEvent.press(botao);
    fireEvent.press(botao);
  });
  await waitFor(() => expect(mockRouter.back).toHaveBeenCalled(), { timeout: 5000 });
  await act(async () => {});
  expect(Number(screen.getByTestId('contagem-exp').props.children)).toBe(antes + 1);
  expect(mockRouter.back).toHaveBeenCalledTimes(1);
});
