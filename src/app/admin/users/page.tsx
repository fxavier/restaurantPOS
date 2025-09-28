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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
  UserPlus,
  Edit,
  Trash,
  Shield,
  Users,
  Eye,
  EyeOff,
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

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
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
      loadUsers();
    }
  }, [session]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users');
      
      if (!response.ok) {
        throw new Error('Erro ao carregar usuários');
      }

      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = editingUser ? `/api/admin/users/${editingUser.id}` : '/api/admin/users';
      const method = editingUser ? 'PUT' : 'POST';
      
      // Don't send empty password for updates
      const submitData = { ...formData };
      if (editingUser && !submitData.senha) {
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
        throw new Error(error.error || 'Erro ao salvar usuário');
      }

      toast.success(editingUser ? 'Usuário atualizado com sucesso' : 'Usuário criado com sucesso');
      setModalOpen(false);
      setEditingUser(null);
      setFormData(initialFormData);
      await loadUsers();
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar usuário');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (user: Usuario) => {
    setEditingUser(user);
    setFormData({
      nome: user.nome,
      email: user.email,
      username: user.username,
      senha: '', // Don't prefill password
      telefone: user.telefone || '',
      perfil: user.perfil,
      ativo: user.ativo,
    });
    setModalOpen(true);
  };

  const handleDelete = async (user: Usuario) => {
    if (user.id === session?.user?.id) {
      toast.error('Você não pode excluir seu próprio usuário');
      return;
    }

    if (!confirm(`Tem certeza que deseja desativar o usuário ${user.nome}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao desativar usuário');
      }

      toast.success('Usuário desativado com sucesso');
      await loadUsers();
    } catch (error) {
      console.error('Erro ao desativar usuário:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao desativar usuário');
    }
  };

  const toggleUserStatus = async (user: Usuario) => {
    if (user.id === session?.user?.id && !user.ativo) {
      toast.error('Você não pode desativar seu próprio usuário');
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ativo: !user.ativo }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao alterar status do usuário');
      }

      toast.success(`Usuário ${user.ativo ? 'desativado' : 'ativado'} com sucesso`);
      await loadUsers();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao alterar status do usuário');
    }
  };

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

  if (status === 'loading') {
    return (
      <LayoutPrincipal titulo="Gerenciar Usuários">
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
    <LayoutPrincipal titulo="Gerenciar Usuários">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Gerenciar Usuários</h1>
          </div>
          
          <Dialog open={modalOpen} onOpenChange={setModalOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingUser(null);
                  setFormData(initialFormData);
                }}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
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
                  <Label htmlFor="username">Usuário *</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="senha">
                    Senha {editingUser ? '(deixe vazio para manter atual)' : '*'}
                  </Label>
                  <div className="relative">
                    <Input
                      id="senha"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.senha}
                      onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                      required={!editingUser}
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
                  <Label htmlFor="ativo">Usuário ativo</Label>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? 'Salvando...' : editingUser ? 'Atualizar' : 'Criar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Usuários ({users.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Carregando usuários...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8">
                <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhum usuário encontrado</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Último Login</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.nome}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>
                        <Badge className={`${getProfileColor(user.perfil)} text-white`}>
                          {getProfileLabel(user.perfil)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={user.ativo}
                            onCheckedChange={() => toggleUserStatus(user)}
                            disabled={user.id === session?.user?.id}
                          />
                          <span className={user.ativo ? 'text-green-600' : 'text-red-600'}>
                            {user.ativo ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.ultimoLogin
                          ? new Date(user.ultimoLogin).toLocaleDateString('pt-PT')
                          : 'Nunca'
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(user)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(user)}
                            disabled={user.id === session?.user?.id}
                          >
                            <Trash className="w-4 h-4" />
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
      </div>
    </LayoutPrincipal>
  );
}