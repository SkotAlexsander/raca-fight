/**
 * O cliente Supabase do Admin. Só existe quando as duas variáveis estão no
 * `.env.local` (ver `.env.exemplo`); sem elas, o Admin abre no modo local.
 *
 * A sessão fica no armazenamento do navegador (padrão do supabase-js). Nunca
 * se imprime a URL, a chave ou o token.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { configuracaoDoSupabase } from './configuracao.ts';

export { configuracaoDoSupabase };

let cliente: SupabaseClient | null | undefined;

export function clienteSupabase(): SupabaseClient | null {
  if (cliente !== undefined) return cliente;
  const c = configuracaoDoSupabase();
  cliente = c ? createClient(c.url, c.chave, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } }) : null;
  return cliente;
}
