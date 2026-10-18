# A — Bugs e correções (revisão de 10/10/2026)

Agente A. Escrevi só em `app/`, `03-arquitetura/` e neste arquivo. Nenhum [decidir] foi resolvido e nenhuma decisão de `docs/decisoes.md` foi trocada.

**Resumo**: 29 achados provados e corrigidos (2 altos, 10 médios, 17 baixos) e 7 divergências em pastas de outros agentes, que ficam aqui como proposta. Os testes do domínio passaram de 64 para **86, todos verdes**. O `tsc --noEmit` do domínio, com a configuração corrigida, sai com 0 erros.

Formato de cada achado: **onde (arquivo:linha) · o que está errado · como provei · o que fiz**. As linhas são as do arquivo **antes** da correção.

Como provei o código: primeiro escrevi o teste que devia passar e rodei contra o código antigo. Resultado: 12 testes falhando em `treino.test.ts` e 8 em `unidades.test.ts` (rodados com um `instanteComFuso` provisório que devolvia `toISOString()`, a função antiga). Depois corrigi e rodei de novo. Os testes novos ficam no fim de cada `.test.ts`, em blocos `revisão A — …`.

---

## Alta

### A1. O id gerado no telefone não é UUID e se repete quando o app reabre
- **Onde**: `app/dominio/treino.ts:34-44` (`gerarIdPadrao`).
- **Erro**: quando falta `crypto.randomUUID`, o código cai num contador: `id-1`, `id-2`… O Hermes, motor do React Native, não traz `crypto` por padrão. Isso causa dois problemas. (1) `id-1` não é UUID, e a coluna `uuid` do Postgres recusa esse valor; o modelo diz "Ids: UUID". (2) O contador volta a 1 toda vez que o app abre. Assim, dois treinos feitos sem sinal em dias diferentes ganham o mesmo id, e o `upsert` por id da fila (03-DECISOES, seção 2) sobrescreve o primeiro. Isso quebra o "nunca se perde um registro feito sem sinal" (R1.24).
- **Prova**: teste `continua sendo UUID e não se repete quando o app reabre`. Ele esconde o `crypto` do Node e carrega o módulo duas vezes, como num app que foi fechado e aberto de novo. Antes da correção, as duas sessões deram `id-1`, e o formato UUID também falhava.
- **Feito**: o reserva agora gera UUID v4 com `crypto.getRandomValues` e, se ele também faltar, com `Math.random`. Para ter aleatoriedade forte no Hermes, ainda vale instalar o `expo-crypto` (`~15.0.9` no SDK 54). Fica para quem montar `dados/`; não adicionei dependência.

### A2. A arquitetura liberava o perfil e as medições à academia sem a autorização do aluno
- **Onde**: `03-arquitetura/03-DECISOES-TECNICAS.md:94` (seção 5, LGPD).
- **Erro**: o texto dizia que a RLS libera ao "funcionário com vínculo ativo na mesma academia (perfil e medições)". Faltava a condição de R6.4, "só se ele autorizou". O texto também liberava as medições à recepção, que no modelo de dados (seção 5) não vê medições. Quem escrever a RLS por esse parágrafo vaza dado de saúde.
- **Prova**: comparei com R6.4 e R6.5, com a tabela da seção 5 de `01-MODELO-DE-DADOS.md` (recepção "—", instrutor/dono "(a)") e com a função `aluno_autorizou()` do próprio modelo.
- **Feito**: o parágrafo agora exige `autoriza_academia`, tira a recepção das medições e lista o que o personal designado vê (R6.6). Também incluí `historicos_de_objetivo` e `refeicoes_registradas` entre as tabelas de saúde, porque R6.1 diz que objetivo e marcas de refeição são dado de saúde.

## Média

### A3. O relógio grava a hora em UTC ("Z"), sem o fuso do aparelho
- **Onde**: `app/dominio/treino.ts:48` (`agora: () => new Date().toISOString()`).
- **Erro**: R7.4 e o modelo pedem "instante com fuso (`-03:00`)". Sai `2026-10-11T01:30:00.000Z` para um treino às 22h30 de 10/10 em São Paulo. O fuso do aluno se perde, e qualquer conta que pegue a data dos 10 primeiros caracteres troca o dia à noite (R1.17: data no fuso do aluno).
- **Prova**: testes `grava a hora local com o deslocamento` (São Paulo, Kolkata +05:30 e UTC) e `AMBIENTE_PADRAO.agora() termina em ±HH:MM`. Os dois falhavam.
- **Feito**: nova função `instanteComFuso(data)` em `unidades.ts`, usada pelo `AMBIENTE_PADRAO`.

### A4. Arredondamento da tela muda conforme o número
- **Onde**: `app/dominio/unidades.ts:31-37` (`formatarNumero`, usado por peso, carga, altura e circunferência).
- **Erro**: `toFixed` arredonda o valor binário. Resultados: 1450 g → "1,4 kg", mas 2450 g → "2,5 kg"; 72350 g → "72,3 kg"; 1150 g de carga → "1,1 kg"; altura 1765 mm → "1,76 m", mas 1775 mm → "1,77 m"; 1005 mm → "1,00 m".
- **Prova**: teste `revisão A — arredondamento na tela é sempre "meio para cima"`. Antes: `actual: '1,4 kg', expected: '1,5 kg'`, entre outros.
- **Feito**: `arredondarDecimal` arredonda o número decimal que a pessoa vê (meio para cima, em módulo). Notação científica cai no caminho antigo.

### A5. Data que não existe no calendário passava
- **Onde**: `app/dominio/unidades.ts:221-254` (`formatarData`, `lerDataBrasileira`, `calcularIdade`).
- **Erro**: `lerDataBrasileira('31/02/2026')` devolvia `2026-02-31`, um dado inválido que ia para o banco. Também passavam `29/02/2025` (ano não bissexto) e `formatarData('2026-13-45')` → "45/13/2026". `calcularIdade('2026-02-31', …)` devolvia 0.
- **Prova**: teste `revisão A — data que não existe no calendário é recusada` (falhava). Ficou também um teste de proteção para quem nasceu em 29/02: a pessoa completa ano em 01/03 nos anos não bissextos (Código Civil, art. 132, § 3º). Esse caso importa para o menor de 18 (R6.11) e já estava certo.
- **Feito**: `lerDataISO` e `dataExiste` conferem mês, dia e ano bissexto. As três funções usam essa conferência.

### A6. A arquitetura mandava o aluno sem academia para uma tela de código
- **Onde**: `03-arquitetura/03-DECISOES-TECNICAS.md:13` (seção 1, passo 3).
- **Erro**: "Zero vínculos → tela 'Entre com o código da sua academia' (dentro de `(entrada)/`)". Isso trava o aluno sem academia, e R8.4 e o fluxo F1 (passo 4, "Não tenho código, vou treinar sozinho por enquanto") dizem que ele usa o app. O mesmo vale para quem está com vínculo `pendente` (R8.1).
- **Prova**: comparei com R8.4, com F1 passos 4 e 7 (`02-FLUXOS.md:17-22`) e com a recomendação da pergunta 5.
- **Feito**: zero vínculos ativos agora leva a `(aluno)/` como aluno sem academia, com um cartão "Entrar com o código" ou "Aguardando a recepção confirmar".

### A7. O aluno sem academia não tinha onde guardar o cadastro opcional
- **Onde**: `app/dominio/tipos.ts:138` (`PerfilDoAluno.academiaId: Id`), `:160` (`HistoricoDeObjetivo`), `:168` (`MedicaoCorporal`); `03-arquitetura/01-MODELO-DE-DADOS.md:79-83, 94, 110`.
- **Erro**: o F1 passo 5 pede peso, altura e objetivo também ao aluno que escolheu "treinar sozinho". O perfil era chaveado por `(usuarioId, academiaId)` com `academiaId` obrigatório, então não havia como gravar esse cadastro. O CLAUDE.md diz que "nenhuma tela do aluno trava por falta de peso/altura", e o caminho de gravar também não pode travar.
- **Prova**: comparei com F1 passos 4-5 e com a convenção do próprio modelo (linha 10), que já previa `academiaId` nulo para treino e execução, mas não para perfil e medição.
- **Feito**: `academiaId: Id | null` nas três entidades, no código e no modelo, com a regra do que acontece ao se vincular. Para várias academias, ficou anotado o [decidir] existente.

### A8. `npm run tipos` não roda: faltam os tipos do Jest e do Node
- **Onde**: `app/tsconfig.json:18` (`"types": ["react", "jest"]`) e `app/package.json` (sem `@types/jest` nem `@types/node`).
- **Erro**: (1) `@types/jest` não está nas dependências, e o `jest-expo@54` também não o traz (conferi com `npm view jest-expo@54 dependencies`). (2) Os testes do domínio importam `node:test` e `node:assert/strict`, e com `types` restrito o `tsc` não enxerga `@types/node`, mesmo instalado.
- **Prova**: montei uma cópia em pasta temporária, fora do projeto, com o `tsconfig.json` do app, o `tsconfig.base.json` do `expo@54.0.37` e o `dominio/`. Saída: `error TS2688: Cannot find type definition file for 'jest'`. Com `@types/jest`, ainda: `TS2307: Cannot find module 'node:test'` (4 erros). Depois da correção: saída 0.
- **Feito**: `@types/jest ^29.5.14` e `@types/node ^24.0.0` nas `devDependencies`, e `"node"` em `types`. Não rodei `npm install`.

### A9. `npm run testar` sempre falha enquanto não há teste de tela
- **Onde**: `app/package.json:15` (`"testar:telas": "jest"`).
- **Erro**: sem nenhum `*.test.tsx`, o Jest sai com código 1 ("No tests found"). Por isso `npm run testar`, que encadeia domínio e telas, falha mesmo com o domínio verde.
- **Prova**: Jest 29.7 numa pasta temporária, com o mesmo `testMatch`: `No tests found, exiting with code 1`. Com `--passWithNoTests`: código 0.
- **Feito**: `"testar:telas": "jest --passWithNoTests"`.

### A10. Treino de academia ou de personal podia nascer sem academia
- **Onde**: `app/dominio/treino.ts:94-110` (`criarTreinoVazio`).
- **Erro**: só o `pronto` exigia `academiaId`. Os treinos `montado_pela_academia`, `montado_pelo_personal` e `copiado_de_pronto` aceitavam `null`, contra R8.4 e o comentário do próprio `tipos.ts` ("nulo para o aluno sem academia com treino `livre`"). Um treino assim escapa da RLS por academia.
- **Prova**: os 3 testes `origem "…" sem academia é recusada` falhavam.
- **Feito**: toda origem diferente de `livre` exige `academiaId`. Registrei isso também no modelo (seção 8).

### A11. O instrutor veria o treino do aluno com exercício sem nome
- **Onde**: `03-arquitetura/01-MODELO-DE-DADOS.md:146` (acesso a `Exercicio` da camada `criado_pelo_aluno`).
- **Erro**: o exercício criado pelo aluno é "—" para instrutor e personal. Mas R6.5 dá à academia o treino ativo "com nome, dias e exercícios", e o personal designado lê os treinos do aluno. A política, como estava escrita, devolveria a linha do exercício do dia sem conseguir ler o nome.
- **Prova**: cruzei a tabela da seção 7 com a da seção 8 e com R6.5.
- **Feito**: leitura permitida quando o exercício está num treino que a pessoa já pode ler, com a forma da política (`exists` subindo até `treinos`).

### A12. A lista do filtro de log deixava passar dado de saúde
- **Onde**: `03-arquitetura/03-DECISOES-TECNICAS.md:99` (`redigir.ts`).
- **Erro**: a lista por nome de campo cobria só sufixos de unidade, `restricoes`, `dataNascimento`, a `descricao` do item e o `texto` da mensagem. R6.1 também chama de saúde o objetivo, as marcas de refeição **e os motivos**, e o plano de dieta inteiro. Pela lista, passavam para o log: `objetivo`, `motivo` do "não segui", `trocaPermitida`, a `observacao` do plano, o `nome` da refeição e `caloriasKcal`.
- **Prova**: conferi campo a campo contra R6.1 e `tipos.ts`.
- **Feito**: a regra passou a ser "todo campo" dos tipos de dieta, de objetivo e de mensagem, mais o sufixo `Kcal` e o campo `objetivo`. O teste `redigir.test.ts` percorre os tipos listados em R6.1.

## Baixa

### A13. Peso corporal saía "80 kg"; a regra pede uma casa
- **Onde**: `app/dominio/unidades.ts:63` (`formatarPeso`) e o teste antigo `unidades.test.ts:78`.
- **Erro**: a tabela da seção 7 separa as duas grandezas: peso corporal "kg com **uma** casa: 72,4 kg" e carga "kg com **até** uma casa: 20 kg · 22,5 kg". O código cortava o zero nos dois casos, e o teste antigo fixava `'80 kg'`.
- **Prova**: teste `peso corporal mostra o zero: "80,0 kg"` (falhava: `actual: '80 kg'`).
- **Feito**: `formatarPeso` mantém o zero e `formatarCarga` continua cortando. Atualizei a asserção antiga, com comentário.

### A14. Medida inválida virava "NaN kg" na tela, e o IMC devolvia NaN
- **Onde**: `unidades.ts:63, 104, 109, 194` (formatadores de medida) e `:264-271` (`calcularImc`).
- **Erro**: `formatarPeso(NaN)` dava "NaN kg" e `formatarPeso(-500)` dava "-0,5 kg". `calcularImc(72500, undefined)` (altura opcional vazia) e `calcularImc(72500, NaN)` passavam pelo `altura <= 0` e devolviam `NaN`. A documentação dizia "lança erro se faltar altura".
- **Prova**: os 2 testes de `revisão A — medida inválida…` falhavam.
- **Feito**: `exigirMedida` nos formatadores. O IMC usa `!(altura > 0)`, que também pega NaN e `undefined`, e confere o peso.

### A15. Um treino pronto podia ser ativado, e ativar mexia no treino de outro aluno
- **Onde**: `treino.ts:191-208` (`ativarTreino`).
- **Erro**: um `pronto` com dias passava em `podeSerAtivado` e virava "ativo", subindo a versão do modelo (R1.4: o pronto nunca é usado ao vivo). Se a lista trouxesse treinos de outro aluno, o ativo dele virava "guardado".
- **Prova**: 2 testes em `revisão A — ativar treino` falhavam.
- **Feito**: `pronto` (ou `alunoId` nulo) é recusado, e só o ativo do mesmo aluno perde o selo.

### A16. Arquivar um pronto subia a versão dele
- **Onde**: `treino.ts:210-212` (`arquivarTreino` chamava `tocar`).
- **Erro**: a versão marca **edição** do modelo (R1.4, para a cópia saber de qual versão veio). Arquivar não muda o conteúdo.
- **Prova**: teste `arquivar um pronto não sobe a versão` falhava.
- **Feito**: arquivar atualiza só `estado` e `atualizadoEm`.

### A17. `copiadoDe` ficava ligado ao objeto de quem chamou
- **Onde**: `treino.ts:124`.
- **Erro**: o treino guardava a mesma referência recebida. Se quem chamou mexesse no objeto depois, o treino "imutável" mudava junto.
- **Prova**: teste `mexer no objeto de entrada depois não muda o treino criado` falhava.
- **Feito**: o campo agora guarda uma cópia (`{ ...dados.copiadoDe }`).

### A18. O nome padrão de um dia novo podia repetir um que já existe
- **Onde**: `treino.ts:231` (`nomeDeDiaPorLetra(treino.dias.length)`).
- **Erro**: num treino com "A, B", tirar o A e adicionar um dia novo dava "B, B".
- **Prova**: teste `nome padrão de dia não repete` falhava (`nomes repetidos: B, B`).
- **Feito**: `nomeDeDiaLivre` usa a letra da posição e, se ela já estiver em uso, pula para a seguinte livre. O teste antigo "A, Pernas, C" continua passando.

### A19. Repetição e carga aceitavam número grande demais para ser exato
- **Onde**: `treino.ts:373-377` (`exigirInteiro` com `Number.isInteger`).
- **Erro**: `repeticoes: 1e300` e `cargaGramas: 2**53` passavam. Acima de 2^53 o inteiro deixa de ser exato, e o volume vira `Infinity`.
- **Prova**: teste `repetições e carga fora do inteiro seguro são recusadas` falhava.
- **Feito**: a conferência agora usa `Number.isSafeInteger`. O limite de tela (999,5 kg, 99 repetições) é outro assunto; ver D6.

### A20. `react-native` fixado numa versão diferente da que o Expo 54 espera
- **Onde**: `app/package.json:37` (`"react-native": "0.81.4"`).
- **Erro**: o `bundledNativeModules.json` do `expo@54.0.37` (a versão que `~54.0.0` instala hoje) pede `0.81.5`, e o `expo-doctor` acusaria. O `expo install --fix` do LEIA-ME corrigiria, mas o arquivo nasce errado.
- **Prova**: `curl https://unpkg.com/expo@54.0.37/bundledNativeModules.json` → `"react-native": "0.81.5"`. As outras versões nativas do `package.json` conferem com esse arquivo.
- **Feito**: mudei para `0.81.5`.

### A21. O script `web` não roda
- **Onde**: `app/package.json:11` (`"web": "expo start --web"`).
- **Erro**: rodar para web exige `react-dom` e `react-native-web`, que não estão nas dependências. O próprio `bundledNativeModules.json` do SDK 54 lista os dois (`19.1.0`, `~0.21.0`). Além disso, a decisão já tomada é "app para telefone, não site" (P00).
- **Prova**: os dois pacotes não aparecem no `package.json`, e o `bundledNativeModules.json` os lista como as versões do SDK para a web.
- **Feito**: tirei o script. Se a web entrar um dia, ela volta com as duas dependências.

### A22. O Node avisava que relia cada arquivo do domínio
- **Onde**: `app/dominio/` (sem `"type"` declarado).
- **Erro**: cada `node --test` imprimia `MODULE_TYPELESS_PACKAGE_JSON … Reparsing as ES module`, com custo de desempenho. Pôr `"type": "module"` no `package.json` do app arriscaria os arquivos de configuração CommonJS do Expo, Metro e Babel.
- **Prova**: o aviso aparecia na saída dos testes. Com o arquivo novo, não aparece mais.
- **Feito**: criei `app/dominio/package.json` com só `{ "type": "module" }`, e a árvore de `02-ESTRUTURA-DO-CODIGO.md` explica por quê.

### A23. A notificação filtrava por uma origem que não existe
- **Onde**: `03-DECISOES-TECNICAS.md:66` (`origem = do_personal`).
- **Erro**: a origem se chama `montado_pelo_personal` (R1.2, `tipos.ts`). Além disso, `planos_de_dieta` não tem campo `origem`.
- **Prova**: busquei `do_personal` no projeto; só aparece nessa linha.
- **Feito**: corrigi o nome e tirei o filtro inexistente da dieta.

### A24. O campo da assinatura aparecia como `status`
- **Onde**: `03-DECISOES-TECNICAS.md:81` e `:87`.
- **Erro**: no modelo, em `tipos.ts` e na RLS (`assinaturas_plus.estado`), o campo se chama `estado`.
- **Prova**: busquei os dois nomes nos documentos de arquitetura e em `tipos.ts`.
- **Feito**: troquei por `estado` em `03-arquitetura/`. O `docs/decisoes.md` repete `status`; ver D5.

### A25. Quem liga o Plus "via academia": o texto dizia o dono, a regra diz a recepção
- **Onde**: `03-DECISOES-TECNICAS.md:83` (caminho C: "o **dono** marca o Plus ativo").
- **Erro**: R5.3 diz que "um funcionário liga o Plus", R5.7 que "a recepção desliga", e o modelo (seção 13) dá a escrita à recepção.
- **Prova**: comparei com R5.3, R5.7 e a tabela da seção 13.
- **Feito**: o caminho C agora diz "a recepção (ou o dono) liga… e desliga na data que escolher, por uma função do servidor". O [decidir] continua aberto.

### A26. O consentimento de saúde citado na arquitetura não existia no modelo
- **Onde**: `03-DECISOES-TECNICAS.md:106` (guarda `consentimentoEm`) × `tipos.ts`/modelo, onde esse campo não existia.
- **Erro**: o `docs/decisoes.md` registra "consentimento guardado na primeira medição", mas nenhuma entidade tinha onde guardar. `autorizaAcademia` é outra coisa (quem enxerga), e `consentimentoDoResponsavelEm` só vale para menor de idade.
- **Prova**: busquei `consentimentoEm` em `tipos.ts` e no modelo, sem resultado.
- **Feito**: `PerfilDoAluno.consentimentoEm?: InstanteISO` no código e no modelo. A seção 5 da arquitetura aponta para ele e lembra o caso do menor (R6.11).

### A27. "Nunca se apaga medição" contradizia "apagar no mesmo dia"
- **Onde**: `01-MODELO-DE-DADOS.md:11` × `:121` e `:296`.
- **Erro**: a convenção dizia que nunca se apaga medição, e o mesmo arquivo permitia apagar a medição no mesmo dia e o treino realizado em até 7 dias (R1.22).
- **Prova**: as três passagens do mesmo arquivo se contradiziam.
- **Feito**: a convenção agora lista as duas exceções com prazo e aponta para a regra própria de apagar a conta (R6.10).

### A28. "Toda tabela tem `academia_id`" não valia para várias tabelas
- **Onde**: `01-MODELO-DE-DADOS.md:294`, `02-ESTRUTURA-DO-CODIGO.md:216`; `tipos.ts` (`RefeicaoRegistrada` sem `academiaId`).
- **Erro**: `usuarios` não pertence a uma academia, e as tabelas filhas herdam a política do pai. A única tabela que entra sozinha na fila offline e não tinha `academiaId` era `RefeicaoRegistrada`.
- **Prova**: conferi entidade por entidade em `tipos.ts`.
- **Feito**: a regra virou "tabela raiz da academia tem; filha herda; `usuarios` não tem". `academiaId` foi adicionado a `RefeicaoRegistrada` no código e no modelo.

### A29. `app.json` aponta para imagens que não existem
- **Onde**: `app/app.json:10, 12, 26, 38` (`./recursos/icone.png`, `abertura.png`, `icone-adaptativo.png`, `icone-notificacao.png`).
- **Erro**: a pasta `recursos/` só tem o `LEIA-ME.md`, e o `expo prebuild` (e o EAS Build) falha.
- **Prova**: listei `app/recursos/`.
- **Feito**: **nada, de propósito**. O `LEIA-ME.md` do app já registra a pendência, e os PNG saem do logo (caminho A), que está com o agente C nesta rodada. Tirar as referências e pôr de volta depois é trabalho jogado fora. Fica como item aberto para quem fechar o logo. As cores do `app.json` (`#0B1313` e `#006B5F`) conferem com `tokens-marca.json` (`escuro.fundo` e `claro.marca`).

---

## Divergências em pastas de outros agentes (não editei: proposta)

| # | Onde | O que diverge | Proposta |
|---|---|---|---|
| D1 | `01-especificacao/03-REGRAS.md:113` (R5.10) | "a origem **passa a** `montado_pelo_personal`", mas o treino já tem essa origem. | "a origem **continua** `montado_pelo_personal` e o treino ganha `personalAte` (selo 'Personal: até [data]')". |
| D2 | `02-design/sistema-de-design/02-COMPONENTES.md:94` e `05-ACESSIBILIDADE.md:41,45` | Passo da carga no seletor: **2,5 kg**. R7.2 e `INCREMENTO_DE_CARGA_GRAMAS` dizem **0,5 kg**. | Escolher um. Se o seletor anda de 2,5 kg e a digitação aceita 0,5 kg, escrever isso em R7.2 e no componente. Hoje o leitor diria "2,5 quilos" e a regra, 0,5. |
| D3 | `02-COMPONENTES.md:95` | Repetições "0 a 99". R1.14 diz que a série planejada tem repetições ≥ 1, e o domínio recusa 0. | "1 a 99" ao montar; 0 só na execução (série realizada). |
| D4 | `02-COMPONENTES.md:99` | Descanso exibido "1:30". R7 diz `mm:ss` abaixo de 1 h, e `formatarTempo(90)` dá "01:30". | Decidir entre "1:30" e "01:30" e alinhar R7, componente e `unidades.ts`. O código segue R7 até lá. |
| D5 | `docs/decisoes.md` ("Pagamento do Plus") | "`status` da assinatura só muda por função do servidor". O campo é `estado`. | Trocar `status` por `estado`. |
| D6 | `01-especificacao/03-REGRAS.md` (R1.14) × `02-COMPONENTES.md:92-97` | O design tem limites (carga 0 a 999,5 kg, descanso 0 a 600 s, séries 1 a 20, repetições até 99) que a regra não tem, então o domínio não os aplica. | Pôr os limites em R1.14. Aí o domínio os aplica e a tela mostra a mesma mensagem. |
| D7 | `01-especificacao/03-REGRAS.md` (R7.1) | "Aceita vírgula e ponto como decimal" faz `lerNumero('1.800')` dar **1,8**, mas em português "1.800" é mil e oitocentos (kcal, preço). | Dizer em R7.1 que ponto seguido de exatamente 3 dígitos é milhar, ou que só a vírgula é decimal nos campos de kcal e preço. |

Conferido sem divergência: os nomes de token em `tokens.json` × `tokens-marca.json` (os 3 nomes a mais da marca estão declarados e documentados em `02-IDENTIDADE-VISUAL.md`); os tipos de `tipos.ts` × os campos do modelo de dados, depois das correções acima; e as versões do `package.json` × o SDK 54, salvo A20.

## Saída final dos testes

`node --test "dominio/**/*.test.ts"`, dentro de `app/`, em 10/10/2026:

```
ℹ tests 86
ℹ suites 26
ℹ pass 86
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

O `tsc -p .` com o `tsconfig.json` corrigido, sobre o `dominio/` em cópia temporária (typescript 5.9, `@types/jest` 29, `@types/node`), saiu com código 0.
