/**
 * Meus dependentes e Dependente (R20; F23): o responsável cuida das crianças.
 * Na v1 a criança NÃO tem conta (R20.1). Em cada uma: nome, nascimento, a
 * saúde (opcional, dado sensível, só o responsável preenche; a equipe só vê se
 * ele ligar, R20.5) e a AUTORIZAÇÃO DE IMAGEM, que nasce DESLIGADA (R20.6).
 * Sem foto de criança no app. A matrícula da criança é do Admin (AI).
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Avatar, Botao, Campo, Cartao, EstadoVazio, Linha, LinhaComChave, Lista, Texto, useAvisoRapido, useGravarComAviso } from '@/componentes';
import { useGravar, useSessao } from '@/dados';
import { definirAutorizacaoDeImagem, ErroDoDependente, idadeEmAnos, novoDependente, type Dependente } from '@/dominio/kids/kids';
import { lerDataBrasileira } from '@/dominio/unidades';
import { gerarId } from '@/dominio/ambiente';
import { espaco } from '@/tema';
import { plural } from '@/componentes/formatos';
import { Secao, TelaComRolagem } from '../comum/Tela';
import { FaixaDesenhada } from '../../luta/pecas';
import { nomeDaModalidade, textoDaFaixa, useLutaDoAluno } from '../../luta/dados';
import { instanteComFusoDaAcademia } from '@/dominio/turmas/horario';

const dataBR = (iso?: string) => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : '');

export function TelaDependentes() {
  const router = useRouter();
  const luta = useLutaDoAluno();
  return (
    <TelaComRolagem titulo="Meus dependentes" aoVoltar={() => router.back()}>
      <Texto variante="corpoPequeno" cor="textoSecundario">
        A criança não tem conta: você faz o check-in dela, vê as presenças e a faixa, e recebe os avisos da turma.
      </Texto>
      {luta.dependentes.length === 0 ? (
        <Cartao>
          <EstadoVazio ilustracao="nenhum-aluno" titulo="Nenhuma criança cadastrada" texto="Cadastre o seu filho ou filha para as turmas Kids. A matrícula é feita na recepção." />
        </Cartao>
      ) : (
        <Cartao padding={0}>
          <Lista>
            {luta.dependentes.map((d) => {
              const presencas = luta.presencas.filter((p) => p.alunoId === d.id && p.estado !== 'retirada').length;
              return <Linha key={d.id} avatar={d.nome} titulo={d.nome} apoio={`${d.dataNascimento && luta.hoje ? `${idadeEmAnos(d.dataNascimento, luta.hoje)} anos · ` : ''}${plural(presencas, 'aula', 'aulas')}`} aoTocar={() => router.push({ pathname: '/perfil/dependente/[id]', params: { id: d.id } })} />;
            })}
          </Lista>
        </Cartao>
      )}
      <Botao variante="secundario" icone="mais" rotulo="Cadastrar uma criança" aoTocar={() => router.push({ pathname: '/perfil/dependente/[id]', params: { id: 'novo' } })} />
    </TelaComRolagem>
  );
}

export function TelaDependente() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { usuario, vinculoAtivo } = useSessao();
  const luta = useLutaDoAluno();
  const gravar = useGravar();
  const aviso = useAvisoRapido();
  const { gravar: salvar, ocupado } = useGravarComAviso(gravar.salvarDependente);
  const atual = luta.dependentes.find((d) => d.id === id) ?? null;
  const [nome, setNome] = useState(atual?.nome ?? '');
  const [nascimento, setNascimento] = useState(dataBR(atual?.dataNascimento));
  const [saude, setSaude] = useState(atual?.saude ?? '');
  const [erro, setErro] = useState<string | undefined>();
  const fuso = luta.luta?.fuso ?? 'America/Sao_Paulo';
  const em = () => instanteComFusoDaAcademia(Date.now(), fuso);

  const montar = (): Dependente | null => {
    if (!usuario || !vinculoAtivo || !luta.hoje) return null;
    let data: string | undefined;
    if (nascimento.trim()) {
      try {
        data = lerDataBrasileira(nascimento.trim());
      } catch {
        setErro('Escreva a data como 09/04/2017.');
        return null;
      }
    }
    try {
      const novo = novoDependente({ id: atual?.id ?? gerarId(), responsavelId: usuario.id, academiaId: vinculoAtivo.academiaId, nome, dataNascimento: data, saude, hoje: luta.hoje, em: atual?.criadoEm ?? em() });
      setErro(undefined);
      return atual ? { ...novo, saudeVisivelParaEquipe: atual.saudeVisivelParaEquipe, autorizacaoDeImagem: atual.autorizacaoDeImagem } : novo;
    } catch (e) {
      setErro(e instanceof ErroDoDependente ? e.message : 'Confira os dados.');
      return null;
    }
  };

  const ficha = luta.fichas.find((f) => f.alunoId === atual?.id);
  return (
    <TelaComRolagem titulo={atual ? atual.nome : 'Cadastrar uma criança'} subtitulo="Kids" aoVoltar={() => router.back()}>
      {atual ? (
        <Cartao>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco[3] }}>
            <Avatar nome={atual.nome} tamanho={64} />
            <View style={{ flex: 1, gap: espaco[1] }}>
              <Texto variante="titulo2">{atual.nome}</Texto>
              <Texto variante="corpoPequeno" cor="textoSecundario">
                {ficha?.turmaIds.length ? ficha.turmaIds.map((t) => luta.luta?.turmas.find((x) => x.id === t)?.nome).filter(Boolean).join(', ') : 'Turma: a recepção liga na matrícula'}
              </Texto>
            </View>
          </View>
          {ficha
            ? ficha.modalidadeIds.map((m) => {
                const f = textoDaFaixa(luta.luta, luta.graduacoes, ficha.alunoId, m, 'kids');
                return f ? (
                  <View key={m} style={{ flexDirection: 'row', alignItems: 'center', gap: espaco[3], marginTop: espaco[3] }}>
                    <FaixaDesenhada cores={f.cores} graus={f.graus} rotuloAcessivel={f.texto} />
                    <Texto variante="corpoPequeno">
                      {nomeDaModalidade(luta.luta, m)} · {f.texto}
                    </Texto>
                  </View>
                ) : null;
              })
            : null}
        </Cartao>
      ) : null}

      <Secao titulo="Dados da criança">
        <Campo rotulo="Nome" value={nome} onChangeText={setNome} autoCapitalize="words" />
        <Campo rotulo="Data de nascimento" value={nascimento} onChangeText={setNascimento} placeholder="09/04/2017" keyboardType="number-pad" erro={erro} />
        <Campo rotulo="Saúde (opcional)" apoio="Alergia, asma, restrição. É dado sensível: só você preenche." value={saude} onChangeText={setSaude} multilinha maxLength={280} />
      </Secao>

      {atual ? (
        <Secao titulo="Autorizações">
          <Cartao padding={0}>
            <LinhaComChave
              rotulo="Autorização de imagem"
              apoio={`Fotos de ${atual.nome.split(' ')[0]} podem aparecer no app (Atletas, eventos, técnicas). Você desliga quando quiser.`}
              ligado={atual.autorizacaoDeImagem.ligada}
              aoMudar={async (v) => {
                const r = await salvar(definirAutorizacaoDeImagem(atual, v, em()));
                if (r.ok) aviso.mostrar({ tipo: 'sucesso', texto: v ? 'Autorização ligada.' : 'Autorização desligada.' });
              }}
            />
            <LinhaComChave
              rotulo="A equipe vê a saúde"
              apoio="O professor da turma vê a restrição na chamada. Desligado no começo."
              ligado={atual.saudeVisivelParaEquipe}
              aoMudar={async (v) => {
                await salvar({ ...atual, saudeVisivelParaEquipe: v });
              }}
            />
          </Cartao>
          <Texto variante="corpoPequeno" cor="textoSecundario">
            A autorização do app não vale para as redes sociais da academia: isso é um termo à parte, com a recepção.
          </Texto>
        </Secao>
      ) : null}

      <Botao
        variante="primario"
        rotulo={atual ? 'Salvar' : 'Cadastrar'}
        carregando={ocupado}
        aoTocar={async () => {
          const d = montar();
          if (!d) return;
          const r = await salvar(d);
          if (r.ok) {
            aviso.mostrar({ tipo: 'sucesso', texto: atual ? 'Salvo.' : 'Criança cadastrada. A matrícula é com a recepção.' });
            router.back();
          }
        }}
      />
    </TelaComRolagem>
  );
}
