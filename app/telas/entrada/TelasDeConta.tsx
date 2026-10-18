/**
 * As telas de conta das duas portas (F13.3 e F13.4; mockups/entrada.html,
 * quadros B1–B4 e C1): como entrar, entrar com e-mail, criar conta, confirmar
 * o e-mail e "esqueci a senha". Apple e Google com o mesmo destaque, um
 * embaixo do outro (diretriz 4.8 da App Store).
 *
 * Tudo SIMULADO (sem chave): ver `simulacao.ts`.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Avatar, FolhaInferior, Icone, Texto, useAvisoRapido } from '@/componentes';
import { useRepositorio, useSessao } from '@/dados';
import { borda, controle, espaco, useTema } from '@/tema';
import { mudarEntrada, useEntrada, type Porta } from './fluxo';
import { BarraDoPasso, CaixasDeCodigo, CampoDeVidro, Etiqueta, Mola, Ou, Pilula, Termos, TelaDaEntrada, TituloDoPasso } from './pecas';
import { acharPeloEmail, emailValido, useContasParaEntrar, type ContaParaEntrar } from './simulacao';

const voltarOu = (router: ReturnType<typeof useRouter>) => () => (router.canGoBack() ? router.back() : router.replace('/boas-vindas'));

function usePorta(): Porta {
  const { porta } = useLocalSearchParams<{ porta?: string }>();
  const doFluxo = useEntrada().porta;
  return porta === 'academia' || porta === 'aluno' ? porta : doFluxo;
}

/** Entrar de verdade com uma conta de exemplo e ir para a visão do vínculo. */
export function useEntrarComConta() {
  const { entrar } = useSessao();
  const router = useRouter();
  return async (usuarioId: string) => {
    await entrar(usuarioId);
    router.replace('/');
  };
}

// ---------------------------------------------------------------------------
// A janela "da Apple / do Google", simulada: escolher conta ou conta nova.
// ---------------------------------------------------------------------------

function FolhaDaConta({ provedor, porta, aoFechar }: { provedor: 'Apple' | 'Google' | null; porta: Porta; aoFechar: () => void }) {
  const { cores } = useTema();
  const router = useRouter();
  const contas = useContasParaEntrar();
  const entrarCom = useEntrarComConta();
  const contaNova = () => {
    aoFechar();
    mudarEntrada({ contaNova: null });
    // conta nova: o aluno segue para as perguntas; a equipe, para o convite ou código (F13.4)
    router.push(porta === 'aluno' ? '/sua-academia' : '/codigo-da-equipe');
  };
  const linha = (chave: string, titulo: string, apoio: string, aoTocar: () => void, avatar?: string) => (
    <Pressable key={chave} onPress={aoTocar} accessibilityRole="button" accessibilityLabel={`${titulo}, ${apoio}`} style={{ minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: espaco[3], borderTopWidth: borda.fina, borderTopColor: cores.borda }}>
      {avatar ? <Avatar nome={avatar} /> : <View style={{ width: 40, height: 40, borderRadius: 999, backgroundColor: cores.viva, alignItems: 'center', justifyContent: 'center' }}><Icone nome="mais" cor={cores.vivaTexto} /></View>}
      <View style={{ flex: 1 }}>
        <Texto variante="corpoForte">{titulo}</Texto>
        <Texto variante="corpoPequeno" cor="textoSecundario" numberOfLines={1}>
          {apoio}
        </Texto>
      </View>
      <Icone nome="avancar" cor="textoSecundario" />
    </Pressable>
  );
  return (
    <FolhaInferior visivel={provedor !== null} aoFechar={aoFechar} titulo={`Continuar com ${provedor === 'Apple' ? 'a Apple' : 'o Google'}`} tipo="lista">
      <Texto variante="corpoPequeno" cor="textoSecundario" style={{ paddingBottom: espaco[3] }}>
        Simulação: o app ainda não tem a chave {provedor === 'Apple' ? 'da Apple' : 'do Google'}. Escolha uma conta de exemplo ou crie uma conta nova.
      </Texto>
      <ScrollView>
        {linha('nova', 'Conta nova', porta === 'aluno' ? 'Cria a conta e segue para as perguntas' : 'Cria a conta e segue para o código da equipe', contaNova)}
        {(contas.data ?? []).map((c: ContaParaEntrar) => linha(c.usuarioId, c.nome, `${c.email} · ${c.descricao}`, () => { aoFechar(); void entrarCom(c.usuarioId); }, c.nome))}
      </ScrollView>
    </FolhaInferior>
  );
}

// ---------------------------------------------------------------------------
// B1 / C1 — como entrar
// ---------------------------------------------------------------------------

export function TelaComoEntrar() {
  const router = useRouter();
  const porta = usePorta();
  const [provedor, setProvedor] = useState<'Apple' | 'Google' | null>(null);
  useEffect(() => mudarEntrada({ porta }), [porta]);
  const aluno = porta === 'aluno';

  return (
    <TelaDaEntrada
      barra={<BarraDoPasso aoVoltar={voltarOu(router)} meio={<Etiqueta icone={aluno ? 'inicio' : 'academia'} texto={aluno ? 'Aluno' : 'Academia'} />} />}
      centralizar
    >
      <TituloDoPasso titulo={aluno ? 'Vamos começar.' : 'Entrar na equipe'} apoio={aluno ? 'Entre ou crie a sua conta. Leva um minuto.' : 'Para professor e recepção. O dono usa o app Admin.'} centro />
      <View style={{ gap: espaco[3] }}>
        <Pilula variante="social" marca="apple" rotulo="Continuar com a Apple" aoTocar={() => setProvedor('Apple')} />
        <Pilula variante="social" marca="google" rotulo="Continuar com o Google" aoTocar={() => setProvedor('Google')} />
        {aluno ? <Ou texto="ou" /> : null}
        <Pilula variante="marca" icone="email" rotulo="Continuar com e-mail" aoTocar={() => router.push({ pathname: '/entrar-com-email', params: { porta } })} />
        {!aluno ? (
          <>
            <Ou texto="primeira vez?" />
            <Pilula variante="vidro" icone="convite" rotulo="Tenho um convite ou código" aoTocar={() => router.push('/codigo-da-equipe')} />
            <Pilula variante="vidro" icone="academia" rotulo="Sou o dono" aoTocar={() => router.push('/abrir-academia')} />
          </>
        ) : null}
      </View>
      {aluno ? <Termos /> : null}
      <FolhaDaConta provedor={provedor} porta={porta} aoFechar={() => setProvedor(null)} />
    </TelaDaEntrada>
  );
}

// ---------------------------------------------------------------------------
// B2 — entrar com e-mail
// ---------------------------------------------------------------------------

export function TelaEntrarComEmail() {
  const router = useRouter();
  const porta = usePorta();
  const contas = useContasParaEntrar();
  const repo = useRepositorio();
  const entrarCom = useEntrarComConta();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | undefined>();
  const [enviando, setEnviando] = useState(false);

  const entrar = async () => {
    if (!emailValido(email)) return setErro('Confira o e-mail.');
    if (senha.length === 0) return setErro('Digite a senha.');
    if (enviando) return;
    // a conta de exemplo, ou a criada na entrada (agente AB; antes só as de exemplo entravam)
    const id = acharPeloEmail(contas.data ?? [], email)?.usuarioId ?? (await repo.usuarioPeloEmail(email))?.id;
    // nunca diz qual dos dois errou
    if (!id) return setErro('E-mail ou senha não conferem.');
    setEnviando(true);
    await entrarCom(id);
  };

  return (
    <TelaDaEntrada barra={<BarraDoPasso aoVoltar={voltarOu(router)} />}>
      <TituloDoPasso titulo="Entrar" apoio="Com o e-mail e a senha da sua conta." />
      <CampoDeVidro rotulo="E-mail" icone="email" valor={email} aoMudar={(v) => { setEmail(v); setErro(undefined); }} teclado="email-address" autoComplete="email" placeholder="voce@email.com" />
      <CampoDeVidro rotulo="Senha" icone="cadeado" valor={senha} aoMudar={(v) => { setSenha(v); setErro(undefined); }} segredo autoComplete="current-password" erro={erro} aoEnviar={entrar} />
      <Pressable onPress={() => router.push('/esqueci-a-senha')} accessibilityRole="link" style={{ minHeight: controle.secundario, justifyContent: 'center', alignSelf: 'flex-start' }}>
        <Texto variante="corpoForte" style={{ textDecorationLine: 'underline' }}>
          Esqueci a senha
        </Texto>
      </Pressable>
      <Texto variante="corpoPequeno" cor="textoSecundario">
        Simulação: entre com o e-mail de uma conta de exemplo (ana@exemplo.com, marcos@exemplo.com…) e qualquer senha.
      </Texto>
      <Mola />
      <Pilula rotulo="Entrar" aoTocar={entrar} carregando={enviando} />
      <Pilula variante="texto" rotulo="Não tem conta? Criar conta" aoTocar={() => router.push({ pathname: '/criar-conta', params: { porta } })}>
        <Texto variante="corpoForte">
          Não tem conta?{'  '}
          <Texto variante="corpoForte" style={{ textDecorationLine: 'underline' }}>
            Criar conta
          </Texto>
        </Texto>
      </Pilula>
    </TelaDaEntrada>
  );
}

// ---------------------------------------------------------------------------
// B3 — criar conta → confirmar o e-mail
// ---------------------------------------------------------------------------

export function TelaCriarConta() {
  const router = useRouter();
  const porta = usePorta();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erros, setErros] = useState<{ nome?: string; email?: string; senha?: string }>({});

  const criar = () => {
    const e = {
      nome: nome.trim() ? undefined : 'Digite o seu nome.',
      email: emailValido(email) ? undefined : 'Confira o e-mail.',
      senha: senha.length >= 8 ? undefined : 'A senha precisa de pelo menos 8 caracteres.',
    };
    setErros(e);
    if (e.nome || e.email || e.senha) return;
    mudarEntrada({ contaNova: { nome: nome.trim(), email: email.trim() } });
    router.push({ pathname: '/confirmar-contato', params: { porta } });
  };

  return (
    <TelaDaEntrada barra={<BarraDoPasso aoVoltar={voltarOu(router)} />}>
      <TituloDoPasso titulo="Criar conta" apoio="Depois mandamos um código para confirmar o e-mail." />
      <CampoDeVidro rotulo="Nome" icone="perfil" valor={nome} aoMudar={setNome} autoComplete="name" erro={erros.nome} />
      <CampoDeVidro rotulo="E-mail" icone="email" valor={email} aoMudar={setEmail} teclado="email-address" autoComplete="email" erro={erros.email} />
      {/* o aviso de tamanho aparece antes do erro, não depois */}
      <CampoDeVidro rotulo="Senha" icone="cadeado" valor={senha} aoMudar={setSenha} segredo autoComplete="new-password" apoio="Pelo menos 8 caracteres." erro={erros.senha} aoEnviar={criar} />
      <Mola />
      <Pilula rotulo="Criar conta" aoTocar={criar} />
      <Termos verbo="criar" />
    </TelaDaEntrada>
  );
}

/** O mesmo campo de 6 caixas do "esqueci a senha" (F13.3, passo 2). */
export function TelaConfirmarContato() {
  const router = useRouter();
  const porta = usePorta();
  const { contaNova } = useEntrada();
  const aviso = useAvisoRapido();
  const [codigo, setCodigo] = useState('');
  const [espera, setEspera] = useState(45);
  useEffect(() => {
    const t = setInterval(() => setEspera((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <TelaDaEntrada barra={<BarraDoPasso aoVoltar={voltarOu(router)} />}>
      <TituloDoPasso titulo="Confirme o seu e-mail" apoio={`Mandamos um código de 6 números para ${contaNova?.email ?? 'o seu e-mail'}.`} />
      <CaixasDeCodigo rotulo="Código de confirmação" valor={codigo} aoMudar={setCodigo} soNumeros />
      <Texto variante="corpoPequeno" cor="textoSecundario">
        Simulação: qualquer código de 6 números confirma.
      </Texto>
      <Mola />
      <Pilula rotulo="Confirmar" desabilitado={codigo.length < 6} aoTocar={() => router.push(porta === 'aluno' ? '/sua-academia' : '/codigo-da-equipe')} />
      <Pilula
        variante="texto"
        rotulo={espera > 0 ? `Reenviar o código em 0:${String(espera).padStart(2, '0')}` : 'Reenviar o código'}
        desabilitado={espera > 0}
        aoTocar={() => {
          setEspera(45);
          aviso.mostrar({ texto: 'Código reenviado.' });
        }}
      />
    </TelaDaEntrada>
  );
}

// ---------------------------------------------------------------------------
// B4 — esqueci a senha: e-mail → código de 6 + nova senha (H06)
// ---------------------------------------------------------------------------

export function TelaEsqueciASenha() {
  const router = useRouter();
  const aviso = useAvisoRapido();
  const [passo, setPasso] = useState<'email' | 'codigo'>('email');
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | undefined>();
  const [espera, setEspera] = useState(42);
  useEffect(() => {
    if (passo !== 'codigo') return;
    const t = setInterval(() => setEspera((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [passo]);

  if (passo === 'email') {
    return (
      <TelaDaEntrada barra={<BarraDoPasso aoVoltar={voltarOu(router)} />}>
        <TituloDoPasso titulo="Esqueci a senha" apoio="Digite o e-mail da conta. Mandamos um código para trocar a senha." />
        <CampoDeVidro rotulo="E-mail" icone="email" valor={email} aoMudar={(v) => { setEmail(v); setErro(undefined); }} teclado="email-address" autoComplete="email" erro={erro} />
        <Mola />
        <Pilula rotulo="Enviar código" aoTocar={() => (emailValido(email) ? setPasso('codigo') : setErro('Confira o e-mail.'))} />
      </TelaDaEntrada>
    );
  }
  return (
    <TelaDaEntrada barra={<BarraDoPasso aoVoltar={() => setPasso('email')} />}>
      <TituloDoPasso titulo="Nova senha" apoio={`Mandamos um código de 6 números para ${email.trim()}.`} />
      <CaixasDeCodigo rotulo="Código" valor={codigo} aoMudar={setCodigo} soNumeros />
      <CampoDeVidro rotulo="Nova senha" icone="cadeado" valor={senha} aoMudar={(v) => { setSenha(v); setErro(undefined); }} segredo autoComplete="new-password" placeholder="Pelo menos 8 caracteres" erro={erro} />
      <Mola />
      <Pilula
        rotulo="Salvar nova senha"
        desabilitado={codigo.length < 6}
        aoTocar={() => {
          if (senha.length < 8) return setErro('A senha precisa de pelo menos 8 caracteres.');
          aviso.mostrar({ texto: 'Senha trocada. Entre com a nova senha.', tipo: 'sucesso' });
          router.replace('/entrar-com-email');
        }}
      />
      <Pilula variante="texto" rotulo={espera > 0 ? `Reenviar o código em 0:${String(espera).padStart(2, '0')}` : 'Reenviar o código'} desabilitado={espera > 0} aoTocar={() => setEspera(42)} />
    </TelaDaEntrada>
  );
}
