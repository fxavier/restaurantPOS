// API Data Service - Replaces localStorage with API calls
import { 
  Produto, 
  Categoria, 
  Mesa, 
  Comanda, 
  Fornecedor,
  Menu,
  MenuInput,
  Usuario,
  Restaurante,
  StatusMesa,
  CanalVenda,
  OrdemCompra,
  ItemOrdemCompra,
  StatusOrdemCompra
} from '@/types/sistema-restaurante';

// Get the correct base URL depending on environment
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // Client side
    return '/api';
  }
  // Server side
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}/api`;
  }
  return 'http://localhost:3000/api';
};

const API_BASE_URL = getBaseUrl();

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface PaginatedApiResponse<T> {
  success: boolean;
  data?: T[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  error?: string;
}

class ApiDataService {
  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      return {
        success: true,
        data: data.data || data,
      };
    } catch (error) {
      console.error(`API Error for ${endpoint}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro de conexão',
      };
    }
  }

  // ============= RESTAURANTES =============
  async obterRestaurantes(): Promise<Restaurante[]> {
    const response = await this.makeRequest<Restaurante[]>('/restaurantes');
    return response.data || [];
  }

  async obterRestaurante(id: string): Promise<Restaurante | null> {
    const response = await this.makeRequest<Restaurante>(`/restaurantes/${id}`);
    return response.data || null;
  }

  async criarRestaurante(data: Omit<Restaurante, 'id' | 'criadoEm' | 'atualizadoEm'>): Promise<Restaurante | null> {
    const response = await this.makeRequest<Restaurante>('/restaurantes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data || null;
  }

  async atualizarRestaurante(id: string, data: Partial<Restaurante>): Promise<Restaurante | null> {
    const response = await this.makeRequest<Restaurante>(`/restaurantes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data || null;
  }

  // ============= CATEGORIAS =============
  async obterCategorias(restauranteId?: string): Promise<Categoria[]> {
    const endpoint = restauranteId 
      ? `/categorias?restauranteId=${restauranteId}` 
      : '/categorias';
    const response = await this.makeRequest<Categoria[]>(endpoint);
    return response.data || [];
  }

  async obterCategoria(id: string): Promise<Categoria | null> {
    const response = await this.makeRequest<Categoria>(`/categorias/${id}`);
    return response.data || null;
  }

  async salvarCategoria(data: Omit<Categoria, 'id'>): Promise<Categoria | null> {
    const response = await this.makeRequest<Categoria>('/categorias', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data || null;
  }

  async atualizarCategoria(id: string, data: Partial<Categoria>): Promise<Categoria | null> {
    const response = await this.makeRequest<Categoria>(`/categorias/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data || null;
  }

  async excluirCategoria(id: string): Promise<boolean> {
    const response = await this.makeRequest(`/categorias/${id}`, {
      method: 'DELETE',
    });
    return response.success;
  }

  // ============= PRODUTOS =============
  async obterProdutos(restauranteId?: string): Promise<Produto[]> {
    const endpoint = restauranteId 
      ? `/produtos?restauranteId=${restauranteId}` 
      : '/produtos';
    const response = await this.makeRequest<Produto[]>(endpoint);
    return response.data || [];
  }

  async obterProduto(id: string): Promise<Produto | null> {
    const response = await this.makeRequest<Produto>(`/produtos/${id}`);
    return response.data || null;
  }

  async salvarProduto(data: Omit<Produto, 'id' | 'criadoEm' | 'atualizadoEm'>): Promise<Produto | null> {
    const response = await this.makeRequest<Produto>('/produtos', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data || null;
  }

  async atualizarProduto(id: string, data: Partial<Produto>): Promise<Produto | null> {
    const response = await this.makeRequest<Produto>(`/produtos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data || null;
  }

  async excluirProduto(id: string): Promise<boolean> {
    const response = await this.makeRequest(`/produtos/${id}`, {
      method: 'DELETE',
    });
    return response.success;
  }

  // ============= MESAS =============
  async obterMesas(restauranteId?: string): Promise<Mesa[]> {
    const endpoint = restauranteId 
      ? `/mesas?restauranteId=${restauranteId}` 
      : '/mesas';
    const response = await this.makeRequest<Mesa[]>(endpoint);
    return response.data || [];
  }

  async obterMesa(id: string): Promise<Mesa | null> {
    const response = await this.makeRequest<Mesa>(`/mesas/${id}`);
    return response.data || null;
  }

  async salvarMesa(data: Omit<Mesa, 'id' | 'criadaEm'>): Promise<Mesa | null> {
    const response = await this.makeRequest<Mesa>('/mesas', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data || null;
  }

  async atualizarMesa(id: string, data: Partial<Mesa>): Promise<Mesa | null> {
    const response = await this.makeRequest<Mesa>(`/mesas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data || null;
  }

  async atualizarStatusMesa(id: string, status: StatusMesa): Promise<Mesa | null> {
    return this.atualizarMesa(id, { status });
  }

  async excluirMesa(id: string): Promise<boolean> {
    const response = await this.makeRequest(`/mesas/${id}`, {
      method: 'DELETE',
    });
    return response.success;
  }

  // ============= COMANDAS =============
  async obterComandas(restauranteId?: string): Promise<Comanda[]> {
    const endpoint = restauranteId 
      ? `/comandas?restauranteId=${restauranteId}` 
      : '/comandas';
    const response = await this.makeRequest<Comanda[]>(endpoint);
    return response.data || [];
  }

  async obterComanda(id: string): Promise<Comanda | null> {
    const response = await this.makeRequest<Comanda>(`/comandas/${id}`);
    return response.data || null;
  }

  async salvarComanda(data: Omit<Comanda, 'id' | 'criadaEm' | 'atualizadaEm'>): Promise<Comanda | null> {
    const response = await this.makeRequest<Comanda>('/comandas', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data || null;
  }

  async atualizarComanda(id: string, data: Partial<Comanda>): Promise<Comanda | null> {
    const response = await this.makeRequest<Comanda>(`/comandas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data || null;
  }

  async atualizarItemComanda(comandaId: string, itemId: string, data: any): Promise<any> {
    const response = await this.makeRequest(`/comandas/${comandaId}/itens/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data || null;
  }

  async excluirComanda(id: string): Promise<boolean> {
    const response = await this.makeRequest(`/comandas/${id}`, {
      method: 'DELETE',
    });
    return response.success;
  }

  // ============= FORNECEDORES =============
  async obterFornecedores(restauranteId?: string): Promise<Fornecedor[]> {
    const endpoint = restauranteId 
      ? `/fornecedores?restauranteId=${restauranteId}` 
      : '/fornecedores';
    const response = await this.makeRequest<Fornecedor[]>(endpoint);
    return response.data || [];
  }

  async obterFornecedor(id: string): Promise<Fornecedor | null> {
    const response = await this.makeRequest<Fornecedor>(`/fornecedores/${id}`);
    return response.data || null;
  }

  async salvarFornecedor(data: Omit<Fornecedor, 'id' | 'criadoEm'>): Promise<Fornecedor | null> {
    const response = await this.makeRequest<Fornecedor>('/fornecedores', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data || null;
  }

  async atualizarFornecedor(id: string, data: Partial<Fornecedor>): Promise<Fornecedor | null> {
    const response = await this.makeRequest<Fornecedor>(`/fornecedores/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data || null;
  }

  async excluirFornecedor(id: string): Promise<boolean> {
    const response = await this.makeRequest(`/fornecedores/${id}`, {
      method: 'DELETE',
    });
    return response.success;
  }

  // ============= MENUS =============
  async obterMenus(restauranteId?: string): Promise<Menu[]> {
    const endpoint = restauranteId 
      ? `/menus?restauranteId=${restauranteId}` 
      : '/menus';
    const response = await this.makeRequest<Menu[]>(endpoint);
    return response.data || [];
  }

  async obterMenu(id: string): Promise<Menu | null> {
    const response = await this.makeRequest<Menu>(`/menus/${id}`);
    return response.data || null;
  }

  async salvarMenu(data: MenuInput): Promise<Menu | null> {
    const response = await this.makeRequest<Menu>('/menus', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data || null;
  }

  async atualizarMenu(id: string, data: Partial<MenuInput>): Promise<Menu | null> {
    const response = await this.makeRequest<Menu>(`/menus/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data || null;
  }

  async excluirMenu(id: string): Promise<boolean> {
    const response = await this.makeRequest(`/menus/${id}`, {
      method: 'DELETE',
    });
    return response.success;
  }

  // ============= ORDENS DE COMPRA =============
  async obterOrdensCompra(params?: {
    restauranteId?: string;
    page?: number;
    limit?: number;
    status?: StatusOrdemCompra;
    fornecedorId?: string;
    dataInicio?: string;
    dataFim?: string;
  }): Promise<{
    ordensCompra: OrdemCompra[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const queryParams = new URLSearchParams();
    
    if (params?.restauranteId) {
      queryParams.append('restauranteId', params.restauranteId);
    } else {
      queryParams.append('restauranteId', this.getDefaultRestauranteId());
    }
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.fornecedorId) queryParams.append('fornecedorId', params.fornecedorId);
    if (params?.dataInicio) queryParams.append('dataInicio', params.dataInicio);
    if (params?.dataFim) queryParams.append('dataFim', params.dataFim);
    
    const endpoint = `/compras?${queryParams.toString()}`;
    
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('API Error:', data.error || response.statusText);
        return {
          ordensCompra: [],
          pagination: {
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 0,
          },
        };
      }

      return {
        ordensCompra: data.data || [],
        pagination: data.pagination || {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
        },
      };
    } catch (error) {
      console.error(`API Error for ${endpoint}:`, error);
      return {
        ordensCompra: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
        },
      };
    }
  }

  async obterOrdemCompra(id: string): Promise<OrdemCompra | null> {
    const response = await this.makeRequest<OrdemCompra>(`/compras/${id}`);
    return response.data || null;
  }

  async salvarOrdemCompra(data: Omit<OrdemCompra, 'id' | 'criadaEm' | 'atualizadaEm'>): Promise<OrdemCompra | null> {
    const response = await this.makeRequest<OrdemCompra>('/compras', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data || null;
  }

  async atualizarOrdemCompra(id: string, data: Partial<OrdemCompra>): Promise<OrdemCompra | null> {
    const response = await this.makeRequest<OrdemCompra>(`/compras/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data || null;
  }

  async excluirOrdemCompra(id: string): Promise<boolean> {
    const response = await this.makeRequest(`/compras/${id}`, {
      method: 'DELETE',
    });
    return response.success;
  }

  async atualizarStatusOrdemCompra(id: string, status: StatusOrdemCompra): Promise<OrdemCompra | null> {
    return this.atualizarOrdemCompra(id, { status });
  }

  async obterItensOrdemCompra(ordemCompraId: string): Promise<ItemOrdemCompra[]> {
    const response = await this.makeRequest<ItemOrdemCompra[]>(`/compras/${ordemCompraId}/itens`);
    return response.data || [];
  }

  async salvarItemOrdemCompra(ordemCompraId: string, data: Omit<ItemOrdemCompra, 'id'>): Promise<ItemOrdemCompra | null> {
    const response = await this.makeRequest<ItemOrdemCompra>(`/compras/${ordemCompraId}/itens`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data || null;
  }

  async atualizarItemOrdemCompra(ordemCompraId: string, itemId: string, data: Partial<ItemOrdemCompra>): Promise<ItemOrdemCompra | null> {
    const response = await this.makeRequest<ItemOrdemCompra>(`/compras/${ordemCompraId}/itens/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data || null;
  }

  async excluirItemOrdemCompra(ordemCompraId: string, itemId: string): Promise<boolean> {
    const response = await this.makeRequest(`/compras/${ordemCompraId}/itens/${itemId}`, {
      method: 'DELETE',
    });
    return response.success;
  }

  // ============= USUÁRIOS =============
  async obterUsuarios(restauranteId?: string): Promise<Usuario[]> {
    const endpoint = restauranteId 
      ? `/utilizadores?restauranteId=${restauranteId}` 
      : '/utilizadores';
    const response = await this.makeRequest<Usuario[]>(endpoint);
    return response.data || [];
  }

  async obterUsuario(id: string): Promise<Usuario | null> {
    const response = await this.makeRequest<Usuario>(`/utilizadores/${id}`);
    return response.data || null;
  }

  async salvarUsuario(data: Omit<Usuario, 'id' | 'criadoEm' | 'atualizadoEm'>): Promise<Usuario | null> {
    const response = await this.makeRequest<Usuario>('/utilizadores', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data || null;
  }

  async atualizarUsuario(id: string, data: Partial<Usuario>): Promise<Usuario | null> {
    const response = await this.makeRequest<Usuario>(`/utilizadores/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data || null;
  }

  async excluirUsuario(id: string): Promise<boolean> {
    const response = await this.makeRequest(`/utilizadores/${id}`, {
      method: 'DELETE',
    });
    return response.success;
  }

  // ============= UTILITIES =============
  
  /**
   * Get default restaurant ID (for backwards compatibility)
   */
  getDefaultRestauranteId(): string {
    // TODO: This should come from user session/context
    // For now, using the actual restaurant ID from the database
    return 'cmg3w1utw005j2gzkrott9zul';
  }

  /**
   * Check if API is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Clear all cached data (for logout, etc.)
   */
  clearCache(): void {
    // If we implement any client-side caching, clear it here
    console.log('Cache cleared');
  }
}

// Export singleton instance
export const apiDataService = new ApiDataService();

// Also export the class for testing
export default ApiDataService;