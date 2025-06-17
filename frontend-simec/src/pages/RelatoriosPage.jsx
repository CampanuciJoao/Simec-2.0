// src/pages/RelatoriosPage.jsx
// VERSÃO FINAL CORRIGIDA - COM FILTRO DE UNIDADE ENVIANDO O ID

import React, { useState, useEffect } from 'react';
import { getUnidades, getEquipamentos, gerarRelatorio } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { exportarRelatorioPDF } from '../utils/pdfUtils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faSpinner, faFilePdf } from '@fortawesome/free-solid-svg-icons';
import RelatorioResultado from '../components/RelatorioResultado';
import DateInput from '../components/DateInput';

function RelatoriosPage() {
    const { addToast } = useToast();
    const [filtros, setFiltros] = useState({
        tipoRelatorio: 'inventarioEquipamentos',
        unidadeId: '', // CORREÇÃO: O estado agora é 'unidadeId'
        fabricante: '',
        tipoManutencao: '',
        dataInicio: '',
        dataFim: '',
    });

    const [unidadesDisponiveis, setUnidadesDisponiveis] = useState([]);
    const [fabricantesUnicos, setFabricantesUnicos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [resultadoRelatorio, setResultadoRelatorio] = useState(null);

    useEffect(() => {
        async function carregarDadosFiltros() {
            try {
                const [unidadesData, equipamentosData] = await Promise.all([
                    getUnidades(),
                    getEquipamentos()
                ]);
                setUnidadesDisponiveis(unidadesData.sort((a, b) => a.nomeSistema.localeCompare(b.nomeSistema)));
                
                const fabricantes = [...new Set(equipamentosData.map(eq => eq.fabricante).filter(Boolean))].sort();
                setFabricantesUnicos(fabricantes);

            } catch (err) {
                addToast('Erro ao carregar dados para os filtros.', 'error');
            }
        }
        carregarDadosFiltros();
    }, [addToast]);

    const handleFiltroChange = (e) => {
        const { name, value } = e.target;
        setFiltros(prev => ({ ...prev, [name]: value }));
    };

    const handleGerarRelatorio = async (e) => {
        e.preventDefault();
        if (['tempoParada', 'manutencoesRealizadas'].includes(filtros.tipoRelatorio) && (!filtros.dataInicio || !filtros.dataFim)) {
            addToast('Por favor, selecione a Data Início e a Data Fim.', 'error'); return;
        }
        setLoading(true); setResultadoRelatorio(null);
        try {
            const resultado = await gerarRelatorio(filtros);
            setResultadoRelatorio(resultado);
        } catch (error) {
            addToast(error.message || 'Falha ao gerar o relatório.', 'error');
        } finally { setLoading(false); }
    };

    const handleExportarPDF = () => {
        if (!resultadoRelatorio || !resultadoRelatorio.dados || resultadoRelatorio.dados.length === 0) {
            addToast("Não há dados para exportar.", "error"); return;
        }
        const nomeArquivo = `relatorio_${resultadoRelatorio.tipoRelatorio}_${new Date().toISOString().split('T')[0]}`;
        exportarRelatorioPDF(resultadoRelatorio, nomeArquivo);
    };

    return (
        <div className="page-content-wrapper">
            <div className="page-title-card"><h1 className="page-title-internal">Geração de Relatórios</h1></div>
            <section className="page-section">
                <form onSubmit={handleGerarRelatorio}>
                    <div className="form-group filtro-principal">
                        <label htmlFor="tipoRelatorio">Tipo de Relatório *</label>
                        <select id="tipoRelatorio" name="tipoRelatorio" value={filtros.tipoRelatorio} onChange={handleFiltroChange} required>
                            <option value="inventarioEquipamentos">Inventário de Equipamentos</option>
                            <option value="manutencoesRealizadas">Manutenções Realizadas</option>
                            {/* O tipo 'tempoParada' foi removido porque não existe no backend */}
                        </select>
                    </div>

                    <div className="relatorio-filtros-container">
                        {filtros.tipoRelatorio === 'inventarioEquipamentos' && (
                             <>
                                <div className="form-group">
                                    {/* CORREÇÃO: O label aponta para 'unidadeId' e o select usa 'unidadeId' */}
                                    <label htmlFor="unidadeId">Filtrar por Unidade</label>
                                    <select id="unidadeId" name="unidadeId" value={filtros.unidadeId} onChange={handleFiltroChange}>
                                        <option value="">Todas as Unidades</option>
                                        {unidadesDisponiveis.map(u => <option key={u.id} value={u.id}>{u.nomeSistema}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="fabricante">Filtrar por Fabricante</label>
                                    <select id="fabricante" name="fabricante" value={filtros.fabricante} onChange={handleFiltroChange}>
                                        <option value="">Todos os Fabricantes</option>
                                        {fabricantesUnicos.map(f => <option key={f} value={f}>{f}</option>)}
                                    </select>
                                </div>
                            </>
                        )}
                        
                        {['manutencoesRealizadas'].includes(filtros.tipoRelatorio) && (
                            <>
                                 <div className="form-group">
                                    <label htmlFor="unidadeId">Filtrar por Unidade</label>
                                    <select id="unidadeId" name="unidadeId" value={filtros.unidadeId} onChange={handleFiltroChange}>
                                        <option value="">Todas as Unidades</option>
                                        {unidadesDisponiveis.map(u => <option key={u.id} value={u.id}>{u.nomeSistema}</option>)}
                                    </select>
                                </div>
                                <div className="filtro-agrupador-datas">
                                    <div className="form-group"><label htmlFor="dataInicio">Data Início *</label><DateInput id="dataInicio" name="dataInicio" value={filtros.dataInicio} onChange={handleFiltroChange} /></div>
                                    <div className="form-group"><label htmlFor="dataFim">Data Fim *</label><DateInput id="dataFim" name="dataFim" value={filtros.dataFim} onChange={handleFiltroChange} /></div>
                                </div>
                            </>
                        )}
                    </div>
                    <div className="form-actions"><button type="submit" className="btn btn-primary" disabled={loading}>{loading ? <><FontAwesomeIcon icon={faSpinner} spin /> Gerando...</> : <><FontAwesomeIcon icon={faSearch} /> Gerar Relatório</>}</button></div>
                </form>
            </section>
            
            {resultadoRelatorio && (
                <section className="page-section relatorio-resultado-container">
                    <div className="relatorio-header">
                        <h3>Resultados do Relatório</h3>
                        {resultadoRelatorio.dados.length > 0 && ( 
                            <button onClick={handleExportarPDF} className="btn btn-danger">
                                <FontAwesomeIcon icon={faFilePdf} /> Exportar para PDF
                            </button>
                        )}
                    </div>
                    <RelatorioResultado resultado={resultadoRelatorio} />
                </section>
            )}

            {!loading && !resultadoRelatorio && (
                 <div className="no-data-message" style={{textAlign: 'center', padding: '40px', background: 'var(--cor-fundo-pagina-light)'}}><p>Preencha os filtros acima e clique em "Gerar Relatório" para ver os resultados.</p></div>
            )}
        </div>
    );
}

export default RelatoriosPage;