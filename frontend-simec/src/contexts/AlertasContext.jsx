// Ficheiro: src/contexts/AlertasContext.jsx
// VERSÃO FINAL SÊNIOR - COM LÓGICA DE DISPENSAR (REMOÇÃO OTIMISTA)

import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { getAlertas, updateAlertaStatus } from '../services/api';
import { useAuth } from './AuthContext';

// 1. Criação do Contexto
const AlertasContext = createContext(null);

// 2. Componente Provider
export const AlertasProvider = ({ children }) => {
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  /**
   * @function carregarAlertas
   * @description Função central para buscar os alertas da API.
   * Agora busca alertas específicos para o usuário logado.
   */
  const carregarAlertas = useCallback(async () => {
    if (!isAuthenticated || authLoading || !user?.id) {
      setAlertas([]);
      if (!authLoading) setLoading(false);
      return;
    }

    try {
      const data = await getAlertas(); 
      setAlertas(data || []);
      
    } catch (error) {
      console.error("AlertasContext: Falha ao buscar dados de alertas.", error);
      setAlertas([]);
    } finally {
        setLoading(false);
    }
  }, [isAuthenticated, authLoading, user?.id]);

  /**
   * @effect [Inicialização e Polling]
   * @description Efeito que gerencia a busca inicial e a atualização periódica (polling).
   */
  useEffect(() => {
    if (isAuthenticated && !authLoading && user?.id) {
      carregarAlertas();

      const intervalId = setInterval(carregarAlertas, 60 * 1000);

      return () => {
        clearInterval(intervalId);
        setAlertas([]);
        setLoading(true);
      };
    } else if (!isAuthenticated && !authLoading) {
        setAlertas([]);
        setLoading(false);
    }
  }, [isAuthenticated, authLoading, user?.id, carregarAlertas]);


  /**
   * @function updateStatus
   * @description Atualiza o status de visualização de um alerta específico (ex: marcar como visto/não visto).
   * Faz uma atualização otimista na UI antes de confirmar com a API.
   */
  const updateStatus = useCallback(async (alertaId, newStatus) => {
    const originalAlertas = alertas;
    
    setAlertas(prevAlertas => 
      prevAlertas.map(alerta => 
        alerta.id === alertaId ? { ...alerta, status: newStatus } : alerta
      )
    );

    try {
      await updateAlertaStatus(alertaId, newStatus); 
      
    } catch (error) {
      console.error(`Erro ao atualizar status do alerta ${alertaId}. Revertendo...`, error);
      setAlertas(originalAlertas);
    }
  }, [alertas]);

  /**
   * @function dismissAlerta
   * @description Remove um alerta da visualização do usuário (otimista) e marca como 'Visto' na API.
   * Ideal para a ação "Dispensar".
   */
  const dismissAlerta = useCallback(async (alertaId) => {
    const originalAlertas = [...alertas];
    
    // Atualização otimista: remove o alerta da UI imediatamente.
    setAlertas(prevAlertas => prevAlertas.filter(alerta => alerta.id !== alertaId));

    try {
      // A ação no backend continua a mesma: marcar como 'Visto'.
      await updateAlertaStatus(alertaId, 'Visto');
    } catch (error) {
      console.error(`Erro ao dispensar o alerta ${alertaId}. Revertendo...`, error);
      setAlertas(originalAlertas); // Reverte a UI em caso de falha na API.
    }
  }, [alertas]);


  // 3. Monta o valor a ser fornecido pelo contexto.
  const value = useMemo(() => ({
    alertas,
    loading,
    updateStatus,
    dismissAlerta,
    refetchAlertas: carregarAlertas,
  }), [alertas, loading, updateStatus, dismissAlerta, carregarAlertas]);

  // 4. Retorna o Provider
  return (
    <AlertasContext.Provider value={value}>
      {children}
    </AlertasContext.Provider>
  );
};

// 5. Hook customizado para facilitar o consumo do contexto.
export const useAlertas = () => {
    const context = useContext(AlertasContext);
    if (context === undefined) {
        throw new Error('useAlertas deve ser usado dentro de um AlertasProvider');
    }
    return context;
};