// Ficheiro: src/pages/EquipamentosPage.jsx
// VERSÃO 5.1 - LÓGICA DE FILTRO SIMPLIFICADA E DIRETA

import React, { useMemo, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSort, faSortUp, faSortDown, faEye, faEdit, faTrashAlt, faSpinner, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { useEquipamentos } from '../hooks/useEquipamentos';
import { useModal } from '../hooks/useModal';
import { useAuth } from '../contexts/AuthContext';
import GlobalFilterBar from '../components/GlobalFilterBar';
import ModalConfirmacao from '../components/ModalConfirmacao';
import StatusSelector from '../components/StatusSelector';
import { formatarData as formatarDataParaBR } from '../utils/timeUtils';

import '../styles/components/tables.css';

const getRowHighlightClass = (status) => {
  const statusClass = status?.replace(/\s+/g, '').toLowerCase() || 'default';
  const highlightable = {
    'operante': 'status-row-operante',
    'inoperante': 'status-row-inoperante',
    'emmanutencao': 'status-row-emmanutencao',
    'usolimitado': 'status-row-usolimitado',
  };
  return highlightable[statusClass] || '';
};

// A função mapLabelToStatusEnum foi removida pois não é mais necessária.

function EquipamentosPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const {
    equipamentos,
    unidadesDisponiveis,
    loading,
    error,
    setFiltros,
    controles,
    removerEquipamento,
    atualizarStatusLocalmente
  } = useEquipamentos();

  const {
    isOpen: isDeleteModalOpen,
    modalData: equipamentoParaExcluir,
    openModal: abrirModalExclusao,
    closeModal: fecharModalExclusao
  } = useModal();
  
  useEffect(() => {
    if (location.state?.filtroStatusInicial) {
      const statusEnumValue = location.state.filtroStatusInicial;
      setFiltros(prevFiltros => ({ ...prevFiltros, status: statusEnumValue }));
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, setFiltros, navigate, location.pathname]);

  const confirmarExclusao = () => {
    if (equipamentoParaExcluir) {
      removerEquipamento(equipamentoParaExcluir.id);
      fecharModalExclusao();
    }
  };
  
  const selectFiltersConfig = useMemo(() => {
    const equipamentosUnicos = equipamentos || [];
    const tipos = [...new Set(equipamentosUnicos.map(e => e.tipo).filter(Boolean))].sort();
    const fabricantes = [...new Set(equipamentosUnicos.map(e => e.fabricante).filter(Boolean))].sort();
    const statusOptions = ["Operante", "Inoperante", "UsoLimitado", "EmManutencao"];
    return [
      { id: 'unidadeId', value: controles.filtros.unidadeId, onChange: (v) => controles.handleFilterChange('unidadeId', v), options: unidadesDisponiveis.map(u => ({ value: u.id, label: u.nomeSistema })), defaultLabel: 'Todas Unidades' },
      { id: 'tipo', value: controles.filtros.tipo, onChange: (v) => controles.handleFilterChange('tipo', v), options: tipos.map(t => ({ value: t, label: t })), defaultLabel: 'Todos Tipos' },
      { id: 'fabricante', value: controles.filtros.fabricante, onChange: (v) => controles.handleFilterChange('fabricante', v), options: fabricantes.map(f => ({ value: f, label: f })), defaultLabel: 'Todos Fabricantes' },
      { id: 'status', value: controles.filtros.status, onChange: (v) => controles.handleFilterChange('status', v), options: statusOptions.map(s => ({ value: s, label: s.replace(/([A-Z])/g, ' $1').trim() })), defaultLabel: 'Todos os Status' }
    ];
  }, [equipamentos, unidadesDisponiveis, controles.filtros, controles.handleFilterChange]);
  
  return (
    <>
      <ModalConfirmacao isOpen={isDeleteModalOpen} onClose={fecharModalExclusao} onConfirm={confirmarExclusao} title="Confirmar Exclusão" message={`Tem certeza que deseja excluir o equipamento "${equipamentoParaExcluir?.modelo}" (Tag: ${equipamentoParaExcluir?.tag})?`} isDestructive={true} />
      
      <div className="page-content-wrapper">
        <div className="page-title-card">
          <h1 className="page-title-internal">Gerenciamento de Equipamentos</h1>
        </div>

        <section className="page-section table-section">
          <div className="table-header-actions">
            <span className="item-count">{loading ? <><FontAwesomeIcon icon={faSpinner} spin /> Carregando...</> : `${equipamentos.length} equipamento(s) encontrado(s)`}</span>
          </div>
          
          <div className="filters-container">
              <GlobalFilterBar searchTerm={controles.searchTerm} onSearchChange={controles.handleSearchChange} searchPlaceholder="Buscar por Modelo, Tag, Unidade..." selectFilters={selectFiltersConfig} />
          </div>
          
          {error && <p className="form-error"><FontAwesomeIcon icon={faExclamationTriangle} /> {error.message}</p>}
          
          <div className="table-responsive-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="col-text-left sortable-header" onClick={() => controles.requestSort('modelo')}>Modelo <FontAwesomeIcon icon={controles.sortConfig.key === 'modelo' ? (controles.sortConfig.direction === 'ascending' ? faSortUp : faSortDown) : faSort} className={controles.sortConfig.key === 'modelo' ? 'sort-arrow active' : 'sort-arrow'}/></th><th>Nº Série (Tag)</th><th>Tipo</th><th>Unidade</th><th>Fabricante</th><th>Data Inst.</th><th>Status</th><th className="col-text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                   <tr><td colSpan="8" className="table-message"><FontAwesomeIcon icon={faSpinner} spin /> Carregando dados...</td></tr>
                ) : equipamentos.length === 0 ? (
                  <tr><td colSpan="8" className="table-message">Nenhum equipamento encontrado.</td></tr>
                ) : (
                  equipamentos.map((equip) => (
                    <tr key={equip.id} className={getRowHighlightClass(equip.status)}>
                      <td data-label="Modelo" className="col-text-left">{equip.modelo}</td>
                      <td data-label="Nº Série (Tag)">{equip.tag}</td>
                      <td data-label="Tipo">{equip.tipo}</td>
                      <td data-label="Unidade">{equip.unidade?.nomeSistema || 'N/A'}</td>
                      <td data-label="Fabricante">{equip.fabricante}</td>
                      <td data-label="Data Inst.">{formatarDataParaBR(equip.dataInstalacao)}</td>
                      <td data-label="Status">
                        <StatusSelector 
                            equipamento={equip} 
                            onSuccessUpdate={atualizarStatusLocalmente} 
                        />
                      </td>
                      <td data-label="Ações" className="actions-cell col-text-right">
                        <Link to={`/equipamentos/detalhes/${equip.id}`} className="btn-action view" title="Ver Detalhes"><FontAwesomeIcon icon={faEye} /></Link>
                        <button onClick={() => navigate(`/cadastros/equipamentos/editar/${equip.id}`)} className="btn-action edit" title="Editar"><FontAwesomeIcon icon={faEdit} /></button>
                        {user?.role === 'admin' && <button onClick={() => abrirModalExclusao(equip)} className="btn-action delete" title="Excluir"><FontAwesomeIcon icon={faTrashAlt} /></button>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}

export default EquipamentosPage;