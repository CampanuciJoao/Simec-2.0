// Ficheiro: src/components/SeguroForm.jsx
// VERSÃO ATUALIZADA - COMPONENTE DE UI PURO COM LÓGICA DE VINCULO (UNIDADE/EQUIPAMENTO) E FILTRO EM CASCATA

import React, { useState, useEffect, useMemo } from 'react';
import DateInput from './DateInput';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faSave } from '@fortawesome/free-solid-svg-icons';

// Definimos os tipos de vínculo disponíveis para o seguro
const TIPOS_VINCULO = {
    GERAL: 'geral',
    EQUIPAMENTO: 'equipamento',
    UNIDADE: 'unidade',
};

const ESTADO_INICIAL_VAZIO = {
    apoliceNumero: '',
    seguradora: '',
    dataInicio: '',
    dataFim: '',
    tipoVinculo: TIPOS_VINCULO.GERAL, // Novo campo para controlar o tipo de vínculo
    equipamentoId: '',
    unidadeId: '',
    cobertura: ''
};

function SeguroForm({ 
    onSubmit, 
    initialData = null, 
    isEditing = false, 
    equipamentosDisponiveis = [], // Agora recebe TODOS os equipamentos
    unidadesDisponiveis = []      // Agora recebe TODAS as unidades
}) {
    const [formData, setFormData] = useState(ESTADO_INICIAL_VAZIO);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isEditing && initialData) {
            // Determina o tipo de vínculo ao carregar dados existentes
            let tipoVinculoInicial = TIPOS_VINCULO.GERAL;
            if (initialData.equipamentoId) {
                tipoVinculoInicial = TIPOS_VINCULO.EQUIPAMENTO;
            } else if (initialData.unidadeId) {
                tipoVinculoInicial = TIPOS_VINCULO.UNIDADE;
            }

            setFormData({
                apoliceNumero: initialData.apoliceNumero || '',
                seguradora: initialData.seguradora || '',
                dataInicio: initialData.dataInicio ? initialData.dataInicio.split('T')[0] : '',
                dataFim: initialData.dataFim ? initialData.dataFim.split('T')[0] : '',
                tipoVinculo: tipoVinculoInicial, // Define o tipo de vínculo
                equipamentoId: initialData.equipamentoId || '',
                unidadeId: initialData.unidadeId || '',
                cobertura: initialData.cobertura || '',
            });
        } else {
            setFormData(ESTADO_INICIAL_VAZIO);
        }
    }, [isEditing, initialData]);
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // NOVO: Lógica para lidar com a mudança do tipo de vínculo
    const handleTipoVinculoChange = (e) => {
        const novoTipo = e.target.value;
        setFormData(prev => ({
            ...prev,
            tipoVinculo: novoTipo,
            equipamentoId: '', // Zera o equipamentoId se o tipo de vínculo mudar
            unidadeId: '',     // Zera o unidadeId se o tipo de vínculo mudar
        }));
    };

    // NOVO: Filtrar equipamentos com base na unidade selecionada
    const equipamentosFiltradosPorUnidade = useMemo(() => {
        if (formData.tipoVinculo === TIPOS_VINCULO.EQUIPAMENTO && formData.unidadeId) {
            // Filtra os equipamentos que pertencem à unidade selecionada
            return equipamentosDisponiveis.filter(eq => eq.unidadeId === formData.unidadeId);
        }
        return [];
    }, [formData.tipoVinculo, formData.unidadeId, equipamentosDisponiveis]);


    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!formData.apoliceNumero || !formData.seguradora || !formData.dataInicio || !formData.dataFim) {
            setError('Todos os campos com * são obrigatórios.');
            return;
        }

        // Validação adicional para o vínculo
        if (formData.tipoVinculo === TIPOS_VINCULO.EQUIPAMENTO && !formData.equipamentoId) {
            setError('Por favor, selecione um equipamento ou mude o tipo de vínculo.');
            return;
        }
        if (formData.tipoVinculo === TIPOS_VINCULO.UNIDADE && !formData.unidadeId) {
            setError('Por favor, selecione uma unidade ou mude o tipo de vínculo.');
            return;
        }

        setIsSubmitting(true);
        try {
            // Prepara o payload para a API, enviando apenas o ID relevante
            const payload = {
                apoliceNumero: formData.apoliceNumero,
                seguradora: formData.seguradora,
                dataInicio: formData.dataInicio,
                dataFim: formData.dataFim,
                cobertura: formData.cobertura,
                // Envia o ID correto ou null/undefined
                equipamentoId: formData.tipoVinculo === TIPOS_VINCULO.EQUIPAMENTO ? formData.equipamentoId : null,
                unidadeId: formData.tipoVinculo === TIPOS_VINCULO.UNIDADE ? formData.unidadeId : null,
            };

            await onSubmit(payload);
        } catch (err) {
            setError(err.message || 'Ocorreu um erro ao salvar o seguro.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="form-elegante">
            {error && <p className="form-error">{error}</p>}
            
            <div className="form-section">
                <h4>Detalhes da Apólice</h4>
                <div className="info-grid grid-cols-2">
                    <div className="form-group">
                        <label>Número da Apólice *</label>
                        <input type="text" name="apoliceNumero" value={formData.apoliceNumero} onChange={handleChange} required disabled={isSubmitting} />
                    </div>
                    <div className="form-group">
                        <label>Seguradora *</label>
                        <input type="text" name="seguradora" value={formData.seguradora} onChange={handleChange} required disabled={isSubmitting} />
                    </div>
                    <div className="form-group">
                        <label>Início da Vigência *</label>
                        <DateInput name="dataInicio" value={formData.dataInicio} onChange={handleChange} required disabled={isSubmitting} />
                    </div>
                    <div className="form-group">
                        <label>Fim da Vigência *</label>
                        <DateInput name="dataFim" value={formData.dataFim} onChange={handleChange} required disabled={isSubmitting} />
                    </div>
                </div>
            </div>

            <div className="form-section">
                <h4>Objeto Segurado (Vínculo)</h4>
                <div className="form-group">
                    <label>Tipo de Vínculo</label>
                    <select name="tipoVinculo" value={formData.tipoVinculo} onChange={handleTipoVinculoChange} disabled={isSubmitting}>
                        <option value={TIPOS_VINCULO.GERAL}>Geral (Sem vínculo específico)</option>
                        <option value={TIPOS_VINCULO.UNIDADE}>Vincular à Unidade</option>
                        <option value={TIPOS_VINCULO.EQUIPAMENTO}>Vincular ao Equipamento</option>
                    </select>
                </div>

                {/* Vínculo com Unidade */}
                {formData.tipoVinculo === TIPOS_VINCULO.UNIDADE && (
                    <div className="form-group">
                        <label>Unidade *</label>
                        <select name="unidadeId" value={formData.unidadeId} onChange={handleChange} required disabled={isSubmitting}>
                            <option value="">Selecione a Unidade</option>
                            {unidadesDisponiveis.map(u => (
                                <option key={u.id} value={u.id}>
                                    {u.nomeSistema}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Vínculo com Equipamento (agora com seleção de Unidade primeiro) */}
                {formData.tipoVinculo === TIPOS_VINCULO.EQUIPAMENTO && (
                    <>
                        <div className="form-group">
                            <label>Unidade do Equipamento *</label>
                            <select 
                                name="unidadeId" // Mesmo nome para reutilizar o state, mas é para a unidade do equipamento
                                value={formData.unidadeId} 
                                onChange={handleChange} 
                                required 
                                disabled={isSubmitting}
                            >
                                <option value="">Selecione a Unidade do Equipamento</option>
                                {unidadesDisponiveis.map(u => (
                                    <option key={u.id} value={u.id}>
                                        {u.nomeSistema}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Equipamento *</label>
                            <select name="equipamentoId" value={formData.equipamentoId} onChange={handleChange} required disabled={isSubmitting || !formData.unidadeId}>
                                <option value="">Selecione o Equipamento</option>
                                {equipamentosFiltradosPorUnidade.length > 0 ? (
                                    equipamentosFiltradosPorUnidade.map(eq => (
                                        <option key={eq.id} value={eq.id}>
                                            {eq.modelo} (Tag: {eq.tag})
                                        </option>
                                    ))
                                ) : (
                                    <option value="" disabled>Selecione uma unidade para listar equipamentos</option>
                                )}
                            </select>
                        </div>
                    </>
                )}
                
                <div className="form-group">
                    <label>Descrição da Cobertura</label>
                    <textarea name="cobertura" rows="3" value={formData.cobertura} onChange={handleChange} disabled={isSubmitting}></textarea>
                </div>
            </div>
            
            <div className="form-actions" style={{ justifyContent: 'flex-end', gap: '10px' }}>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                    <FontAwesomeIcon icon={isSubmitting ? faSpinner : null} spin={isSubmitting} /> 
                    {isSubmitting ? 'Salvando...' : 'Salvar Seguro'}
                </button>
            </div>
        </form>
    );
}

export default SeguroForm;