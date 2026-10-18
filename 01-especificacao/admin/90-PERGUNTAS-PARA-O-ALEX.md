# Perguntas para o Alex: Admin

> Agente AI, 15/10/2026. Cada pergunta tem a recomendação, e nada aqui foi decidido. As que mexem no código entram nas funções como parâmetro obrigatório, sem padrão: o código anda nas duas respostas.

## As que destravam a construção

A1. **Papel "administrativo"**: a recepção pode lançar pagamento no Admin?
- Opções: só o dono · recepção marca mensalidade como paga e cadastra aluno, sem ver resultado, salário e despesas.
- Recomendação: só o dono na primeira entrega. O papel entra quando a academia pedir, e o banco já tem o lugar dele (RA1.3).

A3. **Multa e juros**: a Raça Fight cobra multa e juros de quem atrasa? Se sim, quanto, e com quantos dias de tolerância?
- Recomendação: se cobrar, use multa de 2 % e juros de 1 % ao mês, que são o teto que as fontes citam, com 5 dias de tolerância. Confirme com o contador antes de ligar.
- A Lei 14.905/2024 mudou os juros legais para quem não escreve a taxa no contrato (`01-PESQUISA-E-FONTES.md`, seção 3).

A7. **Primeiro mês**: quem se matricula no dia 21 paga o mês cheio, a parte do mês ou só a partir do mês seguinte?
- Recomendação: o mês cheio, vencendo no dia da matrícula, e o dia de vencimento passa a ser o da matrícula. É o mais simples de explicar no balcão.

A13. **A planilha que vocês usam hoje.** Pode me mandar uma cópia (CSV ou XLSX, pode ser de um mês só)? Também serve uma foto ou print, se for de papel.
- A importação foi testada com uma planilha montada no formato mais comum (título, cabeçalho, entrada e saída em colunas separadas, linha de TOTAL).
- Com a planilha de verdade, o teste passa a usar o arquivo real, e a tela de conferência já vem com as colunas certas.
- Se o contador pede um formato próprio, mande um exemplo também.

A18. **Os planos e os preços reais.** Quais planos a Raça Fight vende (por modalidade, vezes na semana, combo, Kids, trimestral), quanto custa cada um, e se existe taxa de matrícula?
- Os exemplos usam valores inventados.

A19. **Como a equipe é paga hoje.** Fixo, comissão sobre a modalidade, por aula, ou uma mistura? E quem é CLT, MEI ou autônomo?
- O Admin calcula a remuneração e não faz folha de pagamento.

## Cobrança

A2. **O aluno vê as próprias mensalidades no app** (o que pagou, o que vence)?
- Recomendação: sim, só as dele (ou as dos dependentes, para o responsável), sem multa e sem histórico de cobrança. Isso diminui o "quanto eu devo?" no balcão.

A5. **Reajuste de preço**: quando um plano sobe, os matriculados passam a pagar o novo preço na hora, no mês seguinte ou só na renovação?
- Recomendação: no mês seguinte ao aviso, com a data guardada no plano.

A6. **Gerar as mensalidades**: sozinho no dia 1, ou o dono aperta o botão?
- Recomendação: o botão nos primeiros meses (para o dono ver o que sai), e depois a chave "gerar sozinho".

A8. **Desconto de família**: quanto? Vale para irmãos, para pai e filho, para casal?
- Recomendação: 10 % na segunda matrícula e nas seguintes do mesmo pagador. O Admin sugere e o dono aplica.

A9. **"Traga um amiguinho"**: qual é o desconto, por quanto tempo, e vale sempre ou só na promoção? (É a mesma pergunta L26 da especificação de luta.)
- Recomendação: um valor fixo (por exemplo R$ 30) por um mês para cada um, com data de início e fim da promoção.

A10. **Combo**: no relatório por modalidade, o Combo 2 modalidades conta metade para cada uma, ou outra proporção?
- Recomendação: metade e metade. O plano aceita pesos se a academia preferir outra divisão.

A11. **Pagamento parcial** ("pagou metade agora, metade dia 20"): aceita?
- Recomendação: não na primeira entrega. A tela recusa e oferece "Anotar" e "Lembrar" o combinado. Se for comum, entra como dois pagamentos da mesma cobrança.

A20. **Exame de graduação, eventos e produtos**: a academia cobra taxa de exame? Vende kimono, faixa e luvas? Organiza ou leva aluno a campeonato com inscrição paga?
- O Admin já tem cobrança avulsa (exame, evento, produto) e resultado por evento.
- Estoque de produto ficou fora.

A21. **Cobrança automática** (Pix com QR, boleto, cartão recorrente): é para a primeira entrega ou depois?
- Recomendação: depois. Hoje o dono marca como paga. Integrar com um meio de pagamento é um projeto à parte, com taxa e contrato, e muda o "quem paga" do Plus.

## Gestão

A4. **Regime do resultado**: o "lucro do mês" é pelo que entrou de fato (caixa) ou pela mensalidade do mês, paga quando for (competência)?
- Recomendação: caixa, que é como a planilha faz, com o relatório de competência se o contador pedir.

A12. **Comissão com dois professores na mesma modalidade**: cada um recebe sobre o total da modalidade, divide meio a meio, ou divide pelas turmas e presenças de cada um?
- Recomendação: pelas turmas de cada professor, quando a presença (AJ) estiver no ar. Até lá, o dono ajusta à mão.

A14. **Histórico**: guardar para sempre ou por quantos anos?
- Recomendação: 5 anos (prazo comum de guarda de documento fiscal). O contador confirma.

A15. **Retorno da aula experimental**: quantos dias depois da aula o Admin lembra de chamar quem não se matriculou?
- Recomendação: 3 dias.

A16. **Lembrete com hora** marcado para depois das 22:00 ou antes das 07:00: toca, ou segue o horário de silêncio dos outros avisos?
- Recomendação: toca, porque o dono escolheu a hora. O resumo das 08:00 continua no silêncio normal.

A17. **CPF**: guardar o documento do aluno e do responsável?
- Recomendação: não, até uma cobrança (nota fiscal, boleto) exigir. A LGPD pede o mínimo necessário.

A22. **Mais de um dono** (sócio): os dois entram no Admin com a mesma visão?
- O banco já aceita, porque cada um tem o vínculo `dono`. A pergunta é se o histórico precisa separar os dois (ele já separa, por pessoa).

## Arquitetura e nomes

A23. **App separado: web ou loja?** O Admin como **aplicativo web instalável** (abre no PC e no celular, ícone na tela inicial, sem loja), na pasta `admin/` ao lado de `app/`, usando o mesmo domínio e o mesmo Supabase. A alternativa seria um segundo app Expo nas lojas. A comparação está em `03-arquitetura/05-ADMIN.md`.
- Recomendação: o web instalável.

A24. **Nomes reais**: os professores e atletas da Raça Fight autorizam aparecer no Admin e nos exemplos? Até lá, os exemplos usam nomes fictícios.
