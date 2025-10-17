import axios from 'axios';

// Mensagem genérica segura
const GENERIC_ERROR_MESSAGE = 'Ocorreu um erro inesperado. Tente novamente mais tarde.';

export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    // Erro da resposta da API com mensagem estruturada
    if (error.response?.data?.message && typeof error.response.data.message === 'string') {
      return error.response.data.message;
    }
    // Erro de rede ou sem resposta
    if (error.request) {
      return 'Não foi possível conectar ao servidor. Verifique sua conexão.';
    }
  }
  // Erro padrão do JavaScript (ex: new Error("mensagem"))
  if (error instanceof Error && error.message) {
     // Poderia logar error.message aqui para debug interno, mas não retornar ao usuário
     console.error("Caught client-side error:", error.message);
     return GENERIC_ERROR_MESSAGE; // Retorna a genérica
  }
  // Fallback final
  return GENERIC_ERROR_MESSAGE;
};
