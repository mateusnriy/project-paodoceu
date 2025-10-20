import React from 'react';
import { useCustomerDisplay } from '../hooks/useCustomerDisplay';
import { Pedido, StatusPedido } from '../types'; // <<< Importa StatusPedido
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { getErrorMessage } from '../utils/errors';
import { Loader2 } from 'lucide-react';


// --- Componente de Card "Pronto" ---
const ProntoCard: React.FC<{ pedido: Pedido }> = ({ pedido }) => (
  <div className="flex flex-col justify-center items-center h-full
                 bg-status-success rounded-xl shadow-2xl p-12">
    <span className="text-4xl font-semibold text-white mb-4">Pronto!</span>
    <span className="text-9xl font-bold text-white tracking-tighter"
          style={{ fontSize: '12rem', lineHeight: '1' }}>
      {pedido.senha}
    </span>
    <span className="text-5xl font-bold text-white animate-pulse mt-4">
      Retire seu pedido
    </span>
  </div>
);

// --- Componente da Lista "Aguardando" ---
const AguardandoList: React.FC<{ pedidos: Pedido[] }> = ({ pedidos }) => (
  <div className="bg-gray-800 rounded-xl shadow-2xl p-8 h-full">
    {/* <<< CORREÇÃO: Título deve refletir o status PENDENTE >>> */}
    <h2 className="text-4xl font-bold text-center mb-6 text-status-warning">
      Aguardando {/* Mantém o texto "Aguardando" para o usuário */}
    </h2>
    {pedidos.length === 0 ? (
      <div className="flex items-center justify-center h-3/4">
        <p className="text-2xl text-text-secondary">Nenhum pedido aguardando.</p>
      </div>
    ) : (
      // Ajuste no grid para melhor acomodação de senhas maiores
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
        {pedidos.map((p) => (
          <span key={p.id} className="text-5xl lg:text-6xl font-bold text-white text-center truncate">
            {p.senha}
          </span>
        ))}
      </div>
    )}
  </div>
);

// --- Página Principal ---
const CustomerDisplay: React.FC = () => {
  const { pedidosProntos, pedidosAguardando, isLoading, error } = useCustomerDisplay();

  const renderContent = () => {
    // Mostra loading apenas na carga inicial sem dados
    if (isLoading && pedidosProntos.length === 0 && pedidosAguardando.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <Loader2 size={64} className="animate-spin text-white" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-12 flex items-center justify-center h-full">
           <div className="bg-white p-8 rounded-lg max-w-lg w-full">
            <ErrorMessage
                // title="Erro de Conexão" // O componente ErrorMessage não tem title
                message={`Erro ao atualizar dados: ${getErrorMessage(error)}. Tentando reconectar...`}
            />
           </div>
        </div>
      );
    }

    const pedidoChamado = pedidosProntos[0]; // O primeiro "Pronto"

    // <<< CORREÇÃO: Filtrar a lista de aguardando por PENDENTE >>>
    // (Embora o hook já deva fazer isso, é uma garantia extra)
    const aguardandoFiltrados = pedidosAguardando.filter(p => p.status === StatusPedido.PENDENTE);

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
        {/* Lado Esquerdo (2/3): Pedido Chamado */}
        <div className="lg:col-span-2">
          {pedidoChamado ? (
            <ProntoCard pedido={pedidoChamado} />
          ) : (
            <div className="flex flex-col justify-center items-center h-full bg-gray-800 rounded-xl p-12">
              <span className="text-7xl font-bold text-white">
                Pão do Céu
              </span>
              <span className="text-3xl font-medium text-text-secondary mt-4">
                Aguarde seu pedido ser chamado...
              </span>
            </div>
          )}
        </div>

        {/* Lado Direito (1/3): Lista de Aguardando */}
        <div className="lg:col-span-1">
          {/* <<< Passa a lista filtrada >>> */}
          <AguardandoList pedidos={aguardandoFiltrados} />
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen w-screen bg-gray-900 text-white p-8">
      {renderContent()}
    </div>
  );
};

export default CustomerDisplay;
