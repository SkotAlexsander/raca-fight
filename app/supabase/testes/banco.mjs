/**
 * Sobe um Postgres DESCARTÁVEL em memória (PGlite: o Postgres de verdade
 * compilado para WebAssembly) e aplica, na ordem: o Supabase falso, as
 * migrações de `../migrations/` (por nome) e o `../seed.sql`.
 *
 * O PGlite NÃO é dependência do app. Para achar o pacote:
 * 1. `import('@electric-sql/pglite')` (se alguém instalou com --no-save), ou
 * 2. a variável PGLITE_CAMINHO apontando para o `dist/index.js` do pacote.
 * Nada daqui sobe para servidor nenhum; o banco some quando o processo acaba.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));
// MIGRACOES_PASTA: só para a prova de que o teste morde (uma cópia com uma regra quebrada de propósito)
export const PASTA_DAS_MIGRACOES = process.env.MIGRACOES_PASTA || join(aqui, '..', 'migrations');

async function carregarPGlite() {
  try {
    // opcional de propósito: o PGlite não é dependência do app
    // eslint-disable-next-line import/no-unresolved
    return (await import('@electric-sql/pglite')).PGlite;
  } catch {
    const caminho = process.env.PGLITE_CAMINHO;
    if (!caminho) {
      throw new Error('PGlite não encontrado. Rode com PGLITE_CAMINHO=<caminho do @electric-sql/pglite/dist/index.js>, ou instale com `npm i --no-save @electric-sql/pglite` numa pasta de rascunho.');
    }
    return (await import(pathToFileURL(caminho).href)).PGlite;
  }
}

export function migracoes() {
  return readdirSync(PASTA_DAS_MIGRACOES).filter((n) => n.endsWith('.sql')).sort();
}

/** @returns {Promise<import('@electric-sql/pglite').PGlite>} */
export async function bancoNovo({ comSeed = true } = {}) {
  const PGlite = await carregarPGlite();
  const db = new PGlite();
  await db.exec(readFileSync(join(aqui, 'supabase-falso.sql'), 'utf8'));
  for (const nome of migracoes()) {
    try {
      await db.exec(readFileSync(join(PASTA_DAS_MIGRACOES, nome), 'utf8'));
    } catch (e) {
      throw new Error(`a migração ${nome} falhou: ${e.message}`);
    }
  }
  if (comSeed) await db.exec(readFileSync(join(aqui, '..', 'seed.sql'), 'utf8'));
  return db;
}
