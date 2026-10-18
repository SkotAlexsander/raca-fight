/**
 * Tela de passagem: o lugar de cada aba enquanto as telas de verdade não
 * chegam (onda 2 do P11: Y faz as do aluno, Z as da academia). Mostra a conta,
 * a visão, "Trocar de visão" (quando há mais de um vínculo), a fila e o
 * catálogo de componentes. Quem fizer a tela troca o arquivo da rota.
 */
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { Botao, Cabecalho, Cartao, EstadoVazio, Texto } from '@/componentes';
import { NOME_DO_PAPEL } from '@/componentes/formatos';
import { useFila, useSessao } from '@/dados';
import { espaco, layout, useTema } from '@/tema';

export function TelaProvisoria({ titulo, onda, mostrarConta = false }: { titulo: string; onda: string; mostrarConta?: boolean }) {
  const { cores } = useTema();
  const router = useRouter();
  const sessao = useSessao();
  const fila = useFila();
  const rolagem = useSharedValue(0);
  const aoRolar = useAnimatedScrollHandler((e) => {
    rolagem.value = e.contentOffset.y;
  });
  const ativos = sessao.vinculos.filter((v) => v.estado === 'ativo');
  const papel = sessao.vinculoAtivo ? NOME_DO_PAPEL[sessao.vinculoAtivo.papel] : 'aluno sem academia';

  return (
    <View style={{ flex: 1, backgroundColor: cores.fundo }}>
      <Cabecalho titulo={titulo} subtitulo={sessao.vinculoAtivo?.academia.nome} variante="grande" rolagem={rolagem} larguraMaxima={layout.larguraMaximaConteudo} />
      <Animated.ScrollView onScroll={aoRolar} scrollEventThrottle={16} contentContainerStyle={{ padding: layout.margemLateral, gap: espaco[4], paddingBottom: espaco[8] }}>
        <View style={{ maxWidth: layout.larguraMaximaConteudo, width: '100%', alignSelf: 'center', gap: espaco[4] }}>
          <Cartao>
            <EstadoVazio titulo={`${titulo} chega na ${onda}`} texto="A base do app já está pronta: tema, componentes, navegação e dados de exemplo." icone="lista">
              {__DEV__ ? <Botao rotulo="Ver os componentes" variante="secundario" intrinseco aoTocar={() => router.push('/componentes')} /> : null}
            </EstadoVazio>
          </Cartao>
          {mostrarConta ? (
            <Cartao>
              <View style={{ gap: espaco[3] }}>
                <Texto variante="legenda" cor="textoSecundario">
                  Conta
                </Texto>
                <Texto variante="titulo3">{sessao.usuario?.nome ?? 'Sem conta'}</Texto>
                <Texto variante="corpoPequeno" cor="textoSecundario">
                  Entrou como {papel}
                  {sessao.vinculoAtivo ? ` na ${sessao.vinculoAtivo.academia.nome}` : ''}.
                </Texto>
                <Texto variante="corpoPequeno" cor="textoSecundario">
                  {fila.pendentes.length === 0 ? 'Nenhum treino esperando sinal.' : `${fila.pendentes.length} treino(s) aguardando sinal.`}
                </Texto>
                {ativos.length > 1 ? <Botao rotulo="Trocar de visão" variante="secundario" icone="trocar" aoTocar={() => router.push('/escolher-visao')} /> : null}
                <Botao rotulo="Sair" variante="perigoDiscreto" aoTocar={() => { sessao.sair(); router.replace('/'); }} />
              </View>
            </Cartao>
          ) : null}
        </View>
      </Animated.ScrollView>
    </View>
  );
}

