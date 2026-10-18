/**
 * Entrada (sem sessão). A abertura animada, as duas portas, login e cadastro
 * são do agente Z (onda 2). Por enquanto, a entrada com as contas de exemplo.
 */
import { Redirect, Stack } from 'expo-router';
import { useSessao } from '@/dados';

export default function LayoutDaEntrada() {
  const { carregando, destino } = useSessao();
  if (!carregando && destino.tipo !== 'entrada') return <Redirect href="/" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
