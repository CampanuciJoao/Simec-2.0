# Documenta��o do Projeto: Dashboard de Gerenciamento de Manuten��o

**�ltima Atualiza��o:** 31 de maio de 2024

**Autor:** Jo�o Marcos Campanuci Almeida

### 1. Vis�o Geral do Projeto

Este projeto visa desenvolver um sistema de gerenciamento de manuten��o de equipamentos, composto por um frontend interativo constru�do com React e um backend API constru�do com Node.js e Express. Atualmente, o foco tem sido na constru��o da p�gina principal do Dashboard, tornando-a din�mica atrav�s do consumo de dados de uma API backend que utiliza `lowdb` para persist�ncia de dados em um arquivo JSON.

### 2. Tecnologias Utilizadas

**2.1. Frontend (`frontend-dashboard`)**

*   **JavaScript (ES6+):** Linguagem principal para a l�gica do frontend.
*   **React (v18+):** Biblioteca JavaScript para construir interfaces de usu�rio componentizadas.
    *   **Hooks (`useState`, `useEffect`):** Para gerenciamento de estado local e efeitos colaterais (como busca de dados).
*   **Vite:** Ferramenta de build moderna e r�pida para projetos frontend. Utilizada para criar e servir o projeto React durante o desenvolvimento.
*   **HTML5:** Estrutura base das p�ginas.
*   **CSS3:** Estiliza��o da interface do usu�rio.
    *   **Flexbox:** Utilizado extensivamente para layout responsivo dos componentes.
*   **`react-router-dom` (v6+):** Biblioteca para gerenciamento de rotas no lado do cliente (SPA - Single Page Application).
*   **`axios`:** Cliente HTTP baseado em Promises para fazer requisi��es � API backend.
*   **Font Awesome:** Biblioteca de �cones vetoriais para melhorar a interface visual.

**2.2. Backend (`backend-dashboard`)**

*   **Node.js (v22.16.0 utilizado durante o desenvolvimento):** Ambiente de execu��o JavaScript no lado do servidor.
*   **Express.js (v4+):** Framework web minimalista para Node.js, utilizado para construir a API RESTful.
*   **`cors`:** Middleware para habilitar Cross-Origin Resource Sharing, permitindo que o frontend (em uma porta diferente) acesse a API.
*   **`lowdb` (v7+):** Biblioteca para criar um banco de dados simples utilizando um arquivo JSON. Usada para simula��o de persist�ncia de dados nesta fase inicial.
*   **M�dulos ES (ESM):** Utilizada a sintaxe `import`/`export` no backend, habilitada pela configura��o `"type": "module"` no `package.json` do backend.

**2.3. Ferramentas de Desenvolvimento**

*   **Visual Studio Code (VS Code):** Editor de c�digo principal.
*   **npm (Node Package Manager):** Gerenciador de pacotes para Node.js, utilizado para instalar e gerenciar depend�ncias tanto no frontend quanto no backend.
*   **Terminal/Linha de Comando:** (PowerShell utilizado durante o desenvolvimento) Para executar comandos npm, iniciar servidores, etc.
*   **Navegador Web (Chrome, Firefox, etc.):** Com Ferramentas do Desenvolvedor (F12) para debugging, inspe��o de elementos, console e rede.

### 3. Estrutura do Projeto

O projeto est� organizado em duas pastas principais no diret�rio raiz (ex: `dashboard-app/`):
Use code with caution.
dashboard-app/
├── frontend-dashboard/ # Projeto React (Vite)
│ ├── public/ # Assets estáticos (favicons, etc. - index.html principal está na raiz do projeto Vite)
│ ├── src/ # Código fonte do frontend
│ │ ├── assets/ # (Não utilizado ativamente até o momento)
│ │ ├── components/ # Componentes React reutilizáveis (ex: Sidebar.jsx)
│ │ ├── pages/ # Componentes React que representam páginas (ex: DashboardPage.jsx)
│ │ ├── services/ # Funções para interagir com a API (ex: api.js)
│ │ ├── App.jsx # Componente raiz da aplicação, define layout e rotas
│ │ ├── main.jsx # Ponto de entrada do React, renderiza App.jsx
│ │ └── index.css # Estilos CSS globais
│ ├── .gitignore
│ ├── index.html # Ponto de entrada HTML principal para Vite
│ ├── package.json
│ ├── vite.config.js
│ └── ... (outros arquivos de configuração)
│
└── backend-dashboard/ # Projeto Node.js/Express (API)
├── node_modules/
├── db.json # Arquivo JSON usado como banco de dados pelo lowdb
├── server.js # Arquivo principal do servidor Express
├── package.json
└── ... (outros arquivos)
### 4. Como Foi Feito (Resumo das Etapas Conclu�das)

**4.1. Configura��o Inicial e Frontend Est�tico (M�ltiplos HTMLs - Fase Anterior)**
*   O projeto iniciou com um planejamento dos requisitos e uma abordagem de frontend est�tico utilizando HTML e CSS puros para visualizar o layout do dashboard. Esta fase serviu como base para a estrutura visual.

**4.2. Migra��o para React e Cria��o da SPA (Single Page Application)**
1.  **Ambiente:** Configura��o do Node.js e npm.
2.  **Projeto React (Vite):** Cria��o da estrutura do projeto frontend com `npm create vite@latest frontend-dashboard -- --template react` (posteriormente ajustado para `npm create vite@latest` com sele��o interativa).
3.  **Depend�ncias Frontend:** Instala��o de `react-router-dom` (roteamento) e `axios` (chamadas HTTP).
4.  **Migra��o Visual:**
    *   Os estilos CSS globais foram transferidos para `src/index.css`.
    *   O arquivo `index.html` na raiz do projeto Vite foi atualizado para incluir o CDN do Font Awesome.
5.  **Componentiza��o React:**
    *   `Sidebar.jsx`: Implementado para a navega��o lateral, utilizando `NavLink` para links e estado ativo.
    *   `DashboardPage.jsx`: Criado para o conte�do principal do dashboard, inicialmente com dados est�ticos gerenciados por `useState`.
    *   `App.jsx`: Estruturado como o componente principal, organizando o layout com `Sidebar` e `main.content` (�rea de conte�do din�mico) e configurando o roteamento inicial com `react-router-dom`.
6.  **Ajustes de Layout CSS:** Foram realizadas v�rias itera��es para corrigir o alinhamento e a centraliza��o do conte�do principal. A solu��o final envolveu:
    *   O `.main-content` (item flex) para ocupar o espa�o dispon�vel e aplicar um padding geral.
    *   Um `<div className="page-content-wrapper">` dentro de cada componente de p�gina (como `DashboardPage.jsx`) para controlar a `max-width` e centralizar o conte�do efetivo da p�gina usando `margin: auto`.

**4.3. Desenvolvimento do Backend API**
1.  **Projeto Backend:** Cria��o da pasta `backend-dashboard` e inicializa��o com `npm init -y`.
2.  **Depend�ncias Backend:** Instala��o de `express`, `cors` e `lowdb@7`.
3.  **Configura��o ESM:** Adicionado `"type": "module"` ao `package.json` do backend para permitir a sintaxe de m�dulos ES6.
4.  **Servidor Express (`server.js`):**
    *   Configura��o de um servidor Express b�sico.
    *   Uso do middleware `cors()` e `express.json()`.
5.  **Banco de Dados Simulado (`db.json`):**
    *   Cria��o de um arquivo `db.json` para armazenar os dados iniciais do dashboard (contagens, alertas, dados para gr�ficos placeholder).
6.  **Integra��o `lowdb`:**
    *   Configura��o em `server.js` para ler e (futuramente) escrever no `db.json` usando `JSONFile` adapter.
    *   `await db.read()` foi usado para carregar os dados na inicializa��o do servidor.
7.  **Primeiro Endpoint da API:**
    *   Implementada a rota `GET /api/dashboard-data` para servir o objeto `dashboardData` do `db.json`.

**4.4. Conex�o Frontend-Backend**
1.  **Servi�o de API Frontend (`src/services/api.js`):**
    *   Criada a fun��o ass�ncrona `getDashboardData` utilizando `axios` para fazer a requisi��o `GET` ao endpoint `/api/dashboard-data`.
2.  **Dinamiza��o do `DashboardPage.jsx`:**
    *   Utilizado o hook `useEffect` para chamar `getDashboardData` quando o componente � montado.
    *   Os dados recebidos da API s�o usados para atualizar um estado `dashboardData` (usando `useState`).
    *   O JSX foi modificado para renderizar os valores a partir do estado `dashboardData` (ex: `dashboardData.equipamentosCount`, `dashboardData.alertas.map(...)`).
    *   Adicionada l�gica b�sica para exibir mensagens de "Carregando..." e de erro durante a busca de dados.

### 5. Como Usar/Executar o Projeto

**5.1. Backend (`backend-dashboard`)**
1.  Navegue at� a pasta `backend-dashboard` no terminal.
2.  Instale as depend�ncias (se for a primeira vez): `npm install`
3.  Inicie o servidor: `node server.js`
    *   O servidor backend rodar� em `http://localhost:5000` (ou a porta definida).

**5.2. Frontend (`frontend-dashboard`)**
1.  Abra um novo terminal.
2.  Navegue at� a pasta `frontend-dashboard`.
3.  Instale as depend�ncias (se for a primeira vez): `npm install`
4.  Inicie o servidor de desenvolvimento Vite: `npm run dev`
    *   O frontend estar� acess�vel em `http://localhost:5173` (ou a porta indicada pelo Vite).

**Nota:** O servidor backend deve estar em execu��o para que o frontend possa buscar os dados din�micos.

### 6. Pr�ximos Passos Planejados

1.  **Desenvolvimento da P�gina de Equipamentos:**
    *   **Backend:** Implementar CRUD (Create, Read, Update, Delete) para equipamentos no `db.json` via API (listar, adicionar, editar, excluir).
    *   **Frontend:** Criar `EquipamentosPage.jsx`, adicionar rota, buscar e exibir equipamentos, implementar formul�rio de adi��o/edi��o.
2.  **Desenvolvimento das Outras Se��es:** Aplicar o mesmo padr�o para "Contratos", "Alertas" e "Agendamentos".
3.  **Implementa��o de Gr�ficos Reais:** Integrar uma biblioteca de gr�ficos (ex: Chart.js) no `DashboardPage.jsx` para visualizar `statusEquipamentos` e `manutencoesPorTipoMes` de forma interativa.
4.  **Melhorias no Tratamento de Erros e Feedback ao Usu�rio:** Implementar notifica��es mais robustas.
5.  **Valida��o de Formul�rios:** Adicionar valida��o nos dados de entrada.
6.  **Refinamentos de UI/UX.**
7.  **(Avan�ado) Persist�ncia de Dados:** Avaliar a migra��o do `lowdb` para um banco de dados mais completo (SQLite, PostgreSQL, etc.) � medida que a aplica��o crescer.
8.  **(Avan�ado) Autentica��o e Autoriza��o.**

### 7. Problemas Conhecidos / Pontos de Aten��o
*   O `lowdb` realiza escrita direta no arquivo `db.json`, o que � adequado para desenvolvimento mas pode n�o ser ideal para alta concorr�ncia ou grandes volumes de dados em produ��o.
*   O tratamento de erros atual � b�sico e pode ser aprimorado.
*   A estrutura de dados para os gr�ficos no `db.json` � um exemplo e pode precisar ser adaptada para a biblioteca de gr�ficos escolhida.