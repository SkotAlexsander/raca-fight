/**
 * Cartão (sistema.css `.cartao`): fundo `superficie`, raio `raio.cartao` (24),
 * padding 16, `sombra.2` (no claro, 6 camadas a 5 %; no escuro, contorno de
 * 1 px e um fio de luz em cima).
 *
 * Tocável, ele AFUNDA (catálogo 4.5): 0,98, desce 1 px, perde a sombra e
 * ganha a camada de `texto` a 8 %/12 %; volta na `mola.toque`. A sombra mora
 * numa View por baixo e só a opacidade dela anima (mais barato que animar
 * `boxShadow`, igual nas duas plataformas).
 *
 * `atual`: o único cartão que salta (`sombra.atual`; no escuro, o halo).
 * `plus`: borda esquerda de 4 em `plus` (refeição, dieta).
 * `escolhido`: contorno 2 `marca` (o treino em uso).
 */
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { borda, espaco, raio, useTema } from '@/tema';
import { usePressionado } from './usePressionado';

export interface PropsDoCartao {
  children: ReactNode;
  aoTocar?: () => void;
  atual?: boolean;
  plus?: boolean;
  escolhido?: boolean;
  desabilitado?: boolean;
  /** Padding interno; padrão 16. */
  padding?: number;
  raioDoCartao?: number;
  rotuloAcessivel?: string;
  estilo?: StyleProp<ViewStyle>;
  testID?: string;
}

export function Cartao({ children, aoTocar, atual, plus, escolhido, desabilitado, padding = espaco[4], raioDoCartao = raio.cartao, rotuloAcessivel, estilo, testID }: PropsDoCartao) {
  const { cores, sombras } = useTema();
  const { aoPressionar, aoSoltar, estiloDoCorpo, estiloDaCamada, estiloDaSombra } = usePressionado({ afundar: true });

  const sombra = atual ? sombras.sombraAtual : sombras.sombra2;
  const forma: ViewStyle = { borderRadius: raioDoCartao };
  const conteudo = (
    <>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, forma, { boxShadow: sombra, backgroundColor: cores.superficie }, aoTocar ? estiloDaSombra : null]} />
      <View
        style={[
          forma,
          {
            backgroundColor: cores.superficie,
            padding,
            overflow: 'hidden',
            borderLeftWidth: plus ? 4 : 0,
            borderLeftColor: cores.plus,
          },
          estilo,
        ]}
      >
        {children}
        {aoTocar ? (
          <View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: cores.camadaToque }]}>
            <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: cores.texto }, estiloDaCamada]} />
          </View>
        ) : null}
      </View>
      {escolhido ? <View pointerEvents="none" style={[StyleSheet.absoluteFill, forma, { borderWidth: borda.media, borderColor: cores.marca }]} /> : null}
    </>
  );

  if (!aoTocar) {
    return (
      <View testID={testID} style={{ opacity: desabilitado ? cores.desabilitadoOpacidade : 1 }}>
        {conteudo}
      </View>
    );
  }
  return (
    <Pressable
      testID={testID}
      onPress={aoTocar}
      onPressIn={aoPressionar}
      onPressOut={aoSoltar}
      disabled={desabilitado}
      accessibilityRole="button"
      accessibilityLabel={rotuloAcessivel}
      style={{ opacity: desabilitado ? cores.desabilitadoOpacidade : 1 }}
    >
      <Animated.View style={estiloDoCorpo}>{conteudo}</Animated.View>
    </Pressable>
  );
}

