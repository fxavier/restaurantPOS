'use client';

import { useState, useEffect } from 'react';
import LayoutPrincipal from '@/components/layout/layout-principal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import DataPagination from '@/components/ui/data-pagination';
import { toast } from 'sonner';
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Search,
  Filter,
  Plus,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Banknote,
  Smartphone,
  Wallet,
  Edit,
  Trash
} from 'lucide-react';
import { Pagamento, MetodoPagamento, StatusPagamento, Comanda } from '@/types/sistema-restaurante';

interface PagamentoExtendido extends Pagamento {
  comanda?: {
    id: string;
    numero: string;
    total: number;
    clienteNome?: string;
    restaurante?: {
      id: string;
      nome: string;
    };
  };
}

export default function PaginaPagamentos() {
  const [pagamentos, setPagamentos] = useState<PagamentoExtendido[]>([]);
  const [comandas, setComandas] = useState<Comanda[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState<StatusPagamento | 'todos'>('todos');
  const [filtroMetodo, setFiltroMetodo] = useState<MetodoPagamento | 'todos'>('todos');
  const [termoBusca, setTermoBusca] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  // TODO: Replace with actual restaurant ID from session/context
  const RESTAURANT_ID = 'cmg3w1utw005j2gzkrott9zul';
  
  // Modal de novo pagamento
  const [modalAberto, setModalAberto] = useState(false);
  const [modalEditarAberto, setModalEditarAberto] = useState(false);
  const [pagamentoSelecionado, setPagamentoSelecionado] = useState<PagamentoExtendido | null>(null);
  const [comandaSelecionada, setComandaSelecionada] = useState('');
  const [valorPagamento, setValorPagamento] = useState('');
  const [metodoPagamento, setMetodoPagamento] = useState<MetodoPagamento>('dinheiro');
  const [referenciaPagamento, setReferenciaPagamento] = useState('');

  useEffect(() => {
    carregarDados();
    carregarComandas();
  }, [currentPage, itemsPerPage]);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentPage === 1) {
        carregarDados();
      } else {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [termoBusca, filtroStatus, filtroMetodo, dataInicio, dataFim]);

  const carregarDados = async () => {
    try {
      setCarregando(true);

      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      });

      if (termoBusca) {
        params.append('search', termoBusca);
      }

      if (filtroStatus !== 'todos') {
        params.append('status', filtroStatus);
      }

      if (filtroMetodo !== 'todos') {
        params.append('metodoPagamento', filtroMetodo);
      }

      if (dataInicio) {
        params.append('dataInicio', dataInicio);
      }

      if (dataFim) {
        params.append('dataFim', dataFim);
      }

      const response = await fetch(`/api/pagamentos?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Erro ao carregar pagamentos');
      }

      const data = await response.json();
      const pagamentosArray = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];

      setPagamentos(pagamentosArray);

      // Set pagination info
      if (data?.pagination) {
        setTotalPages(data.pagination.totalPages);
        setTotalItems(data.pagination.total);
      }

    } catch (error) {
      console.error('Erro ao carregar pagamentos:', error);
      toast.error('Erro ao carregar pagamentos');
    } finally {
      setCarregando(false);
    }
  };

  const carregarComandas = async () => {
    try {
      const response = await fetch(`/api/comandas?restauranteId=${RESTAURANT_ID}&status=pronta&status=entregue&limit=100`);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar comandas');
      }

      const data = await response.json();
      const comandasArray = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      
      // Filter comandas that are not fully paid
      const comandasDisponiveis = comandasArray.filter((comanda: Comanda) => 
        comanda.status !== 'paga' && comanda.status !== 'cancelada'
      );
      
      setComandas(comandasDisponiveis);

    } catch (error) {
      console.error('Erro ao carregar comandas:', error);
      toast.error('Erro ao carregar comandas disponíveis');
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (itemsPerPage: number) => {
    setItemsPerPage(itemsPerPage);
    setCurrentPage(1);
  };

  const processarPagamento = async () => {
    if (!comandaSelecionada || !valorPagamento) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const valor = parseFloat(valorPagamento);
    if (valor <= 0) {
      toast.error('Valor deve ser maior que zero');
      return;
    }

    try {
      const novoPagamento = {
        comandaId: comandaSelecionada,
        valor,
        metodoPagamento,
        status: metodoPagamento === 'dinheiro' ? 'aprovado' : 'pendente',
        referencia: referenciaPagamento || undefined,
      };

      const response = await fetch('/api/pagamentos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(novoPagamento),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao processar pagamento');
      }

      toast.success('Pagamento processado com sucesso!');
      await carregarDados();
      await carregarComandas();
      setModalAberto(false);
      limparFormulario();

    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao processar pagamento');
    }
  };

  const editarPagamento = async () => {
    if (!pagamentoSelecionado || !valorPagamento) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const valor = parseFloat(valorPagamento);
    if (valor <= 0) {
      toast.error('Valor deve ser maior que zero');
      return;
    }

    try {
      const dadosAtualizacao = {
        valor,
        metodoPagamento,
        status: pagamentoSelecionado.status,
        referencia: referenciaPagamento || undefined,
      };

      const response = await fetch(`/api/pagamentos/${pagamentoSelecionado.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dadosAtualizacao),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao atualizar pagamento');
      }

      toast.success('Pagamento atualizado com sucesso!');
      await carregarDados();
      setModalEditarAberto(false);
      limparFormulario();

    } catch (error) {
      console.error('Erro ao atualizar pagamento:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar pagamento');
    }
  };

  const abrirModalEdicao = (pagamento: PagamentoExtendido) => {
    setPagamentoSelecionado(pagamento);
    setValorPagamento(pagamento.valor.toString());
    setMetodoPagamento(pagamento.metodoPagamento);
    setReferenciaPagamento(pagamento.referencia || '');
    setModalEditarAberto(true);
  };

  const limparFormulario = () => {
    setComandaSelecionada('');
    setValorPagamento('');
    setMetodoPagamento('dinheiro');
    setReferenciaPagamento('');
    setPagamentoSelecionado(null);
  };

  const atualizarStatusPagamento = async (pagamentoId: string, novoStatus: StatusPagamento) => {
    try {
      const pagamento = pagamentos.find(p => p.id === pagamentoId);
      if (!pagamento) return;

      const dadosAtualizacao = {
        valor: pagamento.valor,
        metodoPagamento: pagamento.metodoPagamento,
        status: novoStatus,
        referencia: pagamento.referencia,
      };

      const response = await fetch(`/api/pagamentos/${pagamentoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dadosAtualizacao),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao atualizar status');
      }

      toast.success('Status do pagamento atualizado');
      await carregarDados();
      await carregarComandas();

    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar status');
    }
  };

  const excluirPagamento = async (pagamentoId: string) => {
    if (!confirm('Tem certeza que deseja excluir este pagamento?')) {
      return;
    }

    try {
      const response = await fetch(`/api/pagamentos/${pagamentoId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao excluir pagamento');
      }

      toast.success('Pagamento excluído com sucesso');
      await carregarDados();
      await carregarComandas();

    } catch (error) {
      console.error('Erro ao excluir pagamento:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir pagamento');
    }
  };

  const obterIconeMetodo = (metodo: MetodoPagamento) => {
    switch (metodo) {
      case 'dinheiro':
        return <Banknote className="w-4 h-4" />;
      case 'cartao_debito':
      case 'cartao_credito':
        return <CreditCard className="w-4 h-4" />;
      case 'pix':
      case 'mbway':
        return <Smartphone className="w-4 h-4" />;
      case 'vale_refeicao':
        return <Wallet className="w-4 h-4" />;
      default:
        return <DollarSign className="w-4 h-4" />;
    }
  };

  const obterCorStatus = (status: StatusPagamento) => {
    switch (status) {
      case 'aprovado':
        return 'bg-green-100 text-green-800';
      case 'rejeitado':
      case 'cancelado':
        return 'bg-red-100 text-red-800';
      case 'processando':
        return 'bg-yellow-100 text-yellow-800';
      case 'pendente':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const obterNomeMetodo = (metodo: MetodoPagamento) => {
    const nomes = {
      'dinheiro': 'Dinheiro',
      'cartao_debito': 'Cartão Débito',
      'cartao_credito': 'Cartão Crédito',
      'pix': 'PIX',
      'mbway': 'MB WAY',
      'vale_refeicao': 'Vale Refeição'
    };
    return nomes[metodo] || metodo;
  };

  const obterNomeStatus = (status: StatusPagamento) => {
    const nomes = {
      'pendente': 'Pendente',
      'processando': 'Processando',
      'aprovado': 'Aprovado',
      'rejeitado': 'Rejeitado',
      'cancelado': 'Cancelado'
    };
    return nomes[status] || status;
  };

  // Estatísticas
  const totalPagamentos = totalItems;
  const pagamentosAprovados = pagamentos.filter(p => p.status === 'aprovado').length;
  const valorTotalAprovado = pagamentos
    .filter(p => p.status === 'aprovado')
    .reduce((total, p) => total + p.valor, 0);
  const pagamentosPendentes = pagamentos.filter(p => p.status === 'pendente' || p.status === 'processando').length;

  return (
    <LayoutPrincipal titulo="Gestão de Pagamentos">
      <div className="space-y-6">
        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CreditCard className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total de Pagamentos</p>
                  <p className="text-2xl font-bold">{totalPagamentos}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Aprovados</p>
                  <p className="text-2xl font-bold">{pagamentosAprovados}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Pendentes</p>
                  <p className="text-2xl font-bold">{pagamentosPendentes}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Valor Total</p>
                  <p className="text-2xl font-bold">MT {valorTotalAprovado.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pagamentos" className="w-full">
          <TabsList>
            <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
            <TabsTrigger value="processar">Processar Pagamento</TabsTrigger>
          </TabsList>

          <TabsContent value="pagamentos" className="space-y-4">
            {/* Filtros */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Filtros</span>
                  <Dialog open={modalAberto} onOpenChange={setModalAberto}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Novo Pagamento
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Processar Novo Pagamento</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="comanda">Comanda *</Label>
                          <Select value={comandaSelecionada} onValueChange={setComandaSelecionada}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione uma comanda" />
                            </SelectTrigger>
                            <SelectContent>
                              {comandas.map((comanda) => (
                                <SelectItem key={comanda.id} value={comanda.id}>
                                  #{comanda.numero} - {comanda.clienteNome || 'Cliente'} - MT {comanda.total.toFixed(2)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="valor">Valor *</Label>
                          <Input
                            id="valor"
                            type="number"
                            step="0.01"
                            value={valorPagamento}
                            onChange={(e) => setValorPagamento(e.target.value)}
                            placeholder="0.00"
                          />
                        </div>

                        <div>
                          <Label htmlFor="metodo">Método de Pagamento *</Label>
                          <Select value={metodoPagamento} onValueChange={(value: MetodoPagamento) => setMetodoPagamento(value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="dinheiro">Dinheiro</SelectItem>
                              <SelectItem value="cartao_debito">Cartão Débito</SelectItem>
                              <SelectItem value="cartao_credito">Cartão Crédito</SelectItem>
                              <SelectItem value="pix">PIX</SelectItem>
                              <SelectItem value="mbway">MB WAY</SelectItem>
                              <SelectItem value="vale_refeicao">Vale Refeição</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="referencia">Referência</Label>
                          <Input
                            id="referencia"
                            value={referenciaPagamento}
                            onChange={(e) => setReferenciaPagamento(e.target.value)}
                            placeholder="Número da transação, etc."
                          />
                        </div>

                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => setModalAberto(false)}>
                            Cancelar
                          </Button>
                          <Button onClick={processarPagamento}>
                            Processar Pagamento
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <Label htmlFor="busca">Buscar</Label>
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="busca"
                        placeholder="Comanda, cliente..."
                        value={termoBusca}
                        onChange={(e) => setTermoBusca(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={filtroStatus} onValueChange={(value: any) => setFiltroStatus(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="processando">Processando</SelectItem>
                        <SelectItem value="aprovado">Aprovado</SelectItem>
                        <SelectItem value="rejeitado">Rejeitado</SelectItem>
                        <SelectItem value="cancelado">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="metodo">Método</Label>
                    <Select value={filtroMetodo} onValueChange={(value: any) => setFiltroMetodo(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="dinheiro">Dinheiro</SelectItem>
                        <SelectItem value="cartao_debito">Cartão Débito</SelectItem>
                        <SelectItem value="cartao_credito">Cartão Crédito</SelectItem>
                        <SelectItem value="pix">PIX</SelectItem>
                        <SelectItem value="mbway">MB WAY</SelectItem>
                        <SelectItem value="vale_refeicao">Vale Refeição</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="dataInicio">Data Início</Label>
                    <Input
                      id="dataInicio"
                      type="date"
                      value={dataInicio}
                      onChange={(e) => setDataInicio(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="dataFim">Data Fim</Label>
                    <Input
                      id="dataFim"
                      type="date"
                      value={dataFim}
                      onChange={(e) => setDataFim(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lista de Pagamentos */}
            <Card>
              <CardHeader>
                <CardTitle>Pagamentos ({totalItems})</CardTitle>
              </CardHeader>
              <CardContent>
                {carregando ? (
                  <div className="text-center py-8">
                    <p>Carregando pagamentos...</p>
                  </div>
                ) : pagamentos.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Nenhum pagamento encontrado</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Comanda</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Método</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagamentos.map((pagamento) => (
                        <TableRow key={pagamento.id}>
                          <TableCell className="font-medium">
                            #{pagamento.comanda?.numero || 'N/A'}
                          </TableCell>
                          <TableCell>{pagamento.comanda?.clienteNome || 'Cliente'}</TableCell>
                          <TableCell className="font-medium">MT {pagamento.valor.toFixed(2)}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              {obterIconeMetodo(pagamento.metodoPagamento)}
                              <span className="ml-2">{obterNomeMetodo(pagamento.metodoPagamento)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={obterCorStatus(pagamento.status)}>
                              {obterNomeStatus(pagamento.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(pagamento.criadoEm).toLocaleDateString('pt-PT')}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-1">
                              {pagamento.status === 'processando' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => atualizarStatusPagamento(pagamento.id, 'aprovado')}
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => atualizarStatusPagamento(pagamento.id, 'rejeitado')}
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                              {pagamento.status === 'pendente' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => atualizarStatusPagamento(pagamento.id, 'processando')}
                                >
                                  Processar
                                </Button>
                              )}
                              {pagamento.status !== 'aprovado' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => abrirModalEdicao(pagamento)}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => excluirPagamento(pagamento.id)}
                                  >
                                    <Trash className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Paginação */}
            {!carregando && totalItems > 0 && (
              <DataPagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handleItemsPerPageChange}
                isLoading={carregando}
              />
            )}
          </TabsContent>

          <TabsContent value="processar" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Processar Novo Pagamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="comanda-form">Comanda *</Label>
                    <Select value={comandaSelecionada} onValueChange={setComandaSelecionada}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma comanda" />
                      </SelectTrigger>
                      <SelectContent>
                        {comandas.map((comanda) => (
                          <SelectItem key={comanda.id} value={comanda.id}>
                            #{comanda.numero} - {comanda.clienteNome || 'Cliente'} - MT {comanda.total.toFixed(2)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="valor-form">Valor *</Label>
                    <Input
                      id="valor-form"
                      type="number"
                      step="0.01"
                      value={valorPagamento}
                      onChange={(e) => setValorPagamento(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <Label htmlFor="metodo-form">Método de Pagamento *</Label>
                    <Select value={metodoPagamento} onValueChange={(value: MetodoPagamento) => setMetodoPagamento(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dinheiro">Dinheiro</SelectItem>
                        <SelectItem value="cartao_debito">Cartão Débito</SelectItem>
                        <SelectItem value="cartao_credito">Cartão Crédito</SelectItem>
                        <SelectItem value="pix">PIX</SelectItem>
                        <SelectItem value="mbway">MB WAY</SelectItem>
                        <SelectItem value="vale_refeicao">Vale Refeição</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="referencia-form">Referência</Label>
                    <Input
                      id="referencia-form"
                      value={referenciaPagamento}
                      onChange={(e) => setReferenciaPagamento(e.target.value)}
                      placeholder="Número da transação, etc."
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={limparFormulario}>
                    Limpar
                  </Button>
                  <Button onClick={processarPagamento}>
                    Processar Pagamento
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog Editar Pagamento */}
        <Dialog open={modalEditarAberto} onOpenChange={setModalEditarAberto}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Pagamento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="valor-edit">Valor *</Label>
                <Input
                  id="valor-edit"
                  type="number"
                  step="0.01"
                  value={valorPagamento}
                  onChange={(e) => setValorPagamento(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="metodo-edit">Método de Pagamento *</Label>
                <Select value={metodoPagamento} onValueChange={(value: MetodoPagamento) => setMetodoPagamento(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="cartao_debito">Cartão Débito</SelectItem>
                    <SelectItem value="cartao_credito">Cartão Crédito</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="mbway">MB WAY</SelectItem>
                    <SelectItem value="vale_refeicao">Vale Refeição</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="referencia-edit">Referência</Label>
                <Input
                  id="referencia-edit"
                  value={referenciaPagamento}
                  onChange={(e) => setReferenciaPagamento(e.target.value)}
                  placeholder="Número da transação, etc."
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setModalEditarAberto(false)}>
                  Cancelar
                </Button>
                <Button onClick={editarPagamento}>
                  Atualizar Pagamento
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </LayoutPrincipal>
  );
}