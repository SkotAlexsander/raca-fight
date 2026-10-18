/** Armazenamento em memória: os testes no Node e a base do armazenamento do navegador. */
import type { Id } from '../../dominio/tipos.ts';
import type { ItemDaFila } from '../../dominio/sincronizacao.ts';
import type { ArmazenamentoLocal } from './tipos.ts';
import { comoErroDeArmazenamento } from '../erros.ts';

export interface Estado {
  fila: Record<Id, ItemDaFila>;
  preferencias: Record<string, string>;
  /** As coleções do repositório local (nome → id → valor). */
  colecoes: Record<string, Record<Id, unknown>>;
}

/** Registro guardado que ainda é um objeto (o navegador pode devolver qualquer coisa; agente AB). */
const valido = (v: unknown): boolean => typeof v === 'object' && v !== null;
const itemValido = (i: ItemDaFila): boolean => valido(i) && typeof i.criadoEm === 'string' && valido(i.carga);

export const estadoVazio = (): Estado => ({ fila: {}, preferencias: {}, colecoes: {} });

/**
 * `aoMudar` deixa o navegador persistir o estado a cada gravação (ou uma vez
 * no fim da transação). Se ele falhar (navegador sem espaço), a gravação
 * VOLTA ATRÁS na memória e lança `ErroDeArmazenamento`: o que não foi para o
 * disco não aparece como gravado (agente AG, P11). Antes, o erro era engolido
 * e a tela mostrava "salvo" um dado que sumia ao recarregar.
 */
export function criarArmazenamentoEmMemoria(inicial: Estado = estadoVazio(), aoMudar?: (e: Estado) => void, tipo: ArmazenamentoLocal['tipo'] = 'memoria'): ArmazenamentoLocal {
  const e = inicial;
  /** Dentro de uma transação: o que desfazer se ela não chegar ao disco. */
  let desfazer: (() => void)[] | null = null;

  const voltar = (lista: (() => void)[]) => {
    for (let i = lista.length - 1; i >= 0; i -= 1) lista[i]!();
  };
  const persistir = (seFalhar: () => void) => {
    try {
      aoMudar?.(e);
    } catch (erro) {
      seFalhar();
      throw comoErroDeArmazenamento(erro);
    }
  };
  /** Troca `tabela[chave]` (ou apaga, com `undefined`) guardando como era. */
  function mudar<V>(tabela: Record<string, V>, chave: string, valor: V | undefined) {
    const tinha = Object.prototype.hasOwnProperty.call(tabela, chave);
    const antes = tabela[chave];
    const reverter = () => {
      if (tinha) tabela[chave] = antes as V;
      else delete tabela[chave];
    };
    if (valor === undefined) delete tabela[chave];
    else tabela[chave] = valor;
    if (desfazer) desfazer.push(reverter);
    else persistir(reverter);
  }

  return {
    tipo,
    transacao<T>(f: () => T): T {
      if (desfazer) return f();
      const lista: (() => void)[] = [];
      desfazer = lista;
      let r: T;
      try {
        r = f();
      } catch (erro) {
        desfazer = null;
        voltar(lista);
        throw erro;
      }
      desfazer = null;
      if (lista.length > 0) persistir(() => voltar(lista));
      return r;
    },
    fila() {
      return Object.values(e.fila)
        .filter(itemValido)
        .map((i) => structuredClone(i));
    },
    itemDaFila(id) {
      const i = e.fila[id];
      return i !== undefined && itemValido(i) ? structuredClone(i) : null;
    },
    gravarItemDaFila(item) {
      mudar(e.fila, item.id, structuredClone(item));
    },
    removerItemDaFila(id) {
      mudar(e.fila, id, undefined);
    },
    lerPreferencia(chave) {
      return e.preferencias[chave] ?? null;
    },
    gravarPreferencia(chave, valor) {
      mudar(e.preferencias, chave, valor === null ? undefined : valor);
    },
    colecao(nome) {
      return Object.entries(e.colecoes[nome] ?? {}).filter(([, v]) => v !== null && v !== undefined).map(([id, v]) => [id, structuredClone(v)] as [Id, unknown]);
    },
    registroDaColecao(nome, id) {
      const v = e.colecoes[nome]?.[id];
      return v === null || v === undefined ? null : structuredClone(v);
    },
    gravarNaColecao(nome, id, valor) {
      if (!e.colecoes[nome]) mudar(e.colecoes, nome, {});
      mudar(e.colecoes[nome]!, id, valor === null ? undefined : structuredClone(valor));
    },
  };
}
