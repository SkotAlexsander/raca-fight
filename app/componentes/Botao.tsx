/**
 * Componente 1 — Botão (02-COMPONENTES.md; sistema.css `.botao`).
 *
 * Pílula (`raio.botao`), rótulo `corpoForte` 16. O desenho é o do grupo
 * `controle` (primário 48, secundário/pequeno 40, ícone 40, circular 56) e a
 * área de toque nunca fica abaixo de 48: o que falta vira `hitSlop` invisível
 * (regra de proporção 1.8.0: tamanho visual ≠ área de toque).
 *
 * Variantes: primario (verde vivo `viva` + `vivaTexto`, uma por tela) ·
 * secundario (contorno 2 `textoSecundario`) · perigo · perigoDiscreto · texto ·
 * neutro (só o ícone na cor do texto: voltar, menu, limpar) · vidro (sobre
 * foto) · plus (dourado, só no convite do Plus).
 * Carregando: o rótulo some, o indicador de 24 aparece e a largura não muda.
 */
import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { alvo, borda, controle, espaco, raio, useTema } from '@/tema';
import { Icone, type NomeDoIcone } from './Icone';
import { Texto } from './Texto';
import { usePressionado } from './usePressionado';

export type VarianteDoBotao = 'primario' | 'secundario' | 'perigo' | 'perigoDiscreto' | 'texto' | 'neutro' | 'vidro' | 'plus';
export type TamanhoDoBotao = 'padrao' | 'grande' | 'pequeno' | 'icone' | 'circular';

export interface PropsDoBotao {
  rotulo?: string;
  aoTocar?: () => void;
  variante?: VarianteDoBotao;
  tamanho?: TamanhoDoBotao;
  icone?: NomeDoIcone;
  /** Largura do conteúdo (mínimo 96), em vez de 100 % da coluna. */
  intrinseco?: boolean;
  desabilitado?: boolean;
  carregando?: boolean;
  /** O brilho do verde vivo (`sombra.viva`), uma vez por tela. */
  brilho?: boolean;
  /** Obrigatório quando o botão é só ícone. */
  rotuloAcessivel?: string;
  estilo?: StyleProp<ViewStyle>;
  testID?: string;
}

const ALTURA: Record<TamanhoDoBotao, number> = {
  padrao: controle.primario,
  grande: controle.primario,
  pequeno: controle.secundario,
  icone: controle.icone,
  circular: controle.maximo,
};
const PADDING: Record<TamanhoDoBotao, number> = { padrao: espaco[5], grande: espaco[6], pequeno: espaco[4], icone: 0, circular: 0 };

export function Botao({
  rotulo,
  aoTocar,
  variante = 'primario',
  tamanho = 'padrao',
  icone,
  intrinseco = false,
  desabilitado = false,
  carregando = false,
  brilho = false,
  rotuloAcessivel,
  estilo,
  testID,
}: PropsDoBotao) {
  const { cores, sombras } = useTema();
  const { aoPressionar, aoSoltar, estiloDoCorpo, estiloDaCamada } = usePressionado();

  // secundário e texto têm 40 de desenho mesmo no tamanho padrão (sistema.css)
  const altura = variante === 'secundario' || variante === 'texto' ? Math.min(ALTURA[tamanho], controle.secundario) : ALTURA[tamanho];
  const redondo = tamanho === 'icone' || tamanho === 'circular';
  const padding = variante === 'texto' && !redondo ? espaco[3] : PADDING[tamanho];

  const cor = {
    primario: { fundo: cores.viva, texto: cores.vivaTexto, contorno: undefined, camada: cores.vivaTexto },
    secundario: { fundo: 'transparent', texto: cores.texto, contorno: cores.textoSecundario, camada: cores.texto },
    perigo: { fundo: cores.erro, texto: cores.erroTexto, contorno: undefined, camada: cores.texto },
    perigoDiscreto: { fundo: 'transparent', texto: cores.erro, contorno: cores.erro, camada: cores.texto },
    texto: { fundo: 'transparent', texto: cores.marca, contorno: undefined, camada: cores.texto },
    neutro: { fundo: 'transparent', texto: cores.texto, contorno: undefined, camada: cores.texto },
    vidro: { fundo: cores.vidroFundo, texto: cores.vidroTexto, contorno: cores.vidroBorda, camada: cores.vidroTexto },
    plus: { fundo: cores.plus, texto: cores.plusTexto, contorno: undefined, camada: cores.plusTexto },
  }[variante];
  const larguraDoContorno = variante === 'vidro' ? borda.fina : borda.media;

  // Área de toque mínima de 48 (44 pt é o piso do iOS): o que falta vira hitSlop.
  const folgaV = Math.max(0, (alvo.minimo - altura) / 2);
  const folgaH = redondo ? folgaV : 0;

  const corpo: ViewStyle = {
    minHeight: altura,
    height: redondo ? altura : undefined,
    width: redondo ? altura : undefined,
    minWidth: intrinseco && !redondo ? 96 : undefined,
    paddingHorizontal: padding,
    borderRadius: raio.botao,
    backgroundColor: cor.fundo,
    borderWidth: cor.contorno ? larguraDoContorno : 0,
    borderColor: cor.contorno,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: espaco[2],
    overflow: 'hidden',
    boxShadow: brilho ? sombras.sombraViva : undefined,
  };

  return (
    <Pressable
      testID={testID}
      onPress={desabilitado || carregando ? undefined : aoTocar}
      onPressIn={aoPressionar}
      onPressOut={aoSoltar}
      disabled={desabilitado || carregando}
      hitSlop={{ top: folgaV, bottom: folgaV, left: folgaH, right: folgaH }}
      accessibilityRole="button"
      accessibilityLabel={rotuloAcessivel ?? rotulo}
      accessibilityState={{ disabled: desabilitado, busy: carregando }}
      aria-disabled={!!desabilitado}
      aria-busy={!!carregando}
      style={[
        { opacity: desabilitado ? cores.desabilitadoOpacidade : 1 },
        redondo || intrinseco ? { alignSelf: 'flex-start' } : { alignSelf: 'stretch' },
        estilo,
      ]}
    >
      <Animated.View style={[corpo, estiloDoCorpo]}>
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: 0.08 }]}>
          <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: cor.camada }, estiloDaCamada]} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco[2], opacity: carregando ? 0 : 1 }}>
          {icone ? <Icone nome={icone} cor={cor.texto} /> : null}
          {rotulo && !redondo ? (
            <Texto variante="corpoForte" style={{ color: cor.texto }} numberOfLines={1}>
              {rotulo}
            </Texto>
          ) : null}
        </View>
        {carregando ? (
          <View pointerEvents="none" style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
            <ActivityIndicator size="small" color={cor.texto} />
          </View>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}
