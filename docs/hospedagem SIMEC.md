Plano de Implantação do SIMEC com Docker
Utilizar o Docker para hospedar a sua aplicação é uma excelente escolha. Ele garante que o seu sistema funcione da mesma forma no seu servidor como funciona na sua máquina de desenvolvimento, além de simplificar a gestão dos serviços.

O nosso plano consiste em criar três serviços principais que irão funcionar em conjunto, orquestrados pelo docker-compose:

backend-simec: Um contentor para a sua aplicação Node.js (a API).

frontend-simec: Um contentor para servir a sua aplicação React de forma otimizada para produção. Utilizaremos o Nginx, um servidor web leve e de alta performance, para esta tarefa.

postgres-db: Um contentor para o banco de dados PostgreSQL, que será a solução definitiva para substituir o db.json.

Passo 1: Criar os Dockerfiles
O Dockerfile é como uma receita de bolo para criar a imagem de um serviço. Precisamos de um para o backend e um para o frontend.

a) Dockerfile para o Backend
Crie um novo ficheiro chamado Dockerfile (sem extensão) dentro da sua pasta simec/backend-simec/.

Código para simec/backend-simec/Dockerfile:

# Usa uma imagem oficial do Node.js como base
FROM node:18-alpine

# Define o diretório de trabalho dentro do contentor
WORKDIR /usr/src/app

# Copia os ficheiros de dependências
COPY package*.json ./

# Instala as dependências da aplicação
RUN npm install

# Copia o resto dos ficheiros do seu backend para o diretório de trabalho
COPY . .

# Expõe a porta que a sua API utiliza (no seu caso, a porta 5000)
EXPOSE 5000

# O comando para iniciar a sua aplicação quando o contentor arrancar
CMD [ "npm", "start" ]

b) Dockerfile para o Frontend
Para o frontend, utilizaremos uma abordagem de multi-stage build. Isto significa que primeiro usamos um ambiente Node.js para "compilar" a sua aplicação React, e depois copiamos apenas os ficheiros estáticos finais para um servidor Nginx leve. O resultado é uma imagem final muito mais pequena e segura.

Crie um novo ficheiro chamado Dockerfile dentro da sua pasta simec/frontend-simec/.

Código para simec/frontend-simec/Dockerfile:

# --- ESTÁGIO 1: Build da Aplicação React ---
FROM node:18-alpine AS build

# Define o diretório de trabalho
WORKDIR /app

# Copia os ficheiros de dependências
COPY package*.json ./

# Instala as dependências
RUN npm install

# Copia o resto dos ficheiros da aplicação
COPY . .

# Compila a aplicação para produção
RUN npm run build

# --- ESTÁGIO 2: Servir com Nginx ---
FROM nginx:stable-alpine

# Copia os ficheiros compilados do estágio de build para a pasta padrão do Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Expõe a porta 80, que é a porta padrão do Nginx
EXPOSE 80

# O comando para iniciar o Nginx
CMD ["nginx", "-g", "daemon off;"]

Nota: Este Dockerfile assume que o seu comando para compilar o frontend é npm run build e que ele gera uma pasta dist. Se for diferente (ex: build), apenas ajuste o nome da pasta na linha COPY --from=build....

Passo 2: Criar o Ficheiro docker-compose.yml
Este é o ficheiro orquestrador. Ele define todos os seus serviços e como eles se comunicam. Crie este ficheiro na pasta raiz do seu projeto (simec/).

Código para simec/docker-compose.yml:

# Versão do docker-compose
version: '3.8'

# Definição dos serviços
services:
  # Serviço do Backend
  backend-simec:
    build: ./backend-simec
    container_name: simec_backend
    restart: unless-stopped
    ports:
      - "5000:5000"
    volumes:
      # Monta as pastas de uploads para que os ficheiros não se percam
      - ./backend-simec/uploads:/usr/src/app/uploads
      # Monta o db.json para persistência dos dados atuais
      - ./backend-simec/db.json:/usr/src/app/db.json
    depends_on:
      - postgres-db
    environment:
      # Variável de ambiente para conectar-se ao banco de dados PostgreSQL
      - DATABASE_URL=postgresql://user:password@postgres-db:5432/simec_db

  # Serviço do Frontend
  frontend-simec:
    build: ./frontend-simec
    container_name: simec_frontend
    restart: unless-stopped
    ports:
      # Mapeia a porta 80 do contentor para a porta 80 do seu servidor
      - "80:80" 

  # Serviço do Banco de Dados PostgreSQL
  postgres-db:
    image: postgres:14-alpine
    container_name: simec_postgres_db
    restart: unless-stopped
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=simec_db
    ports:
      # Expõe a porta do PostgreSQL para o seu servidor (útil para debug)
      - "5432:5432"
    volumes:
      # Garante que os dados do banco de dados sejam persistidos no seu servidor
      - postgres_data:/var/lib/postgresql/data

# Define um volume nomeado para a persistência dos dados do PostgreSQL
volumes:
  postgres_data:

Atenção: Lembre-se de alterar o user e password do banco de dados para algo mais seguro.

Próximos Passos (Quando estiver pronto para hospedar)
Ajustar o Frontend: Será necessário alterar a API_BASE_URL no seu ficheiro api.js do frontend para que, em produção, ela não aponte mais para localhost:5000, mas sim para o endereço do seu servidor (ex: http://seu-dominio.com/api).

Mudar o Backend para PostgreSQL: Antes de usar estes ficheiros em produção, precisaremos concluir a migração do seu backend de lowdb para Prisma e PostgreSQL, como discutimos anteriormente.

Construir e Executar: Com os ficheiros no lugar, basta navegar até à pasta simec/ no seu servidor e executar o comando docker-compose up -d. O Docker irá encarregar-se de construir as imagens e iniciar todos os serviços.

Guarde este documento. Quando estiver pronto para fazer a hospedagem, podemos seguir cada um destes passos detalhadamente.