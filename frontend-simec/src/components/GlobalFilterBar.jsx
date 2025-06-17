// Ficheiro: frontend-simec/src/components/GlobalFilterBar.jsx
// VERSÃO FINAL, COMPLETA E COM O CAMINHO DO CSS CORRIGIDO

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faFilter } from '@fortawesome/free-solid-svg-icons';

// >> CORREÇÃO PRINCIPAL APLICADA AQUI <<
// O caminho foi corrigido para refletir a localização real do seu arquivo CSS.
// O componente agora sobe um nível ('../') para sair de 'components' e
// então entra em 'styles/components' para encontrar o arquivo.
import '../styles/components/GlobalFilterBar.css'; 

/**
 * @function formatarLabel
 * @description Uma função utilitária interna que transforma valores de Enum (CamelCase)
 * em rótulos legíveis (com espaços). Ex: "EmManutencao" -> "Em Manutenção".
 * @param {string} valor - O valor a ser formatado.
 * @returns {string} O rótulo formatado.
 */
const formatarLabel = (valor) => {
  if (!valor) return '';
  // Usa uma expressão regular para inserir um espaço antes de cada letra maiúscula.
  return valor.replace(/([A-Z])/g, ' $1').trim();
};

/**
 * @component CustomSelect
 * @description Subcomponente que agora contém a lógica de formatação de rótulos.
 */
const CustomSelect = ({ config }) => (
  <div className="filter-select-wrapper">
    <FontAwesomeIcon icon={faFilter} className="filter-icon" />
    <select
      id={config.id}
      value={config.value}
      onChange={(e) => config.onChange(e.target.value)}
      className="filter-select"
    >
      <option value="">{config.defaultLabel}</option>
      {config.options.map(opt => {
        // Lógica inteligente que lida com opções como string ou objeto
        const valor = typeof opt === 'object' ? opt.value : opt;
        const rotulo = typeof opt === 'object' ? opt.label : formatarLabel(opt);

        return (
          <option key={valor} value={valor}>
            {rotulo}
          </option>
        );
      })}
    </select>
  </div>
);

/**
 * @component GlobalFilterBar
 * @description Barra de filtros reutilizável. Agora é resiliente e não exige que
 * os componentes pais formatem os dados de 'options'.
 */
function GlobalFilterBar({ searchTerm, onSearchChange, searchPlaceholder, selectFilters = [] }) {
  return (
    <div className="global-filter-bar">
      <div className="search-input-wrapper">
          <input
          type="text"
          placeholder={searchPlaceholder || "Buscar..."}
          value={searchTerm}
          onChange={onSearchChange}
          className="filter-input"
        />
      </div>
      <div className="select-filters-container">
        {selectFilters.map(filterConfig => (
          <CustomSelect key={filterConfig.id} config={filterConfig} />
        ))}
      </div>
    </div>
  );
}

export default GlobalFilterBar;