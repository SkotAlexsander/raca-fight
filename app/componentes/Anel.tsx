/**
 * Anel de progresso (sistema.css `.anel-exercicio` e `.cronometro__anel`).
 *
 * - `enche` (o anel por exercício, ref 01): 44 com traço 4 (`anel`), trilho
 *   `trilho`, progresso `progresso` (marca no claro, viva no escuro e sobre
 *   foto), o número de feitas no centro; completo fica `sucesso`. Anima em
 *   `lenta` com a curva `padrao`.
 * - `esvazia` (descanso e regressivo, catálogo 4.3a): o arco esvazia em ritmo
 *   CONSTANTE do progresso atual até 1 em exatamente `restanteMs`. O motor
 *   (dominio/cronometro.ts) guarda o instante, nunca um contador: quem usa
 *   recalibra a cada mudança de estado, não a cada tique.
 *
 * "Reduzir movimento": o enche esmaece; o esvazia salta uma vez por segundo
 * (quem usa passa o progresso do tique e `restanteMs` indefinido).
 */
import { useEffect, type ReactNode } from 'react';
import { View } from 'react-native';
import Animated, { cancelAnimation, ReduceMotion, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { anel, curva, duracao, esmaecer, useTema, type CoresDoTema } from '@/tema';

const CirculoAnimado = Animated.createAnimatedComponent(Circle);

export interface PropsDoAnel {
  /** 0 a 1. No `enche`, a fração feita; no `esvazia`, a fração já passada. */
  progresso: number;
  modo?: 'enche' | 'esvazia';
  tamanho?: number;
  traco?: number;
  /** Papel da cor do arco; padrão `progresso`. */
  cor?: keyof CoresDoTema;
  /** Só no `esvazia` rodando: ms até chegar ao fim, em linha reta. */
  restanteMs?: number;
  rotuloAcessivel?: string;
  children?: ReactNode;
}

export function Anel({ progresso, modo = 'enche', tamanho = anel.exercicio, traco = anel.traco, cor = 'progresso', restanteMs, rotuloAcessivel, children }: PropsDoAnel) {
  const { cores, reduzirMovimento } = useTema();
  const r = (tamanho - traco) / 2;
  const circunferencia = 2 * Math.PI * r;
  const p = useSharedValue(Math.max(0, Math.min(1, progresso)));

  useEffect(() => {
    const alvo = Math.max(0, Math.min(1, progresso));
    cancelAnimation(p);
    if (modo === 'esvazia') {
      p.value = alvo;
      if (!reduzirMovimento && restanteMs && restanteMs > 0) {
        p.value = withTiming(1, { duration: restanteMs, easing: curva.constante, reduceMotion: ReduceMotion.Never });
      }
      return;
    }
    p.value = reduzirMovimento ? esmaecer(alvo) : withTiming(alvo, { duration: duracao.lenta, easing: curva.padrao, reduceMotion: ReduceMotion.Never });
  }, [progresso, modo, restanteMs, reduzirMovimento, p]);

  const props = useAnimatedProps(() => ({
    // enche: o arco é a parte feita; esvazia: o arco é o que falta
    strokeDashoffset: modo === 'enche' ? circunferencia * (1 - p.value) : circunferencia * p.value,
  }));

  const corDoArco = cores[cor] as string;
  return (
    <View
      accessibilityRole={rotuloAcessivel ? 'progressbar' : undefined}
      accessibilityLabel={rotuloAcessivel}
      style={{ width: tamanho, height: tamanho, alignItems: 'center', justifyContent: 'center' }}
    >
      <Svg width={tamanho} height={tamanho} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }} pointerEvents="none">
        <Circle cx={tamanho / 2} cy={tamanho / 2} r={r} stroke={cores.trilho} strokeWidth={traco} fill="none" />
        <CirculoAnimado
          cx={tamanho / 2}
          cy={tamanho / 2}
          r={r}
          stroke={corDoArco}
          strokeWidth={traco}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circunferencia} ${circunferencia}`}
          animatedProps={props}
        />
      </Svg>
      {children}
    </View>
  );
}
