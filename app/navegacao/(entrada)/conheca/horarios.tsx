import { useRouter } from 'expo-router';
import { TelaHorarios } from '@/telas/aluno/TelaHorarios';

export default function Rota() {
  const router = useRouter();
  return <TelaHorarios somenteLeitura aoVoltar={() => router.back()} />;
}
