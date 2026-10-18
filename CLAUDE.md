# Academia Plus — regras deste repositório

Aplicativo para celular que liga uma academia aos alunos: duas visões (academia e aluno), treino livre e treinos prontos por objetivo, cadastro corporal opcional e o plano pago **Plus** com acompanhamento de personal (treino + dieta). Dono: Alex. Tudo em português do Brasil: nomes de arquivo, funções, variáveis, commits, comentários e textos de interface.

## Leia antes de tudo

`00-prompts/P00-CONTEXTO.md` — o que o app é, o que já foi decidido e o que ainda está **[decidir]**. Nunca resolva por conta própria uma pendência da tabela do P00; proponha e deixe marcada.

## Estado

- 10/10/2026: projeto criado. Fase de **organização**: prompt, especificação, design e arquitetura antes de qualquer linha de código funcional.

## Onde fica cada coisa

- `01-especificacao/` — o que o app faz (papéis, histórias, fluxos, regras, mapa de telas). Sem código.
- `02-design/sistema-de-design/` — tokens, componentes, responsividade, coerência entre as duas visões.
- `02-design/marca-e-proposta/` — identidade do Academia Plus (tom, cor, tipografia, o que "Plus" significa).
- `03-arquitetura/` — stack, modelo de dados, estrutura do código, decisões técnicas.
- `app/` — o código.
- `docs/decisoes.md` — toda decisão com data, critério, alternativa descartada e o que faria mudar.

## Convenções que não se negociam

- **Papel do usuário decide a visão**, nunca um app separado. Um aluno que vira funcionário troca de visão sem trocar de conta.
- **Cadastro corporal é opcional.** Nenhuma tela do aluno trava por falta de peso/altura.
- **Plus é um estado da conta do aluno**, não um app diferente: o que ele libera são funcionalidades (personal, dieta, acompanhamento).
- **Medidas em unidades inteiras no armazenamento**: peso em gramas, altura em milímetros, carga em gramas, tempo em segundos. Formatação só na tela.
- **Datas em texto ISO** `AAAA-MM-DD`; horários com fuso explícito.
- **Dados de saúde são sensíveis** (LGPD): só o aluno e quem ele autoriza (a academia, o personal no Plus) enxergam peso, altura, restrições. Nunca em log, nunca em analytics.
- Design: as duas visões compartilham o mesmo sistema (tokens, componentes); o que muda é o conteúdo e a navegação, não a linguagem visual.
