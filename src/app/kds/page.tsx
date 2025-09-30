'use client';

import { useState, useEffect, useCallback } from 'react';
import LayoutPrincipal from '@/components/layout/layout-principal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import DataPagination from '@/components/ui/data-pagination';
import { toast } from 'sonner';
import {
  Clock,
  ChefHat,
  CheckCircle,
  Truck,
  AlertTriangle,
  Timer,
  Users,
  Play,
  Pause,
  RotateCcw,
  RefreshCw,
  GripVertical
} from 'lucide-react';
import { Comanda, ItemComanda, StatusItemComanda, Mesa } from '@/types/sistema-restaurante';

interface ComandaKDS extends Comanda {
  tempoEspera: number;
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
}

interface ItemKDS {
  comanda: ComandaKDS;
  item: ItemComanda;
}

// Drag and drop functionality
const useDragAndDrop = (onStatusChange: (comandaId: string, itemId: string, newStatus: StatusItemComanda) => void) => {
  const [draggedItem, setDraggedItem] = useState<ItemKDS | null>(null);

  const handleDragStart = (e: React.DragEvent, itemData: ItemKDS) => {
    setDraggedItem(itemData);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget.outerHTML);
    (e.currentTarget as HTMLElement).style.opacity = '0.5';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    (e.currentTarget as HTMLElement).style.opacity = '1';
    setDraggedItem(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetStatus: StatusItemComanda) => {
    e.preventDefault();
    
    if (draggedItem && draggedItem.item.status !== targetStatus) {
      onStatusChange(draggedItem.comanda.id, draggedItem.item.id, targetStatus);
    }
    
    setDraggedItem(null);
  };

  return {
    draggedItem,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDrop
  };
};

export default function PaginaKDS() {
  const [comandas, setComandas] = useState<ComandaKDS[]>([]);
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [filtroStatus, setFiltroStatus] = useState<'todos' | StatusItemComanda>('todos');
  const [tempoAtual, setTempoAtual] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [atualizandoAutomaticamente, setAtualizandoAutomaticamente] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  // TODO: Replace with actual restaurant ID from session/context
  const RESTAURANT_ID = 'default-restaurant';

  const atualizarStatusItem = async (comandaId: string, itemId: string, novoStatus: StatusItemComanda) => {
    try {
      const response = await fetch(`/api/comandas/${comandaId}/itens/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: novoStatus
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao atualizar item');
      }

      // Recarregar dados para mostrar as mudanças
      await carregarDados();
      
      const statusLabels = {
        pendente: 'Pendente',
        preparando: 'Preparando',
        pronto: 'Pronto',
        entregue: 'Entregue',
        cancelado: 'Cancelado'
      };
      
      toast.success(`Item atualizado para ${statusLabels[novoStatus]}`);
    } catch (error) {
      console.error('Erro ao atualizar item:', error);
      toast.error('Erro ao atualizar item');
    }
  };

  const { draggedItem, handleDragStart, handleDragEnd, handleDragOver, handleDrop } = useDragAndDrop(atualizarStatusItem);

  useEffect(() => {
    carregarDados();
    
    // Atualizar tempo a cada segundo
    const timeInterval = setInterval(() => {
      setTempoAtual(new Date());
    }, 1000);

    // Auto-refresh a cada 30 segundos se estiver habilitado
    const refreshInterval = setInterval(() => {
      if (atualizandoAutomaticamente) {
        carregarDados();
      }
    }, 30000);

    return () => {
      clearInterval(timeInterval);
      clearInterval(refreshInterval);
    };
  }, [atualizandoAutomaticamente, currentPage, itemsPerPage]);

  const carregarDados = useCallback(async () => {
    try {
      setLoading(true);

      // Build query parameters for comandas
      const comandasParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        restauranteId: RESTAURANT_ID,
      });

      // Include comandas that should appear in KDS: aberta, enviada, preparando, pronta
      comandasParams.append('status', 'aberta');
      comandasParams.append('status', 'enviada');
      comandasParams.append('status', 'preparando');
      comandasParams.append('status', 'pronta');

      const [comandasResponse, mesasResponse] = await Promise.all([
        fetch(`/api/comandas?${comandasParams.toString()}`),
        fetch(`/api/mesas?restauranteId=${RESTAURANT_ID}&limit=100`),
      ]);

      if (!comandasResponse.ok || !mesasResponse.ok) {
        throw new Error('Erro ao carregar dados');
      }

      const comandasData = await comandasResponse.json();
      const mesasData = await mesasResponse.json();

      const comandasArray = Array.isArray(comandasData?.data) ? comandasData.data : Array.isArray(comandasData) ? comandasData : [];
      const mesasArray = Array.isArray(mesasData?.data) ? mesasData.data : Array.isArray(mesasData) ? mesasData : [];

      // Set pagination info
      if (comandasData?.pagination) {
        setTotalPages(comandasData.pagination.totalPages);
        setTotalItems(comandasData.pagination.total);
      }

      // Process comandas for KDS display
      const comandasKDS = comandasArray
        .filter((comanda: Comanda) => {
          // Only show comandas that have items that need kitchen attention
          return comanda && comanda.itens && comanda.itens.some((item: ItemComanda) => 
            item && ['pendente', 'preparando', 'pronto'].includes(item.status)
          );
        })
        .map((comanda: Comanda) => {
          const agora = Date.now();
          const criadaEm = comanda.criadaEm ? new Date(comanda.criadaEm).getTime() : agora;
          const tempoEspera = Math.floor((agora - criadaEm) / 1000 / 60);
          
          let prioridade: 'baixa' | 'media' | 'alta' | 'urgente' = 'baixa';
          
          if (tempoEspera > 30) prioridade = 'urgente';
          else if (tempoEspera > 20) prioridade = 'alta';
          else if (tempoEspera > 10) prioridade = 'media';
          
          return {
            ...comanda,
            tempoEspera,
            prioridade,
            // Map items to show aberta/enviada comanda items as pendente in KDS
            itens: (comanda.itens || []).map((item: ItemComanda) => ({
              ...item,
              status: (comanda.status === 'aberta' || comanda.status === 'enviada') && item.status === 'pendente' 
                ? 'pendente' 
                : item.status
            }))
          };
        })
        .sort((a: ComandaKDS, b: ComandaKDS) => {
          // Ordenar por tempo de criação (mais antigos primeiro)
          const dateA = a.criadaEm ? new Date(a.criadaEm).getTime() : 0;
          const dateB = b.criadaEm ? new Date(b.criadaEm).getTime() : 0;
          return dateA - dateB;
        });

      setComandas(comandasKDS);
      setMesas(mesasArray);
    } catch (error) {
      console.error('Erro ao carregar dados do KDS:', error);
      if (loading) {
        toast.error('Erro ao carregar dados do KDS');
      }
    } finally {
      setLoading(false);
    }
  }, [loading, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (itemsPerPage: number) => {
    setItemsPerPage(itemsPerPage);
    setCurrentPage(1);
  };

  const obterCorPrioridade = (prioridade: string) => {
    switch (prioridade) {
      case 'urgente': return 'bg-red-500';
      case 'alta': return 'bg-orange-500';
      case 'media': return 'bg-yellow-500';
      default: return 'bg-green-500';
    }
  };

  const formatarTempo = (minutos: number) => {
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return horas > 0 ? `${horas}h ${mins}m` : `${mins}m`;
  };

  const obterNomeMesa = (mesaId?: string) => {
    if (!mesaId) return null;
    const mesa = mesas.find(m => m.id === mesaId);
    return mesa ? `Mesa ${mesa.numero}` : 'Mesa não encontrada';
  };

  const agruparItensPorStatus = () => {
    const grupos: Record<StatusItemComanda, ItemKDS[]> = {
      pendente: [],
      preparando: [],
      pronto: [],
      entregue: [],
      cancelado: []
    };

    comandas.forEach(comanda => {
      comanda.itens.forEach(item => {
        if (filtroStatus === 'todos' || item.status === filtroStatus) {
          grupos[item.status].push({ comanda, item });
        }
      });
    });

    return grupos;
  };

  const grupos = agruparItensPorStatus();

  const renderItemCard = (itemData: ItemKDS, borderColor: string, allowDrag: boolean = true) => {
    const { comanda, item } = itemData;
    
    return (
      <Card 
        key={`${comanda.id}-${item.id}`} 
        className={`border-l-4 ${borderColor} cursor-move transition-all duration-200 hover:shadow-md ${
          draggedItem?.item.id === item.id ? 'opacity-50' : ''
        }`}
        draggable={allowDrag}
        onDragStart={allowDrag ? (e) => handleDragStart(e, itemData) : undefined}
        onDragEnd={allowDrag ? handleDragEnd : undefined}
      >
        <CardContent className="p-4">
          <div className="space-y-2">
            {allowDrag && (
              <div className="flex justify-center">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
            
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium text-sm">{item.produtoNome}</h4>
                <p className="text-xs text-muted-foreground">
                  Comanda: {comanda.numero}
                </p>
                {comanda.mesaId && (
                  <p className="text-xs text-muted-foreground">
                    {obterNomeMesa(comanda.mesaId)}
                  </p>
                )}
                {comanda.canal && (
                  <p className="text-xs text-muted-foreground capitalize">
                    Canal: {comanda.canal}
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-1">
                <Badge variant="secondary" className="text-xs">
                  {item.quantidade}x
                </Badge>
                <div className={`w-2 h-2 rounded-full ${obterCorPrioridade(comanda.prioridade)}`} />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center">
                <Timer className="w-3 h-3 mr-1" />
                {formatarTempo(comanda.tempoEspera)}
              </span>
              {item.tempoPreparoEstimado && (
                <span>Est: {item.tempoPreparoEstimado}min</span>
              )}
            </div>

            {item.observacoes && (
              <p className="text-xs bg-yellow-50 p-2 rounded border-l-2 border-yellow-400">
                {item.observacoes}
              </p>
            )}

            {/* Status-specific timestamps */}
            {item.status === 'preparando' && item.iniciadoPreparoEm && (
              <div className="text-xs text-muted-foreground">
                Iniciado: {new Date(item.iniciadoPreparoEm).toLocaleTimeString('pt-PT', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            )}

            {item.status === 'pronto' && item.prontoEm && (
              <div className="text-xs text-muted-foreground">
                Pronto: {new Date(item.prontoEm).toLocaleTimeString('pt-PT', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            )}

            {/* Action buttons for quick status changes */}
            {item.status === 'pendente' && (
              <Button
                size="sm"
                className="w-full"
                onClick={() => atualizarStatusItem(comanda.id, item.id, 'preparando')}
              >
                <Play className="w-3 h-3 mr-1" />
                Iniciar Preparo
              </Button>
            )}

            {item.status === 'preparando' && (
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => atualizarStatusItem(comanda.id, item.id, 'pendente')}
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Voltar
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => atualizarStatusItem(comanda.id, item.id, 'pronto')}
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Pronto
                </Button>
              </div>
            )}

            {item.status === 'pronto' && (
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => atualizarStatusItem(comanda.id, item.id, 'entregue')}
              >
                <Truck className="w-3 h-3 mr-1" />
                Marcar como Entregue
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <LayoutPrincipal titulo="Kitchen Display System">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="ml-4 text-muted-foreground">Carregando KDS...</p>
        </div>
      </LayoutPrincipal>
    );
  }

  return (
    <LayoutPrincipal titulo="Kitchen Display System">
      <div className="space-y-6">
        {/* Cabeçalho com estatísticas */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">Kitchen Display System</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAtualizandoAutomaticamente(!atualizandoAutomaticamente)}
            >
              {atualizandoAutomaticamente ? (
                <Pause className="h-4 w-4 mr-2" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Auto-refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => carregarDados()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Pendentes</p>
                  <p className="text-2xl font-bold">{grupos.pendente.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <ChefHat className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Preparando</p>
                  <p className="text-2xl font-bold">{grupos.preparando.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Prontos</p>
                  <p className="text-2xl font-bold">{grupos.pronto.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Urgentes</p>
                  <p className="text-2xl font-bold">
                    {comandas.filter(c => c.prioridade === 'urgente').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={filtroStatus === 'todos' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFiltroStatus('todos')}
              >
                Todos
              </Button>
              <Button
                variant={filtroStatus === 'pendente' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFiltroStatus('pendente')}
              >
                <Clock className="w-4 h-4 mr-1" />
                Pendentes
              </Button>
              <Button
                variant={filtroStatus === 'preparando' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFiltroStatus('preparando')}
              >
                <ChefHat className="w-4 h-4 mr-1" />
                Preparando
              </Button>
              <Button
                variant={filtroStatus === 'pronto' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFiltroStatus('pronto')}
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Prontos
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Drag and Drop Instruction */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <p className="text-sm text-blue-700 text-center">
              <GripVertical className="inline h-4 w-4 mr-1" />
              Arraste e solte os itens entre as colunas para alterar o status
            </p>
          </CardContent>
        </Card>

        {/* Colunas KDS com Drag and Drop */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Coluna Pendentes */}
          <div 
            className="space-y-4 min-h-[600px] p-4 rounded-lg border-2 border-dashed border-blue-300 bg-blue-50/30"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'pendente')}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg flex items-center">
                <Clock className="w-5 h-5 mr-2 text-blue-500" />
                Pendentes ({grupos.pendente.length})
              </h3>
            </div>
            <ScrollArea className="h-[500px]">
              <div className="space-y-3">
                {grupos.pendente.map((itemData) => 
                  renderItemCard(itemData, 'border-blue-500')
                )}
                {grupos.pendente.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="mx-auto h-8 w-8 mb-2" />
                    <p>Nenhum item pendente</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Coluna Preparando */}
          <div 
            className="space-y-4 min-h-[600px] p-4 rounded-lg border-2 border-dashed border-yellow-300 bg-yellow-50/30"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'preparando')}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg flex items-center">
                <ChefHat className="w-5 h-5 mr-2 text-yellow-500" />
                Preparando ({grupos.preparando.length})
              </h3>
            </div>
            <ScrollArea className="h-[500px]">
              <div className="space-y-3">
                {grupos.preparando.map((itemData) => 
                  renderItemCard(itemData, 'border-yellow-500')
                )}
                {grupos.preparando.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <ChefHat className="mx-auto h-8 w-8 mb-2" />
                    <p>Nenhum item sendo preparado</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Coluna Prontos */}
          <div 
            className="space-y-4 min-h-[600px] p-4 rounded-lg border-2 border-dashed border-green-300 bg-green-50/30"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'pronto')}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                Prontos ({grupos.pronto.length})
              </h3>
            </div>
            <ScrollArea className="h-[500px]">
              <div className="space-y-3">
                {grupos.pronto.map((itemData) => 
                  renderItemCard(itemData, 'border-green-500')
                )}
                {grupos.pronto.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="mx-auto h-8 w-8 mb-2" />
                    <p>Nenhum item pronto</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Coluna Entregues (últimos 10) */}
          <div 
            className="space-y-4 min-h-[600px] p-4 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50/30"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'entregue')}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg flex items-center">
                <Truck className="w-5 h-5 mr-2 text-gray-500" />
                Entregues ({grupos.entregue.slice(0, 10).length})
              </h3>
            </div>
            <ScrollArea className="h-[500px]">
              <div className="space-y-3">
                {grupos.entregue.slice(0, 10).map((itemData) => 
                  renderItemCard(itemData, 'border-gray-500', false)
                )}
                {grupos.entregue.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Truck className="mx-auto h-8 w-8 mb-2" />
                    <p>Nenhum item entregue hoje</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Paginação */}
        {!loading && totalItems > 0 && (
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

        {/* Estado vazio */}
        {!loading && comandas.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <ChefHat className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">
                Nenhuma comanda encontrada para o KDS.
              </p>
              <p className="text-sm text-muted-foreground">
                Comandas criadas e enviadas à cozinha aparecerão aqui com itens pendentes.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </LayoutPrincipal>
  );
}