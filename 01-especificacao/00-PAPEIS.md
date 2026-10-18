# 00 — Papéis

Este arquivo diz quem usa o Academia Plus, o que cada um vê e o que cada um pode fazer.
É a base dos outros arquivos desta pasta: toda história, fluxo e tela cita um destes papéis.

## A ideia em três linhas

- Uma **conta** é uma pessoa (e-mail ou telefone + senha).
- Um **vínculo** liga a conta a uma academia com um **papel**. A mesma pessoa pode ter mais de um vínculo (aluno e instrutor na mesma academia, por exemplo).
- O **papel** do vínculo escolhido ao entrar decide a **visão** (aluno ou academia). Quem tem dois papéis troca de visão por um botão no perfil, sem sair da conta.

**[decidir]** Uma academia só · Várias academias — se forem várias, a conta pode ter vínculos em academias diferentes e escolhe a academia e o papel ao entrar; se for uma só, a escolha é apenas do papel.

## Os papéis

### 1. Aluno

Quem treina. Entra na **visão do aluno**.

- Monta treino livre, escolhe treino pronto por objetivo, registra o treino do dia, vê o próprio histórico.
- Pode (não precisa) preencher o cadastro corporal: peso, altura, data de nascimento, objetivo, restrições, frequência que pretende treinar.
- Decide se a academia enxerga o cadastro corporal dele (autorização ligada por padrão ao se vincular, pode ser desligada a qualquer hora).
- Pode assinar o Plus.

### 2. Aluno Plus

É um **aluno com a assinatura Plus ativa**. Não é outro papel: é um estado da conta do aluno. Tudo que o aluno faz, ele faz. Além disso:

- Tem um **personal** designado que monta e ajusta o treino e a dieta dele.
- Vê o plano de dieta, marca as refeições feitas no dia.
- Conversa com o personal. **[decidir]** Chat dentro do app · Botão que abre o WhatsApp do personal.
- Ao assinar, autoriza o personal a ver o cadastro corporal e o histórico de treino (sem isso o personal não consegue trabalhar — a autorização é condição do Plus).

### 3. Funcionário (recepção e instrutor de sala)

Quem trabalha na academia e atende aluno no dia a dia. Entra na **visão da academia**.

- Vê a lista de alunos vinculados à academia e abre o perfil de cada um (só vê dado corporal de quem autorizou).
- Monta um treino para um aluno direto no perfil dele. O treino aparece para o aluno como "montado pela academia".
- Cria e edita os **treinos prontos** da academia (a biblioteca que o aluno filtra por objetivo).
- Vincula um aluno novo à academia (recepção) e confirma vínculo pedido pelo aluno.
- Não vê dieta, conversa nem nada do Plus de aluno nenhum.

Recepção e instrutor são o mesmo papel na v1. Se um dia precisarem de permissões diferentes, separam-se depois (ver `05-FORA-DA-V1.md`).

### 4. Personal

Profissional que acompanha os alunos Plus. Entra na **visão da academia**, com uma aba a mais ("Meus alunos Plus").

- Tudo que o funcionário faz (é um funcionário da academia com uma atribuição extra).
- Vê **só os alunos Plus designados a ele**: cadastro corporal, histórico de treino, treino atual, dieta, conversa.
- Monta e ajusta o treino do aluno Plus.
- Monta e ajusta o plano de dieta do aluno Plus. **[decidir]** Escreve a dieta em texto livre · Monta a dieta a partir de um banco de alimentos com calorias e macros.
- Conversa com o aluno Plus.
- Não vê alunos Plus de outro personal.

Na v1, o personal é alguém da academia (a academia o cadastra como personal). Personal de fora, que não trabalha na academia, é pergunta aberta (ver `90-PERGUNTAS-PARA-O-ALEX.md`).

### 5. Dono

Quem é responsável pela academia. Entra na **visão da academia**, com a aba "Academia" a mais.

- Tudo que o funcionário faz.
- Cadastra e remove funcionários e personais; define quem é personal.
- Designa qual personal cuida de qual aluno Plus (e pode trocar).
- Vê a academia em números: alunos ativos, assinantes Plus, treinos registrados por semana, alunos sem treinar há mais de X dias. Só números agregados; dado corporal individual ele vê como qualquer funcionário (só de quem autorizou).
- **[decidir]** O quanto de gestão entra no app: Só treino e acompanhamento (v1) · Também mensalidade, catraca e financeiro (ver `05-FORA-DA-V1.md`).

## Tabela de permissões por recurso

Legenda: **V** vê · **E** edita/cria · **—** não tem acesso · **(a)** só se o aluno autorizou · **(d)** só dos alunos designados a ele.

| Recurso | Aluno | Aluno Plus | Funcionário | Personal | Dono |
|---|---|---|---|---|---|
| Própria conta (nome, e-mail, senha, foto) | V E | V E | V E | V E | V E |
| Próprio cadastro corporal | V E | V E | V E (se também for aluno) | idem | idem |
| Cadastro corporal de um aluno | — | — | V (a) | V (a); V E (d) | V (a) |
| Autorização "a academia pode ver meus dados" | E | E | — | — | — |
| Treino livre (do próprio aluno) | V E | V E | — | — | — |
| Treino de um aluno (ver) | — | — | V (a) | V (a) e (d) | V (a) |
| Montar treino para um aluno | — | — | E | E | E |
| Treino montado pelo personal (para o aluno Plus) | — | V (segue; não edita) | — | E (d) | — |
| Treinos prontos da academia (usar) | V | V | V | V | V |
| Treinos prontos da academia (criar, editar, arquivar) | — | — | E | E | E |
| Biblioteca de exercícios (nome, grupo muscular, como fazer) | V | V | V E | V E | V E |
| Registrar treino feito (o próprio) | E | E | — | — | — |
| Histórico de treino (o próprio) | V | V | — | — | — |
| Histórico de treino de um aluno | — | — | V (a) | V (a) e (d) | V (a) |
| Assinar / cancelar o Plus | E | E | — | — | **[decidir]** se a academia cobra, a recepção liga e desliga |
| Plano de dieta | — | V; marca refeição feita | — | V E (d) | — |
| Conversa aluno–personal | — | V E | — | V E (d) | — |
| Designar personal a aluno Plus | — | — | — | — | E |
| Lista de alunos da academia | — | — | V | V | V |
| Vincular aluno à academia / confirmar pedido | — | — | E | E | E |
| Cadastrar e remover funcionário e personal | — | — | — | — | E |
| Números da academia | — | — | — | — | V |
| Escrever e retirar aviso da academia (R10.10) | — | — | E (recepção; **[decidir]** instrutor) | — | E |
| Ver o aviso da academia no Início e dispensar | V | V | V (se também é aluno) | idem | idem |
| Exportar e apagar os próprios dados (LGPD) | E | E | E | E | E |

## Regras de leitura da tabela

1. Nenhum funcionário, personal ou dono vê o cadastro corporal de um aluno que não autorizou. Ele vê o nome, o treino em uso (se o aluno também liberou) e a frequência.
2. O personal só vê dieta, conversa e dados de alunos Plus **designados a ele**. Outro personal da mesma academia não vê.
3. O dono não tem acesso individual maior que o funcionário em dado de saúde. O que ele ganha é gestão (pessoas, números, designação de personal).
4. Quem tem dois papéis não mistura: na visão do aluno ele é aluno; na visão da academia ele é funcionário. O que ele enxerga de si mesmo como funcionário segue a mesma regra de autorização que vale para qualquer aluno.
5. Se o Plus do aluno acaba, o personal perde o acesso ao cadastro corporal e à dieta dele no mesmo instante (detalhe em `03-REGRAS.md`).

## Acréscimos da checagem final (P10, 11/10/2026)

Linhas a somar à tabela de permissões. As regras estão nas seções 11 e 12 de `03-REGRAS.md`. Legenda igual à da tabela; **(v)** quer dizer "só o perfil visível" (R11.4).

| Recurso | Aluno | Aluno Plus | Funcionário | Personal | Dono |
|---|---|---|---|---|---|
| Próprio perfil profissional (montar, editar, mostrar ou desligar) | — | — | E | E | E |
| Equipe e perfil profissional de outro (ver) | V (v), só com vínculo ativo | V (v); o "Meu personal" sempre com nome e foto | V (v) | V (v) | V todos, com o estado |
| Esconder ou mostrar o perfil de alguém aos alunos | — | — | — | — | E |
| Pedir treino novo à academia | E (vínculo ativo) | E | — | — | — |
| Ver pedidos de treino e treinos para trocar | — | — | V | V | V |
| Dar treino pronto a um aluno | — | — | E | E | E |
| Confirmar pedidos de vínculo em lote | — | — | E | E | E |
| Encerrar o vínculo de um aluno | — | — | E (recepção) | — | E |
| Resumo da semana e números a mais (R12.12, R12.13) | — | — | — | — | V |

O perfil profissional é **opcional** em qualquer papel da equipe: ter o papel não obriga a ter perfil.
