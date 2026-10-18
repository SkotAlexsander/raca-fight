# 06 — iPhone

O que este arquivo é: o que o design do Academia Plus faz no iPhone. Diz o que fica igual nas duas plataformas, o que segue o iOS e como cada convenção do iOS entra nos componentes. A parte técnica (configuração, permissões, App Store, código) está em `03-arquitetura/04-IPHONE.md`. Os dois arquivos dizem a mesma regra.

**Regra: a identidade é do Academia Plus; o comportamento é do sistema.** Quem abre o app no iPhone reconhece a marca, as cores, os números grandes e as abas do Academia Plus. Para voltar, escolher uma data, abrir um menu ou atualizar uma lista, faz o mesmo gesto que faz em qualquer app de iPhone.

## 1. Aparelhos de referência

| Aparelho | Tela (pt) | Área segura topo / base | Topo | Base |
|---|---|---|---|---|
| iPhone SE (3ª geração) | 375 × 667 | 20 / 0 (o app usa 16) | barra de status | botão Início, fora da tela |
| iPhone 13 mini | 375 × 812 | 50 / 34 | notch | indicador de início |
| iPhone 16 | 393 × 852 | 59 / 34 | Dynamic Island | indicador de início |
| iPhone 16 Pro Max | 440 × 956 | 62 / 34 | Dynamic Island | indicador de início |

Os valores estão em `tokens.json › layout.aparelhos`. O SE e o 13 mini caem na faixa **pequeno** (< 390), o 16 na **média** e o 16 Pro Max na **grande**, com margem 20 (`03-NAVEGACAO-E-LAYOUT.md`). O topo do 16 Pro Max é **62**, não 59 como no iPhone 16: a Dynamic Island dos Pro de 2024 desceu (fonte: useyourloaf.com, "iPhone 16 Screen Sizes", conferido em 10/10/2026).

O mockup (`mockups/index.html`) tem um **seletor de aparelho** no topo: iPhone SE · iPhone 16 · iPhone 16 Pro Max · Android 390. O 13 mini entra pela URL (`?aparelho=iphone-13-mini`). O seletor troca a moldura e as áreas seguras das 4 telas. Cada iPhone ganha:

- a barra de status do iOS (hora à esquerda; sinal, Wi-Fi e bateria à direita; no SE a hora fica no centro);
- a Dynamic Island ou o notch;
- o indicador de início a 8 da borda.

O app por dentro não muda. O cabeçalho começa abaixo da Dynamic Island, e a barra de abas termina acima do indicador.

## 2. Igual nas duas plataformas × segue a plataforma

| Igual nas duas (identidade do Academia Plus) | Segue a plataforma (comportamento do sistema) |
|---|---|
| Marca, logo, cores (os 10 papéis e os derivados), tema claro e escuro | Barra de status, Dynamic Island, notch, indicador de início: o app só respeita a área segura |
| Fontes da marca e a escala tipográfica inteira (tamanhos, linhas, pesos) | Como a fonte é carregada: no iPhone cada peso é chamado pelo nome do arquivo (`tipografia.familiaPorPeso`) |
| Tamanhos de toque: 48, 56 e 64 | Voltar: deslizar da borda esquerda (iOS) · gesto ou botão voltar (Android) |
| **Abas embaixo**, com 64 de altura, os mesmos ícones e rótulos, 4 ou 5 abas | Título grande da raiz da aba: no iOS rola junto e o título pequeno aparece centralizado; no Android encolhe à esquerda |
| Componentes, estados, raios, sombras, espaços (escala de 4) | Folha inferior: nativa do iOS com alturas média e grande e alça do sistema · a nossa no Android |
| Textos, tom de voz, rótulos de botão | Menu de ações (⋯): menu nativo do iOS ou folha de ações · menu suspenso do Material |
| Número grande de carga e cronômetro, com os mesmos tetos de ampliação | Seletores de data e hora: os nativos de cada sistema |
| Fonte do sistema respeitada, com as mesmas faixas (130 %, 160 %) | Interruptor: o nativo de cada sistema, com a cor `marca` quando ligado |
| Cartão "atual", selo Plus, cor `plus` | Puxar para atualizar: o indicador nativo |
| Quando vibra (marcar série, concluir treino, fim do descanso) | Como vibra: motor do iPhone (`expo-haptics`); a vibração longa do Android vira o padrão de notificação no iPhone |
| Toast com "Desfazer" (não existe toast no iOS; é nosso nas duas) | Teclado: no iPhone o numérico ganha a barra "Próximo / OK" |
| Navegação: as mesmas abas e a mesma pilha de telas, até 3 telas acima da aba | Permissões e avisos: os textos do iOS (provisória para notificação) |

O que **não** copiamos do iOS, e por quê:

- **Barra de abas de 49 com fundo translúcido**: a nossa tem 64 e fundo `superficie`. O alvo de toque e o contraste são princípios do app (1 e 4), não da plataforma.
- **Fonte do sistema (SF Pro)**: a fonte é da marca nas duas.
- **Cor de destaque azul do iOS** em botão e link: o destaque é `marca`.
- **Toast**: o iOS não tem. O nosso continua, porque o "Desfazer" é a regra 6 dos princípios.

## 3. As convenções, uma a uma

### Título grande que encolhe ao rolar

Nas **telas raiz das abas**: Início, Treinos, Plus e Perfil no aluno; Alunos, Treinos, Plus, Academia e Perfil na academia. O cabeçalho grande (96, `titulo1`) aparece antes de rolar. No iPhone o título rola junto com o conteúdo; quando sai da vista, o título pequeno (`titulo2`) aparece centralizado na barra de 56, com a `sombra.1` embaixo. A fonte e o tamanho são os nossos, não os do iOS. Telas empilhadas usam sempre o cabeçalho de 56. Detalhe no componente 13.

### Voltar deslizando da borda

Em toda tela empilhada, deslizar da borda esquerda volta. **O gesto nunca é desligado.** Onde sair tem consequência, ele é interceptado e pergunta na folha de ações do iOS:

- **Treino em andamento**: "Continuar treinando" (padrão), "Sair e continuar depois" e "Descartar treino" (vermelho, pede confirmação). O treino é gravado a cada série, então sair não perde nada.
- **Edição não salva**: "Descartar alterações?".

O botão voltar do cabeçalho continua existindo. No iPhone é a seta do iOS com o título da tela anterior ("‹ Alunos"), ou só a seta quando o título não cabe. O alvo continua 48.

### Folha inferior com alturas média e grande, e com a alça

- **Folha curta** (confirmação, convite ao Plus, ajuste de um valor): tem a altura do conteúdo.
- **Folha com lista** (escolher objetivo, trocar exercício) tem duas alturas (`tokens.json › folha`):
  - **média**: metade da tela; é onde ela abre;
  - **grande**: a tela inteira menos a área segura do topo e 8 de respiro.
- Arrastar pela alça vai da média para a grande; arrastar para baixo da média fecha.
- No iPhone é a folha nativa (`formSheet`). A alça é a do sistema, e na altura grande a tela de trás encolhe e escurece. Cor, raio de 24, título, botões e o padding de baixo (16 + área segura) são os nossos.
- A alça aparece sempre que a folha pode mudar de altura ou ser arrastada para fechar.

### Menu de ações do iOS no lugar do menu do Android

O botão ⋯ do cabeçalho e do cartão de exercício abre, no iPhone, o **menu nativo** que brota do botão:

- cada item tem o ícone à direita;
- o item destrutivo ("Remover exercício") fica em vermelho e por último.

Quando a escolha pede confirmação ou é uma pergunta ("Sair do treino?"), o iPhone usa a **folha de ações** do iOS, que sobe de baixo com "Cancelar" separado. As opções e os textos são os mesmos do Android; o desenho é o do sistema.

### Seletores de data e hora nativos

A data de nascimento, a data de uma avaliação e o horário de uma refeição usam o seletor do sistema: no iPhone, o calendário compacto ou as rodas do iOS. A escolha entre **opções** (objetivo, nível) continua na nossa folha com linhas de 56, que mostra o selo Plus (componente 4, regra 1).

### Interruptor no padrão iOS

O liga/desliga é o interruptor nativo de cada sistema (`Switch`), com o trilho `marca` quando ligado. A linha inteira de 56 é o alvo, com o rótulo à esquerda e o interruptor à direita. Aparece em Perfil: avisos, vibração e "Iniciar descanso ao marcar série".

### Vibração

| Momento | Token | iPhone | Android |
|---|---|---|---|
| Marcar série | `marcarSerie` | impacto **leve** | igual ("igual" = o mesmo momento e a mesma força, traduzidos pelo `expo-haptics`) |
| Desfazer série | `desfazerSerie` | seleção (mais fraca) | igual |
| Concluir treino | `concluirTreino` | impacto **médio** | igual |
| Últimos 3, 2, 1 s do descanso (e de cada fase do intervalado) | `ultimosSegundosDescanso` | impacto leve | igual |
| Troca de fase do intervalado, app aberto | `trocaDeFase` | impacto **médio** | igual |
| Troca de fase do intervalado, app fechado | — | a notificação local de cada fase (até 24 agendadas) | igual |
| Fim do descanso, app aberto | `fimDescanso` | **padrão de notificação de sucesso** (dois toques curtos) | vibração longa |
| Fim do descanso, app fechado | — | a notificação local, com o som e a vibração do iOS | a notificação, com a vibração do canal |
| Erro ao salvar | `erroAoSalvar` | padrão de notificação de erro | o equivalente que o `expo-haptics` escolhe |

O iPhone não faz vibração longa por API pública e ignora a vibração com o Modo de Pouca Energia ou a vibração do sistema desligada. Por isso **nenhum aviso depende só da vibração**: a tela sempre muda junto, com o anel `sucesso` e o texto "Descanso terminado". Tudo desliga em Perfil.

### Puxar para atualizar

Toda lista que vem do servidor tem o "puxar para atualizar" com o indicador nativo: alunos, treinos prontos, histórico e dieta. A tela de treino em andamento **não** tem, porque lá o gesto de puxar ia brigar com a rolagem entre séries. Puxar nunca é o único jeito: a lista também se atualiza ao voltar para a tela.

### Teclado numérico com "Próximo" e "OK"

O teclado numérico do iOS não tem tecla de ação. O campo numérico (componente 3) ganha uma barra de 48 colada em cima do teclado:

- **"Próximo"** à esquerda, que vai para o próximo campo;
- **"OK"** à direita, em peso 700, que confirma e fecha o teclado.

A barra só aparece no iPhone e tem amostra no mockup. Todo campo continua com fonte de 16 ou mais, para o iOS não dar zoom ao focar.

### Texto Dinâmico (fonte do sistema ampliada)

O app respeita o tamanho de texto do iOS do mesmo jeito que respeita o do Android: as faixas de 130 % e 160 %, os tetos (cronômetro até 72, carga até 1,5 ×, rótulo da aba até 1,3 ×) e o rótulo da aba que some acima de 160 %. As faixas estão em `03-NAVEGACAO-E-LAYOUT.md`. No iOS, os tamanhos de acessibilidade (os 5 maiores) passam de 160 %: valem as regras de "acima de 160 %". A barra de status não cresce, porque é do sistema.

## 4. Como conferir

```
node "02-design/sistema-de-design/auditoria/auditar.mjs"
```

O script abre o mockup em cada um dos 4 iPhones:

- na janela do tamanho do aparelho, e também a 1440 × 900 e a 2040 × 790;
- nos dois temas;
- com a fonte a 100 % e a 160 %.

Além das medidas de antes (`docs/revisao/C-RESPONSIVIDADE.md`), ele confere a área segura:

- nenhum texto, ícone ou alvo de toque do app dentro do inset do topo ou da base;
- nada embaixo da Dynamic Island, do notch ou do indicador de início;
- o cabeçalho começa abaixo do recorte, e a barra de abas termina acima do indicador;
- a hora e a bateria não cruzam o recorte;
- cada aparelho tem o desenho certo: o SE tem botão Início e não tem indicador nem recorte.

Os insets vêm do `tokens.json`, não do CSS. Assim um CSS que se afaste do token é pego. O resultado está em `docs/revisao/F-IPHONE-DESIGN.md`.
