/**
 * Componente 12 — Barra de abas (sistema.css `.barra-abas`, `.aba`).
 *
 * ENCOSTADA na base (não flutuante; junção do P09): 56 de altura + a área
 * segura de baixo (no mínimo `layout.areaSegura.baseMinima`), fundo
 * `superficie` com fio de 1 px `borda` em cima no claro; no escuro,
 * `superficieElevada` sem fio. Cada aba: pílula de 56 × 32 atrás do ícone
 * (só na ativa, `marcaSuave`), ícone de 24 (cheio na ativa), rótulo
 * `rotuloAba` 13/16 600 que cresce até 1,3×. Ativa em `marca`, as outras em
 * `textoSecundario`. Ponto de aviso de 8 em `erro`. Pressionada: o ícone vai a 0,92.
 * Nunca esconde ao rolar; tocar a aba ativa volta ao topo (quem usa decide).
 */
import { Pressable, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { abas as tokensDasAbas, borda, espaco, layout, raio, useTema } from '@/tema';
import { Icone, type NomeDoIcone } from './Icone';
import { NOMES_DOS_ICONES } from './icones/gerado';
import { Texto } from './Texto';
import { usePressionado } from './usePressionado';

export interface AbaDaBarra {
  chave: string;
  rotulo: string;
  icone: NomeDoIcone;
  /** Ponto de 8 `erro` (mensagem nova do personal). Nunca número. */
  aviso?: boolean;
}

export interface PropsDaBarraDeAbas {
  abas: AbaDaBarra[];
  ativa: string;
  aoEscolher: (chave: string) => void;
  /** No catálogo de componentes a barra não está na base da tela: sem área segura. */
  semAreaSegura?: boolean;
}

function Aba({ aba, ativa, aoTocar }: { aba: AbaDaBarra; ativa: boolean; aoTocar: () => void }) {
  const { cores } = useTema();
  const { aoPressionar, aoSoltar, estiloDoCorpo } = usePressionado({ escala: 0.92 });
  const cor = ativa ? cores.marca : cores.textoSecundario;
  // nem todo ícone tem a versão cheia (tatame, convite): sem ela, a ativa usa o contorno
  const cheio = `${aba.icone}-cheio`;
  const iconeCheio = ((NOMES_DOS_ICONES as readonly string[]).includes(cheio) ? cheio : aba.icone) as NomeDoIcone;
  return (
    <Pressable
      onPress={aoTocar}
      onPressIn={aoPressionar}
      onPressOut={aoSoltar}
      accessibilityRole="tab"
      accessibilityState={{ selected: ativa }}
      aria-selected={ativa}
      accessibilityLabel={aba.aviso ? `${aba.rotulo}, com novidade` : aba.rotulo}
      style={{ flex: 1, minWidth: 64, alignItems: 'center', justifyContent: 'center', gap: espaco[1] }}
    >
      <Animated.View
        style={[
          {
            width: tokensDasAbas.pilulaAtiva.largura,
            height: tokensDasAbas.pilulaAtiva.altura,
            borderRadius: tokensDasAbas.pilulaAtiva.raio,
            backgroundColor: ativa ? cores.abaPilulaAtiva : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
          },
          estiloDoCorpo,
        ]}
      >
        <Icone nome={ativa ? iconeCheio : aba.icone} cor={cor} />
        {aba.aviso ? (
          <View style={{ position: 'absolute', top: espaco[1], right: espaco[3], width: 8, height: 8, borderRadius: raio.redondo, backgroundColor: cores.erro }} />
        ) : null}
      </Animated.View>
      <Texto variante="rotuloAba" style={{ color: cor }} numberOfLines={1}>
        {aba.rotulo}
      </Texto>
    </Pressable>
  );
}

export function BarraDeAbas({ abas, ativa, aoEscolher, semAreaSegura }: PropsDaBarraDeAbas) {
  const { cores, esquema } = useTema();
  const insets = useSafeAreaInsets();
  const base = semAreaSegura ? 0 : Math.max(insets.bottom, layout.areaSegura.baseMinima);
  return (
    <View
      accessibilityRole="tablist"
      style={{
        flexDirection: 'row',
        height: layout.alturaBarraAbas + base,
        paddingBottom: base,
        backgroundColor: esquema === 'escuro' ? cores.superficieElevada : cores.superficie,
        borderTopWidth: esquema === 'escuro' ? 0 : borda.fina,
        borderTopColor: cores.borda,
      }}
    >
      {/* em tela larga (navegador do PC) as abas ficam na coluna de conteúdo (600), não espalhadas */}
      <View style={{ flex: 1, flexDirection: 'row', maxWidth: layout.larguraMaximaConteudo, alignSelf: 'stretch', marginHorizontal: 'auto', width: '100%' }}>
        {abas.map((a) => (
          <Aba key={a.chave} aba={a} ativa={a.chave === ativa} aoTocar={() => aoEscolher(a.chave)} />
        ))}
      </View>
    </View>
  );
}
