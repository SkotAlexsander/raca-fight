# AS — PDF do professor e da recepção (P13, 15/10/2026)

> Agente AS. Entrega: `docs/apresentacao/professor/saida/Raça Fight — Professor.pdf` (**25 páginas, 2,4 MB, A4 deitado**), com cópia em `A:\Projetos\Academia Plus\Raça Fight — Professor.pdf` (nada que já estava lá foi apagado). Leitor: o dono da Raça Fight, que não é técnico, entendendo o que a equipe recebe. O visual é o mesmo do PDF do admin (`admin.css` como base, mesma capa, mesmo rodapé, mesma escala), para os três parecerem uma família. Só escrevi em `docs/apresentacao/professor/` e neste relatório. Não mexi em `app/`, `01-especificacao/`, `02-design/`, `docs/apresentacao/admin/` nem `docs/apresentacao/aluno/`.

## 1. As páginas

| p. | Página | Telas | Fonte |
|---|---|---|---|
| 1 | Capa: "A equipe no tatame" | foto `raca-09` (sparring, adultos de longe) | logo provisório do AL |
| 2 | Em uma página + sumário | — | — |
| 3 | Três apps, e o lugar do professor; **"o professor nunca vê valores"** | — | R14.6a, R15.7 |
| 4 | Como o professor e a recepção entram | 4 **telas desenhadas** (`entrada.html`: boas-vindas, entrar na equipe, código, pedido pendente) | mapa Parte 1b |
| 5 | Hoje: a aula da hora | **tela desenhada** (`luta.html` nº 6) | H136, mapa C |
| 6 | A chamada: o aluno avisa, o professor confirma | 3 **telas desenhadas** (Início do aluno antes e depois do "Estou na aula", Chamada) | F18, F19, R15.4 |
| 7 | A presença segura: linha do tempo 19:30 → 23:59 → 7 dias, sem sinal, atraso não bloqueia | — | R15.2, R15.5, R15.9, R14.6a |
| 8 | Turmas na grade real (tabela completa da grade) | esboço: Turmas | 00-LEIA-ME, L1 |
| 9 | Cancelar uma aula ou passar a substituto | esboços: Turma, folha de cancelar | R14.5, R22.2, F22 |
| 10 | Alunos e os filtros | esboço: Alunos | mapa C |
| 11 | A ficha do aluno: o que vê e o que **não** vê | esboço: Aluno (equipe) | R15.7, R20.7, R6.4 |
| 12 | A régua de graduação por modalidade | esboço: Sistema de graduação (IBJJF adulto) | 02-MODALIDADES, R16.1–R16.3, R16.7 |
| 13 | Quem atingiu os mínimos; **o app nunca gradua sozinho** | esboços: aba Graduação, Registrar graduação | R16.11, F20.1, L20 |
| 14 | O exame de graduação | esboço: Exame | R16.12, F20.2 |
| 15 | Cronômetro de rounds (Boxe e Muay Thai 3×3, MMA 3×5, gongo, 10 s) | **tela desenhada** (`luta.html` nº 5) | R17 |
| 16 | Aviso para a turma | esboço: Novo aviso + 2 notificações | R22.1, R22.2 |
| 17 | Técnicas em vídeo | esboços: Técnicas, Nova técnica | R21, L30 |
| 18 | Eventos, lutas e atletas | esboços: Eventos, Resultado | R18, F24 |
| 19 | Perfil profissional (sem preço, sem nota) + avisos da equipe | esboços: Meu perfil, Avisos | R16.14, R22.5 |
| 20 | Recepção: todas as aulas do dia e o balcão | esboços: Hoje (recepção), Presença no balcão | mapa D, R15.3 |
| 21 | Recepção: a aula experimental do WhatsApp à matrícula | esboço: Experimentais | R19, F17 |
| 22 | Recepção: interessado e Kids com o responsável | esboços: Nova experimental (criança), a criança vista pela equipe | R19.10, R20 |
| 23 | Privacidade: matriz de quem vê o quê | — | R15.13, R16.15, R20, R19.1 |
| 24 | Seis respostas que destravam (L3, L4, L5, L19, L1, L14) + "outras, sem pressa" | — | 90-PERGUNTAS |
| 25 | Próximos passos (sem prazo inventado) | foto `raca-20` (luva, sem rosto) | — |

## 2. O que é esboço e o que é tela desenhada

- **Telas desenhadas (9 capturas, com a moldura do iPhone 16, tema claro)**: de `mockups/entrada.html` (boas-vindas, entrar na equipe, código, pendente) e de `mockups/luta.html` (Início do aluno, o mesmo depois do toque em "Estou na aula", Cronômetro, Hoje do professor, Chamada). Legenda "Tela desenhada".
- **Esboços em HTML (23 telas)**, legenda "Esboço da tela": Turmas, Turma, cancelar, Alunos, ficha do aluno, régua, aba Graduação, Registrar graduação, Exame, Novo aviso, Técnicas, Nova técnica, Eventos, Resultado, Meu perfil, Avisos da equipe, Hoje da recepção, Presença no balcão, Experimentais, Nova experimental, a criança vista pela equipe. Feitos na marca (tokens 2.0.0, ícones de luta do AL), mas não são o desenho final.

Ajustes **só na cópia aberta no navegador** (os arquivos do AL não mudaram):
1. Na Chamada, "Bruno Souza" virou "Breno Souza": Bruno é o primeiro nome de um atleta real do Instagram.
2. No Hoje do professor (quinta), saiu a linha "Muay Thai 21:00": na grade real, o Muay Thai das 21h só existe na segunda e na quarta.
3. O fundo atrás da moldura vira branco, para o canto do celular não mostrar o cinza da página do mockup.

## 3. Como refazer (de dentro de `docs/apresentacao/professor/`)

```
node capturar.mjs   # fotos, logo e as 9 telas do AL em _capturas/
node montar.mjs     # gera professor.html e o PDF, confere e copia para A:\Projetos\Academia Plus\
node folhear.mjs    # cada página em PNG em _capturas/_pdf/ (e contato.png)
```

O `montar.mjs` para com aviso se: o corpo passa da página; algo sai da página; um quadro, célula, botão ou linha **dentro do celular de esboço** corta texto ou passa da borda; a letra sai da escala 13·16·20·25·31·39·49·61; uma imagem ou fonte não abre; aparece um **nome real** de professor ou atleta (lista de `01-DADOS-REAIS.md`); o número de páginas difere; passa de 20 MB. **A versão entregue sai sem nenhum aviso**, e as 25 páginas foram conferidas uma a uma em PNG. Se o Chromium 1243 não abrir, o `navegador.mjs` usa o 1234.

**Trocar um esboço por tela desenhada**: quando o AL desenhar a tela, acrescente uma linha na tabela `TELAS` do `capturar.mjs` com o **mesmo id** do esboço (por exemplo `graduacao: { pagina: 'luta.html', i: 7 }`). O `montar.mjs` usa a captura no lugar do esboço e a legenda muda sozinha para "Tela desenhada". `ESBOCOS=1 node montar.mjs` volta aos esboços. Os ids estão em `paginas.mjs` (`tela('<id>', …)`). **Logo novo**: troque os SVGs na pasta do AL e rode o `capturar.mjs`.

## 4. O que é provisório

- **Logo**: o provisório do AL (aviso na capa).
- **Esboços**: as 23 telas da seção 2.
- **Régua de Muay Thai e de Luta Livre, graus do Jiu-Jitsu Kids, aulas mínimas, duração das turmas e idade do Kids**: em aberto (L3, L4, L5, L19, L1, L14, p. 24). O "kruang amarelo" dos exemplos é o cordão do post, não uma régua confirmada.
- **Professores do exemplo** (Diego, Marcelo, Vitor, Sandro) e todos os alunos têm **nomes inventados**. A coluna "Professor (exemplo)" da grade (p. 8) não é a escala real.
- **Números de exemplo** (31 alunos, 17 por aula, 38 aulas…): ilustrativos, digitados à mão. Não há valor em dinheiro em nenhuma página.

## 5. Achados para outros agentes

1. **AL, `luta.html` › Hoje do professor**: a quinta mostra Muay Thai às 21:00, que a grade real não tem na quinta (só seg e qua). Sugiro trocar por um dia que tenha Kids 19h e 20h (terça ou quinta), sem a das 21h.
2. **AL, `luta.html` › Chamada**: "Bruno Souza" usa o primeiro nome de um atleta real (Bruno Cesar). Sugiro outro nome.
3. **AL, consistência**: o Hoje diz "9 check-ins" e a Chamada mostra 4 ("4 de 4 confirmados"). Não engana o dono, mas vale alinhar.
4. **AL, Chamada**: o botão "Fechar a chamada" fica abaixo da dobra na moldura do iPhone 16. A captura não mostra o botão (o texto da p. 6 explica).
5. **Faltam desenhar** para o PDF ficar todo em telas desenhadas: Turmas, Turma, Alunos, Aluno (equipe), Graduação, Registrar graduação, Exame, Sistema de graduação, Novo aviso da turma, Técnicas, Eventos, Meu perfil profissional, Hoje da recepção, Experimentais, Nova experimental.
