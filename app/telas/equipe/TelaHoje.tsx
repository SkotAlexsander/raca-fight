/**
 * Hoje (mockup `luta.html`, tela 6; mapa de luta, Partes C e D): a primeira
 * aba do professor e da recepção responde "qual é a minha aula agora?".
 *
 * - O herói: a aula da hora (ou a próxima) em foto, com quantos fizeram
 *   check-in e quantos experimentais vêm, e "Abrir a chamada".
 * - Embaixo, as outras aulas do dia (o professor: as dele e as que
 *   substitui; a recepção: todas). Kids com selo; a cancelada riscada.
 * - O número de check-ins é o MESMO da chamada (`contarNaAula`; achado do AS).
 * - Nenhum dado financeiro (R14.6a).
 */
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { Botao, Cartao, EstadoVazio, FotoComTexto, Icone, PilulaDeVidro, Texto, Vidro } from '@/componentes';
import { useExperimentais } from '@/dados';
import { contarNaAula } from '@/dominio/presenca/presenca';
import { aulaDaHora, NOME_DO_NIVEL_DA_TURMA, NOME_DO_PUBLICO, type Aula } from '@/dominio/turmas/turmas';
import { espaco, estiloDeTexto, tokens } from '@/tema';
import { dataDaSaudacao, plural } from '@/componentes/formatos';
import { TelaComRolagem } from '../aluno/comum/Tela';
import { ErroAoCarregar, EsqueletoDaTela } from '../compartilhado/estados';
import { FOTO_DA_AULA } from '../luta/imagens';
import { GradeDeAtalhos, LinhaDeAula, ListaDeAulas, TopoDaTela } from '../luta/pecas';
import { useLutaDaEquipe } from '../luta/dados';

const NUMERO = estiloDeTexto('numeroMedio').estilo.fontFamily;

export function TelaHoje() {
  const router = useRouter();
  const equipe = useLutaDaEquipe();
  const experimentais = useExperimentais().data ?? [];
  const { luta, agora, hoje } = equipe;
  const aulas = equipe.minhasAulasDeHoje;
  const daHora = aulaDaHora(aulas, agora);
  const turmaDe = (a: Aula) => luta?.turmas.find((t) => t.id === a.turmaId);
  const expDa = (a: Aula) => experimentais.filter((e) => e.aulaId === a.id && (e.estado === 'agendada' || e.estado === 'compareceu')).length;
  const fechada = (a: Aula) => {
    const daAula = equipe.presencas.filter((p) => p.aulaId === a.id && p.estado !== 'retirada');
    return a.fimMs < agora && daAula.length > 0 && daAula.every((p) => p.estado === 'confirmada');
  };
  const nome = equipe.usuario?.nome ?? '';
  const abrir = (a: Aula) => router.push({ pathname: '/hoje/aula/[id]', params: { id: a.id } });

  const quando = (a: Aula) => {
    const min = Math.round((a.inicioMs - agora) / 60000);
    if (a.inicioMs <= agora && agora < a.fimMs) return `Agora · ${a.hora}`;
    if (min > 0 && min <= 90) return `Em ${min} min · ${a.hora}`;
    if (a.fimMs <= agora) return `Foi às ${a.hora}`;
    return `Às ${a.hora}`;
  };

  return (
    <TelaComRolagem semCabecalho>
      <TopoDaTela
        sobretitulo={hoje ? dataDaSaudacao(hoje) : undefined}
        titulo="Hoje"
        avatar={nome || '?'}
        acao={<Botao variante="vidro" tamanho="icone" icone="sino" rotuloAcessivel="Avisos da equipe" aoTocar={() => router.push('/perfil-da-equipe/avisos-da-equipe')} />}
      />

      {equipe.erro ? (
        <Cartao>
          <ErroAoCarregar aoTentar={equipe.tentarDeNovo} />
        </Cartao>
      ) : equipe.carregando || !luta ? (
        <EsqueletoDaTela heroi={300} linhas={3} />
      ) : !daHora ? (
        <Cartao>
          <EstadoVazio ilustracao="historico-vazio" titulo={equipe.ehRecepcao ? 'Sem aula hoje' : 'Sem aula sua hoje'} texto="A grade de amanhã aparece aqui amanhã cedo." />
        </Cartao>
      ) : (
        (() => {
          const t = turmaDe(daHora)!;
          const n = contarNaAula(daHora.id, equipe.presencas);
          const exp = expDa(daHora);
          return (
            <FotoComTexto
              imagem={FOTO_DA_AULA}
              descricao="Dois alunos fazem sparring no tatame da academia"
              variante="capa"
              altura={tokens.telas.capaInicio}
              estilo={{ padding: 0 }}
              topo={
                <PilulaDeVidro variante="escuroFixo">
                  <Icone nome="hoje" tamanho="pequeno" cor="texto" />
                  <Texto variante="legenda">{quando(daHora)}</Texto>
                </PilulaDeVidro>
              }
            >
              <Vidro variante="escuroFixo" estilo={{ padding: espaco[4], gap: espaco[3] }}>
                <View>
                  <Texto variante="titulo1" numberOfLines={2}>
                    {t.publico === 'aberta' ? 'Sexta OPEN' : t.nome.replace(/ — .*$/, '')}
                  </Texto>
                  <Texto variante="corpoPequeno" cor="textoSecundario">
                    {[NOME_DO_PUBLICO[t.publico], t.publico === 'adulto' || t.publico === 'kids' ? NOME_DO_NIVEL_DA_TURMA[t.nivel] : null, daHora.substitutoId === equipe.usuario?.id ? 'você substitui' : null].filter(Boolean).join(' · ')}
                  </Texto>
                </View>
                <View accessible accessibilityLabel={`${plural(n, 'check-in', 'check-ins')} e ${plural(exp, 'aula experimental', 'aulas experimentais')}`} style={{ flexDirection: 'row', gap: espaco[4], flexWrap: 'wrap' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: espaco[1] }}>
                    <Texto variante="titulo1" style={{ fontFamily: NUMERO, fontVariant: ['tabular-nums'] }} testID="hoje-checkins">
                      {n}
                    </Texto>
                    <Texto variante="corpoPequeno" cor="textoSecundario">
                      {n === 1 ? 'check-in' : 'check-ins'}
                    </Texto>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: espaco[1] }}>
                    <Texto variante="titulo1" style={{ fontFamily: NUMERO, fontVariant: ['tabular-nums'] }}>
                      {exp}
                    </Texto>
                    <Texto variante="corpoPequeno" cor="textoSecundario">
                      {exp === 1 ? 'experimental' : 'experimentais'}
                    </Texto>
                  </View>
                </View>
                <Botao variante="primario" tamanho="grande" icone="seta-direita" rotulo="Abrir a chamada" aoTocar={() => abrir(daHora)} testID="abrir-chamada" />
              </Vidro>
            </FotoComTexto>
          );
        })()
      )}

      {aulas.length ? (
        <View style={{ gap: espaco[3] }}>
          <Texto variante="titulo3" accessibilityRole="header">
            {equipe.ehRecepcao ? 'Aulas de hoje' : 'Suas aulas hoje'}
          </Texto>
          <ListaDeAulas rotulo="Aulas de hoje">
            {aulas.map((a, i) => {
              const t = turmaDe(a)!;
              const n = contarNaAula(a.id, equipe.presencas);
              const agoraEla = a.inicioMs <= agora && agora < a.fimMs;
              const apoio = a.cancelada ? 'Cancelada' : fechada(a) ? `Chamada fechada · ${plural(n, 'presente', 'presentes')}` : agoraEla ? `Agora · ${plural(n, 'check-in', 'check-ins')}` : a.inicioMs > agora ? `${plural(n, 'check-in', 'check-ins')} até agora` : plural(n, 'presença', 'presenças');
              const selo = a.cancelada ? 'Cancelada' : agoraEla ? 'Agora' : a.substitutoId === equipe.usuario?.id ? 'Substituto' : t.publico === 'kids' ? 'Kids' : t.publico === 'aberta' ? 'OPEN' : t.publico === 'competicao' ? 'Competição' : undefined;
              return <LinhaDeAula key={a.id} primeira={i === 0} hora={a.hora} titulo={t.publico === 'aberta' ? 'Sexta OPEN' : t.nome} apoio={apoio} selo={selo} seloMarca={agoraEla} minha={agoraEla} cancelada={a.cancelada} aoTocar={a.cancelada ? undefined : () => abrir(a)} />;
            })}
          </ListaDeAulas>
        </View>
      ) : null}

      <GradeDeAtalhos
        atalhos={[
          { icone: 'cronometro-round', rotulo: 'Cronômetro', aoTocar: () => router.push('/cronometro') },
          { icone: 'trofeu', rotulo: 'Eventos', aoTocar: () => router.push('/hoje/eventos') },
          equipe.ehProfessor && !equipe.ehRecepcao ? { icone: 'sino', rotulo: 'Aviso para uma turma', aoTocar: () => router.push('/turmas') } : { icone: 'sino', rotulo: 'Aviso para todos', aoTocar: () => router.push('/alunos/novo-aviso') },
          // revisão AN: só quem tem a aba Experimentais (quem é professor E recepção entra como professor, e o atalho caía no Hoje)
          ...(equipe.entrada === 'recepcao' ? [{ icone: 'convite' as const, rotulo: 'Nova experimental', aoTocar: () => router.push('/experimentais/nova') }] : []),
        ]}
      />
    </TelaComRolagem>
  );
}
