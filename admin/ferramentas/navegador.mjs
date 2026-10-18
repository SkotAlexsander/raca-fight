// Abre o Chromium do Playwright, caindo no headless shell 1234 se o padrão não abrir
// (nesta máquina o 1243 dá acesso negado; ver a memória "Valores").
import { existsSync } from 'node:fs';
import { chromium } from '@playwright/test';

const RESERVA = `${process.env.LOCALAPPDATA ?? 'C:/Users/alexs/AppData/Local'}/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-win64/chrome-headless-shell.exe`;

export async function abrirNavegador() {
  try {
    return await chromium.launch();
  } catch (e) {
    if (!existsSync(RESERVA)) throw e;
    return chromium.launch({ executablePath: RESERVA });
  }
}

export const caminhoDeReserva = () => (existsSync(RESERVA) ? RESERVA : undefined);
