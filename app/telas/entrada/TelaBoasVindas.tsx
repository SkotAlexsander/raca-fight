/**
 * Abertura → Boas-vindas (F13.1 e F13.2; mockups/entrada.html, quadros A1–A3).
 *
 * A abertura estática é a do sistema (expo-splash-screen, cor da marca e o
 * símbolo de 96). Quando ela sai, esta tela começa IGUAL a ela e anima:
 * o símbolo desce 14 e aparece (200 ms) · espera (700) · encolhe de 96 para 32
 * e sobe até o selo do logo (320, curva padrão) enquanto a cor da marca some ·
 * a foto vai de 1,04 a 1 · texto e portas sobem 8, 60 ms um depois do outro.
 * Com "reduzir movimento", tudo isso vira um esmaecer de 160 ms.
 * A abertura passa uma vez por abertura do app (voltar às boas-vindas não repete).
 *
 * Luta (AM2): fundo preto com o logo da Raça Fight; o primeiro botão é
 * "Quero conhecer · aula experimental grátis" (a vitrine, sem conta, F17);
 * as duas portas escolhem o CAMINHO do cadastro, não a visão (F13.5).
 */
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { ReduceMotion, runOnJS, useAnimatedStyle, useSharedValue, withDelay, withSequence, withTiming, type SharedValue } from 'react-native-reanimated';
import { Botao, SeloDoLogo, Simbolo, Texto } from '@/componentes';
import { curva, duracao, esmaecer, espaco, layout, movimento, tokens, useTema } from '@/tema';
import { mudarEntrada, recomecarEntrada, useEntrada } from './fluxo';
import { Mola, Porta, TelaDaEntrada } from './pecas';

const SIMBOLO = tokens.abertura.simbolo;
const SELO = tokens.abertura.simboloSelo;
const ESCALONAMENTO = tokens.movimento.atraso.escalonamento;

function Entra({ indice, revelar, children }: { indice: number; revelar: SharedValue<number>; children: ReactNode }) {
  const { reduzirMovimento } = useTema();
  const estilo = useAnimatedStyle(() => {
    // `revelar` corre em 320 + 3 × 60 ms; cada item dura 320 e começa 60 ms depois do anterior
    const total = duracao.lenta + 3 * ESCALONAMENTO;
    const p = Math.min(1, Math.max(0, (revelar.value - (indice * ESCALONAMENTO) / total) / (duracao.lenta / total)));
    return reduzirMovimento ? { opacity: revelar.value } : { opacity: p, transform: [{ translateY: (1 - p) * movimento.deslocamentoEntrada }] };
  });
  return <Animated.View style={estilo}>{children}</Animated.View>;
}

export function TelaBoasVindas() {
  const router = useRouter();
  const { cores, reduzirMovimento } = useTema();
  const { aberturaVista } = useEntrada();
  const [mostrarAbertura] = useState(!aberturaVista);
  const [aberturaMontada, setAberturaMontada] = useState(!aberturaVista);

  const refDaTela = useRef<View>(null);
  const refDoSelo = useRef<View>(null);

  const fundo = useSharedValue(mostrarAbertura ? 1 : 0);
  const simboloOpacidade = useSharedValue(0);
  const simboloY = useSharedValue(-14);
  const viagemX = useSharedValue(0);
  const viagemY = useSharedValue(0);
  const escala = useSharedValue(1);
  const revelar = useSharedValue(mostrarAbertura ? 0 : 1);

  useEffect(() => {
    if (!mostrarAbertura) return;
    mudarEntrada({ aberturaVista: true });
    const fim = () => setAberturaMontada(false);
    const nunca = ReduceMotion.Never;

    if (reduzirMovimento) {
      simboloOpacidade.value = 1;
      simboloY.value = 0;
      revelar.value = 1;
      const t = setTimeout(() => {
        fundo.value = withTiming(0, { duration: duracao.esmaecerReduzido, easing: curva.entrada, reduceMotion: nunca }, (ok) => ok && runOnJS(fim)());
        simboloOpacidade.value = esmaecer(0);
      }, tokens.abertura.esperaDemo);
      return () => clearTimeout(t);
    }

    simboloOpacidade.value = withTiming(1, { duration: duracao.media, easing: curva.padrao, reduceMotion: nunca });
    simboloY.value = withTiming(0, { duration: duracao.media, easing: curva.padrao, reduceMotion: nunca });
    const t = setTimeout(() => {
      // mede onde está o símbolo do selo, relativo à tela, e viaja até lá
      refDaTela.current?.measureInWindow((tx, ty, tw, th) => {
        refDoSelo.current?.measureInWindow((sx, sy, sw, sh) => {
          const destinoX = sx + sw / 2 - (tx + tw / 2);
          const destinoY = sy + sh / 2 - (ty + th / 2);
          const viagem = { duration: duracao.lenta, easing: curva.padrao, reduceMotion: nunca };
          viagemX.value = withTiming(destinoX, viagem);
          viagemY.value = withTiming(destinoY, viagem);
          escala.value = withTiming(SELO / SIMBOLO, viagem);
          fundo.value = withTiming(0, viagem);
          // o símbolo que viaja some no fim, quando encosta no do selo
          simboloOpacidade.value = withSequence(withTiming(1, { duration: duracao.lenta - duracao.rapida, reduceMotion: nunca }), withTiming(0, { duration: duracao.rapida, reduceMotion: nunca }, (ok) => ok && runOnJS(fim)()));
          revelar.value = withDelay(duracao.rapida, withTiming(1, { duration: duracao.lenta + 3 * ESCALONAMENTO, easing: curva.padrao, reduceMotion: nunca }));
        });
      });
    }, duracao.media + tokens.abertura.esperaDemo);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const estiloDoFundo = useAnimatedStyle(() => ({ opacity: fundo.value }));
  const estiloDoSimbolo = useAnimatedStyle(() => ({
    opacity: simboloOpacidade.value,
    transform: [{ translateX: viagemX.value }, { translateY: viagemY.value + simboloY.value }, { scale: escala.value }],
  }));
  const estiloDaFoto = useAnimatedStyle(() => (reduzirMovimento ? {} : { transform: [{ scale: 1 + 0.04 * (1 - revelar.value) }] }));

  const entrarPela = (porta: 'aluno' | 'academia') => {
    recomecarEntrada(porta);
    router.push({ pathname: '/como-entrar', params: { porta } });
  };

  return (
    <View ref={refDaTela} collapsable={false} style={{ flex: 1, backgroundColor: cores.aberturaFundo, overflow: 'hidden' }}>
      <Animated.View style={[{ flex: 1 }, estiloDaFoto]}>
        <TelaDaEntrada
          foto="nitida"
          barra={
            <Entra indice={0} revelar={revelar}>
              <View style={{ minHeight: layout.alturaCabecalho, justifyContent: 'center' }}>
                <SeloDoLogo refDoSimbolo={refDoSelo} />
              </View>
            </Entra>
          }
        >
          <Mola />
          <Entra indice={1} revelar={revelar}>
            <View style={{ gap: espaco[3] }}>
              <Texto variante="tituloEntrada" accessibilityRole="header">
                Muay Thai, Boxe, Jiu-Jitsu, Luta Livre e MMA em Gravataí.
              </Texto>
              <Texto variante="corpo" cor="textoSecundario">
                Veja os horários, conheça os professores e venha treinar.
              </Texto>
            </View>
          </Entra>
          <Entra indice={2} revelar={revelar}>
            <Botao rotulo="Quero conhecer · aula experimental grátis" tamanho="grande" aoTocar={() => router.push('/conheca')} testID="quero-conhecer" />
          </Entra>
          <View style={{ gap: espaco[3] }} accessibilityLabel="Já treina ou trabalha aqui">
            <Entra indice={3} revelar={revelar}>
              <View style={{ gap: espaco[3] }}>
                <Porta titulo="Sou aluno" apoio="Horários, check-in e a sua faixa" icone="inicio" aoTocar={() => entrarPela('aluno')} />
                <Porta titulo="Sou da equipe" apoio="Professor e recepção. O dono usa o app Admin" icone="academia" aoTocar={() => entrarPela('academia')} />
              </View>
            </Entra>
          </View>
          {/* Atalho de demonstração (contas de exemplo, sem login): não está no mockup; sai quando houver servidor. */}
          <Botao rotulo="Contas de exemplo" variante="texto" tamanho="pequeno" intrinseco estilo={{ alignSelf: 'center' }} aoTocar={() => router.push('/contas-de-exemplo')} />
        </TelaDaEntrada>
      </Animated.View>

      {aberturaMontada ? (
        <View pointerEvents="none" style={StyleSheet.absoluteFill} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: cores.aberturaFundo }, estiloDoFundo]} />
          <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
            <Animated.View style={estiloDoSimbolo}>
              <Simbolo tamanho={SIMBOLO} cor={cores.aberturaSimbolo} />
            </Animated.View>
          </View>
        </View>
      ) : null}
    </View>
  );
}
