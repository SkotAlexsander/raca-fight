# P01 — Funcionalidades e mecânicas (→ `01-especificacao/`)

Leia `00-prompts/P00-CONTEXTO.md` e `CLAUDE.md`. Escreva em português do Brasil, para o Alex ler e aprovar. Nunca resolva um **[decidir]**: quando a especificação depender de uma pendência, escreva as duas versões em uma linha e marque.

Entregue em `01-especificacao/`:

1. `00-PAPEIS.md` — os papéis (aluno, aluno Plus, instrutor/funcionário, personal, dono) e o que cada um vê e pode fazer. Tabela de permissões por recurso.
2. `01-HISTORIAS.md` — histórias de uso numeradas (H01…), curtas, no formato "Como [papel], quero [ação] para [resultado]", agrupadas por área: entrada e conta, perfil e cadastro corporal, treino livre, treinos prontos por objetivo, execução do treino (o dia de treino em si), acompanhamento pela academia, Plus (personal, treino, dieta, conversa), visão do dono.
3. `02-FLUXOS.md` — os fluxos principais passo a passo, tela a tela (texto, sem desenho): primeiro acesso do aluno; montar treino livre; escolher treino pronto por objetivo; registrar um treino feito; funcionário abre o perfil de um aluno e monta treino para ele; assinar o Plus; personal monta dieta; aluno segue a dieta no dia.
4. `03-REGRAS.md` — regras de negócio que o código vai obedecer: o que é um treino (estrutura: treino → dias/divisões → exercícios → séries), o que é um objetivo e como ele filtra treinos prontos, o que é um plano de dieta (refeições → itens), como o Plus liga e desliga e o que acontece com os dados quando desliga, quem enxerga dado corporal (LGPD), unidades (gramas, milímetros, segundos — ver CLAUDE.md).
5. `04-MAPA-DE-TELAS.md` — lista de telas das duas visões com nome, objetivo em uma frase, o que mostra, ações. Agrupadas por aba/navegação. É o insumo direto do time de design.
6. `05-FORA-DA-V1.md` — o que fica para depois, com o motivo (ex.: catraca, cobrança de mensalidade, banco de alimentos com macros, aulas coletivas, gamificação).
7. `90-PERGUNTAS-PARA-O-ALEX.md` — toda dúvida nova que surgir na escrita, em lista numerada, com a sua recomendação em uma linha.

Critérios: nada de jargão quando há palavra comum; cada arquivo começa com 2 linhas dizendo o que ele é; frases curtas; os fluxos devem caber na cabeça de quem nunca viu o app.
