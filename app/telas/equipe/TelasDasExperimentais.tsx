/**
 * Aulas experimentais da recepção (mapa de luta, Parte D; F17, R19).
 *
 * - Lista em grupos: Hoje · Agendadas · Compareceram e não matricularam ·
 *   Faltaram. Cada uma muda de estado pelas transições do domínio (R19.3).
 * - Nova experimental: nome, WhatsApp, modalidade, a aula (da grade real),
 *   criança (nome e idade, R19.10) e o código de indicação (R19.9). Se o
 *   mesmo WhatsApp já fez experimental da modalidade, AVISA (não bloqueia, L24).
 * - "Mandar no WhatsApp" abre a conversa com a mensagem pronta.
 * - O contato (WhatsApp) só a recepção e o dono veem; o professor vê o
 *   primeiro nome na chamada (R19.5).
 */
import { useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Linking, View } from 'react-native';
import { Botao, Campo, Cartao, Chip, Chips, EstadoVazio, FolhaInferior, Linha, LinhaComChave, Lista, Texto, useAvisoRapido, useGravarComAviso, useUmPorVez } from '@/componentes';
import { useExperimentais, useGravar, useInteressados } from '@/dados';
import { gerarId } from '@/dominio/ambiente';
import {
  ErroDaExperimental,
  gruposDasExperimentais,
  jaFezExperimental,
  lerCodigoDeIndicacao,
  linkDoWhatsApp,
  mudarEstadoDaExperimental,
  NOME_DO_ESTADO_DA_EXPERIMENTAL,
  novoInteressado,
  podeMudarPara,
  type AulaExperimental,
  type EstadoDaExperimental,
} from '@/dominio/experimental/experimental';
import { aulasEntre } from '@/dominio/turmas/turmas';
import { diaDaSemanaDe, instanteComFusoDaAcademia, somarDias } from '@/dominio/turmas/horario';
import { NOME_CURTO_DO_DIA, dataCurta, plural } from '@/componentes/formatos';
import { espaco } from '@/tema';
import { Secao, TelaComRolagem } from '../aluno/comum/Tela';
import { ErroAoCarregar, EsqueletoDaTela } from '../compartilhado/estados';
import { TopoDaTela } from '../luta/pecas';
import { nomeDaModalidade, useLutaDaEquipe } from '../luta/dados';

const ACOES: EstadoDaExperimental[] = ['compareceu', 'faltou', 'matriculou', 'nao_seguiu', 'cancelada'];
const ROTULO_DA_ACAO: Partial<Record<EstadoDaExperimental, string>> = { compareceu: 'Compareceu', faltou: 'Faltou', matriculou: 'Matriculou', nao_seguiu: 'Não seguiu', cancelada: 'Cancelar' };

export function TelaExperimentais() {
  const router = useRouter();
  const equipe = useLutaDaEquipe();
  const experimentais = useExperimentais();
  const interessados = useInteressados();
  const gravar = useGravar();
  const aviso = useAvisoRapido();
  const { gravar: salvar, ocupado } = useGravarComAviso(gravar.salvarExperimental);
  const [aberta, setAberta] = useState<AulaExperimental | null>(null);
  const { luta, hoje } = equipe;

  const carregando = equipe.carregando || experimentais.isLoading || interessados.isLoading;
  const grupos = hoje ? gruposDasExperimentais(experimentais.data ?? [], hoje) : null;
  const interessadoDe = (e: AulaExperimental) => (interessados.data ?? []).find((i) => i.id === e.interessadoId);
  const linha = (e: AulaExperimental) => {
    const i = interessadoDe(e);
    const turma = luta?.turmas.find((t) => t.id === e.turmaId);
    return (
      <Linha
        key={e.id}
        avatar={i?.crianca?.nome ?? i?.nome ?? '?'}
        titulo={i?.crianca ? `${i.crianca.nome}, ${i.crianca.idade} anos` : (i?.nome ?? 'Interessado')}
        apoio={`${nomeDaModalidade(luta, e.modalidadeId)} · ${dataCurta(e.data)}${turma ? ` · ${turma.nome}` : ''} · ${NOME_DO_ESTADO_DA_EXPERIMENTAL[e.estado]}`}
        aoTocar={() => setAberta(e)}
      />
    );
  };

  return (
    <TelaComRolagem semCabecalho>
      <TopoDaTela sobretitulo="Aula experimental grátis" titulo="Experimentais" />
      <Botao rotulo="Nova experimental" icone="mais" aoTocar={() => router.push('/experimentais/nova')} testID="nova-experimental" />
      {equipe.erro || experimentais.isError ? (
        <Cartao>
          <ErroAoCarregar aoTentar={() => { equipe.tentarDeNovo(); void experimentais.refetch(); }} />
        </Cartao>
      ) : carregando || !grupos ? (
        <EsqueletoDaTela heroi={null} linhas={4} />
      ) : (
        <>
          {([
            ['Hoje', grupos.hoje],
            ['Agendadas', grupos.agendadas],
            ['Compareceram e não matricularam', grupos.compareceramSemMatricula],
            ['Faltaram', grupos.faltaram],
          ] as const).map(([titulo, lista]) => (
            <Secao key={titulo} titulo={titulo} lado={lista.length ? String(lista.length) : undefined}>
              {lista.length ? (
                <Cartao padding={0}>
                  <Lista>{lista.map(linha)}</Lista>
                </Cartao>
              ) : (
                <Texto variante="corpoPequeno" cor="textoSecundario">
                  Nenhuma.
                </Texto>
              )}
            </Secao>
          ))}
          {grupos.hoje.length + grupos.agendadas.length + grupos.compareceramSemMatricula.length + grupos.faltaram.length === 0 ? (
            <Cartao>
              <EstadoVazio ilustracao="historico-vazio" titulo="Nenhuma experimental" texto="Quem chama no WhatsApp para conhecer entra aqui." />
            </Cartao>
          ) : null}
        </>
      )}

      <FolhaInferior visivel={!!aberta} aoFechar={() => setAberta(null)} titulo={aberta ? (interessadoDe(aberta)?.nome ?? 'Experimental') : ''}>
        {aberta ? (
          <View style={{ gap: espaco[3] }}>
            <Texto variante="corpo" cor="textoSecundario">
              {nomeDaModalidade(luta, aberta.modalidadeId)} · {dataCurta(aberta.data)} · {NOME_DO_ESTADO_DA_EXPERIMENTAL[aberta.estado]}
            </Texto>
            {interessadoDe(aberta) ? (
              <Botao
                rotulo="Mandar no WhatsApp"
                icone="conversa"
                variante="secundario"
                aoTocar={() => {
                  const i = interessadoDe(aberta)!;
                  void Linking.openURL(linkDoWhatsApp(i.whatsapp, `Olá, ${i.nome.split(' ')[0]}! Sua aula experimental de ${nomeDaModalidade(luta, aberta.modalidadeId)} na ${luta?.contato.nomeCurto ?? 'academia'} está marcada para ${dataCurta(aberta.data)}.`));
                }}
              />
            ) : null}
            <Chips>
              {ACOES.filter((a) => podeMudarPara(aberta.estado, a)).map((a) => (
                <Chip
                  key={a}
                  rotulo={ROTULO_DA_ACAO[a] ?? a}
                  desabilitado={ocupado}
                  aoTocar={async () => {
                    try {
                      const nova = mudarEstadoDaExperimental(aberta, a, instanteComFusoDaAcademia(Date.now(), luta?.fuso ?? 'America/Sao_Paulo'));
                      const r = await salvar(nova);
                      if (r.ok) {
                        setAberta(null);
                        aviso.mostrar({ tipo: 'sucesso', texto: `Marcada como "${NOME_DO_ESTADO_DA_EXPERIMENTAL[a]}".` });
                      }
                    } catch (e) {
                      aviso.mostrar({ tipo: 'erro', texto: e instanceof ErroDaExperimental ? e.message : 'Não deu para mudar.' });
                    }
                  }}
                />
              ))}
            </Chips>
          </View>
        ) : null}
      </FolhaInferior>
    </TelaComRolagem>
  );
}

export function TelaNovaExperimental() {
  const router = useRouter();
  const equipe = useLutaDaEquipe();
  const experimentais = useExperimentais().data ?? [];
  const interessados = useInteressados().data ?? [];
  const gravar = useGravar();
  const aviso = useAvisoRapido();
  const [nome, setNome] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [modalidadeId, setModalidadeId] = useState<string | null>(null);
  const [aulaId, setAulaId] = useState<string | null>(null);
  const [ehCrianca, setEhCrianca] = useState(false);
  const [nomeDaCrianca, setNomeDaCrianca] = useState('');
  const [idade, setIdade] = useState('');
  const [codigo, setCodigo] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  // revisão AN: o segundo toque rápido marcava outra experimental (e outro interessado)
  const salvarAgora = useRef<() => Promise<void>>(async () => {});
  const marcar = useUmPorVez(() => salvarAgora.current());
  const { luta, hoje, agora } = equipe;

  const aulas = useMemo(() => {
    if (!luta || !hoje || !modalidadeId) return [];
    const turmas = luta.turmas.filter((t) => t.ativa && t.modalidadeIds.includes(modalidadeId) && (ehCrianca ? t.publico === 'kids' : t.publico === 'adulto' || t.publico === 'aberta'));
    return aulasEntre(turmas, hoje, somarDias(hoje, 7), luta.fuso, equipe.ajustes).filter((a) => !a.cancelada && a.inicioMs > agora).slice(0, 8);
  }, [luta, hoje, modalidadeId, ehCrianca, equipe.ajustes, agora]);
  const aviso2 = modalidadeId && whatsapp.replace(/\D/g, '').length >= 10 && jaFezExperimental(experimentais, interessados, whatsapp, modalidadeId);

  if (!luta || !hoje) {
    return (
      <TelaComRolagem titulo="Nova experimental" aoVoltar={() => router.back()}>
        <EsqueletoDaTela heroi={null} linhas={4} />
      </TelaComRolagem>
    );
  }

  const salvar = async () => {
    setErro(null);
    const aula = aulas.find((a) => a.id === aulaId);
    if (!modalidadeId || !aula) {
      setErro('Escolha a modalidade e a aula.');
      return;
    }
    const idadeN = Number(idade);
    if (ehCrianca && (!nomeDaCrianca.trim() || !Number.isInteger(idadeN) || idadeN <= 0)) {
      setErro('Escreva o nome e a idade da criança.');
      return;
    }
    const em = instanteComFusoDaAcademia(Date.now(), luta.fuso);
    try {
      const codigoLido = codigo.trim() ? lerCodigoDeIndicacao(codigo) : null;
      if (codigo.trim() && !codigoLido) {
        setErro('O código de indicação tem 6 letras e números.');
        return;
      }
      const interessado = novoInteressado({
        id: gerarId(),
        academiaId: luta.academiaId,
        nome,
        whatsapp,
        modalidadeId,
        ...(ehCrianca ? { crianca: { nome: nomeDaCrianca.trim(), idade: idadeN } } : {}),
        ...(codigoLido ? { codigoDeIndicacao: codigoLido } : {}),
        criadoEm: em,
        criadoPorId: equipe.usuario?.id ?? '',
      });
      setSalvando(true);
      await gravar.salvarInteressado(interessado);
      await gravar.salvarExperimental({ id: gerarId(), academiaId: luta.academiaId, interessadoId: interessado.id, aulaId: aula.id, turmaId: aula.turmaId, data: aula.data, modalidadeId, estado: 'agendada', marcadaPorId: equipe.usuario?.id ?? '', criadaEm: em, atualizadaEm: em });
      aviso.mostrar({ tipo: 'sucesso', texto: 'Experimental marcada. O professor vê o primeiro nome na chamada.' });
      router.back();
    } catch (e) {
      setErro(e instanceof ErroDaExperimental ? e.message : e instanceof Error && /sinal|conex/i.test(e.message) ? 'Sem conexão. A experimental precisa de internet.' : 'Não deu para marcar.');
    } finally {
      setSalvando(false);
    }
  };

  salvarAgora.current = salvar;

  return (
    <TelaComRolagem titulo="Nova experimental" aoVoltar={() => router.back()} rodape={<Botao rotulo="Marcar a experimental" carregando={salvando || marcar.ocupado} aoTocar={() => void marcar.executar()} testID="salvar-experimental" />}>
      <Campo rotulo={ehCrianca ? 'Nome do responsável' : 'Nome'} value={nome} onChangeText={setNome} autoComplete="name" />
      <Campo rotulo="WhatsApp com DDD" value={whatsapp} onChangeText={setWhatsapp} keyboardType="phone-pad" placeholder="(51) 90000-0000" />
      {aviso2 ? (
        <Cartao>
          <Texto variante="corpoPequeno" cor="atencao" testID="aviso-ja-fez">
            Este WhatsApp já fez experimental de {nomeDaModalidade(luta, modalidadeId!)}. Dá para marcar outra, se a academia quiser.
          </Texto>
        </Cartao>
      ) : null}
      <Cartao padding={0}>
        <LinhaComChave rotulo="É para uma criança" apoio="Turmas Kids. O responsável é quem fica com o contato." ligado={ehCrianca} naLista aoMudar={(v) => { setEhCrianca(v); setAulaId(null); }} />
      </Cartao>
      {ehCrianca ? (
        <View style={{ flexDirection: 'row', gap: espaco[3] }}>
          <View style={{ flex: 2 }}>
            <Campo rotulo="Nome da criança" value={nomeDaCrianca} onChangeText={setNomeDaCrianca} />
          </View>
          <View style={{ flex: 1 }}>
            <Campo rotulo="Idade" value={idade} onChangeText={setIdade} keyboardType="number-pad" maxLength={2} />
          </View>
        </View>
      ) : null}
      <Secao titulo="Modalidade">
        <Chips>
          {luta.modalidades.map((m) => (
            <Chip key={m.id} rotulo={m.nome} selecionado={modalidadeId === m.id} aoTocar={() => { setModalidadeId(m.id); setAulaId(null); }} />
          ))}
        </Chips>
      </Secao>
      {modalidadeId ? (
        <Secao titulo="Aula">
          {aulas.length ? (
            <Chips>
              {aulas.map((a) => (
                <Chip key={a.id} rotulo={`${a.data === hoje ? 'Hoje' : NOME_CURTO_DO_DIA[diaDaSemanaDe(a.data)]} ${a.hora}`} selecionado={aulaId === a.id} aoTocar={() => setAulaId(a.id)} />
              ))}
            </Chips>
          ) : (
            <Texto variante="corpoPequeno" cor="textoSecundario">
              Nenhuma aula {ehCrianca ? 'Kids ' : ''}desta modalidade nos próximos 7 dias.
            </Texto>
          )}
        </Secao>
      ) : null}
      <Campo rotulo="Código de indicação (opcional)" value={codigo} onChangeText={(t) => setCodigo(t.toUpperCase())} autoCapitalize="characters" maxLength={6} apoio="Quem foi indicado por um aluno traz o código dele." />
      {erro ? (
        <Texto variante="corpoPequeno" cor="erro">
          {erro}
        </Texto>
      ) : null}
      <Texto variante="corpoPequeno" cor="textoSecundario">
        {plural(aulas.length, 'aula possível', 'aulas possíveis')} na semana.
      </Texto>
    </TelaComRolagem>
  );
}
