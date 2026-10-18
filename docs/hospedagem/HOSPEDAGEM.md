# Hospedagem e custo: onde o sistema da Raça Fight fica guardado

*Preços consultados em 15/10/2026. Dólar do dia: R$ 5,0521 (PTAX do Banco Central). Somando o IOF de 3,5% da compra no cartão, cada US$ 1 custa **R$ 5,23**. Os números em reais estão neste câmbio. Se o dólar mudar, a conta muda junto.*

## Em uma frase

Os três apps (o do aluno, o do professor e o seu) usam **um banco de dados só, guardado em São Paulo**. Na nossa recomendação, ele custa **cerca de R$ 162 por mês**. Somando as contas anuais das lojas e do domínio, dá **uns R$ 2.500 por ano**, ou cerca de **R$ 209 por mês em média**.

## O que a academia paga, e para quem

| O quê | Para que serve | Quanto | Quando |
|---|---|---|---|
| **Supabase Pro**, em São Paulo | O banco de dados, o login, as fotos e a atualização na hora entre os três apps | US$ 25 (R$ 131) | todo mês |
| Máquina um tamanho acima (Small) | Folga para o sistema não ficar lento, e é o que permite ligar a "volta no tempo" depois | US$ 5 a mais (R$ 26) | todo mês |
| Cópia externa diária, guardada 30 dias | Uma segunda cópia, fora do banco, também em São Paulo | até US$ 1 (R$ 5) | todo mês |
| Conta Apple Developer | Publicar o app na loja do iPhone | US$ 99 (R$ 518) | todo ano |
| Conta Google Play | Publicar o app na loja do Android | US$ 25 (R$ 131) | uma vez só |
| Domínio `.com.br` (Registro.br) | O endereço próprio, por exemplo `racafight.com.br`, que também envia os e-mails | R$ 40 | todo ano |
| Gerar o app (EAS Build, plano grátis) | Montar o app para as duas lojas | R$ 0 | — |
| Avisos no celular (Expo) | Lembrete de aula, aviso da academia, cobrança | R$ 0 | — |
| E-mail de cadastro e de senha (Resend, plano grátis) | Confirmar cadastro e trocar senha (até 3.000 e-mails por mês) | R$ 0 | — |

## Três degraus

| | **Começar** | **Recomendado** ✔ | **Crescer** |
|---|---|---|---|
| Para quem | 1 academia, ~150 alunos | a Raça Fight hoje (150 a 300 alunos) | ~500 alunos ou 2 unidades |
| Banco em São Paulo, criptografado | sim | sim | sim |
| Cópia de segurança automática | 1 por dia, guardada 7 dias | 1 por dia por 7 dias **+ cópia própria por 30 dias** | volta a **qualquer minuto** dos últimos 7 dias **+ cópia própria por 30 dias** |
| Se der problema, perde no máximo | 1 dia de lançamentos | 1 dia de lançamentos | ~2 minutos |
| Folga de máquina | básica (1 GB) | dobro (2 GB) | dobro (2 GB) |
| **Por mês** | **R$ 131** (US$ 25) | **R$ 162** (US$ 31) | **R$ 685** (US$ 131) |
| **Por ano** (com Apple e domínio) | **R$ 2.126** | **R$ 2.503** | **R$ 8.777** |
| **Primeiro ano** (com o Google Play) | R$ 2.257 | R$ 2.633 | R$ 8.908 |

**O que recomendamos é o do meio.** Ele custa só R$ 31 a mais por mês que o Começar e resolve o ponto fraco dele. A cópia automática do Começar só guarda 7 dias. Se alguém apagar um lançamento e você só perceber 15 dias depois, não tem mais volta. Com a cópia própria de 30 dias, tem.

O Crescer custa cinco vezes mais por causa de um item: a "volta no tempo", de US$ 100 por mês. Ela só compensa quando perder um dia de lançamentos fica caro, ou seja, com muita gente lançando ao mesmo tempo, em duas unidades. Ela pode ser ligada pelo painel quando chegar esse momento, sem mudar nada no app.

**Por que não o plano grátis?** O Supabase tem um plano gratuito, mas ele **pausa o sistema depois de uma semana sem uso** e **não faz cópia de segurança nenhuma**. Serve para testar, não para guardar o financeiro de uma academia.

## As alternativas que olhamos

| Opção | Preço de partida por mês | Por que não é a escolha |
|---|---|---|
| **Supabase Pro em São Paulo** ✔ | US$ 25 | É o que o app já usa. Já vem com banco, login, fotos e aviso entre os apps, e as regras de quem vê o quê ficam dentro do próprio banco. |
| Amazon (AWS RDS) em São Paulo | ~US$ 55 (máquina de 2 GB + disco) | O banco é excelente e guarda cópias por até 35 dias. Mas é **só o banco**: login, fotos e aviso entre os apps teriam de ser construídos à parte. Sai mais caro em mensalidade e em trabalho. |
| Neon (tem São Paulo) | cobra por uso | Também é só o banco. O armazenamento de arquivos ainda não existe em São Paulo. |
| Provedor brasileiro (Magalu Cloud) | não confirmado | Tem banco gerenciado com dado no Brasil, mas o preço não está publicado de forma legível. E também seria só o banco. |
| Servidor próprio (VPS, por exemplo Hostinger) | R$ 30 a R$ 60 | Parece barato, mas **alguém tem de cuidar dele toda semana**: aplicar correção de segurança, testar a cópia, vigiar invasão, trocar o disco cheio. A cópia que vem inclusa é semanal, e não há data center no Brasil anunciado. Para dado financeiro e de criança, o barato sai caro. |

## A segurança, em linguagem simples

- **O dado fica no Brasil.** O banco é criado na região de São Paulo (Amazon, `sa-east-1`), e a cópia externa também fica lá.
- **Ele fica trancado.** Tudo é guardado criptografado (padrão AES-256) e viaja criptografado entre o celular e o servidor. Quem roubasse o disco não leria nada.
- **Tem cópia de segurança.** Uma por dia, guardada 7 dias pelo próprio Supabase. No Recomendado, mais uma cópia nossa, também em São Paulo, guardada 30 dias. As fotos ficam fora dessas cópias, mas o que importa (alunos, pagamentos, presença) está nelas.
- **A "volta no tempo"** (no Crescer) devolve o sistema exatamente como estava num minuto escolhido. Vale quando um erro grande precisa ser desfeito sem perder o resto do dia.
- **A sua entrada pede duas chaves.** Para abrir o app do dono, você vai digitar a senha e um código de 6 números que muda a cada 30 segundos, gerado num app do seu celular. Mesmo que alguém descubra a senha, não entra. O painel técnico do Supabase, por onde se mexe no banco, também vai exigir as duas chaves de todo mundo que tiver acesso. Isso não custa nada a mais.
- **Fica registrado quem mexeu.** O app do dono guarda o histórico de cada alteração: quem mexeu, quando e o que mudou. Ninguém apaga um pagamento sem deixar rastro.
- **Cada um vê só o que é dele.** O aluno vê os próprios dados, o professor vê o que precisa para dar aula, e só o dono vê o financeiro. Essa regra fica no banco, não só na tela.

## O que a LGPD pede da academia

A academia é a **dona dos dados** dos alunos. O Supabase só os guarda para ela.

1. **Uma pessoa de contato para privacidade** (o "encarregado"). Pode ser o próprio dono ou alguém da recepção, com um e-mail público para os alunos. Empresa pequena às vezes é dispensada desse nome, mas dado de criança costuma tirar a dispensa. Por isso recomendamos ter.
2. **Contrato com o fornecedor.** O Supabase oferece um contrato de tratamento de dados (DPA). Esse contrato foi escrito para a lei europeia e não cita a LGPD. O dado fica em São Paulo, mas a empresa é de fora do país. **Vale um advogado olhar antes de pôr os dados reais.**
3. **Criança só com o responsável.** Nas turmas Kids, o cadastro é feito e autorizado por um dos pais ou pelo responsável, que vê e pode apagar os dados da criança. Foto de menor só com autorização escrita.
4. **Pedir só o necessário** e apagar os dados quando o aluno pedir. O app já prevê o apagar conta.

## Duas contas diferentes

- **Infraestrutura**: é tudo o que está nesta página. É o que a academia paga todo mês e todo ano aos fornecedores, quase tudo em dólar no cartão.
- **Desenvolvimento e manutenção**: construir o app, corrigir, atualizar, montar a cópia externa e acompanhar o sistema. **É outra conta, a combinar com o Alex.** Ela não está em nenhum número acima.

## A decidir com a academia

- Em nome de quem ficam as contas: Supabase, Apple, Google e domínio. Da academia (com CNPJ) ou do Alex?
- Quem será o encarregado de privacidade.
- Quando ligar a "volta no tempo".
