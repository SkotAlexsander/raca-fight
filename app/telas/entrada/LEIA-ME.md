# telas/entrada/

Abertura e entrada com duas portas (agente Z, P11; F13; mockups/entrada.html). Rotas em `navegacao/(entrada)/`.

- `TelaBoasVindas` — a abertura animada (uma vez por abertura do app) e as duas portas.
- `TelasDeConta` — como entrar (porta aluno ou academia), e-mail, criar conta, confirmar e-mail, esqueci a senha.
- `TelasDoAluno` — código da academia, objetivo, dias por semana, quem pode ver.
- `TelasDaEquipe` — código da equipe, pedido pendente, abrir academia ([decidir]).
- `pecas.tsx` — tela de foto com véu, pílulas, porta, campo e código de vidro, opção, passos, Interruptor, LinhaComChave, Símbolo.
- `fluxo.ts` — o caminho na memória até entrar. `simulacao.ts` — login SIMULADO (sem chave): Apple/Google abrem a folha de contas de exemplo; e-mail aceita o de uma conta de exemplo; a conta nova entra como Lucas (sem academia) ou Juliana (pendente).

`/contas-de-exemplo` é o atalho de demonstração (botão "Contas de exemplo" nas boas-vindas).
