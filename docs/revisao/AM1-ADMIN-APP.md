# AM1 — Construção do Admin (P12, onda 3, 15 e 16/10/2026)

> Agente AM1. Dono de `admin/` (novo) e de `app/dominio/financeiro/`. **Não mexi no resto de `app/`** (o AM2 trabalha lá) nem em `02-design/`. Em `docs/` escrevi só este relatório e uma entrada no FIM de `docs/decisoes.md`.
>
> **Estado: pronto para o Alex usar no modo local.** O modo Supabase está escrito e testado com cliente falso, mas nunca rodou contra um projeto de verdade (não existe projeto; nada foi criado nem publicado).

## 1. Em uma frase

O Admin abre no PC (2040 × 790) e no celular, igual ao desenho do AK, com a planilha que se usa só pelo teclado, e todas as telas da especificação funcionando sobre uma Raça Fight de exemplo de 13 meses, calculada pelo domínio.

## 2. O domínio: os três achados do AR, com o teste antes

Arquivo novo `app/dominio/financeiro/revisao-ar.test.ts` (8 testes), escrito e rodado ANTES da correção: falhou por falta das funções; depois da correção, passa.

| Achado | Correção |
|---|---|
| Painel comparava 1 a 15/10 com setembro inteiro ("−30,94 %") | `periodoAteODia` e `mesmoPeriodoDoMesAnterior` (`datas.ts`); `resumoDoPainel` compara o MESMO trecho (`comparacao.periodoAtual` e `periodoAnterior`) e traz `mesAnterior` (o mês inteiro) à parte. Mês que terminou: mês inteiro contra mês inteiro (30/09 ↔ 31/08). As chaves antigas de `comparacao` continuam, para o `dados.mjs` do AR não quebrar. |
| Histórico "fechou o fechamento" e campo cru (`trancadaAte`) | `descreverRegistro` reescrito: fechamento diz o mês ("Alex fechou setembro de 2026"); rótulo humano para todos os campos dos tipos, e o campo novo sem rótulo vira frase ("Algum campo novo"); id vira nome; valor de código vira palavra ("cartão de crédito"); desconto vira "família 10 %"; opção `nomeDoRegistro` ("mudou o lançamento "Aluguel da sala""). O teste reprova qualquer camelCase ou "_" na saída. |
| "Boxe 2× — 2026-10" | `nomeDoMesComAno` → "Boxe 2× — outubro/2026". O CSV exportado herda. |

Também: o aviso de mês fechado diz "Setembro de 2026 está fechado. Reabra o mês para mudar." (`mesComMaiuscula`), e entrou o tipo `RegrasDeCobranca` (seção 34 do modelo) em `tipos.ts`.

## 3. O que foi construído em `admin/`

- **Base**: Vite 8.3.1, React 19.3.0, TypeScript 5.9.3 estrito, ESLint 10 (com as regras do React 19 e `no-console` proibido), Vitest 5 + Testing Library, Playwright 1.63. Versões travadas e publicadas há mais de duas semanas. O domínio é importado de `../app/dominio/` pelo apelido `@dominio`.
- **Tema**: `ferramentas/gerar-tokens-css.mjs` gera `src/estilos/tokens.css` do `tokens.json` 2.0.0 (escuro principal, claro pelo sistema ou pelo botão). O `admin.css` é o do mockup do AK, sem o bloco de cores: as classes são as mesmas, por isso a tela fica igual ao desenho.
- **PWA**: `manifest.webmanifest`, ícones gerados do logo provisório do AL (192, 512, máscara, 180 da Apple, SVG), service worker que guarda só a casca. `npm run abrir` monta, sobe a prévia e abre; o Chrome/Edge oferece "Instalar".
- **Dados**: um contrato (`src/dados/tipos.ts`), cada operação uma intenção e uma transação.
  - **Local** (roda agora): a academia de exemplo gerada pelo domínio (`src/dados/local/exemplo.ts`: 190 alunos adultos, 14 famílias Kids, 9 da equipe, 13 meses de mensalidades, pagamentos, despesas fixas, comissões, fechamentos, 70 interessados; nomes inventados, semente fixa); guarda em IndexedDB (reserva: localStorage, memória); confere o mês fechado, valida a linha, grava tudo ou nada e escreve o histórico como o gatilho.
  - **Supabase**: cliente, login com TOTP, repositório que chama uma função por intenção, e 5 migrações (833 linhas) em `admin/supabase/migrations/`: tabelas das seções 26 a 40, `historico` gravado por gatilho `after insert or update` sem política de insert/update/delete (e com `revoke`), trava do mês fechado nos dois lados, categoria do mesmo tipo, repartição que soma, regras de acesso (`pode_financeiro`), e as funções `gravar_lancamentos`, `inserir_cobrancas`, `marcar_como_paga`, `desfazer_pagamento`, `cancelar_cobranca`, `fechar_mes`, `reabrir_mes` (motivo pelo `app.motivo`), `importar_lancamentos`, `desfazer_importacao`, `minha_academia_de_dono`, `pode_fazer_checkin`. `.env.exemplo` sem valores.
- **Dado financeiro fora de log**: o único `console` está em `src/util/registrar.ts`, só em desenvolvimento e só com o nome e o código do erro; a frase do erro do banco é traduzida por palavra-código, nunca mostrada como veio.
- **XLSX**: `read-excel-file` 9.3.10 (MIT), só leitura, carregado sob demanda; auditado (sem script de instalação, sem eval nem rede); `npm audit` = **0 vulnerabilidades**. Registrado em `docs/decisoes.md`.

### As telas (todas com carregando, vazio, erro, salvando e sem permissão)

| Tela | O que faz |
|---|---|
| Moldura | barra lateral preta com logo e faixa ADMIN, contadores (funil, agenda), tema, modo local; topo com mês, busca global **Ctrl+K** (pessoas, cobranças, lançamentos, notas; setas, Enter, Esc), **Filtro /**, **Anotar N**, **Lembrar L**, "Salvando… / Salvo às 10:42"; barra de baixo no celular; aviso com Desfazer |
| Painel | igual ao AK: herói + previsão ao lado, comparação no mesmo trecho e o mês anterior inteiro, 12 meses, previsão por partes, quem deve (WhatsApp pronto), funil, hoje; todo número abre a lista |
| Lançamentos | a grade com o teclado completo (setas, Home/End, Ctrl+Home/End, PgUp/PgDn, Shift+setas, Shift+Espaço, Enter/F2, digitar abre, Tab, Esc, Ctrl+Z/Y/Shift+Z, Ctrl+V de várias linhas com prévia e erro na célula, Ctrl+C, Ctrl+Enter, Delete arquiva), seleção com soma e ações em lote, totais fixos, cobranças em aberto com "Marcar como paga", gerar mensalidades, exportar CSV, mês fechado com cadeado e "Reabrir com motivo"; no celular, lista por dia com edição em folha |
| Cobranças | grupos por situação calculada, marcar como paga (gaveta, parcial recusado, multa/juros só se a academia cobrar), desfazer pagamento, exportar |
| Despesas fixas | lista, gerar as do mês, "Lembrar todo mês", "Conferir a conta" da estimada, criar, editar, desligar |
| Fechamento | os 13 meses com totais congelados, fechar (pendências antes, não impede) e reabrir (motivo obrigatório) |
| Importar | CSV, XLSX ou colar; conferir colunas (trocar o papel), prévia em grupos, categorias novas (criar ou usar uma existente), repetidas, erros; gravar; desfazer a importação |
| Exportar | mês ou ano, CSV do Excel em português (BOM, `;`, CRLF, vírgula) ou padrão, prévia de como o Excel abre |
| Pessoas | filtros cruzados com contagem, filtros salvos, frase do filtro com chips, filtro total na gaveta, salvar filtro, exportar, aluno novo (avisa pessoa parecida); responsáveis |
| Fichas | aluno (matrícula, trancar, encerrar, cobranças, notas, histórico), responsável Kids (dependentes, cobranças da família, "marcar as N como pagas", sugestão de desconto família), funcionário |
| Funcionários | a folha do mês calculada, ficha, lançar a remuneração como saída, desligar, funcionário novo |
| Relatórios | mês, ano, por categoria, por modalidade (com o mesmo trecho do período anterior), por forma, por professor, por evento, inadimplência (WhatsApp pronto, taxa do mês); exportar |
| Funil | 4 colunas com as ações do R19.3, chamar de volta (lembrete pronto), de onde vem aluno, interessado novo, matricular do funil com o desconto da indicação para os dois |
| Agenda, Notas | hoje/atrasados/em breve, calendário com repetições e vencimentos, tarefas, concluir e adiar; notas fixadas, busca, filtro por pessoa e período |
| Histórico | em frase, por grupo, pessoa e período |
| Ajustes | **regras de cobrança provisórias** (com o aviso), categorias (renomear, ordenar, arquivar, criar), planos (valor), modalidades, academia (recomeçar o exemplo) |
| Entrar | e-mail e senha, cadastro do segundo fator (QR do autenticador), código; tela inteira "Esta área é do dono" |

## 4. Os testes

| O quê | Resultado |
|---|---|
| Domínio inteiro (`cd app && npm run testar:dominio`) | **456 / 456**, no fuso local e com `TZ=Asia/Tokyo` (deslocamento −540 conferido). O total mudou de 516 para 456 durante a onda porque o AM2 tirou testes de musculação do `app/`. |
| Só o financeiro | **94 / 94** (86 do AI + 8 do `revisao-ar.test.ts`) |
| Admin, Vitest (`npm run testar`) | **24 / 24** em 4 arquivos: a planilha pelo teclado (5: andar, linha nova + erro + desfazer/refazer, editar + Esc, colar 3 linhas com 1 erro como uma ação só, mês fechado + reabrir), repositório local (6), repositório Supabase com cliente falso (5), utilidades (8: redação de log, CSV/1252, XLSX de verdade, WhatsApp, percentual, tokens) |
| Prova de que morde | tirei a trava do mês fechado da grade: o teste do mês fechado caiu; voltei, passou |
| Playwright (`npm run testar:e2e`), 2040 × 790 | **2 / 2**: lançar pelo teclado → colar do Excel → marcar como paga → fechar outubro → exportar (BOM EF BB BF, cabeçalho, linhas, sem "2026-10"); importar o XLSX de exemplo → conferir colunas → gravar 4 → desfazer |
| `tsc --noEmit`, ESLint | 0 erros |
| `npm audit` | **0 vulnerabilidades** |
| `npm run build` | passa; JS de 762 kB (o supabase-js entra mesmo no modo local: ver pendências) |

Observação: nesta máquina os testes do Vitest rodam um arquivo por vez (`fileParallelism: false`), porque quatro jsdom juntos não sobem dentro do tempo do worker (um pente de RAM).

## 5. As capturas

Em `admin/capturas/`, com os **mesmos nomes** das do AK (`<tela>-pc.png`, `-pc-claro`, `-celular`, `-celular-claro`): painel, financeiro, financeiro-colar, financeiro-fechado, financeiro-folha, cobrancas, despesas-fixas, fechamento, importar, exportar, pessoas, filtro, ficha-aluno, ficha-kids, ficha-funcionario, relatorios, relatorio-ano, inadimplencia, funil, agenda, notas, historico, ajustes, busca. Para refazer: `npm run dev` e `npm run capturar`.

**Comparação com o AK**, olhando lado a lado: a moldura, o painel, a planilha (célula ativa, linha marcada, origem, totais fixos, barra de status), a colagem com erro na célula, o mês fechado, as cobranças, a agenda, o funil, os relatórios e o celular (barra de baixo, folha) batem com o desenho. O que muda é o NÚMERO: o AK desenhou com um exemplo à mão (186 matriculados, R$ 8.467,60); o Admin mostra o que o domínio calcula sobre a academia de exemplo (176 matriculados, R$ 1.109,00 até o dia 15, porque o aluguel e os salários saem cedo; a previsão do fechamento é R$ 5.252,18, ao lado, como o AK pediu).

## 6. O que ficou provisório

- **Regras de cobrança** (`admin/src/dados/regras-provisorias.ts`, o único lugar): primeiro mês cheio (A7); sem multa e juros (A3); gerar no dia 1 desligado (A6); 3 dias para chamar de volta (A15); família 10 % (A8, só sugestão); indicação R$ 30 por 1 mês (A9); 180 dias para o interessado (L23). A tela de Ajustes mostra "PROVISÓRIOS" até o dono marcar que são os reais.
- **Preços e remunerações**: os de `exemplo.ts` (A18, A19); professores e alunos com nomes inventados.
- **Logo e ícone do app**: os provisórios do AL.
- **"Treinaram" e "No tatame"**: mostram "—" até a presença do app da equipe existir (AJ, R15).

## 7. Pendências

**Para o Alex / a academia**: as perguntas que travam continuam (A1, A3, A7, A13 — a planilha real, que é o melhor teste da importação —, A18, A19); o logo original.

**Técnicas (não feitas, por decisão ou por falta de projeto):**
1. **Rodar as migrações num Supabase de verdade** e um teste de RLS (dono entra, recepção é barrada, histórico sem update/delete). O SQL não foi executado em lugar nenhum.
2. **Matricular do funil e "marcar as N como pagas"** são gravações em sequência no repositório; no Supabase devem virar uma função só (`matricular_interessado`, seção 38). Escrever junto com o item 1.
3. **Gerar as mensalidades sozinho no dia 1** (A6): a Edge Function não foi escrita; o caminho (`inserir_cobrancas` com o índice único) está pronto.
4. **Aviso no celular do dono** (resumo das 08:00, Web Push): não foi feito.
5. **Tamanho**: separar o supabase-js num pedaço carregado só no modo Supabase (o JS principal cai de ~760 kB).
6. Despesas fixas: a coluna "Valor" mostra o valor da regra; mostrar o da linha do mês quando estimada.
7. Em telas de busca e listas muito longas (pessoas, histórico) não há paginação além de 300 linhas no histórico; com a academia real, conferir.

**Pedidos ao AM2 (fora da minha pasta):**
- acrescentar ao `app/dados/redigir.ts` os campos financeiros (valor, descrição, nota, lembrete, telefone, remuneração, descontos, mudanças do histórico); a lista que uso está em `admin/src/util/registrar.ts`;
- levar `academias`, `vinculos` e `tem_vinculo()` para `app/supabase/migracoes/` (hoje estão provisoriamente na `20261015000100_base_compartilhada.sql` do Admin, toda com `if not exists`);
- as tabelas `modalidades`, `eventos`, `interessados` e `aulas_experimentais` são do modelo de luta: criei o mínimo que o Admin usa (`create table if not exists`); ao escrever as dele, ele pode acrescentar colunas, não precisa recriar.

**Para o AL**: as duas cores do claro (sucesso `#087033`, atenção `#A84700`) e os tokens só do admin (lateral, seleção, zebra, barra do gráfico), que estão numa tabela do gerador.

## 8. Arquivos

- Domínio: `app/dominio/financeiro/{datas,painel,historico,mensalidades,fechamento,importacao,tipos}.ts` e `revisao-ar.test.ts`.
- Admin: `admin/` inteiro; o começo é `admin/LEIA-ME.md`.
- Decisão: `docs/decisoes.md`, entrada "15/10/2026 — A construção do Admin (agente AM1, P12)".

## Resumo

O Admin está construído e roda no PC e no celular, igual ao desenho, sobre uma Raça Fight de exemplo de 13 meses. A planilha funciona inteira pelo teclado, com colar do Excel, desfazer e o cadeado do mês fechado. Cobranças, fechamento, importar XLSX e exportar CSV também funcionam, e as outras telas estão todas de pé. Os três erros do domínio que o AR achou foram corrigidos com o teste antes. Os testes passam: o domínio dá 456 nos dois fusos, o Vitest do Admin 24, o Playwright 2, com 0 vulnerabilidades. Os valores são provisórios e ficam num lugar só. O Supabase está escrito, mas nunca rodou: ele espera um projeto de verdade.
