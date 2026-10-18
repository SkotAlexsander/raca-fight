/**
 * Turmas do professor (mapa de luta, Parte C, aba Turmas; F22).
 *
 * - Turmas: cada turma dele com a modalidade, os horários, quantos alunos e a
 *   presença média por aula nas últimas 4 semanas.
 * - Turma (equipe): as próximas aulas (Cancelar · Passar a outro professor,
 *   só antes do início, R14.5), os alunos com a faixa e a última presença, os
 *   avisos da turma e "Aviso para a turma" (R22.1). A turma em si (horário,
 *   público) é editada no Admin (R14.2a, L16).
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Botao, Cartao, Chip, Chips, EstadoVazio, FolhaInferior, Linha, Lista, Texto, useAvisoRapido, useGravarComAviso } from '@/componentes';
import { useAvisosDaAcademia, useGravar } from '@/dados';
import { aulasEntre, cancelarAula, ErroDaAula, NOME_DO_MOTIVO_DO_CANCELAMENTO, passarAula, type Aula, type MotivoDoCancelamento } from '@/dominio/turmas/turmas';
import { diasSemPresenca, quePontuam, ultimaPresenca } from '@/dominio/presenca/presenca';
import { diaDaSemanaDe, instanteComFusoDaAcademia, somarDias } from '@/dominio/turmas/horario';
import { espaco } from '@/tema';
import { NOME_DO_DIA, dataCurta, plural } from '@/componentes/formatos';
import { TelaComRolagem, Secao } from '../aluno/comum/Tela';
import { EsqueletoDaTela } from '../compartilhado/estados';
import { TopoDaTela } from '../luta/pecas';
import { alunosDaTurma, modalidadesDaTurma, nomeDoProfessor, primeiroNome, publicoDaFicha, textoDaFaixa, useLutaDaEquipe } from '../luta/dados';

export function TelaTurmas() {
  const router = useRouter();
  const equipe = useLutaDaEquipe();
  const { luta, hoje } = equipe;
  return (
    <TelaComRolagem semCabecalho>
      <TopoDaTela sobretitulo={equipe.ehRecepcao ? 'Todas as turmas' : 'As suas turmas'} titulo="Turmas" />
      {equipe.carregando || !luta || !hoje ? (
        <EsqueletoDaTela heroi={null} linhas={4} />
      ) : equipe.minhasTurmas.length === 0 ? (
        <Cartao>
          <EstadoVazio ilustracao="nenhum-aluno" titulo="Nenhuma turma sua" texto="O dono liga você às turmas no app Admin." />
        </Cartao>
      ) : (
        equipe.minhasTurmas.map((t) => {
          const alunos = alunosDaTurma(equipe.fichas, t.id).length;
          // presença média por aula nas últimas 4 semanas (só as aulas que já aconteceram)
          const aulas = aulasEntre([t], somarDias(hoje, -28), somarDias(hoje, -1), luta.fuso, equipe.ajustes).filter((a) => !a.cancelada);
          const presencas = quePontuam(equipe.presencas).filter((p) => p.turmaId === t.id && p.data >= somarDias(hoje, -28) && p.data < hoje).length;
          const media = aulas.length ? Math.round(presencas / aulas.length) : 0;
          return (
            <Cartao key={t.id} aoTocar={() => router.push({ pathname: '/turmas/[id]', params: { id: t.id } })} rotuloAcessivel={`${t.nome}. ${plural(alunos, 'aluno', 'alunos')}. Média de ${media} por aula.`}>
              <View style={{ gap: espaco[1] }}>
                <Texto variante="titulo3">{t.nome}</Texto>
                <Texto variante="corpoPequeno" cor="textoSecundario">
                  {modalidadesDaTurma(luta, t)} · {t.horarios.map((h) => `${NOME_DO_DIA[h.dia].slice(0, 3)} ${h.inicio}`).join(' · ')}
                </Texto>
                <Texto variante="corpoPequeno" cor="textoSecundario">
                  {t.publico === 'aberta' || t.publico === 'competicao' ? 'Sem turma fixa' : plural(alunos, 'aluno', 'alunos')} · média de {media} por aula (4 semanas)
                </Texto>
              </View>
            </Cartao>
          );
        })
      )}
      <Cartao padding={0}>
        <Linha icone="tatame" titulo="Técnicas" apoio="Os vídeos que os alunos veem" aoTocar={() => router.push('/turmas/tecnicas')} />
      </Cartao>
    </TelaComRolagem>
  );
}

export function TelaTurmaDaEquipe() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const equipe = useLutaDaEquipe();
  const avisos = useAvisosDaAcademia().data ?? [];
  const gravar = useGravar();
  const aviso = useAvisoRapido();
  const { gravar: cancelar, ocupado: cancelando } = useGravarComAviso(gravar.cancelarAula);
  const { gravar: passar, ocupado: passando } = useGravarComAviso(gravar.passarAula);
  const [acao, setAcao] = useState<{ tipo: 'cancelar' | 'passar'; aula: Aula } | null>(null);
  const [motivo, setMotivo] = useState<MotivoDoCancelamento>('feriado');
  const { luta, hoje, agora } = equipe;
  const turma = luta?.turmas.find((t) => t.id === id);
  if (!turma || !luta || !hoje) {
    return (
      <TelaComRolagem titulo="Turma" aoVoltar={() => router.back()}>
        <EsqueletoDaTela heroi={null} linhas={3} />
      </TelaComRolagem>
    );
  }
  const proximas = aulasEntre([turma], hoje, somarDias(hoje, 7), luta.fuso, equipe.ajustes).filter((a) => a.fimMs > agora);
  const alunos = alunosDaTurma(equipe.fichas, turma.id);
  const daTurma = avisos.filter((a) => a.turmaId === turma.id && !a.retiradoEm).sort((a, b) => Date.parse(b.publicadoEm) - Date.parse(a.publicadoEm));
  const outrosProfessores = equipe.equipe.filter((m) => m.usuario.id !== turma.professorId && (m.vinculo.papel === 'instrutor' || m.vinculo.papel === 'personal') && (m.perfil?.modalidadeIds ?? []).some((x) => turma.modalidadeIds.includes(x)));
  const em = () => instanteComFusoDaAcademia(Date.now(), luta.fuso);

  return (
    <TelaComRolagem titulo={turma.nome} subtitulo={modalidadesDaTurma(luta, turma)} aoVoltar={() => router.back()}>
      <Secao titulo="Próximas aulas">
        <Cartao padding={0}>
          <Lista>
            {proximas.map((a) => {
              const prof = nomeDoProfessor(equipe.equipe, a.professorId);
              const dia = a.data === hoje ? 'Hoje' : NOME_DO_DIA[diaDaSemanaDe(a.data)];
              return (
                <Linha
                  key={a.id}
                  icone="relogio"
                  titulo={`${dia}, ${a.hora}`}
                  apoio={a.cancelada ? `Cancelada${a.motivoDoCancelamento ? ` · ${NOME_DO_MOTIVO_DO_CANCELAMENTO[a.motivoDoCancelamento].toLocaleLowerCase('pt-BR')}` : ''}` : `${dataCurta(a.data)}${prof ? ` · Prof. ${primeiroNome(prof)}` : ''}${a.substitutoId ? ' (substituto)' : ''}`}
                  semSeta
                  fim={
                    !a.cancelada && a.inicioMs > agora ? (
                      <View style={{ flexDirection: 'row', gap: espaco[1] }}>
                        <Botao variante="texto" tamanho="pequeno" rotulo="Passar" intrinseco aoTocar={() => setAcao({ tipo: 'passar', aula: a })} />
                        <Botao variante="perigoDiscreto" tamanho="pequeno" rotulo="Cancelar" intrinseco aoTocar={() => setAcao({ tipo: 'cancelar', aula: a })} />
                      </View>
                    ) : undefined
                  }
                />
              );
            })}
          </Lista>
        </Cartao>
      </Secao>

      <Secao titulo="Avisos da turma" lado={<Botao variante="texto" tamanho="pequeno" icone="mais" rotulo="Aviso para a turma" intrinseco aoTocar={() => router.push({ pathname: '/alunos/novo-aviso', params: { turma: turma.id } })} />}>
        {daTurma.length ? (
          daTurma.slice(0, 3).map((a) => (
            <Cartao key={a.id}>
              <Texto variante="corpo">{a.texto}</Texto>
            </Cartao>
          ))
        ) : (
          <Texto variante="corpoPequeno" cor="textoSecundario">
            Nenhum aviso desta turma em vigor.
          </Texto>
        )}
      </Secao>

      {alunos.length ? (
        <Secao titulo="Alunos" lado={plural(alunos.length, 'aluno', 'alunos')}>
          <Cartao padding={0}>
            <Lista>
              {alunos.map((f) => {
                const faixa = turma.modalidadeIds.map((m) => textoDaFaixa(luta, equipe.graduacoes, f.alunoId, m, publicoDaFicha(f))).find(Boolean);
                const dias = diasSemPresenca(ultimaPresenca(equipe.presencas.filter((p) => p.alunoId === f.alunoId)), hoje);
                return <Linha key={f.alunoId} avatar={f.nome} titulo={f.dependenteDe ? primeiroNome(f.nome) : f.nome} apoio={[faixa?.texto, dias === null ? 'sem aula ainda' : dias === 0 ? 'veio hoje' : `última aula há ${plural(dias, 'dia', 'dias')}`].filter(Boolean).join(' · ')} aoTocar={() => router.push({ pathname: '/alunos/[id]', params: { id: f.alunoId } })} />;
              })}
            </Lista>
          </Cartao>
        </Secao>
      ) : null}

      <FolhaInferior
        visivel={acao?.tipo === 'cancelar'}
        aoFechar={() => setAcao(null)}
        titulo="Cancelar esta aula?"
        rodape={
          <>
            <Botao rotulo="Voltar" variante="secundario" aoTocar={() => setAcao(null)} />
            <Botao
              rotulo="Cancelar a aula"
              variante="perigo"
              carregando={cancelando}
              aoTocar={async () => {
                if (!acao) return;
                try {
                  const ajuste = cancelarAula(acao.aula, motivo, equipe.usuario?.id ?? '', Date.now(), em());
                  const r = await cancelar(ajuste);
                  if (r.ok) {
                    setAcao(null);
                    aviso.mostrar({ tipo: 'sucesso', texto: 'Aula cancelada. Os alunos da turma são avisados.' });
                  }
                } catch (e) {
                  aviso.mostrar({ tipo: 'erro', texto: e instanceof ErroDaAula ? e.message : 'Não deu para cancelar.' });
                }
              }}
            />
          </>
        }
      >
        <View style={{ gap: espaco[3] }}>
          <Chips>
            {(['feriado', 'evento', 'outro'] as MotivoDoCancelamento[]).map((m) => (
              <Chip key={m} rotulo={NOME_DO_MOTIVO_DO_CANCELAMENTO[m]} selecionado={motivo === m} aoTocar={() => setMotivo(m)} />
            ))}
          </Chips>
          <Texto variante="corpo" cor="textoSecundario">
            Os alunos da turma recebem “Aula de {turma.nome} de {acao ? `${acao.aula.data === hoje ? 'hoje' : dataCurta(acao.aula.data)}, ${acao.aula.hora}` : ''}, cancelada.” Os check-ins feitos saem sem contar como falta.
          </Texto>
        </View>
      </FolhaInferior>

      <FolhaInferior visivel={acao?.tipo === 'passar'} aoFechar={() => setAcao(null)} titulo="Passar a outro professor" tipo="lista">
        {outrosProfessores.length === 0 ? (
          <Texto variante="corpo" cor="textoSecundario">
            Nenhum outro professor desta modalidade na equipe.
          </Texto>
        ) : (
          <View>
            {outrosProfessores.map((m) => (
              <Linha
                key={m.usuario.id}
                avatar={m.perfil?.nomeExibicao ?? m.usuario.nome}
                titulo={m.perfil?.nomeExibicao ?? m.usuario.nome}
                apoio={(m.perfil?.modalidadeIds ?? []).map((x) => luta.modalidades.find((y) => y.id === x)?.nome).filter(Boolean).join(', ')}
                aoTocar={async () => {
                  if (!acao || passando) return;
                  try {
                    const r = await passar(passarAula(acao.aula, m.usuario.id, equipe.usuario?.id ?? '', Date.now(), em()));
                    if (r.ok) {
                      setAcao(null);
                      aviso.mostrar({ tipo: 'sucesso', texto: `A aula passou para ${primeiroNome(m.perfil?.nomeExibicao ?? m.usuario.nome)}.` });
                    }
                  } catch (e) {
                    aviso.mostrar({ tipo: 'erro', texto: e instanceof ErroDaAula ? e.message : 'Não deu para passar.' });
                  }
                }}
              />
            ))}
          </View>
        )}
      </FolhaInferior>
    </TelaComRolagem>
  );
}
