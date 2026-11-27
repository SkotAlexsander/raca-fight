# Academia Plus

Aplicativo para celular (Android e iOS) que liga uma academia aos alunos. Um app, **duas visões**: a da academia (dono e funcionários) e a do aluno. O aluno monta o próprio treino ou escolhe um pronto pelo objetivo, informa dados corporais se quiser, e no plano pago **Plus** ganha um personal acompanhando treino e alimentação pelo app. O funcionário vê o perfil do aluno e monta treino para ele.

**Estado em 11/10/2026**

| Parte | Situação |
|---|---|
| Contexto | `00-prompts/P00-CONTEXTO.md` — o que é, o que foi decidido, o que falta o Alex decidir |
| Especificação | `01-especificacao/` — 5 papéis, 68 histórias, 12 fluxos, regras R1–R8, 53 telas, 20 itens fora da v1, 25 perguntas |
| Sistema de design | `02-design/sistema-de-design/` — tokens, 16 componentes com estados, navegação, acessibilidade, `mockups/index.html` (abre direto, claro/escuro) |
| Marca | `02-design/marca-e-proposta/` — proposta, tom de voz, paleta verde + dourado (contraste medido), logo final "Barra e mais, robusta" (11/10, agente W; comparativo em `logo/comparativo.html`), white-label, `tokens-marca.json` |
| Arquitetura | `03-arquitetura/` — Expo + TypeScript / Supabase, 18 entidades, offline, LGPD; `app/dominio/` com 180 testes passando (treino, unidades, avisos, cronômetro; 29 bugs corrigidos na revisão de 10/10, ver `docs/revisao/`) (`node --test "dominio/**/*.test.ts"`) |
| P06–P08 (10/10) | iPhone (configuração, EAS sem Mac, App Store, 4 molduras), 20 avisos com regras anti-incômodo, cronômetro livre/regressivo/intervalado, direção de arte (3 opções, A aplicada), banco de 80 imagens com licença, catálogo de efeitos; protótipo com a marca, 6 telas; 180 testes; PDF de 34 p. em `docs/apresentacao/saida/` e em `A:\Projetos\10-10-26 Raça Fight - Academia Plus (app)\` |
| P10 (11/10) | Checagem final: 10 bugs + 8 reforços no domínio (318 testes, também em outros fusos), segurança auditada (3 achados corrigidos), fila offline com dono; 30 bugs de interação/acessibilidade no protótipo sem mudar 1 pixel; perfil profissional e "Equipe da academia" na especificação e no código; top 10 para o cliente — ver `docs/revisao/T-`, `U-`, `V-` |
| Código (P11, 11/10) | O app construído em `app/` (Expo SDK 54) com as escolhas provisórias de 11/10: as duas visões, a entrada, o treino sem sinal, dados de exemplo gravados no aparelho. tsc 0 erros · 413 testes de domínio e dados · 115 de tela · 32/32 fluxos de ponta a ponta · expo-doctor 18/18 — ver `docs/revisao/X-` a `AE-` |
| Mapa muscular | `02-design/anatomia/comparativo.html` (agente AD) — vetor recomendado, **aguarda o Alex** |
| Apresentação | PDF de 54 p. em `docs/apresentacao/saida/` (11/10, agente AF): o logo final, o app construído com capturas reais nos dois temas, como abrir, qualidade, o mapa muscular e as pendências atualizadas |

## Pastas

```
CLAUDE.md            regras do repositório (PT-BR, papel decide a visão, cadastro opcional, unidades inteiras, LGPD)
LEIA-ME.md           este arquivo
00-prompts/          P00 contexto · P01 funcionalidades · P02 arquitetura · P03 sistema de design · P04 marca
01-especificacao/    o que o app faz, sem código
02-design/
  sistema-de-design/ tokens.json, componentes, navegação, acessibilidade, mockups/index.html
  marca-e-proposta/  proposta, tom de voz, identidade, logo/, tokens-marca.json
03-arquitetura/      stack, modelo de dados, estrutura do código, decisões técnicas
app/                 o aplicativo (Expo + TypeScript, proposta a confirmar) — dominio/ já testável
docs/decisoes.md     cada decisão com data, critério, descarte e o que faria mudar
```

## Como usar os prompts

Cada `P0x` em `00-prompts/` é um prompt completo para um agente (ou pessoa) produzir uma pasta. Para refazer uma parte, rode só o prompt dela: `P01` refaz a especificação, `P03` o sistema de design, e assim por diante. Todos começam mandando ler o `P00`.

## Decisões pendentes

Estão na tabela do `P00-CONTEXTO.md` (uma academia ou várias · quem paga o Plus · dieta livre ou banco de alimentos · chat próprio ou WhatsApp · marca própria ou da academia · primeira academia cliente). As perguntas que surgiram na escrita ficam em `01-especificacao/90-PERGUNTAS-PARA-O-ALEX.md`.
