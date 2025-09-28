'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/lib/api-client';
import { Usuario, PerfilUsuario } from '@/types/sistema-restaurante';

interface UserContextType {
  usuario: Usuario | null;
  restauranteId: string | null;
  loading: boolean;
  error: string | null;
  temPermissao: (permissao: string) => boolean;
  login: (email: string, senha: string) => Promise<boolean>;
  logout: () => void;
  setRestauranteId: (id: string) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [restauranteId, setRestauranteIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Carregar dados do usuário do localStorage ou session
    const carregarDadosUsuario = () => {
      try {
        const usuarioSalvo = localStorage.getItem('usuario_logado');
        const restauranteSalvo = localStorage.getItem('restaurante_id');
        
        if (usuarioSalvo) {
          setUsuario(JSON.parse(usuarioSalvo));
        }
        
        if (restauranteSalvo) {
          setRestauranteIdState(restauranteSalvo);
        } else {
          // Usar ID padrão temporariamente
          setRestauranteIdState('cmg3w1utw005j2gzkrott9zul');
        }
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
        setError('Erro ao carregar dados do usuário');
      } finally {
        setLoading(false);
      }
    };

    carregarDadosUsuario();
  }, []);

  const temPermissao = (permissao: string): boolean => {
    if (!usuario) return false;

    // Admin tem todas as permissões
    if (usuario.perfil === 'admin') return true;

    // Verificar se o usuário tem a permissão específica
    return usuario.permissoes?.includes(permissao) || false;
  };

  const login = async (email: string, senha: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Implementar autenticação real
      // Por enquanto, simular login com dados mock
      const usuarioMock: Usuario = {
        id: 'user-1',
        nome: 'Administrador',
        email: email,
        telefone: '+258 84 123 4567',
        perfil: 'admin' as PerfilUsuario,
        permissoes: [
          'dashboard',
          'pos',
          'kds',
          'comandas',
          'produtos',
          'categorias',
          'menus',
          'mesas',
          'clientes',
          'estoque',
          'fornecedores',
          'compras',
          'entregas',
          'relatorios',
          'utilizadores',
          'configuracoes',
          'auditoria',
          'turnos',
          'backup'
        ],
        ativo: true,
        ultimoLogin: new Date().toISOString(),
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString(),
        restauranteId: restauranteId || 'cmg3w1utw005j2gzkrott9zul'
      };

      setUsuario(usuarioMock);
      localStorage.setItem('usuario_logado', JSON.stringify(usuarioMock));
      
      return true;
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      setError('Erro ao fazer login');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUsuario(null);
    localStorage.removeItem('usuario_logado');
  };

  const setRestauranteId = (id: string) => {
    setRestauranteIdState(id);
    localStorage.setItem('restaurante_id', id);
  };

  const value: UserContextType = {
    usuario,
    restauranteId,
    loading,
    error,
    temPermissao,
    login,
    logout,
    setRestauranteId
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser deve ser usado dentro de um UserProvider');
  }
  return context;
}