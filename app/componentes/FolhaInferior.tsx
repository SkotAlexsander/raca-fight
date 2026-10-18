/**
 * Componente 14 — Folha inferior (sistema.css `.folha`; tokens.json › folha).
 *
 * Sobreposição `sobreposicao` na tela toda; painel na base, fundo
 * `superficieElevada`, cantos de cima em `raio.folha`, `sombra.3`; alça de
 * 32 × 4 em `borda` a 8 do topo; título `titulo2`; conteúdo; rodapé com os
 * botões em coluna (o primário embaixo); 16 + a área segura embaixo.
 *
 * - `curta` (confirmação, convite, ajuste): altura do conteúdo, até 90 %.
 * - `lista`: abre na MÉDIA (metade da tela); arrastar pela alça leva à GRANDE
 *   (a tela menos a área segura do topo e 8); arrastar para baixo da média fecha.
 * Fecha por: Cancelar (quem usa põe), toque na sobreposição, arrastar para
 * baixo e voltar do sistema. Abre subindo em `media`; reduzido: esmaece 160.
 *
 * No iPhone, a folha de LISTA pode ser a folha nativa (`presentation:
 * 'formSheet'` na rota, `OPCOES_DA_FOLHA_NATIVA` em telas/rotas.ts);
 * esta é a nossa, que vale nas duas plataformas e no navegador.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Modal, PanResponder, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { curva, duracao, esmaecer, espaco, folha, raio, useTema } from '@/tema';
import { Texto } from './Texto';

export interface PropsDaFolha {
  visivel: boolean;
  aoFechar: () => void;
  titulo?: string;
  children?: ReactNode;
  /** Botões do rodapé, em coluna (o primário por último, embaixo). */
  rodape?: ReactNode;
  tipo?: 'curta' | 'lista';
}

export function FolhaInferior({ visivel, aoFechar, titulo, children, rodape, tipo = 'curta' }: PropsDaFolha) {
  const { cores, sombras, reduzirMovimento } = useTema();
  const insets = useSafeAreaInsets();
  const { height: alturaDaTela } = useWindowDimensions();
  const [montada, setMontada] = useState(visivel);
  const [grande, setGrande] = useState(false);
  const entrada = useSharedValue(0); // 0 fechada · 1 aberta
  const arrasto = useSharedValue(0);

  const alturaMedia = alturaDaTela * folha.media;
  const alturaGrande = alturaDaTela - insets.top - folha.folgaTopoGrande;
  const alturaDaLista = grande ? alturaGrande : alturaMedia;

  useEffect(() => {
    if (visivel) {
      setMontada(true);
      setGrande(false);
      arrasto.value = 0;
      entrada.value = reduzirMovimento ? esmaecer(1) : withTiming(1, { duration: duracao.media, easing: curva.padrao });
    } else if (montada) {
      const fim = () => setMontada(false);
      entrada.value = reduzirMovimento
        ? withTiming(0, { duration: duracao.esmaecerReduzido }, (ok) => ok && runOnJS(fim)())
        : withTiming(0, { duration: duracao.media, easing: curva.saida }, (ok) => ok && runOnJS(fim)());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visivel]);

  // O gesto é criado UMA vez: criado a cada desenho, o redesenho da tela de trás no meio do arrasto
  // (o Modo treino redesenha a cada segundo) zerava o `dy` e a folha pulava de volta (agente AG).
  // Ele lê os valores deste desenho pela ref.
  const atual = useRef({ tipo, grande, alturaDaLista, alturaMedia, alturaGrande, aoFechar });
  atual.current = { tipo, grande, alturaDaLista, alturaMedia, alturaGrande, aoFechar };
  const gesto = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 4,
      onPanResponderMove: (_, g) => {
        arrasto.value = g.dy;
      },
      onPanResponderRelease: (_, g) => {
        const a = atual.current;
        const altura = a.tipo === 'lista' ? a.alturaDaLista : a.alturaMedia;
        if (a.tipo === 'lista' && !a.grande && g.dy < -altura * 0.15) {
          setGrande(true);
        } else if (g.dy > altura * 0.5) {
          a.aoFechar();
          return;
        } else if (a.tipo === 'lista' && a.grande && g.dy > (a.alturaGrande - a.alturaMedia) * 0.5) {
          setGrande(false);
        }
        arrasto.value = withTiming(0, { duration: duracao.media, easing: curva.padrao });
      },
      // outro gesto tomou o dedo (a lista rolou): a folha volta ao lugar, em vez de ficar meio arrastada
      onPanResponderTerminate: () => {
        arrasto.value = withTiming(0, { duration: duracao.media, easing: curva.padrao });
      },
    }),
  ).current;

  const estiloDaSobreposicao = useAnimatedStyle(() => ({ opacity: entrada.value }));
  const estiloDoPainel = useAnimatedStyle(() => {
    const desce = reduzirMovimento ? 0 : (1 - entrada.value) * 200;
    return { opacity: reduzirMovimento ? entrada.value : 1, transform: [{ translateY: Math.max(0, arrasto.value) + desce }] };
  });

  if (!montada) return null;
  return (
    <Modal transparent visible animationType="none" statusBarTranslucent onRequestClose={aoFechar}>
      <View style={{ flex: 1, justifyContent: 'flex-end', zIndex: 1 }} pointerEvents="box-none">
        <Animated.View
          accessibilityViewIsModal
          style={[
            {
              backgroundColor: cores.superficieElevada,
              borderTopLeftRadius: raio.folha,
              borderTopRightRadius: raio.folha,
              boxShadow: sombras.sombra3,
              paddingTop: espaco[2],
              paddingHorizontal: espaco[4],
              paddingBottom: espaco[4] + insets.bottom,
              gap: espaco[4],
              maxHeight: tipo === 'lista' ? alturaGrande : alturaDaTela * 0.9,
              minHeight: 160,
              height: tipo === 'lista' ? alturaDaLista : undefined,
            },
            estiloDoPainel,
          ]}
        >
          {/* a alça é só para o dedo: sem rótulo solto num bloco sem papel (axe: aria-prohibited-attr) */}
          <View {...gesto.panHandlers} style={{ paddingVertical: espaco[1], marginTop: -espaco[1] }}>
            <View style={{ width: folha.alca.largura, height: folha.alca.altura, borderRadius: raio.redondo, backgroundColor: cores.borda, alignSelf: 'center' }} />
            {titulo ? (
              <Texto variante="titulo2" accessibilityRole="header" style={{ paddingTop: espaco[2] }}>
                {titulo}
              </Texto>
            ) : null}
          </View>
          <View style={tipo === 'lista' ? { flex: 1 } : undefined}>{children}</View>
          {rodape ? <View style={{ gap: espaco[3] }}>{rodape}</View> : null}
        </Animated.View>
      </View>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: cores.sobreposicao, zIndex: 0 }, estiloDaSobreposicao]}>
        {/* DEPOIS do painel na ordem (e atrás dele pelo zIndex) e fora do teclado: ao abrir, o foco vai para o
            conteúdo da folha, não para este "Fechar" invisível (agente AG, pedido do AH). Teclado e leitor fecham
            pelo Cancelar da folha ou pelo Esc/voltar. */}
        <Pressable style={StyleSheet.absoluteFill} onPress={aoFechar} accessibilityRole="button" accessibilityLabel="Fechar" focusable={false} tabIndex={-1} />
      </Animated.View>
    </Modal>
  );
}
