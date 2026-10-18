/**
 * Verificador ESTÁTICO das migrações: roda só com o Node, sem banco nenhum.
 * Lê `../migrations/*.sql` e confere:
 *  1. nenhuma tabela nem função criada duas vezes (nem em arquivos diferentes);
 *  2. toda tabela de `public` tem RLS ligada;
 *  3. toda tabela tem pelo menos uma política, ou a marca `-- rls: só servidor`
 *     na linha antes do `create table` (nenhuma política = ninguém pela API);
 *  4. toda `references public.X` aponta para uma tabela criada antes (ou auth.users);
 *  5. não sobrou SQL em pasta antiga (admin/supabase/migrations, app/supabase/migracoes);
 *  6. não há segredo no SQL (chave JWT, service_role key).
 *
 * Rodar (de app/supabase/testes):  node conferir-migracoes.mjs
 * A prova de verdade, num Postgres, é o `rls.mjs`; este pega o erro antes.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));
const pasta = join(aqui, '..', 'migrations');
const raiz = join(aqui, '..', '..', '..');
const arquivos = readdirSync(pasta).filter((n) => n.endsWith('.sql')).sort();
const problemas = [];

const tabelas = new Map(); // nome -> { arquivo, ordem }
const funcoes = new Map();
const rls = new Set();
const politicas = new Set();
const soServidor = new Set();
const referencias = []; // { de, para, arquivo, ordem }
let ordem = 0;

// tira os comentários de linha, mas guarda a marca `rls: só servidor`
function semComentario(sql) {
  return sql.replace(/--[^\n]*/g, (c) => (c.includes('rls: só servidor') ? '/*SO_SERVIDOR*/' : ''));
}

for (const arquivo of arquivos) {
  const sql = semComentario(readFileSync(join(pasta, arquivo), 'utf8'));
  if (/eyJ[a-zA-Z0-9_-]{20,}/.test(sql) || /service_role_key|sb_secret_/i.test(sql)) problemas.push(`${arquivo}: parece ter um segredo`);

  for (const m of sql.matchAll(/(\/\*SO_SERVIDOR\*\/\s*)?create table (?:if not exists )?public\.(\w+)\s*\(([\s\S]*?)\n\);/g)) {
    ordem += 1;
    const nome = m[2];
    if (tabelas.has(nome)) problemas.push(`tabela ${nome} criada duas vezes (${tabelas.get(nome).arquivo} e ${arquivo})`);
    tabelas.set(nome, { arquivo, ordem });
    if (m[1]) soServidor.add(nome);
    for (const r of m[3].matchAll(/references (public|auth)\.(\w+)/g)) referencias.push({ de: nome, para: `${r[1]}.${r[2]}`, arquivo, ordem });
  }
  for (const m of sql.matchAll(/alter table public\.(\w+) add constraint \w+\s+foreign key \(\w+\) references (public|auth)\.(\w+)/g)) {
    referencias.push({ de: m[1], para: `${m[2]}.${m[3]}`, arquivo, ordem: Infinity });
  }
  for (const m of sql.matchAll(/create (?:or replace )?function public\.(\w+)\s*\(/g)) {
    if (funcoes.has(m[1])) problemas.push(`função ${m[1]} criada duas vezes (${funcoes.get(m[1])} e ${arquivo})`);
    funcoes.set(m[1], arquivo);
  }
  for (const m of sql.matchAll(/alter table public\.(\w+) enable row level security/g)) rls.add(m[1]);
  for (const m of sql.matchAll(/create policy \w+ on public\.(\w+)/g)) politicas.add(m[1]);
  // os laços `do $$ … foreach t in array array['a', 'b'] … $$` que ligam RLS ou criam política
  for (const bloco of sql.matchAll(/do \$\$([\s\S]*?)\$\$;/g)) {
    for (const laco of bloco[1].matchAll(/array\s*\[([^\]]*)\]\s*loop([\s\S]*?)end loop/g)) {
      const nomes = [...laco[1].matchAll(/'(\w+)'/g)].map((x) => x[1]);
      if (laco[2].includes('enable row level security')) nomes.forEach((n) => rls.add(n));
      if (laco[2].includes('create policy')) nomes.forEach((n) => politicas.add(n));
    }
  }
}

for (const [nome] of tabelas) {
  if (!rls.has(nome)) problemas.push(`tabela ${nome} sem RLS ligada`);
  if (!politicas.has(nome) && !soServidor.has(nome)) problemas.push(`tabela ${nome} sem política (e sem a marca "rls: só servidor")`);
}
for (const r of referencias) {
  if (r.para === 'auth.users') continue;
  const alvo = tabelas.get(r.para.replace('public.', ''));
  if (!alvo) problemas.push(`${r.de} referencia ${r.para}, que não existe`);
  else if (alvo.ordem > r.ordem && r.de !== r.para.replace('public.', '')) problemas.push(`${r.de} referencia ${r.para} antes de ela ser criada`);
}
for (const antiga of [join(raiz, 'admin', 'supabase', 'migrations'), join(raiz, 'app', 'supabase', 'migracoes')]) {
  if (existsSync(antiga) && readdirSync(antiga).some((n) => n.endsWith('.sql'))) problemas.push(`ainda há SQL na pasta antiga ${antiga}`);
}

console.log(`${arquivos.length} migrações, ${tabelas.size} tabelas, ${funcoes.size} funções, ${politicas.size} tabelas com política.`);
if (problemas.length) {
  for (const p of problemas) console.log(`PROBLEMA: ${p}`);
  process.exit(1);
}
console.log('Tudo certo: nenhuma duplicata, RLS e política em toda tabela, referências existentes, pastas antigas vazias.');
