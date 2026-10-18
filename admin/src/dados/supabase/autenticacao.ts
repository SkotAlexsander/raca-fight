/**
 * Entrar no Admin pelo Supabase Auth: e-mail e senha, depois o SEGUNDO FATOR
 * (TOTP, o código do aplicativo autenticador). O dado é dinheiro de terceiros
 * (05-ADMIN.md, seção 3), por isso o Admin exige o nível aal2.
 *
 * Depois de entrar, quem decide se abre é o banco: `minha_academia_de_dono()`
 * só devolve a academia de quem tem vínculo ativo de dono (RA1.1).
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Sessao } from '../tipos.ts';

export type PassoDoLogin =
  | { passo: 'entrar' }
  | { passo: 'cadastrar_segundo_fator'; fatorId: string; qrSvg: string; segredo: string }
  | { passo: 'codigo'; fatorId: string }
  | { passo: 'sem_permissao' }
  | { passo: 'pronto'; sessao: Sessao };

const FRASES: Record<string, string> = {
  invalid_credentials: 'E-mail ou senha não conferem.',
  email_not_confirmed: 'Confirme o e-mail antes de entrar.',
  mfa_verification_failed: 'O código não confere. Confira o aplicativo e tente de novo.',
  over_request_rate_limit: 'Muitas tentativas. Espere um minuto.',
};

export function fraseDoErro(e: unknown): string {
  const codigo = (e as { code?: string })?.code;
  if (codigo && FRASES[codigo]) return FRASES[codigo]!;
  if (e instanceof TypeError) return 'Sem conexão. Confira a internet.';
  return 'Não deu para entrar. Tente de novo.';
}

/** Depois da senha (ou ao abrir com sessão guardada): falta o segundo fator? */
export async function proximoPasso(s: SupabaseClient): Promise<PassoDoLogin> {
  const { data: usuario } = await s.auth.getUser();
  if (!usuario.user) return { passo: 'entrar' };
  const { data: nivel, error } = await s.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error) throw error;
  if (nivel.currentLevel !== 'aal2') {
    const { data: fatores } = await s.auth.mfa.listFactors();
    const totp = fatores?.totp?.find((f) => f.status === 'verified');
    if (totp) return { passo: 'codigo', fatorId: totp.id };
    const { data: novo, error: e2 } = await s.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'Admin Raça Fight' });
    if (e2) throw e2;
    return { passo: 'cadastrar_segundo_fator', fatorId: novo.id, qrSvg: novo.totp.qr_code, segredo: novo.totp.secret };
  }
  const { data: academiaId, error: e3 } = await s.rpc('minha_academia_de_dono');
  if (e3) throw e3;
  if (!academiaId) return { passo: 'sem_permissao' };
  const nome = (usuario.user.user_metadata?.nome as string | undefined) ?? usuario.user.email?.split('@')[0] ?? 'Dono';
  return { passo: 'pronto', sessao: { usuarioId: usuario.user.id, nome, papel: 'dono', academiaId: academiaId as string } };
}

export async function entrarComSenha(s: SupabaseClient, email: string, senha: string): Promise<PassoDoLogin> {
  const { error } = await s.auth.signInWithPassword({ email: email.trim(), password: senha });
  if (error) throw error;
  return proximoPasso(s);
}

export async function confirmarCodigo(s: SupabaseClient, fatorId: string, codigo: string): Promise<PassoDoLogin> {
  const { error } = await s.auth.mfa.challengeAndVerify({ factorId: fatorId, code: codigo.replace(/\s/g, '') });
  if (error) throw error;
  return proximoPasso(s);
}

export async function sair(s: SupabaseClient): Promise<void> {
  await s.auth.signOut();
}
