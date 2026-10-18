# AR — PDF do admin (P13, 15/10/2026)

> Agente AR. Entrega: `docs/apresentacao/admin/saida/Raça Fight — Admin.pdf` (**27 páginas, 2,0 MB, A4 deitado**), com cópia em `A:\Projetos\Academia Plus\Raça Fight — Admin.pdf`. Para o dono da Raça Fight, que não é técnico. Não mexi em `app/`, `01-especificacao/`, `02-design/` nem em `docs/apresentacao/` fora de `admin/`.

## 1. As páginas

| p. | Página | O que mostra |
|---|---|---|
| 1 | Capa | Logo provisório do AL, "O painel do dono", foto `raca-14` (cadarço da bota de boxe, sem rosto) |
| 2 | Em uma página | O que muda no dia do dono, o aviso sobre os números de exemplo, o sumário com página |
| 3 | Três apps, um banco só | Aluno, professor/recepção e Admin, o que cada um vê; "o professor nunca vê valor" |
| 4 | Hoje a planilha, amanhã o painel | O problema em uma página, com 5 números calculados |
| 5 | Painel | Esboço do painel em 3 colunas + "por que negativo no dia 15" |
| 6 | Alunos e responsáveis (Kids) | Lista + ficha de uma família com 2 crianças e desconto de família |
| 7 | Equipe e pagamento | Tabela da equipe com o ganho de setembro calculado; folha do professor fixo + comissão |
| 8 | A grade | Lançamentos de outubro, célula em edição, totais fixos |
| 9 | Escrever, colar, desfazer | O que se digita e como fica; prévia de colar 5 linhas (1 com erro); desfazer |
| 10 | Mensalidade sozinha | Geração de outubro, abas por situação, "marcar como paga" |
| 11 | Despesa fixa e fechar o mês | Novembro a pagar (luz/água estimadas); meses fechados; pendências antes de fechar outubro |
| 12 | Cobrança e inadimplência | Quem deve, mensagem de WhatsApp pronta, multa e juros **se** decidirem |
| 13 | Importar | Colunas detectadas e prévia (lidas, prontas, repetidas, com erro, categoria nova) |
| 14 | Exportar | O CSV como o Excel abre, com SOMA do "Valor (±)" |
| 15 | Relatórios: o ano | Entradas e saídas dos 12 meses e o resultado |
| 16 | Onde está o dinheiro | Por modalidade (set. e jul–set), por professor, por evento, por forma |
| 17 | Filtro total | 6 perguntas e as respostas calculadas |
| 18 | Funil | Ago–15/out por origem, "chamar de volta", "Traga um amiguinho" |
| 19 | Agenda, notas e lembretes | Hoje/em breve, tarefas, notas, aviso das 8h sem texto |
| 20 | Histórico | Mudanças em frase, mais novas primeiro |
| 21 | Quem vê o quê | Matriz aluno · professor · recepção · dono; A1, A2, A22 |
| 22 | Segurança e LGPD | Em linguagem de dono |
| 23 | Quanto custa | Os três degraus, recomendação no do meio |
| 24 | O que se paga e para quem | Itens do recomendado; "duas contas diferentes" (desenvolvimento à parte) |
| 25 | Sete respostas que destravam | A13, A18, A19, A7, A3, A1, A23 em perguntas simples |
| 26 | Contas, contrato e privacidade | Nome das contas, advogado e DPA, encarregado, volta no tempo, A24, logo |
| 27 | Próximos passos | 5 etapas; o prazo de cada uma a combinar quando as respostas chegarem (não havia prazo em nenhum documento, e não inventei) |

## 2. De onde vem cada número

**Nenhum valor foi digitado à mão.** `docs/apresentacao/admin/dados.mjs` monta uma Raça Fight de exemplo e roda 13 meses (out/2025 a 15/10/2026) pelas funções de `app/dominio/financeiro/`, com semente fixa (rodar de novo dá os mesmos números). Saída: `_dados/dados.json`.

- **Cadastro**: 150 veteranos + entradas mensais + saídas; 4 professores e 2 funcionários fictícios; planos e preços de `exemplo.ts` (**valores de exemplo**). Nomes inventados, sem nenhum nome ou sobrenome das pessoas reais do Instagram (filtro no script).
- **Mensalidades**: `gerarMensalidadesDoMes` com `primeiroMes: 'cheio'` (a recomendação da A7, ainda [decidir]); pagamento por `marcarComoPaga` com perfil de pagador sorteado; 5 devedores escolhidos.
- **Despesas**: `gerarDespesasFixasDoMes` (luz e água com valor real nos meses passados, média de 3 meses em novembro); remuneração pelo `calcularRemuneracaoDoMes`, lançada no dia 5; DAS de 6 % (exemplo).
- **Painel (p. 4–5)**: `resumoDoPainel` em 2026-10, hoje = 15/10.
- **Fechamentos (p. 11)**: `fecharMes` de nov/25 a set/26; `pendenciasAntesDeFechar` de outubro.
- **Inadimplência (p. 12)**: `listarInadimplentes`, `taxaDeInadimplencia`; encargos por `calcularEncargos` com 2 % / 1 % ao mês / 5 dias, validados por `validarRegraDeAtraso` (só ilustração da A3).
- **Grade (p. 8–9)**: `editarCelula` e `colarNaGrade` com as entradas mostradas.
- **Importar/exportar (p. 13–14)**: `lerCSV` → `acharCabecalho` → `detectarColunas` → `conferirImportacao` sobre `_dados/planilha-de-exemplo.csv` (linhas de setembro + título, TOTAL, data 31/09 e valor "a combinar"); `exportarLancamentos`.
- **Relatórios e filtros (p. 15–17)**: `evolucaoDoAno`, `quantoEntrouPorModalidade`, `resultadoPorEvento`, `somarPor`, `linhasDeAlunos` + `filtrarAlunos`, `quantoEntrou`, `filtrarLancamentos`.
- **Funil (p. 18)**: `conversaoDoFunil`, `retornosPendentes` (3 dias, proposta A15), `descontosDaIndicacao` (R$ 30 até 30/11, exemplo da A9).
- **Agenda e histórico (p. 19–20)**: `lembretesDoDia`, `tarefasAbertas`, `registroDeMudanca` + `descreverRegistro`.
- **Custo (p. 23–24)**: lido direto de `docs/hospedagem/custos.json` (AQ).

Conferências cruzadas que batem: modalidades de setembro somam o total que entrou (R$ 25.867,00); a base da comissão de cada professor é a linha da sua modalidade; o funil por origem soma o total; a SOMA do CSV de exemplo bate com as linhas.

## 3. O que é provisório

- **Telas**: todas as 17 são **esboços em HTML** (o AK ainda não entregou). Cada uma tem a legenda "Esboço da tela".
- **Logo**: o SVG provisório do AL (`02-design/marca-e-proposta/logo-raca-fight/`), avisado na capa e na p. 26.
- **Preços, regras de pagamento da equipe, regra do primeiro mês, multa/juros, desconto de indicação**: todos de exemplo, à espera das respostas da p. 25.

## 4. Como refazer (de dentro de `docs/apresentacao/admin/`)

```
node capturar.mjs   # fotos, logo e, quando houver, as telas do AK em _capturas/
node montar.mjs     # recalcula dados.mjs, gera admin.html e o PDF, confere e copia para A:\Projetos\Academia Plus\
node folhear.mjs    # cada página em PNG em _capturas/_pdf/ (e contato.png)
```

O `montar.mjs` para com aviso se: o corpo de uma página passa da altura, um quadro corta texto, a letra sai da escala 13·16·20·25·31·39·49·61, uma imagem não abre, o número de páginas do PDF difere do montado, ou passa de 20 MB. A versão entregue sai **sem nenhum aviso**. Chromium: o `navegador.mjs` cai no headless shell 1234 se o 1243 não abrir.

**Trocar os esboços pelas telas do AK**: quando houver PNG/JPG em `02-design/sistema-de-design/mockups/admin-capturas/` cujo nome contenha a palavra da tabela `TELAS` do `capturar.mjs` (painel, alunos, funcionarios, lancamentos, colar, cobrancas, despesas-fixas, fechamento, inadimplencia, importar, exportar, relatorio-ano, relatorio-modalidade, filtro, funil, agenda, historico), ou, sem arquivo, um elemento `[data-tela="<id>"]` em `mockups/admin.html`, o `capturar.mjs` copia para `_capturas/telas/<id>.png|jpg` e o `montar.mjs` usa a captura no lugar do esboço. Se o AK usar outros nomes, mude só a tabela. As capturas terão outra proporção: confira as páginas no `folhear.mjs` e ajuste a `altura` do quadro em `paginas.mjs` se preciso. `ESBOCOS=1` volta aos esboços. **Logo novo**: troque os SVGs na pasta do AL e rode o `capturar.mjs`.

## 5. Achados para outros agentes

1. **Comparação do painel no meio do mês** (`compararPeriodos` em `resumoDoPainel`): compara outubro até o dia 15 com setembro inteiro e dá "−30,94 %" nas entradas. Engana o dono. Sugestão ao AK/AM: comparar com o mesmo dia do mês anterior, ou só mostrar a comparação com o mês fechado. No PDF mostrei "setembro fechou em R$ 6.695,63", sem percentual.
2. **Frase do histórico** (`descreverRegistro`): o fechamento sai "Você fechou o fechamento em…", e campos sem rótulo aparecem crus (`trancadaAte`, `lancamentoId`, `valorPagoCentavos`). Ficaram fora do PDF; vale completar `ROTULOS` e tratar a tabela `fechamentos` ("fechou setembro").
3. **Descrição da mensalidade** (`gerarMensalidadesDoMes`): "Boxe 2× — 2026-10". Na tela do esboço troquei por "· outubro"; o CSV exportado ainda sai com "2026-10" (dito na legenda da p. 14).
4. O resultado do mês fica **negativo até o meio do mês** no exemplo (aluguel, salários e comissões saem cedo). Virou argumento a favor da previsão (p. 4–5), mas o AK deve dar à previsão o mesmo peso visual do resultado.


---

## 6. Versão com as telas do AK (15/10/2026, à tarde)

**29 páginas, 2,9 MB.** A versão de esboços ficou guardada em `docs/apresentacao/admin/saida/versoes/Raça Fight — Admin (esbocos 15-10).pdf`; a nova foi copiada de novo para `A:\Projetos\Academia Plus\`.

**O que mudou**
- As 17 telas agora são as capturas reais do AK (`02-design/sistema-de-design/mockups/admin-capturas/<id>-pc.png`, tema escuro, 2040 × 790). O `capturar.mjs` passou a preferir o `<id>-pc.png` exato e, só sem ele, cai no claro ou no celular.
- **Recorte em vez de redução**: cada quadro mostra só a área que interessa, com a letra legível no A4. Os recortes estão em `paginas.mjs`, na chamada `tela(id, [[[x, y, largura, altura], larguraNaPágina]])`, em pixels da prévia de 2000 px (× 1,02 = pixel da captura). A lista de cobranças, que na captura fica escurecida atrás da gaveta, aparece clareada, e a legenda diz isso.
- Legenda nova em todas: "Tela do Admin (protótipo). Nomes e valores de exemplo."
- Duas páginas novas: a despesa fixa e o mês fechado ganharam uma página cada (antes dividiam uma); e entrou **"O motor que faz as contas já existe"** (p. 22).
- **Números**: as telas do AK usam o exemplo dele (por exemplo, 186 matriculados, 11 devedores com R$ 1.690,00, outubro em R$ 8.467,60), e o meu `dados.mjs` usa outro (181, 14 com R$ 2.748,00, −R$ 1.083,45). Para o texto não brigar com a captura, tirei das páginas de tela todo número do motor; elas só descrevem o que a captura mostra. Os números calculados pelo domínio ficaram na p. 22, com a caixa "Por que os números não são os das telas". O rodapé dessa página diz "calculados pelo motor do financeiro"; nas outras, só "Valores de exemplo e nomes inventados". As exceções: as edições da p. 9 ("160 → R$ 160,00") e a conta de multa e juros da p. 13, que vêm do motor e estão marcadas como tal.
- Saíram as desculpas pelos três problemas do domínio: não há mais "−30,94 %", "2026-10" nem frase torta do histórico no PDF. As telas mostram a comparação no mesmo período, o mês por extenso e o histórico em frase. **O domínio ainda gera os três** (AK-ADMIN-TELAS.md, seção 4, para o AM).
- A p. 4 ("Hoje a planilha, amanhã o painel") ficou sem números; os próximos passos marcam as telas como feitas.
- A versão com esboços continua reproduzível: `paginas-esbocos.mjs` é a cópia do roteiro antigo (para usar, troque o import no `montar.mjs`).

**Conferência**: as 29 páginas foram renderizadas e vistas como imagem; o `montar.mjs` sai sem nenhum aviso (o recorte é ignorado na checagem de "sai da página", porque a imagem é cortada de propósito).

**Novas páginas**: 1 capa · 2 em uma página · 3 três apps · 4 o problema · 5 painel · 6 alunos · 7 equipe · 8 planilha · 9 colar · 10 mensalidades · 11 despesa fixa · 12 mês fechado · 13 inadimplência · 14 importar · 15 exportar · 16 ano · 17 onde está o dinheiro · 18 filtro · 19 funil · 20 agenda · 21 histórico · 22 o motor · 23 quem vê o quê · 24 segurança e LGPD · 25–26 custo · 27–28 decidir · 29 próximos passos.

**Provisório ainda**: o logo (SVG do AL) e todos os valores (preços, regras de pagamento, multa e juros) até as respostas da p. 27.
