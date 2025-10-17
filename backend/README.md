# Sistema de PDV (Backend)

Bem-vindo ao **Pão do Céu**, um sistema de **Ponto de Venda (PDV)** moderno e completo, desenvolvido para **lanchonetes, padarias e pequenas cafeterias**.  

Este é o **backend** da aplicação, construído com **Node.js**, **Express**, **TypeScript** e **Prisma ORM**.

---

## ⚙️ Pré-requisitos

Antes de começar, certifique-se de ter os seguintes softwares instalados e funcionando corretamente na sua máquina:

| Ferramenta | Versão Mínima | Link de Instalação |
|-------------|----------------|--------------------|
| **Node.js** | 18.x ou superior | [nodejs.org](https://nodejs.org) |
| **npm** | 8.x ou superior | Vem junto com o Node.js |
| **Docker** | Última versão | [docker.com](https://www.docker.com) |

> ⚠️ **Importante:** Certifique-se de que o **Docker Desktop** esteja em execução antes de prosseguir com a configuração do banco de dados.

---

## 🧭 Instalação e Execução (Passo a Passo)

Siga estes passos na **ordem exata** para configurar e rodar o ambiente de desenvolvimento.

---

### 1️⃣ Clonar o Repositório

```bash
git clone <URL_DO_SEU_REPOSITORIO>
cd paodoceu-backend
```

---

### 2️⃣ Instalar as Dependências

```bash
npm install
```

---

### 3️⃣ Configurar e Iniciar o Banco de Dados

Use o **Docker** para criar um contêiner isolado com o banco de dados **PostgreSQL**:

```bash
docker run --name paodoceu-db   -e POSTGRES_USER=docker   -e POSTGRES_PASSWORD=docker   -e POSTGRES_DB=paodoceu   -p 5432:5432   -d postgres
```

💡 Este comando cria um banco chamado `paodoceu` com usuário e senha `docker` e o expõe na porta **5432**.  
Se a porta **5432** já estiver em uso, você precisará parar o serviço que a está utilizando.

---

### 4️⃣ Criar o Arquivo de Variáveis de Ambiente (`.env`)

Crie um arquivo chamado `.env` na raiz da pasta **backend** e cole o conteúdo abaixo.  
Este arquivo guarda as credenciais de acesso ao banco e outras chaves secretas.

```env
# URL de Conexão com o Banco de Dados (PostgreSQL)
DATABASE_URL="postgresql://docker:docker@localhost:5432/paodoceu?schema=public"

# Chave secreta para assinatura de tokens JWT
JWT_SECRET="GERAR_UMA_CHAVE_SEGURA_AQUI"
```

🔐 Para gerar uma chave segura para `JWT_SECRET`, abra o terminal, digite `node` para entrar no console, e execute o seguinte comando:

```javascript
require('crypto').randomBytes(32).toString('hex')
```

Copie o resultado e cole na variável `JWT_SECRET`.

---

### 5️⃣ Preparar o Banco de Dados (Migração e Seed)

Com o banco de dados rodando e o `.env` configurado, execute os comandos do **Prisma** para criar as tabelas e popular o banco com dados iniciais (usuário admin, categorias, produtos, etc.):


```bash
npx prisma migrate dev
npx prisma db seed
```

Após a execução, um usuário administrador padrão será criado com as seguintes credenciais:

| Campo | Valor |
|--------|--------|
| **E-mail** | `admin@paodoceu.com` |
| **Senha** | `admin123` |

---

### 6️⃣ Iniciar a Aplicação

Finalmente, inicie o servidor em modo de desenvolvimento:

```bash
npm run dev
```

O backend estará rodando e acessível em:

👉 [http://localhost:3333](http://localhost:3333)

Você pode usar um cliente de API como o **Insomnia** para começar a testar os endpoints.

---

## 🗂️ Estrutura do Projeto

A estrutura de pastas segue uma arquitetura em camadas para organizar responsabilidades:

```
/
├── prisma/         # Configurações do Prisma ORM, schema e seed
├── src/
│   ├── controllers/  # Camada que recebe as requisições HTTP
│   ├── dtos/         # Definições de tipos para transferência de dados
│   ├── lib/          # Configurações de bibliotecas (ex: Prisma Client)
│   ├── middlewares/  # Funções que interceptam requisições
│   ├── routes/       # Definição dos endpoints da API
│   ├── services/     # Camada de lógica de negócio
│   └── validations/  # Schemas de validação de dados (Zod)
│
├── .env            # Arquivo com variáveis de ambiente (NÃO versionado)
├── package.json
└── tsconfig.json
```

---

## 🧩 Scripts Úteis

| Comando | Descrição |
|----------|------------|
| `npm run dev` | Inicia o servidor em modo de desenvolvimento. |
| `npm run build` | Compila o código TypeScript para JavaScript. |
| `npm run start` | Executa a versão compilada do projeto. |
| `npx prisma migrate dev` | Aplica as migrações e cria o banco de dados. |
| `npx prisma db seed` | Popula o banco com os dados do arquivo `seed.ts`. |
| `npx prisma studio` | Abre uma interface visual para gerenciar o banco. |
| `npx prisma generate` | Gera/atualiza o cliente Prisma e os tipos. |
