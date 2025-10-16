Sistema de PDV - Pão do Céu (Backend)

Bem-vindo ao repositório do backend do Pão do Céu, um sistema de Ponto de Venda (PDV) completo para lanchonetes, padarias e pequenas cafeterias, construído com Node.js, Express, TypeScript e Prisma.

Funcionalidades Principais

Autenticação: Sistema de login seguro com JWT e perfis de usuário (Admin/Atendente).

Gestão de Cardápio: CRUD completo para Produtos e Categorias.

Controle de Vendas: Criação de pedidos, processamento de pagamentos e baixa automática de estoque.

Relatórios: Geração de relatórios de vendas por período, produto e categoria.

Segurança: Senhas criptografadas com bcrypt e rotas protegidas por middlewares.

1. Pré-requisitos

Antes de começar, certifique-se de ter instalado em sua máquina:

Node.js (versão 18.x ou superior)

npm ou Yarn

Docker (para o banco de dados PostgreSQL)

Um cliente de API como Postman ou Insomnia

2. Instalação e Configuração

Siga os passos abaixo para rodar o projeto localmente.

Passo 1: Clonar o Repositório

git clone <url-do-seu-repositorio>
cd paodoceu-backend


Passo 2: Instalar Dependências

npm install


Passo 3: Configurar o Banco de Dados com Docker

Execute o comando abaixo no terminal para iniciar um container Docker com uma instância do PostgreSQL:

docker run --name paodoceu-db -e POSTGRES_USER=docker -e POSTGRES_PASSWORD=docker -e POSTGRES_DB=paodoceu -p 5432:5432 -d postgres


Este comando cria um banco chamado paodoceu com o usuário e senha docker.

Passo 4: Configurar Variáveis de Ambiente

Crie um arquivo .env na raiz do projeto, copiando o conteúdo do .env.example. Ele deve ficar assim:

# Arquivo: .env

# Banco de Dados
DATABASE_URL="postgresql://docker:docker@localhost:5432/paodoceu?schema=public"

# Autenticação (JWT)
JWT_SECRET="SEGREDO_SUPER_SEGURO_PARA_PRODUCAO"
JWT_EXPIRES_IN="1d"


Importante: Para produção, altere o JWT_SECRET para uma chave complexa e segura.

Passo 5: Rodar as Migrações e Popular o Banco

Execute os comandos do Prisma para criar as tabelas no banco de dados e popular com dados iniciais (usuário admin, categorias e produtos):

# Aplica as migrações para criar a estrutura do banco
npx prisma migrate dev

# Executa o script de seed para popular o banco
npx prisma db seed


Após o seed, você terá um usuário admin@paodoceu.com com a senha admin123.

3. Executando a Aplicação

Para iniciar o servidor de desenvolvimento, execute:

npm run dev


O servidor estará rodando em http://localhost:3333. Você pode acessar esta URL no navegador para ver a mensagem de status da API.

4. Estrutura do Projeto

/
├── prisma/
│   ├── migrations/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── controllers/
│   ├── dtos/
│   ├── middlewares/
│   ├── routes/
│   ├── services/
│   ├── types/
│   ├── app.ts
│   └── server.ts
├── .env
├── package.json
└── tsconfig.json


Este guia fornece tudo que você precisa para começar a desenvolver e testar o sistema Pão do Céu. Para mais detalhes sobre os endpoints, consulte o arquivo API_DOCS.md.