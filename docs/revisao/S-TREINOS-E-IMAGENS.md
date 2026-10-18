# S — Treinos prontos e imagens coerentes

> Agente S, 10/10/2026. Pedido do Alex: "as imagens têm que condizer com os assuntos, e os modelos de treinos já pré-prontos também".
> Não toquei em `02-design/sistema-de-design/` nem em `docs/apresentacao/`, porque o agente Q está trabalhando lá. A seção 2 lista as trocas para o Q aplicar.

## Resumo

- **Catálogo de 11 treinos prontos**, coerentes e testados. Estão em `01-especificacao/treinos-prontos/` (um `.md` por programa, mais o `00-LEIA-ME.md` com critérios e fontes) e, como dado, em `app/dominio/catalogo/`:
  - `treinos-prontos.json`;
  - `exercicios.json`, com 28 exercícios;
  - `catalogo.test.ts`, que monta cada programa com as funções de `treino.ts`.

  `node --test "dominio/**/*.test.ts"` em `app/`: **262 testes, 0 falhas**. Um teste de mutação (repetição 15,5) foi recusado pelo domínio, como devia.
- **O catálogo é modelo.** Ele precisa da revisão de um profissional de Educação Física com CREF antes de chegar ao aluno (**[decidir]** quem revisa), e a academia pode editar ou trocar qualquer programa.
- **Levantamento das imagens**: 28 usos nas três páginas. Resultado: **5 errados**, **11 genéricos** e 12 certos. Os três erros conhecidos se confirmaram.
- **Imagens novas** em `02-design/imagens/treinos/`, todas com o tratamento escuro:
  - 11 capas, uma por programa, em três tamanhos (`-capa` 358×240, `-larga` 344×192, `-mini` 48);
  - 1 foto herói, a do **supino inclinado com halteres de verdade** (393×440).

  São 68 WebP, cerca de 393 KB. Os créditos estão em `02-design/imagens/CREDITOS-treinos.md`, e o `manifesto.json` foi atualizado com as chaves `treinos`, `exerciciosHeroi` e `exerciciosIlustracao`.
- **Regra nova**:
  - a miniatura de exercício (48–64) é sempre a ilustração do agente R;
  - foto de exercício só em tamanho grande, e só se mostrar aquele exercício;
  - a capa de treino mostra o foco do treino.

---

## 1. Levantamento: o texto ao lado × o que a foto mostra

Cada imagem foi aberta e olhada inteira. A do modo treino foi clareada 2,6× para ver a posição.

### `index.html`

| # | Linha | Uso | Texto ao lado | Imagem | O que a foto mostra de fato | Veredito |
|---|---|---|---|---|---|---|
| 1 | 190 | Tela 1, exercício atual (herói 393×440) | "Supino inclinado com halteres", "Série 2 de 3 · 22,5 kg" | `mockups/imagens/heroi-supino-halteres` | homem no **banco reto**, halteres acima do peito, parede branca | **errado** |
| 2 | 251–266 | Tela 1, lista de exercícios (mini) | Supino reto · Supino inclinado · Crucifixo na máquina · Tríceps corda | ilustrações `ex-…` do R | o desenho de cada exercício | certo |
| 3 | 322 | Tela 2, "Para você" (capa 358×240) | "ABC Hipertrofia · Ganhar massa · Intermediário · 3 dias · 21 exercícios · 50 min"; o Início abre no Treino A, "Peito e tríceps" | `mockups/imagens/capa-ganhar-massa` | mulher no **agachamento** com barra | **errado** (o treino começa por peito) |
| 4 | 339 | Tela 2, grade | "Circuito 30 · Perder peso · 30 min" | `capas/emagrecer-capa` | senhora no **elíptico** | genérico (cardio contínuo, não circuito) |
| 5 | 343 | Tela 2, grade | "Fôlego 3× · Condicionamento · 40 min" | `capas/condicionamento-capa` | homem e mulher na **corda naval** | certo |
| 6 | 349 | Tela 2, lista (mini 48) | "Primeiros passos · Começar a treinar · 40 min" | `capas/iniciante-mini` | moça sozinha na máquina de supino sentada | genérico (sem instrutor; foto clara de restaurante ao fundo) |
| 7 | 354 | Tela 2, lista (mini 48) | "Corpo em dia · Manter · 45 min" | `capas/saude-e-manutencao-mini` | senhor de barba branca sentado com o instrutor | genérico (lê como "aprendendo", não "manter") |
| 8 | 359 | Tela 2, lista (mini 48) | "HIIT esteira · Condicionamento · Arquivado" | `capas/condicionamento-mini` | corda naval | **errado** (o texto diz esteira) |
| 9 | 417 | Tela 3 (aluno na visão da academia), "Treinos da Ana" | "Treino A — Peito e tríceps" | `capas/ganhar-massa-mini` | agachamento com barra | **errado** |
| 10 | 422 | idem | "Treino B — Costas e bíceps" | ilustração `ex-remada-curvada` | remada curvada | certo |
| 11 | 427 | idem | "Push / Pull / Legs · Personal Júlia" | ilustração `ex-agachamento-livre` | agachamento | genérico (é um dos três dias; o nome também foge do tom) |
| 12 | 554 | Tela 5, Cronômetro (herói 393×300) | "Intervalado · Tabata 20/10 × 8" | `mockups/imagens/heroi-cordas` | corda naval | certo |
| 13 | 592 | Tela 6, Plus (herói 393×354) | "Treino e alimentação com acompanhamento" | `mockups/imagens/heroi-plus-personal` | personal acompanhando uma aluna no agachamento | certo |
| 14 | 761 | Amostra do componente 19 (foto com texto) | "Texto no pé do degradê" | `mockups/imagens/capa-ganhar-massa` | agachamento | genérico (amostra de componente; pode ficar) |
| 15 | 892 | Amostra do componente 5 (erro) | "Remada curvada" | ilustração `ex-remada-curvada` | remada curvada | certo |
| 16 | 988 | Amostra do componente 8, grade | "Full body 3× · Iniciante · 45 min" | `capas/iniciante-capa` | moça na máquina de supino sentada | genérico |
| 17 | 989 | Amostra do componente 8, grade | "ABC · Em uso · Ganhar massa · 50 min" | `capas/ganhar-massa-capa` | agachamento com barra | **errado** (é o mesmo caso do #3) |
| 18 | 991 | Amostra do componente 8, lista | "Circuito 30 · Emagrecer · 30 min" | `capas/emagrecer-mini` | elíptico | genérico |
| 19 | 1104–1108 | Estados vazios | primeiro treino · sem Plus · erro | ilustrações do J | desenho do assunto | certo |
| 20 | 1490 (JS) | Esqueleto que vira lista | "Primeiros passos · Começar a treinar · 40 min" | `capas/iniciante-mini` | máquina de supino, sem instrutor | genérico |

### `novas.html`

| # | Linha | Uso | Texto ao lado | Imagem | O que a foto mostra de fato | Veredito |
|---|---|---|---|---|---|---|
| 21 | 215 | Início, "Treino de hoje" (360×240) | "Hoje · Treino A · Peito e tríceps · 6 exercícios · cerca de 50 min" | `telas/inicio-treino-hoje` | homem de meia-idade **sentado no banco, descansando** | genérico (não diz peito) |
| 22 | 260 | Evolução, topo (390×300) | "Agachamento livre · 60 kg" | `telas/evolucao-agachamento` | mulher no agachamento livre com barra | certo |
| 23 | 328 | Evolução vazia | "Nenhum treino fechado ainda." | estado vazio `historico-vazio` | desenho | certo |
| 24 | 356 e 401 | Modo treino, série e descanso (390×844) | "Crucifixo no cabo · Peito · 15 kg" | `telas/modo-treino-crucifixo-no-cabo` | mulher de hijab na **posição final do crossover** (mãos juntas à frente do quadril, cabos vindo dos dois lados) | certo |
| 25 | 474 | Painel do dono (390×280) | "Academia do Marcos" | `telas/painel-dono-sala` | a sala com racks e anilhas, sem gente | certo |

### `entrada.html` (as fotos vêm pelo `entrada.css`)

| # | Linha | Uso | Texto ao lado | Imagem | O que a foto mostra de fato | Veredito |
|---|---|---|---|---|---|---|
| 26 | css 26–40 | Fundo das boas-vindas e dos passos | "Seu treino e sua academia no mesmo lugar." | `entrada/entrada-fundo-*` | moça rindo num treino de **luva** com uma colega | genérico (clima de academia; luva é de luta, que nem toda academia tem). Pode ficar |
| 27 | css 34–40 | Alternativa (`?foto=alternativa`) | o mesmo | `entrada/entrada-fundo-alternativa-*` | senhor sentado no banco entre as séries | genérico. Pode ficar |
| — | html 223 | Abertura | logo | `entrada/abertura-simbolo-*` | o símbolo | certo |

### Pastas de imagens que não estão nas páginas

- `exercicios/*` (J, 48/96): 7 fotos de exercício em miniatura.
  - Duas são erradas: `supino-inclinado-com-halteres` mostra **banco reto** e `crucifixo-na-maquina` mostra **outra máquina**.
  - As outras cinco estão certas, mas ficam escuras e confusas em 48 px.
  - Pela regra nova, **nenhuma deve ser usada como miniatura**. O `manifesto.json` ganhou um `_aviso` em `exercicios`.
- `capas/iniciante-capa-alternativa` (moça de hijab alongando): genérica, fora de uso.
- `plus/convite-plus` (personal e aluna no agachamento): certa para o Plus.

---

## 2. Trocas para o Q aplicar

Caminhos relativos a `02-design/sistema-de-design/mockups/`. Sempre `srcset` 1×/2×, com o mesmo `width`/`height` do uso.

| # | Arquivo · linha | Elemento | Antes | Depois | Texto que muda junto |
|---|---|---|---|---|---|
| T1 | `index.html` · 190 | herói do exercício atual (393×440) | `imagens/heroi-supino-halteres@1x/2x.webp` | `../../imagens/treinos/supino-inclinado-com-halteres-heroi@1x/2x.webp` | `alt="Homem no banco inclinado empurra dois halteres"` |
| T2 | `index.html` · 322 | capa "Para você" (358×240) | `imagens/capa-ganhar-massa@…` | `../../imagens/treinos/abc-hipertrofia-capa@1x/2x.webp` | `alt="Homem no supino reto com barra"`. O cartão diz "50 min · 21 exercícios"; o catálogo dá **40 min** e **20 exercícios** (7 + 6 + 7, contando o aquecimento) |
| T3 | `index.html` · 339 | grade "Circuito 30" (344×192) | `../../imagens/capas/emagrecer-capa@…` | `../../imagens/treinos/circuito-30-larga@1x/2x.webp` | `alt="Homem e mulher treinam em estações com kettlebell"` |
| T4 | `index.html` · 343 | grade "Fôlego 3×" (344×192) | `../../imagens/capas/condicionamento-capa@…` | `../../imagens/treinos/folego-3x-larga@1x/2x.webp` (a mesma foto, agora com o tratamento escuro). Opcional | "40 min" → **35 min** |
| T5 | `index.html` · 349 | mini "Primeiros passos" | `../../imagens/capas/iniciante-mini@…` | `../../imagens/treinos/primeiros-passos-mini@1x/2x.webp` | "40 min" → **25 min** |
| T6 | `index.html` · 354 | mini "Corpo em dia" | `../../imagens/capas/saude-e-manutencao-mini@…` | `../../imagens/treinos/corpo-em-dia-mini@1x/2x.webp` | 45 min (igual) |
| T7 | `index.html` · 359 | mini "HIIT esteira" (arquivado) | `../../imagens/capas/condicionamento-mini@…` | trocar o `<img>` por `<span class="mini mini--ilustracao"><svg><use href="#ex-esteira"/></svg></span>`, o desenho exato da esteira | — |
| T8 | `index.html` · 417 | mini "Treino A — Peito e tríceps" | `../../imagens/capas/ganhar-massa-mini@…` | `<span class="mini mini--ilustracao">` com `#ex-supino-reto` (o 1º exercício do dia), no mesmo formato da linha 422 | — |
| T9 | `index.html` · 425–427 | "Push / Pull / Legs" | ilustração `ex-agachamento-livre` | pode ficar. Se quiser casar com o catálogo, use `#ex-supino-reto` (o 1º dia é Empurrar) | o nome "Push / Pull / Legs" → **"Empurrar, puxar e pernas"** (o tom de voz troca jargão em inglês por palavra da sala) |
| T10 | `index.html` · 988 | amostra 8, grade "Full body 3×" | `../../imagens/capas/iniciante-capa@…` | `../../imagens/treinos/full-body-3x-larga@1x/2x.webp` | `alt="Mulher no leg press"`; "45 min" → **35 min** |
| T11 | `index.html` · 989 | amostra 8, grade "ABC" | `../../imagens/capas/ganhar-massa-capa@…` | `../../imagens/treinos/abc-hipertrofia-larga@1x/2x.webp` | `alt="Homem no supino reto com barra"`; "50 min" → **40 min** |
| T12 | `index.html` · 991 | amostra 8, lista "Circuito 30" | `../../imagens/capas/emagrecer-mini@…` | `../../imagens/treinos/circuito-30-mini@1x/2x.webp` | o chip "Emagrecer" → **"Perder peso"** (rótulo da marca, ainda **[decidir]**) |
| T13 | `index.html` · 1490 (JS) | mini "Primeiros passos" no esqueleto | `../../imagens/capas/iniciante-mini@…` | `../../imagens/treinos/primeiros-passos-mini@1x/2x.webp` | "40 min" → **25 min** |
| T14 | `index.html` · 761 | amostra 19 | `imagens/capa-ganhar-massa@…` | pode ficar (é amostra do componente). Se o Q quiser tirar o arquivo `capa-ganhar-massa` da pasta do mockup, use `../../imagens/treinos/abc-hipertrofia-capa@…` | — |
| T15 | `novas.html` · 215 | Início, "Treino de hoje · Peito e tríceps" (360×240) | `../../imagens/telas/inicio-treino-hoje@…` | `../../imagens/treinos/abc-hipertrofia-capa@1x/2x.webp` (358×240; no slot de 360, `object-fit: cover`, a diferença é de 2 px) | `alt="Homem no supino reto com barra"`. "6 exercícios · cerca de 50 min" → **"7 exercícios · cerca de 40 min"** (o dia A do ABC do catálogo) ou o texto do treino que o Q escolher |

**Não mudam**: as ilustrações (#2, #10, #15), os estados vazios (#19, #23), o Cronômetro e o Plus (#12, #13), o modo treino (crucifixo no cabo, #24), a Evolução (#22), o painel do dono (#25) e a entrada (#26, #27).

Depois das trocas, os arquivos `mockups/imagens/heroi-supino-halteres@…` e `capa-ganhar-massa@…` só continuam em uso se o T14 ficar como está. O `mockups/imagens/CREDITOS.md` (do N) cita os dois; atualize-o junto.

Depois, rode o `auditar.mjs` do Q: o contraste sobre as fotos novas precisa ser medido no pior pixel. As fotos novas são escuras como as de `telas/`, mas a `circuito-30` e a `folego-3x` têm parede clara atrás das pessoas.

---

## 3. O catálogo, resumido

| Programa | Objetivo | Nível | Dias/sem. | Divisões | Min | Capa (foco) |
|---|---|---|---|---|---|---|
| Primeiros passos | Começar a treinar · Manter | Iniciante | 2 | Corpo todo A/B | 25 | instrutor ajustando o aparelho de uma aluna |
| Full body 3× | Começar a treinar · Ganhar massa | Iniciante | 3 | Corpo todo A/B | 35 | leg press 45° |
| ABC Hipertrofia | Ganhar massa | Intermediário | 3 | Peito e tríceps · Costas e bíceps · Pernas e ombros | 40 | supino reto |
| Superior e inferior 4× | Ganhar massa | Intermediário | 4 | Superior 1/2 · Inferior 1/2 | 40 | puxada |
| Empurrar, puxar e pernas | Ganhar massa | Avançado | 6 | Empurrar · Puxar · Pernas | 45 | desenvolvimento na máquina |
| Circuito 30 | Perder peso · Condicionamento | Iniciante | 3 | Circuito (3 voltas) | 30 | treino em estações |
| Força e caminhada | Perder peso · Manter | Iniciante | 3 | A/B + 20 min de esteira ou bicicleta | 35 | caminhada na esteira |
| Fôlego 3× | Condicionamento | Intermediário | 3 | A (HIIT 30/30 na bicicleta) · B (Tabata na corda) | 35 | corda naval |
| Intervalado 25 | Condicionamento · Perder peso | Intermediário | 2 | HIIT 40/20 × 8 na bicicleta | 25 | air bike |
| Corpo em dia | Manter | Intermediário | 2 | A/B + 15 min de cardio | 45 | homem de meia-idade na remada |
| Treino em casa | Começar a treinar · Condicionamento · Manter | Iniciante | 3 | Em casa (peso do corpo) | 30 | flexão na sala de casa |

O que o teste confere em cada programa:

- a lista de objetivos (R2.1);
- 1 a 7 dias por semana e 1 a 7 divisões (R1.9);
- séries inteiras ≥ 1, com repetição ou tempo conforme o exercício (R1.14);
- descanso inteiro ≥ 0, montado pelas funções de `treino.ts` (que recusam valor quebrado);
- todo exercício existe na biblioteca, e toda ilustração citada existe;
- a duração de cada dia fica a ±20 % de `estimarDuracaoDoDia`;
- o aquecimento vem primeiro e nenhum isolado vem antes de um composto do mesmo grupo;
- a capa existe;
- cada objetivo tem programa.

## 4. Fontes

- ACSM 2026. Currier et al., *Resistance Training Prescription for Muscle Function, Hypertrophy, and Physical Performance in Healthy Adults: An Overview of Reviews*, *Med Sci Sports Exerc* 58(4):851–872, doi:10.1249/MSS.0000000000003897. https://pmc.ncbi.nlm.nih.gov/articles/PMC12965823
- ACSM 2009. Ratamess et al., *Progression Models in Resistance Training for Healthy Adults*, *Med Sci Sports Exerc* 41(3):687–708. https://sfu.ca/~ryand/kin343/ACSMresistance.pdf
- OMS 2020. Bull et al., *WHO 2020 guidelines on physical activity and sedentary behaviour*, *Br J Sports Med* 54(24):1451–1462, doi:10.1136/bjsports-2020-102955. https://pmc.ncbi.nlm.nih.gov/articles/PMC7719906
- Ministério da Saúde, *Guia de Atividade Física para a População Brasileira* (2021). https://www.paho.org/pt/noticias/30-6-2021-ministerio-da-saude-do-brasil-lanca-guia-atividade-fisica-para-populacao
- Lei 9.696/1998 (profissão de Educação Física, CONFEF/CREF). https://www.planalto.gov.br/ccivil_03/leis/l9696.htm
- Fotos: Licença Unsplash (https://unsplash.com/license). Cada foto foi conferida pela API como `premium: false` e `plus: false`.

## 5. Pendências

1. **[decidir] Quem revisa o catálogo**: um profissional com CREF da primeira academia cliente, ou um consultor do Alex. Sem a revisão, o catálogo não vai para aluno nenhum.
2. **[decidir] Rótulos dos objetivos**: "Perder peso", "Começar a treinar" e "Manter" (já estavam na tabela do P00).
3. **[decidir] Aviso para quem informou restrição** na tela "Usar este treino". O app guarda restrições (R6.1), mas não filtra treino por elas.
4. **Circuito no domínio**: o app conduz exercício por exercício. O "uma volta de cada" do Circuito 30 está só no texto do dia. Agrupar exercícios em volta seria uma regra nova (R1), e o Alex decide se entra.
5. **Ilustrações que faltam (agente R)**: 12 exercícios da biblioteca ainda não têm desenho. Até lá, aparece o ícone genérico. São eles:
   - Supino sentado na máquina, Flexão de braço;
   - Remada baixa, Elevação lateral;
   - Agachamento sem carga, Afundo, Stiff com halteres, Cadeira extensora, Mesa flexora;
   - Corda naval, Polichinelo, Escalador.

   Os mais urgentes são a cadeira extensora, a mesa flexora e a remada baixa, que aparecem em 4, 6 e 8 programas.
6. **Nomes das ilustrações × nomes do catálogo**: as ilustrações `puxada`, `desenvolvimento`, `rosca` e `panturrilha` foram usadas para "Puxada frontal", "Desenvolvimento com halteres", "Rosca com halteres" e "Panturrilha em pé". Os desenhos batem (barra acima de frente; halteres acima; um braço com peso; ponta do pé no degrau). O título do `lista.json` do R continua genérico.
7. **Fotos de 48/96 do J** (`imagens/exercicios/`) ficam fora de uso pela regra nova. O Q decide se apaga ou guarda.
8. **`galeria.py`** recebeu um trecho que **preserva** as chaves novas do `manifesto.json` se for rodado de novo; antes, ele reescreveria o manifesto do zero. A `galeria.html` não ganhou as capas dos treinos; dá para incluir numa próxima passada.
9. **Fotos de terceiros**: com uma academia cliente de verdade **[decidir]**, vale trocar as capas por fotos da sala dela, com autorização de imagem de quem aparecer (a mesma ressalva do `00-LEIA-ME.md` das imagens).
10. **Durações nos mockups**: as durações que o mockup inventou (50, 45 e 40 min) não batem com o catálogo. A tabela de trocas corrige onde há cartão; nas outras telas, o Q usa o número do catálogo.
