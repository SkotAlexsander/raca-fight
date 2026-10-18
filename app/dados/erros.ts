/**
 * Os ERROS que a camada `dados/` devolve à tela (agente AG, P11). A tela
 * decide o texto pelo TIPO, nunca pela mensagem; a mensagem nunca leva o
 * conteúdo gravado (peso, recado, nome do treino — R6.2), só o motivo.
 *
 * - `ErroDeArmazenamento`: o aparelho não gravou (disco cheio, banco
 *   travado, navegador sem espaço ou bloqueado). Nada ficou pela metade e
 *   nada aparece como salvo; "Tentar de novo" com os mesmos dados grava.
 * - `ErroSemSinal` (em `repositorio.ts`): a ação precisa de rede (R12.2).
 * - qualquer outro: o repositório recusou pela regra (aviso com link…).
 */
import { ErroSemSinal } from './repositorio.ts';

export type MotivoDoArmazenamento = 'cheio' | 'travado' | 'bloqueado' | 'outro';

export class ErroDeArmazenamento extends Error {
  readonly codigo = 'armazenamento';
  readonly motivo: MotivoDoArmazenamento;
  constructor(motivo: MotivoDoArmazenamento) {
    super(`não deu para gravar no aparelho (${motivo})`);
    this.name = 'ErroDeArmazenamento';
    this.motivo = motivo;
  }
}

/** Lê só o nome e a mensagem do motor (SQLite, navegador); nunca guarda a mensagem. */
export function motivoDoErroDoMotor(e: unknown): MotivoDoArmazenamento {
  const x = (e && typeof e === 'object' ? e : {}) as { name?: unknown; message?: unknown; code?: unknown };
  const texto = `${String(x.name ?? '')} ${String(x.message ?? '')} ${String(x.code ?? '')}`;
  if (/quota|full|SQLITE_FULL|no space|ENOSPC/i.test(texto)) return 'cheio';
  if (/locked|busy|SQLITE_BUSY|SQLITE_LOCKED/i.test(texto)) return 'travado';
  if (/SecurityError|denied|readonly|SQLITE_READONLY|SQLITE_PERM/i.test(texto)) return 'bloqueado';
  return 'outro';
}

/** Embrulha o erro do motor; o que já é `ErroDeArmazenamento` passa igual. */
export function comoErroDeArmazenamento(e: unknown): ErroDeArmazenamento {
  return e instanceof ErroDeArmazenamento ? e : new ErroDeArmazenamento(motivoDoErroDoMotor(e));
}

export type TipoDoErroDeGravacao = 'armazenamento' | 'sem_sinal' | 'recusado';

export function tipoDoErroDeGravacao(e: unknown): TipoDoErroDeGravacao {
  if (e instanceof ErroDeArmazenamento) return 'armazenamento';
  if (e instanceof ErroSemSinal) return 'sem_sinal';
  return 'recusado';
}

/** O texto do aviso rápido de erro. "Tentar de novo" é a ação do aviso, não entra aqui. */
export function textoDoErroDeGravacao(e: unknown): string {
  if (e instanceof ErroSemSinal) return 'Sem sinal. Isso precisa de internet.';
  if (e instanceof ErroDeArmazenamento && e.motivo === 'cheio') return 'Não deu para salvar. O celular está sem espaço.';
  return 'Não deu para salvar.';
}
