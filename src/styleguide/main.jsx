import React from 'react';
import ReactDOM from 'react-dom/client';
import { StyleguideApp } from './StyleguideApp.jsx';
import '../styles/tokens.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <StyleguideApp />
  </React.StrictMode>
);
