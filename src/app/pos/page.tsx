'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Check,
  User,
  MapPin,
  DollarSign,
  Utensils,
  Coffee,
  Package,
} from 'lucide-react';
import LayoutPrincipal from '@/components/layout/layout-principal';
import { apiDataService } from '@/lib/api-data-service';
import {
  Produto,
  Categoria,
  Mesa,
  Comanda,
  ItemComanda,
  StatusMesa,
  CanalVenda,
  StatusComanda,
} from '@/types/sistema-restaurante';

interface ItemCarrinho {
  produto: Produto;
  quantidade: number;
  precoUnitario: number;
  observacoes?: string;
  variacao?: string;
}

interface PedidoFormulario {
  canalVenda: CanalVenda;
  mesaId?: string;
  clienteNome?: string;
  clienteTelefone?: string;
  endereco?: string;
  observacoes?: string;
}

const formularioVazio: PedidoFormulario = {
  canalVenda: 'balcao',
  mesaId: '',
  clienteNome: '',
  clienteTelefone: '',
  endereco: '',
  observacoes: '',
};

export default function PaginaPOS() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string>('todas');
  const [termoPesquisa, setTermoPesquisa] = useState('');
  const [formulario, setFormulario] = useState<PedidoFormulario>(formularioVazio);
  const [dialogoFinalizacao, setDialogoFinalizacao] = useState(false);
  const [loading, setLoading] = useState(true);
  const [finalizandoPedido, setFinalizandoPedido] = useState(false);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = useCallback(async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual restaurant ID from session/context
      const restauranteId = 'cmg3w1utw005j2gzkrott9zul';
      
      const [produtosData, categoriasData, mesasData] = await Promise.all([
        apiDataService.obterProdutos(restauranteId),
        apiDataService.obterCategorias(restauranteId),
        apiDataService.obterMesas(restauranteId),
      ]);

      setProdutos(produtosData.filter(p => p.disponivel));
      setCategorias(categoriasData.filter(c => c.ativa));
      setMesas(mesasData.filter(m => m.status === 'livre'));
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados do POS');
    } finally {
      setLoading(false);
    }
  }, []);

  const produtosFiltrados = produtos.filter((produto) => {
    const correspondeCategoria = categoriaSelecionada === 'todas' || produto.categoriaId === categoriaSelecionada;
    const correspondePesquisa = produto.nome.toLowerCase().includes(termoPesquisa.toLowerCase()) ||
      produto.descricao?.toLowerCase().includes(termoPesquisa.toLowerCase());
    
    return correspondeCategoria && correspondePesquisa;
  });

  const adicionarAoCarrinho = (produto: Produto) => {
    const itemExistente = carrinho.find(item => item.produto.id === produto.id);
    
    if (itemExistente) {
      setCarrinho(carrinho.map(item =>
        item.produto.id === produto.id
          ? { ...item, quantidade: item.quantidade + 1 }
          : item
      ));
    } else {
      setCarrinho([...carrinho, {
        produto,
        quantidade: 1,
        precoUnitario: produto.preco,
      }]);
    }
    
    toast.success(`${produto.nome} adicionado ao carrinho`);
  };

  const removerDoCarrinho = (produtoId: string) => {
    setCarrinho(carrinho.filter(item => item.produto.id !== produtoId));
  };

  const atualizarQuantidade = (produtoId: string, novaQuantidade: number) => {
    if (novaQuantidade <= 0) {
      removerDoCarrinho(produtoId);
      return;
    }
    
    setCarrinho(carrinho.map(item =>
      item.produto.id === produtoId
        ? { ...item, quantidade: novaQuantidade }
        : item
    ));
  };

  const calcularSubtotal = () => {
    return carrinho.reduce((total, item) => total + (item.precoUnitario * item.quantidade), 0);
  };

  const calcularImpostos = () => {
    const subtotal = calcularSubtotal();
    return subtotal * 0.16; // IVA 16% (Moçambique)
  };

  const calcularTotal = () => {
    return calcularSubtotal() + calcularImpostos();
  };

  const obterNomeCategoria = (categoriaId: string) => {
    const categoria = categorias.find(c => c.id === categoriaId);
    return categoria?.nome || 'Sem categoria';
  };

  const obterIconeCategoria = (categoriaId: string) => {
    const categoria = categorias.find(c => c.id === categoriaId);
    const nome = categoria?.nome.toLowerCase() || '';
    
    if (nome.includes('bebida') || nome.includes('drink')) return Coffee;
    if (nome.includes('comida') || nome.includes('prato')) return Utensils;
    return Package;
  };

  const finalizarPedido = async () => {
    if (carrinho.length === 0) {
      toast.error('Adicione itens ao carrinho antes de finalizar');
      return;
    }

    if (formulario.canalVenda === 'takeaway' && !formulario.mesaId) {
      toast.error('Selecione uma mesa para pedidos no salão');
      return;
    }

    if (formulario.canalVenda === 'delivery' && (!formulario.clienteNome || !formulario.endereco)) {
      toast.error('Preencha o nome do cliente e endereço para entrega');
      return;
    }

    setFinalizandoPedido(true);
    try {
      // TODO: Replace with actual restaurant ID from session/context
      const restauranteId = 'cmg3w1utw005j2gzkrott9zul';
      
      // Atualizar status da mesa se for pedido de mesa
      if (formulario.canalVenda === 'takeaway' && formulario.mesaId) {
        await apiDataService.atualizarStatusMesa(formulario.mesaId, 'ocupada');
      }

      // Criar a comanda
      const comandaData = {
        numero: `CMD${Date.now()}`,
        canal: formulario.canalVenda,
        mesaId: formulario.mesaId || undefined,
        clienteNome: formulario.clienteNome || undefined,
        clienteTelefone: formulario.clienteTelefone || undefined,
        garcomId: 'sistema-admin', // Using system admin as garcom
        subtotal: calcularSubtotal(),
        taxaServico: 0, // No service charge for POS
        impostos: calcularImpostos(),
        desconto: 0, // No discount for basic POS
        total: calcularTotal(),
        status: 'aberta' as StatusComanda,
        observacoes: formulario.observacoes || undefined,
        itens: carrinho.map(item => ({
          id: `item-${Date.now()}-${Math.random()}`,
          produtoId: item.produto.id,
          produtoNome: item.produto.nome,
          quantidade: item.quantidade,
          precoUnitario: item.precoUnitario,
          precoTotal: item.precoUnitario * item.quantidade,
          variacoes: [], // No variations in basic POS
          observacoes: item.observacoes,
          status: 'pendente' as const,
        })),
      };

      const novaComanda = await apiDataService.salvarComanda(comandaData);
      
      if (novaComanda) {
        toast.success('Pedido finalizado com sucesso!');
        
        // Limpar carrinho e formulário
        setCarrinho([]);
        setFormulario(formularioVazio);
        setDialogoFinalizacao(false);
        
        // Recarregar dados para atualizar mesas disponíveis
        await carregarDados();
      } else {
        throw new Error('Falha ao criar pedido');
      }
    } catch (error) {
      console.error('Erro ao finalizar pedido:', error);
      toast.error('Erro ao finalizar pedido');
    } finally {
      setFinalizandoPedido(false);
    }
  };

  const limparCarrinho = () => {
    setCarrinho([]);
    toast.success('Carrinho limpo');
  };

  if (loading) {
    return (
      <LayoutPrincipal>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="ml-4 text-muted-foreground">Carregando POS...</p>
        </div>
      </LayoutPrincipal>
    );
  }

  return (
    <LayoutPrincipal>
      <div className="flex h-[calc(100vh-120px)] gap-6">
        {/* Painel de Produtos */}
        <div className="flex-1 space-y-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-primary">Point of Sale</h1>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Pesquisar produtos..."
                  value={termoPesquisa}
                  onChange={(e) => setTermoPesquisa(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select value={categoriaSelecionada} onValueChange={setCategoriaSelecionada}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as Categorias</SelectItem>
                  {categorias.map((categoria) => (
                    <SelectItem key={categoria.id} value={categoria.id}>
                      {categoria.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Grid de Produtos */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 max-h-[calc(100vh-220px)] overflow-y-auto">
            {produtosFiltrados.map((produto) => {
              const IconeCategoria = obterIconeCategoria(produto.categoriaId);
              return (
                <Card
                  key={produto.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => adicionarAoCarrinho(produto)}
                >
                  <CardContent className="p-4">
                    <div className="text-center space-y-2">
                      {produto.imagem ? (
                        <img
                          src={produto.imagem}
                          alt={produto.nome}
                          className="w-16 h-16 mx-auto rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 mx-auto rounded-lg bg-muted flex items-center justify-center">
                          <IconeCategoria className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <h3 className="font-semibold text-sm">{produto.nome}</h3>
                      <p className="text-xs text-muted-foreground">
                        {obterNomeCategoria(produto.categoriaId)}
                      </p>
                      <p className="font-bold text-primary">MT {produto.preco.toFixed(2)}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {produtosFiltrados.length === 0 && (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum produto encontrado</h3>
              <p className="text-muted-foreground">
                {termoPesquisa
                  ? 'Tente ajustar os filtros de pesquisa.'
                  : 'Adicione produtos ao sistema para começar a vender.'}
              </p>
            </div>
          )}
        </div>

        {/* Painel do Carrinho */}
        <div className="w-80 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Carrinho ({carrinho.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {carrinho.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingCart className="mx-auto h-8 w-8 mb-2" />
                  <p>Carrinho vazio</p>
                  <p className="text-sm">Adicione produtos para começar</p>
                </div>
              ) : (
                <>
                  <div className="max-h-64 overflow-y-auto space-y-3">
                    {carrinho.map((item) => (
                      <div key={item.produto.id} className="flex items-center gap-2 p-2 border rounded">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{item.produto.nome}</p>
                          <p className="text-xs text-muted-foreground">
                            MT {item.precoUnitario.toFixed(2)} × {item.quantidade}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => atualizarQuantidade(item.produto.id, item.quantidade - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm">{item.quantidade}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => atualizarQuantidade(item.produto.id, item.quantidade + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removerDoCarrinho(item.produto.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Totais */}
                  <div className="border-t pt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span>MT {calcularSubtotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>IVA (16%):</span>
                      <span>MT {calcularImpostos().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>Total:</span>
                      <span>MT {calcularTotal().toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={limparCarrinho}
                      className="flex-1"
                    >
                      Limpar
                    </Button>
                    <Dialog open={dialogoFinalizacao} onOpenChange={setDialogoFinalizacao}>
                      <DialogTrigger asChild>
                        <Button className="flex-1">
                          <Check className="mr-2 h-4 w-4" />
                          Finalizar
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Finalizar Pedido</DialogTitle>
                        </DialogHeader>
                        
                        <div className="space-y-4">
                          <div>
                            <Label>Canal de Venda</Label>
                            <Select
                              value={formulario.canalVenda}
                              onValueChange={(value: CanalVenda) =>
                                setFormulario(prev => ({ ...prev, canalVenda: value }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="balcao">
                                  <div className="flex items-center gap-2">
                                    <DollarSign className="h-4 w-4" />
                                    Balcão
                                  </div>
                                </SelectItem>
                                <SelectItem value="takeaway">
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    Mesa
                                  </div>
                                </SelectItem>
                                <SelectItem value="delivery">
                                  <div className="flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    Entrega
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {formulario.canalVenda === 'takeaway' && (
                            <div>
                              <Label>Mesa</Label>
                              <Select
                                value={formulario.mesaId}
                                onValueChange={(value) =>
                                  setFormulario(prev => ({ ...prev, mesaId: value }))
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione uma mesa" />
                                </SelectTrigger>
                                <SelectContent>
                                  {mesas.map((mesa) => (
                                    <SelectItem key={mesa.id} value={mesa.id}>
                                      Mesa {mesa.numero} - {mesa.capacidade} pessoas
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          {formulario.canalVenda === 'delivery' && (
                            <>
                              <div>
                                <Label>Nome do Cliente</Label>
                                <Input
                                  value={formulario.clienteNome}
                                  onChange={(e) =>
                                    setFormulario(prev => ({ ...prev, clienteNome: e.target.value }))
                                  }
                                  placeholder="Nome completo"
                                />
                              </div>
                              <div>
                                <Label>Telefone</Label>
                                <Input
                                  value={formulario.clienteTelefone}
                                  onChange={(e) =>
                                    setFormulario(prev => ({ ...prev, clienteTelefone: e.target.value }))
                                  }
                                  placeholder="Número de telefone"
                                />
                              </div>
                              <div>
                                <Label>Endereço de Entrega</Label>
                                <Textarea
                                  value={formulario.endereco}
                                  onChange={(e) =>
                                    setFormulario(prev => ({ ...prev, endereco: e.target.value }))
                                  }
                                  placeholder="Endereço completo para entrega"
                                  rows={2}
                                />
                              </div>
                            </>
                          )}

                          <div>
                            <Label>Observações</Label>
                            <Textarea
                              value={formulario.observacoes}
                              onChange={(e) =>
                                setFormulario(prev => ({ ...prev, observacoes: e.target.value }))
                              }
                              placeholder="Observações do pedido..."
                              rows={2}
                            />
                          </div>

                          {/* Resumo do Pedido */}
                          <div className="border-t pt-4">
                            <h4 className="font-semibold mb-2">Resumo do Pedido</h4>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span>Subtotal:</span>
                                <span>MT {calcularSubtotal().toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>IVA (16%):</span>
                                <span>MT {calcularImpostos().toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between font-bold">
                                <span>Total:</span>
                                <span>MT {calcularTotal().toFixed(2)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2 pt-4">
                            <Button
                              variant="outline"
                              onClick={() => setDialogoFinalizacao(false)}
                              className="flex-1"
                            >
                              Cancelar
                            </Button>
                            <Button
                              onClick={finalizarPedido}
                              disabled={finalizandoPedido}
                              className="flex-1"
                            >
                              {finalizandoPedido ? 'Finalizando...' : 'Confirmar Pedido'}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </LayoutPrincipal>
  );
}