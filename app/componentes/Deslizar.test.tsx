/**
 * Deslizar para começar: o arrasto além de 85 % chama `aoConcluir` UMA vez no
 * soltar; o arrasto curto não chama; o toque (o que o leitor de tela faz)
 * também começa.
 *
 * O gesto é o PanResponder do React Native. O teste passa pela mesma sequência
 * do sistema de responder (moveShouldSetResponderCapture → moveShouldSetResponder
 * → grant → move… → release), com um `touchHistory` de um dedo, igual ao que o
 * ResponderTouchHistoryStore monta no aparelho.
 */
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { deslizar, espaco, ProvedorDeTema } from '@/tema';
import { Deslizar } from './Deslizar';

/** O nó do renderizador de teste (o react-test-renderer não traz tipos aqui). */
type No = { type: unknown; props: Record<string, any> };
const acharHost = (teste: (n: No) => boolean): No => (screen.UNSAFE_root as unknown as { findAll: (f: (n: No) => boolean) => No[] }).findAll((n) => typeof n.type === 'string' && teste(n))[0];

const LARGURA = 358; // coluna do celular de 393
const FIM = LARGURA - deslizar.botao - 2 * espaco[1];

function montar() {
  const aoConcluir = jest.fn();
  render(
    <ProvedorDeTema>
      <Deslizar rotuloAcessivel="Começar o Treino A" aoConcluir={aoConcluir} />
    </ProvedorDeTema>,
  );
  // o trilho mede a própria largura no onLayout
  const trilho = acharHost((n) => typeof n.props.onLayout === 'function');
  fireEvent(trilho as never, 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: LARGURA, height: deslizar.altura } } });
  const botao = acharHost((n) => typeof n.props.onResponderMove === 'function');
  return { aoConcluir, botao };
}

/** Um dedo no `touchHistory`, como o do React Native. */
function dedo(xInicial: number) {
  let t = 1;
  const toque = {
    touchActive: true,
    startPageX: xInicial,
    startPageY: 0,
    startTimeStamp: t,
    currentPageX: xInicial,
    currentPageY: 0,
    currentTimeStamp: t,
    previousPageX: xInicial,
    previousPageY: 0,
    previousTimeStamp: t,
  };
  const touchHistory = { numberActiveTouches: 1, indexOfSingleActiveTouch: 0, mostRecentTimeStamp: t, touchBank: [toque] };
  const evento = () => ({ nativeEvent: { touches: toque.touchActive ? [{ pageX: toque.currentPageX, pageY: 0 }] : [], changedTouches: [], pageX: toque.currentPageX, pageY: 0, timestamp: t }, touchHistory });
  return {
    evento,
    ir(x: number) {
      t += 16;
      toque.previousPageX = toque.currentPageX;
      toque.previousTimeStamp = toque.currentTimeStamp;
      toque.currentPageX = x;
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

/** Arrasta de 24 até 24 + dx em passos de 20 px e solta. */
function arrastar(botao: No, dx: number) {
  const d = dedo(24);
  let pegou = false;
  // os primeiros movimentos: o sistema pergunta se o gesto quer o responder
  for (let x = 24 + 5; !pegou && x <= 24 + Math.max(dx, 5); x += 5) {
    const e = d.ir(x);
    botao.props.onMoveShouldSetResponderCapture(e);
    pegou = botao.props.onMoveShouldSetResponder(e);
    if (pegou) act(() => void botao.props.onResponderGrant(e));
  }
  if (!pegou) return;
  for (let x = 24 + 20; x <= 24 + dx; x += 20) act(() => void botao.props.onResponderMove(d.ir(x)));
  act(() => void botao.props.onResponderMove(d.ir(24 + dx)));
  act(() => void botao.props.onResponderRelease(d.soltar()));
}

describe('Deslizar', () => {
  test(`arrastar além de ${deslizar.limiar * 100} % chama aoConcluir uma vez, no soltar`, () => {
    const { aoConcluir, botao } = montar();
    const d = dedo(24);
    // pega o gesto
    let e = d.ir(34);
    botao.props.onMoveShouldSetResponderCapture(e);
    expect(botao.props.onMoveShouldSetResponder(e)).toBe(true);
    act(() => void botao.props.onResponderGrant(e));
    // arrasta até o fim sem soltar: nada acontece ainda
    for (let x = 54; x <= 34 + FIM; x += 20) act(() => void botao.props.onResponderMove(d.ir(x)));
    act(() => void botao.props.onResponderMove(d.ir(34 + FIM)));
    expect(aoConcluir).not.toHaveBeenCalled();
    // solta: a ação sai
    act(() => void botao.props.onResponderRelease(d.soltar()));
    expect(aoConcluir).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Treino começou')).toBeTruthy();
  });

  test('o limiar é 85 % do curso: um pouco acima conclui', () => {
    const { aoConcluir, botao } = montar();
    // o grant zera o dx depois dos primeiros 5 px; o curso conta do grant em diante
    arrastar(botao, Math.ceil(deslizar.limiar * FIM) + 5 + 2);
    expect(aoConcluir).toHaveBeenCalledTimes(1);
  });

  test('arrasto curto (abaixo de 85 %) não chama e o botão volta', () => {
    const { aoConcluir, botao } = montar();
    arrastar(botao, Math.floor(deslizar.limiar * FIM) - 20);
    expect(aoConcluir).not.toHaveBeenCalled();
    expect(screen.getByText('Deslize para começar')).toBeTruthy();
  });

  test('depois de concluído, outro arrasto não chama de novo', () => {
    const { aoConcluir, botao } = montar();
    arrastar(botao, FIM + 20);
    arrastar(botao, FIM + 20);
    expect(aoConcluir).toHaveBeenCalledTimes(1);
  });

  // Agente AG (P11): o PanResponder era criado uma vez (useMemo em [reduzirMovimento]) e guardava o
  // `aoConcluir` do PRIMEIRO desenho. Na aba Treinos, o "Treino A" sugerido antes de o histórico
  // carregar virava "Treino B" no rótulo, mas o arrasto começava o A.
  test('o arrasto chama o aoConcluir ATUAL, não o do primeiro desenho', () => {
    const antigo = jest.fn();
    const atual = jest.fn();
    const arvore = (f: () => void) => (
      <ProvedorDeTema>
        <Deslizar rotuloAcessivel="Começar o Treino" aoConcluir={f} />
      </ProvedorDeTema>
    );
    render(arvore(antigo));
    screen.rerender(arvore(atual));
    const trilho = acharHost((n) => typeof n.props.onLayout === 'function');
    fireEvent(trilho as never, 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: LARGURA, height: deslizar.altura } } });
    arrastar(acharHost((n) => typeof n.props.onResponderMove === 'function'), FIM + 20);
    expect(antigo).not.toHaveBeenCalled();
    expect(atual).toHaveBeenCalledTimes(1);
  });

  test('a alternativa acessível: tocar no botão (o "ativar" do leitor de tela) começa', () => {
    const { aoConcluir } = montar();
    const botao = screen.getByRole('button', { name: 'Começar o Treino A' });
    fireEvent.press(botao);
    expect(aoConcluir).toHaveBeenCalledTimes(1);
    fireEvent.press(botao);
    expect(aoConcluir).toHaveBeenCalledTimes(1); // um treino só
  });
});
