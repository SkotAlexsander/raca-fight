# Regras do Admin

> Agente AI, 15/10/2026. Numeração RA1.1, RA1.2… para citar em código e teste. O código está em `app/dominio/financeiro/` (o nome da função vem entre crases). Quando um número é **proposta**, ele vale até o Alex dizer outro e fica guardado como configuração da academia, nunca como constante no código. **[decidir]** remete a `90-PERGUNTAS-PARA-O-ALEX.md` (A1…).

Regras gerais, herdadas e que não mudam:
- **dinheiro em centavos**, inteiro;
- **percentual em pontos-base**, inteiro (1000 = 10 %);
- datas `AAAA-MM-DD`, mês de referência `AAAA-MM`;
- `academiaId` em tudo;
- nada se apaga de verdade: arquiva-se, e o histórico guarda.

---

## RA1. Quem entra e o que vê

- **RA1.1** O Admin abre para quem tem vínculo **ativo** com o papel `dono` na academia. Qualquer outro papel recebe "Esta área é do dono da academia" e nada mais, nem a contagem.
- **RA1.2** **Só o dono vê o financeiro inteiro**:
  - lançamentos, cobranças, despesas fixas, fechamentos, remunerações e relatórios;
  - notas, lembretes e tarefas;
  - histórico e importações.
- **RA1.3** **[decidir] A1, papel "administrativo"** (a recepção que lança pagamento). Se entrar, ele:
  - vê e marca como paga a cobrança de aluno;
  - cadastra pessoa e matrícula;
  - registra interessado.

  E **não** vê:
  - o resultado do mês;
  - salário, comissão e remuneração;
  - despesas, relatórios e fechamento;
  - as notas do dono.

  O modelo já tem o lugar (`pode_financeiro(academia_id, 'cobranca')`, seção 26 do modelo). Enquanto o Alex não decidir, só o dono entra.
- **RA1.4** **A regra mora no banco** (RLS), não na tela. A tela esconde o que não se pode. Quem garante é a política.
- **RA1.5** **Dado financeiro é tratado como sensível** (decisão de 15/10):
  - nunca em `console`, Sentry, analytics ou notificação com valor;
  - o aviso no celular diz "Você tem 3 lembretes hoje", sem o texto, e "2 pessoas com mensalidade atrasada", sem nome e sem valor;
  - os campos de valor, descrição, nota e lembrete entram na lista do `redigir.ts`.
- **RA1.6** O que o professor e a recepção veem nos outros apps **não muda por causa do Admin**. A inadimplência não aparece no app da equipe nem no do aluno (R14.6a, AJ). O aluno vê só as **próprias** cobranças, se o Alex quiser (A2).

## RA2. Painel

- **RA2.1** O painel mostra, nesta ordem (`resumoDoPainel`):
  1. alunos: matriculados, trancados, inativos, novos no mês e total;
  2. funcionários, por função;
  3. o mês: entradas, saídas, resultado e pendentes;
  4. a comparação com o mês anterior;
  5. a previsão;
  6. os inadimplentes (pessoas e valor);
  7. os 12 meses;
  8. o funil do mês;
  9. o que lembrar hoje.
- **RA2.2** **Matriculado ≠ ativo**. "Matriculado" é quem tem matrícula ativa. "Ativo (treinou)" é o do R8.5, que agora quer dizer "teve presença nos últimos 30 dias" (R15, AJ). O painel pode mostrar os dois, sempre com a palavra certa. Quem paga e não vem é um número que interessa ao dono.
- **RA2.3** **Regime de caixa** (proposta): o resultado do mês é o que **entrou** menos o que **saiu**, pela data do pagamento (`totaisDoPeriodo`). O pendente aparece ao lado, nunca somado. Motivo: é como a planilha do pequeno dono funciona, e o contador pede o caixa. O regime de competência (pela mensalidade de referência) fica como relatório, se o contador pedir (A4).
- **RA2.4** **Previsão** (`previsaoDoMes`) = o que já entrou + as cobranças abertas do mês − o que já saiu − as saídas pendentes do mês − as despesas fixas que ainda nem têm linha. O atrasado de meses anteriores aparece à parte ("pode entrar"), fora da conta.
- **RA2.5** **Comparação** (`compararPeriodos`): a diferença em reais e em percentual. Se o mês anterior foi zero, não há percentual (a tela mostra "—", nunca "∞" nem "100 %").
- **RA2.6** Todo número do painel abre a lista que o forma, já filtrada (RA10).

## RA3. Planos, matrículas e mensalidades

- **RA3.1** **Plano** (`Plano`):
  - nome;
  - modalidades;
  - aulas por semana (ou livre);
  - periodicidade: mensal, trimestral, semestral, anual ou gratuito;
  - valor do período;
  - taxa de matrícula (opcional);
  - pesos para repartir o combo (opcional);
  - ativo ou não.

  Plano com aluno não se apaga: arquiva-se. Mudar o valor de um plano **não muda** a cobrança já gerada (A5: reajuste).
- **RA3.2** **Matrícula** (`Matricula`):
  - pessoa e pagador;
  - plano;
  - início e fim;
  - dia de vencimento (1 a 31; mês curto encurta);
  - descontos;
  - trancamento;
  - isenção da taxa.
- **RA3.3** **Gerar as mensalidades do mês** (`gerarMensalidadesDoMes`). O botão é "Gerar mensalidades de outubro", e o Admin oferece rodar sozinho no dia 1 (A6). A geração é **idempotente**: rodar de novo não duplica e não recria a cobrança que o dono cancelou. Cada matrícula que fica de fora aparece com o motivo:
  - trancada;
  - encerrada;
  - isenta (100 % de desconto);
  - não é mês de cobrança (trimestral);
  - gratuito;
  - ainda não começou;
  - já existe.
- **RA3.4** **Trancamento**: sem cobrança quando o vencimento cai dentro do intervalo trancado.
- **RA3.5** **Primeiro mês** **[decidir] A7**. Quem começa no dia 21 paga:
  - o mês cheio;
  - a parte do mês (proporcional);
  - ou só a partir do mês seguinte.

  A função exige a escolha, e não tem padrão. O vencimento do primeiro mês nunca é antes do início.
- **RA3.6** **Periodicidade**: o trimestral cobra no mês do início e a cada 3 meses (o semestral a cada 6, o anual a cada 12). O gratuito ("Aula experimental") nunca cobra.
- **RA3.7** **Descontos** (`calcularDesconto`):
  - vários somam (família + indicação);
  - cada um pode ter data de fim;
  - o total nunca passa do valor;
  - o motivo fica guardado: família, bolsista, atleta, indicação, funcionário ou outro;
  - **família**: o Admin **sugere** quando o mesmo pagador tem duas ou mais matrículas ativas (`sugerirDescontoFamilia`), mas o percentual é da academia (A8) e ninguém aplica sozinho.
- **RA3.8** **"Traga um amiguinho"** (`descontosDaIndicacao`, R19.9 do AJ). Quando o indicado se **matricula**, os dois ganham o **mesmo** desconto até a mesma data. Cada desconto guarda de onde veio (a pessoa e o interessado). O valor e a duração são [decidir] A9.
- **RA3.9** **Taxa de matrícula**: uma cobrança própria, no primeiro mês, uma vez só.
- **RA3.10** **Kids**: a cobrança vai para o **pagador** (o responsável), e o aluno é a criança (`Cobranca.alunoPessoaId`). Dois filhos com o mesmo responsável = família.
- **RA3.11** **Repartição do combo** (`repartirPorModalidade`). O valor é dividido entre as modalidades do plano pelos pesos ou, sem peso, em partes iguais (proposta, A10), sem perder centavo. A repartição é **congelada** na cobrança e no lançamento: mudar o plano depois não muda o passado.

## RA4. Lançamentos: a grade "tipo planilha"

- **RA4.1** A grade tem as colunas: data · descrição · categoria · tipo (entrada ou saída) · valor · forma de pagamento · pessoa · situação (pago ou pendente). As colunas extras, que se ligam no menu, são: modalidade, evento, observação e origem.
- **RA4.2** **Validação** (`validarLancamento`):
  - a data existe;
  - a descrição tem de 1 a 200 caracteres;
  - o valor é inteiro e maior que zero (o sinal vem do tipo);
  - a categoria é do mesmo tipo da linha;
  - a observação tem até 500 caracteres.

  Célula inválida mostra o erro e **não grava**.
- **RA4.3** **Editar na célula** (`editarCelula`) com o teclado:
  - Enter edita e desce;
  - Tab vai para a direita;
  - Esc cancela;
  - as setas andam.

  O que se digita é lido em português:
  - "160", "160,00" e "R$ 1.600";
  - "-20" vira saída de 20;
  - "5/10" vira 05/10 do ano corrente (só na grade);
  - "pix", "espécie" e "crédito";
  - o começo do nome da pessoa ou da categoria, se só um bater.

  Escolher a categoria puxa o tipo.
- **RA4.4** **Colar** (`colarNaGrade`): as linhas copiadas do Excel (com tabulação) viram linhas **novas** a partir da coluna do cursor. As que têm erro voltam marcadas por coluna, e nada entra até a pessoa confirmar.
- **RA4.5** **Desfazer e refazer** (`registrarAcao`, `desfazer`, `refazer`):
  - até 100 ações;
  - colar 20 linhas é **uma** ação;
  - uma ação nova apaga o refazer;
  - desfazer passa pelo mesmo caminho de gravar: obedece ao mês fechado (RA4.10) e entra no histórico (RA9).
- **RA4.6** **Categorias** (`Categoria`): o dono cria, renomeia, ordena e arquiva. Categoria com linha não se apaga. A lista inicial é proposta (`exemplo.ts › CATEGORIAS`):
  - entradas: mensalidades, matrículas, exames de graduação, eventos e campeonatos, venda de produtos, aulas avulsas e particulares, outras;
  - saídas: aluguel, salários, comissão de professores, luz, água, internet, equipamento (tatame, luvas, sacos), limpeza e manutenção, produtos para revenda, eventos e campeonatos, impostos e taxas, contador, divulgação, outras.
- **RA4.7** **Marcar como paga** (`marcarComoPaga`): a cobrança vira paga **e** nasce a linha de entrada na grade, ligada a ela, com a repartição. Se pagou com multa, a repartição acompanha o valor pago. **Pagamento parcial é recusado** (A11). "Desfazer pagamento" (`desfazerPagamento`) arquiva a linha e reabre a cobrança.
- **RA4.8** **Despesas fixas** (`gerarDespesasFixasDoMes`): viram linhas **pendentes** no dia do vencimento, uma vez por mês. A **variável** (luz, água) vem pela média dos 3 últimos meses lançados, marcada "estimado" até alguém conferir a conta. Salário é despesa fixa com a pessoa. Comissão não é: é calculada (RA6) e lançada pelo dono.
- **RA4.9** **Evento**: a linha pode levar o evento (inscrição de campeonato, ingresso, viagem, premiação). O relatório mostra o resultado de cada evento (`resultadoPorEvento`). O evento é o do R18.1 (AJ).
- **RA4.10** **Fechamento do mês** (`fecharMes`, `pendenciasAntesDeFechar`, `podeAlterarLancamento`, `reabrirMes`):
  - antes de fechar, a tela lista o que está pendurado (o mês não terminou, linhas pendentes, linhas sem categoria, cobranças em aberto), e **não impede**: o dono decide;
  - fechar guarda a foto dos números e **trava** as linhas do mês, nos dois lados de uma mudança (mover uma linha para dentro de um mês fechado também é mexer nele);
  - reabrir pede motivo e fica no histórico.
- **RA4.11** **Linha nunca some**: "apagar" na grade é arquivar. A linha arquivada sai das contas e da grade, e volta pelo filtro "arquivadas".

## RA5. Inadimplência, multa e juros

- **RA5.1** **Situação da cobrança é calculada** (`situacaoDaCobranca`): a vencer, vence hoje, atrasada, paga ou cancelada. Nunca é digitada.
- **RA5.2** **Inadimplentes** (`listarInadimplentes`):
  - agrupados por quem deve (o pagador);
  - mostram o total, o atraso mais antigo e as cobranças;
  - vêm do maior atraso para o menor;
  - o filtro é "há mais de N dias";
  - a taxa do mês (`taxaDeInadimplencia`) é o que venceu e não foi pago sobre o que venceu.
- **RA5.3** **Multa e juros** **[decidir] A3** (`calcularEncargos`, `validarRegraDeAtraso`):
  - só se a academia usar;
  - a multa é cobrada uma vez;
  - os juros são simples, pró-rata dia, base 30;
  - a tolerância é opcional;
  - limites: multa até 2 % (CDC, art. 52, § 1º) e juros até 1 % ao mês;
  - valor acima disso é recusado, com o motivo escrito;
  - confirmar com o contador antes de ligar.
- **RA5.4** **Atraso não bloqueia o treino** (R14.6a, AJ). Bloquear é [decidir] L8 da especificação de luta.
- **RA5.5** **Cobrar pelo WhatsApp**: o botão abre `https://wa.me/<número>?text=<mensagem>` com o texto pronto ("Olá, [primeiro nome]! A mensalidade de outubro da Raça Fight venceu em 10/10, no valor de R$ 150,00. Se já pagou, desconsidere."). O Admin não manda nada sozinho na v1.

## RA6. Remuneração da equipe

- **RA6.1** Tipos (`Remuneracao`): fixo · comissão · fixo + comissão · por aula · sem remuneração.
- **RA6.2** **Comissão** (`calcularRemuneracaoDoMes`): um percentual sobre o que **entrou** no mês das modalidades do professor, pela repartição. Exemplo: o combo Muay Thai + Jiu-Jitsu conta só a metade do Muay Thai para o professor de Muay Thai.
- **RA6.3** **Dois professores na mesma modalidade**: hoje cada um recebe sobre a base inteira da modalidade. Dividir por turma ou por presença é [decidir] A12, e depende das turmas e da presença do AJ.
- **RA6.4** **Por aula**: o valor × as aulas dadas no mês. O número de aulas vem das aulas registradas (R14, AJ) ou é digitado, e a função não calcula sem ele.
- **RA6.5** O Admin **calcula**. O dono confere e lança a saída. A remuneração não vira linha sozinha, porque o dono costuma arredondar ou adiantar.

## RA7. Relatórios

- **RA7.1** Relatórios: o mês · o ano (12 meses) · por categoria · por modalidade · por forma de pagamento · por professor (remuneração) · por evento · inadimplência · funil. Cada um com período escolhido e exportação.
- **RA7.2** **Por modalidade** (`quantoEntrouPorModalidade`): soma a repartição das entradas pagas. A linha sem repartição (venda avulsa sem modalidade) aparece como "sem modalidade".
- **RA7.3** Gráficos: uma cor só para o destaque, o resto em cinza (regra do projeto, decisão de 10/10). Entrada e saída se diferenciam também por sinal e posição, não só por cor.

## RA8. Importar e exportar

- **RA8.1** **Formatos**: CSV (`;` ou `,`, com aspas, com ou sem BOM), XLSX (lido na camada do app e entregue ao domínio como grade de células) e colar da área de transferência.
- **RA8.2** **Conferir antes de gravar** (`acharCabecalho`, `detectarColunas`, `conferirImportacao`):
  - acha o cabeçalho mesmo abaixo de um título;
  - propõe o papel de cada coluna: data, descrição, valor, valor com sinal, entrada, saída, tipo, categoria, forma, pessoa, situação, modalidade, observação ou ignorar;
  - a pessoa troca o papel e vê as linhas como vão ficar.
- **RA8.3** **Cada linha volta com** rascunho, erros, avisos e "repetida":
  - linha de total ("TOTAL", "Saldo") e linha vazia saem;
  - data inválida, valor ilegível ou "entrada ou saída?" sem resposta é **erro** e não entra;
  - pessoa não encontrada é **aviso**: entra sem pessoa, com o nome na observação;
  - categoria que não existe é oferecida para criar;
  - situação em branco: pago, se a data já passou, ou pendente, se é futura;
  - a data aceita dd/mm/aaaa, d/m/aa e o número de série do Excel;
  - o valor aceita "R$ 1.234,56", "1.500", "89.90", "(89,90)" e número de célula, e recusa o ambíguo ("12,345").
- **RA8.4** **Repetida** = mesma data, tipo, valor e descrição (sem acento e sem caixa) de um lançamento que já existe. Não entra, a menos que a pessoa marque. Igual a outra linha **do mesmo arquivo** é só aviso: duas mensalidades iguais no mesmo dia podem ser de duas pessoas.
- **RA8.5** **Gravar** (`gravarImportacao`): as linhas levam a importação. **Desfazer a importação** (`desfazerImportacao`) arquiva todas, a menos que uma caia em mês fechado.
- **RA8.6** **Exportar** (`exportarLancamentos`, `exportarAlunos`, `gerarCSV`):
  - UTF-8 **com BOM**, `;`, CRLF;
  - valor com vírgula decimal e sem "R$", para o Excel ler como número;
  - "Valor" positivo com "Tipo" ao lado, e "Valor (±)" com a saída negativa, para a SOMA dar o resultado;
  - texto que começa com `=`, `+`, `-`, `@`, tabulação ou CR ganha apóstrofo (OWASP);
  - **o que sai volta igual pela importação** (há teste).
- **RA8.7** **XLSX** na exportação: v2, ou quando a biblioteca for escolhida com auditoria de segurança (`03-arquitetura/05-ADMIN.md`, seção 6). O pacote `xlsx` 0.18.5 do npm **não** entra.
- **RA8.8** A planilha real do Alex é o teste que falta (A13).

## RA9. Histórico de tudo

- **RA9.1** Toda criação, mudança, arquivamento, fechamento, reabertura e importação em toda tabela do Admin gera um registro (`RegistroDoHistorico`):
  - tabela e registro;
  - ação;
  - os campos que mudaram (de → para);
  - quem e quando;
  - o motivo, quando há.
- **RA9.2** **Quem grava é o banco** (gatilho em cada tabela), nunca a tela. Ninguém, nem o dono, edita ou apaga o histórico.
- **RA9.3** A tela mostra o histórico em frase (`descreverRegistro`): "Alex mudou o lançamento em 15/10/2026 às 10:00 · Valor: R$ 220,00 → R$ 240,00". Há três lugares para ver: na ficha da linha, na ficha da pessoa e na tela Histórico, com filtro por tabela, pessoa e período (`filtrarHistorico`).
- **RA9.4** O histórico é dado financeiro (RA1.5). Guardar para sempre ou por N anos é [decidir] A14.

## RA10. Filtro total

- **RA10.1** **Alunos** (`linhasDeAlunos`, `filtrarAlunos`). Os critérios:
  - texto (nome, telefone, e-mail);
  - situação;
  - modalidade;
  - plano;
  - inadimplente há mais de N dias;
  - em dia;
  - novos desde;
  - motivo de desconto.
- **RA10.2** **Funcionários** (`filtrarFuncionarios`): função, modalidade, tipo de remuneração, texto e desligados.
- **RA10.3** **Lançamentos** (`filtrarLancamentos`, `quantoEntrou`). Os critérios:
  - período (mês, trimestre, ano ou livre);
  - texto;
  - tipo;
  - situação;
  - categoria (inclusive "sem categoria");
  - modalidade;
  - forma;
  - pessoa;
  - evento;
  - origem;
  - valor mínimo e máximo;
  - arquivadas.

  "Quanto entrou" com modalidade conta só a parte da modalidade.
- **RA10.4** Dentro de um critério vale qualquer valor (**ou**). Entre critérios valem todos (**e**). O filtro aparece escrito em frase em cima do resultado ("Alunos · Muay Thai · em atraso há mais de 30 dias · 2 pessoas · R$ 260,00").
- **RA10.5** **Filtro salvo** (`FiltroSalvo`): nome e critério, para reabrir num clique. Os exemplos que já vêm salvos são: "Inadimplentes há mais de 30 dias", "Novos do mês", "Kids" e "Trancados".
- **RA10.6** Todo resultado se exporta (RA8.6).

## RA11. Funil da aula experimental

- **RA11.1** Etapas (`etapaDoInteressado`), **calculadas** a partir do interessado e das aulas experimentais dele (R19.1 e R19.3, AJ): interessado → experimental marcada → compareceu → matriculado; ou desistiu (`nao_seguiu`, ou desistência antes da aula). Faltou: volta a ser só interessado.
- **RA11.2** **Conversão** (`conversaoDoFunil`): conta quem **chegou** no período (pela data do contato) e mostra contatos, os que marcaram aula, os que fizeram a aula, as matrículas, as desistências, a passagem da aula à matrícula e a do contato à matrícula. Tudo no total e **por origem**: Instagram, WhatsApp, indicação, passou na porta, outro e não informado.
- **RA11.3** **Matricular do funil** (`matricularInteressado`) cria a pessoa, a matrícula e, se veio por indicação, os dois descontos (RA3.8). A experimental vira `matriculou`.
- **RA11.4** **Retorno** (`retornosPendentes`, `lembreteDeRetorno`): quem compareceu há N dias e não se matriculou nem desistiu aparece na lista "Chamar de volta", com o lembrete pronto. O N é [decidir] A15 (proposta: 3 dias).
- **RA11.5** **Prazo do interessado** (`interessadosParaApagar`): quem não virou aluno sai do cadastro depois de N dias sem movimento (R19.1: proposta de 180, [decidir] L23 do AJ).

## RA12. Anotar e lembrar

- **RA12.1** **Nota** (`Nota`, `validarNota`, `notasLigadas`, `buscarNotas`):
  - texto livre, até 2.000 caracteres;
  - ligada (ou não) a uma pessoa, um lançamento, um dia ou um valor;
  - pode ser fixada;
  - na lista, as fixadas vêm primeiro, depois as mais novas;
  - a busca ignora acento e caixa;
  - aparece na ficha da pessoa e do lançamento.
- **RA12.2** **Lembrete** (`Lembrete`, `validarLembrete`):
  - título até 120;
  - detalhe;
  - data;
  - hora opcional;
  - repetição: não repete, semanal, mensal ou anual;
  - aviso de 0 a 60 dias antes;
  - ligado a uma pessoa, um valor, uma despesa fixa ou um interessado.
- **RA12.3** **O dia** (`lembretesDoDia`): atrasados, de hoje, e os que estão na janela de aviso. **Concluir** (`concluirLembrete`) faz o que repete andar para a próxima ocorrência. O mensal guarda o dia: 31 vira 28 em fevereiro e volta a 31 em março. **Adiar** (`adiarLembrete`) nunca vai para o passado. A **agenda** (`agendaDeLembretes`) abre as repetições no calendário.
- **RA12.4** **Tarefa** (`Tarefa`, `tarefasAbertas`): título, detalhe, prazo, responsável (um funcionário) e pessoa. A ordem é: atrasadas, depois por prazo, as sem prazo no fim.
- **RA12.5** **Atalhos**:
  - a despesa fixa vira lembrete mensal num toque (`lembreteDaDespesaFixa`, "Vence: Aluguel da sala");
  - o interessado vira lembrete de retorno;
  - a pessoa inadimplente vira lembrete "Cobrar [nome]".
- **RA12.6** **O aviso**: o servidor manda ao celular do dono um resumo às 08:00 ("Você tem 3 lembretes hoje"). O lembrete com hora é avisado na hora. O texto nunca leva o conteúdo nem o valor (RA1.5). O horário de silêncio (R10.4) vale para o lembrete com hora? [decidir] A16. O caminho técnico (app da equipe do dono ou Web Push do Admin) está em `03-arquitetura/05-ADMIN.md`.

## RA13. Pessoas

- **RA13.1** **Pessoa** (`Pessoa`) existe **sem conta no app**:
  - nome;
  - telefone e e-mail;
  - data de nascimento;
  - documento ([decidir] A17);
  - responsável;
  - observação;
  - marcas: aluno, funcionário, responsável.

  Nada de saúde aqui (R6.1).
- **RA13.2** **Ficha** da pessoa: o contato, as matrículas (com o plano e a situação), as cobranças e os pagamentos, as notas, os lembretes, as tarefas e o histórico. A presença e a graduação (AJ) aparecem só como números ("12 aulas no mês · faixa azul"), e com link para o app da equipe, se o dono também for professor.
- **RA13.3** **Kids**: a criança tem um responsável, que também é pessoa. O responsável que não treina é marcado só como responsável e não conta como aluno.
- **RA13.4** **Funcionário** (`Funcionario`): pessoa, função, modalidades, remuneração, desde e até. Desligar põe a data de saída. O papel no app (se houver) se encerra pelo dono, como hoje (R6.12).
- **RA13.5** **Ligar à conta do app**: quando a pessoa tem conta (vínculo de aluno ou de equipe), o dono liga as duas. O cadastro não lê dado de saúde do app, nunca.
- **RA13.6** **Duplicado**: o mesmo telefone ou nome igual sem acento gera aviso "Já existe uma pessoa parecida", com a opção de abrir a que já existe.
