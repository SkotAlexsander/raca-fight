/**
 * Componente 17 — Auxiliares: Avatar, Divisor, Cartão de número e Esqueleto
 * (sistema.css `.avatar`, `.divisor`, `.numero-cartao`, `.esqueleto`).
 */
import { useEffect, useState, type ReactNode } from 'react';
import { StyleSheet, View, type DimensionValue, type LayoutChangeEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { cancelAnimation, FadeIn, FadeOut, ReduceMotion, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { atraso, borda, curva, duracao, espaco, estiloDeTexto, movimento, raio, useTema } from '@/tema';
import { Texto } from './Texto';

/** Iniciais (até 2 letras) sobre `marcaSuave`, ou foto. 32 lista compacta · 40 lista · 64 perfil. */
export function Avatar({ nome, tamanho = 40 }: { nome: string; tamanho?: 32 | 40 | 64 }) {
  const { cores } = useTema();
  const iniciais = nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toLocaleUpperCase('pt-BR'))
    .join('');
  return (
    <View accessible={false} style={{ width: tamanho, height: tamanho, borderRadius: raio.redondo, backgroundColor: cores.marcaSuave, alignItems: 'center', justifyContent: 'center' }}>
      <Texto variante={tamanho === 64 ? 'titulo3' : 'legenda'} style={tamanho === 64 ? undefined : { fontFamily: estiloDeTexto('titulo1').estilo.fontFamily }}>
        {iniciais}
      </Texto>
    </View>
  );
}

/** Linha de 1 px `borda`. `recuo`: a partir do texto (16 + avatar + 12). */
export function Divisor({ recuo = 0 }: { recuo?: number }) {
  const { cores } = useTema();
  return <View style={{ height: borda.fina, backgroundColor: cores.borda, marginLeft: recuo }} />;
}

/** Cartão de número: rótulo `legenda` em cima, número `numeroMedio` tabular, unidade `legenda`. Sem dado: "—". */
export function CartaoDeNumero({ rotulo, valor, unidade, apoio }: { rotulo: string; valor?: string; unidade?: string; apoio?: ReactNode }) {
  const { cores } = useTema();
  return (
    <View style={{ flex: 1, minWidth: 104, minHeight: 80, padding: espaco[3], borderRadius: raio.medio, backgroundColor: cores.superficie, justifyContent: 'space-between', gap: espaco[1] }}>
      <Texto variante="legenda" cor="textoSecundario">
        {rotulo}
      </Texto>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: espaco[1] }}>
        <Texto variante="numeroMedio" cor={valor ? 'texto' : 'textoSecundario'}>
          {valor ?? '—'}
        </Texto>
        {valor && unidade ? (
          <Texto variante="legenda" cor="textoSecundario">
            {unidade}
          </Texto>
        ) : null}
      </View>
      {!valor ? (
        <Texto variante="legenda" cor="textoSecundario">
          Não informado
        </Texto>
      ) : (
        apoio ?? null
      )}
    </View>
  );
}

/**
 * Esqueleto (catálogo 4.6): só aparece depois de 300 ms (`atraso.esqueleto`);
 * blocos de `borda` a 60 % com o raio do que imitam; uma faixa de brilho
 * atravessa em 1400 ms, NO MÁXIMO 3 vezes, e para. Sem brilho com movimento
 * reduzido. Entra e sai por esmaecimento em `media`.
 */
export function Esqueleto({ largura = '100%', altura = 16, raioDoBloco = raio.pequeno }: { largura?: DimensionValue; altura?: number; raioDoBloco?: number }) {
  const { cores, reduzirMovimento } = useTema();
  const [visivel, setVisivel] = useState(false);
  const [larguraMedida, setLarguraMedida] = useState(0);
  const x = useSharedValue(0);

  useEffect(() => {
    const t = setTimeout(() => setVisivel(true), atraso.esqueleto);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    if (!visivel || reduzirMovimento || larguraMedida === 0) return;
    x.value = -larguraMedida;
    x.value = withRepeat(withTiming(larguraMedida, { duration: duracao.passadaEsqueleto, easing: curva.constante, reduceMotion: ReduceMotion.Never }), movimento.passadasEsqueleto, false);
    return () => cancelAnimation(x);
  }, [visivel, reduzirMovimento, larguraMedida, x]);

  const estiloDoBrilho = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  if (!visivel) return <View style={{ width: largura, height: altura }} />;
  return (
    <Animated.View
      entering={FadeIn.duration(duracao.media)}
      exiting={FadeOut.duration(duracao.media)}
      onLayout={(e: LayoutChangeEvent) => setLarguraMedida(e.nativeEvent.layout.width)}
      style={{ width: largura, height: altura, borderRadius: raioDoBloco, overflow: 'hidden' }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View style={[StyleSheet.absoluteFill, { backgroundColor: cores.borda, opacity: 0.6 }]} />
      {!reduzirMovimento ? (
        <Animated.View style={[StyleSheet.absoluteFill, estiloDoBrilho]}>
          <LinearGradient colors={['transparent', cores.brilhoEsqueleto, 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}
