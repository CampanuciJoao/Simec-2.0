// src/components/BarChart.jsx
// VERSÃO ATUALIZADA - COM LÓGICA DE CLIQUE E BARRAS EMPILHADAS

import React, { useEffect, useRef } from 'react';
import { Bar, getElementAtEvent } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const getCssVariableValue = (variableName) => {
    if (typeof window !== 'undefined') {
        return getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
    }
    return '';
};

function BarChart({ chartData, title, darkMode, onBarClick }) {
  const chartRef = useRef(null);

  // Handler para o evento de clique no gráfico
  const handleClick = (event) => {
    if (!chartRef.current || !onBarClick) return;
    const element = getElementAtEvent(chartRef.current, event);
    
    if (element.length > 0) {
      const { datasetIndex, index } = element[0];
      const mesLabel = chartData.labels[index];
      const tipoLabel = chartData.datasets[datasetIndex].label;
      onBarClick({ mes: mesLabel, tipo: tipoLabel });
    }
  };

  useEffect(() => {
    const chartInstance = chartRef.current;
    return () => {
      if (chartInstance) {
        chartInstance.destroy();
      }
    };
  }, []);

  const isValid = chartData &&
                  Array.isArray(chartData.labels) && chartData.labels.length > 0 &&
                  Array.isArray(chartData.datasets) && chartData.datasets.length > 0 &&
                  chartData.datasets.every(dataset => 
                    Array.isArray(dataset.data) && 
                    dataset.data.length === chartData.labels.length
                  );

  if (!isValid) {
    console.error("BarChart: Dados insuficientes ou inválidos para o gráfico.", JSON.stringify(chartData, null, 2));
    return <p>Dados insuficientes para o gráfico.</p>;
  }

  const textColor = darkMode ? getCssVariableValue('--cor-texto-principal-dark') || '#e0e0e0' : getCssVariableValue('--cor-texto-principal-light') || '#1C2B3A';
  const gridColor = darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)';
  
  const data = {
    labels: chartData.labels,
    datasets: chartData.datasets.map(dataset => ({
        ...dataset,
    })),
  };

  const options = {
    devicePixelRatio: Math.max(window.devicePixelRatio || 1, 1.5), 
    maintainAspectRatio: false, 
    responsive: true,
    indexAxis: 'x',
    plugins: {
      legend: { 
        display: true, // Sempre mostrar legenda para os tipos
        position: 'bottom',
        labels: { 
            color: textColor, 
            font: {
                size: 11,
                family: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            }
        }
      },
      title: { 
        display: !!title,
        text: title, 
        color: textColor,
        font: {
            size: 13, 
            family: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        }
      },
      tooltip: {
        titleColor: textColor, bodyColor: textColor,
        backgroundColor: darkMode ? 'rgba(30, 30, 30, 0.9)' : 'rgba(255, 255, 255, 0.95)',
        borderColor: darkMode ? getCssVariableValue('--cor-borda-dark') : getCssVariableValue('--cor-borda-light'),
        borderWidth: 1, padding: 10, cornerRadius: 4,
        titleFont: { size: 12 },
        bodyFont: { size: 11 },
      }
    },
    scales: {
      y: {
        stacked: true, // Habilita o empilhamento no eixo Y
        beginAtZero: true,
        ticks: { 
            color: textColor, 
            precision: 0,
            font: { 
                size: 11,
                family: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            } 
        },
        grid: { color: gridColor, borderColor: gridColor, drawBorder: false, }
      },
      x: {
        stacked: true, // Habilita o empilhamento no eixo X
        ticks: { 
            color: textColor,
            font: { 
                size: 11,
                family: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            } 
        },
        grid: { display: false, }
      },
    },
  };

  return <Bar ref={chartRef} data={data} options={options} onClick={handleClick} />;
}

export default BarChart;