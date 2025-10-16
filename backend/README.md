# 🥖 Pão do Céu — Sistema de PDV (Backend)

Bem-vindo ao **Pão do Céu**, um sistema de **Ponto de Venda (PDV)** moderno e completo, desenvolvido para **lanchonetes, padarias e pequenas cafeterias**.  
Este é o **backend** da aplicação, construído com **Node.js**, **Express**, **TypeScript** e **Prisma ORM**.

---

## ⚙️ Pré-requisitos

Antes de começar, certifique-se de ter os seguintes itens instalados na sua máquina:

| Ferramenta | Versão Requerida | Link de Instalação |
|-------------|------------------|--------------------|
| **Node.js** | 18.x ou superior | [nodejs.org](https://nodejs.org/) |
| **npm** ou **Yarn** | Última versão | [npmjs.com](https://www.npmjs.com/) / [yarnpkg.com](https://yarnpkg.com/) |
| **Docker** | Última versão | [docker.com](https://www.docker.com/) |
| **Cliente de API** | (Opcional) | [Postman](https://www.postman.com/) / [Insomnia](https://insomnia.rest/) |

Verifique se o Docker está em execução antes de prosseguir com o setup do banco de dados.

---

## 🧭 Instalação e Configuração

### 1️⃣ Clonar o Repositório

```bash
git clone https://github.com/seu-usuario/paodoceu-backend.git
cd paodoceu-backend
```

---

### 2️⃣ Instalar Dependências

Instale as dependências do projeto utilizando **npm**:

```bash
npm install
```

Ou, se preferir, utilizando **yarn**:

```bash
yarn install
```

---

### 3️⃣ Configurar o Banco de Dados com Docker

Execute o comando abaixo para criar e iniciar um container com **PostgreSQL**:

```bash
docker run --name paodoceu-db   -e POSTGRES_USER=docker   -e POSTGRES_PASSWORD=docker   -e POSTGRES_DB=paodoceu   -p 5432:5432 -d postgres
```

> 💡 Esse comando cria um banco chamado `paodoceu` com usuário e senha `docker`.

---

### 4️⃣ Criar o Arquivo `.env`

Crie um arquivo `.env` na raiz do projeto com o seguinte conteúdo:

```env
# Banco de Dados
DATABASE_URL="postgresql://docker:docker@localhost:5432/paodoceu?schema=public"

# Autenticação JWT
JWT_SECRET="SEGREDO_SUPER_SEGURO_PARA_PRODUCAO"
JWT_EXPIRES_IN="1d"
```

> ⚠️ **Importante:** Em produção, altere o valor de `JWT_SECRET` para uma chave segura e única.

---

### 5️⃣ Executar Migrações e Popular o Banco de Dados

Execute as migrações do **Prisma** para criar as tabelas e popular o banco com dados iniciais:

```bash
npx prisma migrate dev
npx prisma db seed
```

Após o seed, será criado um usuário administrador padrão:

| Campo | Valor |
|--------|--------|
| **E-mail** | `admin@paodoceu.com` |
| **Senha** | `admin123` |

---

## ▶️ Executando a Aplicação

Inicie o servidor de desenvolvimento com o comando:

```bash
npm run dev
```

O servidor estará rodando em:

```
http://localhost:3333
```

Acesse essa URL no navegador ou em um cliente de API para verificar o status da API.

---

## 🗂️ Estrutura do Projeto

```bash
/
├── prisma/
│   ├── migrations/
│   ├── schema.prisma
│   └── seed.ts
│
├── src/
│   ├── controllers/
│   ├── dtos/
│   ├── middlewares/
│   ├── routes/
│   ├── services/
│   ├── types/
│   ├── app.ts
│   └── server.ts
│
├── .env
├── package.json
└── tsconfig.json
```

---

## 📘 Documentação da API

A documentação completa dos endpoints está disponível em:  
📄 **[`API_DOCS.md`](./API_DOCS.md)**

---

## Scripts Úteis

| Comando | Descrição |
|----------|------------|
| `npm run dev` | Inicia o servidor em modo desenvolvimento |
| `npm run build` | Compila o projeto TypeScript |
| `npm run start` | Executa a versão compilada |
| `npx prisma studio` | Abre o painel visual do Prisma |
| `npx prisma migrate dev` | Executa migrações do banco de dados |
| `npx prisma db seed` | Popula o banco de dados inicial |
