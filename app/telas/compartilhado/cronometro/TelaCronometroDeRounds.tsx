/**
 * Cronômetro de ROUNDS em tela cheia (mockup `luta.html`, tela 5; R17; F21).
 * No lugar do Modo treino: sempre escuro, a foto do saco desfocada atrás, um
 * traço por round, a fase escrita ("Luta" · "Intervalo" · "Prepare-se") e o
 * TEMPO como o único herói (49 → o número do cronômetro, a escala fechada).
 *
 * Parado: as predefinições de luta (R17.2) e as de preparo (Tabata, HIIT),
 * os quatro números editáveis e as chaves "Som" e "Aviso dos 10 s".
 * Rodando: Parar · Pausar/Retomar · Pular; "Depois: intervalo de 1:00".
 *
 * Som (R17.5): o gongo e a batida tocam com o app aberto e ESTA tela na
 * frente, mesmo no silencioso (`playsInSilentMode`); sem áudio em segundo
 * plano (decisão de 10/10). A tela não apaga enquanto roda (R9.13).
 */
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Anel, Botao, CampoNumerico, Chip, Chips, LinhaComChave, Texto, Vidro } from '@/componentes';
import { PREDEFINICOES, type TemposDoIntervalado } from '@/dominio/cronometro';
import { mmss, PREDEFINICOES_DE_ROUND, resumoDosTempos, totalDosTempos } from '@/dominio/rounds/rounds';
import { espaco, estiloDeTexto, layout, raio, SobreposicaoDeCores, tokens, useTema } from '@/tema';
import { AvisoAoLeitor } from '../estados';
import { FOTO_DO_CRONOMETRO } from '../../luta/imagens';
import { useCronometroDoApp } from './ProvedorDoCronometro';

const NUMERO = estiloDeTexto('numeroCronometro').estilo;

interface Opcao {
  chave: string;
  nome: string;
  curto: string;
  tempos: TemposDoIntervalado;
  luta: boolean;
}

const OPCOES: Opcao[] = [
  ...PREDEFINICOES_DE_ROUND.map((p) => ({ chave: p.chave, nome: p.nome, curto: p.curto, tempos: p.tempos, luta: true })),
  ...Object.entries(PREDEFINICOES).map(([chave, p]) => ({ chave, nome: p.nome, curto: p.nome, tempos: p.configuracao, luta: false })),
];

const lerInteiro = (t: string) => {
  const n = Number(t.replace(/\D+/g, ''));
  return Number.isFinite(n) && t.trim() !== '' ? n : null;
};
const lerMinSeg = (t: string) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(t.trim());
  if (m) return +m[1]! * 60 + +m[2]!;
  return lerInteiro(t);
};

export function TelaCronometroDeRounds() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { atual, leitura, ultimoSinal, comecar, agir, definirSom, limpar } = useCronometroDoApp();

  const [escolha, setEscolha] = useState<Opcao>(OPCOES[0]!);
  const [tempos, setTempos] = useState<TemposDoIntervalado>(OPCOES[0]!.tempos);
  const [som, setSom] = useState(true);
  const [aviso10s, setAviso10s] = useState(true);

  // o som: dois tocadores, com o app aberto e esta tela na frente
  const gongo = useAudioPlayer(require('../../../recursos/sons/gongo.wav'));
  const batida = useAudioPlayer(require('../../../recursos/sons/batida.wav'));
  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: false }).catch(() => {});
  }, []);
  useEffect(() => {
    if (!ultimoSinal || !atual?.som) return;
    const tocador = ultimoSinal.sinal === 'aviso_10s' ? batida : gongo;
    try {
      void tocador.seekTo(0);
      tocador.play();
    } catch {
      // o som é um extra: a vibração e a tela já mudaram
    }
    // só quando chega um sinal novo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ultimoSinal?.n]);

  const emUso = !!leitura && leitura.fase !== 'parado' && leitura.fase !== 'fim';
  const rodando = emUso && !leitura!.pausado;
  useEffect(() => {
    if (!rodando) return;
    void activateKeepAwakeAsync('cronometro-de-rounds').catch(() => {});
    return () => void deactivateKeepAwake('cronometro-de-rounds').catch(() => {});
  }, [rodando]);

  const voltar = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const escuro = useMemo(() => ({}), []);

  return (
    <SobreposicaoDeCores cores={escuro} esquema="escuro">
      <FundoEscuro>
        {emUso && leitura && atual ? (
          <View style={{ flex: 1, paddingTop: insets.top + espaco[2], paddingBottom: insets.bottom + espaco[4], paddingHorizontal: layout.margemLateral, gap: espaco[4], width: '100%', maxWidth: layout.larguraMaximaConteudo, alignSelf: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco[3] }}>
              <Botao variante="vidro" tamanho="icone" icone="baixo" rotuloAcessivel="Minimizar o cronômetro (ele continua)" aoTocar={voltar} />
              <View style={{ flex: 1, alignItems: 'center', gap: espaco[2] }}>
                <Texto variante="corpoForte" numberOfLines={1}>
                  {atual.titulo}
                </Texto>
                <Segmentos total={leitura.rounds} atual={leitura.round} fase={leitura.fase} />
              </View>
              <Botao variante="vidro" tamanho="icone" icone="gongo" rotuloAcessivel={atual.som ? 'Desligar o som' : 'Ligar o som'} aoTocar={() => definirSom(!atual.som)} />
            </View>

            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: espaco[4] }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco[2] }}>
                <PontoDaFase fase={leitura.fase} />
                <Texto variante="titulo3">{leitura.rotulo}</Texto>
              </View>
              <Anel
                progresso={leitura.progresso}
                modo="esvazia"
                tamanho={tokens.descanso.anel}
                traco={tokens.descanso.traco}
                cor={leitura.fase === 'round' ? 'viva' : leitura.fase === 'intervalo' ? 'sucesso' : 'textoSecundario'}
                rotuloAcessivel={`${leitura.titulo}, faltam ${leitura.segundos} segundos${leitura.pausado ? ', pausado' : ''}`}
              >
                <View style={{ alignItems: 'center' }}>
                  <Texto variante="corpoForte">{leitura.fase === 'round' ? `Round ${leitura.round}` : leitura.fase === 'intervalo' ? 'Intervalo' : 'Prepare-se'}</Texto>
                  <Texto
                    accessibilityRole="timer"
                    // a cor pelo papel (o Texto lê o tema escuro de dentro da SobreposicaoDeCores);
                    // `cores` deste componente é o tema de fora e no celular claro dava quase preto no preto (AP)
                    cor={leitura.ultimos10s ? 'atencao' : 'texto'}
                    style={{ fontFamily: NUMERO.fontFamily, fontSize: NUMERO.fontSize, lineHeight: NUMERO.lineHeight, letterSpacing: NUMERO.letterSpacing, fontVariant: ['tabular-nums'] }}
                  >
                    {mmss(leitura.segundos)}
                  </Texto>
                  <Texto variante="corpoPequeno" cor="textoSecundario">
                    de {leitura.rounds}
                  </Texto>
                </View>
              </Anel>
              <View style={{ flexDirection: 'row', gap: espaco[3], flexWrap: 'wrap', justifyContent: 'center' }}>
                <Botao variante="vidro" rotulo="Parar" intrinseco aoTocar={() => agir('parar')} />
                <Botao variante="primario" icone={leitura.pausado ? 'comecar' : 'pausar'} rotulo={leitura.pausado ? 'Retomar' : 'Pausar'} intrinseco aoTocar={() => agir('alternar')} testID="cronometro-pausar" />
                <Botao variante="vidro" icone="pular" rotulo="Pular" intrinseco aoTocar={() => agir('pular')} />
              </View>
            </View>

            <Vidro variante="escuroFixo" estilo={{ padding: espaco[4], gap: espaco[2] }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: espaco[3] }}>
                <Texto variante="corpoPequeno" cor="textoSecundario">
                  {leitura.depois ? `Depois: ${leitura.depois}` : 'Último round'}
                </Texto>
                <Texto variante="corpoPequeno" cor="textoSecundario">
                  Falta {mmss(leitura.restanteTotal)}
                </Texto>
              </View>
              <Texto variante="corpoPequeno" cor="textoSecundario">
                {atual.aviso10s ? 'Aviso aos 10 s e o gongo na troca, com o app aberto. ' : 'O gongo toca na troca, com o app aberto. '}A tela fica acesa enquanto roda.
              </Texto>
            </Vidro>
            <AvisoAoLeitor mensagem={leitura.titulo} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ paddingTop: insets.top + espaco[2], paddingBottom: insets.bottom + espaco[8], paddingHorizontal: layout.margemLateral, gap: espaco[6], width: '100%', maxWidth: layout.larguraMaximaConteudo + 2 * layout.margemLateral, alignSelf: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco[3] }}>
              <Botao variante="vidro" tamanho="icone" icone="voltar" rotuloAcessivel="Voltar" aoTocar={voltar} />
              <View style={{ flex: 1 }}>
                <Texto variante="corpoPequeno" cor="textoSecundario">
                  Cronômetro
                </Texto>
                <Texto variante="titulo1" accessibilityRole="header">
                  Rounds
                </Texto>
              </View>
            </View>

            {leitura?.fase === 'fim' && atual ? (
              <Vidro variante="escuroFixo" estilo={{ padding: espaco[4], gap: espaco[2] }}>
                <Texto variante="titulo3">Fim do treino</Texto>
                <Texto variante="corpoPequeno" cor="textoSecundario">
                  {atual.titulo}. O tempo do cronômetro não vira registro: o que conta é a presença na aula.
                </Texto>
                <Botao variante="texto" rotulo="Fechar" intrinseco aoTocar={limpar} />
              </Vidro>
            ) : null}

            <View style={{ gap: espaco[3] }}>
              <Texto variante="titulo3" accessibilityRole="header">
                Predefinições de luta
              </Texto>
              <Chips>
                {OPCOES.filter((o) => o.luta).map((o) => (
                  <Chip
                    key={o.chave}
                    rotulo={o.curto}
                    selecionado={escolha.chave === o.chave}
                    aoTocar={() => {
                      setEscolha(o);
                      setTempos(o.tempos);
                      setAviso10s(true);
                    }}
                  />
                ))}
              </Chips>
              <Texto variante="corpoPequeno" cor="textoSecundario">
                {PREDEFINICOES_DE_ROUND.find((p) => p.chave === escolha.chave)?.fonte ?? 'Preparo físico: ponto de partida editável.'}
              </Texto>
              <Texto variante="titulo3" accessibilityRole="header">
                Preparo físico
              </Texto>
              <Chips>
                {OPCOES.filter((o) => !o.luta).map((o) => (
                  <Chip
                    key={o.chave}
                    rotulo={o.curto}
                    selecionado={escolha.chave === o.chave}
                    aoTocar={() => {
                      setEscolha(o);
                      setTempos(o.tempos);
                      setAviso10s(false);
                    }}
                  />
                ))}
              </Chips>
            </View>

            <Vidro variante="escuroFixo" estilo={{ padding: espaco[4], gap: espaco[4] }}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: espaco[4] }}>
                <View style={{ flexGrow: 1, flexBasis: 140 }}>
                  <CampoNumerico rotulo="Round" valor={tempos.trabalhoSegundos} passo={30} minimo={10} maximo={3600} formatar={mmss} lerTexto={lerMinSeg} unidade="min" variante="edicao" aoMudar={(v) => setTempos((t) => ({ ...t, trabalhoSegundos: v }))} />
                </View>
                <View style={{ flexGrow: 1, flexBasis: 140 }}>
                  <CampoNumerico rotulo="Intervalo" valor={tempos.descansoSegundos} passo={15} minimo={0} maximo={3600} formatar={mmss} lerTexto={lerMinSeg} unidade="min" variante="edicao" aoMudar={(v) => setTempos((t) => ({ ...t, descansoSegundos: v }))} />
                </View>
                <View style={{ flexGrow: 1, flexBasis: 140 }}>
                  <CampoNumerico rotulo="Rounds" valor={tempos.rodadas} passo={1} minimo={1} maximo={99} lerTexto={lerInteiro} teclado="number-pad" variante="edicao" aoMudar={(v) => setTempos((t) => ({ ...t, rodadas: v }))} />
                </View>
                <View style={{ flexGrow: 1, flexBasis: 140 }}>
                  <CampoNumerico rotulo="Preparação" valor={tempos.preparacaoSegundos} passo={5} minimo={0} maximo={60} lerTexto={lerInteiro} unidade="s" teclado="number-pad" variante="edicao" aoMudar={(v) => setTempos((t) => ({ ...t, preparacaoSegundos: v }))} />
                </View>
              </View>
              <Texto variante="corpoPequeno" cor="textoSecundario">
                {resumoDosTempos(tempos)} · total {mmss(totalDosTempos(tempos))}
              </Texto>
              <View>
                <LinhaComChave rotulo="Som" apoio="O gongo e a batida com o app aberto, mesmo no silencioso" ligado={som} aoMudar={setSom} />
                <LinhaComChave rotulo="Aviso dos 10 s" apoio="Em todo round de 1 minuto ou mais" ligado={aviso10s} aoMudar={setAviso10s} />
              </View>
            </Vidro>

            <Botao
              variante="primario"
              tamanho="grande"
              icone="comecar"
              rotulo="Iniciar"
              testID="cronometro-iniciar"
              aoTocar={() => {
                comecar(tempos, escolha.luta ? `${escolha.curto.split(' · ')[0]} · ${resumoDosTempos(tempos).split(' · ')[0]}` : escolha.nome, { som, aviso10s });
              }}
            />
          </ScrollView>
        )}
      </FundoEscuro>
    </SobreposicaoDeCores>
  );
}

/** O preto da marca com a foto do saco desfocada atrás (sempre escuro, nos dois temas). */
function FundoEscuro({ children }: { children: ReactNode }) {
  const { cores } = useTema();
  return (
    <View style={{ flex: 1, backgroundColor: cores.fundo }}>
      {FOTO_DO_CRONOMETRO ? <Image source={FOTO_DO_CRONOMETRO} resizeMode="cover" accessible={false} style={[StyleSheet.absoluteFill, { width: '100%', height: '100%', opacity: 0.35 }]} /> : null}
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(10, 10, 10, 0.55)' }]} />
      {children}
    </View>
  );
}

/** O ponto ao lado do nome da fase; lê o tema de dentro da sobreposição escura. */
function PontoDaFase({ fase }: { fase: string }) {
  const { cores } = useTema();
  return <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: fase === 'round' ? cores.viva : fase === 'intervalo' ? cores.sucesso : cores.textoSecundario }} />;
}

/** Um traço por round: o feito cheio, o atual em vermelho, o que falta vazio. */
function Segmentos({ total, atual, fase }: { total: number; atual: number; fase: string }) {
  const { cores } = useTema();
  const n = Math.min(total, 12);
  return (
    <View style={{ flexDirection: 'row', gap: espaco[1], width: Math.min(96, n * 28), maxWidth: '100%' }} accessible={false}>
      {Array.from({ length: n }, (_, i) => {
        const r = i + 1;
        const feito = r < atual || (r === atual && fase === 'intervalo');
        const agoraRound = r === atual && fase === 'round';
        return <View key={i} style={{ flex: 1, height: 4, borderRadius: raio.pilula, backgroundColor: agoraRound ? cores.viva : feito ? cores.texto : cores.trilho }} />;
      })}
    </View>
  );
}

