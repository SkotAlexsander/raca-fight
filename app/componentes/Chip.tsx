/**
 * Chip (componentes 4 e 17; sistema.css `.chip`).
 *
 * - tocável: desenho de 32 (`controle.chip`), área de toque de 48 por hitSlop,
 *   pílula, `corpoPequeno` 500, contorno 1 `textoSecundario`; selecionado vira
 *   verde vivo (`viva` + `vivaTexto`) com o check de 16.
 * - informativo (`info`): 24, `legenda`, fundo `fundo`, nunca tocável.
 * - `marca`: informativo em verde vivo ("Em uso").
 * Entre chips: 8 na linha e 16 entre linhas (a área de 48 não invade a de baixo).
 */
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import type { ReactNode } from 'react';
import { alvo, borda, controle, espaco, estiloDeTexto, raio, useTema } from '@/tema';
import { Icone, type NomeDoIcone } from './Icone';
import { Texto } from './Texto';
import { usePressionado } from './usePressionado';

export interface PropsDoChip {
  rotulo: string;
  variante?: 'tocavel' | 'info' | 'marca';
  selecionado?: boolean;
  desabilitado?: boolean;
  icone?: NomeDoIcone;
  aoTocar?: () => void;
}

export function Chip({ rotulo, variante = 'tocavel', selecionado = false, desabilitado = false, icone, aoTocar }: PropsDoChip) {
  const { cores } = useTema();
  const { aoPressionar, aoSoltar, estiloDoCorpo } = usePressionado();

  if (variante !== 'tocavel') {
    const marca = variante === 'marca';
    return (
      <View
        style={{
          minHeight: 24,
          paddingHorizontal: espaco[2],
          borderRadius: raio.pilula,
          backgroundColor: marca ? cores.viva : cores.fundo,
          flexDirection: 'row',
          alignItems: 'center',
          gap: espaco[1],
          alignSelf: 'flex-start',
        }}
      >
        {icone ? <Icone nome={icone} tamanho="pequeno" cor={marca ? cores.vivaTexto : cores.textoSecundario} /> : null}
        <Texto variante="legenda" style={{ color: marca ? cores.vivaTexto : cores.textoSecundario }} numberOfLines={1}>
          {rotulo}
        </Texto>
      </View>
    );
  }

  const corDoTexto = selecionado ? cores.vivaTexto : cores.texto;
  const folga = (alvo.minimo - controle.chip) / 2;
  return (
    <Pressable
      onPress={aoTocar}
      onPressIn={aoPressionar}
      onPressOut={aoSoltar}
      disabled={desabilitado}
      hitSlop={{ top: folga, bottom: folga }}
      accessibilityRole="button"
      accessibilityState={{ selected: selecionado, disabled: desabilitado }}
      // chip é um botão de escolher: na web o estado é `aria-pressed` (o `aria-selected` não vale em botão)
      aria-pressed={selecionado}
      aria-disabled={desabilitado}
      accessibilityLabel={rotulo}
      style={{ opacity: desabilitado ? cores.desabilitadoOpacidade : 1, alignSelf: 'flex-start' }}
    >
      <Animated.View
        style={[
          {
            minHeight: controle.chip,
            paddingHorizontal: espaco[3],
            borderRadius: raio.pilula,
            backgroundColor: selecionado ? cores.viva : cores.superficie,
            borderWidth: selecionado ? 0 : borda.fina,
            borderColor: cores.textoSecundario,
            flexDirection: 'row',
            alignItems: 'center',
            gap: espaco[1],
          },
          estiloDoCorpo,
        ]}
      >
        {selecionado ? <Icone nome="marcar" tamanho="pequeno" cor={corDoTexto} /> : icone ? <Icone nome={icone} tamanho="pequeno" cor={corDoTexto} /> : null}
        <Texto variante="corpoPequeno" style={{ color: corDoTexto, fontFamily: estiloDeTexto('legenda').estilo.fontFamily /* corpoPequeno em 500 */ }} numberOfLines={1}>
          {rotulo}
        </Texto>
      </Animated.View>
    </Pressable>
  );
}

/** Fileira de chips: 8 entre eles, 16 entre linhas. */
export function Chips({ children, estilo }: { children: ReactNode; estilo?: StyleProp<ViewStyle> }) {
  return <View style={[{ flexDirection: 'row', flexWrap: 'wrap', columnGap: espaco[2], rowGap: espaco[4] }, estilo]}>{children}</View>;
}
