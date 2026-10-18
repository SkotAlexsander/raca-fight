/**
 * Alunos da equipe (mapa de luta, Partes C e D; F14, F16).
 *
 * - Lista: busca e filtros (Todos · Sumidos · Novos · Kids · Atletas ·
 *   Atingiram os mínimos). O professor vê os alunos das turmas dele; a
 *   recepção vê todos e, em cima, os vínculos pendentes com "Confirmar todos".
 * - Ficha do aluno: faixa por modalidade, "atingiu os mínimos" (só um
 *   aviso: a graduação é SEMPRE do professor, R16.11), o histórico com as
 *   anuladas riscadas, registrar e anular graduação, atleta, a presença.
 * - Nenhum valor financeiro aparece aqui (R14.6a): mensalidade é do Admin.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Botao, Campo, Cartao, Chip, Chips, EstadoVazio, FolhaInferior, Linha, LinhaComChave, Lista, Texto, useAvisoRapido, useGravarComAviso } from '@/componentes';
import { useAlunosDaAcademia, useDependentes, useGravar, type FichaDeLuta } from '@/dados';
import { gerarId } from '@/dominio/ambiente';
import {
  anularGraduacao,
  avaliarMinimos,
  datasDepoisDe,
  descreverGraduacao,
  ErroDeGraduacao,
  graduacaoAtual,
  historicoDeGraduacao,
  prontosParaAvaliar,
  proximoPasso,
  registrarGraduacao,
  type AvaliacaoDosMinimos,
  type Graduacao,
  type Passo,
} from '@/dominio/graduacao/graduacao';
import type { SistemaDeGraduacao } from '@/dominio/graduacao/sistemas';
import { oQueOProfessorVe } from '@/dominio/kids/kids';
import { diasSemPresenca, estaSumido, quePontuam, ultimaPresenca, type Presenca } from '@/dominio/presenca/presenca';
import { diasEntre, instanteComFusoDaAcademia, somarDias } from '@/dominio/turmas/horario';
import type { Id } from '@/dominio/tipos';
import { dataCurta, plural } from '@/componentes/formatos';
import { espaco } from '@/tema';
import { Secao, TelaComRolagem } from '../aluno/comum/Tela';
import { ErroAoCarregar, EsqueletoDaTela } from '../compartilhado/estados';
import { FaixaDesenhada, Selo, TopoDaTela } from '../luta/pecas';
import { nomeDaModalidade, primeiroNome, publicoDaFicha, sistemaDaGraduacao, textoDaFaixa, useLutaDaEquipe } from '../luta/dados';

type Filtro = 'todos' | 'sumidos' | 'novos' | 'kids' | 'atletas' | 'minimos';
const NOME_DO_FILTRO: Record<Filtro, string> = { todos: 'Todos', sumidos: 'Sumidos', novos: 'Novos', kids: 'Kids', atletas: 'Atletas', minimos: 'Atingiram os mínimos' };
const DIAS_DE_NOVO = 30;

/** A avaliação dos mínimos de um aluno numa modalidade (R16.3, R16.11). Só aviso: nunca gradua sozinho. */
export function avaliacaoDoAluno(d: { sistema: SistemaDeGraduacao | null; graduacoes: readonly Graduacao[]; presencas: readonly Presenca[]; ficha: FichaDeLuta; modalidadeId: Id; hoje: string }): AvaliacaoDosMinimos | null {
  if (!d.sistema || d.sistema.aConfigurar || d.sistema.niveis.length === 0) return null;
  const atual = graduacaoAtual(d.graduacoes, d.ficha.alunoId, d.modalidadeId);
  const datas = quePontuam(d.presencas)
    .filter((p) => p.alunoId === d.ficha.alunoId && p.modalidadeId === d.modalidadeId)
    .map((p) => p.data);
  return avaliarMinimos({ sistema: d.sistema, atual, datasDasPresencas: datasDepoisDe(datas, atual?.data ?? null), nascimento: d.ficha.dataNascimento, hoje: d.hoje });
}

/** Quem pode registrar graduação nesta modalidade: o professor dela (perfil) ou o dono que dá aula (R16.6). Nunca a recepção. */
function podeGraduar(equipe: ReturnType<typeof useLutaDaEquipe>, modalidadeId: Id): boolean {
  if (!equipe.ehProfessor) return false;
  if (equipe.ehDono) return true;
  const eu = equipe.equipe.find((m) => m.usuario.id === equipe.usuario?.id);
  const minhas = eu?.perfil?.modalidadeIds;
  return !minhas || minhas.length === 0 || minhas.includes(modalidadeId);
}

export function TelaAlunosDaEquipe() {
  const router = useRouter();
  const equipe = useLutaDaEquipe();
  const resumos = useAlunosDaAcademia();
  const gravar = useGravar();
  const aviso = useAvisoRapido();
  const { gravar: confirmar, ocupado: confirmando } = useGravarComAviso(gravar.confirmarVinculos);
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const { luta, hoje } = equipe;

  const minhasTurmaIds = useMemo(() => new Set(equipe.minhasTurmas.map((t) => t.id)), [equipe.minhasTurmas]);
  const visiveis = useMemo(() => {
    const todas = (resumos.data ?? []).filter((r) => r.vinculo?.estado === 'ativo');
    if (equipe.ehRecepcao || equipe.ehDono) return todas;
    return todas.filter((r) => r.ficha.turmaIds.some((t) => minhasTurmaIds.has(t)));
  }, [resumos.data, equipe.ehRecepcao, equipe.ehDono, minhasTurmaIds]);
  const pendentes = (resumos.data ?? []).filter((r) => r.vinculo?.estado === 'pendente');

  const info = useMemo(() => {
    if (!luta || !hoje) return new Map<Id, { faixa: string | null; ultima: string | null; sumido: boolean; novo: boolean; minimos: boolean }>();
    const m = new Map<Id, { faixa: string | null; ultima: string | null; sumido: boolean; novo: boolean; minimos: boolean }>();
    for (const r of visiveis) {
      const f = r.ficha;
      const doAluno = equipe.presencas.filter((p) => p.alunoId === f.alunoId);
      const ultima = ultimaPresenca(doAluno);
      const faixa = f.modalidadeIds.map((mod) => textoDaFaixa(luta, equipe.graduacoes, f.alunoId, mod, publicoDaFicha(f))).find((x) => x && x.texto !== 'Sem graduação');
      const minimos = f.modalidadeIds.some((mod) => {
        const sistema = sistemaDaGraduacao(luta, graduacaoAtual(equipe.graduacoes, f.alunoId, mod), mod, publicoDaFicha(f));
        const a = avaliacaoDoAluno({ sistema, graduacoes: equipe.graduacoes, presencas: equipe.presencas, ficha: f, modalidadeId: mod, hoje });
        return !!a && prontosParaAvaliar([{ aluno: f, avaliacao: a }]).length > 0;
      });
      m.set(f.alunoId, { faixa: faixa?.texto ?? null, ultima, sumido: estaSumido({ ultima, desde: f.desde, hoje }), novo: diasEntre(f.desde, hoje) <= DIAS_DE_NOVO, minimos });
    }
    return m;
  }, [luta, hoje, visiveis, equipe.presencas, equipe.graduacoes]);

  const filtros: Filtro[] = equipe.ehProfessor ? ['todos', 'sumidos', 'novos', 'kids', 'atletas', 'minimos'] : ['todos', 'sumidos', 'novos', 'kids', 'atletas'];
  const termo = busca.trim().toLocaleLowerCase('pt-BR');
  const lista = visiveis
    .filter((r) => !termo || r.ficha.nome.toLocaleLowerCase('pt-BR').includes(termo))
    .filter((r) => {
      const i = info.get(r.ficha.alunoId);
      if (filtro === 'sumidos') return i?.sumido;
      if (filtro === 'novos') return i?.novo;
      if (filtro === 'kids') return !!r.ficha.dependenteDe;
      if (filtro === 'atletas') return r.ficha.atletaEm.length > 0;
      if (filtro === 'minimos') return i?.minimos;
      return true;
    })
    .sort((a, b) => a.ficha.nome.localeCompare(b.ficha.nome, 'pt-BR'));

  const carregando = equipe.carregando || resumos.isLoading;
  return (
    <TelaComRolagem semCabecalho>
      <TopoDaTela
        sobretitulo={equipe.ehRecepcao ? 'Toda a academia' : 'Das suas turmas'}
        titulo="Alunos"
        acao={equipe.cuidaDosVinculos ? <Botao variante="vidro" tamanho="icone" icone="sino" rotuloAcessivel="Avisos para todos" aoTocar={() => router.push('/alunos/avisos')} /> : undefined}
      />
      {equipe.erro || resumos.isError ? (
        <Cartao>
          <ErroAoCarregar aoTentar={() => { equipe.tentarDeNovo(); void resumos.refetch(); }} />
        </Cartao>
      ) : carregando || !luta || !hoje ? (
        <EsqueletoDaTela heroi={null} linhas={6} />
      ) : (
        <>
          {equipe.cuidaDosVinculos && pendentes.length ? (
            <Secao
              titulo="Vínculo pendente"
              lado={
                <Botao
                  variante="texto"
                  tamanho="pequeno"
                  rotulo="Confirmar todos"
                  intrinseco
                  carregando={confirmando}
                  testID="confirmar-todos"
                  aoTocar={async () => {
                    const r = await confirmar(pendentes.map((p) => p.vinculo!.id), equipe.usuario?.id ?? '');
                    if (r.ok) aviso.mostrar({ tipo: 'sucesso', texto: `${plural(pendentes.length, 'aluno confirmado', 'alunos confirmados')}.` });
                  }}
                />
              }
            >
              <Cartao padding={0}>
                <Lista>
                  {pendentes.map((r) => (
                    <Linha key={r.ficha.alunoId} avatar={r.ficha.nome} titulo={r.ficha.nome} apoio={`Pediu em ${dataCurta(r.vinculo!.desde)}`} aoTocar={() => router.push({ pathname: '/alunos/[id]', params: { id: r.ficha.alunoId } })} />
                  ))}
                </Lista>
              </Cartao>
            </Secao>
          ) : null}

          <Campo rotulo="Buscar aluno" value={busca} onChangeText={setBusca} icone="buscar" limpavel placeholder="Nome" />
          <Chips>
            {filtros.map((f) => (
              <Chip key={f} rotulo={NOME_DO_FILTRO[f]} selecionado={filtro === f} aoTocar={() => setFiltro(f)} />
            ))}
          </Chips>

          {lista.length === 0 ? (
            <Cartao>
              <EstadoVazio ilustracao="nenhum-aluno" titulo={filtro === 'minimos' ? 'Ninguém atingiu os mínimos' : 'Nenhum aluno aqui'} texto={filtro === 'minimos' ? 'Quando alguém cumprir o tempo e as presenças da régua, aparece aqui. Graduar continua sendo decisão sua.' : 'Troque o filtro ou a busca.'} />
            </Cartao>
          ) : (
            <Cartao padding={0}>
              <Lista>
                {lista.map((r) => {
                  const i = info.get(r.ficha.alunoId);
                  const dias = diasSemPresenca(i?.ultima ?? null, hoje);
                  const apoio = [i?.faixa, dias === null ? 'sem aula ainda' : dias === 0 ? 'veio hoje' : `última aula há ${plural(dias, 'dia', 'dias')}`].filter(Boolean).join(' · ');
                  return (
                    <Linha
                      key={r.ficha.alunoId}
                      avatar={r.ficha.nome}
                      titulo={r.ficha.dependenteDe ? `${primeiroNome(r.ficha.nome)} (Kids)` : r.ficha.nome}
                      apoio={apoio}
                      corDoApoio={i?.sumido ? 'atencao' : 'textoSecundario'}
                      aoTocar={() => router.push({ pathname: '/alunos/[id]', params: { id: r.ficha.alunoId } })}
                    />
                  );
                })}
              </Lista>
            </Cartao>
          )}
        </>
      )}
    </TelaComRolagem>
  );
}

const MINIMO: Record<string, string> = { tempo: 'tempo na faixa', presencas: 'presenças', idade: 'idade' };

export function TelaAlunoDaEquipe() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const equipe = useLutaDaEquipe();
  const resumos = useAlunosDaAcademia();
  const gravar = useGravar();
  const aviso = useAvisoRapido();
  const { gravar: salvarGraduacao, ocupado: salvando } = useGravarComAviso(gravar.salvarGraduacao);
  const { gravar: confirmar, ocupado: confirmando } = useGravarComAviso(gravar.confirmarVinculos);
  const { gravar: recusar } = useGravarComAviso(gravar.recusarVinculo);
  const { gravar: marcarAtleta } = useGravarComAviso(gravar.marcarAtleta);
  const resumo = (resumos.data ?? []).find((r) => r.ficha.alunoId === id);
  const ficha = resumo?.ficha;
  const deps = useDependentes(ficha?.dependenteDe);
  const [registrar, setRegistrar] = useState<{ modalidadeId: Id; passo: Passo; anterior: boolean } | null>(null);
  const [obs, setObs] = useState('');
  const [academiaDeOrigem, setAcademiaDeOrigem] = useState('');
  const [anular, setAnular] = useState<Graduacao | null>(null);
  const [motivo, setMotivo] = useState('');
  const { luta, hoje } = equipe;

  if (!ficha || !luta || !hoje) {
    return (
      <TelaComRolagem titulo="Aluno" aoVoltar={() => router.back()}>
        {resumos.isLoading || equipe.carregando ? <EsqueletoDaTela heroi={null} linhas={4} /> : <EstadoVazio ilustracao="nenhum-aluno" titulo="Aluno não encontrado" texto="Ele pode ter saído da academia." />}
      </TelaComRolagem>
    );
  }
  const publico = publicoDaFicha(ficha);
  const doAluno = equipe.presencas.filter((p) => p.alunoId === ficha.alunoId);
  const ultima = ultimaPresenca(doAluno);
  const dias = diasSemPresenca(ultima, hoje);
  const ultimos30 = quePontuam(doAluno).filter((p) => p.data > somarDias(hoje, -30)).length;
  const dependente = ficha.dependenteDe ? deps.data?.find((d) => d.id === ficha.alunoId) : undefined;
  const professorVe = dependente ? oQueOProfessorVe(dependente) : null;
  const turmas = luta.turmas.filter((t) => ficha.turmaIds.includes(t.id));
  const em = () => instanteComFusoDaAcademia(Date.now(), luta.fuso);
  const sistemaDoRegistro = registrar ? sistemaDaGraduacao(luta, graduacaoAtual(equipe.graduacoes, ficha.alunoId, registrar.modalidadeId), registrar.modalidadeId, publico) : null;

  return (
    <TelaComRolagem titulo={ficha.dependenteDe ? primeiroNome(ficha.nome) : ficha.nome} subtitulo={`${ficha.modalidadeIds.map((m) => nomeDaModalidade(luta, m)).join(', ')} · desde ${dataCurta(ficha.desde)}`} aoVoltar={() => router.back()}>
      {resumo.vinculo?.estado === 'pendente' && equipe.cuidaDosVinculos ? (
        <Cartao>
          <View style={{ gap: espaco[3] }}>
            <Texto variante="corpoForte">Pediu para entrar na academia</Texto>
            <View style={{ flexDirection: 'row', gap: espaco[2] }}>
              <Botao rotulo="Recusar" variante="secundario" aoTocar={async () => { const r = await recusar(resumo.vinculo!.id, equipe.usuario?.id ?? ''); if (r.ok) router.back(); }} estilo={{ flex: 1 }} />
              <Botao rotulo="Confirmar" carregando={confirmando} aoTocar={async () => { const r = await confirmar([resumo.vinculo!.id], equipe.usuario?.id ?? ''); if (r.ok) aviso.mostrar({ tipo: 'sucesso', texto: 'Aluno confirmado.' }); }} estilo={{ flex: 1 }} />
            </View>
          </View>
        </Cartao>
      ) : null}

      {professorVe?.saude ? (
        <Cartao>
          <Texto variante="legenda" cor="textoSecundario">Saúde (o responsável liberou para a equipe)</Texto>
          <Texto variante="corpo">{professorVe.saude}</Texto>
        </Cartao>
      ) : null}

      <Secao titulo="Presença">
        <Cartao>
          <Texto variante="corpo" testID="ficha-presenca">
            {dias === null ? 'Ainda não veio a nenhuma aula.' : dias === 0 ? 'Veio hoje.' : `Última aula há ${plural(dias, 'dia', 'dias')}.`} {plural(ultimos30, 'aula', 'aulas')} nos últimos 30 dias.
          </Texto>
          {turmas.length ? (
            <Texto variante="corpoPequeno" cor="textoSecundario">
              Turmas: {turmas.map((t) => t.nome).join(' · ')}
            </Texto>
          ) : null}
        </Cartao>
      </Secao>

      {ficha.modalidadeIds.map((mod) => {
        const atual = graduacaoAtual(equipe.graduacoes, ficha.alunoId, mod);
        const sistema = sistemaDaGraduacao(luta, atual, mod, publico);
        const faixa = textoDaFaixa(luta, equipe.graduacoes, ficha.alunoId, mod, publico);
        const avaliacao = avaliacaoDoAluno({ sistema, graduacoes: equipe.graduacoes, presencas: equipe.presencas, ficha, modalidadeId: mod, hoje });
        const historico = historicoDeGraduacao(equipe.graduacoes, ficha.alunoId, mod, true).slice().reverse();
        const graduaAqui = podeGraduar(equipe, mod) && !!sistema && sistema.niveis.length > 0;
        const atleta = ficha.atletaEm.includes(mod);
        return (
          <Secao key={mod} titulo={nomeDaModalidade(luta, mod)} lado={atleta ? <Selo texto="Atleta" marca /> : undefined}>
            <Cartao>
              <View style={{ gap: espaco[3] }}>
                {faixa ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco[3] }}>
                    {faixa.cores.length ? <FaixaDesenhada cores={faixa.cores} graus={faixa.graus} rotuloAcessivel={faixa.texto} /> : null}
                    <View style={{ flex: 1 }}>
                      <Texto variante="corpoForte">{faixa.texto}</Texto>
                      {faixa.aConfigurar ? <Texto variante="corpoPequeno" cor="textoSecundario">Régua a confirmar no app Admin</Texto> : atual ? <Texto variante="corpoPequeno" cor="textoSecundario">Desde {dataCurta(atual.data)}</Texto> : null}
                    </View>
                  </View>
                ) : (
                  <Texto variante="corpoPequeno" cor="textoSecundario">Esta modalidade não tem graduação.</Texto>
                )}
                {avaliacao && avaliacao.passo && equipe.ehProfessor ? (
                  <View testID={`minimos-${mod}`}>
                    <Texto variante="corpoPequeno" cor={avaliacao.cumpre ? 'sucesso' : 'textoSecundario'}>
                      {avaliacao.cumpre
                        ? `Atingiu os mínimos para ${sistema ? descreverGraduacao(sistema, avaliacao.passo.nivelId, avaliacao.passo.grau).toLocaleLowerCase('pt-BR') : 'o próximo passo'}. A decisão é sua.`
                        : `Para o próximo passo falta: ${avaliacao.faltam.map((f) => `${MINIMO[f]}${avaliacao.origens[f] === 'federacao' ? ' (federação)' : ' (academia)'}`).join(', ')}.`}
                    </Texto>
                    <Texto variante="corpoPequeno" cor="textoSecundario">
                      {plural(avaliacao.presencas, 'presença', 'presenças')} e {plural(avaliacao.meses, 'mês', 'meses')} desde a última graduação.
                    </Texto>
                  </View>
                ) : null}
                {graduaAqui ? (
                  <View style={{ flexDirection: 'row', gap: espaco[2], flexWrap: 'wrap' }}>
                    <Botao
                      rotulo="Registrar graduação"
                      icone="faixa"
                      testID={`registrar-${mod}`}
                      aoTocar={() => {
                        const passo = proximoPasso(sistema!, atual ? { nivelId: atual.nivelId, grau: atual.grau } : null) ?? { nivelId: sistema!.niveis[0]!.id, grau: 0 };
                        setObs('');
                        setRegistrar({ modalidadeId: mod, passo, anterior: false });
                      }}
                    />
                    <Botao
                      rotulo="Faixa de outra academia"
                      variante="texto"
                      aoTocar={() => {
                        setObs('');
                        setAcademiaDeOrigem('');
                        setRegistrar({ modalidadeId: mod, passo: { nivelId: sistema!.niveis[0]!.id, grau: 0 }, anterior: true });
                      }}
                    />
                  </View>
                ) : null}
              </View>
            </Cartao>
            {historico.length ? (
              <Cartao padding={0}>
                <Lista>
                  {historico.map((g) => {
                    const s = luta.sistemas.find((x) => x.id === g.sistemaId);
                    const texto = s ? descreverGraduacao(s, g.nivelId, g.grau) : g.nivelId;
                    return (
                      <Linha
                        key={g.id}
                        titulo={g.anulada ? `${texto} (anulada)` : texto}
                        apoio={g.anulada ? `Motivo: ${g.anulada.motivo}` : `${dataCurta(g.data)}${g.academiaDeOrigem ? ` · trazida de ${g.academiaDeOrigem}` : ''}${g.origem === 'exame' ? ' · exame' : ''}`}
                        corDoApoio={g.anulada ? 'textoSecundario' : 'textoSecundario'}
                        desabilitada={!!g.anulada}
                        semSeta
                        fim={!g.anulada && graduaAqui && g.origem !== 'inicial' ? <Botao variante="perigoDiscreto" tamanho="pequeno" rotulo="Anular" intrinseco aoTocar={() => { setMotivo(''); setAnular(g); }} /> : undefined}
                      />
                    );
                  })}
                </Lista>
              </Cartao>
            ) : null}
            {equipe.ehProfessor ? (
              <Cartao padding={0}>
                <LinhaComChave
                  rotulo="Atleta da academia"
                  apoio="Compete por ela. Só aparece em Atletas se ele quiser."
                  ligado={atleta}
                  naLista
                  aoMudar={async (v) => {
                    await marcarAtleta(ficha.alunoId, ficha.academiaId, mod, v);
                  }}
                />
              </Cartao>
            ) : null}
          </Secao>
        );
      })}

      <FolhaInferior
        visivel={!!registrar}
        aoFechar={() => setRegistrar(null)}
        titulo={registrar?.anterior ? 'Faixa de outra academia' : 'Registrar graduação'}
        rodape={
          <>
            <Botao rotulo="Voltar" variante="secundario" aoTocar={() => setRegistrar(null)} />
            <Botao
              rotulo="Registrar"
              carregando={salvando}
              testID="confirmar-graduacao"
              aoTocar={async () => {
                if (!registrar || !sistemaDoRegistro) return;
                try {
                  const g = registrarGraduacao({
                    id: gerarId(),
                    academiaId: ficha.academiaId,
                    alunoId: ficha.alunoId,
                    modalidadeId: registrar.modalidadeId,
                    sistema: sistemaDoRegistro,
                    passo: registrar.passo,
                    data: hoje,
                    hoje,
                    graduadoPorId: registrar.anterior ? null : (equipe.usuario?.id ?? null),
                    ...(registrar.anterior ? { academiaDeOrigem } : {}),
                    observacao: obs,
                    origem: registrar.anterior ? 'anterior' : 'promocao',
                    registradaPorId: equipe.usuario?.id ?? '',
                    em: em(),
                  });
                  const r = await salvarGraduacao(g);
                  if (r.ok) {
                    setRegistrar(null);
                    aviso.mostrar({ tipo: 'sucesso', texto: `${descreverGraduacao(sistemaDoRegistro, g.nivelId, g.grau)} registrada.` });
                  }
                } catch (e) {
                  aviso.mostrar({ tipo: 'erro', texto: e instanceof ErroDeGraduacao ? e.message : 'Não deu para registrar.' });
                }
              }}
            />
          </>
        }
      >
        {registrar && sistemaDoRegistro ? (
          <View style={{ gap: espaco[3] }}>
            <Texto variante="legenda" cor="textoSecundario">{sistemaDoRegistro.palavraDoNivel}</Texto>
            <Chips>
              {sistemaDoRegistro.niveis.map((n) => (
                <Chip key={n.id} rotulo={n.nome} selecionado={registrar.passo.nivelId === n.id} aoTocar={() => setRegistrar({ ...registrar, passo: { nivelId: n.id, grau: 0 } })} />
              ))}
            </Chips>
            {(() => {
              const nivel = sistemaDoRegistro.niveis.find((n) => n.id === registrar.passo.nivelId);
              if (!nivel || nivel.grausMaximos === 0 || !sistemaDoRegistro.palavraDoGrau) return null;
              return (
                <>
                  <Texto variante="legenda" cor="textoSecundario">{sistemaDoRegistro.palavraDoGrau}</Texto>
                  <Chips>
                    {Array.from({ length: nivel.grausMaximos + 1 }, (_, i) => (
                      <Chip key={i} rotulo={i === 0 ? 'Sem grau' : `${i}º`} selecionado={registrar.passo.grau === i} aoTocar={() => setRegistrar({ ...registrar, passo: { ...registrar.passo, grau: i } })} />
                    ))}
                  </Chips>
                </>
              );
            })()}
            {registrar.anterior ? <Campo rotulo="Academia de onde veio" value={academiaDeOrigem} onChangeText={setAcademiaDeOrigem} /> : null}
            <Campo rotulo="Observação (opcional)" value={obs} onChangeText={setObs} maxLength={140} multilinha />
            <Texto variante="corpoPequeno" cor="textoSecundario">
              Data: hoje, {dataCurta(hoje)}. O aluno vê a nova faixa no Início.
            </Texto>
          </View>
        ) : null}
      </FolhaInferior>

      <FolhaInferior
        visivel={!!anular}
        aoFechar={() => setAnular(null)}
        titulo="Anular esta graduação?"
        rodape={
          <>
            <Botao rotulo="Voltar" variante="secundario" aoTocar={() => setAnular(null)} />
            <Botao
              rotulo="Anular"
              variante="perigo"
              carregando={salvando}
              aoTocar={async () => {
                if (!anular) return;
                try {
                  const r = await salvarGraduacao(anularGraduacao(anular, equipe.usuario?.id ?? '', motivo, em()));
                  if (r.ok) {
                    setAnular(null);
                    aviso.mostrar({ tipo: 'sucesso', texto: 'Graduação anulada. Ela fica riscada no histórico da equipe.' });
                  }
                } catch (e) {
                  aviso.mostrar({ tipo: 'erro', texto: e instanceof ErroDeGraduacao ? e.message : 'Não deu para anular.' });
                }
              }}
            />
          </>
        }
      >
        <Campo rotulo="Motivo" value={motivo} onChangeText={setMotivo} placeholder="Ex.: registrada no aluno errado" />
      </FolhaInferior>
    </TelaComRolagem>
  );
}
