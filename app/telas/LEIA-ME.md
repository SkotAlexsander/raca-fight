# telas/

Desde a virada de luta (P12, agente AM2), o app é da Raça Fight Gravataí. Tela compõe `componentes/` com dados de `dados/` e regras de `dominio/`; não contém regra de negócio.

- `aluno/`: Início (a próxima aula com "Estou na aula"), Horários e Turma, Treinos (faixa e histórico de graduação), Academia (professores, atletas, eventos, técnicas, Raça Responde), Perfil (dependentes, indicar um amigo, avisos), Comemoração da graduação. A Dieta fica atrás da chave `RECURSOS.dieta` (desligada).
- `equipe/`: o app do professor e da recepção: Hoje, Chamada, Turmas, Alunos e ficha, Graduação (mínimos e exames), Experimentais, "Abra o app Admin" (o dono que não dá aula).
- `academia/`: o que a equipe herdou da onda 2: perfil da equipe, perfil profissional, avisos da academia e da turma.
- `luta/`: leituras de luta juntadas para as telas (`dados.ts`), as fotos (`imagens.ts`) e peças (faixa desenhada, linha de aula, atalhos).
- `entrada/`: abertura preta com o logo, boas-vindas com "Quero conhecer · aula experimental grátis", a vitrine sem conta (`TelaConheca`, rotas `/conheca`), conta e código.
- `compartilhado/`: o cronômetro de rounds (provedor, tela cheia, faixa acima das abas), estados, catálogo de componentes (/componentes), contas de exemplo.
- `rotas.ts`: as abas do aluno e as da equipe por entrada (professor, recepção), e a trava de rota por papel.
