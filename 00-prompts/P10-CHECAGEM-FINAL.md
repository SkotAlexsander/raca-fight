# P10 — Checagem final: bugs, fragilidade e melhorias para o cliente (11/10/2026)

O Alex aprovou o design: "agora sim a gente está realmente num ponto muito bom". **O visual está congelado.** Ninguém muda cor, tamanho, tipografia, imagem ou layout. A exceção é a correção de defeito, e mesmo ela mantém o `auditar.mjs` com 0 achados.

Todos leem antes `00-prompts/P00-CONTEXTO.md`, `CLAUDE.md` e `docs/decisoes.md` (as decisões valem). Também leem os relatórios em `docs/revisao/`, para não repetir achado já resolvido. Português do Brasil. Nenhum agente resolve um **[decidir]**.

| Agente | Escreve em | Relatório |
|---|---|---|
| T — Código: bugs e fragilidade | `app/`, `03-arquitetura/` | `docs/revisao/T-CODIGO.md` |
| U — Protótipo: bugs de interação | `02-design/sistema-de-design/mockups/*.js` e `*.html`, só na parte de script e acessibilidade | `docs/revisao/U-PROTOTIPO.md` |
| V — Melhorias para o cliente | `01-especificacao/` (acrescentando), `docs/revisao/V-CLIENTE.md` | `docs/revisao/V-CLIENTE.md` |

## T — Código: bugs e fragilidade

O alvo é `app/dominio/`: `treino`, `unidades`, `avisos`, `cronometro`, `catalogo` e `tipos`. Também `app/package.json`, `app.json`, `eas.json` e `tsconfig.json`.

1. **Bugs**: leia cada função contra a regra dela em `01-especificacao/03-REGRAS.md` e procure limites:
   - vazio, zero, negativo, enorme, `NaN`, `Infinity`;
   - texto com vírgula ou ponto;
   - fuso horário e horário de verão (o Brasil não tem mais, mas o aparelho pode estar em outro fuso);
   - virada de dia, mês e ano;
   - relógio do aparelho mudando para trás;
   - lista com um item só;
   - mutação de objeto recebido.

   Para cada bug: **teste que falha primeiro**, depois a correção.
2. **Fragilidade** (o código funciona hoje, mas quebra fácil):
   - validação que falta na entrada de dados vindos de fora (JSON do catálogo, servidor, armazenamento local);
   - tipos largos demais (`string` onde cabe uma união);
   - função que confia que outra já validou;
   - número mágico repetido;
   - duas fontes da mesma verdade (por exemplo, a duração no catálogo e o cálculo);
   - teste que passa por acaso, sem verificar o que diz.

   Proponha e aplique o endurecimento. Uma ideia é um teste com muitos casos gerados por um gerador simples com semente fixa, sem biblioteca, para propriedades como "formatar e depois ler devolve o mesmo valor" e "a duração nunca é negativa".
3. **Segurança**: rode a skill `auditar-seguranca` sobre `app/` e `03-arquitetura/`. O foco é:
   - dado de saúde (LGPD);
   - regras de acesso (RLS) descritas na arquitetura;
   - o que sai em log ou notificação;
   - dependências do `package.json`, incluindo as versões coerentes com o Expo SDK 54.

   Achado não refutado não entra no relatório.
4. **Configuração**: confira cada dependência contra o SDK 54, cada caminho de arquivo citado no `app.json` (tem de existir em `recursos/`) e os perfis do `eas.json`. Não rode `npm install`. Se precisar provar algo, instale numa pasta temporária fora do projeto.
5. Rode `node --test "dominio/**/*.test.ts"` dentro de `app/` no fim. Node 24 roda `.ts` direto: sem `enum`, com `import type` para tipos e com a extensão `.ts` em todo import.

## U — Protótipo: bugs de interação

Alvo: `mockups/index.html`, `entrada.html` e `novas.html`.

1. Com Playwright, exercite **todas** as interações das três páginas:
   - marcar e desfazer série;
   - deslizar para começar;
   - segurar cartão;
   - pular fase, pausar e parar o cronômetro;
   - trocar de aba;
   - dispensar aviso;
   - gráficos: toque, mouse e teclado, e "Ver em tabela";
   - repetir abertura e comemoração;
   - todos os seletores do topo (tema, aparelho, movimento, transparência, fonte, foto, `?abas=mais`, `?moldura=real`).

   Combine os seletores entre si: por exemplo, trocar o aparelho com o cronômetro rodando, ou trocar o tema no meio de uma animação.
2. Procure:
   - erro no console;
   - estado que não volta (a série fica marcada depois de desfazer, o timer duplica, um intervalo não é limpo);
   - foco perdido ou preso;
   - elemento sem rótulo para leitor de tela;
   - atalho de teclado que não funciona;
   - animação que não respeita "reduzir movimento";
   - vazamento (`setInterval` ou listener que se acumula ao repetir).
3. Corrija **só o script e a acessibilidade**, sem mudar o visual. Rode `auditar.mjs` no fim (0 achados) e compare capturas antes e depois: nada pode ter mudado de aparência.

Use a sua própria subpasta no scratchpad. O Playwright está em `A:/Claude/03-projetos/.ferramentas/node_modules/playwright`. Se o Chromium padrão der acesso negado, use `C:/Users/alexs/AppData/Local/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-win64/chrome-headless-shell.exe`.

## V — Melhorias para o cliente

O cliente tem dois rostos:
- **a academia**, que compra ou adota o app: o dono, a recepção, o instrutor e o personal;
- **o aluno**, que usa o app todo dia.

Leia a especificação inteira, `docs/revisao/B-MELHORIAS.md` (a revisão de 10/10, para não repetir o que já entrou ou foi adiado de propósito) e `05-FORA-DA-V1.md`.

1. Para **cada papel**, percorra o dia real dele no app, de ponta a ponta, usando as telas do mapa. Exemplos:
   - o aluno que chega às 6h sem sinal no porão;
   - a instrutora com 40 alunos no turno;
   - o dono na segunda de manhã;
   - o personal com 15 alunos Plus.

   Anote atrito, passo a mais, informação que falta na hora certa e tela que não existe.
2. **Por que a academia pagaria**: o que ela ganha em número (retenção, menos evasão, venda do Plus, tempo do instrutor) e o que falta para provar isso a ela. Procure na web dados de evasão em academias no Brasil, citando a fonte.
3. Entregue `V-CLIENTE.md` com:
   - o top 10 por valor ÷ esforço;
   - para cada item: o problema, a proposta, o papel beneficiado, o tamanho (P/M/G) e se é v1 ou depois.

   Os itens P de v1 que **não** dependem de [decidir] você já acrescenta à especificação: história, regra ou linha no mapa de telas, marcando "(P10)". Os outros ficam como proposta.
4. Nada de mudar visual. Se uma melhoria pedir tela nova, descreva a tela na especificação; o desenho fica para depois.
