/**
 * Porta "Sou aluno", depois da conta (F13.3, passos 4 a 8; mockups/entrada.html,
 * quadros B5–B8): a academia pelo código, o objetivo e os dias por semana
 * (tudo opcional, com "Pular") e "Quem pode ver" (só se há academia E o aluno
 * respondeu o objetivo, que é dado de saúde, R6.1). Nenhuma tela trava.
 *
 * No fim (Entendi ou o último Pular), GRAVA pelo repositório: a conta nova,
 * o vínculo pendente com a academia do código e as respostas; depois entra
 * com a conta nova (agente AA, P11).
 */
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Icone, LinhaComChave, Texto, useAvisoRapido, Vidro } from '@/componentes';
import { diasPelaFrequencia } from '@/dominio/avisos';
import { OBJETIVOS } from '@/dominio/tipos';
import { alvo, controle, espaco, raio, useTema } from '@/tema';
import { NOME_DO_OBJETIVO, SEMANA_DE_SEGUNDA } from '@/componentes/formatos';
import { lerEntrada, mudarEntrada, useEntrada } from './fluxo';
import { BarraDoPasso, CaixasDeCodigo, CartaoDaAcademia, Mola, Opcao, Passos, Pilula, TelaDaEntrada, TituloDoPasso } from './pecas';
import { acharPeloCodigoDosAlunos, contaNovaSimulada, useAcademias } from './simulacao';
import { ErroSemSinal, useGravar } from '@/dados';
import type { Usuario } from '@/dominio/tipos';
import { AMBIENTE_PADRAO } from '@/dominio/ambiente';
import { useEntrarComConta } from './TelasDeConta';

/** Voltar com a pilha vazia (a página foi recarregada no meio da entrada) leva ao passo anterior, em vez de não fazer nada (agente AB). */
const voltarPara = (router: ReturnType<typeof useRouter>, anterior: '/sua-academia' | '/objetivo' | '/dias-por-semana') => () => (router.canGoBack() ? router.back() : router.replace(anterior));

/**
 * Fecha o caminho do aluno: GRAVA a conta nova, o vínculo pedido e as
 * respostas, e entra com ela. O objetivo é dado de saúde: só a academia
 * autorizada vê ("Quem pode ver", R6.4); sem academia, nada é autorizado.
 */
function useConcluirAluno() {
  const entrarCom = useEntrarComConta();
  const gravar = useGravar();
  const aviso = useAvisoRapido();
  // duplo toque em "Entendi"/"Continuar" criava DUAS contas (ou dava "já existe" depois de criar) — agente AB
  const emAndamento = useRef(false);
  // a conta já criada numa tentativa que falhou depois (sem sinal no pedido): "Tentar de novo" não cria outra (agente AG)
  const contaCriada = useRef<Usuario | null>(null);
  return async () => {
    if (emAndamento.current) return;
    emAndamento.current = true;
    const { academia, contaNova, objetivo, dias, autorizaAcademia } = lerEntrada();
    try {
      const conta = contaCriada.current ?? (await gravar.criarConta(contaNova ?? contaNovaSimulada()));
      contaCriada.current = conta;
      if (academia) await gravar.pedirVinculo(conta.id, academia.id, 'aluno');
      if (objetivo || dias) {
        const agora = AMBIENTE_PADRAO.agora();
        const autoriza = !!academia && !!objetivo && autorizaAcademia;
        await gravar.salvarPerfilDoAluno({
          usuarioId: conta.id,
          academiaId: academia?.id ?? null,
          ...(objetivo ? { objetivo } : {}),
          ...(dias ? { frequenciaSemanalPretendida: dias } : {}),
          autorizaAcademia: autoriza,
          ...(autoriza ? { autorizacaoEm: agora } : {}),
          atualizadoEm: agora,
        });
      }
      await entrarCom(conta.id);
    } catch (e) {
      aviso.mostrar({
        texto: e instanceof ErroSemSinal ? 'Sem sinal. Criar a conta precisa de internet.' : e instanceof Error && e.message.includes('e-mail') ? 'Já existe uma conta com esse e-mail. Entre com ela.' : 'Não deu para criar a conta. Tente de novo.',
        tipo: 'erro',
      });
    } finally {
      emAndamento.current = false;
    }
  };
}

// ---------------------------------------------------------------------------
// B5 — Qual é a sua academia? (passo 1 de 3)
// ---------------------------------------------------------------------------

export function TelaSuaAcademia() {
  const router = useRouter();
  const academias = useAcademias();
  const [codigo, setCodigo] = useState('');
  const achada = codigo.length === 6 ? acharPeloCodigoDosAlunos(academias.data ?? [], codigo) : null;
  const sozinho = () => {
    mudarEntrada({ academia: null });
    router.push('/objetivo');
  };
  return (
    <TelaDaEntrada barra={<BarraDoPasso meio={<Passos atual={1} />} aoPular={sozinho} />}>
      <TituloDoPasso titulo="Qual é a sua academia?" apoio="O código está no cartaz da recepção. Sem código, você já vê os horários e as aulas." />
      <CaixasDeCodigo rotulo="Código da academia" valor={codigo} aoMudar={setCodigo} />
      {achada ? (
        <CartaoDaAcademia nome={achada.nome} legenda={`Achamos pelo código ${achada.codigoDeVinculo}.`}>
          <Texto variante="corpoPequeno" cor="textoSecundario">
            {achada.entrarSemConfirmacao ? 'Você entra na hora: esta academia não pede confirmação.' : 'A recepção confirma o seu pedido. Até lá, você já vê os horários e os professores.'}
          </Texto>
        </CartaoDaAcademia>
      ) : codigo.length === 6 && !academias.isLoading ? (
        <Texto variante="corpoPequeno" cor="erro">
          Não achamos academia com o código {codigo}. Confira no cartaz da recepção.
        </Texto>
      ) : (
        <Texto variante="corpoPequeno" cor="textoSecundario">
          Simulação: o código da Raça Fight é RCF4K2.
        </Texto>
      )}
      <Mola />
      <Pilula
        rotulo="É esta, pedir para entrar"
        desabilitado={!achada}
        aoTocar={() => {
          mudarEntrada({ academia: achada });
          router.push('/objetivo');
        }}
      />
      <Pilula variante="texto" rotulo="Seguir sem academia por enquanto" aoTocar={sozinho} />
    </TelaDaEntrada>
  );
}

// ---------------------------------------------------------------------------
// B6 — Qual é o seu objetivo? (passo 2 de 3; uma escolha só, R2.2)
// ---------------------------------------------------------------------------

export function TelaObjetivo() {
  const router = useRouter();
  const { objetivo } = useEntrada();
  const seguir = () => router.push('/dias-por-semana');
  return (
    <TelaDaEntrada
      barra={
        <BarraDoPasso
          aoVoltar={voltarPara(router, '/sua-academia')}
          meio={<Passos atual={2} />}
          aoPular={() => {
            mudarEntrada({ objetivo: null });
            seguir();
          }}
        />
      }
    >
      <TituloDoPasso titulo="Qual é o seu objetivo?" apoio="Ajuda o professor a conhecer você. Dá para mudar quando quiser." />
      <View style={{ gap: espaco[3] }} accessibilityRole="radiogroup" accessibilityLabel="Objetivo">
        {OBJETIVOS.map((o) => (
          <Opcao key={o} rotulo={NOME_DO_OBJETIVO[o]} marcada={objetivo === o} aoTocar={() => mudarEntrada({ objetivo: objetivo === o ? null : o })} />
        ))}
      </View>
      <Mola />
      <Pilula rotulo="Continuar" aoTocar={seguir} />
    </TelaDaEntrada>
  );
}

// ---------------------------------------------------------------------------
// B7 — Quantos dias por semana? (passo 3 de 3; 1 a 7, começa vazio)
// ---------------------------------------------------------------------------

function BotaoDeVidro({ icone, rotulo, aoTocar, desabilitado }: { icone: 'mais' | 'menos'; rotulo: string; aoTocar: () => void; desabilitado?: boolean }) {
  const { cores } = useTema();
  return (
    <Pressable onPress={aoTocar} disabled={desabilitado} hitSlop={(alvo.minimo - controle.icone) / 2} accessibilityRole="button" accessibilityLabel={rotulo} style={{ opacity: desabilitado ? cores.desabilitadoOpacidade : 1 }}>
      <Vidro raio={raio.redondo} semSombra estilo={{ width: controle.icone, height: controle.icone, alignItems: 'center', justifyContent: 'center' }}>
        <Icone nome={icone} />
      </Vidro>
    </Pressable>
  );
}

export function TelaDiasPorSemana() {
  const router = useRouter();
  const { dias, academia, objetivo } = useEntrada();
  const { cores } = useTema();
  const concluir = useConcluirAluno();
  const seguir = () => {
    // "Quem pode ver" só se há academia e o objetivo foi respondido (F13.3, passo 7)
    if (academia && objetivo) router.push('/quem-pode-ver');
    else void concluir();
  };
  const marcados = new Set(dias ? diasPelaFrequencia(dias) : []);
  return (
    <TelaDaEntrada
      barra={
        <BarraDoPasso
          aoVoltar={voltarPara(router, '/objetivo')}
          meio={<Passos atual={3} />}
          aoPular={() => {
            mudarEntrada({ dias: null });
            seguir();
          }}
        />
      }
    >
      <TituloDoPasso titulo="Quantos dias por semana você quer treinar?" apoio="É uma meta sua. O app usa para os lembretes de aula e não cobra nada." />
      <Vidro estilo={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: espaco[3], paddingVertical: espaco[5], paddingHorizontal: espaco[4] }}>
        <BotaoDeVidro icone="menos" rotulo="Menos um dia" desabilitado={!dias || dias <= 1} aoTocar={() => mudarEntrada({ dias: Math.max(1, (dias ?? 2) - 1) })} />
        <View style={{ alignItems: 'center' }} accessibilityRole="text" accessibilityLabel={dias ? `${dias === 1 ? '1 dia' : `${dias} dias`} por semana` : 'Nenhum número escolhido'} accessibilityLiveRegion="polite">
          <Texto variante="numeroDestaque" cor="marca">
            {dias ?? '—'}
          </Texto>
          <Texto variante="corpoForte">dias por semana</Texto>
        </View>
        <BotaoDeVidro icone="mais" rotulo="Mais um dia" desabilitado={dias === 7} aoTocar={() => mudarEntrada({ dias: Math.min(7, (dias ?? 2) + 1) })} />
      </Vidro>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: espaco[2] }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {SEMANA_DE_SEGUNDA.map((d) => (
          <View key={d} style={{ width: 12, height: 12, borderRadius: raio.redondo, backgroundColor: marcados.has(d) ? cores.viva : cores.textoSecundario, opacity: marcados.has(d) ? 1 : 0.3 }} />
        ))}
      </View>
      <Mola />
      <Pilula rotulo="Continuar" aoTocar={seguir} />
    </TelaDaEntrada>
  );
}

// ---------------------------------------------------------------------------
// B8 — Quem pode ver os seus dados (o passo 6 do F1)
// ---------------------------------------------------------------------------

export function TelaQuemPodeVer() {
  const router = useRouter();
  const { academia, autorizaAcademia } = useEntrada();
  const concluir = useConcluirAluno();
  return (
    <TelaDaEntrada barra={<BarraDoPasso aoVoltar={voltarPara(router, '/dias-por-semana')} />}>
      <TituloDoPasso titulo="Quem pode ver os seus dados" apoio="Objetivo, peso, altura e restrições são dados de saúde. Você decide quem vê." />
      <Vidro estilo={{ paddingHorizontal: espaco[4] }}>
        <LinhaComChave rotulo={`A ${academia?.nome ?? 'academia'} pode ver meus dados corporais`} ligado={autorizaAcademia} aoMudar={(v) => mudarEntrada({ autorizaAcademia: v })} />
      </Vidro>
      <Vidro estilo={{ padding: espaco[4], gap: espaco[2] }}>
        {['Desligada, a academia vê só o seu nome, a sua faixa e a presença nas aulas.', 'Dá para mudar quando quiser em Perfil › Quem pode ver meus dados.'].map((t) => (
          <View key={t} style={{ flexDirection: 'row', gap: espaco[2], alignItems: 'flex-start' }}>
            <Icone nome="escudo" tamanho={20} cor="marca" />
            <Texto variante="corpoPequeno" style={{ flex: 1 }}>
              {t}
            </Texto>
          </View>
        ))}
      </Vidro>
      <Mola />
      <Pilula rotulo="Entendi" aoTocar={() => void concluir()} />
    </TelaDaEntrada>
  );
}
