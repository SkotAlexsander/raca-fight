# Mapa de telas do Admin

> Agente AI, 15/10/2026. O desenho é da onda 2 (agente AK, `02-design/sistema-de-design/mockups/admin.html`). Aqui fica **o que** cada tela mostra e faz, e como ela se arruma no PC e no celular.

## Princípios da interface (diferente do app do aluno, de propósito)

- **PC primeiro.** A medida de revisão é 2040 × 790 (o monitor do Alex): largura sobrando e **pouca altura**. A tela não depende de rolar para mostrar o essencial. O cabeçalho tem uma linha só, e a tabela ocupa a altura que sobra e rola por dentro, com o cabeçalho e os totais fixos.
- **Densa e organizada**: tabela, filtro e número. A linha da grade tem 36 a 40 px no PC, sem foto de fundo e sem vidro sobre o dado. A marca da academia (vermelho `#C42024`, preto e branco) fica no cabeçalho e nos destaques.
- **Um destaque por tela** continua valendo (o resultado do mês no painel, o total na grade). A escala tipográfica fechada do projeto continua (13 · 16 · 20 · 25 · 31…). A tabela usa 13 e 16.
- **Teclado** em tudo o que é de planilha: setas, Enter, Tab, Esc, Ctrl+Z, Ctrl+Y, Ctrl+V, Ctrl+F (busca), N (nota), L (lembrete), "/" (filtro).
- **Celular**: as mesmas telas, em lista. A grade vira cartões com edição numa folha. O painel vira uma coluna. O que é de teclado (colar várias linhas, importar) fica "melhor no computador", mas funciona.
- **Número sempre com unidade** ("R$ 1.230,00", "35 dias"). Negativo com sinal e cor, nunca só cor.

## Navegação

Barra lateral (no PC) ou barra de baixo com "Mais" (no celular):

1. **Painel**
2. **Pessoas**: Alunos · Funcionários · Responsáveis
3. **Financeiro**: Lançamentos · Cobranças · Despesas fixas · Fechamento · Importar · Importações
4. **Relatórios**
5. **Funil**
6. **Agenda** (lembretes e tarefas) e **Notas**
7. **Histórico**
8. **Ajustes**: Academia · Modalidades · Planos · Categorias · Regras de cobrança · Filtros salvos

No celular, a barra de baixo tem Painel · Pessoas · Financeiro · Agenda · Mais.

## Telas

| Tela | Objetivo | Mostra | Ações |
|---|---|---|---|
| **Painel** | A academia em números, numa tela. | No PC, 3 colunas que cabem em 790 de altura. **Esquerda**: alunos (matriculados em destaque, trancados, inativos, novos no mês) e funcionários por função. **Centro**: o mês (entrou, saiu, **resultado** como o destaque da tela, pendentes), a comparação com o mês anterior e as barras dos 12 meses. **Direita**: a previsão, os inadimplentes (pessoas e valor), o funil do mês e "Hoje" (lembretes e tarefas). | Cada número abre a lista filtrada · trocar o mês · "Gerar mensalidades" se ainda não gerou |
| **Pessoas › Alunos** | Achar e filtrar qualquer aluno. | Tabela com nome, telefone, situação, planos, modalidades, responsável, em atraso e dias de atraso. Filtros à esquerda (RA10.1), com os salvos em cima. A frase do filtro sobre a tabela. | Buscar · filtrar · salvar o filtro · exportar · "+ Aluno" · abrir a ficha |
| **Ficha da pessoa** | Tudo de uma pessoa num lugar. | Contato, responsável ou dependentes. Matrículas (plano, início, dia de vencimento, descontos com a origem, situação). Cobranças e pagamentos. Notas, lembretes, tarefas e histórico. Presença e faixa em números (AJ). | Editar · matricular · trancar · encerrar · cobrar no WhatsApp · anotar · lembrar · ligar à conta do app |
| **Pessoas › Funcionários** | A equipe e a folha. | Tabela com nome, função, modalidades, remuneração, desde e a **remuneração do mês calculada** (RA6). | Filtrar · "+ Funcionário" · desligar · lançar a remuneração como saída |
| **Financeiro › Lançamentos** | A planilha. | A grade (RA4.1) com os totais fixos embaixo; filtros em cima (período, tipo, categoria, modalidade, forma, pessoa, situação, evento, texto); o selo "Fechado" no mês fechado. | Editar na célula · "+ Linha" · colar · desfazer e refazer · selecionar várias · arquivar · exportar · histórico da linha |
| **Financeiro › Cobranças** | O que se tem a receber. | A lista do mês com a situação calculada (a vencer, hoje, atrasada, paga, cancelada), a pessoa (e o aluno, se for Kids), o valor, o desconto e a repartição. | Gerar o mês · marcar como paga · desfazer pagamento · cancelar · cobrança avulsa (exame, evento, produto) · cobrar no WhatsApp |
| **Financeiro › Despesas fixas** | O que se repete todo mês. | Lista com descrição, categoria, valor (e "variável: média de 3 meses"), dia, pessoa (salário) e período. | "+ Despesa" · editar · desligar · "Lembrar todo mês" (RA12.5) |
| **Financeiro › Fechamento** | Fechar e reabrir os meses. | A lista dos meses, com fechado ou aberto, os totais congelados e quem e quando fechou ou reabriu. | Fechar (folha de pendências) · reabrir (com motivo) |
| **Financeiro › Importar** | Trazer a planilha. | O passo de colunas e a prévia em grupos (FA2). | Trocar o papel de uma coluna · criar as categorias · gravar |
| **Financeiro › Importações** | O que já entrou por arquivo. | Lista com o arquivo, a data, quem fez, as contagens e o estado. | Ver as linhas · desfazer |
| **Relatórios** | Responder "onde está o dinheiro". | Abas: Mês · Ano · Por categoria · Por modalidade · Por forma · Por professor · Por evento · Inadimplência · Funil. Gráfico em uma cor e tabela ao lado. | Período · exportar |
| **Funil** | Do contato à matrícula. | Quatro colunas com contagem (Interessados · Aula marcada · Fez a aula · Matriculados) e a conversão por origem em tabela. "Chamar de volta" em destaque. | "+ Interessado" · marcar aula · matricular (FA7) · lembrar · WhatsApp · não seguiu |
| **Agenda** | Não esquecer nada. | Coluna "Hoje" (atrasados, hoje, em breve), calendário do mês com as repetições, e as tarefas abertas. | "+ Lembrete" · "+ Tarefa" · concluir · adiar |
| **Notas** | O caderno do dono. | As fixadas primeiro, a busca, e o filtro por pessoa e por período. | "+ Nota" · fixar · arquivar |
| **Histórico** | Quem mudou o quê. | Lista em frase, da mais nova para a mais velha, com filtro por tabela, pessoa e período. | Abrir a coisa mudada |
| **Ajustes › Planos** | Os planos e preços. | Tabela com nome, modalidades, vezes por semana, periodicidade, valor, taxa e pesos do combo. | "+ Plano" · editar · arquivar |
| **Ajustes › Regras de cobrança** | As escolhas [decidir] da academia. | Regra do primeiro mês (A7), multa e juros (A3, com o limite legal escrito), dias para o retorno da experimental (A15), desconto de família (A8) e de indicação (A9), e o número do WhatsApp. | Editar (cada mudança vai ao histórico) |
| **Ajustes › Categorias** | As categorias. | Entradas e saídas, em ordem. | Criar · renomear · ordenar · arquivar |

## Estados que toda tela tem

O mesmo padrão do app (decisão de 11/10, AH):
- **carregando**: esqueleto depois de 300 ms;
- **erro**: com "Tentar de novo";
- **vazio**: com caminho, por exemplo "Nenhuma cobrança em outubro · Gerar mensalidades".

**Sem rede**, o Admin não escreve. Ele avisa "Sem conexão: nada foi gravado" e mantém a edição na tela. O dado financeiro não entra em fila offline (`03-arquitetura/05-ADMIN.md`).
