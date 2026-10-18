/**
 * Baixar um arquivo gerado na hora (o CSV do domínio já vem com o BOM do
 * UTF-8, `;` e CRLF, para o Excel em português abrir certo). Nada vai para o
 * servidor: o arquivo nasce e é salvo no computador do dono.
 */

export function baixarArquivo(nome: string, conteudo: string, tipo = 'text/csv;charset=utf-8'): void {
  const blob = new Blob([conteudo], { type: tipo });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** "lancamentos-outubro-2026.csv" */
export function nomeDoArquivo(base: string, competencia?: string): string {
  const meses = ['janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  return competencia ? `${base}-${meses[Number(competencia.slice(5, 7)) - 1]}-${competencia.slice(0, 4)}.csv` : `${base}.csv`;
}
