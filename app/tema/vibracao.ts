/**
 * Vibração (tokens.json › vibracao; 06-IPHONE.md). Nunca com `await`: a
 * vibração sai no mesmo quadro da mudança do dado e não segura nada
 * (catálogo de movimento, regra 5). Tudo desliga pela chave "Vibração" do Perfil.
 */
import * as Haptics from 'expo-haptics';
import { Platform, Vibration } from 'react-native';
import { vibracao } from './gerado/tokens';

export type MomentoDeVibrar = keyof typeof vibracao;

export function vibrar(momento: MomentoDeVibrar, ligada: boolean): void {
  if (!ligada || Platform.OS === 'web') return;
  const tipo = vibracao[momento];
  try {
    switch (tipo) {
      case 'impactoLeve':
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        return;
      case 'impactoMedio':
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        return;
      case 'selecao':
        void Haptics.selectionAsync();
        return;
      case 'notificacaoSucesso':
        // iPhone: não existe vibração longa por API pública → padrão de sucesso (2 toques).
        // Android: pulso longo de ~400 ms (componente 7).
        if (Platform.OS === 'android') Vibration.vibrate(400);
        else void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return;
      case 'notificacaoErro':
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
    }
  } catch {
    // vibração é um extra: a tela sempre muda junto (06-IPHONE.md)
  }
}
