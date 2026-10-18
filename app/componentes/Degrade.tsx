/**
 * Os degradês do tokens.json já traduzidos pelo gerador: o linear vai pelo
 * expo-linear-gradient, o radial (a luz lateral da foto) pelo react-native-svg.
 */
import { useId } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import type { DegradeLinear, DegradeRadial } from '@/tema';

export function DegradeLinearDoToken({ degrade, estilo }: { degrade: DegradeLinear; estilo?: StyleProp<ViewStyle> }) {
  return (
    <LinearGradient
      pointerEvents="none"
      colors={degrade.cores as unknown as [string, string, ...string[]]}
      locations={degrade.posicoes as unknown as [number, number, ...number[]]}
      start={degrade.inicio}
      end={degrade.fim}
      style={[StyleSheet.absoluteFill, estilo]}
    />
  );
}

export function DegradeRadialDoToken({ degrade }: { degrade: DegradeRadial }) {
  const id = `radial${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <Svg pointerEvents="none" style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none">
      <Defs>
        <RadialGradient id={id} cx={degrade.cx} cy={degrade.cy} rx={degrade.rx} ry={degrade.ry} fx={degrade.cx} fy={degrade.cy} gradientUnits="objectBoundingBox">
          {degrade.cores.map((cor, i) => (
            <Stop key={i} offset={degrade.posicoes[i]} stopColor={corSemAlfa(cor)} stopOpacity={alfaDe(cor)} />
          ))}
        </RadialGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}

/** O react-native-svg quer a opacidade do Stop separada da cor. */
function alfaDe(cor: string): number {
  const m = /rgba\([^)]*,\s*([\d.]+)\)/.exec(cor);
  return m ? Number(m[1]) : 1;
}
function corSemAlfa(cor: string): string {
  const m = /rgba\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/.exec(cor);
  return m ? `rgb(${m[1]}, ${m[2]}, ${m[3]})` : cor;
}
