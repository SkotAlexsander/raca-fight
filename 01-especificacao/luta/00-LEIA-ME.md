# Luta — a virada do Academia Plus para academia de luta

> Agente AJ, P12, 15/10/2026. Pedido do Alex: "Não é uma academia, é uma academia de luta… deixar com um aspecto de coisa de luta." Esta pasta diz o que fica, o que se adapta e o que sai do app que já existe, e especifica o que entra. Não mexe em `app/` nem em `02-design/`.

## A academia

| | |
|---|---|
| **Nome** | RAÇA FIGHT GRAVATAÍ (Instagram @racafightgravatai) |
| **Modalidades** | **Muay Thai · Boxe · Jiu-Jitsu · Luta Livre · MMA**, mais as turmas **Kids** de Muay Thai e de Jiu-Jitsu (a grade de horário real, `02-design/referencias/raca-fight/01-DADOS-REAIS.md`). Saíram do [decidir]. |
| **Aulas especiais** | **Sexta-feira OPEN** (20h às 22h, treino livre, sem turma fixa) e **Sábado, treino de competição** (10h às 12h, só atletas) |
| **Frase** | "Treine com disciplina, técnica e respeito" |
| **Porta de entrada** | Aula experimental **gratuita**, agendada **pelo WhatsApp** ("Agende pelo WhatsApp") |
| **Destaques do perfil** | Atletas · Treinos · Horários · Professores (viram nomes de áreas do app do aluno) |
| **Outras coisas do perfil** | o cordão (prajied) amarelo do Muay Thai; vídeos "Golpes básicos" e "Golpes de curta distância"; "Raça Responde" (perguntas frequentes); "Traga um amiguinho" (indicação com desconto para os dois); cartazes de luta ("[atleta] vs [atleta], 60 kg semi-pró", data e local); depoimentos |
| **Marca** | **vermelho `#C42024`, preto e branco** (o magenta da foto de perfil era o Outubro Rosa). Logo: "CENTRO DE TREINAMENTO", "RAÇA" grande, "FIGHT" dentro de uma faixa com ponta vermelha, "GRAVATAÍ". O design é da próxima onda (AL): aqui só se usa o tom e os nomes. |

**Nomes nos exemplos são fictícios.** Os nomes reais de professores e atletas que aparecem no Instagram só entram no app com a autorização de cada um (e, para menores, dos responsáveis).

### A grade real, que é o dado de exemplo das turmas

| Turma | Modalidade | Seg | Ter | Qua | Qui | Sex | Sáb |
|---|---|---|---|---|---|---|---|
| Muay Thai — manhã | Muay Thai | 09h | | 09h | | | |
| Muay Thai — noite 1 | Muay Thai | 20h | 20h | 20h | 20h | | |
| Muay Thai — noite 2 | Muay Thai | 21h | | 21h | | | |
| Boxe — manhã | Boxe | | 09h | | 09h | | |
| Boxe — noite | Boxe | | 21h | | 21h | | |
| Jiu-Jitsu / Luta Livre | Jiu-Jitsu **e** Luta Livre (R14.3) | 20h | | 20h | | | |
| MMA | MMA | | 20h | | 20h | | |
| Muay Thai Kids | Muay Thai | | 19h | | 19h | | |
| Jiu-Jitsu Kids | Jiu-Jitsu | 19h | | 19h | | | |
| **OPEN** | todas (aula aberta, R14.8) | | | | | 20h–22h | |
| **Treino de competição** | todas (só atletas, R14.9) | | | | | | 10h–12h |

A divisão em turmas ("noite 1" e "noite 2", "manhã") é a leitura do AJ do cartaz; o cartaz não diz se a aula das 20h e a das 21h são turmas diferentes (níveis?) ou a mesma turma em dois horários. **[decidir]** L1. Duração de cada aula: o cartaz não diz; o exemplo usa 60 min.

## Três aplicativos, um banco

Decisão do Alex comunicada pelo coordenador em 15/10/2026:

| App | Quem usa | Quem especifica |
|---|---|---|
| **Aluno** (o app atual, visão do aluno) | aluno e responsável por aluno menor | AJ (esta pasta) |
| **Equipe** (o app atual, visão da academia) | professor, recepção | AJ (esta pasta) |
| **Admin** (app separado, interface própria) | dono e, se o Alex quiser, um papel "administrativo" | AI (`01-especificacao/admin/`) |

Os três leem o mesmo backend (Supabase) e os mesmos dados. **O painel do dono sai da visão da equipe** e vai para o Admin. Na Equipe fica só o que o professor e a recepção usam no dia: aulas, presença, graduação dos alunos dele, avisos e a aula experimental.

## Arquivos

| Arquivo | O que tem |
|---|---|
| `01-INVENTARIO.md` | Cada peça da especificação, do domínio e das telas: **fica**, **adapta** ou **sai**, com contagem |
| `02-MODALIDADES-E-GRADUACAO.md` | As quatro modalidades, a graduação de cada uma com fonte, e o modelo de graduação que serve a qualquer sistema |
| `03-HISTORIAS.md` | Histórias novas, H115 a H162 |
| `04-REGRAS.md` | Regras novas, seções 14 a 22: turma e aula (14), presença (15), graduação (16), cronômetro de rounds (17), eventos e atletas (18), aula experimental e indicação (19), Kids (20), técnicas (21), avisos e perguntas frequentes (22) |
| `05-FLUXOS.md` | Fluxos novos, F17 a F25 |
| `06-MAPA-DE-TELAS.md` | O mapa novo do app do aluno e do app da equipe, e as abas |
| `07-PESQUISA-E-FONTES.md` | Como outros sistemas de academia de luta resolvem turma, check-in e graduação, e todas as fontes |
| `90-PERGUNTAS-PARA-O-ALEX.md` | As perguntas novas (L1…), cada uma com a recomendação |

Relatório da onda: `docs/revisao/AJ-LUTA.md`.

## Glossário: os nomes que os três apps usam

Os nomes abaixo valem para a especificação, o banco e a tela. Foram escolhidos para casar com a área do administrador (agente AI, escrita em paralelo): quando ele escrever `01-especificacao/admin/`, os dois lados usam a mesma palavra para a mesma coisa. Se o AI tiver escolhido outra palavra, vale a dele para o que é financeiro (plano, matrícula, mensalidade) e esta para o que é do tatame (turma, aula, presença, graduação).

| Nome | O que é | Dono do conceito |
|---|---|---|
| **Modalidade** | Muay Thai, Boxe, Jiu-Jitsu, Luta Livre, MMA. Lista da academia, não do app (R14.1). "Kids" não é modalidade: é o público da turma. | AJ, lida pelo AI |
| **Aula aberta** | Horário sem turma fixa e sem modalidade única (a "Sexta-feira OPEN"): qualquer aluno matriculado faz check-in (R14.8). | AJ |
| **Técnica** | Um vídeo curto da biblioteca de técnicas de uma modalidade ("Golpes básicos", "Golpes de curta distância"), R21. | AJ |
| **Luta** | Um combate marcado de um atleta da academia num evento ("[atleta] vs [adversário], 60 kg, semi-pró"), R18.4. | AJ |
| **Indicação** | O "Traga um amiguinho": um aluno indica um interessado; se ele se matricula, os dois ganham o desconto. A regra do desconto é do AI (R19.9). | AJ (o desconto é do AI) |
| **Pergunta frequente** | O "Raça Responde": pergunta e resposta escritas pela academia (R22.3). | AJ |
| **Turma** | Um grupo fixo de uma modalidade, com público, nível, professor e horários na semana ("Jiu-Jitsu Kids", "Muay Thai Iniciante — noite"). | AJ |
| **Horário** | Um dia da semana e uma hora de uma turma ("terça, 19:00, 60 min"). A **grade** é o conjunto dos horários. | AJ |
| **Aula** | Uma ocorrência de um horário numa data ("Jiu-Jitsu Kids de 21/10/2026, 18:00"). É nela que se registra a presença. | AJ |
| **Presença** | O registro de que um aluno esteve numa aula. Nasce por check-in do aluno, pela chamada do professor ou pela recepção (R15). | AJ |
| **Check-in** | O aluno dizendo "estou na aula" pelo app. Vira presença **confirmada** quando o professor fecha a chamada (R15.4). | AJ |
| **Chamada** | A lista da aula na mão do professor: confirma os check-ins e marca quem veio sem celular. | AJ |
| **Sistema de graduação** | A régua de uma modalidade: as faixas (ou kruangs, ou níveis) em ordem, os graus de cada uma, idade e tempo mínimos (R16). | AJ |
| **Faixa** | Um nível da régua. No Muay Thai a palavra na tela é **kruang** (ou **prajied**, [decidir] L3); Boxe e MMA não têm (R16.9). No dado o nome é `nivel`. | AJ |
| **Atleta** (marca) | Aluno da equipe de competição numa modalidade, marcado pelo professor: libera o treino de competição (R14.9). Diferente da área pública "Atletas", que pede consentimento (R18.6). | AJ |
| **Grau** | A subdivisão de uma faixa (os "graus" ou "listras" do jiu-jitsu: 0 a 4 até a marrom, 0 a 6 na preta). | AJ |
| **Graduação** | O registro de que um aluno passou a uma faixa ou a um grau, numa data, por um professor. O histórico é a lista delas. | AJ |
| **Exame de graduação** | Um dia marcado em que vários alunos são avaliados e graduados juntos. Pode ter taxa (financeiro: AI). | AJ (a taxa é do AI) |
| **Evento** | Data da academia ou de fora: exame, seminário, aulão, campeonato. | AJ (a cobrança de inscrição é do AI) |
| **Atleta** | Aluno que compete e aceitou aparecer na área **Atletas** com os resultados dele (R18.6). | AJ |
| **Interessado** | Quem ainda não é aluno e quer conhecer. Tem nome, WhatsApp e a modalidade de interesse. | AJ (a conversão em matrícula é do AI) |
| **Aula experimental** | A primeira aula grátis de um interessado, numa aula de verdade de uma turma (R19). | AJ |
| **Professor** | Na tela, "Professor". No dado continua o papel `instrutor` (decisão de 11/10: "Professor é o `instrutor`; não há papel novo"). | AJ e AI |
| **Recepção** | Papel `recepcao`: check-in no balcão, aula experimental, aviso. | AJ; o que ela pode no financeiro é do AI |
| **Dono** | Papel `dono`: abre o **Admin**. Se também dá aula, é professor das turmas dele e usa a Equipe como professor. | AI; AJ só para o que é de professor |
| **Plano** | O que o aluno contrata e paga (por modalidade, combo ou livre). Diz **de quais modalidades** o aluno pode fazer check-in (R14.6). | **AI** |
| **Matrícula** | O aluno ligado a um plano, com início e situação. É ela que libera o aluno a fazer check-in. | **AI** |
| **Mensalidade** | A cobrança mensal da matrícula. | **AI** |
| **Responsável** | A conta adulta que cuida de um aluno menor (o **dependente**), R20. É ela que entra no app; o menor não tem conta própria na v1. | AJ e AI (quem paga) |

Palavras que **saem** do app na tela do aluno e do professor: treino A/B/C, série, carga, repetição, volume, exercício (da biblioteca), treino pronto, Modo treino com séries, "personal" (até o [decidir] L12). A palavra **treino** fica, no sentido de luta ("Treinos" = as aulas que fiz, o destaque do Instagram).

## Como ler o que já existe

- A especificação antiga (`01-especificacao/00` a `90`) **não foi apagada nem reescrita**. O inventário diz o destino de cada parte. Quem construir segue esta pasta; o que ela não menciona continua como estava.
- Numeração: histórias continuam de H115, regras da seção 14, fluxos de F17. Nada antigo foi renumerado.
- **[decidir]** marca o que é do Alex. A lista está em `90-PERGUNTAS-PARA-O-ALEX.md`. Ninguém resolve um [decidir] por conta própria.
