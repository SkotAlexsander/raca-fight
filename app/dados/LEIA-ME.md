# dados/

Única fronteira com o backend. Hoje roda o **repositório local de exemplo** (`local/`): os dados dos mockups (Ana, Academia do Marcos, equipe) e o catálogo real de `dominio/catalogo/`. O Supabase (`supabase/`) é só a forma, sem chamada.

- `repositorio.ts` — a interface única: leituras e ESCRITAS (agente AA, P11: vínculos, envio de treino, avisos, prontos, personal, perfil profissional, preferências, treinos, cadastro, peso, pedido de treino, refeição, conta nova).
- `ProvedorDeDados.tsx` — `useRepositorio`, `useSessao` (vínculos, visão, entrar/sair, "Trocar de visão"), `usePreferencias`, `useFila`.
- `consultas.ts` — hooks do React Query (chave sempre com o `academiaId` ativo).
- `escrita.ts` — `useGravar()`: toda escrita das telas passa por aqui (grava, depois limpa o cache; o que muda vínculo recarrega a sessão).
- `local/RepositorioLocal.ts` — os dados de exemplo e, por cima, as COLEÇÕES gravadas no aparelho (voltam iguais ao reabrir). `local/gravacao.test.ts` prova cada escrita "fechando e abrindo" o app.
- `rede.ts` / `rede.web.ts` — a rede do aparelho liga o "sem rede" da fila (no navegador, os eventos online/offline).
- `armazenamento/` — SQLite no aparelho (`banco.ts`, versão 2 com a tabela `registros`), localStorage no navegador (`banco.web.ts`), memória nos testes.
- `fila.ts` — gravar e enfileirar (síncrono: treino realizado e refeição registrada) e subir depois, com a regra de `dominio/sincronizacao.ts`.
- `redigir.ts` — tira dado de saúde de log e erro (com teste que lê `dominio/tipos.ts`).
- A regra da visão (para onde o app vai pelo vínculo) mora em `dominio/papel.ts`; `dados/index.ts` reexporta.

Testes no Node: `npm run testar:dominio` (o glob inclui `dados/**/*.test.ts`). O `package.json` desta pasta só diz `"type": "module"`.
