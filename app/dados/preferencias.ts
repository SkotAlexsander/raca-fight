/**
 * Preferência do APARELHO que não pode travar a tela (agente AG, P11): a
 * sessão lembrada, o último vínculo, a vibração. Com o disco cheio, "Sair"
 * lançava erro no toque (no celular, erro sem tratamento num toque fecha o
 * app). Agora a tela segue na memória e a falha vai para o registro (sem o
 * valor). O dado do aluno (treino, refeição, cadastro) NÃO passa por aqui:
 * esse avisa a pessoa (`useGravarComAviso`).
 */
import type { ArmazenamentoLocal } from './armazenamento/tipos.ts';
import { registro } from './redigir.ts';

/** Grava; devolve `false` se o aparelho não gravou. Nunca lança. */
export function gravarPreferenciaSemTravar(arm: ArmazenamentoLocal, chave: string, valor: string | null): boolean {
  try {
    arm.gravarPreferencia(chave, valor);
    return true;
  } catch (e) {
    registro.erro(`não deu para gravar a preferência "${chave}" no aparelho`, e);
    return false;
  }
}
