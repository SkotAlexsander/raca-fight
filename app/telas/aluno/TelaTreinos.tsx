/**
 * Treinos (mockup `luta.html`, tela 3; mapa de luta, Parte B): no lugar do
 * treino de séries, a PRESENÇA e a GRADUAÇÃO por modalidade.
 *
 * - Minha graduação: a faixa desenhada com os graus, o tempo nela contado DO
 *   REGISTRO NO APP (R16.7, a tela diz isso) e as aulas desde a última; o
 *   histórico a um toque. Nada de "pronto para graduar" (L20).
 * - O mês em quadrados com as aulas feitas.
 * - Modalidade sem régua (Boxe, MMA): sem faixa em lugar nenhum (R16.1).
 */
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Cartao, Chip, Chips, EstadoVazio, Icone, Linha, Texto } from '@/componentes';
import { graduacaoAtual, mesesEntre } from '@/dominio/graduacao/graduacao';
import { presencasDesde, quePontuam } from '@/dominio/presenca/presenca';
import { espaco } from '@/tema';
import { nomeDoMes, plural } from '@/componentes/formatos';
import { TelaComRolagem } from './comum/Tela';
import { ErroAoCarregar, EsqueletoDaTela } from '../compartilhado/estados';
import { FaixaDesenhada, MesEmQuadrados, NumeroComRotulo, TopoDaTela } from '../luta/pecas';
import { nomeDaModalidade, primeiroNome, publicoDaFicha, textoDaFaixa, useLutaDoAluno } from '../luta/dados';

const dataBR = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;

export function TelaTreinos() {
  const router = useRouter();
  const luta = useLutaDoAluno();
  const opcoes = useMemo(() => luta.fichas.flatMap((f) => f.modalidadeIds.map((m) => ({ chave: `${f.alunoId}|${m}`, ficha: f, modalidadeId: m }))), [luta.fichas]);
  const [escolhida, setEscolhida] = useState<string | null>(null);
  const atual = opcoes.find((o) => o.chave === escolhida) ?? opcoes[0];
  const variasPessoas = new Set(opcoes.map((o) => o.ficha.alunoId)).size > 1;

  const conteudo = () => {
    if (luta.erro) return <Cartao><ErroAoCarregar aoTentar={luta.tentarDeNovo} /></Cartao>;
    if (luta.carregando || !luta.luta || !luta.hoje) return <EsqueletoDaTela heroi={200} linhas={2} />;
    if (!atual) {
      return (
        <Cartao>
          <EstadoVazio ilustracao="historico-vazio" titulo="Suas aulas aparecem aqui" texto="Quando você fizer o check-in na primeira aula, a presença e a faixa entram nesta tela." />
        </Cartao>
      );
    }
    const { ficha, modalidadeId } = atual;
    const minhas = luta.presencas.filter((p) => p.alunoId === ficha.alunoId);
    const faixa = textoDaFaixa(luta.luta, luta.graduacoes, ficha.alunoId, modalidadeId, publicoDaFicha(ficha));
    const g = graduacaoAtual(luta.graduacoes, ficha.alunoId, modalidadeId);
    const desde = presencasDesde(minhas, modalidadeId, g?.data ?? null);
    const meses = g ? mesesEntre(g.data, luta.hoje) : 0;
    const ano = +luta.hoje.slice(0, 4);
    const mes = +luta.hoje.slice(5, 7);
    const doMes = quePontuam(minhas).filter((p) => p.modalidadeId === modalidadeId && p.data.startsWith(luta.hoje!.slice(0, 7)));
    const dias = new Set(doMes.map((p) => +p.data.slice(8, 10)));
    const nomeMod = nomeDaModalidade(luta.luta, modalidadeId);
    return (
      <>
        {faixa ? (
          <Cartao>
            <View style={{ gap: espaco[4] }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Texto variante="titulo3" accessibilityRole="header">
                  {variasPessoas ? `Graduação de ${primeiroNome(ficha.nome)}` : 'Minha graduação'}
                </Texto>
                <Icone nome="faixa" cor="marca" />
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco[3] }}>
                <FaixaDesenhada cores={faixa.cores} graus={faixa.graus} rotuloAcessivel={faixa.texto} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Texto variante="corpoForte">{faixa.texto}</Texto>
                  <Texto variante="corpoPequeno" cor="textoSecundario">
                    {g ? `Desde ${dataBR(g.data)}, pelo registro no app` : 'O professor registra a primeira faixa'}
                    {faixa.aConfigurar ? ' · régua a confirmar com a academia' : ''}
                  </Texto>
                </View>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: espaco[3] }}>
                {/* revisão AN: sem graduação registrada não há "última graduação" nem tempo na faixa */}
                <NumeroComRotulo rotulo={!g ? 'Aulas desde o começo' : g.grau > 0 ? 'Aulas desde o último grau' : 'Aulas desde a última graduação'} numero={String(desde)} />
                {g ? <NumeroComRotulo rotulo="Tempo na faixa" numero={String(meses)} unidade={meses === 1 ? 'mês' : 'meses'} /> : null}
              </View>
              <Linha titulo="Ver o histórico de graduação" compacta aoTocar={() => router.push({ pathname: '/treinos/graduacao', params: { aluno: ficha.alunoId, modalidade: modalidadeId } })} />
            </View>
          </Cartao>
        ) : (
          <Cartao>
            <Texto variante="corpo">
              No {nomeMod} não há faixa: a sua evolução aparece na frequência e nas lutas.
            </Texto>
          </Cartao>
        )}
        <Cartao>
          <View style={{ gap: espaco[3] }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <Texto variante="titulo3" accessibilityRole="header">
                {nomeDoMes(luta.hoje)}
              </Texto>
              <Texto variante="corpoPequeno" cor="textoSecundario">
                {plural(doMes.length, 'aula', 'aulas')}
              </Texto>
            </View>
            <MesEmQuadrados ano={ano} mes={mes} comAula={dias} hoje={+luta.hoje.slice(8, 10)} rotulo={`${nomeDoMes(luta.hoje)}: ${plural(doMes.length, 'aula', 'aulas')} de ${nomeMod}${dias.size ? ` nos dias ${[...dias].sort((a, b) => a - b).join(', ')}` : ''}.`} />
          </View>
        </Cartao>
      </>
    );
  };

  return (
    <TelaComRolagem semCabecalho>
      <TopoDaTela sobretitulo="Presença e graduação" titulo="Treinos" />
      {opcoes.length > 1 ? (
        <Chips>
          {opcoes.map((o) => (
            <Chip key={o.chave} rotulo={variasPessoas ? `${primeiroNome(o.ficha.nome)} · ${nomeDaModalidade(luta.luta, o.modalidadeId)}` : nomeDaModalidade(luta.luta, o.modalidadeId)} selecionado={o.chave === atual?.chave} aoTocar={() => setEscolhida(o.chave)} />
          ))}
        </Chips>
      ) : null}
      {conteudo()}
      <Cartao padding={0}>
        <Linha icone="cronometro-round" titulo="Cronômetro de rounds" aoTocar={() => router.push('/cronometro')} />
      </Cartao>
    </TelaComRolagem>
  );
}
