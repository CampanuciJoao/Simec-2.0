// Ficheiro: src/components/abas-equipamento/TabHistorico.jsx
// VERSÃO CORRIGIDA E ROBUSTA

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getManutencoes } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { formatarData } from '../../utils/timeUtils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHistory, faEye, faSpinner } from '@fortawesome/free-solid-svg-icons';

// Função para obter a classe da badge de status
const getStatusBadgeClass = (status) => {
    const statusClass = status?.toLowerCase().replace(/\s+/g, '-') || 'default';
    if (status === 'Aguardando Confirmação') {
      return 'status-badge status-os-emandamento';
    }
    return `status-badge status-os-${statusClass}`;
};

function TabHistorico({ equipamentoId }) {
  const { addToast } = useToast();
  
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- Busca de Dados ---
  const carregarHistorico = useCallback(async () => {
    // ==========================================================================
    // >> CORREÇÃO PRINCIPAL APLICADA AQUI <<
    // Adicionamos uma verificação estrita. Se equipamentoId for nulo, indefinido
    // ou uma string vazia, a função não prossegue. Isso previne chamadas inválidas.
    // ==========================================================================
    if (!equipamentoId) {
      setLoading(false); // Para o loading se não houver ID.
      return;
    }
    
    setLoading(true);
    try {
      console.log(`TabHistorico: Buscando manutenções para o equipamentoId: ${equipamentoId}`); // LOG DE DEPURAÇÃO
      const data = await getManutencoes({ equipamentoId: equipamentoId });
      setHistorico(data || []);
    } catch (error) {
      console.error("Erro em TabHistorico ao carregar histórico:", error); // LOG DE DEPURAÇÃO
      addToast('Erro ao carregar o histórico de manutenções.', 'error');
    } finally {
      setLoading(false);
    }
  }, [equipamentoId, addToast]); // O array de dependências está correto.

  // O useEffect continua o mesmo, mas agora a função que ele chama é mais segura.
  useEffect(() => {
    carregarHistorico();
  }, [carregarHistorico]);

  return (
    <div>
      <div className="section-header">
        <h3 className="tab-title">
          <FontAwesomeIcon icon={faHistory} /> Histórico de Manutenções
        </h3>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <FontAwesomeIcon icon={faSpinner} spin /> Carregando histórico...
        </div>
      ) : historico.length > 0 ? (
        <div className="table-responsive-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nº OS</th>
                <th>Tipo</th>
                <th>Data Agendada</th>
                <th>Status</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {historico.map(manutencao => (
                <tr key={manutencao.id}>
                  <td data-label="Nº OS">{manutencao.numeroOS}</td>
                  <td data-label="Tipo">{manutencao.tipo}</td>
                  <td data-label="Data Agendada">{formatarData(manutencao.dataHoraAgendamentoInicio)}</td>
                  <td data-label="Status">
                    <span className={getStatusBadgeClass(manutencao.status)}>
                      {manutencao.status}
                    </span>
                  </td>
                  <td className="actions-cell text-right">
                    <Link to={`/manutencoes/detalhes/${manutencao.id}`} className="btn-action view" title="Ver Detalhes da OS">
                      <FontAwesomeIcon icon={faEye} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="no-data-message">Nenhum histórico de manutenção encontrado para este equipamento.</p>
      )}
    </div>
  );
}

export default TabHistorico;