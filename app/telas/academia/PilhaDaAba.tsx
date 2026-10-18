/**
 * A pilha de cada aba da academia: a aba guarda a própria pilha (catálogo 4.4)
 * e a barra de abas continua visível nas telas de dentro (o perfil do aluno
 * do mockup tem a barra). Transição nativa; com "reduzir movimento", esmaecer.
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
