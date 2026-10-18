# L — Aplicação (P08, 10/10/2026)

Agente L. Juntei no mockup real as três entregas do P08: a direção de arte do I, as imagens do J e os efeitos do K. Escrevi só em `02-design/sistema-de-design/`, `docs/apresentacao/` e neste arquivo. Nenhum **[decidir]** foi resolvido.

## 1. O que mudou

### Mockup (`02-design/sistema-de-design/mockups/`)

- **Direção A · Lousa clara com foto** (a recomendada; a escolha continua [decidir] do Alex), com os dois empréstimos opcionais:
  - **placar da C** no topo do treino do dia (5/18 séries · 14 minutos · 2/6 exercícios, em `numeroCarga` 40, com a grade que quebra quando a fonte cresce);
  - **halo da B** no exercício atual, só no escuro (no claro, contorno de 2 px na marca).
- **Cores e fontes da marca**: os três blocos de cor do `sistema.css` (claro, escuro e "segue o sistema") com os valores de `tokens-marca.json`, mais `marcaSuave`, `plusSuave`, `plusTextoSobreFundo`, `trilho` e `regua`. Figtree e Archivo em `mockups/fontes/` (woff2 + licenças OFL), sem depender de internet.
- **Peças da A**: cartão de raio 20 com sombra em 6 camadas no claro e contorno de 1 px no escuro; miniatura de 56 (64 no atual) com raio 14; "marcar série" em marca cheia; pílula `marcaSuave` atrás da aba ativa; capa de 184 no treino pronto em destaque e 104 na grade; botão dourado só no convite ao Plus.
- **Contraste com o dourado**: no claro o `plus` é só preenchimento. O selo de contorno, os ícones de check do convite e o nome da personal passaram a usar `plusTextoSobreFundo`.
- **6 telas** (a 6ª é nova): Treino do dia · Treinos prontos · Perfil do aluno (academia) · Dieta (Plus) · Cronômetro · **Convite ao Plus**. Claro e escuro pelo seletor de tema; iPhone SE, 13 mini, 16 e 16 Pro Max e Android 390 pelo seletor de aparelho. `?moldura=real` e `?aparelho=` continuam funcionando.
- **Imagens do J**, com caminho relativo (`../../imagens/...`), `srcset` 1×/2×, `width`/`height`:
  - capas por objetivo nos cartões de treino pronto;
  - miniaturas de exercício nas telas 1 e 3 e no componente 5;
  - ilustrações de estado vazio (claro e escuro) no componente 15 e na tela 6;
  - foto do convite ao Plus na tela 6.
  - `alt` em português nas fotos que dizem algo ("Mulher faz agachamento com barra nas costas", "Senhora de cabelo grisalho no elíptico", "Personal acompanha uma aluna no agachamento" etc.). Miniaturas e ilustrações ficaram com `alt=""`, de propósito: o nome do exercício ou o título já está ao lado, e repetir faria o leitor de tela ler duas vezes (regra do `imagens/00-LEIA-ME.md`).
- **Efeitos do K em CSS e WAAPI**, com duração e curva dos tokens (as molas viram `linear()` com a mesma conta da `demo.html`):
  - **série marcada**: o dado entra num registro antes da animação; check com a mola de quique, botão que pisca `sucesso`, toast sobe, régua de "atual" desce e o placar atualiza; o descanso da faixa recomeça (esvazia linear);
  - **fechar treino**: círculo, traço do check e resumo escalonado (seção nova "Efeitos", com "Repetir");
  - **anel do descanso**: 15 s, linear, atenção nos últimos 10, sucesso no fim;
  - **troca de fase**: "Pular fase" na tela 5 cobre a cor em 200 ms e esmaece o nome;
  - **cartão que afunda**: 0,98, desce 1 px, perde a sombra e ganha a camada de 8 %/12 %; volta na `mola.toque`;
  - **esqueleto**: 3 passadas de 1400 ms e para; demonstração com os 300 ms de espera e a troca por esmaecimento;
  - **brilho do Plus**: halo que entra e fica e reflexo que passa uma vez no selo e no botão;
  - **título grande**: preso à rolagem nos 40 px (iPhone: o título pequeno aparece na barra; Android: encolhe por escala);
  - **troca de aba**: a pílula esmaece e cresce.
  - **Movimento reduzido**: segue `prefers-reduced-motion` e uma chave nova no topo ("Movimento / Reduzido"). Tudo vira esmaecer de 160 ms; o cronômetro salta por segundo; a cor da fase troca na hora.
- **Ultrawide (2040 × 790)**: as 6 telas ficam **numa linha só**. A grade passou de `flex-wrap` para colunas calculadas: a maior quantidade por linha que não encolha a moldura mais de 15 % além do que a altura já pede, sempre em linhas equilibradas (6, 3 + 3 ou 2 + 2 + 2; nunca 5 + 1). A 1440 × 900 fica 3 + 3. A página saiu do limite de 1400 px. O corpo do aparelho ganhou cor própria (`--cor-moldura`) para não ficar branco no escuro.

### Conflitos que o K anotou, resolvidos

| Onde | Antes | Agora |
|---|---|---|
| `05-ACESSIBILIDADE.md`, seção 5 (e o item do checklist) | "todas as `duracao` vão a 0" | todo efeito vira esmaecer de 160 ms; exceções do cronômetro mantidas; loop só no cronômetro e no "atualizando" nativo |
| `tokens.json › duracao.$regra` e `01-TOKENS.md` | "vão a 0" | esmaecer de 160 ms |
| `02-COMPONENTES.md`, componente 8 e estados padrão | pressionado = `sombra.2` (sobe) | **afunda**: 0,98, desce 1 px, sem sombra, camada de 8 %/12 %, volta na `mola.toque` |
| `02-COMPONENTES.md`, esqueleto | "sem brilho animado quando reduzido" | brilho de 1400 ms, no máximo 3 passadas, só depois de 300 ms |
| `sistema.css`, `.indicador` | `animation: girar 0.8s linear infinite` | gira 3 voltas de 1400 ms (o teto do esqueleto) e para como arco de 3/4; reduzido: parado |

O `movimento/00-CATALOGO.md` ganhou uma nota marcando os itens 1 a 3 da seção 5 como resolvidos.

### `tokens.json` → **1.5.0**

Cores claro/escuro da marca + `plusTextoSobreFundo`, `plusSuave`, `marcaSuave`, `trilho`, `regua`; famílias Figtree/Archivo e `familiaPorPeso` preenchido; `raio.cartao` 20 e `raio.miniatura` 14; grupo `imagem` (184 / 104 / 56 / 64 / 48 / 120); `abas.pilulaAtiva`; `sombra.1` e `sombra.2` da A e `sombra.atual`; `duracao.$regra` corrigida; `$historico`.

Também ajustei duas coisas que a fonte Figtree (mais larga que a do sistema) quebrou a 160 %: a `.linha-botoes` agora empilha quando os dois rótulos não cabem, e o nome da refeição quebra a palavra se for preciso.

## 2. Auditoria

```
node 02-design/sistema-de-design/auditoria/auditar.mjs
```

**0 achados**, em 124 combinações: 7 janelas + amostra 324, os 4 iPhones na janela própria, a 1440 × 900 e a 2040 × 790, dois temas, fonte a 100 % e 160 %. O contraste já é medido nas cores reais da marca. Nenhum erro de script. Na primeira rodada com a marca apareceram 6 achados (2 distintos): o "Confirmar" estourando a caixa a 160 % no 360 e "Lanche da tarde" vazando na amostra de 324. Os dois foram corrigidos. Resultado em `auditoria/resultado.json`; capturas refeitas em `auditoria/capturas/`.

## 3. PDF (`docs/apresentacao/`)

`node capturar.mjs` (52 capturas + 33 cópias), `node montar.mjs` (**sem avisos**), `node folhear.mjs`. Olhei as 34 páginas em PNG. Apaguei os PNG de páginas antigas (`pagina-30` a `pagina-38` que sobraram de versões anteriores). Ficou **34 páginas** (antes 29).

- **Saiu o "protótipo ainda em cinza"**: na ficha da capa, na caixa da Parte 9 (virou "com a marca") e no item 2 dos Próximos passos (marcado como feito).
- **Telas**: as 6 no claro numa página e as 6 no escuro em outra, na moldura do iPhone 16; a capa mostra o convite ao Plus.
- **Páginas novas**:
  - Direção de arte: as 3 opções lado a lado, com quadro de "ganha e perde" e a recomendação [decidir]; a lista de treinos e o escuro nas três;
  - Imagens: as capas, as miniaturas e os estados vazios, mais a política de licença (Unsplash, conferência de Unsplash+, `CREDITOS.md`, sem marcas, sem IA) e as duas fotos provisórias;
  - Efeitos: uma página com 8 quadros de `movimento/capturas/quadros/`;
  - iPhone e Android: a mesma tela em SE, 16, 16 Pro Max e Android, a tabela do que é igual e do que segue o sistema, e o "iPhone sem ter um Mac";
  - Cronômetro e avisos numa página: os três modos, as regras R9, avisos de exemplo e as regras anti-incômodo.
- **Parte 13** ganhou a 8ª pendência, **direção de arte**; "sete" virou "oito" no sumário e nos próximos passos.
- `capturar.mjs` agora também captura o comparativo de direção de arte, a tela 1 em mais 3 aparelhos e a paleta no escuro, e copia as imagens e os quadros. A lista de componentes foi corrigida: antes faltava o 18 (Cronômetro), e da 8ª captura em diante os nomes ficavam deslocados. O `navegador.mjs` serve `.webp` com o tipo certo.

## 4. Pendente

- **[decidir] do Alex**: a direção (A, B ou C) e se os dois empréstimos entram. Se não for A, mudam valores de `tokens.json` e do `sistema.css` (lista em `direcao-de-arte/00-LEIA-ME.md`), não as telas.
- **Miniaturas no tamanho da A**: o J entregou 48/96 px, e a A usa 56 e 64. No 2× a de 64 sai ampliada 1,33×. Pedir ao J as versões 56/112 e 64/128.
- **Fotos provisórias** (supino inclinado e crucifixo) e a troca das capas por fotos da academia real, quando houver uma.
- **Para `docs/decisoes.md`** (fora da minha pasta), texto sugerido:
  > 10/10/2026 — Mockup e tokens 1.5.0 com a marca na direção A. **Critério**: a A é a que menos arrisca a leitura no meio da série e a que mais usa foto; muda valores, não estrutura. **Alternativa descartada por ora**: B (brilho, risco de neon) e C (pouca foto, mais altura). **Mudaria se** o Alex escolher B ou C. Também: movimento reduzido = esmaecer de 160 ms, não 0; e cartão pressionado afunda em vez de subir.
- **Itens 4 a 6 do catálogo do K**, fora de `sistema-de-design/`:
  - alinhar a vibração dos 3, 2, 1 em `03-arquitetura/04-IPHONE.md`;
  - registrar o Reanimated 4 em `decisoes.md`;
  - calibrar as molas num aparelho.
- **Efeitos que não pedem tela nova** ficaram só na `demo.html` do K: puxar para atualizar e a pilha de telas.
