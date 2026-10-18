/**
 * No navegador do PC (só para ver o app): localStorage no lugar do SQLite.
 *
 * Por que não o expo-sqlite na web: no SDK 54 ele ainda pede o arquivo
 * `.wasm` no Metro e os cabeçalhos COOP/COEP (SharedArrayBuffer) no servidor,
 * que a pasta exportada servida como arquivo comum não tem. A interface é a
 * mesma (`ArmazenamentoLocal`); quem roda no celular usa `banco.ts`.
 * Registrado em docs/decisoes.md (11/10/2026) e em X-BASE.md.
 */
import { criarArmazenamentoEmMemoria, estadoVazio, type Estado } from './memoria.ts';
import type { ArmazenamentoLocal } from './tipos.ts';

const CHAVE = 'academia-plus:armazenamento-local';

const objeto = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/**
 * O que veio do localStorage é dado de fora (versão antiga, extensão, mão do
 * usuário): cada parte com o formato errado volta vazia, em vez de derrubar a
 * abertura do app (agente AB, P11). Os itens nulos dentro das tabelas a
 * memória já ignora.
 */
function sanear(v: unknown): Estado {
  const e = estadoVazio();
  if (!objeto(v)) return e;
  if (objeto(v.fila)) e.fila = v.fila as Estado['fila'];
  if (objeto(v.preferencias)) for (const [k, x] of Object.entries(v.preferencias)) if (typeof x === 'string') e.preferencias[k] = x;
  if (objeto(v.colecoes)) for (const [k, x] of Object.entries(v.colecoes)) if (objeto(x)) e.colecoes[k] = x;
  return e;
}

export function abrirArmazenamentoLocal(): ArmazenamentoLocal {
  let inicial: Estado = estadoVazio();
  try {
    const salvo = globalThis.localStorage?.getItem(CHAVE);
    if (salvo) {
      try {
        inicial = sanear(JSON.parse(salvo));
      } catch {
        // JSON quebrado: guarda o texto à parte ANTES de a próxima gravação escrever por cima (agente AG)
        globalThis.localStorage?.setItem(`${CHAVE}:estragado`, salvo);
      }
    }
  } catch {
    // navegador sem armazenamento (aba anônima, bloqueado): começa vazio; a gravação avisa se não der
  }
  // Sem espaço (QuotaExceeded) ou bloqueado: o erro SOBE (agente AG). A memória volta atrás e a tela
  // diz "Não deu para salvar"; antes, era engolido e o dado sumia ao recarregar sem ninguém saber.
  return criarArmazenamentoEmMemoria(inicial, (e) => globalThis.localStorage?.setItem(CHAVE, JSON.stringify(e)), 'navegador');
}
