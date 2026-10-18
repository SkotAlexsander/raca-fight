# P05 — Rodada de revisão (quatro agentes em paralelo)

Todos leem antes `00-prompts/P00-CONTEXTO.md` e `CLAUDE.md`. Português do Brasil. **Nenhum resolve um [decidir]** e nenhum troca uma decisão já registrada em `docs/decisoes.md`; quem discordar de uma decisão escreve a proposta no relatório. Cada agente **só escreve na pasta dele** (abaixo) e no relatório dele em `docs/revisao/`. O que precisar mudar na pasta de outro vira item no relatório.

| Agente | Escreve em | Relatório |
|---|---|---|
| A — Bugs | `app/`, `03-arquitetura/` | `docs/revisao/A-BUGS.md` |
| B — Melhorias | só o relatório | `docs/revisao/B-MELHORIAS.md` |
| C — Responsividade e proporções | `02-design/sistema-de-design/`, `02-design/marca-e-proposta/logo/` | `docs/revisao/C-RESPONSIVIDADE.md` |
| D — PDF de apresentação | `docs/apresentacao/` | — (o PDF é a entrega) |

## A — Bugs e correções

Caça bug de verdade, com prova. Ordem:
1. **Código** (`app/dominio/*.ts`): leia cada função contra a regra que ela implementa em `01-especificacao/03-REGRAS.md` (R1–R8). Procure arredondamento e unidade (gramas, mm, segundos, centavos), limite (0, vazio, negativo, muito grande, carga `undefined` × `0`), mutação de objeto que devia ser imutável, datas (fuso, virada de mês, ano bissexto), texto PT-BR (vírgula decimal). Para cada bug: **primeiro um teste que falha**, depois a correção, depois o teste passando. Rode `node --test "dominio/**/*.test.ts"` dentro de `app/` no fim.
2. **Configuração** (`app/package.json`, `tsconfig.json`, `app.json`): versões que não combinam entre si (Expo SDK × React Native × React × Expo Router), script que não roda, caminho de arquivo inexistente. Não rode `npm install`.
3. **Coerência entre documentos**: modelo de dados (`03-arquitetura/01-MODELO-DE-DADOS.md`) × regras da especificação × tipos em `dominio/tipos.ts` × nomes de token em `tokens.json` e `tokens-marca.json`. Divergência no código ou na arquitetura você corrige; divergência em especificação ou design vai para o relatório com a correção proposta.
O relatório lista cada achado como: **onde (arquivo:linha) · o que está errado · como provou · o que fez**. Achado que você não conseguiu provar não entra.

## B — Melhorias

Leitura crítica do produto como um todo, do ponto de vista de quem vai usar: o aluno iniciante, o aluno que já treina, a instrutora com 40 alunos no turno, o dono. Não edite nada; escreva `docs/revisao/B-MELHORIAS.md` com:
1. **Buracos**: situações reais que nenhuma história ou fluxo cobre (ex.: o aluno troca de academia; o personal sai da academia; o aparelho está ocupado e ele troca o exercício; lesão no meio do plano; aluno que treina em casa).
2. **Atrito**: passos demais, tela que pede o que o app já sabe, decisão que o aluno não sabe tomar.
3. **Valor que falta para vender o Plus** e para a academia querer adotar o app (o que o dono ganha de verdade).
4. **Riscos**: LGPD, lojas (regra da Apple/Google sobre pagamento de conteúdo digital), suporte, custo de servidor.
Cada item: o problema em uma frase, a proposta, o tamanho (P/M/G), e se é v1 ou depois. No fim, um **top 10** em ordem de valor ÷ esforço. Use o `01-especificacao/05-FORA-DA-V1.md` para não repetir o que já foi adiado de propósito.

## C — Responsividade e proporções

Abre de verdade no navegador e mede. Use o Playwright de `A:/Claude/03-projetos/.ferramentas/node_modules/playwright` (se o Chromium padrão der "acesso negado", use `C:/Users/alexs/AppData/Local/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-win64/chrome-headless-shell.exe`). Scripts e capturas de trabalho ficam em `02-design/sistema-de-design/auditoria/`.
1. **Mockup** (`02-design/sistema-de-design/mockups/index.html`) e **comparativo do logo** (`02-design/marca-e-proposta/logo/comparativo.html`): nas larguras 360, 390, 430, 768, 1280, 1440 e **2040 × 790** (o monitor ultrawide do Alex: pouca altura, muita largura), nos temas claro e escuro, com fonte do sistema a 100 % e a 160 %.
2. Meça com script, não no olho: rolagem horizontal, elemento que estoura o pai, texto cortado ou sobreposto, alvo de toque abaixo do token (48 px; série/+/- 56 px), contraste abaixo de 4,5:1 (texto) e 3:1 (texto grande e ícone), imagem ou SVG deformado (proporção errada, esticado), moldura de celular fora da proporção 390 × 844, espaços que não seguem a escala de 4 px, cabeçalhos e números desproporcionais entre si (a escala tipográfica do `tokens.json`).
3. Corrija no CSS/HTML e meça de novo até zerar. Toda medida nova vira token em `tokens.json` (nada de número mágico). Se um documento do sistema de design afirmar algo que a medição desmentiu, corrija o documento.
4. Deixe `auditoria/auditar.mjs` como comando que roda tudo de novo e imprime "0 achados", e as capturas finais (uma por largura e tema) em `auditoria/capturas/`.
Relatório: tabela antes × depois por largura, a lista do que mudou e o que ficou de fora com o motivo.

## D — PDF de apresentação

Um PDF A4 retrato que apresenta o Academia Plus a quem não sabe nada dele (o Alex mostrando para um sócio, uma academia interessada ou um investidor), no padrão dos outros PDFs do Alex: siga o método de `A:/Claude/03-projetos/Valores/docs/apresentacao/` (leia `montar.mjs`, `capturar.mjs`, `navegador.mjs` e `valores.css` e reaproveite a técnica: partes em HTML, capturas reais, Playwright imprimindo, conferência de estouro).
- Pasta: `docs/apresentacao/` (`partes/*.html`, `apresentacao.css`, `capturar.mjs`, `montar.mjs`, `folhear.mjs`, `navegador.mjs`, `_capturas/`, `saida/`). Arquivo final: `saida/Academia Plus - Ideia, estrutura e design.pdf`.
- Partes (cerca de 20 a 30 páginas): capa · o problema e a ideia em uma página · as duas visões · o que o aluno faz · o que a academia faz · o Plus (o que inclui, por que alguém paga) · os caminhos principais (fluxos, em diagrama) · mapa de telas · marca (proposta, tom, paleta, os 3 logos lado a lado) · sistema de design (tokens, componentes, as 4 telas do mockup em moldura) · arquitetura (stack, modelo de dados em diagrama, offline, LGPD) em linguagem de gente · o que fica para depois · **decisões pendentes** (as 6 do P00 com a recomendação de cada uma) · próximos passos.
- Visual: use a marca (`02-design/marca-e-proposta/tokens-marca.json` e o logo recomendado, caminho A), tipografia e cores dela; capturas reais do mockup e do comparativo de logo, nunca imagem inventada. O mockup pode estar sendo corrigido por outro agente enquanto você trabalha: **tire as capturas por último** e deixe `capturar.mjs` pronto para ser rodado de novo.
- Antes de entregar: `montar.mjs` sem aviso de estouro nem de fonte que falhou; `folhear.mjs` gerando PNG de todas as páginas e você **olhando cada uma** (texto cortado, página quase vazia, imagem pequena demais, tabela partida). Texto com frases curtas e sem jargão: termo técnico só com a explicação do lado.
