
'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import LayoutPrincipal from '@/components/layout/layout-principal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  email?: string | null;
  dataNascimento?: string | null;
  genero?: string | null;
  endereco?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  pais?: string | null;
  observacoes?: string | null;
  ativo: boolean;
  permitirFiado: boolean;
  limiteFiado?: number | null;
  saldoFiado?: number;
  criadoEm: string;
  atualizadoEm: string;
  restauranteId: string;
  comandas?: {
    id: string;
    numero: string;
    total: number;
    status: string;
  }[];
}

export default function PaginaClientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [carregandoInicial, setCarregandoInicial] = useState(true);
  const [termoBusca, setTermoBusca] = useState('');
  const restauranteId = 'default-restaurant'; // TODO: Get from context
  
  // Modal de cliente
  const [modalAberto, setModalAberto] = useState(false);
  const [clienteEdicao, setClienteEdicao] = useState<Cliente | null>(null);
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [endereco, setEndereco] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [pais, setPais] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [genero, setGenero] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [permitirFiado, setPermitirFiado] = useState(false);
  const [limiteFiado, setLimiteFiado] = useState('0');

  useEffect(() => {
    carregarClientes();
  }, []);

  const carregarClientes = async () => {
    try {
      const data = await api.get(`/clientes?restauranteId=${restauranteId}`);
      setClientes(data);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      toast.error('Erro ao carregar clientes');
    } finally {
      setCarregandoInicial(false);
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
    setBairro(cliente.bairro || '');
    setCidade(cliente.cidade || '');
    setPais(cliente.pais || '');
    setDataNascimento(cliente.dataNascimento || '');
    setGenero(cliente.genero || '');
    setObservacoes(cliente.observacoes || '');
    setPermitirFiado(cliente.permitirFiado || false);
    setLimiteFiado(cliente.limiteFiado?.toString() || '0');
    setModalAberto(true);
  };

  const limparFormulario = () => {
    setNome('');
    setTelefone('');
    setEmail('');
    setEndereco('');
    setBairro('');
    setCidade('');
    setPais('');
    setDataNascimento('');
    setGenero('');
    setObservacoes('');
    setPermitirFiado(false);
    setLimiteFiado('0');
  };

  const salvarCliente = async () => {
    if (!nome.trim() || !telefone.trim()) {
      toast.error('Nome e telefone são obrigatórios');
      return;
    }

    setCarregando(true);
    try {
      const clienteData = {
        nome: nome.trim(),
        telefone: telefone.trim(),
        email: email.trim() || null,
        endereco: endereco.trim() || null,
        bairro: bairro.trim() || null,
        cidade: cidade.trim() || null,
        pais: pais.trim() || null,
        dataNascimento: dataNascimento || null,
        genero: genero || null,
        observacoes: observacoes.trim() || null,
        permitirFiado,
        limiteFiado: permitirFiado ? parseFloat(limiteFiado) : null,
        restauranteId
      };

      if (clienteEdicao) {
        // Atualizar cliente existente
        await api.put('/clientes', {
          id: clienteEdicao.id,
          ...clienteData
        });
        toast.success('Cliente atualizado com sucesso!');
      } else {
        // Criar novo cliente
        await api.post('/clientes', clienteData);
        toast.success('Cliente criado com sucesso!');
      }

      setModalAberto(false);
      carregarClientes();
    } catch (error: any) {
      console.error('Erro ao salvar cliente:', error);
      toast.error(error.response?.data?.error || 'Erro ao salvar cliente');
    } finally {
      setCarregando(false);
    }
  };

  const excluirCliente = async (clienteId: string) => {
    if (confirm('Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.')) {
      setCarregando(true);
      try {
        await api.delete(`/clientes?id=${clienteId}`);
        toast.success('Cliente excluído com sucesso!');
        carregarClientes();
      } catch (error: any) {
        console.error('Erro ao excluir cliente:', error);
        toast.error(error.response?.data?.error || 'Erro ao excluir cliente');
      } finally {
        setCarregando(false);
      }
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
  const clientesAtivos = clientes.filter(c => c.ativo).length;
  const clientesComFiado = clientes.filter(c => c.permitirFiado).length;
  const totalFiadoPendente = clientes
    .filter(c => c.permitirFiado && c.saldoFiado)
    .reduce((total, c) => total + (c.saldoFiado || 0), 0);

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
                  <p className="text-sm font-medium text-muted-foreground">Clientes com Fiado</p>
                  <p className="text-2xl font-bold">{clientesComFiado}</p>
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
            {carregandoInicial ? (
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
                    <TableHead>Status</TableHead>
                    <TableHead>Fiado</TableHead>
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
                        <Badge variant={cliente.ativo ? 'default' : 'secondary'}>
                          {cliente.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {cliente.permitirFiado ? (
                          <div>
                            <Badge variant="outline">Permitido</Badge>
                            {cliente.saldoFiado ? (
                              <p className="text-sm mt-1">Saldo: MT {cliente.saldoFiado.toFixed(2)}</p>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Não permitido</span>
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
                  <Label htmlFor="telefone">Telefone *</Label>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="genero">Gênero</Label>
                  <Select value={genero} onValueChange={setGenero}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o gênero" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="masculino">Masculino</SelectItem>
                      <SelectItem value="feminino">Feminino</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  placeholder="Rua, número"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="bairro">Bairro</Label>
                  <Input
                    id="bairro"
                    value={bairro}
                    onChange={(e) => setBairro(e.target.value)}
                    placeholder="Bairro"
                  />
                </div>
                <div>
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                    placeholder="Cidade"
                  />
                </div>
                <div>
                  <Label htmlFor="pais">País</Label>
                  <Input
                    id="pais"
                    value={pais}
                    onChange={(e) => setPais(e.target.value)}
                    placeholder="País"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="permitirFiado"
                    checked={permitirFiado}
                    onCheckedChange={setPermitirFiado}
                  />
                  <Label htmlFor="permitirFiado">Permitir compras fiadas</Label>
                </div>
                
                {permitirFiado && (
                  <div>
                    <Label htmlFor="limiteFiado">Limite de fiado (MT)</Label>
                    <Input
                      id="limiteFiado"
                      type="number"
                      min="0"
                      step="0.01"
                      value={limiteFiado}
                      onChange={(e) => setLimiteFiado(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                )}
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
                <Button onClick={salvarCliente} disabled={carregando}>
                  {carregando ? 'Salvando...' : (clienteEdicao ? 'Atualizar' : 'Criar')} Cliente
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </LayoutPrincipal>
  );
}
