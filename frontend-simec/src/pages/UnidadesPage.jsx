// Ficheiro: frontend-simec/src/pages/UnidadesPage.jsx
// VERSÃO FINAL, COMPLETA E CORRIGIDA

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrashAlt, faSpinner, faBuilding, faInfoCircle, faMapMarkedAlt, faHashtag } from '@fortawesome/free-solid-svg-icons';
import { useUnidades } from '../hooks/useUnidades';
import { useModal } from '../hooks/useModal';
import ModalConfirmacao from '../components/ModalConfirmacao';
import { useToast } from '../contexts/ToastContext';

// >> CORREÇÃO PRINCIPAL APLICADA AQUI <<
// A função agora recebe o objeto 'unidade' inteiro e acessa suas propriedades diretamente.
const formatarEndereco = (unidade) => {
  if (!unidade || !unidade.logradouro) return 'Endereço não cadastrado';
  const parts = [
    `${unidade.logradouro}, ${unidade.numero || 'S/N'}`,
    unidade.complemento,
    unidade.bairro,
    `${unidade.cidade || ''} - ${unidade.estado || ''}`,
    unidade.cep,
  ];
  return parts.filter(Boolean).join(', ');
};

function UnidadesPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { unidades, loading, searchTerm, setSearchTerm, removerUnidade } = useUnidades();
  const { isOpen, modalData, openModal, closeModal } = useModal();

  const confirmarExclusao = async () => {
    if (!modalData) return;
    try {
      await removerUnidade(modalData.id);
      addToast('Unidade excluída com sucesso!', 'success');
    } catch(err) {
      addToast(err.message || 'Erro ao excluir unidade.', 'error');
    } finally {
      closeModal();
    }
  };

  return (
    <>
      <ModalConfirmacao isOpen={isOpen} onClose={closeModal} onConfirm={confirmarExclusao} title="Confirmar Exclusão" message={`Tem certeza que deseja excluir a unidade "${modalData?.nomeSistema}"?`} isDestructive={true} />
      <section className="page-section table-section">
        <div className="table-header-actions">
          <input type="text" placeholder="Buscar por nome, fantasia ou CNPJ..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="search-input-table" />
          <button className="btn btn-primary" onClick={() => navigate('/cadastros/unidades/adicionar')}><FontAwesomeIcon icon={faPlus} /> Adicionar Unidade</button>
        </div>
        {loading && <p style={{ textAlign: 'center', margin: '30px' }}><FontAwesomeIcon icon={faSpinner} spin size="2x" /> Carregando unidades...</p>}
        {!loading && unidades.length > 0 && (
          <div className="unidades-grid">
            {unidades.map(unidade => (
              <div key={unidade.id} className="unidade-card">
                <div className="unidade-card-header">
                  <h4>{unidade.nomeSistema}</h4>
                  <div className="unidade-card-actions">
                    <button className="btn-action edit" title="Editar" onClick={() => navigate(`/cadastros/unidades/editar/${unidade.id}`)}><FontAwesomeIcon icon={faEdit} /></button>
                    <button className="btn-action delete" title="Excluir" onClick={() => openModal(unidade)}><FontAwesomeIcon icon={faTrashAlt} /></button>
                  </div>
                </div>
                <div className="unidade-card-body">
                  <div className="unidade-info-item"><FontAwesomeIcon icon={faInfoCircle} /><div><strong>Nome Fantasia</strong>{unidade.nomeFantasia}</div></div>
                  {unidade.cnpj && (<div className="unidade-info-item"><FontAwesomeIcon icon={faHashtag} /><div><strong>CNPJ</strong>{unidade.cnpj}</div></div>)}
                  <div className="unidade-info-item"><FontAwesomeIcon icon={faMapMarkedAlt} /><div><strong>Endereço</strong>{formatarEndereco(unidade)}</div></div>
                </div>
              </div>
            ))}
          </div>
        )}
        {!loading && unidades.length === 0 && <div className="no-data-message" style={{textAlign: 'center', padding: '40px'}}><p>Nenhuma unidade encontrada.</p></div>}
      </section>
    </>
  );
}

export default UnidadesPage;