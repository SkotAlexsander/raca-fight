/**
 * Revisão AB (P11): o relógio do cronômetro redesenhava QUATRO vezes por
 * segundo tudo o que lê o relógio (o Modo treino inteiro, com a foto
 * desfocada, o vidro e os campos), embora o número na tela mude uma vez por
 * segundo. Agora ele só avisa quando a LEITURA muda (o segundo, a fase, o
 * estado, o "acabando"), e para quando o cronômetro para.
 */
import { act, renderHook } from '@testing-library/react-native';
import { criarDescanso, iniciar, ler } from '@/dominio/cronometro';
import { useRelogioDoCronometro } from './relogio';

beforeEach(() => jest.useFakeTimers({ now: new Date('2026-10-14T10:00:00-03:00') }));
afterEach(() => jest.useRealTimers());

test('descanso de 10 s: no máximo um redesenho por segundo, e nenhum depois do fim', () => {
  const c = iniciar(criarDescanso(10)!, Date.now());
  let redesenhos = 0;
  const { result } = renderHook(() => {
    redesenhos += 1;
    return useRelogioDoCronometro(c);
  });
  redesenhos = 0;
  // de 250 em 250 ms, cada passo no seu act (como o relógio de verdade: um redesenho por tique)
  for (let i = 0; i < 42; i += 1) {
    act(() => {
      jest.advanceTimersByTime(250);
    });
  }
  expect(ler(c, result.current[0]).estado).toBe('terminado');
  expect(redesenhos).toBeLessThanOrEqual(11);
  expect(redesenhos).toBeGreaterThanOrEqual(10);

  // parado, o relógio não anda mais
  redesenhos = 0;
  for (let i = 0; i < 20; i += 1) {
    act(() => {
      jest.advanceTimersByTime(250);
    });
  }
  expect(redesenhos).toBe(0);
});

test('o número na tela anda segundo a segundo, sem pular nenhum', () => {
  const c = iniciar(criarDescanso(5)!, Date.now());
  const vistos: number[] = [];
  const { result } = renderHook(() => useRelogioDoCronometro(c));
  for (let i = 0; i < 24; i += 1) {
    act(() => {
      jest.advanceTimersByTime(250);
    });
    const s = ler(c, result.current[0]).segundosNaTela;
    if (vistos.at(-1) !== s) vistos.push(s);
  }
  expect(vistos).toEqual([5, 4, 3, 2, 1, 0]);
});
