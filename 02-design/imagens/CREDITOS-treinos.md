# Créditos das imagens dos treinos prontos (`treinos/`)

> Agente S, 10/10/2026. Pedido do Alex: "as imagens têm que condizer com os assuntos". Mesma regra de `CREDITOS.md`: toda foto veio do **Unsplash**, sob a **Licença Unsplash** (https://unsplash.com/license), com uso comercial grátis, edição permitida e sem atribuição obrigatória. O autor fica registrado mesmo assim.
>
> **Como cada foto foi conferida:**
>
> 1. A busca e o download foram pela API pública do Unsplash. Cada foto tinha `premium: false` e `plus: false`, e o link termina em `images.unsplash.com/photo-…`; nenhuma é Unsplash+. A resposta da API de cada foto baixada está em `treinos/fotos-unsplash-treinos.json`, inclusive das descartadas.
> 2. O download foi em 2400 px para uma quarentena nova, fora do projeto (pasta temporária da sessão).
> 3. Cada foto foi aberta inteira e depois ampliada, procurando três coisas: (a) se mostra mesmo o exercício ou o foco do treino, com o aparelho e a posição certos; (b) marca, texto ou logo; (c) corpo de revista ou pose.
>
> Não houve geração por IA.

## Regra de uso (vale para o app e para os mockups)

- **Miniatura de exercício (48–64 px) é sempre a ilustração** do agente R (`02-design/icones/exercicios/`, sprite `ex-…`). Ela é exata por construção. Foto de exercício só aparece em tamanho grande.
- **Foto grande de exercício** precisa mostrar aquele exercício, com o aparelho e a posição certos. Se não houver foto certa, fica a ilustração. Não se força uma foto parecida.
- **Capa de treino pronto** mostra o foco do treino:
  - empurrar → supino ou desenvolvimento;
  - pernas → leg press ou agachamento;
  - intervalado → bicicleta, corda ou corrida;
  - iniciante → alguém aprendendo com o instrutor.

## Edição (o "tratamento escuro" de `telas/`)

Feita por `treinos/processar_treinos.py`, que roda sobre a quarentena: `python -I processar_treinos.py <originais> <saída> <relatório.json>`. A receita é a mesma do `telas/processar_telas.py` (agente P):

1. a marca é apagada ou borrada **antes** do recorte;
2. recorte no tamanho do uso;
3. saturação a 82 % e contraste a 106 %;
4. escurecer: brilho de 72 a 85 %, conforme a foto;
5. luz lateral, com vinheta embaixo e um toque em cima.

O degradê para o texto continua no CSS (`--foto-gradiente`). Saída em WebP 1× (qualidade 78) e 2× (qualidade 70). Nas miniaturas de 48 px não entra a luz lateral, entra uma nitidez leve.

| Sufixo | Uso | 1× | 2× |
|---|---|---|---|
| `{programa}-capa` | cartão "Para você" e topo de "Ver treino pronto" | 358 × 240 | 716 × 480 |
| `{programa}-larga` | cartão de grade e componente 8 | 344 × 192 | 688 × 384 |
| `{programa}-mini` | linha de lista de treinos prontos | 48 × 48 | 96 × 96 |
| `supino-inclinado-com-halteres-heroi` | exercício atual, foto herói | 393 × 440 | 786 × 880 |

São 68 WebP, cerca de 393 KB no total.

## Capas dos treinos prontos

| Programa (`treinos/…`) | O que a foto mostra | Autor | Foto | Edição |
|---|---|---|---|---|
| `primeiros-passos` | um instrutor agachado ao lado de uma aluna de meia-idade no aparelho de pernas, ajustando a posição | Sergio Kian | https://unsplash.com/photos/G6svDyPVRrc | **desfoque** no nome do fabricante em duas anilhas (uma atrás do instrutor, outra à esquerda); luz à direita; brilho 80 % |
| `full-body-3x` | uma mulher no leg press 45°, que é o 1º exercício do dia A | Jonathan Borba | https://unsplash.com/photos/JD6RMKGwSCQ | só recorte; luz à esquerda; brilho 85 % |
| `abc-hipertrofia` | um homem no **supino reto** com barra, banco reto. É o 1º exercício do Treino A, "Peito e tríceps" | Sergio Kian | https://unsplash.com/photos/Rm51wg8qk7g | **desfoque** no logo bordado da camisa; recorte da barra ao tronco; brilho 80 % |
| `superior-inferior-4x` | um homem de costas na **puxada**, num rack de garagem | serjan midili | https://unsplash.com/photos/P7ufRr2xLGw | recorte que deixa fora os porta-retratos da parede; brilho 80 % |
| `empurrar-puxar-pernas` | um homem de costas no **desenvolvimento na máquina** (empurrar) | Stefan Vibes | https://unsplash.com/photos/A37mI2hAkaI | recorte acima do quadril, que deixa fora a marca do tênis; brilho 80 % |
| `circuito-30` | um homem e uma mulher num treino em estações, com kettlebell | Vitaly Gariev | https://unsplash.com/photos/SMaujCcYGHo | recorte que deixa fora o quadro branco escrito; brilho 72 %. **Atenção**: o circuito do catálogo não tem kettlebell; a foto mostra o formato (estações, pouco descanso), não um exercício do treino |
| `forca-e-caminhada` | uma mulher caminhando na esteira | Mike Cox | https://unsplash.com/photos/06EpjZiMz_E | a mesma foto da miniatura `exercicios/esteira` do agente J, agora larga; recorte acima da base, onde fica a marca da esteira; brilho 85 % |
| `folego-3x` | um homem e uma mulher na corda naval (o Tabata do dia B) | Vitaly Gariev | https://unsplash.com/photos/Y3LhJWNjv0M | a mesma foto da capa `condicionamento` do agente J; brilho 72 % |
| `intervalado-25` | um homem na bicicleta de ar (air bike), num tiro | Gard Pro | https://unsplash.com/photos/9xRrPIycOIc | **desfoque** na etiqueta do rack ("…CAGE") e na escrita do tênis; recorte do rosto aos joelhos; brilho 78 % |
| `corpo-em-dia` | um homem de meia-idade numa remada na fita, com o corpo de quem treina de verdade | Gard Pro | https://unsplash.com/photos/Iz6i1341TIE | **desfoque** no logo da camiseta; brilho 78 %. É o mesmo senhor da `telas/inicio-treino-hoje` |
| `treino-em-casa` | um homem fazendo flexão no tapete da sala de casa | Rahul Gupta | https://unsplash.com/photos/2rZ4nhCdQNc | **desfoque** no logo do peito da camiseta; brilho 80 % |

Quem aparece: uma aluna de meia-idade com o instrutor, uma mulher de pele morena no leg press, dois homens de meia-idade, gente de várias idades e corpos. Todos estão vestidos como se vai à academia do bairro. Ninguém aparece sem camisa ou em pose de capa.

## Foto herói de exercício

| Arquivo | Exercício | O que a foto mostra | Autor | Foto | Edição |
|---|---|---|---|---|---|
| `treinos/supino-inclinado-com-halteres-heroi@1x/2x.webp` | **Supino inclinado com halteres** | um homem num banco **inclinado** (encosto alto atrás), halteres na altura dos ombros, na descida do movimento. Corpo comum, de camiseta | Gyan Shahane | https://unsplash.com/photos/u6wDM6tRhBs | a frase amarela estampada na camiseta foi **apagada** (pintada da cor da camiseta e suavizada); **desfoque** no logo da gola e numa placa redonda da parede; recorte retrato da cabeça ao banco; luz à direita; brilho 78 % |

**Não ganharam foto grande, de propósito** (fica a ilustração ou a foto que já existia):

- **Crucifixo no cabo** (modo treino de `novas.html`): a foto que está lá (`telas/modo-treino-crucifixo-no-cabo`, Asso Myron) foi conferida clareando 2,6×. Mostra a posição final do crossover, com as mãos juntas à frente do quadril e os cabos vindo dos dois lados. Está certa e fica.
- **Crucifixo na máquina (voador)**: nenhuma foto sem marca ("Cybex", "Magnum") e sem tronco nu. Fica a ilustração.
- **Os outros 26 exercícios da biblioteca** não aparecem em tamanho grande em nenhum mockup. Quando aparecerem, vale a mesma regra: foto certa ou ilustração.

## Olhadas e descartadas

| Foto | Por quê |
|---|---|
| `UyLK5Kt3riI` ("homem malhando com pesos", banco inclinado) | olhando inteira: é uma remada apoiada de bruços no banco inclinado, **não** um supino inclinado. Seria o mesmo erro de hoje (texto diz uma coisa, foto mostra outra) |
| `Pv97-3sdjdY` (halteres no banco) | encosto quase vertical: é desenvolvimento, não supino inclinado; regata com logo; pose de capa |
| `lLZgDQ47qPU`, `tBmmA3pTciA`, `qcXGv2bClg4` (supino com halteres) | tronco nu ou regata de vitrine (corpo ideal) |
| `kWmtX_NY5zM`, `i2GS_MtW9hM` (supino com ajudante) | "ROGUE" grande na anilha, nome na barra, aparelho de compressão com marca na perna da ajudante |
| `M93-M-p95KU`, `kcFVaxxnW2s` (instrutor com aluna) | logo no peito; frase na camiseta azul. A `G6svDyPVRrc` mostra a mesma cena com o instrutor ajustando o aparelho |
| `ZW_TNzH1KiA` (agachamento no rack) | listras de marca no short; fica como alternativa para o dia "Pernas" se a academia quiser |
| `A_ftsTh53lM` (aula de bike) | boa, mas é aula coletiva de spinning, que não está no catálogo |
| `IbuPLoOAaEY` (puxada atrás da nuca) | exercício que o catálogo não usa (e que pede cuidado com o ombro); regata e pose |
| `7_2zka3D13o` (senhora no tapete, em casa) | tapete com logo grande; a foto de casa escolhida mostra o exercício (flexão) com mais clareza |
| `tqTWbykzqNE`, `5Rm-EapWm7M` | já estão no banco (capa `saude-e-manutencao` e `telas/inicio-treino-hoje`); não se repetiu a mesma foto em dois treinos |
| a maioria de "lat pulldown", "shoulder press", "chest press machine" | tronco nu, tatuagem com texto ou marca do aparelho em destaque (Hammer, Technogym, Matrix) |
