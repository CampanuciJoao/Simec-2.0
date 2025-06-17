Visão Geral e Tecnologias
Estrutura de Pastas
Instruções de Execução (Frontend e Backend)
Principais Funcionalidades Implementadas (Passo a Passo)
Configuração Inicial do Frontend (Vite, React)
Layout Básico e Estilização Inicial
Componentização (Sidebar, Cards, Gráficos Placeholder)
Configuração do Backend (Node.js, Express, LowDB)
Criação da API para o Dashboard
Conexão Frontend-Backend para o Dashboard (Dados Dinâmicos)
Implementação de Gráficos Reais (Chart.js)
Paleta de Cores Moderna e Modo Dark
Funcionalidades da Página de Equipamentos (Listar, Filtrar, Adicionar, Editar, Deletar, Status Inline)
Códigos Completos dos Arquivos Principais (Estado Atual) - Esta será a parte mais longa.
Próximos Passos Sugeridos
Devido à limitação de caracteres em uma única resposta, pode ser que eu precise dividir o código em blocos menores ou focar nas partes mais cruciais. Vou tentar ser o mais completo possível.
Arquivo de Consolidação do Projeto: PROJETO_DASHBOARD_CONSOLIDADO.md
# Projeto Dashboard de Gerenciamento de Manutenção - Estado Atual

**Autor:** João Marcos Campanuci Almeida
**Data da Consolidação:** 31 de maio de 2024
**Assistente IA:** Gemini

## 1. Visão Geral e Objetivos

Este documento consolida o progresso do desenvolvimento de um sistema de gerenciamento de manutenção de equipamentos. O sistema é composto por um frontend interativo construído com React (utilizando Vite) e um backend API com Node.js e Express, persistindo dados em um arquivo JSON (`db.json`) através da biblioteca `lowdb`.

O objetivo atual é ter um dashboard funcional com dados dinâmicos, gráficos, uma paleta de cores moderna com modo dark, e funcionalidades implementadas na página de gerenciamento de equipamentos (listagem, filtros, adição, edição e exclusão).

## 2. Tecnologias Utilizadas

*   **Frontend:** React, Vite, JavaScript (ES6+), CSS3, `react-router-dom`, `axios`, Font Awesome, `chart.js`, `react-chartjs-2`.
*   **Backend:** Node.js, Express.js, `cors`, `lowdb@7`.
*   **Ferramentas:** VS Code, npm, Terminal (PowerShell), Navegador com DevTools.

## 3. Estrutura do Projeto
Use code with caution.
Markdown
dashboard-app/
├── frontend-dashboard/
│ ├── public/
│ │ └── vite.svg
│ ├── src/
│ │ ├── assets/
│ │ ├── components/
│ │ │ ├── Sidebar.jsx
│ │ │ ├── DonutChart.jsx
│ │ │ ├── BarChart.jsx
│ │ │ └── EquipamentoForm.jsx
│ │ ├── pages/
│ │ │ ├── DashboardPage.jsx
│ │ │ ├── EquipamentosPage.jsx
│ │ │ ├── AdicionarEquipamentoPage.jsx
│ │ │ ├── EditarEquipamentoPage.jsx
│ │ │ ├── ContratosPage.jsx
│ │ │ └── ManutencoesPage.jsx
│ │ ├── services/
│ │ │ └── api.js
│ │ ├── App.jsx
│ │ ├── index.css
│ │ └── main.jsx
│ ├── .gitignore
│ ├── index.html
│ ├── package.json
│ ├── package-lock.json
│ └── vite.config.js
│
└── backend-dashboard/
├── node_modules/
├── db.json
├── server.js
└── package.json
## 4. Instruções de Execução

### 4.1. Backend (`backend-dashboard`)
1.  Navegue até a pasta `backend-dashboard`.
2.  Instale dependências: `npm install`
3.  Inicie o servidor: `node server.js` (Rodará em `http://localhost:5000`)

### 4.2. Frontend (`frontend-dashboard`)
1.  Abra um novo terminal.
2.  Navegue até a pasta `frontend-dashboard`.
3.  Instale dependências: `npm install`
4.  Inicie o servidor de desenvolvimento: `npm run dev` (Acessível em `http://localhost:5173`)

**Nota:** O backend precisa estar rodando para o frontend buscar dados.

## 5. Funcionalidades Implementadas (Resumo)

*   **Layout Geral:** Sidebar de navegação e área de conteúdo principal.
*   **Dashboard:**
    *   Exibição de cards de resumo (Equipamentos, Manutenções, Contratos Vencendo) com dados da API.
    *   Lista de "Alertas Recentes/Críticos" com dados da API.
    *   Gráfico de Donut "Status dos Equipamentos" com dados e cores dinâmicas da API, adaptável ao tema.
    *   Gráfico de Barras "Manutenções por Tipo no Mês" com dados da API, adaptável ao tema.
    *   Layout dos gráficos um abaixo do outro na coluna de gráficos.
    *   Cards de resumo são clicáveis e navegam para rotas placeholder.
*   **Página de Equipamentos:**
    *   Listagem de equipamentos da API em uma tabela.
    *   Filtro por Unidade (dropdown dinâmico com unidades existentes).
    *   Filtro por Nº de Série (busca textual dinâmica).
    *   Botão "Adicionar Equipamento" que leva para um formulário.
    *   Formulário para adicionar novos equipamentos (`EquipamentoForm.jsx` usado por `AdicionarEquipamentoPage.jsx`), com submissão para a API.
    *   Funcionalidade de Editar Equipamento (botão na tabela leva para `EditarEquipamentoPage.jsx` que usa `EquipamentoForm.jsx` pré-preenchido).
    *   Funcionalidade de Deletar Equipamento com confirmação (`window.confirm`).
    *   Campo "Status" na tabela é um `<select>` diretamente editável, salvando `onChange`.
    *   Linhas da tabela coloridas de acordo com o status do equipamento.
*   **Tematização:**
    *   Paleta de cores moderna aplicada globalmente via variáveis CSS.
    *   Modo Dark funcional com toggle na interface e persistência da preferência no `localStorage`.
*   **Backend API:**
    *   Endpoints para `GET /api/dashboard-data`.
    *   Endpoints CRUD para equipamentos: `GET /api/equipamentos` (com filtros), `POST /api/equipamentos`, `GET /api/equipamentos/:id`, `PUT /api/equipamentos/:id`, `DELETE /api/equipamentos/:id`.
    *   Uso do `lowdb` com `db.json` para persistência.

## 6. Códigos Completos dos Arquivos Principais (Estado Atual)

**Nota:** Devido à limitação de tamanho, vou referenciar as respostas anteriores onde os códigos completos foram fornecidos. Certifique-se de usar as versões mais recentes que corrigiram os problemas e implementaram as funcionalidades.

*   **`backend-dashboard/db.json`**:
    *   *Consulte a resposta anterior onde o `db.json` foi atualizado com as cores vibrantes para os gráficos e a estrutura completa de `statusEquipamentos`.*
*   **`backend-dashboard/server.js`**:
    *   *Consulte a resposta anterior onde os endpoints CRUD para equipamentos foram implementados e revisados.*
*   **`frontend-dashboard/src/index.css`**:
    *   *Consulte a resposta anterior que forneceu o `index.css` completo com a paleta de cores moderna, modo dark, estilos para layout dos gráficos no dashboard, e cores de linha da tabela.*
*   **`frontend-dashboard/src/App.jsx`**:
    *   *Consulte a resposta anterior que incluiu o botão de toggle de tema e passou `darkMode` como prop para `DashboardPage`.*
*   **`frontend-dashboard/src/pages/DashboardPage.jsx`**:
    *   *Consulte a resposta anterior que ajustou o layout dos gráficos, as alturas dos `chart-wrapper`, e passou as props corretas (incluindo `darkMode`) para os componentes de gráfico.*
*   **`frontend-dashboard/src/pages/EquipamentosPage.jsx`**:
    *   *Consulte a resposta anterior que implementou o status como um `<select>` sempre visível na tabela, com a classe de status na `<tr>` e a função `getStatusRowClass`.*
*   **`frontend-dashboard/src/components/DonutChart.jsx`**:
    *   *Consulte a resposta anterior onde este componente foi atualizado para usar `chartData.textColors` e lidar com a prop `darkMode` para cores de legenda/tooltip.*
*   **`frontend-dashboard/src/components/BarChart.jsx`**:
    *   *Consulte a resposta anterior onde este componente foi atualizado para usar `darkMode` para as cores de texto/grade e cores primárias do tema para as barras.*
*   **`frontend-dashboard/src/services/api.js`**:
    *   *Deve conter `getDashboardData`, `getEquipamentos`, `addEquipamento`, `getEquipamentoById`, `updateEquipamento`, `deleteEquipamento`.*
*   **Outros Componentes de Página (Placeholders):**
    *   `AdicionarEquipamentoPage.jsx`, `EditarEquipamentoPage.jsx`, `ContratosPage.jsx`, `ManutencoesPage.jsx` devem ter a estrutura básica com `<div className="page-content-wrapper">` e o conteúdo placeholder ou o `EquipamentoForm.jsx` conforme implementado.
*   **`frontend-dashboard/src/components/EquipamentoForm.jsx`**:
    *   *Deve estar como na implementação da funcionalidade de Adicionar/Editar Equipamento.*
*   **`frontend-dashboard/src/components/Sidebar.jsx`**:
    *   *Deve estar com o título "Gestão Equipamentos" e os `NavLink`s corretos.*
*   **`frontend-dashboard/index.html`** e **`frontend-dashboard/src/main.jsx`**:
    *   *Devem estar como configurados inicialmente, com `main.jsx` importando `index.css`.*

**Se você precisar de algum desses blocos de código novamente, me peça especificamente o arquivo.**

## 7. Próximos Passos Sugeridos

1.  **Página de Detalhes do Equipamento:**
    *   Criar `DetalhesEquipamentoPage.jsx`.
    *   Fazer o botão "Visualizar" (se decidir readicioná-lo) ou um clique na linha da tabela (ex: no Nº de Série) levar a esta página.
    *   Exibir todas as informações do equipamento.
    *   **Implementar a seção de Acessórios** (CRUD para acessórios vinculados a um equipamento).
2.  **Conteúdo Real para Outras Páginas:**
    *   Desenvolver a lógica e UI para "Contratos", "Alertas" (além do dashboard), "Agendamentos/Manutenções", e "Relatórios".
3.  **Notificações Mais Elaboradas:** Substituir `alert()` e `window.confirm()` por modais ou "toasts/snackbars" para uma melhor UX.
4.  **Validação de Formulários:** Implementar validação mais robusta no frontend (ex: com bibliotecas como Formik/Yup ou React Hook Form) e também no backend.
5.  **Paginação e Busca Avançada:** Para listas grandes (especialmente equipamentos), implementar paginação e opções de busca mais avançadas no backend e frontend.
6.  **Autenticação e Autorização:** Se necessário, adicionar sistema de login.
7.  **Testes:** Escrever testes unitários e de integração.
8.  **Otimização e Refatoração:** Revisar o código para melhorias de performance e manutenibilidade.
9.  **Deploy:** Publicar a aplicação.

---