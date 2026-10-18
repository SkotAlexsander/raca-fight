/**
 * A rede do aparelho, para a fila saber quando tentar (R1.24). No celular,
 * ainda não há observador (o `@react-native-community/netinfo` entra com o
 * Supabase): a fila tenta a cada 15 s e a falha de rede a mantém guardada.
 * No navegador, `rede.web.ts` usa os eventos `online`/`offline`.
 */
export function observarRede(_aoMudar: (online: boolean) => void): () => void {
  return () => {};
}
