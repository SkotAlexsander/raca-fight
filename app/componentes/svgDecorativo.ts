/**
 * O SVG que é só desenho (ícone ao lado de um texto, o símbolo da marca) fica
 * fora do leitor de tela. No celular, `accessible={false}`; na web, o
 * react-native-svg passa a prop direto ao <svg> e o React avisava
 * "Received `false` for a non-boolean attribute `accessible`" em TODAS as
 * telas (agente AB) — lá vale o `aria-hidden`.
 */
import { Platform } from 'react-native';

export const SVG_DECORATIVO = (Platform.OS === 'web' ? { 'aria-hidden': true } : { accessible: false }) as { accessible?: boolean };
