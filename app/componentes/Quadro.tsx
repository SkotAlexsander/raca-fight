/**
 * Medidor (`.p-medidor`), quadro de número (`.p-quadro`), a grade de dois
 * quadros (`.p-grade-2`) e as barras dos últimos dias com o valor em cima
 * (`.p-grafico` do painel do dono, com "Ver em tabela").
 *
 * Promovidos pelo agente AA (P11) de `telas/academia/pecas.tsx` (agente Z).
 * As barras por semana da Evolução (meta tracejada, semana em andamento
 * hachurada) estão em `Graficos.tsx`.
 */
import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated from 'react-native-reanimated';
import { borda, espaco, estiloDeTexto, layout, raio, useTema } from '@/tema';
import { Botao } from './Botao';
import { Icone, type NomeDoIcone } from './Icone';
import { Texto } from './Texto';
import { usePressionado } from './usePressionado';

const BOLD = estiloDeTexto('titulo1').estilo.fontFamily;
const SEMIBOLD = estiloDeTexto('titulo2').estilo.fontFamily;

/** Barra de 8 (`.p-medidor`): o que já foi, em `marca` (no vidro, o destaque do vidro). */
export function Medidor({ fracao, rotuloAcessivel }: { fracao: number; rotuloAcessivel?: string }) {
  const { cores } = useTema();
  return (
    <View accessibilityRole="progressbar" accessibilityLabel={rotuloAcessivel} accessibilityValue={{ min: 0, max: 100, now: Math.round(fracao * 100) }} aria-label={rotuloAcessivel ?? `${Math.round(fracao * 100)} por cento`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(fracao * 100)} style={{ height: 8, borderRadius: 4, backgroundColor: cores.trilho, overflow: 'hidden' }}>
      <View style={{ width: `${Math.max(0, Math.min(1, fracao)) * 100}%`, height: '100%', borderRadius: 4, backgroundColor: cores.marca }} />
    </View>
  );
}

/** Quadro de número (`.p-quadro`): rótulo com ícone, número `numeroMedio`, apoio e ação. */
export function Quadro({ icone, rotulo, numero, apoio, acao, atencao, aoTocar, rotuloAcessivel }: { icone: NomeDoIcone; rotulo: string; numero: string; apoio: string; acao?: string; atencao?: boolean; aoTocar?: () => void; rotuloAcessivel?: string }) {
  const { cores, sombras } = useTema();
  const { aoPressionar, aoSoltar, estiloDoCorpo, estiloDaCamada } = usePressionado({ afundar: true });
  const corpo = (
    <View style={{ flex: 1, minHeight: 112, padding: espaco[3], gap: espaco[1], borderRadius: raio.grande, backgroundColor: cores.superficie, boxShadow: sombras.sombra2, overflow: 'hidden' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco[2] }}>
        <Icone nome={icone} tamanho="pequeno" cor={atencao ? 'atencao' : 'textoSecundario'} />
        <Texto variante="corpoPequeno" cor="textoSecundario" style={{ fontFamily: SEMIBOLD, flex: 1 }} numberOfLines={1}>
          {rotulo}
        </Texto>
      </View>
      <View style={{ flexGrow: 1 }} />
      <Texto variante="numeroMedio" style={{ fontFamily: estiloDeTexto('numeroDestaque').estilo.fontFamily }}>
        {numero}
      </Texto>
      <Texto variante="corpoPequeno" cor="textoSecundario">
        {apoio}
      </Texto>
      {acao ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco[1], minHeight: 24 }}>
          <Texto variante="corpoPequeno" cor="marca" style={{ fontFamily: BOLD }}>
            {acao}
          </Texto>
          <Icone nome="avancar" tamanho="pequeno" cor="marca" />
        </View>
      ) : null}
      {aoTocar ? (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: cores.camadaToque }]}>
          <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: cores.texto }, estiloDaCamada]} />
        </View>
      ) : null}
    </View>
  );
  if (!aoTocar) return <View style={{ flex: 1, minWidth: layout.larguraMinimaColunaCartao }}>{corpo}</View>;
  return (
    <Pressable onPress={aoTocar} onPressIn={aoPressionar} onPressOut={aoSoltar} accessibilityRole="button" accessibilityLabel={rotuloAcessivel ?? `${numero} ${rotulo}. ${apoio}`} style={{ flex: 1, minWidth: layout.larguraMinimaColunaCartao }}>
      <Animated.View style={[{ flex: 1 }, estiloDoCorpo]}>{corpo}</Animated.View>
    </Pressable>
  );
}

/** Dois quadros por linha (`.p-grade-2`, mínimo 150 por coluna). */
export function GradeDeQuadros({ children }: { children: ReactNode }) {
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: espaco[3] }}>{children}</View>;
}

/**
 * Barras dos últimos dias (`.p-grafico` barras): neutras, o destaque (hoje) em
 * `progresso`, o valor em cima de cada uma e o dia embaixo. "Ver em tabela"
 * abre a mesma informação em texto (cada gráfico tem a sua tabela).
 */
export function GraficoDeBarrasDosDias({ rotulos, valores, destaque, unidade, unidade1 }: { rotulos: string[]; valores: number[]; destaque: number; unidade: string; unidade1: string }) {
  const { cores } = useTema();
  const [tabela, setTabela] = useState(false);
  const { fontScale } = useWindowDimensions();
  const maximo = Math.max(1, ...valores);
  const ALTURA = 120;
  const legenda = estiloDeTexto('legendaGrafico').estilo;
  return (
    <View style={{ gap: espaco[3] }}>
      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel={`Gráfico de barras. ${rotulos.map((r, i) => `${r}: ${valores[i]} ${valores[i] === 1 ? unidade1 : unidade}`).join('; ')}`}
        style={{ flexDirection: 'row', alignItems: 'flex-end', gap: espaco[2], height: ALTURA + 2 * (legenda.lineHeight ?? 16) * Math.min(fontScale, 1.3) + espaco[2] }}
      >
        {valores.map((v, i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center', gap: espaco[1] }}>
            <Texto variante="legendaGrafico" cor={i === destaque ? 'texto' : 'textoSecundario'} maxFontSizeMultiplier={1.3}>
              {v}
            </Texto>
            <View style={{ width: '100%', maxWidth: 32, height: Math.max(2, (v / maximo) * ALTURA), borderRadius: raio.pequeno / 2, backgroundColor: i === destaque ? cores.progresso : cores.graficoNeutro1 }} />
            <Texto variante="legendaGrafico" cor={i === destaque ? 'texto' : 'textoSecundario'} maxFontSizeMultiplier={1.3} style={i === destaque ? { fontFamily: BOLD } : undefined}>
              {rotulos[i]}
            </Texto>
          </View>
        ))}
      </View>
      <Botao variante="texto" tamanho="pequeno" intrinseco rotulo={tabela ? 'Esconder a tabela' : 'Ver em tabela'} aoTocar={() => setTabela((t) => !t)} estilo={{ alignSelf: 'flex-start', marginLeft: -espaco[3] }} />
      {tabela ? (
        <View style={{ borderTopWidth: borda.fina, borderTopColor: cores.borda }}>
          {rotulos.map((r, i) => (
            <View key={r + i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: espaco[2], borderBottomWidth: borda.fina, borderBottomColor: cores.borda }}>
              <Texto variante="corpoPequeno">{r}</Texto>
              <Texto variante="corpoPequeno" style={{ fontVariant: ['tabular-nums'] }}>
                {valores[i]} {valores[i] === 1 ? unidade1 : unidade}
              </Texto>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
