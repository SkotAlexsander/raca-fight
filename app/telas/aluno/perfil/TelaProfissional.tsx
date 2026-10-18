/**
 * Perfil do profissional (NOVA; mapa, Parte 7.2; F14.2; R11.2, R11.6,
 * R11.9 a R11.12). Na linguagem do "Perfil do aluno" do mockup (index.html,
 * tela 3): a ilha escura com a luz lateral, o avatar de 64 e o nome; depois o
 * CREF inteiro (com "informado pelo profissional": "verificado" só com a
 * conferência, que é [decidir]), as especialidades, "Sobre mim" e a grade "Na
 * academia" (dias × manhã, tarde, noite). Nunca telefone, e-mail, preço ou
 * botão de contato. Sem nota nem estrela.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';
import { Avatar, Botao, Chip, Chips, EstadoVazio, FotoComTexto, Icone, Texto } from '@/componentes';
import { PERIODOS_DO_DIA } from '@/dominio/tipos';
import { borda, espaco, raio, useTema } from '@/tema';
import { useEquipeDoAluno } from '../comum/equipe';
import { ErroAoCarregar, EsqueletoDaTela } from '../../compartilhado/estados';
import { LETRA_DO_DIA, NOME_DA_ESPECIALIDADE, NOME_DO_DIA, NOME_DO_PERIODO, SEMANA_DE_SEGUNDA } from '@/componentes/formatos';
import { Secao, TelaComRolagem } from '../comum/Tela';

export function TelaProfissional() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { cores } = useTema();
  const { visiveis, carregando, erro, tentarDeNovo } = useEquipeDoAluno();
  const membro = visiveis.find((m) => m.perfil?.id === id);
  const p = membro?.perfil;
  const voltar = () => (router.canGoBack() ? router.back() : router.replace('/perfil/equipe'));

  if (!p) {
    return (
      <TelaComRolagem titulo="Perfil" aoVoltar={voltar}>
        {erro ? (
          <ErroAoCarregar aoTentar={tentarDeNovo} />
        ) : carregando ? (
          <EsqueletoDaTela heroi={200} linhas={2} />
        ) : (
          <EstadoVazio ilustracao="nenhum-aluno" titulo="Este perfil não está disponível" texto="A pessoa pode ter escondido o perfil ou saído da academia.">
            <Botao variante="secundario" rotulo="Ver a Equipe" aoTocar={() => router.replace('/perfil/equipe')} />
          </EstadoVazio>
        )}
      </TelaComRolagem>
    );
  }

  const especialidades = p.especialidades.map((e) => (e === 'outra' ? (p.especialidadeOutra ?? 'Outra') : NOME_DA_ESPECIALIDADE[e]));
  const marcado = (dia: string, periodo: string) => p.turnos.some((t) => t.dia === dia && t.periodo === periodo);

  return (
    <TelaComRolagem titulo={p.nomeExibicao} subtitulo="Equipe" aoVoltar={voltar} vao={espaco[5]}>
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

      {p.cref ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco[3] }}>
          <Icone nome="escudo" cor="textoSecundario" />
          <View style={{ flex: 1 }}>
            <Texto variante="corpoForte">CREF {p.cref}</Texto>
            <Texto variante="corpoPequeno" cor="textoSecundario">
              {p.crefConferido ? 'Verificado pela academia' : 'Informado pelo profissional'}
            </Texto>
          </View>
        </View>
      ) : null}

      {especialidades.length ? (
        <Secao titulo="Especialidades">
          <Chips>
            {especialidades.map((e) => (
              <Chip key={e} variante="info" rotulo={e} />
            ))}
          </Chips>
        </Secao>
      ) : null}

      {p.sobre ? (
        <Secao titulo="Sobre mim">
          <Texto variante="corpo">{p.sobre}</Texto>
        </Secao>
      ) : null}

      {p.turnos.length ? (
        <Secao titulo="Na academia">
          <View
            accessible
            accessibilityRole="image"
            accessibilityLabel={`Na academia: ${SEMANA_DE_SEGUNDA.flatMap((d) => PERIODOS_DO_DIA.filter((t) => marcado(d, t)).map((t) => `${NOME_DO_DIA[d]} de ${NOME_DO_PERIODO[t].toLocaleLowerCase('pt-BR')}`)).join(', ')}`}
            style={{ gap: espaco[1] }}
          >
            <View style={{ flexDirection: 'row', gap: espaco[1] }}>
              <View style={{ width: 56 }} />
              {SEMANA_DE_SEGUNDA.map((d) => (
                <View key={d} style={{ flex: 1, alignItems: 'center' }}>
                  <Texto variante="legenda" cor="textoSecundario">
                    {LETRA_DO_DIA[d]}
                  </Texto>
                </View>
              ))}
            </View>
            {PERIODOS_DO_DIA.map((t) => (
              <View key={t} style={{ flexDirection: 'row', gap: espaco[1], alignItems: 'center' }}>
                <View style={{ width: 56 }}>
                  <Texto variante="legenda" cor="textoSecundario">
                    {NOME_DO_PERIODO[t]}
                  </Texto>
                </View>
                {SEMANA_DE_SEGUNDA.map((d) => {
                  const sim = marcado(d, t);
                  return (
                    <View key={d} style={{ flex: 1, height: 32, borderRadius: raio.pequeno, alignItems: 'center', justifyContent: 'center', backgroundColor: sim ? cores.progresso : cores.mapaVazio, borderWidth: sim ? 0 : borda.fina, borderColor: cores.regua }}>
                      {sim ? <Icone nome="marcar" tamanho="pequeno" cor="marcaTexto" /> : null}
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        </Secao>
      ) : null}

      <Texto variante="corpoPequeno" cor="textoSecundario">
        O perfil não mostra telefone, e-mail nem preço. Para falar com {p.nomeExibicao}, procure na academia.
      </Texto>
    </TelaComRolagem>
  );
}
