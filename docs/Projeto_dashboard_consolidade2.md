# Projeto Dashboard de Gerenciamento de Manutenção - Estado Atual

**Autor:** João Marcos Campanuci Almeida
**Data da Consolidação:** 05 de Junho de 2024
**Assistente IA:** Gemini

## 1. Visão Geral e Objetivos

Este documento consolida o progresso do desenvolvimento de um sistema de gerenciamento de manutenção de equipamentos. O sistema é composto por um frontend interativo construído com React (utilizando Vite) e um backend API com Node.js e Express, persistindo dados em um arquivo JSON (`db.json`) através da biblioteca `lowdb`.

Os objetivos atuais incluem um dashboard funcional com dados dinâmicos (contadores, alertas, gráficos), funcionalidades avançadas na página de gerenciamento de equipamentos (filtros de coluna, gerenciamento de acessórios), uma página detalhada de gerenciamento de manutenções (com histórico, anexos, cancelamento), e lógica de atualização automática de status para manutenções.

## 2. Tecnologias Utilizadas

*   **Frontend:** React (v18+), Vite, JavaScript (ES6+), CSS3, `react-router-dom` (v6), `axios`, Font Awesome (v6.5.1), `chart.js` (v4+), `react-chartjs-2` (v5+).
*   **Backend:** Node.js (v22.16.0 - *verificar sua versão*), Express.js, `cors`, `lowdb` (v7), `nanoid` (v5+), `multer`.
*   **Ferramentas:** VS Code, npm, Terminal (PowerShell), Navegador com DevTools.

## 3. Estrutura de Pastas (Simplificada)

dashboard-app/
├── backend-dashboard/
│   ├── node_modules/
│   ├── uploads/
│   │   └── manutencoes/  (Arquivos de manutenção anexados)
│   ├── db.json
│   ├── package.json
│   ├── package-lock.json
│   └── server.js
└── frontend-dashboard/
    ├── public/
    │   └── vite.svg
    ├── src/
    │   ├── assets/ 
    │   ├── components/
    │   │   ├── AcessorioForm.jsx
    │   │   ├── BarChart.jsx
    │   │   ├── DonutChart.jsx
    │   │   ├── EquipamentoForm.jsx
    │   │   ├── ManutencaoForm.jsx
    │   │   ├── Modal.jsx
    │   │   ├── ModalCancelamento.jsx
    │   │   └── Sidebar.jsx
    │   ├── pages/
    │   │   ├── AcessoriosEquipamentoPage.jsx
    │   │   ├── AdicionarEquipamentoPage.jsx
    │   │   ├── AgendarManutencaoPage.jsx
    │   │   ├── ContratosPage.jsx (Placeholder)
    │   │   ├── DashboardPage.jsx
    │   │   ├── DetalhesManutencaoPage.jsx
    │   │   ├── EditarEquipamentoPage.jsx
    │   │   ├── EquipamentosPage.jsx
    │   │   └── ManutencoesPage.jsx
    │   ├── services/
    │   │   └── api.js
    │   ├── App.jsx
    │   ├── index.css 
    │   └── main.jsx
    ├── .gitignore
    ├── index.html
    ├── package.json
    ├── package-lock.json 
    └── vite.config.js

## 4. Instruções de Execução

### 4.1. Backend (`backend-dashboard`)
1.  Navegue até a pasta `backend-dashboard`.
2.  Instale dependências: `npm install`
3.  Inicie o servidor: `node server.js` (Rodará em `http://localhost:5000`)

### 4.2. Frontend (`frontend-dashboard`)
1.  Abra um novo terminal.
2.  Navegue até a pasta `frontend-dashboard`.
3.  Instale dependências: `npm install`
4.  Inicie o servidor de desenvolvimento: `npm run dev` (Acessível geralmente em `http://localhost:5173`)

**Nota:** O backend precisa estar rodando para o frontend buscar e enviar dados.

## 5. Funcionalidades Implementadas e Lógica Principal

*   **Layout Geral e Tematização:**
    *   Sidebar de navegação, área de conteúdo principal.
    *   Toggle para Modo Dark/Light com persistência no `localStorage`.
    *   Barra de título escura em cada página principal.

*   **Dashboard (`DashboardPage.jsx`):**
    *   **Cards de Resumo Dinâmicos:**
        *   "Equipamentos": Contagem total de equipamentos.
        *   "Manutenções (Mês)": Contagem de manutenções com status "Agendada" ou "Em Andamento" cujas datas de referência caem no mês corrente.
        *   "Contratos Vencendo": (Valor atualmente placeholder, lógica de cálculo pendente).
    *   **Alertas:** Lista de alertas (default + gerados dinamicamente para manutenções próximas do início/fim).
    *   **Gráfico Donut "Status dos Equipamentos":**
        *   Labels: "Ativo", "Em Manutenção", "Inativo", "Pendente Instalação".
        *   "Em Manutenção" é derivado de equipamentos com OS "Em Andamento" ativa (independentemente da data da OS).
        *   Outros status ("Ativo", "Inativo", "Pendente Instalação") são contados a partir do campo `status` dos equipamentos que *não* estão em manutenção ativa.
        *   Cores e textos adaptáveis ao tema (Light/Dark).
        *   Melhorias de nitidez aplicadas (devicePixelRatio, maintainAspectRatio).
    *   **Gráfico de Barras "Manutenções por Tipo no Mês":**
        *   Conta manutenções do mês corrente (todos os status) agrupadas por tipo ("Preventivas", "Corretivas", "Calibrações").
        *   Cores adaptáveis ao tema.
        *   Melhorias de nitidez aplicadas.

*   **Página de Equipamentos (`EquipamentosPage.jsx`):**
    *   Listagem de equipamentos com tabela responsiva.
    *   **Filtros de Coluna Interativos:**
        *   "Modelo", "Nº Série (ID)": Filtro de texto direto no pop-up, limpando ao clicar fora se o resultado for vazio.
        *   "Tipo", "Unidade", "Fabricante", "Status": Filtro por seleção de lista de opções únicas no pop-up.
    *   **Gerenciamento de Acessórios em Linha Expansível:**
        *   Seção por equipamento para listar, adicionar (via `AcessorioForm.jsx`), editar (placeholder) e excluir acessórios.
    *   **Status do Equipamento:** Campo `<select>` editável inline para os status: "Ativo", "Inativo", "Pendente Instalação".
    *   Linhas da tabela coloridas conforme o status do equipamento.
    *   Ações: Editar equipamento, Excluir equipamento (com seus acessórios).

*   **Página de Manutenções (`ManutencoesPage.jsx`):**
    *   Listagem de manutenções.
    *   **Formato do Número da OS:** `P24-0001` (PrefixoTipo+Ano2Digitos-Sequencial4Digitos), com contador anual por tipo.
    *   **Ícones de Ação Coloridos:** "Ver Detalhes" (azul) e "Cancelar Agendamento" (vermelho, visível apenas para status "Agendada").
    *   **Filtros de Coluna:**
        *   "Equipamento": Seleção de uma lista de equipamentos cadastrados.
        *   "Status": Seleção de uma lista de status de manutenção ("Agendada", "Em Andamento", "Concluída", "Cancelada").
    *   **Polling:** A lista de manutenções atualiza automaticamente a cada minuto.
    *   Botão "Agendar Manutenção".

*   **Página de Detalhes da Manutenção (`DetalhesManutencaoPage.jsx`):**
    *   Exibe informações detalhadas da OS.
    *   **Edição de Informações:** Permite editar data de início/fim real, técnico responsável, descrição. O campo de status **não é editável diretamente** aqui.
    *   **Histórico do Chamado (Notas de Andamento):** Exibe e permite adicionar novas notas. Mudanças de status automáticas ou manuais (como cancelamento com motivo) são registradas.
    *   **Gerenciamento de Anexos:** Upload de múltiplos arquivos, listagem e exclusão de anexos.
    *   **Cancelamento de Manutenção:** Implementado através de um modal (`ModalCancelamento.jsx`) que exige um motivo, que é salvo no histórico.

*   **Backend Lógica (`server.js`):**
    *   **Atualização Automática de Status de Manutenção:**
        *   Função `atualizarStatusManutencoesAutomaticamente()` é chamada sob demanda nas rotas GET de manutenções e dashboard.
        *   Muda status de "Agendada" para "Em Andamento" se `horaAgendamentoInicio` passou.
        *   Muda status de "Em Andamento" para "Concluída" se `horaAgendamentoFim` passou (e não há `dataFimReal`).
        *   Registra essas mudanças automáticas nas notas de andamento.
    *   **Geração de Número de OS Sequencial:**
        *   Contadores por tipo e ano (ex: `P24`) são armazenados em `db.json` na seção `osCounters`.
        *   Formato `[PrefixoTipo][Ano2Digitos]-[Sequencial4Digitos]`.
    *   **Endpoints CRUD:** Para Equipamentos, Acessórios, Manutenções.
    *   **Upload de Arquivos:** Para anexos de manutenção.
    *   **Cálculo de Dados do Dashboard:** Conforme descrito acima para contadores e gráficos.

## 6. Estrutura de Dados Principal (`db.json` - Campos Chave)

*   `equipamentos`: `id`, `modelo`, `tipo`, `setor`, `unidade`, `status` ("Ativo", "Inativo", "Pendente Instalação"), `ano_fabricacao`, `fabricante`, `data_instalacao`, `acessorios` (array de IDs ou objetos).
*   `manutencoes`: `id`, `numeroOS`, `equipamentoId`, `equipamentoNome`, `tipoManutencao`, `dataAgendamento`, `horaAgendamentoInicio`, `horaAgendamentoFim`, `descricaoProblemaServico`, `tecnicoResponsavel`, `status` ("Agendada", "Em Andamento", "Concluída", "Cancelada"), `dataInicioReal`, `dataFimReal`, `notasAndamento` (array de objetos `{data, nota, origem?, statusAnterior?, statusNovo?}`), `arquivosAnexados` (array de objetos).
*   `acessorios`: `id`, `equipamentoId`, `nome`, `numeroSerie`, `descricao`, `dataCriacao`.
*   `osCounters`: Objeto com chaves como "P24", "C24" e valores sendo o último número sequencial usado.
*   `dashboardData`: Estrutura para os dados do dashboard, incluindo `statusEquipamentos` (com `labels`, `data`, `colorsLight`, etc.).

## 7. Metodologias e Abordagens de Desenvolvimento

*   **Desenvolvimento Iterativo e Incremental:** Funcionalidades são adicionadas e refinadas em etapas.
*   **Componentização (React):** Uso de componentes reutilizáveis para UI e lógica.
*   **Estado Centralizado vs. Local:** Estado gerenciado localmente nos componentes, com comunicação via props e callbacks. Para aplicações maiores, `Context API` ou `Redux/Zustand` poderiam ser considerados.
*   **API RESTful:** Backend expõe uma API REST para o frontend consumir.
*   **Persistência Simples (LowDB):** Uso de `lowdb` para uma solução de banco de dados baseada em arquivo JSON, adequada para desenvolvimento e prototipagem rápida.
*   **Abordagem Híbrida para Atualização de Status:** Combinação de atualização sob demanda no backend e polling no frontend.

## 8. Próximos Passos Sugeridos e Pontos de Atenção

1.  **Card "Contratos Vencendo":** Implementar a lógica no backend para calcular e exibir o número real de contratos próximos do vencimento.
2.  **Página de Contratos:** Desenvolver a UI e CRUD completo para gerenciamento de contratos.
3.  **Aprimoramento da Página de Detalhes da Manutenção:**
    *   Adicionar botões explícitos para "Iniciar Manutenção Manualmente" e "Concluir Manutenção Manualmente", que permitiriam ao usuário registrar `dataInicioReal` e `dataFimReal` e, consequentemente, mudar o status (com registro no histórico).
    *   Possibilidade de editar notas de andamento ou anexar arquivos a notas específicas.
4.  **Página de Equipamentos - Acessórios:**
    *   Implementar a funcionalidade completa de **Editar Acessório** (atualmente placeholder no `AcessoriosDaLinha`).
5.  **Alertas:**
    *   Refinar a lógica de geração de alertas (ex: contratos vencendo, equipamentos inativos há muito tempo).
    *   Criar uma página dedicada para "Alertas" com mais detalhes e opções de gerenciamento (marcar como lido, arquivar).
6.  **Validação Avançada:** Implementar validação mais robusta em todos os formulários (frontend e backend).
7.  **Autenticação e Autorização:** Se o sistema for multiusuário ou precisar de segurança.
8.  **Relatórios:** Definir e implementar a página de relatórios.
9.  **Testes:** Escrever testes unitários e de integração.
10. **Otimizações:**
    *   Para o filtro de "Equipamento" na `ManutencoesPage`, se a lista de equipamentos se tornar muito grande, considerar um componente de autocomplete com busca no backend em vez de carregar todos os equipamentos no frontend.
    *   Revisar performance de chamadas de API e renderizações.
11. **UX/UI:**
    *   Substituir todos os `window.alert()` e `window.confirm()` por modais ou toasts customizados para uma experiência de usuário mais coesa.
    *   Considerar feedback de "loading" mais granular para ações específicas (ex: ao salvar um formulário pequeno dentro de uma página maior).

## 9. Arquivos Chave a Consultar para o Estado Atual

*   `backend-dashboard/server.js`
*   `backend-dashboard/db.json` (para entender a estrutura dos dados)
*   `frontend-dashboard/src/App.jsx` (Rotas)
*   `frontend-dashboard/src/services/api.js`
*   `frontend-dashboard/src/pages/DashboardPage.jsx`
*   `frontend-dashboard/src/pages/EquipamentosPage.jsx`
*   `frontend-dashboard/src/pages/ManutencoesPage.jsx`
*   `frontend-dashboard/src/pages/DetalhesManutencaoPage.jsx`
*   `frontend-dashboard/src/components/ModalCancelamento.jsx`
*   `frontend-dashboard/src/components/DonutChart.jsx`
*   `frontend-dashboard/src/components/BarChart.jsx`
*   `frontend-dashboard/src/index.css` (para estilos globais e específicos)

---