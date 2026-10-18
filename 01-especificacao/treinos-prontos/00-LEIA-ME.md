# Treinos prontos: o catálogo-modelo

> Agente S, 10/10/2026. Pedido do Alex: "os modelos de treinos já pré-prontos também" têm que fazer sentido.

## Antes de tudo: é um modelo

- **Nenhum destes treinos vai para o aluno sem revisão.** Quem revisa e assina é um profissional de Educação Física com registro no CREF. Montar e orientar programa de exercício é atividade dele (Lei 9.696/1998). **[decidir]** quem revisa: o profissional da primeira academia cliente ou um consultor contratado pelo Alex.
- **A academia pode editar, substituir ou apagar** qualquer programa. Isso já está nas regras: o treino pronto é da biblioteca da academia (R1.2, R1.4), e o funcionário edita pela tela "Editar treino pronto".
- **A carga fica em branco** em todo exercício com aparelho ou halter (R1.14: vazio = "sem carga definida"). Quem define é o instrutor com o aluno. Só os exercícios com o peso do corpo têm carga 0.

## O que tem aqui

| Arquivo | Programa | Objetivo | Nível | Dias/semana | Minutos |
|---|---|---|---|---|---|
| `01-primeiros-passos.md` | Primeiros passos | Começar a treinar · Manter | Iniciante | 2 | 25 |
| `02-full-body-3x.md` | Full body 3× | Começar a treinar · Ganhar massa | Iniciante | 3 | 35 |
| `03-abc-hipertrofia.md` | ABC Hipertrofia | Ganhar massa | Intermediário | 3 | 40 |
| `04-superior-inferior-4x.md` | Superior e inferior 4× | Ganhar massa | Intermediário | 4 | 40 |
| `05-empurrar-puxar-pernas.md` | Empurrar, puxar e pernas | Ganhar massa | Avançado | 6 | 45 |
| `06-circuito-30.md` | Circuito 30 | Perder peso · Condicionamento | Iniciante | 3 | 30 |
| `07-forca-e-caminhada.md` | Força e caminhada | Perder peso · Manter | Iniciante | 3 | 35 |
| `08-folego-3x.md` | Fôlego 3× | Condicionamento | Intermediário | 3 | 35 |
| `09-intervalado-25.md` | Intervalado 25 | Condicionamento · Perder peso | Intermediário | 2 | 25 |
| `10-corpo-em-dia.md` | Corpo em dia | Manter | Intermediário | 2 | 45 |
| `11-treino-em-casa.md` | Treino em casa | Começar a treinar · Condicionamento · Manter | Iniciante | 3 | 30 |

Cada objetivo tem pelo menos dois programas. Os rótulos dos objetivos ("Perder peso", "Começar a treinar", "Manter") seguem a proposta do tom de voz e continuam **[decidir]** (tabela do P00). As chaves no dado são as da lista fixa (R2.1).

O dado de verdade fica em `app/dominio/catalogo/`:

- `treinos-prontos.json`: os 11 programas, com dias, exercícios, séries, repetições ou tempo e descanso, todos em inteiros (R7);
- `exercicios.json`: os 28 exercícios que eles usam (R4.1), com a ilustração de cada um quando existe;
- `catalogo.test.ts`: monta cada programa com as funções de `treino.ts` e confere as regras. Para rodar: `node --test "dominio/**/*.test.ts"` dentro de `app/`.

Os `.md` deste diretório são gerados do JSON. Se mudar o JSON, gere de novo; não edite os `.md` à mão.

## Critérios

1. **Frequência.** Força para todos os grandes grupos **2 vezes por semana ou mais** (OMS 2020; ACSM 2026). Por isso nenhum programa de força tem menos de 2 dias, e os de 1 ou 2 divisões repetem a divisão na semana.
2. **Nível muda o volume.**
   - Iniciante: 2 a 3 séries de 10 a 15 repetições, máquinas primeiro e corpo todo em cada treino (ACSM 2009: 8 a 12 RM, 2 a 3 dias, corpo todo).
   - Intermediário: 3 a 4 séries de 8 a 12 repetições, divisão em 3 ou 4 dias.
   - Avançado: 4 a 5 séries; os exercícios pesados com 5 a 8 repetições, de 4 a 6 dias.
   - Nos programas de "Ganhar massa" de nível intermediário ou avançado, peito, costas e coxa ficam **entre 10 e 20 séries diretas por semana**. A ACSM 2026 vê ganho maior a partir de 10 e retorno menor perto de 18 a 20. Exemplos: ABC com peito 10 e costas 10; Superior e inferior com peito 10 e costas 14; Empurrar, puxar e pernas, nas duas voltas, com peito 20 e quadríceps 20.
3. **Ordem dentro do dia.** Primeiro o aquecimento de 5 min. Depois os grandes grupos antes dos pequenos, o composto antes do isolado e o pesado antes do leve (ACSM 2009). Abdômen e cardio de volta à calma ficam no fim. O teste confere que nenhum exercício isolado vem antes de um composto do mesmo grupo.
4. **Descanso.**
   - Composto pesado (5 a 8 repetições): de 2 a 3 min.
   - Composto moderado: 90 s.
   - Isolado: 60 s.
   - Abdômen: 45 s.
   - Circuito: 20 s entre os exercícios.

   A ACSM 2026 não achou diferença de força entre descanso curto e longo, então os tempos servem para o treino caber na hora e o aluno não pular série.
5. **Sem ir até a falha.** A orientação é parar com 2 ou 3 repetições sobrando (1 a 2 no avançado). A ACSM 2026 não achou ganho extra na falha e desaconselha para parte do público. É o texto de "Como progredir" em cada programa.
6. **Intervalado.** O HIIT usa as predefinições do Cronômetro (R9.6): HIIT 30/30 × 10, HIIT 40/20 × 8 e Tabata 20/10 × 8. Cada rodada entra como uma série por tempo (R1.14), e o descanso dela é a parte leve. Nunca em dias seguidos.
7. **Perder peso.** Os programas de "Perder peso" juntam força e cardio moderado. Com caminhada nos outros dias, a semana fecha os 150 a 300 min de atividade moderada que a OMS recomenda. Nenhum texto fala em "queimar" ou "secar" (tom de voz).
8. **Duração honesta.** A duração de cada dia é a estimativa do próprio domínio (`estimarDuracaoDoDia`), arredondada a 5 min. O teste reprova se a duração declarada se afastar mais de 20 % dela.
9. **Nomes da sala.** Os exercícios têm o nome usado em academia brasileira ("Puxada frontal", "Cadeira extensora", "Mesa flexora", "Stiff", "Leg press 45°", "Tríceps corda"). As ilustrações são do agente R. Os 12 exercícios ainda sem desenho estão em `docs/revisao/S-TREINOS-E-IMAGENS.md`, nas pendências.

## Fontes

- Currier BS, D'Souza AC, Fiatarone Singh MA et al. **American College of Sports Medicine Position Stand. Resistance Training Prescription for Muscle Function, Hypertrophy, and Physical Performance in Healthy Adults: An Overview of Reviews.** *Med Sci Sports Exerc.* 2026;58(4):851–872. doi:10.1249/MSS.0000000000003897. https://pmc.ncbi.nlm.nih.gov/articles/PMC12965823. O que se usou:
  - 2 sessões por semana ou mais;
  - 2 a 3 séries por exercício para força;
  - 10 séries por semana ou mais para hipertrofia, com retorno menor perto de 18 a 20;
  - descanso sem efeito sobre a força;
  - a falha não é necessária;
  - o exercício de força vai no começo do treino.
- ACSM (Ratamess NA et al.). **Progression Models in Resistance Training for Healthy Adults.** *Med Sci Sports Exerc.* 2009;41(3):687–708. O que se usou:
  - iniciante com 8 a 12 RM, 2 a 3 dias por semana;
  - intermediário com 3 a 4 dias; avançado com 4 a 6;
  - ordem grande → pequeno e composto → isolado;
  - resistência com 15 repetições ou mais e descanso abaixo de 90 s.

  PDF: https://sfu.ca/~ryand/kin343/ACSMresistance.pdf
- Bull FC, Al-Ansari SS, Biddle S et al. **World Health Organization 2020 guidelines on physical activity and sedentary behaviour.** *Br J Sports Med.* 2020;54(24):1451–1462. doi:10.1136/bjsports-2020-102955. https://pmc.ncbi.nlm.nih.gov/articles/PMC7719906. O que se usou:
  - adultos: 150 a 300 min por semana de atividade moderada (ou 75 a 150 de vigorosa);
  - força em todos os grandes grupos, 2 dias por semana ou mais;
  - acima de 65 anos: atividade com equilíbrio e força, 3 dias ou mais.
- Ministério da Saúde. **Guia de Atividade Física para a População Brasileira** (2021, com a OPAS e a UFPel). https://www.paho.org/pt/noticias/30-6-2021-ministerio-da-saude-do-brasil-lanca-guia-atividade-fisica-para-populacao. É a mesma base da OMS, na versão brasileira.
- **Lei 9.696/1998**, que regulamenta a profissão de Educação Física e cria o sistema CONFEF/CREF. https://www.planalto.gov.br/ccivil_03/leis/l9696.htm

## O que o catálogo não resolve

- **Pessoa com restrição, lesão, gestação, doença crônica ou acima de 65 anos** precisa de avaliação antes de qualquer programa. O app já guarda as restrições (R6.1), mas não filtra treino por elas. **[decidir]** se a tela "Usar este treino" mostra um aviso para quem informou restrição.
- **O circuito não existe no domínio.** O app mostra exercício por exercício (série 1, 2, 3 e o próximo). O "faça uma volta de cada" do Circuito 30 vai no texto do dia (`observacao`). Se a academia quiser que o app conduza a volta, é uma regra nova (agrupar exercícios). Fica como pendência para o Alex.
- **A estimativa de duração não conta** o tempo de ajustar o banco ou de esperar um aparelho. Na sala, conte de 5 a 10 min a mais.
