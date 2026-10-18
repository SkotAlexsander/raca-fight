# Histórias do Admin

> Agente AI, 15/10/2026. Formato: **como** [quem], **quero** [o quê], **para** [por quê]. "Dono" é quem tem o papel `dono`. As regras citadas (RA…) estão em `03-REGRAS.md`.

## Painel

- **HA1** Como dono, quero abrir o Admin e ver, numa tela, quantos alunos estão matriculados, trancados e inativos, e quantos entraram no mês, para saber o tamanho da academia sem contar na planilha. (RA2)
- **HA2** Como dono, quero ver quantos funcionários tenho, por função (professor, recepção, limpeza), para saber quem está na folha. (RA2)
- **HA3** Como dono, quero ver o que entrou, o que saiu e o resultado do mês, com a comparação com o mês anterior, para saber se estou ganhando. (RA2, RA7)
- **HA4** Como dono, quero ver quanto ainda vou receber e pagar no mês (a previsão), para saber como o mês vai fechar antes de ele fechar. (RA2.4)
- **HA5** Como dono, quero ver quantas pessoas estão devendo e quanto, com um toque para a lista, para cobrar. (RA5)
- **HA6** Como dono, quero ver a evolução dos últimos 12 meses (entrada, saída e resultado), para ver a tendência. (RA2)
- **HA7** Como dono, quero ver no painel os lembretes de hoje, os atrasados e as tarefas vencidas, para não esquecer nada. (RA12)
- **HA8** Como dono, quero ver o funil do mês (contatos, aulas experimentais, matrículas), para saber se a divulgação está trazendo aluno. (RA11)

## Pessoas

- **HA9** Como dono, quero cadastrar um aluno mesmo que ele nunca instale o app, para a planilha inteira caber no Admin. (RA13.1)
- **HA10** Como dono, quero cadastrar uma criança com o responsável, que é quem paga e recebe a cobrança, para o Kids funcionar como funciona de verdade. (RA13.3)
- **HA11** Como dono, quero ver a ficha completa de uma pessoa (contato, matrículas, cobranças, pagamentos, notas, histórico), para resolver tudo de um lugar só. (RA13.2)
- **HA12** Como dono, quero cadastrar funcionários com a função, as modalidades que dão e a remuneração (fixo, comissão, por aula), para calcular a folha. (RA6, RA13.4)
- **HA13** Como dono, quero buscar e filtrar alunos e funcionários e exportar o resultado, para trabalhar a lista no Excel quando eu quiser. (RA10)
- **HA14** Como dono, quero ligar uma pessoa do cadastro à conta dela no app, quando ela tiver uma, para o check-in e a matrícula serem a mesma pessoa. (RA13.5)

## Planos e matrículas

- **HA15** Como dono, quero criar planos por modalidade, combo, Kids e gratuito, com o valor e a periodicidade, para cobrar como a academia cobra. (RA3.1)
- **HA16** Como dono, quero matricular uma pessoa num plano, com o dia de vencimento e os descontos, para a mensalidade sair sozinha. (RA3.2)
- **HA17** Como dono, quero trancar uma matrícula por um período (viagem, lesão), para não gerar cobrança nesse tempo. (RA3.4)
- **HA18** Como dono, quero que o Admin me sugira o desconto de família quando o mesmo responsável paga duas matrículas, para não esquecer de dar. (RA3.7)
- **HA19** Como dono, quero dar o desconto do "Traga um amiguinho" para quem indicou e para quem chegou, com a origem guardada, para a promoção funcionar sem caderno. (RA3.8)

## Financeiro "tipo planilha"

- **HA20** Como dono, quero uma grade de lançamentos com data, descrição, categoria, tipo, valor, forma, pessoa e situação, editável direto na célula, para trabalhar como trabalho no Excel. (RA4)
- **HA21** Como dono, quero colar várias linhas copiadas do Excel na grade, para trazer um mês inteiro de uma vez. (RA4.4)
- **HA22** Como dono, quero desfazer e refazer o que fiz na grade (Ctrl+Z, Ctrl+Y), para errar sem medo. (RA4.5)
- **HA23** Como dono, quero filtrar a grade e ver o total de cada coluna filtrada, para responder "quanto gastei com equipamento este ano". (RA4.3)
- **HA24** Como dono, quero criar, renomear, ordenar e arquivar categorias, para elas serem as minhas. (RA4.6)
- **HA25** Como dono, quero que as mensalidades do mês sejam geradas sozinhas a partir das matrículas, e marcar como paga com um toque, para não digitar 100 linhas por mês. (RA3, RA4.7)
- **HA26** Como dono, quero que aluguel, salários, luz e internet virem linhas pendentes todo mês, para a previsão não esquecer delas. (RA4.8)
- **HA27** Como dono, quero fechar o mês e guardar os números, e que ninguém mude um mês fechado sem reabrir com motivo, para o que eu mostrei ao contador continuar igual. (RA4.10)
- **HA28** Como dono, quero exportar a grade para Excel (CSV), abrindo direito com acento e com o valor como número, para levar ao contador. (RA8.6)
- **HA29** Como dono, quero importar a minha planilha atual (CSV ou XLSX), conferindo as colunas antes de gravar, para não começar do zero. (RA8)
- **HA30** Como dono, quero desfazer uma importação inteira se ela entrou errada, para não apagar linha por linha. (RA8.5)
- **HA31** Como dono, quero lançar a receita e a despesa de um evento ou de uma luta (inscrição, ingresso, viagem, premiação) e ver o resultado de cada evento, para saber se o evento compensou. (RA4.9)
- **HA32** Como dono, quero registrar a venda de produtos (kimono, faixa, luvas), para saber quanto a loja rende. (RA4.6)

## Inadimplência e cobrança

- **HA33** Como dono, quero ver a lista de quem deve, com o valor e há quantos dias, do atraso maior para o menor, para cobrar primeiro quem está há mais tempo. (RA5)
- **HA34** Como dono, quero abrir a conversa de WhatsApp com quem deve, com a mensagem pronta e sem dado de saúde, para cobrar em um toque. (RA5.5)
- **HA35** Como dono, se a academia usar multa e juros, quero que o valor com encargo seja calculado dentro da lei, para não cobrar errado. (RA5.3)

## Relatórios

- **HA36** Como dono, quero relatórios do mês, do ano, por modalidade, por categoria, por professor e por evento, para decidir onde investir. (RA7)
- **HA37** Como dono, quero ver quanto entrou de cada modalidade, com o combo repartido, para saber qual modalidade paga o aluguel. (RA7.2)
- **HA38** Como dono, quero ver a remuneração do mês de cada professor (fixo, comissão sobre a modalidade dele, por aula), para pagar certo. (RA6)

## Filtro total

- **HA39** Como dono, quero cruzar filtros ("alunos de Muay Thai inadimplentes há mais de 30 dias", "quanto entrou de Jiu-Jitsu neste trimestre") e salvar o filtro com nome, para responder na hora o que a planilha não responde. (RA10)

## Funil da aula experimental

- **HA40** Como dono, quero ver quantos interessados chegaram, quantos fizeram a aula experimental e quantos se matricularam, por origem (Instagram, WhatsApp, indicação), para saber de onde vem aluno. (RA11)
- **HA41** Como dono, quero um lembrete de retorno para quem fez a aula experimental e não se matriculou, para chamar a pessoa antes que ela esfrie. (RA11.4)
- **HA42** Como dono, quero matricular um interessado direto da tela do funil, criando a pessoa, a matrícula e (se veio por indicação) os descontos, para não digitar duas vezes. (RA11.3)

## Anotar e lembrar

- **HA43** Como dono, quero anotar qualquer coisa ligada a uma pessoa, a um dia ou a um valor ("combinou pagar dia 20"), e achar depois pela busca, para não depender de papel. (RA12.1)
- **HA44** Como dono, quero lembretes com data, hora, repetição e aviso antes ("vence o aluguel dia 10", "renovar o seguro"), que avisem no meu celular, para não perder prazo. (RA12.2)
- **HA45** Como dono, quero tarefas com prazo e responsável ("trocar o tatame", "comprar luvas"), para organizar a semana. (RA12.4)

## Histórico

- **HA46** Como dono, quero ver quem mudou o quê e quando, em qualquer linha, pessoa ou mês, para saber o que aconteceu sem perguntar. (RA9)
