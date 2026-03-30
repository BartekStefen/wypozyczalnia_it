import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

/**
 * Punkt wejścia aplikacji React.
 * StrictMode renderuje komponenty podwójnie w dev — pomaga wykrywać efekty uboczne.
 * Nie wpływa na produkcję.
 */
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);