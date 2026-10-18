/**
 * Há Supabase configurado? Só lê as duas variáveis do `.env.local`, SEM
 * importar o supabase-js (AO, 16/10): assim o modo local decide o caminho sem
 * baixar o cliente, que vem num pedaço à parte só quando é preciso.
 */

export function configuracaoDoSupabase(): { url: string; chave: string } | null {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const chave = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  return url && chave ? { url, chave } : null;
}
