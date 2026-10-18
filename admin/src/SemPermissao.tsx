/** A tela inteira "Esta área é do dono" (RA1.1), dos dois modos de entrada. */

import { Logo, Simbolos } from './componentes/basicos.tsx';

export function SemPermissao({ aoSair }: { aoSair?: () => void }) {
  return (
    <div className="ad-quadro ad-quadro--bloqueio">
      <Simbolos />
      <div className="ad-bloqueio" role="alert">
        <Logo className="logo" />
        <h1>Esta área é do dono da academia</h1>
        <p>A sua conta não tem o papel de dono na Raça Fight. Se você é da equipe, use o app da academia no celular.</p>
        {aoSair && <button type="button" className="ad-btn ad-btn--grande" onClick={aoSair}>Sair e entrar com outra conta</button>}
      </div>
    </div>
  );
}
