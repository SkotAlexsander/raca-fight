# AO — Bugs e melhorias do Admin (P12, onda 4, 16/10/2026)

> Agente AO. Escrevi em `admin/` (menos `admin/supabase/`) e em `app/dominio/financeiro/`. Não mexi no resto de `app/`, em `02-design/` nem no SQL. Em `docs/` escrevi só este relatório e uma entrada no fim de `decisoes.md`. Nomes fictícios em todos os testes. Nenhum dado financeiro vai para log, e nenhum `.env` foi lido.
>
> No meio da onda chegaram os **pedidos do AU** (`AU-INTEGRACAO.md`, seção 4, Admin). Eles estão na seção 3.

## 1. Em uma frase

Achei e corrigi **9 bugs graves**, de dinheiro que some ou duplica, e **cerca de 30 médios e pequenos**, cada um com o teste antes. Fiz a planilha agir como o Excel em 7 pontos (colar uma coluna, Delete, Ctrl+D, clicar noutra célula…). O pacote JS caiu de **762 para 411 kB**. Atendi os pedidos do AU, com a tela nova de **Turmas e horários**.

## 2. Achados

Gravidade: **G** grave (dinheiro errado, perdido ou duplicado) · **M** média (resultado errado ou trabalho perdido) · **P** pequena (atrito ou acabamento). Os testes estão em `app/dominio/financeiro/revisao-ao.test.ts` (D), `admin/src/componentes/revisao-ao.test.tsx` (T), `admin/src/dados/local/repositorio-local.test.ts` (L), `admin/src/dados/supabase/repositorio-supabase.test.ts` (S), `admin/src/util/datas-digitadas.test.ts` (U) e `admin/e2e/responsivo.spec.ts` (E).

| # | G | Onde (arquivo:linha) | O que era | O que fiz | Teste |
|---|---|---|---|---|---|
| 1 | **G** | `admin/src/dados/local/repositorio-local.ts:65` | Duas escritas ao mesmo tempo liam a mesma cópia, e **a segunda apagava a primeira**. Bastava um Enter rápido em duas células, ou o duplo clique em "Confirmar pagamento" | Uma fila: cada escrita espera a anterior e lê os dados já mudados | L: 3 casos. **Morde**: com o código antigo, os 3 caem |
| 2 | **G** | `admin/src/dados/local/repositorio-local.ts:288` | A mesma importação mandada duas vezes (duplo clique em "Gravar 40 linhas") **gravava duas vezes** | O repositório confere as repetidas de novo com o que existe agora, e o botão desliga enquanto grava (`useEnvio`) | L. Morde |
| 3 | **G** | `admin/src/estado/envio.ts` (novo), aplicado em pagar, colar, lote, importar, fechar e reabrir, desfazer pagamento, gerar mensalidades e despesas, matricular, nota, lembrete, concluir | O duplo clique gravava duas vezes. No lembrete mensal, concluir duas vezes **pulava dois meses** | Um envio por vez: o segundo clique é ignorado e o botão fica desligado | T (`useEnvio`) |
| 4 | **G** | `admin/src/componentes/lista-celular.tsx:65` + `app/dominio/financeiro/grade.ts:158` | No celular, "-20" com o seletor em "Entrada" virava **entrada de 20**, ao contrário do que a ajuda da tela promete. A categoria também trocava o tipo sem avisar | `editarLinhaInteira` aplica tipo → valor → categoria; categoria do outro tipo é erro no campo dela | D: 3 casos |
| 5 | **G** | `admin/src/telas/DespesasFixas.tsx:110` | "Conferir a conta" abria a **regra** da despesa: o valor real da luz ia para os meses seguintes, e a linha estimada do mês continuava com o valor errado na planilha | Gaveta nova: muda o valor da LINHA do mês e tira o "estimado". A coluna e o total mostram o valor do mês (pendência 6 do AM1) | tsc + capturas |
| 6 | **G** | `app/dominio/financeiro/grade.ts:53, 129` | Trocar o tipo ou digitar "-20" numa linha com categoria do outro tipo deixava a linha **impossível de gravar**: o repositório recusava, com um aviso solto. Na colagem, a linha com categoria de entrada e tipo Saída derrubava **a colagem inteira** | Na célula, trocar o tipo tira a categoria (o "-20 vira saída" do RA4.3 continua valendo). Na colagem, a categoria vai por último e o conflito vira erro na coluna dela | D: 4 casos + o teste antigo do RA4.3 |
| 7 | **G** | `admin/src/componentes/pagar.tsx:37, 45` | Pagamento com data **futura** entrava no caixa. "1500" no lugar de "150" passava calado | A data não passa de hoje. O valor acima do esperado pede um segundo clique ("Confirmar o valor maior") | e2e (o caminho certo segue igual) |
| 8 | **G** | `admin/src/telas/Ficha.tsx:198` | "Marcar as N como pagas" era uma por uma: se a do meio falhava, **metade ficava paga** | `marcarComoPagas`: todas ou nenhuma (local) e `marcar_como_pagas` (Supabase) | L, S |
| 9 | **G** | `admin/src/telas/Funil.tsx:202` | Matricular do funil eram 5 gravações em sequência: uma falha deixava a pessoa sem matrícula | `matricularInteressado`: uma transação (local) e `matricular_interessado` (Supabase) | L (matrícula inválida não deixa nada), S |
| 10 | M | `admin/src/componentes/basicos.tsx:86` | A gaveta **roubava o foco**: cada "Salvando…" ou aviso que sumia redesenhava a tela, e o cursor pulava para o primeiro campo no meio da digitação | `aoFechar` num ref; o efeito roda uma vez | T |
| 11 | M | `admin/src/telas/Lancamentos.tsx:87` + `filtros.ts:204` | As cobranças abertas da planilha ignoravam o filtro: o texto não tirava o acento, a categoria **Mensalidades escondia** as mensalidades abertas, e valor e pessoa não valiam | `cobrancaPassaNoFiltro`: o mesmo filtro das linhas | D: 3 casos |
| 12 | M | `admin/src/telas/Lancamentos.tsx:64` | Ao trocar de mês, as linhas marcadas continuavam marcadas: o lote dizia "3 selecionadas" com soma zero, e o **Delete arquivava linhas** que não estavam na tela | A troca de mês limpa as marcadas, a colagem e o rascunho; o lote conta só as visíveis | revisão + T |
| 13 | M | `admin/src/telas/Lancamentos.tsx:172, 36` | A frase do filtro escondia a forma, o texto e as arquivadas (o total "errado" era um filtro esquecido). Depois de tirar um chip, a tela vazia dizia "o filtro escondeu tudo" mesmo sem filtro | Um chip por critério; `filtroAtivo`; "Limpar o filtro" na tela vazia | revisão |
| 14 | M | `app/dominio/financeiro/importacao.ts:226, 269` | A planilha "Data · Aluno · Valor" (sem descrição e sem tipo) entrava **toda com erro** | A descrição vem da categoria e da pessoa, com aviso; a tela pergunta "as linhas sem tipo são entradas ou saídas?" | D: 5 casos |
| 15 | M | `dinheiro.ts:41`, `datas.ts:160` | "+150,00", "150,00 D", "05/10/2026 14:30" e "2026-10-05T14:30" (extrato, maquininha) não eram lidos | Lidos; o que é ambíguo continua recusado | D: 6 casos |
| 16 | M | `importacao.ts:216` | A linha "TOTAL" escrita na 1ª coluna virava erro de data | Sai, como o total na descrição | D |
| 17 | M | `grade.ts:81` | "eventos" não achava categoria (existe uma de entrada e outra de saída) | No empate, vale a do tipo da linha | D |
| 18 | M | `Grade.tsx:194` | O cursor esperava o servidor (250 ms) para andar; as setas apertadas nesse meio-tempo andavam a partir da célula velha. O blur que chega depois do Enter podia gravar de novo | A conferência é síncrona (do domínio) e o cursor anda na hora; a edição já gravada não grava de novo | T + e2e |
| 19 | M | `admin/src/estado/hoje.ts:13` | O "hoje" era lido uma vez: o app instalado, aberto de um dia para o outro, ficava em ontem (lembrete de hoje como "em breve") | `useHoje`: confere a cada minuto e quando a janela volta ao foco | revisão |
| 20 | M | `admin/src/componentes/anotar.tsx:72`, `util/datas-digitadas.ts` | "10/01" digitado em dezembro virava um lembrete **já atrasado**; o lembrete aceitava data passada; a tarefa e o adiar não aceitavam "20/10" | `lerDataDigitada` num lugar só: "hoje", "amanhã", "20", "20/10"; o lembrete vai para a próxima vez que o dia chega e recusa o passado | U: 2 casos |
| 21 | M | `app/dominio/financeiro/historico.ts:87, 133` | O histórico do Supabase (campos em snake_case) e as 18 tabelas novas do AU saíam "um registro de…" ou "Valor centavos: 15000" | Rótulos e formato para o campo do banco; nomes das tabelas novas; verbo "anulou" | D: 3 casos |
| 22 | P | `Grade.tsx:376, 311, 433, 245` | O que o Excel faz e a planilha não fazia: colar uma coluna sobre as linhas, Delete na célula, Backspace, Ctrl+D, Ctrl+A, clicar noutra célula gravando a edição, colar um valor num intervalo. Ctrl+C copiava a saída positiva (a SOMA no Excel dava errado) | Tudo feito, cada um como uma ação só (um Ctrl+Z desfaz) | T: 3 casos |
| 23 | P | `Relatorios.tsx:135, 279` | No relatório por categoria ou forma, o "100 %" caía embaixo de "Saiu". O relatório do mês não exportava nem somava. "maio e junho fechou" | Pé certo, exportação, plural | revisão |
| 24 | P | `Pessoas.tsx:205, 232` | "Em atraso há mais de N dias" junto com "em dia" dava zero pessoa sem dizer por quê; o duplo clique em "Matricular" cadastrava duas vezes; plano vazio passava | Um desliga o outro; envio único; plano obrigatório | revisão |
| 25 | P | `filtros.ts:93` | A busca pelo telefone só com os números ("5190000") não achava "(51) 90000-0001" | Compara só os números a partir de 4 dígitos | D |
| 26 | P | `Importar.tsx:125` | Escolher de novo o MESMO arquivo, depois de corrigir, não fazia nada | O campo de arquivo zera depois de ler | revisão |
| 27 | P | `loja.tsx:35`, `Moldura.tsx:69` | O aviso com "Desfazer" sumia em 5 s, mesmo com o mouse em cima (WCAG 2.2.1). N e L abriam outra gaveta por cima da gaveta aberta | 10 s quando há ação, e o aviso para enquanto o mouse ou o foco estão nele; atalhos desligados com gaveta aberta | revisão |
| 28 | P | Lançamentos › Filtrar | Não dava para filtrar por pessoa nem por valor (o domínio já sabia) | "Pessoa" e "Valor de / até"; o lote ganhou "Marcar como pendente" | revisão |
| 29 | P | `admin/src/Entrada.tsx:26`, `App.tsx:21` | **762 kB** de JS no pacote principal, com o supabase-js até no modo local | O Supabase e o login (`EntradaSupabase.tsx`, 227 kB) e 11 telas vêm sob demanda. **Principal: 411 kB** (124 kB gzip), sem o aviso de 500 kB | build |
| 30 | P | Responsividade | Nunca tinha sido medida tela por tela | E: 20 rotas × 2040 × 790, 1366 × 768 e 390 × 844. Nenhuma rola para o lado; no PC largo o painel cabe sem rolar; o maior texto fica ≤ 56 px. **Passou sem precisar mudar CSS** | E: 3 casos |

## 3. Pedidos do AU (integração)

| Pedido | Feito |
|---|---|
| 2 · Funções novas, uma transação cada | `marcarComoPagas` → `rpc('marcar_como_pagas', { p_cobrancas, p_data, p_forma })` e `matricularInteressado` → `rpc('matricular_interessado', { p_academia, p_interessado, p_pessoa, p_matricula, p_cobrancas: [] })`. As duas estão no contrato, no repositório local (numa mudança só) e no Supabase (`repositorio-supabase.ts:161`). **Resta**: o desconto de quem indicou ("traga um amiguinho") ainda é uma segunda escrita, porque a função não o recebe. Peço ao AU um `p_matricula_do_indicador` |
| 4 · `horarioId` na experimental | Está no tipo (`tipos.ts`). "Marcar aula" no funil escolhe a aula do dia na grade (com a modalidade do interessado) e grava `turmaId` e `horarioId` (`Funil.tsx:150`) |
| 5 · Histórico das tabelas novas | Feito (achado 21) |
| 6 · Telas que faltavam | **Turmas e horários** em Ajustes (e no "Mais" do celular): a semana dia a dia, a lista e a gaveta (modalidades, público, nível, professor, lugares, horários, ativa), com `validarTurma` (`grade-de-aulas.ts`). No Supabase, grava `turmas` e `horarios` com `turma_id`; o horário que sai fica `ativo = false` (`repositorio-supabase.ts:241`). O exemplo local traz a grade real do cartaz (`gradeDaRacaFight`, 60 min, [decidir] L1). O professor no banco é a conta do app: no modo Supabase, só quem tem conta aparece na lista. **Ficaram de fora**: as réguas de graduação, o "Raça Responde", o contato da academia e a janela do check-in (L7). Ver pendências |
| 3 · Ids uuid no exemplo | **Não fiz.** Trocar `muay-thai` pelos uuid do seed mexe nos 500 testes do domínio e no exemplo do app: precisa combinar com o AN, que faz o mesmo pedido no app |
| 7 · WhatsApp em dois lugares | Não fiz (Ajustes grava só `regras_de_cobranca`). Fica na lista |

## 4. Sugestões para o dono (o que a planilha faz e o Admin ainda não)

1. **Fórmula na célula** ("=150*2", "150+30"): quem vem do Excel faz conta na célula. O caminho é seguro: só soma, subtração, multiplicação e divisão, lido pelo domínio.
2. **Período livre na planilha** (de 01/09 a 15/10). Hoje a grade é de um mês; o período livre existe no domínio, mas não na tela.
3. **Coluna extra que o dono inventa** (por exemplo "Nº do recibo"). A observação existe, mas não aparece como coluna.
4. **Ordenar clicando no cabeçalho** (por valor, por pessoa) e **congelar a primeira linha**.
5. **Imprimir o mês** numa folha (o contador ainda pede papel).
6. **Desfazer que sobrevive ao recarregar a página.** Hoje a pilha mora na tela, e o histórico guarda tudo.
7. **Lembrete atrasado de vários meses**: concluir anda uma ocorrência por vez. Seria bom "pular para a próxima a partir de hoje".
8. **A planilha real da academia (A13)** continua sendo o melhor teste da importação. Com ela, acerto os sinônimos dos cabeçalhos.

## 5. Pendências

- **Para o Alex**: A13 (a planilha real); L1 (a duração das aulas); se a colagem de UMA coluna deve preencher para baixo (a minha escolha) ou criar linhas (o RA4.4 ao pé da letra).
- **Para o AU**: `p_matricula_do_indicador` em `matricular_interessado`; rodar no Supabase o caminho "turma + horários por upsert" (o RLS de `horarios` precisa aceitar o upsert do dono).
- **Para o AN**: os ids uuid de exemplo (pedido 3 do AU), juntos nos dois exemplos.
- **Telas que faltam**: as réguas de graduação (com o IBJJF de `app/dominio/graduacao/sistemas.ts`), o "Raça Responde", o contato da academia e a janela do check-in (L7). As tabelas já existem.
- O modo Supabase continua **sem rodar contra um projeto de verdade** (não existe conta).
- **Fiz uma mudança de formatação fora do que pedi**: um script meu trocou o fim de linha (CRLF → LF) de alguns arquivos do domínio. Voltei os que eram CRLF. Em `dinheiro.ts`, `importacao.ts`, `filtros.ts` e `repositorio-local.ts`, não sei qual era o original, e eles ficaram em LF. O conteúdo não muda.

## 6. Números

| Verificação | Base | Agora |
|---|---|---|
| Domínio (`cd app && npm run testar:dominio`) | 457 | **500 / 500**, também com `TZ=Asia/Tokyo` (deslocamento −540 conferido) |
| Vitest (um arquivo por vez, porque os workers juntos não sobem nesta máquina) | 24 | **40 / 40** em 6 arquivos |
| Playwright | 2 | **5 / 5** (2 fluxos + 3 larguras × 20 rotas) |
| `tsc --noEmit` / `eslint .` | 0 / 0 | **0 / 0** |
| `npm audit` | 0 | **0** |
| `npm run build`, JS principal | 762 kB | **411 kB** (124 kB gzip); Supabase 227 kB à parte |
| Capturas | 90 | **94** (as 90 refeitas + `turmas-*`) |

## Resumo

Corrigi 9 bugs graves. Os principais eram: a escrita que apagava a outra, a importação e o pagamento em dobro no duplo clique, o "-20" do celular que virava entrada e a conta de luz que ia para a regra em vez da linha. Corrigi também uns 30 menores. Cada um tem o teste escrito antes, e os testes do repositório falham com o código antigo.

A planilha agora cola uma coluna, apaga com Delete e preenche com Ctrl+D, como o Excel. A importação aceita a planilhazinha sem descrição e sem tipo. O JS principal caiu de 762 para 411 kB. As três larguras passam sem rolagem lateral.

Dos pedidos do AU, ficaram prontos as transações do lote e do funil, o horário na experimental, o histórico das tabelas novas e a tela de Turmas e horários. As réguas de graduação e a janela do check-in ficaram para depois.
