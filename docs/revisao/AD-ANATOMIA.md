# AD: imagens anatômicas dos músculos (11/10/2026)

Agente AD. Escrevi só em `02-design/anatomia/` e neste arquivo. Não mexi no `app/`, porque o agente AB está corrigindo bugs lá. Nenhum **[decidir]** do P00 foi resolvido; os novos estão marcados no fim.

Pedido do Alex: "tudo que for ícone envolvendo algum músculo do corpo, eu gostaria que fosse realmente uma imagem retratando aquele músculo... uma demonstração do corpo em cinza e o músculo em vermelho". Foram testados dois caminhos:
- **A**: mapa em vetor;
- **B**: imagem de IA.

**Abra `02-design/anatomia/comparativo.html`** (funciona por `file://`).

## 1. Recomendação

**A em todos os tamanhos. B não rodou, e por isso não há imagem de IA para avaliar.**

- **A acerta a anatomia por construção.** Cada músculo é a região certa da base, e os músculos de cada exercício estão conferidos no ExRx.
- **A mantém o mesmo corpo nas 28 miniaturas e nos dois temas.** A troca de tema é só de cor.
- **A pesa pouco.** São 124 KB de dados para o app inteiro.
- **A acompanha o catálogo.** Exercício novo é uma linha no JSON.
- **B ficou aberto, não reprovado.** O token do `.env` não tem permissão de Workers AI (seção 4). O teste está pronto e o comparativo se preenche sozinho quando ele rodar.
- **Mesmo que acerte, B serve só para imagem grande.** Na miniatura, uma imagem gerada nunca vai bater pixel a pixel com a do lado, e o A já resolve o detalhe grande também.

A sua expectativa ("A como base, B só para imagens grandes, se acertar") se confirmou na parte do A. Na parte do B, falta o teste.

## 2. Onde aparece músculo no app (lido, não alterado)

| Onde | Arquivo (em `app/`) | Hoje | Com o mapa |
| --- | --- | --- | --- |
| Miniatura do exercício: lista do treino | `telas/aluno/comum/Pecas.tsx:102` | `IlustracaoExercicio` 48 | `MapaMuscular` 48 |
| Escolha de exercício e filtro por grupo | `telas/aluno/TelaEditarTreino.tsx:219-241` | chips só com texto; linha com ilustração 48 e "Peito" de apoio | chip com mini corpo 24; linha com mapa 48 |
| Modo treino: exercício atual e "Peito · 15 kg" | `telas/aluno/TelaModoTreino.tsx:180` (64), `:189` e `:403-410` (`Palco`) | ilustração 64 e o grupo em texto | mapa 64; o texto fica |
| Evolução: rosca de volume por grupo | `telas/aluno/TelaEvolucao.tsx:84-92` e `:179`; `componentes/Graficos.tsx:184-187` (`Rosca`) | rosca com um grupo em cor e o resto em neutro | corpo pintado por volume + a lista em quilos |
| Biblioteca e treinos prontos (academia) | `telas/academia/TelasDeProntos.tsx:94` e `:169` | ilustração 48 + "Peito · por repetições" | mapa 48 |
| Montar treino (academia) | `telas/academia/TelaMontarTreino.tsx:193` e `:220` | ilustração 48 | mapa 48 |
| Perfil do aluno (academia) | `telas/academia/TelaPerfilDoAluno.tsx:228` e `:381` | ilustração 48 | mapa 48 |
| Catálogo de componentes | `telas/compartilhado/TelaCatalogoDeComponentes.tsx:227`, `:417` e `:463` | amostras | amostras do mapa |
| Nome do grupo | `componentes/formatos.ts:34` (`NOME_DO_GRUPO`) | texto | não muda |
| Ícone `musculo` do sprite | `02-design/icones/` | não é usado em tela nenhuma hoje | fica para "grupo muscular" genérico; não troquei |

## 3. Caminho A: mapa em vetor

### Base pesquisada (licença conferida no repositório oficial, 11/10/2026)

| Base | Licença | Resultado |
| --- | --- | --- |
| **MuscleMap** (melihcolpan, Swift) | **MIT** | **Usada.** Tem os paths do react-native-body-highlighter mais as subdivisões: deltoide anterior e posterior, romboides, trapézio de cima e de baixo, peitoral de cima e de baixo. |
| react-native-body-highlighter (HichamELBSI) | MIT | A origem dos paths: os 159 estão iguais no MuscleMap. As duas licenças vão junto. |
| react-body-highlighter (giavinh79) | MIT | Mesmos polígonos (o README diz), com menos regiões |
| body-muscles (vulovix) | Apache-2.0 | Desenho poligonal, de traço reto, fora do estilo redondo do app |
| muscle_mapper `advanced` (suryamolly) | CC BY 4.0 | Exige crédito na tela |
| muscle_mapper `minimal` | MIT no pacote | Origem incerta: a classe `text-mw-gray` sugere MuscleWiki. Não usei. |
| Wikimedia Commons | em geral CC BY-SA | Atribuição + compartilhar igual. Não baixei. |

O clone foi raso, em quarentena fora do projeto, e nada foi executado. Os paths foram lidos como texto, e a varredura não achou script, link externo, `foreignObject`, `data:` nem `url(`.

### O que foi feito

- **Corpo neutro.** A silhueta é a união das peças da base com traço largo: fecha os vãos e sai um corpo liso, sem rosto, sem cabelo marcado e sem sexo, em cinza com borda. As divisões entre músculos aparecem só no detalhe grande.
- **18 músculos pedidos, todos com região**:
  - peitoral, deltoide anterior, lateral e posterior;
  - bíceps, tríceps e antebraço;
  - trapézio, grande dorsal, romboides/meio das costas e lombar;
  - reto abdominal e oblíquos;
  - glúteos, quadríceps, posteriores da coxa, adutores e panturrilha.

  Há mais quatro de apoio: peitoral de cima, serrátil, flexores do quadril e tibial.
- **O deltoide lateral não existe solto na base.** Ele é o ombro da frente com o anterior repintado de cinza por cima, e a separação é uma linha reta. Ampliado, isso aparece. Em 48–64 não se vê.
- **Miniatura recortada.** É a metade que importa: `superior` vai da cabeça às mãos e `inferior` vai do quadril aos pés. A vista também é a mínima: supino só de frente, puxada só de costas, agachamento de frente e de costas. Polichinelo é o único com o corpo inteiro.
- **Gerador**: `02-design/anatomia/fonte/gerar.py` (`python -I gerar.py`). Ele confere se:
  - os 28 exercícios do catálogo têm mapeamento, e nenhum sobra;
  - todo músculo existe e toda região existe;
  - o vermelho passa de 3:1 contra o corpo e contra os quatro fundos, nos dois temas.

  Ele gera:
  - `mapa/frente.svg` e `costas.svg`, um `<path id>` por região;
  - `exercicios/<id>.svg` (miniatura) e `<id>-duplo.svg` (detalhe), os 28;
  - `grupos/<grupo>.svg`, os 9 com músculo;
  - `dados/mapa-muscular.json`.

### Cores e contraste (medidos)

| Par | Claro | Escuro |
| --- | --- | --- |
| músculo / corpo | `#CE2C31` / `#CDD3D6` = **3,45:1** | `#FF6369` / `#3A4446` = **3,46:1** |
| músculo / ladrilho | 4,52 | 4,89 |
| músculo / superfície | 5,21 | 6,10 |
| secundário / corpo · principal / secundário | `#F07579`: 1,84 · 1,87 | `#C2383D`: 1,87 · 1,84 |

- **O par do pedido não passava.** `#E5484D` sobre `#9AA3A7` dá **1,52:1**. Com o corpo em `#9AA3A7`, nenhum vermelho que ainda pareça vermelho chega a 3:1. Por isso o corpo clareou, o vermelho do claro escureceu, e o `#9AA3A7` virou a borda.
- **O corpo contra o fundo fica em 1,3–1,8:1.** É contexto, não informação, e a borda ajuda.
- **Risco anotado.** O `#CE2C31` é vizinho do `erro` (`#C21725`). A regra no LEIA-ME é que o vermelho do mapa nunca vira texto, borda, ícone ou botão, e o erro sempre vem com ícone e texto.

### Músculos por exercício (conferidos no ExRx.net)

Regra:
- **principal** é o Target da página;
- **secundários** são os Synergists que têm região no mapa;
- Stabilizers não acendem, e as exceções estão anotadas no JSON (`nota`).

| Exercício | Principal | Secundários | Miniatura | Fonte |
| --- | --- | --- | --- | --- |
| Supino reto | Peitoral | Deltoide anterior, Tríceps | frente, superior | [BBBenchPress](https://exrx.net/WeightExercises/PectoralSternal/BBBenchPress) |
| Supino inclinado com halteres | Peitoral (parte de cima) | Peitoral (parte de baixo), Deltoide anterior, Tríceps | frente, superior | [DBInclineBenchPress](https://exrx.net/WeightExercises/PectoralClavicular/DBInclineBenchPress) |
| Supino sentado na máquina | Peitoral | Deltoide anterior, Tríceps | frente, superior | [LVChestPress](https://exrx.net/WeightExercises/PectoralSternal/LVChestPress) |
| Crucifixo na máquina (voador) | Peitoral | Serrátil | frente, superior | [LVPecDeckFly](https://exrx.net/WeightExercises/PectoralSternal/LVPecDeckFly) |
| Flexão de braço | Peitoral | Deltoide anterior, Tríceps | frente, superior | [BWPushup](https://exrx.net/WeightExercises/PectoralSternal/BWPushup) |
| Puxada frontal | Grande dorsal | Bíceps, Antebraço, Deltoide posterior, Meio das costas, Trapézio inferior | costas, superior | [CBFrontPulldown](https://exrx.net/WeightExercises/LatissimusDorsi/CBFrontPulldown) |
| Remada curvada | Grande dorsal, Meio das costas | Trapézio inferior, Deltoide posterior, Bíceps, Antebraço | costas, superior | [BBBentOverRow](https://exrx.net/WeightExercises/BackGeneral/BBBentOverRow) |
| Remada baixa | Grande dorsal, Meio das costas | Trapézio inferior, Deltoide posterior, Lombar, Bíceps, Antebraço | costas, superior | [CBSeatedRow](https://exrx.net/WeightExercises/BackGeneral/CBSeatedRow) |
| Desenvolvimento com halteres | Deltoide anterior | Deltoide lateral, Tríceps, Trapézio médio e inferior, Peitoral (parte de cima), Serrátil | frente, superior | [DBShoulderPress](https://exrx.net/WeightExercises/DeltoidAnterior/DBShoulderPress) |
| Elevação lateral | Deltoide lateral | Deltoide anterior, Trapézio médio e inferior, Serrátil | frente, superior | [DBLateralRaise](https://exrx.net/WeightExercises/DeltoidLateral/DBLateralRaise) |
| Rosca com halteres | Bíceps | Antebraço | frente, superior | [DBCurl](https://exrx.net/WeightExercises/Biceps/DBCurl) |
| Tríceps corda | Tríceps | — | costas, superior | [CBPushdown](https://exrx.net/WeightExercises/Triceps/CBPushdown) |
| Agachamento livre | Quadríceps, Glúteos | Adutores, Panturrilha | frente + costas, inferior | [BBSquat](https://exrx.net/WeightExercises/GluteusMaximus/BBSquat) |
| Agachamento sem carga | Quadríceps, Glúteos | Adutores, Panturrilha | frente + costas, inferior | [BWSquat](https://exrx.net/WeightExercises/GluteusMaximus/BWSquat) |
| Leg press 45° | Quadríceps, Glúteos | Adutores, Panturrilha | frente + costas, inferior | [LV45LegPress](https://exrx.net/WeightExercises/GluteusMaximus/LV45LegPress) |
| Afundo | Quadríceps, Glúteos | Adutores, Panturrilha | frente + costas, inferior | [DBLunge](https://exrx.net/WeightExercises/GluteusMaximus/DBLunge) |
| Stiff com halteres | Posteriores da coxa | Glúteos, Adutores, Lombar | costas, inferior | [DBStrBackStrLegDeadlift](https://exrx.net/WeightExercises/Hamstrings/DBStrBackStrLegDeadlift) |
| Cadeira extensora | Quadríceps | — | frente, inferior | [LVLegExtension](https://exrx.net/WeightExercises/Quadriceps/LVLegExtension) |
| Mesa flexora | Posteriores da coxa | Panturrilha | costas, inferior | [LVLyingLegCurl](https://exrx.net/WeightExercises/Hamstrings/LVLyingLegCurl) |
| Panturrilha em pé | Panturrilha | — | costas, inferior | [LVStandingCalfRaise](https://exrx.net/WeightExercises/Gastrocnemius/LVStandingCalfRaise) |
| Elevação pélvica | Glúteos | Posteriores da coxa, Quadríceps | costas, inferior | [BBHipThrust](https://exrx.net/WeightExercises/GluteusMaximus/BBHipThrust) |
| Prancha | Reto abdominal | Oblíquos | frente, superior | [BWFrontPlank](https://exrx.net/WeightExercises/RectusAbdominis/BWFrontPlank) |
| Abdominal no solo | Reto abdominal | Oblíquos | frente, superior | [BWCrunch](https://exrx.net/WeightExercises/RectusAbdominis/BWCrunch) |
| Esteira | Quadríceps, Posteriores da coxa, Glúteos, Panturrilha | — | frente + costas, inferior | convenção |
| Bicicleta ergométrica | Quadríceps | Glúteos, Posteriores da coxa, Panturrilha | frente, inferior | convenção |
| Corda naval | Deltoide anterior e lateral | Bíceps, Tríceps, Antebraço, Reto abdominal, Oblíquos, Quadríceps | frente, superior | convenção |
| Polichinelo | Deltoide lateral, Panturrilha | Glúteos, Adutores, Quadríceps | frente, inteiro | convenção |
| Escalador | Flexores do quadril | Reto abdominal, Oblíquos, Quadríceps, Peitoral, Tríceps, Serrátil | frente, superior | [STMountainClimber](https://exrx.net/WeightExercises/HipFlexors/STMountainClimber) |

**Onde o ExRx diverge do catálogo** (fica para o profissional com CREF; não mudei o `exercicios.json`):
- **Agachamento, leg press e afundo**: o ExRx põe o **glúteo como alvo** e o quadríceps como sinergista. O catálogo diz "pernas", com glúteo secundário. Acendi os dois como principais. O "abdômen" do agachamento livre é estabilizador no ExRx e não acende.
- **Crucifixo**: o catálogo não tem secundário. O ExRx lista o serrátil (e não o deltoide). Acendi o serrátil.
- **Elevação pélvica**: o ExRx lista o **quadríceps** como sinergista e o posterior como estabilizador dinâmico. Acendi os dois como secundários.
- **Escalador**: o alvo do ExRx é o iliopsoas, que é profundo, então a região acesa é o flexor do quadril na virilha. Em 48 px aparece pouco. É o caso mais fraco da miniatura. Se o profissional preferir tratar como exercício de abdômen, basta trocar o principal no JSON.
- **Tríceps corda**: a página é a do pushdown com barra; a corda muda a pegada, não o músculo. **Escalador**: a página é a do escalador suspenso (com fita).
- **Esteira, bicicleta, corda naval e polichinelo**: o ExRx não tem página de músculos para eles, e estão como convenção.
- **Secundário que não cabe na miniatura** (aparece no detalhe):
  - o bíceps nas puxadas e remadas;
  - o trapézio médio no desenvolvimento e na elevação lateral;
  - o quadríceps na elevação pélvica;
  - glúteo e posterior na bicicleta;
  - o glúteo no polichinelo.

### O que pode incomodar no A

- **A base é de proporção masculina e um pouco atlética.** Os ombros são largos, a cintura é estreita, e o abdômen tem gomos nas divisões. Na miniatura, sem divisões, o corpo é uma silhueta lisa e isso quase some. No detalhe, as linhas do abdômen aparecem. Dá para tirar as divisões do detalhe trocando uma linha do gerador (`detalhe=False`); o músculo continua exato.
- **O mini corpo de 24 px no chip** é reconhecível como "corpo com uma parte vermelha", mas não muito mais. Se parecer pouco, o chip pode ter 32 de altura de ícone, ou ficar só com o texto.

## 4. Caminho B: imagem de IA

**Não rodou.** O token do `A:\Claude\.env` está **ativo** (`/user/tokens/verify` = `active`) e enxerga a conta do `.env`. Mas ele **não tem permissão de Workers AI**:
- `GET /accounts/{conta}/ai/models/search` → **403**;
- `POST /ai/run/@cf/black-forest-labs/flux-1-schnell` → **401 Authentication error**.

Não há outra chave de IA de imagem no `.env`. O MCP da Cloudflare pede login, que esta sessão não faz. O PixelLab é pixel art e gastaria crédito da conta sem autorização. Os valores do token nunca foram impressos; o script lê por código.

O que ficou pronto:
- **`02-design/anatomia/fonte/testar-ia.py`**, com prompt fixo e semente fixa (`20261011`). Os seis casos são peitoral, grande dorsal, quadríceps, glúteos, bíceps e deltoide.
- O prompt pede:
  - corpo de diagrama cinza, liso, sem rosto, sem cabelo, sem genitália e de proporção não atlética;
  - só o músculo X em vermelho, os outros cinza;
  - fundo branco liso e sem texto, rótulo ou seta.
- Ele grava em `02-design/anatomia/ia/<caso>.jpg` e `ia/registro.json` (modelo, semente, prompt). O `comparativo.html` mostra as imagens nos quadros listrados sem precisar gerar de novo.
- **Modelo**: `@cf/black-forest-labs/flux-1-schnell` (id conferido na documentação da Cloudflare; até 8 passos; devolve JPEG em base64). Os pesos são **Apache-2.0** (Hugging Face), e a Cloudflare aponta para os termos da Black Forest Labs, então o uso comercial da saída é permitido. Antes de usar, confira de novo a lista de modelos (`python -I testar-ia.py modelos`).

**Para liberar**: no painel da Cloudflare, editar o token (ou criar outro) com **Account › Workers AI › Read** e **Edit**. Depois, rodar:

```
cd 02-design/anatomia/fonte
python -I testar-ia.py gerar @cf/black-forest-labs/flux-1-schnell ../ia
python -I comparativo.py
```

**Como avaliar** quando houver imagem, olhando cada uma ampliada:
1. O músculo certo está aceso, e no lugar certo? O grande dorsal costuma sair como trapézio, e o deltoide como peitoral.
2. Os outros músculos ficaram cinza?
3. O corpo é o mesmo nas seis (pose, proporção, enquadramento)?
4. Há texto ou rótulo inventado?
5. O corpo é idealizado (definição, pose de fisiculturista)?

Pelo que sei de modelos de difusão sem controle de pose, o esperado é falhar em 3 (consistência) quase sempre e em 1 algumas vezes. Isso é **expectativa, não resultado**: o teste não rodou, e o comparativo não mostra erro nenhum de B porque não há imagem.

## 5. Arquivos

`02-design/anatomia/`:
- `00-LEIA-ME.md`: tamanhos, cores, regras e licenças;
- `CREDITOS.md`;
- `comparativo.html`;
- `fonte/`:
  - `gerar.py`, `caminhos.py`, `comparativo.py` e `testar-ia.py`;
  - `extrair-base.py` e `base-musclemap.json`;
  - `musculos-por-exercicio.json`;
  - `licencas/`;
- `mapa/`: frente e costas com ids;
- `exercicios/`: 28 miniaturas e 28 detalhes;
- `grupos/`: 9;
- `dados/`: `mapa-muscular.json`, `contraste.json` e `resumo-exercicios.json`.

## 6. Plano de integração no app (para depois do AB)

1. **Tokens.** Acrescentar ao `02-design/sistema-de-design/tokens.json` um bloco `anatomia` com `corpo`, `contorno`, `principal` e `secundario`, claro e escuro (os valores da tabela acima). O `app/ferramentas/gerar-tema.mjs` passa a emitir `cores.anatomiaCorpo` e as demais. Não copiar à mão (decisão do agente X).
2. **Dados.** Criar `app/ferramentas/gerar-mapa-muscular.mjs`, irmão do `gerar-icones.mjs`. Ele lê `02-design/anatomia/dados/mapa-muscular.json` e escreve `app/componentes/anatomia/gerado.ts` tipado:
   - `VISTAS` (largura, altura, `corpo`, `linhas`, `camadas`, `recortes`);
   - `MUSCULOS`, `GRUPOS`, `EXERCICIOS` e `SOBREPOSICOES`;
   - tudo `as const`.

   Acrescentar `npm run gerar:mapa`.
3. **Componente `MapaMuscular`** (`app/componentes/MapaMuscular.tsx`), substituindo o `IlustracaoExercicio`:
   - Props: `{ exercicioId?, grupo?, principal?, secundarios?, tamanho: 24 | 48 | 56 | 64 | number, variante?: 'miniatura' | 'detalhe', ladrilho?: boolean }`.
   - **Resolução**:
     - `exercicioId` com mapeamento usa o mapeamento;
     - sem mapeamento (exercício da academia ou do aluno), usa o `grupo` dele;
     - grupo `cardio` usa o `Icone nome="frequencia"`;
     - sem nada, usa o ícone `barra` de hoje.
   - **Desenho** (react-native-svg), para cada vista um `<Svg viewBox={recorte}>` lado a lado num `View` em linha:
     1. `<Path d={corpo} fill={contorno} stroke={contorno} strokeWidth={22} strokeLinejoin="round"/>`;
     2. o mesmo com `corpo` e `strokeWidth={14}`;
     3. as camadas na ordem, a acesa com `fill` de `principal` ou `secundario`, e a apagada que cobre uma acesa (`SOBREPOSICOES`) com `fill` de `corpo`;
     4. no `detalhe`, `<Path d={linhas} stroke={contorno} strokeOpacity={0.6} strokeWidth={2.2} fill="none"/>`.
   - `React.memo` pelo id e pelo tema.
   - **Acessibilidade**:
     - na miniatura, escondido do leitor (`accessibilityElementsHidden`), como hoje, porque o nome está ao lado;
     - no detalhe, `accessibilityLabel="Principal: peitoral. Ajudam: deltoide anterior e tríceps."`.
   - **Desempenho, a medir.** Cada vista tem um `corpo` de ~20 KB de path (19 a 23 KB). Uma lista de 28 linhas, virtualizada, deve aguentar, mas conferir no Android de entrada (regra do X). Se engasgar, o plano B é o gerador rasterizar as 28 miniaturas em WebP @2x/@3x (Playwright) e o componente usar `Image` na miniatura, mantendo o SVG no detalhe.
4. **Trocar nas telas** (as linhas da seção 2). O `IlustracaoExercicio nome={e.ilustracao}` vira `MapaMuscular exercicioId={e.id} grupo={e.grupoMuscular}`. O campo `ilustracao` do catálogo fica até a decisão do Alex (as ilustrações do R podem continuar no "como fazer").
5. **Modo treino** (`TelaModoTreino.tsx:180` e `Palco`): o ladrilho de 64 vira o mapa, e "Peito · 15 kg" continua em texto. Na folha "como fazer", entra o `detalhe` de frente e costas a ~200 px, com a lista "Principal / Ajudam" em texto.
6. **Evolução: a rosca pinta o corpo.**
   - Novo componente `CorpoPorVolume` em `componentes/Graficos.tsx`, ao lado da `Rosca`. Ele recebe a mesma lista `[grupo, kg]` que a `TelaEvolucao.tsx:84-92` já monta.
   - Pinta:
     - o grupo de mais volume em `principal`;
     - os outros com volume em `secundario`;
     - os sem volume em `corpo`.
   - Mantém a lista com os quilos ao lado: a cor nunca é a única informação, e o número é o dado.
   - O agrupamento "Ombros e braços" e "Pernas" (com glúteos) da tela vira o conjunto de regiões de `GRUPOS`.
   - `accessibilityLabel` com os grupos e os quilos.
   - A rosca sai, ou fica como alternativa (**[decidir]**).
7. **Filtros com mini corpo** (`TelaEditarTreino.tsx:233`). O `Chip` só aceita `icone?: NomeDoIcone`, e quando está selecionado troca o ícone pelo `marcar` (`componentes/Chip.tsx:85`).
   - Acrescentar `inicio?: ReactNode` ao `Chip` e passar `<MapaMuscular grupo={g} tamanho={24}/>`.
   - Selecionado, mostra o `marcar`, como hoje, ou mantém o corpo. Preferência: manter o corpo, com a borda de selecionado.
   - "Cardio" fica só com texto.
8. **Testes.**
   - Domínio: todo exercício do catálogo geral tem mapeamento, e todo músculo e região existe. O `gerar.py` já confere; o teste do app confere o `gerado.ts`.
   - Componente: a resolução exercício → grupo → ícone.
9. **Licenças.** Levar `02-design/anatomia/fonte/licencas/*.txt` para o arquivo ou tela de licenças de código aberto do app. É exigência da MIT; não exige crédito na tela de uso.
10. **`docs/decisoes.md`.** Registrar a decisão quando o Alex escolher. Eu não escrevi lá: o pedido limitava a escrita a `02-design/anatomia/` e a este relatório.

## 7. Pendências para o Alex

- **[decidir] A ou B.** Recomendo A. Se quiser ver o B, libere Workers AI no token (seção 4) e rode os dois comandos.
- **[decidir] As cores.** O seu par (`#E5484D` / `#9AA3A7`) não passa no contraste. Proponho `#CE2C31` sobre `#CDD3D6` no claro e `#FF6369` sobre `#3A4446` no escuro.
- **[decidir] Divisões entre músculos no detalhe**: com divisões (mais "atlas") ou corpo liso (mais neutro)?
- **[decidir] A rosca da Evolução** sai ou fica ao lado do corpo pintado?
- **[decidir] O gráfico da Evolução.** Ele passa a usar o vermelho do mapa, e não o verde `progresso` do token `grafico`. É uma exceção à regra "uma cor nos gráficos": a cor é a do músculo, não a do gráfico.
- **Para o profissional com CREF**: as divergências entre o ExRx e o catálogo listadas na seção 3, e os quatro exercícios por convenção.
