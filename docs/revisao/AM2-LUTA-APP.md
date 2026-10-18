# AM2 — A virada de luta no app (P12, onda 3)

> Agente AM2, 15 e 16/10/2026. Dono de `app/`, menos `app/dominio/financeiro/` e `admin/`, que são do AM1 e onde não mexi. Em `02-design/` só apaguei o que a seção 5 do `AL-LUTA-VISUAL.md` manda apagar e anotei no `icones/luta/CREDITOS.md`.

## Estado

| Passo | Estado |
|---|---|
| 1. Domínio de luta (teste antes) | feito |
| 2. Dados (repositório, fila, exemplo) | feito |
| 3. Telas (aluno, professor, recepção, cronômetro, entrada, dono) | feito |
| 4. Tirar a musculação (código, testes, ícones e imagens) | feito |
| 5. Marca (nome, ícone, abertura, tema 2.0.0) | feito, com o `package` intocado |
| 6. Achados do AS | feito: os quatro conferidos no e2e |
| 7. Verificação | feito: tudo verde (números abaixo) |
| Pedidos do AM1 | feito: redigir financeiro, migração oficial da base, colunas de luta |

## O que entrou

**Domínio** (`app/dominio/`, tudo com teste e rodando no Node 24 sem compilar):
- `modalidades/`: Muay Thai, Boxe, Jiu-Jitsu, Luta Livre e MMA, com os mesmos ids do AM1.
- `turmas/`: a grade REAL da Raça Fight (`grade-raca-fight.ts`, 11 turmas, incluindo Kids, Sexta OPEN e Treino de competição), o fuso da academia, as aulas geradas da grade (`horario@data`), cancelar e passar a aula a outro professor antes do início, e os lembretes.
- `presenca/`: a janela do check-in (proposta L7: 30 min antes até 30 min depois, como **parâmetro** da academia), a chamada, a confirmação sozinha às 23:59 (calculada na leitura), a retirada, o lançamento retroativo, a contagem, sumidos e ativos, e o desempate do servidor (a equipe ganha do aluno).
- `graduacao/`: as réguas como dado. A IBJJF adulto e Kids estão prontas. Muay Thai e Luta Livre ficam "a configurar". O app avisa quem **atingiu os mínimos**, mas nunca gradua sozinho. Também: registrar, faixa trazida de outra academia, anular com motivo (a anulada fica riscada para a equipe) e exame com "Fechar o exame".
- `rounds/`: o cronômetro de rounds sobre o `cronometro.ts`. Boxe e Muay Thai: 3 × 3 min com 1 min de descanso. MMA: 3 × 5 min. Aviso 10 s antes. Os sinais seguem a posição na linha do tempo (o teste de propriedade achou um sinal perdido, e isso foi corrigido).
- `experimental/`: o link `wa.me` para (51) 98196-2077 com a modalidade na mensagem, os estados da experimental, o aviso "já fez" (avisa, não bloqueia) e o código de indicação ("Traga um amiguinho").
- `kids/`: o dependente nasce com a autorização de imagem **desligada**. O professor vê só o primeiro nome e a saúde, se o responsável liberou. A regra dos 16 e 17 anos (L27) chega como parâmetro.
- `eventos/`, `conteudo/` (técnicas, Raça Responde), `recursos.ts` (`plus: false, dieta: false`) e `papel.ts` → `entradaDaEquipe` (professor, recepção ou admin).

**Dados**: o repositório de luta (`AcademiaDeLuta`, fichas, presenças, graduações, exames, eventos, lutas, consentimentos, dependentes, interessados, experimentais, indicações). A presença offline vai pela fila existente (`checkin`/`chamada`). O exemplo da Raça Fight usa só nomes fictícios (`NOMES_REAIS_PROIBIDOS` barra os do Instagram), sem foto de criança.

**Telas**:
- Aluno (5 abas): **Início** (o destaque é a próxima aula, com "Estou na aula" e "Desfazer"), **Horários** e **Turma**, **Treinos** (faixa e histórico), **Academia** (professores, atletas, eventos, técnicas, Raça Responde, endereço e WhatsApp), **Perfil** (dependentes, indicar um amigo, avisos) e Comemoração da graduação.
- Professor (Hoje · Turmas · Alunos · Graduação · Perfil):
  - **Hoje**: a aula da hora e "Abrir a chamada".
  - **Chamada**: "Fechar a chamada" fixo embaixo.
  - **Turmas**: próximas aulas com Cancelar e Passar, e o aviso da turma.
  - **Alunos**: filtros Todos, Sumidos, Novos, Kids, Atletas e Atingiram os mínimos.
  - **Ficha**: faixa, mínimos, registrar e anular graduação, atleta.
  - **Graduação**: mínimos por modalidade, Kids que passam ao adulto, exames e réguas.
- Recepção (Hoje · Alunos · Experimentais · Perfil): vínculos pendentes com "Confirmar todos", experimentais em grupos e "Nova experimental" (criança, código de indicação, "Mandar no WhatsApp").
- Dono: o dono que não dá aula vê "Abra o app Admin". Se dá aula, entra como professor. **O professor nunca vê valor em reais**: o e2e confere isso em todas as abas dele.
- **Cronômetro de rounds** em tela cheia (gongo e batida em WAV, tela acesa), com a faixa acima das abas nos dois apps.
- **Entrada**: abertura preta com o logo da Raça Fight e boas-vindas com "Quero conhecer · aula experimental grátis". Esse botão leva à vitrine sem conta (`/conheca`: academia, horários só de leitura, professores, eventos, técnicas, Raça Responde), onde a folha "Qual modalidade?" abre o WhatsApp. O "Sou o dono" explica que a gestão é no Admin.

**Marca**: nome "Raça Fight", ícone e abertura provisórios do AL (`#1C1C1C`, ponta `#C42024`) e tema 2.0.0. O `Simbolo` e o `SeloDoLogo` agora desenham o logo. **`package`, `bundleIdentifier`, `slug` e `scheme` não mudaram** (L-decidir do Alex). Fica só a sugestão: `com.racafight.app`.

## O que saiu

- O treino de musculação inteiro: séries e carga, o catálogo `11-treino`, o mapa muscular, Evolução, Modo treino, treinos prontos, montar e enviar treino, histórico de treino, a faixa "treino em andamento", `IlustracaoExercicio`, e os tipos e testes de treino, andamento e pedidos.
- Os ícones e as fotos de musculação da seção 5 do AL. O sprite foi refeito com 77 ícones, e as imagens copiadas caíram para 52 (estados vazios e Raça Fight).
- O Plus e a dieta ficaram **desligados** atrás de `RECURSOS`, sem apagar a especificação.
- Os modos Livre e Regressivo do cronômetro (o de luta é por rounds).

## Pedidos do AM1 (Admin)

1. `app/dados/redigir.ts` agora também redige dinheiro e contato:
   - os campos que terminam em `Centavos` ou `PontosBase`;
   - os que começam com `valor` ou `aReceber`;
   - `telefone`, `whatsapp`, `documento`, `observacao`, `mudancas`, `totais`, `porCategoria`, `remuneracao`, `descontos`, `reparticao` e `motivoDaReabertura`.

   Isso tem teste. `nome` não entrou, porque o app registra ids e nomes de tela; o Admin segue com a lista dele, que é mais dura.
2. **A versão oficial de `academias`, `vinculos` e `tem_vinculo()` está em `app/supabase/migracoes/20261016000100_base_academias_vinculos.sql`.** A provisória do AM1 continua em `admin/supabase/migrations/20261015000100_base_compartilhada.sql`, e não foi apagada. As duas são `if not exists` e rodam em qualquer ordem. O vínculo do app ganhou `estado` (pendente, ativo, encerrado), `desde`, `ate`, `motivo_de_saida` e `encerrado_por`. O `ativo` que o Admin lê virou espelho do estado (trava `vinculos_ativo_espelha_estado`). A recepção e o dono leem os vínculos da academia.
3. `app/supabase/migracoes/20261016000200_luta_colunas.sql` só acrescenta colunas, sem recriar nenhuma tabela:
   - `modalidades`: `chave`, `ordem`;
   - `eventos`: `hora`, `endereco`, `descricao`, `publico`, `link` (só https), `criado_por`;
   - `interessados`: `codigo_de_indicacao`, `criado_por`;
   - `aulas_experimentais`: `aula_id`, `remarcada_de`, `atualizada_em`.

   Nada foi aplicado: não existe projeto Supabase.

## Verificação (16/10/2026)

| O quê | Resultado |
|---|---|
| `npm run testar:dominio` | **457 testes, 0 falhas** (também com `TZ=Asia/Tokyo`, pelo PowerShell). Inclui os do financeiro do AM1. A linha de base era 524: os testes de treino saíram com o código e os de luta entraram. |
| `npm run testar:telas` | **11 suítes, 103 testes, 0 falhas**. Novo: `telas/equipe/Equipe.test.tsx` (quinta 19:50: o Hoje e a Chamada com o mesmo número, "Fechar a chamada" aparece, quinta sem o Muay Thai das 21h, nenhum "R$", e o dono vê "Abra o app Admin"). |
| `npx tsc --noEmit` | 0 erros |
| `npx eslint .` | **0 erros**, 38 avisos (imports duplicados e diretivas sem uso, quase todos de antes) |
| `npx expo-doctor` | **18/18**. O `expo-asset` errado, que o `expo-audio` puxava (v58), foi trocado pelo da SDK (`~12.0.13`). |
| e2e Playwright sobre o export web, 390 × 844, quinta 15/10 às 20:05 | **32 de 32**: vitrine e WhatsApp com a modalidade; check-in e desfazer; check-in sem sinal na fila; cronômetro 3 × 3 min; Hoje = Chamada (4 = 4); "Fechar a chamada" dentro da tela e fechada; professor sem reais e sem Experimentais; nova experimental com o aviso "já fez"; recepção com "Confirmar todos"; o dono vê o Admin; claro; ultrawide 2040 × 790 sem rolagem lateral; nenhum erro de página. |

**Capturas** em `docs/revisao/AM2-capturas/`: 30 PNG (a1 a f2), mais os roteiros `fluxos.mjs` e `servidor.mjs`, para rodar de novo. Conferi o Início, o Hoje, a Chamada, as boas-vindas e a nova experimental lado a lado com o `luta.html`: a estrutura e a hierarquia batem (um destaque por tela, o botão principal embaixo, as faixas desenhadas).

Bug achado pelo e2e e corrigido: a barra de abas pedia `tatame-cheio` e `convite-cheio`, que não existem, e a aba Turmas ou Experimentais quebrava ao ficar ativa. Agora, sem a versão cheia, a barra usa o contorno.

## Achados do AS

- A quinta segue a grade real: tem Muay Thai às 20h e não tem o das 21h (conferido no teste de tela e no e2e).
- Nenhum nome de exemplo é igual ao de um atleta real (`NOMES_REAIS_PROIBIDOS`, com teste).
- O número de check-ins do Hoje é o mesmo da Chamada: as duas telas contam com `contarNaAula`.
- "Fechar a chamada" fica fixo embaixo, visível sem rolar (y 712 de 844).

## Pendências

1. **Ícones**: o `02-design/icones/CREDITOS.md`, do agente R, ainda cita os ícones de musculação apagados. Não toquei nele, porque fora do `luta/CREDITOS.md` não é meu.
2. **APK**: não gerei, como pedido. Antes de gerar, rode `npx expo prebuild --clean`: a pasta `android/` é da marca antiga e não tem o `expo-audio` nem o `expo-asset`.
3. **[decidir] do Alex**: o `package`/`bundleIdentifier` (sugestão: `com.racafight.app`), a janela do check-in (L7, hoje com a proposta 30/30 como parâmetro), a régua de Muay Thai e Luta Livre ("a configurar"), a regra dos 16 e 17 anos (L27), o prazo para apagar interessados (L23), o link em evento (L22, desligado no exemplo) e os nomes das abas (L32).
4. **Supabase**:
   - faltam as tabelas só do app (turmas e horários, ajustes, presenças, graduações e réguas, exames, lutas, consentimentos, dependentes, técnicas, perguntas, indicações), a visão pública de Atletas (só quem consentiu) e o `RepositorioSupabase` de verdade, que hoje é um esboço;
   - os ids não batem: o app usa chaves de texto (`muay-thai`), o Admin usa `uuid`.
5. **Lembrete de aula**: a regra (`lembretesDeAula`) e a preferência existem, mas o agendamento da notificação no aparelho não está ligado.
6. **Chamada**: falta trocar a modalidade de um aluno numa aula de várias modalidades. O ícone de saúde do Kids depende dos dependentes da academia inteira, que a equipe ainda não lê de uma vez (na ficha, aparece).
7. **Fotos**: as fotos de professores do Instagram não foram usadas (L34). "Minha matrícula" (plano e valor) não aparece no app, de propósito: é do Admin.
8. **Especialidades do perfil profissional**: ainda trazem "Musculação" e "Funcional" (é um tipo do domínio de equipe que veio de antes). Para luta, falta decidir a lista (instrutor de Muay Thai, faixa-preta etc.).
9. **Decisões**: sugiro uma linha nova no `03-arquitetura/03-DECISOES-TECNICAS.md` dizendo que o dono usa o Admin, que o app tem só aluno, professor e recepção, e que o Plus e a dieta ficam desligados por `RECURSOS`.

## Resumo

O app virou o da Raça Fight Gravataí. O aluno vê a próxima aula e faz check-in (também sem sinal), consulta horários, faixas, a academia e o cronômetro de rounds. O professor faz a chamada e fecha, cuida das turmas, vê quem atingiu os mínimos e registra a graduação, e nunca vê valor em reais. A recepção marca a aula experimental e confirma os vínculos. O dono é mandado para o Admin. Quem não tem conta conhece a academia e agenda a experimental pelo WhatsApp. A musculação saiu inteira, e o Plus e a dieta ficaram desligados.

Está tudo verde: 457 testes de domínio, 103 de tela, tsc e ESLint sem erro, expo-doctor 18/18 e 32 de 32 no e2e. Os pedidos do AM1 estão feitos. Ficam com o Alex os [decidir], o `prebuild` antes do APK e o resto do Supabase.
