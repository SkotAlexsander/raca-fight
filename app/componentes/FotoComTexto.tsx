/**
 * Componente 19 — Foto com texto (sistema.css `.foto-texto`; tokens.json › foto).
 *
 * A foto grande e escura com o texto por cima. É uma "ilha escura" IGUAL nos
 * dois temas: o claro não clareia a foto. Camadas, de baixo para cima:
 * 1. `foto.fundoSemFoto` (aparece antes da imagem; sem foto, é a ilha escura);
 * 2. a imagem cobrindo tudo, escurecida a `foto.escurecer` (0,72) — uma camada
 *    preta de 1 − 0,72 por cima dá exatamente o `brightness(0.72)` do mockup;
 * 3. o degradê (`foto.gradiente` no herói; luz lateral + `gradienteCapa` nas capas);
 * 4. o conteúdo, no pé, em `foto.texto`; botões de voltar e menu no topo.
 *
 * Dentro da foto o texto vira branco, a marca e o progresso viram o verde vivo
 * (`coresSobreFoto`). As alturas crescem com a fonte do sistema (`imagem.$cresce`).
 * Saturação 0,9 (`foto.saturacao`): fica de fora no celular (o filtro de
 * saturação do React Native é só do Android) — anotado em X-BASE.md.
 */
import type { ReactNode } from 'react';
import { Image, Pressable, StyleSheet, View, useWindowDimensions, type ImageSourcePropType, type StyleProp, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { borda, coresSobreFoto, espaco, foto, imagem, raio, SobreposicaoDeCores, useTema } from '@/tema';
import { DegradeLinearDoToken, DegradeRadialDoToken } from './Degrade';
import { usePressionado } from './usePressionado';

export type VarianteDaFoto = 'heroi' | 'baixo' | 'capa' | 'grade';

export interface PropsDaFotoComTexto {
  imagem?: ImageSourcePropType;
  /** O que a foto mostra ("Dois alunos fazem sparring no tatame"); vazio = decorativa. */
  descricao?: string;
  variante?: VarianteDaFoto;
  altura?: number;
  topo?: ReactNode;
  children?: ReactNode;
  aoTocar?: () => void;
  rotuloAcessivel?: string;
  escolhido?: boolean;
  estilo?: StyleProp<ViewStyle>;
}

const ALTURA: Record<VarianteDaFoto, number> = {
  heroi: imagem.heroi,
  baixo: imagem.heroiBaixo,
  capa: imagem.capaFoto,
  grade: imagem.capaGrade,
};

/**
 * A imagem cobre o cartão inteiro. `absoluteFill` sozinho não basta no
 * navegador: o `Image` do react-native-web põe a largura e a altura NATURAIS do
 * arquivo (358 da `-capa@1x`) quando o estilo não diz outra coisa, e essa
 * largura vence o `left/right: 0` — a 2040 o cartão de 600 ficava com a foto
 * de 358 e o resto na ilha escura. Com 100 % × 100 % explícitos ela estica
 * (o `resizeMode` vai como prop). No celular dá o mesmo que o `absoluteFill`.
 */
const ESTILO_DA_IMAGEM = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' } as const;

export function FotoComTexto({ imagem: fonte, descricao = '', variante = 'capa', altura, topo, children, aoTocar, rotuloAcessivel, escolhido, estilo }: PropsDaFotoComTexto) {
  const { cores, degrades } = useTema();
  const { fontScale } = useWindowDimensions();
  const { aoPressionar, aoSoltar, estiloDoCorpo } = usePressionado({ afundar: true });

  const heroi = variante === 'heroi' || variante === 'baixo';
  // max(340px, 21.25rem): cresce com a fonte do sistema, nunca encolhe
  const alturaFinal = (altura ?? ALTURA[variante]) * Math.max(1, fontScale);
  const forma: ViewStyle = heroi
    ? { borderBottomLeftRadius: raio.capa, borderBottomRightRadius: raio.capa }
    : { borderRadius: raio.capa };
  const padding = variante === 'grade' ? espaco[3] : espaco[5];

  const corpo = (
    <View style={[forma, { minHeight: alturaFinal, overflow: 'hidden', backgroundColor: cores.fotoFundoSemFoto }, estilo]}>
      {fonte ? (
        <>
          <Image
            source={fonte}
            resizeMode="cover"
            accessible={!!descricao}
            accessibilityLabel={descricao || undefined}
            accessibilityIgnoresInvertColors
            style={ESTILO_DA_IMAGEM}
          />
          <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: '#000', opacity: 1 - foto.escurecer }]} />
        </>
      ) : null}
      {heroi ? (
        <DegradeLinearDoToken degrade={degrades.foto} />
      ) : (
        <>
          <DegradeRadialDoToken degrade={degrades.fotoLuzLateral} />
          <DegradeLinearDoToken degrade={degrades.fotoCapa} />
        </>
      )}
      <SobreposicaoDeCores cores={coresSobreFoto(cores)}>
        <View style={{ flex: 1, minHeight: alturaFinal, justifyContent: topo ? 'space-between' : 'flex-end', gap: espaco[2], paddingTop: espaco[4], paddingHorizontal: padding, paddingBottom: padding }}>
          {topo ? <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: espaco[2] }}>{topo}</View> : null}
          <View style={{ gap: espaco[2] }}>{children}</View>
        </View>
      </SobreposicaoDeCores>
      {escolhido ? <View pointerEvents="none" style={[StyleSheet.absoluteFill, forma, { borderWidth: borda.media, borderColor: cores.viva }]} /> : null}
    </View>
  );

  if (!aoTocar) return corpo;
  return (
    <Pressable onPress={aoTocar} onPressIn={aoPressionar} onPressOut={aoSoltar} accessibilityRole="button" accessibilityLabel={rotuloAcessivel}>
      <Animated.View style={estiloDoCorpo}>{corpo}</Animated.View>
    </Pressable>
  );
}
