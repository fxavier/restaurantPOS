
'use client';

import { useEffect } from 'react';
import SidebarNavegacao from './sidebar-navegacao';
import CabecalhoPrincipal from './cabecalho-principal';

interface LayoutPrincipalProps {
  children: React.ReactNode;
  titulo?: string;
}

export default function LayoutPrincipal({ children, titulo }: LayoutPrincipalProps) {
  useEffect(() => {
    // Inicializar dados iniciais se necessário
    const initializeData = async () => {
      try {
        const response = await fetch('/api/init');
        if (!response.ok) {
          console.error('Failed to initialize data:', response.statusText);
        }
      } catch (error) {
        console.error('Error initializing data:', error);
      }
    };
    
    initializeData();
  }, []);

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <SidebarNavegacao />

      {/* Conteúdo principal */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Cabeçalho */}
        <CabecalhoPrincipal titulo={titulo} />

        {/* Área de conteúdo */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
