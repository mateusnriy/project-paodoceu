// src/controllers/relatorios.controller.ts
import { Request, Response } from 'express';
import { RelatoriosService } from '../services/relatoriosService';
import { ImpressaoService } from '../services/impressaoService';

const relatoriosService = new RelatoriosService();
const impressaoService = new ImpressaoService();

export class RelatoriosController {

  async gerarComprovante(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const dadosComprovante = await impressaoService.gerarDadosComprovante(id);
      
      // Aqui, retornamos os dados formatados em JSON.
      // A responsabilidade de gerar o PDF ou imprimir fica a cargo de outra camada ou do frontend.
      return res.status(200).json(dadosComprovante);

    } catch (error: any) {
      return res.status(404).json({ message: error.message });
    }
  }

  async relatorioDeVendas(req: Request, res: Response) {
    try {
      // Extraindo parâmetros da query string (ex: /vendas?tipo=produto&data_inicio=...&data_fim=...)
      const { tipo, data_inicio, data_fim } = req.query;

      if (!tipo) {
        return res.status(400).json({ message: "O parâmetro 'tipo' do relatório é obrigatório." });
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
        // Caso para atendente será implementado após ajuste no schema
        default:
          return res.status(400).json({ message: "Tipo de relatório inválido. Valores válidos: 'periodo', 'produto', 'categoria'." });
      }

      return res.status(200).json(relatorio);
    } catch (error: any) {
      return res.status(500).json({ message: "Erro ao gerar relatório: " + error.message });
    }
  }
}
