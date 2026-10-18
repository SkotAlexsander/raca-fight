# 05 — Fluxos novos (academia de luta)

> Agente AJ, P12, 15/10/2026. Continuam `01-especificacao/02-FLUXOS.md` (o último era o F16). Convenção igual: "**Tela** — o que a pessoa vê e faz"; "→" muda de tela. Nomes de tela: `06-MAPA-DE-TELAS.md`. **Todos os nomes de pessoa são fictícios.** O que é do Admin está marcado (AI).

---

## F17. Do interessado à matrícula (aula experimental)

Quem: interessado, recepção, professor, dono (Admin). Histórias: H119, H152–H155. Regras: R19.

1. **Boas-vindas** (sem conta) — além de "Sou aluno" e "Sou da academia", a linha **"Quero conhecer · aula experimental grátis"**. Toca.
2. **Conheça a Raça Fight** (vitrine) — as modalidades em cartões, "Horários", "Professores", "Raça Responde", endereço. Embaixo, fixo, o botão **"Agendar aula experimental grátis"**.
3. Toca no botão → folha **"Qual modalidade?"**: Muay Thai · Boxe · Jiu-Jitsu · Luta Livre · MMA · Muay Thai Kids · Jiu-Jitsu Kids · "Ainda não sei". Escolhe Muay Thai.
4. → abre o **WhatsApp** da academia com a mensagem pronta: "Olá! Quero agendar uma aula experimental de Muay Thai na Raça Fight." Lucas manda. O app não guarda nada (R19.2).
5. **(Recepção, no app da equipe) Experimentais** → "+ Nova" — nome (Lucas Andrade), WhatsApp, modalidade, a aula (terça, 20:00, Muay Thai — noite 1), "indicado por" (código, se veio por indicação). Se o WhatsApp já teve uma experimental de Muay Thai, a tela avisa (R19.4). Salva: a experimental fica `agendada`.
6. **(Professor) Hoje** → a aula de terça, 20:00 → **Chamada**: Lucas aparece no grupo "Experimental", com o selo. Ele chega, o professor toca: `compareceu` (R19.5).
7. **(Recepção) Experimentais** → Lucas → "Matricular" → leva ao **Admin** (AI), onde se escolhe o plano. O Admin manda o convite do app para o WhatsApp ou o e-mail dele. A experimental vira `matriculou`; a indicação, se houve, `convertida` (R19.9).
8. Lucas abre o convite → **Aluno · como entrar** → cria a conta → o vínculo nasce `ativo` pela matrícula (R14.7) → **Início** com a próxima aula dele.

Variações:
- Faltou: a recepção marca `faltou` e pode **remarcar** (cria outra, ligada à primeira).
- Criança: no passo 3, "Muay Thai Kids"; no passo 5, o nome e a idade da criança e o nome do responsável (R19.10). No passo 7, o Admin matricula o dependente na conta do responsável (R20).

## F18. O aluno faz check-in

Quem: aluno com matrícula. Histórias: H120–H127. Regras: R14.6, R15.2, R15.6, R15.9.

1. **Início** — o herói é a **próxima aula**: "Hoje · 20:00 · Muay Thai — noite 1 · Prof. Diego". Dentro da janela (de 19:30 a 20:30), o botão **"Estou na aula"**. Fora da janela, só "Abre às 19:30".
2. Toca → a presença grava no aparelho, **depois** vibra e anima (regra 1 do movimento). O botão vira "Presença marcada · aguardando a chamada" com "Desfazer" por 5 s.
3. Sem sinal: igual, com a linha discreta "Sem conexão. Sobe quando o sinal voltar." (R15.9).
4. Turma de duas modalidades (Jiu-Jitsu / Luta Livre) e o aluno tem as duas: antes do passo 2, a folha "Hoje você treina…" com as duas; a última escolha vem marcada (R15.6).
5. Sexta OPEN: o herói diz "OPEN · 20:00 às 22:00" e a mesma folha com as modalidades do aluno (R14.8).
6. O professor fecha a chamada (F19) → a presença fica `confirmada`. Se ninguém fechar, às 23:59 ela se confirma sozinha (R15.5).
7. **Treinos** → "Minhas presenças": a semana com a aula marcada, e na modalidade, "14 aulas desde a última graduação".

Treino de competição sem ser atleta: no passo 1 o herói não oferece o sábado; em **Horários**, a aula de sábado mostra "Treino da equipe de competição. Fale com o seu professor." (R14.9).

## F19. A chamada do professor

Quem: professor (ou substituto), recepção. Histórias: H136–H140, H145. Regras: R15.3–R15.8.

1. **Hoje** (primeira aba do professor) — as aulas dele hoje; a da hora, em destaque: "20:00 · Muay Thai — noite 1 · 12 check-ins". Toca.
2. **Aula** — três grupos:
   - **Fizeram check-in** (12): cada um com a faixa (kruang) e um toque para desmarcar; no topo, "Confirmar os 12".
   - **Da turma, ainda não chegaram** (9): tocar marca presente (quem veio sem celular).
   - **Experimental** (1): Lucas Andrade, Muay Thai.
   - Embaixo: "+ Aluno de outra turma" (busca por nome; se não tem a modalidade na matrícula, a linha avisa, R15.7) e o botão **"Cronômetro"** (F21).
3. Toca "Confirmar os 12", marca 2 que vieram sem celular, desmarca 1 que fez check-in de casa.
4. **"Fechar a chamada"** → folha: "14 presentes · 1 check-in retirado." → Fechar. As presenças ficam `confirmadas`; a retirada leva o motivo "não estava na aula".
5. Sem sinal no tatame: tudo igual; a aba mostra "Chamada guardada · sobe quando o sinal voltar".
6. Esqueceu de fechar: às 23:00 o aviso "Check-ins para confirmar" (se ligado); às 23:59 confirmam sozinhos (R15.5). Até 7 dias depois, a chamada reabre para corrigir, com motivo.

Recepção: **Hoje** mostra **todas** as aulas do dia; ela faz o check-in do aluno do balcão pela busca, dentro da janela.

## F20. Graduar um aluno

Quem: professor. Histórias: H128–H135. Regras: R16.

### F20.1 Graduação avulsa (um grau, uma faixa)

1. **Graduação** (aba do professor) → "Atingiram os mínimos" — por modalidade; cada linha: nome, faixa e graus atuais, "38 aulas e 9 meses desde a última", e "Há 3 semanas" (desde quando cumpre) (R16.11).
2. Toca na aluna (Bianca Prado, Jiu-Jitsu, azul, 3 graus) → **Aluno (equipe)**, parte Graduação: o histórico e "Registrar graduação".
3. **Registrar graduação** (folha) — próximo passo sugerido: "Azul, 4º grau"; dá para escolher a faixa seguinte. Data (hoje), quem graduou (eu), observação. → "Registrar".
4. Na aluna: notificação "Você tem uma graduação nova." (chave Graduação) → **Comemoração** (cor cheia, a faixa desenhada com os graus, sem confete). Em **Treinos › Minha graduação**, o histórico ganha a linha.

### F20.2 Exame de graduação

1. **Graduação** → "Exames" → "+ Novo exame": modalidade (Jiu-Jitsu), data (sábado, 10:00), local, avaliadores.
2. "Candidatos" → a lista dos que atingiram os mínimos já vem marcada; dá para tirar e pôr à mão. → "Marcar exame". Os candidatos recebem o aviso (chave Graduação) e o exame entra em **Eventos** para eles. A taxa, se houver, é do Admin.
3. No dia: **Exame** → cada candidato: "Aprovado (para qual faixa ou grau)" · "Não aprovado" · "Faltou". "Fechar o exame" cria as graduações dos aprovados (origem `exame`) de uma vez.
4. Cada candidato vê só o próprio resultado.

### F20.3 Aluno novo que já tinha faixa

**Aluno (equipe)** → Graduação → "Registrar faixa anterior": faixa, graus, desde quando, academia de origem (opcional). Substitui a faixa `inicial` do R16.4.

## F21. Cronômetro de rounds no tatame

Quem: professor (e aluno em casa). Histórias: H144, H71. Regras: R17.

1. **Aula** (F19) → "Cronômetro", ou o atalho em **Hoje**.
2. **Cronômetro** — "Intervalado" com as predefinições de luta no topo: Muay Thai 3 × 3 min · Boxe 3 × 3 min · MMA 3 × 5 min · Rola 5 min · Saco 2 min; os quatro números editáveis; chaves "Som" e "Aviso dos 10 s".
3. Escolhe "Saco 2 min", muda para 8 rounds → "Iniciar" → "Prepare-se" (10 s) → gongo → "Round 1 de 8".
4. Aos 10 s do fim, a batida e a vibração; no fim, o gongo e "Intervalo · 0:30".
5. "Tela cheia" → só a fase, o número e "Round 3 de 8", em escuro.
6. O professor sai para a chamada: a faixa do cronômetro fica acima das abas (R9.14); o som segue enquanto o app estiver aberto (R17.5).

## F22. Aviso da turma e aula cancelada

Quem: professor, recepção, dono. Histórias: H118, H142, H143. Regras: R14.5, R22.1, R22.2.

1. **Turmas** → Muay Thai Kids → "Aviso para a turma" → **Novo aviso** (o mesmo do F10, com "Vai para os 18 alunos e responsáveis da turma Muay Thai Kids"). → Enviar.
2. Cancelar: **Turmas** → a turma → a aula de quinta → "Cancelar esta aula" → motivo (feriado · evento · outro) → folha "Os alunos da turma são avisados agora." → Cancelar. O aviso automático sai (R22.2); os check-ins viram retirados.
3. Substituto: a mesma aula → "Passar a outro professor" → lista dos professores da modalidade → o substituto vê a aula em **Hoje**.

## F23. O responsável e o dependente (Kids)

Quem: responsável. Histórias: H157–H159. Regras: R20.

1. Entrada: **Aluno · como entrar** → conta → a pergunta **"Quem vai treinar?"**: "Eu" · "Meu filho ou filha" · "Os dois".
2. "Meu filho ou filha" → **Dependente** — nome, data de nascimento. Saúde (opcional, com a frase de dado sensível). **Autorização de imagem**, desligada, com o texto: "Fotos do Pedro podem aparecer no app (Atletas, eventos, técnicas). Você desliga quando quiser." → Salvar.
3. A matrícula do Pedro é feita no Admin (AI) na conta da Carla. Se a matrícula veio antes (F17, passo 7), o convite já traz o Pedro, e a Carla só confere.
4. **Início** da Carla — a próxima aula do Pedro ("Hoje · 19:00 · Jiu-Jitsu Kids") com "Pedro está na aula" na janela; os avisos da turma kids.
5. **Perfil** → "Meus dependentes" → Pedro → presenças, faixa (cinza e branca, 2 graus), autorização de imagem, saúde.
6. Carla também treina: o Início mostra as duas próximas aulas (a dela e a do Pedro), cada uma com o nome.

## F24. Evento, luta e Atletas

Quem: professor, aluno, atleta. Histórias: H146–H151. Regras: R18.

1. **(Professor) Hoje** → "Eventos" → "+ Novo" → tipo "Luta" → evento "Noite de lutas" (21/11, Lomba do Pinheiro) → atleta (Mateus Ribeiro), adversário ("Fábio Lemos"), categoria "60 kg", nível semi-pró. Salvar.
2. **(Aluno) Academia** → "Eventos": "21/11 · Noite de lutas · Lomba do Pinheiro". A luta do Mateus aparece com o nome **só se ele está em Atletas** (R18.6); senão, só a equipe vê.
3. "Vou participar" (torcida) → a equipe vê quantos vão.
4. Depois da luta: **Eventos** → a luta → "Resultado": vitória, por pontos. Se o Mateus está em Atletas, a luta entra no perfil dele lá.
5. **(Atleta) Perfil** → "Aparecer em Atletas" → folha com a prévia (foto, modalidades, faixa, lutas) → "Aparecer". Desligar tira na hora.

## F25. Indicar um amigo (curto)

**Perfil** → "Indicar um amigo" → a folha com o código (Q7K2PX) e "Compartilhar": "Treina comigo na Raça Fight! Aula experimental grátis: [link do WhatsApp da academia]. Diga o código Q7K2PX." → a recepção digita o código no F17, passo 5 → matrícula → o aluno vê "Sua indicação virou matrícula". O benefício é do Admin (R19.9, L26).
