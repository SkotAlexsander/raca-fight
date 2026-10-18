/**
 * As outras linhas da aba Academia (mapa de luta, Parte B): Atletas, Eventos,
 * Evento, Técnicas e Raça Responde. Também na vitrine (sem conta), só para ler.
 *
 * - Atletas (R18.6): só quem LIGOU "Aparecer em Atletas"; sem ranking (R18.7).
 *   No Supabase isto vira uma visão pública só com os que consentiram.
 * - Eventos (R18): próximos e passados; as lutas só de atletas que consentiram.
 *   "Vou participar" é do aluno; a lista de quem vai é só da equipe.
 * - Técnicas (R21): o vídeo é um link (L30), que o app abre fora.
 * - Raça Responde (R22.3): perguntas que abrem e fecham.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { Avatar, Botao, Cartao, Chip, Chips, EstadoVazio, FotoComTexto, Icone, Linha, Lista, Texto, useAvisoRapido, useGravarComAviso } from '@/componentes';
import { useConsentimentosDeAtleta, useEquipe, useEventos, useFichasDaAcademia, useGraduacoesDaAcademia, useGravar, useLutas, useParticipantes, usePerguntasFrequentes, useSessao, useTecnicas } from '@/dados';
import { atletasVisiveis, eventosPassados, eventosVisiveis, lutasVisiveis, NOME_DO_TIPO_DE_EVENTO, proximosEventos, textoDoResultado, tituloDaLuta, validarLinkDoEvento } from '@/dominio/eventos/eventos';
import { duracaoDaTecnica, NOME_DO_NIVEL_DA_TECNICA, perguntasEmOrdem, tecnicasVisiveis } from '@/dominio/conteudo/conteudo';
import { espaco, raio, useTema } from '@/tema';
import { dataCurta } from '@/componentes/formatos';
import { Secao, TelaComRolagem } from '../comum/Tela';
import { EsqueletoDaTela } from '../../compartilhado/estados';
import { FOTO_DO_EVENTO, FOTO_DO_EVENTO_ATLETA } from '../../luta/imagens';
import { nomeDaModalidade, nomeDoProfessor, primeiroNome, textoDaFaixa, useAcademia } from '../../luta/dados';

// ---------------------------------------------------------------------------
// Atletas
// ---------------------------------------------------------------------------

export function TelaAtletas() {
  const router = useRouter();
  const { luta } = useAcademia();
  const consentimentos = useConsentimentosDeAtleta().data ?? [];
  const fichas = useFichasDaAcademia().data ?? [];
  const graduacoes = useGraduacoesDaAcademia().data ?? [];
  const lutas = useLutas().data ?? [];
  // o menor só com a autorização do responsável (R20.6): aqui, o dependente nunca aparece sem ela
  const ids = atletasVisiveis(consentimentos, (id) => !fichas.find((f) => f.alunoId === id)?.dependenteDe);
  const atletas = ids.map((id) => fichas.find((f) => f.alunoId === id)).filter((f): f is NonNullable<typeof f> => !!f);
  return (
    <TelaComRolagem titulo="Atletas" aoVoltar={() => router.back()}>
      <Texto variante="corpoPequeno" cor="textoSecundario">
        Só aparece quem aceitou. Ninguém é comparado com ninguém: é a história de cada atleta.
      </Texto>
      {atletas.length === 0 ? (
        <Cartao>
          <EstadoVazio ilustracao="nenhum-aluno" titulo="Nenhum atleta por aqui ainda" texto="Quem compete pela academia aparece quando liga a chave no Perfil." />
        </Cartao>
      ) : (
        atletas.map((a) => {
          const minhasLutas = lutasVisiveis(lutas, consentimentos, 'aluno').filter((l) => l.atletaId === a.alunoId);
          const faixas = a.modalidadeIds.map((m) => textoDaFaixa(luta, graduacoes, a.alunoId, m, 'adulto')?.texto).filter(Boolean);
          return (
            <Cartao key={a.alunoId}>
              <View style={{ gap: espaco[3] }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco[3] }}>
                  <Avatar nome={a.nome} tamanho={40} />
                  <View style={{ flex: 1 }}>
                    <Texto variante="titulo3">{a.nome}</Texto>
                    <Texto variante="corpoPequeno" cor="textoSecundario">
                      {[a.modalidadeIds.map((m) => nomeDaModalidade(luta, m)).join(', '), ...faixas].join(' · ')}
                    </Texto>
                  </View>
                </View>
                {minhasLutas.map((l) => (
                  <Texto key={l.id} variante="corpoPequeno">
                    {dataCurta(l.data)} · vs {l.adversario} · {l.categoria}
                    {textoDoResultado(l) ? ` · ${textoDoResultado(l)}` : ''}
                  </Texto>
                ))}
              </View>
            </Cartao>
          );
        })
      )}
    </TelaComRolagem>
  );
}

// ---------------------------------------------------------------------------
// Eventos e evento
// ---------------------------------------------------------------------------

export function TelaEventos({ base = '/academia', vitrine, equipe }: { base?: '/academia' | '/conheca' | '/hoje'; vitrine?: boolean; equipe?: boolean } = {}) {
  const router = useRouter();
  const { hoje } = useAcademia();
  const todos = eventosVisiveis(useEventos().data ?? [], equipe ? 'equipe' : vitrine ? 'vitrine' : 'aluno');
  const proximos = hoje ? proximosEventos(todos, hoje) : [];
  const passados = hoje ? eventosPassados(todos, hoje) : [];
  const abrir = (id: string) => router.push({ pathname: `${base}/evento/[id]` as never, params: { id } });
  return (
    <TelaComRolagem titulo="Eventos" aoVoltar={() => router.back()}>
      {!hoje ? <EsqueletoDaTela heroi={200} linhas={2} /> : null}
      {proximos.length ? (
        <Secao titulo="Próximos">
          {proximos.map((e, i) => (
            <FotoComTexto key={e.id} imagem={i % 2 === 0 ? FOTO_DO_EVENTO : FOTO_DO_EVENTO_ATLETA} descricao="" variante="grade" aoTocar={() => abrir(e.id)} rotuloAcessivel={`${e.nome}, ${dataCurta(e.data)}, ${e.local}`}>
              <Texto variante="legenda" cor="textoSecundario">
                {NOME_DO_TIPO_DE_EVENTO[e.tipo]}
              </Texto>
              <Texto variante="titulo3" numberOfLines={2}>
                {e.nome}
              </Texto>
              <Texto variante="corpoPequeno" cor="textoSecundario">
                {dataCurta(e.data)}
                {e.hora ? `, ${e.hora}` : ''} · {e.local}
              </Texto>
            </FotoComTexto>
          ))}
        </Secao>
      ) : hoje ? (
        <Cartao>
          <EstadoVazio ilustracao="historico-vazio" titulo="Nenhum evento marcado" texto="Exames, aulões e noites de luta aparecem aqui." />
        </Cartao>
      ) : null}
      {passados.length ? (
        <Secao titulo="Já aconteceram">
          <Cartao padding={0}>
            <Lista>
              {passados.map((e) => (
                <Linha key={e.id} icone="trofeu" titulo={e.nome} apoio={`${dataCurta(e.data)} · ${e.local}`} aoTocar={() => abrir(e.id)} />
              ))}
            </Lista>
          </Cartao>
        </Secao>
      ) : null}
    </TelaComRolagem>
  );
}

export function TelaEvento({ vitrine, equipe }: { vitrine?: boolean; equipe?: boolean } = {}) {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { luta, hoje } = useAcademia();
  const { usuario } = useSessao();
  const evento = (useEventos().data ?? []).find((e) => e.id === id);
  const consentimentos = useConsentimentosDeAtleta().data ?? [];
  const fichas = useFichasDaAcademia().data ?? [];
  const lutas = lutasVisiveis((useLutas().data ?? []).filter((l) => l.eventoId === id), consentimentos, equipe ? 'equipe' : vitrine ? 'vitrine' : 'aluno');
  const participantes = useParticipantes(id).data ?? [];
  const gravar = useGravar();
  const aviso = useAvisoRapido();
  const { gravar: alternar, ocupado } = useGravarComAviso(gravar.alternarParticipacao);
  if (!evento) {
    return (
      <TelaComRolagem titulo="Evento" aoVoltar={() => router.back()}>
        <EsqueletoDaTela heroi={200} linhas={2} />
      </TelaComRolagem>
    );
  }
  const vou = !!usuario && participantes.includes(usuario.id);
  const futuro = !!hoje && evento.data >= hoje;
  const linkOk = evento.link && luta && validarLinkDoEvento(evento.link, luta.aceitaLinkEmEvento) === null;
  return (
    <TelaComRolagem titulo={evento.nome} subtitulo={NOME_DO_TIPO_DE_EVENTO[evento.tipo]} aoVoltar={() => router.back()}>
      <FotoComTexto imagem={evento.tipo === 'luta' ? FOTO_DO_EVENTO : FOTO_DO_EVENTO_ATLETA} descricao="" variante="capa">
        <Texto variante="titulo1">{evento.nome}</Texto>
        <Texto variante="corpoPequeno" cor="textoSecundario">
          {dataCurta(evento.data)}
          {evento.hora ? `, ${evento.hora}` : ''} · {evento.local}
        </Texto>
      </FotoComTexto>
      {evento.descricao ? <Texto variante="corpo">{evento.descricao}</Texto> : null}
      {evento.modalidadeIds.length ? (
        <Chips>
          {evento.modalidadeIds.map((m) => (
            <Chip key={m} variante="info" rotulo={nomeDaModalidade(luta, m)} />
          ))}
        </Chips>
      ) : null}
      {lutas.length ? (
        <Secao titulo="Lutas">
          <Cartao padding={0}>
            <Lista>
              {lutas.map((l) => {
                const nome = fichas.find((f) => f.alunoId === l.atletaId)?.nome ?? 'Atleta da academia';
                return <Linha key={l.id} icone="luva" titulo={tituloDaLuta(l, primeiroNome(nome))} apoio={textoDoResultado(l) ?? 'Resultado depois da luta'} semSeta />;
              })}
            </Lista>
          </Cartao>
        </Secao>
      ) : null}
      <Cartao padding={0}>
        <Lista>
          <Linha icone="academia" titulo="Abrir o local no mapa" apoio={evento.endereco ?? evento.local} aoTocar={() => void Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(evento.endereco ?? evento.local)}`)} />
          {linkOk ? <Linha icone="seta-direita" titulo="Inscrição" apoio={evento.link} aoTocar={() => void Linking.openURL(evento.link!)} /> : null}
        </Lista>
      </Cartao>
      {equipe ? (
        <Secao titulo="Quem vai" lado={String(participantes.length)}>
          {participantes.length ? (
            <Cartao padding={0}>
              <Lista>
                {participantes.map((p) => {
                  const nome = fichas.find((f) => f.alunoId === p)?.nome ?? 'Aluno';
                  return <Linha key={p} avatar={nome} titulo={nome} semSeta />;
                })}
              </Lista>
            </Cartao>
          ) : (
            <Texto variante="corpoPequeno" cor="textoSecundario">
              Ninguém marcou “Vou participar” ainda.
            </Texto>
          )}
        </Secao>
      ) : null}
      {!vitrine && !equipe && usuario && futuro ? (
        <Botao
          variante={vou ? 'secundario' : 'primario'}
          icone={vou ? 'marcar' : undefined}
          rotulo={vou ? 'Vou participar · desmarcar' : 'Vou participar'}
          carregando={ocupado}
          aoTocar={async () => {
            const r = await alternar(evento.id, usuario.id);
            if (r.ok) aviso.mostrar({ tipo: 'sucesso', texto: r.valor.includes(usuario.id) ? 'A equipe sabe que você vai.' : 'Desmarcado.' });
          }}
        />
      ) : null}
    </TelaComRolagem>
  );
}

// ---------------------------------------------------------------------------
// Técnicas
// ---------------------------------------------------------------------------

export function TelaTecnicas({ vitrine }: { vitrine?: boolean } = {}) {
  const router = useRouter();
  const { luta } = useAcademia();
  const { vinculoAtivo } = useSessao();
  const equipe = useEquipe().data ?? [];
  const todas = tecnicasVisiveis(useTecnicas().data ?? [], { equipe: false, vinculoAtivo: !vitrine && vinculoAtivo?.estado === 'ativo' });
  const [modalidade, setModalidade] = useState<string | null>(null);
  const lista = todas.filter((t) => !modalidade || t.modalidadeId === modalidade);
  const mods = (luta?.modalidades ?? []).filter((m) => todas.some((t) => t.modalidadeId === m.id));
  return (
    <TelaComRolagem titulo="Técnicas" aoVoltar={() => router.back()}>
      {mods.length > 1 ? (
        <Chips>
          <Chip rotulo="Todas" selecionado={!modalidade} aoTocar={() => setModalidade(null)} />
          {mods.map((m) => (
            <Chip key={m.id} rotulo={m.nome} selecionado={modalidade === m.id} aoTocar={() => setModalidade(m.id)} />
          ))}
        </Chips>
      ) : null}
      {lista.length === 0 ? (
        <Cartao>
          <EstadoVazio ilustracao="historico-vazio" titulo="Nenhuma técnica por aqui" texto={vitrine ? 'Os vídeos abertos aparecem aqui; os outros, para quem é aluno.' : 'Os professores publicam os vídeos aqui.'} />
        </Cartao>
      ) : (
        lista.map((t) => {
          const prof = nomeDoProfessor(equipe, t.professorId);
          return (
            <Cartao key={t.id} aoTocar={t.link ? () => void Linking.openURL(t.link!) : undefined} rotuloAcessivel={`${t.titulo}. Assistir`}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco[3] }}>
                <IconeDoVideo />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Texto variante="titulo3" numberOfLines={2}>
                    {t.titulo}
                  </Texto>
                  <Texto variante="corpoPequeno" cor="textoSecundario">
                    {[nomeDaModalidade(luta, t.modalidadeId), NOME_DO_NIVEL_DA_TECNICA[t.nivel], duracaoDaTecnica(t.duracaoSegundos), prof ? `Prof. ${primeiroNome(prof)}` : null].filter(Boolean).join(' · ')}
                  </Texto>
                </View>
              </View>
            </Cartao>
          );
        })
      )}
      <Texto variante="corpoPequeno" cor="textoSecundario">
        O vídeo abre fora do app, no lugar em que a academia publicou.
      </Texto>
    </TelaComRolagem>
  );
}

function IconeDoVideo() {
  const { cores } = useTema();
  return (
    <View style={{ width: 48, height: 48, borderRadius: raio.medio, backgroundColor: cores.marcaSuave, alignItems: 'center', justifyContent: 'center' }}>
      <Icone nome="comecar" cor="marca" />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Raça Responde
// ---------------------------------------------------------------------------

export function TelaRacaResponde() {
  const router = useRouter();
  const { cores } = useTema();
  const perguntas = perguntasEmOrdem(usePerguntasFrequentes().data ?? []);
  const [aberta, setAberta] = useState<string | null>(null);
  return (
    <TelaComRolagem titulo="Raça Responde" subtitulo="Perguntas frequentes" aoVoltar={() => router.back()}>
      <Cartao padding={0}>
        {perguntas.map((p, i) => {
          const abriu = aberta === p.id;
          return (
            <View key={p.id} style={{ borderTopWidth: i === 0 ? 0 : 1, borderTopColor: cores.regua }}>
              <Pressable onPress={() => setAberta(abriu ? null : p.id)} accessibilityRole="button" accessibilityState={{ expanded: abriu }} aria-expanded={abriu} style={{ minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: espaco[3], paddingHorizontal: espaco[4], paddingVertical: espaco[3] }}>
                <Texto variante="corpoForte" style={{ flex: 1 }}>
                  {p.pergunta}
                </Texto>
                <Icone nome={abriu ? 'subir' : 'baixo'} cor="textoSecundario" />
              </Pressable>
              {abriu ? (
                <View style={{ paddingHorizontal: espaco[4], paddingBottom: espaco[4] }}>
                  <Texto variante="corpo" cor="textoSecundario">
                    {p.resposta}
                  </Texto>
                </View>
              ) : null}
            </View>
          );
        })}
      </Cartao>
    </TelaComRolagem>
  );
}
