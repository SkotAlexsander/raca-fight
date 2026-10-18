/**
 * Histórico de graduação (mapa de luta, Parte B): a história do aluno na
 * modalidade. Cada graduação: faixa e grau, data, quem graduou e a origem.
 * A anulada não aparece para o aluno (R16.13). O tempo conta do registro no
 * app (R16.7).
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';
import { Cartao, EstadoVazio, Texto } from '@/componentes';
import { descreverGraduacao, historicoDeGraduacao, type OrigemDaGraduacao } from '@/dominio/graduacao/graduacao';
import { espaco } from '@/tema';
import { TelaComRolagem } from './comum/Tela';
import { FaixaDesenhada } from '../luta/pecas';
import { nomeDaModalidade, nomeDoProfessor, useLutaDoAluno } from '../luta/dados';

const ORIGEM: Record<OrigemDaGraduacao, string> = { promocao: 'Graduação', exame: 'Exame', inicial: 'Começo', anterior: 'Trazida de outra academia', correcao: 'Correção' };
const dataBR = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;

export function TelaHistoricoDeGraduacao() {
  const router = useRouter();
  const { aluno, modalidade } = useLocalSearchParams<{ aluno: string; modalidade: string }>();
  const luta = useLutaDoAluno();
  const lista = historicoDeGraduacao(luta.graduacoes, aluno ?? '', modalidade ?? '').reverse();
  return (
    <TelaComRolagem titulo="Histórico de graduação" subtitulo={nomeDaModalidade(luta.luta, modalidade ?? '')} aoVoltar={() => router.back()}>
      {lista.length === 0 ? (
        <Cartao>
          <EstadoVazio ilustracao="historico-vazio" titulo="Nenhuma graduação ainda" texto="O professor registra a faixa e os graus." />
        </Cartao>
      ) : (
        lista.map((g) => {
          const sistema = luta.luta?.sistemas.find((s) => s.id === g.sistemaId);
          const nivel = sistema?.niveis.find((n) => n.id === g.nivelId);
          const por = g.graduadoPorNome ?? nomeDoProfessor(luta.equipe, g.graduadoPorId);
          return (
            <Cartao key={g.id}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco[3] }}>
                <FaixaDesenhada cores={nivel?.cores ?? []} graus={g.grau} comPonteira={!!sistema?.palavraDoGrau} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Texto variante="corpoForte">{sistema ? descreverGraduacao(sistema, g.nivelId, g.grau) : g.nivelId}</Texto>
                  <Texto variante="corpoPequeno" cor="textoSecundario">
                    {dataBR(g.data)} · {ORIGEM[g.origem]}
                    {por ? ` · ${por}` : ''}
                  </Texto>
                </View>
              </View>
            </Cartao>
          );
        })
      )}
      <Texto variante="corpoPequeno" cor="textoSecundario">
        As datas são as do registro no app. A filiação e a prova perante a federação continuam com a federação.
      </Texto>
    </TelaComRolagem>
  );
}
