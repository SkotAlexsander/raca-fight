/**
 * Avisos (aluno) — mapa de luta, Parte B: o que pode avisar (R22.4, R22.5).
 * Cronômetro · Lembrete de aula (por turma e antecedência, DESLIGADO no
 * começo) · Turmas (aviso e cancelamento) · Graduação · Avisos da academia.
 * Saiu o lembrete de treino; os do Plus esperam o L12. Nenhum aviso leva
 * nome de aluno na tela bloqueada nem dado de saúde.
 */
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { Chip, Chips, GrupoDeLinhas, LinhaComChave, Texto } from '@/componentes';
import { useSessao } from '@/dados';
import { espaco } from '@/tema';
import { Secao, TelaComRolagem } from '../comum/Tela';
import { useDadosLocais } from '../estado/ProvedorDoAluno';
import { turmasDaFicha } from '../CartaoDaProximaAula';
import { useLutaDoAluno } from '../../luta/dados';

const ANTECEDENCIAS = [
  { minutos: 30, rotulo: '30 min antes' },
  { minutos: 60, rotulo: '1 h antes' },
  { minutos: 120, rotulo: '2 h antes' },
] as const;

export function TelaAvisos() {
  const router = useRouter();
  const { vinculoAtivo } = useSessao();
  const { avisos, definirAviso, lembreteDeAula, definirLembreteDeAula } = useDadosLocais();
  const luta = useLutaDoAluno();
  const voltar = () => (router.canGoBack() ? router.back() : router.replace('/perfil'));
  const turmas = luta.luta ? [...new Map(luta.fichas.flatMap((f) => turmasDaFicha(luta.luta!, f)).map((t) => [t.id, t])).values()] : [];

  return (
    <TelaComRolagem titulo="Avisos" aoVoltar={voltar} vao={espaco[5]}>
      <GrupoDeLinhas>
        <LinhaComChave naLista rotulo="Cronômetro" apoio="O fim do round e do intervalo, com o app fora da tela" ligado={avisos.cronometro} aoMudar={(v) => definirAviso('cronometro', v)} />
        <LinhaComChave naLista rotulo="Lembrete de aula" apoio={lembreteDeAula.ligado ? `${lembreteDeAula.turmaIds.length} turma(s)` : 'Desligado'} ligado={avisos.lembreteAula} aoMudar={(v) => definirAviso('lembreteAula', v)} />
      </GrupoDeLinhas>

      {avisos.lembreteAula ? (
        <Secao titulo="Quando lembrar">
          <Chips>
            {ANTECEDENCIAS.map((a) => (
              <Chip key={a.minutos} rotulo={a.rotulo} selecionado={lembreteDeAula.antecedenciaMinutos === a.minutos} aoTocar={() => definirLembreteDeAula({ antecedenciaMinutos: a.minutos })} />
            ))}
          </Chips>
          <Texto variante="corpoPequeno" cor="textoSecundario">
            De quais turmas
          </Texto>
          <View>
            {turmas.map((t) => (
              <LinhaComChave
                key={t.id}
                rotulo={t.nome}
                ligado={lembreteDeAula.turmaIds.includes(t.id)}
                aoMudar={(v) => definirLembreteDeAula({ turmaIds: v ? [...new Set([...lembreteDeAula.turmaIds, t.id])] : lembreteDeAula.turmaIds.filter((x) => x !== t.id) })}
              />
            ))}
          </View>
        </Secao>
      ) : null}

      {vinculoAtivo?.estado === 'ativo' ? (
        <GrupoDeLinhas>
          <LinhaComChave naLista rotulo="Turmas" apoio="Aviso da turma e aula cancelada" ligado={avisos.turmas} aoMudar={(v) => definirAviso('turmas', v)} />
          <LinhaComChave naLista rotulo="Graduação" apoio="Faixa ou grau novo e exame marcado" ligado={avisos.graduacao} aoMudar={(v) => definirAviso('graduacao', v)} />
          <LinhaComChave naLista rotulo={`Avisos da ${vinculoAtivo.academia.nome}`} apoio="No máximo um por dia" ligado={avisos.academia} aoMudar={(v) => definirAviso('academia', v)} />
        </GrupoDeLinhas>
      ) : null}

      <Texto variante="corpoPequeno" cor="textoSecundario">
        Entre 22h e 7h o app não avisa nada, só o cronômetro que você deixou rodando.
      </Texto>
    </TelaComRolagem>
  );
}
