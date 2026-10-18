/**
 * O desfoque por trás do Vidro, no celular: `BlurView` do expo-blur com
 * `intensity` perto de `vidro.desfoque × 2,5` (componente 20, "No iPhone").
 * No Android o BlurView só desfoca a partir do Android 12 e pede o método
 * experimental; abaixo disso não há desfoque e o Vidro nasce sólido
 * (`podeDesfocar()` decide).
 *
 * No navegador vale `FundoDesfocado.web.tsx` (o `backdrop-filter` do mockup).
 */
import { BlurView } from 'expo-blur';
import { Platform, StyleSheet } from 'react-native';
import { vidro } from '@/tema';

export function podeDesfocar(): boolean {
  if (Platform.OS === 'android') return typeof Platform.Version === 'number' && Platform.Version >= 31;
  return true;
}

export function FundoDesfocado({ esquema, raio }: { esquema: 'claro' | 'escuro'; raio: number }) {
  return (
    <BlurView
      pointerEvents="none"
      intensity={Math.min(100, vidro.desfoque * 2.5)}
      tint={esquema === 'escuro' ? 'dark' : 'light'}
      experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
      style={[StyleSheet.absoluteFill, { borderRadius: raio, overflow: 'hidden' }]}
    />
  );
}
