# Fontes de ícones: o que foi pesquisado e por quê

Pesquisa de 10/10/2026, a pedido do Alex: ícones "meio que únicos", com cara de academia, treino e alimentação, tirados de bibliotecas que deixam usar em app comercial **sem pagar e sem crédito obrigatório na tela**.

As licenças foram lidas **no arquivo LICENSE atual de cada repositório** (API do GitHub, 10/10/2026), não de memória. A disponibilidade de cada ícone foi conferida na árvore de arquivos de cada repositório.

## Licenças

| Biblioteca | Licença (link do arquivo) | Uso comercial em app | Crédito na tela | Observação |
| --- | --- | --- | --- | --- |
| **Lucide** | [ISC](https://github.com/lucide-icons/lucide/blob/main/LICENSE) (e MIT para os ícones herdados do Feather) | sim | não; o aviso de licença vai junto do código-fonte | Já era a biblioteca escolhida em `02-IDENTIDADE-VISUAL.md`. |
| **Tabler Icons** | [MIT](https://github.com/tabler/tabler-icons/blob/main/LICENSE) | sim | não; aviso junto do código | Maior acervo de esporte (esteira, alongamento, ioga, corrida, barra). |
| Phosphor | [MIT](https://github.com/phosphor-icons/core/blob/main/LICENSE) | sim | não | Seis pesos, bom, mas pontas e cantos menos redondos no "regular". |
| Iconoir | [MIT](https://github.com/iconoir-icons/iconoir/blob/main/LICENSE) | sim | não | Traço 1,5: fino demais perto do logo. |
| Material Symbols | [Apache 2.0](https://github.com/google/material-design-icons/blob/master/LICENSE) | sim | não; aviso junto do código | São formas preenchidas, não traço: não dá para trocar a espessura. Cara de Android no iPhone. |
| Healthicons | [MIT](https://github.com/resolvetosavelives/healthicons/blob/main/LICENSE) | sim | não | Feito para saúde pública; grade 48, traço e cantos diferentes. |
| Remix Icon | [Remix Icon License v1.0](https://github.com/Remix-Design/RemixIcon/blob/master/License) (jan/2026) | sim, como parte do app | opcional | **Proíbe** usar como logo/identidade e criar biblioteca concorrente, mesmo modificada. Como aqui os ícones são ajustados e viram o conjunto da marca, fica de fora por precaução. |

Não entraram: Flaticon e Noun Project gratuitos (crédito obrigatório, CC BY), packs "free" de site de template (licença vaga ou proíbe app), e qualquer ícone de marca de terceiros (Nike etc.).

## Quem tem o que o app precisa

`✓` existe · `~` existe parecido · `—` não existe. Nome do arquivo original entre parênteses.

| Precisa | Lucide | Tabler | Phosphor | Iconoir | Material Symbols | Healthicons |
| --- | --- | --- | --- | --- | --- | --- |
| halter / barra | ✓ (dumbbell) | ✓ (barbell) | ✓ (barbell) | ✓ (gym) | ✓ (fitness_center) | ✓ (exercise/weights) |
| anilha | — | — | — | — | — | — |
| esteira | — | ✓ (treadmill) | — | ✓ (treadmill) | — | — |
| bicicleta | ✓ (bike) | ✓ (bike) | ✓ (person-simple-bike) | ✓ (cycling) | ✓ (directions_bike) | ✓ (exercise-bicycle) |
| corrida | — | ✓ (run) | ✓ (person-simple-run) | ✓ (running) | ✓ (sprint) | ✓ (running) |
| alongamento | — | ✓ (stretching, stretching-2, yoga) | — | ✓ (stretching, yoga) | ✓ (self_improvement) | ✓ (exercise-yoga) |
| cronômetro | ✓ (timer) | ✓ (stopwatch) | ✓ (timer) | ✓ (timer) | ✓ (timer) | — |
| prato / refeição | ✓ (utensils) | ✓ (tools-kitchen-2, bowl) | ✓ (fork-knife) | ✓ (cutlery) | ✓ (restaurant) | ✓ (hot-meal) |
| balança | ~ (weight) | ✓ (scale-outline) | ~ (scales, de justiça) | ~ (weight) | ✓ (monitor_weight) | ~ (devices/weight) |
| régua / medida | ✓ (ruler) | ✓ (ruler-measure) | ✓ (ruler) | ✓ (ruler) | ✓ (straighten) | — |
| coração / frequência | ✓ (heart-pulse) | ✓ (activity-heartbeat) | ✓ (heartbeat) | ✓ (heart) | ✓ (ecg_heart) | ✓ (heartbeat) |
| fogo / sequência | ✓ (flame) | ✓ (flame) | ✓ (fire) | ✓ (fire-flame) | ✓ (local_fire_department) | — |
| troféu / medalha | ✓ (trophy, medal) | ✓ (trophy, medal) | ✓ (trophy, medal) | ✓ (trophy, medal) | ✓ (trophy) | ✓ (award-trophy) |
| músculo | ✓ (biceps-flexed) | — | — | — | — | ~ (body/arm) |
| garrafa d'água | ~ (glass-water) | ✓ (bottle) | — | ~ (glass-half) | ✓ (water_bottle) | — |
| personal / apito | ✓ (whistle) | ~ (chalkboard-teacher) | ~ (chalkboard-teacher) | — | ✓ (sports) | — |
| calendário | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| gráfico | ✓ | ✓ | ✓ | ~ | ✓ | ✓ |
| **Estilo** | traço 2, grade 24, pontas e cantos redondos | traço 2, grade 24, pontas e cantos redondos | traço 1,5 a 2 (peso "regular"), pontas redondas | traço 1,5, pontas redondas | formas preenchidas | grade 48, traço e cheio misturados |

## Recomendação (e o que foi feito)

1. **Base: Lucide.** Já era a escolha do projeto, tem traço com pontas e cantos redondos (a mesma ponta do logo, `rx` = metade da espessura) e cobre toda a interface.
2. **Temáticos: Tabler**, a mais próxima do Lucide em grade e gramática, para o que o Lucide não tem: esteira, corrida, alongamento, barra, balança, régua, garrafa, fachada da academia.
3. **Os dois ajustados ao mesmo traço**: todos passaram para **2,25** (a espessura do logo na área viva do ícone; ver `00-LEIA-ME.md`), com pontas e junções redondas, e a geometria foi mexida onde o traço mais grosso fechava um vão em 16 px (o que mudou em cada um está em `CREDITOS.md`).
4. **Desenho próprio só nos ícones-assinatura**, que dão a cara única:
   - o **"+" da marca** na aba Plus (o símbolo do logo, variação 1 do agente W, redesenhado na grade 24);
   - o **haltere horizontal** da aba Início (anilhas em degrau; o de 45° foi trocado pelo agente Q);
   - o **anel do cronômetro** (o anel de progresso do descanso com a coroa);
   - a **anilha** (nenhuma biblioteca tem);
   - as 16 **ilustrações de exercício**.

Assim o app tem cara própria sem redesenhar 45 ícones, e cada um que vem de fora tem licença conferida e crédito registrado.
