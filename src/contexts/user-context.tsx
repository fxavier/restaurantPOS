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
    // Verificar se há token salvo e tentar restaurar sessão
    const carregarDadosUsuario = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const restauranteSalvo = localStorage.getItem('restaurante_id');
        
        if (token) {
          // Tentar obter dados do usuário usando o token
          try {
            const response = await api.get('/auth/me', {
              headers: {
                Authorization: `Bearer ${token}`
              }
            });
            
            setUsuario(response);
            if (response.restauranteId) {
              setRestauranteIdState(response.restauranteId);
            }
          } catch (error) {
            // Token inválido, remover
            localStorage.removeItem('auth_token');
            console.error('Token inválido:', error);
          }
        }
        
        if (restauranteSalvo && !restauranteId) {
          setRestauranteIdState(restauranteSalvo);
        } else if (!restauranteSalvo && !restauranteId) {
          // Usar ID padrão temporariamente
          setRestauranteIdState('default-restaurant');
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

      const response = await api.post('/auth/login', {
        email,
        senha
      });

      const { usuario: usuarioData, token } = response;
      
      setUsuario(usuarioData);
      setRestauranteIdState(usuarioData.restauranteId);
      
      // Salvar token para requisições futuras
      localStorage.setItem('auth_token', token);
      localStorage.setItem('restaurante_id', usuarioData.restauranteId);
      
      // Configurar token padrão para o api client
      api.setAuthToken(token);
      
      return true;
    } catch (error: any) {
      console.error('Erro ao fazer login:', error);
      setError(error.response?.data?.error || 'Erro ao fazer login');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Chamar endpoint de logout
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      // Limpar estado local independentemente do resultado da API
      setUsuario(null);
      setRestauranteIdState(null);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('restaurante_id');
      api.clearAuthToken();
    }
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