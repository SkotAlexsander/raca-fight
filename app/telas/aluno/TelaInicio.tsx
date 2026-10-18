/**
 * Início do aluno (mockup `luta.html`, tela 1; mapa de luta, Parte B; F18).
 * Responde "qual é a minha próxima aula?" em um olhar: o HERÓI é a próxima
 * aula, com "Estou na aula" em vermelho cheio SÓ dentro da janela do check-in
 * (R15.2). Com dependente, um cartão por pessoa (F23.6).
 *
 * Embaixo: o aviso da academia (ou da turma), a semana em bolinhas, as faixas
 * desenhadas e os atalhos (Cronômetro, Técnicas, Eventos, Indicar um amigo).
 * Nada de "pronto para graduar" (L20) e nada financeiro.
 */
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { Botao, Cartao, EstadoVazio, Icone, Linha, Texto } from '@/componentes';
import { useAvisoDaAcademia, useAvisosDaAcademia, useEventos, useRepositorio, useSessao } from '@/dados';
import { NOME_DO_TIPO_DE_EVENTO, proximosEventos } from '@/dominio/eventos/eventos';
import { datasComPresenca, presencasDesde } from '@/dominio/presenca/presenca';
import { graduacaoAtual } from '@/dominio/graduacao/graduacao';
import { diaDaSemanaDe, somarDias, segundaDaSemana } from '@/dominio/turmas/horario';
import { espaco } from '@/tema';
import { dataCurta, dataDaSaudacao, haQuanto, LETRA_DO_DIA, NOME_DO_DIA, plural, SEMANA_DE_SEGUNDA } from '@/componentes/formatos';
import { TelaComRolagem } from './comum/Tela';
import { CartaoDaProximaAula } from './CartaoDaProximaAula';
import { FolhaIndicarUmAmigo } from './perfil/FolhaIndicarUmAmigo';
import { useDadosLocais } from './estado/ProvedorDoAluno';
import { ErroAoCarregar, EsqueletoDaTela } from '../compartilhado/estados';
import { CartaoDeAviso, FaixaDesenhada, GradeDeAtalhos, SemanaEmBolinhas, TopoDaTela } from '../luta/pecas';
import { nomeDaModalidade, primeiroNome, publicoDaFicha, textoDaFaixa, useLutaDoAluno } from '../luta/dados';

export function TelaInicio() {
  const router = useRouter();
  const { vinculos } = useSessao();
  const luta = useLutaDoAluno();
  const locais = useDadosLocais();
  const avisoGeral = useAvisoDaAcademia().data;
  const avisos = useAvisosDaAcademia().data ?? [];
  const eventos = useEventos().data ?? [];
  const [indicar, setIndicar] = useState(false);
  const repo = useRepositorio();

  // a graduação nova (registrada pelo professor) abre a comemoração uma vez (F20.1, passo 4)
  const ultimaGraduacao = useMemo(
    () => luta.graduacoes.filter((g) => !g.anulada && g.origem !== 'inicial').sort((a, b) => Date.parse(a.registradaEm) - Date.parse(b.registradaEm)).at(-1),
    [luta.graduacoes],
  );
  useEffect(() => {
    if (!ultimaGraduacao || !luta.usuario) return;
    const chave = `graduacao-vista.${luta.usuario.id}`;
    const vista = repo.lerDoAparelho(chave);
    repo.gravarNoAparelho(chave, ultimaGraduacao.id);
    // na primeira abertura só guarda (não comemora o que é antigo)
    if (vista && vista !== ultimaGraduacao.id) router.push({ pathname: '/comemoracao', params: { id: ultimaGraduacao.id } });
  }, [ultimaGraduacao, luta.usuario, repo, router]);

  const pendente = vinculos.find((v) => v.papel === 'aluno' && v.estado === 'pendente') ?? null;
  const hoje = luta.hoje;
  const nome = luta.usuario?.nome ?? '';

  // o aviso mais recente: da academia para todos ou de uma turma de quem ele cuida (R22.1)
  const turmasDele = new Set(luta.fichas.flatMap((f) => f.turmaIds));
  const avisoDaTurma = avisos
    .filter((a) => a.turmaId && turmasDele.has(a.turmaId) && !a.retiradoEm && hoje && somarDias(a.publicadoEm.slice(0, 10), a.validadeDias) >= hoje)
    .sort((a, b) => Date.parse(b.publicadoEm) - Date.parse(a.publicadoEm))[0];
  const aviso = [avisoGeral, avisoDaTurma].filter((a) => !!a).sort((a, b) => Date.parse(b!.publicadoEm) - Date.parse(a!.publicadoEm))[0] ?? null;
  const avisoVisivel = luta.vinculoAtivo && aviso && locais.avisoDispensado !== aviso.id ? aviso : null;
  const turmaDoAviso = avisoVisivel?.turmaId ? luta.luta?.turmas.find((t) => t.id === avisoVisivel.turmaId)?.nome : null;

  // a semana (segunda a domingo) de quem treina: o próprio aluno ou, sem ficha dele, o primeiro dependente
  const principal = luta.minhaFicha ?? luta.fichas[0] ?? null;
  const semana = useMemo(() => {
    if (!hoje || !principal) return null;
    const seg = segundaDaSemana(hoje);
    const dom = somarDias(seg, 6);
    const feitas = datasComPresenca(luta.presencas.filter((p) => p.alunoId === principal.alunoId), seg, dom);
    const dias = SEMANA_DE_SEGUNDA.map((d, i) => {
      const data = somarDias(seg, i);
      return { letra: LETRA_DO_DIA[d], rotulo: NOME_DO_DIA[d], numero: +data.slice(8, 10), feito: feitas.has(data), hoje: data === hoje, semAula: diaDaSemanaDe(data) === 'dom' };
    });
    return { dias, total: feitas.size };
  }, [hoje, principal, luta.presencas]);

  const proximoEvento = hoje ? proximosEventos(eventos, hoje)[0] : undefined;

  if (luta.erro) {
    return (
      <TelaComRolagem semCabecalho>
        <TopoDaTela sobretitulo={hoje ? dataDaSaudacao(hoje) : undefined} titulo={`Olá, ${primeiroNome(nome)}`} avatar={nome} />
        <Cartao>
          <ErroAoCarregar aoTentar={luta.tentarDeNovo} />
        </Cartao>
      </TelaComRolagem>
    );
  }

  return (
    <TelaComRolagem semCabecalho vao={espaco[6]}>
      <TopoDaTela
        sobretitulo={hoje ? dataDaSaudacao(hoje) : undefined}
        titulo={`Olá, ${primeiroNome(nome)}`}
        avatar={nome || '?'}
        acao={<Botao variante="vidro" tamanho="icone" icone="sino" rotuloAcessivel="Avisos" aoTocar={() => router.push('/perfil/avisos')} />}
      />

      {luta.carregando ? <EsqueletoDaTela heroi={300} linhas={2} /> : null}

      {!luta.carregando && luta.fichas.length === 0 ? (
        <Cartao>
          {pendente ? (
            <View style={{ flexDirection: 'row', gap: espaco[3], alignItems: 'flex-start' }}>
              <Icone nome="relogio" cor="textoSecundario" />
              <View style={{ flex: 1, gap: espaco[1] }}>
                <Texto variante="corpoForte">Aguardando a recepção confirmar</Texto>
                <Texto variante="corpoPequeno" cor="textoSecundario">
                  Você pediu para entrar na {pendente.academia.nome}. Enquanto isso, veja os horários, os professores e as técnicas.
                </Texto>
                <Botao variante="texto" rotulo="Ver os horários" intrinseco aoTocar={() => router.push('/horarios')} />
              </View>
            </View>
          ) : (
            <EstadoVazio ilustracao="nenhum-aluno" titulo={luta.vinculoAtivo ? 'Sua matrícula ainda não chegou' : 'Você ainda não está numa academia'} texto={luta.vinculoAtivo ? 'Quando a recepção ligar as suas turmas, a próxima aula aparece aqui.' : 'Com o código da academia, a sua próxima aula aparece aqui.'}>
              {!luta.vinculoAtivo ? <Botao variante="primario" rotulo="Tenho um código" aoTocar={() => router.push('/perfil/academia')} /> : null}
              <Botao variante="secundario" rotulo="Ver os horários" aoTocar={() => router.push('/horarios')} />
            </EstadoVazio>
          )}
        </Cartao>
      ) : null}

      {/* o herói: a próxima aula de cada pessoa de quem ele cuida */}
      {!luta.carregando && luta.luta
        ? luta.fichas.map((f) => <CartaoDaProximaAula key={f.alunoId} ficha={f} luta={luta.luta!} ajustes={luta.ajustes} presencas={luta.presencas} equipe={luta.equipe} agora={luta.agora} usuarioId={luta.usuario?.id ?? ''} doUsuario={f.alunoId === luta.usuario?.id} />)
        : null}

      {avisoVisivel ? (
        <CartaoDeAviso de={`${turmaDoAviso ?? luta.luta?.contato.nomeCurto ?? 'Academia'} · ${haQuanto(avisoVisivel.publicadoEm)}`} texto={avisoVisivel.texto} aoDispensar={() => locais.dispensarAviso(avisoVisivel.id)} />
      ) : null}

      {semana ? (
        <View style={{ gap: espaco[3] }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: espaco[3] }}>
            <View style={{ flexShrink: 1 }}>
              <Texto variante="titulo3" accessibilityRole="header">
                Sua semana
              </Texto>
              <Texto variante="corpoPequeno" cor="textoSecundario">
                {principal && principal.alunoId !== luta.usuario?.id ? `Aulas em que ${primeiroNome(principal.nome)} esteve` : 'Aulas em que você esteve'}
              </Texto>
            </View>
            <Texto variante="titulo3" accessible accessibilityLabel={`${plural(semana.total, 'aula', 'aulas')} nesta semana`}>
              {plural(semana.total, 'aula', 'aulas')}
            </Texto>
          </View>
          <SemanaEmBolinhas dias={semana.dias} />
        </View>
      ) : null}

      {luta.luta && luta.fichas.length ? cartaoDasFaixas() : null}

      {proximoEvento ? (
        <Cartao padding={0}>
          <Linha icone="trofeu" titulo={proximoEvento.nome} apoio={`${dataCurta(proximoEvento.data)} · ${proximoEvento.local} · ${NOME_DO_TIPO_DE_EVENTO[proximoEvento.tipo]}`} aoTocar={() => router.push({ pathname: '/academia/evento/[id]', params: { id: proximoEvento.id } })} />
        </Cartao>
      ) : null}

      <GradeDeAtalhos
        atalhos={[
          { icone: 'cronometro-round', rotulo: 'Cronômetro', aoTocar: () => router.push('/cronometro') },
          { icone: 'luva', rotulo: 'Técnicas', aoTocar: () => router.push('/academia/tecnicas') },
          { icone: 'trofeu', rotulo: 'Eventos', aoTocar: () => router.push('/academia/eventos') },
          { icone: 'convite', rotulo: 'Indicar um amigo', aoTocar: () => setIndicar(true) },
        ]}
      />
      <FolhaIndicarUmAmigo visivel={indicar} aoFechar={() => setIndicar(false)} />
    </TelaComRolagem>
  );

  /** As faixas de cada modalidade com régua (R16.9, R16.10): sem "pronto para graduar". */
  function cartaoDasFaixas() {
    const linhas = luta.fichas.flatMap((f) =>
      f.modalidadeIds.map((m) => {
        const faixa = textoDaFaixa(luta.luta, luta.graduacoes, f.alunoId, m, publicoDaFicha(f));
        if (!faixa) return null;
        const g = graduacaoAtual(luta.graduacoes, f.alunoId, m);
        const desde = presencasDesde(luta.presencas.filter((p) => p.alunoId === f.alunoId), m, g?.data ?? null);
        const quem = f.alunoId === luta.usuario?.id ? '' : `${primeiroNome(f.nome)} · `;
        const apoio = faixa.aConfigurar && g ? 'régua a confirmar com a academia' : `${plural(desde, 'aula', 'aulas')} desde ${g ? (g.grau > 0 ? 'o último grau' : 'a última graduação') : 'o começo'}`;
        return { chave: `${f.alunoId}-${m}`, titulo: `${quem}${nomeDaModalidade(luta.luta, m)}`, faixa, apoio };
      }),
    ).filter((x): x is NonNullable<typeof x> => !!x);
    if (!linhas.length) return null;
    return (
      <Cartao>
        <View style={{ gap: espaco[3] }}>
          <Texto variante="titulo3" accessibilityRole="header">
            {linhas.length === 1 ? 'Sua faixa' : 'Suas faixas'}
          </Texto>
          {linhas.map((l) => (
            <View key={l.chave} style={{ flexDirection: 'row', alignItems: 'center', gap: espaco[3] }}>
              <FaixaDesenhada cores={l.faixa.cores} graus={l.faixa.graus} rotuloAcessivel={l.faixa.texto} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Texto variante="corpoForte">{l.titulo}</Texto>
                <Texto variante="corpoPequeno" cor="textoSecundario">
                  {l.faixa.texto} · {l.apoio}
                </Texto>
              </View>
            </View>
          ))}
        </View>
      </Cartao>
    );
  }
}
