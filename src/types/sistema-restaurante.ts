


// Tipos para o sistema de gestão de restaurante

export interface Restaurante {
  id: string;
  nome: string;
  endereco: string;
  telefone: string;
  email: string;
  nuit: string;
  inscricaoEstadual?: string;
  inscricaoMunicipal?: string;
  taxaServico: number;
  moeda: string;
  fusoHorario: string;
  criadoEm: string;
  atualizadoEm: string;
}

export interface ConfiguracaoRestaurante {
  taxaServico: number;
  impostos: ImpostoConfig[];
  moeda: string;
  fusoHorario: string;
  horarioFuncionamento: HorarioFuncionamento[];
}

export interface ImpostoConfig {
  id: string;
  nome: string;
  percentual: number;
  tipo: 'federal' | 'estadual' | 'municipal';
  ativo: boolean;
}

export interface HorarioFuncionamento {
  diaSemana: number; // 0-6 (domingo-sábado)
  abertura: string;
  fechamento: string;
  ativo: boolean;
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  username: string;
  senha?: string; // Optional for security (not always included in responses)
  telefone?: string;
  perfil: PerfilUsuario;
  permissoes: string[];
  restauranteId: string;
  ativo: boolean;
  ultimoLogin?: string;
  criadoEm: string;
  atualizadoEm: string;
}

export type PerfilUsuario = 'admin' | 'gestor' | 'caixa' | 'garcom' | 'cozinha' | 'estoquista';

export interface Mesa {
  id: string;
  numero: string;
  capacidade: number;
  area: string;
  qrCode?: string;
  status: StatusMesa;
  restauranteId: string;
  criadaEm: string;
}

export type StatusMesa = 'livre' | 'ocupada' | 'reservada' | 'manutencao';

export interface Categoria {
  id: string;
  nome: string;
  descricao?: string;
  cor: string;
  icone?: string;
  ordem: number;
  ativa: boolean;
  restauranteId: string;
}

export interface UnidadeMedida {
  id: string;
  nome: string;
  sigla: string;
  tipo: TipoUnidadeMedida;
  fatorConversao: number; // para unidade base
}

export type TipoUnidadeMedida = 'peso' | 'volume' | 'unidade';

export interface Produto {
  id: string;
  sku: string;
  nome: string;
  descricao?: string;
  imagem?: string;
  categoriaId: string;
  preco: number;
  custo: number;
  unidadeMedidaId: string;
  tempoPreparoMinutos?: number;
  disponivel: boolean;
  controlaEstoque: boolean;
  ingredientes: IngredienteProduto[];
  variacoes: VariacaoProduto[];
  precosPorCanal: PrecoPorCanal[];
  restauranteId: string;
  criadoEm: string;
  atualizadoEm: string;
}

export interface IngredienteProduto {
  ingredienteId: string;
  quantidade: number;
  unidadeMedidaId: string;
  obrigatorio: boolean;
}

export interface VariacaoProduto {
  id: string;
  nome: string;
  precoAdicional: number;
  disponivel: boolean;
}

export interface PrecoPorCanal {
  canal: CanalVenda;
  preco: number;
}

export type CanalVenda = 'balcao' | 'takeaway' | 'delivery';

export interface Menu {
  id: string;
  nome: string;
  descricao?: string;
  tipo: TipoMenu;
  imagem?: string;
  produtos?: Produto[]; // Products with full data when fetched from API
  ativo: boolean;
  restauranteId: string;
}

export interface MenuInput {
  nome: string;
  descricao?: string;
  tipo: TipoMenu;
  imagem?: string;
  produtos: string[]; // Product IDs when creating/updating
  ativo: boolean;
  restauranteId: string;
}

export type TipoMenu = 'cafe_manha' | 'almoco' | 'jantar' | 'sobremesas' | 'bebidas' | 'petiscos' | 'especial' | 'criancas' | 'vegetariano' | 'executivo';

export interface Comanda {
  id: string;
  numero: string;
  mesaId?: string;
  clienteNome?: string;
  clienteTelefone?: string;
  garcomId: string;
  itens: ItemComanda[];
  subtotal: number;
  taxaServico: number;
  impostos: number;
  desconto: number;
  total: number;
  status: StatusComanda;
  canal: CanalVenda;
  observacoes?: string;
  criadaEm: string;
  atualizadaEm: string;
  finalizadaEm?: string;
}

export type StatusComanda = 'aberta' | 'enviada' | 'preparando' | 'pronta' | 'entregue' | 'paga' | 'cancelada';

export interface ItemComanda {
  id: string;
  produtoId: string;
  produtoNome: string;
  quantidade: number;
  precoUnitario: number;
  precoTotal: number;
  variacoes: VariacaoSelecionada[];
  observacoes?: string;
  status: StatusItemComanda;
  tempoPreparoEstimado?: number;
  iniciadoPreparoEm?: string;
  prontoEm?: string;
}

export type StatusItemComanda = 'pendente' | 'preparando' | 'pronto' | 'entregue' | 'cancelado';

export interface VariacaoSelecionada {
  id: string;
  nome: string;
  precoAdicional: number;
}

export interface Pagamento {
  id: string;
  comandaId: string;
  valor: number;
  metodoPagamento: MetodoPagamento;
  status: StatusPagamento;
  referencia?: string;
  processadoEm?: string;
  criadoEm: string;
}

export type MetodoPagamento = 'dinheiro' | 'cartao_debito' | 'cartao_credito' | 'pix' | 'mbway' | 'vale_refeicao';
export type StatusPagamento = 'pendente' | 'processando' | 'aprovado' | 'rejeitado' | 'cancelado';

export interface MovimentacaoEstoque {
  id: string;
  produtoId: string;
  tipo: TipoMovimentacao;
  quantidade: number;
  valorUnitario?: number;
  valorTotal?: number;
  motivo: string;
  usuarioId: string;
  documentoReferencia?: string;
  criadaEm: string;
}

export type TipoMovimentacao = 'entrada' | 'saida' | 'ajuste' | 'transferencia' | 'perda';

export interface Fornecedor {
  id: string;
  nome: string;
  nuit?: string;
  contato: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  ativo: boolean;
  restauranteId: string;
  criadoEm: string;
}

export interface OrdemCompra {
  id: string;
  numero: string;
  fornecedorId: string;
  fornecedor?: {
    id: string;
    nome: string;
    contato?: string;
  };
  itens: ItemOrdemCompra[];
  subtotal: number;
  impostos: number;
  total: number;
  status: StatusOrdemCompra;
  dataEntregaPrevista?: string;
  observacoes?: string;
  usuarioId: string;
  usuario?: {
    id: string;
    nome: string;
  };
  restauranteId: string;
  criadaEm: string;
  atualizadaEm: string;
  _count?: {
    itens: number;
  };
}

export type StatusOrdemCompra = 'rascunho' | 'enviada' | 'confirmada' | 'recebida' | 'cancelada';

export interface ItemOrdemCompra {
  id: string;
  ordemCompraId?: string;
  produtoId: string;
  produtoNome?: string;
  produto?: {
    id: string;
    nome: string;
    sku?: string;
  };
  quantidade: number;
  precoUnitario: number;
  precoTotal: number;
  quantidadeRecebida?: number;
  unidadeMedidaId?: string;
  unidadeMedida?: {
    id: string;
    nome: string;
    sigla: string;
  };
}

export interface Entrega {
  id: string;
  numero: string;
  comandaId: string;
  comandaNumero: string;
  clienteNome: string;
  clienteTelefone: string;
  entregadorNome: string;
  entregadorTelefone: string;
  enderecoEntrega: string;
  observacoes?: string;
  taxaEntrega: number;
  valorTotal: number;
  tempoEstimado: number;
  status: StatusEntrega;
  restauranteId: string;
  dataEntrega?: string;
  criadaEm: string;
  atualizadaEm: string;
}

export type StatusEntrega = 'pendente' | 'preparando' | 'saiu_entrega' | 'entregue' | 'cancelada';

export interface EnderecoEntrega {
  rua: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  cep: string;
  referencia?: string;
}

export interface Entregador {
  id: string;
  nome: string;
  telefone: string;
  veiculo: string;
  placa?: string;
  ativo: boolean;
  restauranteId: string;
}

export interface LogAuditoria {
  id: string;
  usuarioId: string;
  usuarioNome: string;
  acao: TipoAcaoAuditoria;
  entidade: string;
  entidadeId: string;
  detalhes: string;
  dadosAnteriores?: any;
  dadosNovos?: any;
  ip?: string;
  userAgent?: string;
  criadoEm: string;
}

export type TipoAcaoAuditoria = 'criar' | 'editar' | 'excluir' | 'login' | 'logout' | 'erro';

export interface RelatorioVendas {
  periodo: {
    inicio: string;
    fim: string;
  };
  totalVendas: number;
  quantidadePedidos: number;
  ticketMedio: number;
  vendasPorCanal: VendasPorCanal[];
  produtosMaisVendidos: ProdutoVendido[];
  vendasPorHora: VendasPorHora[];
  vendasPorDia: VendasPorDia[];
}

export interface VendasPorCanal {
  canal: CanalVenda;
  total: number;
  quantidade: number;
  percentual: number;
}

export interface ProdutoVendido {
  produtoId: string;
  produtoNome: string;
  quantidade: number;
  total: number;
}

export interface VendasPorHora {
  hora: number;
  total: number;
  quantidade: number;
}

export interface VendasPorDia {
  data: string;
  total: number;
  quantidade: number;
}

export interface TurnoFechamento {
  id: string;
  usuarioId: string;
  dataAbertura: string;
  dataFechamento?: string;
  valorAbertura: number;
  valorFechamento?: number;
  totalVendas: number;
  totalDinheiro: number;
  totalCartao: number;
  totalOutros: number;
  diferencaCaixa?: number;
  observacoes?: string;
  status: 'aberto' | 'fechado';
}

