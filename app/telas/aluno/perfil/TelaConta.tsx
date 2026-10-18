/**
 * Conta (mapa, Parte 2; R6.3, direitos do aluno): o e-mail, trocar a senha,
 * exportar os dados e apagar a conta (confirmação dupla). Nesta onda o login é
 * de exemplo: as três ações são simuladas e dizem isso na tela.
 */
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Botao, Campo, FolhaInferior, GrupoDeLinhas, Linha, Texto, useAvisoRapido } from '@/componentes';
import { useSessao } from '@/dados';
import { espaco } from '@/tema';
import { TelaComRolagem } from '../comum/Tela';

export function TelaConta() {
  const router = useRouter();
  const aviso = useAvisoRapido();
  const sessao = useSessao();
  const [apagar, setApagar] = useState<0 | 1 | 2>(0);
  const [confirmacao, setConfirmacao] = useState('');
  const voltar = () => (router.canGoBack() ? router.back() : router.replace('/perfil'));
  const simulado = (texto: string) => aviso.mostrar({ texto: `${texto} (conta de exemplo: nada foi enviado)` });

  return (
    <TelaComRolagem titulo="Conta" aoVoltar={voltar} vao={espaco[5]}>
      <Campo rotulo="E-mail" value={sessao.usuario?.email ?? ''} somenteLeitura />
      <GrupoDeLinhas>
        <Linha icone="cadeado" titulo="Trocar senha" apoio="Mandamos um link para o seu e-mail" aoTocar={() => simulado('Link enviado')} />
        <Linha icone="nuvem" titulo="Exportar meus dados" apoio="Um arquivo com tudo o que o app guarda de você" aoTocar={() => simulado('Arquivo em preparo')} />
        <Linha icone="alerta" titulo="Apagar conta" perigo semSeta aoTocar={() => setApagar(1)} />
      </GrupoDeLinhas>

      <FolhaInferior
        visivel={apagar === 1}
        aoFechar={() => setApagar(0)}
        titulo="Apagar a sua conta?"
        rodape={
          <>
            <Botao variante="texto" rotulo="Manter a conta" aoTocar={() => setApagar(0)} />
            <Botao variante="perigo" rotulo="Continuar" aoTocar={() => { setConfirmacao(''); setApagar(2); }} />
          </>
        }
      >
        <Texto variante="corpo" cor="textoSecundario">
          Saem treinos, histórico, dados corporais e o Plus. A academia deixa de ver você. Não dá para desfazer.
        </Texto>
      </FolhaInferior>

      <FolhaInferior
        visivel={apagar === 2}
        aoFechar={() => setApagar(0)}
        titulo="Confirme para apagar"
        rodape={
          <>
            <Botao variante="texto" rotulo="Cancelar" aoTocar={() => setApagar(0)} />
            <Botao
              variante="perigo"
              rotulo="Apagar para sempre"
              desabilitado={confirmacao.trim().toLocaleUpperCase('pt-BR') !== 'APAGAR'}
              aoTocar={() => {
                setApagar(0);
                simulado('Pedido de exclusão registrado');
              }}
            />
          </>
        }
      >
        <Campo rotulo="Digite APAGAR" value={confirmacao} onChangeText={setConfirmacao} autoCapitalize="characters" />
      </FolhaInferior>
    </TelaComRolagem>
  );
}
