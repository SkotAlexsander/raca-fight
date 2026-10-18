/**
 * Botão: a área de toque nunca fica abaixo de 48 (tamanho do desenho +
 * hitSlop dos dois lados), o toque chama `aoTocar` e o desabilitado não chama.
 */
import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet, type Insets, type ViewStyle } from 'react-native';
import { alvo, ProvedorDeTema } from '@/tema';
import { Botao, type TamanhoDoBotao, type VarianteDoBotao } from './Botao';

const TAMANHOS: TamanhoDoBotao[] = ['padrao', 'grande', 'pequeno', 'icone', 'circular'];
const VARIANTES: VarianteDoBotao[] = ['primario', 'secundario', 'perigo', 'perigoDiscreto', 'texto', 'neutro', 'vidro', 'plus'];

function montar(elemento: React.ReactElement) {
  return render(<ProvedorDeTema>{elemento}</ProvedorDeTema>);
}

/** O alvo de toque (o Pressable) e o corpo desenhado (o primeiro filho). */
function medir() {
  const alvoDeToque = screen.getByRole('button');
  const folga = (alvoDeToque.props.hitSlop ?? {}) as Insets;
  const corpo = StyleSheet.flatten(alvoDeToque.children[0] && typeof alvoDeToque.children[0] !== 'string' ? alvoDeToque.children[0].props.style : {}) as ViewStyle;
  const externo = StyleSheet.flatten(alvoDeToque.props.style) as ViewStyle;
  const altura = (corpo.height ?? corpo.minHeight) as number;
  const largura = corpo.width as number | undefined;
  return {
    alturaEfetiva: altura + (folga.top ?? 0) + (folga.bottom ?? 0),
    larguraEfetiva: largura === undefined ? undefined : largura + (folga.left ?? 0) + (folga.right ?? 0),
    corpo,
    externo,
  };
}

describe('Botão — área de toque ≥ 48', () => {
  for (const tamanho of TAMANHOS) {
    for (const variante of VARIANTES) {
      test(`${tamanho} / ${variante}`, () => {
        const redondo = tamanho === 'icone' || tamanho === 'circular';
        montar(
          <Botao
            tamanho={tamanho}
            variante={variante}
            rotulo={redondo ? undefined : 'Salvar'}
            icone={redondo ? 'fechar' : undefined}
            rotuloAcessivel={redondo ? 'Fechar' : undefined}
            aoTocar={() => {}}
          />,
        );
        const { alturaEfetiva, larguraEfetiva, corpo, externo } = medir();
        expect(alturaEfetiva).toBeGreaterThanOrEqual(alvo.minimo);
        if (redondo) {
          // o redondo tem largura fixa: a folga horizontal completa os 48
          expect(larguraEfetiva).toBeGreaterThanOrEqual(alvo.minimo);
        } else {
          // o de rótulo ocupa a coluna inteira (stretch) ou tem largura mínima de 96
          expect(externo.alignSelf === 'stretch' || (corpo.minWidth as number) >= alvo.minimo).toBe(true);
        }
      });
    }
  }

  test('intrínseco (largura do conteúdo) nunca fica abaixo de 96', () => {
    montar(<Botao rotulo="OK" variante="texto" tamanho="pequeno" intrinseco aoTocar={() => {}} />);
    const { alturaEfetiva, corpo } = medir();
    expect(alturaEfetiva).toBeGreaterThanOrEqual(alvo.minimo);
    expect(corpo.minWidth).toBeGreaterThanOrEqual(96);
  });
});

describe('Botão — toque', () => {
  test('aoTocar dispara uma vez por toque', () => {
    const aoTocar = jest.fn();
    montar(<Botao rotulo="Salvar" aoTocar={aoTocar} />);
    fireEvent.press(screen.getByRole('button', { name: 'Salvar' }));
    expect(aoTocar).toHaveBeenCalledTimes(1);
  });

  test('o botão só de ícone usa o rótulo acessível e também dispara', () => {
    const aoTocar = jest.fn();
    montar(<Botao tamanho="icone" variante="neutro" icone="fechar" rotuloAcessivel="Fechar" aoTocar={aoTocar} />);
    fireEvent.press(screen.getByRole('button', { name: 'Fechar' }));
    expect(aoTocar).toHaveBeenCalledTimes(1);
  });

  test('desabilitado não dispara e avisa o leitor de tela', () => {
    const aoTocar = jest.fn();
    montar(<Botao rotulo="Salvar" desabilitado aoTocar={aoTocar} />);
    const botao = screen.getByRole('button', { name: 'Salvar' });
    fireEvent.press(botao);
    expect(aoTocar).not.toHaveBeenCalled();
    expect(botao).toBeDisabled();
  });

  test('carregando não dispara', () => {
    const aoTocar = jest.fn();
    montar(<Botao rotulo="Salvar" carregando aoTocar={aoTocar} />);
    fireEvent.press(screen.getByRole('button', { name: 'Salvar' }));
    expect(aoTocar).not.toHaveBeenCalled();
  });
});
