/**
 * O padrão de gravação das telas (agente AG, P11): se não deu para gravar,
 * o aviso rápido diz "Não deu para salvar." com "Tentar de novo", e o toque
 * grava DE NOVO com os mesmos dados (o que a pessoa digitou não se perde).
 * Antes, as telas do aluno chamavam `void gravar.…()` sem `catch`: a falha
 * virava promessa solta e a tela seguia como se tivesse salvo.
 */
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ProvedorDeTema } from '@/tema';
import { ErroDeArmazenamento } from '@/dados/erros';
import { ErroSemSinal } from '@/dados/repositorio';
import { ProvedorDeAvisoRapido } from './AvisoRapido';
import { useGravarComAviso } from './useGravarComAviso';

function Tela({ acao, aoTerminar }: { acao: (peso: number) => Promise<string> | string; aoTerminar?: (ok: boolean) => void }) {
  const { gravar, ocupado } = useGravarComAviso(acao);
  return (
    <Pressable accessibilityRole="button" onPress={() => void gravar(72450).then((r) => aoTerminar?.(r.ok))}>
      <Text>{ocupado ? 'Salvando' : 'Salvar peso'}</Text>
    </Pressable>
  );
}

function montar(acao: (peso: number) => Promise<string> | string, aoTerminar?: (ok: boolean) => void) {
  render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 393, height: 852 }, insets: { top: 59, left: 0, right: 0, bottom: 34 } }}>
      <ProvedorDeTema>
        <ProvedorDeAvisoRapido>
          <Tela acao={acao} aoTerminar={aoTerminar} />
        </ProvedorDeAvisoRapido>
      </ProvedorDeTema>
    </SafeAreaProvider>,
  );
}

const tocar = async (nome: string) => {
  await act(async () => {
    fireEvent.press(screen.getByRole('button', { name: nome }));
  });
};

test('falhou: aviso de erro com "Tentar de novo", que grava de novo com os MESMOS dados', async () => {
  const chamadas: number[] = [];
  let falhar = true;
  const terminou = jest.fn();
  montar(async (peso) => {
    chamadas.push(peso);
    if (falhar) throw new ErroDeArmazenamento('cheio');
    return 'ok';
  }, terminou);
  await tocar('Salvar peso');
  expect(terminou).toHaveBeenLastCalledWith(false);
  expect(screen.getByText('Não deu para salvar. O celular está sem espaço.')).toBeTruthy();
  falhar = false;
  await tocar('Tentar de novo');
  expect(chamadas).toEqual([72450, 72450]);
  expect(screen.queryByText('Não deu para salvar. O celular está sem espaço.')).toBeNull();
});

test('o erro síncrono (a série no SQLite) também vira aviso, e o sem sinal tem o texto dele', async () => {
  montar(() => {
    throw new ErroSemSinal();
  });
  await tocar('Salvar peso');
  expect(screen.getByText('Sem sinal. Isso precisa de internet.')).toBeTruthy();
});

test('deu certo: nenhum aviso de erro, e o segundo toque durante a gravação é ignorado', async () => {
  let soltar: () => void = () => {};
  const acao = jest.fn(() => new Promise<string>((r) => (soltar = () => r('ok'))));
  montar(acao);
  await tocar('Salvar peso');
  await tocar('Salvando');
  expect(acao).toHaveBeenCalledTimes(1);
  await act(async () => soltar());
  expect(screen.queryByText(/Não deu para salvar/)).toBeNull();
  expect(screen.getByText('Salvar peso')).toBeTruthy();
});

test('umPorVez: false — duas gravações seguidas (duas chaves trocadas rápido) gravam as duas', async () => {
  const gravadas: string[] = [];
  function Chaves() {
    const { gravar } = useGravarComAviso(async (c: string) => void gravadas.push(c), { umPorVez: false });
    return (
      <Pressable accessibilityRole="button" onPress={() => { void gravar('a'); void gravar('b'); }}>
        <Text>Duas chaves</Text>
      </Pressable>
    );
  }
  render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 393, height: 852 }, insets: { top: 59, left: 0, right: 0, bottom: 34 } }}>
      <ProvedorDeTema>
        <ProvedorDeAvisoRapido>
          <Chaves />
        </ProvedorDeAvisoRapido>
      </ProvedorDeTema>
    </SafeAreaProvider>,
  );
  await tocar('Duas chaves');
  expect(gravadas).toEqual(['a', 'b']);
});
