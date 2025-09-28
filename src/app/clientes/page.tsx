
'use client';

import { useState, useEffect } from 'react';
import LayoutPrincipal from '@/components/layout/layout-principal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Search,
  Phone,
  Mail,
  MapPin,
  Calendar,
  TrendingUp,
  Star,
  Gift
} from 'lucide-react';
import { ArmazenamentoLocal } from '@/lib/armazenamento-local';

interface Cliente {
  id: string;
  nome: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  dataNascimento?: string;
  observacoes?: string;
  totalPedidos: number;
  totalGasto: number;
  ultimoPedido?: string;
  criadoEm: string;
  atualizadoEm: string;
}

export default function PaginaClientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [termoBusca, setTermoBusca] = useState('');
  
  // Modal de cliente
  const [modalAberto, setModalAberto] = useState(false);
  const [clienteEdicao, setClienteEdicao] = useState<Cliente | null>(null);
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [endereco, setEndereco] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [observacoes, setObservacoes] = useState('');

  useEffect(() => {
    carregarClientes();
  }, []);

  const carregarClientes = () => {
    setCarregando(true);
    
    try {
      // Usar método público salvarDados/obter através de uma chave específica
      const clientesData = JSON.parse(localStorage.getItem('clientes') || '[]') as Cliente[];
      const comandas = ArmazenamentoLocal.obterComandas();
      
      // Enriquecer dados dos clientes com estatísticas
      const clientesEnriquecidos = clientesData.map(cliente => {
        const pedidosCliente = comandas.filter(c => 
          c.clienteNome === cliente.nome || c.clienteTelefone === cliente.telefone
        );
        
        const totalPedidos = pedidosCliente.length;
        const totalGasto = pedidosCliente
          .filter(p => p.status === 'paga')
          .reduce((total, p) => total + p.total, 0);
        
        const ultimoPedido = pedidosCliente.length > 0 
          ? pedidosCliente.sort((a, b) => new Date(b.criadaEm).getTime() - new Date(a.criadaEm).getTime())[0].criadaEm
          : undefined;
        
        return {
          ...cliente,
          totalPedidos,
          totalGasto,
          ultimoPedido
        };
      });
      
      setClientes(clientesEnriquecidos);
    } catch (error) {
      toast.error('Erro ao carregar clientes');
    } finally {
      setCarregando(false);
    }
  };

  const abrirModalNovoCliente = () => {
    setClienteEdicao(null);
    limparFormulario();
    setModalAberto(true);
  };

  const abrirModalEdicao = (cliente: Cliente) => {
    setClienteEdicao(cliente);
    setNome(cliente.nome);
    setTelefone(cliente.telefone || '');
    setEmail(cliente.email || '');
    setEndereco(cliente.endereco || '');
    setDataNascimento(cliente.dataNascimento || '');
    setObservacoes(cliente.observacoes || '');
    setModalAberto(true);
  };

  const limparFormulario = () => {
    setNome('');
    setTelefone('');
    setEmail('');
    setEndereco('');
    setDataNascimento('');
    setObservacoes('');
  };

  const salvarCliente = async () => {
    if (!nome.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    try {
      const clientesAtuais = JSON.parse(localStorage.getItem('clientes') || '[]') as Cliente[];
      
      if (clienteEdicao) {
        // Atualizar cliente existente
        const index = clientesAtuais.findIndex(c => c.id === clienteEdicao.id);
        if (index !== -1) {
          clientesAtuais[index] = {
            ...clientesAtuais[index],
            nome: nome.trim(),
            telefone: telefone.trim() || undefined,
            email: email.trim() || undefined,
            endereco: endereco.trim() || undefined,
            dataNascimento: dataNascimento || undefined,
            observacoes: observacoes.trim() || undefined,
            atualizadoEm: new Date().toISOString()
          };
        }
        toast.success('Cliente atualizado com sucesso!');
      } else {
        // Criar novo cliente
        const novoCliente: Cliente = {
          id: Date.now().toString(),
          nome: nome.trim(),
          telefone: telefone.trim() || undefined,
          email: email.trim() || undefined,
          endereco: endereco.trim() || undefined,
          dataNascimento: dataNascimento || undefined,
          observacoes: observacoes.trim() || undefined,
          totalPedidos: 0,
          totalGasto: 0,
          criadoEm: new Date().toISOString(),
          atualizadoEm: new Date().toISOString()
        };
        
        clientesAtuais.push(novoCliente);
        toast.success('Cliente criado com sucesso!');
      }

      localStorage.setItem('clientes', JSON.stringify(clientesAtuais));
      setModalAberto(false);
      carregarClientes();
    } catch (error) {
      toast.error('Erro ao salvar cliente');
    }
  };

  const excluirCliente = (clienteId: string) => {
    if (confirm('Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.')) {
      const clientesAtuais = JSON.parse(localStorage.getItem('clientes') || '[]') as Cliente[];
      const clientesAtualizados = clientesAtuais.filter(c => c.id !== clienteId);
      
      localStorage.setItem('clientes', JSON.stringify(clientesAtualizados));
      toast.success('Cliente excluído com sucesso!');
      carregarClientes();
    }
  };

  // Filtrar clientes
  const clientesFiltrados = clientes.filter(cliente => 
    !termoBusca || 
    cliente.nome.toLowerCase().includes(termoBusca.toLowerCase()) ||
    cliente.telefone?.toLowerCase().includes(termoBusca.toLowerCase()) ||
    cliente.email?.toLowerCase().includes(termoBusca.toLowerCase())
  );

  // Estatísticas
  const totalClientes = clientes.length;
  const clientesAtivos = clientes.filter(c => c.totalPedidos > 0).length;
  const ticketMedioGeral = totalClientes > 0 
    ? clientes.reduce((total, c) => total + c.totalGasto, 0) / totalClientes 
    : 0;

  return (
    <LayoutPrincipal titulo="Gestão de Clientes">
      <div className="space-y-6">
        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total de Clientes</p>
                  <p className="text-2xl font-bold">{totalClientes}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Clientes Ativos</p>
                  <p className="text-2xl font-bold">{clientesAtivos}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Star className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Ticket Médio</p>
                  <p className="text-2xl font-bold">MT {ticketMedioGeral.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros e Ações */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Clientes</span>
              <Button onClick={abrirModalNovoCliente}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Cliente
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <Label htmlFor="busca">Buscar Cliente</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="busca"
                  placeholder="Nome, telefone ou email..."
                  value={termoBusca}
                  onChange={(e) => setTermoBusca(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Lista de Clientes */}
            {carregando ? (
              <div className="text-center py-8">
                <p>Carregando clientes...</p>
              </div>
            ) : clientesFiltrados.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {termoBusca ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Pedidos</TableHead>
                    <TableHead>Total Gasto</TableHead>
                    <TableHead>Último Pedido</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientesFiltrados.map((cliente) => (
                    <TableRow key={cliente.id}>
                      <TableCell className="font-medium">
                        <div>
                          <p>{cliente.nome}</p>
                          {cliente.endereco && (
                            <p className="text-sm text-muted-foreground flex items-center">
                              <MapPin className="w-3 h-3 mr-1" />
                              {cliente.endereco}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {cliente.telefone && (
                            <p className="text-sm flex items-center">
                              <Phone className="w-3 h-3 mr-1" />
                              {cliente.telefone}
                            </p>
                          )}
                          {cliente.email && (
                            <p className="text-sm flex items-center">
                              <Mail className="w-3 h-3 mr-1" />
                              {cliente.email}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={cliente.totalPedidos > 0 ? 'default' : 'secondary'}>
                          {cliente.totalPedidos}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        MT {cliente.totalGasto.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {cliente.ultimoPedido ? (
                          <div className="flex items-center text-sm">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(cliente.ultimoPedido).toLocaleDateString('pt-PT')}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Nunca</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => abrirModalEdicao(cliente)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => excluirCliente(cliente.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Modal de Cliente */}
        <Dialog open={modalAberto} onOpenChange={setModalAberto}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {clienteEdicao ? 'Editar Cliente' : 'Novo Cliente'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Nome completo"
                  />
                </div>

                <div>
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    placeholder="+351 912 345 678"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                  />
                </div>

                <div>
                  <Label htmlFor="dataNascimento">Data de Nascimento</Label>
                  <Input
                    id="dataNascimento"
                    type="date"
                    value={dataNascimento}
                    onChange={(e) => setDataNascimento(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  placeholder="Rua, número, bairro, cidade"
                />
              </div>

              <div>
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Preferências, alergias, observações gerais..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setModalAberto(false)}>
                  Cancelar
                </Button>
                <Button onClick={salvarCliente}>
                  {clienteEdicao ? 'Atualizar' : 'Criar'} Cliente
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </LayoutPrincipal>
  );
}
