import { Redirect } from 'expo-router';
import { RECURSOS } from '@/dominio/recursos';
import { TelaDieta } from '@/telas/aluno/TelaDieta';

/** A dieta está DESLIGADA na v1 (L13): com a chave desligada, o endereço volta ao começo. */
export default function Rota() {
  return RECURSOS.dieta ? <TelaDieta /> : <Redirect href="/" />;
}
