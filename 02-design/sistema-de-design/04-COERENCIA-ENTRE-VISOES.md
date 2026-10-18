# 04 — Coerência entre as duas visões

O que este arquivo é: o que é idêntico entre a visão do aluno e a visão da academia, o que muda, e como o app avisa em que visão a pessoa está sem parecer dois aplicativos.

Regra do CLAUDE.md que este arquivo cumpre: "as duas visões compartilham o mesmo sistema (tokens, componentes); o que muda é o conteúdo e a navegação, não a linguagem visual".

## O que é idêntico

| Camada | Igual nas duas visões | Por quê |
|---|---|---|
| **Tokens** | todos: cor, espaço, raio, tipografia, sombra, duração | um só `tokens.json`; não existe "tema da academia" |
| **Componentes** | todos os 17 do `02-COMPONENTES.md`, com os mesmos estados | o cartão de exercício que o aluno executa é o mesmo que o funcionário monta |
| **Gestos** | toque para abrir, voltar pelo sistema, arrastar folha para fechar, deslizar linha como atalho | quem é aluno e funcionário troca de visão sem reaprender |
| **Cabeçalho e barra de abas** | mesma altura, mesmo desenho, mesma posição | a estrutura da tela é a mesma |
| **Estados vazios, toasts, erros** | mesmo componente, mesmo tom | a voz do app é uma (regra da marca) |
| **Selo Plus** | mesmo selo, mesma cor `plus` | o aluno vê "Plus" no próprio perfil; o funcionário vê o mesmo selo na lista de alunos |
| **Tema claro/escuro** | preferência por conta, não por visão | — |
| **Estrutura de treino** | treino → dia → exercício → série, com os mesmos componentes de leitura e edição | o funcionário monta com o que o aluno vai executar |

## O que muda

| O que | Visão do aluno | Visão da academia | Como o sistema trata |
|---|---|---|---|
| **Abas** | Início, Treinos, Plus, Perfil (4) | Alunos, Treinos, Plus (personal), Academia (dono), Perfil — de 3 a 5 | a barra de abas aceita de 3 a 5 itens |
| **Conteúdo** | o meu treino, a minha dieta | os alunos, a biblioteca, os números | mesmos componentes, dados diferentes |
| **Densidade** | linha de 72 px, número grande, 1 ação por linha | linha de **56 px** (`alturaLinhaCompacta`), texto em `corpo`, lista com busca fixa no topo | variante `compacta` nos componentes de lista (cartão de aluno, linha de lista) |
| **Número grande** | carga, repetição e cronômetro em 40–64 px | só nos cartões de número do dono (28 px) | o funcionário lê; o aluno executa |
| **Ação principal da tela** | "Iniciar treino", "Marcar série", "Concluir" | "Montar treino", "Salvar", "Adicionar exercício" | mesmo botão primário |
| **Edição** | edita o próprio treino livre | edita treinos de outros e a biblioteca | o modo de edição é o mesmo componente (cartão de exercício em edição) |
| **Dados sensíveis** | vê os próprios | vê dos alunos que cadastraram e autorizaram | cartão de aluno mostra "Não informado" quando falta; nunca inventa |
| **Plus** | aba Plus: convite (sem plano) ou personal, treino e dieta (com plano) | aba Plus com lista de assinantes (só personal) | `plus` marca o que é do plano nas duas |

### Densidade compacta — a única variante estrutural

O funcionário vê listas de 30 a 300 alunos. Para isso existe **uma** variante:

- Linha de **56 px** em vez de 72.
- Avatar 32 px em vez de 40.
- Texto em `corpo` (16) para o nome e `legenda` (12) para o apoio, em **uma linha cada**, com reticências.
- Alvo de toque continua **48 px no mínimo** (a linha inteira é o alvo).
- Busca fixa no topo da lista (campo de 48 px), com filtro por objetivo e por Plus em chips de 48 px.

Compacta não é "menor em tudo": número, botão e campo são os mesmos. Só a linha de lista encolhe.

## Como o app sinaliza a visão sem parecer dois apps

O risco: o funcionário abre o app e não sabe se está vendo a sua academia ou o seu treino. A solução não é mudar a cor do app inteiro (seriam dois apps). São **quatro sinais pequenos**, sempre juntos:

1. **As abas são outras.** "Alunos" na primeira aba (academia) não se confunde com "Início" (aluno); a aba Plus do aluno é o plano dele, a da academia é a lista de assinantes. Os rótulos nunca somem (fonte ampliada é a exceção, com rótulo no toque longo).

2. **O cabeçalho da primeira aba diz quem está vendo.** Aluno: "Olá, Ana" + o nome do treino do dia. Academia: o **nome da academia** em `legenda` acima do título, e o nome do funcionário com o papel ("Carlos · Instrutor") no cabeçalho de Alunos.

3. **Chip de visão no cabeçalho** (apenas para quem tem **dois papéis**): um chip de 32 px de desenho (alvo de toque de 48) à direita do título com "Academia" ou "Aluno" e o ícone de troca. Toque abre folha inferior "Trocar para visão do aluno?". Quem tem um só papel não vê o chip — não há o que trocar.

4. **Transição de tela inteira** ao trocar de visão (`duracao.lenta`, deslize vertical), com a nova barra de abas entrando por baixo. O corpo sente que "mudou de lugar", mas tudo o que vê tem a mesma cara.

O que **não** se faz:
- Não mudar `marca` por visão. A cor da marca é uma.
- Não mudar a família de fonte, o raio ou a sombra por visão.
- Não colocar um "banner" fixo dizendo "Modo academia" — ocupa espaço e vira ruído em 2 dias.
- Não esconder o Plus do funcionário que não é personal: ele vê o selo na lista de alunos (sabe quem é assinante) mas não abre a dieta nem a conversa (permissão da especificação).

## Casos de fronteira

| Caso | Regra |
|---|---|
| Personal que também treina | tem os dois papéis; usa o chip de troca |
| Dono que nunca treina | só vê a visão da academia; sem chip |
| Aluno que vira funcionário no meio do mês | a conta ganha o papel; na próxima abertura o app pergunta em folha qual visão abrir e lembra a escolha |
| Funcionário monta treino para si mesmo | faz isso na visão do **aluno** (é o treino dele); a visão da academia é para os outros |
| Notificação de aluno Plus chega enquanto o personal está na visão do aluno | o toque na notificação troca de visão e abre a conversa, com a mesma transição de tela inteira |

## Pendências [decidir] que afetam este arquivo

- **Marca própria vs. white-label**: se cada academia puder trocar `marca` e logo, a cor muda **por academia**, não por visão — as duas visões da mesma academia continuam com a mesma cor. O sistema já está pronto para isso porque só a `marca` e a `marcaTexto` seriam trocadas (ver `02-design/marca-e-proposta/05-WHITE-LABEL.md`).
- **Chat próprio vs. WhatsApp**: muda o número de abas do aluno (5 ou 4) e o conteúdo da aba Plus da academia. Nenhum componente novo em nenhum dos casos.
- **Quanto de gestão entra**: se entrar cobrança e catraca, a visão da academia ganha telas, não ganha linguagem visual nova. A densidade compacta e os cartões de número cobrem.
