// src/server.ts
import app from './app';
import dotenv from 'dotenv';

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config();

// Define a porta a partir das variáveis de ambiente ou usa 3333 como padrão
const PORT = process.env.PORT || 3333;

// Inicia o servidor e o faz escutar na porta definida
app.listen(PORT, () => {
  console.log(`Servidor Pão do Céu rodando na porta ${PORT}`);
  console.log(`Acesso em: http://localhost:${PORT}`);
});
