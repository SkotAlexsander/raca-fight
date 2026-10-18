# Créditos das imagens das telas novas (`telas/`)

> Agente P (P09), 10/10/2026. Usadas em `02-design/sistema-de-design/mockups/novas.html`. Mesma regra de `CREDITOS.md`: toda foto veio do **Unsplash**, sob a **Licença Unsplash** (https://unsplash.com/license), com uso comercial grátis, edição permitida e sem atribuição obrigatória. O autor fica registrado mesmo assim.
>
> Antes de baixar, cada foto foi conferida na API pública do Unsplash: `premium: false` e `plus: false`. Nenhuma é Unsplash+. Baixei em 2400 px para uma quarentena fora do projeto (pasta temporária da sessão). Lá olhei cada uma inteira e depois em recorte ampliado, procurando marca, texto e logo. Só então ela foi processada. Não houve geração por IA.

## Edição aplicada (o "tratamento escuro")

Feito com `telas/processar_telas.py` (roda sobre a quarentena: `python -I processar_telas.py <originais> <saída> <relatório.json>`), com a mesma receita do `ferramentas/processar.py`, mais três passos:

1. recorte no tamanho do uso;
2. saturação a 82 % e contraste a 106 %;
3. escurecer (brilho de 60 a 80 %, conforme a foto);
4. **luz lateral**: uma máscara que mantém o lado da luz e escurece o outro até 55 %, com uma vinheta embaixo e um toque em cima.

O gradiente sobre a foto **não** fica na imagem. Ele é do CSS (`--foto-gradiente` e `--foto-gradiente-capa` do N) e é a camada de contraste do texto. Saída em WebP 1× e 2× (qualidade 78 e 70).

## Arquivos

| Arquivo | Onde aparece | 1× / 2× | Autor | Foto | Edição |
|---|---|---|---|---|---|
| `telas/modo-treino-crucifixo-no-cabo@1x/2x.webp` | Modo treino, em tela cheia (série e descanso; no descanso o CSS desfoca) | 390×844 / 780×1688 | Asso Myron | https://unsplash.com/photos/Ivu2SWRyFxQ | recorte retrato do joelho para cima, que deixa fora o tênis (listras e um logo pequeno perto do cadarço) e um pacote colorido pendurado no alto; luz à direita; brilho 80 % |
| `telas/inicio-treino-hoje@1x/2x.webp` | Cartão "Treino de hoje" no Início | 360×240 / 720×480 | Gard Pro | https://unsplash.com/photos/5Rm-EapWm7M | recorte largo do rosto às coxas, sem o tênis; **desfoque** no logo do peito da camisa; luz à esquerda; brilho 78 % |
| `telas/evolucao-agachamento@1x/2x.webp` | Topo da Evolução (carga no agachamento) | 390×300 / 780×600 | Land O'Lakes, Inc. | https://unsplash.com/photos/IYLLF511aOY | a mesma foto da capa "Ganhar massa" do banco, agora larga; brilho 60 %, porque a porta clara do fundo pedia mais; luz à esquerda |
| `telas/painel-dono-sala@1x/2x.webp` | Topo do Painel do dono | 390×280 / 780×560 | Kobe Kian Clata | https://unsplash.com/photos/-F0Wi89XZHI | recorte só da sala (racks e anilhas), sem o aluno; a placa da parede ("limpe o equipamento") ficou fora; luz à direita; brilho 78 % |

São 8 WebP, 74 KB no total.

Quem aparece: uma mulher de hijab no cabo, um homem de meia-idade descansando no banco, uma mulher gorda no agachamento com barra. Todos estão vestidos como se vai à academia do bairro, e ninguém posa de "corpo ideal".

## Olhadas e descartadas

| Foto | Por quê |
|---|---|
| `u6FhFqnNTe0` (desenvolvimento com halteres) | regata com logo no peito e texto nos halteres; braço de vitrine, perto do "corpo ideal" |
| `fGAgXh6QQEU` (supino com halteres) | já é a miniatura provisória do banco; fundo de parede branca, que não aguenta o tratamento escuro |
| `03b61PY89hs` (sala com racks) | "BLK BOX" no rack e "KBOX" nas anilhas |
| `0dNECF_v2qQ` (homem de barba) | estampa com texto na camiseta |
| `uq8v98QGMmI` (homem no aparelho) | regata e pose de esforço de revista |
| `WH-RyVhNEes` (mãos com halteres) | só mãos: não diz qual exercício |
| a maioria dos resultados de "dark gym" e "man lifting dumbbell" | sem camisa, abdômen à mostra ou marca de aparelho em destaque (Hammer, Matrix, Technogym) |
| `lvu2SWRyFxQ` | id lido errado na folha de contato (era `Ivu2SWRyFxQ`, com I maiúsculo); a API respondeu "Couldn't find Asset" e a foto foi baixada pelo id certo |
