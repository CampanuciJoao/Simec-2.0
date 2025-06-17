// src/utils/exportUtils.js
// CÓDIGO COMPLETO E ATUALIZADO

import { formatarData, formatarDataHora } from './timeUtils'; // Importa as funções de formatação

// Função auxiliar para escapar caracteres especiais no CSV
function escapeCSV(str) {
    if (str === null || str === undefined) {
        return '';
    }
    const s = String(str);
    if (s.search(/("|,|\n)/g) >= 0) {
        return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
}

/**
 * Cria e baixa um relatório CSV estruturado com base no objeto de resultado da API.
 * @param {object} relatorio - O objeto de resultado completo vindo da API.
 * @param {string} nomeArquivo - O nome do arquivo a ser baixado (sem a extensão .csv).
 */
export const exportarRelatorioCSV = (relatorio, nomeArquivo) => {
    if (!relatorio || !relatorio.dados || relatorio.dados.length === 0) {
        console.error("Não há dados para exportar.");
        // Idealmente, a página que chama já fez essa verificação, mas é uma boa prática ter aqui também.
        return;
    }

    const { tipoRelatorio, dados, filtros, periodo } = relatorio;
    let headers = [];
    let dadosFormatados = [];
    let tituloRelatorio = 'Relatório';
    let filtrosUtilizados = [];

    // Lógica para processar cada tipo de relatório
    switch (tipoRelatorio) {
        case 'inventarioEquipamentos':
            tituloRelatorio = 'Relatório de Inventário de Equipamentos';
            headers = ["Modelo", "Numero de Serie", "Fabricante", "Registro ANVISA", "Unidade"];
            // Os dados já vêm no formato correto, então só precisamos mapear
            dadosFormatados = dados.map(item => [
                escapeCSV(item.modelo),
                escapeCSV(item.numeroSerie),
                escapeCSV(item.fabricante),
                escapeCSV(item.registroAnvisa),
                escapeCSV(item.unidade)
            ]);
            filtrosUtilizados = [
                { label: 'Unidade', value: filtros.unidade || 'Todas' },
                { label: 'Fabricante', value: filtros.fabricante || 'Todos' }
            ];
            break;

        case 'manutencoesRealizadas':
            tituloRelatorio = 'Relatório de Manutenções Realizadas';
            headers = ["Equipamento", "Nº OS", "Tipo Manutenção", "Técnico", "Data de Conclusão"];
            dadosFormatados = dados.map(item => [
                escapeCSV(`${item.equipamentoNome} (${item.equipamentoId})`),
                escapeCSV(item.numeroOS),
                escapeCSV(item.tipoManutencao),
                escapeCSV(item.tecnico || 'N/A'),
                escapeCSV(formatarDataHora(item.dataConclusao))
            ]);
            filtrosUtilizados = [
                { label: 'Período', value: `${formatarData(periodo.inicio)} a ${formatarData(periodo.fim)}` },
                { label: 'Unidade', value: filtros.unidade || 'Todas' },
                { label: 'Tipo de Manutenção', value: filtros.tipoManutencao || 'Todas' }
            ];
            break;

        case 'tempoParada':
             tituloRelatorio = 'Relatório de Tempo de Parada de Equipamentos';
             headers = ["Equipamento", "Nº OS", "Início da Parada", "Fim da Parada", "Tempo Parado (Horas)"];
             dadosFormatados = dados.map(item => [
                escapeCSV(`${item.equipamentoNome} (${item.equipamentoId})`),
                escapeCSV(item.numeroOS),
                escapeCSV(formatarDataHora(item.dataInicio)),
                escapeCSV(formatarDataHora(item.dataFim)),
                escapeCSV(item.tempoParadaHoras.toFixed(2))
             ]);
             filtrosUtilizados = [
                { label: 'Período', value: `${formatarData(periodo.inicio)} a ${formatarData(periodo.fim)}` },
                { label: 'Unidade', value: filtros.unidade || 'Todas' }
            ];
            break;
            
        default:
            console.error(`Tipo de relatório desconhecido: ${tipoRelatorio}`);
            return;
    }

    // --- Montagem do Conteúdo do CSV ---
    let csvContent = [];
    csvContent.push(`"${tituloRelatorio}"`);
    csvContent.push(`"Gerado em: ${new Date().toLocaleString('pt-BR')}"`);
    csvContent.push(''); 
    csvContent.push('"Filtros Aplicados:"');
    filtrosUtilizados.forEach(filtro => {
        csvContent.push(`"${filtro.label}:","${filtro.value}"`);
    });
    csvContent.push('');
    csvContent.push(headers.join(','));

    // Adiciona as linhas de dados já formatadas
    dadosFormatados.forEach(row => {
        csvContent.push(row.join(','));
    });

    // --- Criação e Download do Arquivo ---
    const csvString = csvContent.join('\n');
    const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' }); // \uFEFF para compatibilidade com Excel
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${nomeArquivo}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};