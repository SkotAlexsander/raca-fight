import { existsSync } from 'node:fs';
import { defineConfig } from '@playwright/test';

// nesta máquina o Chromium 1243 do Playwright dá acesso negado; o headless shell 1234 abre
const RESERVA = `${process.env.LOCALAPPDATA ?? 'C:/Users/alexs/AppData/Local'}/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-win64/chrome-headless-shell.exe`;

export default defineConfig({
  testDir: 'e2e',
  timeout: 120_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:5175',
    viewport: { width: 2040, height: 790 },
    colorScheme: 'dark',
    acceptDownloads: true,
    launchOptions: existsSync(RESERVA) && !process.env.PW_CHROMIUM_PADRAO ? { executablePath: RESERVA } : {},
  },
  webServer: {
    command: 'npx vite --port 5175 --strictPort',
    url: 'http://localhost:5175',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
