/**
 * Quem pode ver meus dados (mapa, Parte 2; R6.2 a R6.6; fluxo curto H13).
 * A chave da academia (desligar pede confirmação e vale na hora) e, no Plus,
 * a linha do personal, que vê enquanto o Plus estiver ativo.
 */
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Botao, FolhaInferior, GrupoDeLinhas, Icone, Linha, LinhaComChave, Texto, useAvisoRapido } from '@/componentes';
import { useAssinaturaPlus, usePerfilDoAluno, useSessao } from '@/dados';
import { espaco } from '@/tema';
import { useEquipeDoAluno } from '../comum/equipe';
import { TelaComRolagem } from '../comum/Tela';
import { useDadosLocais } from '../estado/ProvedorDoAluno';

export function TelaQuemPodeVer() {
  const router = useRouter();
  const aviso = useAvisoRapido();
  const { usuario, vinculoAtivo } = useSessao();
  const perfil = usePerfilDoAluno(usuario?.id).data;
  const plus = useAssinaturaPlus(usuario?.id).data;
  const locais = useDadosLocais();
  const equipe = useEquipeDoAluno();
  const autoriza = locais.perfil.autorizaAcademia ?? perfil?.autorizaAcademia ?? false;
  const [confirmar, setConfirmar] = useState(false);
  const academia = vinculoAtivo?.estado === 'ativo' ? vinculoAtivo.academia.nome : null;
  const personal = plus?.personalId && (plus.estado === 'ativo' || plus.estado === 'cancelado_vigente') ? equipe.nomeDe(plus.personalId) : undefined;
  const voltar = () => (router.canGoBack() ? router.back() : router.replace('/perfil'));

  return (
    <TelaComRolagem titulo="Quem pode ver" aoVoltar={voltar} vao={espaco[5]}>
      <Texto variante="corpo" cor="textoSecundario">
        Peso, altura, objetivo e restrições são seus. Só vê quem você deixa, e você muda isso quando quiser.
      </Texto>

      {academia ? (
        <GrupoDeLinhas>
          <LinhaComChave naLista
            rotulo={`A ${academia} pode ver meus dados corporais`}
            apoio={autoriza ? 'A equipe usa para montar o seu treino.' : 'A equipe não vê nada do seu cadastro.'}
            ligado={autoriza}
            aoMudar={(v) => {
              if (v) {
                locais.atualizarPerfil({ autorizaAcademia: true });
                aviso.mostrar({ texto: 'A academia passa a ver seus dados.', tipo: 'sucesso' });
              } else setConfirmar(true);
            }}
          />
          {personal ? <Linha icone="personal" titulo={`Personal ${personal}`} apoio="Vê enquanto o Plus estiver ativo" /> : null}
        </GrupoDeLinhas>
      ) : (
        <Texto variante="corpoPequeno" cor="textoSecundario">
          Sem academia, ninguém além de você vê os seus dados.
        </Texto>
      )}

      <View style={{ flexDirection: 'row', gap: espaco[3], alignItems: 'flex-start' }}>
        <Icone nome="cadeado" cor="textoSecundario" />
        <Texto variante="corpoPequeno" cor="textoSecundario" style={{ flex: 1 }}>
          Outros alunos nunca veem. Nenhum dado de saúde vai para aviso no celular, propaganda ou relatório.
        </Texto>
      </View>

      <FolhaInferior
        visivel={confirmar}
        aoFechar={() => setConfirmar(false)}
        titulo="Parar de mostrar à academia?"
        rodape={
          <>
            <Botao variante="texto" rotulo="Manter ligado" aoTocar={() => setConfirmar(false)} />
            <Botao
              variante="perigo"
              rotulo="Parar de mostrar"
              aoTocar={() => {
                locais.atualizarPerfil({ autorizaAcademia: false });
                setConfirmar(false);
                aviso.mostrar({ texto: 'A academia deixou de ver seus dados.' });
              }}
            />
          </>
        }
      >
        <Texto variante="corpo" cor="textoSecundario">
          Na hora, a equipe deixa de ver o seu cadastro. {personal ? `${personal}, do Plus, continua vendo enquanto o Plus estiver ativo.` : ''}
        </Texto>
      </FolhaInferior>
    </TelaComRolagem>
  );
}
