# telas/aluno/

Visão do aluno (agente Y, P11). Rotas em `navegacao/(aluno)/`: uma pilha com as abas `(abas)/` (Início · Treinos · Plus · Perfil, cada aba com a sua pilha) e, por cima, `modo-treino` e `comemoracao` (tela cheia, sem abas).

- `estado/ProvedorDoAluno.tsx` — o que passa de tela em tela: treinos (gravados pelo repositório), o treino em andamento (cada série GRAVA pelo `useFila().registrarTreinoRealizado` antes de animar), o cronômetro único (R9.9, salvo no aparelho e restaurado ao reabrir) e os dados do aluno (refeições na fila, pedido de treino, peso, cadastro, avisos), todos gravados pelo repositório (agente AA). `TelaModoTreino.test.tsx` prova que marcar série grava antes de animar.
- `comum/` — montagem com os componentes base (Tela, Seção, Coluna, botão sobre a foto), a ligação das abas com a faixa do cronômetro, fotos, dieta e equipe. Linha, Chave, gráficos e formatos foram para `componentes/` (agente AA).
- `Tela*.tsx` — Início, Treinos, Treino pronto, Editar treino, Séries, Modo treino, Comemoração, Cronômetro, Evolução, Histórico, Plus, Dieta; `perfil/` — Perfil, Meus dados, Quem pode ver, Avisos, Conta, Equipe, Perfil do profissional.

Relatório: `docs/revisao/Y-ALUNO.md` (o que diverge do mockup e as peças para promover).
