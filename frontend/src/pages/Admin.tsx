import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Header } from '../components/common/Header';
import { Sidebar } from '../components/common/Sidebar';

// Lazy load admin pages
const AdminProducts = React.lazy(() => import('./admin/AdminProducts'));
const AdminCategories = React.lazy(() => import('./admin/AdminCategories'));
const AdminUsers = React.lazy(() => import('./admin/AdminUsers'));
const AdminReports = React.lazy(() => import('./admin/AdminReports'));

export const Admin: React.FC = () => {
  return (
    <div className="min-h-screen bg-neutral flex flex-col">
      <Header />
      <div className="flex-grow flex">
        <Sidebar className="w-64 flex-shrink-0" />
        <main className="flex-grow p-6 overflow-auto">
          <React.Suspense fallback={<div>Carregando...</div>}>
            <Routes>
              <Route path="products" element={<AdminProducts />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="reports" element={<AdminReports />} />
              {/* Rota padrão dentro de /admin */}
              <Route path="/" element={<Navigate to="/admin/products" replace />} />
              {/* Rota fallback dentro de /admin */}
              <Route path="*" element={<Navigate to="/admin/products" replace />} />
            </Routes>
          </React.Suspense>
        </main>
      </div>
    </div>
  );
};

// Exportar como default para o Lazy Loading
export default Admin;
