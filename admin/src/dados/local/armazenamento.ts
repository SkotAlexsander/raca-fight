/**
 * Onde o modo local guarda a academia de exemplo: IndexedDB (cabe muito mais
 * que o localStorage), com o localStorage de reserva e a memória quando o
 * navegador não deixa nenhum dos dois (aba anônima, teste).
 *
 * É DADO DE EXEMPLO. O dado real mora no Supabase, nunca aqui: o Admin não tem
 * fila offline (05-ADMIN.md, seção 5).
 */

import type { DadosDaAcademia } from '../tipos.ts';

export interface Armazenamento {
  ler(): Promise<DadosDaAcademia | null>;
  gravar(d: DadosDaAcademia): Promise<void>;
  apagar(): Promise<void>;
}

const BANCO = 'raca-fight-admin';
const LOJA = 'estado';
const CHAVE = 'academia-de-exemplo';
/** Sobe quando o formato muda: os dados antigos são trocados pelo exemplo novo. */
export const VERSAO_DO_EXEMPLO = 5;

type Guardado = { versao: number; dados: DadosDaAcademia };

export function armazenamentoNaMemoria(inicial: DadosDaAcademia | null = null): Armazenamento {
  let d = inicial ? structuredClone(inicial) : null;
  return {
    ler: async () => (d ? structuredClone(d) : null),
    gravar: async (x) => { d = structuredClone(x); },
    apagar: async () => { d = null; },
  };
}

function abrir(): Promise<IDBDatabase> {
  return new Promise((ok, falha) => {
    const pedido = indexedDB.open(BANCO, 1);
    pedido.onupgradeneeded = () => pedido.result.createObjectStore(LOJA);
    pedido.onsuccess = () => ok(pedido.result);
    pedido.onerror = () => falha(pedido.error);
  });
}

function noBanco<T>(modo: IDBTransactionMode, fazer: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return abrir().then((db) => new Promise<T>((ok, falha) => {
    const t = db.transaction(LOJA, modo);
    const r = fazer(t.objectStore(LOJA));
    t.oncomplete = () => { ok(r.result); db.close(); };
    t.onerror = () => { falha(t.error); db.close(); };
  }));
}

export function armazenamentoDoNavegador(): Armazenamento {
  const temIDB = typeof indexedDB !== 'undefined';
  const valido = (g: unknown): g is Guardado => !!g && typeof g === 'object' && (g as Guardado).versao === VERSAO_DO_EXEMPLO;
  return {
    async ler() {
      try {
        if (temIDB) {
          const g = await noBanco<unknown>('readonly', (s) => s.get(CHAVE));
          return valido(g) ? g.dados : null;
        }
      } catch { /* cai para o localStorage */ }
      try {
        const t = localStorage.getItem(CHAVE);
        const g = t ? JSON.parse(t) : null;
        return valido(g) ? g.dados : null;
      } catch {
        return null;
      }
    },
    async gravar(dados) {
      const g: Guardado = { versao: VERSAO_DO_EXEMPLO, dados };
      try {
        if (temIDB) { await noBanco('readwrite', (s) => s.put(g, CHAVE)); return; }
      } catch { /* cai para o localStorage */ }
      try { localStorage.setItem(CHAVE, JSON.stringify(g)); } catch { /* sem onde guardar: fica na memória desta aba */ }
    },
    async apagar() {
      try { if (temIDB) await noBanco('readwrite', (s) => s.delete(CHAVE)); } catch { /* nada */ }
      try { localStorage.removeItem(CHAVE); } catch { /* nada */ }
    },
  };
}
