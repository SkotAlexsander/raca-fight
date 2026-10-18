/**
 * O herói do Início: a PRÓXIMA AULA de uma pessoa (o aluno ou o dependente),
 * com "Estou na aula" dentro da janela (R15.2; F18).
 *
 * - Toque: GRAVA a presença no aparelho e põe na fila (síncrono, R15.9) e SÓ
 *   ENTÃO vibra e anima (regra 1 do movimento). Sem sinal, igual, com a linha
 *   "Sem conexão. Sobe quando o sinal voltar."
 * - Turma de duas modalidades (Jiu-Jitsu / Luta Livre) ou a OPEN: antes, a
 *   folha "Hoje você treina…", com a última escolha marcada (R15.6, R14.8).
 * - Depois: "Presença marcada · Desfazer" e "Pendente até o professor fechar a
 *   chamada" (R15.4); às 23:59 confirma sozinha (R15.5).
 * - Fora da janela, o botão não aparece: "Abre às 19:30".
 * - Movimento reduzido: o check aparece num esmaecer de 160 ms.
 */
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { Botao, FolhaInferior, FotoComTexto, Icone, Linha, PilulaDeVidro, Texto, Vidro, useAvisoRapido } from '@/componentes';
import { useFila, useRepositorio, type AcademiaDeLuta, type FichaDeLuta, type MembroDaEquipe } from '@/dados';
import { aulaDoCheckin, desfazerCheckin, ErroDePresenca, fazerCheckin, idDaPresenca, janelaDoCheckin, type Presenca } from '@/dominio/presenca/presenca';
import { modalidadesParaEscolher, NOME_DO_NIVEL_DA_TURMA, NOME_DO_PUBLICO, podeFazerCheckinNaTurma, type AjusteDeAula, type Turma } from '@/dominio/turmas/turmas';
import { dataNoFuso, diaDaSemanaDe, instanteComFusoDaAcademia, somarDias } from '@/dominio/turmas/horario';
import { espaco, estiloDeTexto, tokens, useTema, useVibrar } from '@/tema';
import { NOME_DO_DIA } from '@/componentes/formatos';
import { fotoDaTurma } from '../luta/imagens';
import { nomeDaModalidade, nomeDoProfessor, primeiroNome } from '../luta/dados';

const NUMERO = estiloDeTexto('numeroMedio').estilo.fontFamily;

/** As turmas em que a pessoa faz check-in: as dela, a OPEN (adulto) e a de competição (atleta). */
export function turmasDaFicha(luta: AcademiaDeLuta, f: FichaDeLuta): Turma[] {
  return luta.turmas.filter((t) => f.turmaIds.includes(t.id) || (t.publico === 'aberta' && !f.dependenteDe) || (t.publico === 'competicao' && t.modalidadeIds.some((m) => f.atletaEm.includes(m))));
}

export function CartaoDaProximaAula({ ficha, luta, ajustes, presencas, equipe, agora, usuarioId, doUsuario }: { ficha: FichaDeLuta; luta: AcademiaDeLuta; ajustes: readonly AjusteDeAula[]; presencas: readonly Presenca[]; equipe: readonly MembroDaEquipe[]; agora: number; usuarioId: string; doUsuario: boolean }) {
  const router = useRouter();
  const repo = useRepositorio();
  const fila = useFila();
  const vibrar = useVibrar();
  const aviso = useAvisoRapido();
  const { cores, reduzirMovimento } = useTema();
  const [escolher, setEscolher] = useState<string[] | null>(null);

  const turmas = turmasDaFicha(luta, ficha);
  // revisão AN: o herói passa para a aula seguinte quando o check-in desta fecha
  const doCheckin = aulaDoCheckin(turmas, agora, luta.fuso, luta.janela, ajustes);
  const aula = doCheckin?.aula ?? null;
  if (!aula) {
    return (
      <Vidro estilo={{ padding: espaco[4], gap: espaco[2] }}>
        <Texto variante="corpoForte">{doUsuario ? 'Sem aula nos próximos dias' : `${primeiroNome(ficha.nome)}: sem aula nos próximos dias`}</Texto>
        <Botao variante="texto" rotulo="Ver os horários" intrinseco aoTocar={() => router.push('/horarios')} />
      </Vidro>
    );
  }
  const turma = turmas.find((t) => t.id === aula.turmaId)!;
  const hoje = dataNoFuso(agora, luta.fuso);
  const quando = aula.data === hoje ? 'hoje' : aula.data === somarDias(hoje, 1) ? 'amanhã' : NOME_DO_DIA[diaDaSemanaDe(aula.data)].toLocaleLowerCase('pt-BR');
  const janela = janelaDoCheckin(aula, agora, luta.janela);
  const existente = presencas.find((p) => p.id === idDaPresenca(aula.id, ficha.alunoId)) ?? null;
  const marcada = !!existente && existente.estado !== 'retirada';
  const pode = podeFazerCheckinNaTurma(turma, { vinculoAtivo: true, modalidadesDaMatricula: ficha.modalidadeIds, ehDependente: !!ficha.dependenteDe, atletaEm: ficha.atletaEm });
  const professor = nomeDoProfessor(equipe, aula.professorId);
  const titulo = turma.publico === 'aberta' ? 'Sexta OPEN' : turma.publico === 'competicao' ? 'Treino de competição' : turma.nome.replace(/ — .*$/, '');
  const apoio = [turma.publico === 'aberta' ? `até ${aula.horaDoFim}` : NOME_DO_PUBLICO[turma.publico], turma.publico === 'adulto' || turma.publico === 'kids' ? NOME_DO_NIVEL_DA_TURMA[turma.nivel] : null, professor ? `Prof. ${primeiroNome(professor)}` : null].filter(Boolean).join(' · ');
  const quem = doUsuario ? null : primeiroNome(ficha.nome);
  const chaveDaEscolha = `modalidade-escolhida.${ficha.alunoId}.${turma.id}`;

  const marcar = (modalidadeId: string) => {
    try {
      const p = fazerCheckin({ aula, alunoId: ficha.alunoId, modalidadeId, porId: usuarioId, agoraMs: Date.now(), em: instanteComFusoDaAcademia(Date.now(), luta.fuso), janela: luta.janela, existente });
      // GRAVA antes de vibrar e de animar (regra 1)
      fila.registrarPresencas([p], 'checkin');
      repo.gravarNoAparelho(chaveDaEscolha, modalidadeId);
      vibrar('marcarSerie');
    } catch (e) {
      aviso.mostrar({ tipo: 'erro', texto: e instanceof ErroDePresenca ? e.message : 'Não deu para salvar.' });
    }
  };
  const estouNaAula = () => {
    const opcoes = modalidadesParaEscolher(turma, ficha.modalidadeIds);
    if (opcoes.length > 1) {
      const ultima = repo.lerDoAparelho(chaveDaEscolha);
      setEscolher(ultima && opcoes.includes(ultima) ? [ultima, ...opcoes.filter((o) => o !== ultima)] : opcoes);
      return;
    }
    marcar(opcoes[0] ?? turma.modalidadeIds[0]!);
  };
  const desfazer = () => {
    if (!existente) return;
    try {
      fila.registrarPresencas([desfazerCheckin(existente, usuarioId, instanteComFusoDaAcademia(Date.now(), luta.fuso))], 'checkin');
      vibrar('desfazerSerie');
    } catch (e) {
      aviso.mostrar({ tipo: 'erro', texto: e instanceof ErroDePresenca ? e.message : 'Não deu para desfazer.' });
    }
  };

  const estado = marcada
    ? existente!.estado === 'confirmada'
      ? existente!.semChamada
        ? 'Confirmada sozinha (sem chamada).'
        : 'Confirmada pelo professor.'
      : 'Pendente até o professor fechar a chamada.'
    : !pode.pode
      ? pode.motivo
      : janela.tipo === 'antes'
        ? `O check-in abre às ${janela.abreAs} e fecha às ${addMin(aula.hora, luta.janela.minutosDepois)}.`
        : janela.tipo === 'aberta'
          ? `O check-in abriu às ${addMin(aula.hora, -luta.janela.minutosAntes)} e fecha às ${janela.fechaAs}.`
          : 'O check-in desta aula já fechou.';

  return (
    <>
      <FotoComTexto
        imagem={fotoDaTurma(turma)}
        descricao=""
        variante="capa"
        altura={tokens.telas.capaInicio}
        estilo={{ padding: 0 }}
        topo={
          <PilulaDeVidro variante="escuroFixo">
            <Icone nome="hoje" tamanho="pequeno" cor="texto" />
            <Texto variante="legenda">{quem ? `${quem} · próxima aula · ${quando}` : `Próxima aula · ${quando}`}</Texto>
          </PilulaDeVidro>
        }
      >
        <Vidro variante="escuroFixo" estilo={{ padding: espaco[4], gap: espaco[3] }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: espaco[3], flexWrap: 'wrap' }}>
            <Texto variante="titulo1" numberOfLines={2} style={{ flexShrink: 1 }}>
              {titulo}
            </Texto>
            <Texto variante="titulo1" style={{ fontFamily: NUMERO, fontVariant: ['tabular-nums'] }}>
              {aula.hora}
            </Texto>
          </View>
          <Texto variante="corpoPequeno" cor="textoSecundario">
            {apoio}
          </Texto>
          {doCheckin?.canceladasHoje.length ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco[2] }} testID="aula-cancelada-hoje">
              <Icone nome="alerta" tamanho="pequeno" cor="texto" />
              <Texto variante="corpoPequeno" style={{ flex: 1 }}>
                {doCheckin.canceladasHoje.map((c) => `${turmas.find((t) => t.id === c.turmaId)?.nome.replace(/ — .*$/, '') ?? 'Aula'} das ${c.hora}`).join(', ')}
                {doCheckin.canceladasHoje.length === 1 ? ' foi cancelada hoje.' : ' foram canceladas hoje.'}
              </Texto>
            </View>
          ) : null}
          {marcada ? (
            <View accessibilityRole="summary" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: espaco[2], minHeight: 48 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco[2] }}>
                <Animated.View entering={reduzirMovimento ? FadeIn.duration(160) : ZoomIn.springify().damping(12)}>
                  <Icone nome="marcar" cor={cores.vidroEscuroFixoDestaque} />
                </Animated.View>
                <Texto variante="corpoForte">{quem ? `${quem} está na aula` : 'Presença marcada'}</Texto>
              </View>
              {existente!.estado === 'pendente' && !existente!.pelaEquipe ? <Botao variante="texto" rotulo="Desfazer" intrinseco aoTocar={desfazer} testID="desfazer-checkin" /> : null}
            </View>
          ) : pode.pode && janela.tipo === 'aberta' ? (
            <Botao variante="primario" tamanho="grande" icone="check-in" rotulo={quem ? `${quem} está na aula` : 'Estou na aula'} aoTocar={estouNaAula} testID="estou-na-aula" />
          ) : null}
          <Texto variante="corpoPequeno" cor="textoSecundario">
            {estado}
          </Texto>
          {marcada && fila.semRede && !existente?.sincronizadaEm ? (
            <Texto variante="corpoPequeno" cor="textoSecundario">
              Sem conexão. Sobe quando o sinal voltar.
            </Texto>
          ) : null}
        </Vidro>
      </FotoComTexto>

      <FolhaInferior visivel={!!escolher} aoFechar={() => setEscolher(null)} titulo={quem ? `Hoje ${quem} treina…` : 'Hoje você treina…'}>
        <View>
          {(escolher ?? []).map((m, i) => (
            <Linha
              key={m}
              titulo={nomeDaModalidade(luta, m)}
              apoio={i === 0 && repo.lerDoAparelho(chaveDaEscolha) === m ? 'A última que você escolheu' : undefined}
              semSeta
              aoTocar={() => {
                setEscolher(null);
                marcar(m);
              }}
            />
          ))}
        </View>
      </FolhaInferior>
    </>
  );
}

/** "20:00" + 30 → "20:30". */
function addMin(hora: string, minutos: number): string {
  const [h, m] = hora.split(':').map(Number) as [number, number];
  const t = (((h * 60 + m + minutos) % 1440) + 1440) % 1440;
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
}
