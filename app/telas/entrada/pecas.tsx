/**
 * As peças da entrada (mockups/entrada.html + entrada.css), montadas com os
 * componentes base: a tela de foto com o véu, a barra do passo, as pílulas de
 * ação, a porta, o campo e o código de vidro, a opção da lista fixa, os passos
 * e o interruptor.
 *
 * Tudo aqui usa só tokens (raio, espaço, controle, porta, codigo, cores do
 * tema) e a escala fechada do `Texto`. Peças que valem para o app inteiro
 * (Interruptor, LinhaComChave, Simbolo) estão listadas em
 * docs/revisao/Z-ACADEMIA.md para o agente AA promover a `componentes/`.
 */
import { useRef, useState, type ReactNode } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, TextInput, View, useWindowDimensions, type KeyboardTypeOptions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { DegradeLinearDoToken, Icone, Texto, Vidro, usePressionado, type NomeDoIcone } from '@/componentes';
import { IMAGENS } from '@/imagens/indice';
import Animated from 'react-native-reanimated';
import { alvo, borda, controle, espaco, estiloDeTexto, layout, raio, SobreposicaoDeCores, tokens, useTema } from '@/tema';

const codigo = tokens.codigo;

const SEMIBOLD = estiloDeTexto('titulo2').estilo.fontFamily;
const BOLD = estiloDeTexto('titulo1').estilo.fontFamily;

// ---------------------------------------------------------------------------
// A tela da entrada: foto (nítida nas boas-vindas, desfocada nos passos), o
// véu de contraste, a área segura e a coluna que rola. Em tela larga a foto
// cobre tudo e a coluna fica com 600 no meio.
// ---------------------------------------------------------------------------

export function TelaDaEntrada({
  foto = 'desfocada',
  barra,
  children,
  centralizar,
  rolagemRef,
}: {
  foto?: 'nitida' | 'desfocada';
  barra?: ReactNode;
  children: ReactNode;
  /** Empurra o conteúdo para o meio (telas de método, pedido enviado). */
  centralizar?: boolean;
  rolagemRef?: React.Ref<ScrollView>;
}) {
  const { cores, degrades, esquema } = useTema();
  const insets = useSafeAreaInsets();
  const nome = `raca-fight/entrada-fundo-tela-${esquema}${foto === 'desfocada' ? '-desfocado' : ''}` as const;
  const { width, height } = useWindowDimensions();
  const larga = width > height;
  // a faixa da foto: a coluna de 600 (mais as margens) ou a proporção da foto (440 × 956), o que for maior
  const larguraDaFaixa = Math.min(width, Math.max(layout.larguraMaximaConteudo + 2 * layout.margemLateral, (height * 440) / 956));
  return (
    <View style={{ flex: 1, backgroundColor: cores.fundo, overflow: 'hidden' }}>
      {larga && foto === 'nitida' ? (
        <>
          {/* tela larga (2040 × 790): a foto em retrato cortaria o rosto; o fundo vira a versão desfocada e a nítida fica numa faixa no meio, na altura da tela */}
          <Image source={IMAGENS[`raca-fight/entrada-fundo-tela-${esquema}-desfocado`]} resizeMode="cover" style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]} accessible={false} />
          <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: cores.fotoEntradaVeuDesfocada }]} />
          <View pointerEvents="none" style={{ position: 'absolute', top: 0, bottom: 0, width: larguraDaFaixa, left: (width - larguraDaFaixa) / 2, overflow: 'hidden' }}>
            <Image source={IMAGENS[nome]} resizeMode="cover" style={{ width: '100%', height: '100%' }} accessible={false} />
            <DegradeLinearDoToken degrade={degrades.fotoEntradaVeu} />
          </View>
        </>
      ) : (
        <Image source={IMAGENS[nome]} resizeMode="cover" style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]} accessible={false} />
      )}
      {foto === 'nitida' ? (
        larga ? null : <DegradeLinearDoToken degrade={degrades.fotoEntradaVeu} />
      ) : (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: cores.fotoEntradaVeuDesfocada }]} />
      )}
      <SobreposicaoDeCores cores={{ texto: cores.fotoEntradaTexto, textoSecundario: cores.fotoEntradaTextoSecundario }}>
        <ScrollView
          ref={rolagemRef}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, layout.areaSegura.baseMinima) + espaco[4], paddingHorizontal: layout.margemLateral }}
        >
          <View style={{ flex: 1, width: '100%', maxWidth: layout.larguraMaximaConteudo, alignSelf: 'center', gap: espaco[4] }}>
            {barra ?? <View style={{ minHeight: layout.alturaCabecalho }} />}
            {centralizar ? <Mola /> : null}
            {children}
          </View>
        </ScrollView>
      </SobreposicaoDeCores>
    </View>
  );
}

/** O espaço que empurra o botão principal para o pé da tela (`.o-mola`). */
export function Mola() {
  return <View style={{ flexGrow: 1, minHeight: espaco[4] }} />;
}

/** A barra de 56 do passo: voltar · meio (etiqueta ou passos) · Pular. */
export function BarraDoPasso({ aoVoltar, meio, aoPular }: { aoVoltar?: () => void; meio?: ReactNode; aoPular?: () => void }) {
  return (
    <View style={{ minHeight: layout.alturaCabecalho, flexDirection: 'row', alignItems: 'center', gap: espaco[2] }}>
      <View style={{ minWidth: controle.icone, alignItems: 'flex-start' }}>{aoVoltar ? <BotaoRedondo icone="voltar" rotulo="Voltar" aoTocar={aoVoltar} /> : null}</View>
      <View style={{ flex: 1, alignItems: 'center' }}>{meio}</View>
      <View style={{ minWidth: controle.icone, alignItems: 'flex-end' }}>
        {aoPular ? (
          <Pressable onPress={aoPular} hitSlop={(alvo.minimo - controle.secundario) / 2} accessibilityRole="button" accessibilityLabel="Pular esta pergunta">
            <Vidro raio={raio.redondo} semSombra estilo={{ minHeight: controle.secundario, paddingHorizontal: espaco[4], justifyContent: 'center' }}>
              <Texto variante="corpoForte">Pular</Texto>
            </Vidro>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

/** Botão redondo de vidro de 40 (toque 48): o voltar da entrada. */
export function BotaoRedondo({ icone, rotulo, aoTocar }: { icone: NomeDoIcone; rotulo: string; aoTocar: () => void }) {
  return (
    <Pressable onPress={aoTocar} hitSlop={(alvo.minimo - controle.icone) / 2} accessibilityRole="button" accessibilityLabel={rotulo}>
      <Vidro raio={raio.redondo} semSombra estilo={{ width: controle.icone, height: controle.icone, alignItems: 'center', justifyContent: 'center' }}>
        <Icone nome={icone} />
      </Vidro>
    </Pressable>
  );
}

/** Etiqueta pequena (`.o-etiqueta`): "Aluno", "Academia", "Esperando o dono". */
export function Etiqueta({ icone, texto }: { icone: NomeDoIcone; texto: string }) {
  const { cores } = useTema();
  return (
    <View style={{ minHeight: 28, paddingHorizontal: espaco[3], borderRadius: raio.redondo, backgroundColor: cores.marcaSuave, flexDirection: 'row', alignItems: 'center', gap: espaco[1], alignSelf: 'flex-start' }}>
      <Icone nome={icone} tamanho="pequeno" cor={cores.texto} />
      <Texto variante="corpoPequeno" style={{ fontFamily: SEMIBOLD, color: cores.texto }}>
        {texto}
      </Texto>
    </View>
  );
}

/** Título do passo (`titulo1`) e o apoio (`corpo`, secundário). */
export function TituloDoPasso({ titulo, apoio, centro }: { titulo: string; apoio?: string; centro?: boolean }) {
  return (
    <View style={{ gap: espaco[3] }}>
      <Texto variante="titulo1" accessibilityRole="header" alinhar={centro ? 'center' : undefined}>
        {titulo}
      </Texto>
      {apoio ? (
        <Texto variante="corpo" cor="textoSecundario" alinhar={centro ? 'center' : undefined}>
          {apoio}
        </Texto>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Pílulas de ação (48, raio cheio): marca (verde vivo), social (preto no
// claro, branco no escuro), vidro e texto.
// ---------------------------------------------------------------------------

function MarcaApple({ cor }: { cor: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path
        fill={cor}
        d="M16.37 1.43c0 1.14-.49 2.27-1.18 3.08-.74.9-1.99 1.57-2.99 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.57-2.27 1.21-2.98.8-.94 2.14-1.64 3.25-1.68.03.13.05.28.05.43zm4.56 15.71c-.03.07-.46 1.58-1.52 3.12-.94 1.34-1.94 2.71-3.43 2.71-1.52 0-1.9-.88-3.63-.88-1.7 0-2.3.91-3.67.91-1.38 0-2.33-1.26-3.43-2.8C3.96 18.38 2.93 15.57 2.93 12.92c0-4.28 2.8-6.55 5.55-6.55 1.45 0 2.68.95 3.6.95.87 0 2.22-1.01 3.9-1.01.61 0 2.89.06 4.37 2.19-.13.09-2.38 1.37-2.38 4.19 0 3.26 2.85 4.42 2.96 4.45z"
      />
    </Svg>
  );
}

function MarcaGoogle() {
  return (
    <Svg width={20} height={20} viewBox="0 0 48 48">
      <Path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <Path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <Path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <Path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </Svg>
  );
}

export function Pilula({
  rotulo,
  aoTocar,
  variante = 'marca',
  icone,
  marca,
  desabilitado,
  carregando,
  children,
}: {
  rotulo: string;
  aoTocar?: () => void;
  variante?: 'marca' | 'social' | 'vidro' | 'texto';
  icone?: NomeDoIcone;
  marca?: 'apple' | 'google';
  desabilitado?: boolean;
  carregando?: boolean;
  /** Texto com partes (o "Criar conta" sublinhado). */
  children?: ReactNode;
}) {
  const { cores } = useTema();
  const { aoPressionar, aoSoltar, estiloDoCorpo } = usePressionado();
  const altura = variante === 'texto' ? controle.secundario : controle.primario;
  const fundo = variante === 'marca' ? cores.viva : variante === 'social' ? cores.contaSocialFundo : 'transparent';
  const texto = variante === 'marca' ? cores.vivaTexto : variante === 'social' ? cores.contaSocialTexto : cores.texto;
  const conteudo = (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: espaco[3], opacity: carregando ? 0.5 : 1 }}>
      {marca === 'apple' ? <MarcaApple cor={texto} /> : marca === 'google' ? <MarcaGoogle /> : icone ? <Icone nome={icone} tamanho={20} cor={texto} /> : null}
      {children ?? (
        <Texto variante="corpoForte" style={{ color: texto }} numberOfLines={1}>
          {rotulo}
        </Texto>
      )}
    </View>
  );
  return (
    <Pressable
      onPress={desabilitado || carregando ? undefined : aoTocar}
      onPressIn={aoPressionar}
      onPressOut={aoSoltar}
      disabled={desabilitado}
      hitSlop={{ top: (alvo.minimo - altura) / 2, bottom: (alvo.minimo - altura) / 2 }}
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      accessibilityState={{ disabled: !!desabilitado, busy: !!carregando }}
      aria-disabled={!!desabilitado}
      aria-busy={!!carregando}
      style={{ alignSelf: 'stretch', opacity: desabilitado ? cores.desabilitadoOpacidade : 1 }}
    >
      <Animated.View style={estiloDoCorpo}>
        {variante === 'vidro' ? (
          <Vidro raio={raio.redondo} estilo={{ minHeight: altura, paddingHorizontal: espaco[5], justifyContent: 'center' }}>
            {conteudo}
          </Vidro>
        ) : (
          <View style={{ minHeight: altura, paddingHorizontal: espaco[5], borderRadius: raio.redondo, backgroundColor: fundo, justifyContent: 'center' }}>{conteudo}</View>
        )}
      </Animated.View>
    </Pressable>
  );
}

/** Divisor "ou" / "primeira vez?". */
export function Ou({ texto }: { texto: string }) {
  const { cores } = useTema();
  const linha = <View style={{ flex: 1, height: borda.fina, backgroundColor: cores.textoSecundario, opacity: 0.45 }} />;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco[3] }} accessibilityRole="text">
      {linha}
      <Texto variante="corpoPequeno" cor="textoSecundario">
        {texto}
      </Texto>
      {linha}
    </View>
  );
}

/** Rodapé com Termos e Política (sublinhados). */
export function Termos({ verbo = 'continuar' }: { verbo?: 'continuar' | 'criar' }) {
  return (
    <Texto variante="corpoPequeno" cor="textoSecundario" alinhar="center">
      Ao {verbo}, você aceita os <Texto variante="corpoPequeno" cor="textoSecundario" style={{ textDecorationLine: 'underline' }}>Termos de uso</Texto> e a{' '}
      <Texto variante="corpoPequeno" cor="textoSecundario" style={{ textDecorationLine: 'underline' }}>
        Política de privacidade
      </Texto>
      .
    </Texto>
  );
}

// ---------------------------------------------------------------------------
// A porta (cartão de vidro de 88 com o alvo do tamanho do cartão).
// ---------------------------------------------------------------------------

export function Porta({ titulo, apoio, icone, aoTocar }: { titulo: string; apoio: string; icone: NomeDoIcone; aoTocar: () => void }) {
  const { cores } = useTema();
  const { aoPressionar, aoSoltar, estiloDoCorpo } = usePressionado({ afundar: true });
  return (
    <Pressable onPress={aoTocar} onPressIn={aoPressionar} onPressOut={aoSoltar} accessibilityRole="button" accessibilityLabel={`${titulo}. ${apoio}`}>
      <Animated.View style={estiloDoCorpo}>
        <Vidro estilo={{ minHeight: tokens.porta.altura, paddingVertical: espaco[3], paddingHorizontal: espaco[4], flexDirection: 'row', alignItems: 'center', gap: espaco[4] }}>
          <View style={{ width: controle.primario, height: controle.primario, borderRadius: raio.redondo, backgroundColor: cores.viva, alignItems: 'center', justifyContent: 'center' }}>
            <Icone nome={icone} cor={cores.vivaTexto} />
          </View>
          <View style={{ flex: 1, minWidth: 0, gap: espaco[1] }}>
            <Texto variante="titulo2" style={{ fontFamily: BOLD }}>
              {titulo}
            </Texto>
            <Texto variante="corpoPequeno" cor="textoSecundario">
              {apoio}
            </Texto>
          </View>
          <Icone nome="avancar" cor="textoSecundario" />
        </Vidro>
      </Animated.View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Campo de vidro: rótulo sempre visível acima, caixa de 48 (`raio.campo`).
// ---------------------------------------------------------------------------

export function CampoDeVidro({
  rotulo,
  icone,
  valor,
  aoMudar,
  segredo,
  apoio,
  erro,
  teclado,
  placeholder,
  autoComplete,
  aoEnviar,
}: {
  rotulo: string;
  icone?: NomeDoIcone;
  valor: string;
  aoMudar: (v: string) => void;
  segredo?: boolean;
  apoio?: string;
  erro?: string;
  teclado?: KeyboardTypeOptions;
  placeholder?: string;
  autoComplete?: 'email' | 'current-password' | 'new-password' | 'name' | 'off';
  aoEnviar?: () => void;
}) {
  const { cores, celularPequeno } = useTema();
  const [foco, setFoco] = useState(false);
  const [mostrar, setMostrar] = useState(false);
  const { estilo: corpo, multiplicadorMaximo } = estiloDeTexto('corpo', celularPequeno);
  const contorno = erro ? cores.erro : foco ? cores.marca : undefined;
  return (
    <View style={{ gap: espaco[1] }}>
      <Texto variante="corpoPequeno" style={{ fontFamily: SEMIBOLD }}>
        {rotulo}
      </Texto>
      <Vidro raio={raio.campo} estilo={{ minHeight: controle.primario, flexDirection: 'row', alignItems: 'center', gap: espaco[3], paddingLeft: espaco[4], paddingRight: segredo ? espaco[1] : espaco[4] }}>
        {icone ? <Icone nome={icone} cor="textoSecundario" /> : null}
        {/* a View por fora: no navegador o <input> solto pinta abaixo das camadas absolutas do vidro */}
        <View style={{ flex: 1, minWidth: 0 }}>
          <TextInput
            value={valor}
            onChangeText={aoMudar}
            secureTextEntry={segredo && !mostrar}
            keyboardType={teclado}
            autoCapitalize={teclado === 'email-address' || segredo ? 'none' : 'words'}
            autoCorrect={false}
            autoComplete={autoComplete}
            placeholder={placeholder}
            placeholderTextColor={cores.vidroTextoSecundario}
            accessibilityLabel={rotulo}
            accessibilityHint={erro}
            onFocus={() => setFoco(true)}
            onBlur={() => setFoco(false)}
            onSubmitEditing={aoEnviar}
            // o rótulo já para no limite da escala; o texto digitado crescia sem limite com a fonte do sistema (agente AH)
            maxFontSizeMultiplier={multiplicadorMaximo}
            style={[corpo, { flex: 1, minWidth: 0, color: cores.vidroTexto, paddingVertical: espaco[3], outlineWidth: 0, outlineStyle: 'none' } as object]}
          />
        </View>
        {segredo ? (
          <Pressable onPress={() => setMostrar((m) => !m)} hitSlop={4} accessibilityRole="button" accessibilityLabel={mostrar ? 'Esconder a senha' : 'Mostrar a senha'} style={{ width: controle.icone, height: controle.icone, alignItems: 'center', justifyContent: 'center' }}>
            <Icone nome="olho" cor="textoSecundario" />
          </Pressable>
        ) : null}
        {contorno ? <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: raio.campo, borderWidth: borda.media, borderColor: contorno }]} /> : null}
      </Vidro>
      {erro ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco[1] }}>
          <Icone nome="alerta" tamanho="pequeno" cor="erro" />
          <Texto variante="corpoPequeno" cor="erro" style={{ flex: 1 }}>
            {erro}
          </Texto>
        </View>
      ) : apoio ? (
        <Texto variante="corpoPequeno" cor="textoSecundario">
          {apoio}
        </Texto>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Código de 6: seis caixas de vidro de 48 × 60, letras em Archivo (numeroMedio).
// Um campo de texto invisível por cima recebe o teclado.
// ---------------------------------------------------------------------------

export function CaixasDeCodigo({ valor, aoMudar, rotulo, soNumeros }: { valor: string; aoMudar: (v: string) => void; rotulo: string; soNumeros?: boolean }) {
  const { cores } = useTema();
  const entrada = useRef<TextInput>(null);
  const [foco, setFoco] = useState(false);
  const { width } = useWindowDimensions();
  // seis caixas cabem na coluna: 48 no celular médio, encolhe no pequeno (nunca abaixo de 40)
  const coluna = Math.min(width - 2 * layout.margemLateral, layout.larguraMaximaConteudo);
  const caixa = Math.max(40, Math.min(codigo.caixa, Math.floor((coluna - 5 * espaco[2]) / 6)));
  const caracteres = valor.split('');
  return (
    <Pressable onPress={() => entrada.current?.focus()} accessibilityLabel={`${rotulo}: ${valor.length} de 6 digitados`} style={{ alignItems: 'center' }}>
      <View style={{ flexDirection: 'row', gap: espaco[2] }}>
        {Array.from({ length: 6 }, (_, i) => {
          const atual = foco && valor.length < 6 && i === valor.length;
          return (
            <Vidro key={i} raio={raio.medio} estilo={{ width: caixa, height: codigo.altura, alignItems: 'center', justifyContent: 'center' }}>
              <Texto variante="numeroMedio">{caracteres[i] ?? ''}</Texto>
              {atual ? <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: raio.medio, borderWidth: borda.media, borderColor: cores.marca }]} /> : null}
            </Vidro>
          );
        })}
      </View>
      <TextInput
        ref={entrada}
        value={valor}
        onChangeText={(t) => aoMudar((soNumeros ? t.replace(/\D/g, '') : t.toUpperCase().replace(/[^A-Z0-9]/g, '')).slice(0, 6))}
        onFocus={() => setFoco(true)}
        onBlur={() => setFoco(false)}
        autoCapitalize="characters"
        autoCorrect={false}
        keyboardType={soNumeros ? 'number-pad' : 'default'}
        maxLength={6}
        accessibilityLabel={rotulo}
        caretHidden
        style={[StyleSheet.absoluteFill, { opacity: 0.011, color: 'transparent' }]}
      />
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Opção da lista fixa (objetivo, papel): pílula de vidro de 48; a escolhida
// ganha o contorno de marca, o vidro selecionado e o check no verde vivo.
// ---------------------------------------------------------------------------

export function Opcao({ rotulo, marcada, aoTocar, semVidro }: { rotulo: string; marcada: boolean; aoTocar: () => void; semVidro?: boolean }) {
  const { cores } = useTema();
  const miolo = (
    <>
      <Texto variante="corpoForte" style={{ flex: 1 }}>
        {rotulo}
      </Texto>
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: raio.redondo,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: marcada ? cores.viva : 'transparent',
          borderWidth: marcada ? 0 : borda.media,
          borderColor: cores.textoSecundario,
        }}
      >
        {marcada ? <Icone nome="marcar" tamanho={18} cor={cores.vivaTexto} /> : null}
      </View>
      {marcada ? <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: raio.redondo, borderWidth: borda.media, borderColor: cores.marca }]} /> : null}
    </>
  );
  const estilo = { minHeight: controle.primario, flexDirection: 'row' as const, alignItems: 'center' as const, gap: espaco[3], paddingLeft: espaco[5], paddingRight: espaco[4] };
  return (
    <Pressable onPress={aoTocar} accessibilityRole="radio" accessibilityState={{ checked: marcada }} aria-checked={marcada} accessibilityLabel={rotulo}>
      {semVidro ? (
        <View style={[estilo, { borderRadius: raio.redondo, backgroundColor: marcada ? cores.vidroSelecionado : cores.vidroFundo }]}>{miolo}</View>
      ) : (
        <Vidro raio={raio.redondo} semSombra={!marcada} estilo={[estilo, marcada ? { backgroundColor: cores.vidroSelecionado } : null]}>
          {miolo}
        </Vidro>
      )}
    </Pressable>
  );
}

/** "1 de 3" com três traços de 24 × 4. */
export function Passos({ atual, total = 3 }: { atual: number; total?: number }) {
  const { cores } = useTema();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco[3] }} accessibilityRole="text" accessibilityLabel={`Passo ${atual} de ${total}`}>
      <View style={{ flexDirection: 'row', gap: espaco[1] }}>
        {Array.from({ length: total }, (_, i) => (
          <View key={i} style={{ width: 24, height: 4, borderRadius: raio.redondo, backgroundColor: i < atual ? cores.viva : cores.textoSecundario, opacity: i < atual ? 1 : 0.35 }} />
        ))}
      </View>
      <Texto variante="corpoPequeno" style={{ fontFamily: SEMIBOLD }}>
        {atual} de {total}
      </Texto>
    </View>
  );
}

/** Cartão de resultado (academia encontrada, pedido pendente), com o avatar quadrado de 48 em verde vivo. */
export function CartaoDaAcademia({ nome, legenda, children }: { nome: string; legenda: string; children?: ReactNode }) {
  const { cores } = useTema();
  const iniciais = nome
    .replace(/^Academia\s+(d[aeo]s?\s+)?/i, 'Academia ')
    .split(/\s+/)
    .filter((p) => p.length > 2 || /^[A-Z]/.test(p))
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');
  return (
    <Vidro estilo={{ padding: espaco[4], gap: espaco[3] }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco[3] }}>
        <View style={{ width: 48, height: 48, borderRadius: raio.medio, backgroundColor: cores.viva, alignItems: 'center', justifyContent: 'center' }}>
          <Texto variante="corpoForte" style={{ color: cores.vivaTexto, fontFamily: BOLD }}>
            {iniciais}
          </Texto>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Texto variante="titulo3" style={{ fontFamily: BOLD }}>
            {nome}
          </Texto>
          <Texto variante="corpoPequeno" cor="textoSecundario">
            {legenda}
          </Texto>
        </View>
      </View>
      {children}
    </Vidro>
  );
}

