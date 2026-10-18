/**
 * O app da equipe com os dados de exemplo da Raça Fight (P12, agente AM2),
 * numa quinta-feira às 19:50 de Gravataí (a aula da hora é o Muay Thai Kids
 * das 19h, do professor Diego, fictício).
 *
 * Os achados do AS: o número de check-ins do Hoje é o MESMO da chamada; o
 * botão "Fechar a chamada" aparece; a quinta segue a grade real (sem o
 * Muay Thai das 21h, que é só segunda e quarta). E o dono que não dá aula
 * vê "Abra o app Admin"; o professor nunca vê valor em reais.
 */
import { act, render, screen, waitFor } from '@testing-library/react-native';
import { useEffect, type ReactNode } from 'react';
import { ProvedorDeAvisoRapido } from '@/componentes';
import { ProvedorDeDados, useSessao } from '@/dados';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ProvedorDeTema } from '@/tema';

const QUINTA_19H50 = new Date('2026-10-15T22:50:00Z');
let mockParametros: Record<string, string> = {};

// o aparelho do teste guarda na memória (sem SQLite nativo)
jest.mock('@/dados/armazenamento/banco', () => {
  const { criarArmazenamentoEmMemoria } = jest.requireActual('@/dados/armazenamento/memoria');
  return { abrirArmazenamentoLocal: () => criarArmazenamentoEmMemoria() };
});
jest.mock('expo-sqlite', () => ({}));
jest.mock('@react-navigation/native', () => ({ ...jest.requireActual('@react-navigation/native'), useScrollToTop: () => {} }));
jest.mock('expo-audio', () => ({
  useAudioPlayer: () => ({ play: jest.fn(), seekTo: jest.fn() }),
  setAudioModeAsync: jest.fn(),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
    canGoBack: () => true,
  }),
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

function montar(como: string, tela: ReactNode) {
  return render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 47, left: 0, right: 0, bottom: 34 },
      }}
    >
      <ProvedorDeTema>
        <ProvedorDeDados>
          <ProvedorDeAvisoRapido>
            <Entrar como={como}>{tela}</Entrar>
          </ProvedorDeAvisoRapido>
        </ProvedorDeDados>
      </ProvedorDeTema>
    </SafeAreaProvider>,
  );
}

beforeAll(() => {
  jest.useFakeTimers({
    now: QUINTA_19H50,
    doNotFake: ['nextTick', 'setImmediate', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'queueMicrotask'],
  });
});
afterAll(() => jest.useRealTimers());
beforeEach(() => {
  try {
    globalThis.localStorage?.clear();
  } catch {
    // sem localStorage no ambiente: o armazenamento cai na memória
  }
});

test('Hoje (professor): a aula da hora com o mesmo número de check-ins da chamada, e o botão de fechar', async () => {
  const { TelaHoje } = require('./TelaHoje') as typeof import('./TelaHoje');
  const { TelaChamada } = require('./TelaChamada') as typeof import('./TelaChamada');
  const hoje = montar('usuario-diego', <TelaHoje />);
  const numero = await screen.findByTestId('hoje-checkins', {}, { timeout: 5000 });
  const n = Number(numero.props.children);
  expect(screen.getAllByText(/Muay Thai Kids/).length).toBeGreaterThan(0);
  // quinta: o Muay Thai das 21h não existe (achado do AS)
  expect(screen.queryByText(/Muay Thai — noite 2/)).toBeNull();
  // nenhum valor financeiro no Hoje
  expect(screen.queryByText(/R\$/)).toBeNull();
  hoje.unmount();

  mockParametros = { id: 'muay-thai-kids-qui-19@2026-10-15' };
  montar('usuario-diego', <TelaChamada />);
  const contagem = await screen.findByTestId('grupo-checkins-contagem', {}, { timeout: 5000 });
  const texto = String(([] as unknown[]).concat(contagem.props.children).join(''));
  expect(texto).toMatch(new RegExp(` de ${n} confirmados$`));
  expect(screen.getByTestId('fechar-chamada')).toBeTruthy();
  expect(screen.queryByText(/R\$/)).toBeNull();
  await act(async () => {});
});

test('o dono que não dá aula vê "Abra o app Admin"', async () => {
  const { TelaAbraOAdmin } = require('./TelaAbraOAdmin') as typeof import('./TelaAbraOAdmin');
  montar('usuario-sergio', <TelaAbraOAdmin />);
  await waitFor(() => expect(screen.getByTestId('abra-o-admin')).toBeTruthy());
  await act(async () => {});
});
