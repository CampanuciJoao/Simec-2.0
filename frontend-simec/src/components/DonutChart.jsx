// src/components/DonutChart.jsx
// CÓDIGO COMPLETO E ATUALIZADO - BASEADO NO SEU CÓDIGO ORIGINAL

import React, { useEffect, useRef } from 'react';
import { Doughnut, getElementAtEvent } from 'react-chartjs-2'; // Importação adicionada
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

function getCssVariableValue(variableName) {
  if (typeof window !== 'undefined') {
    return getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
  }
  return '';
}

// A nova prop 'onSliceClick' foi adicionada aqui
function DonutChart({ chartData, title, darkMode, onSliceClick }) {
  const chartRef = useRef(null);

  useEffect(() => {
    const chartInstance = chartRef.current;
    return () => {
      if (chartInstance) {
        chartInstance.destroy();
      }
    };
  }, []);

  // Nova função para manipular o clique no gráfico
  const handleClick = (event) => {
    if (!chartRef.current || !onSliceClick) return;

    const element = getElementAtEvent(chartRef.current, event);
    
    if (element.length > 0) {
      const { index } = element[0];
      const label = chartData.labels[index];
      onSliceClick(label);
    }
  };

  const isValid = 
    chartData &&
    Array.isArray(chartData.labels) && chartData.labels.length > 0 &&
    chartData.datasets && Array.isArray(chartData.datasets) && chartData.datasets.length > 0 &&
    Array.isArray(chartData.datasets[0].data) && chartData.datasets[0].data.length > 0 &&
    // A validação de cores é feita no componente DashboardPage, então podemos simplificar aqui
    chartData.labels.length === chartData.datasets[0].data.length;


  if (!isValid) {
    console.error("DonutChart: Dados inválidos ou incompletos recebidos.", JSON.stringify(chartData, null, 2));
    return <p>Dados inválidos para o gráfico Donut.</p>;
  }

  const fallbackTextColor = darkMode ? 
    (getCssVariableValue('--cor-texto-principal-dark') || '#e0e0e0') : 
    (getCssVariableValue('--cor-texto-principal-light') || '#1C2B3A');

  const data = {
    labels: chartData.labels,
    datasets: [
      {
        label: title || 'Status',
        data: chartData.datasets[0].data,
        // Usando as cores passadas pela DashboardPage
        backgroundColor: darkMode ? chartData.colorsDark : chartData.colorsLight,
        borderColor: darkMode ? (getCssVariableValue('--cor-fundo-card-dark') || '#1e1e1e') : (getCssVariableValue('--cor-fundo-card-light') || '#ffffff'),
        borderWidth: 2,
        hoverOffset: 8,
      },
    ],
  };

  const options = {
    devicePixelRatio: Math.max(window.devicePixelRatio || 1, 1.5), 
    maintainAspectRatio: false, 
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: {
            size: 11, 
            family: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            weight: '500',
          },
          // A sua lógica de cor dinâmica é excelente e foi mantida
          color: (context) => {
            const textColors = darkMode ? chartData.textColorsDark : chartData.textColorsLight;
            if (textColors && textColors[context.index] !== undefined) {
                return textColors[context.index];
            }
            return fallbackTextColor;
          },
          boxWidth: 12,
          padding: 15,
          usePointStyle: true,
          pointStyle: 'circle',
        }
      },
      title: { display: false },
      tooltip: {
        backgroundColor: darkMode ? 'rgba(30, 30, 30, 0.92)' : 'rgba(255, 255, 255, 0.92)',
        borderColor: darkMode ? (getCssVariableValue('--cor-borda-dark') || '#495057') : (getCssVariableValue('--cor-borda-light') || '#dee2e6'),
        borderWidth: 1,
        padding: 10,
        cornerRadius: 4,
        titleFont: { weight: 'bold', size: 12 },
        titleColor: fallbackTextColor, 
        bodyColor: fallbackTextColor, 
        bodyFont: { size: 11 },
        callbacks: {
            labelColor: function(context) {
                const colors = darkMode ? chartData.colorsDark : chartData.colorsLight;
                const bgColor = colors?.[context.dataIndex];
                if (bgColor) {
                    return {
                        borderColor: bgColor,
                        backgroundColor: bgColor,
                        borderWidth: 0,
                        borderRadius: 2,
                    };
                }
                return { borderColor: 'rgba(0,0,0,0.1)', backgroundColor: 'rgba(0,0,0,0.1)', borderWidth: 0, borderRadius: 2, };
            },
            labelTextColor: function(context) { 
                 const textColors = darkMode ? chartData.textColorsDark : chartData.textColorsLight;
                 if (textColors && textColors[context.dataIndex] !== undefined) {
                    return textColors[context.dataIndex];
                 }
                 return fallbackTextColor;
            }
        }
      }
    },
    cutout: '60%',
  };
  
  // O atributo onClick foi adicionado aqui para chamar nossa nova função
  return <Doughnut ref={chartRef} data={data} options={options} onClick={handleClick} />;
}
export default DonutChart;