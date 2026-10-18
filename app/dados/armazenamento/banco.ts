/**
 * O SQLite do aparelho (expo-sqlite, API síncrona): a fila de envio com dono,
 * as coleções (a presença, R15.9) e as preferências locais. Síncrono de
 * propósito: o "Estou na aula" grava no mesmo quadro do toque, antes da
 * animação (catálogo, regra 1).
 *
 * As tabelas, as migrações e o SQL ficam em `sqlite.ts` (agente AB, P11), que
 * não depende do expo-sqlite e por isso é testado no Node com o `node:sqlite`
 * (`dados/revisao-ab.test.ts`: a migração da versão 1 para a 2 e as linhas
 * corrompidas). Aqui só se liga o expo-sqlite àquela forma.
 *
 * Fora do backup: no Android, `android.allowBackup: false` no app.json; no
 * iPhone, marcar o arquivo com `isExcludedFromBackup` pede código nativo
 * (pendência em X-BASE.md).
 */
import * as SQLite from 'expo-sqlite';
import type { ArmazenamentoLocal } from './tipos';
import { criarArmazenamentoSqlite, migrar, type BancoSincrono } from './sqlite';

type Parametros = SQLite.SQLiteBindParams;

export function abrirArmazenamentoLocal(): ArmazenamentoLocal {
  const db = SQLite.openDatabaseSync('academia-plus.db');
  const banco: BancoSincrono = {
    executar: (sql) => db.execSync(sql),
    um: <T>(sql: string, p: unknown[] = []) => db.getFirstSync<T>(sql, p as Parametros) ?? null,
    todos: <T>(sql: string, p: unknown[] = []) => db.getAllSync<T>(sql, p as Parametros),
    rodar: (sql, p = []) => void db.runSync(sql, p as Parametros),
    transacao: (f) => db.withTransactionSync(f),
  };
  banco.executar('pragma journal_mode = wal;');
  // outra conexão no meio de uma escrita (o sistema, uma tarefa em segundo plano): espera até 2 s antes de
  // dar "banco travado" (agente AG); passou disso, a gravação devolve ErroDeArmazenamento e a tela avisa
  banco.executar('pragma busy_timeout = 2000;');
  migrar(banco);
  return criarArmazenamentoSqlite(banco);
}
