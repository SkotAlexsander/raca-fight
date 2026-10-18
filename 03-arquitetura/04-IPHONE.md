# 04 — iPhone: o que muda e como o código trata

O app é Expo (React Native): o mesmo código roda no Android e no iPhone. Este arquivo junta **o que é próprio do iPhone**: a configuração do `app.json`, o que o código faz de diferente (área segura, teclado, gesto de voltar, vibração, notificação, fontes, modo escuro), o que fica para a v2 (Live Activity, Apple Saúde) e **as regras da App Store**, com o checklist antes de mandar para a revisão. O lado visual (tamanhos de tela, moldura, convenções de componente) está em `02-design/sistema-de-design/06-IPHONE.md`, do time de design.

Regra que vale para tudo aqui: **a identidade é do Academia Plus; o comportamento é do sistema.** Botão, cor e tom são os mesmos nas duas plataformas; gesto, teclado, menu e permissão seguem o iOS.

Escrito em 10/10/2026, conferido contra a documentação do **Expo SDK 54** e as **Diretrizes da App Store de 08/06/2026**. As fontes estão na seção 13.

---

## 1. Configuração (`app/app.json`, bloco `ios`)

| Chave | Valor | Por quê |
|---|---|---|
| `bundleIdentifier` | `com.pixelmartins.academiaplus` **[decidir]** | O antigo `com.academiaplus.app` usava um domínio que o Alex não tem. O nome do pacote é para sempre: depois do primeiro envio à loja não se troca. `pixelmartins.com` é do Alex. O `android.package` acompanha, pelo mesmo motivo. |
| `buildNumber` | `"1"` | Ponto de partida. Depois do primeiro build, quem sobe o número é o EAS (`appVersionSource: "remote"` + `autoIncrement` no `eas.json`). A versão que o usuário vê é `expo.version` (`0.1.0`). |
| `supportsTablet` | `false` | A v1 é desenhada só para telefone (sistema de design). No iPad o app abre em modo de compatibilidade, em tamanho de iPhone. O padrão do Expo já é `false`; está escrito para não restar dúvida. |
| `usesAppleSignIn` | `true` | Liga a capacidade "Sign in with Apple" no build (seção 10.1). O EAS sincroniza a capacidade com a conta Apple. |
| `config.usesNonExemptEncryption` | `false` | O app só usa a criptografia do sistema (HTTPS, Keychain): isento de documentação de exportação. Sem isso, cada build no TestFlight para e pergunta. Substitui o `ITSAppUsesNonExemptEncryption` que estava solto no `infoPlist`: é a mesma chave, escrita pelo caminho que o Expo documenta. |
| `infoPlist.NSCameraUsageDescription` | "O Academia Plus usa a câmera só quando você toca para tirar a sua foto de perfil ou a foto de um aparelho da academia." | Foto de perfil e foto do aparelho (V3 da revisão B). A Apple recusa texto genérico (5.1.1(ii): "descreva de forma clara e completa"). |
| `infoPlist.NSPhotoLibraryUsageDescription` | "O Academia Plus abre as suas fotos só quando você escolhe uma imagem para o perfil ou para um aparelho da academia." | Mesma coisa. O seletor de fotos do iOS (fora do processo do app) nem pede permissão para escolher imagem; o texto fica para o caso de o iOS pedir. |
| `infoPlist.CFBundleDevelopmentRegion` / `CFBundleAllowMixedLocalizations` | `pt-BR` / `true` | O app é em português; os botões dos alertas do sistema seguem o idioma do aparelho. |
| Microfone | **não pedido** (`expo-image-picker` com `microphonePermission: false`) | O seletor pede microfone por padrão (para vídeo). O app não grava vídeo; pedir seria acesso desnecessário (5.1.1(iii)). |
| Notificações | sem texto no `Info.plist` | O iOS não usa texto próprio para notificação; o pedido é feito em código (seção 6). |
| `UIBackgroundModes` | **nenhum** | O cronômetro de descanso com o app fechado é uma **notificação local agendada** (seção 6), que não precisa de modo de segundo plano. Áudio em segundo plano seria uso fora do propósito (2.5.4) e recusa provável. O plugin `expo-notifications` está com `enableBackgroundRemoteNotifications: false` para não acrescentar `remote-notification`. |
| `privacyManifests` | ver 1.1 | Exigido pela Apple desde 01/05/2024 para todo envio. |

### 1.1 Manifesto de privacidade

**APIs de motivo obrigatório** (o código do app e das bibliotecas as usa; a Apple pede o motivo):

| API | Motivo | Quem usa |
|---|---|---|
| UserDefaults | `CA92.1` — ler e gravar informação acessível só ao próprio app | React Native, AsyncStorage, preferências (último papel escolhido) |
| Horário de arquivos (FileTimestamp) | `C617.1` — metadados de arquivos dentro do contêiner do app | `expo-sqlite`, `expo-file-system`, cache de imagens |
| Tempo desde a inicialização (SystemBootTime) | `35F9.1` — medir tempo entre eventos dentro do app e cronômetros | React Native (medição de tempo) e o cronômetro de descanso |
| Espaço em disco (DiskSpace) | `E174.1` — conferir se há espaço para gravar arquivos | cache local e fila offline |

As bibliotecas do Expo trazem o próprio `PrivacyInfo.xcprivacy`, mas a documentação do Expo avisa que a Apple nem sempre lê os das dependências estáticas do CocoaPods; por isso os motivos estão repetidos no `app.json`. Se a Apple mandar e-mail pedindo outro motivo depois de um envio, ele entra aqui.

**Tipos de dado coletados** (todos **ligados à pessoa**, **sem rastreamento**, finalidade **funcionamento do app**): nome, e-mail, telefone, saúde (peso, altura, medições, restrições, dieta), condicionamento físico (treinos realizados), fotos (perfil, aparelho), outro conteúdo do usuário (observações, refeições marcadas, conversa se for chat próprio **[decidir]**), id do usuário. `NSPrivacyTracking: false` e nenhum domínio de rastreamento. **Quando entrar o Sentry** (antes de publicar, `00-STACK.md`), acrescentar "dados de falha" (`CrashData`); o SDK dele traz manifesto próprio.

### 1.2 Outras chaves que mudaram

- `android.package` → `com.pixelmartins.academiaplus` **[decidir]** (mesmo motivo do iOS) e `android.versionCode: 1`.
- Plugins novos: `expo-apple-authentication`, `expo-image-picker` (sem microfone), `expo-font` (fontes da marca embutidas, seção 7).
- Dependências novas no `package.json`, nas versões do SDK 54 (`bundledNativeModules.json` do Expo): `expo-haptics ~15.0.8`, `expo-font ~14.0.12`, `expo-image-picker ~17.0.11`, `expo-apple-authentication ~8.0.8`, `expo-system-ui ~6.0.9` (modo escuro no Android), `expo-dev-client ~6.0.21` (build de desenvolvimento). Nada instalado ainda: `npm install` + `npx expo install --fix` alinham.
- `splash` continua no topo do `app.json`. O Expo chama esse formato de legado e recomenda o plugin `expo-splash-screen`; trocar quando a arte da abertura chegar (aí já entra a variante escura).
- `android.edgeToEdgeEnabled` está marcado como obsoleto no SDK 54 (sempre ligado; some no SDK 55). Fica por enquanto: não muda nada e não quebra.

## 2. Área segura (Dynamic Island, notch, indicador de início)

O iPhone tem pedaços da tela onde não se põe conteúdo: no topo, a barra de status, o notch ou a Dynamic Island (de 20 a 59 pontos, conforme o modelo); embaixo, o **indicador de início** (a barrinha de 34 pontos que se arrasta para sair do app). O iPhone SE não tem nenhum dos dois em cima e tem 0 embaixo.

**Como o código trata** (`react-native-safe-area-context`, já no `package.json`):

- **Nunca número fixo.** As alturas mudam por modelo e por orientação; o código lê de `useSafeAreaInsets()`. Os valores do `tokens.json` (`layout.aparelhos`) são para o mockup e para a auditoria visual, não para o app.
- O `SafeAreaProvider` fica na raiz (`navegacao/_layout.tsx`; o Expo Router já o põe, e não se põe um segundo).
- **Cabeçalho**: o do Expo Router (pilha nativa) já desce abaixo da Dynamic Island. Tela sem cabeçalho nativo usa `paddingTop: insets.top`.
- **Abas**: a barra de abas do Expo Router já soma `insets.bottom` — fica **acima** do indicador de início.
- **O que fica preso no rodapé por conta própria** e precisa somar `insets.bottom`: a **faixa do cronômetro de descanso** do Treino em andamento, o botão "Encerrar treino", folhas inferiores e qualquer botão fixo ("Salvar", "Usar este treino").
- Usar o `SafeAreaView` **da biblioteca**, com `edges` explícitos (`['top']`, `['bottom']`). O `SafeAreaView` do próprio React Native está obsoleto desde o 0.81 e só funciona no iOS.
- Fundo **vai até a borda** (cor do tema atrás da Dynamic Island e do indicador); só o **conteúdo** respeita a área segura.
- Como conferir: o agente F mede, nos 4 iPhones (SE, 13 mini, 16, 16 Pro Max), se algo cai dentro dessas áreas (`02-design/sistema-de-design/auditoria/`).

## 3. Teclado

No iOS o teclado **cobre** a tela; ele não a encolhe.

- Formulários (criar conta, séries do exercício, registrar peso, conversa) ficam dentro de `KeyboardAvoidingView` com `behavior="padding"` no iOS e `keyboardVerticalOffset` igual à altura do cabeçalho (`useHeaderHeight()`). No Android, sem `behavior` e teste no aparelho; se o campo ficar coberto (com a tela de ponta a ponta, que o SDK 54 liga sempre, o Android pode não redimensionar sozinho), usar `react-native-keyboard-controller`, que é a recomendação do guia de teclado do Expo.
- Listas com campos (as séries do treino em andamento) usam `keyboardShouldPersistTaps="handled"` (tocar em "marcar série" com o teclado aberto funciona no primeiro toque) e `automaticallyAdjustKeyboardInsets` no `ScrollView`/`FlatList` do iOS.
- **Teclado numérico do iOS não tem "OK".** `keyboardType="decimal-pad"` (carga, peso) e `number-pad` (repetições) não têm tecla de fechar nem de "próximo". Solução do iOS: uma barra em cima do teclado (`InputAccessoryView`) com "Próximo" e "OK". Sem ela, o aluno fica preso no campo de carga. No Android, o teclado numérico já tem a tecla.
- O separador decimal do teclado segue o idioma: em português, vírgula. `dominio/unidades.ts` → `lerNumero()` já aceita vírgula e ponto.
- Campos de entrada: `textContentType` (`emailAddress`, `password`, `newPassword`, `oneTimeCode`) para o iOS preencher senha e código do e-mail sozinho.

## 4. Gesto de voltar (deslizar da borda esquerda)

No iPhone, quem está numa tela empilhada volta deslizando o dedo a partir da borda esquerda. É o jeito principal de voltar no iOS: **não se bloqueia** (`gestureEnabled: false` só em último caso, e não é o caso aqui). A pilha do Expo Router (pilha nativa) já faz o gesto.

**Treino em andamento** é a exceção que pede cuidado: um deslize sem querer no meio de uma série não pode jogar o treino fora.

- O treino em andamento é gravado no SQLite a cada série (decisão offline de 10/10). Sair da tela **não perde nada**.
- A tela usa `usePreventRemove(treinoEmAndamento, ...)` (`@react-navigation/native`, que vem com o Expo Router). Quando o aluno desliza da borda, o gesto é **cancelado** e aparece a pergunta do iOS (menu de ações):
  - **Continuar treinando** (padrão)
  - **Sair e continuar depois** — volta; o Início mostra a faixa "Treino em andamento · Voltar"
  - **Descartar treino** (vermelho) — só este apaga, e pede confirmação
- O mesmo gancho trata o botão "voltar" do Android e o deslize para baixo de uma folha.
- Telas de edição com mudança não salva (Séries do exercício, Meus dados) usam o mesmo gancho com "Descartar alterações?".

## 5. Vibração (`expo-haptics`)

Dependência: `expo-haptics ~15.0.8`. Não pede permissão.

| Momento | Chamada | No iOS |
|---|---|---|
| Marcar série feita | `Haptics.impactAsync(ImpactFeedbackStyle.Light)` | toque leve |
| Descanso nos 3, 2, 1 finais | `Haptics.impactAsync(ImpactFeedbackStyle.Light)` (token `vibracao`; alinhado ao catálogo de movimento em 10/10) | toque leve |
| Fim do descanso (app aberto) | `Haptics.notificationAsync(NotificationFeedbackType.Success)` | padrão de "concluído" |
| Encerrar treino | `Haptics.impactAsync(ImpactFeedbackStyle.Medium)` | toque médio |
| Erro (série inválida, sem rede ao salvar) | `Haptics.notificationAsync(NotificationFeedbackType.Error)` | padrão de erro |

- Tudo passa por **um** ajudante (`componentes/vibrar.ts`), que respeita a chave "Vibração" do Perfil (`05-ACESSIBILIDADE.md` do design: dá para desligar).
- O "vibração longa" do fim do descanso no design vira o padrão de **notificação** no iOS: o motor de vibração do iPhone (Taptic Engine) não faz vibração longa por API pública.
- O iOS **ignora** a vibração com o Modo de Pouca Energia ligado, com a vibração do sistema desligada, com a câmera ou o ditado ativos. É esperado; a tela sempre mostra o estado também, a vibração é um extra.

## 6. Fim do descanso com o app fechado (notificação local)

O aluno marca a série, bloqueia a tela e põe o celular no bolso. O descanso precisa avisar mesmo assim.

**Como funciona** (`expo-notifications`, já no `package.json`):

1. Ao marcar a série, o app grava `fimDoDescansoEm = agora + descansoSegundos` e **agenda** uma notificação local para esse instante: `scheduleNotificationAsync({ content, trigger: { type: TIME_INTERVAL, seconds } })`. Guarda o id.
2. Pular o descanso, mudar o tempo ou marcar a próxima série → `cancelScheduledNotificationAsync(id)` e agenda de novo se for o caso.
3. Com o app aberto, a notificação **não aparece** como faixa (o `setNotificationHandler` responde `shouldShowBanner: false` para essa categoria): quem avisa é o próprio cronômetro, com vibração.
4. Quando o app volta para a frente (`AppState`), o cronômetro **recalcula** pelo `fimDoDescansoEm`. Nunca conta com `setInterval` acumulado: o iOS congela o JavaScript em segundo plano.
5. Texto: "Descanso terminado · Próxima série". Nada de dado de saúde (R6.2); o nome do exercício também não vai (tela bloqueada).

Nada disso precisa de `UIBackgroundModes`: o próprio iOS dispara a notificação agendada.

**Permissão — o que a "permissão provisória" faz e não faz.** No iOS dá para pedir a permissão **provisória** (`requestPermissionsAsync({ ios: { allowProvisional: true, ... } })`): ela não mostra pergunta nenhuma, mas a notificação chega **em silêncio**, direto na Central de Notificações, **sem faixa e sem som**. Serve para o "lembrete de treino" (ver seção 3 de `03-DECISOES-TECNICAS.md`), **não** serve para o fim do descanso, que precisa tocar. Por isso:

- **No primeiro acesso**: permissão **provisória** (sem interromper ninguém) — os lembretes começam a chegar em silêncio, com os botões do iOS "Manter" e "Desligar".
- **No primeiro descanso do primeiro treino**: uma frase do app ("Quer que o celular avise quando o descanso acabar, mesmo com a tela desligada?") e, se o aluno tocar "Quero", o pedido **completo** (alerta + som). O iOS deixa pedir o completo depois do provisório.
- **Se negar**: o cronômetro na tela e a vibração continuam com o app aberto. No Perfil → Avisos, uma linha "Avisos desligados no iPhone · Abrir ajustes" (`Linking.openSettings()`).
- **"Urgente" (`interruptionLevel: 'timeSensitive'`, que fura o modo Foco)**: exige a capacidade *Time Sensitive Notifications* na conta Apple. Fica fora da v1; entra se os alunos reclamarem que o modo Foco esconde o aviso.

## 7. Fontes da marca (`expo-font`)

Figtree (interface) e Archivo (números), livres, definidas em `02-design/marca-e-proposta/02-IDENTIDADE-VISUAL.md`.

- **Embutidas no build** pelo plugin `expo-font` do `app.json` (arquivos `.ttf` em `app/recursos/fontes/`, lista em `recursos/LEIA-ME.md`). Embutida, a fonte já existe quando a primeira tela abre: não há "piscada" com a fonte do sistema nem `useFonts()` segurando a abertura.
- **No iOS cada peso é uma família.** `fontWeight: '600'` sobre "Figtree" **não** vira o SemiBold no iPhone. O `tema/tipografia.ts` traduz cada token para o nome do arquivo: `corpoForte` → `fontFamily: 'Figtree-SemiBold'`, `numeroCarga` → `'Archivo-Bold'`, sem `fontWeight`.
- Números com `fontVariant: ['tabular-nums']` (a coluna de carga não "dança").
- **Texto Dinâmico** (o tamanho de letra que a pessoa escolhe no iPhone): `allowFontScaling` fica ligado (padrão). Rótulos de aba e o número do cronômetro levam `maxFontSizeMultiplier` (1,3 e 1,2) para não estourar; o resto cresce. O agente F mede a 160 %.
- No Expo Go (começo do desenvolvimento) o plugin não vale: lá, `useFonts()` carrega as mesmas fontes em tempo de execução. Some quando passar para o build de desenvolvimento.

## 8. Modo escuro do sistema

- `userInterfaceStyle: "automatic"` (já estava): o app segue o claro/escuro do iPhone. No Android isso exige o `expo-system-ui` (acrescentado).
- `tema/useTema()` lê `useColorScheme()` e devolve as cores claras ou escuras dos tokens; troca ao vivo quando o iPhone muda sozinho ao anoitecer.
- Barra de status: `<StatusBar style="auto" />` (`expo-status-bar`).
- Alertas, menus de ação, seletores de data e o teclado são do sistema: seguem o modo do iPhone sozinhos.
- Tela de abertura: hoje uma cor só (`#0B1313`, escura); com o plugin `expo-splash-screen` (seção 1.2) ganha a variante clara/escura.
- Escolha manual "claro / escuro / do sistema" dentro do app não está pedida; se vier, é uma sobreposição em `useTema()`.

## 9. Fica para a v2

### 9.1 Live Activity e Dynamic Island com o cronômetro

**O que é**: o descanso aparecendo na tela bloqueada e na Dynamic Island, contando, sem abrir o app.

**Por que não na v1 — o custo**:

- Exige uma **extensão de widget** escrita em **Swift/SwiftUI** (ActivityKit), um segundo alvo no projeto iOS e um "App Group" entre o app e a extensão. O React Native não desenha dentro da Dynamic Island.
- No SDK 54 só há caminho de terceiros (`@bacons/apple-targets`, Voltra, da Callstack). A biblioteca da própria Expo (`expo-widgets`) chegou com o SDK 55, ainda em fase alfa. Ou seja: **atualizar o SDK** ou depender de pacote de terceiro com Swift escrito à mão.
- Não roda no Expo Go; só em build de desenvolvimento, testado em iPhone de verdade.
- O que dá para fazer **sem servidor**: o próprio iOS conta o tempo na Live Activity (texto de cronômetro nativo), então basta iniciar e terminar. Atualizar de fora (o personal mandando algo) exigiria push do APNs com token próprio: outro servidor.
- Estimativa: **1 a 2 semanas** na primeira vez, mais manutenção a cada atualização de SDK e de iOS. Tamanho **G**.

**Na v1, no lugar**: notificação local do fim do descanso (seção 6). Entra na v2 se o teste no TestFlight mostrar que os alunos sentem falta de ver o tempo sem desbloquear.

### 9.2 Apple Saúde (HealthKit)

**O que seria**: gravar no app Saúde o treino feito (tipo, duração) e, se o aluno quiser, ler o peso que ele já registra lá.

**Por que não na v1**: precisa da capacidade HealthKit, dos textos `NSHealthShareUsageDescription`/`NSHealthUpdateUsageDescription` e de uma biblioteca de terceiro (por exemplo `@kingstinct/react-native-healthkit`, com plugin do Expo); a revisão da Apple olha com lupa (2.5.1: usar só para saúde e dizer na descrição da loja; 5.1.2(vi) e 5.1.3(i): proibido usar para marketing, anúncio ou mineração de dados; 5.1.3(ii): proibido gravar dado falso e guardar dado de saúde no iCloud).

**Ligação com a LGPD**: o peso vindo do Saúde é **dado sensível** que entraria no Academia Plus e poderia ficar visível à academia (R6.4). Só com **consentimento próprio, específico e destacado** (LGPD, art. 11, I; ver R3 da revisão B), **separado** da autorização da academia, com:

- pergunta do iOS por tipo de dado (o iPhone já faz: a pessoa escolhe item por item);
- frase do app antes, dizendo o que vai e quem vê ("O peso do app Saúde vai para o seu histórico. A academia só vê se você deixar, em Quem pode ver meus dados.");
- só **escrita** do treino no começo (sai do app para o Saúde; nada sensível entra);
- desligar no Perfil para de ler e de escrever na hora.

No Android, o equivalente é o Health Connect. Tamanho **M** para escrever o treino; **G** com leitura de peso e o consentimento.

## 10. Regras da App Store

Lidas no texto das Diretrizes de 08/06/2026. Nenhuma pendência **[decidir]** foi resolvida aqui: onde uma regra toca uma pendência, está dito o que muda em cada resposta.

### 10.1 Sign in with Apple — diretriz 4.8

**A regra (texto atual)**: app que usa login de terceiro (Google, Facebook…) para a conta principal precisa oferecer **também** outro login equivalente que (a) só colete nome e e-mail, (b) deixe a pessoa **esconder o e-mail** e (c) não use a interação para anúncio sem consentimento. O texto não nomeia o Sign in with Apple, mas ele é o login que cumpre os três por padrão.

**O que o app usa**: a especificação (H02, Criar conta, Entrar) tem e-mail/senha, **Google** e **Apple**. Com Google, a 4.8 vale; o botão da Apple já cumpre. A revisão B (R10) propõe e-mail com código + Google + Apple na v1.

**O que isso exige no código e na conta**:

- `ios.usesAppleSignIn: true` e plugin `expo-apple-authentication` (feitos). No iPhone, o botão **nativo** da Apple (`AppleAuthenticationButton`), no mesmo tamanho e destaque do Google ("opção equivalente").
- Supabase: `signInWithIdToken({ provider: 'apple', token })` com o token do iPhone. No Android não existe o nativo: usa o fluxo pela web do Supabase (`signInWithOAuth`), que exige gerar uma nova chave secreta a cada 6 meses.
- **A Apple só manda o nome no primeiro login**: gravar na hora (`updateUser`), senão a conta fica sem nome.
- **E-mail escondido**: a pessoa pode entrar com um e-mail de repasse (`…@privaterelay.appleid.com`). Consequências:
  - "Vincular aluno" por e-mail (R8.2) **não acha** essa pessoa pelo e-mail real. O vínculo por **código da academia** (R8.1) funciona igual. A tela de vincular precisa dizer isso.
  - Para o e-mail de confirmação (inclusive o de apagar conta) chegar, o domínio que envia tem de estar cadastrado no serviço de repasse da Apple (Apple Developer → Sign in with Apple for Email Communication).
- **Apagar conta**: revogar o token da Apple (seção 10.2).

### 10.2 Apagar a conta dentro do app — diretriz 5.1.1(v)

**A regra**: se o app cria conta, tem de deixar **começar a apagar a conta dentro do app**, apagando o registro e os dados pessoais (só "desativar" não basta). Pode confirmar por código no e-mail; não pode exigir telefonema, e-mail para o suporte ou chat. Se demorar, dizer quanto tempo e confirmar quando terminar. Conteúdo que a pessoa compartilhou (mensagens, fotos) também sai. Quem usa Sign in with Apple deve **revogar o token** pela API REST da Apple.

**O que a especificação já atende**:

| Exigência | Onde está | Atende? |
|---|---|---|
| Achar fácil, nas configurações da conta | Perfil → **Conta** → "Apagar conta (confirmação dupla)" (`04-MAPA-DE-TELAS.md`) | Sim |
| Começar e terminar dentro do app | função do servidor (`03-DECISOES-TECNICAS.md`, seção 5) | Sim |
| Confirmar por e-mail | "com confirmação por e-mail" | Sim (permitido) |
| Apagar o registro e os dados pessoais | anonimiza `Usuario`; apaga perfil, medições, dieta, mensagens (R6.10) | Sim |
| Treinos realizados viram anônimos | R6.10 / pergunta 19 **[decidir]** | Sim nas duas respostas: anônimo sem ligação com a pessoa não é dado pessoal |
| Fotos (perfil, aparelho que o aluno enviou) | não está escrito | **Falta**: apagar do Storage também |
| Revogar o token da Apple | não está escrito | **Falta**: a função de apagar chama `https://appleid.apple.com/auth/revoke` |
| Dizer quanto tempo leva e confirmar no fim | não está escrito | **Falta**: "Sua conta será apagada em até X dias" + e-mail de "conta apagada" |
| Assinante do Plus pela loja | não está escrito | **Falta, só se** o Plus for vendido pela App Store **[decidir]**: avisar que a cobrança continua na Apple e mandar cancelar antes |
| Funcionário e **dono** apagando a conta | R6.10 só fala do aluno | **Falta**: o que acontece com os treinos que o instrutor montou (ficam com o aluno, selo sem nome) e com a academia quando o **dono** apaga (passar a posse a outro dono antes, ou bloquear até passar) |

Os quatro "Falta" são P e entram na especificação de Conta antes do código da tela.

### 10.3 Rótulos de privacidade da loja ("App Privacy" no App Store Connect)

Preenchidos à mão no App Store Connect, **iguais** ao manifesto (seção 1.1). O que declarar:

| Categoria da Apple | O que é no app | Ligado à pessoa | Rastreamento |
|---|---|---|---|
| Informações de contato: nome, e-mail, telefone | conta | sim | não |
| Saúde e condicionamento: saúde | peso, altura, medições, restrições, dieta, objetivo | sim | não |
| Saúde e condicionamento: condicionamento físico | treinos realizados | sim | não |
| Conteúdo do usuário: fotos | perfil, aparelho | sim | não |
| Conteúdo do usuário: outro | observações, refeições marcadas; mensagens **[decidir]** chat | sim | não |
| Identificadores: id do usuário | conta | sim | não |
| Diagnóstico: dados de falha | só quando o Sentry entrar (já redigido, `redigir.ts`) | não, se configurado sem id | não |
| Compras | só se o Plus for pela loja **[decidir]** | sim | não |

Finalidade em todos: **funcionamento do app**. Nenhum dado para anúncio nem rastreamento: o app não pede `NSUserTrackingUsageDescription`. A política de privacidade (link no App Store Connect **e** dentro do app — 5.1.1(i)) precisa dizer o que coleta, quem vê (academia, personal), por quanto tempo guarda e como apagar.

### 10.4 Pagamento do Plus — diretrizes 3.1.1 e 3.1.3 (ligado ao risco R2)

Este ponto **não está decidido** (P00: "quem paga o Plus" e "Plus nas lojas"). O que as regras dizem, em cada caminho de `03-DECISOES-TECNICAS.md`, seção 4:

- **3.1.1**: para **liberar recurso ou funcionalidade dentro do app** (o exemplo citado é assinatura), é compra dentro do app (IAP). O Plus libera telas (dieta, conversa, treino do personal): é o caso típico.
- **3.1.3(b)** (multiplataforma): o app pode liberar o que a pessoa comprou em outro lugar **desde que** também esteja à venda dentro do app.
- **3.1.3(d)** (pessoa a pessoa): pagamento fora da loja só para serviço **em tempo real** entre duas pessoas — o exemplo é "fitness training". Um-para-poucos e um-para-muitos voltam ao IAP. O acompanhamento do Plus é **assíncrono** (o personal ajusta o plano, a conversa é por mensagem): não encaixa com folga.
- **3.1.3(e)**: serviço **consumido fora do app** usa pagamento **fora** do IAP (é obrigatório, não opcional).
- **3.1.3**, abertura: fora dessas exceções, o app **não pode chamar** para pagar fora, salvo na loja dos **Estados Unidos**. O Brasil não está entre as exceções no texto de 08/06/2026.

O que isso quer dizer para cada caminho, sem escolher:

| Caminho | Risco na Apple |
|---|---|
| **A. Loja (IAP)** | Nenhum de regra; custa 15–30 % e exige o aviso de cobrança ao apagar a conta (10.2). |
| **B. Pix/cartão no app** | Alto: parece "liberar funcionalidade" (3.1.1). Botão ou link para pagar fora é recusa provável. |
| **C. Via academia** | **Também tem risco** (R2): o app libera telas que a pessoa não comprou no app. Fica mais perto do 3.1.3(e) se o Plus for desenhado como **serviço da academia**, contratado na recepção, com parte presencial de verdade, **sem botão de compra e sem link de pagamento no app**, e com a explicação nas notas para a revisão. |

A revisão B recomenda pedir uma leitura prévia ao App Review antes do primeiro envio. A frase "o caminho C não tem esse problema" de `03-DECISOES-TECNICAS.md` foi corrigida nesta rodada.

### 10.5 Conta de demonstração para a revisão — diretriz 2.1(a)

App com login precisa mandar **conta de demonstração** e **o backend ligado**. Com duas visões e o Plus, uma conta só não mostra o app. Mandar nas notas para a revisão:

- **Aluno com Plus** (treino ativo, dieta em vigor, personal designado, conversa com mensagens) — mostra o que é pago.
- **Funcionário que também é aluno** — mostra o "Trocar de visão" sem trocar de conta.
- **Dono** — números da academia.
- Uma **academia de demonstração** no projeto Supabase de produção, com dados inventados (nada de aluno real), e o **código de vínculo** dela, para o revisor testar "Criar conta → entrar com o código".
- Contas com **senha** (o revisor não recebe código no e-mail). Se o login for só por código no e-mail (R10), deixar um caminho de senha para as contas de demonstração.
- Notas em inglês, curtas: o que é o app, como trocar de visão, como o Plus é contratado (o texto depende do caminho do 10.4), e por que pede câmera e fotos.

### 10.6 Dados de saúde — diretriz 5.1.3 (e 5.1.1(ix))

- **5.1.3(i)**: dado de saúde e condicionamento não pode ir para anúncio, marketing nem mineração de dados, nem para terceiros, a não ser para melhorar a gestão de saúde da própria pessoa, e com permissão. A decisão "nunca em log, nunca em analytics" (CLAUDE.md) já cumpre; o analytics, quando entrar, registra evento sem conteúdo.
- **5.1.3(ii)**: proibido guardar dado de saúde no **iCloud**. O app guarda no Supabase e no SQLite local, e o SQLite fica **fora do backup** do sistema (`isExcludedFromBackup`, `03-DECISOES-TECNICAS.md`, seção 5) — que é o que impede de ir para o backup do iCloud. Manter isso testado.
- **5.1.3(iii) e (iv)** (pesquisa com seres humanos) não se aplicam: o app não faz pesquisa.
- **1.4.1** (apps médicos): o app não mede nem diagnostica nada; o IMC e as triagens (R7 da revisão B) mostram "fale com o instrutor/médico", que é o que a diretriz pede.
- **5.1.1(ix)**: app que pede **informação sensível** "deve ser enviado por uma pessoa jurídica que presta o serviço, e não por um desenvolvedor individual". Peso, restrições e dieta são sensíveis. **Consequência prática**: a conta Apple Developer deveria ser de **organização** (CNPJ + D-U-N-S), não de pessoa física. Liga ao R4 da revisão B (quem é o controlador dos dados).
- **4.2.6** (apps feitos de modelo comercial): liga ao R11 da revisão B — se a marca for **[decidir]** white-label com um app por academia na loja, cada academia teria de enviar pela própria conta. Um app só, com cor e logo da academia por dentro, não tem esse problema.

## 11. Checklist "antes de mandar para a revisão"

**Conta e loja**
- [ ] Conta Apple Developer ativa (de organização, por causa da 5.1.1(ix)) e app criado no App Store Connect com o nome do pacote final **[decidir]**.
- [ ] Classificação etária respondida com as perguntas novas (obrigatórias desde 31/01/2026).
- [ ] Link da política de privacidade no App Store Connect **e** dentro do app (Perfil → Privacidade).
- [ ] Rótulos de privacidade preenchidos iguais ao manifesto (10.3).
- [ ] Capturas de tela do iPhone de 6,9" (16 Pro Max) e textos em português.

**Build**
- [ ] Build feito pelo EAS com Xcode 26 (padrão do SDK 54 no EAS; exigido desde 28/04/2026).
- [ ] `usesNonExemptEncryption: false`, manifesto de privacidade com os quatro motivos, sem e-mail da Apple pedindo motivo faltante no último TestFlight.
- [ ] Ícone 1024×1024 sem transparência; fontes e imagens de `recursos/` no lugar.
- [ ] Testado em iPhone de verdade pelo TestFlight: SE (tela pequena, sem Dynamic Island) e um com Dynamic Island; modo claro e escuro; letra grande.
- [ ] Funciona em rede só IPv6 (2.5.5) — o Supabase atende; conferir se nenhuma URL fixa usa IP.

**Comportamento**
- [ ] Nenhum texto provisório, "em breve" ou botão que não faz nada (2.1).
- [ ] Sign in with Apple ao lado do Google, mesmo destaque; nome gravado no primeiro login (10.1).
- [ ] Apagar conta funcionando ponta a ponta, com revogação do token da Apple e os quatro "Falta" do 10.2 resolvidos.
- [ ] Permissões pedidas **só na hora do uso**, com os textos do `app.json`; negar não trava o app (câmera negada → escolher da galeria ou seguir sem foto; notificação negada → cronômetro na tela).
- [ ] Gesto de voltar funciona em toda tela; treino em andamento pergunta antes (seção 4).
- [ ] Nada embaixo da Dynamic Island nem do indicador de início (auditoria do agente F com "0 achados").
- [ ] Nenhum dado de saúde em notificação, log ou analytics (R6.2).

**Plus e revisão**
- [ ] Caminho do pagamento do Plus decidido pelo Alex **[decidir]** e o app coerente com ele (10.4): sem botão ou link de pagar fora se não for IAP.
- [ ] (Se não for IAP) consulta prévia ao App Review feita.
- [ ] Contas de demonstração (aluno Plus, funcionário-aluno, dono), academia de demonstração com código, backend de produção ligado, notas em inglês (10.5).
- [ ] Dieta do Plus resolvida quanto ao R1 da revisão B (nutricionista) antes de mostrar ao revisor.

## 12. O que fica igual e o que segue o iPhone (resumo para o código)

| Igual nas duas plataformas | Segue o iPhone |
|---|---|
| Cores, fontes, logo, tom, tamanhos de toque, abas embaixo | Área segura (seção 2), teclado e barra "OK" do numérico (3), deslizar para voltar (4) |
| Regras do domínio, dados, offline, RLS | Vibração pelo Taptic Engine (5), permissão provisória (6), menu de ações e seletores nativos |
| Textos | Login com Apple nativo (10.1), fontes por nome de arquivo (7) |

## 13. Fontes consultadas (10/10/2026)

- Expo — [Configuração do app (SDK 54)](https://docs.expo.dev/versions/v54.0.0/config/app/): `bundleIdentifier`, `buildNumber`, `supportsTablet`, `infoPlist`, `config.usesNonExemptEncryption`, `privacyManifests`, `usesAppleSignIn`, `userInterfaceStyle` (exige `expo-system-ui` no Android), `edgeToEdgeEnabled` obsoleto.
- Expo — [Manifesto de privacidade da Apple](https://docs.expo.dev/guides/apple-privacy/) (por que repetir os motivos das bibliotecas).
- Expo — versões do SDK 54: [`bundledNativeModules.json` (ramo sdk-54)](https://github.com/expo/expo/blob/sdk-54/packages/expo/bundledNativeModules.json).
- Expo — [Notifications (SDK 54)](https://docs.expo.dev/versions/v54.0.0/sdk/notifications/): opções do plugin, `allowProvisional`, `TIME_INTERVAL`, `interruptionLevel`; `remote-notification` só para push em segundo plano.
- Expo — [ImagePicker (SDK 54)](https://docs.expo.dev/versions/v54.0.0/sdk/imagepicker/): `photosPermission`, `cameraPermission`, `microphonePermission: false`.
- Expo — [AppleAuthentication (SDK 54)](https://docs.expo.dev/versions/v54.0.0/sdk/apple-authentication/) · [SplashScreen (SDK 54)](https://docs.expo.dev/versions/v54.0.0/sdk/splash-screen/) (formato no topo é legado) · [Notas do SDK 54](https://expo.dev/changelog/sdk-54) (EAS usa Xcode 26 por padrão) · [eas.json](https://docs.expo.dev/eas/json/).
- Expo — [Widgets e Live Activities](https://expo.dev/blog/home-screen-widgets-and-live-activities-in-expo) · [expo-widgets](https://docs.expo.dev/versions/latest/sdk/widgets/) (a partir do SDK 55, alfa).
- Apple — [Diretrizes da App Store](https://developer.apple.com/app-store/review/guidelines/), atualizadas em 08/06/2026: 1.4.1, 2.1(a), 2.5.1, 2.5.4, 2.5.5, 3.1.1, 3.1.3 (a)–(f), 4.2.6, 4.8, 5.1.1 (i)–(v), (ix), 5.1.2(vi), 5.1.3.
- Apple — [Motivos das APIs de motivo obrigatório](https://developer.apple.com/documentation/bundleresources/app-privacy-configuration/nsprivacyaccessedapitypes/nsprivacyaccessedapitypereasons) (`CA92.1`, `C617.1`, `35F9.1`, `E174.1`) · [Tipos de dado coletado](https://developer.apple.com/documentation/bundleresources/app-privacy-configuration/nsprivacycollecteddatatypes/nsprivacycollecteddatatype) · [Detalhes de privacidade na loja](https://developer.apple.com/app-store/app-privacy-details/).
- Apple — [Oferecer a exclusão de conta no app](https://developer.apple.com/support/offering-account-deletion-in-your-app/) · [Exigências atuais e futuras](https://developer.apple.com/news/upcoming-requirements/) (Xcode 26 desde 28/04/2026; classificação etária nova desde 31/01/2026).
- Supabase — [Login com Apple](https://supabase.com/docs/guides/auth/social-login/auth-apple) (`signInWithIdToken`, nome só no primeiro login, chave a cada 6 meses no fluxo web).
- React Navigation — [Impedir de voltar](https://reactnavigation.org/docs/preventing-going-back/) (o deslize é cancelado quando o evento é impedido).
