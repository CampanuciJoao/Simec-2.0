Documento de Arquitetura de Software: SIMEC v1.0
1. Sumário Executivo
Este documento detalha a arquitetura técnica, as tecnologias empregadas e as convenções de design para o SIMEC (Sistema de Gestão de Engenharia Clínica). O sistema é uma aplicação web full-stack, construída com uma API RESTful em Node.js/Express/Prisma no backend e uma Single Page Application (SPA) em React/Vite no frontend.
O objetivo deste documento é servir como a "fonte da verdade" para a equipe de desenvolvimento, garantindo consistência, facilitando a integração de novos membros e estabelecendo as melhores práticas para a evolução e manutenção do sistema.
2. Arquitetura Geral
O projeto adota uma arquitetura de microsserviços desacoplados, contidos em uma monorepo para facilitar o desenvolvimento e o gerenciamento. A comunicação entre o cliente (frontend) e o servidor (backend) é realizada exclusivamente através de uma API RESTful stateless, utilizando JSON como formato de dados e JWT (JSON Web Tokens) para autenticação.
Backend (backend-simec): Responsável pela lógica de negócio, persistência de dados no PostgreSQL via Prisma, autenticação e autorização.
Frontend (frontend-simec): Responsável por toda a interface do usuário, gerenciamento de estado do lado do cliente e interações com a API.
3. Arquitetura Detalhada do Backend (backend-simec)
3.1. Tecnologias e Dependências Chave
Dependência	Versão	Propósito
express	^5.1.0	Framework web para roteamento e middlewares.
prisma / @prisma/client	^6.9.0	ORM para interação com o banco de dados e gerenciamento de schema.
jsonwebtoken	^9.0.2	Geração e verificação de tokens de autenticação JWT.
bcryptjs	^2.4.3	Hashing seguro de senhas.
multer	^2.0.1	Middleware para upload de arquivos (multipart/form-data).
dotenv	^16.5.0	Carregamento de variáveis de ambiente a partir de um ficheiro .env.
cors	^2.8.5	Habilita o Cross-Origin Resource Sharing.
uuid	^11.1.0	Geração de identificadores únicos (UUIDs).
3.2. Estrutura de Diretórios e Ficheiros
backend-simec/
│
├── prisma/
│   ├── schema.prisma       # (IMPORTÂNCIA: CRÍTICA) Define o schema do banco de dados, modelos e relações. É a fonte canônica da verdade para a estrutura de dados.
│   └── migrations/         # Diretório gerado pelo Prisma, contém o histórico de migrações SQL.
│
├── routes/
│   ├── authRoutes.js       # Endpoints públicos para autenticação (`/login`).
│   ├── equipamentosRoutes.js # Endpoints para o recurso 'Equipamento' e sub-recursos aninhados (acessórios, anexos).
│   ├── userRoutes.js       # Endpoints para o CRUD de 'Usuário' (protegido por admin).
│   ├── dashboardRoutes.js  # Endpoint público que agrega dados para o painel principal.
│   └── ... (outros ficheiros de rota para cada recurso: `contratos`, `manutencoes`, etc.)
│
├── services/
│   ├── prismaService.js    # Inicializa e exporta uma única instância do Prisma Client, evitando múltiplas conexões.
│   ├── logService.js       # Centraliza a função `registrarLog` para auditoria.
│   └── alertasService.js   # Lógica de negócio para tarefas de fundo (geração de alertas, atualização de status).
│
├── middleware/
│   └── authMiddleware.js   # Contém os middlewares `proteger` (validação de token) e `admin` (validação de permissão).
│
├── uploads/                # Diretório físico no servidor para armazenar arquivos enviados. (Deve ser configurado no `.gitignore`).
│
├── .env                    # Ficheiro de configuração com dados sensíveis (DATABASE_URL, JWT_SECRET). (NÃO DEVE SER VERSIONADO).
├── package.json            # Manifesto do projeto Node.js, com dependências e scripts.
├── seed.js                 # Script para popular o banco de dados com dados iniciais, como o usuário administrador.
└── server.js               # Ponto de entrada da aplicação. Configura o servidor Express, middlewares e monta as rotas.
Use code with caution.
3.3. Fluxo de Vida de uma Requisição
Entrada: Uma requisição HTTP chega ao server.js.
Middlewares Globais: A requisição passa por cors() e express.json().
Roteamento: O Express direciona a requisição para o ficheiro de rota correspondente com base no caminho da URL (ex: /api/equipamentos vai para equipamentosRoutes.js).
Autenticação (Middleware de Rota): A rota chama o middleware proteger. Este valida o token JWT. Se válido, anexa os dados do usuário a req.usuario e chama next(). Caso contrário, retorna um erro 401.
Controller (Lógica da Rota): O handler da rota é executado.
Valida os dados de entrada (req.body, req.params).
Realiza o tratamento de dados (conversão de tipos, etc.).
Chama o Prisma para interagir com o banco de dados.
Chama registrarLog para auditoria, usando req.usuario.id.
Formata a resposta e a envia com res.json() ou res.status().json().
Tratamento de Erro: Blocos try...catch em cada rota capturam erros do Prisma ou da lógica de negócio e retornam uma resposta de erro 500 padronizada.
4. Arquitetura Detalhada do Frontend (frontend-simec)
4.1. Tecnologias e Dependências Chave
Dependência	Versão	Propósito
react / react-dom	^18.2.0	Biblioteca principal para a UI.
vite	^5.0.8	Ferramenta de build e servidor de desenvolvimento.
react-router-dom	^6.22.3	Para roteamento do lado do cliente (SPA).
axios		Cliente HTTP para requisições à API.
@fortawesome/react-fontawesome		Biblioteca de ícones.
chart.js / react-chartjs-2		Renderização de gráficos.
jspdf / jspdf-autotable		Geração de relatórios em PDF.
4.2. Estrutura de Diretórios e Ficheiros
frontend-simec/
│
├── public/                     # Arquivos estáticos (favicon, etc.).
│
├── src/
│   ├── assets/                 # Imagens, fontes e outros recursos importados no código.
│   │
│   ├── components/             # Componentes de UI "Burros" e reutilizáveis.
│   │   ├── AppLayout.jsx       # (IMPORTÂNCIA: ALTA) Define a estrutura visual da área logada (sidebar, header, main).
│   │   ├── ProtectedRoute.jsx  # (IMPORTÂNCIA: ALTA) Guardião que protege rotas, redirecionando se não houver autenticação.
│   │   ├── Sidebar.jsx         # Componente de navegação lateral.
│   │   ├── AcessorioForm.jsx   # Exemplo de um formulário reutilizável.
│   │   └── ... (outros: Modal, Toast, DateInput, etc.)
│   │
│   ├── contexts/               # Gerenciamento de Estado Global.
│   │   ├── AuthContext.jsx     # (IMPORTÂNCIA: CRÍTICA) Fonte da verdade para o estado de autenticação.
│   │   ├── ToastContext.jsx    # Gerencia notificações.
│   │   └── AlertasContext.jsx  # Gerencia a busca e o estado dos alertas.
│   │
│   ├── hooks/                  # Lógica de Negócio do Frontend.
│   │   ├── useEquipamentos.js  # Lógica completa para a página de equipamentos.
│   │   ├── useAuth.js          # Hook de conveniência para consumir o AuthContext.
│   │   └── ... (outros hooks para cada recurso: `useContratos`, `useManutencoes`).
│   │
│   ├── pages/                  # Componentes de Página "Inteligentes".
│   │   ├── DashboardPage.jsx   # Orquestra os componentes e dados do dashboard.
│   │   ├── LoginPage.jsx       # Página e formulário de login.
│   │   └── ... (outras páginas que correspondem a rotas).
│   │
│   ├── services/
│   │   └── api.js              # (IMPORTÂNCIA: CRÍTICA) Centraliza TODAS as chamadas Axios. Contém os interceptors.
│   │
│   ├── styles/                 # Todos os ficheiros CSS.
│   │   ├── components/         # CSS específico de componentes.
│   │   ├── pages/              # CSS específico de páginas.
│   │   ├── global.css          # Variáveis de tema (:root), resets, estilos base.
│   │   └── layout.css          # Define a estrutura principal do AppLayout.
│   │
│   ├── utils/                  # Funções auxiliares puras (sem estado).
│   │   ├── timeUtils.js        # Formatação de datas.
│   │   └── pdfUtils.js         # Geração de PDFs.
│   │
│   ├── App.jsx                 # (IMPORTÂNCIA: CRÍTICA) Define TODA a estrutura de roteamento da aplicação.
│   ├── main.jsx                # (IMPORTÂNCIA: CRÍTICA) Ponto de entrada. Renderiza o App e os Context Providers.
│   └── index.css               # Importa todos os outros ficheiros CSS na ordem correta.
│
├── .env.local                # Variáveis de ambiente do frontend (ex: VITE_API_URL).
└── package.json
Use code with caution.
4.3. Fluxo de Vida da Aplicação e Autenticação
Inicialização: O main.jsx é o ponto de entrada. Ele renderiza o <BrowserRouter> e todos os Context Providers, com o <App /> como filho.
Verificação de Sessão:
O AuthProvider é montado. Seu useEffect verifica o localStorage por um token/usuário salvo. loading é true.
O App.jsx usa useAuth(). Como loading é true, ele renderiza um spinner global, prevenindo o "flash" de conteúdo.
Renderização Pós-Verificação:
O AuthProvider termina a verificação e define loading como false.
O App.jsx re-renderiza. Agora loading é false. Ele renderiza o <Routes>.
Roteamento:
Caso 1 (Usuário não autenticado): Se a URL for /dashboard, o ProtectedRoute será acionado. Ele vê que isAuthenticated é false e renderiza um <Navigate to="/login" />, redirecionando o usuário.
Caso 2 (Usuário autenticado): Se a URL for /dashboard, o ProtectedRoute permite a passagem. Ele renderiza o <AppLayout />. O react-router-dom então renderiza o <DashboardPage /> dentro do <Outlet /> do AppLayout.
Comunicação com API:
Qualquer componente que precise de dados (ex: DashboardPage) chama uma função da services/api.js.
O interceptor de requisição do Axios anexa o token JWT.
A requisição é enviada ao backend.
Se o token expirar, o backend retorna 401. O interceptor de resposta do Axios captura o erro, limpa o localStorage e redireciona para /login, garantindo que o usuário nunca fique em um estado "logado quebrado".
5. Próximos Passos e Recomendações
Validação de Backend com Zod: Para aumentar a segurança e robustez, considerar adicionar a biblioteca Zod no backend para validar os req.body de todas as rotas POST e PUT.
Testes: Implementar testes unitários para os serviços do backend e para os hooks customizados do frontend.
Componentização: Continuar a extrair lógica e UI repetitivas para componentes e hooks reutilizáveis.