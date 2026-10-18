// As páginas do PDF do aluno (agente AT, 15/10/2026). Cada página é um objeto; o montar.mjs põe o rodapé, numera e imprime.
// Mesmo formato do paginas.mjs do admin (AR). As telas são capturas dos mockups do AL (luta.html, entrada.html) e,
// onde o AL ainda não desenhou, ESBOÇOS (esbocos.html), sempre com a legenda "Esboço da tela".
// Exemplos: nomes fictícios (os mesmos dos mockups: Lucas, Prof. Diego; no Kids, Carla com Theo e Bia). Nenhum nome real
// de atleta ou professor. A grade, o endereço e o WhatsApp são os reais (02-design/referencias/raca-fight/01-DADOS-REAIS.md).

const lista = (xs, cls = 'lista--16') => `<ul class="lista ${cls}">${xs.map((x) => `<li>${x}</li>`).join('')}</ul>`
const bloco = (titulo, xs, cls = '', lcls = 'lista--16') => `<div class="bloco ${cls}"><h3>${titulo}</h3>${Array.isArray(xs) ? lista(xs, lcls) : xs}</div>`
const traz = (xs) => `<div class="traz"><h3>O que isso traz para a academia</h3>${Array.isArray(xs) ? lista(xs, '') : `<p>${xs}</p>`}</div>`
const texto = (ve, faz, ganho, extra = '', quem = 'o aluno') => `<div class="texto-col">${bloco(`O que ${quem} ${quem === 'o aluno' ? 'vê' : 'veem'}`, ve)}${bloco(`O que ${quem} ${quem === 'o aluno' ? 'consegue' : 'conseguem'} fazer`, faz)}${extra}${traz(ganho)}</div>`

export function paginas(x) {
  /** Um celular: `a:` tela do app construído (AV, 16/10), `t:` tela desenhada do AL, `e:` esboço. */
  const cel = (ref, legenda, { h } = {}) => {
    const tipo = ref.slice(0, 1), id = ref.slice(2)
    const src = tipo === 'e' ? x.esboco(id) : tipo === 'a' ? x.app(id) : x.tela(id)
    const rot = tipo === 'e' ? 'Esboço da tela' : tipo === 'a' ? 'Tela do app' : 'Tela desenhada'
    return `<figure class="cel ${tipo === 'e' ? 'cel--esboco' : ''} ${tipo === 'a' ? 'cel--app' : ''}" style="${h ? `--h:${h}px` : ''}"><img src="${src}" alt=""><figcaption><b>${rot}.</b> ${legenda}</figcaption></figure>`
  }
  const cels = (...xs) => `<div class="cels">${xs.join('')}</div>`
  const pgs = []
  const add = (o) => pgs.push(o)
  const WHATS = '(51) 98196-2077'

  // ───────────────────────────────────────────── 1. capa
  add({ id: 'capa', capa: true, html: `
    <div class="capa__texto">
      ${x.logoCompleto ? `<img class="capa__logo" src="${x.logoCompleto}" alt="Centro de Treinamento Raça Fight Gravataí">` : '<div class="capa__titulo">RAÇA FIGHT</div>'}
      <p class="capa__olho">Versão · 16 de outubro de 2026</p>
      <h1 class="capa__titulo">O app do<br><em>aluno</em></h1>
      <p class="capa__sub">O que o aluno e os pais das crianças do Kids recebem no celular: a próxima aula, a presença com um toque, a faixa, os horários, o cronômetro de rounds e a academia inteira no bolso.</p>
      <div class="capa__ficha">
        <div><b>Para</b>Raça Fight Gravataí</div>
        <div><b>O quê</b>O app do aluno</div>
        <div><b>Junto com</b>o Admin e o app do professor</div>
        <div><b>Situação</b>construído, com dados de exemplo; falta o servidor</div>
      </div>
      <p class="capa__nota">Logo provisório, redesenhado a partir das fotos da academia: entra o arquivo original assim que chegar.</p>
    </div>
    <div class="capa__foto" style="background-image:url('${x.fotoCapa}');background-position:50% 40%"></div>` })

  // ───────────────────────────────────────────── 2. em uma página
  add({ id: 'resumo', olho: 'Em uma página', titulo: 'O app que o aluno abre antes de cada aula',
    lide: 'O app do aluno é a parte da Raça Fight que fica no celular de quem treina. Ele responde três perguntas: qual é a minha próxima aula, onde eu estou na minha faixa e o que está acontecendo na academia.',
    corpo: `<div class="duas" style="grid-template-columns:1.05fr 1fr;gap:28px">
      <div class="pilha">
        ${bloco('O que muda para o aluno', [
          '<b>A próxima aula em um olhar.</b> Hora, turma e professor, logo na primeira tela.',
          '<b>"Estou na aula", um toque.</b> A presença fica registrada e o professor só confirma na chamada.',
          '<b>A faixa no bolso.</b> A faixa e os graus, há quanto tempo está nela e quantas aulas fez desde o último grau.',
          '<b>A grade de verdade.</b> Os horários da academia, com aviso quando uma aula é cancelada.',
          '<b>O pai e a mãe do Kids</b> acompanham os filhos numa conta só, sem foto da criança se não autorizarem.',
        ])}
        <div class="caixa caixa--vermelha"><b class="rot">Sobre os exemplos deste documento</b>Os nomes de alunos, professores e crianças são inventados. A grade de horários, o endereço e o WhatsApp são os reais da Raça Fight. As telas marcadas "Tela do app" são o app construído, rodando com uma academia de exemplo. A única marcada "Esboço da tela" (a notificação na tela bloqueada) não dá para fotografar no navegador. O servidor com os dados reais ainda não existe.</div>
      </div>
      <div class="bloco bloco--cinza"><h3>O que tem aqui</h3>
        <ol class="sumario" style="columns:1">
          ${[['tres-apps', 'Os três apps: o lugar do aluno'], ['entrada', 'A abertura e a entrada'], ['experimental', 'A aula experimental grátis'], ['inicio', 'Início: a próxima aula'], ['horarios', 'Horários'], ['treinos', 'Treinos: a faixa e a presença'],
            ['cronometro', 'Cronômetro de rounds'], ['academia', 'A academia no bolso'], ['amiguinho', 'Traga um amiguinho'], ['avisos', 'Avisos e notificações'], ['perfil', 'Perfil e os dados opcionais'], ['kids', 'Kids: a conta dos pais'],
            ['privacidade', 'Privacidade, em linguagem simples'], ['sai', 'O que sai do app antigo'], ['decidir', 'O que a academia precisa decidir'], ['passos', 'Próximos passos']]
            .map(([id, t]) => `<li><b>${t}</b><span class="p">{{p:${id}}}</span></li>`).join('')}
        </ol>
      </div>
    </div>` })

  // ───────────────────────────────────────────── 3. os três apps
  const icone = (t) => `<span class="app__icone"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${t}</svg></span>`
  const CEL = '<rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M11 18h2"/>'
  const PC = '<rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>'
  add({ id: 'tres-apps', olho: 'Como tudo se liga', titulo: 'Três apps, um banco de dados só',
    lide: 'O aluno, o professor e o dono usam apps diferentes, mas todos leem e escrevem no mesmo lugar. O "Estou na aula" do aluno aparece na chamada do professor; a matrícula que o dono faz no Admin libera o check-in do aluno.',
    corpo: `
    <div class="apps">
      <div class="app app--destaque">${'<div class="app__topo">' + icone(CEL) + '<div><div class="app__nome">Aluno (este documento)</div><div class="app__quem">no celular · o aluno e o responsável pelo Kids</div></div></div>'}
        ${lista(['A próxima aula e o "Estou na aula"', 'Os horários e os avisos da academia', 'A própria faixa e a própria presença', 'Professores, atletas, eventos e técnicas', 'Os filhos do Kids, na conta dos pais'])}</div>
      <div class="app">${'<div class="app__topo">' + icone(CEL) + '<div><div class="app__nome">Professor e recepção</div><div class="app__quem">no celular · a equipe</div></div></div>'}
        ${lista(['A aula do dia e a chamada', 'Confirma a presença que o aluno marcou', 'Registra a graduação', 'Escreve aviso para a turma dele', '<b>Nunca vê valor</b> de mensalidade'])}</div>
      <div class="app">${'<div class="app__topo">' + icone(PC) + '<div><div class="app__nome">Admin</div><div class="app__quem">no computador e no celular · só o dono</div></div></div>'}
        ${lista(['Matrícula, planos e mensalidades', 'Quem deve, entradas e saídas', 'A grade, as turmas e a régua de cada faixa', 'O "Raça Responde" e o WhatsApp da academia', 'O desconto do "Traga um amiguinho"'])}</div>
    </div>
    <div class="fios"><svg viewBox="0 0 1000 34" preserveAspectRatio="none"><path d="M166 0 V16 H834 V0 M500 16 V34" fill="none" stroke="#CFCFCF" stroke-width="2"/></svg></div>
    <div class="banco"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/></svg>
      <div><b>Um banco de dados, em São Paulo</b><div class="pequeno" style="color:#D6D6D6">O mesmo do Admin. Cada pessoa só recebe o que é dela: o aluno vê a própria presença e a própria faixa, nunca a de outro aluno.</div></div></div>
    <p class="legenda" style="text-align:center;margin-top:10px">Neste documento: só o app do aluno. O do dono e o da equipe têm os seus próprios PDFs.</p>` })

  // ───────────────────────────────────────────── 4. abertura e entrada
  add({ id: 'entrada', olho: 'Parte 1 · A entrada', titulo: 'A abertura e as duas portas',
    lide: 'Quem abre o app pela primeira vez vê a marca da academia e escolhe por onde entra: aluno, equipe ou "quero conhecer". Criar a conta leva um minuto.',
    corpo: `<div class="palco">
      ${cels(cel('a:boas-vindas', 'As boas-vindas.', { h: 450 }), cel('a:objetivo', 'Objetivo, opcional.', { h: 450 }))}
      ${texto(['A logo da Raça Fight e a frase "Treine com disciplina, técnica e respeito"', 'Duas portas: <b>Sou aluno</b> e <b>Sou da equipe</b>', 'Embaixo: "Quero conhecer · aula experimental grátis"'],
        ['Entrar com Apple, Google ou e-mail', 'Dizer o objetivo (aprender a lutar, condicionamento, defesa pessoal, competir…) ou pular', 'Dizer se vai treinar ele, o filho ou os dois'],
        'O app tem a cara da academia desde o primeiro segundo, e quem só quer conhecer não precisa criar conta.')}
    </div>` })

  // ───────────────────────────────────────────── 5. aula experimental
  add({ id: 'experimental', olho: 'Parte 1 · Quem ainda não é aluno', titulo: 'A aula experimental grátis, pelo WhatsApp',
    lide: 'Quem ainda não treina vê a academia sem criar conta: horários, professores, modalidades e o "Raça Responde". Para marcar a aula experimental, escolhe a modalidade e o WhatsApp da academia abre com a mensagem pronta.',
    corpo: `<div class="palco">
      ${cels(cel('a:conheca', 'A vitrine, sem conta.', { h: 470 }), cel('a:qual-modalidade', 'Qual modalidade?', { h: 470 }))}
      <div class="texto-col">
        <div class="bloco"><h3>Como funciona</h3><ol class="passinhos">
          <li>A pessoa toca em <b>"Quero conhecer"</b> e, na vitrine, em <b>"Agendar aula experimental grátis"</b>.</li>
          <li>Escolhe a modalidade, ou "Ainda não sei".</li>
          <li>O WhatsApp da academia, <b>${WHATS}</b>, abre com a mensagem já escrita:</li>
        </ol>
        <div class="whats" style="margin-left:34px"><div class="balao">Olá! Quero agendar uma aula experimental de Muay Thai na Raça Fight.</div></div></div>
        <ol class="passinhos" start="4" style="counter-reset:p 3"><li>A recepção combina o dia e registra. No dia, o professor vê o nome na chamada, com o selo "Experimental".</li></ol>
        ${traz(['Ninguém chega no WhatsApp sem dizer o que quer treinar', 'É o mesmo caminho que vocês já usam hoje, só que mais curto', 'O Admin mostra quantos vieram, quantos voltaram e quantos se matricularam'])}
      </div>
    </div>` })

  // ───────────────────────────────────────────── 6. início
  add({ id: 'inicio', olho: 'Parte 2 · Início', titulo: 'A próxima aula e o "Estou na aula"',
    lide: 'A primeira tela responde a pergunta de quem abre o app: qual é a minha próxima aula? Dentro do horário da aula, aparece o botão vermelho "Estou na aula".',
    corpo: `<div class="palco">
      ${cels(cel('a:aluno-inicio', 'Antes do toque.', { h: 450 }), cel('a:aluno-checkin-feito', 'Depois do toque.', { h: 450 }), cel('a:aluno-sem-sinal', 'Sem internet.', { h: 450 }))}
      ${texto(['A próxima aula: modalidade, hora, turma, professor', 'O último aviso da academia', 'A semana em bolinhas e as faixas', 'Mais abaixo: o próximo evento e os atalhos (cronômetro, técnicas, eventos, indicar)'],
        ['Tocar <b>"Estou na aula"</b> de 30 min antes a 30 min depois do início', 'Desfazer, se tocou errado', 'Sem internet, o app guarda e avisa: "Sobe quando o sinal voltar"'],
        'A chamada fica mais rápida: o professor só confirma quem já marcou. E a presença vira número para a graduação e para o Admin.')}
    </div>` })

  // ───────────────────────────────────────────── 7. horários
  const GRADE = [['Muay Thai', '09h, 20h, 21h', '20h', '09h, 20h, 21h', '20h'], ['Boxe', '—', '09h, 21h', '—', '09h, 21h'], ['Jiu-Jitsu / Luta Livre', '20h', '—', '20h', '—'], ['MMA', '—', '20h', '—', '20h'], ['Muay Thai Kids', '—', '19h', '—', '19h'], ['Jiu-Jitsu Kids', '19h', '—', '19h', '—']]
  add({ id: 'horarios', olho: 'Parte 2 · Horários', titulo: 'A grade da academia, no celular',
    lide: 'A aba Horários mostra a grade que a academia publica, dia por dia. As aulas das modalidades do aluno aparecem em vermelho; Kids, OPEN e Competição têm selo; aula cancelada aparece riscada.',
    corpo: `<div class="palco">
      ${cels(cel('a:horarios', 'Segunda, as minhas modalidades.', { h: 470 }), cel('a:horarios-todas', 'Segunda, todas.', { h: 470 }))}
      <div class="texto-col">
        <div class="bloco"><h3>A grade real da Raça Fight</h3>
          <table class="grade-real"><thead><tr><th>Modalidade</th><th>Seg</th><th>Ter</th><th>Qua</th><th>Qui</th></tr></thead><tbody>
          ${GRADE.map((l) => `<tr>${l.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}
          </tbody></table>
          <p class="legenda">Mais a <b>Sexta OPEN</b>, das 20h às 22h, e o <b>treino de competição</b> no sábado, das 10h às 12h. Quem muda a grade é o dono, no Admin.</p></div>
        ${bloco('O que o aluno consegue fazer', ['Trocar o dia e ver "Minhas modalidades" ou "Todas"', 'Abrir a turma: professor, público e nível', 'Ligar o lembrete de uma turma'])}
        ${traz('A pergunta "que horas tem aula hoje?" sai do WhatsApp da recepção. E a aula cancelada avisa o aluno sozinha, antes da viagem à toa.')}
      </div>
    </div>` })

  // ───────────────────────────────────────────── 8. treinos
  add({ id: 'treinos', olho: 'Parte 2 · Treinos', titulo: 'A faixa, a presença e o caminho até aqui',
    lide: 'No lugar do treino de musculação, a aba Treinos mostra o que importa na luta: a faixa atual com os graus, há quanto tempo o aluno está nela, quantas aulas fez desde o último grau e o mês de presenças.',
    corpo: `<div class="palco">
      ${cels(cel('a:treinos-jj', 'Jiu-Jitsu.', { h: 470 }), cel('a:treinos', 'Muay Thai: régua a confirmar.', { h: 470 }))}
      ${texto(['A faixa desenhada, com os graus (cada modalidade na sua)', 'Aulas desde o último grau e tempo na faixa', 'O mês em quadrados: as aulas em que esteve', 'O histórico: cada graduação, a data e quem graduou'],
        ['Trocar de modalidade', 'Abrir uma aula feita e o histórico de graduação'],
        'O aluno enxerga a evolução dele e tem motivo para não faltar. E o professor continua sendo quem decide a graduação.',
        `<div class="caixa caixa--atencao"><b class="rot">O que o aluno não vê</b>Não aparece "pronto para graduar" nem o número mínimo de aulas da academia. É a recomendação do projeto: a graduação continua sendo decisão do professor, e não uma cobrança do aluno. A régua do Muay Thai ainda vem da academia.</div>`)}
    </div>` })

  // ───────────────────────────────────────────── 9. cronômetro
  const PREDEF = [['Boxe', '3 rounds de 3 min', '1 min'], ['Muay Thai', '3 rounds de 3 min', '1 min'], ['MMA', '3 rounds de 5 min', '1 min'], ['Rola de jiu-jitsu', '6 rounds de 5 min', '1 min'], ['Saco de pancada', '6 rounds de 2 min', '30 s']]
  add({ id: 'cronometro', olho: 'Parte 2 · Treinar em casa', titulo: 'O cronômetro de rounds',
    lide: 'Para treinar em casa ou no saco: o aluno escolhe a modalidade e o app conta os rounds e os intervalos, com o gongo e o aviso dos 10 segundos. O professor tem o mesmo cronômetro no app dele.',
    corpo: `<div class="palco">
      ${cels(cel('a:cronometro-escolher', 'Escolher o formato.', { h: 470 }), cel('a:cronometro', 'Round 2 de 3.', { h: 470 }))}
      <div class="texto-col">
        <div class="bloco"><h3>Prontos para usar (e dá para mudar antes de começar)</h3>
          <table class="tabela-16"><thead><tr><th>Modalidade</th><th>Rounds</th><th>Intervalo</th></tr></thead><tbody>
          ${PREDEF.map((l) => `<tr>${l.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}
          </tbody></table>
          <p class="legenda">Boxe, Muay Thai e MMA seguem as regras das federações; o rola e o saco, a prática de academia.</p></div>
        ${bloco('O que o aluno consegue fazer', ['Começar, pausar, pular e parar', 'Ouvir o gongo e o aviso dos 10 s com o app aberto, mesmo no silencioso', 'Deixar em tela cheia, escura, para ler de longe'])}
        ${traz('Um motivo para abrir o app também fora da academia, com a marca Raça Fight na tela durante o treino.')}
      </div>
    </div>` })

  // ───────────────────────────────────────────── 10. academia
  add({ id: 'academia', olho: 'Parte 2 · Academia', titulo: 'A academia inteira no bolso',
    lide: 'A aba Academia junta o que hoje está nos destaques do Instagram: professores, atletas, eventos, técnicas em vídeo e o "Raça Responde", mais o endereço e o WhatsApp.',
    corpo: `<div class="palco">
      ${cels(cel('a:academia', 'A aba Academia.', { h: 470 }), cel('a:responde', 'Raça Responde.', { h: 470 }))}
      <div class="texto-col">
        ${bloco('O que o aluno vê', ['<b>Professores</b>: modalidades e graduação de cada um', '<b>Atletas</b>: só quem aceitou aparecer, com as lutas', '<b>Eventos</b>: data, local e "Vou participar"', '<b>Técnicas</b>: "Golpes básicos", "Golpes de curta distância", por modalidade', '<b>Raça Responde</b>: as perguntas frequentes'])}
        ${bloco('O que o aluno consegue fazer', ['Abrir o endereço no mapa e chamar no WhatsApp', 'Assistir à técnica de novo em casa'])}
        ${traz('O conteúdo que vocês já fazem para o Instagram ganha um lugar fixo. As dúvidas de sempre têm resposta antes de chegar à recepção.')}
      </div>
    </div>` })

  // ───────────────────────────────────────────── 11. traga um amiguinho
  add({ id: 'amiguinho', olho: 'Parte 3 · Indicação', titulo: '"Traga um amiguinho", com código',
    lide: 'A promoção que a academia já faz ganha um código. O aluno compartilha uma mensagem pronta; quando o amigo se matricula, os dois ganham o benefício que a academia definir no Admin.',
    corpo: `<div class="palco">
      ${cels(cel('a:indicar', 'Indicar um amigo.', { h: 480 }))}
      <div class="texto-col">
        <div class="bloco"><h3>A mensagem que o aluno manda</h3>
          <div class="whats"><div class="balao">Bora treinar comigo na Raça Fight? A aula experimental é grátis. Fale com eles pelo WhatsApp e diga o meu código: UWQJL9.</div></div></div>
        ${bloco('O que o aluno vê', ['O código dele, de 6 letras e números', 'As indicações: só o primeiro nome do amigo e se ele agendou ou se matriculou'])}
        ${bloco('O que o aluno consegue fazer', ['Compartilhar pelo WhatsApp ou por onde quiser'])}
        ${traz(['Indicação vira número: quem trouxe quem, e quantas viraram matrícula', 'O valor e as regras do desconto são da academia, no Admin'])}
      </div>
    </div>` })

  // ───────────────────────────────────────────── 12. avisos
  add({ id: 'avisos', olho: 'Parte 3 · Avisos', titulo: 'Avisos da academia e notificações',
    lide: 'A academia fala com todos os alunos, ou o professor fala com a turma dele. A aula cancelada avisa sozinha. E o aluno escolhe o que quer receber.',
    corpo: `<div class="palco">
      ${cels(cel('e:notificacoes-escuro', 'Na tela bloqueada.', { h: 470 }), cel('a:avisos-aluno', 'Perfil › Avisos.', { h: 470 }))}
      <div class="texto-col">
        ${bloco('O que chega', ['<b>Aviso da academia</b>, no Início e, até uma vez por dia, no celular', '<b>Aviso da turma</b>, do professor', '<b>Aula cancelada</b>, na hora', '<b>Lembrete da aula</b>, se o aluno ligar: 30 min, 1 h ou 2 h antes', '<b>Graduação</b> registrada e exame marcado'])}
        ${bloco('As regras que protegem o aluno', ['Das 22h às 7h nada toca', 'No máximo 3 avisos por dia; o resto fica dentro do app', 'Aviso só de texto, curto, sem link e sem citar aluno'])}
        ${traz('Um canal oficial que não depende do grupo de WhatsApp, e que ninguém silencia por excesso.')}
      </div>
    </div>` })

  // ───────────────────────────────────────────── 13. perfil
  add({ id: 'perfil', olho: 'Parte 3 · Perfil', titulo: 'O perfil e os dados que são opcionais',
    lide: 'Para usar o app, bastam o nome e o e-mail. Peso, altura, lesão e contato de emergência são opcionais, e a academia só vê os dados do corpo se o aluno ligar a chave.',
    corpo: `<div class="palco">
      ${cels(cel('a:perfil-aluno', 'Perfil.', { h: 450 }), cel('a:meus-dados', 'Meus dados.', { h: 450 }), cel('a:quem-pode-ver', 'Quem pode ver, desligada.', { h: 450 }))}
      ${texto(['A academia e desde quando é aluno', 'Meus dependentes, Indicar um amigo, Avisos, Conta'],
        ['Preencher só o que quiser', 'Decidir quem vê os dados do corpo', 'Aparecer ou não em Atletas', 'Apagar a conta'],
        'A academia pede menos e o aluno confia mais. Mostrar ao aluno as mensalidades dele é uma escolha do dono (pergunta do PDF do Admin).')}
    </div>` })

  // ───────────────────────────────────────────── 14. kids
  add({ id: 'kids', olho: 'Parte 3 · Kids', titulo: 'A conta é dos pais, com os filhos dentro',
    lide: 'Criança não tem conta. Quem entra é o pai, a mãe ou o responsável, com um cartão para cada filho. A foto da criança fica desligada até o responsável autorizar.',
    corpo: `<div class="palco">
      ${cels(cel('a:kids-inicio', 'O Início da Carla.', { h: 470 }), cel('a:kids-dependente', 'O Pedro, filho dela.', { h: 470 }))}
      ${texto(['A próxima aula de cada filho', 'A faixa, as presenças e os avisos da turma', 'O resultado do exame do próprio filho'],
        ['Marcar a presença do filho', 'Preencher a saúde do filho, se quiser', '<b>Autorizar a imagem, que começa desligada</b>', 'Aos 18 anos, o filho ganha a própria conta'],
        'Os pais acompanham a frequência sem perguntar na recepção, e a academia segue o que a lei pede para dado de criança.',
        `<div class="caixa caixa--vermelha"><b class="rot">Sem rosto de criança</b>Sem a autorização, nenhuma foto do filho aparece no app (atletas, eventos, técnicas). Nenhuma criança tem lista de colegas nem recebe mensagem.</div>`, 'os pais')}
    </div>` })

  // ───────────────────────────────────────────── 15. privacidade
  add({ id: 'privacidade', olho: 'Privacidade', titulo: 'Privacidade, em linguagem simples',
    lide: 'Dado de saúde e dado de criança pedem cuidado. Estas são as regras que o app do aluno segue, do jeito que o aluno vai entender.',
    corpo: `<div class="quatro" style="grid-template-columns:repeat(3,1fr);gap:16px 20px">
      ${bloco('O app pede pouco', ['Nome e e-mail para entrar', 'Todo o resto é opcional', 'Sem localização (GPS), sem câmera para check-in'])}
      ${bloco('Cada um vê o que é seu', ['O aluno vê a própria presença e a própria faixa, nunca a de outro', 'O professor vê nome, faixa e presença; os dados do corpo só se o aluno deixar', 'Ninguém da equipe vê valor de mensalidade'])}
      ${bloco('Criança, só com os pais', ['A conta é do responsável', 'Foto do filho desligada até ele autorizar', 'Saúde do filho opcional, vista pela equipe só com autorização'])}
      ${bloco('Aparecer é escolha', ['Atletas mostra só quem ligou a chave', 'Desligar tira na hora', 'Sem ranking, sem curtida, sem chat entre alunos'])}
      ${bloco('Nada vaza pelo aviso', ['Notificação sem dado de saúde e sem valor', 'Nada toca das 22h às 7h'])}
      ${bloco('Bem guardado', ['Os dados ficam no Brasil, em São Paulo, trancados (criptografados)', 'Cópia de segurança todo dia', 'O aluno pode apagar a conta'])}
    </div>
    <div class="caixa" style="margin-top:14px"><b class="rot">Quem só veio para a aula experimental</b>O nome e o WhatsApp de quem não virou aluno são apagados 180 dias depois da última aula experimental (proposta; a academia confirma).</div>` })

  // ───────────────────────────────────────────── 16. o que sai do app antigo
  add({ id: 'sai', olho: 'O que muda', titulo: 'O que sai do app antigo, o de musculação',
    lide: 'O projeto começou como um app de academia de musculação. Para a Raça Fight, o que era de musculação sai, o que serve para luta fica, e duas partes esperam a decisão de vocês.',
    corpo: `<div class="sai-fica">
      <div class="coluna-sai coluna-sai--sai"><h2>Sai</h2>${lista(['Treino com série, carga e treino A/B/C', 'O mapa muscular', 'A evolução por carga', 'Os 11 treinos prontos e os 28 exercícios de aparelho', 'O lembrete de treino (vira o lembrete de aula, ainda não ligado no celular)'])}</div>
      <div class="coluna-sai coluna-sai--fica"><h2>Fica e muda</h2>${lista(['O cronômetro vira o cronômetro de rounds', 'A tela escura do treino volta no cronômetro em tela cheia', 'O aviso da academia, e entra o aviso da turma', 'A conta, a privacidade e o funcionamento sem internet', 'O perfil do professor vira "Professores", com a faixa'])}</div>
      <div class="coluna-sai coluna-sai--espera"><h2>Espera a decisão</h2>${lista(['O <b>Plus</b> (acompanhamento pago com personal)', 'A <b>dieta</b>'])}<p class="pequeno sec" style="margin-top:8px">A recomendação é deixar os dois fora da primeira versão (página seguinte).</p></div>
    </div>
    <div class="duas" style="margin-top:18px;gap:18px">
      <div class="caixa"><b class="rot">Por que sai</b>Na luta, o que se registra é a <b>presença na aula</b> e a <b>graduação</b>, não a carga levantada. Série, carga e mapa muscular só ocupariam espaço na tela de quem treina Muay Thai ou Jiu-Jitsu.</div>
      <div class="caixa caixa--vermelha"><b class="rot">Já saiu</b>A musculação já saiu do app construído (16/10). O Plus e a dieta ficaram desligados, não apagados: voltam se vocês decidirem.</div>
    </div>` })

  // ───────────────────────────────────────────── 17. decidir
  const q = (cod, pergunta, rec) => `<div class="pergunta"><div class="pergunta__q"><span class="cod">${cod}</span>${pergunta}</div><div class="pergunta__r">${rec}</div></div>`
  add({ id: 'decidir', olho: 'O que a academia precisa decidir', titulo: 'Cinco respostas para o app do aluno',
    lide: 'Cada pergunta tem a nossa sugestão; a decisão é de vocês. Sem elas, o app anda com a sugestão.',
    corpo: `<div class="perguntas">
      ${q('1', 'O Plus e a dieta continuam?', 'O Plus era o acompanhamento pago com personal; a dieta vinha junto. <b>Sugestão:</b> os dois fora da primeira versão. A dieta, se voltar, só com nutricionista.')}
      ${q('2', 'As cinco abas ficam com estes nomes?', 'Início · Horários · Treinos · Academia · Perfil. <b>Sugestão:</b> sim, porque são os nomes dos destaques do Instagram de vocês.')}
      ${q('3', 'Mensalidade atrasada bloqueia o check-in?', '<b>Sugestão:</b> não. Só a matrícula encerrada bloqueia. Se quiserem bloquear, o aviso vai para o aluno pelo Admin, nunca na frente do professor.')}
      ${q('4', 'Quem tem 16 ou 17 anos tem conta própria?', '<b>Sugestão:</b> sim, a partir dos 16, com o responsável vendo as presenças até os 18. Até os 15, sempre na conta dos pais. Vale confirmar com um advogado.')}
      ${q('5', 'O termo da aula experimental vai para o app?', 'O termo de responsabilidade e a declaração de saúde antes da primeira aula. <b>Sugestão:</b> sim, com o texto de vocês revisado por advogado. Até lá, fica no papel, como hoje.')}
      <div class="pergunta" style="background:var(--fundo)"><div class="pergunta__q">E outras, sem pressa</div><div class="pergunta__r">A régua do cordão do Muay Thai e a idade das turmas Kids; o desconto do "Traga um amiguinho"; uma aula experimental grátis por modalidade (sugestão: sim); e a autorização de professores e atletas para aparecer com o nome real.</div></div>
    </div>` })

  // ───────────────────────────────────────────── 18. próximos passos
  add({ id: 'passos', olho: 'Próximos passos', titulo: 'Do sim até o app no celular do aluno',
    lide: 'O Admin é a primeira entrega. O app do aluno vem depois, ligado ao mesmo banco. O prazo de cada etapa se combina com o Alex quando as respostas chegarem.',
    corpo: `<div class="passos">
      ${[['Vocês respondem', 'As perguntas da página anterior, a régua do Muay Thai e a autorização de quem aparece.', 'Academia', true],
        ['App construído', 'Feito: as telas deste documento, rodando com dados de exemplo.', 'Alex', false],
        ['Servidor no ar', 'Ligado ao Admin: a matrícula feita lá libera o check-in aqui.', 'Alex', false],
        ['Teste com alunos', 'Um grupo pequeno, de uma ou duas turmas, usa o app e a chamada por algumas semanas.', 'Academia e Alex', false],
        ['Nas lojas', 'iPhone e Android, com a marca Raça Fight. A academia avisa os alunos.', 'Todos', false]]
        .map(([t, txt, quem, agora], i) => `<div class="passo ${agora ? 'passo--agora' : ''}"><div class="passo__n">${i + 1}</div><h4>${t}</h4><p>${txt}</p><p class="quem">${quem}</p></div>`).join('')}
    </div>
    <div class="duas" style="margin-top:22px;grid-template-columns:1fr 92mm;gap:20px;align-items:stretch">
      <div class="pilha">
        ${bloco('O que já está pronto', ['O app do aluno construído: entrada, vitrine, Início com o "Estou na aula", Horários, Treinos, Academia, Perfil, Kids e o cronômetro', 'O funcionamento sem internet, testado', 'Falta: o servidor, o lembrete de aula no celular e as respostas da página anterior'])}
        <div class="caixa caixa--vermelha"><b class="rot">O pedido de hoje</b>Se a proposta faz sentido, o primeiro passo é responder as cinco perguntas e mandar a régua do cordão do Muay Thai. O app do aluno nasce com elas.</div>
      </div>
      <div style="border-radius:12px;background:#000 50% 30% / cover no-repeat url('${x.fotoAcademia}');min-height:250px"></div>
    </div>` })

  return pgs
}
