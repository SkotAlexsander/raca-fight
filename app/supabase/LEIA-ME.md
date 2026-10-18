# supabase/

O banco dos **três apps** (aluno, professor/recepção e o Admin do dono): uma pasta só, uma ordem só. Desde 16/10/2026 (agente AU) é aqui a **única** fonte do esquema; `admin/supabase/` não tem mais SQL. Decisão em `docs/decisoes.md` (16/10/2026) e mapa em `03-arquitetura/06-INTEGRACAO.md`.

| O quê | Onde |
|---|---|
| Migrações, na ordem em que rodam | `migrations/` (o nome em inglês é exigência da CLI do Supabase: `supabase db push` só lê `supabase/migrations/`) |
| A Raça Fight com a grade real (ids fixos), para banco novo | `seed.sql` (`supabase db reset` carrega depois das migrações) |
| Provas | `testes/` |

## As migrações

| Arquivo | O que tem |
|---|---|
| `20261016100000_base.sql` | academias, usuarios (nasce do Auth), vinculos, e as funções de quem-é-quem (`tem_vinculo`, `e_dono`, `e_equipe`, `e_balcao`, `pode_financeiro`) |
| `20261016100100_pessoas_e_luta.sql` | pessoas, dependentes, modalidades, réguas, turmas, horários, quem está na turma, atletas, ajustes de aula, presenças, exames, graduações, eventos, participação, lutas, consentimento de Atletas, técnicas, Raça Responde, interessados, aulas experimentais, indicações |
| `20261016100200_financeiro.sql` | o dinheiro, só do dono: funcionários, planos, matrículas, cobranças, categorias, despesas fixas, importações, lançamentos, regras de cobrança, fechamentos, notas, lembretes, tarefas, filtros salvos |
| `20261016100300_equipe_avisos_e_saude.sql` | perfil profissional, avisos (da academia e da turma), preferências, dispositivos, avisos enviados, cadastro opcional e medições (dado de saúde) |
| `20261016100400_historico_e_travas.sql` | o histórico (só gatilho grava; ninguém muda nem apaga) e as travas (mês fechado, categoria do tipo certo, repartição que soma, pessoa da mesma academia) |
| `20261016100500_funcoes.sql` | as funções que os apps chamam por `rpc` |
| `20261016100600_permissoes.sql` | por cima da RLS: ninguém apaga, a vitrine só lê, as funções de escrita só para quem entrou |

Regras de quem escreve aqui: **id é uuid** (nome legível é a coluna `chave`); toda tabela com `academia_id`, RLS ligada e política no mesmo arquivo da tabela; migração nova é arquivo novo no fim (nunca editar uma que já rodou num projeto de verdade). A chave de serviço nunca entra no repositório.

## Como provar

```
cd app/supabase/testes
node conferir-migracoes.mjs                       # estático, só Node
PGLITE_CAMINHO=<…/@electric-sql/pglite/dist/index.js> node rls.mjs   # Postgres de verdade, em memória
```

O `rls.mjs` sobe um Postgres 18 descartável (PGlite, WebAssembly), aplica `testes/supabase-falso.sql` (os papéis `anon`/`authenticated`/`service_role`, `auth.uid()` e os privilégios padrão do Supabase), as migrações e o seed, e roda 44 casos entrando como cada papel. O PGlite não é dependência do app: aponte para uma cópia já instalada ou instale com `npm i --no-save @electric-sql/pglite` numa pasta de rascunho. Quando existir o projeto Supabase, o mesmo SQL roda com `supabase db reset` e os casos podem virar pgTAP (`supabase test db`).

Nada foi aplicado em projeto Supabase nenhum: não existe conta.
