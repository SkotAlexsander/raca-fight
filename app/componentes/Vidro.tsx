/**
 * Componente 20 — Vidro (sistema.css `.vidro`; tokens.json › vidro).
 *
 * Painel translúcido sobre a FOTO (ou, na barra, sobre conteúdo que rola):
 * desfoque 24 e saturação 1,6 do que está atrás, fundo `vidro.fundo`, borda
 * clara de 1 px, fio de luz em cima e sombra curta. Dentro dele o texto vira
 * `vidro.texto` e a marca vira `vidro.destaque` — os componentes de sempre
 * acompanham sozinhos (`SobreposicaoDeCores`).
 *
 * Com "Reduzir transparência" (ou Android abaixo do 12), vira a cor sólida
 * `vidro.solido`, sem desfoque; o desenho não muda de lugar nem de tamanho.
 * Variante `escuroFixo`: o vidro escuro nos dois temas, para foto que é
 * escura em qualquer tema (modo treino, capa). Nunca vidro sobre vidro.
 *
 * Ordem de pintura no navegador (regra): as camadas do vidro (desfoque, fundo,
 * borda com o fio de luz) são `position: absolute`. No CSS, elemento
 * posicionado pinta POR CIMA do conteúdo em fluxo que não é posicionado. As
 * View do react-native-web são `position: relative` e escapavam, mas um
 * `<input>` (TextInput) ou um `<svg>` soltos dentro do Vidro não são: ficavam
 * ABAIXO do fundo do vidro e o texto digitado não aparecia (antes cada um
 * precisava de uma View por fora: `Icone`, `CampoDeVidro`).
 * Resolvido aqui, só na web: o Vidro abre o próprio contexto de empilhamento
 * (`zIndex: 0`) e as camadas vão para `zIndex: -1`, atrás de qualquer filho e
 * ainda dentro do vidro (sem descer para trás da foto). Os filhos continuam
 * filhos diretos do layout de quem usa (`estilo` com row/gap/padding vale como
 * antes); tamanho e desenho não mudam. No celular a ordem dos irmãos já põe o
 * conteúdo por cima, então nada muda lá.
 */
import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { borda, coresDentroDoVidro, espaco, raio as raios, SobreposicaoDeCores, useTema } from '@/tema';
import { FundoDesfocado, podeDesfocar } from './vidro/FundoDesfocado';

export interface PropsDoVidro {
  children?: ReactNode;
  variante?: 'tema' | 'escuroFixo' | 'barra';
  raio?: number;
  estilo?: StyleProp<ViewStyle>;
  /** Sem a sombra curta (pílulas e botões pequenos sobre a foto). */
  semSombra?: boolean;
}

/** `#RRGGBB` com opacidade (o sólido a 92 % do Android sem desfoque). */
function comOpacidade(hex: string, a: number): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

/** Só na web: o Vidro empilha sozinho e as camadas ficam atrás dos filhos (ver o topo). */
const NA_WEB = Platform.OS === 'web';
const EMPILHAR: ViewStyle | null = NA_WEB ? { zIndex: 0 } : null;
const ATRAS: ViewStyle | null = NA_WEB ? { zIndex: -1 } : null;

export function Vidro({ children, variante = 'tema', raio = raios.vidro, estilo, semSombra }: PropsDoVidro) {
  const { cores, sombras, esquema, reduzirTransparencia } = useTema();
  const escuroFixo = variante === 'escuroFixo';
  const solido = reduzirTransparencia || !podeDesfocar();

  const fundo = escuroFixo ? cores.vidroEscuroFixoFundo : variante === 'barra' ? cores.vidroBarra : cores.vidroFundo;
  const corSolida = escuroFixo ? cores.vidroEscuroFixoSolido : cores.vidroSolido;
  // "Reduzir transparência" → sólido; Android sem desfoque → sólido a 92 % (componente 20, "No Android")
  const fundoFinal = reduzirTransparencia ? corSolida : solido ? comOpacidade(corSolida, 0.92) : fundo;
  const contorno = escuroFixo ? cores.vidroEscuroFixoBorda : cores.vidroBorda;
  const brilho = escuroFixo ? sombras.vidroEscuroFixoBrilhoTopo : sombras.vidroBrilhoTopo;
  const sombra = escuroFixo ? sombras.vidroEscuroFixoSombra : sombras.vidroSombra;

  return (
    <View style={[{ borderRadius: raio, boxShadow: semSombra ? undefined : sombra }, EMPILHAR, estilo]}>
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: raio, overflow: 'hidden' }, ATRAS]}>
        {!solido ? <FundoDesfocado esquema={escuroFixo ? 'escuro' : esquema} raio={raio} /> : null}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: fundoFinal }]} />
      </View>
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { borderRadius: raio, borderWidth: borda.fina, borderColor: contorno, boxShadow: brilho }, ATRAS]}
      />
      <SobreposicaoDeCores cores={coresDentroDoVidro(cores, escuroFixo)}>{children}</SobreposicaoDeCores>
    </View>
  );
}

/** Pílula informativa de vidro (32 de altura): "Série 2 de 3", "22,5 kg", "Em uso". */
export function PilulaDeVidro({ children, variante = 'tema' }: { children: ReactNode; variante?: 'tema' | 'escuroFixo' }) {
  return (
    <Vidro variante={variante} raio={raios.pilula} semSombra estilo={{ minHeight: 32, paddingHorizontal: espaco[3], flexDirection: 'row', alignItems: 'center', gap: espaco[1], alignSelf: 'flex-start' }}>
      {children}
    </Vidro>
  );
}
