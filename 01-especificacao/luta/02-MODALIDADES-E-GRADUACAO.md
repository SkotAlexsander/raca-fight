# 02 — Modalidades e graduação

> Agente AJ, P12, 15/10/2026. Para cada modalidade da Raça Fight: se tem graduação formal, quem a define, e o que o app precisa guardar. As fontes estão no fim de cada seção e reunidas em `07-PESQUISA-E-FONTES.md`. As regras que o app segue estão em `04-REGRAS.md`, seção 16.

## Resumo

| Modalidade | Graduação formal? | Quem define | No app |
|---|---|---|---|
| **Jiu-Jitsu** | **Sim, padronizada** | IBJJF (a CBJJ no Brasil segue o mesmo documento) | Sistema "IBJJF" pronto: faixas, graus, idade e tempo mínimos da federação |
| **Jiu-Jitsu Kids** | Sim | IBJJF (faixas de 4 a 15 anos, sem tempo mínimo; graus sugeridos em 3 modelos) | Sistema "IBJJF Kids" pronto; o modelo de graus é **[decidir]** L5 |
| **Muay Thai** | **Sim, mas sem padrão único no Brasil** | Cada confederação ou escola (há cerca de 20 entidades disputando a representação) | Sistema **da academia**, montado com o professor. **[decidir]** L3 |
| **Muay Thai Kids** | Depende da escola | idem | idem, com idade |
| **Luta Livre** (Esportiva) | Sim, parecida com a do jiu-jitsu e a do judô | Federação/Confederação de Luta Livre Esportiva; varia | Sistema da academia, partindo do modelo publicado. **[decidir]** L4 |
| **Boxe** | **Não** | No boxe a progressão é por categoria (idade, peso) e por luta, não por faixa | **Sem graduação.** Opcional: "níveis" da academia (iniciante, intermediário, avançado, competição), **[decidir]** L6 |
| **MMA** | **Não** | As regras unificadas tratam de rounds e de peso, não de faixa | **Sem graduação.** O aluno de MMA costuma ter a faixa do jiu-jitsu e o kruang do Muay Thai, cada um na sua modalidade |

Consequência para o desenho: **o app não pode ter a régua do jiu-jitsu escrita no código.** A graduação é um **dado** (o "sistema de graduação" de cada modalidade), e a academia escolhe um modelo pronto ou monta o seu. A modalidade sem graduação simplesmente não tem sistema (R16.1).

---

## 1. Jiu-Jitsu (IBJJF)

Fonte primária: **IBJJF, *General System of Graduation*, versão de junho de 2026** (PDF baixado em 15/10/2026 da página `ibjjf.com/graduation-system`). A versão de novembro de 2022, em português, está hospedada pela CBJJ. A de 2026 muda só a idade mínima da preta (18 anos para quem foi campeão mundial adulto na marrom).

### 1.1 Faixas a partir de 16 anos (Art. 1.2, 2.1.2, 3.1)

| Faixa | Idade mínima | Tempo mínimo nela antes da próxima (18 anos ou mais) | Graus |
|---|---|---|---|
| Branca | qualquer | sem mínimo | 4 |
| Azul | 16 | **2 anos** (1 ano se já foi cinza, amarela ou laranja; nenhum se já foi verde ou azul juvenil; nenhum se campeão mundial adulto na azul) | 4 |
| Roxa | 16 | **1 ano e meio** (1 ano se foi azul juvenil; nenhum nos casos do Art. 3.1.3 III c–e) | 4 |
| Marrom | 18 | **1 ano** (nenhum se campeão mundial adulto na marrom) | 4 |
| Preta | **19** (18 só para quem foi campeão mundial adulto na marrom) | 31 anos na preta até a vermelha e preta (período fixo, Art. 3.1.4) | **6** |
| Vermelha e preta (7º grau) | 49 | 7 anos | — |
| Vermelha e branca (8º grau) | 56 | 10 anos | — |
| Vermelha (9º grau) | 66 | — | — |

- Aos **16 e 17 anos** (juvenil), branca e azul não têm tempo mínimo; a roxa juvenil só passa a marrom na divisão adulta (Art. 3.1.2).
- **Os graus até a marrom são a critério do professor** (Art. 4.1.3). Na preta, os graus seguem tempos fixos: 1º, 2º e 3º após 3 anos cada; 4º, 5º e 6º após 5 anos cada (Art. 4.1.5).
- **O tempo conta a partir do registro da faixa na IBJJF** (Art. 3.2.1). O tempo que o app conta é o da graduação registrada **no app**: serve para a academia se organizar, não prova nada perante a federação (R16.7).
- **Quem gradua**: a filiação de branca a marrom precisa da assinatura de um professor faixa preta filiado; a graduação **à preta** só por faixa preta com pelo menos **2 graus** certificados (Art. 6.1, 6.2). O app não confere filiação; guarda quem graduou (R16.6).
- **A IBJJF não exige número de aulas.** Presença mínima é regra da academia, nunca da federação. Por isso o app separa "tempo mínimo da federação" de "presenças mínimas da academia" (R16.3).

### 1.2 Faixas de 4 a 15 anos (Art. 1.1, 2.1.1, 3.1.1, Anexo I)

Branca · cinza e branca · cinza · cinza e preta · amarela e branca · amarela · amarela e preta · laranja e branca · laranja · laranja e preta · verde e branca · verde · verde e preta.

| Grupo | Idade |
|---|---|
| Branca | qualquer |
| Cinza (3 faixas) | 4 a 15 |
| Amarela (3 faixas) | 7 a 15 |
| Laranja (3 faixas) | 10 a 15 |
| Verde (3 faixas) | 13 a 15 |

- **Sem tempo mínimo** em nenhuma faixa kids (Art. 3.1.1).
- A idade IBJJF é **ano atual − ano de nascimento** (Art. 2.2.1), não a idade no dia. O app calcula assim no sistema IBJJF (R16.5).
- Aos 16 anos, o aluno passa ao sistema adulto (Art. 2.2.3).
- **Graus kids**: a IBJJF sugere três modelos, a critério do professor (Anexo I): **trimestral** (3 graus por faixa, troca de faixa em 1 ano), **quadrimestral** (2 graus por faixa) e **mensal** (11 graus por faixa: 4 brancos, 4 vermelhos, 3 da cor da próxima faixa). **[decidir]** L5: qual a Raça Fight usa.

## 2. Muay Thai (prajied ou kruang)

**Não há um sistema único no Brasil.** Uma reportagem do Brasil de Fato (2017) conta que "cerca de 20 entidades reivindicam o status de representante do esporte no país", entre elas a Confederação Brasileira de Muaythai Tradicional (CBMTT), reconhecida pela WMC e pela IFMA, e a Confederação Brasileira de Muaythai (CBMT). Na Tailândia, tradicionalmente, não havia graduação: ela foi criada para o público de fora (o sistema "Khan", da Kru Muaythai Association, nos anos 1990). A graduação é um **cordão no braço** (prajied, também chamado kruang), não uma faixa na cintura.

Dois sistemas que aparecem em fonte pública:

| Sistema | Ordem |
|---|---|
| **Atribuído à CBMT** (texto informativo, não o regulamento) | branca · branca ponta vermelha · vermelha · vermelha ponta azul-clara · azul-clara · azul-clara ponta azul-escura · azul-escura (instrutor) · azul-escura ponta preta (instrutor master) · preta (professor) · preta e branca (mestre) · preta, branca e vermelha (grão-mestre) |
| **Khan** (Kru Muaythai Association; cada escola associa cores diferentes) | de 12 a 15 khans, por exame; as cores do prajied variam por escola |

**O cordão amarelo que aparece num post da Raça Fight (`raca-11`) não está na lista atribuída à CBMT.** Logo, a academia usa outro sistema (talvez um Khan, ou um próprio). Isso confirma que o sistema tem de vir **do professor de Muay Thai da academia**: a lista de cores em ordem, quantos graus (se houver), tempo e presenças. **[decidir]** L3. Até lá, o app tem o modelo "Kruang da academia" vazio, para preencher.

Também não se achou **tempo mínimo** publicado em nenhuma das duas fontes: ele é da escola.

Fontes: Brasil de Fato, 27/07/2017; Significados ("Muay Thai"); Kru Muaythai Association (história do Khan); sílabo de exemplo da Chao Phraya Muay Thai (Reino Unido), só como referência de como um Khan é descrito.

## 3. Luta Livre (Esportiva)

"Luta Livre", numa academia de jiu-jitsu e Muay Thai no Brasil, é quase sempre a **Luta Livre Esportiva** (luta de finalização sem kimono, criada por Euclydes Hatem no Rio). Ela é diferente da **luta olímpica** (wrestling, "luta livre olímpica"), que não tem faixas. Na grade da Raça Fight ela divide o horário com o Jiu-Jitsu e o cartaz põe o mesmo treinador nas duas: reforça que é a Esportiva. **[decidir]** L4 confirma.

- Há uma **Confederação Brasileira de Luta Livre Esportiva (CBLLE)**, fundada em 2017, e federações estaduais.
- A Wikipédia descreve uma graduação "modelada no jiu-jitsu e no judô": **branca, amarela, laranja** (iniciantes) · **azul** (intermediário) · **roxa, marrom, preta** (1º a 9º dan), **vermelha e branca** (10º). A própria página usa imagens de faixa de judô, e não se achou o regulamento da CBLLE: tratar como **modelo a confirmar** com o professor.

Fonte: Wikipédia, "Luta Livre" (consultada em 15/10/2026).

## 4. Boxe

O boxe **não tem graduação por faixa**. No boxe olímpico (AIBA, hoje World Boxing), o que organiza o atleta é a **categoria de idade e de peso**; o progresso aparece em lutas e títulos. Nenhuma das buscas achou sistema de graduação da Confederação Brasileira de Boxe (CBBoxe).

Algumas academias usam **níveis internos** (iniciante, intermediário, avançado, competição) para separar turmas e liberar o sparring. Se a Raça Fight quiser isso, é um sistema "Níveis do boxe" da academia, sem cor e sem grau. **[decidir]** L6.

Formato oficial dos rounds (usado no cronômetro, R17): elite masculino e feminino, **3 rounds de 3 min, 1 min de intervalo** (regra AIBA de 2016, mantida pelo World Boxing).

## 5. MMA

O MMA **não tem graduação**. As Regras Unificadas (Association of Boxing Commissions, versão 08/2026) definem rounds de **5 min com 1 min de intervalo**, 3 rounds em luta normal e 5 em luta de cinturão, e categorias de peso; nada de faixa. No app, o aluno de MMA tem a presença contada em "MMA" e a graduação, se tiver, nas modalidades de origem (jiu-jitsu, Muay Thai).

## 6. Tempo de luta por modalidade (para o cronômetro de rounds)

| Modalidade | Formato | Fonte |
|---|---|---|
| Muay Thai amador (IFMA, sênior) | 3 × 3 min, 1 min de intervalo | IFMA *Rules and Regulations*, rev. 30/08/2020, regra 3 |
| Muay Thai amador (IFMA, jovens) | rounds de 2 min (sub-23), 1,5 min (16–17 anos), 1 min (10–15 anos) | idem |
| Boxe olímpico (elite) | 3 × 3 min, 1 min de intervalo | AIBA 2016; World Boxing |
| MMA (regras unificadas) | 3 × 5 min (5 × 5 em cinturão), 1 min de intervalo | ABC, *Unified Rules of MMA*, 08/2026 |
| Jiu-Jitsu (luta IBJJF, adulto) | uma luta só: branca 5 min, azul 6, roxa 7, marrom 8, preta 10 | fontes secundárias (Gold BJJ, NAGA); o livro de regras da IBJJF não foi baixado. Conferir antes de publicar. |
| Luta Livre | sem formato oficial achado | — |

Na aula, o professor usa outros tempos (o "rola" de 5 min com 1 de troca, o round de saco de 2 min). Por isso as predefinições são **ponto de partida editável** (R17.2).

## 7. O modelo de graduação que serve a qualquer conjunto

Um **sistema de graduação** pertence a uma modalidade e a uma faixa de idade (adulto, kids). Ele tem:

| Campo | Exemplo (IBJJF adulto) | Exemplo (kruang da academia) |
|---|---|---|
| Nome | "Jiu-Jitsu — IBJJF adulto" | "Muay Thai — kruang da Raça Fight" |
| Palavra na tela para o nível | Faixa | Kruang (ou prajied, L3) |
| Palavra para a subdivisão | Grau | (nenhuma, se não tiver) |
| Idade do sistema | a partir de 16 | [decidir] |
| Como conta a idade | ano atual − ano de nascimento | idade no dia |
| Origem | "Modelo IBJJF, junho de 2026" | "Da academia" |
| **Níveis**, em ordem | branca, azul, roxa, marrom, preta… | branca, amarela, … (o professor diz) |

Cada **nível** tem: nome, de 1 a 3 cores (para desenhar: a faixa com a ponta, o cordão de duas cores), idade mínima, idade máxima (kids), **tempo mínimo nele** (meses, opcional), **presenças mínimas** desde a última graduação (opcional, **da academia**), número máximo de **graus**, regra dos graus (tempo e/ou presenças entre um e outro, opcional), e se a passagem ao próximo **exige exame**.

O que o app faz com isso (R16):
1. mostra a faixa atual de cada aluno, com os graus, em cada modalidade;
2. guarda o **histórico** (cada graduação com data e professor);
3. calcula se o aluno **atingiu os mínimos** (tempo, presenças, idade) e põe na lista "Prontos para avaliar" do professor. **Nunca gradua sozinho**: quem gradua é o professor;
4. organiza o **exame de graduação** (data, candidatos, resultado).

Os modelos prontos na primeira versão: **IBJJF adulto**, **IBJJF kids** (com o modelo de graus escolhido, L5) e **Luta Livre (modelo Wikipédia, a confirmar)**. Muay Thai e os níveis de boxe nascem **vazios**, para a academia preencher com o professor.
