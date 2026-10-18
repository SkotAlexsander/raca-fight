/**
 * O Perfil do app da EQUIPE (professor e recepção; mapa de luta, Parte C):
 *
 * - Perfil: nome, papel e academia; "Meu perfil profissional" com o estado;
 *   Avisos da equipe; Avisos da academia (dono e recepção); Trocar de visão;
 *   Sair. A fila diz quantas presenças esperam sinal (a chamada no tatame sem
 *   Wi-Fi, R15.9).
 * - Meu perfil profissional (R16.14): a chave "Mostrar meu perfil aos alunos"
 *   (nasce desligada, com a prévia), nome de exibição, formação, as
 *   MODALIDADES e a GRADUAÇÃO em cada uma (informada pelo professor), CREF
 *   opcional (L18) e "Sobre mim". As especialidades e a grade de turnos de
 *   musculação saíram: as turmas dele aparecem sozinhas para o aluno.
 * - Avisos da equipe (R22.5): check-ins para confirmar, experimentais de
 *   amanhã, prontos para avaliar, pedidos para entrar.
 *
 * Nunca telefone, e-mail, nota, estrela ou preço (R11.6, R11.9, R11.10).
 */
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Avatar, Botao, Campo, Cartao, Chip, Chips, EstadoVazio, FolhaInferior, Icone, Linha, LinhaComChave, Lista, Texto, useAvisoRapido, useGravarComAviso } from '@/componentes';
import { useEquipe, useFila, useGravar, usePreferenciasDaEquipe, useSessao, type MembroDaEquipe } from '@/dados';
import { AMBIENTE_PADRAO } from '@/dominio/ambiente';
import type { PreferenciasDaEquipe } from '@/dominio/avisos';
import { criarPerfilProfissional, editarPerfilProfissional, LIMITE_DA_GRADUACAO_INFORMADA, LIMITE_DO_SOBRE, type MudancasNoPerfil } from '@/dominio/perfil-profissional';
import type { PerfilProfissional } from '@/dominio/tipos';
import { borda, espaco, useTema } from '@/tema';
import { NOME_DO_PAPEL_NA_EQUIPE, plural } from '@/componentes/formatos';
import { Secao, TelaDaAcademia } from './pecas';
import { nomeDaModalidade, useAcademia, useQuemEstaNaEquipe } from '../luta/dados';

const ROTULO_DO_ESTADO = { sem: 'Sem perfil', visivel: 'Visível aos alunos', desligado: 'Desligado', escondido: 'Escondido pelo dono' } as const;

function estadoDoPerfil(m: Pick<MembroDaEquipe, 'perfil'> | undefined): keyof typeof ROTULO_DO_ESTADO {
  if (!m?.perfil) return 'sem';
  if (m.perfil.ocultadoPeloDono) return 'escondido';
  return m.perfil.visivelAosAlunos ? 'visivel' : 'desligado';
}

/** O perfil como o ALUNO vê (a prévia ao ligar a chave). */
export function CartaoDoPerfil({ perfil }: { perfil: PerfilProfissional }) {
  const { cores } = useTema();
  const { luta } = useAcademia();
  return (
    <Cartao>
      <View style={{ gap: espaco[3] }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco[3] }}>
          <Avatar nome={perfil.nomeExibicao} tamanho={64} />
          <View style={{ flex: 1 }}>
            <Texto variante="titulo2">{perfil.nomeExibicao}</Texto>
            <Texto variante="corpoPequeno" cor="textoSecundario">
              {perfil.formacao}
            </Texto>
          </View>
        </View>
        {(perfil.modalidadeIds ?? []).length ? (
          <Chips>
            {(perfil.modalidadeIds ?? []).map((m) => (
              <Chip key={m} variante="info" rotulo={nomeDaModalidade(luta, m)} />
            ))}
          </Chips>
        ) : null}
        {perfil.graduacaoInformada?.length ? (
          <Texto variante="corpoPequeno" cor="textoSecundario">
            {perfil.graduacaoInformada.map((g) => `${nomeDaModalidade(luta, g.modalidadeId)}: ${g.texto}`).join(' · ')} · informada pelo professor
          </Texto>
        ) : null}
        {perfil.sobre ? <Texto variante="corpo">{perfil.sobre}</Texto> : null}
        <View style={{ height: borda.fina, backgroundColor: cores.borda }} />
        <Texto variante="corpoPequeno" cor="textoSecundario">
          Telefone e e-mail nunca aparecem.
        </Texto>
      </View>
    </Cartao>
  );
}

// ---------------------------------------------------------------------------
// Perfil (equipe) — a aba
// ---------------------------------------------------------------------------

export function TelaPerfilDaEquipe() {
  const router = useRouter();
  const sessao = useSessao();
  const fila = useFila();
  const { vinculo, cuidaDosVinculos } = useQuemEstaNaEquipe();
  const membros = useEquipe().data ?? [];
  const eu = membros.find((m) => m.vinculo.id === vinculo?.id);
  const ativos = sessao.vinculos.filter((v) => v.estado === 'ativo');
  const nome = sessao.usuario?.nome ?? '';
  const estado = estadoDoPerfil(eu);

  return (
    <TelaDaAcademia titulo="Perfil" subtitulo={vinculo?.academia.nome} grande>
      <Cartao>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco[3] }}>
          <Avatar nome={nome} tamanho={64} />
          <View style={{ flex: 1 }}>
            <Texto variante="titulo2">{nome}</Texto>
            <Texto variante="corpoPequeno" cor="textoSecundario">
              {vinculo ? `${NOME_DO_PAPEL_NA_EQUIPE[vinculo.papel]} · ${vinculo.academia.nome}` : ''}
            </Texto>
          </View>
        </View>
      </Cartao>
      <Lista recuo={espaco[4] + 24 + espaco[3]}>
        <Linha inicio={<Icone nome="perfil" cor="textoSecundario" />} titulo="Meu perfil profissional" apoio={ROTULO_DO_ESTADO[estado]} corDoApoio={estado === 'visivel' ? 'marca' : 'textoSecundario'} aoTocar={() => router.push('/perfil-da-equipe/meu-perfil-profissional')} />
        <Linha inicio={<Icone nome="sino" cor="textoSecundario" />} titulo="Avisos da equipe" apoio="O que chega no celular de trabalho" aoTocar={() => router.push('/perfil-da-equipe/avisos-da-equipe')} />
        {cuidaDosVinculos ? <Linha inicio={<Icone nome="academia" cor="textoSecundario" />} titulo="Avisos da academia" apoio="O recado para todos os alunos" aoTocar={() => router.push('/alunos/avisos')} /> : null}
        {ativos.length > 1 ? <Linha inicio={<Icone nome="trocar" cor="textoSecundario" />} titulo="Trocar de visão" apoio="Sem sair da conta" aoTocar={() => router.push('/escolher-visao')} /> : null}
        {__DEV__ ? <Linha inicio={<Icone nome="lista" cor="textoSecundario" />} titulo="Ver os componentes" apoio="O catálogo do app" aoTocar={() => router.push('/componentes')} /> : null}
      </Lista>
      {fila.pendentes.length > 0 ? (
        <Texto variante="corpoPequeno" cor="textoSecundario">
          Chamada guardada: {plural(fila.pendentes.length, 'presença aguardando sinal', 'presenças aguardando sinal')}.
        </Texto>
      ) : null}
      <Botao
        rotulo="Sair"
        variante="perigoDiscreto"
        aoTocar={() => {
          sessao.sair();
          router.replace('/');
        }}
      />
    </TelaDaAcademia>
  );
}

// ---------------------------------------------------------------------------
// Meu perfil profissional
// ---------------------------------------------------------------------------

export function TelaMeuPerfilProfissional() {
  const router = useRouter();
  const aviso = useAvisoRapido();
  const gravar = useGravar();
  const { gravar: salvar } = useGravarComAviso(gravar.salvarPerfilProfissional, { umPorVez: false });
  const { usuario } = useSessao();
  const { vinculo } = useQuemEstaNaEquipe();
  const { luta } = useAcademia();
  const membros = useEquipe().data ?? [];
  const eu = membros.find((m) => m.vinculo.id === vinculo?.id);
  const perfil = eu?.perfil ?? null;
  const [rascunho, setRascunho] = useState<{ nome?: string; formacao?: string; cref?: string; sobre?: string; graduacao?: Record<string, string> }>({});
  const [erros, setErros] = useState<Record<string, string | undefined>>({});
  const [previa, setPrevia] = useState(false);
  const voltar = () => (router.canGoBack() ? router.back() : router.replace('/perfil-da-equipe'));
  const quem = useMemo(() => ({ usuarioId: usuario?.id ?? '', vinculos: vinculo ? [vinculo] : [] }), [usuario, vinculo]);

  const aplicar = (mudancas: MudancasNoPerfil, campo?: string) => {
    if (!perfil) return false;
    try {
      void salvar(editarPerfilProfissional(perfil, mudancas, quem, AMBIENTE_PADRAO.agora()));
      if (campo) setErros((e) => ({ ...e, [campo]: undefined }));
      return true;
    } catch (e) {
      const msg = traduzirErro(e instanceof Error ? e.message : '');
      if (campo) setErros((x) => ({ ...x, [campo]: msg }));
      else aviso.mostrar({ texto: msg, tipo: 'erro' });
      return false;
    }
  };

  if (!vinculo || !usuario) return null;
  if (!perfil) {
    return (
      <TelaDaAcademia titulo="Meu perfil profissional" aoVoltar={voltar}>
        <EstadoVazio icone="perfil" titulo="Seu perfil para os alunos" texto={`Os alunos da ${vinculo.academia.nome} conhecem você em Professores. É opcional.`}>
          <Botao rotulo="Montar meu perfil" intrinseco aoTocar={() => void salvar(criarPerfilProfissional(vinculo, { id: AMBIENTE_PADRAO.gerarId(), nomeExibicao: usuario.nome, formacao: 'Professor' }, AMBIENTE_PADRAO.agora()))} />
        </EstadoVazio>
      </TelaDaAcademia>
    );
  }

  const escondido = perfil.ocultadoPeloDono;
  const sobre = rascunho.sobre ?? perfil.sobre;
  const minhas = perfil.modalidadeIds ?? [];
  const graduacaoDe = (m: string) => rascunho.graduacao?.[m] ?? perfil.graduacaoInformada?.find((g) => g.modalidadeId === m)?.texto ?? '';
  const salvarGraduacao = (m: string) => {
    const nova = minhas.map((id) => ({ modalidadeId: id, texto: id === m ? graduacaoDe(m) : (perfil.graduacaoInformada?.find((g) => g.modalidadeId === id)?.texto ?? '') }));
    aplicar({ graduacaoInformada: nova }, `graduacao-${m}`);
  };
  return (
    <TelaDaAcademia titulo="Meu perfil profissional" aoVoltar={voltar}>
      <Cartao>
        <LinhaComChave
          rotulo="Mostrar meu perfil aos alunos"
          apoio={escondido ? 'Escondido pelo dono. Fale com ele para voltar a aparecer.' : `Só a academia mostra, em Professores. Telefone e e-mail nunca aparecem.`}
          ligado={perfil.visivelAosAlunos && !escondido}
          travado={escondido}
          aoMudar={(v) => {
            if (v) setPrevia(true);
            else if (aplicar({ visivelAosAlunos: false })) aviso.mostrar({ texto: 'Seu perfil saiu de Professores.' });
          }}
        />
      </Cartao>

      <Secao titulo="Quem você é">
        <Campo rotulo="Nome de exibição" value={rascunho.nome ?? perfil.nomeExibicao} onChangeText={(t) => setRascunho((r) => ({ ...r, nome: t }))} onBlur={() => rascunho.nome !== undefined && aplicar({ nomeExibicao: rascunho.nome }, 'nome')} erro={erros.nome} />
        <Campo rotulo="Formação" value={rascunho.formacao ?? perfil.formacao} onChangeText={(t) => setRascunho((r) => ({ ...r, formacao: t }))} onBlur={() => rascunho.formacao !== undefined && aplicar({ formacao: rascunho.formacao }, 'formacao')} erro={erros.formacao} apoio="Até 60 caracteres." />
      </Secao>

      <Secao titulo="Modalidades" apoio="Os alunos filtram Professores por estas.">
        <Chips>
          {(luta?.modalidades ?? []).map((m) => {
            const marcada = minhas.includes(m.id);
            return <Chip key={m.id} rotulo={m.nome} selecionado={marcada} aoTocar={() => aplicar({ modalidadeIds: marcada ? minhas.filter((x) => x !== m.id) : [...minhas, m.id] })} />;
          })}
        </Chips>
        {minhas.map((m) => (
          <Campo
            key={m}
            rotulo={`Sua graduação no ${nomeDaModalidade(luta, m)}`}
            placeholder="Faixa preta, 2º grau"
            value={graduacaoDe(m)}
            onChangeText={(t) => setRascunho((r) => ({ ...r, graduacao: { ...(r.graduacao ?? {}), [m]: t } }))}
            onBlur={() => rascunho.graduacao?.[m] !== undefined && salvarGraduacao(m)}
            erro={erros[`graduacao-${m}`]}
            apoio={`Até ${LIMITE_DA_GRADUACAO_INFORMADA} caracteres. Aparece com "informada pelo professor".`}
          />
        ))}
      </Secao>

      <Secao titulo="Mais (opcional)">
        <Campo
          rotulo="CREF (opcional)"
          placeholder="012345-G/SP"
          autoCapitalize="characters"
          value={rascunho.cref ?? perfil.cref ?? ''}
          onChangeText={(t) => setRascunho((r) => ({ ...r, cref: t }))}
          onBlur={() => rascunho.cref !== undefined && aplicar({ cref: rascunho.cref.trim() === '' ? null : rascunho.cref }, 'cref')}
          erro={erros.cref}
          apoio="Se tiver, aparece inteiro com 'informado pelo professor'."
        />
        <Campo
          rotulo="Sobre mim"
          multilinha
          value={sobre}
          onChangeText={(t) => setRascunho((r) => ({ ...r, sobre: t }))}
          onBlur={() => rascunho.sobre !== undefined && aplicar({ sobre: rascunho.sobre }, 'sobre')}
          erro={erros.sobre}
          apoio={`${Array.from(sobre).length} de ${LIMITE_DO_SOBRE}. Sem telefone, e-mail ou @.`}
        />
      </Secao>

      <FolhaInferior
        visivel={previa}
        aoFechar={() => setPrevia(false)}
        titulo="Assim os alunos veem"
        tipo="lista"
        rodape={
          <>
            <Botao rotulo="Cancelar" variante="secundario" aoTocar={() => setPrevia(false)} />
            <Botao
              rotulo="Mostrar"
              aoTocar={() => {
                if (aplicar({ visivelAosAlunos: true })) aviso.mostrar({ texto: 'Seu perfil entrou em Professores.', tipo: 'sucesso' });
                setPrevia(false);
              }}
            />
          </>
        }
      >
        <CartaoDoPerfil perfil={perfil} />
      </FolhaInferior>
    </TelaDaAcademia>
  );
}

function traduzirErro(msg: string): string {
  if (msg.includes('CREF')) return 'Use o formato do CREF: 012345-G/SP.';
  if (msg.includes('contato')) return 'Tire telefone, e-mail, @ ou link: o perfil não tem contato (R11.6).';
  if (msg.includes('vazio')) return 'Não pode ficar vazio.';
  if (msg.includes('passa de')) return 'Ficou comprido demais.';
  if (msg.includes('escondido')) return 'Escondido pelo dono: a chave fica travada.';
  return 'Não deu para salvar. Confira o campo.';
}

// ---------------------------------------------------------------------------
// Avisos da equipe (R22.5)
// ---------------------------------------------------------------------------

export function TelaAvisosDaEquipe() {
  const router = useRouter();
  const { papeis, vinculo, ehProfessor } = useQuemEstaNaEquipe();
  const gravar = useGravar();
  const { gravar: comAviso } = useGravarComAviso((passo: () => Promise<void>) => passo(), { umPorVez: false });
  const preferencias = usePreferenciasDaEquipe(vinculo?.id);
  const voltar = () => (router.canGoBack() ? router.back() : router.replace('/perfil-da-equipe'));
  const minhas = preferencias.data;
  const recepcaoOuDono = papeis.has('recepcao') || papeis.has('dono');
  const chaves: { chave: keyof PreferenciasDaEquipe; rotulo: string; apoio: string; mostra: boolean }[] = [
    { chave: 'checkinsParaConfirmar', rotulo: 'Check-ins para confirmar', apoio: 'Às 23:00, se ficou chamada aberta. Às 23:59 eles confirmam sozinhos.', mostra: ehProfessor || recepcaoOuDono },
    { chave: 'experimentaisDeAmanha', rotulo: 'Experimentais de amanhã', apoio: 'Resumo às 18:00.', mostra: true },
    { chave: 'prontosParaAvaliar', rotulo: 'Prontos para avaliar', apoio: 'Segunda às 09:00: quem atingiu os mínimos nas suas modalidades.', mostra: ehProfessor },
    { chave: 'pedidosDeVinculo', rotulo: 'Pedidos para entrar', apoio: 'Somados de 2 em 2 horas.', mostra: recepcaoOuDono },
  ];
  const mudar = (chave: keyof PreferenciasDaEquipe, v: boolean) => {
    if (!vinculo || !minhas) return;
    void comAviso(() => gravar.salvarPreferenciasDaEquipe(vinculo.id, { ...minhas, [chave]: v }));
  };
  return (
    <TelaDaAcademia titulo="Avisos da equipe" aoVoltar={voltar}>
      <Cartao>
        <View>
          {chaves
            .filter((c) => c.mostra)
            .map((c) => (
              <LinhaComChave key={c.chave} rotulo={c.rotulo} apoio={c.apoio} ligado={minhas?.[c.chave] !== false} travado={!minhas} aoMudar={(v) => mudar(c.chave, v)} />
            ))}
        </View>
      </Cartao>
      <Texto variante="corpoPequeno" cor="textoSecundario">
        Entre 22h e 7h nada toca. Nenhum aviso leva nome de aluno na tela bloqueada, nem dado de saúde.
      </Texto>
    </TelaDaAcademia>
  );
}
