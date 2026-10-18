# G — Notificações (P07, 10/10/2026)

Agente G. Fecha o A11 (avisos que o app prometia e ninguém disparava) e o V6 (a academia não tinha como falar com todos os alunos) da revisão B. Nenhum **[decidir]** foi resolvido: os novos estão marcados e listados no fim.

## O que mudou, e onde

| Arquivo | O que entrou |
|---|---|
| `03-arquitetura/03-DECISOES-TECNICAS.md`, seção 3 | Reescrita: tabela com os 20 avisos (texto, gatilho, quem dispara, para quem, chave), regras anti-incômodo, o caminho da Edge Function `enviar-aviso`, os canais do Android, o toque e a permissão no iPhone e no Android 13. A seção 6 (testes) cita `avisos.test.ts` |
| `03-arquitetura/01-MODELO-DE-DADOS.md` | Seções 19 a 22: `Dispositivo` (agora com `fuso`), `PreferenciasDeAviso` e `PreferenciasDaEquipe`, `AvisoDaAcademia` e `AvisoDispensado`, `AvisoEnviado` (sem texto). Cada uma com a tabela de quem lê e escreve |
| `03-arquitetura/02-ESTRUTURA-DO-CODIGO.md` | `avisos.ts` na árvore do `dominio/` |
| `01-especificacao/01-HISTORIAS.md` | Seção J, H80 a H89 |
| `01-especificacao/02-FLUXOS.md` | F10 (a academia manda um aviso), F11 (o aluno ajusta os avisos), F12 (tocar na notificação) |
| `01-especificacao/03-REGRAS.md` | Seção 10, R10.1 a R10.16 |
| `01-especificacao/04-MAPA-DE-TELAS.md` | Parte 4: Avisos (aluno), cartão "Aviso da academia", convite ao lembrete, Avisos da academia, Novo aviso, Avisos da equipe. Quatro linhas existentes ganharam a referência (Início, Avisos, Alunos, Perfil da academia) |
| `01-especificacao/00-PAPEIS.md` | Duas linhas na tabela de permissões (escrever e retirar aviso; ver e dispensar) |
| `01-especificacao/05-FORA-DA-V1.md` | Quatro linhas: aviso segmentado ou agendado, aviso com foto/link/"lido por", silêncio escolhido pelo aluno, aviso por e-mail ou SMS |
| `01-especificacao/90-PERGUNTAS-PARA-O-ALEX.md` | Seção "Avisos", perguntas G1 a G8 |
| `app/dominio/avisos.ts` + `avisos.test.ts` | Código e 41 testes (o teste foi escrito antes) |

**Convivência com o agente H**: só acrescentei seções. Numerei de propósito longe do que ele deve usar: histórias a partir de H80, fluxo a partir de F10, regras na seção 10 (a 9 ficou livre) e perguntas com a letra G. Se ele tiver usado outros números, quem juntar só precisa conferir que nada colidiu. A tabela de avisos cita o motor dele (`dominio/cronometro.ts`, "próximo aviso em X s") nos avisos 1 a 3.

## A tabela de avisos, resumida

Texto completo e gatilho exato na seção 3.1 de `03-DECISOES-TECNICAS.md`.

| # | Aviso | Quem dispara | Para quem | Chave (desliga?) |
|---|---|---|---|---|
| 1 | Fim do descanso com o app fechado: "Descanso terminado · Próxima série." | telefone | aluno | Cronômetro (sim; fura o silêncio) |
| 2 | Fim de série por tempo | telefone | aluno | Cronômetro (sim; fura o silêncio) |
| 3 | Fim do regressivo e fases do intervalado | telefone | aluno | Cronômetro (sim; fura o silêncio) |
| 4 | Lembrete de treino: "Treino B pronto · Está no app quando você quiser." | telefone (`agendaDaSemana`) | aluno | Lembrete de treino (nasce desligado) |
| 5 | Lembrete de refeição (Plus): resumo à noite por padrão, ou um por refeição | telefone (`agendaDaSemana`) | aluno Plus | Lembrete de refeição (3 modos) |
| 6 | Personal ajustou o treino | servidor (ação "Enviar", não cada linha salva) | aluno Plus | Personal |
| 7 | Personal ajustou a dieta: "Dani mudou seu plano alimentar" | servidor | aluno Plus | Personal |
| 8 | Nova mensagem, sem prévia **[decidir]** | servidor | aluno Plus e personal | Mensagens |
| 9 | Treino montado pela academia | servidor | aluno | Avisos da academia |
| 10 | Aviso da academia (V6) | servidor | todos os alunos com vínculo ativo | Avisos da academia (o cartão fica) |
| 11 | Vínculo confirmado | servidor | aluno | Avisos da academia |
| 12 | Plus ativo | servidor | aluno | Plus |
| 13 | Personal escolhido ou trocado | servidor | aluno Plus | Plus |
| 14 | Plus vence em 3 dias **[decidir]** quem paga | servidor (`pg_cron` 09:00) | aluno Plus | Plus |
| 15 | Plus suspenso (só caminhos A e B) | servidor (webhook) | aluno Plus | Plus |
| 16 | Vínculo pendente (somado de 2 em 2 h) | servidor | recepção e dono | Pedidos para entrar |
| 17 | Alunos sem treinar há 14 dias (H42), resumo das 09:00 | servidor (`pg_cron`) | recepção e dono; instrutor desligado | Alunos sem treinar |
| 18 | Aluno Plus sem registro há 3 dias (H60) | servidor (`pg_cron`) | personal designado | Meus alunos Plus |
| 19 | Novo aluno Plus sem personal (B13) | servidor | dono (e recepção, se ela designa) | **não desliga** |
| 20 | Aluno Plus designado | servidor | personal | Meus alunos Plus |

**Ficaram de fora, de propósito**, até o Alex aceitar a proposta de origem: versão nova do treino pronto (pergunta 18), comentário do personal (V10), retorno semanal (V8), "Seu treino está guardado" depois de 10 dias (marca) e vínculo encerrado pela academia (B10).

## Regras anti-incômodo

1. **Silêncio das 22:00 às 07:00** (R10.4, R10.5). Só o cronômetro do treino em andamento toca. Lembrete local marcado no silêncio é **descartado**, nunca movido para uma hora que ninguém escolheu; o seletor de hora vai até 21:59. Aviso do servidor é **segurado** até as 07:00 no fuso de quem recebe (`dispositivos.fuso`).
2. **Limite por dia** (R10.6): 3 lembretes locais (o de treino tem prioridade) e 3 avisos do servidor por pessoa. Do 4º em diante, fica só dentro do app. Fora da conta: o cronômetro, a mensagem (agrupada) e o aviso 19.
3. **Agrupar avisos iguais** (R10.7): refeições a menos de 30 min viram uma; refeições que passariam do limite viram o resumo da noite (agrupar, não cortar o jantar); pedidos de vínculo de 2 em 2 h; sumidos e sem registro num resumo às 09:00; mensagens de 15 em 15 min por conversa.
4. **Não lembrar o que já foi feito** (R10.8): sem lembrete no dia em que treinou nem depois de fechar a frequência da semana; com a pausa do B4, se entrar, nada até a data de volta.
5. **Uma vez por episódio** (R10.9): sumiço e "3 dias sem registro" não repetem todo dia.
6. **Nunca dado de saúde** (R10.2): nem peso, caloria, objetivo ou restrição. Também não vai o **nome da refeição**, porque o plano alimentar inteiro é dado de saúde (R6.1, e o `redigir.ts` já protege o campo `nome` da refeição), nem a **prévia da mensagem**. Um teste confere que a agenda não leva número com unidade nem palavra de corpo ou comida.
7. **Aviso da academia** (R10.10 a R10.13): só texto, até 160 caracteres e 3 linhas, sem link; um com notificação por dia por academia; sem resposta, sem curtir, sem "lido por"; o aluno dispensa, a academia retira.

## O código (`app/dominio/avisos.ts`)

Puro, sem Expo nem relógio: quem chama passa a semana, o fuso e o "agora". Roda no app e numa Edge Function.

- `agendaDaSemana(entrada)` → `{ agendadas, descartadas }`. Recebe o que o aluno ligou na tela Avisos, a frequência pretendida, se tem Plus, as refeições do plano em vigor (sem o nome), as datas com treino e o silêncio. Devolve cada notificação com id estável (`lembrete_treino:2026-10-12`), para o app cancelar e reagendar sem duplicar, e cada descarte com o motivo (`silencio`, `limite_do_dia`, `agrupado`, `passado`, `pausa`, `treino_feito`, `meta_da_semana`, `sem_dias`), para a tela poder explicar.
- `diasPelaFrequencia(n)`: espalha 1 a 7 dias pela semana (3 → seg, qua, sex).
- `dentroDoSilencio()`, `proximoMomentoPermitido()` (o servidor usa para segurar), `respeitaSilencio(tipo)`.
- `TIPOS_DE_AVISO`, `CHAVE_DO_AVISO` (tipo → chave; só `plus_sem_personal` é `null`), `PREFERENCIAS_PADRAO`.
- `validarAvisoDaAcademia()`: conta caractere, não unidade de UTF-16 ("é" e "💪" contam 1).

Os tipos de preferência ficaram em `avisos.ts`, não em `tipos.ts`, porque a tabela do P07 só me deixa escrever em `avisos*.ts`. Quem mexer em `tipos.ts` pode trazê-los para lá.

## Divergências que achei e não corrigi (fora da minha pasta)

Em `02-design/marca-e-proposta/04-APLICACAO.md`, tabela "Notificação":

1. **"Juliana preencheu o perfil · Objetivo: começar a treinar"**: objetivo é dado de saúde (R6.1). Esse aviso também não tem história. Proposta: tirar a linha.
2. **"Nova mensagem · (prévia da mensagem)"**: a mensagem pode ter dado de saúde (modelo de dados, seção 18). Proposta: "Dani · Mandou uma mensagem."
3. **"Dani mudou seu treino · Agachamento subiu para 4 séries"**: não é dado de saúde, mas aparece na tela bloqueada, e o próprio `04-IPHONE.md` tira o nome do exercício do aviso de descanso pelo mesmo motivo. Proposta: "Abra para ver o que mudou."
4. **"Sem treino há 10 dias"** não bate com os 14 dias do H42 e não tem gatilho na especificação (pergunta G4).
5. O exemplo do lembrete no `01-TOM-DE-VOZ.md` ("A academia fecha às 22h") pede o horário da academia, que não está no modelo. Usei "Está no app quando você quiser."

## Para `docs/decisoes.md`

A tabela do P07 não me deixa escrever lá. Texto pronto para quem for registrar:

> **10/10/2026 — Avisos: quem dispara, regras anti-incômodo e o aviso da academia**
> **Decidido** (técnico; detalhe em `03-DECISOES-TECNICAS.md`, seção 3, e `03-REGRAS.md`, seção 10): cronômetro e lembretes são notificação local, com a agenda calculada por `dominio/avisos.ts`; todo o resto sai do servidor (Edge Function `enviar-aviso`), nunca de um app para outro. Silêncio das 22:00 às 07:00, exceto o cronômetro; 3 lembretes locais e 3 avisos do servidor por pessoa por dia; avisos iguais agrupados; nenhum dado de saúde, nem o nome da refeição, nem a prévia da mensagem. Aviso da academia só de texto, até 160 caracteres, um com notificação por dia, sem resposta.
> **Por quê**: o A11 e o V6 da revisão B; LGPD (a notificação passa por Apple, Google e Expo e aparece na tela bloqueada); o tom de voz ("aparece quando precisa").
> **Descartado**: push de app para app; lembrete movido para fora do silêncio; prévia da mensagem; aviso com resposta ou "lido por"; lembrete de treino ligado por padrão.
> **Mudaria se**: alguém pedir silêncio próprio (o código já aceita); o volume pedir FCM/APNs direto; o modo Foco esconder o descanso ("urgente" da Apple).

## [decidir] novos

Na seção "Avisos" de `90-PERGUNTAS-PARA-O-ALEX.md`, cada um com a recomendação:

- **G1**: quem escreve o aviso da academia (dono e recepção; o instrutor também?), ligado à pergunta 21.
- **G2**: o lembrete de treino nasce ligado ou desligado (recomendação: desligado, com convite depois do primeiro treino).
- **G3**: silêncio fixo ou ajustável pelo aluno (recomendação: fixo na v1).
- **G4**: o "Seu treino está guardado" depois de 10 dias, da marca, entra? (recomendação: não na v1).
- **G5**: versão nova do treino pronto vira notificação? (recomendação: só cartão).
- **G6**: comentário do personal (V10) e retorno semanal (V8) avisam, se entrarem?
- **G7**: quem recebe o resumo dos sumidos, e a que horas (recomendação: recepção e dono, 09:00).
- **G8**: para quem vai o "Plus vence em 3 dias" (depende de quem paga).

Os que já existiam e tocam nos avisos: chat próprio ou WhatsApp (aviso 8), quem paga o Plus (avisos 14 e 15), emoji na notificação (`01-TOM-DE-VOZ.md`).

## Saída dos testes

`node --test "dominio/**/*.test.ts"` em `app/`, no fim (já com o `cronometro.test.ts` do agente H):

```
ℹ tests 180
ℹ suites 44
ℹ pass 180
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 259.977
```

Só os meus junto com os que já existiam (`avisos`, `unidades`, `treino`): 127 testes passando, dos quais 41 são de `avisos.test.ts`. Não rodei `tsc`: o TypeScript não está instalado em `app/` e a tarefa proíbe `npm install`. O Node só apaga os tipos ao rodar, então erro de tipo passaria despercebido. Na primeira instalação, vale rodar `npm run tipos`.
