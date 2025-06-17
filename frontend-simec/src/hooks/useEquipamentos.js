// Ficheiro: src/hooks/useEquipamentos.js
// VERSÃO CORRIGIDA - COM useCallback PARA PREVENIR LOOPS DE RENDERIZAÇÃO

import { useState, useEffect, useMemo, useCallback } from 'react';
import { getEquipamentos, getUnidades, deleteEquipamento } from '../services/api';
import { useToast } from '../contexts/ToastContext';

export const useEquipamentos = () => {
  const [equipamentosOriginais, setEquipamentosOriginais] = useState([]);
  const [unidadesDisponiveis, setUnidadesDisponiveis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [filtros, setFiltros] = useState({ unidadeId: '', tipo: '', fabricante: '', status: '' });
  const [sortConfig, setSortConfig] = useState({ key: 'modelo', direction: 'ascending' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [equipData, unidadesData] = await Promise.all([
        getEquipamentos(),
        getUnidades()
      ]);
      setEquipamentosOriginais(equipData || []);
      setUnidadesDisponiveis(unidadesData || []);
    } catch (err) {
      setError(err);
      addToast('Erro ao carregar dados dos equipamentos.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const equipamentosFiltrados = useMemo(() => {
    let filtrados = [...equipamentosOriginais];
    if (searchTerm) {
      filtrados = filtrados.filter(e =>
        e.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.unidade?.nomeSistema.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    Object.entries(filtros).forEach(([key, value]) => {
      if (value) {
        filtrados = filtrados.filter(e => e[key] === value);
      }
    });
    return filtrados;
  }, [equipamentosOriginais, searchTerm, filtros]);

  const equipamentosOrdenados = useMemo(() => {
    let ordenados = [...equipamentosFiltrados];
    if (sortConfig.key) {
      ordenados.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return ordenados;
  }, [equipamentosFiltrados, sortConfig]);

  const removerEquipamento = async (id) => {
    try {
      await deleteEquipamento(id);
      addToast('Equipamento excluído com sucesso!', 'success');
      fetchData(); // Recarrega os dados
    } catch (err) {
      addToast(err.message || 'Erro ao excluir equipamento.', 'error');
    }
  };

  const atualizarStatusLocalmente = (equipamentoId, novoStatus) => {
    setEquipamentosOriginais(prev =>
      prev.map(equip =>
        equip.id === equipamentoId ? { ...equip, status: novoStatus } : equip
      )
    );
  };
  
  // ==========================================================================
  // >> CORREÇÃO PRINCIPAL APLICADA AQUI <<
  // As funções que alteram o estado são envolvidas em useCallback.
  // ==========================================================================
  const handleFilterChange = useCallback((key, value) => {
    setFiltros(prev => ({ ...prev, [key]: value }));
  }, []);

  const requestSort = useCallback((key) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'ascending' ? 'descending' : 'ascending',
    }));
  }, []);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  return {
    equipamentos: equipamentosOrdenados,
    unidadesDisponiveis,
    loading,
    error,
    controles: {
      searchTerm,
      filtros,
      sortConfig,
      handleSearchChange,
      handleFilterChange, // Agora é estável
      requestSort,        // Agora é estável
    },
    removerEquipamento,
    atualizarStatusLocalmente,
  };
};