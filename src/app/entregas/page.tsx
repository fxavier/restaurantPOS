
'use client';

import { useState, useEffect } from 'react';
import LayoutPrincipal from '@/components/layout/layout-principal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import {
  Truck,
  Plus,
  Edit,
  Trash2,
  Search,
  MapPin,
  Clock,
  Phone,
  User,
  Package,
  CheckCircle,
  XCircle,
  AlertCircle,
  Navigation,
  DollarSign
} from 'lucide-react';
import { ArmazenamentoLocal } from '@/lib/armazenamento-local';
import { Entrega, StatusEntrega, Comanda } from '@/types/sistema-restaurante';

interface FormularioEntrega {
  comandaId: string;
  entregadorNome: string;
  entregadorTelefone: string;
  enderecoEntrega: string;
  observacoes: string;
  taxaEntrega: number;
}

const formularioVazio: FormularioEntrega = {
  comandaId: '',
  entregadorNome: '',
  entregadorTelefone: '',
  enderecoEntrega: '',
  observacoes: '',
  taxaEntrega: 0
};

const STATUS_CORES: Record<StatusEntrega, string> = {
  'pendente': 'bg-yellow-100 text-yellow-800',
  'preparando': 'bg-blue-100 text-blue-800',
  'saiu_entrega': 'bg-purple-100 text-purple-800',
  'entregue': 'bg-green-100 text-green-800',
  'cancelada': 'bg-red-100 text-red-800'
};

const STATUS_LABELS: Record<StatusEntrega, string> = {
  'pendente': 'Pendente',
  'preparando': 'Preparando',
  'saiu_entrega': 'Saiu para Entrega',
  'entregue': 'Entregue',
  'cancelada': 'Cancelada'
};

export default function PaginaEntregas() {
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [comandas, setComandas] = useState<Comanda[]>([]);
  const [formulario, setFormulario] = useState<FormularioEntrega>(formularioVazio);
  const [entregaEditando, setEntregaEditando] = useState<string | null>(null);
  const [dialogoAberto, setDialogoAberto] = useState(false);
  const [termoPesquisa, setTermoPesquisa] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<StatusEntrega | 'todos'>('todos');
  const [filtroEntregador, setFiltroEntregador] = useState('');

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = () => {
    const entregasCarregadas = JSON.parse(localStorage.getItem('entregas') || '[]') as Entrega[];
    const comandasCarregadas = ArmazenamentoLocal.obterComandas();
    
    setEntregas(entregasCarregadas);
    setComandas(comandasCarregadas);
  };

  const gerarNumeroEntrega = () => {
    const agora = new Date();
    const ano = agora.getFullYear().toString().slice(-2);
    const mes = (agora.getMonth() + 1).toString().padStart(2, '0');
    const dia = agora.getDate().toString().padStart(2, '0');
    const contador = (entregas.length + 1).toString().padStart(3, '0');
    return `ENT${ano}${mes}${dia}${contador}`;
  };

  const salvarEntrega = () => {
    if (!formulario.comandaId || !formulario.entregadorNome || !formulario.enderecoEntrega) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const comanda = comandas.find(c => c.id === formulario.comandaId);
    if (!comanda) {
      toast.error('Comanda não encontrada');
      return;
    }

    const entregaData: Omit<Entrega, 'id' | 'criadaEm' | 'atualizadaEm'> = {
      numero: entregaEditando ? entregas.find(e => e.id === entregaEditando)?.numero || gerarNumeroEntrega() : gerarNumeroEntrega(),
      comandaId: formulario.comandaId,
      comandaNumero: comanda.numero,
      clienteNome: comanda.clienteNome || 'Cliente',
      clienteTelefone: comanda.clienteTelefone || '',
      entregadorNome: formulario.entregadorNome,
      entregadorTelefone: formulario.entregadorTelefone,
      enderecoEntrega: formulario.enderecoEntrega,
      observacoes: formulario.observacoes || undefined,
      taxaEntrega: formulario.taxaEntrega,
      valorTotal: comanda.total + formulario.taxaEntrega,
      status: 'pendente',
      tempoEstimado: 30, // 30 minutos padrão
      restauranteId: 'default'
    };

    if (entregaEditando) {
      const entregasAtualizadas = entregas.map(entrega =>
        entrega.id === entregaEditando
          ? { ...entrega, ...entregaData, atualizadaEm: new Date().toISOString() }
          : entrega
      );
      localStorage.setItem('entregas', JSON.stringify(entregasAtualizadas));
      toast.success('Entrega atualizada com sucesso');
    } else {
      const novaEntrega: Entrega = {
        ...entregaData,
        id: Date.now().toString(),
        criadaEm: new Date().toISOString(),
        atualizadaEm: new Date().toISOString()
      };
      const entregasAtualizadas = [...entregas, novaEntrega];
      localStorage.setItem('entregas', JSON.stringify(entregasAtualizadas));
      toast.success('Entrega criada com sucesso');
    }

    setFormulario(formularioVazio);
    setEntregaEditando(null);
    setDialogoAberto(false);
    carregarDados();
  };

  const editarEntrega = (entrega: Entrega) => {
    setFormulario({
      comandaId: entrega.comandaId,
      entregadorNome: entrega.entregadorNome,
      entregadorTelefone: entrega.entregadorTelefone,
      enderecoEntrega: entrega.enderecoEntrega,
      observacoes: entrega.observacoes || '',
      taxaEntrega: entrega.taxaEntrega
    });
    setEntregaEditando(entrega.id);
    setDialogoAberto(true);
  };

  const excluirEntrega = (entrega: Entrega) => {
    if (entrega.status === 'entregue') {
      toast.error('Não é possível excluir uma entrega já finalizada');
      return;
    }

    if (confirm(`Tem certeza que deseja excluir a entrega ${entrega.numero}?`)) {
      const entregasAtualizadas = entregas.filter(e => e.id !== entrega.id);
      localStorage.setItem('entregas', JSON.stringify(entregasAtualizadas));
      carregarDados();
      toast.success('Entrega excluída com sucesso');
    }
  };

  const alterarStatusEntrega = (entrega: Entrega, novoStatus: StatusEntrega) => {
    const entregasAtualizadas = entregas.map(e =>
      e.id === entrega.id 
        ? { 
            ...e, 
            status: novoStatus, 
            atualizadaEm: new Date().toISOString(),
            ...(novoStatus === 'entregue' && { dataEntrega: new Date().toISOString() })
          }
        : e
    );
    localStorage.setItem('entregas', JSON.stringify(entregasAtualizadas));
    carregarDados();
    toast.success(`Status alterado para ${STATUS_LABELS[novoStatus]}`);
  };

  const obterComandaDisponivel = () => {
    return comandas.filter(c => 
      c.canal === 'delivery' && 
      c.status !== 'cancelada' &&
      !entregas.some(e => e.comandaId === c.id)
    );
  };

  const obterEntregadoresUnicos = () => {
    return [...new Set(entregas.map(e => e.entregadorNome))].filter(Boolean).sort();
  };

  const entregasFiltradas = entregas.filter(entrega => {
    const correspondeNumero = entrega.numero.toLowerCase().includes(termoPesquisa.toLowerCase()) ||
      entrega.clienteNome.toLowerCase().includes(termoPesquisa.toLowerCase()) ||
      entrega.entregadorNome.toLowerCase().includes(termoPesquisa.toLowerCase());
    const correspondeStatus = filtroStatus === 'todos' || entrega.status === filtroStatus;
    const correspondeEntregador = !filtroEntregador || entrega.entregadorNome === filtroEntregador;
    
    return correspondeNumero && correspondeStatus && correspondeEntregador;
  });

  const estatisticas = {
    total: entregas.length,
    pendentes: entregas.filter(e => e.status === 'pendente').length,
    emAndamento: entregas.filter(e => e.status === 'preparando' || e.status === 'saiu_entrega').length,
    entregues: entregas.filter(e => e.status === 'entregue').length,
    canceladas: entregas.filter(e => e.status === 'cancelada').length,
    valorTotal: entregas.filter(e => e.status === 'entregue').reduce((total, e) => total + e.valorTotal, 0)
  };

  return (
    <LayoutPrincipal>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-primary">Gestão de Entregas</h1>
            <p className="text-muted-foreground">
              Gerencie entregas e acompanhe o status dos pedidos
            </p>
          </div>
          <Dialog open={dialogoAberto} onOpenChange={setDialogoAberto}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setFormulario(formularioVazio);
                setEntregaEditando(null);
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Nova Entrega
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {entregaEditando ? 'Editar Entrega' : 'Nova Entrega'}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="comanda">Comanda *</Label>
                  <Select
                    value={formulario.comandaId}
                    onValueChange={(value) => {
                      const comanda = comandas.find(c => c.id === value);
                      setFormulario(prev => ({ 
                        ...prev, 
                        comandaId: value,
                        enderecoEntrega: comanda?.observacoes?.includes('Endereço:') 
                          ? comanda.observacoes.split('Endereço:')[1]?.trim() || ''
                          : ''
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma comanda" />
                    </SelectTrigger>
                    <SelectContent>
                      {obterComandaDisponivel().map(comanda => (
                        <SelectItem key={comanda.id} value={comanda.id}>
                          #{comanda.numero} - {comanda.clienteNome || 'Cliente'} - MT {comanda.total.toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="entregadorNome">Nome do Entregador *</Label>
                    <Input
                      id="entregadorNome"
                      value={formulario.entregadorNome}
                      onChange={(e) => setFormulario(prev => ({ ...prev, entregadorNome: e.target.value }))}
                      placeholder="Nome do entregador"
                    />
                  </div>
                  <div>
                    <Label htmlFor="entregadorTelefone">Telefone do Entregador</Label>
                    <Input
                      id="entregadorTelefone"
                      value={formulario.entregadorTelefone}
                      onChange={(e) => setFormulario(prev => ({ ...prev, entregadorTelefone: e.target.value }))}
                      placeholder="Telefone do entregador"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="enderecoEntrega">Endereço de Entrega *</Label>
                  <Textarea
                    id="enderecoEntrega"
                    value={formulario.enderecoEntrega}
                    onChange={(e) => setFormulario(prev => ({ ...prev, enderecoEntrega: e.target.value }))}
                    placeholder="Endereço completo para entrega"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="taxaEntrega">Taxa de Entrega (MT )</Label>
                  <Input
                    id="taxaEntrega"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formulario.taxaEntrega}
                    onChange={(e) => setFormulario(prev => ({ ...prev, taxaEntrega: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={formulario.observacoes}
                    onChange={(e) => setFormulario(prev => ({ ...prev, observacoes: e.target.value }))}
                    placeholder="Observações sobre a entrega..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setDialogoAberto(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={salvarEntrega}>
                    {entregaEditando ? 'Atualizar' : 'Criar'} Entrega
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
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
                <p className="text-2xl font-bold text-yellow-600">{estatisticas.pendentes}</p>
                <p className="text-sm text-muted-foreground">Pendentes</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{estatisticas.emAndamento}</p>
                <p className="text-sm text-muted-foreground">Em Andamento</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{estatisticas.entregues}</p>
                <p className="text-sm text-muted-foreground">Entregues</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{estatisticas.canceladas}</p>
                <p className="text-sm text-muted-foreground">Canceladas</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">MT {estatisticas.valorTotal.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Faturado</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Pesquisar entregas..."
                    value={termoPesquisa}
                    onChange={(e) => setTermoPesquisa(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={filtroStatus} onValueChange={(value: any) => setFiltroStatus(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Status</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="preparando">Preparando</SelectItem>
                  <SelectItem value="saiu_entrega">Saiu para Entrega</SelectItem>
                  <SelectItem value="entregue">Entregue</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filtroEntregador} onValueChange={setFiltroEntregador}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Todos os entregadores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os entregadores</SelectItem>
                  {obterEntregadoresUnicos().map(entregador => (
                    <SelectItem key={entregador} value={entregador}>
                      {entregador}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Entregas */}
        <div className="grid gap-4">
          {entregasFiltradas.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Truck className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma entrega encontrada</h3>
                <p className="text-muted-foreground mb-4">
                  {termoPesquisa ? 'Tente ajustar os filtros de pesquisa.' : 'Comece criando sua primeira entrega.'}
                </p>
                {!termoPesquisa && (
                  <Button onClick={() => setDialogoAberto(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Primeira Entrega
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            entregasFiltradas.map((entrega) => (
              <Card key={entrega.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Truck className="h-5 w-5" />
                          {entrega.numero}
                        </CardTitle>
                        <Badge className={STATUS_CORES[entrega.status]}>
                          {STATUS_LABELS[entrega.status]}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            Comanda: #{entrega.comandaNumero}
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Cliente: {entrega.clienteNome}
                          </div>
                          {entrega.clienteTelefone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              {entrega.clienteTelefone}
                            </div>
                          )}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Navigation className="h-4 w-4" />
                            Entregador: {entrega.entregadorNome}
                          </div>
                          {entrega.entregadorTelefone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              {entrega.entregadorTelefone}
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Tempo estimado: {entrega.tempoEstimado}min
                          </div>
                        </div>
                      </div>
                      <div className="mt-2">
                        <div className="flex items-start gap-2 text-sm">
                          <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                          <span className="text-muted-foreground">{entrega.enderecoEntrega}</span>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span>Taxa: MT {entrega.taxaEntrega.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Total: MT {entrega.valorTotal.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {entrega.status === 'pendente' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => alterarStatusEntrega(entrega, 'preparando')}
                          title="Marcar como preparando"
                        >
                          <Clock className="h-4 w-4" />
                        </Button>
                      )}
                      {entrega.status === 'preparando' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => alterarStatusEntrega(entrega, 'saiu_entrega')}
                          title="Saiu para entrega"
                        >
                          <Truck className="h-4 w-4" />
                        </Button>
                      )}
                      {entrega.status === 'saiu_entrega' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => alterarStatusEntrega(entrega, 'entregue')}
                          title="Marcar como entregue"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      {entrega.status !== 'cancelada' && entrega.status !== 'entregue' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => alterarStatusEntrega(entrega, 'cancelada')}
                          title="Cancelar entrega"
                          className="text-destructive hover:text-destructive"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => editarEntrega(entrega)}
                        title="Editar entrega"
                        disabled={entrega.status === 'entregue' || entrega.status === 'cancelada'}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => excluirEntrega(entrega)}
                        title="Excluir entrega"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))
          )}
        </div>
      </div>
    </LayoutPrincipal>
  );
}
