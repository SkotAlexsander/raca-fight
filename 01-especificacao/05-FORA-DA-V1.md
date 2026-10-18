# 05 — Fora da v1

Este arquivo lista o que fica para depois e por quê, para ninguém implementar sem querer e para o Alex ver o que está sendo adiado.
A v1 é: as duas visões, treino livre, treinos prontos por objetivo, execução e histórico, perfil do aluno para a academia, e o Plus com personal, treino, dieta e conversa.

| O que | Por que fica para depois | Quando faria sentido entrar |
|---|---|---|
| **Catraca e controle de acesso** | Exige hardware e integração com fornecedor; a fala do Alex foi sobre treino e acompanhamento. **[decidir]** no P00 (gestão). | Quando a primeira academia pedir e escolher o fornecedor. |
| **Cobrança de mensalidade e financeiro da academia** | É um produto inteiro (boleto, Pix, inadimplência, recibo). Mistura o app de treino com um sistema de gestão. **[decidir]** no P00. | Se o Alex decidir que o app é também o sistema da academia. |
| **Banco de alimentos com calorias e macros** | Precisa de uma base de dados confiável (TACO/IBGE), busca, porções e cálculo. O personal consegue trabalhar com texto livre na v1. **[decidir]** no P00. | Depois de ver como os personais escrevem a dieta na prática. |
| **Aulas coletivas (grade, inscrição, presença)** | Outro fluxo (horários, vagas, professor) sem ligação com treino individual. | Quando alguma academia-cliente tiver aulas e pedir. |
| **Gamificação (pontos, medalhas, ranking)** | Fácil de fazer mal e virar ruído. Primeiro medir se a sequência da semana (que está na v1) já motiva. | Depois dos primeiros 3 meses de uso real. |
| **Vídeo de execução dos exercícios** | Produzir ou licenciar vídeos custa; texto curto + imagem resolve a v1. | Quando a biblioteca geral estiver estável. |
| **Pesagem pela academia (balança, bioimpedância)** | Recepção registrar peso do aluno levanta questão de consentimento e de quem é o dado. Na v1 só o aluno registra. | Se as academias tiverem balança integrável e o aluno autorizar. |
| **Medidas corporais além de peso e altura** (circunferências, dobras, % de gordura) | Mais campos sensíveis para pouco uso na v1. O armazenamento em milímetros já previsto comporta. | Quando o personal pedir no Plus. |
| **Papéis separados para recepção e instrutor** | Na v1 são o mesmo papel. Separar exige mais telas de permissão. | Se uma academia precisar que a recepção não monte treino. |
| **Personal externo (não funcionário da academia)** | Muda o modelo: quem cobra, quem designa, quem responde. Pergunta aberta ao Alex. | Depois da resposta e de uma academia real. |
| **Várias academias para o mesmo aluno** | Depende de **[decidir]** uma ou várias academias. A modelagem já prevê `academiaId`. | Se o app virar SaaS. |
| **Marca da academia (white-label: logo e cor por academia)** | **[decidir]** no P00. Afeta o sistema de design inteiro. | Depois da decisão de marca. |
| **Treinos prontos gerais do Academia Plus (biblioteca sem academia)** | Exige montar e curar conteúdo. Na v1 a biblioteca é da academia. | Se houver alunos sem academia em quantidade. |
| **Compartilhar treino entre alunos / rede social** | Fora do propósito (academia ↔ aluno). | Provavelmente nunca. |
| **Integração com relógio e sensores** (frequência cardíaca, passos) | Complexidade alta, valor incerto para musculação. | Se virar pedido recorrente. |
| **Relatórios em PDF para o aluno ou a academia** | A tela já mostra; exportar bonito é refino. | v1.1, se pedirem. |
| **Painel web para o dono (tela grande)** | O app é para telefone. A visão do dono na v1 cabe no celular. | Se a visão da academia crescer para gestão completa. |
| **Agenda de sessões com o personal (horário presencial)** | O Plus da v1 é acompanhamento pelo app; marcar hora presencial é outro fluxo. | Se os personais pedirem. |
| **Avaliação física periódica formal** (protocolos, laudos) | Exige padronização e responsabilidade técnica (CREF). | Com orientação de um profissional. |
| **Vários idiomas** | Tudo em português do Brasil por decisão. | Se o app sair do Brasil. |
| **Aviso da academia para um grupo** (só Plus, só quem treina de manhã) ou **agendado** para outro dia | O aviso da v1 é um recado para todos, agora. Segmentar exige filtro, prévia de alcance e cuidado para não expor quem é Plus. | Se as academias pedirem depois de usar o aviso simples. |
| **Aviso da academia com foto, link ou "lido por"** | Foto e link viram mural; "lido por" vira cobrança e rede social (V6). | Foto, talvez; "lido por", provavelmente nunca. |
| **Horário de silêncio escolhido pelo aluno** | Fixo em 22h–7h na v1 (R10.4); o código já aceita outro horário. | Se alguém que treina de madrugada pedir. |
| **Aviso por e-mail ou SMS** | A notificação do app basta; e-mail com dado do treino exigiria outro cuidado de LGPD (R6.2). | Só para conta e senha, que já usam e-mail. |
| **Valores no perfil profissional** (preço do personal particular, da aula avulsa ou de pacote) (P10) | **O Alex pediu para não pôr valores por enquanto** (11/10/2026). O perfil da Equipe sai sem preço (R11.10). | Quando o Alex pedir. A ideia dele é mostrar o preço do personal particular. |
| **Avaliação, nota ou estrela do profissional** (P10) | Sem ranking e sem nota na v1 (R11.9). É **[decidir]** (pergunta 27): expõe o profissional a nota injusta e a comparação entre colegas, e vira moderação. | Só se o Alex decidir, e com o desenho da pergunta 27. |
| **Busca de profissional por turno ou dia** na Equipe (P10) | A v1 filtra só por especialidade; a grade de dias e turnos aparece no perfil. | Se a equipe for grande e os alunos pedirem. |
