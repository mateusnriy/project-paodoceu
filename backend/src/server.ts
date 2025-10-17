import app from './app';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3333;

app.listen(PORT, () => {
  console.log(`Servidor Pão do Céu rodando na porta ${PORT}`);
  console.log(`Acesso em: http://localhost:${PORT}`);
});
