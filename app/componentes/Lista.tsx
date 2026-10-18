/**
 * Lista agrupada e linha de lista (`sistema.css › .lista` + `.linha`): fundo
 * `superficie`, raio 16, divisores recuados até o texto, e a linha de 56
 * (uma linha de texto) ou 72 (com apoio), com a camada de toque.
 *
 * Promovido pelo agente AA (P11) das duas cópias que existiam: a da academia
 * (`telas/academia/pecas.tsx`, agente Z: `Lista`, `Linha` com `corDoApoio` e
 * `desabilitada`) e a do aluno (`telas/aluno/comum/Tela.tsx`, agente Y:
 * `Linha` com `icone`, `avatar` e `perigo`, e o `GrupoDeLinhas` no cartão).
 * A altura segue a regra do sistema (56 sem apoio, 72 com apoio), que era a
 * da cópia do aluno; `compacta` força 56.
 */
import { Children, Fragment, isValidElement, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { borda, espaco, layout, raio, useTema } from '@/tema';
import { Avatar, Divisor } from './Auxiliares';
import { Cartao } from './Cartao';
import { Icone, type NomeDoIcone } from './Icone';
import { Texto, type PapelDeCor } from './Texto';
import { usePressionado } from './usePressionado';

/** A lista: superfície com raio 16 e o divisor entre as linhas, recuado até o texto. */
export function Lista({ children, recuo = espaco[4] + 32 + espaco[3] }: { children: ReactNode; recuo?: number }) {
  const { cores } = useTema();
  const itens = Children.toArray(children).filter(isValidElement);
  return (
    <View style={{ backgroundColor: cores.superficie, borderRadius: raio.grande, overflow: 'hidden' }}>
      {itens.map((filho, i) => (
        <Fragment key={(filho.key as string) ?? i}>
          {i > 0 ? <View style={{ height: borda.fina, backgroundColor: cores.borda, marginLeft: recuo }} /> : null}
          {filho}
        </Fragment>
      ))}
    </View>
  );
}

/** Linhas dentro de um cartão (com a sombra do cartão), com o divisor entre elas. */
export function GrupoDeLinhas({ children }: { children: ReactNode[] | ReactNode }) {
  const filhos = (Array.isArray(children) ? children : [children]).filter(Boolean);
  return (
    <Cartao padding={0}>
      {filhos.map((f, i) => (
        <View key={i}>
          {i > 0 ? <Divisor recuo={espaco[4]} /> : null}
          {f}
        </View>
      ))}
    </Cartao>
  );
}

export interface PropsDaLinha {
  titulo: string;
  apoio?: string;
  corDoApoio?: PapelDeCor;
  /** Ícone num quadrado de 40 em `marcaSuave` (ou vermelho, com `perigo`). */
  icone?: NomeDoIcone;
  /** Avatar de 40 com as iniciais deste nome. */
  avatar?: string;
  inicio?: ReactNode;
  fim?: ReactNode;
  /** Sem a seta à direita (a linha tocável mostra a seta). */
  semSeta?: boolean;
  aoTocar?: () => void;
  /** Força 56 mesmo com apoio. */
  compacta?: boolean;
  perigo?: boolean;
  desabilitada?: boolean;
  rotuloAcessivel?: string;
  testID?: string;
}

export function Linha({ titulo, apoio, corDoApoio = 'textoSecundario', icone, avatar, inicio, fim, semSeta, aoTocar, compacta, perigo, desabilitada, rotuloAcessivel, testID }: PropsDaLinha) {
  const { cores } = useTema();
  const { aoPressionar, aoSoltar, estiloDaCamada } = usePressionado();
  const corpo = (
    <View
      style={{
        minHeight: compacta || !apoio ? layout.alturaLinhaCompacta : layout.alturaLinhaPadrao,
        flexDirection: 'row',
        alignItems: 'center',
        gap: espaco[3],
        paddingHorizontal: espaco[4],
        paddingVertical: espaco[2],
        opacity: desabilitada ? cores.desabilitadoOpacidade : 1,
      }}
    >
      {inicio ?? null}
      {icone ? (
        <View style={{ width: 40, height: 40, borderRadius: raio.medio, backgroundColor: perigo ? 'transparent' : cores.marcaSuave, alignItems: 'center', justifyContent: 'center' }}>
          <Icone nome={icone} cor={perigo ? 'erro' : 'marca'} />
        </View>
      ) : null}
      {avatar ? <Avatar nome={avatar} tamanho={40} /> : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Texto variante="corpo" cor={perigo ? 'erro' : 'texto'} numberOfLines={2}>
          {titulo}
        </Texto>
        {apoio ? (
          <Texto variante="corpoPequeno" cor={corDoApoio} numberOfLines={2}>
            {apoio}
          </Texto>
        ) : null}
      </View>
      {fim || (aoTocar && !semSeta) ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco[2] }}>
          {fim ?? null}
          {aoTocar && !semSeta ? <Icone nome="avancar" cor="textoSecundario" /> : null}
        </View>
      ) : null}
    </View>
  );
  if (!aoTocar) return corpo;
  return (
    <Pressable
      testID={testID}
      onPress={desabilitada ? undefined : aoTocar}
      onPressIn={aoPressionar}
      onPressOut={aoSoltar}
      accessibilityRole="button"
      accessibilityState={desabilitada ? { disabled: true } : undefined}
      aria-disabled={desabilitada ? true : undefined}
      accessibilityLabel={rotuloAcessivel ?? (apoio ? `${titulo}. ${apoio}` : titulo)}
    >
      {corpo}
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: cores.camadaToque }]}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: cores.texto }, estiloDaCamada]} />
      </View>
    </Pressable>
  );
}
