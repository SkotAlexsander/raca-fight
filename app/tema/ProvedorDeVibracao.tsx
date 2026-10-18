/**
 * A chave "Vibração" do Perfil chega aos componentes por aqui, sem eles
 * importarem `dados/` (02-ESTRUTURA-DO-CODIGO.md: componentes só usam tema e
 * domínio). O `_layout.tsx` da raiz passa o valor guardado nas preferências.
 */
import { createContext, useCallback, useContext, type ReactNode } from 'react';
import { vibrar, type MomentoDeVibrar } from './vibracao';

const ContextoDeVibracao = createContext<boolean>(true);

export function ProvedorDeVibracao({ ligada, children }: { ligada: boolean; children: ReactNode }) {
  return <ContextoDeVibracao.Provider value={ligada}>{children}</ContextoDeVibracao.Provider>;
}

/** Devolve `vibrar(momento)` já com a chave do Perfil. Chame sem await, depois de gravar o dado. */
export function useVibrar(): (momento: MomentoDeVibrar) => void {
  const ligada = useContext(ContextoDeVibracao);
  return useCallback((momento: MomentoDeVibrar) => vibrar(momento, ligada), [ligada]);
}
