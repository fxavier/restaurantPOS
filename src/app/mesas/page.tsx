

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
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Plus,
  Edit,
  Trash2,
  QrCode,
  Users,
  MapPin,
  CheckCircle,
  Clock,
  AlertTriangle,
  Settings
} from 'lucide-react';
// Removed apiDataService dependency - using direct API calls
import { Mesa, StatusMesa } from '@/types/sistema-restaurante';

export default function PaginaMesas() {
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [mesaEditando, setMesaEditando] = useState<Mesa | null>(null);
  const [dialogoAberto, setDialogoAberto] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filtroArea, setFiltroArea] = useState<string>('todas');
  const [filtroStatus, setFiltroStatus] = useState<StatusMesa | 'todos'>('todos');
  const [busca, setBusca] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  // Formulário
  const [numero, setNumero] = useState('');
  const [capacidade, setCapacidade] = useState('');
  const [area, setArea] = useState('');
  const [status, setStatus] = useState<StatusMesa>('livre');

  useEffect(() => {
    carregarMesas();
  }, [currentPage, itemsPerPage, filtroArea, filtroStatus]);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentPage === 1) {
        carregarMesas();
      } else {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [busca]);

  const carregarMesas = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual restaurant ID from session/context
      const restauranteId = 'cmg3w1utw005j2gzkrott9zul';
      
      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        restauranteId,
      });

      if (busca) {
        params.append('search', busca);
      }

      if (filtroArea !== 'todas') {
        params.append('area', filtroArea);
      }

      if (filtroStatus !== 'todos') {
        params.append('status', filtroStatus);
      }

      // Make API call with pagination
      const response = await fetch(`/api/mesas?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();

      if (data.success) {
        setMesas(data.data || []);
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages);
          setTotalItems(data.pagination.total);
        }
      } else {
        throw new Error(data.error || 'Erro ao carregar mesas');
      }
    } catch (error) {
      console.error('Erro ao carregar mesas:', error);
      toast.error('Erro ao carregar mesas: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const limparFormulario = () => {
    setNumero('');
    setCapacidade('');
    setArea('');
    setStatus('livre');
    setMesaEditando(null);
  };

  const abrirDialogo = (mesa?: Mesa) => {
    if (mesa) {
      setMesaEditando(mesa);
      setNumero(mesa.numero);
      setCapacidade(mesa.capacidade.toString());
      setArea(mesa.area);
      setStatus(mesa.status);
    } else {
      limparFormulario();
    }
    setDialogoAberto(true);
  };

  const salvarMesa = async () => {
    if (!numero || !capacidade || !area) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const capacidadeNum = parseInt(capacidade);
    if (isNaN(capacidadeNum) || capacidadeNum <= 0) {
      toast.error('Capacidade deve ser um número válido');
      return;
    }

    // Verificar se o número da mesa já existe (exceto se estiver editando)
    const mesaExistente = mesas.find(m => 
      m.numero === numero && (!mesaEditando || m.id !== mesaEditando.id)
    );
    
    if (mesaExistente) {
      toast.error('Já existe uma mesa com este número');
      return;
    }

    try {
      setSaving(true);
      // TODO: Replace with actual restaurant ID from session/context
      const restauranteId = 'cmg3w1utw005j2gzkrott9zul';

      if (mesaEditando) {
        // Atualizar mesa existente
        const response = await fetch(`/api/mesas/${mesaEditando.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            numero,
            capacidade: capacidadeNum,
            area,
            status
          })
        });

        const data = await response.json();
        if (data.success) {
          toast.success('Mesa atualizada com sucesso');
        } else {
          throw new Error(data.error || 'Erro ao atualizar mesa');
        }
      } else {
        // Criar nova mesa
        const response = await fetch('/api/mesas', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            numero,
            capacidade: capacidadeNum,
            area,
            status,
            restauranteId
          })
        });

        const data = await response.json();
        if (data.success) {
          toast.success('Mesa criada com sucesso');
        } else {
          throw new Error(data.error || 'Erro ao criar mesa');
        }
      }

      await carregarMesas();
      setDialogoAberto(false);
      limparFormulario();
    } catch (error) {
      console.error('Erro ao salvar mesa:', error);
      toast.error('Erro ao salvar mesa');
    } finally {
      setSaving(false);
    }
  };

  const excluirMesa = async (mesa: Mesa) => {
    if (mesa.status === 'ocupada') {
      toast.error('Não é possível excluir uma mesa ocupada');
      return;
    }

    if (confirm(`Tem certeza que deseja excluir a Mesa ${mesa.numero}?`)) {
      try {
        const response = await fetch(`/api/mesas/${mesa.id}`, {
          method: 'DELETE'
        });

        const data = await response.json();
        if (data.success) {
          await carregarMesas();
          toast.success('Mesa excluída com sucesso');
        } else {
          throw new Error(data.error || 'Erro ao excluir mesa');
        }
      } catch (error) {
        console.error('Erro ao excluir mesa:', error);
        toast.error('Erro ao excluir mesa: ' + (error as Error).message);
      }
    }
  };

  const alterarStatusMesa = async (mesa: Mesa, novoStatus: StatusMesa) => {
    try {
      const response = await fetch(`/api/mesas/${mesa.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          numero: mesa.numero,
          capacidade: mesa.capacidade,
          area: mesa.area,
          status: novoStatus
        })
      });

      const data = await response.json();
      if (data.success) {
        await carregarMesas();
        toast.success(`Status da mesa ${mesa.numero} alterado para ${novoStatus}`);
      } else {
        throw new Error(data.error || 'Erro ao alterar status da mesa');
      }
    } catch (error) {
      console.error('Erro ao alterar status da mesa:', error);
      toast.error('Erro ao alterar status da mesa: ' + (error as Error).message);
    }
  };

  const gerarQRCode = (mesa: Mesa) => {
    // Gerar link para o cardápio da mesa
    const url = `${window.location.origin}/cardapio?mesa=${mesa.id}&numero=${mesa.numero}`;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url)
        .then(() => {
          toast.success(`Link da Mesa ${mesa.numero} copiado!`);
        })
        .catch(() => {
          // Fallback para browsers que não suportam clipboard API
          const textArea = document.createElement('textarea');
          textArea.value = url;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          toast.success(`Link da Mesa ${mesa.numero} copiado!`);
        });
    } else {
      // Fallback para browsers antigos
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast.success(`Link da Mesa ${mesa.numero} copiado!`);
    }
  };

  const obterAreas = () => {
    const areas = [...new Set(mesas.map(m => m.area))];
    return areas.sort();
  };

  // No need for local filtering since it's done on server
  const mesasFiltradas = mesas;

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleItemsPerPageChange = useCallback((newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing page size
  }, []);

  const obterCorStatus = (status: StatusMesa) => {
    switch (status) {
      case 'livre': return 'bg-green-500';
      case 'ocupada': return 'bg-red-500';
      case 'reservada': return 'bg-yellow-500';
      case 'manutencao': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const obterIconeStatus = (status: StatusMesa) => {
    switch (status) {
      case 'livre': return CheckCircle;
      case 'ocupada': return Users;
      case 'reservada': return Clock;
      case 'manutencao': return AlertTriangle;
      default: return Settings;
    }
  };

  const estatisticas = {
    total: mesas.length,
    livres: mesas.filter(m => m.status === 'livre').length,
    ocupadas: mesas.filter(m => m.status === 'ocupada').length,
    reservadas: mesas.filter(m => m.status === 'reservada').length,
    manutencao: mesas.filter(m => m.status === 'manutencao').length
  };

  return (
    <LayoutPrincipal titulo="Gestão de Mesas">
      <div className="space-y-6">
        {/* Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{estatisticas.total}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{estatisticas.livres}</p>
                <p className="text-sm text-muted-foreground">Livres</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{estatisticas.ocupadas}</p>
                <p className="text-sm text-muted-foreground">Ocupadas</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">{estatisticas.reservadas}</p>
                <p className="text-sm text-muted-foreground">Reservadas</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-600">{estatisticas.manutencao}</p>
                <p className="text-sm text-muted-foreground">Manutenção</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros e Ações */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <Input
                  placeholder="Buscar mesa..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full sm:w-64"
                />
                
                <Select value={filtroArea} onValueChange={setFiltroArea}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filtrar por área" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas as Áreas</SelectItem>
                    {obterAreas().map(area => (
                      <SelectItem key={area} value={area}>{area}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={filtroStatus} onValueChange={(value: StatusMesa | 'todos') => setFiltroStatus(value)}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os Status</SelectItem>
                    <SelectItem value="livre">Livre</SelectItem>
                    <SelectItem value="ocupada">Ocupada</SelectItem>
                    <SelectItem value="reservada">Reservada</SelectItem>
                    <SelectItem value="manutencao">Manutenção</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Dialog open={dialogoAberto} onOpenChange={setDialogoAberto}>
                <DialogTrigger asChild>
                  <Button onClick={() => abrirDialogo()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Mesa
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {mesaEditando ? 'Editar Mesa' : 'Nova Mesa'}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="numero">Número da Mesa</Label>
                      <Input
                        id="numero"
                        value={numero}
                        onChange={(e) => setNumero(e.target.value)}
                        placeholder="Ex: 01, A1, VIP01"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="capacidade">Capacidade (pessoas)</Label>
                      <Input
                        id="capacidade"
                        type="number"
                        value={capacidade}
                        onChange={(e) => setCapacidade(e.target.value)}
                        placeholder="Ex: 4"
                        min="1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="area">Área</Label>
                      <Input
                        id="area"
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                        placeholder="Ex: Balcão Principal, Esplanada, Sala VIP"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select value={status} onValueChange={(value: StatusMesa) => setStatus(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="livre">Livre</SelectItem>
                          <SelectItem value="ocupada">Ocupada</SelectItem>
                          <SelectItem value="reservada">Reservada</SelectItem>
                          <SelectItem value="manutencao">Manutenção</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setDialogoAberto(false)}
                      >
                        Cancelar
                      </Button>
                      <Button 
                        className="flex-1" 
                        onClick={salvarMesa}
                        disabled={saving}
                      >
                        {saving ? 'Salvando...' : mesaEditando ? 'Atualizar' : 'Criar'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Grid de Mesas */}
        {loading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando mesas...</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {mesasFiltradas.map(mesa => {
              const IconeStatus = obterIconeStatus(mesa.status);
              
              return (
                <Card 
                  key={mesa.id} 
                  className={`relative group hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1 ${
                    mesa.status === 'ocupada' ? 'ring-2 ring-red-200' : 
                    mesa.status === 'reservada' ? 'ring-2 ring-yellow-200' : 
                    mesa.status === 'manutencao' ? 'ring-2 ring-gray-200' : 
                    'ring-2 ring-green-200'
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Cabeçalho da Mesa */}
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-lg truncate">Mesa {mesa.numero}</h3>
                        <div className={`w-4 h-4 rounded-full ${obterCorStatus(mesa.status)} shadow-sm`} />
                      </div>
                      
                      {/* Informações */}
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Users className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span className="truncate">{mesa.capacidade} pessoas</span>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span className="truncate" title={mesa.area}>{mesa.area}</span>
                        </div>
                      </div>
                      
                      {/* Status */}
                      <Badge 
                        variant="secondary" 
                        className={`w-full justify-center ${obterCorStatus(mesa.status)} text-white border-0 font-medium`}
                      >
                        <IconeStatus className="w-3 h-3 mr-1" />
                        {mesa.status === 'livre' && 'Livre'}
                        {mesa.status === 'ocupada' && 'Ocupada'}
                        {mesa.status === 'reservada' && 'Reservada'}
                        {mesa.status === 'manutencao' && 'Manutenção'}
                      </Badge>
                      
                      {/* Ações Rápidas de Status */}
                      <div className="grid grid-cols-2 gap-1">
                        {mesa.status !== 'livre' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-8 px-2"
                            onClick={() => alterarStatusMesa(mesa, 'livre')}
                          >
                            Liberar
                          </Button>
                        )}
                        {mesa.status !== 'ocupada' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-8 px-2"
                            onClick={() => alterarStatusMesa(mesa, 'ocupada')}
                          >
                            Ocupar
                          </Button>
                        )}
                        {mesa.status !== 'reservada' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-8 px-2"
                            onClick={() => alterarStatusMesa(mesa, 'reservada')}
                          >
                            Reservar
                          </Button>
                        )}
                        {mesa.status !== 'manutencao' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-8 px-2"
                            onClick={() => alterarStatusMesa(mesa, 'manutencao')}
                          >
                            Manutenção
                          </Button>
                        )}
                      </div>
                      
                      {/* Ações */}
                      <div className="flex space-x-1 pt-2 border-t border-gray-100">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 h-8"
                          onClick={() => gerarQRCode(mesa)}
                          title="Gerar QR Code"
                        >
                          <QrCode className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 h-8"
                          onClick={() => abrirDialogo(mesa)}
                          title="Editar mesa"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="flex-1 h-8"
                          onClick={() => excluirMesa(mesa)}
                          disabled={mesa.status === 'ocupada'}
                          title={mesa.status === 'ocupada' ? 'Não é possível excluir mesa ocupada' : 'Excluir mesa'}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {!loading && mesasFiltradas.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Settings className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Nenhuma mesa encontrada com os filtros aplicados.</p>
            </CardContent>
          </Card>
        )}

        {/* Pagination */}
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
      </div>
    </LayoutPrincipal>
  );
}

