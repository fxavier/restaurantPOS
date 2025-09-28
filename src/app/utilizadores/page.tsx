
'use client';

import { useState, useEffect } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
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
import { ArmazenamentoLocal } from '@/lib/armazenamento-local';
import { Usuario, PerfilUsuario } from '@/types/sistema-restaurante';

const PERMISSOES_DISPONIVEIS = [
  { id: 'dashboard', nome: 'Dashboard', descricao: 'Visualizar painel principal' },
  { id: 'pos', nome: 'POS - Vendas', descricao: 'Acessar sistema de vendas' },
  { id: 'kds', nome: 'Kitchen Display', descricao: 'Visualizar pedidos na cozinha' },
  { id: 'mesas', nome: 'Mesas', descricao: 'Gerenciar mesas' },
  { id: 'produtos', nome: 'Produtos', descricao: 'Gerenciar produtos' },
  { id: 'menus', nome: 'Menus', descricao: 'Gerenciar menus' },
  { id: 'comandas', nome: 'Comandas', descricao: 'Gerenciar comandas' },
  { id: 'estoque', nome: 'Estoque', descricao: 'Gerenciar estoque' },
  { id: 'fornecedores', nome: 'Fornecedores', descricao: 'Gerenciar fornecedores' },
  { id: 'compras', nome: 'Compras', descricao: 'Gerenciar compras' },
  { id: 'relatorios', nome: 'Relatórios', descricao: 'Visualizar relatórios' },
  { id: 'turnos', nome: 'Turnos', descricao: 'Gerenciar turnos' },
  { id: 'pagamentos', nome: 'Pagamentos', descricao: 'Gerenciar pagamentos' },
  { id: 'utilizadores', nome: 'Utilizadores', descricao: 'Gerenciar utilizadores' },
  { id: 'restaurante', nome: 'Restaurante', descricao: 'Configurações do restaurante' },
  { id: 'entregas', nome: 'Entregas', descricao: 'Gerenciar entregas' },
  { id: 'auditoria', nome: 'Auditoria', descricao: 'Visualizar logs de auditoria' },
  { id: 'backup', nome: 'Backup', descricao: 'Gerenciar backups' },
  { id: 'configuracoes', nome: 'Configurações', descricao: 'Configurações do sistema' }
];

const PERFIS_PADRAO: Record<PerfilUsuario, string[]> = {
  admin: PERMISSOES_DISPONIVEIS.map(p => p.id),
  gestor: [
    'dashboard', 'pos', 'kds', 'mesas', 'produtos', 'menus', 'comandas',
    'estoque', 'fornecedores', 'compras', 'relatorios', 'turnos', 'pagamentos',
    'entregas', 'restaurante', 'configuracoes'
  ],
  caixa: ['dashboard', 'pos', 'comandas', 'pagamentos', 'turnos'],
  garcom: ['dashboard', 'pos', 'mesas', 'comandas'],
  cozinha: ['dashboard', 'kds', 'produtos'],
  estoquista: ['dashboard', 'estoque', 'produtos', 'fornecedores', 'compras']
};

export default function PaginaUtilizadores() {
  const [utilizadores, setUtilizadores] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [termoBusca, setTermoBusca] = useState('');
  const [filtroPerfil, setFiltroPerfil] = useState<PerfilUsuario | 'todos'>('todos');
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'ativo' | 'inativo'>('todos');
  
  // Modal de utilizador
  const [modalAberto, setModalAberto] = useState(false);
  const [utilizadorEdicao, setUtilizadorEdicao] = useState<Usuario | null>(null);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [perfil, setPerfil] = useState<PerfilUsuario>('garcom');
  const [permissoes, setPermissoes] = useState<string[]>([]);
  const [ativo, setAtivo] = useState(true);
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  useEffect(() => {
    carregarUtilizadores();
  }, []);

  useEffect(() => {
    // Atualizar permissões quando o perfil mudar
    setPermissoes(PERFIS_PADRAO[perfil] || []);
  }, [perfil]);

  const carregarUtilizadores = () => {
    setCarregando(true);
    
    try {
      const utilizadoresData = ArmazenamentoLocal.obterUsuarios();
      setUtilizadores(utilizadoresData);
    } catch (error) {
      toast.error('Erro ao carregar utilizadores');
    } finally {
      setCarregando(false);
    }
  };

  const abrirModalNovoUtilizador = () => {
    setUtilizadorEdicao(null);
    limparFormulario();
    setModalAberto(true);
  };

  const abrirModalEdicao = (utilizador: Usuario) => {
    setUtilizadorEdicao(utilizador);
    setNome(utilizador.nome);
    setEmail(utilizador.email);
    setTelefone(utilizador.telefone || '');
    setPerfil(utilizador.perfil);
    setPermissoes(utilizador.permissoes);
    setAtivo(utilizador.ativo);
    setSenha('');
    setConfirmarSenha('');
    setModalAberto(true);
  };

  const limparFormulario = () => {
    setNome('');
    setEmail('');
    setTelefone('');
    setPerfil('garcom');
    setPermissoes(PERFIS_PADRAO.garcom);
    setAtivo(true);
    setSenha('');
    setConfirmarSenha('');
  };

  const salvarUtilizador = async () => {
    // Validações
    if (!nome.trim() || !email.trim()) {
      toast.error('Nome e email são obrigatórios');
      return;
    }

    if (!utilizadorEdicao && !senha) {
      toast.error('Senha é obrigatória para novos utilizadores');
      return;
    }

    if (senha && senha !== confirmarSenha) {
      toast.error('Senhas não coincidem');
      return;
    }

    if (permissoes.length === 0) {
      toast.error('Selecione pelo menos uma permissão');
      return;
    }

    // Verificar email duplicado
    const utilizadoresExistentes = ArmazenamentoLocal.obterUsuarios();
    const emailExiste = utilizadoresExistentes.some(u => 
      u.email === email && u.id !== utilizadorEdicao?.id
    );
    
    if (emailExiste) {
      toast.error('Email já está em uso');
      return;
    }

    try {
      const restaurantes = ArmazenamentoLocal.obterRestaurantes();
      const restauranteId = restaurantes[0]?.id || 'default';

      if (utilizadorEdicao) {
        // Atualizar utilizador existente
        const dadosAtualizacao: Partial<Usuario> = {
          nome: nome.trim(),
          email: email.trim(),
          telefone: telefone.trim() || undefined,
          perfil,
          permissoes,
          ativo,
          atualizadoEm: new Date().toISOString()
        };

        const utilizadoresAtuais = ArmazenamentoLocal.obterUsuarios();
        const index = utilizadoresAtuais.findIndex(u => u.id === utilizadorEdicao.id);
        
        if (index !== -1) {
          utilizadoresAtuais[index] = { ...utilizadoresAtuais[index], ...dadosAtualizacao };
          ArmazenamentoLocal.salvarDados('usuarios', utilizadoresAtuais);
        }

        toast.success('Utilizador atualizado com sucesso!');
      } else {
        // Criar novo utilizador
        const novoUtilizador = {
          nome: nome.trim(),
          email: email.trim(),
          telefone: telefone.trim() || undefined,
          perfil,
          permissoes,
          restauranteId,
          ativo
        };

        ArmazenamentoLocal.salvarUsuario(novoUtilizador);
        toast.success('Utilizador criado com sucesso!');
      }

      setModalAberto(false);
      carregarUtilizadores();
    } catch (error) {
      toast.error('Erro ao salvar utilizador');
    }
  };

  const alternarStatusUtilizador = (utilizadorId: string, novoStatus: boolean) => {
    const utilizadoresAtuais = ArmazenamentoLocal.obterUsuarios();
    const index = utilizadoresAtuais.findIndex(u => u.id === utilizadorId);
    
    if (index !== -1) {
      utilizadoresAtuais[index].ativo = novoStatus;
      utilizadoresAtuais[index].atualizadoEm = new Date().toISOString();
      ArmazenamentoLocal.salvarDados('usuarios', utilizadoresAtuais);
      
      toast.success(`Utilizador ${novoStatus ? 'ativado' : 'desativado'} com sucesso!`);
      carregarUtilizadores();
    }
  };

  const excluirUtilizador = (utilizadorId: string) => {
    if (confirm('Tem certeza que deseja excluir este utilizador? Esta ação não pode ser desfeita.')) {
      const utilizadoresAtuais = ArmazenamentoLocal.obterUsuarios();
      const utilizadoresAtualizados = utilizadoresAtuais.filter(u => u.id !== utilizadorId);
      
      ArmazenamentoLocal.salvarDados('usuarios', utilizadoresAtualizados);
      toast.success('Utilizador excluído com sucesso!');
      carregarUtilizadores();
    }
  };

  const alternarPermissao = (permissaoId: string) => {
    if (permissoes.includes(permissaoId)) {
      setPermissoes(permissoes.filter(p => p !== permissaoId));
    } else {
      setPermissoes([...permissoes, permissaoId]);
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
  const utilizadoresFiltrados = utilizadores.filter(utilizador => {
    const matchBusca = !termoBusca || 
      utilizador.nome.toLowerCase().includes(termoBusca.toLowerCase()) ||
      utilizador.email.toLowerCase().includes(termoBusca.toLowerCase());
    
    const matchPerfil = filtroPerfil === 'todos' || utilizador.perfil === filtroPerfil;
    const matchStatus = filtroStatus === 'todos' || 
      (filtroStatus === 'ativo' && utilizador.ativo) ||
      (filtroStatus === 'inativo' && !utilizador.ativo);
    
    return matchBusca && matchPerfil && matchStatus;
  });

  // Estatísticas
  const totalUtilizadores = utilizadores.length;
  const utilizadoresAtivos = utilizadores.filter(u => u.ativo).length;
  const utilizadoresInativos = utilizadores.filter(u => !u.ativo).length;

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
                        <div className="flex items-center">
                          {obterIconePerfil(utilizador.perfil)}
                          <span className="ml-2">{obterNomePerfil(utilizador.perfil)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={utilizador.ativo ? 'default' : 'secondary'}>
                          {utilizador.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
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
                            variant="outline"
                            onClick={() => alternarStatusUtilizador(utilizador.id, !utilizador.ativo)}
                          >
                            {utilizador.ativo ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => excluirUtilizador(utilizador.id)}
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
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@exemplo.com"
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
                  <Label htmlFor="perfil">Perfil *</Label>
                  <Select value={perfil} onValueChange={(value: PerfilUsuario) => setPerfil(value)}>
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

                {!utilizadorEdicao && (
                  <>
                    <div>
                      <Label htmlFor="senha">Senha *</Label>
                      <Input
                        id="senha"
                        type="password"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        placeholder="Senha"
                      />
                    </div>

                    <div>
                      <Label htmlFor="confirmarSenha">Confirmar Senha *</Label>
                      <Input
                        id="confirmarSenha"
                        type="password"
                        value={confirmarSenha}
                        onChange={(e) => setConfirmarSenha(e.target.value)}
                        placeholder="Confirmar senha"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="ativo"
                  checked={ativo}
                  onCheckedChange={setAtivo}
                />
                <Label htmlFor="ativo">Utilizador ativo</Label>
              </div>

              {/* Permissões */}
              <div>
                <Label className="text-base font-medium">Permissões</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Selecione as funcionalidades que este utilizador pode acessar
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto border rounded-lg p-3">
                  {PERMISSOES_DISPONIVEIS.map((permissao) => (
                    <div key={permissao.id} className="flex items-start space-x-2">
                      <Checkbox
                        id={permissao.id}
                        checked={permissoes.includes(permissao.id)}
                        onCheckedChange={() => alternarPermissao(permissao.id)}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label
                          htmlFor={permissao.id}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {permissao.nome}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {permissao.descricao}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setModalAberto(false)}>
                  Cancelar
                </Button>
                <Button onClick={salvarUtilizador}>
                  {utilizadorEdicao ? 'Atualizar' : 'Criar'} Utilizador
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </LayoutPrincipal>
  );
}
