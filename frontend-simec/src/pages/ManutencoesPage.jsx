// Ficheiro: src/pages/ManutencoesPage.jsx
// VERSÃO FINAL CORRIGIDA - COM APLICAÇÃO DE FILTRO INICIAL

import React, { useMemo, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { formatarData } from '../utils/timeUtils'; 
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faPlus, faEye, faPenToSquare, faSpinner, faExclamationTriangle, 
    faTrashAlt, faBan 
} from '@fortawesome/free-solid-svg-icons';
import { useManutencoes } from '../hooks/useManutencoes';
import { useAuth } from '../contexts/AuthContext';
import { useModal } from '../hooks/useModal';
import { useToast } from '../contexts/ToastContext';
import { deleteManutencao } from '../services/api';
import GlobalFilterBar from '../components/GlobalFilterBar';
import ModalConfirmacao from '../components/ModalConfirmacao';
import ModalCancelamento from '../components/ModalCancelamento';

// --- Funções Auxiliares de Estilo e Formatação (sem alterações) ---
const getStatusBadgeClass = (status) => {
    const statusClass = status?.toLowerCase().replace(/ /g, '-') || 'default';
    if (status === 'AguardandoConfirmacao') return 'status-badge status-os-emandamento';
    return `status-badge status-os-${statusClass}`;
};

const getRowHighlightClass = (status) => {
    const statusClass = status?.replace(/ /g, '').toLowerCase() || 'default';
    const highlightable = {
        agendada: 'status-row-os-agendada',
        emandamento: 'status-row-os-emandamento',
        cancelada: 'status-row-os-cancelada',
        concluida: 'status-row-os-concluida',
    };
    return highlightable[statusClass] || '';
};

const formatarIntervaloHorario = (dataInicioISO, dataFimISO) => {
    if (!dataInicioISO) return '-';
    try {
        const options = { hour: '2-digit', minute: '2-digit' };
        const inicio = new Date(dataInicioISO).toLocaleTimeString('pt-BR', options);
        if (!dataFimISO) return inicio;
        const fim = new Date(dataFimISO).toLocaleTimeString('pt-BR', options);
        return `${inicio} - ${fim}`;
    } catch (e) {
        console.error("Erro ao formatar intervalo de horário:", e);
        return "Inválido";
    }
};

/**
 * Componente de página para listar, filtrar e gerenciar todas as manutenções.
 */
function ManutencoesPage() {
    const { addToast } = useToast();
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const {
        manutencoes, equipamentos, unidadesDisponiveis,
        loading, error, searchTerm, setSearchTerm,
        filtros, setFiltros, sortConfig, setSortConfig, refetch
    } = useManutencoes();

    // ==========================================================================
    // >> CORREÇÃO PRINCIPAL APLICADA AQUI <<
    // Este useEffect verifica o estado da localização na montagem do componente.
    // ==========================================================================
    useEffect(() => {
        if (location.state?.filtroTipoInicial) {
            setFiltros(prevFiltros => ({ ...prevFiltros, tipo: location.state.filtroTipoInicial }));
            // Limpa o estado para que o filtro não seja reaplicado se o usuário navegar
            // de volta para esta página.
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state, setFiltros, navigate, location.pathname]);
    
    useEffect(() => {
        if (location.state?.refresh) {
            refetch();
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location, navigate, refetch]);

    useEffect(() => {
        const intervalId = setInterval(() => {
            refetch();
        }, 30 * 1000);
        return () => clearInterval(intervalId);
    }, [refetch]);

    const { isOpen: isDeleteModalOpen, modalData: manutencaoParaDeletar, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();
    const { isOpen: isCancelModalOpen, modalData: manutencaoParaCancelar, openModal: openCancelModal, closeModal: closeCancelModal } = useModal();
    
    const handleConfirmarExclusao = async () => {
        if (!manutencaoParaDeletar) return;
        try {
            await deleteManutencao(manutencaoParaDeletar.id);
            addToast('Manutenção excluída com sucesso!', 'success');
            refetch();
        } catch (err) {
            addToast(err.response?.data?.message || 'Erro ao excluir manutenção.', 'error');
        } finally {
            closeDeleteModal();
        }
    };

    const handleConfirmarCancelamento = () => {
        closeCancelModal();
        refetch();
    };
    
    const equipamentosOptions = useMemo(() => equipamentos.map(eq => ({ value: eq.id, label: `${eq.modelo} (Tag: ${eq.tag})` })), [equipamentos]);
    const unidadesOptions = useMemo(() => (unidadesDisponiveis || []).map(u => ({ value: u.id, label: u.nomeSistema })), [unidadesDisponiveis]);
    const tiposManutencaoOptions = useMemo(() => ["Preventiva", "Corretiva", "Calibracao", "Inspecao"].map(t => ({ value: t, label: t })), []);
    const statusManutencaoOptions = useMemo(() => ["Agendada", "EmAndamento", "Concluida", "Cancelada", "Pendente", "AguardandoConfirmacao"].map(s => ({ value: s, label: s.replace(/([A-Z])/g, ' $1').trim() })), []);

    const selectFiltersConfig = [
        { id: 'equipamentoId', value: filtros.equipamentoId, onChange: (v) => setFiltros(f => ({...f, equipamentoId: v})), options: equipamentosOptions, defaultLabel: 'Todos Equipamentos' },
        { id: 'unidadeId', value: filtros.unidadeId, onChange: (v) => setFiltros(f => ({...f, unidadeId: v})), options: unidadesOptions, defaultLabel: 'Todas Unidades' },
        { id: 'tipo', value: filtros.tipo, onChange: (v) => setFiltros(f => ({...f, tipo: v})), options: tiposManutencaoOptions, defaultLabel: 'Todos Tipos' },
        { id: 'status', value: filtros.status, onChange: (v) => setFiltros(f => ({...f, status: v})), options: statusManutencaoOptions, defaultLabel: 'Todos Status' }
    ];

    return (
        <>
            <ModalConfirmacao isOpen={isDeleteModalOpen} onClose={closeDeleteModal} onConfirm={handleConfirmarExclusao} title="Confirmar Exclusão" message={`Tem certeza que deseja APAGAR permanentemente a OS nº ${manutencaoParaDeletar?.numeroOS}?`} isDestructive={true} />
            <ModalCancelamento manutencao={manutencaoParaCancelar} isOpen={isCancelModalOpen} onClose={closeCancelModal} onCancelConfirm={handleConfirmarCancelamento} />

            <div className="page-content-wrapper">
                <div className="page-title-card"><h1 className="page-title-internal">Gerenciamento de Manutenções</h1></div>
                
                <div className="data-table-container">
                    <div className="table-header-actions">
                        <span className="item-count">{loading ? <><FontAwesomeIcon icon={faSpinner} spin /> Atualizando...</> : `${manutencoes.length} manutenção(ões) encontrada(s)`}</span>
                        <button className="btn btn-primary" onClick={() => navigate('/manutencoes/agendar')} style={{ gap: '8px' }}>
                            <FontAwesomeIcon icon={faPlus} /> Agendar Manutenção
                        </button>
                    </div>

                    <div className="filters-container">
                        <GlobalFilterBar searchTerm={searchTerm} onSearchChange={(e) => setSearchTerm(e.target.value)} searchPlaceholder="Buscar por OS, equipamento..." selectFilters={selectFiltersConfig} />
                    </div>
                    
                    {error && <p className="form-error"><FontAwesomeIcon icon={faExclamationTriangle} /> Erro: {error.message}</p>}
                    
                    <div className="table-responsive-wrapper">
                        <table className="data-table manutencoes-table">
                            <thead>
                                <tr>
                                    <th className="col-text-center">Nº OS</th>
                                    <th className="col-text-left">Equipamento</th>
                                    <th className="col-text-center">Nº Série (Tag)</th>
                                    <th className="col-text-center">Nº Chamado</th>
                                    <th className="col-text-center">Data Criação</th>
                                    <th className="col-text-center">Data Agendada</th>
                                    <th className="col-text-center">Horário Agendado</th>
                                    <th className="col-text-center">Tipo</th>
                                    <th className="col-text-left">Unidade</th>
                                    <th className="col-text-center">Status</th>
                                    <th className="col-text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="11" className="table-message"><FontAwesomeIcon icon={faSpinner} spin /> Carregando...</td></tr>
                                ) : manutencoes.length > 0 ? (
                                    manutencoes.map(manutencao => (
                                        <tr key={manutencao.id} className={getRowHighlightClass(manutencao.status)}>
                                            <td className="col-text-center">{manutencao.numeroOS}</td>
                                            <td className="col-text-left">{manutencao.equipamento?.modelo || 'N/A'}</td>
                                            <td className="col-text-center">{manutencao.equipamento?.tag || 'N/A'}</td>
                                            <td className="col-text-center">{manutencao.tipo === 'Corretiva' ? manutencao.numeroChamado || '-' : '-'}</td>
                                            <td className="col-text-center">{formatarData(manutencao.createdAt)}</td>
                                            <td className="col-text-center">{formatarData(manutencao.dataHoraAgendamentoInicio)}</td>
                                            <td className="col-text-center">{formatarIntervaloHorario(manutencao.dataHoraAgendamentoInicio, manutencao.dataHoraAgendamentoFim)}</td>
                                            <td className="col-text-center">{manutencao.tipo}</td>
                                            <td className="col-text-left">{manutencao.equipamento?.unidade?.nomeSistema || 'N/A'}</td>
                                            <td className="col-text-center"><span className={getStatusBadgeClass(manutencao.status)}>{manutencao.status}</span></td>
                                            <td className="actions-cell col-text-center">
                                                <Link to={`/manutencoes/detalhes/${manutencao.id}`} className="btn-action view" title="Ver Detalhes"><FontAwesomeIcon icon={faEye} /></Link>
                                                {manutencao.status === 'Agendada' && (
                                                    <Link to={`/manutencoes/editar/${manutencao.id}`} className="btn-action edit" title="Editar Agendamento"><FontAwesomeIcon icon={faPenToSquare} /></Link>
                                                )}
                                                {(manutencao.status === 'Agendada' || manutencao.status === 'EmAndamento') && (
                                                    <button onClick={() => openCancelModal(manutencao)} className="btn-action" title="Cancelar Manutenção" style={{color: '#f59e0b'}}><FontAwesomeIcon icon={faBan} /></button>
                                                )}
                                                {user?.role === 'admin' && (
                                                    <button onClick={() => openDeleteModal(manutencao)} className="btn-action delete" title="Apagar Manutenção (Admin)">
                                                        <FontAwesomeIcon icon={faTrashAlt} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="11" className="table-message">Nenhuma manutenção encontrada.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
}

export default ManutencoesPage;