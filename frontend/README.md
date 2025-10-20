# Pão do Céu - Frontend

Interface de usuário para o sistema de PDV Pão do Céu, construída com React, TypeScript, Vite e Tailwind CSS.

## Pré-requisitos

* Node.js (v20.x ou superior recomendado)
* npm (v10.x ou superior)

## Começando

1.  **Instale as dependências:**
    ```bash
    npm install
    # ou: npm ci (para usar o package-lock.json)
    ```

2.  **Configure as Variáveis de Ambiente:**
    * Copie o arquivo de exemplo: `cp .env.example .env`
    * Edite o arquivo `.env` criado e defina a variável `VITE_API_BASE_URL` para apontar para a URL da sua API backend (ex: `http://localhost:3333/api`).
    * (Opcional) Configure `VITE_SENTRY_DSN` se estiver usando Sentry para monitoramento de erros em produção.

3.  **Execute em modo de desenvolvimento:**
    ```bash
    npm run dev
    ```
    A aplicação estará disponível geralmente em `http://localhost:5173`.

## Scripts Disponíveis

* `npm run dev`: Inicia o servidor de desenvolvimento com hot-reload.
* `npm run build`: Compila a aplicação para produção (gera a pasta `dist`).
* `npm run preview`: Inicia um servidor local para visualizar o build de produção.
* `npm run lint`: Executa o ESLint para verificar a qualidade do código.
* `npm run lint:fix`: Tenta corrigir automaticamente problemas encontrados pelo ESLint.
* `npm run format`: Formata o código usando o Prettier.
* `npm test`: (Placeholder) Executa os testes automatizados.