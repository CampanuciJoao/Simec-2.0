// Ficheiro: src/pages/ContratosPage.jsx
// Versão: 2.1 (Sênior - Refatorado com Lógica de Status Dinâmico e Alinhamento)
// Descrição: Página de gerenciamento de contratos, com UI inteligente para status e destaques.

import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContratos } from '../hooks/useContratos';
import { useModal } from '../hooks/useModal';
import { useToast } from '../contexts/ToastContext';
import { formatarData } from '../utils/timeUtils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrashAlt, faSpinner, faExclamationTriangle, faSort, faSortUp, faSortDown } from '@fortawesome/free-solid-svg-icons';
import GlobalFilterBar from '../components/GlobalFilterBar';
import ModalConfirmacao from '../components/ModalConfirmacao';

// ==========================================================================
// --- MÓDULO DE FUNÇÕES AUXILIARES DE UI ---
// Isolamos a lógica de apresentação em funções puras para clareza e reutilização.
// ==========================================================================

/**
 * Determina o TEXTO do status a ser exibido, com base no status e data de vencimento do contrato.
 * @param {object} contrato - O objeto completo do contrato.
 * @returns {string} O texto do status dinâmico ('Ativo', 'Vence em breve', 'Expirado', etc.).
 */
const getDynamicStatus = (contrato) => {
  // Se o contrato não estiver 'Ativo', seu status já é definitivo (Expirado, Cancelado).
  if (contrato.status !== 'Ativo') {
    return contrato.status;
  }
  
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0); // Zera a hora para uma comparação de data precisa.
  const dataFim = new Date(contrato.dataFim);

  if (dataFim < hoje) {
    return 'Expirado';
  }

  const diffTime = dataFim.getTime() - hoje.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 30) {
    return 'Vence em breve';
  }

  return 'Ativo';
};

/**
 * Retorna a classe CSS correta para a BADGE de status.
 * @param {string} statusText - O texto do status dinâmico retornado por getDynamicStatus.
 * @returns {string} A string de classes CSS para a badge.
 */
const getStatusBadgeClass = (statusText) => {
  const statusMap = {
    'ativo': 'status-ativo',
    'expirado': 'status-inativo',
    'cancelado': 'status-cancelado',
    'vence em breve': 'status-vence-em-breve' // Nossa nova classe de status.
  };
  const statusClass = statusMap[statusText?.toLowerCase()] || 'default';
  return `status-badge ${statusClass}`;
};

/**
 * Retorna a classe CSS para o DESTAQUE DA LINHA da tabela (<tr>).
 * Implementa a regra de negócio de cores baseada na proximidade do vencimento.
 */
const getRowHighlightClass = (contrato) => {
    // Se o contrato não estiver 'Ativo', não aplicamos cor de destaque de vigência.
    if (contrato.status !== 'Ativo') {
        return ''; 
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0); 
    const dataFim = new Date(contrato.dataFim);
    const diffTime = dataFim.getTime() - hoje.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Regra VERMELHA: Contrato "prestes a vencer" (7 dias ou menos) ou já expirado.
    if (diffDays <= 7) {
        return 'status-row-vencendo-danger';
    }
    // Regra AMARELA: Contrato com "vencimento em breve" (entre 8 e 30 dias).
    if (diffDays <= 30) {
        return 'status-row-vencendo-warning';
    }
    // Regra VERDE: Contrato está "OK" (ativo e com mais de 30 dias para vencer).
    return 'status-row-ativo';
};


/**
 * @component ContratosPage
 * @description Componente "inteligente" que orquestra os hooks e a renderização da página de Contratos.
 */
function ContratosPage() {
    const navigate = useNavigate();
    const { addToast } = useToast();

    // Desestruturação do hook de contratos, que gerencia toda a lógica de dados.
    const {
        contratos, unidadesDisponiveis, loading, error, searchTerm, setSearchTerm,
        filtros, setFiltros, sortConfig, setSortConfig, removerContrato, contratosOriginais
    } = useContratos();

    const { isOpen: isDeleteModalOpen, modalData: contratoParaDeletar, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();

    // Função para solicitar a ordenação de uma coluna.
    const requestSort = (key) => setSortConfig(current => ({ key, direction: current.key === key && current.direction === 'ascending' ? 'descending' : 'ascending' }));
    
    // Função para confirmar a exclusão, chamada pelo modal.
    const confirmarExclusao = async () => {
        if (!contratoParaDeletar) return;
        try {
            await removerContrato(contratoParaDeletar.id);
            addToast('Contrato excluído com sucesso!', 'success');
        } catch(err) {
            addToast(err.message || 'Erro ao excluir contrato.', 'error');
        } finally {
            closeDeleteModal();
        }
    };
    
    // Memoizamos as opções dos filtros para evitar recálculos desnecessários a cada renderização.
    const categoriasUnicas = useMemo(() => [...new Set((contratosOriginais || []).map(c => c.categoria).filter(Boolean))].sort(), [contratosOriginais]);
    const statusUnicos = useMemo(() => [...new Set((contratosOriginais || []).map(c => c.status).filter(Boolean))].sort(), [contratosOriginais]);
    const unidadesOptions = useMemo(() => (unidadesDisponiveis || []).map(u => ({ value: u.nomeSistema, label: u.nomeSistema })), [unidadesDisponiveis]);

    // Configuração declarativa para a barra de filtros global.
    const selectFiltersConfig = [
        { id: 'categoria', value: filtros.categoria, onChange: (v) => setFiltros(f => ({ ...f, categoria: v })), options: categoriasUnicas.map(c => ({ value: c, label: c })), defaultLabel: 'Todas as Categorias' },
        { id: 'unidade', value: filtros.unidade, onChange: (v) => setFiltros(f => ({ ...f, unidade: v })), options: unidadesOptions, defaultLabel: 'Todas as Unidades' },
        { id: 'status', value: filtros.status, onChange: (v) => setFiltros(f => ({ ...f, status: v })), options: statusUnicos.map(s => ({ value: s, label: s })), defaultLabel: 'Todos os Status' },
    ];

    return (
        <>
            <ModalConfirmacao isOpen={isDeleteModalOpen} onClose={closeDeleteModal} onConfirm={confirmarExclusao} title="Confirmar Exclusão" message={`Tem certeza que deseja excluir o contrato nº ${contratoParaDeletar?.numeroContrato}?`} isDestructive={true} />
            
            <div className="page-content-wrapper">
                <div className="page-title-card"><h1 className="page-title-internal">Gerenciamento de Contratos</h1></div>
                <section className="page-section table-section">
                    <div className="table-header-actions">
                        <span>{loading ? <><FontAwesomeIcon icon={faSpinner} spin /> Carregando...</> : `${contratos.length} contrato(s) encontrado(s)`}</span>
                        <button className="btn btn-primary" onClick={() => navigate('/contratos/adicionar')}><FontAwesomeIcon icon={faPlus} /> Adicionar Contrato</button>
                    </div>
                    <GlobalFilterBar searchTerm={searchTerm} onSearchChange={(e) => setSearchTerm(e.target.value)} searchPlaceholder="Buscar por número, fornecedor..." selectFilters={selectFiltersConfig} />
                    {error && <p className="form-error"><FontAwesomeIcon icon={faExclamationTriangle} /> {error.message}</p>}
                    <div className="table-responsive-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    {/* CORREÇÃO DE ALINHAMENTO: Aplicando classes de alinhamento no cabeçalho. */}
                                    <th className="text-left" onClick={() => requestSort('numeroContrato')}>Número <FontAwesomeIcon icon={sortConfig.key === 'numeroContrato' ? (sortConfig.direction === 'ascending' ? faSortUp : faSortDown) : faSort}/></th>
                                    <th className="text-center" onClick={() => requestSort('categoria')}>Categoria <FontAwesomeIcon icon={sortConfig.key === 'categoria' ? (sortConfig.direction === 'ascending' ? faSortUp : faSortDown) : faSort}/></th>
                                    <th className="text-left" onClick={() => requestSort('fornecedor')}>Fornecedor <FontAwesomeIcon icon={sortConfig.key === 'fornecedor' ? (sortConfig.direction === 'ascending' ? faSortUp : faSortDown) : faSort}/></th>
                                    <th className="text-left">Unidades Cobertas</th>
                                    <th className="text-center" onClick={() => requestSort('dataFim')}>Fim da Vigência <FontAwesomeIcon icon={sortConfig.key === 'dataFim' ? (sortConfig.direction === 'ascending' ? faSortUp : faSortDown) : faSort}/></th>
                                    <th className="text-center">Status</th>
                                    <th className="text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && contratos.length === 0 ? (
                                    <tr><td colSpan="7" className="text-center"><FontAwesomeIcon icon={faSpinner} spin /> Carregando...</td></tr>
                                ) : contratos.length > 0 ? (
                                    contratos.map(contrato => {
                                        // Chamamos as funções no início do map para manter o JSX limpo.
                                        const statusDinamico = getDynamicStatus(contrato);
                                        const classeDaLinha = getRowHighlightClass(contrato); // Utiliza a função corrigida
                                        const classeDaBadge = getStatusBadgeClass(statusDinamico);

                                        return (
                                            <tr key={contrato.id} className={classeDaLinha}>
                                                {/* CORREÇÃO DE ALINHAMENTO E LÓGICA: Aplicando classes e funções auxiliares. */}
                                                <td className="text-center">{contrato.numeroContrato}</td>
                                                <td className="text-center">{contrato.categoria}</td>
                                                <td className="text-center">{contrato.fornecedor}</td>
                                                <td className="text-center">
                                                    {contrato.unidadesCobertas?.map(u => u.nomeSistema).join(', ') || 'N/A'}
                                                </td>
                                                <td className="text-center">{formatarData(contrato.dataFim)}</td>
                                                <td className="text-center">
                                                    <span className={classeDaBadge}>{statusDinamico}</span>
                                                </td>
                                                <td className="actions-cell text-center">
                                                    <button className="btn-action edit" title="Editar" onClick={() => navigate(`/contratos/editar/${contrato.id}`)}><FontAwesomeIcon icon={faEdit} /></button>
                                                    <button className="btn-action delete" title="Excluir" onClick={() => openDeleteModal(contrato)}><FontAwesomeIcon icon={faTrashAlt} /></button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr><td colSpan="7" className="text-center">Nenhum contrato encontrado.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </>
    );
}

export default ContratosPage;