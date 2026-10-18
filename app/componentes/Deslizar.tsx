/**
 * Componente 21 — Deslizar para começar (refs 01 e 02; sistema.css `.deslizar`;
 * catálogo 4.10).
 *
 * Trilho em pílula de 56 com contorno 2 `progresso` (fundo `superficie`; sobre
 * foto ou vidro, transparente), botão redondo de 48 em `viva` com a seta e o
 * brilho `sombra.viva`, rótulo `corpoForte` no meio e três setas à direita.
 *
 * - O botão segue o dedo sem mola. Solto antes de 85 % (`deslizar.limiar`),
 *   volta na `mola.toque`; depois, vai ao fim na `mola.padrao`, vira `sucesso`
 *   e diz "Treino começou".
 * - A AÇÃO acontece no soltar, ANTES da animação terminar (regra 1).
 * - Tocar no botão também começa (WCAG 2.5.1); o leitor de tela lê o rótulo
 *   acessível ("Começar o Treino A").
 * - "Reduzir movimento": o botão não desliza; esmaece e a ação acontece.
 *
 * Gesto: PanResponder do React Native (sem react-native-gesture-handler, que o
 * catálogo cita como opção; decisão em docs/decisoes.md, 11/10/2026).
 */
import { useMemo, useRef, useState } from 'react';
import { PanResponder, Pressable, View, type LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { borda, deslizar, espaco, esmaecer, mola, raio, useTema, useVibrar } from '@/tema';
import { Icone } from './Icone';
import { Texto } from './Texto';

export interface PropsDoDeslizar {
  rotulo?: string;
  rotuloFeito?: string;
  /** O que o leitor de tela diz: "Começar o Treino A". */
  rotuloAcessivel: string;
  aoConcluir: () => void;
  /** Sobre foto ou vidro: o trilho fica transparente. */
  sobreFoto?: boolean;
}

export function Deslizar({ rotulo = 'Deslize para começar', rotuloFeito = 'Treino começou', rotuloAcessivel, aoConcluir, sobreFoto }: PropsDoDeslizar) {
  const { cores, sombras, reduzirMovimento } = useTema();
  const vibrar = useVibrar();
  const [feito, setFeito] = useState(false);
  const largura = useSharedValue(0);
  const x = useSharedValue(0);
  const opacidade = useSharedValue(1);
  const inicio = useRef(0);
  const feitoRef = useRef(false);

  const folga = espaco[1];
  const fim = () => Math.max(0, largura.value - deslizar.botao - 2 * folga);

  const concluir = () => {
    if (feitoRef.current) return;
    feitoRef.current = true;
    aoConcluir(); // o treino é criado no soltar, antes da animação
    vibrar('concluirTreino'); // impacto médio (catálogo 4.10)
    setFeito(true);
    if (reduzirMovimento) {
      opacidade.value = 0.4;
      opacidade.value = esmaecer(1);
      x.value = fim();
    } else {
      x.value = withSpring(fim(), mola.padrao);
    }
  };
  // O gesto é criado uma vez; ele chama SEMPRE o `concluir` deste desenho (com o `aoConcluir` atual).
  // Antes, guardava o do primeiro desenho: o rótulo dizia "Treino B" e o arrasto começava o A (agente AG).
  const concluirAtual = useRef(concluir);
  concluirAtual.current = concluir;

  const gesto = useMemo(
    () =>
      PanResponder.create({
        // o toque simples fica com o Pressable de dentro; o arrasto passa ao gesto
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, g) => !feitoRef.current && !reduzirMovimento && Math.abs(g.dx) > 4,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          inicio.current = x.value;
        },
        onPanResponderMove: (_, g) => {
          x.value = Math.max(0, Math.min(fim(), inicio.current + g.dx));
        },
        onPanResponderRelease: (_, g) => {
          const andou = Math.abs(g.dx) > 4;
          if (!andou) return concluirAtual.current(); // um toque no botão também começa
          if (x.value >= deslizar.limiar * fim()) concluirAtual.current();
          else x.value = withSpring(0, mola.toque);
        },
        onPanResponderTerminate: () => {
          x.value = withSpring(0, mola.toque);
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [reduzirMovimento],
  );

  const estiloDoBotao = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }], opacity: opacidade.value }));

  return (
    <View
      onLayout={(e: LayoutChangeEvent) => {
        largura.value = e.nativeEvent.layout.width;
      }}
      style={{
        minHeight: deslizar.altura,
        borderRadius: raio.pilula,
        borderWidth: borda.media,
        borderColor: cores.progresso,
        backgroundColor: sobreFoto ? 'transparent' : cores.superficie,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Texto variante="corpoForte" numberOfLines={1} style={{ paddingHorizontal: espaco[16] }}>
        {feito ? rotuloFeito : rotulo}
      </Texto>
      <View pointerEvents="none" style={{ position: 'absolute', right: espaco[5], flexDirection: 'row' }}>
        {[0.4, 0.7, 1].map((o, i) => (
          <View key={i} style={{ opacity: o, marginLeft: i === 0 ? 0 : -espaco[3] }}>
            <Icone nome="avancar" cor="progresso" />
          </View>
        ))}
      </View>
      <Animated.View
        {...gesto.panHandlers}
        style={[
          {
            position: 'absolute',
            left: folga - borda.media,
            top: (deslizar.altura - deslizar.botao) / 2 - borda.media,
            width: deslizar.botao,
            height: deslizar.botao,
            borderRadius: raio.redondo,
            backgroundColor: feito ? cores.sucesso : cores.viva,
            boxShadow: sombras.sombraViva,
          },
          estiloDoBotao,
        ]}
      >
        <Pressable
          onPress={concluir}
          accessibilityRole="button"
          accessibilityLabel={rotuloAcessivel}
          accessibilityState={{ disabled: feito }}
          aria-disabled={feito}
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        >
          <Icone nome={feito ? 'marcar' : 'avancar'} cor={feito ? cores.sucessoTexto : cores.vivaTexto} />
        </Pressable>
      </Animated.View>
    </View>
  );
}
