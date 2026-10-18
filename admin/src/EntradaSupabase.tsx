/**
 * O MODO SUPABASE da entrada: e-mail e senha, depois o código do aplicativo
 * autenticador (TOTP), e só abre para o dono (RA1.1).
 *
 * Mora num arquivo à parte e é carregado SOB DEMANDA (AO, 16/10): o
 * supabase-js (e o repositório que fala com ele) só desce quando há
 * Supabase configurado. No modo local, o pacote principal não o leva.
 */

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { Icone, Logo, Simbolos } from './componentes/basicos.tsx';
import { clienteSupabase } from './dados/supabase/cliente.ts';
import { confirmarCodigo, entrarComSenha, fraseDoErro, proximoPasso, sair, type PassoDoLogin } from './dados/supabase/autenticacao.ts';
import { criarRepositorioSupabase } from './dados/supabase/repositorio-supabase.ts';
import type { FilhosDaEntrada } from './Entrada.tsx';
import { SemPermissao } from './SemPermissao.tsx';
import { agoraNaAcademia } from './util/relogio.ts';
import { registrarErro } from './util/registrar.ts';

export default function ModoSupabase({ hoje, children }: { hoje: string; children: FilhosDaEntrada }) {
  const cliente = useMemo(() => clienteSupabase()!, []);
  const [passo, setPasso] = useState<PassoDoLogin | { passo: 'abrindo' }>({ passo: 'abrindo' });
  useEffect(() => {
    proximoPasso(cliente).then(setPasso, (e) => { registrarErro('login', e); setPasso({ passo: 'entrar' }); });
  }, [cliente]);
  const repositorio = useMemo(() => (passo.passo === 'pronto'
    ? criarRepositorioSupabase({ cliente, academiaId: passo.sessao.academiaId, agora: agoraNaAcademia }) : null), [cliente, passo]);

  if (passo.passo === 'pronto' && repositorio) {
    return <>{children({ repositorio, sessao: passo.sessao, hoje, sair: () => { void sair(cliente).then(() => setPasso({ passo: 'entrar' })); } })}</>;
  }
  if (passo.passo === 'sem_permissao') return <SemPermissao aoSair={() => { void sair(cliente).then(() => setPasso({ passo: 'entrar' })); }} />;
  return <Login cliente={cliente} passo={passo} setPasso={setPasso} />;
}

function Login({ cliente, passo, setPasso }: { cliente: SupabaseClient; passo: PassoDoLogin | { passo: 'abrindo' }; setPasso: (p: PassoDoLogin) => void }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [codigo, setCodigo] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [indo, setIndo] = useState(false);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (indo) return;
    setErro(null);
    setIndo(true);
    try {
      if (passo.passo === 'entrar') setPasso(await entrarComSenha(cliente, email, senha));
      else if (passo.passo === 'codigo' || passo.passo === 'cadastrar_segundo_fator') setPasso(await confirmarCodigo(cliente, passo.fatorId, codigo));
    } catch (x) {
      registrarErro('login', x);
      setErro(fraseDoErro(x));
    } finally {
      setIndo(false);
    }
  }

  return (
    <div className="ad-quadro ad-quadro--bloqueio">
      <Simbolos />
      <form className="ad-bloqueio ad-login" onSubmit={enviar} noValidate>
        <Logo className="logo" />
        {passo.passo === 'abrindo' && <p>Abrindo…</p>}
        {passo.passo === 'entrar' && (
          <>
            <h1>Entrar no Admin</h1>
            <p>Use o mesmo e-mail do app da Raça Fight. Esta área é só do dono.</p>
            <label className="campo"><span>E-mail</span><span className="campo__caixa"><input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required /></span></label>
            <label className="campo"><span>Senha</span><span className="campo__caixa"><input type="password" autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} required /></span></label>
          </>
        )}
        {passo.passo === 'cadastrar_segundo_fator' && (
          <>
            <h1>Ligar o segundo fator</h1>
            <p>O Admin mostra dinheiro da academia. Por isso, além da senha, ele pede um código do celular. Abra o aplicativo autenticador (Google Authenticator, Microsoft Authenticator…) e leia o código abaixo.</p>
            <img src={passo.qrSvg} alt="Código QR para o aplicativo autenticador" width={180} height={180} style={{ background: '#fff', padding: 8, borderRadius: 8 }} />
            <p className="t13">Sem câmera? Digite a chave: <b style={{ wordBreak: 'break-all' }}>{passo.segredo}</b></p>
            <label className="campo"><span>Código de 6 números</span><span className="campo__caixa"><input inputMode="numeric" autoComplete="one-time-code" value={codigo} onChange={(e) => setCodigo(e.target.value)} maxLength={7} /></span></label>
          </>
        )}
        {passo.passo === 'codigo' && (
          <>
            <h1>Código do celular</h1>
            <p>Abra o aplicativo autenticador e digite o código de 6 números do Admin Raça Fight.</p>
            <label className="campo"><span>Código</span><span className="campo__caixa"><input inputMode="numeric" autoComplete="one-time-code" value={codigo} onChange={(e) => setCodigo(e.target.value)} maxLength={7} autoFocus /></span></label>
          </>
        )}
        {erro && <p className="campo__erro" role="alert"><Icone nome="i-alerta" />{erro}</p>}
        {passo.passo !== 'abrindo' && <button type="submit" className="ad-btn ad-btn--primario ad-btn--grande" disabled={indo}>{indo ? 'Conferindo…' : passo.passo === 'entrar' ? 'Entrar' : 'Confirmar'}</button>}
      </form>
    </div>
  );
}
