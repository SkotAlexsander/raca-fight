# AP — Entrega: APK novo e Admin no PC

> Agente AP (onda 5), 16 a 18/10/2026. Gerei o APK e montei o Admin para o PC. Fora de `docs/revisao/` mexi em dois arquivos de `app/` para corrigir dois defeitos visuais que achei no teste (seção 4). Não criei conta nem publiquei nada, e nenhum `.env` foi lido (o `app/` nem tem `.env`; o Admin roda no modo local).

## 1. O que foi entregue

| Arquivo | Onde | Tamanho | Observação |
|---|---|---|---|
| **Raça Fight.apk** (ARM) | `C:\Users\alexs\OneDrive\Desktop\Raça Fight.apk` | 67.792.522 bytes (64,7 MB) | SHA-256 `E256434FE27D3686E5D69987694FA9E87A749489EBC2BDF0CBFF340FE5D7B2F0` |
| cópia | `A:\Projetos\Academia Plus\Raça Fight.apk` | igual | mesmo hash |
| APK antigo | `C:\Users\alexs\OneDrive\Desktop\Academia Plus (antigo).apk` | 64.965.837 bytes | só renomeado (não havia nada com esse nome) |
| **Admin** | `A:\Projetos\Academia Plus\Admin\` | `site/` com 37 arquivos, 0,99 MB | build de 16/10 15:51 |
| atalho | `C:\Users\alexs\OneDrive\Desktop\Raça Fight — Admin.lnk` | — | ícone do Admin (`raca-fight-admin.ico`) |

**O APK final inclui** as mudanças do principal em `app/telas/rotas.ts` e `app/navegacao/(academia)/_layout.tsx` (15:38) e as minhas duas correções (abertura e cronômetro). O bundle JS foi gerado depois de todas elas. **O Admin entregue** foi montado às 15:51, depois do `admin/src/dados/local/exemplo.ts` (15:42), e nada em `admin/src` nem em `app/dominio` mudou depois disso.

### Versões

- APK: `com.pixelmartins.academiaplus`, versionName 0.1.0, versionCode 1, nome exibido **"Raça Fight"**, minSdk 24, targetSdk/compileSdk 36, `arm64-v8a` + `armeabi-v7a`, Hermes, nova arquitetura.
- Expo SDK 54.0.37, React Native 0.81.5, React 19.1.0, Gradle 8.14.3, JDK 21.0.12 (Microsoft), SDK em `A:\Dev\Android\Sdk`.
- **`package`, `bundleIdentifier`, `slug` e `scheme` não mudaram** (decisão pendente do Alex; a sugestão do AM2 continua `com.racafight.app`).
- Assinatura: chave de **debug**, a mesma do APK antigo (SHA-256 do certificado `fac61745…3b9c`). Como o `package` também é o mesmo, **o APK novo instala por cima do antigo** sem desinstalar. Testei isso no emulador: a sessão antiga continuou e as telas vieram com a cara de luta.
- Admin: Vite 8.3.1, React 19.3.0; JS principal 411 kB (124 kB gzip).

## 2. Como abrir o Admin no PC

Dois cliques em **"Raça Fight — Admin"** na Área de Trabalho. Isso roda o `Abrir o Admin.cmd`, que sobe o `servidor.mjs` (Node puro, sem dependência) em `http://localhost:4174`, só em 127.0.0.1, e abre o navegador no painel. A janela preta fica minimizada; fechar a janela desliga o Admin. Se o Admin já estiver aberto, outro clique só abre o navegador de novo. Há um `LEIA-ME.txt` na pasta.

- A porta é fixa (4174, a mesma do `npm run previa`) porque os dados do modo local ficam no IndexedDB do navegador, presos ao endereço. Se a porta mudasse, o Admin começaria do zero.
- O servidor não entrega nada fora de `site/` (um `/../servidor.mjs` recebe o `index.html`).
- **Conferido de verdade**: abri pelo atalho e pelo `.cmd` (HTTP 200) e pelo Playwright a 2040 × 790. Título "Raça Fight · Admin", painel de outubro com os dados de exemplo, **0 erros no console**. Captura em `AP-capturas/admin-painel-pc.png`.
- **Atenção**: no primeiro teste (antes do `exemplo.ts` novo) o `.cmd` abriu o Admin no navegador do Alex. Esse navegador pode ter guardado o exemplo antigo (Bruno, Duarte…). Se aparecerem os nomes antigos, é só usar **Ajustes › Academia › "Recomeçar os dados de exemplo"**.
- No JS do build ainda aparece "Bruno" em `Importar-*.js` e no `index-*.js`, junto com "Breno". Não sei se é um resto da troca ou outro uso legítimo (por exemplo, a planilha de exemplo da importação). Fica para o principal conferir.

## 3. O que testei no emulador

AVD `Flutter_API36` (Android 16, x86_64), com um APK x86_64 feito só para o teste a partir do mesmo código (52,3 MB, não entregue). Como o app calcula o horário no fuso da academia, mudar o fuso do aparelho não abre o check-in. Por isso acertei o relógio do emulador para **sexta 16/10, 19:45 (Brasília)** com `cmd alarm set-time` e depois devolvi o relógio automático.

| O quê | Resultado | Captura |
|---|---|---|
| Abertura (instalação limpa) | logo inteiro, fundo #1C1C1C (depois da correção 4.1) | `01-abertura.png` (antes: `00-abertura-antes-cortada.png`) |
| Boas-vindas | "Muay Thai, Boxe, Jiu-Jitsu, Luta Livre e MMA em Gravataí", "Quero conhecer", Sou aluno / Sou da equipe / Contas de exemplo | `02-boas-vindas.png` |
| Aluno (Lucas Ferraz) | Início com a próxima aula (Sexta OPEN 20:00), semana, faixas; abas Início, Horários, Treinos, Academia, Perfil | `03-aluno-inicio.png` |
| Check-in | "Estou na aula" → "Hoje você treina…" (Muay Thai / Jiu-Jitsu / Luta Livre) → "Presença marcada · Desfazer · Pendente até o professor fechar a chamada"; a semana foi de 4 para 5 aulas e o calendário de Treinos marcou o dia 16 | `04-aluno-checkin.png` |
| Cronômetro | predefinições de luta e de preparo; Iniciar → preparo de 10 s → Round 1 contando, Pausar/Parar/Pular, "Falta 10:54" | `05-cronometro-corrigido.png` (antes: `05b-…-ilegivel.png`) |
| Professor (Diego Moura) | Hoje ("Sem aula sua hoje", porque na sexta só tem o OPEN), Cronômetro, Eventos, Aviso para uma turma; abas Hoje, Turmas, Alunos, Graduação, Perfil | `06-professor-hoje.png` |
| **Turmas › Muay Thai — noite 1 › "Aviso para a turma"** (correção do principal) | **abre a tela do aviso**, já com a turma ("Vai para 7 alunos e responsáveis da turma Muay Thai — noite 1"), em vez de voltar ao Hoje | `07-professor-aviso-para-a-turma.png` |
| logcat | **0 FATAL EXCEPTION** e nenhum ANR do app na sessão final (os ANR do log são todos de apps do Google: Play, GMS, teclado…, por causa do pulo de relógio e da RAM curta) | — |

Também testei a **atualização por cima** com o APK x86 anterior: instalou e abriu sem crash, com a sessão antiga.

`04-aluno-checkin.png` é do build anterior ao último (o código dessa tela é o mesmo). As outras capturas são do build final.

## 4. Problemas achados e o que fiz

### 4.1 A abertura cortava o logo (corrigido em `app/app.json`)

No Android 12 ou mais novo, a abertura nativa mostra só o **círculo central de 2/3** da imagem. Com `imageWidth: 396`, o logo ficava com uns 230 dp de largura, e o círculo visível tem 192 dp: o "R" e o último "A" saíam cortados. Troquei para **`imageWidth: 288`**. Agora o logo tem uns 167 dp e cabe com folga: medi 664 px de 1152 no `splashscreen_logo.png`, dentro do círculo de 768 px. O ícone do launcher (adaptativo) já estava certo; simulei a máscara redonda e o logo cabe.

### 4.2 O número do cronômetro sumia no celular em tema claro (corrigido)

`app/telas/compartilhado/cronometro/TelaCronometroDeRounds.tsx`: a tela é sempre escura (`SobreposicaoDeCores esquema="escuro"`). Só que o número grande usava o `cores.texto` lido **fora** da sobreposição, que no tema claro é quase preto, então dava cinza-escuro sobre preto (ver `05b`). O mesmo valia para o ponto da fase "Prepare-se".

- O número passou a usar `cor={…'atencao' : 'texto'}` do `Texto`, que lê o tema de dentro.
- O ponto virou o componentezinho `PontoDaFase`, que também lê o tema de dentro.
- Tirei o `useTema()` que ficou sem uso.

Resultado: tsc sem erro, ESLint sem erro e Jest com **110/110**. Na primeira rodada do Jest, 1 teste falhou com o emulador e o Gradle disputando a RAM, e na segunda passou sem eu mexer em nada. Não identifiquei qual era.

> Os dois arquivos não são da minha pasta. **Peço ao principal** que registre as duas mudanças em `docs/decisoes.md` e avise o dono de `app/`.

### 4.3 Outros achados (não mexi)

- **Aba errada acesa**: na tela "Aviso para a turma", aberta por Turmas, a barra de baixo acende **"Alunos"** em vez de "Turmas".
- **Rótulo cortado no cronômetro**: o campo "Preparação" aparece como "Prepara…" (2ª linha do painel de tempos), na largura de 1080 px.
- **A primeira abertura é lenta no emulador** (9 a 26 s, com o PC carregado). Uma vez o Android matou o app por "failed to complete startup" (ANR com o app a 0,9 % de CPU e 287 page faults): era o emulador sem memória enquanto o Gradle compilava. Não se repetiu com o Gradle parado (4,9 s e 9,3 s). Num celular de verdade vale cronometrar a primeira abertura.

### 4.4 O que deu trabalho na máquina (para a próxima vez)

- **RAM**: Gradle e emulador juntos estouram, porque o PC tem um pente só. O AAPT2 deu timeout e o build falhou. Compilar com o emulador desligado e um build por vez. ARM a frio: ~24 min; recompilando: 12 a 17 min; x86_64: ~7 min.
- **`prebuild --clean` com EBUSY**: algum programa aberto (provavelmente o VS Code ou o Codex) prende a pasta `app/android` vazia. Contornei gerando o `android/` numa cópia do projeto (com `node_modules` por junção) e copiando para dentro. O conteúdo gerado é o mesmo, sem caminho absoluto da cópia.
- **Emulador parado no boot**: depois de matar o emulador à força, ele fica esperando um diálogo de "relatório de crash" invisível (minimizado). A saída é apagar `%TEMP%\AndroidEmulator\emu-crash-*.db` antes de ligar.
- O JAVA_HOME do sistema continua apontando para um Android Studio que não existe. Usei o JDK 21 da Microsoft só na sessão.

## 5. O que fica para o Alex

- O `package` definitivo (hoje `com.pixelmartins.academiaplus`). Trocar depois **não atualiza** o app instalado: vira outro app.
- O APK é assinado com a chave de debug, bom para instalar e mostrar. Para a loja é preciso a chave de release (EAS).
- O logo em alta resolução: o ícone e a abertura ainda são os provisórios do AL.

## Resumo

O APK novo do Raça Fight (64,7 MB, ARM) está na Área de Trabalho e em `A:\Projetos\Academia Plus\`. Ele instala por cima do antigo, que foi renomeado para "(antigo)". No emulador funcionaram a abertura com o logo, a entrada do aluno e do professor, o check-in, o cronômetro e o "Aviso para a turma" corrigido pelo principal, sem crash.

Achei e corrigi dois defeitos visuais: o logo cortado na abertura e o número do cronômetro invisível no tema claro.

O Admin abre com dois cliques no atalho "Raça Fight — Admin" e carrega sem erro.
