# 05 — White-label: e se o app tiver a cara de cada academia?

> Capítulo da pendência **[decidir]** do P00: marca própria ou marca da academia. Tudo nos arquivos anteriores assume **marca própria**. Aqui está o que mudaria, o que ficaria igual e quanto custa cada degrau. A decisão é do Alex; este arquivo só a deixa barata de tomar.

## Primeiro, uma pergunta que vem antes

White-label só faz sentido junto com a outra pendência: **uma academia ou várias?**

- **Uma academia** (a do cliente real, se existir): white-label é só "o app leva o nome e o logo dela". Isso é co-branding, custa quase nada e já está previsto no `04-APLICACAO.md` (nome da academia no cabeçalho, logo no cartaz).
- **Várias academias** (SaaS): white-label vira argumento de venda ("o app com a sua marca") e custo recorrente (cada academia nova é uma configuração a validar).

Então a resposta a "marca própria ou da academia" muda de peso conforme a resposta a "uma ou várias".

## Três degraus, do mais barato ao mais caro

### Degrau 0 — Marca própria com o nome da academia (o que está desenhado)

**O que a academia vê de si:** o nome dela no cabeçalho da tela inicial e na tela de boas-vindas ("Academia do Marcos"); o logo dela no cartaz e no story, ao lado do Academia Plus.
**O que fica do Academia Plus:** tudo: cor, logo, ícone na loja, nome na loja, tom.
**Custo em design:** zero além do que já está feito.
**Custo em código:** um campo `nome` na entidade academia. Nada mais.
**Quando basta:** uma academia só, ou várias academias pequenas que não têm identidade forte para defender.

### Degrau 1 — Logo da academia dentro do app

**O que a academia troca:** o **logo dela** aparece no cabeçalho da tela inicial (no lugar do nome em texto) e na tela de abertura, abaixo do símbolo do Academia Plus ("Academia Plus · [logo da academia]").
**O que fica fixo:** cor de marca, ícone na loja, nome na loja, componentes, tom, selo Plus.
**Custo em design:** regras de como o logo da academia convive com o verde-profundo e com o fundo escuro: altura máxima, fundo neutro obrigatório atrás do logo (porque não controlamos a cor dele), versão clara/escura (a academia manda as duas, ou o app põe o logo numa "etiqueta" branca em qualquer tema). Um dia de trabalho, uma vez.
**Custo em código:** upload de imagem na visão do dono (PNG/SVG, tamanho máximo, dois temas), armazenamento, cache no celular, fallback para o nome em texto quando não há logo. Dois ou três dias.
**Quando vale:** várias academias, cada uma querendo "ver a si mesma" no app. É o degrau que eu recomendaria se o Alex for para SaaS.

### Degrau 2 — Cor da academia como cor de marca

**O que a academia troca:** o papel `marca` (e, por consequência, `marcaTexto`, `marcaSuave`) passa a ser a cor dela. Botões, abas ativas, links, tela de abertura e ícone do app na cor da academia.
**O que fica fixo:** estrutura, componentes, tom, neutros, cores de estado, o **dourado do Plus** (o plano é do Academia Plus, não da academia; se a academia também pudesse pintar o Plus, o plano perderia identidade entre academias).
**Custo em design:** alto e recorrente. Cada cor nova precisa passar nos mesmos testes do `02-IDENTIDADE-VISUAL.md`: 4,5:1 como texto sobre branco e sobre o fundo escuro, 4,5:1 para o texto sobre ela, não colidir com sucesso/atenção/erro/dourado. Uma academia amarela quebra o contraste com `marcaTexto` branco **e** colide com o dourado do Plus; uma vermelha colide com `erro`; uma verde-clara some no escuro. Então o app precisa **derivar** as cores a partir da que a academia escolhe (escurecer para texto, clarear para o tema escuro, decidir se o texto sobre ela é branco ou preto) e, nos casos em que não dá, recusar ou ajustar com aviso. Isso é um sistema de cor automático, não uma troca de hex.
**Custo em código:** o motor de derivação (em OKLCH: fixar a luminosidade para texto em ~47 % e para o escuro em ~80 %, manter a matiz, cortar croma quando sair do gamut), a validação de contraste no upload, tokens por academia carregados antes da primeira tela (senão o app "pisca" verde e muda), ícone do app **não** muda (as lojas não permitem ícone por cliente num app só; para isso seria um app por academia, que é outro produto e outro custo). Uma a duas semanas, mais manutenção a cada tema novo.
**Quando vale:** só se o Alex vender para redes com identidade forte, que exijam isso em contrato. Para academia de bairro, o degrau 1 entrega 90 % da sensação de "é o meu app" por 10 % do custo.

## O que não muda em nenhum degrau

- **Tom de voz** (`01-TOM-DE-VOZ.md`): o app fala igual em toda academia. É a promessa de marca que sobrevive ao logo.
- **Regras de corpo e peso**: não negociáveis, porque são regra de saúde.
- **Selo Plus dourado**: o plano é um produto do Academia Plus; a cor dele é a mesma em toda academia.
- **Componentes, tokens de espaço, tipografia**: trocar fonte por academia seria degrau 3 e não vale a pena.
- **Ícone e nome na loja**: "Academia Plus". Um app só nas lojas (decisão do P00: duas visões no mesmo app).
- **Neutros e cores de estado**: fundo, texto, sucesso, atenção, erro.

## Resumo

| | Degrau 0 | Degrau 1 | Degrau 2 |
| --- | --- | --- | --- |
| Nome da academia no app | sim | sim | sim |
| Logo da academia no app | só no cartaz | cabeçalho e abertura | cabeçalho e abertura |
| Cor da academia no app | não | não | botões, abas, abertura |
| Ícone na loja | Academia Plus | Academia Plus | Academia Plus |
| Dourado do Plus | fixo | fixo | fixo |
| Custo de design | feito | 1 dia, uma vez | alto, a cada academia |
| Custo de código | 1 campo | 2–3 dias | 1–2 semanas + manutenção |
| Risco de contraste | nenhum | baixo (etiqueta neutra) | alto (precisa de motor de cor) |

## Recomendação para o Alex decidir

1. Se **uma academia**: degrau 0 agora. Se o dono pedir o logo dele dentro do app, degrau 1 depois, sem retrabalho.
2. Se **várias academias**: degrau 1 desde o início, com a arquitetura preparada para o degrau 2 (os tokens já são variáveis; o que falta é o motor de derivação, e ele pode esperar o primeiro cliente que pague por isso).
3. Em nenhum caso o degrau 2 na v1.

**[decidir]** Alex: uma ou várias? E, se várias, a academia precisa ver a cor dela ou basta o logo?
