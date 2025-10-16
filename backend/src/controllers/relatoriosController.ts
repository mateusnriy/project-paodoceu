import { Request, Response } from 'express';
import { RelatoriosService } from '../services/relatoriosService';
import { ImpressaoService } from '../services/impressaoService';
import { AppError } from '../middlewares/errorMiddleware';

const relatoriosService = new RelatoriosService();
const impressaoService = new ImpressaoService();

export class RelatoriosController {
  async gerarComprovante(req: Request, res: Response) {
    const { id } = req.params;
    const dadosComprovante = await impressaoService.gerarDadosComprovante(id);
    return res.status(200).json(dadosComprovante);
  }

  async relatorioDeVendas(req: Request, res: Response) {
    const { tipo, data_inicio, data_fim } = req.query;

    if (!tipo) {
      throw new AppError("O parâmetro 'tipo' do relatório é obrigatório.", 400);
    }

    const dataInicio = data_inicio ? new Date(data_inicio as string) : undefined;
    const dataFim = data_fim ? new Date(data_fim as string) : undefined;

    let relatorio;

    switch (tipo) {
      case 'periodo':
        relatorio = await relatoriosService.vendasPorPeriodo(dataInicio, dataFim);
        break;
      case 'produto':
        relatorio = await relatoriosService.vendasPorProduto(dataInicio, dataFim);
        break;
      case 'categoria':
        relatorio = await relatoriosService.vendasPorCategoria(dataInicio, dataFim);
        break;
      default:
        throw new AppError("Tipo de relatório inválido. Valores válidos: 'periodo', 'produto', 'categoria'.", 400);
    }

    return res.status(200).json(relatorio);
  }
}
