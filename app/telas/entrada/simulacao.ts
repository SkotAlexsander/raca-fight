/**
 * Login SIMULADO (P11, seção Z: "Apple, Google e e-mail são simulados, sem
 * chave"). Nada aqui fala com Apple, Google ou servidor:
 *
 * - Apple e Google abrem uma folha que faz o papel da janela do sistema:
 *   escolher uma conta de exemplo ou "Conta nova".
 * - E-mail: o e-mail de uma conta de exemplo entra (qualquer senha); outro
 *   e-mail dá o erro de sempre, sem dizer qual dos dois errou.
 * - Conta nova: o repositório CRIA a conta de verdade (agente AA, P11) no fim
 *   do caminho, com o vínculo pedido e as respostas das perguntas, e entra
 *   com ela. Pela Apple/Google simulados, a conta nova ganha um nome e um
 *   e-mail de exemplo ("Paula Gomes", e-mail de retransmissão).
 * - Código da equipe: `Academia.codigoDaEquipe` (T9K2WM no exemplo, o do mockup).
 */
import { useQuery } from '@tanstack/react-query';
import { useRepositorio } from '@/dados';
import type { Academia, Id } from '@/dominio/tipos';

/** O nome e o e-mail que a "janela da Apple/Google" simulada devolve para a conta nova. */
export function contaNovaSimulada(): { nome: string; email: string } {
  // um nome de pessoa, como a Apple e o Google devolvem (a saudação usa o primeiro nome)
  const n = Math.random().toString(36).slice(2, 8);
  return { nome: 'Paula Gomes', email: `paula-${n}@retransmissao.exemplo.com` };
}

export interface ContaParaEntrar {
  usuarioId: Id;
  nome: string;
  descricao: string;
  email: string;
}

/** As contas de exemplo com o e-mail (para a folha da Apple/Google e para o "Entrar com e-mail"). */
export function useContasParaEntrar() {
  const repo = useRepositorio();
  return useQuery({
    queryKey: ['entrada', 'contas'],
    staleTime: Infinity,
    queryFn: async (): Promise<ContaParaEntrar[]> => {
      const contas = repo.contasDeExemplo();
      const usuarios = await Promise.all(contas.map((c) => repo.usuario(c.usuarioId)));
      return contas.map((c, i) => ({ ...c, email: usuarios[i]?.email ?? '' }));
    },
  });
}

/** As academias que o repositório conhece (para achar pelo código). */
export function useAcademias() {
  const repo = useRepositorio();
  return useQuery({
    queryKey: ['entrada', 'academias'],
    staleTime: Infinity,
    queryFn: async (): Promise<Academia[]> => {
      const vinculos = (await Promise.all(repo.contasDeExemplo().map((c) => repo.vinculosDoUsuario(c.usuarioId)))).flat();
      const porId = new Map<Id, Academia>();
      for (const v of vinculos) porId.set(v.academia.id, v.academia);
      return [...porId.values()];
    },
  });
}

export function acharPeloCodigoDosAlunos(academias: readonly Academia[], codigo: string): Academia | null {
  return academias.find((a) => a.codigoDeVinculo === codigo.toUpperCase()) ?? null;
}

export function acharPeloCodigoDaEquipe(academias: readonly Academia[], codigo: string): Academia | null {
  return academias.find((a) => a.codigoDaEquipe === codigo.toUpperCase()) ?? null;
}

/** "Entrar com e-mail": a conta de exemplo com esse e-mail (a senha não é conferida na simulação). */
export function acharPeloEmail(contas: readonly ContaParaEntrar[], email: string): ContaParaEntrar | null {
  const e = email.trim().toLowerCase();
  return contas.find((c) => c.email.toLowerCase() === e) ?? null;
}

export const emailValido = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
