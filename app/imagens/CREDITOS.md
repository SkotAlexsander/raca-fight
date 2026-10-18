# Créditos das imagens

> Agente J (P08), 10/10/2026. Toda foto deste banco veio do **Unsplash** e está sob a **Licença Unsplash** (https://unsplash.com/license): uso comercial e não comercial grátis, com permissão para editar, **sem atribuição obrigatória**. A licença não permite vender a foto sem alteração nem montar um banco de imagens concorrente, e nenhuma das duas coisas acontece aqui. Mesmo sem obrigação, o autor fica registrado abaixo.
>
> Antes de baixar, cada foto foi conferida na API pública do Unsplash: `premium: false` e `plus: false`. O link direto termina em `images.unsplash.com/photo-…` e não em `plus.unsplash.com/premium_photo-…`; foto Unsplash+ tem outra licença e ficou fora. Os metadados originais estão em `ferramentas/fotos-unsplash.json`.
>
> **Ilustrações dos estados vazios**: desenhadas para o app, com traço de 2 px e objetos da sala, como pede o `02-IDENTIDADE-VISUAL.md`. Não vieram de banco nem de IA e são do projeto.
>
> **Geração por IA**: não foi usada. O `A:\Claude\.env` só tem variáveis da Cloudflare e nenhuma chave de Gemini ou de OpenAI.

## Edição aplicada em toda foto

Recorte para o tamanho do uso, saturação em 90 % (a "leve dessaturação" da identidade) e WebP. Nas miniaturas de 48 e 96 px entra também uma nitidez leve. Nas fotos marcadas com **desfoque**, uma marca ou um texto pequeno foi borrado antes do recorte. Não há marca de aparelho, logo ou rosto de celebridade visível em nenhum arquivo entregue.

## Capas por objetivo (treino pronto)

| Arquivo | Uso | Autor | Foto | Edição |
|---|---|---|---|---|
| `capas/emagrecer-capa@1x/2x.webp`, `capas/emagrecer-mini@1x/2x.webp` | Perder peso (`emagrecer`) | Centre for Ageing Better | https://unsplash.com/photos/dHHcDjMcN_I | recorte à direita, que deixa a marca do elíptico fora; desfoque na frase pintada na parede |
| `capas/ganhar-massa-capa…`, `capas/ganhar-massa-mini…` | Ganhar massa (`ganhar_massa`) | Land O'Lakes, Inc. | https://unsplash.com/photos/IYLLF511aOY | recorte |
| `capas/condicionamento-capa…`, `capas/condicionamento-mini…` | Condicionamento (`condicionamento`) | Vitaly Gariev | https://unsplash.com/photos/Y3LhJWNjv0M | recorte |
| `capas/iniciante-capa…`, `capas/iniciante-mini…` | Começar a treinar (`iniciante`) | Ahmet Kurt | https://unsplash.com/photos/rYmhvp2ZC_c | recorte |
| `capas/iniciante-capa-alternativa…` | Começar a treinar, alternativa | Febrian Zakaria | https://unsplash.com/photos/gC3IVdTF2s0 | recorte só do tronco |
| `capas/saude-e-manutencao-capa…`, `capas/saude-e-manutencao-mini…` | Manter (`saude_e_manutencao`) | Centre for Ageing Better | https://unsplash.com/photos/tqTWbykzqNE | recorte |

## Convite ao Plus

| Arquivo | Uso | Autor | Foto | Edição |
|---|---|---|---|---|
| `plus/convite-plus@1x/2x.webp`, `plus/convite-plus-mini…` | Folha de convite e tela Plus — apresentação | Vitaly Gariev | https://unsplash.com/photos/qbktVctZKL4 | recorte |

## Miniaturas de exercício

| Arquivo | Exercício | Autor | Foto | Edição |
|---|---|---|---|---|
| `exercicios/supino-reto@1x/2x.webp` | Supino reto | Sergio Kian | https://unsplash.com/photos/Rm51wg8qk7g | recorte na barra e no rosto; desfoque no logo bordado da camisa |
| `exercicios/supino-inclinado-com-halteres…` | Supino inclinado com halteres | Federico Faccipieri | https://unsplash.com/photos/fGAgXh6QQEU | recorte que deixa a anilha com texto fora. **Atenção**: a foto mostra supino com halteres em banco **reto**. Serve de provisória até aparecer uma do inclinado sem marca |
| `exercicios/crucifixo-na-maquina…` | Crucifixo na máquina | Alan Quirvan | https://unsplash.com/photos/jo6y5JxSxzE | recorte. **Atenção**: é uma máquina de peito sem marca, parecida com o voador, mas não é um voador clássico. A foto do voador da mesma sessão (`jEmsnwfrjmM`) foi descartada porque mostra "Cybex" e "Magnum" |
| `exercicios/triceps-corda…` | Tríceps corda | Bandan Mohammed | https://unsplash.com/photos/9aYRNhZ88wc | recorte só na corda e nos braços; desfoque no logo do short |
| `exercicios/agachamento-livre…` | Agachamento livre | Alef Morais | https://unsplash.com/photos/YFeoyqrFsGA | recorte; desfoque no nome do fabricante no banco ao fundo |
| `exercicios/remada-curvada…` | Remada curvada | Mariah Krafft | https://unsplash.com/photos/KaxVB5xh4Nw | recorte. A posição é a de início, com a barra no chão |
| `exercicios/esteira…` | Esteira (aquecimento) | Mike Cox | https://unsplash.com/photos/06EpjZiMz_E | recorte acima da base, onde fica a marca da esteira |

## Estados vazios (ilustração própria)

| Arquivo | Uso |
|---|---|
| `estados-vazios/primeiro-treino.svg` (+ WebP claro/escuro 1×/2×) | Início e Treinos sem nenhum treino |
| `estados-vazios/historico-vazio…` | Histórico sem treino fechado |
| `estados-vazios/sem-plus-alimentacao…` | Alimentação com acompanhamento é do Plus (aluno sem Plus) |
| `estados-vazios/sem-plano…` | O personal ainda não montou o plano |
| `estados-vazios/aguardando-personal…` | Plus ativo sem personal designado |
| `estados-vazios/busca-sem-resultado…` | Busca sem resultado (exercício, aluno) |
| `estados-vazios/erro-carregar…` | Não deu para carregar |
| `estados-vazios/sem-conexao…` | Sem internet |
| `estados-vazios/nenhum-aluno…` | Visão da academia, nenhum aluno vinculado |
| `estados-vazios/biblioteca-vazia…` | Visão da academia, nenhum treino pronto |

Licença: do projeto Academia Plus, sem terceiros.

## Fotos olhadas e descartadas (para ninguém buscar de novo)

| Foto | Por quê |
|---|---|
| `-8lajF7J8T0` (Gold's Gym Nepal) | máquinas com "MATRIX"; foto de conta de rede de academia; abdômen à mostra em primeiro plano |
| `SuLLBcThni4` (remo) | Nike na legging e estampa "Louvre" na camiseta |
| `l9_8xzShTrE` (elástico) | logo no moletom e Nike no tênis |
| `M93-M-p95KU`, `G6svDyPVRrc` (personal) | logo de clínica na camisa; anilhas Technogym |
| `i2GS_MtW9hM`, `kWmtX_NY5zM` (supino) | anilhas Rogue |
| `u6wDM6tRhBs` (supino halteres) | camisa Adidas |
| `fZpCjwEZp6w`, `zxAu1GOwjvU` (tríceps) | Under Armour, Nike e Puma em destaque |
| `O9PXp4h6kx4` | fone Sony, tênis Nike e faixa com texto |
| `jEmsnwfrjmM` (voador) | "Cybex" e "Magnum" na máquina |
| `pQFWjqpSE3Y` (esteiras) | Life Fitness em todos os painéis |
| `-9ZkLI7uoT0`, `XDH1y3RTYyl` | não estão mais disponíveis na API ("Couldn't find Asset") |
| a maioria dos resultados de "woman workout" | sem camisa, abdômen e pose de capa de revista: o "corpo ideal" que o `01-TOM-DE-VOZ.md` proíbe |
