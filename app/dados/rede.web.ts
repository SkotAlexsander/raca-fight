/**
 * No navegador: os eventos `online`/`offline` da janela (o "sem rede" do
 * Chrome e o `setOffline` do Playwright disparam os dois). Agente AA, P11.
 */
export function observarRede(aoMudar: (online: boolean) => void): () => void {
  const alvo = globalThis as unknown as { addEventListener?: Window['addEventListener']; removeEventListener?: Window['removeEventListener']; navigator?: Navigator };
  if (!alvo.addEventListener || !alvo.removeEventListener) return () => {};
  const online = () => aoMudar(true);
  const offline = () => aoMudar(false);
  alvo.addEventListener('online', online);
  alvo.addEventListener('offline', offline);
  if (alvo.navigator && alvo.navigator.onLine === false) aoMudar(false);
  return () => {
    alvo.removeEventListener!('online', online);
    alvo.removeEventListener!('offline', offline);
  };
}
