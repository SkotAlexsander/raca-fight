/**
 * A porta do app: manda para a visão que o VÍNCULO decide
 * (03-DECISOES-TECNICAS.md, seção 1; a regra está em dominio/papel.ts).
 * Na equipe, todos começam no Hoje; o dono que não dá aula vê "Abra o app Admin"
 * (o layout da equipe decide).
 */
import { Redirect } from 'expo-router';
import { View } from 'react-native';
import { useSessao } from '@/dados';
import { useTema } from '@/tema';
import { ROTA_INICIAL_DA_VISAO } from '@/telas/rotas';

export default function Porta() {
  const { carregando, destino } = useSessao();
  const { cores } = useTema();
  if (carregando) return <View style={{ flex: 1, backgroundColor: cores.fundo }} />;
  if (destino.tipo === 'entrada') return <Redirect href="/boas-vindas" />;
  if (destino.tipo === 'escolher') return <Redirect href="/escolher-visao" />;
  return <Redirect href={ROTA_INICIAL_DA_VISAO[destino.visao]} />;
}
