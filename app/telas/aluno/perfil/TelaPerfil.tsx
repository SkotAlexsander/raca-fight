/**
 * Perfil (aluno) — mapa de luta, Parte B (aba Perfil): a conta, a academia,
 * Meus dependentes (R20), Indicar um amigo (R19.9), Aparecer em Atletas (só
 * para quem o professor marcou como atleta, R14.9, R18.6), Meus dados, Quem
 * pode ver, Avisos, Conta, a vibração, "Trocar de visão" e Sair.
 *
 * "Minha matrícula" (plano e situação) é do Admin (AI): o app do aluno não
 * mostra valor nenhum enquanto o Admin não definir o que mostrar.
 */
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Avatar, Botao, Cartao, FolhaInferior, GrupoDeLinhas, Linha, LinhaComChave, Texto, useGravarComAviso } from '@/componentes';
import { useConsentimentosDeAtleta, useGravar, usePreferencias, useSessao } from '@/dados';
import { espaco } from '@/tema';
import { dataCurta, plural } from '@/componentes/formatos';
import { TelaComRolagem } from '../comum/Tela';
import { FolhaIndicarUmAmigo } from './FolhaIndicarUmAmigo';
import { nomeDaModalidade, useLutaDoAluno } from '../../luta/dados';

export function TelaPerfil() {
  const router = useRouter();
  const sessao = useSessao();
  const { usuario, vinculoAtivo, vinculos } = sessao;
  const preferencias = usePreferencias();
  const luta = useLutaDoAluno();
  const consentimentos = useConsentimentosDeAtleta().data ?? [];
  const gravar = useGravar();
  const { gravar: definirAtletas, ocupado } = useGravarComAviso(gravar.definirAparecerEmAtletas);
  const [indicar, setIndicar] = useState(false);
  const [atletas, setAtletas] = useState(false);
  const outrosPapeis = vinculos.filter((v) => v.estado === 'ativo').length > 1;
  const pendente = vinculos.find((v) => v.papel === 'aluno' && v.estado === 'pendente');
  const ativo = vinculoAtivo?.estado === 'ativo';
  const ehAtleta = (luta.minhaFicha?.atletaEm.length ?? 0) > 0;
  const apareco = consentimentos.some((c) => c.alunoId === usuario?.id && c.ligado);

  return (
    <TelaComRolagem titulo="Perfil" grande vao={espaco[5]}>
      <Cartao>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco[3] }}>
          <Avatar nome={usuario?.nome ?? '?'} tamanho={64} />
          <View style={{ flex: 1, minWidth: 0, gap: espaco[1] }}>
            <Texto variante="titulo2" numberOfLines={1}>
              {usuario?.nome}
            </Texto>
            <Texto variante="corpoPequeno" cor="textoSecundario" numberOfLines={1}>
              {usuario?.email}
            </Texto>
          </View>
        </View>
      </Cartao>

      <GrupoDeLinhas>
        {ativo && vinculoAtivo ? (
          <Linha icone="academia" titulo={vinculoAtivo.academia.nome} apoio={`Aluno desde ${dataCurta(vinculoAtivo.desde)}`} aoTocar={() => router.push('/perfil/academia')} />
        ) : pendente ? (
          <Linha icone="academia" titulo="Pedido para entrar na academia" apoio="Esperando a recepção confirmar" aoTocar={() => router.push('/perfil/academia')} />
        ) : (
          <Linha icone="academia" titulo="Sem academia" apoio="Tem o código da sua academia? Toque para entrar." aoTocar={() => router.push('/perfil/academia')} />
        )}
        {ativo ? <Linha icone="alunos" titulo="Meus dependentes" apoio={luta.dependentes.length ? plural(luta.dependentes.length, 'criança', 'crianças') : 'Cadastrar uma criança (Kids)'} aoTocar={() => router.push('/perfil/dependentes')} /> : null}
        {ativo ? <Linha icone="convite" titulo="Indicar um amigo" apoio="Traga um amiguinho: o seu código e a mensagem pronta" aoTocar={() => setIndicar(true)} /> : null}
        {ativo && ehAtleta ? <Linha icone="luva" titulo="Aparecer em Atletas" apoio={apareco ? 'Ligado: seu cartão aparece na aba Academia' : 'Desligado'} aoTocar={() => setAtletas(true)} /> : null}
      </GrupoDeLinhas>

      <GrupoDeLinhas>
        <Linha icone="medida" titulo="Meus dados" apoio="Peso, altura, objetivo. Tudo opcional" aoTocar={() => router.push('/perfil/meus-dados')} />
        <Linha icone="escudo" titulo="Quem pode ver meus dados" aoTocar={() => router.push('/perfil/quem-pode-ver')} />
        <Linha icone="sino" titulo="Avisos" aoTocar={() => router.push('/perfil/avisos')} />
        <Linha icone="cadeado" titulo="Conta" apoio="E-mail, senha, exportar e apagar" aoTocar={() => router.push('/perfil/conta')} />
      </GrupoDeLinhas>

      <GrupoDeLinhas>
        <LinhaComChave naLista rotulo="Vibração" apoio="No check-in e nos sinais do cronômetro" ligado={preferencias.vibracao} aoMudar={preferencias.definirVibracao} />
        {outrosPapeis ? <Linha icone="trocar" titulo="Trocar de visão" apoio="Entrar pelo app da equipe" aoTocar={() => router.push('/escolher-visao')} /> : null}
        {__DEV__ ? <Linha icone="lista" titulo="Catálogo de componentes" apoio="Para quem revisa o design" aoTocar={() => router.push('/componentes')} /> : null}
      </GrupoDeLinhas>

      <Botao
        variante="perigoDiscreto"
        rotulo="Sair"
        aoTocar={() => {
          sessao.sair();
          router.replace('/');
        }}
      />

      <FolhaIndicarUmAmigo visivel={indicar} aoFechar={() => setIndicar(false)} />
      <FolhaInferior
        visivel={atletas}
        aoFechar={() => setAtletas(false)}
        titulo="Aparecer em Atletas"
        rodape={
          <View style={{ gap: espaco[2] }}>
            <Botao
              variante={apareco ? 'secundario' : 'primario'}
              rotulo={apareco ? 'Deixar de aparecer' : 'Aparecer'}
              carregando={ocupado}
              aoTocar={async () => {
                if (!usuario || !vinculoAtivo) return;
                const r = await definirAtletas(usuario.id, vinculoAtivo.academiaId, !apareco);
                if (r.ok) setAtletas(false);
              }}
            />
            <Botao variante="texto" rotulo="Agora não" aoTocar={() => setAtletas(false)} />
          </View>
        }
      >
        <View style={{ gap: espaco[3] }}>
          <Texto variante="corpo">
            Seu cartão mostra o seu nome, as modalidades{luta.minhaFicha ? ` (${luta.minhaFicha.atletaEm.map((m) => nomeDaModalidade(luta.luta, m)).join(', ')})` : ''}, a faixa e as lutas com resultado. Sem ranking.
          </Texto>
          <Texto variante="corpoPequeno" cor="textoSecundario">
            Nasce desligado e você desliga quando quiser: o cartão sai na hora. A data em que você ligou fica guardada.
          </Texto>
        </View>
      </FolhaInferior>
    </TelaComRolagem>
  );
}
