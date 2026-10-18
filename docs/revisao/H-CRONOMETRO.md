# H — Cronômetro (P07)

Agente H, 10/10/2026. Pedido: `00-prompts/P07-NOTIFICACOES-E-CRONOMETRO.md`, seção H. O modo intervalado (HIIT/Tabata/EMOM) entra na v1. Nenhum **[decidir]** foi resolvido.

## Resumo

- Uma ferramenta, **três modos**: livre (para cima, com voltas), regressivo (para baixo, vibra no fim) e intervalado (trabalho, descanso, rodadas).
- O **descanso entre séries** e a **série por tempo** usam o mesmo motor: são o regressivo com outra finalidade.
- O motor é uma máquina de estados pura em `app/dominio/cronometro.ts`. Guarda o **instante de início e as pausas**; o tempo é sempre uma conta, nunca um contador por tique.
- Testes escritos **antes** do código: 53 do cronômetro, 180 no domínio inteiro, todos passando.
- Tela no mockup em moldura de celular, claro e escuro. O `auditar.mjs` dá **0 achados**, com `?aparelho=` e `?moldura=real` funcionando.

## 1. Os modos e as predefinições

| Modo | O que faz | Limites | Controles rodando |
|---|---|---|---|
| **Livre** | conta para cima, sem fim; voltas | — | Volta · Pausar · Parar |
| **Regressivo** | conta para baixo; vibra e avisa no fim; atalhos 1, 2, 3, 5, 10 min e "Outro" | 1 s a 3 h; ±30 s | −30 s · Pausar · +30 s; Pular |
| **Intervalado** | preparação → trabalho 1 → descanso 1 → … → trabalho N (sem descanso depois da última) | preparação 0–60 s, trabalho 1 s–60 min, descanso 0–60 min, 1–99 rodadas | Pular fase · Pausar · Parar |

Predefinições do intervalado (todas com 10 s de preparação; qualquer número é editável e vira "Personalizado"):

| Predefinição | Trabalho | Descanso | Rodadas | Total |
|---|---|---|---|---|
| Tabata 20/10 × 8 | 20 s | 10 s | 8 | 4:00 |
| EMOM 10 min | 60 s | 0 | 10 | 10:10 |
| HIIT 30/30 × 10 | 30 s | 30 s | 10 | 9:40 |
| HIIT 40/20 × 8 | 40 s | 20 s | 8 | 7:30 |

Usos dentro do treino (mesmo motor):
- **descanso**: regressivo com o `descansoSegundos` da série (padrão 60 s); descanso 0 = sem cronômetro;
- **série por tempo**: regressivo com o `tempoSegundos` da série. No fim marca a série sozinho e começa o descanso.

## 2. As regras novas

**Especificação**: `01-especificacao/03-REGRAS.md`, seção 9 (R9.1 a R9.16). Também:
- histórias H69–H76 (seção I de `01-HISTORIAS.md`);
- fluxo F9 (`02-FLUXOS.md`), com as variações dentro do F4;
- Parte 5 do `04-MAPA-DE-TELAS.md`: a tela Cronômetro, a folha "Registrar como série", o botão no Treino em andamento, o atalho no Início e a faixa.

As que mais mudam o app:

- **R9.3 e R9.4: instante, não contador.** O decorrido é agora − início − pausas (+ o que foi pulado).
  - Com a tela bloqueada, em segundo plano e com o app morto, o tempo continua certo: o estado é JSON puro, salvo a cada toque.
  - O instante é em ms desde 1970, então fuso e horário de verão não afetam.
  - Relógio atrasado à mão: o cronômetro não anda para trás nem fica negativo.
  - Relógio adiantado à mão: o cronômetro pula junto. Está escrito como limite conhecido.
- **R9.9: um cronômetro por vez no app**, com a tabela do que acontece em cada caso. A pergunta do P07 era "o descanso começa com o intervalado rodando". Resposta: o descanso **não** começa, o intervalado segue e a série fica marcada. Um toast "Série feita · o intervalado continua" traz o botão "Descansar", que pergunta antes de parar o intervalado. Descanso por cima de descanso continua reiniciando sem perguntar (componente 7).
- **R9.10: o tempo vira série.** Vale para livre, intervalado e regressivo avulso, numa série `feita` de um exercício por tempo.
  - O tempo conta **sem pausas, sem o que foi pulado e sem a preparação**, em segundos inteiros para baixo, e é editável.
  - Sem treino aberto, vira um treino realizado sem treino de origem (`treinoId` nulo, já previsto no R1.17).
  - O descanso nunca vira série.
- **R9.11: avisos.**
  - Notificação local agendada pelo instante exato, para o fim e para cada troca de fase.
  - No máximo 24 de uma vez: o iPhone guarda 64 por app, divididas com os lembretes. Um Tabata usa 16.
  - Fura o horário de silêncio, como o G também definiu.
- **R9.13**: com a tela Cronômetro aberta e rodando, a tela do celular não apaga.
- **R9.15**: o número se lê a 1 m.

**Código** (`app/dominio/cronometro.ts`, puro, sem Expo):
- criar: `criarCronometro`, `criarDescanso`, `criarSeriePorTempo`;
- mudar de estado: `iniciar`, `pausar`, `retomar`, `alternar`, `ajustar` (±30 s), `pularFase`, `marcarVolta`, `encerrar`, `zerar`, `atualizar`;
- ler a tela: `ler`, que dá o estado verdadeiro, o número da tela, o progresso, "acabando", a fase, a próxima fase, as rodadas e as voltas;
- agendar avisos: `proximosAvisos` e `proximoAviso` ("próximo aviso em X s", com o instante e o tipo da tabela de avisos do G);
- um por vez: `decidirAoIniciar`;
- registrar: `tempoParaRegistrarSegundos` e `criarSerieRealizadaDeTempo`;
- formatar: `formatarCronometro` ("1:30", como no componente 7), mais `PREDEFINICOES`.

Transição fora de hora não lança erro. Pausar um descanso que acabou um instante antes devolve o terminado: o toque atrasado não pode quebrar a tela. Já usar um modo errado (±30 s no livre) é erro de programação e lança.

## 3. A tela no mockup

`02-design/sistema-de-design/mockups/index.html`:

- **Tela 5 · Cronômetro, intervalado rodando** (Tabata, trabalho, rodada 3 de 8, 0:14), dentro da moldura e nos dois temas. Mostra:
  - o mostrador pintado pela fase (trabalho em `marca`, descanso em `sucesso`, com o nome da fase sempre escrito);
  - o número de **96** (80 no celular pequeno);
  - a barra da fase e a fileira de rodadas;
  - os controles Pular fase · Pausar (64) · Parar.

  O título da galeria passou a "5 telas-chave".
- **Tela 1**: o cabeçalho do treino ganhou o relógio que abre o Cronômetro.
- **Amostra 18 · Cronômetro**, com os três modos:
  - o parado do intervalado (chips de modo e de predefinição, os campos +/−, o total e "Iniciar");
  - o livre rodando com voltas;
  - o regressivo terminado com "Registrar como série".

**Medido no navegador**:
- número a 96 px no Android 390 e no iPhone 16 (`?moldura=real`, zoom 1);
- 80 px no iPhone SE;
- branco sobre `#18181B` no claro e `#101012` sobre `#F4F4F5` no escuro.

**Por que 96**: num iPhone 16, 1 pt ≈ 0,166 mm, e o algarismo tem ~0,7 do tamanho da fonte. Então 96 pt dão ~11 mm de algarismo. A regra prática de sinalização pede ~1 cm de letra por metro de distância (é regra prática, não norma). O 64 do descanso dá ~7,5 mm e continua no componente 7, que se olha com o celular na mão.

**Design** (`02-design/sistema-de-design/`):
- **componente 18 "Cronômetro"** novo no `02-COMPONENTES.md`: anatomia parado, rodando e terminado; cores por fase; folha "Registrar como série"; faixa; vibração; leitor de tela; regras; linha "No iPhone";
- **componente 7** passou a dizer que conta também a série por tempo e que é o mesmo motor;
- `tokens.json` 1.3.0:
  - `numeroCronometroTela` 96/104, 80/88 no celular pequeno, com teto 96;
  - `vibracao.trocaDeFase`;
  - o bloco `cronometro` (cor por fase, barras);
- `01-TOKENS.md`, `03-NAVEGACAO-E-LAYOUT.md`, `05-ACESSIBILIDADE.md` (anúncios do intervalado e cor por fase) e `06-IPHONE.md` (vibração da troca de fase) acompanham.

**Correção de passagem**: a regra 4 do componente 7 dizia "90 s se não houver" descanso. Isso contrariava a R1.14 e a R1.15 (padrão 60 s) e o `treino.ts`. Agora diz 60 s.

## 4. Saída dos testes e do auditar

```
$ cd app && node --test "dominio/**/*.test.ts"
ℹ tests 180
ℹ suites 44
ℹ pass 180
ℹ fail 0
```

São 53 do cronômetro, mais os de treino, unidades e avisos (do G). As suítes do cronômetro:
- criar e validar;
- regressivo e descanso, instante e não contador (inclui "10 minutos bloqueado sem nenhuma chamada");
- **+30 s e −30 s**;
- **pausar e retomar**;
- livre com voltas;
- **o intervalado inteiro** (Tabata lido em instantes soltos, pausa no meio, pular fase, EMOM, sem preparação);
- **"próximo aviso em X s"** (descanso, ±30 s, pausado, retomado, intervalado em ordem, limite);
- o relógio que volta, o fuso e a ida e volta em JSON;
- um por vez;
- o tempo vira série;
- formatar.

O teste rodou primeiro e falhou (o módulo não existia). Ao conferir as contas, achei dois erros no próprio teste e corrigi antes do código:
- aos 85 s do Tabata faltam 5 s na fase, não 15;
- aos 25 s o trabalho 1 já tinha acabado.

```
$ node "02-design/sistema-de-design/auditoria/auditar.mjs"
(todas as janelas, 360 a 2040 × 790, os 4 iPhones, claro e escuro, fonte 100 % e 160 %: 0 em cada célula)
reticências previstas na especificação (...): 280 ocorrências, não contam como achado

0 achados
```

Não há `tsc` na máquina sem `npm install`, que não rodei. Os tipos foram revistos à mão: sem `enum`, `import type`, imports com `.ts`.

## 5. O que fica para outros (fora da minha área de escrita)

1. **`docs/decisoes.md`** (não está na minha lista). Decisões para registrar:
   - **Instante em ms desde 1970, não relógio monotônico.** O monotônico do React Native recomeça quando o app abre, e o app pode morrer no meio do descanso. Descartado: contador por tique (para com a tela bloqueada) e áudio em segundo plano (já descartado no iPhone). Mudaria se o relógio adiantado à mão virar queixa real.
   - **Sem descanso depois da última rodada.** Com 10 s de preparação, o Tabata dá 4:00. Descartado: 8 × (20 + 10), com um descanso final que ninguém usa. Mudaria se os alunos pedirem.
   - **O descanso não interrompe um intervalado.** Descartado: substituir sem perguntar, que apagaria um HIIT de 10 min por um toque na série.
   - **Até 24 avisos agendados.** Descartado: agendar tudo, porque o teto de 64 do iPhone é dividido com os lembretes.
2. **`app/package.json`**: a R9.13 (tela acesa) usa o `expo-keep-awake`. Ele já vem como dependência do `expo`, mas convém declarar (`npx expo install expo-keep-awake`).
3. **Agente G, tabela de avisos, linha 2**: o texto "Tempo da série terminado · Marque a série no app." contradiz a R9.10, pela qual a série por tempo **se marca sozinha** no fim. Sugestão: "Tempo da série terminado · Próximo descanso." A linha 3 (fim do cronômetro e troca de fase) já casa com o código: a troca de fase devolve `fim_do_cronometro`.
4. **Numeração**: o G e eu reservamos a faixa um do outro ao mesmo tempo. Fiquei com o que o G deixou para o cronômetro: H69–H76, seção 9, F9, letra I. O mapa de telas tem a Parte 4 (avisos, G) e a Parte 5 (cronômetro). Nenhum texto do G foi alterado.

## Arquivos

- Novos: `app/dominio/cronometro.ts`, `app/dominio/cronometro.test.ts`, `docs/revisao/H-CRONOMETRO.md`.
- Acrescentados: `01-especificacao/01-HISTORIAS.md` (seção I), `02-FLUXOS.md` (F9), `03-REGRAS.md` (seção 9) e `04-MAPA-DE-TELAS.md` (Parte 5).
- Editados: `02-design/sistema-de-design/` (`02-COMPONENTES.md`, `01-TOKENS.md`, `03-NAVEGACAO-E-LAYOUT.md`, `05-ACESSIBILIDADE.md`, `06-IPHONE.md`, `tokens.json`, `mockups/index.html`, `mockups/sistema.css`; capturas e `resultado.json` refeitos pela auditoria).
