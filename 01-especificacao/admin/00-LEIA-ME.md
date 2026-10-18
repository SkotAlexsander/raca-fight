# Admin: a área do dono

> Agente AI, P12, 15/10/2026. Pedido do Alex: "uma nova etapa, a parte do ADM… hoje eles anotam tudo numa planilhazinha… controle total de quantas pessoas estão cadastradas, quantos funcionários… uma opção de anotar, tipo um Excel mesmo, de poder anotar valores, de calcular quanto está ganhando por mês… o admin é a parte mais importante e a primeira a ser entregue."
>
> Depois, pelo coordenador, também do Alex: "um local totalmente diferente… um app muito específico só dele, tanto que a interface seria diferente também, mas conectado"; "realmente bem completo e bem profundo", com filtro total, um lugar para anotar e lembrar, e o histórico de tudo.

## Em uma frase

O **Admin** é o terceiro aplicativo do Academia Plus. É do dono, tem a interface própria (densa, de organização, feita para o PC e que também serve no celular) e usa o mesmo banco dos outros dois. Ele **substitui a planilha com folga**: mostra e calcula o que ela mostra e calcula, e faz o que ela não faz (mensalidade gerada sozinha, inadimplência, funil da aula experimental, lembretes, histórico).

## Três aplicativos, um banco

| App | Quem usa | Interface | Especificação |
|---|---|---|---|
| **Aluno** | aluno, e o responsável pelo aluno Kids | celular, a linguagem aprovada (vidro, foto, um destaque por tela) | `01-especificacao/luta/` (AJ) |
| **Equipe** | professor, recepção | celular, a mesma linguagem | `01-especificacao/luta/` (AJ) |
| **Admin** | dono (e, se o Alex quiser, um papel "administrativo") | **PC primeiro** (o Alex revisa em 2040 × 790), depois celular; densa, tabelas, filtros, atalhos de teclado | **esta pasta** |

Os três leem e escrevem no **mesmo Supabase**, com as **mesmas tabelas** e a regra de acesso no banco (RLS). O painel do dono **sai** da visão da equipe e vem para cá. A arquitetura (onde fica no repositório e por quê) está em `03-arquitetura/05-ADMIN.md`.

## A academia

**Raça Fight Gravataí** (@racafightgravatai). Av. Alexandrino de Alencar, 593, Gravataí (RS).

- Modalidades: Muay Thai, Boxe, Jiu-Jitsu, Luta Livre e MMA.
- Turmas Kids: Muay Thai Kids e Jiu-Jitsu Kids.
- Aulas especiais: a Sexta OPEN e o Sábado de competição.
- Aula experimental grátis, agendada pelo WhatsApp (51) 98196-2077.
- Marca: vermelho `#C42024`, preto e branco.

Os dados reais estão em `02-design/referencias/raca-fight/01-DADOS-REAIS.md`. Nos exemplos, **os nomes de pessoas são fictícios**. Os professores e atletas reais só entram com autorização deles. **Os valores também são de exemplo**, porque os preços da academia ainda não chegaram.

## Arquivos

| Arquivo | O que tem |
|---|---|
| `01-PESQUISA-E-FONTES.md` | O que um dono de academia de luta controla, o que Tecnofit, Next Fit, Zen Planner e Gymdesk oferecem, a lei da multa e dos juros, o CSV no Excel e a segurança do arquivo, com as fontes |
| `02-HISTORIAS.md` | Histórias HA1 a HA46 |
| `03-REGRAS.md` | Regras RA1 a RA13, citadas no código (`app/dominio/financeiro/`) |
| `04-FLUXOS.md` | Fluxos FA1 a FA10 |
| `05-MAPA-DE-TELAS.md` | As telas do Admin, no PC e no celular |
| `90-PERGUNTAS-PARA-O-ALEX.md` | As perguntas A1 a A24, cada uma com recomendação |

O modelo de dados está em `03-arquitetura/01-MODELO-DE-DADOS.md`, seções 26 a 41. O domínio, com os testes, está em `app/dominio/financeiro/`. O relatório da onda é `docs/revisao/AI-ADMIN.md`.

## Os nomes (alinhados com a especificação de luta)

O glossário completo está em `01-especificacao/luta/00-LEIA-ME.md`. Ele vale para tudo o que é do tatame (turma, aula, presença, graduação, evento, luta). Esta pasta é dona dos nomes do dinheiro:

| Nome | O que é |
|---|---|
| **Modalidade** | Da academia, não do app (R14.1). A Raça Fight tem cinco. "Kids" é o público da turma, não uma modalidade. |
| **Plano** | O que se contrata e se paga: por modalidade ("Muay Thai 2×"), combo ("Combo 2 modalidades"), livre ("Jiu-Jitsu / Luta Livre"), Kids ("Muay Thai Kids") ou gratuito ("Aula experimental"). O plano diz de quais modalidades o aluno pode fazer check-in (R14.6). |
| **Matrícula** | Uma pessoa ligada a um plano, com início, dia de vencimento, descontos e situação (ativa, trancada ou encerrada). É ela que gera a mensalidade. |
| **Pagador** | Quem paga a matrícula. No Kids é o **responsável**. Na matrícula de adulto, é a própria pessoa. Mesmo pagador quer dizer mesma família. |
| **Cobrança** | O que alguém deve: a mensalidade, a taxa de matrícula, um exame de graduação, a inscrição num evento ou um produto. O que fica guardado é aberta, paga ou cancelada. Se está atrasada, **a conta diz**. |
| **Lançamento** | Uma linha da planilha: data, descrição, categoria, entrada ou saída, valor, forma de pagamento, pessoa, pago ou pendente. |
| **Categoria** | Para que serve a linha (Mensalidades, Aluguel, Luz…). O dono edita. |
| **Despesa fixa** | Aluguel, salário, luz, internet. Vira uma linha pendente todo mês, sozinha. |
| **Fechamento** | A foto do mês, guardada. O mês fechado trava as linhas dele. |
| **Matriculado** | Pessoa com matrícula ativa. **Não é** o "aluno ativo" do R8.5, que é quem treinou nos últimos 30 dias. A tela usa as duas palavras, cada uma no seu lugar. |
| **Inadimplente** | Quem tem cobrança vencida e não paga. |
| **Interessado** e **aula experimental** | Os do R19 (AJ). O Admin vê o funil e faz a matrícula. |
| **Nota**, **lembrete**, **tarefa** | O "anotar e lembrar" do dono (RA12). |
| **Histórico** | Quem mudou o quê, e quando (RA9). |

**Funcionário** (Admin) não é o mesmo que **papel** (app). O cadastro do Admin diz a função de cada pessoa (professor, recepção, limpeza, administrativo) e quanto ela ganha. O papel no app (`instrutor`, `recepcao`, `dono`) diz o que ela abre. Um professor sem o app continua no cadastro. E quem tem o papel `instrutor` aparece como professor.

## O que já está decidido e o que é [decidir]

**Decidido pelo Alex**:
- é academia de luta;
- o Admin é a primeira entrega;
- o Admin é um app separado e conectado;
- a planilha atual tem de caber nele.

**Proposto aqui**, valendo até o Alex dizer outra coisa:
- o regime de caixa no resultado;
- a lista de categorias inicial;
- o combo repartido em partes iguais entre as modalidades;
- a recusa do pagamento parcial;
- CSV como exportação da v1.

Cada proposta tem o motivo em `03-REGRAS.md`.

**[decidir]**: a lista está em `90-PERGUNTAS-PARA-O-ALEX.md`. Os itens que mexem no código entram nas funções como **parâmetro obrigatório**, sem valor padrão. Assim nenhum código escolhe pelo Alex. São eles:
- a regra do primeiro mês;
- a multa e os juros;
- o prazo do retorno da aula experimental;
- o desconto da indicação;
- o prazo para apagar o interessado.
