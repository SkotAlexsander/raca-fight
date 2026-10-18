// As páginas do PDF do professor e da recepção (agente AS, 15/10/2026). Cada página é um objeto; o montar.mjs põe o
// rodapé, numera e imprime. Mesmo molde do PDF do admin (docs/apresentacao/admin/paginas.mjs), para os três PDFs
// parecerem uma família.
//
// Telas: as que o AL já desenhou (luta.html, entrada.html) entram como captura, pela função `tela()`. As que ainda não
// existem são esboços em HTML (`cel()`), com a legenda "Esboço da tela". Quando houver captura com o mesmo id em
// _capturas/telas/, a captura entra no lugar do esboço sozinha (ver capturar.mjs).
//
// Nomes: todos inventados (01-especificacao/luta/05-FLUXOS.md e os mockups do AL). Nenhum nome real de professor ou
// atleta do Instagram; o montar.mjs confere. Horários: a grade real da academia (01-DADOS-REAIS.md).

const esc = (t) => String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const lista = (xs, cls = '') => `<ul class="lista ${cls}">${xs.map((x) => `<li>${x}</li>`).join('')}</ul>`
const bloco = (titulo, xs, cls = '', lcls = '') => `<div class="bloco ${cls}"><h3>${titulo}</h3>${Array.isArray(xs) ? lista(xs, lcls) : xs}</div>`
const verFazer = (ver, fazer, lcls = '') => `${bloco('O que você vê', ver, '', lcls)}${bloco('O que você consegue fazer', fazer, '', lcls)}`

// ícones (traço 2,25, do sprite de luta do AL: Lucide ISC, Tabler MIT e desenho próprio)
const ICONES = {
  hoje: '<path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0"/><path d="M12 7v5l3 2"/>',
  tatame: '<path d="M6 7.5h15l-3 11H3z"/><path d="M11 7.5l-3 11"/><path d="M16 7.5l-3 11"/><path d="M4.5 13h15"/>',
  alunos: '<circle cx="9.5" cy="8" r="3.75"/><path d="M2.75 21a6.75 6.75 0 0 1 13.5 0"/><path d="M15.5 4.5a3.75 3.75 0 0 1 0 7"/><path d="M18.5 15a6.75 6.75 0 0 1 2.75 6"/>',
  faixa: '<path d="M2.5 8h7"/><path d="M14.5 8h7"/><path d="M2.5 12h7"/><path d="M14.5 12h7"/><path d="M11 6h2a1.5 1.5 0 0 1 1.5 1.5v5a1.5 1.5 0 0 1 -1.5 1.5h-2a1.5 1.5 0 0 1 -1.5 -1.5v-5A1.5 1.5 0 0 1 11 6z"/><path d="M10.5 14l-2.5 7"/><path d="M13.5 14l2.5 7"/>',
  perfil: '<circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/>',
  checkin: '<path d="M8 2v4"/><path d="M16 2v4"/><path d="M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2H5a2 2 0 0 1 -2 -2V6a2 2 0 0 1 2 -2z"/><path d="M3 10h18"/><path d="m9 16 2 2 4 -4"/>',
  voltar: '<path d="M15 5l-7 7 7 7"/>',
  avancar: '<path d="M9 5l7 7-7 7"/>',
  buscar: '<circle cx="10.5" cy="10.5" r="6.75"/><path d="M15.5 15.5 20.5 20.5"/>',
  marcar: '<path d="M4.5 12.5l5 5L19.5 7"/>',
  sino: '<path d="M6 15.5V10a6 6 0 0 1 12 0v5.5l1.5 2h-15z"/><path d="M10 21h4"/>',
  trofeu: '<path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6.5H4.5v1.5a3 3 0 0 0 3 3"/><path d="M17 6.5h2.5v1.5a3 3 0 0 1-3 3"/><path d="M12 14v4"/><path d="M8 21h8"/><path d="M9.5 18h5"/>',
  luva: '<path d="M8.5 3h4.5a6 6 0 0 1 6 6v3.5a4.5 4.5 0 0 1 -4.5 4.5H8.5a3.5 3.5 0 0 1 -3.5 -3.5V6.5a3.5 3.5 0 0 1 3.5 -3.5z"/><path d="M5 11.5h3.5a2 2 0 0 0 2 -2V8"/><path d="M7.5 17v2.5a1.5 1.5 0 0 0 1.5 1.5h6a1.5 1.5 0 0 0 1.5 -1.5V17"/>',
  conversa: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2.5 21.5z"/>',
  mais: '<path d="M12 5v14"/><path d="M5 12h14"/>',
  cadeado: '<path d="M6.5 11h11a2 2 0 0 1 2 2v6a2 2 0 0 1 -2 2h-11a2 2 0 0 1 -2 -2v-6a2 2 0 0 1 2 -2z"/><path d="M8 11V7.5a4 4 0 0 1 8 0V11"/>',
  alerta: '<path d="M10.27 4.5a2 2 0 0 1 3.46 0l7.6 13.25A2 2 0 0 1 19.6 20.75H4.4a2 2 0 0 1-1.73-3z"/><path d="M12 9.5v4"/><circle cx="12" cy="17" r="1.25" fill="currentColor"/>',
  nuvem: '<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9z"/>',
  cel: '<rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M11 18h2"/>',
  pc: '<rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>',
}
const ic = (n, cls = 'ic') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONES[n]}</svg>`

/** A faixa desenhada (até 3 cores, R16.2): cor principal, listra do meio (faixas kids "cinza e branca"), ponta e graus. */
const faixa = (cor, graus = 0, { listra = null, ponta = '#1C1C1C', w = 56 } = {}) => {
  const h = Math.round(w / 4)
  const px = Math.round(w * 0.62), pw = Math.round(w * 0.25)
  const borda = /^#F/i.test(cor) ? '#9A9A9A' : 'rgba(0,0,0,.25)'
  let s = `<svg class="faixa-d" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true"><rect x=".5" y=".5" width="${w - 1}" height="${h - 1}" rx="2" fill="${cor}" stroke="${borda}"/>`
  if (listra) s += `<rect x="1" y="${h / 2 - 1.5}" width="${w - 2}" height="3" fill="${listra}"/>`
  s += `<rect x="${px}" y="1" width="${pw}" height="${h - 2}" fill="${ponta}"/>`
  for (let g = 0; g < graus; g++) s += `<rect x="${px + 2 + g * 3.2}" y="1" width="1.8" height="${h - 2}" fill="#fff"/>`
  return s + '</svg>'
}
const BRANCA = '#F5F5F5', AZUL = '#1F5FBF', ROXA = '#6A2C91', MARROM = '#6B3E1E', PRETA = '#1C1C1C', AMARELO = '#F2C230', CINZA = '#8E8E8E'

const ABAS = {
  prof: [['hoje', 'Hoje'], ['tatame', 'Turmas'], ['alunos', 'Alunos'], ['faixa', 'Graduação'], ['perfil', 'Perfil']],
  rec: [['hoje', 'Hoje'], ['alunos', 'Alunos'], ['checkin', 'Experimentais'], ['perfil', 'Perfil']],
}

export function paginas(d, x) {
  /** Esboço de tela de celular, na marca. */
  const cel = ({ sobre = '', titulo = '', volta = false, corpo = '', abas = 'prof', ativa = 'Hoje', hora = '19:52', folha = '' }) => `
    <div class="cel">
      <div class="cel__status"><span>${hora}</span><i></i><s><u style="height:5px"></u><u style="height:8px"></u><u style="height:11px"></u></s></div>
      <div class="cel__topo">${volta ? `<span class="volta">${ic('voltar', 'ic ic--p')}</span>` : ''}<div>${sobre ? `<div class="cel__sobre">${sobre}</div>` : ''}<div class="cel__titulo">${titulo}</div></div></div>
      <div class="cel__corpo">${corpo}</div>
      ${abas ? `<nav class="cel__abas">${ABAS[abas].map(([i, n]) => n === ativa ? `<span class="cel__aba cel__aba--on">${ic(i)}${n}</span>` : `<span class="cel__aba">${ic(i)}</span>`).join('')}</nav>` : ''}
      ${folha ? `<div class="cel__veu"></div><div class="cel__folha">${folha}</div>` : ''}
    </div>`
  const usadas = []
  /** Uma tela: a captura quando existir (as prontas do AL); senão, o esboço. */
  const tela = (id, legenda, esboco = null, { p = false } = {}) => {
    const cap = x.captura(id)
    if (cap) usadas.push(id)
    if (!cap && !esboco) throw new Error(`tela ${id}: sem captura e sem esboço (rode node capturar.mjs)`)
    const real = cap?.startsWith('../app-capturas/')
    const corpo = cap ? `<img src="${cap}" alt="Tela ${esc(id)}">` : cel(esboco)
    return `<figure class="fone ${p ? 'fone--p' : ''} ${real ? 'fone--app' : ''}" data-tela="${id}">${corpo}<figcaption><b>${real ? 'Tela do app.' : cap ? 'Tela desenhada.' : 'Esboço da tela.'}</b> ${legenda}</figcaption></figure>`
  }
  const ln = (txt, { av = '', hora = '', fim = '', cls = '' } = {}) => `<div class="c-ln ${cls}">${hora ? `<span class="c-ln__hora">${hora}</span>` : ''}${av ? (av.startsWith('<') ? av : `<span class="c-av">${av}</span>`) : ''}<span class="c-ln__txt">${txt}</span>${fim}</div>`
  const selo = (t, c = '') => `<span class="c-selo ${c}">${t}</span>`
  const chk = (on) => `<span class="c-check ${on ? 'c-check--on' : ''}">${on ? ic('marcar', 'ic ic--p') : ''}</span>`

  const pgs = []
  const add = (o) => pgs.push(o)

  // ───────────────────────────────────────────── 1. capa
  add({ id: 'capa', capa: true, html: `
    <div class="capa__texto">
      ${x.logoCompleto ? `<img class="capa__logo" src="${x.logoCompleto}" alt="Centro de Treinamento Raça Fight Gravataí">` : '<div class="capa__titulo">RAÇA FIGHT</div>'}
      <p class="capa__olho">Versão · 16 de outubro de 2026</p>
      <h1 class="capa__titulo">A equipe<br>no <em>tatame</em></h1>
      <p class="capa__sub">O que o professor e a recepção recebem no app: a aula da hora, a chamada em poucos toques, a graduação de cada aluno, o cronômetro de rounds e a aula experimental do balcão até a matrícula.</p>
      <div class="capa__ficha">
        <div><b>Para</b>Raça Fight Gravataí</div>
        <div><b>O quê</b>O app da equipe (professor e recepção)</div>
        <div><b>Junto com</b>o Admin (o seu) e o app do aluno</div>
        <div><b>Situação</b>construído, com dados de exemplo; falta o servidor</div>
      </div>
      <p class="capa__nota">Logo provisório, redesenhado a partir das fotos da academia: entra o arquivo original assim que chegar.</p>
    </div>
    <div class="capa__foto" style="background-image:url('${x.foto('capa')}');background-position:40% 50%"></div>` })

  // ───────────────────────────────────────────── 2. em uma página
  add({ id: 'resumo', olho: 'Em uma página', titulo: 'O app de quem dá a aula e de quem abre a porta',
    lide: 'O professor e a recepção usam o mesmo app, cada um com as abas do seu trabalho. Tudo o que fazem aparece no seu Admin, e nada do que é dinheiro aparece para eles.',
    corpo: `<div class="duas" style="grid-template-columns:1fr 1.05fr;gap:26px">
      <div class="pilha">
        ${bloco('O que muda no dia da equipe', [
          '<b>A aula da hora abre sozinha.</b> O professor abre o app e já vê a próxima aula, quantos alunos avisaram que chegaram e quem vem para a aula experimental.',
          '<b>A chamada leva poucos toques.</b> O aluno marca "Estou na aula" no celular; o professor só confirma. Funciona sem sinal no tatame.',
          '<b>A graduação deixa de ficar na memória.</b> O app conta aulas e tempo de cada aluno e mostra quem já pode ser avaliado. Quem gradua continua sendo o professor.',
          '<b>O cronômetro de rounds e o aviso para a turma</b> ficam no mesmo app.',
          '<b>A recepção cuida da aula experimental</b> do primeiro "oi" no WhatsApp até a matrícula que você faz no Admin.',
        ], '', 'lista--16')}
        <div class="caixa caixa--vermelha"><b class="rot">Sobre os exemplos deste documento</b>As telas marcadas "Tela do app" são o app construído, rodando com uma academia de exemplo: nomes inventados, horários da grade real. As poucas marcadas "Esboço da tela" ainda não existem no app. O servidor com os dados reais ainda não existe.</div>
      </div>
      <div class="bloco bloco--cinza"><h3>O que tem aqui</h3>
        <ol class="sumario sumario--2">
          ${[['tres-apps', 'Os três apps'], ['entrar', 'Como a equipe entra'], ['hoje', 'Hoje, a aula da hora'], ['chamada', 'A chamada'], ['presenca', 'A presença segura'],
            ['turmas', 'Turmas e a grade'], ['turma', 'Cancelar ou passar aula'], ['alunos', 'Alunos'], ['ficha', 'A ficha do aluno'], ['regua', 'A régua de graduação'],
            ['minimos', 'Quem atingiu os mínimos'], ['exame', 'O exame'], ['cronometro', 'Cronômetro de rounds'], ['aviso', 'Aviso para a turma'], ['tecnicas', 'Técnicas em vídeo'],
            ['eventos', 'Eventos e atletas'], ['perfil', 'O perfil do professor'], ['recepcao', 'Recepção: o balcão'], ['experimental', 'Aula experimental'], ['kids', 'Interessado e Kids'],
            ['privacidade', 'Privacidade'], ['decidir', 'O que decidir'], ['passos', 'Próximos passos']]
            .map(([id, t]) => `<li><b>${t}</b><span class="p">{{p:${id}}}</span></li>`).join('')}
        </ol>
      </div>
    </div>` })

  // ───────────────────────────────────────────── 3. os três apps
  const appIcone = (t, cor) => `<span class="app__icone" style="background:${cor}">${ic(t)}</span>`
  add({ id: 'tres-apps', olho: 'Como tudo se liga', titulo: 'Três apps, e o lugar do professor',
    lide: 'O aluno, a equipe e você usam apps diferentes, ligados ao mesmo banco de dados. O "Estou na aula" do aluno aparece na chamada do professor; a matrícula que você faz no Admin libera o aluno para a aula.',
    corpo: `
    <div class="apps">
      <div class="app"><div class="app__topo">${appIcone('cel', 'var(--preto)').replace('class="ic"', 'class="ic" style="color:#fff"')}<div><div class="app__nome">Aluno</div><div class="app__quem">no celular · o aluno e o responsável pelo Kids</div></div></div>
        ${lista(['Horários, turmas e avisos', 'O "Estou na aula" e as próprias presenças', 'A própria faixa e o histórico', 'Técnicas, eventos e professores'], 'lista--16')}</div>
      <div class="app app--admin"><div class="app__topo">${appIcone('cel', 'var(--vermelho)').replace('class="ic"', 'class="ic" style="color:#fff"')}<div><div class="app__nome">Professor e recepção</div><div class="app__quem">no celular · a equipe · <b style="color:var(--vermelho)">este documento</b></div></div></div>
        ${lista(['A aula do dia e a chamada', 'A presença e a graduação dos alunos dele', 'Cronômetro de rounds e aviso para a turma', 'A recepção: o balcão e a aula experimental'], 'lista--16')}</div>
      <div class="app"><div class="app__topo">${appIcone('pc', 'var(--preto)').replace('class="ic"', 'class="ic" style="color:#fff"')}<div><div class="app__nome">Admin (o seu)</div><div class="app__quem">no computador e no celular · só o dono</div></div></div>
        ${lista(['Alunos, matrículas e mensalidades', 'Turmas, horários e a régua de graduação', 'Quanto entra e quanto sai', 'Equipe, relatórios e o histórico'], 'lista--16')}</div>
    </div>
    <div class="fios"><svg viewBox="0 0 1000 34" preserveAspectRatio="none"><path d="M166 0 V16 H834 V0 M500 16 V34" fill="none" stroke="#CFCFCF" stroke-width="2"/></svg></div>
    <div class="banco" style="width:86%;justify-content:flex-start;gap:18px;padding:12px 20px">
      <span style="color:#FF6B6E;flex:none">${ic('cadeado').replace('class="ic"', 'class="ic" style="width:30px;height:30px"')}</span>
      <div><b>O professor nunca vê valores</b><div class="texto16" style="color:#E4E4E4">Nem mensalidade, nem plano, nem quem está atrasado, nem salário de ninguém. O aluno em atraso treina normalmente e o professor não fica sabendo: se a academia quiser bloquear, quem decide é você, no Admin. A regra fica dentro do banco de dados, não só na tela.</div></div></div>
    <p class="legenda" style="text-align:center;margin-top:10px">Se você também dá aula, entra no app da equipe como professor das suas turmas, e no Admin como dono.</p>` })

  // ───────────────────────────────────────────── 4. como entram
  add({ id: 'entrar', olho: 'Parte 1 · Entrar', titulo: 'Como o professor e a recepção entram no app',
    lide: 'É o mesmo app do aluno, pela porta "Sou da equipe". Você passa um código da equipe (ou manda um convite), a pessoa diz o papel, e você confirma no Admin. Sem a sua confirmação, ninguém entra como equipe.',
    corpo: `<div class="fones" style="justify-content:space-between">
      ${tela('boas-vindas', '<span class="passo-n">1</span>Abre o app e toca em "Sou da equipe".', null, { p: true })}
      ${tela('equipe-entrar', '<span class="passo-n">2</span>Cria a conta (Apple, Google ou e-mail) ou usa o convite.', null, { p: true })}
      ${tela('equipe-convite', '<span class="passo-n">3</span>Digita o código da equipe, diz o papel e espera você confirmar no Admin.', null, { p: true })}
      ${tela('dono', '<span class="passo-n">4</span>O dono que abre este app é mandado para o Admin.', null, { p: true })}
    </div>
    <div class="caixa" style="margin-top:10px"><b>O código da equipe é diferente do código dos alunos.</b> "Dono" não aparece como opção: o dono entra pelo Admin. Quando alguém sai da equipe, você tira o acesso no Admin e ele some na hora.</div>` })

  // ───────────────────────────────────────────── 5. hoje
  add({ id: 'hoje', olho: 'Parte 2 · Hoje', titulo: 'Hoje: a aula da hora em primeiro lugar',
    lide: 'A primeira coisa que o professor vê ao abrir o app é a resposta para "qual é a minha aula agora?". Exemplo: quinta-feira, 20:05, o Prof. Diego (nome inventado) tem Muay Thai Kids às 19h e Muay Thai às 20h, como na grade real.',
    corpo: `<div class="lado" style="grid-template-columns:220px 1fr;gap:34px">
      ${tela('hoje', 'A aula das 20h em destaque: 4 check-ins e 1 aula experimental.')}
      <div class="pilha" style="padding-top:4px">
        ${verFazer(['A próxima aula em destaque: hora, turma, quantos alunos já marcaram "Estou na aula" e quantos vêm para a aula experimental', 'As outras aulas dele no dia, com a chamada já fechada ou ainda aberta', 'As aulas em que ele substitui outro professor', 'Atalhos: Cronômetro, Eventos e Aviso para uma turma'],
          ['Abrir a chamada da aula com um toque', 'Abrir o cronômetro de rounds para comandar o treino', 'Mandar um aviso para uma das turmas dele', 'Ver e criar eventos (exame, aulão, campeonato)'], 'lista--16')}
        <div class="caixa caixa--preta"><b class="rot" style="color:#FF8A8C">Nada de dinheiro nesta tela</b>Nenhum número desta tela é valor. O professor vê presença, faixa e aula; mensalidade e atraso ficam só no seu Admin.</div>
      </div>
    </div>` })

  // ───────────────────────────────────────────── 6. chamada
  add({ id: 'chamada', olho: 'Parte 3 · Presença', titulo: 'A chamada: o aluno avisa, o professor confirma',
    lide: 'O aluno toca em "Estou na aula" quando chega. A presença fica esperando o professor. Na chamada, o professor confirma todos de uma vez, marca quem veio sem celular e fecha.',
    corpo: `<div class="lado" style="grid-template-columns:auto 1fr;gap:26px">
      <div class="fones" style="gap:14px">
        ${tela('aluno-inicio', '<span class="passo-n">1</span>No app do aluno: "Estou na aula" aparece de 30 min antes a 30 min depois do início.', null, { p: true })}
        ${tela('aluno-checkin-feito', '<span class="passo-n">2</span>Marcado. Fica pendente até o professor fechar a chamada.', null, { p: true })}
        ${tela('chamada', '<span class="passo-n">3</span>No app do professor: os três grupos da chamada.', null, { p: true })}
      </div>
      <div class="pilha">
        ${bloco('Na chamada, o professor', [
          '<b>Confirma</b> quem marcou "Estou na aula" (já vem marcado)',
          '<b>Marca presente</b> quem é da turma e veio sem celular, e as crianças, que não têm app',
          '<b>Desmarca</b> quem marcou de casa e não veio',
          '<b>Recebe a aula experimental</b>: vê o nome de quem vem conhecer a academia',
          '<b>Põe um aluno de outra turma</b> que veio treinar hoje (botão "Aluno de outra turma")',
          '<b>Fecha a chamada</b>: a presença fica confirmada'], '', 'lista--16')}
        <div class="caixa caixa--vermelha"><b class="rot">Turma de duas modalidades</b>No Jiu-Jitsu / Luta Livre de segunda e quarta, o aluno escolhe ao marcar em qual das duas a aula conta. Trocar a modalidade na chamada ainda não está no app.</div>
      </div>
    </div>` })

  // ───────────────────────────────────────────── 7. presença segura
  add({ id: 'presenca', olho: 'Parte 3 · Presença', titulo: 'A presença segura',
    lide: 'Três regras protegem o aluno e o professor: a chamada esquecida não apaga ninguém, o tatame sem sinal não atrapalha, e o que foi errado se corrige com motivo, sem apagar.',
    corpo: `
    <p class="texto16" style="margin-bottom:10px"><b>Uma noite de quinta, na aula de Muay Thai das 20h:</b></p>
    <div class="linha-tempo">
      ${[['19:30', 'Abre o aviso', 'O aluno já pode tocar em "Estou na aula".', false],
        ['20:00', 'Começa a aula', 'O professor abre a chamada e confirma.', true],
        ['20:30', 'Fecha o aviso', 'Depois disso, só o professor ou a recepção marcam.', false],
        ['23:00', 'Lembrete', 'Se a chamada ficou aberta, o professor recebe um aviso (se ligou).', false],
        ['23:59', 'Confirma sozinha', 'O que ficou pendente vira presença, com a marca "sem chamada".', true],
        ['7 dias', 'Dá para corrigir', 'O professor retira ou lança uma presença, sempre com motivo.', false]]
        .map(([h, t, p, v]) => `<div class="marco ${v ? 'marco--v' : ''}"><div class="marco__hora">${h}</div><h4>${t}</h4><p>${p}</p></div>`).join('')}
    </div>
    <div class="tres" style="margin-top:22px">
      <div class="caixa caixa--preta"><b class="rot" style="color:#FF8A8C">Sem sinal no tatame</b><span class="texto16">O "Estou na aula" e a chamada ficam guardados no celular e sobem sozinhos quando o sinal volta. A tela avisa: "Chamada guardada · sobe quando o sinal voltar". Nada se perde.</span></div>
      <div class="caixa"><b class="rot">Por que confirmar sozinha às 23:59</b><span class="texto16">O aluno não pode perder a presença, e a graduação dele, porque o professor esqueceu de fechar a chamada.</span></div>
      <div class="caixa"><b class="rot">O que não bloqueia</b><span class="texto16">Mensalidade atrasada não impede o "Estou na aula". Só a matrícula encerrada tira o direito. Se quiser bloquear por atraso, é decisão sua, no Admin.</span></div>
    </div>
    <p class="legenda" style="margin-top:10px">A janela de 30 min antes a 30 min depois é a proposta (pergunta L7); a academia muda no Admin. Aula cancelada não conta como falta para ninguém.</p>` })

  // ───────────────────────────────────────────── 8. turmas e grade
  const G = [
    ['Muay Thai — manhã', 'Diego', ['09h', '', '09h', '', '', '']],
    ['Muay Thai — noite 1', 'Diego', ['20h', '20h', '20h', '20h', '', '']],
    ['Muay Thai — noite 2', 'Diego', ['21h', '', '21h', '', '', '']],
    ['Boxe — manhã', 'Marcelo', ['', '09h', '', '09h', '', '']],
    ['Boxe — noite', 'Marcelo', ['', '21h', '', '21h', '', '']],
    ['Jiu-Jitsu / Luta Livre', 'Vitor', ['20h', '', '20h', '', '', '']],
    ['MMA', 'Sandro', ['', '20h', '', '20h', '', '']],
    ['Muay Thai Kids', 'Diego', ['', '19h', '', '19h', '', '']],
    ['Jiu-Jitsu Kids', 'Vitor', ['19h', '', '19h', '', '', '']],
    ['OPEN (treino livre)', 'escala do dono', ['', '', '', '', '20h–22h', '']],
    ['Treino de competição', 'só atletas', ['', '', '', '', '', '10h–12h']],
  ]
  add({ id: 'turmas', olho: 'Parte 4 · Turmas', titulo: 'As turmas do professor, na grade real', exemplo: true,
    lide: 'A grade abaixo é a que a Raça Fight publica. A turma (horário, público, professor) é montada por você no Admin; o professor vê as dele, com quantos alunos tem e quantos vêm por aula.',
    corpo: `<div class="lado lado--largo" style="grid-template-columns:minmax(0,1fr) 220px;gap:30px">
      <div class="pilha">
        <table class="grade-real"><thead><tr><th>Turma</th><th class="e">Professor (exemplo)</th><th>Seg</th><th>Ter</th><th>Qua</th><th>Qui</th><th>Sex</th><th>Sáb</th></tr></thead>
          <tbody>${G.map(([t, p, h]) => `<tr><td><b>${t}</b></td><td class="e">${p}</td>${h.map((c) => `<td class="${c ? 'h' : ''}">${c}</td>`).join('')}</tr>`).join('')}</tbody></table>
        <div class="duas" style="gap:16px">
          <div class="caixa"><b class="rot">Aula aberta e competição</b>Na OPEN de sexta, qualquer aluno matriculado marca presença e diz o que vai treinar. No sábado, só quem o professor marcou como atleta.</div>
          <div class="caixa caixa--atencao"><b class="rot">A decidir com a academia</b>As aulas das 20h e das 21h de Muay Thai são duas turmas, ou uma em dois horários? Quanto dura cada aula? Os exemplos usam duas turmas e 60 min (L1).</div>
        </div>
      </div>
      ${tela('turmas', 'As turmas do Prof. Diego, com os alunos e a média por aula (4 semanas). O exemplo tem poucos alunos por turma.', { sobre: 'Prof. Diego · Muay Thai', titulo: 'Turmas', ativa: 'Turmas', corpo: `
        <div class="c-chips"><span class="c-chip c-chip--on">Turmas</span><span class="c-chip">Técnicas</span></div>
        <div class="c-lista">
          ${ln('<b>Muay Thai — noite 1</b><small>Seg a qui · 20h</small><small>31 alunos · 17 por aula</small>', { fim: ic('avancar', 'ic ic--p') })}
          ${ln('<b>Muay Thai — noite 2</b><small>Seg e qua · 21h</small><small>18 alunos · 11 por aula</small>', { fim: ic('avancar', 'ic ic--p') })}
          ${ln('<b>Muay Thai — manhã</b><small>Seg e qua · 9h</small><small>14 alunos · 8 por aula</small>', { fim: ic('avancar', 'ic ic--p') })}
          ${ln('<b>Muay Thai Kids</b><small>Ter e qui · 19h</small><small>18 alunos · 12 por aula</small>', { fim: ic('avancar', 'ic ic--p') })}
        </div>
` })}
    </div>` })

  // ───────────────────────────────────────────── 9. uma turma
  add({ id: 'turma', olho: 'Parte 4 · Turmas', titulo: 'Cancelar uma aula ou passar a um substituto', exemplo: true,
    lide: 'Dentro da turma, o professor vê os próximos horários e os alunos. Se não puder dar a aula, cancela ou passa para outro professor da modalidade, e os alunos ficam sabendo na hora.',
    corpo: `<div class="lado" style="grid-template-columns:auto 1fr;gap:30px">
      <div class="fones">
        ${tela('turma', 'A turma por dentro: as próximas aulas, com Passar e Cancelar.', { volta: true, sobre: 'Muay Thai · ter e qui · 19h', titulo: 'Muay Thai Kids', ativa: 'Turmas', corpo: `
          <div class="c-grupo">Próximas aulas</div>
          <div class="c-lista">
            ${ln('<b>Ter, 20/10 · 19:00</b><small>Prof. Diego</small>', { fim: ic('avancar', 'ic ic--p') })}
            ${ln('<b>Qui, 22/10 · 19:00</b><small>Prof. Diego</small>', { fim: ic('avancar', 'ic ic--p') })}
          </div>
          <div class="c-grupo">Alunos <span>18</span></div>
          <div class="c-lista">
            ${ln('<b>Lia</b><small>Kruang a definir · terça</small>', { av: 'L' })}
            ${ln('<b>Nina</b><small>Kruang a definir · terça</small>', { av: 'N' })}
          </div>
          <div class="c-bt c-bt--sec c-bt--p">Aviso para a turma</div>` })}
        ${tela('turma-cancelar', 'Cancelar: o motivo e o aviso que os alunos recebem.', { volta: true, sobre: 'Muay Thai · ter e qui · 19h', titulo: 'Muay Thai Kids', ativa: 'Turmas', corpo: '<div class="c-lista">' + ln('<b>Qui, 22/10 · 19:00</b>') + '</div>', folha: `
          <h4>Aula de quinta, 22/10, 19:00</h4>
          <div class="c-bt c-bt--sec c-bt--p">Passar a outro professor</div>
          <div class="c-grupo">Ou cancelar. Motivo:</div>
          <div class="c-chips"><span class="c-chip c-chip--on">Feriado</span><span class="c-chip">Evento</span><span class="c-chip">Outro</span></div>
          <p class="c-sec">Os 18 alunos e responsáveis da turma recebem o aviso agora.</p>
          <div class="c-bt">Cancelar a aula</div>` })}
      </div>
      <div class="pilha">
        ${verFazer(['Os próximos horários da turma e quem dá cada um', 'Os alunos, com a faixa e a última presença', 'O aviso mais recente da turma'],
          ['Cancelar uma aula antes do horário, com o motivo', 'Passar a aula a outro professor da mesma modalidade: ele vê a aula no "Hoje" dele e faz a chamada', 'Escrever um aviso só para essa turma'], 'lista--16')}
        <div class="caixa"><b class="rot">O que só você muda, no Admin</b>Horário, público (adulto, Kids), professor responsável e vagas. Mudança de horário vale da semana seguinte em diante. Feriado: você cancela todas as aulas da data de uma vez (pergunta L16: o professor também cria turma? Recomendação: não).</div>
        <div class="caixa caixa--vermelha"><b class="rot">Aviso automático</b>"Aula de Muay Thai Kids de quinta, 19:00, cancelada." Quem já tinha marcado presença não perde nada.</div>
      </div>
    </div>` })

  // ───────────────────────────────────────────── 10. alunos
  add({ id: 'alunos', olho: 'Parte 5 · Alunos', titulo: 'Os alunos de cada professor', exemplo: true,
    lide: 'O professor vê os alunos das modalidades dele, com a faixa e a última presença. Os filtros respondem às perguntas do dia a dia: quem sumiu, quem é novo, quem pode ser avaliado.',
    corpo: `<div class="lado" style="grid-template-columns:220px 1fr;gap:34px">
      ${tela('alunos', 'A lista do Prof. Diego, filtro "Todos".', { sobre: 'Muay Thai', titulo: 'Alunos', ativa: 'Alunos', corpo: `
        <div class="c-busca">${ic('buscar', 'ic ic--p')}Buscar aluno</div>
        <div class="c-chips"><span class="c-chip c-chip--on">Todos</span><span class="c-chip">Sumidos</span><span class="c-chip">Novos</span></div>
        <div class="c-lista">
          ${ln(`<b>Davi Rocha</b><small>Há 15 dias</small>`, { fim: selo('Sumiu', 'c-selo--at') })}
          ${ln(`<b>Otávio Reis</b><small>Novo · ontem</small>`, { fim: selo('Novo') })}
          ${ln(`<b>Ana Paula</b><small>Kruang amarelo · hoje</small>`)}
          ${ln(`<b>Camila Moura</b><small>Kruang amarelo · hoje</small>`, { fim: selo('Atleta', 'c-selo--p') })}
        </div>` })}
      <div class="pilha">
        <table class="tabela-16"><thead><tr><th style="width:34%">Filtro</th><th>Quem aparece</th></tr></thead><tbody>
          <tr><td><b>Todos</b></td><td>Os alunos das modalidades do professor</td></tr>
          <tr><td><b>Sumidos</b></td><td>Sem presença há 14 dias ou mais (o aluno novo, há 7 dias): é hora de chamar de volta</td></tr>
          <tr><td><b>Novos</b></td><td>Entraram nos últimos 90 dias</td></tr>
          <tr><td><b>Kids</b></td><td>As crianças das turmas Kids, só com o primeiro nome</td></tr>
          <tr><td><b>Atletas</b></td><td>Quem o professor marcou como equipe de competição</td></tr>
          <tr><td><b>Atingiram os mínimos</b></td><td>Quem já cumpre tempo e aulas para ser avaliado</td></tr>
        </tbody></table>
        <div class="caixa"><b class="rot">A recepção</b>Vê todos os alunos da academia, com os mesmos filtros e mais "Vínculo pendente" (quem pediu para entrar pelo código e ainda não foi confirmado). A recepção não registra graduação.</div>
        <p class="legenda">"Kruang amarelo" é o exemplo do cordão que aparece no Instagram; a régua de Muay Thai ainda depende da academia (L3).</p>
      </div>
    </div>` })

  // ───────────────────────────────────────────── 11. ficha
  add({ id: 'ficha', olho: 'Parte 5 · Alunos', titulo: 'A ficha do aluno: o que o professor vê, e o que não vê', exemplo: true,
    lide: 'A ficha mostra o aluno na luta: modalidades, faixa, presenças e turmas. Tudo o que é dinheiro, contato pessoal e saúde fica de fora, a não ser o que o próprio aluno autorizou.',
    corpo: `<div class="lado" style="grid-template-columns:220px 1fr;gap:34px">
      ${tela('ficha', 'A ficha da Camila, vista pelo Prof. Diego.', { volta: true, sobre: 'Muay Thai · desde 2025', titulo: 'Camila Moura', ativa: 'Alunos', corpo: `
        <div class="c-cartao"><div class="c-titulo">Muay Thai</div>
          <div style="display:flex;gap:8px;align-items:center">${faixa(AMARELO, 0, { ponta: AMARELO })}<span>Kruang amarelo</span></div>
          <span class="c-sec">31 aulas desde a última graduação</span></div>
        <div class="c-cartao"><div class="c-titulo">Presença · 8 semanas</div>
          <div style="display:flex;gap:5px;align-items:flex-end;height:34px">${[2, 3, 2, 3, 1, 3, 2, 3].map((n) => `<i style="flex:1;height:${n * 10}px;background:var(--vermelho);border-radius:2px"></i>`).join('')}</div></div>
        <div class="c-lista">
          ${ln('<b>Equipe de competição</b><small>Muay Thai</small>', { fim: '<span class="c-chave c-chave--on"></span>' })}
        </div>
        <div class="c-bt c-bt--p">Registrar graduação</div>` })}
      <div class="duas" style="gap:18px;align-items:start">
        <div class="pilha">
          ${bloco('O professor vê', ['Nome e desde quando treina', 'Modalidades, faixa e graus em cada uma, e o histórico de graduações', 'A última aula e quantas aulas nos últimos 30 dias', 'As turmas em que o aluno está', 'Peso e restrições só se o aluno autorizou'], '', 'lista--16')}
          ${bloco('O professor consegue', ['Registrar uma graduação ou a faixa que o aluno trouxe de outra academia', 'Anular uma graduação errada, com o motivo (nada se apaga)', 'Ligar e desligar "atleta" na modalidade dele'], '', 'lista--16')}
        </div>
        <div class="nao"><h3>O professor NÃO vê</h3>
          ${lista(['Mensalidade, plano, preço ou desconto', 'Se o aluno está em atraso, nem quanto deve', 'O telefone do responsável pela criança, na chamada', 'A saúde do aluno (alergia, lesão, peso), se ele não autorizou', 'A frequência de um aluno para outro aluno: colega não vê colega'], 'lista--16')}
          <p class="pequeno" style="margin-top:8px;color:#CFCFCF">Se o aluno tem uma modalidade fora da matrícula, a chamada só avisa "Sem esta modalidade na matrícula". Quem resolve é você, no Admin.</p>
        </div>
      </div>
    </div>` })

  // ───────────────────────────────────────────── 12. a régua
  add({ id: 'regua', olho: 'Parte 6 · Graduação', titulo: 'Uma régua para cada modalidade, montada pela academia',
    lide: 'Cada modalidade gradua de um jeito, e algumas não graduam. Por isso a régua não fica presa no app: é uma lista que a academia monta no Admin, e o professor consulta.',
    corpo: `<div class="lado lado--largo" style="grid-template-columns:minmax(0,1fr) 220px;gap:30px">
      <div class="pilha">
        <table class="tabela-16 regua-tab"><thead><tr><th style="width:24%">Modalidade</th><th style="width:32%">A régua no app</th><th>De onde vem</th></tr></thead><tbody>
          <tr><td><b>Jiu-Jitsu</b></td><td>${faixa(BRANCA, 0, { w: 40 })} pronta</td><td>A régua oficial da IBJJF (junho de 2026): faixas, graus, idade e tempo mínimos</td></tr>
          <tr><td><b>Jiu-Jitsu Kids</b></td><td>${faixa(CINZA, 0, { listra: BRANCA, w: 40 })} pronta, falta o grau</td><td>IBJJF, de 4 a 15 anos. Falta escolher o modelo de graus (L5)</td></tr>
          <tr class="destaque"><td><b>Muay Thai</b></td><td>${faixa(AMARELO, 0, { ponta: AMARELO, w: 40 })} vazia</td><td>Não há régua única no Brasil. O professor da academia passa as cores do cordão em ordem (L3)</td></tr>
          <tr class="destaque"><td><b>Luta Livre</b></td><td>${faixa(BRANCA, 0, { w: 40 })} modelo a confirmar</td><td>Começa com branca, amarela, laranja, azul, roxa, marrom e preta, e o professor corrige (L4)</td></tr>
          <tr><td><b>Boxe e MMA</b></td><td>sem faixa</td><td>Não têm graduação. O boxe pode ter níveis da academia, se o professor já usa (L6)</td></tr>
        </tbody></table>
        <div class="duas" style="gap:16px">
          <div class="caixa"><b class="rot">Dois tipos de mínimo</b><b>Da federação</b>: idade e tempo na faixa (a IBJJF exige; a academia não diminui). <b>Da academia</b>: número de aulas, se vocês usam (L19). A tela mostra qual é qual.</div>
          <div class="caixa"><b class="rot">O tempo conta do registro no app</b>Serve para a academia se organizar. Não substitui o registro na federação, e a tela diz isso.</div>
        </div>
      </div>
      ${tela('regua', 'As réguas, na aba Graduação: só o Jiu-Jitsu adulto (IBJJF) está pronto; as outras esperam a academia, no Admin.', { volta: true, sobre: 'Jiu-Jitsu · IBJJF adulto', titulo: 'A régua', ativa: 'Graduação', corpo: `
        <div class="c-lista">
          ${ln(`<b>Branca</b><small>Qualquer idade · 4 graus</small>`, { av: faixa(BRANCA, 0, { w: 30 }) })}
          ${ln(`<b>Azul · 16 anos</b><small>Sem tempo mínimo</small>`, { av: faixa(AZUL, 0, { w: 30 }) })}
          ${ln(`<b>Roxa · 16 anos</b><small>2 anos na azul</small>`, { av: faixa(ROXA, 0, { w: 30 }) })}
          ${ln(`<b>Marrom · 18 anos</b><small>1,5 ano na roxa</small>`, { av: faixa(MARROM, 0, { w: 30 }) })}
          ${ln(`<b>Preta · 19 anos</b><small>1 ano na marrom</small>`, { av: faixa(PRETA, 0, { ponta: '#C42024', w: 30 }) })}
        </div>
` })}
    </div>` })

  // ───────────────────────────────────────────── 13. quem atingiu os mínimos
  add({ id: 'minimos', olho: 'Parte 6 · Graduação', titulo: 'Quem atingiu os mínimos. Quem gradua é o professor.', exemplo: true,
    lide: 'A aba Graduação junta os alunos que já cumprem tempo, aulas e idade para o próximo grau ou faixa. O app nunca gradua sozinho: ele só mostra a lista, e o professor decide e registra.',
    corpo: `<div class="lado" style="grid-template-columns:auto 1fr;gap:30px">
      <div class="fones">
        ${tela('graduacao', 'A aba Graduação do Prof. Márcio (Jiu-Jitsu): dois alunos atingiram os mínimos. No Muay Thai, a régua ainda está a confirmar.', { sobre: 'Prof. Vitor', titulo: 'Graduação', ativa: 'Graduação', corpo: `
          <div class="c-chips"><span class="c-chip c-chip--on">Jiu-Jitsu</span><span class="c-chip">Jiu-Jitsu Kids</span></div>
          <div class="c-grupo">Atingiram os mínimos <span>3</span></div>
          <div class="c-lista">
            ${ln(`<b>Bianca Prado</b><small>Azul, 3 graus</small><small>38 aulas, 9 meses</small>`, { av: faixa(AZUL, 3, { w: 30 }) })}
            ${ln(`<b>Gustavo Nery</b><small>Branca, 4 graus</small><small>44 aulas, 1 ano</small>`, { av: faixa(BRANCA, 4, { w: 30 }) })}
            ${ln(`<b>Helena Dias</b><small>Branca, 1 grau</small><small>22 aulas, 4 meses</small>`, { av: faixa(BRANCA, 1, { w: 30 }) })}
          </div>
          <div class="c-bt c-bt--sec c-bt--p">Exames · 1 marcado</div>` })}
        ${tela('registrar', 'Registrar a graduação do Lucas: a faixa e o grau, com a data de hoje.', { volta: true, sobre: 'Aluna desde 2024', titulo: 'Bianca Prado', ativa: 'Graduação', corpo: '', folha: `
          <h4>Registrar graduação</h4>
          <div class="c-lista">
            ${ln('<b>Azul, 4º grau</b><small>O próximo passo</small>', { fim: chk(true) })}
            ${ln('<b>Roxa</b><small>Trocar de faixa</small>', { fim: chk(false) })}
          </div>
          <div class="c-campo"><span>Data</span><i>15/10/2026</i></div>
          <div class="c-campo"><span>Quem graduou</span><i>Prof. Vitor (você)</i></div>
          <div class="c-bt">Registrar</div>` })}
      </div>
      <div class="pilha">
        ${verFazer(['Por modalidade, quem cumpre todos os mínimos, de quem cumpre há mais tempo para o mais recente', 'As crianças que passam para a régua adulta este ano (aos 16, na IBJJF)', 'Os exames marcados e os já feitos', 'A régua da modalidade, a um toque'],
          ['Registrar um grau ou uma faixa, com a data e quem graduou', 'Registrar a faixa que o aluno trouxe de outra academia', 'Anular um registro errado, com o motivo (fica riscado no histórico)'], 'lista--16')}
        <div class="caixa caixa--vermelha"><b class="rot">Do lado do aluno</b>Ele recebe um aviso e uma comemoração na tela, com a faixa desenhada. Ele vê as aulas e o tempo desde a última graduação, mas não vê "pronto para graduar": a decisão continua sendo do professor (pergunta L20).</div>
      </div>
    </div>` })

  // ───────────────────────────────────────────── 14. exame
  add({ id: 'exame', olho: 'Parte 6 · Graduação', titulo: 'O exame de graduação, num dia só', exemplo: true,
    lide: 'Para graduar vários alunos juntos, o professor marca um exame: os candidatos já vêm da lista de quem atingiu os mínimos. No dia, ele registra o resultado de cada um e fecha.',
    corpo: `<div class="lado" style="grid-template-columns:220px 1fr;gap:34px">
      ${tela('exame', 'O exame de 25/10: o resultado de cada candidato e "Fechar o exame".', { volta: true, sobre: 'Jiu-Jitsu · sáb, 14/11, 10:00', titulo: 'Exame', ativa: 'Graduação', hora: '11:40', corpo: `
        <div class="c-lista">
          ${ln('<b>Bianca Prado</b><small>Azul, 4º grau</small>', { fim: selo('Aprovada', 'c-selo--ok') })}
          ${ln('<b>Gustavo Nery</b><small>Azul</small>', { fim: selo('Aprovado', 'c-selo--ok') })}
          ${ln('<b>Helena Dias</b><small>Branca, 2º grau</small>', { fim: selo('Aprovada', 'c-selo--ok') })}
          ${ln('<b>Rui Teles</b><small>Não desta vez</small>')}
          ${ln('<b>Otávio Reis</b><small>Remarcar</small>', { fim: selo('Faltou', 'c-selo--at') })}
        </div>
        <div class="c-bt">Fechar o exame</div>` })}
      <div class="pilha">
        <ol class="passos-v">
          <li><b>Marcar.</b> Modalidade, data, hora, local e quem avalia. Pode ser um mestre de fora.</li>
          <li><b>Escolher os candidatos.</b> Os que atingiram os mínimos já vêm marcados; dá para tirar e pôr à mão.</li>
          <li><b>Avisar.</b> Os candidatos recebem o aviso, e o exame aparece nos eventos deles.</li>
          <li class="v"><b>No dia, o resultado.</b> Para cada um: aprovado (para qual grau ou faixa), não aprovado ou faltou.</li>
          <li class="v"><b>Fechar.</b> Um toque cria as graduações de todos os aprovados de uma vez.</li>
        </ol>
        <div class="duas" style="gap:16px">
          <div class="caixa"><b class="rot">Cada um vê só o seu</b>O resultado aparece para o aluno (e o responsável, no Kids) e para a equipe. Nunca numa lista para a turma.</div>
          <div class="caixa caixa--atencao"><b class="rot">Taxa do exame</b>Se houver, é assunto do Admin. O app do aluno só diz "Taxa: veja com a recepção". O professor não lida com dinheiro.</div>
        </div>
      </div>
    </div>` })

  // ───────────────────────────────────────────── 15. cronômetro
  add({ id: 'cronometro', olho: 'Parte 7 · Cronômetro', titulo: 'O cronômetro de rounds, para comandar a aula',
    lide: 'O professor escolhe o formato, aperta "Iniciar" e larga o celular: o gongo marca o começo e o fim de cada round, e uma batida avisa os 10 segundos finais. Com o celular na caixa de som, a turma inteira ouve.',
    corpo: `<div class="lado" style="grid-template-columns:220px 1fr;gap:34px">
      ${tela('cronometro', 'Round 2 de 3, Muay Thai, em tela cheia.')}
      <div class="pilha">
        <table class="tabela-16"><thead><tr><th>Formato pronto</th><th class="n">Round</th><th class="n">Intervalo</th><th class="n">Rounds</th><th>De onde vem</th></tr></thead><tbody>
          <tr class="destaque"><td><b>Boxe</b></td><td class="n">3 min</td><td class="n">1 min</td><td class="n">3</td><td>regra olímpica (World Boxing)</td></tr>
          <tr class="destaque"><td><b>Muay Thai</b></td><td class="n">3 min</td><td class="n">1 min</td><td class="n">3</td><td>regra amadora (IFMA)</td></tr>
          <tr class="destaque"><td><b>MMA</b></td><td class="n">5 min</td><td class="n">1 min</td><td class="n">3</td><td>regras unificadas do MMA</td></tr>
          <tr><td><b>Rola de Jiu-Jitsu</b></td><td class="n">5 min</td><td class="n">1 min</td><td class="n">6</td><td>prática de academia</td></tr>
          <tr><td><b>Saco</b></td><td class="n">2 min</td><td class="n">30 s</td><td class="n">6</td><td>prática de academia</td></tr>
        </tbody></table>
        <div class="tres">
          <div class="caixa"><b class="rot">Muda na hora</b>Os números de cada formato se ajustam antes de começar: 8 rounds de saco, por exemplo.</div>
          <div class="caixa"><b class="rot">Para ler de longe</b>Tela cheia, escura, só a fase, o tempo e "Round 2 de 3". A tela não apaga enquanto roda.</div>
          <div class="caixa"><b class="rot">Toca no silencioso</b>Com o app aberto, o gongo toca mesmo com o celular no silencioso. Com o app fechado, vale a notificação.</div>
        </div>
        <p class="legenda">O aluno tem o mesmo cronômetro para treinar em casa. Salvar os tempos próprios do professor e mostrar aos alunos fica para depois da primeira versão (L21).</p>
      </div>
    </div>` })

  // ───────────────────────────────────────────── 16. aviso
  add({ id: 'aviso', olho: 'Parte 8 · Avisos', titulo: 'Aviso só para a turma', exemplo: true,
    lide: '"Hoje é sparring, tragam protetor bucal." O professor escreve para os alunos de uma turma dele (e os responsáveis, no Kids), sem incomodar a academia inteira.',
    corpo: `<div class="lado" style="grid-template-columns:220px 1fr;gap:34px">
      ${tela('aviso', 'Novo aviso. No app construído, o botão do professor ainda volta ao Hoje: defeito anotado para corrigir.', { volta: true, sobre: 'Aviso para a turma', titulo: 'Novo aviso', ativa: 'Turmas', corpo: `
        <div class="c-campo"><span>Para</span><i>Muay Thai — noite 1</i></div>
        <div class="c-campo"><span>Mensagem</span><i style="min-height:84px">Hoje é sparring: tragam protetor bucal e caneleira.</i></div>
        <div class="c-sec" style="text-align:right">52 de 160</div>
        <div class="c-cartao"><span class="c-sec">Vai para os 31 alunos da turma Muay Thai — noite 1.</span></div>
        <div class="c-bt">Enviar</div>` })}
      <div class="pilha">
        <div class="duas" style="gap:18px;align-items:start">
          ${bloco('As regras do aviso', ['Até 160 letras, sem link, sem resposta', 'Não cita aluno pelo nome nem fala de saúde', 'Uma notificação por turma por dia; os outros avisos do dia aparecem só dentro do app', 'Respeita o silêncio das 22h às 7h'], '', 'lista--16')}
          <div class="pilha">
            <p class="pequeno ter">Como chega no celular do aluno:</p>
            <div class="notif"><i></i><span><b>Raça Fight · Muay Thai — noite 1</b>Hoje é sparring: tragam protetor bucal e caneleira.</span></div>
            <div class="notif"><i></i><span><b>Raça Fight</b>Aula de Muay Thai Kids de quinta, 19:00, cancelada.</span></div>
            <p class="legenda">O cancelamento de aula avisa sozinho, mesmo que a turma já tenha recebido outro aviso no dia.</p>
          </div>
        </div>
        <div class="caixa caixa--atencao"><b class="rot">A decidir</b>O aviso para a academia inteira continua com você e a recepção. O professor também pode escrever para todos? Recomendação: não, só para as turmas dele (L31).</div>
      </div>
    </div>` })

  // ───────────────────────────────────────────── 17. técnicas
  add({ id: 'tecnicas', olho: 'Parte 9 · Técnicas', titulo: 'Técnicas em vídeo, para rever em casa', exemplo: true,
    lide: 'Os vídeos que a academia já posta, como "Golpes básicos" e "Golpes de curta distância", viram uma biblioteca por modalidade dentro do app. O professor publica; o aluno revê o que viu na aula.',
    corpo: `<div class="lado" style="grid-template-columns:auto 1fr;gap:30px">
      <div class="fones">
        ${tela('tecnicas', 'As técnicas, por modalidade.', { sobre: 'Turmas · Muay Thai', titulo: 'Técnicas', ativa: 'Turmas', corpo: `
          <div class="c-chips"><span class="c-chip">Turmas</span><span class="c-chip c-chip--on">Técnicas</span></div>
          <div class="c-lista">
            ${ln('<b>Golpes básicos</b><small>Publicada · 4 min</small>')}
            ${ln('<b>Golpes de curta distância</b><small>Publicada · 3 min</small>')}
            ${ln('<b>Defesa do chute baixo</b><small>Rascunho · intermediário</small>')}
          </div>
          <div class="c-bt c-bt--p">${ic('mais', 'ic ic--p')}Nova técnica</div>` }, { p: true })}
        ${tela('tecnica-nova', 'Publicar uma técnica nova: ainda não existe no app.', { volta: true, sobre: 'Muay Thai', titulo: 'Nova técnica', ativa: 'Turmas', corpo: `
          <div class="c-campo"><span>Título</span><i>Defesa do chute baixo</i></div>
          <div class="c-campo"><span>Nível</span><i>Intermediário</i></div>
          <div class="c-campo"><span>Link do vídeo</span><i>instagram.com/p/…</i></div>
          <div class="c-bts"><span class="c-bt c-bt--sec c-bt--p">Rascunho</span><span class="c-bt c-bt--p">Publicar</span></div>` }, { p: true })}
      </div>
      <div class="pilha">
        ${verFazer(['As técnicas da modalidade dele, publicadas e em rascunho'], ['Publicar com título, nível e o link do vídeo', 'Guardar como rascunho e publicar depois', 'Arquivar o que saiu de uso, sem apagar'], 'lista--16')}
        <div class="caixa"><b class="rot">Todo aluno vê todas as modalidades</b>Quem faz Muay Thai pode ver o Jiu-Jitsu: a biblioteca também mostra a academia. As técnicas marcadas "abertas" aparecem até para quem ainda não é aluno.</div>
        <div class="caixa caixa--atencao"><b class="rot">A decidir: onde fica o vídeo</b>Recomendação para a primeira versão: colar o link do Instagram ou do YouTube, onde os vídeos já estão. Sem custo de armazenamento (L30).</div>
        <p class="legenda">Sem curtida, sem comentário e sem contagem de visualização. Vídeo com criança só com a autorização do responsável.</p>
      </div>
    </div>` })

  // ───────────────────────────────────────────── 18. eventos e atletas
  add({ id: 'eventos', olho: 'Parte 10 · Eventos', titulo: 'Eventos, lutas e os atletas da casa', exemplo: true,
    lide: 'Exame, aulão, seminário, campeonato e a noite de lutas. O professor cadastra o evento e a luta do atleta dele ("[atleta] vs [adversário], 60 kg, semi-pró") e, depois, o resultado.',
    corpo: `<div class="lado" style="grid-template-columns:auto 1fr;gap:30px">
      <div class="fones">
        ${tela('eventos', 'Os eventos, como a equipe vê.', { volta: true, sobre: 'Hoje · atalho', titulo: 'Eventos', ativa: 'Hoje', corpo: `
          <div class="c-lista">
            ${ln('<b>Exame de Jiu-Jitsu</b><small>Sáb, 14/11 · 10:00</small><small>6 candidatos</small>', { fim: ic('avancar', 'ic ic--p') })}
            ${ln('<b>Noite de lutas</b><small>Sáb, 21/11 · Lomba do Pinheiro</small><small>12 alunos vão torcer</small>', { fim: ic('avancar', 'ic ic--p') })}
          </div>
          <div class="c-grupo">Lutas da noite</div>
          <div class="c-cartao c-cartao--escuro"><span class="c-titulo">Mateus Ribeiro vs Fábio Lemos</span><span class="c-sec">Muay Thai · 60 kg · semi-pró</span></div>
          <div class="c-bts"><span class="c-bt c-bt--sec c-bt--p">+ Evento</span><span class="c-bt c-bt--p">+ Luta</span></div>` })}
        ${tela('evento', 'A noite de lutas: a luta do atleta e quem vai.', { volta: true, sobre: 'Noite de lutas · 21/11', titulo: 'Mateus Ribeiro', ativa: 'Hoje', corpo: '', folha: `
          <h4>Resultado da luta</h4>
          <div class="c-chips" style="flex-wrap:wrap"><span class="c-chip c-chip--on">Vitória</span><span class="c-chip">Derrota</span><span class="c-chip">Empate</span></div>
          <div class="c-grupo">Como</div>
          <div class="c-chips" style="flex-wrap:wrap"><span class="c-chip c-chip--on">Pontos</span><span class="c-chip">Nocaute</span><span class="c-chip">Finalização</span></div>
          <div class="c-bt">Salvar</div>` })}
      </div>
      <div class="pilha">
        ${verFazer(['Os próximos eventos e os já feitos', 'Quantos e quais alunos marcaram "Vou participar" (só a equipe vê)', 'As lutas marcadas dos atletas dele'], ['Criar evento: tipo, data, local e, se for campeonato, o link da inscrição', 'Cadastrar a luta: atleta, adversário, categoria e nível', 'Registrar o resultado e como foi'], 'lista--16')}
        <div class="caixa caixa--preta"><b class="rot" style="color:#FF8A8C">A área "Atletas" é só de quem aceitou</b>O atleta escolhe se aparece, com foto, faixa e lutas, para os outros alunos. A chave nasce desligada. Quem não ligou tem as lutas visíveis só para a equipe. Criança só com a autorização do responsável.</div>
        <p class="legenda">Sem ranking e sem placar entre alunos: o resultado é a história do atleta. A cobrança de inscrição, se houver, é do Admin. Os nomes do exemplo são inventados.</p>
      </div>
    </div>` })

  // ───────────────────────────────────────────── 19. perfil
  add({ id: 'perfil', olho: 'Parte 11 · Perfil', titulo: 'O perfil profissional do professor', exemplo: true,
    lide: 'É o que os alunos e quem ainda não é aluno veem na área "Professores": quem é, o que ensina e a graduação em cada modalidade. Sem preço e sem nota: professor não se avalia com estrelas.',
    corpo: `<div class="lado" style="grid-template-columns:auto 1fr;gap:30px">
      <div class="fones">
        ${tela('perfil', 'O perfil, como o professor edita.', { volta: true, sobre: 'Perfil profissional', titulo: 'Meu perfil', ativa: 'Perfil', corpo: `
          <div class="c-cartao" style="flex-direction:row;align-items:center;gap:10px"><span class="c-av" style="width:40px;height:40px;border-radius:20px">D</span><span><b>Prof. Diego</b><br><span class="c-sec">Muay Thai</span></span></div>
          <div class="c-lista">
            ${ln('<b>Muay Thai</b><small>Kruang preto · informado</small>')}
            ${ln('<b>Sobre mim</b><small class="quebra">Treina desde 2008. Dá aula para adultos e Kids.</small>')}
            ${ln('<b>Mostrar aos alunos</b>', { fim: '<span class="c-chave c-chave--on"></span>' })}
          </div>` }, { p: true })}
        ${tela('avisos-equipe', 'Os avisos que a equipe escolhe receber.', { volta: true, sobre: 'Avisos da equipe', titulo: 'Avisos', ativa: 'Perfil', corpo: `
          <div class="c-lista">
            ${ln('<b>Chamada aberta</b><small>Resumo às 23:00</small>', { fim: '<span class="c-chave c-chave--on"></span>' })}
            ${ln('<b>Experimentais de amanhã</b><small>Resumo às 18:00</small>', { fim: '<span class="c-chave c-chave--on"></span>' })}
            ${ln('<b>Prontos para avaliar</b><small>Segunda, 9:00</small>', { fim: '<span class="c-chave"></span>' })}
          </div>
          <p class="c-sec">Nenhum aviso mostra nome de aluno com a tela bloqueada.</p>` }, { p: true })}
      </div>
      <div class="pilha">
        ${verFazer(['A própria foto, nome, modalidades e a graduação em cada uma', 'As turmas dele, que aparecem no perfil', 'Os avisos da equipe que escolheu receber'], ['Editar foto, "Sobre mim" e formação', 'Esconder o perfil dos alunos', 'Ligar e desligar cada aviso', 'Trocar para a visão de aluno, se também treina'], 'lista--16')}
        <div class="caixa"><b class="rot">"Informado pelo professor"</b>A graduação do professor é ele quem informa. Você confirma no Admin; até lá, a tela diz "informado pelo professor". O registro profissional (CREF) é opcional, até a academia decidir (L18).</div>
        <div class="caixa caixa--preta"><b class="rot" style="color:#FF8A8C">Sem preço, sem nota</b>O perfil não mostra quanto o professor cobra, quanto ganha nem uma nota dada por aluno. Também não conta quantos alunos ele tem.</div>
      </div>
    </div>` })

  // ───────────────────────────────────────────── 20. recepção · hoje
  add({ id: 'recepcao', olho: 'Parte 12 · Recepção', titulo: 'A recepção: todas as aulas do dia, e o balcão', exemplo: true,
    lide: 'A recepção tem quatro abas: Hoje, Alunos, Experimentais e Perfil. No "Hoje", vê todas as aulas da academia, e marca a presença de quem chega pelo balcão e não usa o app.',
    corpo: `<div class="lado" style="grid-template-columns:auto 1fr;gap:30px">
      <div class="fones">
        ${tela('recepcao-hoje', 'Todas as aulas de quinta, de todos os professores.', { sobre: 'Quinta, 15 de out.', titulo: 'Hoje', abas: 'rec', ativa: 'Hoje', corpo: `
          <div class="c-lista">
            ${ln('<b>Boxe — manhã</b><small>Fechada · 7 presentes</small>', { hora: '09:00' })}
            ${ln('<b>Muay Thai Kids</b><small>Fechada · 11 presentes</small>', { hora: '19:00' })}
            ${ln('<b>Muay Thai — noite 1</b><small>Agora · 9 presenças</small>', { hora: '20:00', cls: 'c-ln--minha' })}
            ${ln('<b>MMA</b><small>Agora · 6 presenças</small>', { hora: '20:00', cls: 'c-ln--minha' })}
            ${ln('<b>Boxe — noite</b><small>2 presenças</small>', { hora: '21:00' })}
          </div>
          <div class="c-bt c-bt--p">${ic('checkin', 'ic ic--p')}Presença no balcão</div>` })}
        ${tela('recepcao-balcao', 'A chamada do MMA aberta pela recepção: "Aluno de outra turma" põe quem chegou sem o app.', { sobre: 'Quinta, 15 de out.', titulo: 'Hoje', abas: 'rec', ativa: 'Hoje', corpo: '', folha: `
          <h4>Presença no balcão</h4>
          <div class="c-busca">${ic('buscar', 'ic ic--p')}<span style="color:var(--tinta)">cá</span></div>
          <div class="c-lista">
            ${ln('<b>Cássio Lima</b><small>MMA · 20:00</small>', { av: 'CL', fim: chk(true) })}
            ${ln('<b>Cátia Nunes</b><small>Muay Thai · 20:00</small>', { av: 'CN', fim: chk(false) })}
          </div>
          <p class="c-sec">Só aparecem as aulas com o aviso aberto (30 min antes a 30 min depois).</p>` })}
      </div>
      <div class="pilha">
        ${verFazer(['Todas as aulas do dia, de todos os professores', 'Quantos marcaram presença e quantos experimentais vêm em cada uma', 'Todos os alunos, com o filtro "Vínculo pendente"'], ['Marcar a presença de quem chega pelo balcão', 'Fazer a chamada, se o professor pedir', 'Cancelar uma aula ou passar a um substituto', 'Confirmar de uma vez quem pediu para entrar como aluno', 'Escrever o aviso para a academia inteira'], 'lista--16')}
        <div class="caixa"><b class="rot">A recepção não gradua</b>Ela vê a faixa dos alunos, mas não registra graduação: isso é do professor da modalidade (e de você).</div>
        <div class="caixa caixa--atencao"><b class="rot">A recepção e o dinheiro</b>Se a recepção lança pagamento, e o que ela vê do financeiro, se decide no Admin (pergunta A1 do PDF do Admin). Neste app, nada de valor aparece.</div>
      </div>
    </div>` })

  // ───────────────────────────────────────────── 21. recepção · experimental
  add({ id: 'experimental', olho: 'Parte 12 · Recepção', titulo: 'A aula experimental, do WhatsApp até a matrícula', exemplo: true,
    lide: 'Quem quer conhecer toca em "Agendar aula experimental grátis" no app, escolhe a modalidade e cai no WhatsApp da academia com a mensagem pronta. Dali em diante, a recepção acompanha cada um.',
    corpo: `<div class="lado" style="grid-template-columns:220px 1fr;gap:34px">
      ${tela('experimentais', 'A lista de aulas experimentais da recepção.', { sobre: 'Recepção', titulo: 'Experimentais', abas: 'rec', ativa: 'Experimentais', corpo: `
        <div class="c-chips"><span class="c-chip c-chip--on">Agendadas 3</span><span class="c-chip">Vieram 2</span></div>
        <div class="c-lista">
          ${ln('<b>Igor Mattos</b><small>Muay Thai · hoje, 20:00</small>', { fim: selo('Hoje', 'c-selo--v') })}
          ${ln('<b>Fernanda Luz</b><small>Boxe · hoje, 21:00</small>', { fim: selo('Hoje', 'c-selo--v') })}
          ${ln('<b>Theo, 8 anos</b><small>Jiu-Jitsu Kids · seg, 19:00</small>', { fim: selo('Kids') })}
        </div>
        <div class="c-grupo">Vieram, sem matrícula</div>
        <div class="c-lista">
          ${ln('<b>Rodrigo Paz</b><small>MMA · terça</small>', { fim: ic('avancar', 'ic ic--p') })}
        </div>
        <div class="c-bt c-bt--p">${ic('mais', 'ic ic--p')}Nova experimental</div>` })}
      <div class="pilha">
        <ol class="passos-v">
          <li><b>O interessado</b> toca no botão do app e manda a mensagem pronta: "Olá! Quero agendar uma aula experimental de Muay Thai na Raça Fight." O app não guarda nada nesse toque.</li>
          <li><b>A recepção registra</b> no app: nome, WhatsApp, modalidade, a aula e, se veio por indicação, o código do "Traga um amiguinho".</li>
          <li class="v"><b>O professor vê</b> o nome na chamada, com o selo "Experimental". Marcou presente, a recepção vê "veio". O professor não vê o WhatsApp de ninguém.</li>
          <li><b>Faltou?</b> A recepção marca e pode remarcar para outra aula.</li>
          <li class="v"><b>Gostou?</b> A recepção toca em "Matricular" e a matrícula acontece no Admin, onde se escolhe o plano. O convite do app vai para o WhatsApp ou o e-mail do novo aluno.</li>
        </ol>
        <div class="duas" style="gap:16px">
          <div class="caixa"><b class="rot">Uma grátis por modalidade</b>Se o mesmo WhatsApp já fez uma experimental de Muay Thai, a tela avisa. Quem decide é a recepção (proposta L24).</div>
          <div class="caixa"><b class="rot">Os números ficam no Admin</b>Quantas experimentais no mês, quantas vieram e quantas viraram matrícula: você vê no funil do Admin.</div>
        </div>
      </div>
    </div>` })

  // ───────────────────────────────────────────── 22. recepção · interessado e kids
  add({ id: 'kids', olho: 'Parte 12 · Recepção', titulo: 'O cadastro do interessado e da criança, com o responsável', exemplo: true,
    lide: 'Para uma criança, quem marca a aula experimental e quem entra no app é o responsável. A criança não tem conta: ela aparece dentro da conta do pai, da mãe ou de quem cuida dela.',
    corpo: `<div class="lado" style="grid-template-columns:auto 1fr;gap:30px">
      <div class="fones">
        ${tela('experimental-nova', 'Nova experimental para uma criança, com o aviso de que esse WhatsApp já fez uma.', { volta: true, sobre: 'Nova experimental', titulo: 'Agendar', abas: 'rec', ativa: 'Experimentais', corpo: `
          <div class="c-chips"><span class="c-chip">Para si</span><span class="c-chip c-chip--on">Para uma criança</span></div>
          <div class="c-campo"><span>Criança e idade</span><i>Theo · 8 anos</i></div>
          <div class="c-campo"><span>Responsável</span><i>Carla Mendes</i></div>
          <div class="c-campo"><span>WhatsApp</span><i>(51) 98888-1234</i></div>
          <div class="c-campo"><span>Aula</span><i>Jiu-Jitsu Kids · seg 19/10, 19:00</i></div>
          <div class="c-bt">Salvar</div>` })}
        ${tela('aluno-kids', 'O Pedro, do Kids, visto pela recepção: só o primeiro nome, a faixa e a presença.', { volta: true, sobre: 'Jiu-Jitsu Kids', titulo: 'Theo', abas: 'rec', ativa: 'Alunos', corpo: `
          <div class="c-cartao"><div style="display:flex;gap:8px;align-items:center">${faixa(BRANCA, 1)}<span>Branca, 1º grau</span></div><span class="c-sec">9 aulas desde o começo</span></div>
          <div class="c-lista">
            ${ln('<b>Responsável</b><small>Carla Mendes</small>')}
            ${ln('<b>Imagem</b><small>Não autorizada</small>', { fim: ic('cadeado', 'ic ic--p') })}
            ${ln('<b>Saúde</b><small>Não compartilhada</small>', { fim: ic('cadeado', 'ic ic--p') })}
          </div>
          <p class="c-sec">Sem foto: o responsável não autorizou.</p>` })}
      </div>
      <div class="pilha">
        <ol class="passos-v passos-v--13" style="font-size:16px">
          <li style="font-size:16px"><b>Na experimental</b>, a recepção anota o primeiro nome e a idade da criança, o nome e o WhatsApp do responsável e, se houver, o código de indicação.</li>
          <li style="font-size:16px"><b>Na matrícula</b> (Admin), a criança entra como dependente na conta do responsável, que é quem paga.</li>
          <li style="font-size:16px"><b>No app</b>, o responsável vê as presenças, a faixa e os avisos da turma, e pode marcar "está na aula" pela criança.</li>
        </ol>
        <div class="caixa caixa--preta"><b class="rot" style="color:#FF8A8C">Autorização de imagem: nasce desligada</b><span class="texto16">Sem ela, nenhuma foto da criança aparece no app, nem em Atletas, nem em eventos, nem em vídeo de técnica. O responsável liga e desliga quando quiser. O termo de imagem das redes sociais da academia é outro, em papel (L28).</span></div>
        <div class="duas" style="gap:16px">
          <div class="caixa"><b class="rot">Saúde da criança</b>Alergia, asma, restrição: o responsável preenche se quiser, e a equipe só vê se ele autorizar.</div>
          <div class="caixa caixa--atencao"><b class="rot">A decidir</b>A idade das turmas Kids (L14). E se o adolescente de 16 e 17 anos tem conta própria (L27).</div>
        </div>
      </div>
    </div>` })

  // ───────────────────────────────────────────── 23. privacidade
  const S = '<span class="sim">sim</span>', N = '<span class="naov">não</span>'
  const linhasPriv = [
    ['Presença', 'as dele', 'da criança', 'das aulas dele', S, S, N],
    ['Faixa e graduação', 'as dele', 'da criança', 'das modalidades dele', S, S, 'só em Atletas, se aceitou'],
    ['Mensalidade, plano e atraso', 'a decidir (A2)', 'a decidir (A2)', N, 'a decidir (A1)', S, N],
    ['Telefone e e-mail', 'os dele', 'os dele', N, S, S, N],
    ['Saúde e peso', 'os dele', 'da criança', 'se autorizou', 'se autorizou', 'se autorizou', N],
    ['Foto da criança', '—', 'decide', 'se autorizou', 'se autorizou', 'se autorizou', 'se autorizou'],
    ['WhatsApp do interessado', '—', '—', N, S, S, N],
    ['Resultado de exame', 'o dele', 'da criança', S, S, S, N],
  ]
  add({ id: 'privacidade', olho: 'Privacidade e LGPD', titulo: 'O que fica com quem',
    lide: 'Cada pessoa vê só o que precisa. A regra fica dentro do banco de dados: mesmo que alguém tente abrir pelo caminho errado, o banco não entrega. Dado de criança tem cuidado extra, como manda a lei.',
    corpo: `<div class="lado lado--largo" style="grid-template-columns:minmax(0,1fr) 78mm;height:auto;gap:22px">
      <table class="matriz"><thead><tr><th style="width:24%"></th><th>Aluno</th><th>Responsável</th><th>Professor</th><th>Recepção</th><th>Dono</th><th>Outros alunos</th></tr></thead>
        <tbody>${linhasPriv.map((l) => `<tr><td><b>${l[0]}</b></td>${l.slice(1).map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>
      <div class="pilha">
        <div class="caixa caixa--preta"><b class="rot" style="color:#FF8A8C">Dado de criança</b>A criança não tem conta; o responsável responde por ela. Coleta-se só o necessário para a aula. O que pede autorização (imagem, saúde) pede a do responsável, separada e em destaque (LGPD, art. 14).</div>
        <div class="caixa"><b class="rot">Presença diz onde a pessoa está</b>Por isso nunca vai em notificação com nome, nem para colegas. Na tela bloqueada, os avisos da equipe não mostram nome de aluno.</div>
        <div class="caixa"><b class="rot">Quem não virou aluno</b>O cadastro do interessado é apagado 180 dias depois da última aula experimental (proposta L23).</div>
        <div class="caixa"><b class="rot">Nada some</b>Presença e graduação não se apagam: anulam-se com motivo, e fica registrado quem fez.</div>
      </div>
    </div>
    <p class="legenda" style="margin-top:8px">A1 e A2 são perguntas do PDF do Admin: se a recepção lança pagamento e se o aluno vê a própria mensalidade. "Se autorizou": só com a chave ligada pelo aluno ou, na criança, pelo responsável.</p>` })

  // ───────────────────────────────────────────── 24. o que decidir
  const q = (cod, pergunta, sugestao) => `<div class="pergunta"><div class="pergunta__q"><span class="cod">${cod}</span>${pergunta}</div><p class="pergunta__r"><b>Sugestão:</b> ${sugestao}</p></div>`
  add({ id: 'decidir', olho: 'O que decidir', titulo: 'Seis respostas do tatame que destravam a construção',
    lide: 'Sem estas respostas, a graduação e a grade não podem ser montadas do jeito da Raça Fight. A maioria é para o professor de cada modalidade responder, e cabe numa conversa.',
    corpo: `<div class="perguntas">
      ${q('L3', 'Qual é a ordem das cores do cordão do Muay Thai? Tem graus, tempo e número de aulas para cada? Vocês dizem kruang ou prajied? O Kids tem régua própria?', 'uma foto do quadro da academia, ou a lista escrita pelo professor de Muay Thai. O app nasce com a régua vazia, para preencher.')}
      ${q('L4', 'A Luta Livre de vocês é a Esportiva, sem kimono? Qual é a ordem das faixas?', 'começar com branca, amarela, laranja, azul, roxa, marrom e preta, e o professor corrige.')}
      ${q('L5', 'No Jiu-Jitsu Kids, os graus são de três em três meses (3 por faixa), de quatro em quatro (2 por faixa) ou todo mês (11 por faixa)?', 'de quatro em quatro meses, 2 graus por faixa: é o mais simples de explicar aos pais.')}
      ${q('L19', 'Há um número mínimo de aulas para cada grau e cada faixa, em cada modalidade?', 'se não houver, a lista "atingiram os mínimos" mostra todos, de quem tem mais aulas desde a última graduação para quem tem menos.')}
      ${q('L1', 'O Muay Thai das 20h e o das 21h são turmas diferentes, ou a mesma turma em dois horários? Quanto dura cada aula?', 'duas turmas (noite 1 e noite 2), de 60 minutos, até a resposta.')}
      ${q('L14', 'De que idade a que idade são as turmas Kids de Muay Thai e de Jiu-Jitsu?', 'perguntar ao professor de cada uma. A régua Kids da IBJJF vai de 4 a 15 anos.')}
    </div>
    <div class="caixa" style="margin-top:10px"><b class="rot">Outras, sem pressa</b>A janela do "Estou na aula" (L7) · a OPEN conta para a graduação? (L10) · o professor vê o telefone do responsável? (L29) · termo de responsabilidade na experimental, com advogado (L25) · os professores e atletas reais aceitam aparecer com nome e foto? (L34)</div>` })

  // ───────────────────────────────────────────── 25. próximos passos
  add({ id: 'passos', olho: 'Próximos passos', titulo: 'Do sim até a equipe no app',
    lide: 'O Admin vem primeiro; o app da equipe e o do aluno vêm depois, ligados ao mesmo banco. O prazo de cada etapa se combina com o Alex quando as respostas chegarem.',
    corpo: `<div class="passos">
      ${[['Vocês respondem', 'As seis perguntas da página anterior, com o professor de cada modalidade.', 'Academia', true],
        ['A régua montada', 'Muay Thai, Luta Livre e os graus do Kids entram no Admin, do jeito da academia.', 'Professores e Alex', false],
        ['Servidor no ar', 'O app construído (as telas deste documento) passa a gravar no banco de verdade, junto com o Admin.', 'Alex', false],
        ['Teste no tatame', 'Uma turma usa a chamada por duas semanas, inclusive sem sinal, antes de abrir para todos.', 'Academia e Alex', false],
        ['Equipe no app', 'Cada professor e a recepção entram com o código da equipe e você confirma.', 'Todos', false]]
        .map(([t, txt, quem, agora], i) => `<div class="passo ${agora ? 'passo--agora' : ''}"><div class="passo__n">${i + 1}</div><h4>${t}</h4><p>${txt}</p><p class="quem">${quem}</p></div>`).join('')}
    </div>
    <div class="duas" style="margin-top:22px;grid-template-columns:1fr 92mm;gap:20px;align-items:stretch">
      <div class="pilha">
        ${bloco('O que já está pronto', ['As regras de turma, presença, graduação, cronômetro, eventos, aula experimental e Kids, escritas', 'O app da equipe construído: Hoje, chamada, turmas, alunos, graduação, cronômetro, eventos e recepção, com dados de exemplo', 'Falta: o servidor, publicar técnica, trocar a modalidade na chamada e o aviso da turma pelo professor'], '', 'lista--16')}
        <div class="caixa caixa--vermelha"><b class="rot">O pedido de hoje</b>Uma conversa de meia hora com o professor de Muay Thai e o de Jiu-Jitsu e Luta Livre responde quase tudo da página anterior. Com isso, a próxima versão deste documento já mostra a régua de vocês.</div>
      </div>
      <div style="border-radius:12px;background:#000 50% 40% / cover no-repeat url('${x.foto('luva')}');min-height:250px"></div>
    </div>` })

  pgs.usadas = usadas
  return pgs
}
