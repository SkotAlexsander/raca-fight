/**
 * Componente 2 — Campo de texto (02-COMPONENTES.md; sistema.css `.campo`).
 *
 * Rótulo `legenda` sempre visível acima; caixa de 48 com fundo `superficie`,
 * raio 12 e contorno de 1 px `textoSecundario` (2 px `marca` em foco, 2 px
 * `erro` com erro). Fonte do campo nunca abaixo de 16 (evita o zoom do iOS).
 * Erro aparece ao sair do campo ou ao enviar, nunca a cada tecla: quem usa
 * decide quando passar `erro`.
 */
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { alvo, borda, espaco, estiloDeTexto, raio, useTema } from '@/tema';
import { Botao } from './Botao';
import { FolhaInferior } from './FolhaInferior';
import { Icone, type NomeDoIcone } from './Icone';
import { Texto } from './Texto';

export interface PropsDoCampo extends Omit<TextInputProps, 'style' | 'editable'> {
  rotulo: string;
  /** Texto de apoio abaixo (some quando há erro). */
  apoio?: string;
  /** Mensagem de erro: contorno `erro` + texto com ícone de alerta. */
  erro?: string;
  icone?: NomeDoIcone;
  /** Mostra o botão de limpar (48 × 48) quando há texto. */
  limpavel?: boolean;
  desabilitado?: boolean;
  /** Somente leitura: sem contorno, o rótulo continua. */
  somenteLeitura?: boolean;
  /** Força o desenho de foco (catálogo de componentes). */
  focoForcado?: boolean;
  multilinha?: boolean;
}

export function Campo({
  rotulo,
  apoio,
  erro,
  icone,
  limpavel,
  desabilitado,
  somenteLeitura,
  focoForcado,
  multilinha,
  value,
  onChangeText,
  onFocus,
  onBlur,
  ...resto
}: PropsDoCampo) {
  const { cores, celularPequeno } = useTema();
  const [emFoco, setEmFoco] = useState(false);
  const foco = focoForcado || emFoco;
  const corDoContorno = erro ? cores.erro : foco ? cores.marca : cores.textoSecundario;
  const larguraDoContorno = erro || foco ? borda.media : borda.fina;
  const { estilo: corpo, multiplicadorMaximo } = estiloDeTexto('corpo', celularPequeno);

  return (
    <View style={{ gap: espaco[1], opacity: desabilitado ? cores.desabilitadoOpacidade : 1 }} pointerEvents={desabilitado ? 'none' : 'auto'}>
      <Texto variante="legenda" cor="textoSecundario">
        {rotulo}
      </Texto>
      <View
        style={{
          flexDirection: 'row',
          alignItems: multilinha ? 'flex-start' : 'center',
          gap: espaco[3],
          minHeight: multilinha ? 96 : alvo.minimo,
          paddingHorizontal: somenteLeitura ? 0 : espaco[4],
          paddingVertical: multilinha ? espaco[3] : 0,
          backgroundColor: somenteLeitura ? 'transparent' : cores.superficie,
          borderRadius: raio.medio,
        }}
      >
        {icone ? <Icone nome={icone} cor="textoSecundario" /> : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          editable={!desabilitado && !somenteLeitura}
          multiline={multilinha}
          placeholderTextColor={cores.textoSecundario}
          accessibilityLabel={rotulo}
          accessibilityHint={erro}
          // o mesmo teto de ampliação do Texto deste estilo (agente AG)
          maxFontSizeMultiplier={multiplicadorMaximo}
          onFocus={(e) => {
            setEmFoco(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setEmFoco(false);
            onBlur?.(e);
          }}
          style={[
            corpo,
            {
              flex: 1,
              minWidth: 0,
              color: cores.texto,
              paddingVertical: 0,
              maxHeight: multilinha ? 5 * (corpo.lineHeight ?? 24) : undefined,
              // no navegador tira o contorno de foco do próprio <input>/<textarea>
              // (aparecia preto por dentro do nosso): o foco é o nosso contorno.
              // Vale também no multilinha (mesmo estilo). Igual a `CampoDeVidro`.
              outlineWidth: 0,
              outlineStyle: 'none',
            } as object,
          ]}
          {...resto}
        />
        {limpavel && value ? (
          <Botao variante="neutro" tamanho="icone" icone="fechar" rotuloAcessivel="Limpar" aoTocar={() => onChangeText?.('')} estilo={{ marginRight: -espaco[3] }} />
        ) : null}
        {!somenteLeitura ? (
          <View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, { borderRadius: raio.medio, borderWidth: larguraDoContorno, borderColor: corDoContorno }]}
          />
        ) : null}
      </View>
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

/**
 * Componente 4 — Campo de seleção: a caixa de 48 com o valor e a seta de 24;
 * o toque abre a FOLHA com as opções (linhas de 56, check na escolhida; fecha
 * ao escolher). Nunca o `select` do sistema para opções (data e hora são a
 * exceção: seletor nativo). Até 4 opções, prefira chips.
 */
export function CampoDeSelecao<T extends string>({
  rotulo,
  valor,
  opcoes,
  aoEscolher,
  desabilitado,
  erro,
}: {
  rotulo: string;
  valor: T | null;
  opcoes: { valor: T; rotulo: string }[];
  aoEscolher: (v: T) => void;
  desabilitado?: boolean;
  erro?: string;
}) {
  const { cores } = useTema();
  const [aberta, setAberta] = useState(false);
  const escolhida = opcoes.find((o) => o.valor === valor);
  const corDoContorno = erro ? cores.erro : aberta ? cores.marca : cores.textoSecundario;
  return (
    <View style={{ gap: espaco[1], opacity: desabilitado ? cores.desabilitadoOpacidade : 1 }}>
      <Texto variante="legenda" cor="textoSecundario">
        {rotulo}
      </Texto>
      <Pressable
        onPress={() => setAberta(true)}
        disabled={desabilitado}
        accessibilityRole="button"
        accessibilityLabel={`${rotulo}: ${escolhida?.rotulo ?? 'nada escolhido'}`}
        accessibilityHint="Abre a lista de opções"
        style={{ minHeight: alvo.minimo, flexDirection: 'row', alignItems: 'center', gap: espaco[3], paddingHorizontal: espaco[4], backgroundColor: cores.superficie, borderRadius: raio.medio }}
      >
        <Texto variante="corpo" cor={escolhida ? 'texto' : 'textoSecundario'} style={{ flex: 1 }} numberOfLines={1}>
          {escolhida?.rotulo ?? 'Escolher'}
        </Texto>
        <Icone nome={aberta ? 'subir' : 'baixo'} cor="textoSecundario" />
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: raio.medio, borderWidth: erro || aberta ? borda.media : borda.fina, borderColor: corDoContorno }]} />
      </Pressable>
      {erro ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco[1] }}>
          <Icone nome="alerta" tamanho="pequeno" cor="erro" />
          <Texto variante="corpoPequeno" cor="erro">
            {erro}
          </Texto>
        </View>
      ) : null}
      <FolhaInferior visivel={aberta} aoFechar={() => setAberta(false)} titulo={rotulo} tipo={opcoes.length > 6 ? 'lista' : 'curta'}>
        <View>
          {opcoes.map((o, i) => (
            <Pressable
              key={o.valor}
              onPress={() => {
                aoEscolher(o.valor);
                setAberta(false);
              }}
              accessibilityRole="radio"
              accessibilityState={{ checked: o.valor === valor }}
              aria-checked={o.valor === valor}
              style={{ minHeight: 56, flexDirection: 'row', alignItems: 'center', borderTopWidth: i === 0 ? 0 : borda.fina, borderTopColor: cores.borda }}
            >
              <Texto variante="corpo" style={{ flex: 1 }}>
                {o.rotulo}
              </Texto>
              {o.valor === valor ? <Icone nome="marcar" cor="marca" /> : null}
            </Pressable>
          ))}
        </View>
      </FolhaInferior>
    </View>
  );
}
