
// Utilitários para armazenamento local do sistema de restaurante

import { 
  Restaurante, 
  Usuario, 
  Mesa, 
  Categoria, 
  Produto, 
  Comanda, 
  MovimentacaoEstoque,
  Fornecedor,
  OrdemCompra,
  Entrega,
  LogAuditoria,
  TurnoFechamento
} from '@/types/sistema-restaurante';

// Chaves para localStorage
const CHAVES_STORAGE = {
  RESTAURANTES: 'restaurantes',
  USUARIOS: 'usuarios',
  MESAS: 'mesas',
  CATEGORIAS: 'categorias',
  PRODUTOS: 'produtos',
  COMANDAS: 'comandas',
  MOVIMENTACOES_ESTOQUE: 'movimentacoes_estoque',
  FORNECEDORES: 'fornecedores',
  ORDENS_COMPRA: 'ordens_compra',
  ENTREGAS: 'entregas',
  LOGS_AUDITORIA: 'logs_auditoria',
  TURNOS: 'turnos',
  USUARIO_LOGADO: 'usuario_logado',
  CONFIGURACOES_SISTEMA: 'configuracoes_sistema'
};

// Classe para gerenciar armazenamento local
export class ArmazenamentoLocal {
  
  // Métodos genéricos
  private static obterDados<T>(chave: string): T[] {
    if (typeof window === 'undefined') return [];
    
    try {
      const dados = localStorage.getItem(chave);
      return dados ? JSON.parse(dados) : [];
    } catch (error) {
      console.error(`Erro ao obter dados de ${chave}:`, error);
      return [];
    }
  }

  // Método público para salvar dados
  static salvarDados<T>(chave: string, dados: T[]): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(chave, JSON.stringify(dados));
    } catch (error) {
      console.error(`Erro ao salvar dados em ${chave}:`, error);
    }
  }

  private static gerarId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Restaurantes
  static obterRestaurantes(): Restaurante[] {
    return this.obterDados<Restaurante>(CHAVES_STORAGE.RESTAURANTES);
  }

  static salvarRestaurante(restaurante: Omit<Restaurante, 'id' | 'criadoEm' | 'atualizadoEm'>): Restaurante {
    const restaurantes = this.obterRestaurantes();
    const novoRestaurante: Restaurante = {
      ...restaurante,
      id: this.gerarId(),
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString()
    };
    
    restaurantes.push(novoRestaurante);
    this.salvarDados(CHAVES_STORAGE.RESTAURANTES, restaurantes);
    return novoRestaurante;
  }

  static atualizarRestaurante(id: string, dadosAtualizacao: Partial<Restaurante>): Restaurante | null {
    const restaurantes = this.obterRestaurantes();
    const indice = restaurantes.findIndex(r => r.id === id);
    
    if (indice === -1) return null;
    
    restaurantes[indice] = {
      ...restaurantes[indice],
      ...dadosAtualizacao,
      atualizadoEm: new Date().toISOString()
    };
    
    this.salvarDados(CHAVES_STORAGE.RESTAURANTES, restaurantes);
    return restaurantes[indice];
  }

  // Usuários
  static obterUsuarios(): Usuario[] {
    return this.obterDados<Usuario>(CHAVES_STORAGE.USUARIOS);
  }

  static salvarUsuario(usuario: Omit<Usuario, 'id' | 'criadoEm' | 'atualizadoEm'>): Usuario {
    const usuarios = this.obterUsuarios();
    const novoUsuario: Usuario = {
      ...usuario,
      id: this.gerarId(),
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString()
    };
    
    usuarios.push(novoUsuario);
    this.salvarDados(CHAVES_STORAGE.USUARIOS, usuarios);
    return novoUsuario;
  }

  static obterUsuarioLogado(): Usuario | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const dados = localStorage.getItem(CHAVES_STORAGE.USUARIO_LOGADO);
      return dados ? JSON.parse(dados) : null;
    } catch (error) {
      console.error('Erro ao obter usuário logado:', error);
      return null;
    }
  }

  static definirUsuarioLogado(usuario: Usuario): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(CHAVES_STORAGE.USUARIO_LOGADO, JSON.stringify(usuario));
    } catch (error) {
      console.error('Erro ao definir usuário logado:', error);
    }
  }

  static logout(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(CHAVES_STORAGE.USUARIO_LOGADO);
  }

  // Mesas
  static obterMesas(): Mesa[] {
    return this.obterDados<Mesa>(CHAVES_STORAGE.MESAS);
  }

  static salvarMesa(mesa: Omit<Mesa, 'id' | 'criadaEm'>): Mesa {
    const mesas = this.obterMesas();
    const novaMesa: Mesa = {
      ...mesa,
      id: this.gerarId(),
      criadaEm: new Date().toISOString()
    };
    
    mesas.push(novaMesa);
    this.salvarDados(CHAVES_STORAGE.MESAS, mesas);
    return novaMesa;
  }

  static atualizarMesa(id: string, dadosAtualizacao: Partial<Mesa>): Mesa | null {
    const mesas = this.obterMesas();
    const indice = mesas.findIndex(m => m.id === id);
    
    if (indice === -1) return null;
    
    mesas[indice] = {
      ...mesas[indice],
      ...dadosAtualizacao
    };
    
    this.salvarDados(CHAVES_STORAGE.MESAS, mesas);
    return mesas[indice];
  }

  static atualizarStatusMesa(id: string, status: Mesa['status']): Mesa | null {
    const mesas = this.obterMesas();
    const indice = mesas.findIndex(m => m.id === id);
    
    if (indice === -1) return null;
    
    mesas[indice].status = status;
    this.salvarDados(CHAVES_STORAGE.MESAS, mesas);
    return mesas[indice];
  }

  static salvarListaMesas(mesas: Mesa[]): void {
    this.salvarDados(CHAVES_STORAGE.MESAS, mesas);
  }

  static excluirMesa(id: string): boolean {
    const mesas = this.obterMesas();
    const mesasAtualizadas = mesas.filter(m => m.id !== id);
    
    if (mesasAtualizadas.length === mesas.length) {
      return false; // Mesa não encontrada
    }
    
    this.salvarDados(CHAVES_STORAGE.MESAS, mesasAtualizadas);
    return true;
  }

  // Categorias
  static obterCategorias(): Categoria[] {
    return this.obterDados<Categoria>(CHAVES_STORAGE.CATEGORIAS);
  }

  static salvarCategoria(categoria: Omit<Categoria, 'id'>): Categoria {
    const categorias = this.obterCategorias();
    const novaCategoria: Categoria = {
      ...categoria,
      id: this.gerarId(),
      ordem: categoria.ordem || categorias.length
    };
    
    categorias.push(novaCategoria);
    this.salvarDados(CHAVES_STORAGE.CATEGORIAS, categorias);
    return novaCategoria;
  }

  static atualizarCategoria(id: string, dadosAtualizacao: Partial<Categoria>): Categoria | null {
    const categorias = this.obterCategorias();
    const indice = categorias.findIndex(c => c.id === id);
    
    if (indice === -1) return null;
    
    categorias[indice] = {
      ...categorias[indice],
      ...dadosAtualizacao
    };
    
    this.salvarDados(CHAVES_STORAGE.CATEGORIAS, categorias);
    return categorias[indice];
  }

  static excluirCategoria(id: string): boolean {
    const categorias = this.obterCategorias();
    const categoriasAtualizadas = categorias.filter(c => c.id !== id);
    
    if (categoriasAtualizadas.length === categorias.length) {
      return false; // Categoria não encontrada
    }
    
    this.salvarDados(CHAVES_STORAGE.CATEGORIAS, categoriasAtualizadas);
    return true;
  }

  // Produtos
  static obterProdutos(): Produto[] {
    return this.obterDados<Produto>(CHAVES_STORAGE.PRODUTOS);
  }

  static salvarProduto(produto: Omit<Produto, 'id' | 'criadoEm' | 'atualizadoEm'>): Produto {
    const produtos = this.obterProdutos();
    const novoProduto: Produto = {
      ...produto,
      id: this.gerarId(),
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString()
    };
    
    produtos.push(novoProduto);
    this.salvarDados(CHAVES_STORAGE.PRODUTOS, produtos);
    return novoProduto;
  }

  static atualizarProduto(id: string, dadosAtualizacao: Partial<Produto>): Produto | null {
    const produtos = this.obterProdutos();
    const indice = produtos.findIndex(p => p.id === id);
    
    if (indice === -1) return null;
    
    produtos[indice] = {
      ...produtos[indice],
      ...dadosAtualizacao,
      atualizadoEm: new Date().toISOString()
    };
    
    this.salvarDados(CHAVES_STORAGE.PRODUTOS, produtos);
    return produtos[indice];
  }

  static excluirProduto(id: string): boolean {
    const produtos = this.obterProdutos();
    const produtosAtualizados = produtos.filter(p => p.id !== id);
    
    if (produtosAtualizados.length === produtos.length) {
      return false; // Produto não encontrado
    }
    
    this.salvarDados(CHAVES_STORAGE.PRODUTOS, produtosAtualizados);
    return true;
  }

  // Comandas
  static obterComandas(): Comanda[] {
    return this.obterDados<Comanda>(CHAVES_STORAGE.COMANDAS);
  }

  static salvarComanda(comanda: Omit<Comanda, 'id' | 'criadaEm' | 'atualizadaEm'>): Comanda {
    const comandas = this.obterComandas();
    const novaComanda: Comanda = {
      ...comanda,
      id: this.gerarId(),
      criadaEm: new Date().toISOString(),
      atualizadaEm: new Date().toISOString()
    };
    
    comandas.push(novaComanda);
    this.salvarDados(CHAVES_STORAGE.COMANDAS, comandas);
    return novaComanda;
  }

  static atualizarComanda(id: string, dadosAtualizacao: Partial<Comanda>): Comanda | null {
    const comandas = this.obterComandas();
    const indice = comandas.findIndex(c => c.id === id);
    
    if (indice === -1) return null;
    
    comandas[indice] = {
      ...comandas[indice],
      ...dadosAtualizacao,
      atualizadaEm: new Date().toISOString()
    };
    
    this.salvarDados(CHAVES_STORAGE.COMANDAS, comandas);
    return comandas[indice];
  }

  // Movimentações de Estoque
  static obterMovimentacoes(): MovimentacaoEstoque[] {
    return this.obterDados<MovimentacaoEstoque>(CHAVES_STORAGE.MOVIMENTACOES_ESTOQUE);
  }

  static salvarMovimentacao(movimentacao: Omit<MovimentacaoEstoque, 'id' | 'criadaEm'>): MovimentacaoEstoque {
    const movimentacoes = this.obterMovimentacoes();
    const novaMovimentacao: MovimentacaoEstoque = {
      ...movimentacao,
      id: this.gerarId(),
      criadaEm: new Date().toISOString()
    };
    
    movimentacoes.push(novaMovimentacao);
    this.salvarDados(CHAVES_STORAGE.MOVIMENTACOES_ESTOQUE, movimentacoes);
    return novaMovimentacao;
  }

  // Fornecedores
  static obterFornecedores(): Fornecedor[] {
    return this.obterDados<Fornecedor>(CHAVES_STORAGE.FORNECEDORES);
  }

  static salvarFornecedor(fornecedor: Omit<Fornecedor, 'id' | 'criadoEm'>): Fornecedor {
    const fornecedores = this.obterFornecedores();
    const novoFornecedor: Fornecedor = {
      ...fornecedor,
      id: this.gerarId(),
      criadoEm: new Date().toISOString()
    };
    
    fornecedores.push(novoFornecedor);
    this.salvarDados(CHAVES_STORAGE.FORNECEDORES, fornecedores);
    return novoFornecedor;
  }

  // Logs de Auditoria
  static salvarLogAuditoria(log: Omit<LogAuditoria, 'id' | 'criadoEm'>): LogAuditoria {
    const logs = this.obterDados<LogAuditoria>(CHAVES_STORAGE.LOGS_AUDITORIA);
    const novoLog: LogAuditoria = {
      ...log,
      id: this.gerarId(),
      criadoEm: new Date().toISOString()
    };
    
    logs.push(novoLog);
    
    // Manter apenas os últimos 1000 logs para não sobrecarregar o localStorage
    if (logs.length > 1000) {
      logs.splice(0, logs.length - 1000);
    }
    
    this.salvarDados(CHAVES_STORAGE.LOGS_AUDITORIA, logs);
    return novoLog;
  }

  static obterLogsAuditoria(): LogAuditoria[] {
    return this.obterDados<LogAuditoria>(CHAVES_STORAGE.LOGS_AUDITORIA);
  }

  // Turnos
  static obterTurnos(): TurnoFechamento[] {
    return this.obterDados<TurnoFechamento>(CHAVES_STORAGE.TURNOS);
  }

  static salvarTurno(turno: Omit<TurnoFechamento, 'id'>): TurnoFechamento {
    const turnos = this.obterTurnos();
    const novoTurno: TurnoFechamento = {
      ...turno,
      id: this.gerarId()
    };
    
    turnos.push(novoTurno);
    this.salvarDados(CHAVES_STORAGE.TURNOS, turnos);
    return novoTurno;
  }

  static atualizarTurno(id: string, dadosAtualizacao: Partial<TurnoFechamento>): TurnoFechamento | null {
    const turnos = this.obterTurnos();
    const indice = turnos.findIndex(t => t.id === id);
    
    if (indice === -1) return null;
    
    turnos[indice] = {
      ...turnos[indice],
      ...dadosAtualizacao
    };
    
    this.salvarDados(CHAVES_STORAGE.TURNOS, turnos);
    return turnos[indice];
  }

  // Utilitários
  static limparTodosDados(): void {
    if (typeof window === 'undefined') return;
    
    Object.values(CHAVES_STORAGE).forEach(chave => {
      localStorage.removeItem(chave);
    });
  }

  static exportarDados(): string {
    const dados: Record<string, any> = {};
    
    Object.entries(CHAVES_STORAGE).forEach(([nome, chave]) => {
      dados[nome] = this.obterDados(chave);
    });
    
    return JSON.stringify(dados, null, 2);
  }

  static importarDados(dadosJson: string): boolean {
    try {
      const dados = JSON.parse(dadosJson);
      
      Object.entries(CHAVES_STORAGE).forEach(([nome, chave]) => {
        if (dados[nome]) {
          this.salvarDados(chave, dados[nome]);
        }
      });
      
      return true;
    } catch (error) {
      console.error('Erro ao importar dados:', error);
      return false;
    }
  }
}
