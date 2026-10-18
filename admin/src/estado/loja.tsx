/**
 * O estado da tela: os dados da academia, o mês escolhido, o "Salvando… /
 * Salvo às 10:42" e o aviso com Desfazer. Toda escrita passa por `executar`,
 * que fala com o repositório (local ou Supabase) e nunca deixa o erro sumir.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { competenciaDe } from '@dominio/financeiro/datas.ts';
import type { Competencia } from '@dominio/financeiro/tipos.ts';
import type { DataISO } from '@dominio/tipos.ts';
import { ErroDeRegra, ErroSemConexao, ErroSemPermissao } from '../dados/tipos.ts';
import type { DadosDaAcademia, Repositorio, Sessao } from '../dados/tipos.ts';
import { agoraNaAcademia, horaDe } from '../util/relogio.ts';
import { registrarErro } from '../util/registrar.ts';

export type EstadoDaCarga = 'carregando' | 'pronto' | 'erro' | 'sem_permissao';
export interface Salvamento { estado: 'parado' | 'salvando' | 'salvo' | 'erro'; hora?: string; mensagem?: string }
export interface Aviso { chave: number; texto: string; tom: 'info' | 'erro' | 'trava'; desfazer?: () => void; acao?: { rotulo: string; fazer: () => void } }

type Resultado<R> = { ok: true; valor: R } | { ok: false; erro: string };

export interface ValorDaLoja {
  repositorio: Repositorio;
  sessao: Sessao;
  dados: DadosDaAcademia | null;
  carga: EstadoDaCarga;
  recarregar: () => void;
  hoje: DataISO;
  mes: Competencia;
  setMes: (c: Competencia) => void;
  salvamento: Salvamento;
  aviso: Aviso | null;
  avisar: (texto: string, extra?: Partial<Omit<Aviso, 'chave' | 'texto'>>) => void;
  fecharAviso: () => void;
  /** O mouse ou o foco está no aviso: ele não some enquanto isso (WCAG 2.2.1, AO). */
  segurarAviso: (segurar: boolean) => void;
  /** Faz uma escrita. A operação devolve os dados novos (ou { dados, … }). */
  executar: <R extends DadosDaAcademia | { dados: DadosDaAcademia }>(fazer: (r: Repositorio) => Promise<R>, opcoes?: { silencioso?: boolean }) => Promise<Resultado<R>>;
}

const Contexto = createContext<ValorDaLoja | null>(null);

export function fraseDoErro(e: unknown): string {
  if (e instanceof ErroDeRegra || e instanceof ErroSemConexao || e instanceof ErroSemPermissao) return e.message;
  return 'Não deu para gravar. Tente de novo.';
}

export function ProvedorDaLoja({ repositorio, sessao, hoje, children }: { repositorio: Repositorio; sessao: Sessao; hoje: DataISO; children: ReactNode }) {
  const [dados, setDados] = useState<DadosDaAcademia | null>(null);
  const [carga, setCarga] = useState<EstadoDaCarga>('carregando');
  const [mes, setMes] = useState<Competencia>(competenciaDe(hoje));
  const [salvamento, setSalvamento] = useState<Salvamento>({ estado: 'parado' });
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const chave = useRef(0);
  const temporizador = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const recarregar = useCallback(() => {
    setCarga('carregando');
    repositorio.carregar().then(
      (d) => { setDados(d); setCarga('pronto'); },
      (e) => { registrarErro('carregar', e); setCarga(e instanceof ErroSemPermissao ? 'sem_permissao' : 'erro'); },
    );
  }, [repositorio]);

  useEffect(() => {
    // a primeira carga: o estado já nasce 'carregando'
    let vivo = true;
    repositorio.carregar().then(
      (d) => { if (vivo) { setDados(d); setCarga('pronto'); } },
      (e) => { registrarErro('carregar', e); if (vivo) setCarga(e instanceof ErroSemPermissao ? 'sem_permissao' : 'erro'); },
    );
    return () => { vivo = false; };
  }, [repositorio]);

  const fecharAviso = useCallback(() => setAviso(null), []);
  /** Quanto o aviso fica: 5 s; com "Desfazer" ou outra ação, 10 s, para dar tempo de achar o botão (AO). */
  const duracao = useRef(5000);
  const avisar = useCallback<ValorDaLoja['avisar']>((texto, extra = {}) => {
    clearTimeout(temporizador.current);
    setAviso({ chave: ++chave.current, texto, tom: 'info', ...extra });
    duracao.current = extra.desfazer || extra.acao ? 10000 : 5000;
    temporizador.current = setTimeout(() => setAviso(null), duracao.current);
  }, []);
  const segurarAviso = useCallback((segurar: boolean) => {
    clearTimeout(temporizador.current);
    if (!segurar) temporizador.current = setTimeout(() => setAviso(null), Math.min(duracao.current, 4000));
  }, []);
  useEffect(() => () => clearTimeout(temporizador.current), []);

  const executar = useCallback<ValorDaLoja['executar']>(async (fazer, opcoes = {}) => {
    setSalvamento({ estado: 'salvando' });
    try {
      const r = await fazer(repositorio);
      setDados('dados' in r ? r.dados : r);
      setSalvamento({ estado: 'salvo', hora: horaDe(agoraNaAcademia()) });
      return { ok: true, valor: r };
    } catch (e) {
      registrarErro('executar', e);
      const erro = fraseDoErro(e);
      setSalvamento({ estado: 'erro', mensagem: erro });
      if (!opcoes.silencioso) avisar(erro, { tom: e instanceof ErroDeRegra && /fechado/.test(erro) ? 'trava' : 'erro' });
      if (e instanceof ErroSemPermissao) setCarga('sem_permissao');
      return { ok: false, erro };
    }
  }, [repositorio, avisar]);

  const valor = useMemo<ValorDaLoja>(() => ({
    repositorio, sessao, dados, carga, recarregar, hoje, mes, setMes, salvamento, aviso, avisar, fecharAviso, segurarAviso, executar,
  }), [repositorio, sessao, dados, carga, recarregar, hoje, mes, salvamento, aviso, avisar, fecharAviso, segurarAviso, executar]);

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useLoja(): ValorDaLoja {
  const v = useContext(Contexto);
  if (!v) throw new Error('useLoja fora do ProvedorDaLoja');
  return v;
}

/** Para as telas que só abrem com os dados prontos (a moldura mostra os outros estados). */
export function useDados(): DadosDaAcademia {
  const { dados } = useLoja();
  if (!dados) throw new Error('dados ainda não carregaram');
  return dados;
}
