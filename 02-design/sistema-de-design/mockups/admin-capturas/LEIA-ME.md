# Capturas das telas do admin (agente AK, 15/10/2026)

As imagens saem de `../admin.html`. Cada `<section class="ad-quadro" data-captura="…">` vira um PNG do tamanho exato da janela. Para refazer tudo (cerca de 1 minuto):

```
node "02-design/sistema-de-design/mockups/admin-capturas/capturar.mjs"
node "02-design/sistema-de-design/mockups/admin-capturas/capturar.mjs" --so=painel,financeiro
```

## Os nomes

| Sufixo | Janela | Tema |
|---|---|---|
| `-pc.png` | 2040 × 790 (o monitor do Alex) | escuro (o principal) |
| `-pc-claro.png` | 2040 × 790 | claro |
| `-celular.png` | 390 × 844 | escuro |
| `-celular-claro.png` | 390 × 844 | claro |

**Cópias com o nome do PDF.** O PDF do AR (`docs/apresentacao/admin/capturar.mjs`) acha cada tela pela palavra do id dele no nome do arquivo. Quando o id é outro, o script grava também `<id>-pc.png` e `<id>-celular.png`, só no tema escuro. Exemplo: `alunos-pc.png` é a mesma imagem que `pessoas-pc.png`. O id fica no `data-tela` de cada quadro.

## As telas

| Captura | Id no PDF (AR) | PC | Celular | O que mostra |
|---|---|---|---|---|
| `painel` | painel | ✓ | ✓ | Cabe em 2040 × 790 sem rolar. Alunos e equipe; o resultado até hoje com a **previsão do fechamento ao lado**; a comparação **no mesmo período** (1 a 15/09 × 1 a 15/10) e setembro inteiro; 12 meses; previsão por partes; quem deve; funil; hoje |
| `financeiro` | lancamentos | ✓ | ✓ | A planilha: a célula em edição, 3 linhas selecionadas com a soma, as mensalidades geradas com "Marcar como paga", os totais por coluna fixos embaixo e o aviso com "Desfazer". No celular vira lista por dia |
| `financeiro-colar` | colar | ✓ | — | 20 linhas coladas do Excel: 18 prontas e 2 com erro (data que não existe, valor ambíguo). Nada é gravado antes de confirmar |
| `financeiro-fechado` | fechamento | ✓ | — | Setembro fechado, com o cadeado: só leitura, totais congelados, e o aviso "nada foi mudado" ao tentar editar |
| `financeiro-folha` | — | — | ✓ | O celular: editar o lançamento numa folha que sobe |
| `cobrancas` | cobrancas | ✓ | ✓ | As cobranças do mês, com a gaveta "Marcar como paga" aberta |
| `despesas-fixas` | despesas-fixas | ✓ | ✓ | O que se repete todo mês, com luz e água "estimado" |
| `importar` | importar | ✓ | ✓ | Conferir colunas: o papel de cada coluna, a prévia em grupos e "Criar estas categorias?" |
| `exportar` | exportar | ✓ | ✓ | O CSV para o Excel em português, com a prévia de como abre |
| `pessoas` | alunos | ✓ | ✓ | Os filtros cruzados à esquerda, a frase do filtro e a tabela |
| `filtro` | filtro | ✓ | ✓ | O filtro total aberto ("Muay Thai · em atraso há mais de 30 dias · 3 pessoas") |
| `ficha-aluno` | — | ✓ | ✓ | A ficha completa de um aluno |
| `ficha-kids` | — | ✓ | ✓ | O responsável Kids, com 2 dependentes e o desconto de família |
| `ficha-funcionario` | funcionarios | ✓ | ✓ | A equipe com a remuneração do mês calculada e a ficha de uma professora |
| `inadimplencia` | inadimplencia | ✓ | ✓ | Quem deve, do maior atraso para o menor, e a mensagem pronta do WhatsApp |
| `relatorios` | relatorio-modalidade | ✓ | ✓ | Por modalidade (o combo conta a metade), por professor e por evento |
| `relatorio-ano` | relatorio-ano | ✓ | ✓ | Os 12 meses, em gráfico e em tabela |
| `funil` | funil | ✓ | ✓ | As quatro colunas, "Chamar de volta" e a conversão por origem |
| `agenda` | agenda | ✓ | ✓ | Hoje (atrasados, hoje, em breve), o calendário e as tarefas |
| `notas` | — | ✓ | ✓ | As notas fixadas e as mais novas |
| `historico` | historico | ✓ | ✓ | Quem mudou o quê, em frase |
| `busca` | — | ✓ | ✓ | A busca global aberta sobre o painel ("lima") |
| `estados` | — | ✓ | ✓ | Os estados: carregando, vazio, erro e sem conexão, salvando, sem permissão |
| `sem-permissao` | — | ✓ | ✓ | A tela inteira para quem não é dono |

Todos os nomes de pessoas são fictícios e todos os valores são de exemplo. O logo é o provisório do AL.
