// Ficheiro: src/pages/DashboardPage.jsx
// VERSÃO FINAL CORRIGIDA - COM FILTRO POR TIPO NO CLIQUE DO GRÁFICO

import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeartbeat, faTools, faFileInvoiceDollar, faExclamationCircle, faChartPie, faChartBar } from '@fortawesome/free-solid-svg-icons';
import DonutChart from '../components/DonutChart';
import BarChart from '../components/BarChart';
import { getDashboardData } from '../services/api';

function DashboardPage({ darkMode }) {
  const [dashboardData, setDashboardData] = useState({
    equipamentosCount: 0,
    manutencoesCount: 0,
    contratosVencendoCount: 0,
    alertasRecentes: [],
    statusEquipamentos: { labels: [], data: [], colorsLight: [], textColorsLight: [], colorsDark: [], textColorsDark:[] },
    manutencoesPorTipoMes: { labels: [], datasets: [] }, 
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const carregarDados = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDashboardData();
      setDashboardData(prevData => ({
        ...prevData,
        ...data
      }));
    } catch (err) {
      setError(err.message || "Ocorreu um erro ao buscar os dados do dashboard.");
      console.error("DashboardPage: Erro ao carregar dados:", err);
    } finally {
      setLoading(false);
    }
  }, []); 

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const handleChartClick = (statusLabel) => {
    // A lógica para o gráfico de Donut permanece a mesma
    navigate('/equipamentos', { state: { filtroStatusInicial: statusLabel } });
  };

  // ==========================================================================
  // >> CORREÇÃO PRINCIPAL APLICADA AQUI <<
  // A função agora usa o 'dados.tipo' recebido do BarChart para navegar.
  // O valor de 'dados.tipo' (ex: "Preventiva") já corresponde ao que o filtro
  // da ManutencoesPage espera.
  // ==========================================================================
  const handleBarChartClick = (dados) => {
    if (dados && dados.tipo) {
      navigate('/manutencoes', { state: { filtroTipoInicial: dados.tipo } });
    }
  };

  const statusEquipData = dashboardData.statusEquipamentos || { labels: [], data: [] };
  const manutencoesPorTipoMesDataFromState = dashboardData.manutencoesPorTipoMes || { labels: [], datasets: [] };
  
  const statusEquipamentosChartData = {
    labels: statusEquipData.labels || [],
    datasets: [{ data: statusEquipData.data || [] }],
    colorsLight: statusEquipData.colorsLight || [],
    colorsDark: statusEquipData.colorsDark || [],
    textColorsLight: statusEquipData.textColorsLight || [],
    textColorsDark: statusEquipData.textColorsDark || []
  };
  
  const manutencoesPorTipoMesChartData = {
    labels: manutencoesPorTipoMesDataFromState.labels || [],
    datasets: (manutencoesPorTipoMesDataFromState.datasets || []).map((dataset, index) => {
      const colors = [
          'rgba(59, 130, 246, 0.8)',  // Azul (Preventiva)
          'rgba(245, 159, 11, 0.8)',  // Laranja (Corretiva)
          'rgba(16, 185, 129, 0.8)', // Verde (Calibração)
          'rgba(139, 92, 246, 0.8)'   // Roxo (Inspeção)
      ];
      return {
        ...dataset,
        backgroundColor: colors[index % colors.length],
      };
    }),
  };
  
  const temDadosValidosParaDonut = statusEquipamentosChartData.labels.length > 0 && statusEquipamentosChartData.datasets[0].data.some(d => d > 0);
  const temDadosValidosParaBar = manutencoesPorTipoMesChartData.labels.length > 0 && manutencoesPorTipoMesChartData.datasets.some(ds => ds.data.some(d => d > 0));

  if (loading) {
    return (
      <div className="page-content-wrapper"><div className="page-title-card"><h1 className="page-title-internal">Dashboard</h1></div><p>Carregando dados do dashboard...</p></div>
    );
  }
  if (error) {
    return (
      <div className="page-content-wrapper"><div className="page-title-card"><h1 className="page-title-internal">Dashboard</h1></div><p style={{ color: 'red' }}>Erro: {error}</p></div>
    );
  }

  return (
    <div className="page-content-wrapper">
      <div className="page-title-card"><h1 className="page-title-internal">Dashboard</h1></div>
      <section className="summary-cards">
        <Link to="/equipamentos" className="card-link"><div className="card"><div className="card-icon"><FontAwesomeIcon icon={faHeartbeat} /></div><div className="card-text-content"><div className="card-title">EQUIPAMENTOS</div><div className="card-value">{dashboardData.equipamentosCount}</div></div></div></Link>
        <Link to="/manutencoes" className="card-link"><div className="card"><div className="card-icon"><FontAwesomeIcon icon={faTools} /></div><div className="card-text-content"><div className="card-title">MANUTENÇÕES PENDENTES</div><div className="card-value">{dashboardData.manutencoesCount}</div></div></div></Link>
        <Link to="/contratos" className="card-link"><div className="card"><div className="card-icon"><FontAwesomeIcon icon={faFileInvoiceDollar} /></div><div className="card-text-content"><div className="card-title">CONTRATOS VENCENDO</div><div className="card-value">{dashboardData.contratosVencendoCount}</div></div></div></Link>
      </section>
      <section className="detailed-sections">
        <div className="alerts-section page-section">
          <h2>ALERTAS RECENTES/CRÍTICOS</h2>
          <div className="alerts-list">
            {(dashboardData.alertasRecentes && dashboardData.alertasRecentes.length > 0) ? (
              <ul>{dashboardData.alertasRecentes.map(alerta => (<li key={alerta.id}><Link to={alerta.link || '/alertas'}><FontAwesomeIcon icon={faExclamationCircle} className="alert-icon" style={{ color: alerta.prioridade === 'Alta' ? 'var(--btn-danger-bg-light)' : (alerta.prioridade === 'Media' ? '#FACC15' : 'var(--cor-texto-secundario-light)')}} />{alerta.titulo}</Link></li>))}</ul>
            ) : <p style={{textAlign: 'center', color: 'var(--cor-texto-secundario-light)'}}>Nenhum alerta crítico no momento.</p>}
          </div>
        </div>
        <div className="charts-section page-section">
          <div className="chart-container-dashboard"> 
            <div style={{display: 'flex', alignItems: 'center', marginBottom: '10px'}}><FontAwesomeIcon icon={faChartPie} style={{ marginRight: '8px', fontSize: '0.9em', color: 'var(--cor-texto-secundario-light)' }} /><h2 style={{margin: 0, borderBottom: 'none', textTransform: 'none', letterSpacing: 'normal', fontSize:'1em', color: 'var(--cor-texto-principal-light)'}}>Status dos Equipamentos</h2></div>
            <div className="chart-wrapper" style={{ height: '220px', maxHeight: '220px' }}>
              {temDadosValidosParaDonut ? (<DonutChart key={`donut-${darkMode}`} chartData={statusEquipamentosChartData} darkMode={darkMode} onSliceClick={handleChartClick} />) : (<p className="no-data-message">Dados insuficientes para o gráfico.</p>)}
            </div>
          </div>
          <hr className="chart-separator" />
          <div className="chart-container-dashboard"> 
             <div style={{display: 'flex', alignItems: 'center', marginBottom: '10px'}}><FontAwesomeIcon icon={faChartBar} style={{ marginRight: '8px', fontSize: '0.9em', color: 'var(--cor-texto-secundario-light)' }} /><h2 style={{margin: 0, borderBottom: 'none', textTransform: 'none', letterSpacing: 'normal', fontSize:'1em', color: 'var(--cor-texto-principal-light)'}}>Manutenções nos Últimos 6 Meses</h2></div>
            <div className="chart-wrapper" style={{ height: '220px', maxHeight: '220px' }}>
              {temDadosValidosParaBar ? (
                <BarChart key={`bar-${darkMode}`} chartData={manutencoesPorTipoMesChartData} darkMode={darkMode} onBarClick={handleBarChartClick} />
              ) : (<p className="no-data-message">Dados insuficientes para o gráfico.</p>)}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default DashboardPage;