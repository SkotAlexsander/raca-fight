# AI — Administrador: especificação e domínio financeiro (P12, 15/10/2026)

> Agente AI, onda 1 do P12, em paralelo com o AJ (virada para luta). Escrevi em `01-especificacao/admin/`, `app/dominio/financeiro/`, `03-arquitetura/05-ADMIN.md` e na Parte 2 de `03-arquitetura/01-MODELO-DE-DADOS.md`, e acrescentei uma entrada em `docs/decisoes.md`. Não mexi em `app/` fora de `dominio/financeiro/`, nem em `02-design/`, nem na pasta do AJ.

## 1. O que a área do admin faz (resumo por tela)

O Admin é o **terceiro app** (aluno · equipe · admin), separado e conectado ao mesmo banco. É denso, feito para o PC (2040 × 790) e também serve no celular. Ele substitui a planilha e faz o que ela não faz.

| Tela | O que faz |
|---|---|
| **Painel** | Mostra numa tela só, em 3 colunas que cabem em 790 de altura:<br>• alunos matriculados, trancados, inativos e novos no mês;<br>• funcionários por função;<br>• o mês (entrou, saiu, **resultado**, pendentes) e a comparação com o anterior;<br>• os 12 meses e a previsão do mês;<br>• os inadimplentes;<br>• o funil do mês e os lembretes e tarefas de hoje.<br>Cada número abre a lista filtrada. |
| **Pessoas › Alunos** | Cadastro de quem treina, **mesmo sem conta no app**. O Kids vem com o responsável, que é quem paga. Tem filtro total, filtro salvo e exportação. |
| **Ficha da pessoa** | Contato, matrículas (plano, vencimento, descontos com a origem), cobranças, pagamentos, notas, lembretes, tarefas e histórico. Presença e faixa aparecem em número (AJ). |
| **Pessoas › Funcionários** | Função, modalidades e remuneração (fixo, comissão sobre a modalidade, por aula), com a **remuneração do mês calculada**. |
| **Financeiro › Lançamentos** | **A planilha**:<br>• edição na célula com teclado;<br>• colar várias linhas do Excel;<br>• desfazer e refazer;<br>• filtros, totais fixos, seleção em lote e exportar CSV;<br>• "apagar" é arquivar. |
| **Financeiro › Cobranças** | Mensalidades **geradas sozinhas** pelas matrículas, com a taxa de matrícula, os descontos e a repartição do combo. "Marcar como paga" cria a linha na planilha, e o pagamento pode ser desfeito. Tem cobrança avulsa (exame, evento, produto) e "Cobrar no WhatsApp". |
| **Financeiro › Despesas fixas** | Aluguel, salário, luz e internet viram linhas pendentes todo mês. Luz e água vêm pela média dos últimos 3 meses, marcadas como estimadas. |
| **Financeiro › Fechamento** | Mostra o que está pendurado, guarda a foto do mês e **trava as linhas**. Reabrir pede motivo. |
| **Financeiro › Importar e Importações** | CSV ou XLSX (ou colar), com a **tela de conferir colunas** e a prévia por grupos (prontas, repetidas, com aviso, com erro). Cria as categorias novas e permite desfazer a importação inteira. |
| **Relatórios** | Mês · ano · categoria · **modalidade** (o combo conta a parte de cada uma) · forma · professor · evento · inadimplência · funil. |
| **Funil** | Interessado → aula marcada → fez a aula → matriculado, com conversão **por origem** (Instagram, WhatsApp, indicação). Tem a lista "Chamar de volta" e matricula direto do funil, com o desconto do "Traga um amiguinho" para os dois. |
| **Agenda e Notas** | Notas ligadas a pessoa, dia ou valor. Lembretes com repetição e aviso antes ("vence o aluguel dia 10"). Tarefas com prazo e responsável. O resumo vai ao celular às 08:00, sem conteúdo. |
| **Histórico** | Quem mudou o quê e quando, em frase ("Valor: R$ 220,00 → R$ 240,00"), por linha, pessoa ou período. Quem grava é o banco. |
| **Ajustes** | Academia, modalidades, planos, categorias, **regras de cobrança** (os [decidir] como configuração) e filtros salvos. |

Para os detalhes, ver:
- regras RA1 a RA13: `01-especificacao/admin/03-REGRAS.md`;
- fluxos FA1 a FA10: `04-FLUXOS.md`;
- telas: `05-MAPA-DE-TELAS.md`;
- histórias HA1 a HA46: `02-HISTORIAS.md`.

## 2. O modelo

`03-arquitetura/01-MODELO-DE-DADOS.md`, **Parte 2, seções 26 a 41**:

| Seção | Entidade | Ponto principal |
|---|---|---|
| 26 | funções da RLS | `e_dono`, `pode_financeiro(academia, 'tudo' / 'cobranca')`. O papel "administrativo" (A1) entra trocando só a função. |
| 27 | Pessoa | Existe sem conta; `usuarioId` liga ao app; responsável para o menor. |
| 28 | Funcionario | Função ≠ papel do app; a remuneração é o dado mais restrito. |
| 29 | Modalidade | Do AJ; o Admin escreve a lista. |
| 30 | Plano | Periodicidade, valor do período, taxa, pesos do combo. |
| 31 | Matricula | Pessoa **e pagador**; descontos com motivo e origem; trancamento. |
| 32 | Cobranca | Índice único por (matrícula, mês, tipo); "atrasada" é calculado; repartição congelada; a equipe não lê. |
| 33 | Lancamento | A linha da planilha; gatilho que trava o mês fechado. |
| 34 | Categoria, RegrasDeCobranca | Os [decidir] guardados como configuração. |
| 35 | DespesaFixa | Geração idempotente por índice. |
| 36 | FechamentoDoMes | Um ativo por mês; reabrir não apaga. |
| 37 | Importacao | O arquivo não é guardado, só o que virou linha. |
| 38 | Interessado, AulaExperimental | Do AJ (R19); a etapa do funil é calculada. |
| 39 | Nota, Lembrete, Tarefa | Só o dono. |
| 40 | FiltroSalvo | Nome + JSON do filtro. |
| 41 | Historico | Gravado por gatilho; sem `update` nem `delete` para ninguém. |

A arquitetura dos três apps está em `03-arquitetura/05-ADMIN.md`. A recomendação é a **pasta `admin/` com Vite, React e PWA**, ao lado de `app/`, com o mesmo Supabase e o mesmo `app/dominio/`. Ela foi comparada com um segundo app Expo e com um painel em outro repositório. Resumo:
- a grade tipo Excel é nativa do navegador;
- não passa por loja;
- o celular usa o PWA, com Web Push no iPhone a partir do iOS 16.4 (instalado na tela inicial).

Mais duas decisões técnicas:
- **sem fila offline no Admin**;
- as gravações de várias linhas são uma transação no servidor.

## 3. O domínio: as funções e os testes

`app/dominio/financeiro/`, TypeScript puro (sem `enum`, `import type`, imports com `.ts`). São **86 testes**, todos passando. O projeto inteiro tem **443 testes**, que passam no fuso local e com `TZ=Asia/Tokyo` pelo PowerShell (deslocamento −540 conferido). O `tsc --noEmit` e o ESLint não acusam nada em `financeiro/`.

**Como trabalhei**: escrevi o teste antes de cada módulo.
- Os dois primeiros lotes foram rodados antes do código e falharam por falta do módulo, como devia.
- Os outros foram escritos inteiros antes da implementação.
- Para provar que os testes mordem, estraguei duas regras de propósito (o dia do mês do lembrete e a base 30 dos juros): 3 testes caíram. Desfiz, e voltaram a passar.

| Arquivo | Funções | Testes |
|---|---|---|
| `tipos.ts` | Pessoa, Funcionario, Plano, Matricula, Desconto, Cobranca, Lancamento, Categoria, DespesaFixa, RegraDeAtraso, FechamentoDoMes, Importacao, Evento, Interessado, AulaExperimental, FiltroSalvo, Nota, Lembrete, Tarefa, RegistroDoHistorico | — |
| `dinheiro.ts` | `lerDinheiro` (texto **e** número de XLSX; recusa o ambíguo), `formatarDinheiro` (milhar e "−R$"), `aplicarPontosBase`, `lerPontosBase`, `formatarPontosBase`, `ratear`, `repartirPorPesos` (maior resto, sem perder centavo) | `dinheiro-e-datas.test.ts` (10, com datas) |
| `datas.ts` | competência, `somarMeses`, `dataNaCompetencia` (31 encurta), períodos de mês, trimestre e ano, `lerDataDaPlanilha` (dd/mm/aaaa, d/m/aa, ISO e **série do Excel**); nada lê relógio nem fuso | idem |
| `mensalidades.ts` | `gerarMensalidadesDoMes` (idempotente; Kids cobra o responsável; trimestral; gratuito; trancada; taxa de matrícula; **primeiro mês obrigatório**, A7), `calcularDesconto`, `descontosDaIndicacao` ("Traga um amiguinho", os dois, com origem), `sugerirDescontoFamilia`, `repartirPorModalidade` | `mensalidades.test.ts` (12) |
| `cobrancas.ts` | `situacaoDaCobranca`, `calcularEncargos` e `validarRegraDeAtraso` (multa ≤ 2 %, juros ≤ 1 % ao mês, tolerância; **regra nula = não cobra**), `marcarComoPaga` (cria o lançamento com a repartição; recusa parcial), `desfazerPagamento`, `cancelarCobranca`, `listarInadimplentes`, `taxaDeInadimplencia` | `cobrancas.test.ts` (12) |
| `despesas-fixas.ts` | `gerarDespesasFixasDoMes` (pendente no vencimento, idempotente, variável pela média de 3 meses), `despesaValeNoMes` | `totais.test.ts` (11, com totais e remuneração) |
| `totais.ts` | `totaisDoPeriodo` (caixa), `somarPor`, `quantoEntrouPorModalidade`, `resultadoPorEvento`, `compararPeriodos` (sem percentual quando a base é zero), `evolucaoDoAno`, `previsaoDoMes` | idem |
| `remuneracao.ts` | `calcularRemuneracaoDoMes` (fixo, comissão sobre a parte da modalidade, por aula) | idem |
| `lancamentos.ts` | `validarLancamento` | `fechamento-e-historico.test.ts` (8) |
| `fechamento.ts` | `pendenciasAntesDeFechar`, `fecharMes`, `mesFechado`, `reabrirMes` (motivo obrigatório), `podeAlterarLancamento` (olha a data velha **e** a nova) | idem |
| `historico.ts` | `diferencas`, `registroDeMudanca` (criou, mudou, arquivou), `descreverRegistro` (frase com R$ e data), `filtrarHistorico` | idem |
| `nomes.ts` | `normalizar`, `acharPorNome` (exato ou começo único; nunca adivinha), `lerTipo`, `lerSituacao`, `lerForma`, rótulos | `planilha.test.ts` |
| `importacao.ts` | `detectarSeparador` (fora das aspas), `lerCSV`, `acharCabecalho` (abaixo do título), `detectarColunas`, `conferirImportacao` (rascunho, erros, avisos, repetidas; entrada e saída em colunas, tipo, sinal, situação pela data, pessoa, modalidade), `gravarImportacao`, `desfazerImportacao` | `planilha.test.ts` (15, com exportação e grade) |
| `exportacao.ts` | `gerarCSV` (BOM, `;`, CRLF, aspas, **proteção contra fórmula**), `exportarLancamentos` ("Valor" e "Valor (±)") | idem, com o **teste de ida e volta** exportar → importar |
| `grade.ts` | `editarCelula`, `textoDaCelula`, `colarNaGrade` (com tabulação, erro por coluna), `pilhaVazia`, `registrarAcao`, `desfazer` e `refazer` (limite 100) | idem |
| `filtros.ts` | `linhasDeAlunos`, `filtrarAlunos`, `filtrarFuncionarios`, `filtrarLancamentos`, `quantoEntrou`, `exportarAlunos` | `gestao.test.ts` (18): "alunos de **Muay Thai** inadimplentes há **mais de 30 dias**" e "quanto entrou de **Jiu-Jitsu** neste **trimestre**" |
| `funil.ts` | `etapaDoInteressado` (calculada), `mudarExperimental` (os caminhos do R19.3), `matricularInteressado`, `conversaoDoFunil` (por origem), `retornosPendentes` e `lembreteDeRetorno` (prazo obrigatório, A15), `interessadosParaApagar` (L23) | idem |
| `anotacoes.ts` | notas (`validarNota`, `notasLigadas`, `buscarNotas`), lembretes (`validarLembrete`, `proximaData` com "31 volta a 31 depois de fevereiro", `lembretesDoDia`, `concluirLembrete`, `adiarLembrete`, `agendaDeLembretes`, `lembreteDaDespesaFixa`), tarefas (`tarefasAbertas`, `concluirTarefa`, `reabrirTarefa`) | idem |
| `painel.ts` | `resumoDoPainel` | idem |
| `exemplo.ts` | A Raça Fight: 5 modalidades e 10 planos reais na forma; pessoas **fictícias**; valores **inventados**; categorias propostas; despesas fixas; o card da Lomba do Pinheiro | — |

**O que aproveitei do Valores** (`Valores/nucleo/`), lendo e adaptando, sem copiar às cegas:
- **Dinheiro**: veio o `lerDinheiro` e o `arredondar`. Passou a aceitar o número da célula do XLSX e a recusar o fora do inteiro seguro. O `percentual` com número decimal foi trocado por **pontos-base inteiros**.
- **Datas**: veio a ideia do texto em UTC, com `somarMeses` e `dataNaCompetencia`. Saiu o `lerData`, que assume o ano corrente em "26/10" e gravaria o ano errado em silêncio numa importação. Entrou a data de série do Excel.
- **Juros**: veio a conta simples pró-rata dia, base 30, passada para pontos-base, com a validação do limite legal.
- **Recorrência**: veio a ideia da regra que gera a ocorrência do mês. Aqui são duas, a mensalidade e a despesa fixa, e as duas são idempotentes.
- **Tabela**: vieram o `lerCSV`, a detecção de separador e a de colunas por cabeçalho e conteúdo. Mudou:
  - o separador agora é contado **fora das aspas**;
  - o cabeçalho é achado **abaixo de um título**;
  - os papéis são os de academia;
  - a linha errada **volta com o erro** (no Valores ela era pulada em silêncio);
  - as repetidas são marcadas.

**Achado para o Valores** (fora da minha pasta, para o Alex decidir): o `app/package.json` do Valores usa `xlsx` **0.18.5** do npm, com a CVE-2023-30533 (poluição de protótipo) e a CVE-2024-22363 (ReDoS). As correções (0.19.3 e 0.20.2) só existem no `cdn.sheetjs.com`. Recomendo trocar pela versão do CDN ou por uma biblioteca só de leitura, passando pela `auditar-seguranca`.

## 4. Alinhamento com o AJ

Li `01-especificacao/luta/` antes de fechar e ajustei o domínio:
- **Modalidades**: as cinco do R14.1 (Jiu-Jitsu e Luta Livre separadas). "Kids" é público da turma, não modalidade.
- **Evento**: o do R18.1, com os mesmos tipos (`exame`, `seminario`, `aulao`, `campeonato`, `luta`, `confraternizacao`, `outro`). O financeiro só junta as linhas de cada um.
- **Interessado e AulaExperimental**: os do R19.1 e R19.3, com os mesmos estados. Por isso **troquei a etapa guardada por etapa calculada**. A origem do contato é o "como conheceu" opcional do R19.1, e no relatório quem não informou aparece como "não informado".
- **Indicação** (R19.9): o desconto é meu (`descontosDaIndicacao`), e a pergunta do valor é a mesma: A9 = L26.
- **Responsável e dependente** (R20): é o meu `pagadorPessoaId` com `alunoPessoaId`.
- **Inadimplência não bloqueia o check-in** (R14.6a). A equipe não lê cobrança (seção 32 do modelo).
- **Professor = papel `instrutor`**. Funcionário (cadastro) é diferente de papel (app).

**Atenção para a junção**: o AJ usa o "aluno ativo" do R8.5 com presença (R15). No Admin, **"matriculado"** é outra coisa. Os dois números convivem no painel, cada um com o seu nome (RA2.2).

## 5. Fontes

A lista completa, com o que cada fonte sustenta, está em `01-especificacao/admin/01-PESQUISA-E-FONTES.md`. As principais:

- **Sistemas para academia de luta**:
  - nfe.io, "Melhores sistemas para academia de artes marciais: TOP 5" (Next Fit CT, DojoWeb, iLUTAS, FightSystem, IBLACKBELT);
  - Gymdesk, "Every Gymdesk Feature a BJJ School Actually Uses" e "The Best Martial Arts Management Software in 2026" (material de venda);
  - Software Advice e Orbital, sobre o Zen Planner;
  - App Store, "Tecnofit Gestão 2.0", e InfoMoney, sobre a Tecnofit;
  - Startupi, sobre a Next Fit;
  - Jornal do Brás, 14/09/2026 (com propaganda).
- **Multa e juros**: CDC, art. 52, § 1º, via Migalhas e InfoMoney; o 1 % ao mês via Jus.com.br e Jornal Contábil; a Lei 14.905/2024 via Capital Aberto, CNB/SP e Demarest.
- **LGPD e dado financeiro**: Migalhas e ConJur.
- **CSV e Excel**: Microsoft, "Opening CSV UTF-8 files correctly in Excel"; fórum do SQLite; Techload.
- **Injeção em CSV**: OWASP "CSV Injection"; OWASP WSTG; Symfony CVE-2021-41270.
- **SheetJS**: issues #2961 e #3012 da SheetJS; Vulert.
- **Histórico**: Supabase, "Postgres Auditing in 150 lines of SQL"; database.dev, `supa_audit`.
- **Arquitetura**: Expo, "Work with monorepos"; WebKit, "Web Push for Web Apps on iOS and iPadOS".

**Limites da pesquisa**:
- **Tecnofit**: não achei nada público sobre faixa ou financeiro para luta.
- **Comissão de professor de luta**: nenhuma fonte confiável dá percentual, por isso o modelo deixa o valor com a academia.
- **Multa e juros em academia**: as fontes são artigos de divulgação, e não achei jurisprudência específica de academia.

## 6. Perguntas para o Alex

A lista completa, com as recomendações, está em `01-especificacao/admin/90-PERGUNTAS-PARA-O-ALEX.md` (A1 a A24).

**A primeira e mais útil:**
- **A13. Manda a planilha que vocês usam hoje** (CSV ou XLSX, pode ser de um mês só; se for de papel, uma foto). A importação foi testada com uma planilha montada no formato mais comum. Com a de verdade, o teste passa a usar o arquivo real, e a tela de conferência já sai com as colunas certas. Se o contador pede um formato próprio, mande um exemplo também.

**As que travam a construção:**
- **A18**: os planos e preços reais (e se há taxa de matrícula).
- **A19**: como a equipe é paga hoje (fixo, comissão, por aula).
- **A7**: o primeiro mês. Recomendação: o mês cheio, vencendo no dia da matrícula.
- **A3**: se a academia cobra multa e juros. Recomendação: 2 % e 1 % ao mês, com 5 dias de tolerância, confirmados com o contador.
- **A1**: o papel "administrativo" (a recepção lança pagamento?). Recomendação: só o dono na primeira entrega.
- **A23**: aprovar o Admin como app web instalável na pasta `admin/`.

**As outras**, cada uma com recomendação no arquivo:
- A2: o aluno vê as próprias mensalidades?
- A4: caixa ou competência.
- A5: reajuste.
- A6: gerar sozinho no dia 1.
- A8: desconto de família.
- A9: o "Traga um amiguinho" (= L26).
- A10: a repartição do combo.
- A11: pagamento parcial.
- A12: comissão com dois professores.
- A14: guarda do histórico.
- A15: dias para o retorno.
- A16: silêncio para o lembrete com hora.
- A17: CPF.
- A20: exame, eventos e produtos.
- A21: cobrança automática (Pix e boleto).
- A22: mais de um dono.
- A24: os nomes reais.

## 7. Para as próximas ondas

**AK (telas)**:
- `05-MAPA-DE-TELAS.md` diz o que cada tela mostra;
- os princípios da interface densa estão no topo dele;
- o painel tem de caber em 2040 × 790 sem rolar;
- o destaque da tela é o resultado do mês;
- a marca é vermelho `#C42024`, preto e branco.

**AM (construção)**:
- `03-arquitetura/05-ADMIN.md`, seção 9;
- a tela chama o domínio e não refaz conta;
- os [decidir] vêm de `RegrasDeCobranca`;
- falta acrescentar ao `redigir.ts` os campos financeiros (valor, descrição, nota, lembrete, telefone);
- falta escolher a leitura de XLSX com auditoria;
- faltam as migrações das seções 26 a 41, com os gatilhos de histórico e de trava do mês.

**Fora do domínio, e não feito**: nenhuma tela, nenhuma migração e nenhuma biblioteca instalada. Isso é das ondas 2 e 3.
