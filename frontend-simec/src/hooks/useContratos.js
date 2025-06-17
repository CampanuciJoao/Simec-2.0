// frontend-simec/src/hooks/useContratos.js

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getContratos, getUnidades, deleteContrato } from '../services/api';

export function useContratos() {
  const [contratos, setContratos] = useState([]);
  const [unidades, setUnidades] = useState([]); // <-- Novo estado
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtros, setFiltros] = useState({ categoria: '', status: '', unidade: '' });
  const [sortConfig, setSortConfig] = useState({ key: 'dataFim', direction: 'ascending' });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [contratosData, unidadesData] = await Promise.all([
        getContratos(),
        getUnidades()
      ]);
      setContratos(Array.isArray(contratosData) ? contratosData : []);
      setUnidades(unidadesData);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const contratosFiltradosEOrdenados = useMemo(() => {
    let items = [...contratos];
    if (searchTerm) {
      const termo = searchTerm.toLowerCase();
      items = items.filter(c => 
        c.numeroContrato?.toLowerCase().includes(termo) || 
        c.fornecedor?.toLowerCase().includes(termo)
      );
    }
    if (filtros.categoria) items = items.filter(c => c.categoria === filtros.categoria);
    if (filtros.status) items = items.filter(c => c.status === filtros.status);
    if (filtros.unidade) items = items.filter(c => c.unidadesCobertas?.includes(filtros.unidade));

    if (sortConfig.key) {
      items.sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];
        if (sortConfig.key.includes('data')) {
          return sortConfig.direction === 'ascending' ? new Date(valA) - new Date(valB) : new Date(valB) - new Date(valA);
        }
        return String(valA || '').localeCompare(String(valB || ''));
      });
    }
    return items;
  }, [contratos, searchTerm, filtros, sortConfig]);
  
  const removerContrato = useCallback(async (id) => {
    await deleteContrato(id);
    await fetchData();
  }, [fetchData]);

  return {
    contratos: contratosFiltradosEOrdenados,
    unidadesDisponiveis: unidades, // <-- Exporta para o filtro
    loading,
    error,
    searchTerm,
    setSearchTerm,
    filtros,
    setFiltros,
    sortConfig,
    setSortConfig,
    removerContrato,
    refetch: fetchData
  };
}
