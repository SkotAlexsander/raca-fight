/**
 * Componente 16 — Aviso rápido (o "toast"; sistema.css `.toast`).
 *
 * Raio 16, altura mínima 48, `corpoPequeno`, `sombra.2`. No claro é
 * INVERTIDO (fundo `texto`, texto `fundo`; o ícone usa a cor do texto e a
 * forma carrega o sentido); no escuro, `superficieElevada` com o ícone em
 * `sucesso`/`erro`. "Desfazer" é botão de texto à direita.
 *
 * Um por vez (o novo substitui o anterior, sem fila); fica 5 s (`duracao.toast`;
 * erro 8 s) e PAUSA enquanto o dedo está nele. Entra de baixo (16 → 0) em
 * `media` com a curva `entrada`; sai descendo 8 em `rapida` com a `saida`;
 * reduzido: esmaece 160. Fica acima da barra de abas (e da faixa do
 * descanso): quem usa diz a distância da base (`margemInferior`).
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeOut, ReduceMotion, Keyframe } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { duracao, espaco, layout, raio, SobreposicaoDeCores, tokens, useTema } from '@/tema';
import { Botao } from './Botao';
import { Icone, type NomeDoIcone } from './Icone';
import { Texto } from './Texto';

export type TipoDoAviso = 'neutro' | 'sucesso' | 'erro';

export interface DadosDoAviso {
  texto: string;
  tipo?: TipoDoAviso;
  icone?: NomeDoIcone;
  acao?: { rotulo: string; aoTocar: () => void };
}

export function AvisoRapido({ texto, tipo = 'neutro', icone, acao, aoPressionar, aoSoltar }: DadosDoAviso & { aoPressionar?: () => void; aoSoltar?: () => void }) {
  const { cores, sombras, esquema } = useTema();
  const iconeFinal = icone ?? (tipo === 'sucesso' ? 'marcar' : tipo === 'erro' ? 'alerta' : undefined);
  const corDoIcone = esquema === 'escuro' && tipo === 'sucesso' ? cores.sucesso : esquema === 'escuro' && tipo === 'erro' ? cores.erro : cores.toastTexto;
  return (
    <Pressable
      onPressIn={aoPressionar}
      onPressOut={aoSoltar}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: espaco[3],
        minHeight: 48,
        paddingVertical: espaco[2],
        paddingLeft: espaco[4],
        paddingRight: espaco[2],
        borderRadius: raio.grande,
        backgroundColor: cores.toastFundo,
        boxShadow: sombras.sombra2,
      }}
    >
      {iconeFinal ? <Icone nome={iconeFinal} cor={corDoIcone} /> : null}
      <Texto variante="corpoPequeno" style={{ flex: 1, color: cores.toastTexto }} numberOfLines={2}>
        {texto}
      </Texto>
      {acao ? (
        <View>
          {/* o botão de texto do aviso usa a cor de ação do aviso (invertida no claro) */}
          <BotaoDoAviso rotulo={acao.rotulo} aoTocar={acao.aoTocar} cor={cores.toastAcao} />
        </View>
      ) : null}
    </Pressable>
  );
}

/** O "Desfazer" do aviso: o botão de texto, com a cor de ação do aviso no lugar da marca. */
function BotaoDoAviso({ rotulo, aoTocar, cor }: { rotulo: string; aoTocar: () => void; cor: string }) {
  return (
    <SobreposicaoDeCores cores={{ marca: cor }}>
      <Botao variante="texto" rotulo={rotulo} intrinseco aoTocar={aoTocar} estilo={{ minWidth: 0 }} />
    </SobreposicaoDeCores>
  );
}

// ---------------------------------------------------------------------------
// Provedor: um aviso por vez, acima da barra de abas
// ---------------------------------------------------------------------------

interface ContextoDoAviso {
  mostrar: (aviso: DadosDoAviso) => void;
  esconder: () => void;
  /** Distância da base da tela até o aviso (a barra de abas e a faixa do descanso mudam isso). */
  definirMargemInferior: (px: number | null) => void;
}

const Contexto = createContext<ContextoDoAviso | null>(null);

export function ProvedorDeAvisoRapido({ children }: { children: ReactNode }) {
  const { reduzirMovimento } = useTema();
  const insets = useSafeAreaInsets();
  const [aviso, setAviso] = useState<(DadosDoAviso & { chave: number }) | null>(null);
  const [margem, setMargem] = useState<number | null>(null);
  const relogio = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contador = useRef(0);

  const parar = () => {
    if (relogio.current) clearTimeout(relogio.current);
    relogio.current = null;
  };
  const agendar = useCallback((tipo?: TipoDoAviso) => {
    parar();
    relogio.current = setTimeout(() => setAviso(null), tipo === 'erro' ? 8000 : duracao.toast);
  }, []);

  const valor = useMemo<ContextoDoAviso>(
    () => ({
      mostrar: (a) => {
        contador.current += 1;
        setAviso({ ...a, chave: contador.current });
        agendar(a.tipo);
      },
      esconder: () => {
        parar();
        setAviso(null);
      },
      definirMargemInferior: setMargem,
    }),
    [agendar],
  );
  useEffect(() => parar, []);

  // padrão: acima da barra de abas (56 + área segura) com 16 de folga
  const base = margem ?? layout.alturaBarraAbas + Math.max(insets.bottom, layout.areaSegura.baseMinima) + espaco[4];
  const entrada = reduzirMovimento
    ? FadeIn.duration(duracao.esmaecerReduzido).reduceMotion(ReduceMotion.Never)
    : new Keyframe({
        0: { opacity: 0, transform: [{ translateY: 16 }] },
        100: { opacity: 1, transform: [{ translateY: 0 }], easing: Easing.bezier(...(tokens.curva.entrada as unknown as [number, number, number, number])) },
      }).duration(duracao.media);
  const saida = reduzirMovimento
    ? FadeOut.duration(duracao.esmaecerReduzido).reduceMotion(ReduceMotion.Never)
    : new Keyframe({
        0: { opacity: 1, transform: [{ translateY: 0 }] },
        100: { opacity: 0, transform: [{ translateY: 8 }], easing: Easing.bezier(...(tokens.curva.saida as unknown as [number, number, number, number])) },
      }).duration(duracao.rapida);

  return (
    <Contexto.Provider value={valor}>
      {children}
      {/* em tela larga (navegador do PC) o aviso fica na coluna de conteúdo, como a barra de abas */}
      <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom: base, zIndex: tokens.camada.toast, alignItems: 'center' }}>
        <View pointerEvents="box-none" style={{ width: '100%', maxWidth: layout.larguraMaximaConteudo, paddingHorizontal: layout.margemLateral }}>
        {aviso ? (
          <Animated.View key={aviso.chave} entering={entrada} exiting={saida}>
            <AvisoRapido
              {...aviso}
              acao={aviso.acao ? { rotulo: aviso.acao.rotulo, aoTocar: () => { aviso.acao!.aoTocar(); valor.esconder(); } } : undefined}
              aoPressionar={parar}
              aoSoltar={() => agendar(aviso.tipo)}
            />
          </Animated.View>
        ) : null}
        </View>
      </View>
    </Contexto.Provider>
  );
}

export function useAvisoRapido(): ContextoDoAviso {
  const c = useContext(Contexto);
  if (!c) throw new Error('useAvisoRapido() fora do <ProvedorDeAvisoRapido>');
  return c;
}
