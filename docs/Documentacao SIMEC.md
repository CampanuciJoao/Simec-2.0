Documentação Técnica Detalhada – Sistema SIMEC
1. Visão Geral e Filosofia de Design

O SIMEC foi desenvolvido como um Single-Page Application (SPA) em React, consumindo uma API RESTful em Node.js/Express. A arquitetura foi projetada com foco em:

Modularidade: Cada funcionalidade (Equipamentos, Contratos, etc.) é tratada como um módulo autocontido, com suas próprias rotas, serviços e componentes.

Separação de Responsabilidades (SoC): A lógica de negócio (backend), a lógica de apresentação (React) e a lógica de estado (hooks e contextos) são claramente separadas.

Reutilização de Código: Componentes de UI (modais, formulários, inputs) e lógicas de dados (hooks customizados) foram criados para serem reutilizados em toda a aplicação, evitando duplicação.

Escalabilidade: A estrutura permite a fácil adição de novos módulos sem impactar os existentes.

2. Arquitetura do Backend (backend-dashboard)

O backend é responsável por toda a lógica de negócio, persistência de dados e segurança.

2.1. Estrutura Detalhada de Arquivos
backend-dashboard/
├── node_modules/       # Dependências do projeto
├── middleware/
│   └── authMiddleware.js # "Porteiro" da aplicação: verifica o token JWT e as permissões de admin
├── routes/
│   ├── acessoriosRoutes.js  # Endpoints para CRUD de acessórios (aninhado em equipamentos)
│   ├── alertasRoutes.js     # Endpoints para ler e atualizar status de alertas
│   ├── auditoriaRoutes.js   # Endpoint para administradores visualizarem o log de auditoria
│   ├── contratosRoutes.js   # Endpoints para CRUD de Contratos
│   ├── dashboardRoutes.js   # Endpoint para consolidar os dados da página principal
│   ├── equipamentosRoutes.js# Endpoints para CRUD de Equipamentos e seus anexos/acessórios
│   ├── manutencoesRoutes.js # Endpoints para CRUD de Manutenções e suas notas/anexos
│   ├── relatoriosRoutes.js  # Endpoint para gerar relatórios complexos
│   ├── segurosRoutes.js     # Endpoints para CRUD de Seguros
│   └── userRoutes.js        # Endpoints para gerenciamento de usuários (acesso de admin)
├── services/
│   ├── alertasService.js    # Lógica de negócio para gerar alertas dinâmicos e atualizar status de OS
│   ├── dbService.js         # Configuração e instância do 'lowdb', abstraindo o acesso ao db.json
│   ├── logService.js        # Função centralizada 'registrarLog' para a auditoria
│   └── timeService.js       # Serviço para obter a data/hora atual, permitindo mockar para testes
├── uploads/
│   ├── equipamentos/        # Diretório para salvar anexos de equipamentos
│   ├── manutencoes/         # Diretório para salvar anexos de manutenções
│   └── seguros/             # Diretório para salvar anexos de seguros (apólices)
├── .env                  # (Se aplicável) Para variáveis de ambiente como JWT_SECRET e DATABASE_URL
├── db.json               # Arquivo que atua como banco de dados
├── package.json          # Definições e dependências do projeto
├── package-lock.json     # Lockfile de dependências
├── seed.js               # Script para criar o primeiro usuário administrador
└── server.js             # Ponto de entrada: configura o Express, registra middlewares e rotas

2.2. Fluxo de uma Requisição

Uma requisição chega ao server.js.

Ela passa pelos middlewares globais (cors, express.json).

O Express direciona a requisição para o arquivo de rotas apropriado com base na URL (ex: /api/equipamentos vai para equipamentosRoutes.js).

O middleware proteger (de authMiddleware.js) é executado primeiro para rotas protegidas. Ele valida o token JWT. Se o token for válido, anexa os dados do usuário em req.usuario e chama next().

O controller da rota específica em equipamentosRoutes.js é executado.

O controller interage com os serviços (ex: dbService.js) para ler ou escrever dados.

Se for uma ação de escrita (POST, PUT, DELETE), o controller chama a função registrarLog de logService.js para gravar o evento de auditoria.

O controller envia a resposta (JSON) de volta para o cliente.

3. Arquitetura do Frontend (frontend-dashboard)

O frontend é uma SPA construída em React, focada em componentização e gerenciamento de estado reativo.

3.1. Estrutura Detalhada de Arquivos
frontend-dashboard/
├── node_modules/
├── public/               # Arquivos estáticos (favicon, etc.)
└── src/
    ├── assets/
    │   └── images/       # Logos e outras imagens da UI
    ├── components/
    │   ├── forms/        # (Sugestão) Poderia agrupar os formulários aqui
    │   ├── ui/           # (Sugestão) Poderia agrupar componentes de UI como botões, modais
    │   ├── AcessorioForm.jsx
    │   ├── AdminRoute.jsx        # "Porteiro" que só permite acesso a admins
    │   ├── AppLayout.jsx         # Layout principal da área logada (com Sidebar e Header)
    │   ├── BarChart.jsx          # Componente reutilizável para gráficos de barra
    │   ├── CollapsibleFilterBox.jsx # Caixa de filtros recolhível
    │   ├── ContratoForm.jsx
    │   ├── CurrencyInput.jsx     # Input customizado com máscara de moeda
    │   ├── DateInput.jsx         # Input customizado com máscara de data
    │   ├── DonutChart.jsx        # Componente reutilizável para gráficos de rosca
    │   ├── EquipamentoForm.jsx
    │   ├── GlobalFilterBar.jsx   # Barra de filtros reutilizável para tabelas
    │   ├── ManutencaoForm.jsx
    │   ├── Modal.jsx             # Componente base de modal (se houver)
    │   ├── ModalCancelamento.jsx # Modal específico para cancelar OS
    │   ├── ModalConfirmacao.jsx  # Modal genérico para ações de confirmação
    │   ├── ProtectedRoute.jsx    # "Porteiro" que só permite acesso a usuários logados
    │   ├── RelatorioResultado.jsx# Componente que renderiza a tabela de resultados dos relatórios
    │   ├── SeguroForm.jsx
    │   ├── Sidebar.jsx           # Barra de navegação lateral
    │   ├── TimeInput.jsx         # Input customizado com máscara de hora
    │   ├── Toast.jsx             # Componente de notificação individual
    │   └── ToastContainer.jsx    # Container que gerencia e exibe os Toasts
    ├── contexts/
    │   ├── AlertasContext.jsx    # Gerencia o estado e a lógica dos alertas em toda a aplicação
    │   ├── AuthContext.jsx       # Gerencia o estado de autenticação (usuário, token) e as funções de login/logout
    │   └── ToastContext.jsx      # Gerencia a fila de notificações (toasts)
    ├── hooks/
    │   ├── useAuditoria.js       # Encapsula a lógica de busca e filtro dos logs de auditoria
    │   ├── useContratos.js       # Encapsula a lógica para a página de Contratos
    │   ├── useEquipamentoDetalhes.js # Encapsula a lógica para a página de Detalhes de Equipamento
    │   ├── useEquipamentos.js    # Encapsula a lógica para a página de Equipamentos
    │   ├── useManutencaoDetalhes.js # Encapsula a lógica para a página de Detalhes de Manutenção
    │   ├── useManutencoes.js     # Encapsula a lógica para a página de Manutenções
    │   ├── useModal.js           # Hook reutilizável para controlar o estado de modais
    │   └── useSeguros.js         # Encapsula a lógica para a página de Seguros
    ├── pages/
    │   ├── AcessoriosEquipamentoPage.jsx # (Exemplo, se existisse)
    │   ├── GerenciamentoPage.jsx  # Página mestre que contém as abas de administração
    │   ├── GerenciarUsuariosPage.jsx # Conteúdo da aba para gerenciar usuários
    │   ├── LogAuditoriaPage.jsx      # Conteúdo da aba para ver o log de auditoria
    │   ├── LoginPage.jsx           # Página pública de login
    │   ├── SalvarContratoPage.jsx  # Página unificada para Adicionar/Editar Contratos
    │   ├── SalvarEquipamentoPage.jsx # Página unificada para Adicionar/Editar Equipamentos
    │   └── SalvarManutencaoPage.jsx  # Página unificada para Agendar/Editar Manutenções
    │   └── ... (todas as outras páginas de visualização/listagem)
    ├── services/
    │   └── api.js                # Centraliza todas as chamadas 'axios' para a API do backend
    ├── styles/
    │   ├── components/           # CSS específico para cada componente reutilizável
    │   ├── layout.css            # Regras de CSS para a estrutura principal da aplicação
    │   └── pages/                # CSS específico para páginas complexas (ex: login, dashboard)
    ├── utils/
    │   ├── exportUtils.js        # (Removido, lógica agora em pdfUtils.js)
    │   ├── pdfUtils.js           # Lógica para gerar relatórios em PDF com 'jspdf'
    │   └── timeUtils.js          # Funções auxiliares para formatação de data e hora
    ├── App.jsx                   # Componente raiz, focado apenas no roteamento principal (público vs. privado)
    ├── index.css                 # Arquivo mestre que importa todos os outros arquivos CSS
    └── main.jsx                  # Ponto de entrada da aplicação React, registra os Providers de Contexto
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
IGNORE_WHEN_COPYING_END
3.2. Fluxo de Renderização e Dados

main.jsx: Renderiza a aplicação e envolve o App com todos os Context Providers (BrowserRouter, AuthProvider, AlertasProvider, ToastProvider).

App.jsx: Atua como o roteador principal. Ele usa o useAuth() para verificar se o usuário está autenticado.

Se não, renderiza a LoginPage.

Se sim, renderiza o componente AppLayout dentro de uma ProtectedRoute.

AppLayout.jsx: Renderiza o layout visual da área logada (Sidebar, cabeçalho com ações) e contém o <Routes> para as páginas internas (dashboard, equipamentos, etc.).

Página de Listagem (ex: EquipamentosPage.jsx):

A página chama seu hook customizado (ex: useEquipamentos()).

O hook é responsável por buscar os dados da API, gerenciar os estados de loading e error, e aplicar filtros/ordenação.

A página recebe os dados já processados do hook e apenas os renderiza na tabela.

Ações do usuário (como clicar em "excluir") chamam funções fornecidas pelo hook.

Página de Detalhes (ex: DetalhesEquipamentoPage.jsx):

Similarmente, usa um hook (useEquipamentoDetalhes(id)) para buscar os dados de um item específico e de seus dados relacionados (acessórios, histórico).

Gerencia o estado da UI (como a aba ativa) localmente com useState.


----------------------------------------------------------------------------------------------------------------------------------------

Documentação Técnica do Sistema SIMEC

Versão: 1.0 (18 de Junho de 2025)
Autor: João Campanuci

1. Visão Geral do Sistema

O SIMEC (Sistema de Monitoramento e Engenharia Clínica) é uma aplicação web completa, projetada para o gerenciamento de equipamentos, contratos, manutenções e outros ativos relacionados à engenharia clínica. A plataforma é dividida em duas partes principais: um Backend robusto construído com Node.js e Express, e um Frontend moderno e reativo construído com React.

O sistema foi projetado com foco em segurança, rastreabilidade e usabilidade, incluindo funcionalidades como autenticação de usuários, controle de acesso por função (Admin/User), e um sistema completo de auditoria para ações críticas.

2. Arquitetura Geral

O projeto segue uma arquitetura cliente-servidor desacoplada:

Backend (Servidor API RESTful):

Responsável por toda a lógica de negócio, interações com o banco de dados e segurança.

Expõe uma série de endpoints RESTful que o frontend consome.

Utiliza Node.js com Express.js para a criação do servidor.

Os dados são persistidos em um arquivo db.json gerenciado pela biblioteca lowdb, ideal para prototipagem e ambientes controlados.

Frontend (Single-Page Application - SPA):

Responsável por toda a interface do usuário e experiência de navegação.

Construído com React, utilizando hooks para gerenciamento de estado e ciclo de vida.

Comunica-se com o Backend exclusivamente através de requisições HTTP (via Axios) para buscar e manipular dados.

O roteamento é gerenciado pelo react-router-dom.

3. Estrutura de Arquivos do Projeto

A estrutura de pastas foi organizada para promover a separação de responsabilidades e a manutenibilidade.

dashboard-app/
├── backend-dashboard/
│   ├── middleware/
│   │   └── authMiddleware.js      # Porteiro (protege rotas e verifica permissões)
│   ├── node_modules/
│   ├── routes/
│   │   ├── acessoriosRoutes.js
│   │   ├── alertasRoutes.js
│   │   ├── auditoriaRoutes.js
│   │   ├── contratosRoutes.js
│   │   ├── dashboardRoutes.js
│   │   ├── equipamentosRoutes.js
│   │   ├── manutencoesRoutes.js
│   │   ├── relatoriosRoutes.js
│   │   ├── segurosRoutes.js
│   │   └── userRoutes.js
│   ├── services/
│   │   ├── alertasService.js      # Lógica para gerar alertas dinâmicos
│   │   ├── dbService.js           # Configuração e instância do lowdb
│   │   ├── logService.js          # Função centralizada para registrar logs
│   │   └── timeService.js         # Serviço para mockar o tempo em testes
│   ├── uploads/                   # Pasta para armazenar arquivos enviados
│   │   ├── equipamentos/
│   │   └── manutencoes/
│   ├── db.json                    # Banco de dados em arquivo
│   ├── package.json
│   ├── package-lock.json
│   ├── seed.js                    # Script para criar o usuário admin inicial
│   └── server.js                  # Ponto de entrada do backend
│
└── frontend-dashboard/
    ├── node_modules/
    ├── public/
    └── src/
        ├── assets/
        │   └── images/
        │       ├── logo-simec.png
        │       └── iconepdf.png
        ├── components/
        │   ├── AcessorioForm.jsx
        │   ├── AdminRoute.jsx         # Porteiro para rotas de admin
        │   ├── AppLayout.jsx          # Layout principal da área logada
        │   ├── BarChart.jsx
        │   ├── CollapsibleFilterBox.jsx # Caixa de filtros recolhível
        │   ├── ContratoForm.jsx
        │   ├── CurrencyInput.jsx      # Input customizado para moeda
        │   ├── DateInput.jsx          # Input customizado para data
        │   ├── DonutChart.jsx
        │   ├── EquipamentoForm.jsx
        │   ├── GlobalFilterBar.jsx    # Barra de filtros reutilizável
        │   ├── Modal.jsx
        │   ├── ModalCancelamento.jsx
        │   ├── ModalConfirmacao.jsx
        │   ├── ProtectedRoute.jsx     # Porteiro para rotas logadas
        │   ├── RelatorioResultado.jsx
        │   ├── SeguroForm.jsx
        │   ├── Sidebar.jsx
        │   ├── TimeInput.jsx          # Input customizado para hora
        │   ├── Toast.jsx
        │   └── ToastContainer.jsx
        ├── contexts/
        │   ├── AlertasContext.jsx
        │   ├── AuthContext.jsx
        │   └── ToastContext.jsx
        ├── hooks/
        │   ├── useAuditoria.js
        │   ├── useContratos.js
        │   ├── useEquipamentoDetalhes.js
        │   ├── useEquipamentos.js
        │   ├── useManutencaoDetalhes.js
        │   ├── useManutencoes.js
        │   ├── useModal.js
        │   └── useSeguros.js
        ├── pages/
        │   ├── GerenciamentoPage.jsx  # Página mestre para as abas de admin
        │   ├── GerenciarUsuariosPage.jsx
        │   ├── LogAuditoriaPage.jsx
        │   ├── LoginPage.jsx
        │   ├── RelatoriosPage.jsx
        │   ├── SalvarContratoPage.jsx   # Página unificada para Adicionar/Editar
        │   ├── SalvarEquipamentoPage.jsx
        │   └── SalvarManutencaoPage.jsx
        │   # ... e todas as outras páginas de listagem e detalhes ...
        ├── services/
        │   └── api.js                 # Centraliza todas as chamadas Axios
        ├── styles/
        │   ├── components/
        │   │   └── ... (CSS para cada componente)
        │   ├── pages/
        │   │   └── ... (CSS para cada página)
        │   ├── global.css             # Variáveis de tema e estilos globais
        │   └── layout.css
        ├── utils/
        │   ├── exportUtils.js         # Lógica de exportação para CSV (legado)
        │   ├── pdfUtils.js            # Lógica de exportação para PDF
        │   └── timeUtils.js           # Funções para formatar data/hora
        ├── App.jsx                    # Roteador principal da aplicação
        ├── index.css                  # Ponto de entrada do CSS (@import)
        └── main.jsx                   # Ponto de entrada do React

4. Funcionalidades Implementadas
4.1. Backend

Autenticação JWT: Sistema seguro de login com username e senha, gerando tokens com tempo de expiração.

Segurança de Senhas: As senhas são criptografadas com bcryptjs antes de serem salvas.

Middleware de Proteção: Rotas críticas são protegidas e só podem ser acessadas com um token JWT válido.

Controle de Acesso por Função (RBAC): Middleware admin que restringe certas rotas (como gerenciamento de usuários) apenas a usuários com role: 'admin'.

CRUD Completo: Endpoints para Criar, Ler, Atualizar e Deletar (CRUD) para os principais módulos: Equipamentos, Manutenções, Contratos, Seguros e Usuários.

Geração de Relatórios: Rota /api/relatorios/gerar que processa dados no servidor e retorna resultados formatados para diferentes tipos de relatório.

Log de Auditoria: Um serviço centralizado (logService.js) registra ações importantes (criação, edição, exclusão) em um log persistente, incluindo quem fez, o quê e quando.

Tarefas Agendadas: Um setInterval no server.js executa tarefas de fundo, como a geração de alertas, de forma proativa.

4.2. Frontend

Arquitetura de Hooks: A lógica de dados de cada página foi extraída para hooks customizados (ex: useEquipamentos, useManutencaoDetalhes), tornando os componentes de página mais limpos e focados na UI.

Gerenciamento de Estado Global: Uso extensivo da Context API para estados que permeiam toda a aplicação, como AuthContext (usuário logado), AlertasContext (notificações) e ToastContext (mensagens de feedback).

Roteamento Protegido: Utilização de componentes "porteiros" (ProtectedRoute, AdminRoute) para gerenciar o acesso às páginas com base no status de login e na função do usuário.

Formulários Unificados: As páginas de "Adicionar" e "Editar" foram consolidadas em componentes únicos (ex: SalvarEquipamentoPage), reduzindo a duplicação de código.

Componentes Reutilizáveis: Criação de um rico conjunto de componentes de UI, como modais, inputs customizados com máscara (DateInput, CurrencyInput), e barras de filtro, promovendo consistência visual e funcional.

Design Responsivo: A aplicação se adapta a diferentes tamanhos de tela (desktop, tablet, mobile) através de Media Queries, com uma sidebar recolhível e layouts que se empilham verticalmente.

Dashboard Interativo: O gráfico de status do dashboard é clicável, permitindo uma navegação "drill-down" para a lista de equipamentos já filtrada.

Exportação para PDF: Funcionalidade avançada para gerar relatórios em PDF com cabeçalho personalizado, tabelas formatadas e paginação.

5. Requisitos e Dependências
5.1. Backend (backend-dashboard/package.json)

express: Framework do servidor web.

cors: Habilita o compartilhamento de recursos entre origens diferentes (essencial para a comunicação com o frontend).

lowdb: Para persistência de dados em um arquivo JSON.

jsonwebtoken: Para criar e verificar tokens de autenticação.

bcryptjs: Para criptografar e comparar senhas.

multer: Para lidar com upload de arquivos.

uuid: Para gerar IDs únicos.

5.2. Frontend (frontend-dashboard/package.json)

react, react-dom: Biblioteca principal e renderizador.

react-router-dom: Para roteamento no lado do cliente.

axios: Para fazer requisições HTTP para o backend.

@fortawesome/react-fontawesome: Para iconografia.

chart.js, react-chartjs-2: Para a criação de gráficos.

jspdf, jspdf-autotable: Para a geração de relatórios em PDF.

6. Fluxos de Trabalho Notáveis

Fluxo de Autenticação: LoginPage -> api.js chama loginUsuario -> AuthContext salva o token e o usuário -> ProtectedRoute libera o acesso ao AppLayout.

Fluxo de Gerenciamento de Dados: PaginaDeLista -> usa hook customizado -> api.js busca dados -> PaginaDeLista renderiza a tabela.

Fluxo de Auditoria: Rota do Backend (ex: POST /equipamentos) -> logService.js é chamado -> db.json é atualizado -> LogAuditoriaPage busca e exibe os logs.

