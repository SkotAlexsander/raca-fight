# Quadro de coordenação — Raça Fight (P12)

Atualizado pelo agente principal a cada onda. **Regra de ouro:** cada agente escreve só na pasta dele. O que for da pasta de outro vira item no relatório e passa pelo agente principal, que repassa a mensagem.

## Agora (onda 1)

| Agente | Faz | Dono das pastas | Depende de | Estado |
|---|---|---|---|---|
| **AI** — Admin: especificação e domínio financeiro | painel, pessoas, financeiro "tipo planilha", relatórios, notas, lembretes e histórico, funil da aula experimental, modelo de dados, domínio com testes, arquitetura do app admin separado | `01-especificacao/admin/`, `app/dominio/financeiro/`, seções novas de `03-arquitetura/` | — | ✅ feito 15/10 (86 testes novos; 24 perguntas A1–A24) |
| **AJ** — Virada para luta | inventário (fica/adapta/sai), modalidades (Muay Thai, Jiu-Jitsu, Boxe, Luta-Livre), turmas e horários, presença, graduação, eventos, aula experimental, mapa de telas do aluno e do professor | `01-especificacao/luta/` | — | ✅ feito 15/10 (`docs/revisao/AJ-LUTA.md`, 34 perguntas em `01-especificacao/luta/90-PERGUNTAS-PARA-O-ALEX.md`) |
| **AQ** — Hospedagem (P13) | custo e segurança da hospedagem, em reais, com fontes, para o PDF do admin | `docs/hospedagem/` | — | ✅ feito 15/10 (recomendado ~R$ 162/mês; `docs/revisao/AQ-HOSPEDAGEM.md`) |

AI e AJ combinam os nomes (modalidade, turma, plano, professor) lendo a pasta um do outro. **Nenhum dos dois mexe em `app/` fora do domínio financeiro, nem em `02-design/`.**

## Próximas ondas

| Onda | Agente | Faz | Começa quando |
|---|---|---|---|
| 2 | **AK** — Telas do admin | desenho do app admin: denso, para o PC (2040×790) e o celular, na marca Raça Fight | ✅ feito 15/10 (24 telas, 0 achados; `docs/revisao/AK-ADMIN-TELAS.md`) |
| 2 ⚡ | **AR** — PDF do admin (P13) | o PDF do dono, completo e direto, com a hospedagem no fim; **PRIORIDADE**: o Alex precisa apresentar | ✅ feito 15/10: 27 p., 2 MB, em `A:\Projetos\Academia Plus\Raça Fight — Admin.pdf`; esboços de tela até o AK entregar (refazer: capturar → montar → folhear em `docs/apresentacao/admin/`) |
| 2 | **AL** — Cara de luta | paleta vermelho, preto e branco medida; logo; fotos do perfil; ícones de luta (luva, faixa, tatame, saco); tirar o que é de musculação do design | ✅ feito 15/10 (tokens 2.0.0, `mockups/luta.html`, `docs/revisao/AL-LUTA-VISUAL.md`) |
| 3 | **AM1** — Construção do Admin | `admin/` (Vite + React, PWA) + `app/dominio/financeiro/` | ✅ feito 16/10 (456 domínio, 24 Vitest, 2 E2E, 90 capturas; `docs/revisao/AM1-ADMIN-APP.md`) |
| 3 | **AM2** — Virada de luta no app | `app/` menos `dominio/financeiro/` | ✅ feito 16/10 (457 domínio, 103 telas, 32 e2e; `docs/revisao/AM2-LUTA-APP.md`) |
| 4 | **AN** — Bugs app aluno/professor | `app/` menos `dominio/financeiro/` e `supabase/` | ✅ feito 16/10 (12 achados corrigidos; 493 domínio, 109 telas, 32 e2e; `docs/revisao/AN-BUGS-APP.md`) |
| 4 | **AO** — Bugs Admin | `admin/` menos `supabase/` + `app/dominio/financeiro/` | ✅ feito 16/10 (9 graves + ~30 médios; 500 domínio, 40 Vitest, 5 e2e, JS 762→411 kB; `docs/revisao/AO-BUGS-ADMIN.md`) |
| 4 | **AU** — Integração dos 3 apps | `admin/supabase/`, `app/supabase/`, `03-arquitetura/`, `02-design/icones/CREDITOS.md` | ✅ feito 16/10 (esquema único, 49 tabelas, RLS 44/44 em PGlite; `docs/revisao/AU-INTEGRACAO.md`) |
| 3 | **AS / AT** — PDF do professor e PDF do aluno (P13) | um PDF para cada visão | ✅ feito 15/10: Professor 25 p. e Aluno 18 p., em `A:\Projetos\Academia Plus\` (relatórios AS e AT) |
| 5 | **AP** — APK e Admin entregável | APK novo + Admin com atalho na Área de Trabalho | ✅ feito 18/10 (APK 64,7 MB, testado no emulador; `docs/revisao/AP-ENTREGA.md`) |
| 5 | **AV** — Os 3 PDFs com telas reais | Admin, Professor, Aluno | ✅ feito 16/10 (35, 25 e 18 p.; `docs/revisao/AV-PDFS.md`) |

No máximo **3 agentes ao mesmo tempo**, porque com mais o limite de uso estoura.

## Parado esperando o Alex

| O quê | Para quê | Onde pôr |
|---|---|---|
| ✅ 15/10: as fotos do Instagram (54) e a grade real já estão em `02-design/referencias/raca-fight/` | — | — |
| O logo em alta resolução, de preferência em vetor, pedido à academia | o ícone do app, a abertura e o cabeçalho | mesma pasta |
| A planilha que eles usam hoje | importar no admin e conferir se o admin mostra tudo que a planilha mostra | mesma pasta ou `docs/` |
| O nome do app na loja | "Raça Fight", "Raça Fight Gravataí" ou outro | responder no chat |
