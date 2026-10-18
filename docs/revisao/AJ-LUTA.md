# AJ — Virada para academia de luta: análise e especificação

> Agente AJ, P12, 15/10/2026. Escreveu só em `01-especificacao/luta/` (8 arquivos), neste relatório e numa entrada de `docs/decisoes.md`. Não mexeu em `app/` nem em `02-design/`. Recebeu no meio da onda os dados da Raça Fight (modalidades, grade real, WhatsApp, marca vermelha) e a mudança para três apps; tudo já está incorporado.

## 1. O que foi entregue

| Arquivo | O que tem |
|---|---|
| `01-especificacao/luta/00-LEIA-ME.md` | A academia, os três apps, a **grade real** como dado de exemplo das turmas, e o **glossário** de nomes compartilhado com o Admin |
| `01-INVENTARIO.md` | Fica, adapta, sai, Admin ou [decidir] para cada história, regra, fluxo, módulo do domínio, arquivo de tela e rota |
| `02-MODALIDADES-E-GRADUACAO.md` | A graduação de cada modalidade, com fonte, e o modelo que serve a qualquer régua |
| `03-HISTORIAS.md` | H115 a H162 (48 histórias) |
| `04-REGRAS.md` | Seções 14 a 22 (turma e aula, presença, graduação, rounds, eventos e atletas, aula experimental e indicação, Kids, técnicas, avisos) |
| `05-FLUXOS.md` | F17 a F25 (9 fluxos) |
| `06-MAPA-DE-TELAS.md` | O mapa novo do aluno, do professor e da recepção, e as abas |
| `07-PESQUISA-E-FONTES.md` | Gymdesk, Zen Planner, Tecnofit, Next Fit, EVO Fight, DojoApp; todas as fontes; o que não foi confirmado |
| `90-PERGUNTAS-PARA-O-ALEX.md` | L1 a L34, cada uma com a recomendação |

## 2. Inventário

| Parte | Peças | Fica | Adapta | Sai | Admin | [decidir] |
|---|---|---|---|---|---|---|
| Histórias (H01–H114) | 111 | 25 | 25 | 32 | 9 | 20 |
| Regras (seções 1–13) | 13 | 4 | 5 | 2 | — | 2 |
| Fluxos (F1–F16) | 16 | 2 | 6 | 5 | — | 3 |
| Domínio (módulos) | 12 | 3 | 5 | 4 | — | — |
| Telas (arquivos em `app/telas/`) | 50 | 21 | 16 | 8 | 1 | 4 |

As peças maiores:
- **Sai o treino de musculação inteiro**: regras R1, `treino.ts` (770 linhas), Editar treino, Séries, Montar treino, os 11 treinos prontos e os 28 exercícios do catálogo, o mapa muscular (`02-design/anatomia/`), a Evolução por carga.
- **Sai o Modo treino** (657 linhas, a maior tela) como modo de séries; o visual dele (escuro, tela cheia, número grande) volta no **cronômetro de rounds**.
- **Fica e vira peça central o Cronômetro** (926 linhas, o motor mais testado). O intervalado já é um cronômetro de rounds; ganha predefinições de luta com fonte, o aviso dos 10 s, o gongo e o uso pelo professor.
- **Fica o aviso da academia**, e entra o **aviso da turma** (o "aviso para um grupo" estava fora da v1).
- **Adapta a Equipe/perfil profissional**: vira "Professores", com modalidades e a graduação do professor.
- **O painel do dono vai ao Admin.** O Plus e a dieta esperam o Alex (L12, L13; recomendação: fora da v1 de luta).

"Sair" não é apagar agora: o código fica até a onda AM tirar, para nada quebrar no meio.

## 3. O que entra

| Peça | Regra | Destaque |
|---|---|---|
| **Modalidade, turma, horário, aula** | R14 | Turma com **duas modalidades** (o Jiu-Jitsu / Luta Livre da grade real); **aula aberta** (Sexta OPEN, check-in de qualquer matriculado, o aluno diz o que vai treinar); **treino de competição** só para atletas; aula cancelada e substituto; a aula só vira linha no banco quando alguém mexe nela. |
| **Presença e check-in** | R15 | Janela de 30 min antes a 30 min depois (L7); check-in do aluno nasce pendente; a **chamada do professor** confirma ou retira; pendente às 23:59 confirma sozinho; offline pela fila. **Nenhum dado financeiro na frente do professor.** |
| **Graduação** | R16 | A régua como dado; IBJJF adulto e kids prontos, com o PDF de junho de 2026; Muay Thai e Luta Livre para a academia preencher; mínimo da federação × mínimo da academia; "atingiu os mínimos" que nunca gradua sozinho; exame de graduação; nada se apaga, anula-se. |
| **Cronômetro de rounds** | R17 | Boxe e Muay Thai 3 × 3/1, MMA 3 × 5/1, rola, saco; "Round 2 de 3"; aviso dos 10 s; gongo com o app aberto; tela cheia do tatame; também no app da equipe. |
| **Eventos, lutas e Atletas** | R18 | O cartaz "[atleta] vs [adversário], 60 kg, semi-pró" vira a **luta**; a área **Atletas** só com consentimento; o peso medido continua dado de saúde, a luta guarda a categoria anunciada. |
| **Aula experimental e indicação** | R19 | Botão **"Agendar aula experimental grátis"** que abre o WhatsApp com a modalidade na mensagem (v1); a recepção registra; o professor vê na chamada; a matrícula é do Admin; "Traga um amiguinho" com código de indicação (o desconto é do AI). |
| **Kids** | R20 | A conta é do **responsável**, com dependentes; autorização de imagem separada e desligada; art. 14 da LGPD e Enunciado ANPD 1/2023. |
| **Técnicas** | R21 | "Golpes básicos", "Golpes de curta distância": vídeo por modalidade e nível (link na v1, L30). |
| **Avisos e "Raça Responde"** | R22 | Aviso da turma pelo professor; cancelamento avisa sozinho; lembrete de aula no lugar do de treino; perguntas frequentes. |

## 4. O mapa novo

### Aluno — 5 abas: **Início · Horários · Treinos · Academia · Perfil** (L32)

- **Início**: a **próxima aula** é o herói, com "Estou na aula" na janela; aviso; a semana em bolinhas; a faixa de cada modalidade; o próximo evento; atalhos (Cronômetro, Técnicas, Indicar um amigo). Responsável vê um cartão por dependente.
- **Horários**: a grade por dia, filtrada pelas modalidades do aluno; a turma com professor, público e a frase de quem não pode entrar.
- **Treinos**: minhas presenças (calendário), minha graduação (faixa, graus, tempo, aulas desde a última, histórico) e o Cronômetro.
- **Academia**: Professores · Atletas · Eventos · Técnicas · Raça Responde · endereço e WhatsApp.
- **Perfil**: o de antes, mais Meus dependentes, Minha matrícula (leitura, do AI), Indicar um amigo, Aparecer em Atletas.
- **Sem conta (vitrine)**: Boas-vindas com "Quero conhecer · aula experimental grátis" → Conheça a academia (horários, professores, Raça Responde) → WhatsApp.

13 telas novas, 8 saem, 4 esperam o Plus.

### Professor — 5 abas: **Hoje · Turmas · Alunos · Graduação · Perfil**

- **Hoje** (primeira aba): a aula da hora com os check-ins e os experimentais → **Chamada**; atalhos Cronômetro, Eventos, Aviso para uma turma.
- **Turmas**: as turmas dele, cancelar ou passar uma aula, aviso para a turma, técnicas da modalidade.
- **Alunos**: os das modalidades dele, com faixa e última presença; filtros Sumidos, Novos, Kids, Atletas, Atingiram os mínimos; o aluno com a graduação e a marca de atleta. **Nada financeiro.**
- **Graduação**: atingiram os mínimos, kids que passam ao adulto, exames, a régua para consulta.
- **Perfil**: meu perfil profissional (modalidades e graduação), avisos da equipe.

### Recepção — 4 abas: **Hoje · Alunos · Experimentais · Perfil**

Todas as aulas do dia e o check-in do balcão; os alunos com "Vínculo pendente"; a lista de experimentais (nova, compareceu, faltou, remarcar, "Matricular" leva ao Admin).

### Dono

Abre o **Admin** (AI). Se também dá aula, entra na Equipe como professor.

## 5. Perguntas para o Alex (as que travam)

Todas em `01-especificacao/luta/90-PERGUNTAS-PARA-O-ALEX.md` (34). Antes de construir, as nove abaixo. As marcadas **[academia]** são para perguntar à Raça Fight.

1. **L3 [academia]** A régua do Muay Thai: as cores do cordão em ordem (o amarelo do post não está na lista atribuída à CBMT), graus, tempo, aulas, e a palavra: kruang ou prajied?
2. **L4 [academia]** A Luta Livre é a Esportiva? Qual a régua?
3. **L5 [academia]** No Jiu-Jitsu Kids, o modelo de graus da IBJJF: trimestral, quadrimestral ou mensal?
4. **L19 [academia]** Há número mínimo de aulas por grau e por faixa em cada modalidade?
5. **L1 [academia]** Muay Thai às 20h e às 21h são turmas diferentes? Quanto dura cada aula?
6. **L14 [academia]** A faixa de idade das turmas Kids.
7. **L32** As cinco abas do aluno com os nomes dos destaques do Instagram.
8. **L12** O Plus continua? (Recomendação: fora da v1 de luta.)
9. **L13** A dieta continua? (Recomendação: fora; se voltar, só com nutricionista.)

Outras que pesam: **L8** (atraso bloqueia check-in? recomendação: não), **L20** (o aluno vê "pronto para graduar"? recomendação: não), **L25** (termo e declaração de saúde da experimental, com advogado), **L27** (adolescente de 16–17 com conta própria), **L34** (autorização dos professores e atletas reais para aparecer com nome e foto).

## 6. Para os outros agentes

- **AI (Admin)**: o glossário em `00-LEIA-ME.md` usa **plano, matrícula, mensalidade** como do AI e **modalidade, turma, horário, aula, presença, graduação, evento, interessado, aula experimental** como do AJ. Quando esta onda terminou, `01-especificacao/admin/` ainda não existia, então o alinhamento foi feito escolhendo nomes; se o AI escolheu outros para o financeiro, vale o dele. O Admin precisa de: cadastro de modalidades, turmas e horários (R14.1, R14.2a); régua de graduação de cada modalidade e os mínimos da academia (R16.2, R16.3); matrícula que diz **de quais modalidades** o aluno pode fazer check-in (R14.6); a matrícula que cria o vínculo `ativo` (R14.7); a conversão da experimental em matrícula e os números dela (R19.3, R19.6); o desconto da indicação (R19.9); a taxa do exame (R16.12); o número do WhatsApp da academia (R19.2); perguntas frequentes (R22.3); a escala do professor da OPEN (R14.8); o cancelamento de aulas por feriado (R14.5); a confirmação da graduação do professor (R16.14); esconder perfil de professor (R11.7, antes do dono na Equipe). **Regra a não quebrar**: o professor e o app do aluno nunca recebem dado financeiro (R14.6a, R15.7).
- **AL (cara de luta)**: palavras que saem da tela (treino A/B/C, série, carga, volume, personal) e as que entram (aula, chamada, faixa, kruang, grau, round, intervalo); a faixa e o cordão desenhados com até 3 cores e os graus (R16.2); comemoração da graduação; tela cheia do cronômetro; fotos sem menores sem autorização; ícones de luva, faixa e relógio de round no lugar do haltere e da anilha.
- **AM (construção)**: o domínio novo proposto (`presenca.ts`, `graduacao.ts`, `grade.ts`, `experimental.ts`), cada um com o teste antes; os tipos novos da fila (`checkin`, `chamada`); as predefinições e o aviso dos 10 s no `cronometro.ts`; tirar o treino só depois de as telas novas existirem.
- **AK (telas do Admin)**: a grade, a régua de graduação e a lista de experimentais aparecem também no Admin, com os mesmos nomes.

## 7. O que não foi confirmado

- A régua de Muay Thai e de Luta Livre da Raça Fight (L3, L4): não há regulamento público achado; só o professor confirma.
- O tempo de luta IBJJF por faixa (só fontes secundárias; o livro de regras não foi baixado).
- A página oficial do WhatsApp sobre o `wa.me` e o texto oficial do Enunciado ANPD 1/2023 (lidos por terceiros).
- Se professor de luta precisa de CREF (L18): não pesquisado a fundo.
- Os sistemas Zen Planner, Tecnofit e Next Fit foram lidos por descrições de loja e de terceiros, não testados.
