/**
 * Componente 13 — Cabeçalho (sistema.css `.cabecalho`; catálogo 4.9).
 *
 * 56 + a área segura do topo (o fundo sobe por trás da barra de status). À
 * esquerda, voltar (desenho 40, toque 48) ou nada na raiz da aba; título
 * `titulo2` em uma linha; à direita, no MÁXIMO uma ação (duas vão para o menu ⋯).
 *
 * Variante `grande` (raiz das abas): 96 com o `titulo1` à esquerda, preso à
 * rolagem — nos primeiros 40 px (`movimento.rolagemTituloGrande`) ele encolhe
 * para 56, o título pequeno aparece (centralizado no iPhone, à esquerda no
 * Android) e a `sombra.1` surge. Com "reduzir movimento", sem escala: o
 * grande dá lugar ao pequeno por esmaecer.
 */
import type { ReactNode } from 'react';
import { Platform, View } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { espaco, estiloDeTexto, layout, movimento, tipografia, useTema } from '@/tema';
import { Botao } from './Botao';
import { Texto } from './Texto';
import type { NomeDoIcone } from './Icone';

export interface AcaoDoCabecalho {
  icone: NomeDoIcone;
  rotuloAcessivel: string;
  aoTocar: () => void;
}

export interface PropsDoCabecalho {
  titulo: string;
  /** Legenda acima do título (o nome da academia na visão da academia). */
  subtitulo?: string;
  aoVoltar?: () => void;
  /** Uma ação de ícone, ou um nó próprio (o chip de visão). */
  acao?: AcaoDoCabecalho | ReactNode;
  variante?: 'pequeno' | 'grande';
  /** A rolagem da tela (useAnimatedScrollHandler), para o título grande encolher. */
  rolagem?: SharedValue<number>;
  fundo?: 'fundo' | 'superficie';
  /** Falso quando o cabeçalho não está no topo da tela (catálogo). */
  comAreaSegura?: boolean;
  /** Alinha o cabeçalho à coluna de conteúdo em tela larga (ex.: layout.larguraMaximaConteudo). */
  larguraMaxima?: number;
}

const ALTURA_GRANDE = 96;
const LIMITE = movimento.rolagemTituloGrande;

function ehAcao(a: unknown): a is AcaoDoCabecalho {
  return !!a && typeof a === 'object' && 'icone' in a && 'aoTocar' in a;
}

export function Cabecalho({ titulo, subtitulo, aoVoltar, acao, variante = 'pequeno', rolagem, fundo = 'fundo', comAreaSegura = true, larguraMaxima }: PropsDoCabecalho) {
  const { cores, sombras, reduzirMovimento, celularPequeno } = useTema();
  const insets = useSafeAreaInsets();
  const topo = comAreaSegura ? insets.top : 0;
  const grande = variante === 'grande';
  const ios = Platform.OS === 'ios' || Platform.OS === 'web';

  const escalaPequena = tipografia.escala.titulo2.fontSize / estiloDeTexto('titulo1', celularPequeno).estilo.fontSize!;

  const estiloDoBloco = useAnimatedStyle(() => {
    if (!grande) return { height: layout.alturaCabecalho };
    const y = rolagem ? rolagem.value : 0;
    return { height: interpolate(y, [0, LIMITE], [ALTURA_GRANDE, layout.alturaCabecalho], Extrapolation.CLAMP) };
  });
  const estiloDoTituloGrande = useAnimatedStyle(() => {
    const y = rolagem ? rolagem.value : 0;
    const passou = interpolate(y, [0, LIMITE], [0, 1], Extrapolation.CLAMP);
    if (reduzirMovimento) return { opacity: y > LIMITE ? 0 : 1 };
    return { opacity: 1 - passou, transform: [{ scale: 1 - (1 - escalaPequena) * passou }] };
  });
  const estiloDoTituloPequeno = useAnimatedStyle(() => {
    if (!grande) return { opacity: 1 };
    const y = rolagem ? rolagem.value : 0;
    return { opacity: y >= LIMITE ? 1 : 0 };
  });
  const estiloDaSombra = useAnimatedStyle(() => {
    const y = rolagem ? rolagem.value : 0;
    return { opacity: y >= LIMITE ? 1 : 0 };
  });

  const voltar = aoVoltar ? (
    <Botao variante="neutro" tamanho="icone" icone="voltar" rotuloAcessivel="Voltar" aoTocar={aoVoltar} estilo={{ marginLeft: 0 }} />
  ) : null;
  const direita = ehAcao(acao) ? <Botao variante="neutro" tamanho="icone" icone={acao.icone} rotuloAcessivel={acao.rotuloAcessivel} aoTocar={acao.aoTocar} /> : (acao ?? null);

  // As cores do botão de ícone do cabeçalho são as do texto, não as da marca.
  return (
    <View style={{ paddingTop: topo, backgroundColor: fundo === 'superficie' ? cores.superficie : cores.fundo, zIndex: 1 }}>
      <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, boxShadow: sombras.sombra1 }, rolagem ? estiloDaSombra : { opacity: fundo === 'superficie' ? 1 : 0 }]} />
      <Animated.View style={[{ justifyContent: grande ? 'flex-end' : 'center', paddingHorizontal: aoVoltar ? espaco[2] : layout.margemLateral, overflow: 'hidden', width: '100%', maxWidth: larguraMaxima ? larguraMaxima + 2 * layout.margemLateral : undefined, alignSelf: 'center' }, estiloDoBloco]}>
        {/* barra de 56: voltar · título pequeno · ação */}
        <View style={[{ height: layout.alturaCabecalho, flexDirection: 'row', alignItems: 'center', gap: espaco[2] }, grande ? { position: 'absolute', top: 0, left: aoVoltar ? espaco[2] : layout.margemLateral, right: aoVoltar ? espaco[2] : layout.margemLateral } : null]}>
          {voltar}
          <Animated.View style={[{ flex: 1, minWidth: 0, alignItems: grande && ios ? 'center' : 'flex-start' }, estiloDoTituloPequeno]}>
            {subtitulo && !grande ? (
              <Texto variante="legenda" cor="textoSecundario" numberOfLines={1}>
                {subtitulo}
              </Texto>
            ) : null}
            <Texto variante="titulo2" numberOfLines={1} accessibilityRole="header">
              {titulo}
            </Texto>
          </Animated.View>
          {direita}
        </View>
        {grande ? (
          <Animated.View style={[{ paddingBottom: espaco[3], transformOrigin: 'left bottom' }, estiloDoTituloGrande]}>
            {subtitulo ? (
              <Texto variante="legenda" cor="textoSecundario" numberOfLines={1}>
                {subtitulo}
              </Texto>
            ) : null}
            <Texto variante="titulo1" numberOfLines={2} accessibilityRole="header">
              {titulo}
            </Texto>
          </Animated.View>
        ) : null}
      </Animated.View>
    </View>
  );
}
