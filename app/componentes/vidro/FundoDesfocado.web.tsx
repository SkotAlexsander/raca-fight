/**
 * O desfoque no navegador: o mesmo `backdrop-filter` do mockup
 * (`blur(24px) saturate(1.6)`, tokens.json › vidro). O BlurView do expo-blur
 * para a web pinta uma cor própria por cima (rgba de 249 ou 25), que mudaria a
 * cor medida do vidro; por isso a versão web é esta (registrado em X-BASE.md).
 */
import { StyleSheet, View } from 'react-native';
import { vidro } from '@/tema';

export function podeDesfocar(): boolean {
  return true;
}

export function FundoDesfocado({ raio }: { esquema: 'claro' | 'escuro'; raio: number }) {
  const filtro = `blur(${vidro.desfoque}px) saturate(${vidro.saturacao})`;
  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { borderRadius: raio, backdropFilter: filtro, WebkitBackdropFilter: filtro } as object]}
    />
  );
}
