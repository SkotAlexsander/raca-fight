/**
 * Componente 3 — Campo numérico com +/− (carga, repetições, descanso, séries).
 * É o componente mais tocado do app (02-COMPONENTES.md; sistema.css `.passo`).
 *
 * Botões − e + de 36 (contorno 2 `textoSecundario`) com área de toque de 48;
 * bloco do meio com rótulo `legenda`, número (`numeroCarga` 25 na execução,
 * `numeroMedio` 25 na edição) e unidade `legenda`. O bloco do meio é tocável e
 * abre o teclado numérico para digitar direto. Toque longo repete a cada 150 ms.
 *
 * O valor é sempre o de ARMAZENAMENTO (gramas, segundos, inteiros): quem usa
 * passa `formatar` (dominio/unidades.ts) e `lerTexto` para a digitação.
 *
 * `valor` indefinido = VAZIO (revisão AE; R1.14, R12.1): mostra "—", o "−"
 * desabilita, o "+" começa do mínimo mais um passo e confirmar o teclado sem
 * número continua vazio. O vazio nunca vira 0 sozinho (0 kg é "peso do corpo").
 *
 * No iPhone o teclado numérico não tem "Próximo" nem "OK": a barra de 48 fica
 * colada em cima dele (InputAccessoryView). No Android o teclado já tem a tecla.
 */
import { useEffect, useId, useRef, useState } from 'react';
import { InputAccessoryView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { alvo, borda, controle, espaco, estiloDeTexto, raio, useTema } from '@/tema';
import { Botao } from './Botao';
import { Icone } from './Icone';
import { Texto } from './Texto';
import { usePressionado } from './usePressionado';

export interface PropsDoCampoNumerico {
  rotulo: string;
  /** Indefinido = vazio ("—"), até a pessoa pôr um número. */
  valor: number | undefined;
  aoMudar: (novo: number) => void;
  passo: number;
  minimo: number;
  maximo: number;
  /** Do armazenamento para a tela: `formatarCarga`, `formatarTempo`… sem a unidade. */
  formatar?: (v: number) => string;
  unidade?: string;
  /** Da digitação para o armazenamento; null = não entendeu. Sem isto, o centro não abre teclado. */
  lerTexto?: (texto: string) => number | null;
  teclado?: 'decimal-pad' | 'number-pad';
  variante?: 'execucao' | 'edicao';
  /** Como o leitor de tela fala o valor ("22,5 quilos"). */
  falar?: (v: number) => string;
  erro?: string;
  desabilitado?: boolean;
  /** Esconde o rótulo de cima (linha de série). */
  semRotulo?: boolean;
  /** Ir para o próximo campo numérico (barra do iPhone). */
  aoProximo?: () => void;
  focoForcado?: boolean;
}

const REPETIR_A_CADA_MS = 150;

function BotaoDoPasso({ icone, rotulo, desabilitado, aoTocar }: { icone: 'mais' | 'menos'; rotulo: string; desabilitado: boolean; aoTocar: () => void }) {
  const { cores } = useTema();
  const { aoPressionar, aoSoltar, estiloDoCorpo } = usePressionado({ escala: 0.94 });
  const repetidor = useRef<ReturnType<typeof setInterval> | null>(null);
  // o toque longo repete SEMPRE o aoTocar mais recente: o de quando o dedo
  // desceu fecha sobre o valor antigo e repetiria o mesmo passo (achado pelo teste)
  const ultimoAoTocar = useRef(aoTocar);
  ultimoAoTocar.current = aoTocar;
  const parar = () => {
    if (repetidor.current) clearInterval(repetidor.current);
    repetidor.current = null;
  };
  useEffect(() => parar, []);
  // chegou no limite (o botão desabilita): a repetição para
  useEffect(() => {
    if (desabilitado) parar();
  }, [desabilitado]);
  const folga = (alvo.minimo - controle.passo) / 2;
  return (
    <Pressable
      onPress={aoTocar}
      onLongPress={() => {
        parar();
        repetidor.current = setInterval(() => ultimoAoTocar.current(), REPETIR_A_CADA_MS);
      }}
      onPressIn={aoPressionar}
      onPressOut={() => {
        parar();
        aoSoltar();
      }}
      disabled={desabilitado}
      hitSlop={folga}
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      accessibilityState={{ disabled: desabilitado }}
      aria-disabled={desabilitado}
      style={{ opacity: desabilitado ? cores.desabilitadoOpacidade : 1 }}
    >
      <Animated.View
        style={[
          {
            width: controle.passo,
            height: controle.passo,
            borderRadius: raio.redondo,
            backgroundColor: cores.superficie,
            borderWidth: borda.media,
            borderColor: cores.textoSecundario,
            alignItems: 'center',
            justifyContent: 'center',
          },
          estiloDoCorpo,
        ]}
      >
        <Icone nome={icone} />
      </Animated.View>
    </Pressable>
  );
}

export function CampoNumerico({
  rotulo,
  valor,
  aoMudar,
  passo,
  minimo,
  maximo,
  formatar = (v) => String(v),
  unidade,
  lerTexto,
  teclado = 'decimal-pad',
  variante = 'execucao',
  falar,
  erro: erroDeFora,
  desabilitado = false,
  semRotulo = false,
  aoProximo,
  focoForcado = false,
}: PropsDoCampoNumerico) {
  const { cores, celularPequeno } = useTema();
  const [digitando, setDigitando] = useState(false);
  const [texto, setTexto] = useState('');
  const [erroDeDigitacao, setErroDeDigitacao] = useState<string | undefined>();
  const idDaBarra = useId();
  const erro = erroDeFora ?? erroDeDigitacao;

  const nomeMinusculo = rotulo.toLocaleLowerCase('pt-BR');
  const vazio = valor === undefined;
  const mudar = (delta: number) => {
    // do vazio, o "+" começa do mínimo mais um passo; o "−" não faz nada
    if (vazio) {
      if (delta > 0) aoMudar(Math.min(maximo, minimo + delta));
      return;
    }
    const novo = Math.min(maximo, Math.max(minimo, valor + delta));
    if (novo !== valor) aoMudar(novo);
  };
  const confirmar = () => {
    if (!lerTexto) return setDigitando(false);
    if (vazio && !texto.trim()) {
      setErroDeDigitacao(undefined);
      return setDigitando(false);
    }
    const lido = lerTexto(texto);
    if (lido === null || lido < minimo || lido > maximo) {
      setErroDeDigitacao(`Entre ${formatar(minimo)} e ${formatar(maximo)}${unidade ? ` ${unidade}` : ''}`);
      return;
    }
    setErroDeDigitacao(undefined);
    setDigitando(false);
    if (lido !== valor) aoMudar(lido);
  };

  const falado = vazio ? 'vazio' : falar ? falar(valor) : `${formatar(valor)}${unidade ? ` ${unidade}` : ''}`;
  const estiloDoNumero = estiloDeTexto(variante === 'execucao' ? 'numeroCarga' : 'numeroMedio', celularPequeno);
  const contornoDoCentro = erro ? cores.erro : digitando || focoForcado ? cores.marca : undefined;

  return (
    <View style={{ gap: espaco[1], opacity: desabilitado ? cores.desabilitadoOpacidade : 1 }} pointerEvents={desabilitado ? 'none' : 'auto'}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco[3] }} accessibilityRole="none">
        <BotaoDoPasso icone="menos" rotulo={`Diminuir ${nomeMinusculo}`} desabilitado={desabilitado || vazio || valor <= minimo} aoTocar={() => mudar(-passo)} />
        <Pressable
          onPress={lerTexto ? () => {
            setTexto(vazio ? '' : formatar(valor));
            setDigitando(true);
          } : undefined}
          // sem `lerTexto` o centro só não abre o teclado; NÃO é "desabilitado":
          // o leitor de tela anunciaria o campo como esmaecido e o RN não entrega
          // o increment/decrement (achado pelo teste)
          disabled={desabilitado}
          accessibilityRole="adjustable"
          accessibilityLabel={rotulo}
          accessibilityValue={{ text: falado }}
          aria-valuetext={falado}
          aria-valuenow={valor}
          aria-valuemin={minimo}
          aria-valuemax={maximo}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={(e) => mudar(e.nativeEvent.actionName === 'increment' ? passo : -passo)}
          style={{ flex: 1, minWidth: 0, minHeight: alvo.minimo, alignItems: 'center', justifyContent: 'center', borderRadius: raio.pequeno, paddingHorizontal: espaco[1] }}
        >
          {!semRotulo ? (
            <Texto variante="legenda" cor="textoSecundario" numberOfLines={1}>
              {rotulo}
            </Texto>
          ) : null}
          {digitando ? (
            <TextInput
              autoFocus
              value={texto}
              onChangeText={setTexto}
              keyboardType={teclado}
              onSubmitEditing={confirmar}
              onBlur={confirmar}
              inputAccessoryViewID={Platform.OS === 'ios' ? idDaBarra : undefined}
              selectTextOnFocus
              accessibilityLabel={rotulo}
              // o número digitado tem o teto do número mostrado (numeroCarga 1,5): o campo não pula de tamanho (agente AG)
              maxFontSizeMultiplier={estiloDoNumero.multiplicadorMaximo}
              style={[estiloDoNumero.estilo, { color: cores.texto, textAlign: 'center', padding: 0, minWidth: 64, outlineWidth: 0 }]}
            />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: espaco[1] }}>
              <Texto variante={variante === 'execucao' ? 'numeroCarga' : 'numeroMedio'} cor={vazio ? 'textoSecundario' : 'texto'}>
                {vazio ? '—' : formatar(valor)}
              </Texto>
              {unidade ? (
                <Texto variante="legenda" cor="textoSecundario">
                  {unidade}
                </Texto>
              ) : null}
            </View>
          )}
          {contornoDoCentro ? (
            <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: raio.pequeno, borderWidth: borda.media, borderColor: contornoDoCentro }]} />
          ) : null}
        </Pressable>
        <BotaoDoPasso icone="mais" rotulo={`Aumentar ${nomeMinusculo}`} desabilitado={desabilitado || (!vazio && valor >= maximo)} aoTocar={() => mudar(passo)} />
      </View>
      {erro ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco[1] }}>
          <Icone nome="alerta" tamanho="pequeno" cor="erro" />
          <Texto variante="corpoPequeno" cor="erro">
            {erro}
          </Texto>
        </View>
      ) : null}
      {Platform.OS === 'ios' ? (
        <InputAccessoryView nativeID={idDaBarra}>
          <BarraDoTeclado aoProximo={aoProximo} aoOk={confirmar} />
        </InputAccessoryView>
      ) : null}
    </View>
  );
}

/** A barra de 48 acima do teclado numérico do iPhone: "Próximo" à esquerda, "OK" (700) à direita. */
export function BarraDoTeclado({ aoProximo, aoOk }: { aoProximo?: () => void; aoOk: () => void }) {
  const { cores } = useTema();
  return (
    <View
      accessibilityRole="toolbar"
      style={{
        height: alvo.minimo,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: espaco[2],
        backgroundColor: cores.superficieElevada,
        borderTopWidth: borda.fina,
        borderTopColor: cores.borda,
      }}
    >
      <Botao variante="texto" rotulo="Próximo" intrinseco desabilitado={!aoProximo} aoTocar={aoProximo} />
      <Botao variante="texto" rotulo="OK" intrinseco aoTocar={aoOk} />
    </View>
  );
}
