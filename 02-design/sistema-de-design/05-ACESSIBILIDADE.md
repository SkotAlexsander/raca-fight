# 05 — Acessibilidade

O que este arquivo é: as regras que fazem o app funcionar para quem enxerga pouco, não enxerga, tem a mão trêmula, usa fonte grande ou se incomoda com movimento. Não é um anexo: é critério de aceitação de cada componente.

Referência: WCAG 2.2 nível AA, com as exigências específicas de celular (alvo de toque, leitor de tela do Android — TalkBack — e do iOS — VoiceOver).

## 1. Contraste

| O que | Mínimo | Como o sistema garante |
|---|---|---|
| Texto comum (até 18 px regular ou 14 px bold) | **4,5:1** | `texto` e `textoSecundario` sobre `fundo` e `superficie` conferidos no `01-TOKENS.md` |
| Texto grande (≥ 24 px, ou ≥ 18,66 px bold) | **3:1** | número de carga, cronômetro, títulos |
| Ícone com significado, contorno de campo, indicador de estado | **3:1** | `marca`, `sucesso`, `atencao`, `erro`, `plus` sobre `superficie`; campo usa `textoSecundario` no contorno, não `borda` |
| Texto sobre cor cheia | **4,5:1** | `marcaTexto`, `sucessoTexto`, `atencaoTexto`, `erroTexto`, `plusTexto` |
| Anel de foco | **3:1** com o que está ao redor | `foco` sobre `fundo` |

Regras:
- Componente desabilitado (opacidade 0,4) está **isento** de contraste pela WCAG, mas o rótulo dele continua legível pelo leitor de tela e o motivo aparece em texto quando faz diferença ("Preencha a carga para marcar a série").
- Texto sobre foto ou vidro (componentes 19 e 20, P09): mede-se contra o **pior pixel** do fundo, não contra a cor média. A foto tem o tratamento de `foto.*` (escurecer 0,72 + degradê) e, atrás de painel de vidro, a camada de contraste. Texto pequeno só na faixa de baixo do degradê. O `auditar.mjs` faz essa medida em cada rodada (texto transparente, foto da moldura, comparação pixel a pixel). *(Corrigido em 10/10/2026, agente N: antes dizia "nunca texto direto sobre foto"; a nova direção do Alex pede o texto por cima, com a medida.)*
- Modo de **alto contraste** do sistema: o app não precisa de tema próprio; os valores já passam. Se a marca entregar valores no limite, criar um par `contrasteAlto` é opcional (v2).

## 2. Alvo de toque

- Mínimo **48 × 48 px** em qualquer coisa tocável (WCAG 2.2 pede 24; o app exige 48 pelo princípio 1).
- Botões usados durante a série: **56 px** (marcar série, +/−). Cronômetro: **64 px**.
- **8 px** entre alvos vizinhos. Dois botões colados são um erro mesmo que cada um tenha 48.
- A área tocável pode ser invisível e maior que o desenho (ícone de 24 em alvo de 48).
- Toque **termina** ao soltar o dedo dentro do alvo. Arrastar para fora cancela. Isso evita o toque errado com a mão suada.
- Nenhuma ação exige **toque longo**, **toque duplo** ou **gesto de dois dedos** como único caminho. Deslizar para marcar/apagar é atalho; existe sempre um botão.

## 3. Leitor de tela (TalkBack e VoiceOver)

Todo componente tem rótulo, papel e estado anunciados. Os casos que mais erram:

### Botões +/− de carga e repetição

| Elemento | Rótulo acessível | Anúncio após o toque |
|---|---|---|
| Botão − da carga | "Diminuir carga" | o novo valor: "27,5 quilos" |
| Botão + da carga | "Aumentar carga" | "30 quilos" |
| O número | papel **ajustável** (`adjustable`): "Carga, 30 quilos" | deslizar para cima/baixo com o leitor ajusta em passos de 2,5 kg |
| Botão − das repetições | "Diminuir repetições" | "11 repetições" |
| Botão + das repetições | "Aumentar repetições" | "12 repetições" |

O passo (2,5 kg; 1 repetição) é dito uma vez na dica: "Toque duplo para aumentar em 2,5 quilos". Unidade sempre por extenso no rótulo ("quilos", não "kg").

### Cronômetro de descanso

| Momento | O que o leitor diz |
|---|---|
| Ao iniciar | "Descanso iniciado, 90 segundos" |
| Enquanto roda | **não** anuncia cada segundo (seria insuportável); região `live` em modo **polite** anuncia aos 30 s e aos 10 s restantes |
| Ao terminar | "Descanso terminado" + vibração (padrão do sistema) + som opcional |
| Botão principal | "Pausar descanso" / "Retomar descanso"; "Pular descanso"; "Mais 30 segundos" |
| O número | rótulo "Tempo restante, 1 minuto e 12 segundos" lido sob demanda, não ao vivo |

### Cronômetro (componente 18)

| Momento | O que o leitor diz |
|---|---|
| Ao iniciar | "Intervalado iniciado, Tabata, 8 rodadas" · "Regressivo iniciado, 5 minutos" · "Livre iniciado" |
| Troca de fase (polite) | "Trabalho, rodada 3 de 8, 20 segundos" · "Descanso, 10 segundos" |
| Enquanto roda | nada a cada segundo; aos 10 s finais da contagem inteira, uma vez |
| Ao terminar | "Terminou, 3 minutos e 50 segundos" + vibração |
| O mostrador | rótulo completo lido sob demanda: "Trabalho, rodada 3 de 8, faltam 14 segundos" |
| Botões | "Pausar o cronômetro" / "Retomar o cronômetro"; "Pular fase"; "Parar"; "Marcar volta"; "Mais 30 segundos" / "Menos 30 segundos" |

A cor do mostrador (trabalho, descanso) nunca é o único sinal: o nome da fase está escrito em cima do número.

### Linha de série

- A linha é **um** elemento acessível: "Série 2, 12 repetições, 30 quilos, não feita. Toque duplo para marcar como feita."
- Dentro dela, os botões +/− são elementos separados navegáveis.
- Depois de marcar: anúncio "Série 2 feita" e o foco **permanece** na linha (não pula para o topo).

### Outros

- Selo Plus: rótulo "Plus" + contexto ("Plano Plus ativo", "Recurso do plano Plus").
- Barra de abas: cada aba com "Início, aba, 1 de 4, selecionada".
- Cartão: o cartão inteiro é um botão com rótulo composto ("Treino A, peito e tríceps, 45 minutos, iniciante").
- Folha inferior: ao abrir, o foco vai para o título da folha; o fundo fica inacessível (`modal`); fechar devolve o foco ao botão que abriu.
- Toast: região `live` **polite**; se tiver "Desfazer", o botão é alcançável e o toast não some enquanto tem foco.
- Estado de carregamento: "Carregando treinos" anunciado uma vez; esqueleto não é lido.
- Campo com erro: a mensagem fica ligada ao campo (`describedBy`) e é anunciada quando o foco entra.
- Imagem decorativa: sem rótulo (oculta do leitor). Imagem de exercício: rótulo com o nome do exercício.

## 4. Fonte ampliada

Detalhado em `03-NAVEGACAO-E-LAYOUT.md`. Resumo das regras:

- O app **nunca trava** a escala de fonte do sistema.
- Texto cresce; alvo de toque não encolhe; nada é cortado na horizontal.
- Acima de 160 %: rótulos das abas somem (ficam no toque longo e no leitor), o campo +/− empilha, cronômetro para de crescer em 72 px.
- Teste obrigatório antes de publicar: as 4 telas-chave em **200 %** no celular pequeno (360 × 640). Se alguma ação sumir, é defeito.

## 5. Movimento reduzido

Quando `prefers-reduced-motion` (ou a opção do sistema) está ativo:

- Todo efeito vira um **esmaecer de opacidade** de `movimento.reduzido.duracao` (**160 ms**), com a curva `entrada`. Nada desliza, cresce, quica ou reflete: a folha aparece e some esmaecendo; a aba troca por esmaecer; o toast aparece sem subir; o check da série e a comemoração do treino fechado só esmaecem; o cartão pressionado não afunda (fica só a camada de 8 %); o reflexo dourado do convite ao Plus não passa. *(Corrigido em 10/10/2026, agente L: antes dizia "todas as durações vão a 0". Esmaecer curto ainda mostra que algo mudou, sem o movimento que incomoda. Catálogo em `movimento/00-CATALOGO.md`, regra 2.)*
- Exceções que continuam: o **progresso do cronômetro** (anel ou barra) salta uma vez por segundo, sem interpolação; a **cor da fase** do mostrador troca na hora.
- Nenhum **auto-play**: a comemoração do treino fechado é um check que se desenha uma vez, sem confete; com a preferência, ele já vem desenhado.
- Nenhuma animação em loop (pulsar, piscar) em nenhuma condição, com ou sem a preferência. Os únicos movimentos contínuos permitidos são o cronômetro e o indicador nativo de "atualizando" do puxar para atualizar. O brilho do esqueleto passa no máximo 3 vezes e para; o indicador circular de carregando do mockup gira no mesmo teto (3 voltas de 1400 ms) e fica parado como um arco.
- Vibração ao terminar descanso **continua** (não é movimento visual) e pode ser desligada em Perfil.

## 5b. Vidro e "Reduzir transparência"

*Acrescentado em 10/10/2026 (agente N, P09).*

- Com **"Reduzir transparência"** ligado (iOS: Ajustes › Acessibilidade › Tela e Tamanho do Texto; no app, `AccessibilityInfo.isReduceTransparencyEnabled()` e o evento `reduceTransparencyChanged`), todo vidro vira a cor `vidro.<tema>.solido`, **sem desfoque**. No Android, onde não há a opção em todo aparelho, o vidro abaixo do Android 12 já nasce sólido (o desfoque não existe ali). No navegador e no mockup: `prefers-reduced-transparency` e a chave "Sem transparência" no topo.
- O desenho não muda de lugar nem de tamanho; só a cor de trás fica firme. O contraste continua medido (o sólido passa com folga: é o par `texto`/`superficieElevada`).
- Vidro nunca é a única pista de agrupamento: o painel tem borda de 1 px e raio próprios.
- Animação do vidro (o desfoque que acompanha a rolagem) não existe: o desfoque é parado. Nada a reduzir com "reduzir movimento".

## 6. Cor não é a única informação

| Situação | Cor | O que mais |
|---|---|---|
| Série feita | `sucesso` | ícone de check + rótulo "feita" |
| Série pendente | `superficie` | sem check, rótulo "não feita" |
| Plus | `plus` | a palavra "Plus" |
| Erro de campo | `erro` | ícone + mensagem em texto abaixo do campo |
| Descanso acabando (10 s) | `atencao` | número fica bold + vibração curta |
| Fase do intervalado | `marca` (trabalho) · `sucesso` (descanso) | o nome da fase escrito no mostrador + vibração média na troca + anúncio do leitor |
| Aba ativa | `marca` | ícone preenchido + rótulo bold + indicador |
| Progresso do exercício (anel) | `progresso` / `sucesso` | número de séries feitas no centro + rótulo "1 de 3 séries feitas" |
| Aluno sem dados corporais | — | texto "Não informado", nunca campo vazio |

## 7. Formulários

- Rótulo **acima** do campo, sempre visível (não desaparece ao digitar; placeholder não é rótulo).
- Campo numérico abre **teclado numérico**; campo de carga aceita vírgula e ponto.
- Erro aparece **ao sair do campo** ou ao enviar, nunca a cada tecla. Mensagem diz o que fazer: "Informe um peso entre 20 e 300 kg".
- Campo obrigatório é marcado em texto ("obrigatório"), não só com asterisco.
- Dados corporais são **opcionais** e o formulário diz isso no topo: "Tudo aqui é opcional. Quanto mais você informa, melhor o treino que montamos."

## 8. Foco e teclado externo

Celular com teclado Bluetooth ou leitor de tela com navegação por foco:

- Anel de foco de **3 px** `foco` por fora do elemento, com `raio` do elemento + 3. Visível só em navegação por foco (`focus-visible`), não ao tocar.
- Ordem de foco segue a ordem visual: cabeçalho → conteúdo → barra de abas.
- Folha inferior prende o foco dentro dela até fechar.

## 9. Checklist por componente

Antes de marcar um componente como pronto no `02-COMPONENTES.md`:

- [ ] Alvo ≥ 48 px (56/64 onde o arquivo manda) e 8 px dos vizinhos
- [ ] Contraste conferido nos dois temas (texto 4,5; grande e ícone 3)
- [ ] Rótulo acessível em português, com unidade por extenso
- [ ] Estado anunciado (selecionado, feito, desabilitado, carregando, erro)
- [ ] Estado visível sem cor (ícone ou texto)
- [ ] Funciona em 200 % de fonte no 360 × 640
- [ ] Com movimento reduzido, só esmaecer de 160 ms (sem deslizar, crescer, quicar ou refletir)
- [ ] Sem toque longo ou gesto como único caminho (o "deslizar para começar" também começa com um toque)
- [ ] Sobre foto ou vidro: contraste contra o pior pixel; com transparência reduzida, vira sólido

## 10. O que a marca precisa respeitar

- Os 10 papéis de cor com a tabela de contraste do `01-TOKENS.md` verde.
- Fonte de interface com `x-height` alto e formas abertas (confusão entre "1", "l" e "I" é problema real em carga: "11" vs "ll").
- Fonte de número com algarismos tabulares.
- Ícones com traço de 2 px e formas distinguíveis em 24 px; "check" e "mais" não podem parecer iguais.
- Nenhum uso de só-cor para o Plus: o selo sempre leva a palavra.
