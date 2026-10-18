/**
 * Professores e o perfil do professor (mapa de luta, Parte B, aba Academia;
 * adapta a Equipe, R11 e R16.14). Chips por modalidade; cada professor com as
 * modalidades e a graduação dele ("Faixa preta, 2º grau"), INFORMADA pelo
 * próprio professor. Sem nota, sem contagem, sem preço e sem contato (R11.6,
 * R11.9). Também na vitrine, sem conta (R14.11): só os perfis visíveis.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Avatar, Botao, Cartao, Chip, Chips, EstadoVazio, FotoComTexto, Icone, Linha, Lista, Texto } from '@/componentes';
import { useEquipe, useSessao, type MembroDaEquipe } from '@/dados';
import { equipeParaMostrar, perfilVisivelAosAlunos, podeVerPerfil } from '@/dominio/perfil-profissional';
import { espaco, raio } from '@/tema';
import { NOME_DO_DIA } from '@/componentes/formatos';
import { Secao, TelaComRolagem } from '../comum/Tela';
import { ErroAoCarregar, EsqueletoDaTela } from '../../compartilhado/estados';
import { nomeDaModalidade, useAcademia } from '../../luta/dados';

/** Os professores que esta pessoa pode ver: com vínculo, a regra da RLS; sem conta, os perfis visíveis (vitrine). */
export function useProfessoresVisiveis() {
  const { usuario, vinculos, vinculoAtivo } = useSessao();
  const consulta = useEquipe();
  const membros = consulta.data ?? [];
  const visiveis = useMemo(() => {
    const quem = { usuarioId: usuario?.id ?? '', vinculos };
    const pode = (m: MembroDaEquipe) => !!m.perfil && (vinculoAtivo?.estado === 'ativo' ? podeVerPerfil(m.perfil, quem, m.vinculo) : perfilVisivelAosAlunos(m.perfil, m.vinculo));
    const perfis = equipeParaMostrar(membros.filter(pode).map((m) => m.perfil!));
    return perfis.map((p) => membros.find((m) => m.perfil?.id === p.id)!).filter(Boolean);
  }, [membros, usuario, vinculos, vinculoAtivo]);
  return { visiveis, carregando: consulta.isLoading, erro: consulta.isError, tentarDeNovo: () => void consulta.refetch() };
}

export function TelaProfessores({ base = '/academia' }: { base?: '/academia' | '/conheca' } = {}) {
  const router = useRouter();
  const { luta } = useAcademia();
  const { visiveis, carregando, erro, tentarDeNovo } = useProfessoresVisiveis();
  const [modalidade, setModalidade] = useState<string | null>(null);
  const daModalidade = visiveis.filter((m) => !modalidade || m.perfil?.modalidadeIds?.includes(modalidade));
  const modalidades = (luta?.modalidades ?? []).filter((m) => visiveis.some((v) => v.perfil?.modalidadeIds?.includes(m.id)));

  return (
    <TelaComRolagem titulo="Professores" aoVoltar={() => router.back()}>
      {modalidades.length > 1 ? (
        <Chips>
          <Chip rotulo="Todas" selecionado={!modalidade} aoTocar={() => setModalidade(null)} />
          {modalidades.map((m) => (
            <Chip key={m.id} rotulo={m.nome} selecionado={modalidade === m.id} aoTocar={() => setModalidade(m.id)} />
          ))}
        </Chips>
      ) : null}
      {erro ? (
        <ErroAoCarregar aoTentar={tentarDeNovo} />
      ) : carregando ? (
        <EsqueletoDaTela heroi={null} linhas={3} />
      ) : daModalidade.length === 0 ? (
        <Cartao>
          <EstadoVazio ilustracao="nenhum-aluno" titulo="Nenhum professor aqui ainda" texto="Os perfis aparecem quando cada professor liga o dele." />
        </Cartao>
      ) : (
        daModalidade.map((m) => {
          const p = m.perfil!;
          const mods = (p.modalidadeIds ?? []).map((id) => nomeDaModalidade(luta, id)).join(', ');
          const grad = p.graduacaoInformada?.map((g) => g.texto).join(' · ');
          return (
            <Cartao key={p.id} aoTocar={() => router.push({ pathname: `${base}/professor/[id]` as never, params: { id: p.id } })} raioDoCartao={raio.grande} rotuloAcessivel={`${p.nomeExibicao}. ${mods}${grad ? `. ${grad}` : ''}`}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco[3] }}>
                <Avatar nome={p.nomeExibicao} tamanho={40} />
                <View style={{ flex: 1, minWidth: 0, gap: espaco[1] }}>
                  <Texto variante="titulo3" numberOfLines={1}>
                    {p.nomeExibicao}
                  </Texto>
                  <Texto variante="corpoPequeno" cor="textoSecundario" numberOfLines={2}>
                    {[mods, grad].filter(Boolean).join(' · ')}
                  </Texto>
                </View>
                <Icone nome="avancar" cor="textoSecundario" />
              </View>
            </Cartao>
          );
        })
      )}
    </TelaComRolagem>
  );
}

export function TelaProfessor() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { luta } = useAcademia();
  const { visiveis, carregando, erro, tentarDeNovo } = useProfessoresVisiveis();
  const membro = visiveis.find((m) => m.perfil?.id === id);
  const p = membro?.perfil;
  const voltar = () => (router.canGoBack() ? router.back() : router.replace('/academia'));

  if (!p) {
    return (
      <TelaComRolagem titulo="Professor" aoVoltar={voltar}>
        {erro ? (
          <ErroAoCarregar aoTentar={tentarDeNovo} />
        ) : carregando ? (
          <EsqueletoDaTela heroi={200} linhas={2} />
        ) : (
          <EstadoVazio ilustracao="nenhum-aluno" titulo="Este perfil não está disponível" texto="O professor pode ter escondido o perfil ou saído da academia.">
            <Botao variante="secundario" rotulo="Voltar" aoTocar={voltar} />
          </EstadoVazio>
        )}
      </TelaComRolagem>
    );
  }
  const turmas = (luta?.turmas ?? []).filter((t) => t.ativa && (t.professorId === p.usuarioId || t.auxiliarIds.includes(p.usuarioId)));
  return (
    <TelaComRolagem titulo={p.nomeExibicao} subtitulo="Professores" aoVoltar={voltar} vao={espaco[5]}>
      <FotoComTexto variante="capa" altura={152} descricao="">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco[3] }}>
          <Avatar nome={p.nomeExibicao} tamanho={64} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Texto variante="titulo1" accessibilityRole="header" numberOfLines={2}>
              {p.nomeExibicao}
            </Texto>
            <Texto variante="corpoPequeno" cor="textoSecundario" numberOfLines={2}>
              {p.formacao}
            </Texto>
          </View>
        </View>
      </FotoComTexto>

      {(p.modalidadeIds ?? []).length ? (
        <Secao titulo="Modalidades">
          <Cartao padding={0}>
            <Lista>
              {(p.modalidadeIds ?? []).map((m) => {
                const g = p.graduacaoInformada?.find((x) => x.modalidadeId === m);
                return <Linha key={m} icone="modalidade" titulo={nomeDaModalidade(luta, m)} apoio={g ? `${g.texto} · informada pelo professor` : undefined} semSeta />;
              })}
            </Lista>
          </Cartao>
        </Secao>
      ) : null}

      {p.cref ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco[3] }}>
          <Icone nome="escudo" cor="textoSecundario" />
          <View style={{ flex: 1 }}>
            <Texto variante="corpoForte">CREF {p.cref}</Texto>
            <Texto variante="corpoPequeno" cor="textoSecundario">
              {p.crefConferido ? 'Verificado pela academia' : 'Informado pelo professor'}
            </Texto>
          </View>
        </View>
      ) : null}

      {p.sobre ? (
        <Secao titulo="Sobre mim">
          <Texto variante="corpo">{p.sobre}</Texto>
        </Secao>
      ) : null}

      {turmas.length ? (
        <Secao titulo="Turmas">
          <Cartao padding={0}>
            <Lista>
              {turmas.map((t) => (
                <Linha key={t.id} icone="tatame" titulo={t.nome} apoio={t.horarios.map((h) => `${NOME_DO_DIA[h.dia].slice(0, 3)} ${h.inicio}`).join(' · ')} aoTocar={() => router.push({ pathname: '/horarios/[id]', params: { id: t.id } })} />
              ))}
            </Lista>
          </Cartao>
        </Secao>
      ) : null}

      <Texto variante="corpoPequeno" cor="textoSecundario">
        O perfil não mostra telefone, e-mail nem preço. Para falar com {p.nomeExibicao}, procure na academia.
      </Texto>
    </TelaComRolagem>
  );
}
