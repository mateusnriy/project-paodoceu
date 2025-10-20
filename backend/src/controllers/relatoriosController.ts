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
    // <<< CORREÇÃO: Extrai 'tipo' e 'limite' >>>
    const { tipo, data_inicio, data_fim, limite } = req.query;

    if (!tipo || typeof tipo !== 'string') { // <<< CORREÇÃO: Valida tipo como string
      throw new AppError("O parâmetro 'tipo' do relatório é obrigatório.", 400);
    }

    const dataInicio = data_inicio ? new Date(data_inicio as string) : undefined;
    const dataFim = data_fim ? new Date(data_fim as string) : undefined;
    // <<< CORREÇÃO: Converte limite para número >>>
    const limiteNum = limite ? parseInt(limite as string, 10) : undefined;

    // Valida datas (simples)
    if (dataInicio && isNaN(dataInicio.getTime())) {
         throw new AppError("Formato inválido para 'data_inicio'.", 400);
    }
     if (dataFim && isNaN(dataFim.getTime())) {
         throw new AppError("Formato inválido para 'data_fim'.", 400);
    }
    
    // <<< CORREÇÃO: Chama o método unificado no service >>>
    const relatorio = await relatoriosService.relatorioDeVendas(
        tipo, 
        dataInicio, 
        dataFim, 
        limiteNum
    );

    return res.status(200).json(relatorio);
  }
}
