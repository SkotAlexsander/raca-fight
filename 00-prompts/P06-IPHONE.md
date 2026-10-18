# P06 — Ajustar o app para iPhone (dois agentes em paralelo)

O app já é Expo (React Native), então o mesmo código roda em Android e iPhone. Esta rodada fecha **o que é próprio do iPhone**: configuração, regras da App Store, área segura, gestos e convenções do iOS, e os tamanhos de tela reais. Todos leem antes `00-prompts/P00-CONTEXTO.md`, `CLAUDE.md` e `docs/decisoes.md`. Português do Brasil. Nenhum resolve um **[decidir]**. Cada agente só escreve na pasta dele.

| Agente | Escreve em | Relatório |
|---|---|---|
| E — iPhone técnico | `app/`, `03-arquitetura/`, acrescenta em `docs/decisoes.md` | `docs/revisao/E-IPHONE-TECNICO.md` |
| F — iPhone design | `02-design/sistema-de-design/` | `docs/revisao/F-IPHONE-DESIGN.md` |

## E — iPhone técnico

1. **`app/app.json`** (bloco `ios`): `bundleIdentifier` (o atual `com.academiaplus.app` usa um domínio que o Alex não tem — proponha `com.pixelmartins.academiaplus` e marque [decidir]), `buildNumber`, `supportsTablet` (manter `false` na v1, conforme o design), `infoPlist` com os textos de permissão em português que o app realmente vai pedir (câmera e fotos para foto de perfil/aparelho, notificações), `UIBackgroundModes` só se for preciso (cronômetro de descanso com o app em segundo plano: notificação local agendada, **não** áudio em segundo plano), `privacyManifests` (manifesto de privacidade exigido pela Apple: APIs de motivo obrigatório usadas por AsyncStorage/SQLite/SecureStore — UserDefaults, horário do sistema, espaço em disco — e os tipos de dado coletados), `config.usesNonExemptEncryption: false`. Confira cada chave contra a documentação do Expo SDK 54 (pesquise na web; cite a fonte no relatório).
2. **`app/eas.json`**: perfis `desenvolvimento`, `previa` (TestFlight interno) e `producao`, com iOS e Android. Explique no `LEIA-ME.md` do app como gerar a versão de iPhone **sem ter um Mac** (EAS Build na nuvem + EAS Submit para o TestFlight) e o que o Alex precisa ter: conta Apple Developer (US$ 99/ano), um iPhone para testar (Expo Go no começo, build de desenvolvimento depois).
3. **`03-arquitetura/04-IPHONE.md`**: tudo o que muda no iPhone e como o código trata:
   - área segura (Dynamic Island, notch, indicador de início) com `react-native-safe-area-context`;
   - teclado (`KeyboardAvoidingView` com `behavior="padding"` no iOS);
   - gesto de voltar deslizando da borda, que não pode ser bloqueado (e o que fazer no treino em andamento: confirmar antes de sair);
   - vibração ao marcar série (`expo-haptics`; acrescente a dependência com a versão do SDK 54);
   - notificação local do fim do descanso com o app fechado (permissão provisória do iOS);
   - Live Activity/Dynamic Island com o cronômetro (marque como v2 e explique o custo);
   - Apple Saúde/HealthKit (v2, só com consentimento, ligado à LGPD);
   - fontes da marca carregadas com `expo-font`;
   - modo escuro do sistema.
4. **Regras da App Store** (na mesma página, seção própria):
   - Seção 4.8, Sign in with Apple: obrigatório se houver login com Google/Facebook. Diga o que o app usa e o que isso exige.
   - Seção 5.1.1(v), apagar a conta dentro do app: confira se o fluxo da especificação atende.
   - Rótulos de privacidade da loja.
   - A regra 3.1.1 e 3.1.3, sobre o pagamento do Plus. Ligue ao risco R2 de `docs/revisao/B-MELHORIAS.md`, sem decidir.
   - Conta de demonstração para a revisão da Apple.
   - Dados de saúde (seção 5.1.3).
   Monte um checklist "antes de mandar para a revisão".
5. Se alguma regra do domínio mudar (não deve), teste primeiro. No fim rode `node --test "dominio/**/*.test.ts"` em `app/` e confirme que passa. Não rode `npm install`.

## F — iPhone design

1. **Tamanhos reais de iPhone** em pontos: iPhone SE (3ª geração), 375 × 667, com botão Início e sem Dynamic Island. iPhone 13 mini, 375 × 812, com notch. iPhone 16, 393 × 852, com Dynamic Island. iPhone 16 Pro Max, 440 × 956. Acrescente esses tamanhos ao `tokens.json` (`layout.aparelhos`) e as áreas seguras de cada um: topo de 20, 50 ou 59 pt; base de 0 ou 34 pt.
2. **Mockup** (`mockups/index.html` + `sistema.css`): crie a moldura de iPhone com Dynamic Island, barra de status do iOS (hora à esquerda, sinal e bateria à direita) e indicador de início na base. Ponha um seletor de aparelho no topo da página (iPhone SE · iPhone 16 · iPhone 16 Pro Max · Android 390). O seletor troca a moldura e as áreas seguras das 4 telas. A barra de abas tem de ficar acima do indicador de início, e o cabeçalho abaixo da Dynamic Island. Preserve `?moldura=real` (o PDF captura com ele) e a página padrão continua mostrando as 4 telas lado a lado.
3. **Convenções do iOS** em `03-NAVEGACAO-E-LAYOUT.md`, `02-COMPONENTES.md` e um arquivo novo `06-IPHONE.md`:
   - título grande que encolhe ao rolar, nas telas raiz das abas;
   - voltar deslizando da borda;
   - folha inferior com alturas média e grande e com a alça;
   - menu de ações do iOS no lugar do menu do Android;
   - seletores (data e hora) nativos;
   - interruptor no padrão iOS;
   - vibração leve ao marcar série e média ao fechar treino;
   - "puxar para atualizar".
   Diga o que fica **igual** nas duas plataformas (marca, cores, tamanhos de toque, abas embaixo) e o que segue a plataforma. Regra: a identidade é do Academia Plus; o comportamento é do sistema.
4. **Medir de novo:** amplie `auditoria/auditar.mjs` com os 4 iPhones, nos dois temas e com fonte a 100 % e a 160 % (no iOS, Texto Dinâmico grande). Meça também se alguma coisa fica embaixo da Dynamic Island ou do indicador de início, ou seja, conteúdo dentro da área segura. Corrija até "0 achados" e deixe as capturas novas em `auditoria/capturas/`.

O PDF de `docs/apresentacao/` é refeito depois pelo agente principal; não mexa nele.
