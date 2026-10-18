# 02 — Componentes

O que este arquivo é: a lista fechada de componentes do Academia Plus, cada um com para que serve, anatomia, tamanhos, estados e regras. Critério: quem tem este arquivo e o `tokens.json` implementa sem perguntar tamanho nem estado.

Convenções deste arquivo:
- Medidas em px, sempre da escala de 4. Cor sempre pelo papel (`marca`, `superficie`...), nunca por valor.
- **Estados padrão** (valem para todo componente interativo, salvo nota contrária):
  - **normal** — como descrito na anatomia.
  - **pressionado** — fundo escurece/clareia com uma camada de `texto` a 8 % por cima (claro) ou 12 % (escuro); escala 0,98 (`movimento.escalaToque`) em `duracao.rapida`. Sem efeito de "ripple" grande. **Cartão tocável afunda**: além disso desce 1 px e perde a sombra de repouso; ao soltar volta na `movimento.mola.toque` (200 ms, sem quique). Com movimento reduzido, só a camada (esmaecer de 160 ms).
  - **desabilitado** — opacidade `desabilitadoOpacidade` (0,4) no componente inteiro; não responde a toque; rótulo continua lido pelo leitor de tela com "desabilitado".
  - **carregando** — conteúdo troca por esqueleto (`superficie` com faixa de `borda` a 60 %) ou por indicador circular de 24 px em `marca`; o componente mantém o tamanho; toque bloqueado.
  - **erro** — contorno 2 px `erro` + mensagem em `corpoPequeno` `erro` com ícone de 16 px abaixo do componente.
  - **foco** (teclado/leitor) — anel 3 px `foco` por fora, raio do componente + 3.
- Todo componente é **largura total da coluna** (100 %) a menos que diga "intrínseco".
- **iPhone e Android**: o desenho (cor, tamanho, raio, toque) é o mesmo nas duas plataformas; onde o **comportamento** segue o sistema, o componente tem uma linha **"No iPhone"**. A lista completa do que é igual e do que segue a plataforma está em `06-IPHONE.md`.

Lista (acrescentados em 10/10/2026, P09: 19 Foto com texto · 20 Vidro · 21 Deslizar para começar · anel por exercício): 1 Botão · 2 Campo de texto · 3 Campo numérico +/− · 4 Campo de seleção · 5 Cartão de exercício · 6 Linha de série · 7 Cronômetro de descanso · 8 Cartão de treino pronto · 9 Cartão de aluno · 10 Selo Plus · 11 Lista de refeição · 12 Barra de abas · 13 Cabeçalho · 14 Folha inferior · 15 Estado vazio · 16 Toast · 17 Auxiliares (chip, avatar, divisor, cartão de número, esqueleto, interruptor, puxar para atualizar) · 18 Cronômetro (livre, regressivo, intervalado).

> **Proporção 1.8.0 (10/10/2026, regra do Alex) — vale sobre qualquer medida antiga deste arquivo.** Tamanho visual ≠ área de toque. O desenho de cada controle é o do grupo `controle` do `tokens.json`: **botão primário 48** (texto 16) · **secundário 40** · **botão-ícone 40** · **marcar série 40** · **+/− 36** · **chip 32** · **barra de abas 56** + área segura (ícones 24) · **deslizar 56** (botão 48) · **nada interativo passa de 56**. A área de toque continua com **48** (44 pt é o piso no iOS), por `hitSlop` no app. Texto só na escala fechada 13 · 16 · 20 · 25 · 31 · 39 · 49 · 61, **um herói por tela** (um só texto ≥ 49), número e unidade em no máximo 2,5 : 1 na linha de base, foto herói em no máximo 45 % da altura útil (340). Onde uma seção abaixo ainda disser 56 ou 64 de desenho, ou número de 40/96/112, a regra desta caixa manda.

---

## 1. Botão

*1.6.0 (P09): todo botão de texto é **pílula** (`raio.botao` 999), e o primário é o **verde vivo** (`viva` com `vivaTexto`, 11,67:1) nos dois temas. O botão principal sobre foto pode ganhar `sombra.viva` (o brilho), uma vez por tela.*

**Para que serve**: disparar uma ação. Três variantes por importância: **primário** (a ação principal da tela — uma por tela), **secundário** (ações de apoio), **perigo** (destrutivo: apagar, encerrar, cancelar assinatura).

**Anatomia**: [ícone 24 opcional] + rótulo `corpoForte`. Ícone à esquerda do texto, 8 px entre eles. Conteúdo centralizado.

**Tamanhos**:

| Tamanho | Altura | Padding lateral | Onde |
|---|---|---|---|
| grande | **48** (era 64) | 24 | "Iniciar treino", "Concluir treino", "Assinar o Plus" — o que muda é a largura e o lugar, não a altura |
| padrão | **48** (era 56) | 20 | a maioria (botão primário) |
| secundário | **40** | 16 | contorno, texto, ação de apoio (área de toque 48 por hitSlop) |
| pequeno | **40** (era 48) | 16 | dentro de cartão, toast, cabeçalho (área de toque 48) |

Raio `raio.medio` (12). Largura: 100 % da coluna por padrão; **intrínseco** (largura do conteúdo, mínimo 96 px) quando está em linha com outro botão. Dois botões em linha: 12 px entre eles, o primário à direita.

**Variantes**:

| Variante | Fundo | Texto/ícone | Contorno |
|---|---|---|---|
| primário | `marca` | `marcaTexto` | — |
| secundário | transparente | `texto` | 2 px `textoSecundario` |
| perigo | `erro` | `erroTexto` | — |
| perigo discreto (em folha de confirmação) | transparente | `erro` | 2 px `erro` |

**Estados** (além dos padrão):
- carregando: rótulo some, indicador de 24 px no centro, **largura não muda**.
- Botão primário desabilitado continua com `marca` a 0,4 — não vira cinza secundário (o usuário precisa saber que ali há uma ação principal esperando).

**Regras**:
1. Rótulo é verbo no infinitivo ou imperativo curto: "Iniciar treino", "Salvar", "Marcar feita". Nunca "OK", "Sim".
2. Botão primário em tela de execução de treino fica **na metade de baixo** da tela.
3. Botão só com ícone (sem texto) tem alvo 48 × 48 e rótulo acessível obrigatório. Só no cabeçalho e na linha de série.
4. Botão de perigo nunca é o primário visual de uma tela; aparece em folha de confirmação ou em fim de tela.

---

## 2. Campo de texto

**Para que serve**: nome do treino, observação do exercício, busca de aluno, texto da dieta (quando texto livre), mensagem.

**Anatomia** (de cima para baixo): rótulo `legenda` `textoSecundario` (4 px abaixo dele o campo) → caixa com texto `corpo` → opcional: texto de apoio ou erro `corpoPequeno` (4 px abaixo).

**Tamanhos**: altura **48** (uma linha); multilinha cresce com mínimo 96 e máximo 5 linhas (depois rola). Padding lateral 16. Raio 12. Contorno 1 px `textoSecundario`; em foco, 2 px `marca`. Fundo `superficie`. Ícone à esquerda (busca) 24 px com 12 px até o texto; botão limpar à direita 48 × 48.

**Estados**: normal · foco (2 px `marca`) · preenchido · desabilitado · erro (2 px `erro` + mensagem) · somente leitura (sem contorno, texto `texto`, rótulo mantém).

**Regras**:
1. Rótulo sempre visível acima; placeholder só com exemplo ("Ex.: Treino A — peito") e some ao digitar.
2. Fonte do campo **nunca abaixo de 16 px** (evita zoom no iOS).
3. Erro aparece ao sair do campo ou ao enviar; nunca a cada tecla.
4. Campo de busca em lista densa (visão academia) é fixo no topo, 48 px, com margem 16 em volta.

---

## 3. Campo numérico com +/− (carga e repetição)

**Para que serve**: ajustar carga (kg), repetições, tempo de descanso e número de séries durante e fora do treino. É o componente mais tocado do app.

**Anatomia** (horizontal): botão **−** (circular) · bloco central (rótulo `legenda` em cima, número embaixo, unidade `legenda` ao lado do número) · botão **+** (circular). O bloco central é tocável e abre o teclado numérico para digitar direto.

**Tamanhos**:

| Variante | Botões +/− | Número | Altura total | Onde |
|---|---|---|---|---|
| **execução** | **36 × 36** (era 56), raio redondo, área de toque 48 | `numeroCarga` 25 (20 em < 390; era 40) | 48 | linha de série em andamento, cronômetro |
| **edição** | **36 × 36** (era 48), área de toque 48 | `numeroMedio` 25 | 48 | montar treino, editar série fora do treino, perfil (peso/altura) |

Espaço entre botão e bloco central: 12. Botões: fundo `superficie` com contorno 2 px `textoSecundario`; ícone 24 px `texto`. Quando o bloco central está em foco (digitando), contorno 2 px `marca` em volta do número.

**Passos**:

| Grandeza | Passo do toque | Toque longo (atalho) | Limites |
|---|---|---|---|
| carga | **2,5 kg** | repete a cada 150 ms | 0 a 999,5 kg |
| repetições | 1 | repete | 0 a 99 |
| descanso | 15 s | repete | 0 a 600 s |
| séries | 1 | — | 1 a 20 |

Guardado em gramas/segundos (CLAUDE.md); exibido formatado: "27,5 kg", "12", "1:30".

**Estados**: normal · pressionado (só o botão tocado) · desabilitado (os três) · no limite (o botão que não pode mais fica desabilitado, o outro não) · erro (digitou fora do limite: contorno `erro` + "Entre 0 e 999,5 kg") · carregando (não existe: valor é local, salva depois).

**Regras**:
1. Alvo de 56 na execução **não negocia**, mesmo no celular pequeno.
2. Toque longo é atalho; o toque simples sempre funciona.
3. Leitor de tela: "Diminuir carga" / "Aumentar carga", e o número com papel ajustável (ver `05-ACESSIBILIDADE.md`).
4. Mudar carga durante a série em andamento **não** pede confirmação e **não** altera as séries já marcadas como feitas.

**No iPhone — barra acima do teclado numérico.** Ao tocar no bloco central e digitar, o iOS abre o teclado numérico (`decimal-pad` na carga e no peso, `number-pad` nas repetições), que **não tem tecla "Próximo" nem "OK"**: sem ajuda, o aluno fica preso no campo. Por isso o campo numérico leva uma barra colada em cima do teclado (no código, `InputAccessoryView`; ver `03-arquitetura/04-IPHONE.md`):

| Parte | Medida | Comportamento |
|---|---|---|
| barra | altura **48**, largura total, fundo `superficieElevada`, divisor 1 px `borda` em cima | aparece só enquanto o teclado numérico está aberto; sobe e desce com ele |
| "Próximo" | botão texto 48, à esquerda, `marca` | vai para o próximo campo numérico da tela (repetições → carga → próxima série); no último campo, fica desabilitado |
| "OK" | botão texto 48, à direita, `marca`, peso 700 | confirma o valor e fecha o teclado (o valor é validado aqui, regra 3 do campo de texto) |

Os dois botões ficam a 8 px das bordas da barra e nunca se encostam (alvo de 48, mínimo de 96 de largura). No Android o teclado numérico já tem a tecla de ação e a barra **não** aparece. Amostra no mockup, componente 3.

---

## 4. Campo de seleção

**Para que serve**: escolher uma opção numa lista curta: objetivo (emagrecer, ganhar massa, condicionamento, iniciante...), nível, dia da semana, grupo muscular.

**Anatomia**: igual ao campo de texto (rótulo + caixa 48 px), com o valor escolhido e um ícone de seta para baixo 24 px à direita. Toque abre **folha inferior** com a lista de opções (linha 56 px, check à direita na escolhida). Até 4 opções, pode ser **chips** em linha no lugar da caixa.

**Tamanhos**: caixa 48 px; chips **32** de desenho (era 48) com área de toque 48, padding 12, 8 px entre eles e 16 entre linhas (a área de toque não invade a linha de baixo).

**Estados**: normal · aberto (seta vira para cima, contorno `marca`) · selecionado · desabilitado · erro.

**Regras**:
1. Nunca usar o `select` nativo do sistema para **opções**: a folha inferior tem alvos maiores e mostra o Plus quando a opção é do plano. **Data e hora são a exceção**: usam o seletor nativo da plataforma (no iPhone, o seletor de rodas/calendário do iOS; no Android, o do Material), dentro de uma folha. Ninguém deve reaprender a escolher uma data dentro do nosso app.
2. Opção do Plus na lista leva o selo Plus à direita e, sem assinatura, abre o convite ao Plus ao tocar — não fica desabilitada "sem explicação".
3. Seleção múltipla (restrições, grupos musculares) usa chips com check.

---

## 5. Cartão de exercício

**Para que serve**: um exercício dentro de um treino: nome, grupo muscular, séries. Tem **dois modos**: **execução** (o aluno treinando) e **edição** (aluno montando treino livre, funcionário montando para aluno).

**Anatomia (execução, expandido)**:
1. Cabeçalho do cartão: imagem/ícone 48 × 48 (raio 8, opcional) · nome `titulo3` · grupo muscular `legenda` `textoSecundario` · à direita, botão de menu 48 × 48 (observação, trocar, remover).
2. Lista de **linhas de série** (componente 6), uma por série, 8 px entre elas.
3. Rodapé: botão secundário pequeno "Adicionar série" (intrínseco) e, à direita, descanso padrão "90 s" como chip tocável que abre o campo +/−.

**Anatomia (execução, dobrado)**: só o cabeçalho + resumo "3 × 12 · 30 kg · 2/3 feitas" em `corpoPequeno`, e indicador de progresso de 4 px na base (`sucesso` proporcional às séries feitas). Toque no cabeçalho expande. **Só um cartão expandido por vez** (o atual); os outros ficam dobrados.

**Anatomia (edição)**: cabeçalho igual + alça de arrastar 48 × 48 à esquerda para reordenar · campos +/− em variante **edição** para séries, repetições, carga sugerida e descanso · botão "Remover exercício" perigo discreto no rodapé.

**Tamanhos**: largura total; padding 16; raio 16; fundo `superficie`; `sombra.1`. Cabeçalho 56 px de altura (dobrado fica 72 com o resumo). Imagem 48.

**Estados**: normal · **atual** (contorno 2 px `marca` à esquerda, como uma régua de 4 px no lado) · concluído (todas as séries feitas: cabeçalho ganha check `sucesso` 24 px; cartão dobra sozinho) · pressionado (sombra sobe para `sombra.2`) · carregando (esqueleto com cabeçalho e 3 linhas) · erro (falha ao salvar: faixa `erro` no topo com "Não salvou. Tentar de novo") · arrastando (edição: `sombra.3`, escala 1,02).

**Regras**:
1. O nome do exercício nunca é cortado: quebra em 2 linhas no máximo e depois reticências.
2. Concluir todas as séries dobra o cartão e expande o próximo em `duracao.lenta`. Se o próximo não existe, aparece o botão "Concluir treino" (grande, 64). Ao confirmar a conclusão do treino, **vibração média** (`vibracao.concluirTreino`), nas duas plataformas.
3. O cartão em execução não tem campo de digitação aberto por padrão: tudo é +/−.
4. Em **edição pelo funcionário** o cartão mostra "Carga sugerida"; o aluno pode ajustar na execução sem alterar a sugestão.

---

## 6. Linha de série

**Para que serve**: uma série de um exercício durante a execução. Mostra o alvo (reps × carga), deixa ajustar e **marcar como feita**.

**Anatomia** (horizontal, altura **72**): número da série em círculo 32 px `legenda` (`superficie` com contorno `borda`; feita: `sucesso` com check `sucessoTexto`) · campo +/− **repetições** (variante execução: botões 36, número 25 sendo editado; nas linhas que não estão em edição o número é `numeroSerie` 20) · "×" `legenda` · campo +/− **carga** · botão **marcar feita** 40 × 40 à direita, área de toque 48 (era 56 × 56).

No celular pequeno (360) não cabem dois campos +/− com botões de 56 lado a lado. **Solução**: a linha de série mostra os dois números grandes (reps e carga) lado a lado **sem** os botões +/−; tocar num número abre os botões dele abaixo da linha, em uma faixa de 72 px (um campo +/− por vez). No médio e grande, os botões aparecem direto. Isso é a única diferença de layout por largura num componente.

**Tamanhos**: altura 72 (médio/grande) · 72 + 72 quando a faixa de ajuste está aberta (pequeno) · padding lateral 12 · raio 12 · fundo `superficie` com contorno 1 px `borda`.

**Estados**:
- **pendente** (normal): como acima.
- **feita**: fundo `sucesso` a 12 % sobre `superficie`; círculo com check; números em `textoSecundario`; botão marcar vira "Desfazer" (ícone de seta) 56 × 56.
- **atual**: régua de 4 px `marca` à esquerda; é a próxima a marcar.
- pressionado (botão marcar): fundo `sucesso` cheio por `duracao.rapida` antes de assentar.
- desabilitado: quando o treino já foi concluído (somente leitura, sem botões).
- erro: não há erro local; falha de salvamento é do cartão.

**Regras**:
1. Marcar feita é **um toque, sem confirmação**; o toast "Série 2 feita · Desfazer" fica 5 s (componente 16). Além do toast, o botão "Desfazer" na própria linha permite voltar a qualquer momento. Ao marcar, **vibração leve** (`vibracao.marcarSerie`, impacto leve); ao desfazer, a vibração de seleção, mais fraca. Igual nas duas plataformas; desligável em Perfil.
2. Marcar a série **inicia o cronômetro de descanso** automaticamente (configurável em Perfil: "Iniciar descanso ao marcar série", ligado por padrão).
3. Deslizar a linha para a direita marca feita (atalho). Para a esquerda, não faz nada (nada destrutivo por gesto numa linha de série).
4. Os valores da série feita são os que estavam na hora de marcar; mudar depois pede "Desfazer" primeiro.
5. Leitor de tela: a linha é um elemento ("Série 2, 12 repetições, 30 quilos, não feita"); +/− e marcar são filhos navegáveis.

---

## 7. Cronômetro de descanso

**Para que serve**: contar o descanso entre séries. Começa ao marcar uma série, pode ser pausado, pulado ou estendido. O mesmo componente conta a **série por tempo** (a prancha de 30 s: rótulo "Prancha · série 2" no lugar de "Descanso", e "Parar" no lugar de "Pular descanso"). É o modo regressivo do Cronômetro (componente 18), com o mesmo motor (`app/dominio/cronometro.ts`): guarda o instante de início e as pausas, nunca um contador.

**Anatomia (expandido, dentro da tela de treino)**: anel de progresso 160 px de diâmetro, traço 8 px, trilho `borda`, progresso `marca` (vira `atencao` nos últimos 10 s) · no centro, tempo restante `numeroCronometro` (64; 56 no pequeno) formatado "1:30" com algarismos tabulares · abaixo do anel, linha de três botões: "−30 s" secundário intrínseco 48 · **Pausar / Retomar** primário **64 × 64** circular · "+30 s" secundário intrínseco 48 · abaixo, "Pular descanso" como botão texto 48.

**Anatomia (faixa, acima da barra de abas, em qualquer aba)**: altura **56**, largura total, fundo `superficieElevada`, `sombra.2`: barra de progresso 4 px no topo · ícone 24 · "Descanso · 0:45" `corpoForte` tabular · botão "Pausar" 48 × 48 · botão "Pular" 48 × 48. Toque na área de texto volta à tela de treino.

**Tamanhos**: anel 160 (144 no pequeno) · botão central 56 (era 64) · faixa 56. Número `numeroCronometro` 49.

**Estados**: parado (mostra o tempo configurado e "Iniciar") · **rodando** · pausado (anel congela, número `textoSecundario`, botão vira "Retomar") · últimos 10 s (progresso `atencao`, número bold, vibração curta aos 3, 2, 1) · terminado (anel `sucesso` cheio, número "0:00", vibração de fim, texto "Descanso terminado · Próxima série" e fecha sozinho em 3 s, ou ao tocar) · desabilitado: não existe.

**Vibração de fim do descanso, por plataforma** (`vibracao.fimDescanso`):
- **Android**: vibração longa (um pulso de ~400 ms).
- **No iPhone**: o motor de vibração do iPhone não faz vibração longa por API pública. Com o app aberto, o fim do descanso usa o **padrão de notificação de sucesso** (`expo-haptics` `notificationAsync(Success)`: dois toques curtos). Com o app em segundo plano ou fechado, quem avisa é a **notificação local** agendada, com o **som** e a vibração da própria notificação do iOS (regra 2). O sentido é o mesmo ("acabou"); a forma é a do sistema.
- O iOS ignora a vibração com o Modo de Pouca Energia ligado ou a vibração do sistema desligada. Por isso a vibração nunca é o único aviso: o anel fica `sucesso` e o texto muda.

**Regras**:
1. Movimento reduzido: o anel atualiza por segundo sem interpolação.
2. O cronômetro **continua em segundo plano** e manda notificação local ao terminar se o app estiver fechado.
3. Nunca anuncia cada segundo no leitor de tela; anuncia aos 30 s e 10 s.
4. O tempo vem do descanso da série (padrão 60 s, R1.14 e R1.15; o "90 s" que estava aqui contrariava a regra). "+30 s"/"−30 s" valem só para este descanso; "−30 s" com menos de 30 s restantes termina na hora (R9.8). Descanso 0 = sem cronômetro.
5. Um cronômetro só por vez no app (R9.9). Marcar outra série enquanto um descanso roda **reinicia** o descanso (sem perguntar). Com um cronômetro avulso rodando (intervalado, livre, regressivo), o descanso **não começa**: toast "Série feita · o intervalado continua" com o botão "Descansar".
6. A faixa mostra o cronômetro que estiver rodando, de qualquer modo: "Descanso · 0:45", "Trabalho 3/8 · 0:14", "Livre · 12:47" (componente 18).

---

## 18. Cronômetro

**Para que serve**: medir tempo de três jeitos numa tela só (H69–H76, regras da seção 9 de `01-especificacao/03-REGRAS.md`): **livre** (conta para cima, com voltas), **regressivo** (conta para baixo e vibra no fim) e **intervalado** (trabalho, descanso e rodadas: Tabata, EMOM, HIIT). Abre pelo relógio do cabeçalho do Treino em andamento e pelo atalho do Início. É o mesmo motor do componente 7 (`app/dominio/cronometro.ts`): o descanso e a série por tempo são o regressivo com outra roupa.

**O número se lê a 1 m.** O aluno está na esteira, no chão fazendo prancha ou com o celular apoiado no banco. O mostrador usa `numeroCronometroTela`: **96 / 104 / 700**, com algarismos tabulares (80 / 88 no celular pequeno). A conta:
- num iPhone 16, 1 pt mede cerca de 0,166 mm;
- o algarismo tem cerca de 0,7 do tamanho da fonte, então 96 pt dão algarismos de cerca de **11 mm**;
- a regra prática de sinalização pede cerca de 1 cm de letra por metro de distância.

O `numeroCronometro` de 64 (componente 7) dá ~7,5 mm: serve ao descanso, que se olha com o celular na mão. O 96 já é o teto: **não cresce** com a fonte do sistema (`tetoAmpliacao`), porque não caberia "1:02:05" na largura.

**Anatomia (rodando)**, de cima para baixo, na coluna de conteúdo:
1. Cabeçalho de 56 com voltar ("Voltar ao treino" quando veio do treino), título "Cronômetro" e, em cima, a legenda "Treino A em andamento" quando há treino.
2. Linha de informação (`corpoPequeno`, `textoSecundario`): o modo e a predefinição em `corpoForte` ("**Intervalado** · Tabata 20/10 × 8") à esquerda e "Total 4:00" à direita.
3. **Mostrador**, que ocupa a largura toda, com raio 16 e preenchimento 24 / 16 / 20:
   - o nome da fase (`titulo3`): Prepare-se · Trabalho · Descanso · Livre · Terminou;
   - o número (`numeroCronometroTela`);
   - a **barra da fase** (8, raio redondo, trilho na cor do texto a 24 %, progresso na cor do texto);
   - no intervalado, "Rodada 3 de 8" (`corpoForte`) e a **fileira de rodadas**: um traço de 8 por rodada, vão 4, feitas cheias, a atual a 60 %, as que faltam a 24 %.
4. Linha de informação: "Depois: **descanso 10 s**" e "Feito 1:16 de 4:00".
5. **Controles**, centralizados, vão 12: secundário intrínseco 48 · **primário circular 64** (Iniciar / Pausar / Retomar) · secundário intrínseco 48.
   - livre: Volta · Pausar · Parar;
   - regressivo: −30 s · Pausar · +30 s, e "Pular" como botão texto 48 embaixo;
   - intervalado: Pular fase · Pausar · Parar.
6. Uma linha de apoio (`legenda`): "A tela fica acesa enquanto o cronômetro roda."

**A fase pinta o mostrador** (`tokens.json › cronometro.fase`). Assim, de longe, a cor diz a fase antes do número; o nome escrito garante que a cor nunca é o único sinal.

| Fase | Fundo | Texto |
|---|---|---|
| preparação, livre, regressivo rodando | `superficie` | `texto` |
| **trabalho** | `marca` | `marcaTexto` |
| **descanso** | `sucesso` | `sucessoTexto` |
| terminado | `sucesso` | `sucessoTexto` |
| pausado | `superficie` | número em `textoSecundario` |

**Anatomia (parado)**: no lugar do mostrador vem a configuração do modo, e o botão do meio vira "Iniciar" primário grande de largura total (64).
- No topo, os três **chips de modo** (componente 4, 48): Livre · Regressivo · Intervalado.
- **Livre**: só o número 0:00.
- **Regressivo**: chips de atalho 1 min · 2 min · 3 min · 5 min · 10 min · Outro, o número do tempo escolhido e −30 s / +30 s.
- **Intervalado**: chips das predefinições (Tabata 20/10 × 8 · EMOM 10 min · HIIT 30/30 × 10 · HIIT 40/20 × 8 · Personalizado). Depois, quatro campos +/− de edição (componente 3, 48): Preparação · Trabalho · Descanso · Rodadas, com a linha "Total 4:00". Mexer num número troca o chip para "Personalizado".

**Anatomia (terminado)**: o mostrador fica `sucesso` com "Terminou" e o resumo ("8 rodadas · 3:50"; no livre, as voltas). Os botões:
- "Registrar como série", primário, só para livre, intervalado e regressivo avulso com 1 s ou mais;
- "De novo", secundário;
- "Fechar", texto.

**Voltas (livre)**: lista compacta (linhas de 56) abaixo dos controles, a mais nova em cima: "Volta 2 · 6:10". A volta que está correndo aparece no mostrador ("Volta 3 · 0:10").

**Folha "Registrar como série"** (componente 14, curta):
- título "Registrar como série";
- campo de tempo, já com o tempo feito (sem pausas, sem o que foi pulado, sem a preparação), editável;
- linha do exercício: o atual, se for por tempo, ou "Escolher exercício", que mostra só os por tempo;
- apoio "Sem as pausas e a preparação";
- botões Cancelar · Salvar (sem treino: "Salvar no histórico").

**Faixa** (rodando ou pausado, fora da tela Cronômetro): é a faixa de 56 do componente 7, com o texto do modo. Exemplos: "Trabalho 3/8 · 0:14", "Livre · 12:47", "Regressivo · 4:59". No intervalado, a barra de 4 do topo da faixa é a da fase, com a cor da fase.

**Estados**: parado · rodando · pausado · terminado. Não existe desabilitado: o botão do meio sempre faz algo. No intervalado, nos 10 s finais de uma fase, o número fica bold e a barra da fase, `atencao` sobre o mostrador `superficie` (sobre `marca` e `sucesso` a barra continua na cor do texto: o aviso vem pela vibração dos 3, 2, 1 e pelo leitor de tela).

**Tamanhos**: número **61** (49 no pequeno; era 96) · mostrador largura total · barra da fase 8 · traço de rodada 8 · botão do meio **56** (era 64) · laterais 40 com área de toque 48.

**Vibração** (`vibracao`): leve nos 3, 2 e 1 s finais de cada fase (`ultimosSegundosDescanso`); **média na troca de fase** (`trocaDeFase`); o padrão de "concluído" no fim (`fimDescanso`). Com o app fechado, quem avisa é a notificação local (regra 2 do componente 7).

**Leitor de tela**: o mostrador é um `timer` com rótulo completo ("Trabalho, rodada 3 de 8, faltam 14 segundos"), lido sob demanda. Ao vivo, em modo polite, só anuncia a **troca de fase** ("Descanso, 10 segundos") e os 10 s finais da contagem inteira; nunca cada segundo.

**Regras**:
1. Um cronômetro por vez no app (R9.9). Começar outro por cima de um avulso pergunta; marcar uma série com o intervalado rodando **não** começa o descanso: toast "Série feita · o intervalado continua" com "Descansar".
2. Enquanto a tela Cronômetro está aberta e rodando, a tela do celular não apaga (R9.13).
3. A configuração do último uso de cada modo volta na próxima vez.
4. Rodando, a configuração some: não se troca de modo nem de predefinição no meio. Para mudar, Parar e configurar de novo.
5. Movimento reduzido: a barra da fase e a fileira de rodadas atualizam por segundo, sem interpolação; a troca de cor do mostrador é instantânea (sem transição de cor).
6. Nunca pisca nem pulsa, nem nos últimos segundos (`05-ACESSIBILIDADE.md`).

**No iPhone**: igual ao Android no desenho. A vibração média da troca de fase é o `impactAsync(Medium)`; com o app fechado, cada troca de fase é uma notificação local agendada pelo instante (`03-arquitetura/04-IPHONE.md`, seção 6), no máximo 24 de uma vez. A tela acesa usa o `expo-keep-awake` (já vem com o Expo) só enquanto esta tela está aberta.

---

## 8. Cartão de treino pronto

**Para que serve**: um treino da biblioteca da academia, para o aluno escolher por objetivo. Também aparece na visão da academia para gerenciar.

**Anatomia**: **capa por objetivo** no topo do cartão, de borda a borda (`imagem.capa` 184 no cartão em destaque, `imagem.capaPequena` 104 na grade; 48 × 48 na variante lista), foto de `02-design/imagens/capas/`, nunca texto por cima · título `titulo3` · linha de **chips de informação** (não tocáveis, 24 px de altura, `legenda`): **objetivo** (ex.: "Ganhar massa") · **duração** ("45 min") · **nível** ("Iniciante") · descrição `corpoPequeno` `textoSecundario` (0, 1 ou 2 linhas conforme largura) · rodapé: "4 dias · 24 exercícios" `legenda` e, à direita, seta ou botão "Escolher" pequeno 48.

**Tamanhos**: em **grade de 2 colunas** (lista de treinos prontos): largura (coluna − 12) / 2, altura mínima 160, padding 12, raio `raio.cartao` 20, chips quebram linha. Em **destaque** ("Para você"): largura total, padding 16, capa 184. Em **lista** (visão academia, compacta): largura total, altura 72, só título + chips em 1 linha + seta.

**Estados**: normal · pressionado (**afunda**: escala 0,98, desce 1 px, **sem sombra**, camada de `texto` a 8 %/12 %; corrigido em 10/10/2026, agente L, a pedido do P08 e de `movimento/00-CATALOGO.md` › 4.5: antes dizia "`sombra.2`", que sobe) · **escolhido** (o treino que o aluno está seguindo: contorno 2 px `marca` + chip "Em uso" `marca`) · do Plus (treino montado pelo personal: selo Plus no canto superior direito) · desabilitado (treino arquivado pela academia: opacidade 0,4 + chip "Arquivado") · carregando (esqueleto: 3 cartões) · erro (lista: estado vazio variante erro).

**Regras**:
1. A ordem na lista é por objetivo do aluno primeiro (se informado), depois por nível. Nenhuma tela trava se o aluno não informou objetivo: mostra todos com um chip de filtro "Qual é o seu objetivo?".
2. Chips de informação não são tocáveis dentro do cartão; o cartão inteiro é o alvo.
3. Nível e objetivo são **texto**, não só ícone ou cor.

---

## 9. Cartão de aluno (visão academia)

**Para que serve**: um aluno na lista da academia e no topo do perfil dele. O funcionário vê quem é, o objetivo, se é Plus e quando treinou pela última vez.

**Anatomia (linha compacta, na lista)**: altura **56** no mínimo (8 de respiro em cima e embaixo) · avatar 32 (iniciais em `legenda` sobre `borda`) · nome `corpo` · apoio `legenda` `textoSecundario` ("Ganhar massa · treinou há 2 dias") · à direita: selo Plus (se tiver) · seta 24. Nome e apoio **quebram linha** em vez de cortar com reticências: a linha cresce (medido em 10/10/2026: em 360, "Sem cadastro corporal · treinou hoje" não cabe em 1 linha ao lado do selo e da seta).

**Anatomia (cabeçalho do perfil)**: avatar 64 · nome `titulo1` · selo Plus ao lado · linha de 3 **cartões de número** (componente 17) com peso, altura, idade — ou "Não informado" em `textoSecundario` · objetivo em chip · botão primário "Montar treino" (56) e secundário "Ver histórico" em linha.

**Tamanhos**: linha 56 (compacta) · perfil: avatar 64, cartões de número 1/3 da coluna cada, 12 entre eles.

**Estados**: normal · pressionado · sem dados (apoio "Sem cadastro corporal", números "—") · Plus (selo) · inativo (não treina há 30+ dias: apoio em `atencao` "Sem treinar há 34 dias" com ícone) · carregando (esqueleto 8 linhas) · erro (lista: estado vazio variante erro).

**Regras**:
1. Peso, altura e restrições só aparecem para quem a especificação autoriza (LGPD). O componente recebe "não autorizado" e mostra "Não informado" **igual** a quem não cadastrou — não revela que existe dado escondido.
2. O avatar é iniciais por padrão; foto só se o aluno colocar.
3. A linha inteira é o alvo (48 mínimo garantido pelos 56).
4. Lista de 300 alunos: virtualizada; busca filtra enquanto digita (sem botão de buscar).

---

## 10. Selo Plus

**Para que serve**: marcar tudo que é do plano pago: no aluno assinante, no recurso bloqueado, na aba, no treino do personal, no cartão de dieta.

**Anatomia**: pílula com a palavra **"Plus"** em `legenda` bold (12, peso 700, espaçamento 0,04 em) · ícone opcional 16 à esquerda (a marca define: estrela, raio, "+") · 4 px entre eles.

**Tamanhos**:

| Variante | Altura | Padding lateral | Onde |
|---|---|---|---|
| pequeno | 20 | 8 | ao lado do nome em lista compacta |
| padrão | 24 | 12 | cartão, cabeçalho de perfil |
| ponto | 8 × 8 | — | sobre o ícone da aba (Dieta, Personal) sem texto; o rótulo acessível da aba diz "Plus" |

Raio `raio.redondo`.

**Variantes de cor**:
- **cheio**: fundo `plus`, texto `plusTexto` — aluno assinante, recurso ativo.
- **contorno**: fundo transparente, contorno 1,5 px `plus`, texto `plus` — recurso do Plus que a pessoa **não** tem (convite).

**Estados**: ativo (cheio) · disponível (contorno) · a vencer (cheio com ícone de relógio e texto "Plus · 3 dias") · vencido (contorno + "Plus vencido" em `atencao`). Não é tocável por si; quem é tocável é o cartão ou a aba onde está.

**Regras**:
1. **Sempre com a palavra "Plus"** (menos o ponto, que tem rótulo acessível).
2. `plus` **não** aparece em nada que não seja do plano. É a única forma de ensinar o que o Plus libera.
3. O selo nunca é o único sinal de bloqueio: o recurso bloqueado também tem texto ("Disponível no Plus").

---

## 11. Lista de refeição (Plus)

**Para que serve**: o plano de dieta do dia: refeições em ordem, cada uma com itens, e o aluno marca o que fez.

**Anatomia (refeição)**: cabeçalho 56 px: horário `legenda` tabular ("07:00") · nome `titulo3` ("Café da manhã") · à direita, contador "2/3" `legenda` e check de **marcar refeição inteira** 48 × 48 · abaixo, **itens** (linha 56 cada): check 48 × 48 à esquerda · texto `corpo` ("2 ovos mexidos") · quantidade `legenda` `textoSecundario` à direita ("120 g") · rodapé opcional: observação do personal em `corpoPequeno` com ícone de balão, fundo `plus` a 8 %.

**Tamanhos**: largura total; cartão por refeição (raio 16, padding 16, `superficie`, borda esquerda 4 px `plus`); 12 entre refeições; itens 56 px; 8 entre itens.

**Estados**: pendente · **feita** (item: check `sucesso` cheio e texto **esmaecido** em `textoSecundario`, **sem risco**; corrigido em 10/10/2026, P09: o risco lia como "cortado do plano") · refeição completa (cabeçalho com check `sucesso` cheio) · pulada (o aluno marcou "pulei": cabeçalho em `textoSecundario`, sem risco) · sem plano (estado vazio "Seu personal ainda não montou a dieta") · sem Plus (estado vazio com convite, componente 15) · carregando (esqueleto 3 refeições) · erro.

**Regras**:
1. **[decidir]** Texto livre vs. banco de alimentos: o componente é o mesmo. Com banco, a quantidade vira "120 g · 180 kcal" e aparece um cartão de número no topo com o total do dia. Sem banco, só o texto.
2. Marcar item é um toque; desfazer é outro toque; sem toast (muitas marcações por dia).
3. Nenhuma linguagem de julgamento gerada pelo componente: contador é "2/3", nunca "faltou", "falhou".
4. Observação do personal é somente leitura aqui; responder é na conversa.

---

## 12. Barra de abas

**Para que serve**: navegação principal de cada visão. 4 abas (aluno) ou de 3 a 5 (academia, conforme o papel).

**Anatomia**: faixa fixa na base, altura **64** + inset da área segura; fundo `superficie`, divisor de 1 px `borda` no topo (claro) ou `superficieElevada` sem divisor (escuro) · cada aba ocupa largura igual · ícone 24 centrado · rótulo `rotuloAba` (12/16, 600; cresce com a fonte do sistema até 1,3 ×, `tipografia.tetoAmpliacao`) 4 px abaixo · aba ativa: ícone e rótulo em `marca`, ícone preenchido, indicador de 3 × 24 px `marca` no topo da aba (raio redondo) · inativa: `textoSecundario`, ícone de traço · a aba Plus usa o **+ da marca** (o símbolo A, barra com anilhas, em traço 2; antes era a estrela do selo — P09); ponto `plus` de 8 px só aparece quando há novidade do personal.

**Tamanhos**: **56** de altura (era 64) + área segura, ícones de 24; aba mínima 64 de largura (em 360 com o máximo de 5 abas: 72 cada); alvo de toque é a aba inteira (≥ 48 × 64).

**Estados**: ativa · inativa · pressionada (ícone escala 0,92) · com aviso (ponto 8 px `erro` no ícone: mensagem nova do personal; nunca número dentro do ponto) · desabilitada: não existe (toda aba é sempre acessível; o que falta dentro dela é estado vazio).

**Regras**:
1. Rótulo **nunca some** no padrão de fonte; só acima de 160 % (ver acessibilidade).
2. Tocar a aba ativa rola a lista para o topo; tocar de novo não faz nada.
3. A barra **não** esconde ao rolar. Sempre visível (princípio 5).
4. Troca de aba em `duracao.media`, sem deslizar lateral (cada aba mantém sua pilha).
5. **Abas embaixo nas duas plataformas**, com a mesma altura (64 + área segura), os mesmos ícones e os mesmos rótulos. No iPhone a barra do sistema tem 49; a nossa fica com 64 porque o alvo de toque é identidade do app, não da plataforma (princípio 1). A barra termina **acima** do indicador de início (34 de inset no iPhone com Face ID; no iPhone SE, que informa 0, valem os 16 de `layout.areaSegura.baseMinima`). O fundo da barra desce até a borda da tela.
6. **[decidir] Botão + central** (refs 05 e 06; no mockup, `?abas=mais`): um botão redondo de 56 em `viva` no meio da barra, entre Treinos e Plus, que abre uma folha com **Começar treino · Cronômetro · Registrar**. Não é aba (não tem estado ativo) e não muda o número de abas. A favor: o começar treino fica a um toque de qualquer aba. Contra: mais uma coisa na barra, e no Android com 5 abas da academia não cabe (só na visão do aluno).
7. **No iPhone**, tocar a aba ativa rola para o topo (regra 2) e, se a aba estiver numa tela empilhada, volta para a raiz da aba: é o que o iOS faz em todos os apps.
8. **Encostada, não flutuante** (agente Q, junção do P09, 10/10/2026). O agente P propôs em `novas.html` uma barra de vidro flutuante (pílula a 12 px das bordas, aba ativa em `viva` cheio). Ficou a encostada nas três páginas: a flutuante cobria o fim da lista (pedia 64 + 12 px de folga embaixo de toda tela), criava um segundo desenho de aba ativa para o mesmo componente e afastava a barra da borda onde o polegar a procura. As refs 03, 05 e 06 também têm a barra encostada. Os ícones são os de `02-design/icones/` (contorno; a aba ativa usa a versão `-cheio`).

---

## 13. Cabeçalho

**Para que serve**: dizer onde a pessoa está e dar voltar e no máximo uma ação.

**Anatomia**: altura **56** + inset do topo; fundo `fundo` (se integrado à tela) ou `superficie` (se a tela rola e o cabeçalho fixa); à esquerda, botão voltar 48 × 48 (ou nada, na raiz da aba); título `titulo2` (22) centrado ou alinhado à esquerda com margem 16 quando não há voltar; opcional: subtítulo `legenda` `textoSecundario` acima do título (nome da academia na visão academia); à direita, 1 botão de ícone 48 × 48 (menu, buscar, editar) ou o **chip de visão** (desenho de 32 px, alvo de toque de 48 — o contorno de 32 fica centrado numa área tocável de 48) para quem tem dois papéis.

**Variante grande** (raiz de aba, antes de rolar): título `titulo1` (28) alinhado à esquerda, altura 96, que encolhe para 56 com `titulo2` ao rolar (`duracao.media`). Vale **nas telas raiz das abas** (Início, Treinos, Plus, Perfil; Alunos, Treinos, Plus, Academia, Perfil), nas duas plataformas.

**No iPhone**:
- O título grande **acompanha a rolagem**: ele rola junto com o conteúdo até sumir e, nesse momento, o título pequeno aparece centralizado na barra, com a sombra `sombra.1` (o "título grande" do iOS). No Android o título grande encolhe para o pequeno à esquerda, como já descrito. O tamanho e a fonte são os do Academia Plus nos dois (`titulo1` e `titulo2`), não os do sistema.
- Tela empilhada: o **voltar** é a seta do iOS (chevron) seguida do título da tela anterior, quando ele cabe ("‹ Alunos"); se não cabe, só a seta. O alvo continua 48 × 48 no mínimo.
- O título da tela empilhada fica **centralizado** (padrão do iOS); no Android, à esquerda.
- O cabeçalho começa **abaixo** da Dynamic Island ou do notch (área segura do topo: 59 no iPhone 16, 62 no 16 Pro Max, 50 no 13 mini, 20 no SE); o fundo dele sobe até a borda da tela, por trás da barra de status.
- Menu de ações (⋯, regra 1): no iPhone abre o **menu nativo do iOS** (o menu que brota do botão, com ícone à direita de cada item, item destrutivo em vermelho no fim) ou, para escolha que precisa de confirmação, a **folha de ações** do iOS. No Android, o menu suspenso do Material. As opções e os textos são os mesmos; o desenho é o do sistema.

**Tamanhos**: 56 (ou 96 grande); botões 48; título com reticências em 1 linha (2 linhas na variante grande).

**Estados**: raiz (sem voltar) · empilhado (com voltar) · com ação · rolado (sombra `sombra.1` aparece sob o cabeçalho) · carregando (título esqueleto 120 × 22).

**Regras**:
1. No máximo **uma** ação à direita. Duas vão para o menu (⋯).
2. Voltar sempre existe nas telas empilhadas, mesmo com gesto do sistema. No iPhone, **deslizar da borda esquerda** volta em qualquer tela empilhada e nunca é bloqueado; no treino em andamento o gesto continua ligado, mas é interceptado: em vez de sair, aparece a **folha de ações do iOS** com "Continuar treinando" (padrão), "Sair e continuar depois" e "Descartar treino" (vermelho, pede confirmação). Nada se perde ao sair: o treino é gravado a cada série (`03-NAVEGACAO-E-LAYOUT.md` e `03-arquitetura/04-IPHONE.md`, seção 4).
3. O título é o nome da coisa ("Treino A"), não o verbo ("Ver treino").

---

## 14. Folha inferior (bottom sheet)

**Para que serve**: ação curta sem sair da tela: confirmar, escolher opção, ajustar um valor, ver detalhe rápido, convite ao Plus.

**Anatomia**: sobreposição `sobreposicao` na tela toda · painel ancorado na base, fundo `superficieElevada`, cantos superiores `raio.folha` (24), `sombra.3` · alça de 32 × 4 px `borda` centralizada a 8 px do topo · título `titulo2` com padding 24 em cima, 16 nos lados · conteúdo · rodapé com botões (padrão 56) em coluna: primário embaixo, secundário em cima, 12 entre eles · padding inferior 16 + inset da área segura.

**Tamanhos**: largura total; altura do conteúdo até **90 %** da tela (depois rola por dentro); mínimo 160. Em tablet (v2): largura máxima 600 centralizada.

**Alturas (detentes)** (`tokens.json › folha`): folha curta (confirmação, convite) usa a **altura do conteúdo**. Folha com lista ou conteúdo longo tem duas alturas: **média** (metade da tela) e **grande** (a tela inteira menos a área segura do topo e 8 de respiro). Ela abre na média; arrastar pela alça leva à grande; arrastar para baixo da média fecha. A **alça** aparece sempre que a folha pode mudar de altura ou ser arrastada para fechar.

**No iPhone**: a folha é a **folha nativa do iOS** (em `react-navigation`, `presentation: 'formSheet'` com as alturas média e grande; ver `03-arquitetura/04-IPHONE.md`). A alça é a do sistema (36 × 5) e, na altura grande, a tela de trás encolhe e escurece, como em todo app de iPhone. Cor, raio de 24, título, botões e padding são os nossos. No Android, a folha é a nossa, com a alça de 32 × 4.

**Variantes**:
- **confirmação**: título em forma de pergunta ("Concluir o treino com 2 séries por fazer?"), texto `corpo` opcional, botão primário (ou perigo) + "Cancelar" secundário.
- **lista de opções**: linhas de 56 px com check na escolhida; fecha ao escolher.
- **ajuste**: um campo +/− variante edição + botão "Pronto".
- **convite ao Plus**: selo contorno, título, 3 linhas do que libera (ícone + texto), botão grande "Assinar o Plus" e "Agora não". Texto vem da marca (`01-TOM-DE-VOZ.md`). **[decidir]** quem paga: se for pela academia, o botão vira "Falar com a academia".

**Estados**: fechada · abrindo (`duracao.media`, sobe de baixo) · aberta · arrastando (segue o dedo; soltar abaixo de 50 % fecha) · fechando · carregando (conteúdo esqueleto, botões desabilitados).

**Regras**:
1. Fecha por: botão "Cancelar", toque na sobreposição, arrastar para baixo, voltar do sistema. **Todos** funcionam sempre.
2. Foco vai para o título ao abrir e volta ao botão de origem ao fechar.
3. Não empilha folha sobre folha. Se precisa, a segunda substitui a primeira.
4. Folha de confirmação destrutiva: o botão perigo **não** fica em posição de "toque automático" (nunca onde o dedo já estava); por isso o primário fica embaixo e o Cancelar em cima.

---

## 15. Estado vazio

**Para que serve**: quando não há conteúdo: sem treino, sem alunos, sem dieta (sem Plus ou sem plano montado), sem resultado de busca, erro de rede.

**Anatomia**: centrado vertical e horizontal na área útil: ícone 32 ou ilustração até 120 px (a marca define) · título `titulo3` · texto `corpoPequeno` `textoSecundario` (até 2 linhas) · botão primário padrão intrínseco (ou secundário) · tudo com 16 entre si, largura máxima 280.

**Variantes**:
- **primeiro uso**: "Nenhum treino ainda" + "Montar treino livre" / "Ver treinos prontos" (dois botões em coluna).
- **sem Plus** (aba Plus do aluno, e onde um recurso do Plus aparecer): selo contorno + "Dieta com acompanhamento é do Plus" + o que libera + botão "Conhecer o Plus" (abre folha de convite). Texto exato: marca.
- **sem plano** (tem Plus, personal não montou): "Seu personal ainda não montou a dieta" + "Falar com o personal".
- **busca sem resultado**: "Nenhum aluno com 'xyz'" + "Limpar busca".
- **erro**: ícone `erro`, "Não deu para carregar" + "Tentar de novo". Sem código de erro na tela.
- **sem conexão**: "Sem internet. O que você marcar fica salvo e sobe depois." Sem botão (o app tenta sozinho).

**Estados**: não é interativo além do botão. Tem variante **compacta** (dentro de um cartão: ícone 24, título `corpoForte`, 1 linha, sem botão) para seção vazia numa tela cheia.

**Regras**:
1. Nunca tela em branco: toda lista tem estado vazio definido.
2. Texto diz o que fazer, não o que faltou. "Montar treino" > "Lista vazia".
3. Sem dados corporais **não** é estado vazio no perfil do aluno: é "Não informado" no lugar do número.

---

## 16. Toast

**Para que serve**: confirmar algo que acabou de acontecer, com desfazer quando cabe: série marcada, treino salvo, exercício removido, sem conexão.

**Anatomia**: pílula/retângulo de raio 12, fundo `superficieElevada` (claro: `texto` com `fundo` como texto — invertido; escuro: `superficieElevada` com `texto`), `sombra.2` · ícone 24 opcional à esquerda · texto `corpoPequeno` 1–2 linhas · botão texto "Desfazer" 48 de altura à direita, em `marca` (invertido no claro: `fundo`).

**Posição**: acima da barra de abas (e acima da faixa do cronômetro, se houver), margem 16 nas laterais e 16 da barra. **Na tela de treino** (P09) o aviso da série fica **dentro da base**, acima da faixa do descanso, e empurra a lista em vez de cobrir a série seguinte. Entra de baixo em `duracao.media`; sai para baixo.

**Tamanhos**: altura mínima 48; largura total menos margens; máximo 2 linhas.

**Estados**: entrando · visível (`duracao.toast` 5 s; **pausa** enquanto tem foco ou dedo) · saindo · com ação (Desfazer) · tipo: neutro · sucesso (ícone `sucesso`) · erro (ícone `erro`, dura 8 s, pode ter "Tentar de novo").

**Regras**:
1. Um toast por vez; o novo substitui o anterior (sem fila).
2. "Desfazer" **sempre** para ação de marcar/remover; nenhuma dessas ações pede confirmação antes.
3. Deslizar o toast para baixo descarta.
4. Toast nunca é a única notícia de erro grave; erro de salvar também marca o cartão.
5. Um toast nunca fica atrás do indicador de início do iPhone nem da barra de gestos do Android: a posição é medida a partir do topo da barra de abas, que já termina acima da área segura.

---

## 17. Auxiliares

Pequenos componentes usados dentro dos outros. Mesmas regras de estado padrão.

| Componente | Anatomia | Tamanhos | Estados | Regras |
|---|---|---|---|---|
| **Chip** (filtro/seleção) | pílula, rótulo `corpoPequeno` 500, ícone 16 opcional, check 16 quando selecionado | altura **48** (tocável) ou **24** (informativo, não tocável); padding 16/8; 8 entre chips | normal · selecionado (`marca` fundo, `marcaTexto`) · desabilitado | o de 24 nunca é tocável; o de 48 sempre |
| **Avatar** | círculo com iniciais `legenda` bold sobre `borda`, ou foto | 32 (compacta) · 40 (lista) · 64 (perfil) | — | iniciais: até 2 letras; cor fixa, não aleatória |
| **Divisor** | linha 1 px `borda` | largura total ou a partir do texto (recuado 16 + avatar) | — | não depois do último item |
| **Cartão de número** | rótulo `legenda` `textoSecundario` em cima, número `numeroMedio` (28) tabular, unidade `legenda` ao lado | 1/3 ou 1/2 da coluna; altura 80; padding 12; raio 12; `superficie` | normal · sem dado ("—" e "Não informado") · tocável (abre edição: contorno ao pressionar) | número e unidade separados (número grande, unidade pequena) |
| **Esqueleto** | blocos `borda` a 60 % com raio do conteúdo que imitam; uma faixa de brilho atravessa em 1400 ms, **no máximo 3 vezes**, e para (sem brilho com movimento reduzido) | igual ao componente que imita | — | só aparece depois de 300 ms; some em `duracao.media` quando o conteúdo chega (esmaecimento cruzado) |
| **Interruptor** (liga/desliga) | o interruptor **nativo** de cada plataforma (`Switch` do React Native): no iPhone, o desenho do iOS; no Android, o do Material | o desenho é o do sistema; a linha inteira (56) é o alvo, com o rótulo `corpo` à esquerda e o interruptor à direita | ligado (trilho `marca`) · desligado (trilho do sistema) · desabilitado | usado em Perfil (avisos, vibração, "Iniciar descanso ao marcar série"); a cor "ligado" é `marca` nas duas plataformas |
| **Puxar para atualizar** | o indicador **nativo** (`RefreshControl`): no iPhone, a roda que aparece ao puxar a lista para baixo; no Android, o círculo do Material | do sistema | puxando · atualizando · fim | em toda lista que vem do servidor (alunos, treinos prontos, histórico, dieta); nunca na tela de treino em andamento (lá o puxar rolaria a lista sem querer). Nunca é o único jeito de atualizar: a lista também se atualiza sozinha ao voltar para a tela |
| **Indicador de progresso** | barra 4 px (raio redondo) ou anel; trilho `borda`, progresso `marca` ou `sucesso` | barra: largura do pai; anel: 160/144 (cronômetro), 24 (carregando) | — | acompanha o `prefers-reduced-motion` |
| **Régua de atual** | barra vertical 4 px `marca` colada na borda esquerda do cartão/linha, raio 2 | altura do pai | — | só um "atual" por lista |

---

## 19. Foto com texto

*Acrescentado em 10/10/2026 (agente N, P09, tokens 1.6.0), a partir das referências do Alex (`02-design/referencias/`).*

**Para que serve**: a foto grande e escura com o texto por cima: o exercício atual (com o número de repetições enorme, como o "15" da ref 05), a capa do treino pronto em destaque e na grade, o convite ao Plus, a capa do cronômetro. Sem foto (perfil do aluno, resumo da dieta), o mesmo bloco vira a **ilha escura** com a luz lateral: a mesma linguagem, sem imagem de corpo.

**Anatomia**: contêiner com raio `raio.capa` (28; no herói de borda a borda, só embaixo) e fundo `foto.fundoSemFoto` · **imagem** cobrindo tudo, com o filtro `foto.escurecer` 0,72 e `foto.saturacao` 0,9 · **degradê** por cima (`foto.gradiente` no herói; `foto.gradienteCapa` + `foto.luzLateral` nas capas) · **conteúdo** no pé, em `foto.texto` (branco) e `foto.textoSecundario`: pílulas de vidro (componente 20), número gigante (`numeroGigante`, 112, Archivo 800), título (`titulo1` ou `titulo2`), linha de apoio (`corpoPequeno`). Botões de voltar e menu ficam no topo, em vidro.

**Tamanhos**: herói 340 (`imagem.heroi`, 45 % da altura útil; era 440; 300 no cronômetro); capa em destaque 240 (`imagem.capaFoto`); capa na grade 208 (`imagem.capaGrade`); padding 20 nas laterais e embaixo, 12 na grade.

**Estados**: normal · tocável (capa de treino: afunda 0,98 e desce 1 px, como o cartão) · escolhido (contorno 2 px `viva`) · sem foto (ilha escura) · carregando (o fundo `foto.fundoSemFoto` aparece antes da imagem; o texto já está legível sobre ele).

**Regras**:
1. **A foto é igual nos dois temas.** O claro não clareia a foto: o que muda é o vidro (claro) e o resto da tela.
2. Texto pequeno (até 18 px) só na faixa de baixo do degradê (os últimos ~28 %), em branco. O número gigante e o título (texto grande, 3:1) podem subir até o meio.
3. **Contraste medido contra o pior pixel**, não contra a cor média: o `auditar.mjs` deixa o texto transparente, fotografa a moldura e compara cada pixel atrás da linha com a cor do texto (4,5:1 texto, 3:1 grande e ícone).
4. Nada de "corpo ideal": a foto é de ação e contexto, com as pessoas reais do banco (`imagens/`). O clima dramático vem do tratamento (escurecer, degradê, luz lateral), não da pessoa.
5. `alt` diz o que a foto mostra quando ela diz algo ("Homem deitado no banco ergue dois halteres"); capa decorativa ao lado do nome do treino fica com `alt=""`.
6. Nunca kcal como placar sobre a foto.

**No iPhone**: no herói de borda a borda a foto sobe por trás da barra de status (o texto do sistema fica branco: `StatusBar style="light"` nessa tela); nada do app entra no inset do topo.

---

## 20. Vidro

**Para que serve**: o painel translúcido que deixa ver a foto de trás (ref 02): pílulas de informação sobre a foto ("Série 2 de 3", "22,5 kg", "Em uso"), botões redondos de voltar e menu sobre a foto, a faixa do descanso e a barra de abas (`vidro.barra`, mais opaco).

**Anatomia**: fundo `vidro.<tema>.fundo` (escuro: preto-esverdeado a 60 %; claro: branco a 80 %) · desfoque `vidro.desfoque` 24 e saturação 1,6 do que está atrás · borda clara de 1 px (`vidro.<tema>.borda`) e um fio de luz em cima (`brilhoTopo`) · sombra curta · texto em `vidro.<tema>.texto` e `textoSecundario`; destaque em `vidro.<tema>.destaque`. Dentro do vidro os componentes de sempre (chip, série, botão) trocam sozinhos para essas cores.

**Tamanhos**: raio `raio.vidro` 24 no painel, pílula (`raio.pilula`) nas pílulas de 32 e redondo no botão de 48.

**Estados**: normal · pressionado (camada de texto a 8 %/12 %, como o botão) · **transparência reduzida** (vira `vidro.<tema>.solido`, sem desfoque).

**Regras**:
1. Vidro só **sobre foto** (ou sobre conteúdo que rola, na barra). Vidro sobre fundo liso é só uma cor mais fraca: use o cartão.
2. **Camada de contraste**: a foto atrás do painel ganha `vidro.<tema>.camadaContraste` (degradê escuro no escuro, claro no claro) quando a foto for clara demais naquele ponto.
3. Texto sobre vidro é medido contra o pior pixel, como na foto (componente 19).
4. Com "Reduzir transparência" (iOS: Acessibilidade › Tela e Tamanho do Texto; Android: a preferência do fabricante, quando houver; navegador: `prefers-reduced-transparency`), o vidro vira a cor sólida. O desenho não muda de lugar nem de tamanho.
5. Nunca empilhar vidro sobre vidro.
6. **Variante "vidro escuro"** (`vidro.escuroFixo`, classe `.vidro--escuro`; era o `.p-vidro--escuro` do agente P): o vidro escuro nos **dois temas**, para painel e botão sobre foto que é escura em qualquer tema (modo treino em tela cheia, capa com foto). Os valores são os de `vidro.escuro`; com transparência reduzida vira `solido` (#1B2423). Não usar sobre fundo claro: lá vale o vidro do tema.

**No iPhone**: `BlurView` do `expo-blur` (com `intensity` perto de `desfoque × 2,5`) e a cor `fundo` por cima; `AccessibilityInfo.isReduceTransparencyEnabled()` decide se o `BlurView` dá lugar a uma `View` com `solido`. **No Android**: o `BlurView` do `expo-blur` só desfoca a partir do Android 12 e pede `experimentalBlurMethod`; abaixo disso, usar direto o `solido` com 92 % de opacidade.

---

## 21. Deslizar para começar

**Para que serve**: começar o treino escolhido sem toque sem querer no bolso ou na bancada (refs 01 e 02). Aparece embaixo do treino em destaque e na tela "Ver treino pronto".

**Anatomia**: trilho em pílula de 56 (`deslizar.altura`; era 64) com contorno 2 px `progresso` (fundo `superficie`; sobre foto ou vidro, transparente) · botão redondo de 48 (`deslizar.botao`; era 56) em `viva` com a seta em `vivaTexto` e `sombra.viva` · rótulo "Deslize para começar" `corpoForte` no centro · três setas à direita, em degradê de opacidade.

**Estados**: parado · arrastando (o botão segue o dedo, sem mola) · solto antes de 85 % (`deslizar.limiar`: volta na `mola.toque`) · feito (botão em `sucesso`, rótulo "Treino começou") · movimento reduzido (o botão não desliza: esmaece e a ação acontece).

**Regras**:
1. **Tocar no botão também começa**, e Enter ou espaço no teclado (WCAG 2.5.1: nenhum gesto é o único caminho). O leitor de tela lê "Começar o Treino A, botão".
2. O treino começa quando o dedo solta depois do limiar, não no meio do arrasto.
3. Um por tela.

---

## Ilustração de exercício (junção do P09)

**Para que serve**: no lugar da foto pequena de 48–64 px na lista de exercícios e na linha do treino, que ficava escura e confusa. Desenhos do agente R em `02-design/icones/exercicios/` (sprite `ex-*`).

**Anatomia**: ladrilho `ilustracao.<tema>.fundo` com raio `ilustracao.raio` 12 · figura em traço 3 na cor `ilustracao.<tema>.traco` (= texto) · aparelho esmaecido · o músculo trabalhado em traço 4,5 na cor `ilustracao.<tema>.destaque` (`marca` no claro, 4,77:1 sobre o ladrilho; `viva` no escuro, 9,81:1). No CSS: `.mini--ilustracao` e `.exercicio__imagem--ilustracao`, com `<svg class="ilustracao-exercicio"><use href="#ex-..."/></svg>`.

**Regras**: o nome do exercício vai **sempre** em texto ao lado (a cor nunca é a única informação; no escuro, figura e músculo são os dois claros). `alt` vazio / `aria-hidden`, porque o nome já está escrito. Foto grande continua sendo foto (herói, capa); a ilustração é só para 48–64. Exercício sem ilustração cai no ícone `barra` sobre o mesmo ladrilho.

---

## Anel de progresso por exercício

(Auxiliar do componente 5, ref 01.) Anel de 44 com traço 4 (`anel.exercicio`, `anel.traco`): trilho `trilho`, progresso `progresso` (claro: `marca`; escuro: `viva`; sobre foto: `viva`), número de séries feitas no centro em `corpoPequeno` 700. Exercício completo: anel `sucesso`. Na lista de exercícios do treino em andamento, à direita de cada linha; o atual tem o contorno `sombra.atual`. Variante de 72 (`anel.treino`) no resumo da dieta. O rótulo acessível diz "1 de 3 séries feitas".

---

## O que a marca preenche aqui

- Ícone do selo Plus e o conjunto de ícones das abas e dos botões.
- Ilustração dos estados vazios (ou a decisão de ficar só com ícone).
- Os textos de convite ao Plus, parabéns ao concluir treino e estados vazios (tom de voz).
- Se o botão primário tem raio 12 ou outro valor — o sistema sugere 12; a marca pode pedir mudança **por token** (`raio.medio`), nunca por componente.

## Pendências [decidir] que tocam componentes

| Pendência | Componente afetado | O que muda |
|---|---|---|
| Chat próprio vs. WhatsApp | Barra de abas (5 → 4), Estado vazio "Falar com o personal" | só o destino do botão e o número de abas |
| Texto livre vs. banco de alimentos | Lista de refeição | aparece kcal nos itens e cartão de número do total |
| Quem paga o Plus | Folha de convite ao Plus | rótulo do botão principal |
| Marca própria vs. white-label | nenhum componente | só os tokens `marca`/`marcaTexto` e o logo no cabeçalho |
