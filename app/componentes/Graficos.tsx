/**
 * Os gráficos da Evolução (novas.html, quadro 2; novas.css `.p-grafico`,
 * `.p-mapa`, `.p-rosca`): linha da carga, mapa do mês, barras por semana e a
 * rosca de volume por grupo. SVG do react-native-svg com as cores do tema
 * (`grafico*`, `progresso`, `mapa*`) e o texto de 13 (`legendaGrafico`).
 * Cada gráfico tem "Ver em tabela" (quem usa põe).
 *
 * Promovidos pelo agente AA (P11) de `telas/aluno/comum/Graficos.tsx`
 * (agente Y). As barras dos 7 dias do painel do dono, com o valor em cima,
 * estão em `Quadro.tsx` (`GraficoDeBarrasDosDias`).
 */
import { useState } from 'react';
import { Pressable, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Defs, Line, Path, Pattern, Rect, Text as TextoSvg } from 'react-native-svg';
import { Texto } from './Texto';
import { borda, espaco, estiloDeTexto, raio, tokens, useTema } from '@/tema';

const LEGENDA = estiloDeTexto('legendaGrafico').estilo;
const { mapa } = tokens;

function useLargura(): [number, (e: LayoutChangeEvent) => void] {
  const [w, setW] = useState(0);
  return [w, (e) => setW(Math.round(e.nativeEvent.layout.width))];
}

// ---------------------------------------------------------------------------
// Linha (carga ao longo do tempo)
// ---------------------------------------------------------------------------

export function GraficoDeLinha({ rotulos, valores, unidade, rotuloAcessivel }: { rotulos: string[]; valores: number[]; unidade: string; rotuloAcessivel: string }) {
  const { cores } = useTema();
  const [largura, aoMedir] = useLargura();
  const altura = 168;
  const esq = 32;
  const dir = 16;
  const topo = 24;
  const base = 24;
  const min = Math.floor(Math.min(...valores) / 10) * 10;
  const max = Math.max(min + 10, Math.ceil(Math.max(...valores) / 10) * 10);
  const x = (i: number) => esq + (valores.length === 1 ? 0 : (i * (largura - esq - dir)) / (valores.length - 1));
  const y = (v: number) => topo + (1 - (v - min) / (max - min)) * (altura - topo - base);
  const pontos = valores.map((v, i) => `${x(i)},${y(v)}`);
  const linhas = [min, (min + max) / 2, max];
  const ultimo = valores.length - 1;
  return (
    <View onLayout={aoMedir} accessible accessibilityRole="image" accessibilityLabel={rotuloAcessivel} style={{ height: altura }}>
      {largura > 0 ? (
        <Svg width={largura} height={altura}>
          {linhas.map((v) => (
            <Line key={v} x1={esq} x2={largura - dir} y1={y(v)} y2={y(v)} stroke={cores.graficoGrade} strokeWidth={1} />
          ))}
          {linhas.map((v) => (
            <TextoSvg key={`r${v}`} x={0} y={y(v) + 4} fill={cores.textoSecundario} fontSize={LEGENDA.fontSize} fontFamily={LEGENDA.fontFamily as string}>
              {Number.isInteger(v) ? v : v.toFixed(1)}
            </TextoSvg>
          ))}
          {valores.length > 1 ? <Path d={`M${pontos[0]} L${pontos.slice(1).join(' L')} L${x(ultimo)},${altura - base} L${x(0)},${altura - base} Z`} fill={cores.graficoArea} /> : null}
          <Path d={`M${pontos.join(' L')}`} fill="none" stroke={cores.progresso} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
          <Circle cx={x(ultimo)} cy={y(valores[ultimo])} r={5} fill={cores.progresso} stroke={cores.superficie} strokeWidth={2} />
          <TextoSvg x={x(ultimo)} y={y(valores[ultimo]) - 10} textAnchor="end" fill={cores.texto} fontSize={LEGENDA.fontSize} fontFamily={LEGENDA.fontFamily as string}>
            {`${String(valores[ultimo]).replace('.', ',')} ${unidade}`}
          </TextoSvg>
          {rotulos.map((r, i) =>
            i === 0 || i === ultimo || (rotulos.length > 4 && i === Math.floor(ultimo / 2)) ? (
              <TextoSvg key={`x${i}`} x={x(i)} y={altura - 4} textAnchor={i === 0 ? 'start' : i === ultimo ? 'end' : 'middle'} fill={cores.textoSecundario} fontSize={LEGENDA.fontSize} fontFamily={LEGENDA.fontFamily as string}>
                {r}
              </TextoSvg>
            ) : null,
          )}
        </Svg>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Barras (treinos por semana)
// ---------------------------------------------------------------------------

export function GraficoDeBarras({ rotulos, valores, maximo, meta, andamento, destaque, rotuloAcessivel }: { rotulos: string[]; valores: number[]; maximo: number; meta?: number; andamento?: number; destaque?: number; rotuloAcessivel: string }) {
  const { cores } = useTema();
  const [largura, aoMedir] = useLargura();
  const altura = 152;
  const base = 22;
  const topo = 8;
  const passo = largura / Math.max(1, valores.length);
  const larguraDaBarra = Math.min(28, passo * 0.56);
  const y = (v: number) => topo + (1 - v / maximo) * (altura - topo - base);
  return (
    <View onLayout={aoMedir} accessible accessibilityRole="image" accessibilityLabel={rotuloAcessivel} style={{ height: altura }}>
      {largura > 0 ? (
        <Svg width={largura} height={altura}>
          <Defs>
            <Pattern id="hachura" patternUnits="userSpaceOnUse" width={6} height={6} patternTransform="rotate(45)">
              <Rect width={6} height={6} fill={cores.graficoArea} />
              <Line x1={0} y1={0} x2={0} y2={6} stroke={cores.progresso} strokeWidth={2} />
            </Pattern>
          </Defs>
          <Line x1={0} x2={largura} y1={altura - base} y2={altura - base} stroke={cores.graficoGrade} strokeWidth={1} />
          {valores.map((v, i) => {
            const cx = passo * i + passo / 2;
            const h = Math.max(2, altura - base - y(v));
            const emAndamento = i === andamento;
            return (
              <Rect
                key={i}
                x={cx - larguraDaBarra / 2}
                y={altura - base - h}
                width={larguraDaBarra}
                height={h}
                rx={4}
                fill={emAndamento ? 'url(#hachura)' : i === destaque ? cores.progresso : cores.graficoNeutro1}
                stroke={emAndamento ? cores.progresso : undefined}
                strokeWidth={emAndamento ? 1.5 : 0}
              />
            );
          })}
          {meta !== undefined ? <Line x1={0} x2={largura} y1={y(meta)} y2={y(meta)} stroke={cores.textoSecundario} strokeWidth={1.5} strokeDasharray="4 4" /> : null}
          {rotulos.map((r, i) => (
            <TextoSvg key={`x${i}`} x={passo * i + passo / 2} y={altura - 4} textAnchor="middle" fill={cores.textoSecundario} fontSize={LEGENDA.fontSize} fontFamily={LEGENDA.fontFamily as string}>
              {r}
            </TextoSvg>
          ))}
        </Svg>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Mapa do mês (frequência)
// ---------------------------------------------------------------------------

export function MapaDoMes({ primeiroDiaDaSemana, dias, treinos, hoje, rotuloAcessivel }: { primeiroDiaDaSemana: number; dias: number; treinos: Set<number>; hoje: number; rotuloAcessivel: string }) {
  const { cores } = useTema();
  // primeiroDiaDaSemana: 0 = segunda … 6 = domingo
  const celulas: (number | null)[] = [...Array(primeiroDiaDaSemana).fill(null), ...Array.from({ length: dias }, (_, i) => i + 1)];
  while (celulas.length % 7) celulas.push(null);
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={rotuloAcessivel} style={{ gap: espaco[2] }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((l, i) => (
          <View key={i} style={{ width: mapa.dia, alignItems: 'center' }}>
            <Texto variante="legenda" cor="textoSecundario">
              {l}
            </Texto>
          </View>
        ))}
      </View>
      {Array.from({ length: celulas.length / 7 }, (_, s) => (
        <View key={s} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {celulas.slice(s * 7, s * 7 + 7).map((d, i) => {
            if (d === null) return <View key={i} style={{ width: mapa.dia, height: mapa.dia }} />;
            const treinou = treinos.has(d);
            const ehHoje = d === hoje;
            const futuro = d > hoje;
            return (
              <View
                key={i}
                style={{
                  width: mapa.dia,
                  height: mapa.dia,
                  borderRadius: raio.medio,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: treinou ? cores.progresso : futuro || ehHoje ? 'transparent' : cores.mapaVazio,
                  borderWidth: ehHoje ? borda.media : futuro ? borda.fina : 0,
                  borderColor: ehHoje ? cores.progresso : cores.regua,
                }}
              >
                <Texto variante="legenda" style={{ color: treinou ? cores.marcaTexto : ehHoje ? cores.texto : cores.textoSecundario }}>
                  {d}
                </Texto>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Rosca (volume por grupo)
// ---------------------------------------------------------------------------

export function Rosca({ grupos, valores, unidade }: { grupos: string[]; valores: number[]; unidade: string }) {
  const { cores } = useTema();
  const [destaque, setDestaque] = useState(0);
  const total = valores.reduce((s, v) => s + v, 0) || 1;
  const tamanho = 148;
  const traco = 22;
  const r = (tamanho - traco) / 2;
  const circ = 2 * Math.PI * r;
  const paleta = [cores.graficoNeutro1, cores.graficoNeutro2, cores.graficoNeutro3, cores.graficoNeutro2];
  let acumulado = 0;
  const pct = (v: number) => Math.round((v / total) * 100);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco[4], flexWrap: 'wrap' }}>
      <View style={{ width: tamanho, height: tamanho }} accessible accessibilityRole="image" accessibilityLabel={grupos.map((g, i) => `${g}: ${pct(valores[i])} por cento`).join(', ')}>
        <Svg width={tamanho} height={tamanho} style={{ transform: [{ rotate: '-90deg' }] }}>
          {valores.map((v, i) => {
            const fatia = (v / total) * circ;
            const el = (
              <Circle key={i} cx={tamanho / 2} cy={tamanho / 2} r={r} fill="none" stroke={i === destaque ? cores.progresso : paleta[i % paleta.length]} strokeWidth={traco} strokeDasharray={`${Math.max(0, fatia - 2)} ${circ}`} strokeDashoffset={-acumulado} />
            );
            acumulado += fatia;
            return el;
          })}
        </Svg>
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
          <Texto variante="numeroMedio">{pct(valores[destaque] ?? 0)}%</Texto>
          <Texto variante="legenda" cor="textoSecundario" numberOfLines={1}>
            {grupos[destaque]}
          </Texto>
        </View>
      </View>
      <View style={{ flex: 1, minWidth: 140, gap: espaco[1] }}>
        {grupos.map((g, i) => (
          <Pressable key={g} onPress={() => setDestaque(i)} accessibilityRole="button" accessibilityState={{ selected: i === destaque }} aria-pressed={i === destaque} accessibilityLabel={`${g}, ${pct(valores[i])} por cento`} style={{ minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: espaco[2] }}>
            <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: i === destaque ? cores.progresso : paleta[i % paleta.length] }} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Texto variante={i === destaque ? 'corpoForte' : 'corpoPequeno'} numberOfLines={1}>
                {g}
              </Texto>
              <Texto variante="legendaGrafico" cor="textoSecundario">
                {pct(valores[i])}% · {Math.round(valores[i]).toLocaleString('pt-BR')} {unidade}
              </Texto>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

/** "Ver em tabela": a mesma informação em linhas, para quem não lê gráfico. */
export function Tabela({ cabecalho, linhas }: { cabecalho: [string, string]; linhas: [string, string][] }) {
  const { cores } = useTema();
  return (
    <View accessibilityRole="list" style={{ borderRadius: raio.medio, borderWidth: borda.fina, borderColor: cores.borda, overflow: 'hidden' }}>
      {[cabecalho, ...linhas].map(([a, b], i) => (
        <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: espaco[3], paddingVertical: espaco[2], backgroundColor: i === 0 ? cores.fundo : 'transparent', borderTopWidth: i === 0 ? 0 : borda.fina, borderTopColor: cores.borda }}>
          <Texto variante={i === 0 ? 'legenda' : 'corpoPequeno'} cor={i === 0 ? 'textoSecundario' : 'texto'}>
            {a}
          </Texto>
          <Texto variante={i === 0 ? 'legenda' : 'legendaGrafico'} cor={i === 0 ? 'textoSecundario' : 'texto'}>
            {b}
          </Texto>
        </View>
      ))}
    </View>
  );
}
