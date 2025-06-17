// Ficheiro: frontend-simec/src/pages/SalvarEquipamentoPage.jsx
// VERSÃO ATUALIZADA - VOLTAR PARA A NOVA PÁGINA PRINCIPAL DE EQUIPAMENTOS

// --- Core & Routing Dependencies ---
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// --- Custom Hooks, Context & API Services ---
import { useToast } from '../contexts/ToastContext';
import { getEquipamentoById, addEquipamento, updateEquipamento } from '../services/api';

// --- UI Components & Assets ---
import EquipamentoForm from '../components/EquipamentoForm';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

/**
 * @component SalvarEquipamentoPage
 * @description Componente "inteligente" que orquestra a criação e edição de Equipamentos.
 */
function SalvarEquipamentoPage() {
  const { equipamentoId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const isEditing = !!equipamentoId;

  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(isEditing);
  const [error, setError] = useState('');

  const fetchEquipamento = useCallback(() => {
    if (isEditing && equipamentoId) {
      setLoading(true);
      getEquipamentoById(equipamentoId)
        .then(data => {
          setInitialData(data);
        })
        .catch(err => {
          const errorMessage = err.message || 'Erro ao carregar dados do equipamento.';
          setError(errorMessage);
          addToast(errorMessage, 'error');
        })
        .finally(() => setLoading(false));
    }
  }, [equipamentoId, isEditing, addToast]);

  useEffect(() => {
    fetchEquipamento();
  }, [fetchEquipamento]);

  /**
   * @function handleSave
   * @description Recebe os dados do formulário e os submete para a API.
   * @param {object} formData - O objeto de estado vindo do EquipamentoForm.
   */
  const handleSave = async (formData) => {
    try {
      console.log("PAYLOAD ENVIADO PARA A API:", formData);

      if (isEditing) {
        await updateEquipamento(equipamentoId, formData);
        addToast('Equipamento atualizado com sucesso!', 'success');
      } else {
        await addEquipamento(formData);
        addToast('Equipamento adicionado com sucesso!', 'success');
      }
      // ATUALIZADO: Navega para a nova página principal de equipamentos
      setTimeout(() => navigate('/equipamentos'), 1000); 
    } catch (apiError) {
      console.error("Falha ao salvar equipamento:", apiError);
      const errorMessage = apiError.response?.data?.message || apiError.message || 'Erro desconhecido ao salvar.';
      addToast(errorMessage, 'error');
      throw apiError;
    }
  };

  // --- Lógica de Renderização ---
  if (loading) {
    return <div className="page-content-wrapper"><div style={{textAlign: 'center', padding: '50px'}}><FontAwesomeIcon icon={faSpinner} spin size="2x"/> Carregando...</div></div>;
  }
  
  if (error) {
    return <div className="page-content-wrapper"><p className="form-error">{error}</p></div>;
  }

  if (isEditing && !initialData) {
    return <div className="page-content-wrapper"><p className="form-error">Equipamento não encontrado.</p></div>;
  }

  return (
    <div className="page-content-wrapper">
      <div className="page-title-card">
        <h1 className="page-title-internal">
          {isEditing ? `Editar Equipamento (Tag: ${initialData?.tag})` : 'Adicionar Novo Equipamento'}
        </h1>
        {/* ATUALIZADO: Botão "Voltar" agora leva para a nova rota principal de equipamentos */}
        <button className="btn btn-secondary" onClick={() => navigate('/equipamentos')}>
          <FontAwesomeIcon icon={faArrowLeft} /> Voltar
        </button>
      </div>
      <section className="page-section">
        <EquipamentoForm
          onSubmit={handleSave}
          initialData={initialData}
          isEditing={isEditing}
        />
      </section>
    </div>
  );
}

export default SalvarEquipamentoPage;
