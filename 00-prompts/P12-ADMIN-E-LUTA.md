# P12 — Área do administrador e a virada para academia de luta (15/10/2026)

Pedido do Alex: "uma nova etapa, a parte do ADM… hoje eles anotam tudo numa planilhazinha… controle total de quantas pessoas estão cadastradas, quantos funcionários… uma opção de anotar, tipo um Excel mesmo, de poder anotar valores, de calcular quanto está ganhando por mês. Tinha que ter realmente uma parte de admin bem completa… Não é uma academia, é uma academia de luta… deixar com um aspecto de coisa de luta… o admin é a parte mais importante e a primeira a ser entregue."

Todos leem antes:
- `00-prompts/P00-CONTEXTO.md` e `CLAUDE.md`;
- `docs/decisoes.md` inteiro, com atenção à entrada de 15/10;
- a nota `A:\Claude\02-cerebro\70-aprendizado\40-ferramentas-e-frameworks\efeitos-e-metodo-academia-plus.md`.

Escrevem em português do Brasil. Ninguém resolve [decidir].

## Ondas

| Onda | Agente | Escreve em | Relatório |
|---|---|---|---|
| 1 | AI — Administrador: especificação e domínio financeiro | `01-especificacao/admin/`, `app/dominio/financeiro/`, `03-arquitetura/` (seções novas) | `docs/revisao/AI-ADMIN.md` |
| 1 | AJ — Virada para luta: análise e especificação | `01-especificacao/luta/` | `docs/revisao/AJ-LUTA.md` |
| 2 | AK — Telas do administrador (desenho) | `02-design/sistema-de-design/mockups/admin.html` + `admin.css` | `docs/revisao/AK-ADMIN-TELAS.md` |
| 2 | AL — Cara de luta (marca, imagens, ícones, catálogo) | `02-design/`, quando chegar o link do perfil | `docs/revisao/AL-LUTA-VISUAL.md` |
| 3 | AM — Construção do admin no app | `app/` | `docs/revisao/AM-ADMIN-APP.md` |
| 4 | AN e AO — Bugs e melhorias (como sempre) | `app/` | `docs/revisao/AN-*.md` e `docs/revisao/AO-*.md` |

## AI — Administrador: especificação e domínio financeiro

O dono hoje vive numa planilha. A área do administrador tem de **substituir a planilha com folga**: mostrar o que ela mostra, calcular o que ela calcula, e mais. Ela é usada **no PC, com tela larga** (o Alex usa 2040×790) e no celular.

1. **Pesquise** o que um dono de academia de luta controla: mensalidades por plano e por modalidade, matrícula, inadimplência, descontos (família, bolsista, atleta), aluguel, salários e comissão de professor, luz, água, equipamento (tatame, luvas, sacos), eventos e graduações, venda de produtos (kimono, faixa, luvas). Veja também o que sistemas como Tecnofit, Next Fit, Zen Planner e Gymdesk oferecem para luta. **Cite as fontes.**
2. **Especificação** em `01-especificacao/admin/`, com histórias, fluxos, regras e mapa de telas:
   - **Painel**: alunos cadastrados (ativos, inativos, novos no mês), funcionários (por função), receita do mês, despesas do mês, resultado (lucro), previsão de recebimento, inadimplentes, comparação com o mês anterior e evolução de 12 meses.
   - **Pessoas**: alunos e funcionários com cadastro completo, plano ou salário, situação e histórico; busca, filtros e exportação.
   - **Financeiro "tipo planilha"**:
     - uma grade editável de lançamentos (data, descrição, categoria, tipo entrada/saída, valor, forma de pagamento, pessoa, situação pago/pendente);
     - edição direto na célula, colar várias linhas, desfazer;
     - filtros, totais por coluna, fechamento do mês;
     - categorias editáveis;
     - **mensalidades geradas sozinhas** a partir dos planos dos alunos (com "marcar como paga");
     - despesas fixas que se repetem todo mês;
     - **exportar para Excel/CSV** e **importar a planilha atual** (CSV/XLSX, com a tela de conferir colunas antes de gravar).
   - **Relatórios**: o mês, o ano, por modalidade, por categoria e por professor.
   - **Permissões**: só o dono vê o financeiro inteiro. Um papel "administrativo" opcional (recepção que lança pagamento) fica [decidir]. O dado financeiro é sensível: regra de acesso no banco, nunca em log.
3. **Modelo de dados** (seção nova em `03-arquitetura/01-MODELO-DE-DADOS.md`): Plano, Matrícula, Mensalidade/Cobrança, Lançamento, Categoria, DespesaFixa, Funcionário (salário/comissão), FechamentoDoMês e Importação, com regras de acesso (RLS).
4. **Domínio financeiro** em `app/dominio/financeiro/`, em TypeScript puro e com o **teste antes**:
   - dinheiro em centavos;
   - gerar as mensalidades do mês;
   - multa e juros (se a academia usar: [decidir]);
   - totais e resultado;
   - fechamento;
   - previsão;
   - inadimplência;
   - importação de CSV (separador `;` e `,`, vírgula decimal, datas `dd/mm/aaaa`);
   - exportação CSV (UTF-8 com BOM, para o Excel em português abrir certo).

   Aproveite o que já existe no projeto Valores do Alex (`A:\Claude\03-projetos\Valores\nucleo\`, com dinheiro, datas e importação de tabela já testados): leia e adapte, **sem copiar às cegas**.

## AJ — Virada para luta: análise e especificação

1. **Inventário**: leia a especificação, o domínio e as telas que existem e classifique cada peça como **fica**, **adapta** ou **sai** para uma academia de luta. Exemplos:
   - "treino de musculação com séries e carga" sai ou vira "plano de treino de luta";
   - "carga da última vez" sai;
   - "cronômetro intervalado" fica e vira peça central, com rounds de luta;
   - "dieta Plus" vira [decidir];
   - "mapa muscular" provavelmente sai.
2. **O que entra**, pesquisado com fontes:
   - **modalidades** (jiu-jitsu, muay thai, boxe, judô, MMA, karatê… a lista final depende do perfil da academia: [decidir]);
   - **turmas e grade de horários** por modalidade e nível (kids, iniciante, avançado, competição);
   - **presença / check-in na aula**;
   - **graduação**: faixas e graus por modalidade (por exemplo, IBJJF para jiu-jitsu e prajied ou kruang para muay thai), com o tempo mínimo e as presenças para o próximo grau, histórico e exame de graduação;
   - **professores por modalidade**;
   - **eventos e campeonatos**;
   - **aviso da academia**, que fica.
3. Entregue `01-especificacao/luta/`: o inventário, as histórias, as regras (graduação e presença), o mapa de telas novo para o aluno e para o professor, e o que muda nas abas. A visão do administrador é do AI; alinhe com ele pelos nomes.
4. **Não mexa** em `app/` nem em `02-design/` nesta onda.
