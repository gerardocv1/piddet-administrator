import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { registerServiceWorker } from './lib/pwa.js';
import { watchForUpdates } from './lib/appUpdate.js';
import './styles/tokens.css';

// La identidad instalable (nombre e icono de la compañía) ya la dejó puesta el script en línea
// del <head>, que corre durante el parseo: tiene que estar antes de que el navegador mire el
// manifest. App.jsx solo la reaplica en caliente. Ver index.html.
registerServiceWorker();
watchForUpdates();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
