// Ficheiro: src/main.jsx
// VERSÃO FINAL SÊNIOR - PONTO DE ENTRADA ÚNICO E ORGANIZADO

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

// Importação dos Provedores de Contexto
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { AlertasProvider } from './contexts/AlertasContext';

// Importação do Componente Principal e Estilos Globais
import App from './App';
import './index.css'; // Importa o orquestrador de estilos

const root = ReactDOM.createRoot(document.getElementById('root'));

// A renderização raiz agora configura toda a estrutura de provedores e roteamento.
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AlertasProvider>
            <App />
          </AlertasProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);