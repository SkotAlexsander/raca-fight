# P07 — Notificações completas e o cronômetro (roda depois do P06)

Todos leem antes `00-prompts/P00-CONTEXTO.md`, `CLAUDE.md`, `docs/decisoes.md` e `docs/revisao/B-MELHORIAS.md` (item A11 e V6). Português do Brasil. Nenhum resolve um **[decidir]**.

| Agente | Escreve em | Relatório |
|---|---|---|
| G — Notificações | `01-especificacao/`, `03-arquitetura/`, `app/dominio/avisos*.ts` | `docs/revisao/G-NOTIFICACOES.md` |
| H — Cronômetro | `01-especificacao/` (só histórias, regras e telas do cronômetro), `app/dominio/cronometro*.ts`, `02-design/sistema-de-design/` | `docs/revisao/H-CRONOMETRO.md` |

G e H podem tocar os mesmos arquivos de `01-especificacao/`: cada um **acrescenta** seções novas e não reescreve a do outro.

## G — Notificações

1. **Tabela completa** em `03-arquitetura/03-DECISOES-TECNICAS.md` (seção 3): todo aviso que a especificação promete, com texto (no tom de `02-design/marca-e-proposta/01-TOM-DE-VOZ.md`), gatilho, **quem dispara (o telefone, como notificação local, ou o servidor)**, para quem, se dá para desligar e em qual chave da tela Avisos. Entram no mínimo:
   - fim do descanso com o app fechado;
   - fim de série por tempo;
   - lembrete de treino;
   - lembrete de refeição (Plus);
   - personal ajustou o treino ou a dieta;
   - nova mensagem [decidir];
   - aluno sem treinar há 14 dias (H42, para a academia);
   - aluno Plus sem registro há 3 dias (H60, para o personal);
   - novo aluno Plus sem personal (para o dono);
   - vínculo pendente;
   - Plus vence em 3 dias;
   - aviso da academia.
2. **Aviso da academia** (V6 da revisão): história, fluxo e tela para o dono/recepção escrever um aviso curto que vai como notificação e cartão no Início. Sem resposta, sem chat.
3. **Regras anti-incômodo**: horário de silêncio (nada entre 22h e 7h, exceto o descanso do treino em andamento), limite por dia, agrupar avisos iguais, nunca dado de saúde no texto.
4. **Código** `app/dominio/avisos.ts` + teste: dado o que o aluno ligou na tela Avisos, a frequência pretendida e o horário de silêncio, calcular a agenda de notificações locais da semana (puro, sem Expo). Primeiro o teste.

## H — Cronômetro

1. **Três modos numa ferramenta só**, aberta por um botão na tela de treino em andamento e por um atalho no Início:
   - **livre**: conta para cima, para cardio e esteira, com voltas;
   - **regressivo**: tempo escolhido, com vibração no fim;
   - **intervalado**: trabalho, descanso e rodadas, estilo HIIT ou Tabata; vem com predefinições como Tabata 20/10 × 8 e EMOM.
   O descanso entre séries (componente 7) e a contagem da série por tempo (a prancha de 30 s) usam o mesmo motor.
2. **Especificação**: histórias novas, o fluxo e a tela do cronômetro no `04-MAPA-DE-TELAS.md`, as regras (um cronômetro de treino por vez e o que acontece se o descanso começa com o intervalado rodando). O tempo feito no livre e no intervalado pode virar uma série realizada de um exercício do tipo tempo.
3. **Código** `app/dominio/cronometro.ts` + teste, com primeiro o teste. É uma máquina de estados pura: parado, rodando, pausado e terminado, com as fases do intervalado. Ela guarda o **instante de início e as pausas**, nunca um contador que soma de segundo em segundo. Assim o tempo continua certo depois de o telefone bloquear a tela, de o app ir para segundo plano ou de a hora mudar. O teste cobre o descanso com +30 s e −30 s, pausar e retomar, o intervalado inteiro e o "próximo aviso em X s", que serve para agendar a notificação local.
4. **Design**: componente "Cronômetro" no `02-COMPONENTES.md`, com os três modos e números grandes que se leem a 1 m de distância. Também a tela no mockup (`mockups/index.html`), dentro de uma moldura de celular, no claro e no escuro. Rode `auditoria/auditar.mjs` até dar 0 achados.

Em `app/` rode `node --test "dominio/**/*.test.ts"` no fim (G e H).
