import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { registerServiceWorker } from './lib/pwa.js';
import { applyStoredCompanyPwa } from './lib/brand/applyCompanyPwa.js';
import { watchForUpdates } from './lib/appUpdate.js';
import './styles/tokens.css';

// Antes que nada: Chrome congela el nombre y el icono del diálogo de instalación en cuanto el
// service worker queda registrado, así que la identidad de la compañía tiene que estar puesta
// antes de esa línea. App.jsx la refina después (logo de la compañía, cambios de compañía).
applyStoredCompanyPwa();

registerServiceWorker();
watchForUpdates();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
