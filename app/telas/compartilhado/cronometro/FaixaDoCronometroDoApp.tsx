/**
 * A faixa de 56 acima das abas com o cronômetro de rounds rodando ou pausado
 * (R9.14, F21.6): "Round 2/3 · 1:48", "Intervalo · 0:30". Tocar abre a tela
 * cheia; pausar e pular sem sair da aba (o professor vai à chamada e o
 * cronômetro segue). Nos dois apps (aluno e equipe).
 */
import { useRouter } from 'expo-router';
import { FaixaDoCronometro } from '@/componentes';
import { mmss } from '@/dominio/rounds/rounds';
import { useCronometroDoApp } from './ProvedorDoCronometro';

export function FaixaDoCronometroDoApp() {
  const router = useRouter();
  const { atual, leitura, agir } = useCronometroDoApp();
  if (!atual || !leitura || leitura.fase === 'parado' || leitura.fase === 'fim') return null;
  const nome = leitura.fase === 'round' ? `Round ${leitura.round}/${leitura.rounds}` : leitura.fase === 'intervalo' ? 'Intervalo' : 'Prepare-se';
  return (
    <FaixaDoCronometro
      nome={nome}
      tempo={mmss(leitura.segundos)}
      segundos={leitura.segundos}
      progresso={leitura.progresso}
      acabando={leitura.ultimos10s}
      pausado={leitura.pausado}
      rotuloAoAbrir="Abrir o cronômetro"
      aoAbrir={() => router.push('/cronometro')}
      aoAlternar={() => agir('alternar')}
      rotuloAoPular="Pular fase"
      aoPular={() => agir('pular')}
    />
  );
}
