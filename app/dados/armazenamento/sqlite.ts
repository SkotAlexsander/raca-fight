/**
 * O armazenamento SQLite do aparelho, SEM depender do expo-sqlite: recebe um
 * banco síncrono (`BancoSincrono`). No celular, `banco.ts` liga o expo-sqlite;
 * no teste (`dados/revisao-ab.test.ts`), o `node:sqlite`, que é o mesmo motor —
 * assim a migração e o SQL de verdade são testados no Node (agente AB, P11).
 *
 * Tabelas (03-DECISOES-TECNICAS.md, seção 2):
 * - `treinos_realizados(id, aluno_id, dados_json, atualizado_em)` — da versão 1,
 *   do tempo da musculação: a tabela fica (o banco de quem já instalou migra igual),
 *   mas nada mais lê nem grava nela (P12, agente AM2);
 * - `fila_de_envio(id, tipo, usuario_id, carga_json, criado_em, tentativas,
 *   estado, ultimo_erro)` — `ultimo_erro` é só status e código;
 * - `preferencias(chave, valor)`;
 * - `registros(colecao, id, dados_json, criado_em)` — versão 2 (agente AA):
 *   o que o repositório local grava enquanto não há servidor.
 *
 * Linha com JSON quebrado (arquivo mexido, gravação cortada) é PULADA, não
 * derruba a abertura do app (agente AB). O conteúdo nunca vai para o log.
 */
import type { Id } from '../../dominio/tipos.ts';
import type { ItemDaFila } from '../../dominio/sincronizacao.ts';
import type { ArmazenamentoLocal } from './tipos.ts';
import { comoErroDeArmazenamento } from '../erros.ts';

/** O mínimo de um banco SQLite síncrono (expo-sqlite no celular, node:sqlite no teste). */
export interface BancoSincrono {
  executar(sql: string): void;
  um<T>(sql: string, parametros?: unknown[]): T | null;
  todos<T>(sql: string, parametros?: unknown[]): T[];
  rodar(sql: string, parametros?: unknown[]): void;
  transacao(f: () => void): void;
}

export const VERSAO_DO_BANCO = 2;

export const MIGRACOES: Record<number, string> = {
  1: `
    create table if not exists treinos_realizados (
      id text primary key not null,
      aluno_id text not null,
      dados_json text not null,
      atualizado_em text not null
    );
    create index if not exists treinos_realizados_aluno on treinos_realizados (aluno_id);
    create table if not exists fila_de_envio (
      id text primary key not null,
      tipo text not null,
      usuario_id text not null,
      carga_json text not null,
      criado_em text not null,
      tentativas integer not null default 0,
      estado text not null,
      ultimo_erro text
    );
    create table if not exists preferencias (
      chave text primary key not null,
      valor text not null
    );
  `,
  // agente AA (P11): o que o repositório local grava enquanto não há servidor
  2: `
    create table if not exists registros (
      colecao text not null,
      id text not null,
      dados_json text not null,
      criado_em integer not null,
      primary key (colecao, id)
    );
  `,
};

/** Leva o banco até a `VERSAO_DO_BANCO`, uma versão por transação (a que falha volta atrás inteira). */
export function migrar(db: BancoSincrono, migracoes: Record<number, string> = MIGRACOES): void {
  const atual = db.um<{ user_version: number }>('pragma user_version')?.user_version ?? 0;
  for (let v = atual + 1; v <= VERSAO_DO_BANCO; v += 1) {
    const sql = migracoes[v] ?? MIGRACOES[v];
    db.transacao(() => {
      db.executar(sql);
      db.executar(`pragma user_version = ${v}`);
    });
  }
}

/** JSON de uma linha; quebrado vira `undefined` e a linha é pulada (nunca o conteúdo no log). */
function lerJson(texto: string): unknown {
  try {
    return JSON.parse(texto);
  } catch {
    return undefined;
  }
}
const presente = <T>(v: T | undefined | null): v is T => v !== undefined && v !== null;

type LinhaDaFila = { id: string; tipo: string; usuario_id: string; carga_json: string; criado_em: string; tentativas: number; estado: string; ultimo_erro: string | null };

/** A linha vira item; com o JSON da carga quebrado, `null` (a linha fica no banco, nunca é apagada). */
function itemDaLinha(l: LinhaDaFila): ItemDaFila | null {
  const carga = lerJson(l.carga_json);
  if (!presente(carga)) return null;
  return {
    id: l.id,
    tipo: l.tipo as ItemDaFila['tipo'],
    usuarioId: l.usuario_id,
    carga: carga as ItemDaFila['carga'],
    criadoEm: l.criado_em,
    tentativas: Number(l.tentativas),
    estado: l.estado as ItemDaFila['estado'],
    ...(l.ultimo_erro ? { ultimoErro: l.ultimo_erro } : {}),
  };
}

export function criarArmazenamentoSqlite(db: BancoSincrono): ArmazenamentoLocal {
  // Agente AG (P11): o erro do motor na ESCRITA (disco cheio, banco travado) sai como
  // `ErroDeArmazenamento`, sem a mensagem crua; e as escritas de uma ação vão juntas
  // (`transacao`), para o app fechando no meio não deixar o treino gravado fora da fila.
  let profundidade = 0;
  const escrever = (sql: string, parametros: unknown[]) => {
    try {
      db.rodar(sql, parametros);
    } catch (e) {
      throw comoErroDeArmazenamento(e);
    }
  };
  return {
    tipo: 'sqlite',
    transacao<T>(f: () => T): T {
      if (profundidade > 0) return f();
      let resultado: T | undefined;
      let erroDeDentro: { e: unknown } | null = null;
      profundidade = 1;
      try {
        db.transacao(() => {
          try {
            resultado = f();
          } catch (e) {
            erroDeDentro = { e };
            throw e;
          }
        });
      } catch (e) {
        // o erro da regra (de dentro) sai como veio; o do motor (begin/commit) sai tipado
        if (erroDeDentro) throw (erroDeDentro as { e: unknown }).e;
        throw comoErroDeArmazenamento(e);
      } finally {
        profundidade = 0;
      }
      return resultado as T;
    },
    fila() {
      // na ordem de chegada; a ordem de envio (pelo instante) é do domínio (`itensParaEnviar`)
      return db
        .todos<LinhaDaFila>('select * from fila_de_envio order by rowid')
        .map(itemDaLinha)
        .filter(presente);
    },
    itemDaFila(id: Id) {
      const l = db.um<LinhaDaFila>('select * from fila_de_envio where id = ?', [id]);
      return l ? itemDaLinha(l) : null;
    },
    gravarItemDaFila(i: ItemDaFila) {
      escrever(
        'insert into fila_de_envio (id, tipo, usuario_id, carga_json, criado_em, tentativas, estado, ultimo_erro) values (?, ?, ?, ?, ?, ?, ?, ?) on conflict(id) do update set carga_json = excluded.carga_json, tentativas = excluded.tentativas, estado = excluded.estado, ultimo_erro = excluded.ultimo_erro',
        [i.id, i.tipo, i.usuarioId, JSON.stringify(i.carga), i.criadoEm, i.tentativas, i.estado, i.ultimoErro ?? null],
      );
    },
    removerItemDaFila(id: Id) {
      escrever('delete from fila_de_envio where id = ?', [id]);
    },
    lerPreferencia(chave: string) {
      return db.um<{ valor: string }>('select valor from preferencias where chave = ?', [chave])?.valor ?? null;
    },
    colecao(nome: string) {
      return db
        .todos<{ id: string; dados_json: string }>('select id, dados_json from registros where colecao = ? order by rowid', [nome])
        .map((l) => [l.id, lerJson(l.dados_json)] as [Id, unknown])
        .filter(([, v]) => presente(v));
    },
    registroDaColecao(nome: string, id: Id) {
      const l = db.um<{ dados_json: string }>('select dados_json from registros where colecao = ? and id = ?', [nome, id]);
      const v = l ? lerJson(l.dados_json) : undefined;
      return presente(v) ? v : null;
    },
    gravarNaColecao(nome: string, id: Id, valor: unknown | null) {
      if (valor === null) escrever('delete from registros where colecao = ? and id = ?', [nome, id]);
      else
        escrever(
          'insert into registros (colecao, id, dados_json, criado_em) values (?, ?, ?, ?) on conflict(colecao, id) do update set dados_json = excluded.dados_json',
          [nome, id, JSON.stringify(valor), Date.now()],
        );
    },
    gravarPreferencia(chave: string, valor: string | null) {
      if (valor === null) escrever('delete from preferencias where chave = ?', [chave]);
      else escrever('insert into preferencias (chave, valor) values (?, ?) on conflict(chave) do update set valor = excluded.valor', [chave, valor]);
    },
  };
}
