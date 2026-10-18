/**
 * A pilha de cada aba do aluno (cada aba mantém a sua, catálogo 4.4): a
 * transição nativa; com "reduzir movimento", o esmaecer de 160.
 */
import { Stack } from 'expo-router';
import { duracao, useTema } from '@/tema';

export function PilhaDaAba() {
  const { cores, reduzirMovimento } = useTema();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: cores.fundo },
        animation: reduzirMovimento ? 'fade' : 'default',
        animationDuration: reduzirMovimento ? duracao.esmaecerReduzido : undefined,
      }}
    />
  );
}
