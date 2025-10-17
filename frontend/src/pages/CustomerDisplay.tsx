import React from 'react';
import { CloudIcon } from 'lucide-react';
import { useCustomerDisplay } from '../hooks/useCustomerDisplay';
import { ErrorMessage } from '../components/ui/ErrorMessage';

const CustomerDisplay: React.FC = () => {
  const { orders, highlightOrder, error } = useCustomerDisplay();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-primary/20 flex flex-col">
      <header className="bg-primary text-white p-6 shadow-soft">
        <div className="container mx-auto flex items-center justify-center">
          <CloudIcon size={32} className="mr-3" />
          <h1 className="text-2xl md:text-3xl font-bold text-center">
            Lanchonete Pão do Céu — Pedidos Prontos para Retirada
          </h1>
        </div>
      </header>
      <main className="flex-grow container mx-auto px-4 py-12">
        <ErrorMessage message={error} />
        {orders.length === 0 && !error && (
          <p className="text-center text-gray-600 text-xl mt-10">
            Nenhum pedido pronto no momento.
          </p>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {orders.map((order) => (
            <div
              key={order}
              className={`
                aspect-square flex items-center justify-center rounded-4xl bg-white shadow-soft transition-all duration-300
                ${highlightOrder === order ? 'animate-pulse ring-4 ring-accent bg-primary/20' : ''}
              `}
            >
              <span className="text-4xl md:text-6xl font-bold text-accent">{order}</span>
            </div>
          ))}
        </div>
      </main>
      <footer className="bg-white p-4 shadow-soft mt-auto">
        <div className="container mx-auto text-center text-gray-600">
          <div className="flex items-center justify-center gap-2">
            <CloudIcon size={20} className="text-primary" />
            <span>Lanchonete Pão do Céu</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Exportar como default para o Lazy Loading
export default CustomerDisplay;
