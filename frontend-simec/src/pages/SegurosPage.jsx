// Ficheiro: frontend-simec/src/pages/SegurosPage.jsx
// VERSÃO ATUALIZADA - COM LÓGICA DE STATUS DINÂMICO E DESTAQUE DE LINHA REFINADA

import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSeguros } from '../hooks/useSeguros';
import { useModal } from '../hooks/useModal';
import GlobalFilterBar from '../components/GlobalFilterBar';
import ModalConfirmacao from '../components/ModalConfirmacao';
import { useToast } from '../contexts/ToastContext';
import { formatarData } from '../utils/timeUtils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrashAlt, faSpinner, faExclamationTriangle, faSort, faSortUp, faSortDown, faEdit } from '@fortawesome/free-solid-svg-icons';

// ==========================================================================
// --- MÓDULO DE FUNÇÕES AUXILIARES DE UI PARA STATUS ---
// Ajustadas para a nova lógica de variação por dias.
// ==========================================================================

/**
 * Determina o TEXTO do status a ser exibido, com base no status e data de vencimento do seguro.
 * @param {object} seguro - O objeto completo do seguro.
 * @returns {string} O texto do status dinâmico ('Ativo', 'Vence em breve', 'Expirado', 'Cancelado').
 */
const getDynamicStatus = (seguro) => {
  // Status 'Cancelado' e 'Expirado' têm prioridade, pois são estados finais.
  if (seguro.status === 'Cancelado') {
    return 'Cancelado';
  }
  
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0); // Zera a hora para uma comparação de data precisa.
  const dataFim = new Date(seguro.dataFim);

  if (dataFim < hoje) {
    return 'Expirado';
  }

  // Se o status do banco for 'Expirado' mas a data ainda não passou (erro de dado?), priorizamos a data.
  // No seu caso, o backend deve garantir que a dataFim é coerente com o status 'Expirado'.
  // Esta condição só seria alcançada se seguro.status fosse 'Ativo' no BD.
  const diffTime = dataFim.getTime() - hoje.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 30) { // Inclui 7 e 15 dias também
    return 'Vence em breve';
  }

  // Se a data de fim ainda está no futuro e não está 'Vence em breve', é 'Ativo'.
  return 'Ativo';
};

/**
 * Retorna a classe CSS correta para a BADGE de status.
 * @param {string} statusText - O texto do status dinâmico retornado por getDynamicStatus.
 * @returns {string} A string de classes CSS para a badge.
 */
const getStatusBadgeClass = (statusText) => {
  const statusMap = {
    'ativo': 'status-ativo', // Sua classe CSS já existente para verde
    'expirado': 'status-inativo', // Sua classe CSS já existente para vermelho/inativo
    'cancelado': 'status-cancelado', // Sua classe CSS já existente para cinza
    'vence em breve': 'status-vence-em-breve' // Sua classe CSS já existente para amarelo
  };
  // Fallback para 'default' se não encontrar, embora todos os status dinâmicos devem estar mapeados.
  const statusClass = statusMap[statusText?.toLowerCase()] || 'default'; 
  return `status-badge ${statusClass}`;
};

/**
 * Retorna a classe CSS para o DESTAQUE DA LINHA da tabela (<tr>).
 * Implementa a regra de negócio de cores baseada na proximidade do vencimento e status.
 * @param {object} seguro - O objeto completo do seguro.
 * @returns {string} A classe CSS para destaque da linha.
 */
const getRowHighlightClass = (seguro) => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0); 
    const dataFim = new Date(seguro.dataFim);

    // Prioridade para status finais definidos no banco ou vencidos.
    if (seguro.status === 'Cancelado') { // Se o status do banco é 'Cancelado', a linha é cinza.
        return 'status-row-os-concluida'; // Usando a classe de manutenção concluída que é cinza
    }
    
    if (dataFim < hoje) { // Se a data final já passou, é expirado (vermelho).
        return 'status-row-vencendo-danger';
    }

    // Para seguros que ainda não venceram e não estão cancelados, calculamos a proximidade.
    const diffTime = dataFim.getTime() - hoje.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 7) { // 7 dias ou menos para vencer (vermelho)
        return 'status-row-vencendo-danger';
    }
    if (diffDays <= 30) { // entre 8 e 30 dias para vencer (amarelo)
        return 'status-row-vencendo-warning';
    }
    
    // Se não se encaixa nas regras acima, e o status é 'Ativo' (do banco), a linha é verde.
    return 'status-row-ativo';
};


/**
 * @component SegurosPage
 * @description Componente "inteligente" que orquestra os hooks e a renderização da página de Seguros.
 */
function SegurosPage() {
    const navigate = useNavigate();
    const { addToast } = useToast();

    const {
        seguros,
        unidadesDisponiveis,
        segurosOriginais, // Adicionado segurosOriginais aqui
        loading,
        error,
        searchTerm,
        setSearchTerm,
        filtros,
        setFiltros,
        sortConfig,
        setSortConfig,
        removerSeguro
    } = useSeguros();
    
    const { isOpen: isDeleteModalOpen, modalData: seguroParaDeletar, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();

    const requestSort = (key) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'ascending' ? 'descending' : 'ascending'
        }));
    };
    
    const confirmarExclusao = async () => {
        if (!seguroParaDeletar) return;
        try {
            await removerSeguro(seguroParaDeletar.id);
            addToast('Seguro excluído com sucesso!', 'success');
        } catch (err) {
            addToast(err.message || 'Erro ao excluir seguro.', 'error');
        } finally {
            closeDeleteModal();
        }
    };
    
    // Filtros agora usam 'segurosOriginais' para obter todas as opções possíveis.
    const seguradorasUnicas = useMemo(() => [...new Set((segurosOriginais || []).map(s => s.seguradora).filter(Boolean))].sort(), [segurosOriginais]);
    const unidadesOptions = useMemo(() => (unidadesDisponiveis || []).map(u => ({ value: u.nomeSistema, label: u.nomeSistema })), [unidadesDisponiveis]);
    // As opções de status do filtro devem incluir todos os status que podem vir do DB.
    const statusDbOptions = useMemo(() => ["Ativo", "Expirado", "Cancelado"].map(s => ({ value: s, label: s })), []); 
    
    const selectFiltersConfig = [
        { id: 'seguradora', value: filtros.seguradora, onChange: (v) => setFiltros(f => ({ ...f, seguradora: v })), options: seguradorasUnicas.map(s => ({ value: s, label: s })), defaultLabel: 'Todas as Seguradoras' },
        { id: 'unidade', value: filtros.unidade, onChange: (v) => setFiltros(f => ({ ...f, unidade: v })), options: unidadesOptions, defaultLabel: 'Todas as Unidades' },
        { id: 'status', value: filtros.status, onChange: (v) => setFiltros(f => ({ ...f, status: v })), options: statusDbOptions, defaultLabel: 'Todos os Status' },
    ];

    return (
        <>
            <ModalConfirmacao isOpen={isDeleteModalOpen} onClose={closeDeleteModal} onConfirm={confirmarExclusao} title="Confirmar Exclusão" message={`Tem certeza que deseja excluir a apólice nº ${seguroParaDeletar?.apoliceNumero}?`} isDestructive={true} />
            <div className="page-content-wrapper">
                <div className="page-title-card"><h1 className="page-title-internal">Gerenciamento de Seguros</h1></div>
                <section className="page-section table-section">
                    <div className="table-header-actions">
                        <span>{loading ? <><FontAwesomeIcon icon={faSpinner} spin /> Carregando...</> : `${seguros.length} apólice(s) encontrada(s)`}</span>
                        <button className="btn btn-primary" onClick={() => navigate('/seguros/adicionar')}><FontAwesomeIcon icon={faPlus} /> Adicionar Seguro</button>
                    </div>
                    <GlobalFilterBar searchTerm={searchTerm} onSearchChange={(e) => setSearchTerm(e.target.value)} searchPlaceholder="Buscar por apólice, item segurado..." selectFilters={selectFiltersConfig} />
                    {error && <p className="form-error"><FontAwesomeIcon icon={faExclamationTriangle} /> {error.message}</p>}
                    <div className="table-responsive-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    {/* Remova espaços e quebras de linha entre as tags <th> */}
                                    <th className="text-left" onClick={() => requestSort('apoliceNumero')}>Apólice <FontAwesomeIcon icon={sortConfig.key === 'apoliceNumero' ? (sortConfig.direction === 'ascending' ? faSortUp : faSortDown) : faSort}/></th><th className="text-left">Item Segurado</th><th className="text-left" onClick={() => requestSort('unidade.nomeSistema')}>Unidade <FontAwesomeIcon icon={sortConfig.key === 'unidade.nomeSistema' ? (sortConfig.direction === 'ascending' ? faSortUp : faSortDown) : faSort}/></th><th className="text-left" onClick={() => requestSort('seguradora')}>Seguradora <FontAwesomeIcon icon={sortConfig.key === 'seguradora' ? (sortConfig.direction === 'ascending' ? faSortUp : faSortDown) : faSort}/></th><th className="text-center" onClick={() => requestSort('dataFim')}>Fim da Vigência <FontAwesomeIcon icon={sortConfig.key === 'dataFim' ? (sortConfig.direction === 'ascending' ? faSortUp : faSortDown) : faSort}/></th><th className="text-center" onClick={() => requestSort('status')}>Status <FontAwesomeIcon icon={sortConfig.key === 'status' ? (sortConfig.direction === 'ascending' ? faSortUp : faSortDown) : faSort}/></th><th className="text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && seguros.length === 0 ? (
                                    <tr><td colSpan="7" className="table-message"><FontAwesomeIcon icon={faSpinner} spin /> Carregando...</td></tr>
                                ) : seguros.length > 0 ? (
                                    seguros.map(seguro => {
                                        // Calcula o status dinâmico e classes de estilo
                                        const statusDinamico = getDynamicStatus(seguro);
                                        const classeDaLinha = getRowHighlightClass(seguro); // Passa o objeto completo para avaliar status do DB
                                        const classeDaBadge = getStatusBadgeClass(statusDinamico);

                                        return (
                                            <tr key={seguro.id} className={classeDaLinha}>
                                                <td className="text-left">{seguro.apoliceNumero}</td>
                                                {/* Exibir nome do Equipamento ou Unidade */}
                                                <td className="text-left">
                                                    {seguro.equipamento?.modelo ? 
                                                        `${seguro.equipamento.modelo} (Tag: ${seguro.equipamento.tag})` : 
                                                        (seguro.unidade?.nomeSistema || 'N/A')
                                                    }
                                                </td>
                                                {/* Exibir a unidade associada ao seguro, seja ela a unidade do equipamento ou a unidade diretamente vinculada. */}
                                                <td className="text-left">
                                                    {seguro.unidade?.nomeSistema || seguro.equipamento?.unidade?.nomeSistema || 'N/A'}
                                                </td>
                                                <td className="text-left">{seguro.seguradora}</td>
                                                <td className="text-center">{formatarData(seguro.dataFim)}</td>
                                                {/* Usa o status dinâmico para a exibição da badge */}
                                                <td className="text-center"><span className={classeDaBadge}>{statusDinamico}</span></td>
                                                <td className="actions-cell text-center">
                                                    <button className="btn-action edit" title="Editar" onClick={() => navigate(`/seguros/editar/${seguro.id}`)}><FontAwesomeIcon icon={faEdit} /></button>
                                                    <button className="btn-action delete" title="Excluir" onClick={() => openDeleteModal(seguro)}><FontAwesomeIcon icon={faTrashAlt} /></button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr><td colSpan="7" className="table-message">Nenhum seguro encontrado.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </>
    );
}

export default SegurosPage;