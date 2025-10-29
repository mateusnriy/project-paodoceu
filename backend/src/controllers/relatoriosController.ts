import { Request, Response } from 'express';
import { RelatoriosService } from '../services/relatoriosService';
import { z } from 'zod';
import { AppError } from '../middlewares/errorMiddleware';
import { ImpressaoService } from '../services/impressaoService'; // (CORREÇÃO ERRO 9) Importar serviço

// Schema de validação local para a query
const relatorioQuerySchema = z.object({
  dataInicio: z.coerce.date({
    errorMap: () => ({ message: 'Data de início inválida.' }),
  }),
  dataFim: z.coerce.date({
    errorMap: () => ({ message: 'Data de fim inválida.' }),
  }),
});

export class RelatoriosController {
  private relatoriosService: RelatoriosService;
  private impressaoService: ImpressaoService; // (CORREÇÃO ERRO 9)

  constructor(relatoriosService: RelatoriosService) {
    this.relatoriosService = relatoriosService;
    this.impressaoService = new ImpressaoService(); // (CORREÇÃO ERRO 9) Instanciar
  }

  obterRelatorioVendas = async (req: Request, res: Response) => {
    // Validar a query
    const result = relatorioQuerySchema.safeParse(req.query);

    if (!result.success) {
      // (CORREÇÃO ERRO 3) Lançar o ZodError diretamente
      // O errorMiddleware global irá tratá-lo e formatá-lo.
      throw result.error;
    }

    const { dataInicio, dataFim } = result.data;

    const relatorio = await this.relatoriosService.obterRelatorioVendas(
      dataInicio,
      dataFim,
    );

    res.status(200).json(relatorio);
  };

  /**
   * (CORREÇÃO ERRO 9) Implementação do método faltante
   */
  gerarComprovante = async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id || typeof id !== 'string') {
      throw new AppError('ID do pedido é inválido.', 400);
    }

    // O service (impressaoService) já lida com 404
    const dadosComprovante = await this.impressaoService.gerarDadosComprovante(
      id,
    );

    // No futuro, isso poderia gerar um PDF. Por agora, retorna JSON.
    res.status(200).json(dadosComprovante);
  };
}
