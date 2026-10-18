# Créditos das imagens da entrada

> Agente O (P09), 10/10/2026. Pasta: `imagens/entrada/`. Mesma regra de `CREDITOS.md`: fotos do **Unsplash** sob a **Licença Unsplash** (https://unsplash.com/license), com uso comercial grátis, edição permitida e atribuição não obrigatória (o autor fica registrado mesmo assim). Antes de baixar, cada foto foi conferida na API pública do Unsplash: `premium: false` e `plus: false`, com link direto em `images.unsplash.com/photo-…`. Nenhuma foto Unsplash+ entrou. Geração por IA: não foi usada.

## Como foi feito

1. Busca no Unsplash (11 consultas, 144 prévias) e download para uma quarentena nova **fora do projeto**, na pasta temporária da sessão. Nada da quarentena entrou no projeto sem passar pelos passos 2 e 3.
2. Cada candidata foi aberta e olhada inteira em 1600 px, procurando marca, texto, corpo de revista e pose.
3. Tratamento na edição (`entrada/ferramentas/entrada_processar.py`, que roda em Python com Pillow):
   - **marcas borradas** antes de tudo (desfoque gaussiano na caixa da marca);
   - **recorte** em tela cheia vertical, 440 × 956 (o maior aparelho da moldura, o iPhone 16 Pro Max), centrado na pessoa;
   - **escuro**: saturação a 78 %, contraste +10 %, brilho a 62 %, luz lateral (a esquerda fica como está e a direita escurece), vinheta, um toque do verde-petróleo do fundo nas sombras, e um gradiente que escurece o alto (barra de status) e fecha a base no fundo do app (`#070C0C`);
   - **claro**: saturação a 82 %, contraste −8 %, véu claro de 12 % e base fechando no fundo claro (`#F4F8F7`);
   - **desfocada**: a versão tratada com desfoque de 28 pt (o vidro da referência 02). No claro, ela ainda clareia 35 %, porque o texto dos passos fica direto sobre ela;
   - **WebP 1× e 2×** (440 × 956 e 880 × 1912).
4. Contraste medido no mockup contra o pior pixel de fundo, já com a camada de contraste (`docs/revisao/O-ENTRADA.md`).

## Fotos usadas

| Arquivos | Uso | Autor | Foto | Edição |
|---|---|---|---|---|
| `entrada-fundo-{claro,escuro}@1x/2x.webp`, `entrada-fundo-{claro,escuro}-desfocado@1x/2x.webp` | **Principal**: fundo das boas-vindas (nítida) e de todos os passos (desfocada) | LOGAN WEAVER (@LGNWVR) | https://unsplash.com/photos/9D_rUDe7xvA | recorte vertical na moça da frente; desfoque no texto do saco de pancada ao fundo; tratamentos escuro e claro |
| `entrada-fundo-alternativa-{claro,escuro}…` (os mesmos 8 arquivos) | **Alternativa** para o Alex comparar (`entrada.html?foto=alternativa`) | Gard Pro | https://unsplash.com/photos/5Rm-EapWm7M | recorte vertical; desfoque no logo da camiseta, no logo dos dois tênis e no texto do banco; tratamentos escuro e claro |

**Por que estas duas**: as duas são gente comum, vestida como se vai à academia do bairro, sem abdômen em pose e sem "corpo ideal". A principal é uma moça rindo no meio de um treino de luva com uma colega: é o clima de "a sua academia", e o rosto fica no terço de cima, deixando a metade de baixo para o texto e as portas. A alternativa é um senhor de meia-idade sentado no banco entre as séries, com o corpo de quem treina de verdade. É mais calma e mais séria, e fala com o aluno mais velho.

## Abertura (desenho próprio)

| Arquivo | Uso |
|---|---|
| `entrada/abertura-simbolo-claro.png` | `image` do `expo-splash-screen` no claro: o símbolo do logo final (Barra e mais, robusta; P11, 11/10/2026) em branco, PNG 1024 × 1024 transparente, desenhado no círculo central de 2/3 da arte |
| `entrada/abertura-simbolo-escuro.png` | `dark.image`: o mesmo símbolo em `#39F0CD` |

Gerados por `entrada/ferramentas/simbolo_png.py` a partir dos quatro retângulos de `marca-e-proposta/logo/a-barra-simbolo.svg`. Licença: do projeto.

## Olhadas e descartadas

| Foto | Por quê |
|---|---|
| `lvu2SWRyFxQ` (moça de hijab na polia) | era a primeira escolha, mas a API respondeu "Couldn't find Asset" (fora do ar) |
| `TLQWp9q45lI` (remada com halter, escura) | boa luz, mas o rapaz é o físico de capa de revista que a regra evita; tatuagem com texto no punho |
| `5UblqV58CW8`, `ehQimz6-1qM`, `mviOOZJ-dZA`, `a_ZHAHMK-yM`, `UZDQG8H2bEY`, `m-nYxPn6m8A` | sem camisa, abdômen e pose de revista |
| `rjPSYMu9GCI` | logo grande na camiseta |
| `uPrxxLSkovY`, `pLKEaAzUw40` | marca "KINGS" nas anilhas e na parede |
| `czCGoLdK2Hc` | frase estampada na camiseta |
| `89poi2aVXX0` | logo da Nike no peito |
| `SdNMJcc8xt4`, `paXhs03c8sQ`, `LRuCw4gGMps` | nome de academia ou frase pintada na parede |
| a maioria de "plus size woman gym" e "black woman gym" | fundo branco de estúdio (não é academia) ou top e short de campanha |
