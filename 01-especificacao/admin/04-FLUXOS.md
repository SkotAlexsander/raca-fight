# Fluxos do Admin

> Agente AI, 15/10/2026. Passo a passo com o que a tela faz e a regra que vale. "→" é ir para outra tela.

## FA1. Primeiro uso: da planilha ao Admin

1. O dono entra com a conta dele (a mesma do app). O Admin confere o vínculo `dono` (RA1.1).
2. **Boas-vindas** com três caminhos: "Importar minha planilha" · "Começar do zero" · "Ver com dados de exemplo".
3. "Começar do zero" pergunta o básico da academia, numa tela só:
   - as modalidades (a Raça Fight já vem com as cinco);
   - os planos e preços;
   - o dia de vencimento mais usado;
   - se a academia cobra multa e juros (A3);
   - a regra do primeiro mês (A7).
4. As categorias iniciais vêm prontas (RA4.6), e dá para editar depois.
5. → Painel.

## FA2. Importar a planilha atual (RA8)

1. Financeiro → Importar. A pessoa arrasta o arquivo (.csv ou .xlsx) ou cola as linhas.
2. O Admin acha o cabeçalho e mostra **cada coluna com o papel proposto**, um seletor para trocar e o exemplo da primeira linha.
3. Embaixo, a **prévia de todas as linhas**, em quatro grupos com contagem:
   - prontas;
   - repetidas (desmarcadas);
   - com aviso;
   - com erro (com o motivo e o número da linha no arquivo).
4. As categorias que não existem aparecem em "Criar estas categorias?", com o tipo. A pessoa aceita, renomeia ou aponta para uma que já existe.
5. "Gravar 128 linhas". Nada é gravado antes disso.
6. Depois de gravar, aparece o aviso "128 linhas importadas · Desfazer a importação". Desfazer fica disponível depois também, em Financeiro → Importações (RA8.5).
7. Fica um registro da importação: o arquivo, as colunas, as contagens, quem fez e quando.

## FA3. Mês corrente: gerar e receber mensalidades (RA3, RA4.7)

1. No dia 1 (ou no botão "Gerar mensalidades de novembro"), o Admin gera as cobranças. Ele mostra "112 geradas · 6 de fora", e o "de fora" abre a lista com o motivo de cada uma.
2. Financeiro → **Cobranças**: a lista do mês, com filtros (a vencer, vence hoje, atrasadas, pagas).
3. Quando alguém paga, o dono toca **"Marcar como paga"**, que abre uma folha com:
   - a data (hoje);
   - a forma (Pix, dinheiro…);
   - o valor (o da cobrança, mais o encargo se a academia usar).

   Ele confirma, a cobrança vira paga e a linha de entrada aparece na grade.
4. Errou? "Desfazer pagamento" arquiva a linha e reabre a cobrança, se o mês não estiver fechado.

## FA4. A grade (RA4)

1. Financeiro → **Lançamentos**: a grade do mês, com a linha de **totais** fixa embaixo (entradas, saídas, resultado, pendentes) e os filtros em cima.
2. "+ Linha" (ou Ctrl+Enter) abre uma linha vazia no topo, com a data de hoje. O cursor fica na descrição.
3. Editar: Enter ou começar a digitar. Enter grava e desce, e o erro aparece na própria célula.
4. Colar: Ctrl+V com as linhas do Excel. A prévia mostra "20 linhas, 2 com erro", e ao confirmar entram as 18 e as 2 ficam marcadas para corrigir.
5. Ctrl+Z e Ctrl+Y desfazem e refazem.
6. Selecionar várias linhas: mudar a categoria, a situação ou a forma de todas, ou arquivar.
7. Exportar: "Exportar o que está na tela" (CSV, RA8.6).

## FA5. Fechar o mês (RA4.10)

1. Financeiro → Fechamento → "Fechar outubro".
2. A folha lista o que está pendurado:
   - "4 linhas pendentes (R$ 1.230,00)";
   - "2 linhas sem categoria";
   - "9 cobranças em aberto";
   - se for o caso, "O mês ainda não terminou".

   Cada item abre a lista.
3. "Fechar assim" ou "Voltar e resolver".
4. Fechado, o mês ganha o selo "Fechado em 03/11 por Alex". A grade daquele mês fica só para leitura.
5. Reabrir pede o motivo. O motivo e quem reabriu vão para o histórico.

## FA6. Cobrar quem deve (RA5)

1. Painel → "7 pessoas devem R$ 1.080,00", ou Pessoas → filtro "Inadimplentes".
2. A lista vem do maior atraso para o menor, com o nome, o valor, os dias e as cobranças.
3. Ações por pessoa:
   - "Cobrar no WhatsApp" abre a conversa com o texto pronto;
   - "Lembrar de cobrar" cria um lembrete;
   - "Anotar" cria uma nota ligada à pessoa;
   - "Marcar como paga".
4. A ação vai para o histórico. A conversa não: ela acontece no WhatsApp, fora do Admin.

## FA7. Funil: do WhatsApp à matrícula (RA11)

1. A pessoa chama no WhatsApp. A recepção (no app da equipe, R19) ou o dono (no Admin) registra o interessado: nome, WhatsApp, modalidade, como conheceu e quem indicou.
2. Marca a aula experimental, numa turma e numa data.
3. No dia, o professor marca presença na chamada e a experimental vira "compareceu".
4. Admin → **Funil** mostra as colunas Interessados · Aula marcada · Fez a aula · Matriculados, com contagens e a conversão por origem.
5. Em "Chamar de volta" aparece quem fez a aula há 3 dias (A15) e não se matriculou. As ações são "Lembrar" (cria o lembrete), "WhatsApp" e "Não seguiu" (com motivo).
6. "Matricular":
   1. cria a pessoa (com o responsável, se for criança);
   2. escolhe o plano e o dia de vencimento;
   3. se veio por indicação, mostra os dois descontos para confirmar (A9);
   4. gera a taxa de matrícula e a primeira mensalidade pela regra do primeiro mês.

## FA8. Anotar e lembrar (RA12)

1. Em qualquer tela: o botão "Anotar" (atalho N) abre uma nota já ligada ao que está aberto (a pessoa, a linha ou o dia).
2. "Lembrar" (atalho L) abre um lembrete com a data, a hora, a repetição e o aviso antes. Os atalhos prontos são:
   - "Todo dia 10" (mensal);
   - "Daqui a 1 semana";
   - "Uma vez por ano".
3. Tela **Agenda**: a coluna do dia (atrasados, hoje, em breve) e o calendário do mês, com as repetições.
4. Concluir um lembrete que repete faz ele andar para a próxima data. Adiar escolhe uma data a partir de hoje.
5. Às 08:00, o celular do dono recebe "Você tem 3 lembretes hoje", sem o texto.

## FA9. Responder uma pergunta com o filtro total (RA10)

1. Pessoas → Alunos → filtros: Modalidade = Muay Thai · Em atraso há mais de 30 dias.
2. Em cima do resultado aparece a frase "Alunos · Muay Thai · em atraso há mais de 30 dias · 2 pessoas · R$ 260,00".
3. "Salvar este filtro" pede o nome, e o filtro aparece na lateral de Pessoas.
4. "Exportar" baixa o CSV.

Outro exemplo: Financeiro → Relatórios → Por modalidade → período "Este trimestre" → Jiu-Jitsu. A resposta é "Entrou R$ 4.320,00 de Jiu-Jitsu (o combo conta a metade)".

## FA10. Ver o que mudou (RA9)

1. Em qualquer linha, pessoa ou mês: o menu "Histórico" mostra as mudanças daquela coisa, em frase e da mais nova para a mais velha.
2. A tela **Histórico** tem tudo, com filtro por tabela, por quem mudou e por período.
