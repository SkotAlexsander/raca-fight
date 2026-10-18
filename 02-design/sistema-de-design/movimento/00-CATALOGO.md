# Movimento e efeitos — catálogo

O que este arquivo é: os efeitos do Academia Plus. Para cada um, diz:
- quando dispara;
- o que se move;
- a duração e a curva, sempre por nome de token;
- a vibração em cada plataforma;
- o que acontece com o "reduzir movimento" ligado;
- o código de referência em React Native, com **Reanimated 4** e `expo-haptics`, no **Expo SDK 54**.

Escrito pelo agente K (P08) em 10/10/2026. O agente L aplica isto no mockup. Quem programa o app aplica no código.

- **Demonstração**: `demo.html` abre direto do disco (file://). Mostra cada efeito ao vivo em CSS e WAAPI, com:
  - botão "Repetir" em cada efeito;
  - a chave "Reduzir movimento";
  - câmera lenta ×4;
  - tema claro e escuro.
- **Tokens**: `../tokens.json`, bloco `movimento` (versão **1.4.0**). Os blocos `duracao`, `curva` e `vibracao` continuam como estavam.
- **Gravação**: `gravar.mjs`, com Playwright. Gera os quadros-chave em `capturas/quadros/` e os vídeos em `capturas/video/`.

---

## 1. As regras que valem para todos

1. **O dado vem antes da animação.** O toque grava primeiro, de forma síncrona: o estado local e a fila do SQLite. Depois o código dispara a vibração e só então começa a animação. Nada espera a animação acabar. Nenhum `await` fica entre o toque e a gravação, e a gravação não depende de nenhum `onFinish`. No código, a animação **segue o dado**: ela é disparada pela mudança de `serie.feita` no estado, e não pelo toque. Se a gravação falhar e o estado voltar, o check volta junto.
2. **"Reduzir movimento" é igual a esmaecer.** Com a opção do sistema ligada, nada desliza, cresce, quica ou reflete. Todo efeito vira um esmaecer de opacidade de `movimento.reduzido.duracao` (160 ms), com a curva `entrada`. A vibração continua. Duas exceções já estavam no sistema e continuam valendo (componente 18, regra 5):
   - o progresso do cronômetro salta uma vez por segundo, sem interpolar;
   - a cor da fase troca na hora.
3. **Nada em loop.** Só existem dois movimentos contínuos:
   - o cronômetro;
   - o indicador nativo de "atualizando".

   O brilho do esqueleto para depois de 3 passadas (`passadasEsqueleto`). O brilho dourado passa uma vez por visita à tela. Nada pisca nem pulsa.
4. **A resposta começa quando o dedo encosta.** O cartão afunda e o botão escurece no `onPressIn`. A ação acontece ao soltar o dedo dentro do alvo. Arrastar o dedo para fora cancela a ação (`05-ACESSIBILIDADE.md`, seção 2).
5. **Vibração e imagem saem no mesmo quadro.** A vibração é chamada sem `await`, na mesma função que muda o estado. Todas desligam pela chave "Vibração" do Perfil.
6. **Só `transform` e `opacity` se movem.** Nenhuma animação mexe em largura, altura ou margem. O único caso é o cabeçalho do Android, que encolhe preso à rolagem: ali a altura acompanha o dedo, sem duração própria.
7. **Um quique só no app inteiro**: o check da série (`mola.check`, amortecimento 0,6). Todo o resto usa amortecimento 1 ou curva. É o toque mais repetido do treino, então ganha a única recompensa física. Nada mais quica.

### Tokens de movimento (resumo)

| Token | Valor | Uso |
|---|---|---|
| `duracao.rapida` / `media` / `lenta` | 120 / 200 / 320 | já existiam |
| `curva.padrao` / `entrada` / `saida` | `cubic-bezier(0.2,0,0,1)` / `(0,0,0.2,1)` / `(0.4,0,1,1)` | já existiam |
| `movimento.mola.padrao` | amortecimento 1, 320 ms | círculo da comemoração, lista que volta, pilha (na demo) |
| `movimento.mola.check` | amortecimento 0,6, 400 ms | check da série |
| `movimento.mola.toque` | amortecimento 1, 200 ms | cartão que volta depois de afundar |
| `movimento.duracao.esmaecerReduzido` | 160 | o esmaecer do "reduzir movimento" |
| `movimento.duracao.comemoracao` | 480 | traço do check do treino fechado |
| `movimento.duracao.passadaEsqueleto` | 1400 | uma passada do brilho do esqueleto |
| `movimento.duracao.brilhoPlus` | 1200 | o reflexo dourado, uma vez |
| `movimento.atraso.esqueleto` | 300 | antes disso, o esqueleto não aparece |
| `movimento.atraso.brilhoPlus` | 400 | espera antes do reflexo |
| `movimento.atraso.escalonamento` | 60 | entre os itens do resumo |
| `movimento.curvaConstante` | `linear` | cronômetro e passada do esqueleto |
| `movimento.deslocamentoEntrada` | 8 | quanto um item sobe ao entrar |
| `movimento.escalaToque` | 0,98 | cartão e botão pressionados (já era o estado padrão do `02-COMPONENTES.md`) |
| `movimento.escalaInicialCheck` / `escalaInicialComemoracao` | 0,25 / 0,8 | de onde o check e o círculo crescem |
| `movimento.recuoTelaDeTras` / `escurecerTelaDeTras` | 0,3 / 0,08 | tela de trás na pilha (só onde a pilha não é nativa) |
| `movimento.passadasEsqueleto` | 3 | teto do brilho |
| `movimento.limitePuxar` | 64 | quanto puxar para atualizar |
| `movimento.rolagemTituloGrande` | 40 | rolagem em que o título grande vira pequeno |
| `movimento.reduzido` | esmaecer, 160, `entrada` | a regra 2 |

**A mola em dois números.** `amortecimento` é o `dampingRatio`: 1 não quica, e abaixo de 1 a mola passa do alvo e volta. `duracao` é o tempo até a mola assentar à vista. No Reanimated 4 vira `withSpring(v, { dampingRatio, duration })`. Na demo, a mesma mola vira uma curva CSS `linear()`, calculada com os mesmos dois números (assenta a 1 % em `duracao`). No Reanimated 4, o `duration` da mola é a duração *percebida*, e a mola termina de assentar um pouco depois. Calibrar no aparelho antes de fechar os números.

---

## 2. Dependências novas do app (Expo SDK 54)

As versões abaixo vêm do `bundledNativeModules.json` do ramo `sdk-54` do Expo, conferido em 10/10/2026. Instalar com `npx expo install`, que trava a versão do SDK.

| Pacote | Versão do SDK 54 | Para quê | Obrigatório? |
|---|---|---|---|
| `react-native-reanimated` | **~4.1.1** | toda animação daqui | sim |
| `react-native-worklets` | **0.5.1** | o Reanimated 4 separou os worklets neste pacote e não roda sem ele | sim, vem junto |
| `react-native-svg` | **15.12.1** | anel do cronômetro e traço do check do treino fechado | sim (o anel já pedia) |
| `expo-linear-gradient` | **~15.0.8** | faixa do brilho do esqueleto e reflexo do Plus | sim, ou o `experimental_backgroundImage` do RN 0.81, ainda experimental |
| `expo-haptics` | ~15.0.8 | vibração | **já estava** no `package.json` |

```
npx expo install react-native-reanimated react-native-worklets react-native-svg expo-linear-gradient
```

O que mais muda com isso:
- **A Nova Arquitetura é exigida pelo Reanimated 4.** O `app.json` já tem `"newArchEnabled": true`.
- **Babel**: no SDK 54, o `babel-preset-expo` liga sozinho o plugin dos worklets quando o `react-native-worklets` está instalado. Não se acrescenta nada no `babel.config.js`.
- **Expo Go**: o SDK 54 já traz Reanimated 4, então dá para testar no Expo Go.
- **`react-native-gesture-handler`**: **não** entra por causa destes efeitos. O puxar para atualizar é o `RefreshControl` nativo, e o voltar deslizando é da pilha nativa. Só vai entrar se o deslizar para marcar a série (componente 6, regra 3) for feito. A versão do SDK 54 é ~2.28.0.
- `00-STACK.md` dizia: "Reanimated — só quando houver animação que peça". Agora há. A decisão precisa ser registrada em `docs/decisoes.md` (texto sugerido na seção 5).

---

## 3. A base de código (uma vez, em `app/tema/`)

```ts
// app/tema/movimento.ts — tokens.json › duracao, curva, movimento (1.4.0)
import { Easing, ReduceMotion, withTiming } from 'react-native-reanimated';

export const duracao = {
  rapida: 120, media: 200, lenta: 320,
  esmaecerReduzido: 160, comemoracao: 480, passadaEsqueleto: 1400, brilhoPlus: 1200,
} as const;
export const atraso = { esqueleto: 300, brilhoPlus: 400, escalonamento: 60 } as const;
export const curva = {
  padrao: Easing.bezier(0.2, 0, 0, 1),
  entrada: Easing.bezier(0, 0, 0.2, 1),
  saida: Easing.bezier(0.4, 0, 1, 1),
  constante: Easing.linear,
};
export const mola = {
  padrao: { dampingRatio: 1, duration: 320 },
  check: { dampingRatio: 0.6, duration: 400 },
  toque: { dampingRatio: 1, duration: 200 },
} as const;
export const movimento = {
  deslocamentoEntrada: 8, escalaToque: 0.98, escalaInicialCheck: 0.25, escalaInicialComemoracao: 0.8,
  passadasEsqueleto: 3, limitePuxar: 64, rolagemTituloGrande: 40,
} as const;

/**
 * O esmaecer do "reduzir movimento". ReduceMotion.Never é de propósito: o padrão do
 * Reanimated (ReduceMotion.System) PULA a animação para o fim quando a opção está ligada,
 * e aí nem o esmaecer aconteceria.
 */
export const esmaecer = (para: number) =>
  withTiming(para, { duration: duracao.esmaecerReduzido, easing: curva.entrada, reduceMotion: ReduceMotion.Never });
```

```ts
// app/tema/useReduzirMovimento.ts
// O useReducedMotion() do Reanimated lê a opção uma vez e não re-renderiza quando ela muda.
// Este hook acompanha a mudança ao vivo.
import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

export function useReduzirMovimento(): boolean {
  const [reduzir, setReduzir] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduzir);
    const s = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduzir);
    return () => s.remove();
  }, []);
  return reduzir;
}
```

```ts
// app/tema/vibracao.ts — tokens.json › vibracao. Nunca usar await: a vibração não segura nada.
import * as Haptics from 'expo-haptics';
import { Platform, Vibration } from 'react-native';

export type MomentoDeVibrar =
  | 'marcarSerie' | 'desfazerSerie' | 'concluirTreino' | 'fimDescanso'
  | 'ultimosSegundosDescanso' | 'trocaDeFase' | 'erroAoSalvar';

export function vibrar(momento: MomentoDeVibrar, ligada: boolean): void {
  if (!ligada) return; // chave "Vibração" do Perfil
  switch (momento) {
    case 'marcarSerie':
    case 'ultimosSegundosDescanso':
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); return;
    case 'concluirTreino':
    case 'trocaDeFase':
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); return;
    case 'desfazerSerie':
      void Haptics.selectionAsync(); return;
    case 'fimDescanso':
      // iPhone: não existe vibração longa por API pública → padrão de sucesso (2 toques).
      // Android: pulso longo de ~400 ms. A permissão VIBRATE vem no manifesto do expo-haptics;
      // conferir no primeiro build e, se faltar, pôr em app.json › android.permissions.
      if (Platform.OS === 'android') Vibration.vibrate(400);
      else void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    case 'erroAoSalvar':
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); return;
  }
}
```

Os nomes `marcarSerieFeita`, `desfazerSerie`, `useTreinoEmAndamento` e `usePreferencia` que aparecem abaixo são de exemplo. Eles ainda não existem em `app/dados/` e devem ser trocados pelos nomes reais quando a execução do treino for escrita. O cronômetro usa o motor que já existe: `ler(c, agora)` em `app/dominio/cronometro.ts`, que devolve `progresso`, `acabando`, `fase` e `restanteMs`.

---

## 4. Os efeitos

Resumo (as durações em ms; "nativo" = o sistema decide):

| # | Efeito | Duração | Curva / mola | Vibração iOS · Android | Com "reduzir movimento" |
|---|---|---|---|---|---|
| 1 | Série marcada | enchimento 120 · check 400 · linha e toast 200 | `padrao` · `mola.check` | impacto leve · igual (desfazer: seleção) | check e toast esmaecem 160 |
| 2 | Fechar treino | círculo 320 · traço 480 (de 120) · resumo 200 cada, de 320, a cada 60 · fim ~880 | `mola.padrao` · `padrao` · `entrada` | impacto médio · igual | tudo esmaece junto em 160 |
| 3a | Anel do cronômetro | o tempo restante inteiro · cor 200 | `curvaConstante` · `padrao` | leve em 3, 2, 1 · fim: notificação de sucesso / pulso de 400 | salta por segundo; cor na hora |
| 3b | Troca de fase | cor do mostrador 200 · nome 120 · barra = a fase | `padrao` · `entrada` · linear | impacto médio · igual | troca na hora |
| 4 | Abas · pilha | aba 200 · pilha nativa (~350 no iOS; 320 na demo) | `padrao` · nativo | nenhuma | esmaecer 160 |
| 5 | Cartão afunda | afundar 120 · voltar 200 | `padrao` · `mola.toque` | nenhuma | só a camada de 8 % |
| 6 | Esqueleto | espera 300 · passada 1400 × até 3 · troca 200 | `curvaConstante` · `entrada`/`saida` | nenhuma | blocos parados; troca por esmaecer |
| 7 | Brilho do Plus | halo 320 (de 200) · reflexo 1200 (de 400), 1 vez | `entrada` · `padrao` | nenhuma | sem reflexo; halo esmaece 160 |
| 8 | Puxar para atualizar | arrasto = o dedo · volta 320 · item novo 200 | `mola.padrao` · `entrada` | nenhuma (indicador nativo) | o arrasto continua; item esmaece 160 |
| 9 | Título grande | preso à rolagem (40 px) · título pequeno e sombra 120 | `padrao` | nenhuma | iOS igual · Android: esmaecer 160 |

### 4.1 Série marcada

- **Dispara**: toque em "marcar feita" (botão de 56 da linha de série, componente 6), ao soltar o dedo dentro dele. Também pelo atalho de deslizar a linha para a direita, se ele for feito. **Desfazer** é o mesmo botão, que virou seta, ou o "Desfazer" do toast.
- **Ordem**:
  1. `marcarSerieFeita()` grava;
  2. `vibrar('marcarSerie')`;
  3. a mudança de `serie.feita` dispara a animação.

  Na demo, a lista embaixo do cartão mostra os tempos medidos. O dado é gravado em menos de 1 ms, e a animação começa depois.
- **O que se move**:
  - **botão**: enche de `sucesso` em `rapida` (120) e volta ao fundo em `media`, enquanto o ícone troca de check para "desfazer". O ícone que sai encolhe para 0,25, some e desfoca 4 px. O que entra faz o caminho inverso com `mola.padrao`.
  - **círculo do número**: vira check. O fundo `sucesso` cresce de 0,6 a 1, e o check cresce de `escalaInicialCheck` (0,25) a 1, com desfoque de 4 px a 0, na `mola.check` (amortecimento 0,6, 400 ms). Passa ~10 % do tamanho e assenta.
  - **linha**: o fundo ganha `sucesso` a 12 % e os números vão para `textoSecundario`, em `media` (200).
  - **régua de "atual"**: esmaece na linha seguinte em `media`.
  - **toast** "Série 2 feita · Desfazer": entra de baixo, de 16 px a 0, em `media` com a curva `entrada`. Sai descendo 8 px em `rapida` com a curva `saida`, porque a saída é mais discreta que a entrada.
- **Vibração**: marcar = **impacto leve** (`impactAsync(Light)`), igual nas duas plataformas. Desfazer = **seleção** (`selectionAsync()`), mais fraca.
- **Com "reduzir movimento"**: o check e o toast só esmaecem em 160, e o botão não enche. A cor da linha troca na hora. A vibração continua.

```tsx
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, withSequence, interpolate } from 'react-native-reanimated';
import { duracao, curva, mola, movimento, esmaecer } from '@/tema/movimento';
import { useReduzirMovimento } from '@/tema/useReduzirMovimento';
import { vibrar } from '@/tema/vibracao';

export function LinhaDeSerie({ serie }: { serie: SerieEmExecucao }) {
  const reduzir = useReduzirMovimento();
  const { marcarSerieFeita, desfazerSerie } = useTreinoEmAndamento(); // nomes de exemplo
  const vibracaoLigada = usePreferencia('vibracao');
  const check = useSharedValue(serie.feita ? 1 : 0);
  const enchimento = useSharedValue(0);

  // A animação SEGUE o dado: só anda depois que o estado (já gravado) mudou.
  useEffect(() => {
    const alvo = serie.feita ? 1 : 0;
    if (reduzir) check.value = esmaecer(alvo);
    else check.value = alvo ? withSpring(1, mola.check) : withTiming(0, { duration: duracao.rapida, easing: curva.saida });
  }, [serie.feita, reduzir]);

  const aoTocar = () => {
    // 1) o dado: síncrono no estado + fila do SQLite. Sem await, sem esperar animação.
    const feita = serie.feita ? desfazerSerie(serie.id) : marcarSerieFeita(serie.id);
    // 2) a vibração, no mesmo quadro
    vibrar(feita ? 'marcarSerie' : 'desfazerSerie', vibracaoLigada);
    // 3) a resposta do botão
    if (feita && !reduzir) {
      enchimento.value = withSequence(
        withTiming(1, { duration: duracao.rapida, easing: curva.padrao }),
        withTiming(0, { duration: duracao.media, easing: curva.padrao }),
      );
    }
  };

  const estiloCheck = useAnimatedStyle(() => reduzir
    ? { opacity: check.value }
    : { opacity: Math.min(1, check.value * 2),
        transform: [{ scale: interpolate(check.value, [0, 1], [movimento.escalaInicialCheck, 1]) }] });
  const estiloEnchimento = useAnimatedStyle(() => ({ opacity: enchimento.value }));
  // ... o fundo da linha (12 % de sucesso) e a régua usam a mesma ideia, com withTiming(duracao.media)
}
```

### 4.2 Fechar treino

- **Dispara**: o "Fechar treino" é confirmado na folha (componente 14, variante confirmação). O treino já está gravado quando a tela do resumo aparece. A comemoração é a primeira coisa que essa tela faz ao montar.
- **O que se move** (uma linha do tempo, sem confete, sem número contando para cima):
  - **0 ms**: o círculo de **112** (`comemoracao.check`, tokens 1.7.0) cresce de `escalaInicialComemoracao` (0,8) a 1 com a `mola.padrao` (320, sem quique). A **vibração média** sai neste quadro. Desde o P09 a comemoração é uma **tela cheia em `viva`** (`novas.html`, tela 4): o círculo é `vivaTexto` e o check, traço 7, em `viva`. Antes era um círculo `sucesso` de 64 dentro do resumo; em tela cheia o 64 ficava pequeno demais para "a única festa" (alinhado pelo agente Q).
  - **120 ms**: o traço do check se desenha em `comemoracao` (480), curva `padrao`.
  - **320 ms**: entram em sequência o título "Treino fechado.", a linha "Treino A · peito e tríceps", os 3 cartões de número (exercícios, tempo, séries), o destaque ("Agachamento: 55 → 60 kg") e o botão "Pronto". Cada um esmaece e sobe `deslocamentoEntrada` (8 px) em `media` (200), com a curva `entrada`, e o próximo começa `escalonamento` (60) depois. Tudo parado em ~880 ms.
- **Por que assim**: o tom é "celebra o feito, não o corpo" (`01-TOM-DE-VOZ.md`). Os números aparecem prontos, sem contar para cima, porque são a notícia. O check é a única festa. Sem "!" no título.
- **Vibração**: **impacto médio** (`vibracao.concluirTreino`), igual nas duas plataformas.
- **Com "reduzir movimento"**: o check já vem desenhado, e tudo esmaece junto em 160, sem escalonar.

```tsx
import Svg, { Circle, Path } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, useAnimatedStyle, withDelay, withSpring, withTiming } from 'react-native-reanimated';

const PathAnimado = Animated.createAnimatedComponent(Path);

function useEntrada(indice: number, reduzir: boolean) {
  const v = useSharedValue(0);
  useEffect(() => {
    v.value = reduzir ? esmaecer(1)
      : withDelay(duracao.lenta + indice * atraso.escalonamento, withTiming(1, { duration: duracao.media, easing: curva.entrada }));
  }, []);
  return useAnimatedStyle(() => ({
    opacity: v.value,
    transform: [{ translateY: reduzir ? 0 : (1 - v.value) * movimento.deslocamentoEntrada }],
  }));
}

export function TreinoFechado({ resumo }: { resumo: ResumoDoTreinoFechado }) {
  const reduzir = useReduzirMovimento();
  const circulo = useSharedValue(0);
  const traco = useSharedValue(reduzir ? 1 : 0);
  useEffect(() => {
    vibrar('concluirTreino', vibracaoLigada);             // mesmo quadro do círculo
    circulo.value = reduzir ? esmaecer(1) : withSpring(1, mola.padrao);
    if (!reduzir) traco.value = withDelay(duracao.rapida, withTiming(1, { duration: duracao.comemoracao, easing: curva.padrao }));
  }, []);
  const estiloCirculo = useAnimatedStyle(() => ({
    opacity: Math.min(1, circulo.value * 1.5),
    transform: [{ scale: reduzir ? 1 : 0.8 + 0.2 * circulo.value }],
  }));
  const propsTraco = useAnimatedProps(() => ({ strokeDashoffset: 1 - traco.value }));
  // <Animated.View style={estiloCirculo}><Svg 112×112><Circle fill={cor.vivaTexto}/>
  //   <PathAnimado d="M19 33.5l9 9 17-19" pathLength={1} strokeDasharray={1} animatedProps={propsTraco} stroke={cor.sucessoTexto}/></Svg></Animated.View>
  // título = useEntrada(0), subtítulo = 1, números = 2,3,4, destaque = 5, botão = 6
}
```

### 4.3a Anel do cronômetro (descanso e regressivo)

- **Dispara**: o descanso começa ao marcar a série, ou o regressivo começa pelo "Iniciar". O anel é refeito a cada mudança de estado: iniciar, pausar, retomar, ±30 s, o app voltar ao primeiro plano.
- **O que se move**:
  - **arco**: esvazia em ritmo constante (`curvaConstante`). A animação vai do `progresso` atual até 1 em exatamente `restanteMs`, os dois lidos do motor (`ler(c, agora)`). O motor guarda o instante de início, nunca um contador. Por isso, voltar ao app recalcula o arco sem acumular erro.
  - **últimos 10 s** (`leitura.acabando`): o arco passa a `atencao` em `media` (200), e o número fica bold. Nada pisca nem pulsa.
  - **fim**: o arco fica `sucesso` cheio, e o texto diz "Descanso terminado · Próxima série".
  - **pausa**: `cancelAnimation`, e o arco fica no valor do motor.
- **Vibração**:
  - 3, 2 e 1 s finais: impacto leve, nas duas plataformas.
  - **fim**: no iPhone, o padrão de notificação de sucesso (2 toques); no Android, um pulso de ~400 ms.
  - Com o app fechado, quem avisa é a notificação local (componente 7, regra 2).
- **Com "reduzir movimento"**: o arco salta uma vez por segundo, levado pelo mesmo tique de 1 s que atualiza o número, sem interpolar. A cor troca na hora. Isso já era regra (`05-ACESSIBILIDADE.md`, seção 5).

```tsx
import Svg, { Circle } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withTiming, cancelAnimation, ReduceMotion } from 'react-native-reanimated';
import { ler } from '@/dominio/cronometro';

const CirculoAnimado = Animated.createAnimatedComponent(Circle);

export function AnelDoCronometro({ cronometro, agora }: { cronometro: Cronometro; agora: number /* tique de 1 s da tela */ }) {
  const reduzir = useReduzirMovimento();
  const progresso = useSharedValue(0);
  const leitura = ler(cronometro, agora);

  // Recalibra a cada mudança de estado (não a cada tique): do valor do motor até 1, no tempo que falta.
  useEffect(() => {
    const l = ler(cronometro, Date.now());
    cancelAnimation(progresso);
    progresso.value = l.progresso;
    if (!reduzir && l.estado === 'rodando' && l.restanteMs) {
      progresso.value = withTiming(1, { duration: l.restanteMs, easing: curva.constante, reduceMotion: ReduceMotion.Never });
    }
  }, [cronometro, reduzir]);

  // Reduzido: o tique de 1 s escreve o valor direto (salto por segundo).
  useEffect(() => { if (reduzir) progresso.value = leitura.progresso; }, [agora, reduzir]);

  const props = useAnimatedProps(() => ({ strokeDashoffset: progresso.value })); // pathLength = 1
  const corDoArco = leitura.estado === 'terminado' ? cor.sucesso : leitura.acabando ? cor.atencao : cor.marca;
  // <CirculoAnimado r={72} pathLength={1} strokeDasharray={1} animatedProps={props} stroke={corDoArco} strokeWidth={8} strokeLinecap="round"/>
  // A cor troca por transição CSS do Reanimated 4 num <Animated.View> por fora, ou direto (reduzido).
}
```

A vibração dos 3, 2, 1 e a do fim saem do mesmo tique de 1 s, quando `segundosNaTela` muda. Elas não saem da animação.

### 4.3b Troca de fase do intervalado

- **Dispara**: o motor muda de fase (`leitura.fase.tipo` mudou entre dois tiques): preparação → trabalho → descanso → … → terminado.
- **O que se move**:
  - **cor da fase**: cobre o mostrador por esmaecimento em `media` (200), sem varrer de lado e sem piscar. As cores vêm de `tokens.json › cronometro.fase`: trabalho = `marca`, descanso = `sucesso`. O texto muda de cor junto.
  - **nome da fase**: o nome velho sai na hora, e o novo esmaece em `rapida` (120). Duas palavras sobrepostas ficariam ilegíveis no meio da troca; a demo mostrou isso.
  - **barra da fase**: enche linear durante a fase inteira.
  - **traço da rodada**: acende (24 % → 60 % → 100 %) em `media`.
- **Vibração**: **impacto médio** na troca, nas duas plataformas, no mesmo quadro da cor. Leve nos 3, 2, 1 finais de cada fase. No fim, o padrão de "concluído" (`fimDescanso`). Com o app fechado, cada troca vira uma notificação local (até 24).
- **Com "reduzir movimento"**: cor e nome trocam na hora. Barra e rodadas atualizam por segundo (componente 18, regra 5).

```tsx
import Animated, { cubicBezier } from 'react-native-reanimated';

// API de transições CSS do Reanimated 4: a troca de cor não precisa de shared value.
<Animated.View style={{
  backgroundColor: cor[tokens.cronometro.fase[leitura.fase.tipo].fundo],
  transitionProperty: 'backgroundColor',
  transitionDuration: reduzir ? 0 : duracao.media,
  transitionTimingFunction: cubicBezier(0.2, 0, 0, 1),
}}>
  <Animated.Text key={leitura.fase.tipo + leitura.fase.rodada}
    entering={reduzir ? undefined : FadeIn.duration(duracao.rapida)}>{nomeDaFase}</Animated.Text>
  {/* número, barra (scaleX = leitura.progresso, mesma técnica do anel), rodadas */}
</Animated.View>

// no tique de 1 s:
if (faseAnterior.current !== chaveDaFase) { faseAnterior.current = chaveDaFase; vibrar('trocaDeFase', vibracaoLigada); }
```

### 4.4 Transição entre abas e entre telas (empilhar e voltar)

- **Dispara**: toque numa aba; abrir uma tela da pilha; voltar (pelo botão, pelo voltar do Android ou deslizando da borda no iPhone).
- **Aba**: o conteúdo **esmaece** em `media` (200), curva `padrao`, sem deslizar de lado (componente 12, regra 4: cada aba mantém sua pilha). O indicador de 3 × 24 corre até a aba nova em `media`. O ícone pressionado encolhe a 0,92 em `rapida`, como já estava no componente.
- **Pilha**: é a **transição nativa** de cada sistema. No iPhone, a tela nova entra da direita, a de trás recua cerca de 30 % e escurece, em ~350 ms, com o gesto de voltar interrompível no meio. No Android vale o padrão do sistema. A transição não usa os nossos tokens de propósito: comportamento é do sistema (`06-IPHONE.md`). A demo imita com a `mola.padrao` (320), o `recuoTelaDeTras` (0,3) e o `escurecerTelaDeTras` (0,08). Voltar faz o mesmo caminho ao contrário: a tela sai por onde entrou.
- **Vibração**: nenhuma.
- **Com "reduzir movimento"**: a aba já é esmaecer e cai para 160. A pilha passa a `animation: 'fade'`, porque o iOS com "reduzir movimento" ainda desliza a pilha. O indicador da aba troca na hora.

```tsx
// navegacao/(aluno)/_layout.tsx — abas (React Navigation 7 / Expo Router 6)
import { Easing } from 'react-native'; // as abas usam o Animated do React Native, não o Reanimated
<Tabs screenOptions={{
  animation: 'fade',
  transitionSpec: { animation: 'timing', config: {
    duration: reduzir ? duracao.esmaecerReduzido : duracao.media,
    easing: reduzir ? Easing.bezier(0, 0, 0.2, 1) : Easing.bezier(0.2, 0, 0, 1),
  } },
}} tabBar={(p) => <BarraDeAbas {...p} />} />
// BarraDeAbas (componente 12): indicador com translateX = withTiming(xDaAba, { duration: duracao.media, easing: curva.padrao }),
// ou atribuição direta quando reduzir.

// pilha de cada aba
<Stack screenOptions={{ animation: reduzir ? 'fade' : 'default', animationDuration: reduzir ? duracao.esmaecerReduzido : undefined }} />
```

### 4.5 Cartão que afunda no toque

- **Dispara**: o dedo encosta num cartão tocável: treino pronto (componente 8), exercício dobrado (5) ou aluno (9). A resposta vem na hora, no `onPressIn`. A ação sai ao soltar. Arrastar para fora cancela.
- **O que se move**: o cartão vai a `escalaToque` (0,98) e desce 1 px. A sombra de repouso some, e uma camada de `texto` a 8 % (12 % no escuro) cobre o cartão. A ida é em `rapida` (120) com a curva `padrao`. Ao soltar, ele volta com a `mola.toque` (amortecimento 1, 200 ms), saindo do ponto onde estava, sem quique. É interrompível: tocar de novo no meio continua dali.
- **Vibração**: nenhuma. O toque já abre a tela; vibrar aqui gastaria a vibração que significa "feito".
- **Com "reduzir movimento"**: sem escala e sem descida; só a camada de 8 % aparece.
- **Muda o componente 8**: lá o pressionado é "`sombra.2`", que sobe. O pedido do P08 é "afunda". A proposta é o pressionado de cartão perder a sombra em vez de ganhar. Fica para o L confirmar no mockup.

```tsx
const pressionado = useSharedValue(0);
const estilo = useAnimatedStyle(() => ({
  transform: reduzir ? [] : [{ scale: 1 - (1 - movimento.escalaToque) * pressionado.value }, { translateY: pressionado.value }],
}));
const estiloSombra = useAnimatedStyle(() => ({ opacity: 1 - pressionado.value }));    // a sombra mora numa View por baixo
const estiloCamada = useAnimatedStyle(() => ({ opacity: pressionado.value * camadaToque })); // 0,08 claro · 0,12 escuro
<Pressable
  onPressIn={() => { pressionado.value = withTiming(1, { duration: duracao.rapida, easing: curva.padrao }); }}
  onPressOut={() => { pressionado.value = withSpring(0, mola.toque); }}
  onPress={abrirTreino}>
```

Animar a opacidade de uma View de sombra por baixo do cartão sai mais barato que animar `boxShadow`, e funciona igual nas duas plataformas.

### 4.6 Carregando: esqueleto com brilho

- **Dispara**: uma lista do servidor ainda não chegou (treinos prontos, alunos, histórico, dieta).
- **O que se move**:
  - **até `atraso.esqueleto` (300 ms)**: **nada aparece**. Em rede boa, o esqueleto não pisca por um instante.
  - **passou de 300**: o esqueleto esmaece em `media`. Os blocos são de `borda` a 60 % e têm o raio do que imitam (`02-COMPONENTES.md`, Auxiliares).
  - **o brilho**: uma faixa clara atravessa da esquerda para a direita em `passadaEsqueleto` (1400), `curvaConstante`, no máximo `passadasEsqueleto` (3) vezes, e para. Depois disso o esqueleto fica parado até o dado chegar. Isso cumpre o "nenhuma animação em loop".
  - **o dado chegou**: o esqueleto sai em `media` com a curva `saida`, enquanto o conteúdo entra em `media` com a curva `entrada` (esmaecimento cruzado). O tamanho não muda, porque o esqueleto tem o tamanho do conteúdo.
- **Vibração**: nenhuma.
- **Com "reduzir movimento"**: blocos parados, sem faixa; a troca é o mesmo esmaecer.
- **Leitor de tela**: "Carregando treinos" é dito uma vez; o esqueleto não é lido (já era regra).

```tsx
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { withRepeat, withTiming, FadeIn, FadeOut, ReduceMotion } from 'react-native-reanimated';

function Brilho({ largura }: { largura: number }) {
  const x = useSharedValue(-largura);
  useEffect(() => {
    x.value = withRepeat(withTiming(largura, { duration: duracao.passadaEsqueleto, easing: curva.constante }),
                         movimento.passadasEsqueleto, false); // 3 passadas e para
  }, [largura]);
  const estilo = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  return <Animated.View style={[StyleSheet.absoluteFill, estilo]} pointerEvents="none">
    <LinearGradient colors={['transparent', brilhoDoTema, 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
  </Animated.View>;
}

// na lista:
const mostrarEsqueleto = useDepoisDe(atraso.esqueleto, carregando); // setTimeout de 300; falso se o dado chegou antes
{mostrarEsqueleto && <Animated.View entering={FadeIn.duration(duracao.media)} exiting={FadeOut.duration(duracao.media).reduceMotion(ReduceMotion.Never)}>
  <CartaoEsqueleto>{!reduzir && <Brilho largura={larguraDoCartao} />}</CartaoEsqueleto>
</Animated.View>}
```

`brilhoDoTema` é branco a 65 % no claro e branco a 7 % no escuro (os mesmos da demo). É decorativo e não carrega informação.

### 4.7 Brilho dourado sutil do convite ao Plus

- **Dispara**: o convite aparece. Pode ser o estado vazio "sem Plus" (componente 15), a folha de convite (componente 14) ou o selo contorno onde um recurso do Plus aparece bloqueado. Toca **uma vez por visita à tela** (`useFocusEffect`) e nunca em loop.
- **O que se move**:
  - **o convite** entra: esmaece e sobe 8 px em `media`.
  - **o halo**: a partir de 200 ms, em `lenta` (320), o cartão ganha um contorno de 1 px `plus` a 70 % e uma sombra `0 12 32` em `plus` a 22 %. O halo **fica**: é o "dourado sutil" parado.
  - **o reflexo**: depois de `atraso.brilhoPlus` (400), uma faixa clara atravessa uma vez o selo "Plus" e o botão "Conhecer o Plus", em `brilhoPlus` (1200), curva `padrao`. No botão vai um segundo depois do selo, 150 ms.
- **Contraste**: o reflexo passa por cima do preenchimento `plus` com o texto `plusTexto`. O texto continua legível em todos os quadros (conferido nos PNG). A palavra "Plus" solta usa `plusTextoSobreFundo` (regra da marca).
- **Vibração**: nenhuma. Convite não é conquista.
- **Com "reduzir movimento"**: sem reflexo; o convite e o halo esmaecem em 160, e o halo fica.

```tsx
const halo = useSharedValue(0), reflexo = useSharedValue(0);
useFocusEffect(useCallback(() => {
  halo.value = reduzir ? esmaecer(1) : withDelay(duracao.media, withTiming(1, { duration: duracao.lenta, easing: curva.entrada }));
  if (!reduzir) { reflexo.value = 0; reflexo.value = withDelay(atraso.brilhoPlus, withTiming(1, { duration: duracao.brilhoPlus, easing: curva.padrao })); }
}, [reduzir]));
const estiloHalo = useAnimatedStyle(() => ({ opacity: halo.value }));
// a View do halo: { boxShadow: `0 0 0 1px ${plus70}, 0 12px 32px ${plus22}`, borderRadius: raio.folha } — boxShadow funciona nas duas plataformas no RN 0.81 (Nova Arquitetura)
const estiloReflexo = useAnimatedStyle(() => ({ transform: [{ translateX: interpolate(reflexo.value, [0, 1], [-1.3 * largura, 1.3 * largura]) }] }));
// dentro do botão (overflow: 'hidden'): <Animated.View style={estiloReflexo}><LinearGradient colors={['transparent','rgba(255,255,255,0.55)','transparent']} .../></Animated.View>
```

### 4.8 Puxar para atualizar

- **Dispara**: puxar para baixo, além de `limitePuxar` (64), uma lista que vem do servidor (alunos, treinos prontos, histórico, dieta) e soltar. **Nunca** na tela de treino em andamento (componente 17).
- **O que se move**:
  - **o indicador é o nativo** (`RefreshControl`): a roda do iOS e o círculo do Material, pintados com a `marca`;
  - **a lista** segue o dedo 1:1, com resistência elástica, e volta sozinha. No app quem faz isso é o sistema; a demo imita com a fórmula de elástico da Apple e a volta em `mola.padrao`;
  - **o que o app acrescenta**: os itens **novos** (os ids que não estavam na lista) entram com um esmaecer de 8 px em `media`. Os que já estavam não se mexem.
- **Vibração**: nenhuma pelo app.
- **Com "reduzir movimento"**: o arrasto continua, porque é o dedo que move. O item novo só esmaece em 160. O indicador nativo segue o sistema.

```tsx
const idsConhecidos = useRef(new Set<string>());
<Animated.FlatList
  data={alunos}
  refreshControl={<RefreshControl refreshing={atualizando} onRefresh={atualizar}
    tintColor={cor.marca} /* iOS */ colors={[cor.marca]} progressBackgroundColor={cor.superficie} /* Android */ />}
  renderItem={({ item }) => {
    const novo = idsConhecidos.current.size > 0 && !idsConhecidos.current.has(item.id);
    return <Animated.View entering={novo
      ? (reduzir ? FadeIn.duration(duracao.esmaecerReduzido).reduceMotion(ReduceMotion.Never)
                 : FadeInUp.duration(duracao.media).easing(curva.entrada))
      : undefined}><CartaoDeAluno aluno={item} /></Animated.View>;
  }}
/>
// depois de cada carga: alunos.forEach(a => idsConhecidos.current.add(a.id));
```

O `FadeInUp` do Reanimated faz o item subir enquanto aparece, mas o deslocamento padrão dele é maior que 8. Se ficar grande no aparelho, troque por uma entrada própria com `Keyframe` (opacity 0 → 1, translateY 8 → 0).

### 4.9 Título grande que encolhe

- **Dispara**: rolar a tela raiz de uma aba: Início, Treinos, Plus e Perfil no aluno; Alunos, Treinos, Plus, Academia e Perfil na academia (componente 13, variante grande).
- **iPhone**: é o **título grande nativo**:
  - o título grande (`titulo1`, 28) rola junto com o conteúdo;
  - quando ele some, o pequeno (`titulo2`, 22) aparece no centro da barra de 56, e a `sombra.1` surge;
  - a fonte e o tamanho são os nossos;
  - o tempo do esmaecimento é o do sistema; a demo usa `rapida`.
- **Android**: o nosso cabeçalho. O cabeçalho de 96 encolhe para 56 nos primeiros `rolagemTituloGrande` (40) px. O título vai de 28 para 22 por escala (0,786), alinhado à esquerda, preso à rolagem e sem duração própria. Passados os 40 px, a `sombra.1` aparece em `rapida`.
- **Vibração**: nenhuma.
- **Com "reduzir movimento"**: no iPhone, igual, porque a troca já é um esmaecer e o sistema cuida dela. No Android, sem escala: ao cruzar os 40 px, o título grande dá lugar ao pequeno por esmaecer de 160.

```tsx
// iPhone: <Stack.Screen options={{
//   headerLargeTitle: true,
//   headerLargeTitleStyle: { fontFamily: familiaPorPeso.interface['700'], fontSize: 28 },
//   headerTitleStyle: { fontFamily: familiaPorPeso.interface['600'], fontSize: 22 },
//   headerLargeTitleShadowVisible: false, headerShadowVisible: true,
//   headerStyle: { backgroundColor: cor.fundo }, headerLargeStyle: { backgroundColor: cor.fundo },
// }} />  e a lista com contentInsetAdjustmentBehavior="automatic".

// Android:
const y = useSharedValue(0);
const aoRolar = useAnimatedScrollHandler((e) => { y.value = e.contentOffset.y; });
const estiloCabecalho = useAnimatedStyle(() => ({
  height: interpolate(y.value, [0, movimento.rolagemTituloGrande], [96, 56], Extrapolation.CLAMP),
}));
const estiloTitulo = useAnimatedStyle(() => reduzir ? {} : ({
  transform: [{ scale: interpolate(y.value, [0, movimento.rolagemTituloGrande], [1, 22 / 28], Extrapolation.CLAMP) }],
  transformOrigin: 'left center',
}));
// reduzido: dois Text (28 e 22) com opacity = withTiming(y > 40 ? … , esmaecer) em vez da escala
<Animated.ScrollView onScroll={aoRolar} scrollEventThrottle={16}>
```

---

### 4.10 Deslizar para começar (1.6.0, agente N, P09)

Componente 21. O botão de 56 segue o dedo sem mola (`translateX` direto, na thread de UI com `Gesture.Pan` do `react-native-gesture-handler`); solto antes de 85 % do trilho, volta na `mola.toque` (200 ms, sem quique); depois de 85 %, vai ao fim na `mola.padrao`, vira `sucesso`, vibra `impactoMedio` e o treino começa. **O treino é criado no soltar, antes da animação terminar.** Tocar no botão também começa. Movimento reduzido: o botão não desliza; esmaece em 160 ms e a ação acontece. No mockup: `mockups/index.html`, tela 2.

### 4.11 Folha do + central (1.6.0, [decidir])

Com `?abas=mais`: o + central abre a folha "Começar treino · Cronômetro · Registrar". A sobreposição esmaece em 200 ms e a folha sobe 40 px em 320 ms (`curva.padrao`); reduzido: só esmaece em 160 ms.

## 5. O que este trabalho deixa para outros decidirem ou registrarem

> **10/10/2026, agente L:** os itens 1, 2 e 3 foram resolvidos dentro de `sistema-de-design/` (`05-ACESSIBILIDADE.md` seção 5, `tokens.json › duracao.$regra`, componente 8 do `02-COMPONENTES.md` e o `.indicador` do `sistema.css`, que agora gira no máximo 3 voltas e para). Os itens 4, 5 e 6 continuam abertos (estão fora desta pasta). Relatório em `docs/revisao/L-APLICACAO.md`.

Tudo abaixo é proposta: o K só escreve nesta pasta e no `tokens.json`. Nenhum item é pendência do P00.

1. **`05-ACESSIBILIDADE.md`, seção 5, e `tokens.json › duracao.$regra`** dizem: "com movimento reduzido, todas as durações vão a 0". O P08 pede "todo efeito vira um esmaecer". Segui o P08: esmaecer de 160 (`movimento.reduzido`). Também mantive as duas exceções do cronômetro, que já estavam escritas. **Proposta**: trocar a frase da seção 5 por "todo efeito vira um esmaecer de `movimento.reduzido.duracao`; o cronômetro salta por segundo". Não mexi na `$regra` existente, porque a ordem foi não mudar o que já existe.
2. **Esqueleto com brilho × "nenhuma animação em loop"**: resolvido com o teto de 3 passadas. Observação: o `.indicador` do mockup (`sistema.css`, linha 238) gira com `infinite`. Isso é anterior a este trabalho e é o mesmo caso do indicador nativo. Fica para o L ou para a auditoria decidir.
3. **Cartão pressionado**: o componente 8 diz `sombra.2` (sobe), e o P08 pede "afunda". A proposta é perder a sombra e ir a 0,98 (seção 4.5). Precisa de uma linha no `02-COMPONENTES.md`.
4. **Vibração dos 3, 2, 1 s**: o `tokens.json` diz `impactoLeve`, e o `03-arquitetura/04-IPHONE.md` (seção 5) diz `selectionAsync()`. Segui o token (`impactAsync(Light)`), que é o que o `06-IPHONE.md` também diz. A tabela da arquitetura precisa ser alinhada.
5. **Registro em `docs/decisoes.md`** (texto sugerido para quem tem a pasta):
   > **10/10/2026 — Reanimated 4 entra no app.** Critério: os efeitos do P08 (check com mola, anel contínuo, título grande no Android, esqueleto) precisam rodar fora da linha do JavaScript, para não engasgar quando a tela grava a série; e "reduzir movimento" vira esmaecer com `ReduceMotion.Never` no esmaecer. Alternativa descartada: o `Animated` do React Native (sem mola por `dampingRatio`, sem layout animations, `useNativeDriver` não anima cor). Mudaria se: o SDK subir e o Reanimated mudar de API de novo, ou se o efeito pesar em Android de entrada (medir no aparelho mais fraco do público antes de publicar).
6. **Calibrar no aparelho**: a mola do check (0,6 / 400) e o reflexo do Plus foram ajustados na tela do computador. O `duration` da mola no Reanimated 4 é a duração percebida, e o assentamento termina um pouco depois. Confirmar num iPhone e num Android de entrada antes de fechar.

## 6. Como conferir

- Abrir `demo.html` no navegador, direto do disco. Ligar e desligar "Reduzir movimento" e usar "Câmera lenta ×4" para ver cada quadro. As telas respondem ao toque:
  - marcar e desfazer série;
  - segurar um cartão;
  - puxar a lista;
  - rolar o título;
  - trocar de aba e abrir uma tela.
- Regravar: `node "02-design/sistema-de-design/movimento/gravar.mjs"`. Ele tenta o Chromium padrão do Playwright e, se der acesso negado, usa o headless shell 1234. Grava:
  - os quadros-chave de cada efeito em câmera lenta, com movimento normal e com movimento reduzido;
  - a página no escuro em 2040 × 790 e em 390 × 844 (sem rolagem horizontal);
  - um vídeo de cada modo, em velocidade real.
- Na última gravação (10/10/2026): 102 quadros, nenhum erro na página, e nenhuma rolagem horizontal em 390.
