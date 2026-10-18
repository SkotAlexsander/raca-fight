/**
 * "Entrar como…" (quem tem mais de um vínculo e ainda não escolheu) e
 * "Trocar de visão" (o menu da conta, em qualquer visão). A escolha fica
 * guardada no aparelho; trocar não sai da conta (CLAUDE.md: aluno que vira
 * funcionário troca de visão sem trocar de conta).
 */
import { useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { Cabecalho, Cartao, Icone, Texto } from '@/componentes';
import { NOME_DO_PAPEL } from '@/componentes/formatos';
import type { PapelNaAcademia } from '@/dominio/tipos';
import { useSessao, visaoDoPapel } from '@/dados';
import { espaco, layout, useTema } from '@/tema';
import { ROTA_INICIAL_DA_VISAO } from '../rotas';

/**
 * Texto 13 do AC (revisão AE): "Diego, você é personal e aluno na Academia do
 * Marcos. Por onde quer entrar? Dá para trocar no Perfil." "Vínculo" é palavra
 * do sistema; o primeiro nome basta.
 */
export function fraseDaEscolha(nome: string, ativos: readonly { papel: PapelNaAcademia; academia: { nome: string } }[]): string {
  const primeiro = nome.split(' ')[0] ?? '';
  const papeis = [...new Set(ativos.map((v) => NOME_DO_PAPEL[v.papel].toLocaleLowerCase('pt-BR')))];
  const academias = [...new Set(ativos.map((v) => v.academia.nome))];
  const lista = papeis.length > 1 ? `${papeis.slice(0, -1).join(', ')} e ${papeis.at(-1)}` : (papeis[0] ?? '');
  const onde = academias.length === 1 ? ` na ${academias[0]}` : '';
  return `${primeiro}, você é ${lista}${onde}. Por onde quer entrar? Dá para trocar no Perfil.`;
}

export function TelaEscolherVisao() {
  const { cores } = useTema();
  const router = useRouter();
  const { vinculos, vinculoAtivo, escolherVinculo, destino, usuario } = useSessao();
  const ativos = vinculos.filter((v) => v.estado === 'ativo');
  const trocando = destino.tipo === 'visao';

  return (
    <View style={{ flex: 1, backgroundColor: cores.fundo }}>
      <Cabecalho titulo={trocando ? 'Trocar de visão' : 'Entrar como'} aoVoltar={trocando ? () => (router.canGoBack() ? router.back() : router.replace('/')) : undefined} />
      <ScrollView contentContainerStyle={{ padding: layout.margemLateral, gap: espaco[3] }}>
        <View style={{ maxWidth: layout.larguraMaximaConteudo, width: '100%', alignSelf: 'center', gap: espaco[3] }}>
          <Texto variante="corpo" cor="textoSecundario">
            {fraseDaEscolha(usuario?.nome ?? '', ativos)}
          </Texto>
          {ativos.map((v) => {
            const atual = v.id === vinculoAtivo?.id;
            const nome = `Entrar como ${NOME_DO_PAPEL[v.papel]}`;
            return (
              <Cartao
                key={v.id}
                escolhido={atual}
                rotuloAcessivel={`${nome} na ${v.academia.nome}${atual ? ', atual' : ''}`}
                aoTocar={() => {
                  escolherVinculo(v.id);
                  // na academia, a porta decide a primeira aba pelo papel (R13.7, revisão AE)
                  router.replace(visaoDoPapel(v.papel) === 'academia' ? '/' : ROTA_INICIAL_DA_VISAO.aluno);
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco[3] }}>
                  <Icone nome={v.papel === 'aluno' ? 'inicio' : 'academia'} />
                  <View style={{ flex: 1 }}>
                    <Texto variante="corpoForte">{nome}</Texto>
                    <Texto variante="corpoPequeno" cor="textoSecundario">
                      {v.academia.nome}
                    </Texto>
                  </View>
                  {atual ? <Icone nome="marcar" cor="marca" /> : <Icone nome="avancar" cor="textoSecundario" />}
                </View>
              </Cartao>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
