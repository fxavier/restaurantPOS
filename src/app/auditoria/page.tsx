
'use client';

import { useState, useEffect } from 'react';
import LayoutPrincipal from '@/components/layout/layout-principal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  Shield,
  Search,
  Filter,
  Download,
  Eye,
  AlertTriangle,
  CheckCircle,
  Info,
  XCircle,
  Calendar,
  User,
  Activity
} from 'lucide-react';
import { ArmazenamentoLocal } from '@/lib/armazenamento-local';
import { LogAuditoria, TipoAcaoAuditoria } from '@/types/sistema-restaurante';

const TIPOS_ACAO: Record<TipoAcaoAuditoria, { label: string; cor: string; icone: React.ComponentType<{ className?: string }> }> = {
  'criar': { label: 'Criar', cor: 'bg-green-100 text-green-800', icone: CheckCircle },
  'editar': { label: 'Editar', cor: 'bg-blue-100 text-blue-800', icone: Info },
  'excluir': { label: 'Excluir', cor: 'bg-red-100 text-red-800', icone: XCircle },
  'login': { label: 'Login', cor: 'bg-purple-100 text-purple-800', icone: User },
  'logout': { label: 'Logout', cor: 'bg-gray-100 text-gray-800', icone: User },
  'erro': { label: 'Erro', cor: 'bg-red-100 text-red-800', icone: AlertTriangle }
};

export default function PaginaAuditoria() {
  const [logs, setLogs] = useState<LogAuditoria[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState<TipoAcaoAuditoria | 'todos'>('todos');
  const [filtroUsuario, setFiltroUsuario] = useState('');
  const [filtroEntidade, setFiltroEntidade] = useState('');
  const [termoBusca, setTermoBusca] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  useEffect(() => {
    carregarLogs();
  }, []);

  const carregarLogs = () => {
    setCarregando(true);
    try {
      const logsCarregados = ArmazenamentoLocal.obterLogsAuditoria();
      setLogs(logsCarregados);
    } catch (error) {
      toast.error('Erro ao carregar logs de auditoria');
    } finally {
      setCarregando(false);
    }
  };

  const criarLogTeste = () => {
    const logTeste: Omit<LogAuditoria, 'id' | 'criadoEm'> = {
      usuarioId: 'usuario-teste',
      usuarioNome: 'Usuário Teste',
      acao: 'criar',
      entidade: 'produto',
      entidadeId: 'produto-123',
      detalhes: 'Produto "Hambúrguer Clássico" foi criado com sucesso',
      ip: '192.168.1.100',
      userAgent: navigator.userAgent
    };

    ArmazenamentoLocal.salvarLogAuditoria(logTeste);
    carregarLogs();
    toast.success('Log de teste criado');
  };

  const exportarLogs = () => {
    const logsFiltrados = obterLogsFiltrados();
    const dadosExportacao = logsFiltrados.map(log => ({
      Data: new Date(log.criadoEm).toLocaleString('pt-PT'),
      Usuario: log.usuarioNome,
      Acao: TIPOS_ACAO[log.acao].label,
      Entidade: log.entidade,
      Detalhes: log.detalhes,
      IP: log.ip
    }));

    const csv = [
      Object.keys(dadosExportacao[0] || {}).join(','),
      ...dadosExportacao.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `auditoria_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Logs exportados com sucesso');
  };

  const obterLogsFiltrados = () => {
    return logs.filter(log => {
      const matchTipo = filtroTipo === 'todos' || log.acao === filtroTipo;
      const matchUsuario = !filtroUsuario || log.usuarioNome.toLowerCase().includes(filtroUsuario.toLowerCase());
      const matchEntidade = !filtroEntidade || log.entidade.toLowerCase().includes(filtroEntidade.toLowerCase());
      const matchBusca = !termoBusca || 
        log.detalhes.toLowerCase().includes(termoBusca.toLowerCase()) ||
        log.usuarioNome.toLowerCase().includes(termoBusca.toLowerCase()) ||
        log.entidade.toLowerCase().includes(termoBusca.toLowerCase());

      let matchData = true;
      if (dataInicio && dataFim) {
        const dataLog = new Date(log.criadoEm).toISOString().split('T')[0];
        matchData = dataLog >= dataInicio && dataLog <= dataFim;
      }

      return matchTipo && matchUsuario && matchEntidade && matchBusca && matchData;
    });
  };

  const logsFiltrados = obterLogsFiltrados();

  // Estatísticas
  const estatisticas = {
    totalLogs: logs.length,
    logsHoje: logs.filter(log => {
      const hoje = new Date().toDateString();
      const dataLog = new Date(log.criadoEm).toDateString();
      return dataLog === hoje;
    }).length,
    usuarios: [...new Set(logs.map(log => log.usuarioNome))].length,
    erros: logs.filter(log => log.acao === 'erro').length
  };

  const obterEntidadesUnicas = () => {
    return [...new Set(logs.map(log => log.entidade))].sort();
  };

  const obterUsuariosUnicos = () => {
    return [...new Set(logs.map(log => log.usuarioNome))].sort();
  };

  return (
    <LayoutPrincipal titulo="Auditoria e Logs do Sistema">
      <div className="space-y-6">
        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Activity className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total de Logs</p>
                  <p className="text-2xl font-bold">{estatisticas.totalLogs}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Calendar className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Logs Hoje</p>
                  <p className="text-2xl font-bold">{estatisticas.logsHoje}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <User className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Usuários Ativos</p>
                  <p className="text-2xl font-bold">{estatisticas.usuarios}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Erros</p>
                  <p className="text-2xl font-bold">{estatisticas.erros}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Filtros de Auditoria</span>
              <div className="flex gap-2">
                <Button variant="outline" onClick={criarLogTeste}>
                  Criar Log Teste
                </Button>
                <Button variant="outline" onClick={exportarLogs} disabled={logsFiltrados.length === 0}>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar CSV
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar nos logs..."
                    value={termoBusca}
                    onChange={(e) => setTermoBusca(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Tipo de Ação</label>
                <Select value={filtroTipo} onValueChange={(value: any) => setFiltroTipo(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas as Ações</SelectItem>
                    <SelectItem value="criar">Criar</SelectItem>
                    <SelectItem value="editar">Editar</SelectItem>
                    <SelectItem value="excluir">Excluir</SelectItem>
                    <SelectItem value="login">Login</SelectItem>
                    <SelectItem value="logout">Logout</SelectItem>
                    <SelectItem value="erro">Erro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Usuário</label>
                <Select value={filtroUsuario} onValueChange={setFiltroUsuario}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os usuários" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os usuários</SelectItem>
                    {obterUsuariosUnicos().map(usuario => (
                      <SelectItem key={usuario} value={usuario}>{usuario}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Entidade</label>
                <Select value={filtroEntidade} onValueChange={setFiltroEntidade}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as entidades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas as entidades</SelectItem>
                    {obterEntidadesUnicas().map(entidade => (
                      <SelectItem key={entidade} value={entidade} className="capitalize">
                        {entidade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Data Início</label>
                <Input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Data Fim</label>
                <Input
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Logs */}
        <Card>
          <CardHeader>
            <CardTitle>
              Logs de Auditoria ({logsFiltrados.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {carregando ? (
              <div className="text-center py-8">
                <p>Carregando logs...</p>
              </div>
            ) : logsFiltrados.length === 0 ? (
              <div className="text-center py-8">
                <Shield className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Nenhum log encontrado</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {logs.length === 0 ? 'Ainda não há logs de auditoria no sistema.' : 'Tente ajustar os filtros.'}
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Ação</TableHead>
                      <TableHead>Entidade</TableHead>
                      <TableHead>Detalhes</TableHead>
                      <TableHead>IP</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logsFiltrados.map((log) => {
                      const tipoAcao = TIPOS_ACAO[log.acao];
                      const IconeAcao = tipoAcao.icone;

                      return (
                        <TableRow key={log.id}>
                          <TableCell>
                            <div className="text-sm">
                              <p>{new Date(log.criadoEm).toLocaleDateString('pt-PT')}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(log.criadoEm).toLocaleTimeString('pt-PT')}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <User className="w-4 h-4 mr-2 text-muted-foreground" />
                              {log.usuarioNome}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={tipoAcao.cor}>
                              <IconeAcao className="w-3 h-3 mr-1" />
                              {tipoAcao.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="capitalize">{log.entidade}</TableCell>
                          <TableCell>
                            <div className="max-w-md">
                              <p className="text-sm line-clamp-2">{log.detalhes}</p>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-xs">{log.ip}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </LayoutPrincipal>
  );
}
