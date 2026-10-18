/**
 * O dono que não dá aula (mapa de luta, Parte E): a gestão dele mora no app
 * Admin (outro app, `admin/`). Aqui ele só lê para onde ir. Se ele dá aula
 * (tem também o papel de instrutor), entra como professor e não vê esta tela.
 */
import { View } from 'react-native';
import { Botao, Cartao, Texto } from '@/componentes';
import { useSessao } from '@/dados';
import { espaco, useTema } from '@/tema';
import { TelaComRolagem } from '../aluno/comum/Tela';
import { LogoRacaFight } from '@/componentes/LogoRacaFight';

export function TelaAbraOAdmin() {
  const { sair } = useSessao();
  const { cores } = useTema();
  return (
    <TelaComRolagem semCabecalho>
      <View style={{ alignItems: 'center', paddingTop: espaco[8], gap: espaco[4] }}>
        <LogoRacaFight largura={160} cor={cores.texto} />
        <Texto variante="titulo1" style={{ textAlign: 'center' }} testID="abra-o-admin">
          Abra o app Admin
        </Texto>
        <Texto variante="corpo" cor="textoSecundario" style={{ textAlign: 'center' }}>
          Turmas, réguas, matrículas e mensalidades ficam no Admin, no computador ou no celular. Este app é dos alunos, dos professores e da recepção.
        </Texto>
      </View>
      <Cartao>
        <Texto variante="corpoPequeno" cor="textoSecundario">
          Se você também dá aula, peça no Admin o papel de professor na sua conta: aí este app abre no Hoje, com a chamada das suas turmas.
        </Texto>
      </Cartao>
      <Botao rotulo="Sair da conta" variante="secundario" aoTocar={sair} />
    </TelaComRolagem>
  );
}
