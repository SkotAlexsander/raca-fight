/**
 * Turma (mapa de luta, Parte B, aba Horários): saber se a turma é para mim.
 * Nome, modalidades, público, nível, professor, os horários, o aviso da
 * turma mais recente e, se a pessoa não pode fazer check-in, o motivo em uma
 * frase (R14.6, nunca financeiro). O lembrete de aula desta turma (R22.4)
 * nasce desligado.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';
import { Cartao, EstadoVazio, Linha, LinhaComChave, Lista, Texto } from '@/componentes';
import { useAvisosDaAcademia } from '@/dados';
import { NOME_DO_NIVEL_DA_TURMA, NOME_DO_PUBLICO, podeFazerCheckinNaTurma } from '@/dominio/turmas/turmas';
import { espaco } from '@/tema';
import { NOME_DO_DIA } from '@/componentes/formatos';
import { TelaComRolagem, Secao } from './comum/Tela';
import { useDadosLocais } from './estado/ProvedorDoAluno';
import { modalidadesDaTurma, nomeDoProfessor, useLutaDoAluno } from '../luta/dados';

export function TelaTurma({ somenteLeitura }: { somenteLeitura?: boolean } = {}) {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const luta = useLutaDoAluno();
  const turma = luta.luta?.turmas.find((t) => t.id === id);
  const avisos = useAvisosDaAcademia().data ?? [];

  if (!turma) {
    return (
      <TelaComRolagem titulo="Turma" aoVoltar={() => router.back()}>
        <Cartao>
          <EstadoVazio titulo="Turma não encontrada" texto="Ela pode ter saído da grade." />
        </Cartao>
      </TelaComRolagem>
    );
  }
  const prof = turma.professorId ? luta.equipe.find((m) => m.usuario.id === turma.professorId) : undefined;
  const nomeProf = nomeDoProfessor(luta.equipe, turma.professorId);
  const ficha = luta.fichas.find((f) => f.turmaIds.includes(turma.id)) ?? luta.minhaFicha ?? luta.fichas[0];
  const motivo = !somenteLeitura && ficha ? podeFazerCheckinNaTurma(turma, { vinculoAtivo: !!luta.vinculoAtivo, modalidadesDaMatricula: ficha.modalidadeIds, ehDependente: !!ficha.dependenteDe, atletaEm: ficha.atletaEm }) : null;
  const aviso = avisos.filter((a) => a.turmaId === turma.id && !a.retiradoEm).sort((a, b) => Date.parse(b.publicadoEm) - Date.parse(a.publicadoEm))[0];

  return (
    <TelaComRolagem titulo={turma.nome} subtitulo={modalidadesDaTurma(luta.luta, turma)} aoVoltar={() => router.back()}>
      <Cartao>
        <View style={{ gap: espaco[2] }}>
          <Texto variante="corpoForte">{[NOME_DO_PUBLICO[turma.publico], turma.publico === 'adulto' || turma.publico === 'kids' ? NOME_DO_NIVEL_DA_TURMA[turma.nivel] : null].filter(Boolean).join(' · ')}</Texto>
          {turma.publico === 'kids' ? (
            <Texto variante="corpoPequeno" cor="textoSecundario">
              {turma.idadeMinima !== undefined && turma.idadeMaxima !== undefined ? `De ${turma.idadeMinima} a ${turma.idadeMaxima} anos.` : 'A faixa de idade é a que a academia definir.'} O check-in é feito pelo responsável.
            </Texto>
          ) : null}
          {turma.publico === 'aberta' ? (
            <Texto variante="corpoPequeno" cor="textoSecundario">
              Treino livre, sem turma fixa: no check-in você diz o que vai treinar.
            </Texto>
          ) : null}
          {motivo && !motivo.pode ? (
            <Texto variante="corpoPequeno" cor="textoSecundario">
              {motivo.motivo}
            </Texto>
          ) : null}
        </View>
      </Cartao>

      <Secao titulo="Horários">
        <Cartao padding={0}>
          <Lista>
            {turma.horarios.map((h) => (
              <Linha key={h.id} icone="relogio" titulo={`${NOME_DO_DIA[h.dia]}, ${h.inicio}`} apoio={`${h.duracaoMinutos} min`} semSeta compacta />
            ))}
          </Lista>
        </Cartao>
      </Secao>

      {nomeProf ? (
        <Secao titulo="Professor">
          <Cartao padding={0}>
            <Linha avatar={nomeProf} titulo={nomeProf} apoio={prof?.perfil?.graduacaoInformada?.map((g) => g.texto).join(' · ') || prof?.perfil?.formacao} aoTocar={prof?.perfil?.visivelAosAlunos && !prof.perfil.ocultadoPeloDono ? () => router.push({ pathname: '/academia/professor/[id]', params: { id: prof.perfil!.id } }) : undefined} semSeta={!prof?.perfil?.visivelAosAlunos} />
          </Cartao>
        </Secao>
      ) : null}

      {aviso ? (
        <Secao titulo="Aviso da turma">
          <Cartao>
            <Texto variante="corpo">{aviso.texto}</Texto>
          </Cartao>
        </Secao>
      ) : null}

      {!somenteLeitura && luta.fichas.length ? <LembreteDaTurma turmaId={turma.id} /> : null}
    </TelaComRolagem>
  );
}

function LembreteDaTurma({ turmaId }: { turmaId: string }) {
  const { lembreteDeAula, definirLembreteDeAula } = useDadosLocais();
  const ligado = lembreteDeAula.ligado && lembreteDeAula.turmaIds.includes(turmaId);
  return (
    <Cartao padding={0}>
      <LinhaComChave
        rotulo="Lembrar desta turma"
        apoio={`Um aviso ${lembreteDeAula.antecedenciaMinutos >= 60 ? `${lembreteDeAula.antecedenciaMinutos / 60} h` : `${lembreteDeAula.antecedenciaMinutos} min`} antes de cada aula. Desligado no começo.`}
        ligado={ligado}
        aoMudar={(v) => {
          const turmaIds = v ? [...new Set([...lembreteDeAula.turmaIds, turmaId])] : lembreteDeAula.turmaIds.filter((t) => t !== turmaId);
          definirLembreteDeAula({ ligado: turmaIds.length > 0, turmaIds });
        }}
      />
    </Cartao>
  );
}
