# 90 — Perguntas para o Alex

Este arquivo reúne as dúvidas novas que apareceram ao escrever a especificação, fora das seis pendências que já estão na tabela do P00.
Cada pergunta tem a minha recomendação em uma linha; a decisão é do Alex e, quando tomada, vai para `docs/decisoes.md` e a especificação é ajustada.

As seis do P00 continuam valendo e não estão repetidas aqui: uma ou várias academias; quem paga o Plus; dieta texto livre ou banco de alimentos; chat próprio ou WhatsApp; marca própria ou da academia; primeira academia real.

---

1. **O personal é sempre alguém da academia, ou um personal de fora pode atender pelo app?**
   Recomendação: na v1, só da academia (a academia cadastra e designa). Personal externo muda cobrança e responsabilidade.

2. **O aluno pode ter mais de um treino ativo ao mesmo tempo (ex.: musculação + corrida)?**
   Recomendação: um só ativo; os outros ficam guardados e trocam com um toque. Simplifica o "o que faço hoje".

3. **Quem designa o personal ao aluno Plus: só o dono, ou a recepção também? E o aluno pode escolher?**
   Recomendação: dono designa e pode permitir à recepção; o aluno não escolhe na v1 (evita disputa por personal).

4. **Como o aluno entra na academia no app: código da academia (ele digita), convite da recepção, ou os dois?**
   Recomendação: os dois, com confirmação da recepção ligada por padrão (o dono pode desligar).

5. **Aluno sem academia pode usar o app (treino livre sozinho)? E pode assinar o Plus sem academia?**
   Recomendação: pode usar treino livre sem academia (não trava ninguém); Plus só via academia na v1.

6. **O funcionário pode editar o treino que o aluno montou sozinho, ou só criar um novo para ele?**
   Recomendação: só cria novo (pode partir de cópia do atual). O treino do aluno é dele.

7. **Biblioteca de exercícios: existe uma geral do app (com "como fazer" e imagem) além da de cada academia? Quem monta a geral?**
   Recomendação: sim, uma geral com os ~80 exercícios mais comuns, montada por nós antes do lançamento; a academia complementa.

8. **A lista de objetivos está certa?** Proposta: emagrecer, ganhar massa, condicionamento, iniciante, saúde e manutenção.
   Recomendação: manter 5 itens fixos; "iniciante" como objetivo mesmo sendo nível, porque é como o aluno fala.

9. **Frequência: conta só treino registrado no app, ou há um "cheguei na academia" (check-in manual) separado?**
   Recomendação: só treino registrado na v1. Check-in sem catraca vira número inflado.

10. **Há limite de alunos Plus por personal?**
    Recomendação: sem limite rígido; o dono vê a contagem por personal e decide.

11. **O Plus tem período de teste grátis (7 dias)?**
    Recomendação: não na v1 — depende de quem cobra ([decidir]) e complica os estados da assinatura.

12. **Na dieta, o aluno pode registrar algo que comeu fora do plano ("comi uma pizza")?**
    Recomendação: não na v1. Ele marca "não segui" com o motivo em texto; já dá ao personal o que precisa.

13. **Idade: pedir data de nascimento ou só a idade?**
    Recomendação: data de nascimento (a idade muda sozinha; serve ao controle de menor de idade).

14. **Restrições e lesões: texto livre ou lista para marcar (joelho, ombro, coluna, hipertensão…)?**
    Recomendação: lista curta para marcar + campo de texto livre. A lista ajuda o funcionário a filtrar exercícios depois.

15. **Peso: só o aluno registra, ou a recepção também pode (balança da academia)?**
    Recomendação: só o aluno na v1 (dado de saúde é dele). Recepção registrar fica para depois, com consentimento próprio.

16. **Menores de idade podem usar o app?** A LGPD pede consentimento do responsável para dado de saúde de menor.
    Recomendação: permitir conta a partir de 16 anos; dado corporal só com confirmação de responsável por e-mail. Abaixo de 16, não na v1.

17. **Lembretes (treino, refeição) entram na v1?**
    Recomendação: sim, simples e desligáveis: lembrete de treino nos dias que o aluno escolheu e de refeição no horário do plano.

18. **Quando a academia atualiza um treino pronto, os alunos que já copiaram recebem aviso "há uma versão nova"?**
    Recomendação: sim, aviso discreto com "Ver o que mudou" e "Atualizar minha cópia" (opcional); nunca atualiza sozinho.

19. **Ao apagar a conta, os treinos realizados somem dos números da academia ou ficam como registros anônimos?**
    Recomendação: ficam anônimos (só contagem, sem nome nem dado de saúde) para o histórico da academia não "encolher" quando alguém sai.

20. **O aluno precisa registrar treino sem sinal de internet dentro da academia?**
    Recomendação: sim, é regra da v1 (R1.24). Muitas academias têm sinal ruim no salão; perder um registro é o jeito mais rápido de o aluno abandonar o app.

21. **Recepção e instrutor são o mesmo papel na v1?**
    Recomendação: sim. Separar só se uma academia precisar que a recepção não monte treino.

22. **Como o dono define o preço do Plus: é um preço único do Academia Plus ou cada academia define o seu?**
    Recomendação: depende de quem cobra ([decidir]). Se a academia cobra, ela define; se é no app, preço único por enquanto.

23. **Qual é o nome do personal na tela: "personal", "treinador" ou "professor"?**
    Recomendação: "personal" — é como o Alex falou e como o aluno de academia fala.

24. **Treino realizado pode ser apagado pelo aluno? Até quando?**
    Recomendação: até 7 dias depois; após isso só a observação é editável, para o histórico da academia não mudar.

25. **A visão da academia precisa funcionar em tablet (recepção com tablet no balcão)?**
    Recomendação: celular primeiro; o sistema de design já prevê largura maior, mas sem telas exclusivas de tablet na v1.

---

## Avisos (P07, agente G, 10/10/2026)

Numeradas com G para não colidir com as perguntas do cronômetro, escritas em paralelo.

G1. **Quem escreve o aviso da academia: dono e recepção, ou o instrutor também?**
    Recomendação: dono e recepção. Se a resposta da pergunta 21 for "recepção e instrutor são um papel só", o instrutor escreve junto, e o dono ganha uma chave "Equipe pode mandar aviso" para desligar.

G2. **O lembrete de treino nasce ligado ou desligado?**
    Recomendação: desligado, com um convite depois do primeiro treino fechado. Ligado por padrão (com os dias da frequência e hora 18:00) seria escolher pelo aluno a hora em que o celular dele toca.

G3. **O horário de silêncio é fixo (22h às 7h) ou o aluno ajusta?**
    Recomendação: fixo na v1. O código já recebe o silêncio como parâmetro; virar campo na tela Avisos é pouco trabalho se alguém pedir (quem treina às 5h, por exemplo).

G4. **"Seu treino está guardado" depois de 10 dias sem treinar (está em `02-design/marca-e-proposta/04-APLICACAO.md`) entra?**
    Recomendação: não na v1. Quem chama o aluno sumido é a academia, com nome e WhatsApp (V1 da revisão B). Se entrar, é local, uma vez por sumiço, na chave do lembrete de treino.

G5. **A academia atualizou um treino pronto que o aluno copiou (pergunta 18): vira notificação?**
    Recomendação: não. Só um cartão no Início ("Há uma versão nova do seu treino"), sem tocar o celular.

G6. **Comentário do personal num treino feito (V10) e retorno semanal (V8), se entrarem, avisam?**
    Recomendação: sim, na chave Personal, e o retorno semanal como lembrete local no dia que o personal escolher.

G7. **Quem recebe o resumo "alunos sem treinar há 14 dias", e a que horas?**
    Recomendação: recepção e dono, às 09:00, ligado; instrutor pode ligar. Uma vez por sumiço, só a contagem na tela bloqueada.

G8. **"Seu Plus vence em 3 dias": para quem?**
    Depende de quem paga (P00). Recomendação: vai para quem cancelou e ainda tem dias (`cancelado_vigente`) e para o Plus que a recepção marcou com data de fim; não vai para a assinatura de loja que renova sozinha (a loja já avisa).

---

## Equipe e checagem final (P10, agente V, 11/10/2026)

26. **Quais especialidades entram na lista fixa da Equipe (R11.3)?** Hoje são as seis que você citou: musculação, funcional, HIIT, reabilitação, idosos, iniciantes.
    Recomendação: manter as seis e acrescentar só o que uma academia real pedir. Um cuidado: "reabilitação" pode ser lida como atividade de fisioterapeuta. Vale perguntar ao CREF ou a um advogado se o rótulo deve ser "retorno após lesão" ou "pós-reabilitação" antes de publicar. Não confirmei a regra.

27. **[decidir] O aluno pode avaliar o profissional (nota, estrela ou comentário)?**
    Recomendação: não na v1. A nota expõe o profissional (uma nota ruim aparece para a academia inteira), cria comparação entre colegas e pede moderação de comentário. Se um dia entrar, que seja privada: só o dono vê, nunca o aluno, e sem número de estrelas.

28. **[decidir] O CREF do perfil é conferido ou só mostrado como a pessoa digitou (R11.2)?**
    Opções: conferir na consulta pública do sistema CONFEF/CREF (manual pelo dono ou automática, se houver como) · mostrar o que a pessoa digitou, com a responsabilidade dela. Não achei uma consulta pública nacional com acesso por programa (busca de 11/10/2026); a consulta parece ser por CREF regional. Recomendação: na v1, o dono confirma o CREF ao aprovar o vínculo da pessoa, e a tela não usa a palavra "verificado". Liga ao R6 da revisão B (CREF como condição para montar treino).
