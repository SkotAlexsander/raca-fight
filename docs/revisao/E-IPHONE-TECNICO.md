# E — iPhone técnico

Agente E, 10/10/2026, prompt `00-prompts/P06-IPHONE.md`. Escrevi só em `app/`, `03-arquitetura/`, no fim de `docs/decisoes.md` e neste arquivo. Não toquei em `02-design/` (agente F) nem no PDF. Não resolvi nenhum **[decidir]**. Não rodei `npm install`.

O documento completo é `03-arquitetura/04-IPHONE.md`. Aqui vai o resumo.

## 1. O que mudou

### `app/app.json`

| Chave | Antes | Depois |
|---|---|---|
| `ios.bundleIdentifier` | `com.academiaplus.app` | `com.pixelmartins.academiaplus` **[decidir]** |
| `android.package` | `com.academiaplus.app` | `com.pixelmartins.academiaplus` **[decidir]** (mesmo motivo) |
| `ios.buildNumber` / `android.versionCode` | — | `"1"` / `1` (depois o EAS sobe sozinho) |
| `ios.supportsTablet` | `false` | `false` (mantido) |
| `ios.usesAppleSignIn` | — | `true` |
| `ios.config.usesNonExemptEncryption` | estava como `infoPlist.ITSAppUsesNonExemptEncryption` | `false`, pelo caminho que o Expo documenta |
| `ios.infoPlist` | — | câmera e fotos em português (foto de perfil e do aparelho), `CFBundleDevelopmentRegion: pt-BR` |
| `UIBackgroundModes` | — | **nenhum**: o descanso com o app fechado é notificação local agendada |
| `ios.privacyManifests` | — | motivos `CA92.1` (UserDefaults), `C617.1` (horário de arquivos), `35F9.1` (tempo desde a inicialização), `E174.1` (espaço em disco); 8 tipos de dado coletados, ligados à pessoa, sem rastreamento; `NSPrivacyTracking: false` |
| plugins | router, secure-store, sqlite, notifications | + `expo-apple-authentication`, `expo-image-picker` (`microphonePermission: false`), `expo-font` (6 `.ttf` em `recursos/fontes/`); notifications com `enableBackgroundRemoteNotifications: false` |

### `app/eas.json` (novo)

- `cli.appVersionSource: "remote"`: o número de build fica no EAS.
- `desenvolvimento`: `developmentClient`, distribuição interna (iPhone cadastrado com `eas device:create`), `.apk` no Android. `desenvolvimento-simulador` serve a quem tiver Mac.
- `previa`: distribuição `store`, `autoIncrement`. O `submit.previa` manda ao **TestFlight** e à trilha `internal` da Play.
- `producao`: igual, e o `submit.producao` vai à App Store e à Play como rascunho.
- Cada perfil tem `channel` (para o EAS Update) e `environment` (as variáveis do Supabase ficam nos ambientes do EAS, não no arquivo).

### Outros arquivos

- `app/package.json`: novas dependências nas versões do SDK 54: `expo-haptics ~15.0.8`, `expo-font ~14.0.12`, `expo-image-picker ~17.0.11`, `expo-apple-authentication ~8.0.8`, `expo-system-ui ~6.0.9`, `expo-dev-client ~6.0.21`. Novos scripts: `build:ios:desenvolvimento`, `build:ios:previa` (com envio automático), `build:producao`, `enviar:ios`.
- `app/LEIA-ME.md` tem uma seção nova, "Gerar a versão de iPhone sem ter um Mac": EAS Build + EAS Submit + TestFlight, a tabela do que o Alex precisa ter, os perfis e o passo a passo.
- `app/recursos/LEIA-ME.md`: a pasta `fontes/` e os nomes exatos dos arquivos.
- `app/.gitignore`: `segredos/`, onde fica a chave da Play.
- `03-arquitetura/04-IPHONE.md` (novo). Trata da configuração, da área segura, do teclado (inclusive a barra "OK" que falta no teclado numérico do iOS), do gesto de voltar com `usePreventRemove` no treino, da vibração, da notificação do descanso, das fontes e do modo escuro. Live Activity e Saúde ficam como v2, com o custo de cada uma. Fecha com as regras da App Store e o checklist.
- `03-arquitetura/03-DECISOES-TECNICAS.md`:
  - seção 4: troquei "o caminho C não tem esse problema" pelo risco R2, sem decidir;
  - seção 3: uma nota sobre o iPhone;
  - seção 7: perfis `desenvolvimento/previa/producao`.
- `03-arquitetura/00-STACK.md` e `02-ESTRUTURA-DO-CODIGO.md`: as dependências novas, o `eas.json` e a pasta `recursos/fontes/`.
- `docs/decisoes.md`: uma entrada nova, acrescentada no fim.

## 2. Checklist da App Store, resumido

Seção 11 de `04-IPHONE.md`:

1. Conta Apple Developer, de preferência de organização. Na App Store Connect, o app criado com o nome do pacote final, a classificação etária nova respondida e a política de privacidade com link na loja e dentro do app.
2. Rótulos de privacidade preenchidos iguais ao manifesto: contato, saúde, condicionamento, fotos, conteúdo, id. Tudo ligado à pessoa e nada de rastreamento.
3. Build do EAS com Xcode 26, `usesNonExemptEncryption: false`, nenhum motivo de API faltando e ícone sem transparência.
4. Testes em iPhone de verdade pelo TestFlight, no SE e num modelo com Dynamic Island, em claro e escuro, com letra grande.
5. O Sign in with Apple aparece ao lado do Google com o mesmo destaque, e o nome é gravado no primeiro login (4.8).
6. "Apagar conta" funciona dentro do app, com revogação do token da Apple (5.1.1(v)). Hoje faltam quatro coisas na especificação:
   - apagar as fotos;
   - dizer o prazo e confirmar quando terminar;
   - avisar da cobrança da Apple, se o Plus for vendido pela loja;
   - definir o que acontece quando um funcionário ou o **dono** apaga a conta.
7. Permissões pedidas só na hora do uso. Negar não trava o app.
8. Nada fica embaixo da Dynamic Island ou do indicador de início (auditoria do F).
9. O Plus segue o caminho de pagamento que o Alex escolher **[decidir]**, sem botão nem link para pagar fora se não for compra pela loja. Antes, uma consulta prévia ao App Review (R2).
10. Contas de demonstração: aluno Plus, funcionário que também é aluno e dono. Uma academia de demonstração com código de vínculo, o backend ligado e notas em inglês (2.1).
11. Nenhum dado de saúde em notificação, log, analytics ou iCloud (5.1.3).

## 3. O que o Alex precisa providenciar

| O quê | Detalhe |
|---|---|
| **Nome do pacote** **[decidir]** | Aprovar `com.pixelmartins.academiaplus` ou dar outro. Não muda depois do primeiro envio às lojas. |
| **Conta Apple Developer** | US$ 99 por ano. A diretriz **5.1.1(ix)** pede que app com dado sensível (saúde) seja enviado por **pessoa jurídica**. Por isso a conta de **organização** (CNPJ + número D-U-N-S, gratuito) é a recomendada. **[decidir]**, ligado ao R4 da revisão B. |
| **Um iPhone** | No começo, o Expo Go. Depois, um build de desenvolvimento no aparelho cadastrado. O simulador só existe em Mac. Vale testar também num iPhone SE ou em outro sem Dynamic Island, se tiver acesso. |
| **Conta na Expo** (expo.dev) | Para o EAS Build e o EAS Submit. O plano gratuito tem cota mensal de builds. |
| **App criado no App Store Connect** | Com o mesmo nome do pacote. Um grupo de testadores internos no TestFlight. |
| **Fontes e imagens** | O design entrega os `.ttf` e as imagens de `recursos/`. Sem eles, o build falha. |
| **Domínio de e-mail** | Cadastrar no repasse de e-mail da Apple, para que o código do e-mail chegue a quem escondeu o endereço no Sign in with Apple. |

## 4. Achados para outros agentes / para o P00

- **P00** (não é minha pasta): pôr na tabela de pendências o nome do pacote e o tipo de conta Apple (pessoa física ou organização).
- **Especificação** (`01-especificacao/`):
  - os quatro "Falta" de "Apagar conta" (seção 10.2 de `04-IPHONE.md`);
  - a tela "Vincular aluno" precisa avisar que, com o e-mail escondido da Apple, o vínculo é pelo código;
  - a frase do app antes do pedido completo de notificação, no primeiro descanso.
- **Design (F)**:
  - a "vibração longa" do fim do descanso vira o padrão de notificação no iOS;
  - o teclado numérico do iOS precisa da barra "Próximo / OK";
  - na tipografia, o iOS chama cada peso pelo nome do arquivo.

## 5. Saída dos testes

`cd app && node --test "dominio/**/*.test.ts"` (Node v24.18.0). Nenhuma regra do domínio mudou:

```
ℹ tests 86
ℹ suites 26
ℹ pass 86
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

`app.json`, `eas.json` e `package.json` estão em UTF-8 sem BOM e são JSON válido (conferido com `JSON.parse`).

## 6. Fontes

Estão em `03-arquitetura/04-IPHONE.md`, seção 13. As principais:

- Expo: [configuração do app no SDK 54](https://docs.expo.dev/versions/v54.0.0/config/app/), [manifesto de privacidade](https://docs.expo.dev/guides/apple-privacy/), [Notifications](https://docs.expo.dev/versions/v54.0.0/sdk/notifications/), [versões do SDK 54](https://github.com/expo/expo/blob/sdk-54/packages/expo/bundledNativeModules.json).
- Apple: [Diretrizes da App Store (08/06/2026)](https://developer.apple.com/app-store/review/guidelines/), [motivos das APIs](https://developer.apple.com/documentation/bundleresources/app-privacy-configuration/nsprivacyaccessedapitypes/nsprivacyaccessedapitypereasons), [exclusão de conta](https://developer.apple.com/support/offering-account-deletion-in-your-app/), [exigências atuais](https://developer.apple.com/news/upcoming-requirements/).

## 7. O que não confirmei

- Que o EAS aceita `environment` e `channel` sem o `expo-updates` instalado. Esperado: só um aviso. O `expo-updates` entra quando o EAS Update for configurado.
- Que os quatro motivos do manifesto bastam. Só o primeiro envio ao TestFlight confirma: se faltar algum, a Apple manda e-mail com o motivo.
- O comportamento do teclado no Android com a tela de ponta a ponta. Precisa de teste no aparelho.
