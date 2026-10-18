import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './estilos/tokens.css';
import './estilos/admin.css';
import './estilos/app.css';
import { App } from './App.tsx';
import { aplicarTemaInicial } from './moldura/tema.ts';

aplicarTemaInicial();

createRoot(document.getElementById('raiz')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// o app instalável: o service worker guarda só a casca (HTML, JS, CSS, fontes, ícones),
// NUNCA dado financeiro (o Admin não tem fila offline; 05-ADMIN.md, seção 5)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  addEventListener('load', () => { void navigator.serviceWorker.register('/sw.js'); });
}
