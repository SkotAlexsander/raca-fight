/**
 * As abas de uma visão (aluno ou academia) com a NOSSA barra (componente 12),
 * encostada na base, nas duas plataformas, e o que fica ACIMA da barra (a
 * faixa do cronômetro ou do treino em andamento, componente 7, R9.14).
 *
 * - Troca de aba: o conteúdo esmaece em `media`, sem deslizar de lado; cada
 *   aba mantém a sua pilha (catálogo 4.4). Reduzido: esmaecer de 160.
 * - Tocar a aba ativa emite `tabPress`: a tela que usa `useScrollToTop` volta
 *   ao topo (componente 12, regra 2); numa tela de dentro, volta à raiz da
 *   pilha daquela aba.
 * - A aba que o papel não tem fica fora da barra E da navegação (`href: null`).
 *
 * Promovido pelo agente AA (P11) de `telas/compartilhado/AbasDaVisao.tsx`
 * (agente X) e de `telas/aluno/comum/AbasDoAluno.tsx` (agente Y), que eram o
 * mesmo componente com um espaço acima da barra.
 */
import { Tabs } from 'expo-router';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import type { ReactNode } from 'react';
import { Easing, Pressable, StyleSheet, View } from 'react-native';
import { duracao, espaco, layout, tokens, useTema } from '@/tema';
import { BarraDeAbas } from './BarraDeAbas';
import { Botao } from './Botao';
import { Icone, type NomeDoIcone } from './Icone';
import { Texto } from './Texto';

const bezier = (c: readonly number[]) => Easing.bezier(c[0], c[1], c[2], c[3]);

export interface AbaDaVisao {
  /** Nome do arquivo da rota dentro do grupo. */
  rota: string;
  rotulo: string;
  icone: NomeDoIcone;
}

export function AbasDaVisao({ abas, todas, acimaDaBarra }: { abas: AbaDaVisao[]; todas: AbaDaVisao[]; acimaDaBarra?: ReactNode }) {
  const { reduzirMovimento } = useTema();
  const visiveis = new Set(abas.map((a) => a.rota));

  const barra = ({ state, navigation }: BottomTabBarProps) => {
    const ativa = state.routes[state.index]?.name ?? '';
    return (
      <View>
        {acimaDaBarra}
        <BarraDeAbas
          abas={abas.map((a) => ({ chave: a.rota, rotulo: a.rotulo, icone: a.icone }))}
          ativa={ativa}
          aoEscolher={(rota) => {
            const alvo = state.routes.find((r) => r.name === rota);
            if (!alvo) return;
            const evento = navigation.emit({ type: 'tabPress', target: alvo.key, canPreventDefault: true });
            if (evento.defaultPrevented) return;
            if (rota !== ativa) navigation.navigate(rota);
            // tocar a aba ativa numa tela de dentro volta à raiz da pilha dela
            else if ((alvo.state?.index ?? 0) > 0) navigation.navigate(rota, { screen: 'index' });
          }}
        />
      </View>
    );
  };

  return (
    <Tabs
      tabBar={barra}
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        transitionSpec: {
          animation: 'timing',
          config: {
            duration: reduzirMovimento ? duracao.esmaecerReduzido : duracao.media,
            easing: reduzirMovimento ? bezier(tokens.curva.entrada) : bezier(tokens.curva.padrao),
          },
        },
      }}
    >
      {todas.map((a) => (
        <Tabs.Screen key={a.rota} name={a.rota} options={{ title: a.rotulo, href: visiveis.has(a.rota) ? undefined : null }} />
      ))}
    </Tabs>
  );
}

/**
 * A faixa de 56 acima da barra com o cronômetro rodando ou pausado
 * ("Descanso · 0:45", "Trabalho 3/8 · 0:14"): a barra de progresso de 4 em
 * cima (laranja nos últimos segundos), pausar/retomar e pular. Tocar na faixa
 * abre o cronômetro ou volta ao treino. Sólida em `vidroBarra` (é opaca acima
 * da barra; ver Y-ALUNO.md, 3.2).
 */
export function FaixaDoCronometro({
  nome,
  tempo,
  segundos,
  progresso,
  acabando,
  pausado,
  rotuloAoAbrir,
  aoAbrir,
  aoAlternar,
  rotuloAoPular,
  aoPular,
}: {
  nome: string;
  /** "0:45" */
  tempo: string;
  segundos: number;
  /** 0 a 1 do que já passou; o que falta é a barra cheia. */
  progresso: number;
  acabando: boolean;
  pausado: boolean;
  rotuloAoAbrir: string;
  aoAbrir: () => void;
  aoAlternar: () => void;
  rotuloAoPular?: string;
  aoPular?: () => void;
}) {
  const { cores } = useTema();
  return (
    <View
      accessibilityRole="timer"
      accessibilityLabel={`${nome}, ${segundos} segundos${pausado ? ', pausado' : ''}`}
      style={{ height: layout.alturaLinhaCompacta, backgroundColor: cores.vidroBarra, borderTopWidth: 1, borderTopColor: cores.borda }}
    >
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, backgroundColor: cores.trilho }}>
        <View style={{ width: `${Math.round((1 - progresso) * 100)}%`, height: 4, backgroundColor: acabando ? cores.atencao : cores.progresso }} />
      </View>
      <View style={{ flex: 1, width: '100%', maxWidth: layout.larguraMaximaConteudo, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: espaco[3], paddingLeft: espaco[4], paddingRight: espaco[2] }}>
        <Pressable style={[StyleSheet.absoluteFill]} onPress={aoAbrir} accessibilityRole="button" accessibilityLabel={rotuloAoAbrir} />
        <Icone nome="relogio" cor={pausado ? 'textoSecundario' : 'texto'} />
        <Texto variante="corpoForte" cor={pausado ? 'textoSecundario' : 'texto'} style={{ flex: 1, fontVariant: ['tabular-nums'] }} numberOfLines={1}>
          {`${nome} · ${tempo}`}
        </Texto>
        <Botao variante="neutro" tamanho="icone" icone={pausado ? 'comecar' : 'pausar'} rotuloAcessivel={pausado ? 'Retomar' : 'Pausar'} aoTocar={aoAlternar} />
        {aoPular ? <Botao variante="neutro" tamanho="icone" icone="pular" rotuloAcessivel={rotuloAoPular ?? 'Pular'} aoTocar={aoPular} /> : null}
      </View>
    </View>
  );
}
