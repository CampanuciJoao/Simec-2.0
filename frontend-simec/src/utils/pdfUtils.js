// Ficheiro: src/utils/pdfUtils.js
// VERSÃO FINAL CORRIGIDA - COM CONTEÚDO DA TABELA CENTRALIZADO

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatarDataHora } from './timeUtils';
import logoSimec from '../assets/images/logo-simec-base64'; 

// Função para gerar o cabeçalho padrão dos relatórios
const adicionarCabecalho = (doc, titulo) => {
    doc.addImage(logoSimec, 'PNG', 14, 12, 25, 25);
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Gerado em: ${formatarDataHora(new Date())}`, 200, 18, { align: 'right' });
    doc.setFontSize(18);
    doc.setTextColor(40);
    doc.text(titulo, doc.internal.pageSize.getWidth() / 2, 35, { align: 'center' });
};

export const exportarRelatorioPDF = (resultado, nomeArquivo) => {
    const doc = new jsPDF();
    let headers = [];
    let body = [];
    let tituloRelatorio = "Relatório";

    switch (resultado.tipoRelatorio) {
        case 'inventarioEquipamentos':
            tituloRelatorio = 'Relatório de Inventário de Equipamentos';
            headers = [["Modelo", "Nº de Série", "Fabricante", "Registro ANVISA", "Status", "Unidade"]];
            body = resultado.dados.map(item => [
                item.modelo || 'N/A',
                item.tag || 'N/A',
                item.fabricante || 'N/A',
                item.registroAnvisa || 'N/A',
                item.status || 'N/A',
                item.unidade?.nomeSistema || 'N/A'
            ]);
            break;

        case 'manutencoesRealizadas':
            tituloRelatorio = 'Relatório de Manutenções Realizadas';
            headers = [["Nº OS", "Tipo", "Equipamento", "Técnico", "Data de Conclusão"]];
            body = resultado.dados.map(item => [
                item.numeroOS,
                item.tipo,
                `${item.equipamento.modelo} (${item.equipamento.tag})`,
                item.tecnicoResponsavel || 'N/A',
                formatarDataHora(item.dataConclusao)
            ]);
            break;

        default:
            console.error('Tipo de relatório não suportado para exportação:', resultado.tipoRelatorio);
            return;
    }

    adicionarCabecalho(doc, tituloRelatorio);

    autoTable(doc, {
        head: headers,
        body: body,
        startY: 45,
        theme: 'striped',
        headStyles: {
            fillColor: [30, 41, 59], 
            textColor: 255,
            fontSize: 10,
            halign: 'center' // Garante que o cabeçalho esteja centralizado
        },
        // ==========================================================================
        // >> CORREÇÃO PRINCIPAL APLICADA AQUI <<
        // A propriedade 'styles' foi removida e substituída por 'columnStyles'
        // para garantir que TODAS as colunas do corpo sejam centralizadas.
        // ==========================================================================
        columnStyles: {
            // Aplica o alinhamento central a todas as colunas, de 0 em diante
            0: { halign: 'center' },
            1: { halign: 'center' },
            2: { halign: 'center' },
            3: { halign: 'center' },
            4: { halign: 'center' },
            5: { halign: 'center' },
            // Adicione mais se tiver relatórios com mais colunas
        },
        styles: {
            fontSize: 9,
            cellPadding: 3,
        },
        alternateRowStyles: {
            fillColor: [241, 245, 249]
        }
    });

    doc.save(`${nomeArquivo}.pdf`);
};