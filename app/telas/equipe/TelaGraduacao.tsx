/**
 * Graduação do professor (mapa de luta, Parte C, aba Graduação; F16).
 *
 * - "Atingiram os mínimos" por modalidade, em ordem (R16.11): só um aviso de
 *   quem pode ser avaliado. Ninguém gradua sozinho: o professor abre a ficha
 *   e registra.
 * - Kids que passam ao adulto este ano (R16.9).
 * - Os exames: os candidatos, o resultado de cada um e "Fechar o exame",
 *   que cria as graduações dos aprovados de uma vez.
 * - A régua de cada modalidade, só para ler: é configurada no Admin (L19).
 */
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Botao, Cartao, Chip, Chips, EstadoVazio, FolhaInferior, Linha, Lista, Texto, useAvisoRapido, useGravarComAviso, useUmPorVez } from '@/componentes';
import { useExames, useGravar } from '@/dados';
import { gerarId } from '@/dominio/ambiente';
import { definirResultado, descreverGraduacao, ErroDeGraduacao, fecharExame, graduacaoAtual, passaAoAdultoEsteAno, prontosParaAvaliar, type Exame, type ResultadoDoExame } from '@/dominio/graduacao/graduacao';
import { instanteComFusoDaAcademia } from '@/dominio/turmas/horario';
import { dataCurta, plural } from '@/componentes/formatos';
import { espaco } from '@/tema';
import { Secao, TelaComRolagem } from '../aluno/comum/Tela';
import { ErroAoCarregar, EsqueletoDaTela } from '../compartilhado/estados';
import { FaixaDesenhada, TopoDaTela } from '../luta/pecas';
import { nomeDaModalidade, primeiroNome, publicoDaFicha, sistemaDaGraduacao, useLutaDaEquipe } from '../luta/dados';
import { avaliacaoDoAluno } from './TelasDosAlunos';

const NOME_DO_RESULTADO: Record<ResultadoDoExame, string> = { aprovado: 'Aprovado', nao_aprovado: 'Não aprovado', faltou: 'Faltou' };

export function TelaGraduacaoDaEquipe() {
  const router = useRouter();
  const equipe = useLutaDaEquipe();
  const exames = useExames();
  const gravar = useGravar();
  const aviso = useAvisoRapido();
  const { gravar: salvarExame, ocupado: salvandoExame } = useGravarComAviso(gravar.salvarExame);
  // revisão AN: a trava do salvarExame solta antes das graduações; um toque nesse meio fechava o exame de novo
  const fecharOExame = useUmPorVez(async (acao: () => Promise<void>) => acao());
  const [aberto, setAberto] = useState<Exame | null>(null);
  const { luta, hoje } = equipe;

  if (equipe.erro || exames.isError) {
    return (
      <TelaComRolagem semCabecalho>
        <TopoDaTela titulo="Graduação" />
        <Cartao>
          <ErroAoCarregar aoTentar={() => { equipe.tentarDeNovo(); void exames.refetch(); }} />
        </Cartao>
      </TelaComRolagem>
    );
  }
  if (equipe.carregando || !luta || !hoje) {
    return (
      <TelaComRolagem semCabecalho>
        <TopoDaTela titulo="Graduação" />
        <EsqueletoDaTela heroi={null} linhas={5} />
      </TelaComRolagem>
    );
  }

  const minhasTurmaIds = new Set(equipe.minhasTurmas.map((t) => t.id));
  const fichas = equipe.fichas.filter((f) => equipe.ehDono || f.turmaIds.some((t) => minhasTurmaIds.has(t)));
  const modalidades = luta.modalidades.filter((m) => luta.sistemas.some((s) => s.modalidadeId === m.id));
  const kidsParaAdulto = fichas.filter((f) => f.dependenteDe && f.dataNascimento && passaAoAdultoEsteAno(f.dataNascimento, hoje));
  const em = () => instanteComFusoDaAcademia(Date.now(), luta.fuso);
  const proximos = (exames.data ?? []).filter((e) => !e.fechadoEm).sort((a, b) => (a.data < b.data ? -1 : 1));
  const nomeDoAluno = (id: string) => equipe.fichas.find((f) => f.alunoId === id)?.nome ?? 'Aluno';

  return (
    <TelaComRolagem semCabecalho>
      <TopoDaTela sobretitulo="Das suas turmas" titulo="Graduação" />

      {modalidades.map((m) => {
        const candidatos = fichas
          .filter((f) => f.modalidadeIds.includes(m.id))
          .map((f) => {
            const sistema = sistemaDaGraduacao(luta, graduacaoAtual(equipe.graduacoes, f.alunoId, m.id), m.id, publicoDaFicha(f));
            const avaliacao = avaliacaoDoAluno({ sistema, graduacoes: equipe.graduacoes, presencas: equipe.presencas, ficha: f, modalidadeId: m.id, hoje });
            return avaliacao && sistema ? { aluno: { ficha: f, sistema }, avaliacao } : null;
          })
          .filter((x): x is NonNullable<typeof x> => !!x);
        const prontos = prontosParaAvaliar(candidatos);
        const aConfigurar = luta.sistemas.filter((s) => s.modalidadeId === m.id).every((s) => s.aConfigurar);
        return (
          <Secao key={m.id} titulo={`${m.nome}: atingiram os mínimos`} lado={prontos.length ? plural(prontos.length, 'aluno', 'alunos') : undefined}>
            {aConfigurar ? (
              <Cartao>
                <Texto variante="corpo" cor="textoSecundario">
                  A régua desta modalidade ainda está a confirmar. O dono configura no app Admin; até lá, ninguém aparece aqui.
                </Texto>
              </Cartao>
            ) : prontos.length === 0 ? (
              <Texto variante="corpoPequeno" cor="textoSecundario">
                Ninguém por enquanto.
              </Texto>
            ) : (
              <Cartao padding={0}>
                <Lista>
                  {prontos.map(({ aluno, avaliacao }) => {
                    const passo = avaliacao.passo!;
                    const nivel = aluno.sistema.niveis.find((n) => n.id === passo.nivelId);
                    return (
                      <Linha
                        key={aluno.ficha.alunoId}
                        inicio={nivel ? <FaixaDesenhada cores={nivel.cores} graus={passo.grau} pequena /> : undefined}
                        titulo={aluno.ficha.dependenteDe ? primeiroNome(aluno.ficha.nome) : aluno.ficha.nome}
                        apoio={`Para ${descreverGraduacao(aluno.sistema, passo.nivelId, passo.grau).toLocaleLowerCase('pt-BR')} · ${plural(avaliacao.presencas, 'presença', 'presenças')}${avaliacao.temMinimos ? '' : ' · régua sem mínimos'}`}
                        aoTocar={() => router.push({ pathname: '/alunos/[id]', params: { id: aluno.ficha.alunoId } })}
                      />
                    );
                  })}
                </Lista>
              </Cartao>
            )}
          </Secao>
        );
      })}
      <Texto variante="corpoPequeno" cor="textoSecundario">
        Atingir os mínimos não gradua ninguém: é só a lista de quem você pode avaliar.
      </Texto>

      {kidsParaAdulto.length ? (
        <Secao titulo="Passam à régua adulta este ano">
          <Cartao padding={0}>
            <Lista>
              {kidsParaAdulto.map((f) => (
                <Linha key={f.alunoId} avatar={f.nome} titulo={primeiroNome(f.nome)} apoio="Completa 16 anos este ano" aoTocar={() => router.push({ pathname: '/alunos/[id]', params: { id: f.alunoId } })} />
              ))}
            </Lista>
          </Cartao>
        </Secao>
      ) : null}

      <Secao titulo="Exames">
        {exames.isLoading ? (
          <EsqueletoDaTela heroi={null} linhas={1} />
        ) : proximos.length === 0 ? (
          <Cartao>
            <EstadoVazio ilustracao="historico-vazio" titulo="Nenhum exame marcado" texto="O exame de faixa é marcado no app Admin, com a data e os candidatos." />
          </Cartao>
        ) : (
          <Cartao padding={0}>
            <Lista>
              {proximos.map((e) => {
                const comResultado = e.candidatos.filter((c) => c.resultado).length;
                return <Linha key={e.id} icone="faixa" titulo={`${nomeDaModalidade(luta, e.modalidadeId)} · ${dataCurta(e.data)}, ${e.hora}`} apoio={`${plural(e.candidatos.length, 'candidato', 'candidatos')} · ${comResultado} com resultado`} aoTocar={() => setAberto(e)} />;
              })}
            </Lista>
          </Cartao>
        )}
      </Secao>

      <Secao titulo="As réguas">
        <Cartao padding={0}>
          <Lista>
            {luta.sistemas.map((s) => (
              <Linha key={s.id} icone="faixa" titulo={s.nome} apoio={s.aConfigurar ? 'A confirmar no app Admin' : `${plural(s.niveis.length, 'nível', 'níveis')} · ${s.publico === 'kids' ? 'Kids' : 'Adulto'}`} semSeta />
            ))}
          </Lista>
        </Cartao>
      </Secao>

      <FolhaInferior
        visivel={!!aberto}
        aoFechar={() => setAberto(null)}
        titulo={aberto ? `Exame de ${nomeDaModalidade(luta, aberto.modalidadeId)}` : ''}
        tipo="lista"
        rodape={
          <>
            <Botao rotulo="Voltar" variante="secundario" aoTocar={() => setAberto(null)} />
            <Botao
              rotulo="Fechar o exame"
              carregando={salvandoExame || fecharOExame.ocupado}
              aoTocar={() => void fecharOExame.executar(async () => {
                if (!aberto) return;
                const sistema = luta.sistemas.find((s) => s.id === aberto.sistemaId);
                if (!sistema) return;
                try {
                  const { exame, graduacoes } = fecharExame({ exame: aberto, sistema, hoje, porId: equipe.usuario?.id ?? '', em: em(), gerarId: () => gerarId() });
                  const r = await salvarExame(exame);
                  if (!r.ok) return;
                  for (const g of graduacoes) await gravar.salvarGraduacao(g);
                  setAberto(null);
                  aviso.mostrar({ tipo: 'sucesso', texto: `Exame fechado. ${plural(graduacoes.length, 'graduação registrada', 'graduações registradas')}.` });
                } catch (e) {
                  aviso.mostrar({ tipo: 'erro', texto: e instanceof ErroDeGraduacao ? e.message : 'Não deu para fechar.' });
                }
              })}
            />
          </>
        }
      >
        {aberto ? (
          <View style={{ gap: espaco[4] }}>
            <Texto variante="corpoPequeno" cor="textoSecundario">
              {dataCurta(aberto.data)}, {aberto.hora} · {aberto.local}
            </Texto>
            {aberto.candidatos.map((c) => (
              <View key={c.alunoId} style={{ gap: espaco[2] }}>
                <Texto variante="corpoForte">{nomeDoAluno(c.alunoId)}</Texto>
                <Chips>
                  {(['aprovado', 'nao_aprovado', 'faltou'] as ResultadoDoExame[]).map((r) => (
                    <Chip
                      key={r}
                      rotulo={NOME_DO_RESULTADO[r]}
                      selecionado={c.resultado === r}
                      aoTocar={() => {
                        const sistema = luta.sistemas.find((s) => s.id === aberto.sistemaId);
                        const ficha = equipe.fichas.find((f) => f.alunoId === c.alunoId);
                        const a = ficha && sistema ? avaliacaoDoAluno({ sistema, graduacoes: equipe.graduacoes, presencas: equipe.presencas, ficha, modalidadeId: aberto.modalidadeId, hoje }) : null;
                        setAberto(definirResultado(aberto, c.alunoId, r, a?.passo ?? undefined));
                      }}
                    />
                  ))}
                </Chips>
              </View>
            ))}
          </View>
        ) : null}
      </FolhaInferior>
    </TelaComRolagem>
  );
}
