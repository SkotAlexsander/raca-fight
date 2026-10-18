/**
 * A chamada (mockup `luta.html`, tela 7; F19; R15.4 a R15.7, R19.5).
 *
 * - Três grupos: quem fez check-in (já marcado), quem é da turma e não fez, e
 *   a aula experimental (só o primeiro nome; o professor não vê o WhatsApp).
 *   "+ Aluno de outra turma" acrescenta alguém (com o selo "Sem esta
 *   modalidade na matrícula" quando for o caso; quem resolve é o Admin).
 * - Marcar e desmarcar é na tela (o check de mola; reduzido: esmaecer de 160).
 * - "FECHAR A CHAMADA" fica FIXO no pé, sempre visível (achado do AS): confirma
 *   o marcado, retira o check-in desmarcado ("não estava na aula") e cria quem
 *   veio sem celular. GRAVA no aparelho e entra na fila (sem Wi-Fi no tatame,
 *   R15.9), e só então vibra e avisa.
 * - Nada financeiro: nem plano, nem valor, nem atraso (R15.7, R14.6a).
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useRef, useState, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { Avatar, Botao, Campo, Cartao, EstadoVazio, FolhaInferior, Icone, Linha, Texto, useAvisoRapido, useUmPorVez } from '@/componentes';
import { useExperimentais, useFila, useGravar, useInteressados, type FichaDeLuta } from '@/dados';
import { contarNaAula, diasSemPresenca, fecharChamada, montarChamada, presentesDaChamada, ultimaPresenca } from '@/dominio/presenca/presenca';
import { aulaPeloId } from '@/dominio/turmas/turmas';
import { instanteComFusoDaAcademia } from '@/dominio/turmas/horario';
import { mudarEstadoDaExperimental, nomeNaChamada } from '@/dominio/experimental/experimental';
import type { Id } from '@/dominio/tipos';
import { borda, espaco, raio, useTema, useVibrar } from '@/tema';
import { plural } from '@/componentes/formatos';
import { TelaComRolagem } from '../aluno/comum/Tela';
import { EsqueletoDaTela } from '../compartilhado/estados';
import { FaixaDesenhada, TopoDaTela } from '../luta/pecas';
import { alunosDaTurma, primeiroNome, publicoDaFicha, textoDaFaixa, useLutaDaEquipe } from '../luta/dados';

export function TelaChamada() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const equipe = useLutaDaEquipe();
  const consultaExp = useExperimentais();
  const consultaInt = useInteressados();
  const experimentais = useMemo(() => consultaExp.data ?? [], [consultaExp.data]);
  const interessados = useMemo(() => consultaInt.data ?? [], [consultaInt.data]);
  const fila = useFila();
  const gravar = useGravar();
  const vibrar = useVibrar();
  const aviso = useAvisoRapido();
  // revisão AN: guarda só o que o professor MUDOU; o check-in que chega com a chamada aberta entra marcado
  const [marcadosAMao, setMarcadosAMao] = useState<Set<Id>>(new Set());
  const [desmarcadosAMao, setDesmarcadosAMao] = useState<Set<Id>>(new Set());
  const fechou = useRef(false);
  const [extras, setExtras] = useState<Id[]>([]);
  const [expMarcados, setExpMarcados] = useState<Set<Id>>(new Set());
  const [buscar, setBuscar] = useState(false);
  const [busca, setBusca] = useState('');
  const [confirmar, setConfirmar] = useState(false);

  const { luta } = equipe;
  const aula = luta && id ? aulaPeloId(luta.turmas, id, luta.fuso, equipe.ajustes) : null;
  const turma = aula ? luta?.turmas.find((t) => t.id === aula.turmaId) : undefined;
  const daTurma = useMemo(() => (turma ? alunosDaTurma(equipe.fichas, turma.id) : []), [turma, equipe.fichas]);
  const expDaAula = useMemo(
    () =>
      experimentais
        .filter((e) => e.aulaId === aula?.id && (e.estado === 'agendada' || e.estado === 'compareceu'))
        .map((e) => {
          const i = interessados.find((x) => x.id === e.interessadoId);
          return { experimentalId: e.id, nome: i ? nomeNaChamada(i) : 'Visitante', modalidadeId: e.modalidadeId, estado: e.estado };
        }),
    [experimentais, interessados, aula],
  );
  const grupos = aula ? montarChamada(aula.id, equipe.presencas, daTurma.map((f) => f.alunoId), expDaAula) : null;
  const marcadosAgora = presentesDaChamada({ checkins: grupos?.checkins.map((p) => p.alunoId) ?? [], marcadosAMao, desmarcadosAMao });
  const fecharUmaVez = useUmPorVez(() => fechar());

  if (!aula || !turma || !grupos || !luta) {
    return (
      <TelaComRolagem semCabecalho>
        <TopoDaTela sobretitulo="Chamada" titulo="Aula" aoVoltar={() => router.back()} />
        {equipe.carregando ? <EsqueletoDaTela heroi={null} linhas={4} /> : <EstadoVazio titulo="Esta aula não está na grade" texto="Ela pode ter mudado de horário no Admin." />}
      </TelaComRolagem>
    );
  }

  const fichaDe = (alunoId: Id) => equipe.fichas.find((f) => f.alunoId === alunoId);
  const marcar = (ids: readonly Id[], presente: boolean) => {
    const m = new Set(marcadosAMao);
    const d = new Set(desmarcadosAMao);
    for (const a of ids) {
      if (presente) {
        m.add(a);
        d.delete(a);
      } else {
        m.delete(a);
        d.add(a);
      }
    }
    setMarcadosAMao(m);
    setDesmarcadosAMao(d);
  };
  const alternar = (alunoId: Id) => {
    marcar([alunoId], !marcadosAgora.has(alunoId));
    vibrar('marcarSerie');
  };
  const presentes = new Set([...marcadosAgora]);
  const checkinsConfirmados = grupos.checkins.filter((p) => marcadosAgora.has(p.alunoId)).length;
  const retirados = grupos.checkins.filter((p) => !marcadosAgora.has(p.alunoId)).length;
  async function fechar() {
    // dois toques em "Fechar" (o segundo chega depois de o primeiro terminar) não fecham duas vezes nem voltam duas telas
    if (fechou.current || !aula || !turma || !luta) return;
    const em = instanteComFusoDaAcademia(Date.now(), luta.fuso);
    const modalidadeDe = (alunoId: Id) => {
      const ex = equipe.presencas.find((p) => p.aulaId === aula.id && p.alunoId === alunoId);
      if (ex) return ex.modalidadeId;
      const f = fichaDe(alunoId);
      return turma.modalidadeIds.find((m) => f?.modalidadeIds.includes(m)) ?? turma.modalidadeIds[0]!;
    };
    try {
      const r = fecharChamada({ aula, presencas: equipe.presencas, presentes, modalidadeDe, porId: equipe.usuario?.id ?? '', em });
      // GRAVA (aparelho + fila) antes de vibrar e de avisar
      if (r.mudadas.length) fila.registrarPresencas(r.mudadas, 'chamada');
      vibrar('concluirTreino');
    } catch {
      aviso.mostrar({ tipo: 'erro', texto: 'Não deu para salvar a chamada.' });
      return;
    }
    // a experimental marcada vira "compareceu" (R19.5); precisa de sinal e NÃO entra na fila:
    // se falhar, a tela fica aberta com a marca, para tocar em Fechar de novo (antes ela sumia)
    let faltou = 0;
    for (const e of experimentais.filter((x) => expMarcados.has(x.id) && x.estado === 'agendada')) {
      try {
        await gravar.salvarExperimental(mudarEstadoDaExperimental(e, 'compareceu', em));
      } catch {
        faltou += 1;
      }
    }
    setConfirmar(false);
    if (faltou) {
      aviso.mostrar({ tipo: 'erro', texto: `Presenças guardadas. ${faltou === 1 ? 'A experimental precisa' : 'As experimentais precisam'} de sinal: toque em Fechar de novo quando ele voltar.` });
      return;
    }
    fechou.current = true;
    aviso.mostrar({ tipo: 'sucesso', texto: fila.semRede ? 'Chamada guardada. Sobe quando o sinal voltar.' : 'Chamada fechada.' });
    router.back();
  }

  const candidatos = equipe.fichas.filter((f) => !daTurma.includes(f) && !extras.includes(f.alunoId) && !grupos.checkins.some((p) => p.alunoId === f.alunoId) && f.nome.toLocaleLowerCase('pt-BR').includes(busca.trim().toLocaleLowerCase('pt-BR')));
  const outros = extras.map(fichaDe).filter((f): f is FichaDeLuta => !!f);

  const linha = (alunoId: Id, apoio?: string, selo?: string) => {
    const f = fichaDe(alunoId);
    const nome = f ? (f.dependenteDe ? primeiroNome(f.nome) : f.nome) : 'Aluno';
    const faixa = f ? turma.modalidadeIds.map((m) => textoDaFaixa(luta, equipe.graduacoes, f.alunoId, m, publicoDaFicha(f))).find(Boolean) : null;
    return <LinhaDaChamada key={alunoId} nome={nome} faixa={faixa} apoio={apoio ?? faixa?.texto ?? undefined} selo={selo} marcado={marcadosAgora.has(alunoId)} aoTocar={() => alternar(alunoId)} />;
  };
  const semModalidade = (f: FichaDeLuta) => turma.publico !== 'aberta' && turma.publico !== 'competicao' && !turma.modalidadeIds.some((m) => f.modalidadeIds.includes(m));
  const hojeAcademia = equipe.hoje ?? aula.data;

  return (
    <TelaComRolagem
      semCabecalho
      rodape={
        <View style={{ gap: espaco[2] }}>
          <Texto variante="corpoPequeno" cor="textoSecundario" alinhar="center">
            {plural(presentes.size, 'presente', 'presentes')}
            {retirados ? ` · ${plural(retirados, 'check-in desmarcado', 'check-ins desmarcados')}` : ''}
          </Texto>
          <Botao variante="primario" tamanho="grande" rotulo="Fechar a chamada" aoTocar={() => setConfirmar(true)} testID="fechar-chamada" />
        </View>
      }
    >
      <TopoDaTela
        sobretitulo={`${turma.publico === 'aberta' ? 'Sexta OPEN' : turma.nome} · ${aula.hora}`}
        titulo="Chamada"
        aoVoltar={() => router.back()}
        acao={<Botao variante="vidro" tamanho="icone" icone="cronometro-round" rotuloAcessivel="Cronômetro de rounds" aoTocar={() => router.push('/cronometro')} />}
      />

      <Grupo titulo="Fizeram check-in" lado={`${checkinsConfirmados} de ${grupos.checkins.length} confirmados`} testID="grupo-checkins">
        {grupos.checkins.length ? grupos.checkins.map((p) => linha(p.alunoId, undefined, fichaDe(p.alunoId) && semModalidade(fichaDe(p.alunoId)!) ? 'Sem esta modalidade na matrícula' : undefined)) : <Texto variante="corpoPequeno" cor="textoSecundario" style={{ padding: espaco[4] }}>Ninguém fez check-in ainda.</Texto>}
      </Grupo>
      {grupos.checkins.length > 1 && checkinsConfirmados < grupos.checkins.length ? <Botao variante="texto" rotulo="Confirmar todos os check-ins" intrinseco aoTocar={() => marcar(grupos.checkins.map((p) => p.alunoId), true)} /> : null}

      {grupos.daTurmaSemCheckin.length ? (
        <Grupo titulo="Da turma, sem check-in">
          {grupos.daTurmaSemCheckin.map((alunoId) => {
            const ultima = ultimaPresenca(equipe.presencas.filter((p) => p.alunoId === alunoId));
            const dias = diasSemPresenca(ultima, hojeAcademia);
            return linha(alunoId, dias === null ? 'Ainda sem aula' : dias === 0 ? 'Veio hoje' : dias === 1 ? 'Última aula ontem' : `Última aula há ${dias} dias`);
          })}
        </Grupo>
      ) : null}

      {outros.length ? <Grupo titulo="De outra turma">{outros.map((f) => linha(f.alunoId, undefined, semModalidade(f) ? 'Sem esta modalidade na matrícula' : undefined))}</Grupo> : null}

      {grupos.experimentais.length ? (
        <Grupo titulo="Aula experimental">
          {expDaAula.map((e) => (
            <LinhaDaChamada
              key={e.experimentalId}
              nome={e.nome}
              apoio={e.estado === 'compareceu' ? 'Compareceu' : 'Agendada pela recepção'}
              selo="Experimental"
              marcado={e.estado === 'compareceu' || expMarcados.has(e.experimentalId)}
              aoTocar={() => {
                if (e.estado === 'compareceu') return;
                const n = new Set(expMarcados);
                if (n.has(e.experimentalId)) n.delete(e.experimentalId);
                else n.add(e.experimentalId);
                setExpMarcados(n);
                vibrar('marcarSerie');
              }}
            />
          ))}
        </Grupo>
      ) : null}

      <Botao variante="secundario" icone="mais" rotulo="Aluno de outra turma" aoTocar={() => setBuscar(true)} />
      <Texto variante="corpoPequeno" cor="textoSecundario">
        O check-in que ficar pendente às 23:59 confirma sozinho, com a marca “sem chamada”. Dá para corrigir até 7 dias depois.
      </Texto>

      <FolhaInferior visivel={buscar} aoFechar={() => setBuscar(false)} titulo="Aluno de outra turma" tipo="lista">
        <View style={{ gap: espaco[3] }}>
          <Campo rotulo="Buscar pelo nome" icone="buscar" value={busca} onChangeText={setBusca} limpavel />
          <View>
            {candidatos.slice(0, 30).map((f) => (
              <Linha
                key={f.alunoId}
                avatar={f.nome}
                titulo={f.dependenteDe ? primeiroNome(f.nome) : f.nome}
                apoio={semModalidade(f) ? 'Sem esta modalidade na matrícula' : f.turmaIds.map((t) => luta.turmas.find((x) => x.id === t)?.nome).filter(Boolean).join(', ')}
                aoTocar={() => {
                  setExtras((x) => [...x, f.alunoId]);
                  marcar([f.alunoId], true);
                  setBuscar(false);
                  setBusca('');
                }}
              />
            ))}
          </View>
        </View>
      </FolhaInferior>

      <FolhaInferior
        visivel={confirmar}
        aoFechar={() => setConfirmar(false)}
        titulo="Fechar a chamada?"
        rodape={
          <>
            <Botao rotulo="Voltar" variante="secundario" aoTocar={() => setConfirmar(false)} />
            <Botao rotulo="Fechar" carregando={fecharUmaVez.ocupado} aoTocar={() => void fecharUmaVez.executar()} testID="confirmar-fechar-chamada" />
          </>
        }
      >
        <Texto variante="corpo" cor="textoSecundario">
          {plural(presentes.size, 'presente', 'presentes')}
          {retirados ? ` · ${plural(retirados, 'check-in retirado', 'check-ins retirados')} ("não estava na aula")` : ''}
          {expMarcados.size ? ` · ${plural(expMarcados.size, 'experimental', 'experimentais')}` : ''}. As presenças ficam confirmadas.
        </Texto>
      </FolhaInferior>
      {contarNaAula(aula.id, equipe.presencas) === 0 && grupos.daTurmaSemCheckin.length === 0 && !grupos.experimentais.length ? (
        <Cartao>
          <Texto variante="corpoPequeno" cor="textoSecundario">
            Aula sem turma fixa: quem chega faz o check-in pelo app, ou entra aqui por “Aluno de outra turma”.
          </Texto>
        </Cartao>
      ) : null}
    </TelaComRolagem>
  );
}

function Grupo({ titulo, lado, children, testID }: { titulo: string; lado?: string; children: ReactNode; testID?: string }) {
  const { cores, sombras } = useTema();
  return (
    <View style={{ gap: espaco[2] }} testID={testID}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: espaco[2] }}>
        <Texto variante="titulo3" accessibilityRole="header">
          {titulo}
        </Texto>
        {lado ? (
          <Texto variante="corpoPequeno" cor="textoSecundario" testID={testID ? `${testID}-contagem` : undefined}>
            {lado}
          </Texto>
        ) : null}
      </View>
      <View accessibilityRole="list" style={{ backgroundColor: cores.superficie, borderRadius: raio.cartao, boxShadow: sombras.sombra2, overflow: 'hidden' }}>
        {children}
      </View>
    </View>
  );
}

function LinhaDaChamada({ nome, apoio, selo, faixa, marcado, aoTocar }: { nome: string; apoio?: string; selo?: string; faixa?: { cores: string[]; graus: number } | null; marcado: boolean; aoTocar: () => void }) {
  const { cores, reduzirMovimento } = useTema();
  return (
    <Pressable
      role="listitem"
      onPress={aoTocar}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: marcado }}
      aria-checked={marcado}
      accessibilityLabel={`${nome}${selo ? `, ${selo}` : ''}, ${marcado ? 'presente' : 'não marcado'}`}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: espaco[3], minHeight: 56, paddingVertical: espaco[2], paddingLeft: espaco[4], paddingRight: espaco[3], borderTopWidth: borda.fina, borderTopColor: cores.regua, backgroundColor: pressed ? cores.superficieElevada : 'transparent' })}
    >
      <Avatar nome={nome} tamanho={40} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Texto variante="corpoForte" numberOfLines={1}>
          {nome}
        </Texto>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco[2] }}>
          {faixa && faixa.cores.length ? <FaixaDesenhada cores={faixa.cores} graus={faixa.graus} pequena /> : null}
          {apoio ? (
            <Texto variante="corpoPequeno" cor="textoSecundario" numberOfLines={1} style={{ flexShrink: 1 }}>
              {apoio}
            </Texto>
          ) : null}
        </View>
        {selo ? (
          <Texto variante="legenda" cor="marca" numberOfLines={1}>
            {selo}
          </Texto>
        ) : null}
      </View>
      <View style={{ width: 40, height: 40, borderRadius: raio.redondo, alignItems: 'center', justifyContent: 'center', backgroundColor: marcado ? cores.viva : 'transparent', borderWidth: marcado ? 0 : borda.media, borderColor: cores.borda }}>
        {marcado ? (
          <Animated.View entering={reduzirMovimento ? FadeIn.duration(160) : ZoomIn.springify().damping(12)}>
            <Icone nome="marcar" tamanho={20} cor={cores.vivaTexto} />
          </Animated.View>
        ) : null}
      </View>
    </Pressable>
  );
}
