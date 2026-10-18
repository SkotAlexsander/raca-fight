/**
 * Dieta do dia (Plus) — mockup index.html, tela 4; F8; R3.6 e R3.7.
 * O resumo do dia na ilha escura com o anel (sem kcal), e cada refeição num
 * cartão com a borda `plus`: o horário, os itens, a troca permitida e a marca
 * da refeição (feita · não segui · desmarcar). A refeição opcional não conta.
 * A data volta para os dias anteriores.
 *
 * O registro é POR REFEIÇÃO (o modelo, R3.6), não por item: o mockup conta
 * itens ("4 de 11"); aqui conta refeições, como o Início ("3 de 5").
 */
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Anel, Botao, Campo, Cartao, Chip, EstadoVazio, FolhaInferior, FotoComTexto, Icone, SeloPlus, Texto } from '@/componentes';
import { useAssinaturaPlus, usePlanoDeDieta, useSessao } from '@/dados';
import type { Refeicao, RefeicaoRegistrada } from '@/dominio/tipos';
import { borda, espaco, estiloDeTexto, imagem, raio, useTema, useVibrar } from '@/tema';
import { dataCurta, dataLocal, plural, somarDias } from '@/componentes/formatos';
import { registrosDoDia, resumirDieta, textoDaRefeicao } from './comum/dieta';
import { useEquipeDoAluno } from './comum/equipe';
import { TelaComRolagem } from './comum/Tela';
import { useRefeicoesRegistradas } from '@/dados';
import { useDadosLocais } from './estado/ProvedorDoAluno';
import { ErroAoCarregar, EsqueletoDaTela } from '../compartilhado/estados';

/**
 * "no almoço", "na ceia": a folha do "Não segui" diz de qual refeição se trata,
 * porque cobre a lista (texto 14 do AC, revisão AE).
 */
export function emQualRefeicao(nome: string): string {
  const minusculo = nome.charAt(0).toLocaleLowerCase('pt-BR') + nome.slice(1);
  const feminino = /^(ceia|refeição|merenda|colação)/i.test(nome);
  return `${feminino ? 'na' : 'no'} ${minusculo}`;
}

export function TelaDieta() {
  const router = useRouter();
  const vibrar = useVibrar();
  const { usuario } = useSessao();
  const alunoId = usuario?.id;
  const hoje = dataLocal();
  const [data, setData] = useState(hoje);
  const plus = useAssinaturaPlus(alunoId).data;
  const consultaDoPlano = usePlanoDeDieta(alunoId, data);
  const plano = consultaDoPlano.data;
  const registrosRepo = useRefeicoesRegistradas(alunoId, data).data ?? [];
  const locais = useDadosLocais();
  const registros = registrosDoDia(registrosRepo, locais.refeicoes, data);
  const resumo = resumirDieta(plano, registros);
  const equipe = useEquipeDoAluno();
  const nomeDoPersonal = plus?.personalId ? equipe.nomeDe(plus.personalId) : undefined;
  const [naoSegui, setNaoSegui] = useState<Refeicao | null>(null);
  const [motivo, setMotivo] = useState('');
  const voltar = () => (router.canGoBack() ? router.back() : router.replace('/plus'));

  const marcar = (r: Refeicao, estado: 'feita' | 'nao_segui' | null, m?: string) => {
    if (!plano) return;
    locais.marcarRefeicao({ planoId: plano.id, refeicaoId: r.id, data, estado, motivo: m });
    vibrar(estado ? 'marcarSerie' : 'desfazerSerie');
  };

  return (
    <TelaComRolagem titulo={data === hoje ? 'Dieta de hoje' : 'Dieta do dia'} grande aoVoltar={voltar} acao={<SeloPlus />} vao={espaco[4]}>
      {/* a data navegável */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Botao variante="neutro" tamanho="icone" icone="voltar" rotuloAcessivel="Dia anterior" aoTocar={() => setData((d) => somarDias(d, -1))} />
        <Texto variante="corpoForte" accessibilityLiveRegion="polite" aria-live="polite">{data === hoje ? `Hoje, ${dataCurta(data)}` : data === somarDias(hoje, -1) ? `Ontem, ${dataCurta(data)}` : dataCurta(data)}</Texto>
        <Botao variante="neutro" tamanho="icone" icone="avancar" rotuloAcessivel="Dia seguinte" desabilitado={data >= hoje} aoTocar={() => setData((d) => (d < hoje ? somarDias(d, 1) : d))} />
      </View>

      {consultaDoPlano.isError ? (
        <ErroAoCarregar aoTentar={() => void consultaDoPlano.refetch()} />
      ) : consultaDoPlano.isLoading ? (
        // sem isto, "Sem plano neste dia" piscava antes do plano chegar (agente AH)
        <EsqueletoDaTela heroi={120} linhas={3} />
      ) : !plano || !resumo ? (
        <EstadoVazio ilustracao="sem-plano" titulo="Sem plano neste dia" texto={nomeDoPersonal ? `Quando a nutricionista parceira e ${nomeDoPersonal} montarem o plano, ele aparece aqui.` : 'Quando o plano chegar, ele aparece aqui.'} />
      ) : (
        <>
          <FotoComTexto variante="capa" altura={imagem.capaPequena} descricao="">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco[4] }} accessible accessibilityLabel={`${resumo.feitas} de ${resumo.total === 1 ? 'refeição' : 'refeições'} feitas`}>
              <Anel progresso={resumo.total ? resumo.feitas / resumo.total : 0} tamanho={56} traco={6}>
                <Texto variante="corpoForte">{resumo.feitas}</Texto>
              </Anel>
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: espaco[1] }}>
                  <Texto variante="numeroCarga">{resumo.feitas}</Texto>
                  <Texto variante="titulo3" cor="textoSecundario">
                    de {plural(resumo.total, 'refeição', 'refeições')}
                  </Texto>
                </View>
                <Texto variante="corpoPequeno" cor="textoSecundario">
                  {resumo.proxima ? `Próxima: ${textoDaRefeicao(resumo.proxima)} · ` : ''}plano da nutricionista parceira{nomeDoPersonal ? `, com ${nomeDoPersonal}` : ''}
                </Texto>
              </View>
            </View>
          </FotoComTexto>

          {[...plano.refeicoes].sort((a, b) => a.ordem - b.ordem).map((r) => (
            <CartaoDaRefeicao key={r.id} refeicao={r} registro={registros.get(r.id)} nomeDoPersonal={nomeDoPersonal} aoMarcar={(e) => marcar(r, e)} aoNaoSegui={() => { setMotivo(''); setNaoSegui(r); }} />
          ))}
        </>
      )}

      <FolhaInferior
        visivel={!!naoSegui}
        aoFechar={() => setNaoSegui(null)}
        titulo={naoSegui ? `O que aconteceu ${emQualRefeicao(naoSegui.nome)}?` : 'O que aconteceu?'}
        rodape={
          <>
            <Botao variante="texto" rotulo="Cancelar" aoTocar={() => setNaoSegui(null)} />
            <Botao
              variante="primario"
              rotulo="Salvar"
              aoTocar={() => {
                if (naoSegui) marcar(naoSegui, 'nao_segui', motivo.trim() || undefined);
                setNaoSegui(null);
              }}
            />
          </>
        }
      >
        <Campo rotulo="Motivo (opcional)" value={motivo} onChangeText={setMotivo} placeholder="Almocei fora" maxLength={140} apoio="Fica só entre você e quem acompanha você." />
      </FolhaInferior>
    </TelaComRolagem>
  );
}

function CartaoDaRefeicao({ refeicao: r, registro, nomeDoPersonal, aoMarcar, aoNaoSegui }: { refeicao: Refeicao; registro?: RefeicaoRegistrada; nomeDoPersonal?: string; aoMarcar: (e: 'feita' | null) => void; aoNaoSegui: () => void }) {
  const { cores } = useTema();
  const feita = registro?.estado === 'feita';
  const naoSeguiu = registro?.estado === 'nao_segui';
  return (
    <Cartao plus>
      <View style={{ gap: espaco[3] }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco[3] }}>
          {r.horarioSugerido ? (
            <Texto variante="corpoPequeno" cor="textoSecundario" style={{ minWidth: 40 }}>
              {r.horarioSugerido}
            </Texto>
          ) : null}
          <Texto variante="titulo3" style={{ flex: 1 }} numberOfLines={2}>
            {r.nome}
          </Texto>
          <Texto variante="corpoPequeno" cor="textoSecundario">
            {plural(r.itens.length, 'item', 'itens')}
          </Texto>
          <Pressable
            onPress={() => aoMarcar(feita ? null : 'feita')}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: feita }}
            aria-checked={feita}
            accessibilityLabel={feita ? `${r.nome} feita. Toque para desmarcar` : `Marcar ${r.nome} como feita`}
            hitSlop={4}
            style={{ width: 40, height: 40, borderRadius: raio.redondo, alignItems: 'center', justifyContent: 'center', backgroundColor: feita ? cores.sucesso : 'transparent', borderWidth: feita ? 0 : borda.media, borderColor: cores.textoSecundario }}
          >
            {feita ? <Icone nome="marcar" cor="sucessoTexto" /> : null}
          </Pressable>
        </View>

        {r.opcional ? <Chip variante="info" rotulo="Opcional · não conta no dia" /> : null}

        <View style={{ gap: espaco[2] }}>
          {r.itens.map((i) => (
            <View key={i.id} style={{ flexDirection: 'row', alignItems: 'center', gap: espaco[3], minHeight: 32 }}>
              <View style={{ width: 20, height: 20, borderRadius: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: feita ? cores.sucesso : 'transparent', borderWidth: feita ? 0 : borda.media, borderColor: cores.borda }}>
                {feita ? <Icone nome="marcar" tamanho="pequeno" cor="sucessoTexto" /> : null}
              </View>
              <Texto variante="corpo" cor={feita ? 'textoSecundario' : 'texto'} style={{ flex: 1 }}>
                {i.descricao}
              </Texto>
              {i.quantidadeGramas ? (
                <Texto variante="corpoPequeno" cor="textoSecundario">
                  {i.quantidadeGramas} g
                </Texto>
              ) : null}
            </View>
          ))}
        </View>

        {r.itens.filter((i) => i.trocaPermitida).map((i) => (
          <View key={`t${i.id}`} style={{ flexDirection: 'row', gap: espaco[2], padding: espaco[3], borderRadius: raio.medio, backgroundColor: cores.plusSuave }}>
            <Icone nome="conversa" tamanho="pequeno" cor="textoSecundario" />
            <Texto variante="corpoPequeno" style={{ flex: 1 }}>
              <Texto variante="corpoPequeno" style={{ fontFamily: estiloDeTexto('titulo1').estilo.fontFamily }}>
                {nomeDoPersonal ? `${nomeDoPersonal}: ` : 'Troca: '}
              </Texto>
              {i.trocaPermitida}
            </Texto>
          </View>
        ))}

        {naoSeguiu ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco[2] }}>
            <Chip variante="info" rotulo={registro?.motivo ? `Não segui · ${registro.motivo}` : 'Não segui'} />
            <Botao variante="texto" intrinseco rotulo="Desmarcar" aoTocar={() => aoMarcar(null)} />
          </View>
        ) : !feita ? (
          <View style={{ alignSelf: 'flex-start' }}>
            <Botao variante="texto" intrinseco rotulo="Não segui" aoTocar={aoNaoSegui} />
          </View>
        ) : null}
      </View>
    </Cartao>
  );
}
