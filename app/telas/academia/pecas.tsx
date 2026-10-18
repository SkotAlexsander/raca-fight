/**
 * Peças da visão da academia, montadas com os componentes base e o
 * `sistema.css` / `novas.css` do mockup: a tela com cabeçalho e coluna de 600,
 * a lista agrupada (`.lista` + `.linha`), o título de seção (`.secao__titulo`),
 * o medidor (`.p-medidor`), o quadro de número (`.p-quadro`) e o gráfico de
 * barras dos 7 dias (`.p-grafico`, com "Ver em tabela").
 *
 * Lista, Linha, Medidor, Quadro e GraficoDeBarras valem para o app inteiro:
 * estão em docs/revisao/Z-ACADEMIA.md para o AA promover a `componentes/`.
 */
import { Children, Fragment, isValidElement, useState, type ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Botao, Cabecalho, Icone, Texto, usePressionado, type AcaoDoCabecalho, type NomeDoIcone, type PapelDeCor } from '@/componentes';
import { borda, espaco, estiloDeTexto, layout, raio, useTema } from '@/tema';

const BOLD = estiloDeTexto('titulo1').estilo.fontFamily;
const SEMIBOLD = estiloDeTexto('titulo2').estilo.fontFamily;

/** A coluna de conteúdo: 600 no meio em tela larga (X-BASE, pendência para a onda 2). */
export function Coluna({ children, gap = espaco[6] }: { children: ReactNode; gap?: number }) {
  return <View style={{ width: '100%', maxWidth: layout.larguraMaximaConteudo, alignSelf: 'center', gap }}>{children}</View>;
}

/**
 * Tela da academia: cabeçalho (grande nas raízes das abas, pequeno com voltar
 * nas de dentro) e a coluna que rola. `topo` entra antes da coluna, de borda a
 * borda (a foto do painel).
 */
export function TelaDaAcademia({
  titulo,
  subtitulo,
  grande,
  aoVoltar,
  acao,
  children,
  topo,
  semCabecalho,
  rodape,
}: {
  titulo: string;
  subtitulo?: string;
  grande?: boolean;
  aoVoltar?: () => void;
  acao?: AcaoDoCabecalho | ReactNode;
  children: ReactNode;
  topo?: ReactNode;
  semCabecalho?: boolean;
  /** Botão fixo no pé (Enviar para o aluno). */
  rodape?: ReactNode;
}) {
  const { cores } = useTema();
  const insets = useSafeAreaInsets();
  const rolagem = useSharedValue(0);
  const aoRolar = useAnimatedScrollHandler((e) => {
    rolagem.value = e.contentOffset.y;
  });
  return (
    <View style={{ flex: 1, backgroundColor: cores.fundo }}>
      {semCabecalho ? null : (
        <Cabecalho titulo={titulo} subtitulo={subtitulo} variante={grande ? 'grande' : 'pequeno'} rolagem={grande ? rolagem : undefined} aoVoltar={aoVoltar} acao={acao} larguraMaxima={layout.larguraMaximaConteudo} />
      )}
      <Animated.ScrollView
        // na web, a área que rola precisa receber o foco do teclado quando não tem nada tocável dentro (axe: scrollable-region-focusable; agente AH)
        {...(Platform.OS === 'web' ? { focusable: true } : {})}
        onScroll={aoRolar}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: topo ? 0 : layout.margemLateral, paddingTop: topo ? 0 : espaco[2], paddingBottom: espaco[8] }}
      >
        {topo}
        <View style={{ paddingHorizontal: topo ? layout.margemLateral : 0 }}>
          <Coluna>{children}</Coluna>
        </View>
      </Animated.ScrollView>
      {rodape ? (
        <View style={{ paddingHorizontal: layout.margemLateral, paddingTop: espaco[3], paddingBottom: espaco[3] + (semCabecalho ? insets.bottom : 0), backgroundColor: cores.fundo, borderTopWidth: borda.fina, borderTopColor: cores.borda }}>
          <Coluna gap={espaco[3]}>{rodape}</Coluna>
        </View>
      ) : null}
    </View>
  );
}

/** Seção com título `titulo3` e, à direita, a contagem ou uma ação. */
export function Secao({ titulo, contagem, acao, children, apoio }: { titulo?: string; contagem?: string | number; acao?: ReactNode; children: ReactNode; apoio?: string }) {
  return (
    <View style={{ gap: espaco[3] }}>
      {titulo ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: espaco[2] }}>
          <Texto variante="titulo3" accessibilityRole="header" style={{ flex: 1 }}>
            {titulo}
          </Texto>
          {contagem !== undefined ? (
            <Texto variante="corpoPequeno" cor="textoSecundario">
              {contagem}
            </Texto>
          ) : null}
          {acao}
        </View>
      ) : null}
      {apoio ? (
        <Texto variante="corpoPequeno" cor="textoSecundario">
          {apoio}
        </Texto>
      ) : null}
      {children}
    </View>
  );
}

/** Rótulo pequeno de seção (`corpo-pequeno texto-secundario`), como "Objetivo e restrições". */
export function Rotulo({ children }: { children: ReactNode }) {
  return (
    <Texto variante="corpoPequeno" cor="textoSecundario">
      {children}
    </Texto>
  );
}

/** A frase fixa de privacidade dos números do dono (R6.7). */
export function Privacidade({ texto }: { texto: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: espaco[2], alignItems: 'flex-start' }}>
      <Icone nome="cadeado" tamanho="pequeno" cor="textoSecundario" />
      <Texto variante="corpoPequeno" cor="textoSecundario" style={{ flex: 1 }}>
        {texto}
      </Texto>
    </View>
  );
}
