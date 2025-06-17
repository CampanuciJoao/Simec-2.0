// Ficheiro: src/pages/AlertasPage.jsx
// VERSÃO FINAL CORRIGIDA - COM FILTRO PADRÃO PARA "NÃO VISTO"

// --- Core & Routing Dependencies ---
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';

// --- Custom Hooks & Context ---
import { useAlertas } from '../contexts/AlertasContext';

// --- UI Components & Assets ---
import GlobalFilterBar from '../components/GlobalFilterBar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faEye, faCheck, faEyeSlash, faBellSlash } from '@fortawesome/free-solid-svg-icons';

/**
 * @component AlertaItem
 * @description Componente de apresentação para um único alerta.
 * Recebe o alerta já com o status individualizado para o usuário logado.
 */
const AlertaItem = ({ alerta, onUpdateStatus, onDismiss }) => {
  const prioridadeMap = {
    'Alta': { cor: '#EF4444' },
    'Media': { cor: '#F59E0B' },
    'Baixa': { cor: '#3B82F6' }
  };
  const prioridadeStyle = prioridadeMap[alerta.prioridade] || { cor: '#6B7280' };
  const dataFormatada = new Date(alerta.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

  // Handler para quando o botão "Ver Detalhes" ou o próprio link é clicado
  const handleViewDetails = () => {
    if (alerta.status === 'NaoVisto') {
      onUpdateStatus(alerta.id, 'Visto');
    }
  };

  // Handler para o botão "Dispensar"
  const handleDismiss = () => {
    onDismiss(alerta.id);
  };

  return (
    <div className={`alerta-item ${alerta.status === 'Visto' ? 'visto' : ''}`}>
      <div className="alerta-prioridade-barra" style={{ backgroundColor: prioridadeStyle.cor }}></div>
      <div className="alerta-conteudo">
        <h4 className="alerta-titulo">{alerta.titulo}</h4>
        <div className="alerta-subtitulo">
          <span>{alerta.subtitulo}</span>
          <span><i className="far fa-clock" style={{ marginRight: '5px' }}></i> {dataFormatada}</span>
        </div>
      </div>
      <div className="alerta-acoes">
        <span className="alerta-prioridade-tag" style={{ backgroundColor: `${prioridadeStyle.cor}20`, color: prioridadeStyle.cor }}>{alerta.prioridade}</span>
        
        <Link to={alerta.link || '#'} className="btn-action view" title="Ver Detalhes" onClick={handleViewDetails}>
          <FontAwesomeIcon icon={faEye} /> Ver
        </Link>
        
        {alerta.status === 'Visto' ? (
          <button onClick={() => onUpdateStatus(alerta.id, 'NaoVisto')} className="btn-action warning" title="Marcar como não visto">
            <FontAwesomeIcon icon={faEyeSlash} /> Não visto
          </button>
        ) : (
          <>
            <button onClick={() => onUpdateStatus(alerta.id, 'Visto')} className="btn-action success" title="Marcar como visto">
              <FontAwesomeIcon icon={faCheck} /> Visto
            </button>
            <button onClick={handleDismiss} className="btn-action dismiss" title="Dispensar alerta da minha visualização">
              <FontAwesomeIcon icon={faBellSlash} /> Dispensar
            </button>
          </>
        )}

      </div>
    </div>
  );
};


/**
 * @component AlertasPage
 * @description Componente de página que exibe e permite a filtragem da lista de alertas do sistema.
 */
function AlertasPage() {
  const { alertas = [], loading, updateStatus, dismissAlerta } = useAlertas();
  const [searchTerm, setSearchTerm] = useState('');
  
  // ==========================================================================
  // >> CORREÇÃO PRINCIPAL APLICADA AQUI <<
  // O estado inicial do filtro de status agora é 'NaoVisto'.
  // ==========================================================================
  const [filtros, setFiltros] = useState({ tipo: '', status: 'NaoVisto' });

  const alertasFiltrados = useMemo(() => {
    return alertas.filter(alerta => {
      const termoBusca = searchTerm.toLowerCase();
      const matchSearch = alerta.titulo.toLowerCase().includes(termoBusca) || (alerta.subtitulo && alerta.subtitulo.toLowerCase().includes(termoBusca));
      const matchTipo = !filtros.tipo || alerta.tipo === filtros.tipo;
      const matchStatus = !filtros.status || alerta.status === filtros.status;
      return matchSearch && matchTipo && matchStatus;
    });
  }, [alertas, searchTerm, filtros]);

  const tiposOptions = useMemo(() => [...new Set(alertas.map(a => a.tipo))].map(t => ({ value: t, label: t })), [alertas]);
  const statusOptions = [{ value: 'NaoVisto', label: 'Não Visto' }, { value: 'Visto', label: 'Visto' }];

  const selectFiltersConfig = [
    { id: 'tipo', value: filtros.tipo, onChange: (v) => setFiltros(f => ({ ...f, tipo: v })), options: tiposOptions, defaultLabel: 'Todos os Tipos' },
    { id: 'status', value: filtros.status, onChange: (v) => setFiltros(f => ({ ...f, status: v })), options: statusOptions, defaultLabel: 'Todos os Status' }
  ];

  return (
    <div className="page-content-wrapper">
      <div className="page-title-card">
        <h1 className="page-title-internal">Sistema de Alertas</h1>
      </div>
      <section className="page-section">
        <h3>Alertas Pendentes ({alertasFiltrados.length})</h3>

        <GlobalFilterBar
          searchTerm={searchTerm}
          onSearchChange={(e) => setSearchTerm(e.target.value)}
          searchPlaceholder="Buscar na descrição..."
          selectFilters={selectFiltersConfig}
        />

        <div className="alertas-lista">
          {loading ? (
            <p style={{ textAlign: 'center', margin: '20px' }}><FontAwesomeIcon icon={faSpinner} spin /> Carregando alertas...</p>
          ) : alertasFiltrados.length > 0 ? (
            alertasFiltrados.map(alerta => (
              <AlertaItem 
                key={alerta.id} 
                alerta={alerta} 
                onUpdateStatus={updateStatus} 
                onDismiss={dismissAlerta} 
              />
            ))
          ) : (
            <p className="no-data-message">Nenhum alerta pendente para os filtros selecionados.</p>
          )}
        </div>

        <div className="nota-rodape">
          <h4>Nota:</h4>
          <ul>
            <li>Por padrão, esta página exibe apenas os alertas pendentes (não vistos).</li>
            <li>Use o filtro "Status" para visualizar alertas já tratados ou todos os alertas.</li>
            <li>"Dispensar" um alerta irá removê-lo da sua visualização de pendentes e marcá-lo como "Visto" no sistema.</li>
          </ul>
        </div>
      </section>
    </div>
  );
}

export default AlertasPage;