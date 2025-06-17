// Ficheiro: src/contexts/AuthContext.jsx
// VERSÃO FINAL SÊNIOR - LÓGICA DE ESTADO E PERSISTÊNCIA CORRIGIDA

import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUsuario } from '../services/api';

// 1. Cria o Contexto
// Inicializado como null, será preenchido pelo Provider.
export const AuthContext = createContext(null);

// 2. Cria o Provider
// Este é o componente que irá envolver a sua aplicação e fornecer os dados de autenticação.
export const AuthProvider = ({ children }) => {
  // --- Estado ---
  // O estado 'user' deve conter APENAS o objeto do usuário (ex: { id, nome, role }).
  const [user, setUser] = useState(null); 
  // O estado de 'loading' é crucial para evitar que a aplicação "pisque" antes de saber se o usuário está logado.
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();

  // --- Efeitos ---
  // Este efeito é executado apenas uma vez, quando a aplicação é carregada pela primeira vez.
  // Sua função é verificar o localStorage para ver se uma sessão de usuário já existe.
  useEffect(() => {
    try {
      const userInfoString = localStorage.getItem('userInfo'); 
      if (userInfoString) {
        const storedData = JSON.parse(userInfoString);
        // VALIDAÇÃO CRÍTICA: Garante que o objeto salvo tem a estrutura esperada.
        if (storedData?.usuario && storedData?.token) {
          // Define o estado 'user' com o objeto ANINHADO 'usuario'.
          setUser(storedData.usuario);
        }
      }
    } catch (error) {
      console.error("AuthContext: Erro ao carregar dados do usuário do localStorage. Limpando.", error);
      // Se os dados estiverem corrompidos, limpa o localStorage para segurança.
      localStorage.removeItem('userInfo');
    } finally {
      // Independentemente do resultado, marca o carregamento como concluído.
      setLoading(false);
    }
  }, []); // O array de dependências vazio [] garante que este efeito rode apenas uma vez.

  // --- Funções de Ação ---

  const login = async (username, senha) => {
    try {
      const credenciais = { username, senha };
      // A API retorna o objeto completo: { token, usuario: {...} }
      const responseData = await loginUsuario(credenciais);
      
      // Salva o objeto completo no localStorage para persistência.
      localStorage.setItem('userInfo', JSON.stringify(responseData));
      
      // Define o estado 'user' apenas com o objeto aninhado 'usuario'.
      setUser(responseData.usuario);
      
      navigate('/dashboard', { replace: true });
    } catch (error) {
      console.error("Falha no login (AuthContext):", error);
      // Relança o erro para que a LoginPage possa capturá-lo e exibir uma mensagem.
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('userInfo');
    setUser(null);
    navigate('/login', { replace: true });
  };

  // 3. Monta o Objeto de Valor
  // Este é o objeto que será disponibilizado para todos os componentes filhos que consumirem o contexto.
  const value = {
    user, // O objeto do usuário (ou null).
    isAuthenticated: !!user, // Um booleano prático para verificações rápidas.
    loading,
    login,
    logout,
  };

  // 4. Retorna o Provider
  // A verificação `!loading` garante que os componentes filhos só sejam renderizados
  // depois que a verificação inicial do localStorage for concluída.
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// 5. Hook Customizado para Consumo (Opcional, mas boa prática)
// Em vez de fazer `useContext(AuthContext)` em cada componente, eles chamarão `useAuth()`.
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};