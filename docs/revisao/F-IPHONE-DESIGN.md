# F — iPhone (design)

Agente F · 10/10/2026. Escrevi só em `02-design/sistema-de-design/` e neste relatório. Não mexi em `app/`, `03-arquitetura/` nem no PDF. A rodada C (`C-RESPONSIVIDADE.md`) continua valendo: as janelas antigas seguem com 0 achados e nada do que ela corrigiu foi desfeito.

## Como medir de novo

```
node "02-design/sistema-de-design/auditoria/auditar.mjs"
```

São as mesmas medidas da rodada C, mais estas:

- **4 iPhones** (`tokens.json › layout.aparelhos`):
  - SE 3ª geração, 375 × 667;
  - 13 mini, 375 × 812;
  - 16, 393 × 852;
  - 16 Pro Max, 440 × 956.

  Cada um roda na janela do próprio tamanho, com o mockup aberto em `?aparelho=<id>` e o comparativo de logo na mesma largura. A moldura de cada iPhone também roda a 1440 × 900 e a 2040 × 790. Tudo nos dois temas e com a fonte a 100 % e a 160 % (no iOS, Texto Dinâmico grande).
- **Área segura**, medida nova (seção 12 do script). Os insets vêm do `tokens.json`, não do CSS, para pegar o CSS que se afaste do token. Ela confere:
  - nenhum texto, ícone ou alvo de toque do app dentro do inset do topo ou da base;
  - nada embaixo da Dynamic Island, do notch, do furo da câmera ou do indicador de início;
  - o cabeçalho começa abaixo do recorte, e a barra de abas termina acima do indicador;
  - a hora e a bateria não cruzam o recorte;
  - cada aparelho tem o desenho certo: o SE tem botão Início e não tem indicador nem recorte.
- **Aparelho certo**: o mockup tem de mostrar o aparelho pedido na URL, com a tela exata dele.

São 124 combinações: as 60 antigas e mais 64 novas. Em `auditoria/capturas/` há 60 capturas: as 28 antigas refeitas e 32 novas, chamadas `mockup-<aparelho>-<janela>-<tema>.png` e `logo-<janela>-<tema>.png`.

`--antes-iphone` salva em `resultado-antes-iphone.json`. É o mesmo script, rodado no mockup como estava antes desta rodada. O `resultado-antes.json` da rodada C ficou intocado.

Conferi que a medida nova pega erro: estraguei de propósito os insets do iPhone 16 no CSS (topo 30, base 0, indicador a 30 da borda). O script acusou 630 achados:

| Tipo | Achados |
|---|---|
| fora da área segura | 246 |
| embaixo do indicador | 216 |
| cabeçalho sob o recorte | 48 |
| abas sob o indicador | 48 |
| texto sobreposto | 36 |
| embaixo do recorte | 36 |

Depois voltei o CSS.

## Antes × depois

Achados somados nos dois temas e nas duas fontes (4 combinações por linha).

| Rodada | Mockup antes | Logo antes | **Depois** |
|---|---|---|---|
| 7 janelas antigas + amostra 324 (moldura padrão) | 0 | 0 | **0** |
| iPhone SE · 375 × 667 | 52 | 0 | **0** |
| iPhone SE · 1440 × 900 | 52 | — | **0** |
| iPhone SE · 2040 × 790 | 52 | — | **0** |
| iPhone 13 mini · 375 × 812 | 20 | 0 | **0** |
| iPhone 13 mini · 1440 × 900 | 20 | — | **0** |
| iPhone 13 mini · 2040 × 790 | 20 | — | **0** |
| iPhone 16 · 393 × 852 | 50 | 0 | **0** |
| iPhone 16 · 1440 × 900 | 50 | — | **0** |
| iPhone 16 · 2040 × 790 | 50 | — | **0** |
| iPhone 16 Pro Max · 440 × 956 | 54 | 0 | **0** |
| iPhone 16 Pro Max · 1440 × 900 | 54 | — | **0** |
| iPhone 16 Pro Max · 2040 × 790 | 54 | — | **0** |
| **Total** | **528** | **0** | **0** |

Os 528 de antes, por tipo:

| Tipo | Achados | O que era |
|---|---|---|
| moldura fora da proporção | 192 | a tela era sempre 390 × 844, em qualquer iPhone |
| aparelho | 144 | não havia como escolher o aparelho; o SE aparecia com ilha e indicador |
| cabeçalho sob o recorte | 96 | o topo de 54 deixava o cabeçalho 5 pt acima do fim da área segura no iPhone 16 (59) e 8 pt no 16 Pro Max (62) |
| fora da área segura | 96 | o botão ⋯, o chip de visão, "Olá, Ana" e os títulos dentro do inset do topo, de 1 a 8 pt |

A troca do aparelho deixou mais três defeitos no caminho, também medidos e corrigidos:

- **O seletor de aparelho empurrava a página** em 360, 375, 390, 393, 430 e 440 (rolagem horizontal, 24 achados). Os grupos de botões do topo agora quebram linha.
- **O inset de 34 do iPhone caía fora da escala de 4** (144 achados). Ele é número do sistema, não espaço do app. Saiu do preenchimento da base e foi para um espaçador (`.celular__base::after`).
- **No ultrawide, o 16 Pro Max a 160 % não cabia** sob o topo fixo (490 de altura, 483 visíveis; 8 achados). A moldura dele é 13 % mais alta que a de referência e já estava no zoom mínimo de 0,5. Em janela deitada e baixa (até 820 de altura) a nota do topo sai, e a moldura cabe. Não mexi no `zoomMinimo`.

## O que mudou

**Tokens** (`tokens.json` 1.2.0):

1. `layout.aparelhos`: os 4 iPhones e o Android 390. Cada um tem tela, área segura (topo/base), plataforma, recorte e se tem botão Início.
2. `moldura.recortes`: o desenho da ilha, do notch e do furo, e o raio da tela de cada aparelho. `moldura.gesto.distanciaBase` 8: o indicador fica a 8 da borda, dentro do inset.
3. `vibracao`: cada momento com o retorno tátil do sistema. Marcar série é impacto **leve**, concluir treino é impacto **médio** e o fim do descanso é o padrão de notificação de sucesso.
4. `folha`: as alturas média (0,5) e grande (tela menos a área segura e 8), e a alça.
5. `tipografia.familiaPorPeso`, pedido do agente E: no iOS cada peso é chamado pelo nome do arquivo (`Figtree-SemiBold`), não por `fontWeight`. Os valores neutros ficam nulos, e o exemplo com a marca está em `exemploComAMarca`.

**Mockup** (`mockups/index.html` + `sistema.css`):

6. **Seletor de aparelho** no topo: iPhone SE · iPhone 16 · iPhone 16 Pro Max · Android 390.
   - O 13 mini entra pela URL (`?aparelho=iphone-13-mini`), porque o seletor pedido tinha 4 botões.
   - A escolha fica guardada e vai para a URL sem perder `?moldura=real`.
   - O título da galeria diz o aparelho e o tamanho.
7. **Moldura de cada aparelho**:
   - **iPhone 16 e 16 Pro Max**: Dynamic Island.
   - **13 mini**: notch.
   - **SE**: sem recorte, com queixo, alto-falante e botão Início.
   - **Android**: furo da câmera.
   - **Barra de status do sistema** em todos: hora à esquerda; sinal, Wi-Fi e bateria à direita. No SE, a hora fica no centro, como no iOS.
   - **Indicador de início** a 8 da borda, dentro do inset. Antes ele ficava no fluxo, acima do inset.
8. **Áreas seguras de cada aparelho** nas 4 telas:
   - o cabeçalho começa abaixo da área segura do topo, e o fundo dele sobe por trás da barra de status;
   - a barra de abas termina acima do indicador; no SE, que informa 0, ficam os 16 de `areaSegura.baseMinima`;
   - o toast e a faixa do cronômetro sobem junto com a barra.
9. **16 Pro Max com margem 20** dentro da moldura, como manda a regra do celular grande. O SE e o 13 mini caem na faixa < 390: carga 32 e linha de série sem os +/−.
10. **Componente 3**: amostra da barra "Próximo / OK" acima do teclado numérico do iPhone, pedido do agente E.
11. A coluna de amostra (`--coluna-celular`) ficou fixa em 358 (`layout.colunaCelularMedio`), e não muda com o aparelho escolhido. Assim as amostras de componente não mudam de largura quando se troca o aparelho.

**Documentos**:

12. **`06-IPHONE.md`** (novo):
    - os aparelhos;
    - a tabela "igual × segue a plataforma";
    - o que não copiamos do iOS;
    - as 8 convenções pedidas, mais a barra do teclado e o Texto Dinâmico;
    - como conferir.
13. **`02-COMPONENTES.md`**:
    - **campo numérico (3)**: a barra do teclado no iPhone;
    - **seleção (4)**: data e hora com o seletor nativo;
    - **cartão de exercício (5)**: vibração média ao concluir;
    - **linha de série (6)**: vibração leve ao marcar;
    - **cronômetro (7)**: a "vibração longa" virou "vibração de fim". No Android é a vibração longa; no iPhone, o padrão de notificação mais o som da notificação local, como pediu o agente E;
    - **barra de abas (12)**: abas embaixo nas duas plataformas, 64 de altura e acima do indicador;
    - **cabeçalho (13)**: título grande que rola no iOS, voltar com seta e título anterior, título centralizado na tela empilhada, deslizar da borda nunca bloqueado, menu nativo do iOS;
    - **folha inferior (14)**: alturas média e grande, alça, folha nativa no iPhone;
    - **toast (16)**: nunca atrás do indicador;
    - **auxiliares (17)**: interruptor nativo e puxar para atualizar.
14. **`03-NAVEGACAO-E-LAYOUT.md`**:
    - tabela de áreas seguras por aparelho;
    - os iPhones nas faixas pequeno, médio e grande, e a altura útil do SE;
    - o gesto de voltar nunca é desligado (no treino ele pergunta);
    - título grande e puxar para atualizar;
    - seção iPhone apontando para o `06`.
15. **`01-TOKENS.md`**: aparelhos, seletor do mockup, vibração, folha e família por peso.

O comportamento do treino ao deslizar para voltar segue o que o agente E escreveu em `03-arquitetura/04-IPHONE.md`. A folha de ações tem "Continuar treinando", "Sair e continuar depois" e "Descartar treino". Os dois arquivos dizem o mesmo.

## Igual nas duas plataformas × segue a plataforma

| Igual nas duas (identidade do Academia Plus) | Segue a plataforma (comportamento do sistema) |
|---|---|
| Marca, logo, cores, tema claro e escuro | Barra de status, Dynamic Island, notch e indicador de início: o app só respeita a área segura |
| Fontes da marca e a escala tipográfica | Como a fonte é carregada: no iPhone, um nome de arquivo por peso |
| Tamanhos de toque: 48, 56 e 64 | Voltar: deslizar da borda esquerda no iPhone; gesto ou botão voltar no Android |
| Abas embaixo, com 64 de altura e os mesmos ícones e rótulos | Título grande da raiz da aba: no iOS rola junto e o pequeno aparece centralizado |
| Componentes, estados, raios, sombras e escala de 4 | Folha inferior nativa do iOS, com alturas média e grande e alça do sistema |
| Textos e tom de voz | Menu de ações nativo do iOS (ou folha de ações) no lugar do menu do Android |
| Números grandes e tetos de ampliação | Seletores de data e hora nativos |
| Respeito à fonte do sistema, com as faixas de 130 % e 160 % | Interruptor nativo, com `marca` quando ligado |
| Selo Plus e cor `plus` | Puxar para atualizar com o indicador nativo |
| Quando vibra: marcar série (leve), concluir treino (média), fim do descanso | Como vibra: motor do iPhone; a vibração longa vira o padrão de notificação |
| Toast com "Desfazer" (é nosso nas duas) | Barra "Próximo / OK" acima do teclado numérico do iPhone |
| As mesmas abas e a mesma pilha de telas | Permissões e avisos com os textos do iOS |

## Para o agente do PDF (D)

- **A estrutura que o `capturar.mjs` usa ficou igual**:
  - `#telas .celular` (4);
  - `#componentes .amostra` (17, na mesma ordem);
  - `#tokens .paleta` e `#tokens .amostra`.

  Conferi a 1440 × 900 com `?moldura=real`, nos 5 aparelhos, sem erro de script.
- **Sem `?aparelho`, a moldura continua a do Android 390**, com 414 × 868. Ela ganhou a barra de status, o furo da câmera no lugar da ilha e o indicador dentro do inset (a área de conteúdo cresceu 12). Para capturar um iPhone, abra `index.html?moldura=real&aparelho=iphone-16`. Os outros ids são `iphone-se`, `iphone-13-mini` e `iphone-16-pro-max`.
- **A amostra do componente 3 ficou mais alta**: ganhou a barra do teclado e uma legenda.

## O que ficou de fora, e por quê

- **iPhone 16 Pro Max com topo 62, não 59.** O prompt dizia "topo de 20, 50 ou 59". Para o 16 Pro Max, a medida publicada é 62/34 (useyourloaf.com, "iPhone 16 Screen Sizes"). O 59 é do iPhone 16 e do 16 Plus. Usei 62, que é o valor real. No app isso não importa, porque o número vem do sistema. **Para o Alex conferir**: se quiser o 59 do prompt, é uma linha no `tokens.json` e uma no `sistema.css`.
- **O iPhone 13 mini não tem botão no seletor**, porque o prompt pediu 4 botões. Ele entra pela URL e está em todas as medições.
- **A base de 16 no iPhone SE.** O iOS informa 0, e a barra de abas nativa encosta na borda. Mantive a regra que já existia (`areaSegura.baseMinima`, mínimo de 16). Se o Alex preferir a barra colada no SE, é decisão de design para registrar, não de CSS.
- **O mockup não simula os comportamentos.** Deslizar para voltar, título que rola, folha nativa, menu, seletor de data, interruptor e puxar para atualizar estão especificados no `06-IPHONE.md` e no `02-COMPONENTES.md`, mas não aparecem no mockup estático. Mostrar a seta com "‹ Alunos" na tela 3 comeria o título "Perfil do aluno" em 375. O iOS esconde esse rótulo quando falta espaço, e é o que o documento diz.
- **A barra de status e a moldura usam `cor-texto`, como a moldura da rodada C.** No tema escuro, a ilha e o notch ficam claros. Num aparelho de verdade eles são sempre pretos. Mantive assim para a moldura continuar com uma cor só nos dois temas.
- O **200 % no 360** e o **"campo +/− empilha"** continuam como a rodada C deixou.

Fonte das medidas de tela e de área segura dos iPhones 16: [useyourloaf.com — iPhone 16 Screen Sizes](https://useyourloaf.com/blog/iphone-16-screen-sizes/).
