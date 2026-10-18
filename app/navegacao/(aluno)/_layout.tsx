/**
 * App do aluno (luta). Só entra quem o vínculo manda para cá — inclusive o
 * aluno com o pedido pendente (vitrine, R14.7). Uma pilha por cima das abas: a
 * comemoração da graduação ocupa a tela inteira, sem abas. O cronômetro de
 * rounds é da raiz (`/cronometro`). O que passa de tela em tela (aviso
 * dispensado, cadastro, avisos) mora no `ProvedorDoAluno`.
 */
import { Redirect, Stack } from 'expo-router';
import { View } from 'react-native';
import { useSessao } from '@/dados';
import { duracao, useTema } from '@/tema';
import { ProvedorDoAluno } from '@/telas/aluno/estado/ProvedorDoAluno';

export default function LayoutDoAluno() {
  const { carregando, destino, usuario } = useSessao();
  const { cores, reduzirMovimento } = useTema();
  if (carregando) return <View style={{ flex: 1, backgroundColor: cores.fundo }} />;
  if (destino.tipo !== 'visao' || destino.visao !== 'aluno') return <Redirect href="/" />;
  return (
    <ProvedorDoAluno key={usuario?.id ?? 'sem-conta'}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: cores.fundo },
          animation: reduzirMovimento ? 'fade' : 'default',
          animationDuration: reduzirMovimento ? duracao.esmaecerReduzido : undefined,
        }}
      >
        <Stack.Screen name="(abas)" />
        <Stack.Screen name="comemoracao" options={{ animation: 'fade', gestureEnabled: false }} />
        <Stack.Screen name="dieta" />
      </Stack>
    </ProvedorDoAluno>
  );
}
