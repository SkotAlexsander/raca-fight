/**
 * Comemoração da GRADUAÇÃO (mapa de luta, Parte B; F20.1, passo 4): o dia da
 * faixa ou do grau. Cor cheia no vermelho vivo, nos dois temas: o círculo
 * cresce e o check se desenha; depois, a faixa desenhada com os graus,
 * "Faixa azul, 4º grau.", a data e quem graduou. Sem confete, sem exclamação.
 * A graduação já foi GRAVADA pelo professor; o aluno só a vê aqui.
 * "Reduzir movimento": tudo esmaece em 160 ms.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ScrollView, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeInDown, ReduceMotion, useAnimatedProps, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { Botao, Texto } from '@/componentes';
import { descreverGraduacao } from '@/dominio/graduacao/graduacao';
import { atraso, duracao, espaco, estiloDeTexto, layout, mola, movimento, SobreposicaoDeCores, tokens, useTema } from '@/tema';
import { FaixaDesenhada } from '../luta/pecas';
import { nomeDaModalidade, nomeDoProfessor, primeiroNome, useLutaDoAluno } from '../luta/dados';

const CaminhoAnimado = Animated.createAnimatedComponent(Path);
const CHECK = tokens.comemoracao.check;
const COMPRIMENTO_DO_CHECK = 68;
const dataBR = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;

export function TelaComemoracao() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { cores, reduzirMovimento } = useTema();
  const luta = useLutaDoAluno();
  const g = luta.graduacoes.find((x) => x.id === id);

  const escala = useSharedValue(reduzirMovimento ? 1 : movimento.escalaInicialComemoracao);
  const opacidade = useSharedValue(0);
  const traco = useSharedValue(1);
  useEffect(() => {
    if (reduzirMovimento) {
      opacidade.value = withTiming(1, { duration: duracao.esmaecerReduzido, reduceMotion: ReduceMotion.Never });
      traco.value = 0;
      return;
    }
    opacidade.value = withTiming(1, { duration: duracao.rapida, reduceMotion: ReduceMotion.Never });
    escala.value = withSpring(1, { ...mola.padrao, reduceMotion: ReduceMotion.Never });
    traco.value = withDelay(duracao.rapida, withTiming(0, { duration: duracao.lenta, easing: Easing.out(Easing.cubic), reduceMotion: ReduceMotion.Never }));
  }, [reduzirMovimento, escala, opacidade, traco]);
  const estiloDoCirculo = useAnimatedStyle(() => ({ opacity: opacidade.value, transform: [{ scale: escala.value }] }));
  const propsDoTraco = useAnimatedProps(() => ({ strokeDashoffset: traco.value * COMPRIMENTO_DO_CHECK }));
  const entra = (i: number) =>
    reduzirMovimento
      ? FadeIn.duration(duracao.esmaecerReduzido).reduceMotion(ReduceMotion.Never)
      : FadeInDown.delay(duracao.lenta + i * atraso.escalonamento).duration(duracao.media).withInitialValues({ opacity: 0, transform: [{ translateY: movimento.deslocamentoEntrada }] }).reduceMotion(ReduceMotion.Never);

  const sobreViva = { texto: cores.vivaTexto, textoSecundario: cores.vivaTexto, marca: cores.vivaTexto };
  const pronto = () => router.replace('/inicio');
  const sistema = g ? luta.luta?.sistemas.find((s) => s.id === g.sistemaId) : undefined;
  const nivel = sistema?.niveis.find((n) => n.id === g?.nivelId);
  const ficha = g ? luta.fichas.find((f) => f.alunoId === g.alunoId) : undefined;
  const por = g ? (g.graduadoPorNome ?? nomeDoProfessor(luta.equipe, g.graduadoPorId)) : null;

  return (
    <View style={{ flex: 1, backgroundColor: cores.viva }}>
      <SobreposicaoDeCores cores={sobreViva}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + espaco[8], paddingBottom: insets.bottom + espaco[4] }}>
          <View style={{ flex: 1, width: '100%', maxWidth: layout.larguraMaximaConteudo + 2 * layout.margemLateral, alignSelf: 'center', paddingHorizontal: layout.margemLateral, gap: espaco[4] }}>
            <Animated.View style={[{ alignSelf: 'center', marginTop: espaco[6] }, estiloDoCirculo]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <Svg width={CHECK} height={CHECK} viewBox="0 0 112 112">
                <Circle cx={56} cy={56} r={56} fill={cores.vivaTexto} />
                <CaminhoAnimado d="M33 58l15 15 32-34" fill="none" stroke={cores.viva} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${COMPRIMENTO_DO_CHECK}`} animatedProps={propsDoTraco} />
              </Svg>
            </Animated.View>
            {g && sistema ? (
              <>
                <Animated.View entering={entra(0)} style={{ alignSelf: 'center' }}>
                  <FaixaDesenhada cores={nivel?.cores ?? []} graus={g.grau} comPonteira={!!sistema.palavraDoGrau} rotuloAcessivel={descreverGraduacao(sistema, g.nivelId, g.grau)} />
                </Animated.View>
                <Animated.View entering={entra(1)}>
                  <Texto variante="tituloEntrada" alinhar="center" accessibilityRole="header" style={{ fontFamily: estiloDeTexto('numeroGigante').estilo.fontFamily }}>
                    {descreverGraduacao(sistema, g.nivelId, g.grau)}.
                  </Texto>
                </Animated.View>
                <Animated.View entering={entra(2)}>
                  <Texto variante="corpoForte" alinhar="center">
                    {[ficha && ficha.alunoId !== luta.usuario?.id ? primeiroNome(ficha.nome) : null, nomeDaModalidade(luta.luta, g.modalidadeId), dataBR(g.data), por ? `por ${por}` : null].filter(Boolean).join(' · ')}
                  </Texto>
                </Animated.View>
                {g.observacao ? (
                  <Animated.View entering={entra(3)}>
                    <Texto variante="corpo" alinhar="center">
                      “{g.observacao}”
                    </Texto>
                  </Animated.View>
                ) : null}
              </>
            ) : (
              <Texto variante="titulo2" alinhar="center">
                Nenhuma graduação nova agora.
              </Texto>
            )}
            <View style={{ flex: 1 }} />
            <SobreposicaoDeCores cores={{ viva: cores.vivaTexto, vivaTexto: cores.viva }}>
              <Botao variante="primario" rotulo="Pronto" aoTocar={pronto} />
            </SobreposicaoDeCores>
          </View>
        </ScrollView>
      </SobreposicaoDeCores>
    </View>
  );
}
