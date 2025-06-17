Documento de Arquitetura de Software: SIMEC v1.1
Data da Última Revisão: 14 de Junho de 2024
Versão: 1.1
1. Sumário Executivo
Este documento detalha a arquitetura técnica, as tecnologias empregadas e as convenções de design para o SIMEC (Sistema de Monitoramento e Gestão de Engenharia Clínica). O sistema é uma aplicação web full-stack projetada para ser uma plataforma centralizada e robusta para a gestão de equipamentos, contratos, manutenções e alertas relacionados ao parque tecnológico de uma instituição de saúde.
O objetivo deste documento é servir como a "fonte da verdade" para a equipa de desenvolvimento, garantindo consistência, facilitando a integração de novos membros e estabelecendo as melhores práticas para a evolução e manutenção do sistema. Esta versão (1.1) reflete uma arquitetura madura, com foco em responsabilidade única, automação e auditoria detalhada.
2. Requisitos Funcionais e de Negócio
O SIMEC foi projetado para atender aos seguintes requisitos chave:
Gestão de Ativos: Cadastro e gestão completa do ciclo de vida de equipamentos, incluindo acessórios e anexos (manuais, certificados).
Gestão de Contratos e Seguros: Controlo de contratos de manutenção e apólices de seguro, com alertas de vencimento.
Gestão de Manutenções: Abertura, acompanhamento e finalização de Ordens de Serviço (OS) para manutenções preventivas e corretivas.
Sistema de Alertas Proativo: Geração automática de alertas para eventos críticos (contratos a vencer, manutenções próximas).
Automação de Status: Atualização automática do status dos equipamentos com base no ciclo de vida das manutenções (ex: "Em Manutenção" quando uma OS inicia).
Auditoria Completa: Rastreabilidade total de todas as ações importantes, registando "quem, o quê, quando, de e para" cada alteração.
Relatórios e Análises: Capacidade de gerar relatórios de inventário e de atividades.
Controlo de Acesso por Função: Distinção entre utilizadores "Admin" (com acesso total) e "User" (com acesso operacional).
3. Arquitetura Geral
O projeto adota uma arquitetura de aplicação monolítica com separação lógica clara entre o frontend e o backend, contidos numa estrutura de monorepo para facilitar o desenvolvimento.
Backend (API RESTful): Um servidor Node.js com Express, responsável por toda a lógica de negócio, interações com o banco de dados e autenticação.
Frontend (Single Page Application - SPA): Uma aplicação React moderna, construída com Vite, responsável por toda a interface e experiência do utilizador.
Comunicação: A comunicação entre o cliente e o servidor é realizada exclusivamente através de uma API RESTful stateless, utilizando JSON como formato de dados.
Autenticação: A segurança é garantida por JSON Web Tokens (JWT). Após o login, o cliente recebe um token que é enviado no cabeçalho Authorization de cada requisição subsequente.
Banco de Dados: PostgreSQL, um sistema de gerenciamento de banco de dados relacional robusto e escalável.
4. Arquitetura Detalhada do Backend (backend-simec)
O backend é construído sobre uma arquitetura de serviços em camadas, projetada para clareza e manutenibilidade.
4.1. Tecnologias e Dependências Chave
Dependência	Propósito
express	Framework web para roteamento e middlewares.
prisma / @prisma/client	ORM (Object-Relational Mapper). Ferramenta principal para interação com o banco de dados, gestão de schema e migrações. É a "fonte da verdade" para a estrutura de dados.
jsonwebtoken	Geração e verificação de tokens de autenticação JWT.
bcryptjs	Hashing seguro de senhas antes de as salvar no banco.
multer	Middleware para processamento de uploads de ficheiros (multipart/form-data).
cors	Habilita o Cross-Origin Resource Sharing, permitindo que o frontend aceda à API.
dotenv	Carregamento de variáveis de ambiente (ex: DATABASE_URL, JWT_SECRET).
4.2. Estrutura de Diretórios e Ficheiros
backend-simec/
│
├── prisma/
│   ├── schema.prisma       # (CRÍTICO) Define todos os modelos, campos e relações do banco de dados.
│   └── migrations/         # Histórico de migrações SQL gerado pelo Prisma.
│
├── routes/
│   ├── authRoutes.js       # Endpoints públicos para autenticação (`/login`).
│   ├── equipamentosRoutes.js # CRUD de Equipamentos e seus sub-recursos (Acessórios, Anexos).
│   ├── manutencoesRoutes.js  # CRUD de Manutenções e rotas de ação (concluir, cancelar, notas).
│   ├── auditoriaRoutes.js  # Endpoint para consultar o log de auditoria detalhado.
│   └── ... (ficheiros de rota para cada recurso: contratos, seguros, etc.)
│
├── services/
│   ├── prismaService.js    # Exporta uma única instância global do Prisma Client.
│   ├── alertasService.js   # (CRÍTICO) Lógica de automação que roda em segundo plano para gerar alertas e atualizar status.
│   └── logService.js       # Centraliza a função `registrarLog` para a auditoria detalhada.
│
├── middleware/
│   └── authMiddleware.js   # Contém os middlewares `proteger` (valida o token JWT) e `admin` (valida a role).
│
├── uploads/                # Diretório físico onde os ficheiros enviados são armazenados.
│
├── .env                    # Ficheiro de configuração com dados sensíveis. (NÃO VERSIONADO)
└── server.js               # Ponto de entrada: configura o Express, middlewares e monta as rotas.
Use code with caution.
4.3. Fluxos Importantes
Fluxo de Autenticação:
O utilizador envia username e senha para POST /api/auth/login.
O servidor verifica as credenciais no banco de dados.
Se válidas, gera um JWT contendo id, nome e role do utilizador.
Retorna o token e o objeto usuario para o frontend.
Fluxo de Requisição Protegida:
O frontend envia uma requisição (ex: GET /api/manutencoes).
O middleware proteger intercepta a requisição.
Valida o token JWT e busca o utilizador no banco.
Anexa o objeto do utilizador a req.usuario.
Se a rota exige admin (ex: DELETE /...), o middleware admin verifica req.usuario.role.
A lógica da rota é executada.
Fluxo de Auditoria (Exemplo: Atualizar Manutenção):
O frontend envia os novos dados para PUT /api/manutencoes/:id.
A rota busca o estado antigo da manutenção no banco.
Compara cada campo do estado antigo com os novos dados.
Para cada campo alterado, chama a função registrarLog, passando o id do autor, o nome do campo e os valores antigo e novo.
Salva as alterações na manutenção.
5. Arquitetura Detalhada do Frontend (frontend-simec)
O frontend é uma SPA reativa e otimizada, construída com uma arquitetura de componentes e hooks para máxima reutilização de código e separação de responsabilidades.
5.1. Tecnologias e Dependências Chave
Dependência	Propósito
react / react-dom	Biblioteca principal para a construção da UI.
vite	Ferramenta de build e servidor de desenvolvimento de alta performance.
react-router-dom	Para roteamento do lado do cliente (SPA).
axios	Cliente HTTP para todas as requisições à API, configurado com interceptores.
@fortawesome/react-fontawesome	Biblioteca de ícones.
chart.js / react-chartjs-2	Renderização de gráficos no dashboard.
5.2. Estrutura de Diretórios e Ficheiros
frontend-simec/
│
├── src/
│   ├── assets/             # Imagens, fontes, etc.
│   │
│   ├── components/         # Componentes de UI "Burros" e reutilizáveis (Botões, Modais, Formulários).
│   │   ├── AppLayout.jsx   # (ALTA IMPORTÂNCIA) Estrutura visual da área logada (sidebar, header).
│   │   ├── ProtectedRoute.jsx # Guardião de rotas autenticadas.
│   │   ├── GlobalFilterBar.jsx # Barra de filtros reutilizável.
│   │   └── ... (ManutencaoForm.jsx, EquipamentoForm.jsx, etc.)
│   │
│   ├── contexts/           # Gestão de Estado Global.
│   │   ├── AuthContext.jsx # (CRÍTICO) Fonte da verdade para o estado de autenticação (user, isAuthenticated).
│   │   ├── ToastContext.jsx # Gestor de notificações.
│   │   └── AlertasContext.jsx # Busca e armazena os alertas do sistema em background.
│   │
│   ├── hooks/              # Lógica de Negócio do Frontend ("Componentes sem UI").
│   │   ├── useManutencoes.js # Lógica completa para a página de manutenções (busca, filtros, ordenação).
│   │   ├── useEquipamentos.js # Lógica completa para a página de equipamentos.
│   │   └── ... (hooks para cada recurso: `useContratos`, `useUnidades`, etc.)
│   │
│   ├── pages/              # Componentes de Página "Inteligentes" que orquestram a UI.
│   │   ├── DashboardPage.jsx
│   │   ├── ManutencoesPage.jsx # Consome o useManutencoes e renderiza a tabela e filtros.
│   │   ├── DetalhesManutencaoPage.jsx # Consome useManutencaoDetalhes e renderiza as seções.
│   │   └── ...
│   │
│   ├── services/
│   │   └── api.js          # (CRÍTICO) Centraliza TODAS as chamadas Axios. Contém os interceptores.
│   │
│   ├── utils/              # Funções auxiliares puras (formatação de data, etc.).
│   │
│   ├── App.jsx             # (CRÍTICO) Define TODA a estrutura de roteamento da aplicação com <Routes>.
│   └── main.jsx            # Ponto de entrada. Renderiza o App e os Context Providers.
│
└── vite.config.js          # Configuração do Vite, incluindo aliases de caminho.
Use code with caution.
5.3. Fluxos Importantes
Fluxo de Renderização de uma Página de Lista (ex: Manutenções):
O utilizador navega para /manutencoes.
App.jsx renderiza o ManutencoesPage.
ManutencoesPage chama o hook useManutencoes().
useManutencoes faz a chamada à API getManutencoes(), define loading como true.
A página renderiza um spinner de carregamento.
A API responde, o hook atualiza o seu estado com os dados e define loading como false.
A página re-renderiza, agora com a tabela preenchida.
Um useEffect na página configura um setInterval para chamar a função refetch do hook a cada 30 segundos, mantendo os dados atualizados.
Fluxo de Edição e Atualização da UI:
Na ManutencoesPage, o utilizador clica em "Editar".
É redirecionado para /manutencoes/editar/:id.
A SalvarManutencaoPage é montada. Ela busca os dados daquela OS específica.
O utilizador faz as alterações e clica em "Salvar".
A SalvarManutencaoPage chama a API updateManutencao().
Após o sucesso, ela usa navigate('/manutencoes', { state: { refresh: true } }) para voltar.
A ManutencoesPage é montada novamente. O seu useEffect deteta location.state.refresh, chama imediatamente a função refetch do hook, e a tabela é renderizada com os dados atualizados instantaneamente.