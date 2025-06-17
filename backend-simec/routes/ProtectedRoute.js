// Ficheiro: src/components/ProtectedRoute.jsx
// VERSÃO FINAL SÊNIOR - COMPLETA E FUNCIONAL

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Enquanto o AuthContext verifica o localStorage, mostramos um spinner.
  // Isso previne qualquer "flash" da tela de login.
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <FontAwesomeIcon icon={faSpinner} spin size="3x" color="#3b82f6" />
      </div>
    );
  }

  // Após a verificação, se o usuário NÃO estiver autenticado...
  if (!isAuthenticated) {
    // ...o redirecionamos para o login.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Se estiver autenticado, renderiza o conteúdo protegido (no seu caso, o AppLayout).
  return children;
}

export default ProtectedRoute;