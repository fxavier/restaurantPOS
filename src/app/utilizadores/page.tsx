
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import LayoutPrincipal from '@/components/layout/layout-principal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Shield,
  Eye,
  EyeOff,
  Search,
  Filter,
  UserCheck,
  UserX,
  Crown,
  Settings,
  ChefHat,
  ShoppingCart,
  Package
} from 'lucide-react';
import { Usuario, PerfilUsuario } from '@/types/sistema-restaurante';

interface UserFormData {
  nome: string;
  email: string;
  username: string;
  senha?: string;
  telefone: string;
  perfil: PerfilUsuario;
  ativo: boolean;
}

const initialFormData: UserFormData = {
  nome: '',
  email: '',
  username: '',
  senha: '',
  telefone: '',
  perfil: 'garcom',
  ativo: true,
};

export default function PaginaUtilizadores() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [utilizadores, setUtilizadores] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [termoBusca, setTermoBusca] = useState('');
  const [filtroPerfil, setFiltroPerfil] = useState<PerfilUsuario | 'todos'>('todos');
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'ativo' | 'inativo'>('todos');
  
  // Modal de utilizador
  const [modalAberto, setModalAberto] = useState(false);
  const [utilizadorEdicao, setUtilizadorEdicao] = useState<Usuario | null>(null);
  const [formData, setFormData] = useState<UserFormData>(initialFormData);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Redirect if not admin
  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user || session.user.role !== 'admin') {
      router.push('/');
      return;
    }
  }, [session, status, router]);

  useEffect(() => {
    if (session?.user?.role === 'admin') {
      carregarUtilizadores();
    }
  }, [session]);

  const carregarUtilizadores = async () => {
    try {
      setCarregando(true);
      const response = await fetch('/api/admin/users');
      
      if (!response.ok) {
        throw new Error('Erro ao carregar utilizadores');
      }

      const result = await response.json();
      console.log('API Response:', result); // Debug log
      // API returns {success: true, data: [...]} format
      const utilizadoresArray = Array.isArray(result?.data) ? result.data : [];
      console.log('Users Array:', utilizadoresArray); // Debug log
      setUtilizadores(utilizadoresArray);
    } catch (error) {
      console.error('Erro ao carregar utilizadores:', error);
      toast.error('Erro ao carregar utilizadores');
    } finally {
      setCarregando(false);
    }
  };

  const abrirModalNovoUtilizador = () => {
    setUtilizadorEdicao(null);
    setFormData(initialFormData);
    setModalAberto(true);
  };

  const abrirModalEdicao = (utilizador: Usuario) => {
    setUtilizadorEdicao(utilizador);
    setFormData({
      nome: utilizador.nome,
      email: utilizador.email,
      username: utilizador.username,
      senha: '', // Don't prefill password
      telefone: utilizador.telefone || '',
      perfil: utilizador.perfil,
      ativo: utilizador.ativo,
    });
    setModalAberto(true);
  };

  const salvarUtilizador = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = utilizadorEdicao ? `/api/admin/users/${utilizadorEdicao.id}` : '/api/admin/users';
      const method = utilizadorEdicao ? 'PUT' : 'POST';
      
      // Don't send empty password for updates
      const submitData = { ...formData };
      if (utilizadorEdicao && !submitData.senha) {
        delete submitData.senha;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao salvar utilizador');
      }

      toast.success(utilizadorEdicao ? 'Utilizador atualizado com sucesso' : 'Utilizador criado com sucesso');
      setModalAberto(false);
      setUtilizadorEdicao(null);
      setFormData(initialFormData);
      await carregarUtilizadores();
    } catch (error) {
      console.error('Erro ao salvar utilizador:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar utilizador');
    } finally {
      setSubmitting(false);
    }
  };

  const alternarStatusUtilizador = async (utilizador: Usuario) => {
    if (utilizador.id === session?.user?.id && !utilizador.ativo) {
      toast.error('Você não pode desativar seu próprio utilizador');
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${utilizador.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ativo: !utilizador.ativo }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao alterar status do utilizador');
      }

      toast.success(`Utilizador ${utilizador.ativo ? 'desativado' : 'ativado'} com sucesso`);
      await carregarUtilizadores();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao alterar status do utilizador');
    }
  };

  const excluirUtilizador = async (utilizador: Usuario) => {
    if (utilizador.id === session?.user?.id) {
      toast.error('Você não pode excluir seu próprio utilizador');
      return;
    }

    if (!confirm(`Tem certeza que deseja desativar o utilizador ${utilizador.nome}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${utilizador.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao desativar utilizador');
      }

      toast.success('Utilizador desativado com sucesso');
      await carregarUtilizadores();
    } catch (error) {
      console.error('Erro ao desativar utilizador:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao desativar utilizador');
    }
  };


  const obterIconePerfil = (perfilUsuario: PerfilUsuario) => {
    switch (perfilUsuario) {
      case 'admin':
        return <Crown className="w-4 h-4" />;
      case 'gestor':
        return <Settings className="w-4 h-4" />;
      case 'caixa':
        return <ShoppingCart className="w-4 h-4" />;
      case 'garcom':
        return <Users className="w-4 h-4" />;
      case 'cozinha':
        return <ChefHat className="w-4 h-4" />;
      case 'estoquista':
        return <Package className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  const obterNomePerfil = (perfilUsuario: PerfilUsuario) => {
    const nomes = {
      admin: 'Administrador',
      gestor: 'Gestor',
      caixa: 'Caixa',
      garcom: 'Garçom',
      cozinha: 'Cozinha',
      estoquista: 'Estoquista'
    };
    return nomes[perfilUsuario] || perfilUsuario;
  };

  // Filtrar utilizadores
  const utilizadoresFiltrados = (utilizadores || []).filter(utilizador => {
    const matchBusca = !termoBusca || 
      utilizador.nome.toLowerCase().includes(termoBusca.toLowerCase()) ||
      utilizador.email.toLowerCase().includes(termoBusca.toLowerCase());
    
    const matchPerfil = filtroPerfil === 'todos' || utilizador.perfil === filtroPerfil;
    const matchStatus = filtroStatus === 'todos' || 
      (filtroStatus === 'ativo' && utilizador.ativo) ||
      (filtroStatus === 'inativo' && !utilizador.ativo);
    
    return matchBusca && matchPerfil && matchStatus;
  });

  // Profile helpers
  const getProfileColor = (perfil: PerfilUsuario) => {
    const colors = {
      admin: 'bg-red-500',
      gestor: 'bg-blue-500', 
      caixa: 'bg-green-500',
      garcom: 'bg-yellow-500',
      cozinha: 'bg-orange-500',
      estoquista: 'bg-purple-500',
    };
    return colors[perfil] || 'bg-gray-500';
  };

  const getProfileLabel = (perfil: PerfilUsuario) => {
    const labels = {
      admin: 'Administrador',
      gestor: 'Gestor',
      caixa: 'Caixa',
      garcom: 'Garçom',
      cozinha: 'Cozinha',
      estoquista: 'Estoquista',
    };
    return labels[perfil] || perfil;
  };

  // Estatísticas
  const totalUtilizadores = (utilizadores || []).length;
  const utilizadoresAtivos = (utilizadores || []).filter(u => u.ativo).length;
  const utilizadoresInativos = (utilizadores || []).filter(u => !u.ativo).length;

  if (status === 'loading') {
    return (
      <LayoutPrincipal titulo="Gestão de Utilizadores">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </LayoutPrincipal>
    );
  }

  if (!session?.user || session.user.role !== 'admin') {
    return null; // Will redirect
  }

  return (
    <LayoutPrincipal titulo="Gestão de Utilizadores">
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
                  <p className="text-sm font-medium text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{totalUtilizadores}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <UserCheck className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Ativos</p>
                  <p className="text-2xl font-bold">{utilizadoresAtivos}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <UserX className="w-6 h-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Inativos</p>
                  <p className="text-2xl font-bold">{utilizadoresInativos}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros e Ações */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Utilizadores</span>
              <Button onClick={abrirModalNovoUtilizador}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Utilizador
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div>
                <Label htmlFor="busca">Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="busca"
                    placeholder="Nome ou email..."
                    value={termoBusca}
                    onChange={(e) => setTermoBusca(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="perfil">Perfil</Label>
                <Select value={filtroPerfil} onValueChange={(value: any) => setFiltroPerfil(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="gestor">Gestor</SelectItem>
                    <SelectItem value="caixa">Caixa</SelectItem>
                    <SelectItem value="garcom">Garçom</SelectItem>
                    <SelectItem value="cozinha">Cozinha</SelectItem>
                    <SelectItem value="estoquista">Estoquista</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={filtroStatus} onValueChange={(value: any) => setFiltroStatus(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Lista de Utilizadores */}
            {carregando ? (
              <div className="text-center py-8">
                <p>Carregando utilizadores...</p>
              </div>
            ) : utilizadoresFiltrados.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Nenhum utilizador encontrado</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Último Login</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {utilizadoresFiltrados.map((utilizador) => (
                    <TableRow key={utilizador.id}>
                      <TableCell className="font-medium">
                        <div>
                          <p>{utilizador.nome}</p>
                          {utilizador.telefone && (
                            <p className="text-sm text-muted-foreground">{utilizador.telefone}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{utilizador.email}</TableCell>
                      <TableCell>
                        <Badge className={`${getProfileColor(utilizador.perfil)} text-white`}>
                          {getProfileLabel(utilizador.perfil)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={utilizador.ativo}
                            onCheckedChange={() => alternarStatusUtilizador(utilizador)}
                            disabled={utilizador.id === session?.user?.id}
                          />
                          <span className={utilizador.ativo ? 'text-green-600' : 'text-red-600'}>
                            {utilizador.ativo ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {utilizador.ultimoLogin 
                          ? new Date(utilizador.ultimoLogin).toLocaleDateString('pt-PT')
                          : 'Nunca'
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => abrirModalEdicao(utilizador)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => excluirUtilizador(utilizador)}
                            disabled={utilizador.id === session?.user?.id}
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

        {/* Modal de Utilizador */}
        <Dialog open={modalAberto} onOpenChange={setModalAberto}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {utilizadorEdicao ? 'Editar Utilizador' : 'Novo Utilizador'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={salvarUtilizador} className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="senha">
                  Senha {utilizadorEdicao ? '(deixe vazio para manter atual)' : '*'}
                </Label>
                <div className="relative">
                  <Input
                    id="senha"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.senha}
                    onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                    required={!utilizadorEdicao}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="perfil">Perfil *</Label>
                <Select value={formData.perfil} onValueChange={(value: PerfilUsuario) => setFormData({ ...formData, perfil: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="gestor">Gestor</SelectItem>
                    <SelectItem value="caixa">Caixa</SelectItem>
                    <SelectItem value="garcom">Garçom</SelectItem>
                    <SelectItem value="cozinha">Cozinha</SelectItem>
                    <SelectItem value="estoquista">Estoquista</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="ativo"
                  checked={formData.ativo}
                  onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                />
                <Label htmlFor="ativo">Utilizador ativo</Label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setModalAberto(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Salvando...' : utilizadorEdicao ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </LayoutPrincipal>
  );
}
