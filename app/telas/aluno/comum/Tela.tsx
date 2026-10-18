/**
 * Peças de MONTAGEM que as telas do aluno repetem, feitas só com os
 * componentes base (nenhum tamanho novo): a tela com rolagem e cabeçalho, a
 * coluna de 600 em tela larga, a seção com título, a linha de lista, o grupo
 * de linhas num cartão, a chave liga/desliga e o botão redondo sobre a foto.
 *
 * PARA PROMOVER (agente AA): `Chave` e `Linha` são candidatos a `componentes/`
 * (o mapa usa chave e linha de 56/72 em várias telas das duas visões).
 */
import { useScrollToTop } from '@react-navigation/native';
import { useRef, type ReactNode } from 'react';
import { Pressable, StyleSheet, Switch, View, type ScrollView, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar, Botao, Cabecalho, Cartao, Divisor, Icone, Texto, type AcaoDoCabecalho, type NomeDoIcone } from '@/componentes';
import { alvo, borda, espaco, layout, raio, SobreposicaoDeCores, useTema } from '@/tema';

// ---------------------------------------------------------------------------
// Tela com rolagem
// ---------------------------------------------------------------------------

export interface PropsDaTela {
  titulo?: string;
  subtitulo?: string;
  /** Raiz da aba: título grande que encolhe. Senão, o pequeno com voltar. */
  grande?: boolean;
  aoVoltar?: () => void;
  acao?: AcaoDoCabecalho | ReactNode;
  /** Sem cabeçalho (a tela começa com a foto). */
  semCabecalho?: boolean;
  children: ReactNode;
  /** Espaço entre os blocos; padrão 24 (seções). */
  vao?: number;
  /** Algo fixo embaixo, fora da rolagem (o botão principal de Séries). */
  rodape?: ReactNode;
  /** A primeira peça vai de borda a borda (foto no topo). */
  topoSangrado?: ReactNode;
}

export function TelaComRolagem({ titulo = '', subtitulo, grande, aoVoltar, acao, semCabecalho, children, vao = espaco[6], rodape, topoSangrado }: PropsDaTela) {
  const { cores } = useTema();
  const insets = useSafeAreaInsets();
  const rolagem = useSharedValue(0);
  const aoRolar = useAnimatedScrollHandler((e) => {
    rolagem.value = e.contentOffset.y;
  });
  const ref = useRef<ScrollView>(null);
  // tocar a aba ativa volta ao topo (componente 12, regra 2)
  useScrollToTop(ref as never);

  return (
    <View style={{ flex: 1, backgroundColor: cores.fundo }}>
      {!semCabecalho ? (
        <Cabecalho titulo={titulo} subtitulo={subtitulo} variante={grande ? 'grande' : 'pequeno'} rolagem={grande ? rolagem : undefined} aoVoltar={aoVoltar} acao={acao} larguraMaxima={layout.larguraMaximaConteudo} />
      ) : null}
      <Animated.ScrollView
        ref={ref as never}
        onScroll={aoRolar}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: espaco[8] + (semCabecalho && !rodape ? 0 : 0), paddingTop: semCabecalho && !topoSangrado ? insets.top + espaco[2] : 0 }}
      >
        {topoSangrado ? <Coluna sangrada>{topoSangrado}</Coluna> : null}
        <Coluna estilo={{ gap: vao, paddingTop: topoSangrado ? 0 : espaco[2] }}>{children}</Coluna>
      </Animated.ScrollView>
      {rodape ? (
        <View style={{ paddingTop: espaco[3], paddingBottom: espaco[3], backgroundColor: cores.fundo, borderTopWidth: borda.fina, borderTopColor: cores.borda }}>
          <Coluna>{rodape}</Coluna>
        </View>
      ) : null}
    </View>
  );
}

/** A coluna de conteúdo: margem 16 e, em tela larga, no máximo 600 no centro. */
export function Coluna({ children, estilo, sangrada }: { children: ReactNode; estilo?: StyleProp<ViewStyle>; sangrada?: boolean }) {
  return (
    <View style={[{ width: '100%', maxWidth: layout.larguraMaximaConteudo + (sangrada ? 0 : 2 * layout.margemLateral), alignSelf: 'center', paddingHorizontal: sangrada ? 0 : layout.margemLateral }, estilo]}>
      {children}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Seção
// ---------------------------------------------------------------------------

export function Secao({ titulo, lado, children, estilo }: { titulo?: string; lado?: ReactNode; children?: ReactNode; estilo?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ gap: espaco[3] }, estilo]}>
      {titulo ? (
        <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: espaco[3] }}>
          <Texto variante="titulo3" accessibilityRole="header" style={{ flexShrink: 1 }}>
            {titulo}
          </Texto>
          {typeof lado === 'string' ? (
            <Texto variante="corpoPequeno" cor="textoSecundario">
              {lado}
            </Texto>
          ) : (
            (lado ?? null)
          )}
        </View>
      ) : null}
      {children}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Sobre a foto: botão redondo de vidro escuro (voltar, menu, pausar)
// ---------------------------------------------------------------------------

export function BotaoSobreFoto({ icone, rotuloAcessivel, aoTocar }: { icone: NomeDoIcone; rotuloAcessivel: string; aoTocar: () => void }) {
  const { cores } = useTema();
  return (
    <SobreposicaoDeCores esquema="escuro" cores={{ vidroFundo: cores.vidroEscuroFixoFundo, vidroBorda: cores.vidroEscuroFixoBorda, vidroTexto: cores.vidroEscuroFixoTexto }}>
      <Botao variante="vidro" tamanho="icone" icone={icone} rotuloAcessivel={rotuloAcessivel} aoTocar={aoTocar} />
    </SobreposicaoDeCores>
  );
}

/** Altura mínima de um alvo (para quem monta um Pressable próprio). */
export const ALVO = alvo.minimo;

/** A fileira de cima da foto que começa a tela: desce a área segura (a foto passa por baixo da barra de status). */
export function TopoDaFoto({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: espaco[2], paddingTop: insets.top }}>{children}</View>;
}

/** Altura da foto do topo somada à área segura. */
export function useAlturaDoTopo(altura: number) {
  return altura + useSafeAreaInsets().top;
}
