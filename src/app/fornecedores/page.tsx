
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import DataPagination from '@/components/ui/data-pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Truck, 
  Phone, 
  Mail, 
  MapPin,
  Search,
  Building,
  Eye,
  EyeOff
} from 'lucide-react';
import LayoutPrincipal from '@/components/layout/layout-principal';
import { apiDataService } from '@/lib/api-data-service';
import { Fornecedor } from '@/types/sistema-restaurante';

interface FormularioFornecedor {
  nome: string;
  nuit: string;
  contato: string;
  telefone: string;
  email: string;
  endereco: string;
  ativo: boolean;
}

const formularioVazio: FormularioFornecedor = {
  nome: '',
  nuit: '',
  contato: '',
  telefone: '',
  email: '',
  endereco: '',
  ativo: true
};

export default function PaginaFornecedores() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [formulario, setFormulario] = useState<FormularioFornecedor>(formularioVazio);
  const [fornecedorEditando, setFornecedorEditando] = useState<string | null>(null);
  const [dialogoAberto, setDialogoAberto] = useState(false);
  const [termoPesquisa, setTermoPesquisa] = useState('');
  const [filtroAtivo, setFiltroAtivo] = useState<'todos' | 'ativo' | 'inativo'>('todos');
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    carregarDados();
  }, [currentPage, itemsPerPage, filtroAtivo]);

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
  }, [termoPesquisa]);

  const carregarDados = async () => {
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

      if (termoPesquisa) {
        params.append('search', termoPesquisa);
      }

      if (filtroAtivo !== 'todos') {
        params.append('ativo', filtroAtivo === 'ativo' ? 'true' : 'false');
      }

      // Make API call with pagination
      const response = await fetch(`/api/fornecedores?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setFornecedores(data.data || []);
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages);
          setTotalItems(data.pagination.total);
        } else {
          setTotalPages(1);
          setTotalItems(data.data?.length || 0);
        }
      } else {
        throw new Error(data.error || 'Erro ao carregar fornecedores');
      }
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error);
      toast.error('Erro ao carregar fornecedores');
    } finally {
      setLoading(false);
    }
  };

  const salvarFornecedor = async () => {
    if (!formulario.nome.trim()) {
      toast.error('Nome do fornecedor é obrigatório');
      return;
    }

    if (!formulario.contato.trim()) {
      toast.error('Nome do contato é obrigatório');
      return;
    }

    try {
      // TODO: Replace with actual restaurant ID from session/context
      const restauranteId = 'cmg3w1utw005j2gzkrott9zul';
      const fornecedorData = {
        ...formulario,
        restauranteId
      };

      if (fornecedorEditando) {
        await apiDataService.atualizarFornecedor(fornecedorEditando, fornecedorData);
        toast.success('Fornecedor atualizado com sucesso');
      } else {
        await apiDataService.salvarFornecedor(fornecedorData);
        toast.success('Fornecedor criado com sucesso');
      }

      setFormulario(formularioVazio);
      setFornecedorEditando(null);
      setDialogoAberto(false);
      carregarDados();
    } catch (error) {
      console.error('Erro ao salvar fornecedor:', error);
      toast.error('Erro ao salvar fornecedor');
    }
  };

  const editarFornecedor = (fornecedor: Fornecedor) => {
    setFormulario({
      nome: fornecedor.nome,
      nuit: fornecedor.nuit || '',
      contato: fornecedor.contato,
      telefone: fornecedor.telefone || '',
      email: fornecedor.email || '',
      endereco: fornecedor.endereco || '',
      ativo: fornecedor.ativo
    });
    setFornecedorEditando(fornecedor.id);
    setDialogoAberto(true);
  };

  const excluirFornecedor = async (fornecedor: Fornecedor) => {
    if (confirm(`Tem certeza que deseja excluir o fornecedor "${fornecedor.nome}"?`)) {
      try {
        await apiDataService.excluirFornecedor(fornecedor.id);
        carregarDados();
        toast.success('Fornecedor excluído com sucesso');
      } catch (error) {
        console.error('Erro ao excluir fornecedor:', error);
        toast.error('Erro ao excluir fornecedor');
      }
    }
  };

  const alternarStatusFornecedor = async (fornecedor: Fornecedor) => {
    try {
      await apiDataService.atualizarFornecedor(fornecedor.id, {
        ativo: !fornecedor.ativo
      });
      carregarDados();
      toast.success(`Fornecedor ${fornecedor.ativo ? 'desativado' : 'ativado'} com sucesso`);
    } catch (error) {
      console.error('Erro ao alterar status do fornecedor:', error);
      toast.error('Erro ao alterar status do fornecedor');
    }
  };

  const formatarNUIT = (nuit: string) => {
    const apenasNumeros = nuit.replace(/\D/g, '');
    // NUIT format: 9 digits (e.g., 100000000)
    if (apenasNumeros.length === 9) {
      return apenasNumeros.replace(/(\d{1})(\d{2})(\d{3})(\d{3})/, '$1$2 $3 $4');
    }
    return apenasNumeros;
  };

  const formatarTelefone = (telefone: string) => {
    const apenasNumeros = telefone.replace(/\D/g, '');
    if (apenasNumeros.length === 9) {
      return apenasNumeros.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
    }
    return apenasNumeros.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
  };

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleItemsPerPageChange = useCallback((newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing page size
  }, []);

  // No need for local filtering since it's done on server
  const fornecedoresFiltrados = fornecedores;

  return (
    <LayoutPrincipal>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-primary">Gestão de Fornecedores</h1>
            <p className="text-muted-foreground">
              Gerencie seus fornecedores e informações de contato
            </p>
          </div>
          <Dialog open={dialogoAberto} onOpenChange={setDialogoAberto}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setFormulario(formularioVazio);
                setFornecedorEditando(null);
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Fornecedor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {fornecedorEditando ? 'Editar Fornecedor' : 'Novo Fornecedor'}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nome">Nome da Empresa *</Label>
                    <Input
                      id="nome"
                      value={formulario.nome}
                      onChange={(e) => setFormulario(prev => ({ ...prev, nome: e.target.value }))}
                      placeholder="Ex: Distribuidora ABC"
                    />
                  </div>
                  <div>
                    <Label htmlFor="nuit">NUIT</Label>
                    <Input
                      id="nuit"
                      value={formulario.nuit}
                      onChange={(e) => setFormulario(prev => ({ ...prev, nuit: e.target.value }))}
                      placeholder="00.000.000/0000-00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contato">Nome do Contato *</Label>
                    <Input
                      id="contato"
                      value={formulario.contato}
                      onChange={(e) => setFormulario(prev => ({ ...prev, contato: e.target.value }))}
                      placeholder="Ex: João Silva"
                    />
                  </div>
                  <div>
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      value={formulario.telefone}
                      onChange={(e) => setFormulario(prev => ({ ...prev, telefone: e.target.value }))}
                      placeholder="000 000 000"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formulario.email}
                    onChange={(e) => setFormulario(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="contato@fornecedor.com"
                  />
                </div>

                <div>
                  <Label htmlFor="endereco">Endereço</Label>
                  <Textarea
                    id="endereco"
                    value={formulario.endereco}
                    onChange={(e) => setFormulario(prev => ({ ...prev, endereco: e.target.value }))}
                    placeholder="Endereço completo do fornecedor..."
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="ativo"
                    checked={formulario.ativo}
                    onCheckedChange={(checked) => 
                      setFormulario(prev => ({ ...prev, ativo: checked }))
                    }
                  />
                  <Label htmlFor="ativo">Fornecedor ativo</Label>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setDialogoAberto(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={salvarFornecedor}>
                    {fornecedorEditando ? 'Atualizar' : 'Criar'} Fornecedor
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Pesquisar fornecedores..."
                    value={termoPesquisa}
                    onChange={(e) => setTermoPesquisa(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={filtroAtivo} onValueChange={(value: any) => setFiltroAtivo(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Fornecedores</SelectItem>
                  <SelectItem value="ativo">Apenas Ativos</SelectItem>
                  <SelectItem value="inativo">Apenas Inativos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Fornecedores */}
        <div className="grid gap-4">
          {loading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Carregando fornecedores...</p>
              </CardContent>
            </Card>
          ) : fornecedoresFiltrados.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Truck className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum fornecedor encontrado</h3>
                <p className="text-muted-foreground mb-4">
                  {termoPesquisa || filtroAtivo !== 'todos' ? 'Tente ajustar os filtros de pesquisa.' : 'Comece cadastrando seu primeiro fornecedor.'}
                </p>
                {!termoPesquisa && filtroAtivo === 'todos' && (
                  <Button onClick={() => setDialogoAberto(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Cadastrar Primeiro Fornecedor
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            fornecedoresFiltrados.map((fornecedor) => (
              <Card key={fornecedor.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Building className="h-5 w-5" />
                          {fornecedor.nome}
                        </CardTitle>
                        <Badge variant={fornecedor.ativo ? 'default' : 'secondary'}>
                          {fornecedor.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Contato:</span>
                          {fornecedor.contato}
                        </div>
                        {fornecedor.nuit && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium">NUIT:</span>
                            {formatarNUIT(fornecedor.nuit)}
                          </div>
                        )}
                        {fornecedor.telefone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            {formatarTelefone(fornecedor.telefone)}
                          </div>
                        )}
                        {fornecedor.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            {fornecedor.email}
                          </div>
                        )}
                        {fornecedor.endereco && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {fornecedor.endereco}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => alternarStatusFornecedor(fornecedor)}
                        title={fornecedor.ativo ? 'Desativar fornecedor' : 'Ativar fornecedor'}
                      >
                        {fornecedor.ativo ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => editarFornecedor(fornecedor)}
                        title="Editar fornecedor"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => excluirFornecedor(fornecedor)}
                        title="Excluir fornecedor"
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
      </div>
    </LayoutPrincipal>
  );
}
