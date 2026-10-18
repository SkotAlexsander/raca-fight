/**
 * O tema do app: claro ou escuro (segue o sistema, `userInterfaceStyle:
 * automatic`), as cores, sombras e degradês GERADOS do tokens.json, e as duas
 * preferências de acessibilidade que mudam os efeitos (movimento e transparência).
 *
 * `useTema()` devolve tudo. `SobreposicaoDeCores` troca papéis só para um
 * pedaço da árvore — é o que o CSS do mockup faz dentro de `.foto-texto` e de
 * `.vidro` (o texto vira o branco da foto, a marca vira o verde vivo…).
 *
 * Escolha manual "claro / escuro / do sistema": não foi pedida no app
 * (04-IPHONE.md, seção 8); existe só para o catálogo de componentes e para a
 * verificação no navegador (`?tema=escuro`, `?movimento=reduzido`,
 * `?transparencia=reduzida`).
 */
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { Platform, useColorScheme, useWindowDimensions } from 'react-native';
import { useReduzirMovimentoDoSistema, useReduzirTransparenciaDoSistema } from './acessibilidade';
import {
  coresClaro,
  coresEscuro,
  degradesClaro,
  degradesEscuro,
  layout,
  sombrasClaro,
  sombrasEscuro,
  type CoresDoTema,
  type DegradesDoTema,
  type SombrasDoTema,
} from './gerado/tokens';

export type Esquema = 'claro' | 'escuro';
export type EscolhaDeTema = 'sistema' | Esquema;
export type EscolhaDePreferencia = 'sistema' | 'ligado' | 'desligado';

export interface ValorDoTema {
  esquema: Esquema;
  cores: CoresDoTema;
  sombras: SombrasDoTema;
  degrades: DegradesDoTema;
  /** "Reduzir movimento": todo efeito vira o esmaecer de 160 ms. */
  reduzirMovimento: boolean;
  /** "Reduzir transparência": o vidro vira a cor sólida. */
  reduzirTransparencia: boolean;
  /** Coluna de conteúdo abaixo de 358 (tela < 390): a escala desce um passo. */
  celularPequeno: boolean;
}

interface Controles {
  escolhaDeTema: EscolhaDeTema;
  definirTema: (e: EscolhaDeTema) => void;
  escolhaDeMovimento: EscolhaDePreferencia;
  definirMovimento: (e: EscolhaDePreferencia) => void;
  escolhaDeTransparencia: EscolhaDePreferencia;
  definirTransparencia: (e: EscolhaDePreferencia) => void;
}

const ContextoDoTema = createContext<ValorDoTema | null>(null);
const ContextoDosControles = createContext<Controles | null>(null);

/** No navegador, a verificação abre `?tema=escuro` etc. No celular, sempre "sistema". */
function lerDaUrl(chave: string): string | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  try {
    return new URLSearchParams(window.location.search).get(chave);
  } catch {
    return null;
  }
}

function escolhaInicialDeTema(): EscolhaDeTema {
  const v = lerDaUrl('tema');
  return v === 'claro' || v === 'escuro' ? v : 'sistema';
}

function escolhaInicial(chave: string, ligado: string): EscolhaDePreferencia {
  const v = lerDaUrl(chave);
  if (v === ligado) return 'ligado';
  if (v === 'normal') return 'desligado';
  return 'sistema';
}

export function ProvedorDeTema({ children }: { children: ReactNode }) {
  const doSistema = useColorScheme();
  const movimentoDoSistema = useReduzirMovimentoDoSistema();
  const transparenciaDoSistema = useReduzirTransparenciaDoSistema();
  const { width } = useWindowDimensions();

  const [escolhaDeTema, definirTema] = useState<EscolhaDeTema>(escolhaInicialDeTema);
  const [escolhaDeMovimento, definirMovimento] = useState<EscolhaDePreferencia>(() => escolhaInicial('movimento', 'reduzido'));
  const [escolhaDeTransparencia, definirTransparencia] = useState<EscolhaDePreferencia>(() => escolhaInicial('transparencia', 'reduzida'));

  const esquema: Esquema = escolhaDeTema === 'sistema' ? (doSistema === 'dark' ? 'escuro' : 'claro') : escolhaDeTema;
  const reduzirMovimento = escolhaDeMovimento === 'sistema' ? movimentoDoSistema : escolhaDeMovimento === 'ligado';
  const reduzirTransparencia = escolhaDeTransparencia === 'sistema' ? transparenciaDoSistema : escolhaDeTransparencia === 'ligado';
  const celularPequeno = width - 2 * layout.margemLateral < layout.colunaCelularMedio;

  const valor = useMemo<ValorDoTema>(
    () => ({
      esquema,
      cores: esquema === 'escuro' ? coresEscuro : coresClaro,
      sombras: esquema === 'escuro' ? sombrasEscuro : sombrasClaro,
      degrades: esquema === 'escuro' ? degradesEscuro : degradesClaro,
      reduzirMovimento,
      reduzirTransparencia,
      celularPequeno,
    }),
    [esquema, reduzirMovimento, reduzirTransparencia, celularPequeno],
  );
  const controles = useMemo<Controles>(
    () => ({ escolhaDeTema, definirTema, escolhaDeMovimento, definirMovimento, escolhaDeTransparencia, definirTransparencia }),
    [escolhaDeTema, escolhaDeMovimento, escolhaDeTransparencia],
  );

  return (
    <ContextoDosControles.Provider value={controles}>
      <ContextoDoTema.Provider value={valor}>{children}</ContextoDoTema.Provider>
    </ContextoDosControles.Provider>
  );
}

export function useTema(): ValorDoTema {
  const v = useContext(ContextoDoTema);
  if (!v) throw new Error('useTema() fora do <ProvedorDeTema>');
  return v;
}

/** Só o catálogo de componentes usa: troca tema, movimento e transparência na hora. */
export function useControlesDoTema(): Controles {
  const v = useContext(ContextoDosControles);
  if (!v) throw new Error('useControlesDoTema() fora do <ProvedorDeTema>');
  return v;
}

/**
 * Troca papéis de cor para um pedaço da árvore, como as variáveis CSS que o
 * mockup redefine dentro da foto e do vidro. Os componentes de sempre (chip,
 * botão, anel, texto) acompanham sem saber onde estão.
 */
export function SobreposicaoDeCores({ cores, esquema, children }: { cores: Partial<CoresDoTema>; esquema?: Esquema; children: ReactNode }) {
  const pai = useTema();
  const valor = useMemo<ValorDoTema>(() => {
    const base = esquema && esquema !== pai.esquema ? (esquema === 'escuro' ? coresEscuro : coresClaro) : pai.cores;
    return {
      ...pai,
      esquema: esquema ?? pai.esquema,
      cores: { ...base, ...cores },
      sombras: esquema === 'escuro' ? sombrasEscuro : esquema === 'claro' ? sombrasClaro : pai.sombras,
    };
  }, [pai, cores, esquema]);
  return <ContextoDoTema.Provider value={valor}>{children}</ContextoDoTema.Provider>;
}

/** As trocas de `.foto-texto` (sistema.css): texto branco, progresso e marca no verde vivo. */
export function coresSobreFoto(c: CoresDoTema): Partial<CoresDoTema> {
  return {
    texto: c.fotoTexto,
    textoSecundario: c.fotoTextoSecundario,
    progresso: c.viva,
    trilho: c.trilhoSobreFoto,
    marca: c.viva,
  };
}

/** As trocas de `.vidro` (sistema.css): texto do vidro e destaque do vidro. */
export function coresDentroDoVidro(c: CoresDoTema, escuroFixo = false): Partial<CoresDoTema> {
  return escuroFixo
    ? { texto: c.vidroEscuroFixoTexto, textoSecundario: c.vidroEscuroFixoTextoSecundario, marca: c.vidroEscuroFixoDestaque }
    : { texto: c.vidroTexto, textoSecundario: c.vidroTextoSecundario, marca: c.vidroDestaque };
}
