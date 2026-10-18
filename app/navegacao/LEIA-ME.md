# navegacao/

Rotas do Expo Router (raiz pelo app.json). Só arquivos de rota aqui: qualquer `.ts/.tsx` vira rota. Constantes de rota ficam em `telas/rotas.ts`.

- `_layout.tsx` — provedores (tema, dados, vibração, aviso rápido), fontes e a abertura.
- `index.tsx` — manda para a visão que o vínculo decide (`dominio/papel.ts`).
- `(entrada)/` — sem sessão (provisório: contas de exemplo; o agente Z faz a entrada).
- `(aluno)/` — abas `inicio`, `treinos`, `plus`, `perfil` (o agente Y troca as telas).
- `(academia)/` — abas `alunos`, `biblioteca` (Treinos), `acompanhamento` (Plus, só personal), `painel` (Academia, só dono), `perfil-da-equipe`. Nomes de rota diferentes dos do aluno porque o Expo Router não aceita o mesmo caminho em dois grupos.
- `escolher-visao.tsx` — "Entrar como…" e "Trocar de visão". `componentes.tsx` — o catálogo.
