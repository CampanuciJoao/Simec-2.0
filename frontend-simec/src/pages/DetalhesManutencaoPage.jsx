// Ficheiro: src/pages/DetalhesManutencaoPage.jsx
// VERSÃO FINAL CORRIGIDA - DOCUMENTAÇÃO PÓS-CONCLUSÃO HABILITADA

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useManutencaoDetalhes } from '../hooks/useManutencaoDetalhes';
import { useModal } from '../hooks/useModal';
import ModalConfirmacao from '../components/ModalConfirmacao';
import ModalCancelamento from '../components/ModalCancelamento';
import DateInput from '../components/DateInput';
import TimeInput from '../components/TimeInput';
import { formatarDataHora } from '../utils/timeUtils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faArrowLeft, faSpinner, faExclamationTriangle, faPaperclip, faUpload, 
    faPlus, faTrashAlt, faFilePdf, faFileImage, faFileAlt, faHistory, 
    faSave, faTimes, faBan, faCheckCircle, faTimesCircle, faPrint, faScroll 
} from '@fortawesome/free-solid-svg-icons';

const API_BASE_URL_DOWNLOAD = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getIconePorTipoArquivo = (mimeType = '') => { 
    if (mimeType.startsWith('image/')) return <FontAwesomeIcon icon={faFileImage} style={{ marginRight: '8px', fontSize: '1.1em' }} />;
    if (mimeType === 'application/pdf') return <FontAwesomeIcon icon={faFilePdf} style={{ marginRight: '8px', fontSize: '1.1em' }} />;
    return <FontAwesomeIcon icon={faFileAlt} style={{ marginRight: '8px', fontSize: '1.1em' }} />;
};

const getStatusBadgeClassManutencao = (status) => {
    const statusClass = status?.toLowerCase().replace(/ /g, '-') || 'default';
    if (status === 'AguardandoConfirmacao') return 'status-badge status-os-emandamento';
    return `status-badge status-os-${statusClass}`;
};

function DetalhesManutencaoPage() {
  const { manutencaoId } = useParams();
  const navigate = useNavigate();
  const anexoInputRef = useRef(null);

  const {
    manutencao, loading, error, submitting,
    salvarAtualizacoes, adicionarNota, fazerUploadAnexo,
    removerAnexo, concluirOS, refetch: refetchManutencao
  } = useManutencaoDetalhes(manutencaoId);

  const [formData, setFormData] = useState({
    descricaoProblemaServico: '', tecnicoResponsavel: '', dataInicioReal: '',
    horaInicioReal: '', dataFimReal: '', horaFimReal: '',
  });
  const [novaNota, setNovaNota] = useState('');
  
  const { isOpen: isDeleteAnexoModalOpen, modalData: anexoParaDeletar, openModal: openDeleteAnexoModal, closeModal: closeDeleteAnexoModal } = useModal();
  const { isOpen: isCancelModalOpen, openModal: openCancelModal, closeModal: closeCancelModal } = useModal();

  useEffect(() => {
    if (manutencao) {
      const inicioReal = manutencao.dataInicioReal ? new Date(manutencao.dataInicioReal) : null;
      const fimReal = manutencao.dataFimReal ? new Date(manutencao.dataFimReal) : null;
      setFormData({
        descricaoProblemaServico: manutencao.descricaoProblemaServico || '',
        tecnicoResponsavel: manutencao.tecnicoResponsavel || '',
        dataInicioReal: inicioReal ? inicioReal.toISOString().split('T')[0] : '',
        horaInicioReal: inicioReal ? inicioReal.toTimeString().slice(0, 5) : '',
        dataFimReal: fimReal ? fimReal.toISOString().split('T')[0] : '',
        horaFimReal: fimReal ? fimReal.toTimeString().slice(0, 5) : '',
      });
    }
  }, [manutencao]);
  
  const handleFormChange = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); };
  
  const handleAddNota = async () => {
    if (novaNota.trim()) {
      await adicionarNota(novaNota);
      setNovaNota('');
    }
  };
  
  const handleAnexoUpload = (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    const uploadData = new FormData();
    for (let i = 0; i < files.length; i++) uploadData.append('arquivosManutencao', files[i]);
    fazerUploadAnexo(uploadData);
    if (anexoInputRef.current) anexoInputRef.current.value = null;
  };

  const handleSalvarAlteracoes = async () => {
    const dataInicio = formData.dataInicioReal ? new Date(`${formData.dataInicioReal}T${formData.horaInicioReal || '00:00:00'}`) : null;
    const dataFim = formData.dataFimReal ? new Date(`${formData.dataFimReal}T${formData.horaFimReal || '00:00:00'}`) : null;
    
    const payload = {
      descricaoProblemaServico: formData.descricaoProblemaServico,
      tecnicoResponsavel: formData.tecnicoResponsavel,
      dataInicioReal: dataInicio ? dataInicio.toISOString() : null,
      dataFimReal: dataFim ? dataFim.toISOString() : null,
    };
    await salvarAtualizacoes(payload);
  };
  
  const handleConfirmarExclusaoAnexo = async () => {
    if(anexoParaDeletar) {
        await removerAnexo(anexoParaDeletar.id);
        closeDeleteAnexoModal();
    }
  };
  
  const handlePrint = () => {
    document.body.classList.add('print-mode');
    window.print();
    document.body.classList.remove('print-mode');
  };

  if (loading) return <div className="page-content-wrapper centered-loader"><FontAwesomeIcon icon={faSpinner} spin size="2x"/></div>;
  if (error) return <div className="page-content-wrapper"><p className="form-error"><FontAwesomeIcon icon={faExclamationTriangle} /> {error.message}</p></div>;
  if (!manutencao) return <div className="page-content-wrapper"><p>Manutenção não encontrada.</p></div>;

  const camposPrincipaisBloqueados = manutencao.status === 'Cancelada' || manutencao.status === 'Concluida';
  const isCancelavel = manutencao.status === 'Agendada' || manutencao.status === 'EmAndamento';

  return (
    <>
      <ModalConfirmacao isOpen={isDeleteAnexoModalOpen} onClose={closeDeleteAnexoModal} onConfirm={handleConfirmarExclusaoAnexo} title="Confirmar Exclusão" message={`Tem certeza que deseja excluir o anexo "${anexoParaDeletar?.nomeOriginal}"?`} isDestructive={true} />
      <ModalCancelamento isOpen={isCancelModalOpen} onClose={closeCancelModal} manutencao={manutencao} onCancelConfirm={refetchManutencao} />

      <div className="page-content-wrapper">
        <div className="print-header"><h1>Relatório de Manutenção</h1><div className="os-info"><p>OS: {manutencao.numeroOS}</p><p>Data: {new Date().toLocaleDateString('pt-BR')}</p></div></div>
        <div className="page-title-card no-print"><h1 className="page-title-internal">Detalhes da Manutenção: OS {manutencao.numeroOS}</h1><div className="page-title-actions"><button className="btn btn-primary" onClick={handlePrint}><FontAwesomeIcon icon={faPrint}/> Imprimir Relatório</button><button className="btn btn-secondary" onClick={() => navigate('/manutencoes')} style={{marginLeft: '10px'}}><FontAwesomeIcon icon={faArrowLeft}/> Voltar</button></div></div>
        
        {manutencao.status === 'AguardandoConfirmacao' && ( 
            <section className="page-section no-print" style={{ borderColor: '#F59E0B', background: '#fefce8', borderWidth: '2px' }}> 
                <h3 style={{color: '#B45309'}}>Ação Necessária: Confirmar Resultado</h3> 
                <p>O tempo de serviço agendado para esta manutenção terminou. Por favor, confirme o status operacional do equipamento:</p> 
                <div className="form-actions" style={{ justifyContent: 'flex-start', marginTop: '10px', gap: '10px', borderTop: 'none', paddingTop: 0 }}> 
                    <button className="btn btn-success" onClick={() => concluirOS({ equipamentoOperante: true })} disabled={submitting}><FontAwesomeIcon icon={faCheckCircle} /> Equipamento Operante</button>
                    <button className="btn btn-danger" onClick={() => concluirOS({ equipamentoOperante: false })} disabled={submitting}><FontAwesomeIcon icon={faTimesCircle} /> Equipamento Inoperante</button>
                </div> 
            </section> 
        )}
        
        <section className="page-section">
          <h3>Informações Gerais</h3>
          <div className="info-grid">
              <p><strong>Equipamento:</strong> <Link to={`/equipamentos/detalhes/${manutencao.equipamento?.id}`}>{manutencao.equipamento?.modelo}</Link></p>
              <p><strong>Tipo:</strong> {manutencao.tipo}</p>
              <p><strong>Status:</strong> <span className={getStatusBadgeClassManutencao(manutencao.status)}>{manutencao.status}</span></p>
              <p><strong>Agendamento:</strong> {formatarDataHora(manutencao.dataHoraAgendamentoInicio)}</p>
          </div>
          <div className="form-group" style={{ marginTop: '20px' }}><label>Descrição do Problema / Serviço:</label><textarea name="descricaoProblemaServico" value={formData.descricaoProblemaServico} onChange={handleFormChange} rows="3" disabled={camposPrincipaisBloqueados}></textarea></div>
          
          <div className="info-grid" style={{ marginTop: '15px', alignItems: 'flex-end' }}>
              <div className="form-group"><label>Técnico Responsável</label><input type="text" name="tecnicoResponsavel" value={formData.tecnicoResponsavel} onChange={handleFormChange} disabled={camposPrincipaisBloqueados} /></div>
              <div style={{display: 'flex', gap: '15px'}}><div className="form-group" style={{flex: 1}}><label>Data Início Real</label><DateInput name="dataInicioReal" value={formData.dataInicioReal} onChange={handleFormChange} disabled={camposPrincipaisBloqueados} /></div><div className="form-group" style={{flex: 1}}><label>Hora Início Real</label><TimeInput name="horaInicioReal" value={formData.horaInicioReal} onChange={handleFormChange} disabled={camposPrincipaisBloqueados} /></div></div>
              <div style={{display: 'flex', gap: '15px'}}><div className="form-group" style={{flex: 1}}><label>Data Fim Real</label><DateInput name="dataFimReal" value={formData.dataFimReal} onChange={handleFormChange} disabled={camposPrincipaisBloqueados} /></div><div className="form-group" style={{flex: 1}}><label>Hora Fim Real</label><TimeInput name="horaFimReal" value={formData.horaFimReal} onChange={handleFormChange} disabled={camposPrincipaisBloqueados} /></div></div>
          </div>

          <div className="form-actions no-print" style={{ justifyContent: 'flex-start', marginTop: '20px', gap: '10px' }}>
            <button className="btn btn-primary" onClick={handleSalvarAlteracoes} disabled={submitting || camposPrincipaisBloqueados}><FontAwesomeIcon icon={faSave} /> Salvar Alterações</button>
            {isCancelavel && <button className="btn btn-danger" onClick={() => openCancelModal(manutencao)} disabled={submitting}><FontAwesomeIcon icon={faBan} /> Cancelar Manutenção</button>}
          </div>
        </section>

        {/* ==================================================================== */}
        {/* >> CORREÇÃO PRINCIPAL APLICADA AQUI << */}
        {/* As seções de Histórico e Anexos agora não são mais afetadas */}
        {/* pelo status da manutenção. Elas estão sempre disponíveis. */}
        {/* ==================================================================== */}
        <section className="page-section">
          <div className="section-header">
              <h3><FontAwesomeIcon icon={faHistory} /> Histórico do Chamado</h3>
              <Link to="/gerenciamento/auditoria" state={{ filtroEntidade: 'Manutenção', filtroEntidadeId: manutencao.id }} className="btn btn-secondary btn-sm">
                  <FontAwesomeIcon icon={faScroll} /> Ver Auditoria Completa
              </Link>
          </div>
          {(manutencao.notasAndamento?.length > 0) ? ( <ul className="list-group" style={{marginBottom: '20px'}}>{manutencao.notasAndamento.map((nota) => ( <li key={nota.id} className="list-group-item" style={{display: 'block'}}><strong style={{color: 'var(--cor-texto-principal-light)'}}>{formatarDataHora(nota.data)} - {nota.autor?.nome || 'Sistema'}:</strong><span style={{marginLeft: '8px', color: 'var(--cor-texto-secundario-light)'}}>{nota.nota}</span></li> ))}</ul> ) : <p className="no-data-message" style={{marginBottom: '20px'}}>Nenhuma nota de andamento.</p> } 
          
          <div className="form-group"><label htmlFor="nova-nota">Adicionar Nova Nota de Andamento</label><textarea id="nova-nota" rows="3" value={novaNota} onChange={(e) => setNovaNota(e.target.value)} disabled={submitting}></textarea></div>
          <button className="btn btn-primary btn-sm" onClick={handleAddNota} disabled={submitting || !novaNota.trim()} style={{marginTop: '10px'}}><FontAwesomeIcon icon={faPlus} /> Adicionar Nota</button>
        </section>
        
        <section className="page-section">
          <div className="section-header no-print">
            <h3><FontAwesomeIcon icon={faPaperclip} /> Anexos ({manutencao.anexos?.length || 0})</h3>
            <button onClick={() => anexoInputRef.current.click()} className="btn btn-sm btn-success" disabled={submitting}><FontAwesomeIcon icon={faUpload} /> Adicionar</button>
          </div>
          <input type="file" multiple ref={anexoInputRef} onChange={handleAnexoUpload} style={{ display: 'none' }} disabled={submitting} />
          {(manutencao.anexos?.length > 0) ? ( <ul className="list-group" style={{marginTop: '15px'}}>{manutencao.anexos.map(anexo => ( <li key={anexo.id} className="list-group-item"><a href={`${API_BASE_URL_DOWNLOAD}/${anexo.path}`} target="_blank" rel="noopener noreferrer" title={`Abrir ${anexo.nomeOriginal}`}>{getIconePorTipoArquivo(anexo.tipoMime)} {anexo.nomeOriginal}</a><button onClick={() => openDeleteAnexoModal(anexo)} className="btn-action delete no-print" title="Excluir" disabled={submitting}><FontAwesomeIcon icon={faTrashAlt} /></button></li> ))}</ul> ) : <p className="no-data-message" style={{marginTop: '15px'}}>Nenhum anexo encontrado.</p> }
        </section>
      </div>
    </>
  );
}

export default DetalhesManutencaoPage;