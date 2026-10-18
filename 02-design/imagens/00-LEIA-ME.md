# Banco de imagens do Academia Plus

> Agente J (P08), 10/10/2026. Para ver tudo, abra a `galeria.html` direto no navegador (funciona por file://, sem servidor). O botão "Trocar tema" mostra o escuro.

## O que tem

| Uso | Quantas | Fonte |
|---|---|---|
| Capa de treino pronto por objetivo (larga + miniatura) | 5 objetivos + 1 capa alternativa | fotos Unsplash |
| Miniatura de exercício | 7 (os do mockup: supino reto, supino inclinado com halteres, crucifixo na máquina, tríceps corda, agachamento livre, remada curvada, esteira) | fotos Unsplash |
| Ilustração de estado vazio | 10 | desenho próprio (SVG) |
| Convite ao Plus (larga + miniatura) | 1 | foto Unsplash |

São 80 WebP (279,5 KB no total, média de 3,5 KB) e 10 SVG (4 KB no total). Autor, link e edição de cada foto estão em `CREDITOS.md`.

Como cada foto foi escolhida:

- pessoas reais e diversas, de várias idades e corpos: uma senhora no elíptico, um senhor de barba branca com o instrutor, uma mulher gorda no agachamento com barra, uma moça de hijab alongando;
- todo mundo vestido como se vai à academia do bairro, sem abdômen em pose;
- nada de balança, fita métrica, antes e depois ou espelho de vestiário;
- nenhuma marca de aparelho ou de roupa visível (onde sobrou uma pequena, ela foi borrada; ver `CREDITOS.md`).

## Tamanhos

| Pasta / arquivo | Uso na tela | 1× | 2× | Peso típico (1× / 2×) |
|---|---|---|---|---|
| `capas/{objetivo}-capa@…` | topo do cartão de treino pronto em largura total (iPhone de 375 − 2×16 de margem ≈ 343) e também na tela "Ver treino pronto" | 344×192 (16:9) | 688×384 | 6–11 KB / 13–22 KB |
| `capas/{objetivo}-mini@…` | imagem 48×48 do cartão de treino pronto (componente 8, raio 8) | 48×48 | 96×96 | ~1 KB / ~2 KB |
| `exercicios/{exercicio}@…` | imagem 48×48 do cartão de exercício (componente 5, raio 8) | 48×48 | 96×96 | ~1 KB / ~2 KB |
| `estados-vazios/{estado}.svg` | estado vazio (componente 15, "ilustração até 120 px") | vetor, viewBox 120 | — | 0,3–0,5 KB |
| `estados-vazios/{estado}-claro@…`, `-escuro@…` | o mesmo desenho, já pintado na cor de marca de cada tema, com fundo transparente | 120×120 | 240×240 | 1–3 KB |
| `plus/convite-plus@…` | topo da folha de convite e da tela "Plus — apresentação", sobre `plusSuave` | 344×192 | 688×384 | 10 KB / 21 KB |
| `plus/convite-plus-mini@…` | cartão de convite no Início, se ele tiver imagem | 48×48 | 96×96 | 1 KB / 2 KB |

O componente 8 e o componente 5 só pedem 48×48. As capas largas de 344×192 existem porque a direção de arte ("foto grande") e o mockup do L podem querer o cartão com foto no topo. Se a direção escolhida não usar foto grande, basta ignorar `-capa`.

Os nomes de arquivo usam o slug com hífen, e o `manifesto.json` liga cada arquivo à chave da lista fixa de objetivos (R2.1: `emagrecer`, `ganhar_massa`, `condicionamento`, `iniciante`, `saude_e_manutencao`). O rótulo segue o tom de voz: "Perder peso", "Ganhar massa", "Condicionamento", "Começar a treinar" e "Manter". **[decidir]** Os dois últimos ("Começar a treinar" e "Manter") vêm da tabela de `01-TOM-DE-VOZ.md`. Se o Alex mudar os rótulos, só o `rotulo` do manifesto muda. Os arquivos ficam como estão.

## Como o mockup referencia

O mockup fica em `02-design/sistema-de-design/mockups/index.html`, e o caminho relativo até aqui é `../../imagens/`. Use `srcset` com 1× e 2×, e sempre `width` e `height` para a tela não pular:

```html
<!-- capa larga do cartão de treino pronto -->
<img src="../../imagens/capas/ganhar-massa-capa@1x.webp"
     srcset="../../imagens/capas/ganhar-massa-capa@1x.webp 1x, ../../imagens/capas/ganhar-massa-capa@2x.webp 2x"
     width="344" height="192" alt="">

<!-- miniatura 48 do cartão de exercício, no lugar do ícone #i-halter dentro de .exercicio__imagem -->
<img src="../../imagens/exercicios/supino-reto@1x.webp"
     srcset="../../imagens/exercicios/supino-reto@1x.webp 1x, ../../imagens/exercicios/supino-reto@2x.webp 2x"
     width="48" height="48" alt="">
```

- **Estado vazio no mockup**: cole o conteúdo do `.svg` dentro do bloco (ele usa `stroke="currentColor"`) e dê `color: var(--marca)` ao contêiner. Assim o claro e o escuro saem certos sem trocar de arquivo.
- **`alt`**: a imagem é decorativa (o título do cartão já diz o nome), por isso `alt=""`. Não repita o nome do exercício no `alt`, senão o leitor de tela lê duas vezes.
- **Texto sobre foto**: nunca escreva direto na foto (regra da identidade). Use a faixa `superficie` abaixo dela.

## Como o app referencia

1. Copie a pasta para `app/assets/imagens/` quando o código chegar lá. A estrutura de pastas é a mesma.
2. No React Native/Expo, use a convenção de densidade do Metro: renomeie `nome@1x.webp` para `nome.webp` e mantenha `nome@2x.webp`. Com isso, `require('./capas/ganhar-massa-capa.webp')` escolhe a densidade sozinho. Se preferir não renomear, leia o `manifesto.json` e monte o `source` à mão.
3. Para os estados vazios no app, prefira o SVG via `react-native-svg` com `color` vindo do tema (mesmo traço, sem duplicar arquivo). Os WebP claro/escuro ficam como reserva, caso o app não use SVG.
4. Na capa por objetivo, use a do primeiro objetivo do treino pronto (um treino pode ter vários, R2.3). Sem objetivo, use `iniciante`. A **imagem cadastrada pela academia** (campo "imagem" do exercício, mapa de telas) tem prioridade sobre a deste banco.

## O que ficou faltando

- **Supino inclinado com halteres**: a foto mostra o supino com halteres em banco reto. Todas as fotos do inclinado que encontrei tinham marca, sem camisa ou pose de capa.
- **Crucifixo na máquina**: é uma máquina de peito parecida, não o voador clássico.
- **Os demais exercícios da biblioteca**: só os 7 do mockup ganharam miniatura. Para os outros, o app segue com o ícone `#i-halter` até a academia cadastrar a foto dela.
- **Grupo muscular e alimentação em foto**: ficaram de fora de propósito. A identidade pede o prato "só como ilustração neutra", e por isso ele aparece só no traço do estado vazio `sem-plus-alimentacao`.
- **Tela de abertura (splash)**: não entrou no pedido.
- **Fotos de terceiros, não de pessoas reais da academia**: a identidade prefere "a academia de verdade, com os aparelhos daquela sala". Quando houver um cliente real **[decidir]**, vale trocar as capas por fotos da sala dele, com autorização de imagem de quem aparecer.
- **Geração por IA**: não houve, porque não há chave em `A:\Claude\.env`.

## Ferramentas

Os scripts ficam em `ferramentas/`. `buscar.py`, `previas.py` e `baixar.py` buscam no Unsplash e baixam para uma pasta de quarentena fora do projeto. `processar.py` faz o recorte, o desfoque e o WebP. `rasterizar.py` gera os WebP claro/escuro dos SVG. `galeria.py` gera esta galeria e o `manifesto.json`. O `fotos-unsplash.json` guarda a resposta da API para cada foto: autor, link e `premium: false`.
