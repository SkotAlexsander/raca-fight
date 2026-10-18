/**
 * Meus dados (mapa, Parte 2; R6): o cadastro corporal OPCIONAL. Peso atual
 * com "Registrar peso" e as últimas pesagens, altura, idade, objetivo, dias
 * por semana e restrições. Nada aqui trava o app. Dado de saúde: só o aluno e
 * quem ele autoriza veem (Quem pode ver); nunca vai para log.
 */
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Botao, Campo, CampoNumerico, CartaoDeNumero, Chip, Chips, FolhaInferior, GrupoDeLinhas, Linha, Texto, useAvisoRapido } from '@/componentes';
import { usePerfilDoAluno, useSessao } from '@/dados';
import type { ChaveDoObjetivo } from '@/dominio/tipos';
import { calcularIdade, formatarNumero, formatarPeso } from '@/dominio/unidades';
import { espaco } from '@/tema';
import { dataCurta, dataLocal, lerKg, NOME_DO_OBJETIVO, ORDEM_DOS_OBJETIVOS } from '@/componentes/formatos';
import { Secao, TelaComRolagem } from '../comum/Tela';
import { useMedicoesDoAluno } from '@/dados';
import { useDadosLocais } from '../estado/ProvedorDoAluno';

export function TelaMeusDados() {
  const router = useRouter();
  const aviso = useAvisoRapido();
  const { usuario } = useSessao();
  const perfilRepo = usePerfilDoAluno(usuario?.id).data;
  const medicoesRepo = useMedicoesDoAluno(usuario?.id).data ?? [];
  const locais = useDadosLocais();
  const perfil = { ...(perfilRepo ?? {}), ...locais.perfil };
  const medicoes = [...medicoesRepo, ...locais.medicoesNovas].sort((a, b) => (a.data < b.data ? -1 : 1));
  const pesagens = medicoes.filter((m) => m.pesoGramas !== undefined);
  const peso = pesagens.at(-1)?.pesoGramas;
  const altura = [...medicoes].reverse().find((m) => m.alturaMilimetros !== undefined)?.alturaMilimetros;
  const idade = perfil.dataNascimento ? calcularIdade(perfil.dataNascimento, dataLocal()) : undefined;
  const [registrar, setRegistrar] = useState(false);
  const [novoPeso, setNovoPeso] = useState(peso ?? 70000);
  const [restricoes, setRestricoes] = useState(perfil.restricoes ?? '');
  useEffect(() => {
    if (perfilRepo?.restricoes && !locais.perfil.restricoes) setRestricoes((r) => r || perfilRepo.restricoes!);
  }, [perfilRepo?.restricoes, locais.perfil.restricoes]);
  const voltar = () => (router.canGoBack() ? router.back() : router.replace('/perfil'));

  return (
    <TelaComRolagem titulo="Meus dados" aoVoltar={voltar} vao={espaco[5]}>
      <Texto variante="corpoPequeno" cor="textoSecundario">
        Tudo é opcional. Quanto mais você conta, melhor a academia monta o seu treino.
      </Texto>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: espaco[3] }}>
        <CartaoDeNumero rotulo="Peso" valor={peso !== undefined ? formatarNumero(peso / 1000, 1, false) : undefined} unidade="kg" />
        <CartaoDeNumero rotulo="Altura" valor={altura !== undefined ? formatarNumero(altura / 1000, 2, false) : undefined} unidade="m" />
        <CartaoDeNumero rotulo="Idade" valor={idade !== undefined ? String(idade) : undefined} unidade="anos" />
      </View>

      <Secao titulo="Pesagens" lado={pesagens.length ? `${pesagens.length}` : undefined}>
        {pesagens.length ? (
          <GrupoDeLinhas>
            {[...pesagens].reverse().slice(0, 4).map((m) => (
              <Linha key={m.id} titulo={formatarPeso(m.pesoGramas!)} apoio={dataCurta(m.data)} compacta />
            ))}
          </GrupoDeLinhas>
        ) : null}
        <Botao variante="secundario" icone="balanca" rotulo="Registrar peso" aoTocar={() => { setNovoPeso(peso ?? 70000); setRegistrar(true); }} />
      </Secao>

      <Secao titulo="Objetivo">
        <Chips>
          {ORDEM_DOS_OBJETIVOS.map((o) => (
            <Chip key={o} rotulo={NOME_DO_OBJETIVO[o]} selecionado={perfil.objetivo === o} aoTocar={() => locais.atualizarPerfil({ objetivo: perfil.objetivo === o ? undefined : (o as ChaveDoObjetivo) })} />
          ))}
        </Chips>
      </Secao>

      <Secao titulo="Dias por semana">
        <CampoNumerico rotulo="Quantos dias você quer treinar" valor={perfil.frequenciaSemanalPretendida ?? 3} aoMudar={(v) => locais.atualizarPerfil({ frequenciaSemanalPretendida: v })} passo={1} minimo={1} maximo={7} variante="edicao" unidade={(perfil.frequenciaSemanalPretendida ?? 3) === 1 ? 'dia' : 'dias'} />
      </Secao>

      <Secao titulo="Restrições">
        <Campo rotulo="Lesões, limitações ou orientação médica" value={restricoes} onChangeText={setRestricoes} onBlur={() => locais.atualizarPerfil({ restricoes: restricoes.trim() || undefined })} multilinha maxLength={280} placeholder="Joelho direito" />
      </Secao>

      <FolhaInferior
        visivel={registrar}
        aoFechar={() => setRegistrar(false)}
        titulo="Registrar peso"
        rodape={
          <>
            <Botao variante="texto" rotulo="Cancelar" aoTocar={() => setRegistrar(false)} />
            <Botao
              variante="primario"
              rotulo="Salvar"
              aoTocar={() => {
                locais.registrarPeso(novoPeso);
                setRegistrar(false);
                aviso.mostrar({ texto: `Peso de hoje: ${formatarPeso(novoPeso)}`, tipo: 'sucesso' });
              }}
            />
          </>
        }
      >
        <CampoNumerico rotulo="Peso de hoje" valor={novoPeso} aoMudar={setNovoPeso} passo={100} minimo={20000} maximo={300000} formatar={(g) => formatarNumero(g / 1000, 1, false)} unidade="kg" lerTexto={lerKg} variante="edicao" />
      </FolhaInferior>
    </TelaComRolagem>
  );
}
