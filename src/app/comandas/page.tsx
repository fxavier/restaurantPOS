
'use client';

import { useState, useEffect, useCallback } from 'react';
import LayoutPrincipal from '@/components/layout/layout-principal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import DataPagination from '@/components/ui/data-pagination';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Search,
  Eye,
  Edit,
  Trash2,
  Receipt,
  Clock,
  Users,
  DollarSign,
  CheckCircle,
  X,
  Printer,
  CreditCard,
  Filter,
  Calendar
} from 'lucide-react';
import { apiDataService } from '@/lib/api-data-service';
import { Comanda, StatusComanda, Mesa, Usuario } from '@/types/sistema-restaurante';

export default function PaginaComandas() {
  const [comandas, setComandas] = useState<Comanda[]>([]);
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [comandaSelecionada, setComandaSelecionada] = useState<Comanda | null>(null);
  const [dialogoDetalhesAberto, setDialogoDetalhesAberto] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<StatusComanda | 'todos'>('todos');
  const [filtroCanal, setFiltroCanal] = useState<string>('todos');
  const [filtroData, setFiltroData] = useState<string>('hoje');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    carregarMesasEUsuarios();
  }, []);

  useEffect(() => {
    carregarComandas();
  }, [currentPage, itemsPerPage, filtroStatus, filtroCanal, filtroData]);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentPage === 1) {
        carregarComandas();
      } else {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [busca]);

  const carregarMesasEUsuarios = async () => {
    try {
      // TODO: Replace with actual restaurant ID from session/context
      const restauranteId = 'default-restaurant';
      const [mesasData, usuariosData] = await Promise.all([
        apiDataService.obterMesas(restauranteId),
        apiDataService.obterUsuarios(restauranteId),
      ]);
      setMesas(mesasData || []);
      setUsuarios(usuariosData || []);
    } catch (error) {
      console.error('Erro ao carregar mesas e usuários:', error);
      toast.error('Erro ao carregar dados');
    }
  };

  const carregarComandas = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual restaurant ID from session/context
      const restauranteId = 'default-restaurant';
      
      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        restauranteId,
      });

      if (busca) {
        params.append('search', busca);
      }

      if (filtroStatus !== 'todos') {
        params.append('status', filtroStatus);
      }

      if (filtroCanal !== 'todos') {
        params.append('canal', filtroCanal);
      }

      // Add date filtering
      if (filtroData !== 'todos') {
        const hoje = new Date();
        if (filtroData === 'hoje') {
          const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
          params.append('dataInicio', inicioHoje.toISOString());
        } else if (filtroData === 'semana') {
          const inicioSemana = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - 7);
          params.append('dataInicio', inicioSemana.toISOString());
        } else if (filtroData === 'mes') {
          const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
          params.append('dataInicio', inicioMes.toISOString());
        }
      }

      // Make API call with pagination
      const response = await fetch(`/api/comandas?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setComandas(data.data || []);
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages);
          setTotalItems(data.pagination.total);
        } else {
          setTotalPages(1);
          setTotalItems(data.data?.length || 0);
        }
      } else {
        throw new Error(data.error || 'Erro ao carregar comandas');
      }
    } catch (error) {
      console.error('Erro ao carregar comandas:', error);
      toast.error('Erro ao carregar comandas');
    } finally {
      setLoading(false);
    }
  };

  const obterMesaPorId = (id?: string) => {
    return id ? mesas.find(m => m.id === id) : null;
  };

  const obterUsuarioPorId = (id: string) => {
    return usuarios.find(u => u.id === id);
  };

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleItemsPerPageChange = useCallback((newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing page size
  }, []);

  const atualizarStatusComanda = async (comandaId: string, novoStatus: StatusComanda) => {
    try {
      await apiDataService.atualizarComanda(comandaId, { status: novoStatus });
      await carregarComandas();
      toast.success(`Status da comanda atualizado para ${novoStatus}`);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status da comanda');
    }
  };

  const excluirComanda = (comanda: Comanda) => {
    if (comanda.status === 'paga') {
      toast.error('Não é possível excluir uma comanda já paga');
      return;
    }

    if (confirm(`Tem certeza que deseja excluir a comanda ${comanda.numero}?`)) {
      // Marcar comanda como cancelada em vez de excluir fisicamente
      atualizarStatusComanda(comanda.id, 'cancelada');
    }
  };

  const imprimirComanda = (comanda: Comanda) => {
    // Simular impressão
    toast.success(`Comanda ${comanda.numero} enviada para impressão`);
  };

  const processarPagamento = (comanda: Comanda) => {
    // Simular processamento de pagamento
    atualizarStatusComanda(comanda.id, 'paga');
    toast.success(`Pagamento da comanda ${comanda.numero} processado com sucesso`);
  };

  const filtrarPorData = (comanda: Comanda) => {
    const dataComanda = new Date(comanda.criadaEm);
    const hoje = new Date();
    
    switch (filtroData) {
      case 'hoje':
        return dataComanda.toDateString() === hoje.toDateString();
      case 'ontem':
        const ontem = new Date(hoje);
        ontem.setDate(hoje.getDate() - 1);
        return dataComanda.toDateString() === ontem.toDateString();
      case 'semana':
        const inicioSemana = new Date(hoje);
        inicioSemana.setDate(hoje.getDate() - 7);
        return dataComanda >= inicioSemana;
      case 'mes':
        return dataComanda.getMonth() === hoje.getMonth() && 
               dataComanda.getFullYear() === hoje.getFullYear();
      default:
        return true;
    }
  };

  // No need for local filtering since it's done on server
  const comandasFiltradas = comandas;

  const obterCorStatus = (status: StatusComanda) => {
    switch (status) {
      case 'aberta': return 'bg-blue-500';
      case 'enviada': return 'bg-purple-500';
      case 'preparando': return 'bg-yellow-500';
      case 'pronta': return 'bg-green-500';
      case 'entregue': return 'bg-teal-500';
      case 'paga': return 'bg-gray-500';
      case 'cancelada': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  // For statistics, we'll use the actual current page data
  const estatisticas = {
    total: totalItems,
    abertas: comandas.filter(c => ['aberta', 'enviada', 'preparando'].includes(c.status)).length,
    prontas: comandas.filter(c => c.status === 'pronta').length,
    pagas: comandas.filter(c => c.status === 'paga').length,
    totalVendas: comandas
      .filter(c => c.status === 'paga')
      .reduce((total, c) => total + c.total, 0)
  };

  return (
    <LayoutPrincipal titulo="Gestão de Comandas">
      <div className="space-y-6">
        {/* Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Receipt className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{estatisticas.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Em Andamento</p>
                  <p className="text-2xl font-bold">{estatisticas.abertas}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Prontas</p>
                  <p className="text-2xl font-bold">{estatisticas.prontas}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Pagas</p>
                  <p className="text-2xl font-bold">{estatisticas.pagas}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Vendas</p>
                  <p className="text-2xl font-bold">MT {estatisticas.totalVendas.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por número da comanda ou cliente..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={filtroStatus} onValueChange={(value: StatusComanda | 'todos') => setFiltroStatus(value)}>
                <SelectTrigger className="w-full lg:w-48">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Status</SelectItem>
                  <SelectItem value="aberta">Aberta</SelectItem>
                  <SelectItem value="enviada">Enviada</SelectItem>
                  <SelectItem value="preparando">Preparando</SelectItem>
                  <SelectItem value="pronta">Pronta</SelectItem>
                  <SelectItem value="entregue">Entregue</SelectItem>
                  <SelectItem value="paga">Paga</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filtroCanal} onValueChange={setFiltroCanal}>
                <SelectTrigger className="w-full lg:w-48">
                  <SelectValue placeholder="Canal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Canais</SelectItem>
                  <SelectItem value="balcao">Balcão</SelectItem>
                  <SelectItem value="takeaway">Takeaway</SelectItem>
                  <SelectItem value="delivery">Delivery</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filtroData} onValueChange={setFiltroData}>
                <SelectTrigger className="w-full lg:w-48">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hoje">Hoje</SelectItem>
                  <SelectItem value="ontem">Ontem</SelectItem>
                  <SelectItem value="semana">Última Semana</SelectItem>
                  <SelectItem value="mes">Este Mês</SelectItem>
                  <SelectItem value="todos">Todos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Comandas */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Comanda</TableHead>
                <TableHead>Cliente/Mesa</TableHead>
                <TableHead>Canal</TableHead>
                <TableHead>Itens</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criada</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comandasFiltradas.map(comanda => {
                const mesa = obterMesaPorId(comanda.mesaId);
                const garcom = obterUsuarioPorId(comanda.garcomId);
                
                return (
                  <TableRow key={comanda.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{comanda.numero}</p>
                        {garcom && (
                          <p className="text-xs text-muted-foreground">
                            Garçom: {garcom.nome}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {mesa ? (
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          Mesa {mesa.numero}
                        </div>
                      ) : (
                        <div>
                          <p className="font-medium">{comanda.clienteNome || 'Cliente'}</p>
                          {comanda.clienteTelefone && (
                            <p className="text-xs text-muted-foreground">
                              {comanda.clienteTelefone}
                            </p>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {comanda.canal}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{comanda.itens.length} item(ns)</p>
                        <p className="text-xs text-muted-foreground">
                          {comanda.itens.reduce((total, item) => total + item.quantidade, 0)} unidades
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="font-bold">
                      MT {comanda.total.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={`${obterCorStatus(comanda.status)} text-white capitalize`}
                      >
                        {comanda.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">
                          {new Date(comanda.criadaEm).toLocaleDateString('pt-PT')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(comanda.criadaEm).toLocaleTimeString('pt-PT', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setComandaSelecionada(comanda);
                            setDialogoDetalhesAberto(true);
                          }}
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => imprimirComanda(comanda)}
                        >
                          <Printer className="w-3 h-3" />
                        </Button>
                        
                        {comanda.status === 'pronta' && (
                          <Button
                            size="sm"
                            onClick={() => processarPagamento(comanda)}
                          >
                            <CreditCard className="w-3 h-3" />
                          </Button>
                        )}
                        
                        {!['paga', 'cancelada'].includes(comanda.status) && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => excluirComanda(comanda)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>

        {comandasFiltradas.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Receipt className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Nenhuma comanda encontrada com os filtros aplicados.</p>
            </CardContent>
          </Card>
        )}

        {/* Paginação */}
        {totalItems > 0 && (
          <DataPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
            isLoading={loading}
          />
        )}

        {/* Dialog de Detalhes da Comanda */}
        <Dialog open={dialogoDetalhesAberto} onOpenChange={setDialogoDetalhesAberto}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                Detalhes da Comanda {comandaSelecionada?.numero}
              </DialogTitle>
            </DialogHeader>
            
            {comandaSelecionada && (
              <div className="space-y-6">
                {/* Informações Gerais */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium mb-2">Informações Gerais</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Número:</span>
                        <span className="font-medium">{comandaSelecionada.numero}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Canal:</span>
                        <Badge variant="outline" className="capitalize">
                          {comandaSelecionada.canal}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <Badge className={`${obterCorStatus(comandaSelecionada.status)} text-white capitalize`}>
                          {comandaSelecionada.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Criada:</span>
                        <span>{new Date(comandaSelecionada.criadaEm).toLocaleString('pt-PT')}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Cliente/Mesa</h3>
                    <div className="space-y-1 text-sm">
                      {comandaSelecionada.mesaId ? (
                        <>
                          <div className="flex justify-between">
                            <span>Mesa:</span>
                            <span className="font-medium">
                              {obterMesaPorId(comandaSelecionada.mesaId)?.numero}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Área:</span>
                            <span>{obterMesaPorId(comandaSelecionada.mesaId)?.area}</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex justify-between">
                            <span>Cliente:</span>
                            <span className="font-medium">{comandaSelecionada.clienteNome || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Telefone:</span>
                            <span>{comandaSelecionada.clienteTelefone || 'N/A'}</span>
                          </div>
                        </>
                      )}
                      <div className="flex justify-between">
                        <span>Garçom:</span>
                        <span>{obterUsuarioPorId(comandaSelecionada.garcomId)?.nome || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Itens da Comanda */}
                <div>
                  <h3 className="font-medium mb-2">Itens do Pedido</h3>
                  <ScrollArea className="h-64">
                    <div className="space-y-2">
                      {comandaSelecionada.itens.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{item.produtoNome}</h4>
                            <p className="text-xs text-muted-foreground">
                              MT {item.precoUnitario.toFixed(2)} × {item.quantidade}
                            </p>
                            {item.observacoes && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Obs: {item.observacoes}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-medium">MT {item.precoTotal.toFixed(2)}</p>
                            <Badge 
                              variant="secondary" 
                              className={`text-xs ${obterCorStatus(item.status as StatusComanda)}`}
                            >
                              {item.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                {/* Resumo Financeiro */}
                <div className="bg-muted p-4 rounded-lg">
                  <h3 className="font-medium mb-2">Resumo Financeiro</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>MT {comandaSelecionada.subtotal.toFixed(2)}</span>
                    </div>
                    {comandaSelecionada.taxaServico > 0 && (
                      <div className="flex justify-between">
                        <span>Taxa de Serviço:</span>
                        <span>MT {comandaSelecionada.taxaServico.toFixed(2)}</span>
                      </div>
                    )}
                    {comandaSelecionada.impostos > 0 && (
                      <div className="flex justify-between">
                        <span>Impostos:</span>
                        <span>MT {comandaSelecionada.impostos.toFixed(2)}</span>
                      </div>
                    )}
                    {comandaSelecionada.desconto > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Desconto:</span>
                        <span>-MT {comandaSelecionada.desconto.toFixed(2)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span>MT {comandaSelecionada.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Observações */}
                {comandaSelecionada.observacoes && (
                  <div>
                    <h3 className="font-medium mb-2">Observações</h3>
                    <p className="text-sm bg-yellow-50 p-3 rounded-lg border-l-4 border-yellow-400">
                      {comandaSelecionada.observacoes}
                    </p>
                  </div>
                )}

                {/* Ações */}
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => imprimirComanda(comandaSelecionada)}
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Imprimir
                  </Button>
                  
                  {comandaSelecionada.status === 'pronta' && (
                    <Button
                      className="flex-1"
                      onClick={() => {
                        processarPagamento(comandaSelecionada);
                        setDialogoDetalhesAberto(false);
                      }}
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      Processar Pagamento
                    </Button>
                  )}
                  
                  {!['paga', 'cancelada'].includes(comandaSelecionada.status) && (
                    <Button
                      variant="destructive"
                      onClick={() => {
                        atualizarStatusComanda(comandaSelecionada.id, 'cancelada');
                        setDialogoDetalhesAberto(false);
                      }}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancelar
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </LayoutPrincipal>
  );
}
