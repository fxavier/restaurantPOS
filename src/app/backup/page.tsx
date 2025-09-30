
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Download, 
  Upload, 
  Database, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Trash2,
  Calendar,
  HardDrive
} from 'lucide-react';
import LayoutPrincipal from '@/components/layout/layout-principal';
import { api } from '@/lib/api-client';

interface BackupInfo {
  nome: string;
  data: string;
  tamanho: string;
  versao: string;
}

interface BackupStats {
  produtos: number;
  mesas: number;
  comandas: number;
  fornecedores: number;
  usuarios: number;
  categorias: number;
  menus: number;
  ordenCompra: number;
}

export default function PaginaBackup() {
  const [progresso, setProgresso] = useState(0);
  const [processando, setProcessando] = useState(false);
  const [dadosImportacao, setDadosImportacao] = useState('');
  const [backupsLocais, setBackupsLocais] = useState<BackupInfo[]>([]);
  const [stats, setStats] = useState<BackupStats | null>(null);
  const [loading, setLoading] = useState(true);

  // TODO: Replace with actual restaurant ID from session/context
  const restauranteId = 'default-restaurant';

  useEffect(() => {
    const carregarDados = async () => {
      try {
        // Carregar estatísticas
        const statsResponse = await api.get(`/backup/stats?restauranteId=${restauranteId}`);
        if (statsResponse.success) {
          setStats(statsResponse.data);
        }

        // Carregar histórico de backups do localStorage (se existir)
        const backupsSalvos = JSON.parse(localStorage.getItem('backups_info') || '[]');
        setBackupsLocais(backupsSalvos);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        toast.error('Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, [restauranteId]);

  const criarBackup = async () => {
    setProcessando(true);
    setProgresso(0);

    try {
      // Simular progresso
      const intervalos = [10, 30, 50, 70, 90, 100];
      
      for (const valor of intervalos) {
        setProgresso(valor);
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Exportar dados via API
      const response = await api.get(`/backup/export?restauranteId=${restauranteId}`);
      
      if (!response.success) {
        throw new Error(response.error || 'Erro ao exportar dados');
      }

      const dadosBackup = JSON.stringify(response.data, null, 2);
      const agora = new Date();
      const nomeArquivo = `backup_restaurante_${agora.toISOString().split('T')[0]}_${agora.getHours()}${agora.getMinutes()}.json`;
      
      // Criar e baixar arquivo
      const blob = new Blob([dadosBackup], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = nomeArquivo;
      a.click();
      window.URL.revokeObjectURL(url);

      // Salvar informações do backup localmente
      const novoBackup: BackupInfo = {
        nome: nomeArquivo,
        data: agora.toISOString(),
        tamanho: formatarTamanho(blob.size),
        versao: '1.0.0'
      };

      const backupsSalvos = JSON.parse(localStorage.getItem('backups_info') || '[]');
      backupsSalvos.unshift(novoBackup);
      localStorage.setItem('backups_info', JSON.stringify(backupsSalvos.slice(0, 10))); // Manter apenas os 10 mais recentes
      
      setBackupsLocais(backupsSalvos.slice(0, 10));
      toast.success('Backup criado e baixado com sucesso!');
      
    } catch (error) {
      console.error('Erro ao criar backup:', error);
      toast.error('Erro ao criar backup: ' + (error as Error).message);
    } finally {
      setProcessando(false);
      setProgresso(0);
    }
  };

  const restaurarBackup = async () => {
    if (!dadosImportacao.trim()) {
      toast.error('Cole os dados do backup para restaurar');
      return;
    }

    if (!confirm('ATENÇÃO: Esta ação irá substituir todos os dados atuais. Tem certeza que deseja continuar?')) {
      return;
    }

    setProcessando(true);
    setProgresso(0);

    try {
      // Validar JSON
      let dadosBackup;
      try {
        dadosBackup = JSON.parse(dadosImportacao);
      } catch {
        throw new Error('Formato de dados inválido. Certifique-se de que é um JSON válido.');
      }

      // Simular progresso
      const intervalos = [20, 40, 60, 80, 100];
      
      for (const valor of intervalos) {
        setProgresso(valor);
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // Restaurar via API
      const response = await api.post('/backup/import', {
        dadosBackup,
        restauranteId
      });
      
      if (response.success) {
        toast.success('Backup restaurado com sucesso! A página será recarregada.');
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        throw new Error(response.error || 'Erro ao restaurar backup');
      }
      
    } catch (error) {
      console.error('Erro ao restaurar backup:', error);
      toast.error('Erro ao restaurar backup: ' + (error as Error).message);
    } finally {
      setProcessando(false);
      setProgresso(0);
    }
  };

  const limparTodosDados = async () => {
    if (!confirm('ATENÇÃO: Esta ação irá apagar TODOS os dados do sistema permanentemente. Esta ação não pode ser desfeita. Tem certeza?')) {
      return;
    }

    if (!confirm('ÚLTIMA CONFIRMAÇÃO: Todos os dados serão perdidos. Confirma a exclusão?')) {
      return;
    }

    setProcessando(true);
    setProgresso(0);

    try {
      const intervalos = [25, 50, 75, 100];
      
      for (const valor of intervalos) {
        setProgresso(valor);
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Importar dados vazios para limpar o sistema
      const dadosVazios = {
        versao: '1.0.0',
        dataExportacao: new Date().toISOString(),
        restaurante: {
          usuarios: [],
          mesas: [],
          categorias: [],
          produtos: [],
          menus: [],
          comandas: [],
          fornecedores: [],
          ordensCompra: [],
          entregas: [],
          entregadores: [],
          logsAuditoria: [],
          turnosFechamento: [],
          impostos: [],
          horariosFuncionamento: []
        },
        unidadesMedida: [],
        movimentacoesEstoque: []
      };

      const response = await api.post('/backup/import', {
        dadosBackup: dadosVazios,
        restauranteId
      });

      if (response.success) {
        localStorage.removeItem('backups_info');
        toast.success('Todos os dados foram apagados. A página será recarregada.');
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        throw new Error(response.error || 'Erro ao limpar dados');
      }
      
    } catch (error) {
      console.error('Erro ao limpar dados:', error);
      toast.error('Erro ao limpar dados: ' + (error as Error).message);
    } finally {
      setProcessando(false);
      setProgresso(0);
    }
  };

  const carregarArquivo = (event: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = event.target.files?.[0];
    if (!arquivo) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const conteudo = e.target?.result as string;
      setDadosImportacao(conteudo);
      toast.success('Arquivo carregado com sucesso!');
    };
    reader.readAsText(arquivo);
  };

  const formatarTamanho = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const tamanhos = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + tamanhos[i];
  };

  if (loading) {
    return (
      <LayoutPrincipal>
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Carregando dados...</p>
            </div>
          </div>
        </div>
      </LayoutPrincipal>
    );
  }

  const defaultStats = {
    produtos: 0,
    mesas: 0,
    comandas: 0,
    fornecedores: 0,
    usuarios: 0,
    categorias: 0,
    menus: 0,
    ordenCompra: 0
  };

  const currentStats = stats || defaultStats;

  return (
    <LayoutPrincipal>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-primary">Backup e Restauro</h1>
            <p className="text-muted-foreground">
              Gerencie backups dos dados do sistema
            </p>
          </div>
        </div>

        {/* Estatísticas dos Dados */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Produtos</p>
                  <p className="text-2xl font-bold">{currentStats.produtos}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <HardDrive className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Mesas</p>
                  <p className="text-2xl font-bold">{currentStats.mesas}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Comandas</p>
                  <p className="text-2xl font-bold">{currentStats.comandas}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Fornecedores</p>
                  <p className="text-2xl font-bold">{currentStats.fornecedores}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progresso */}
        {processando && (
          <Card>
            <CardContent className="p-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Processando...</span>
                  <span>{progresso}%</span>
                </div>
                <Progress value={progresso} className="w-full" />
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Criar Backup */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Criar Backup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  O backup incluirá todos os dados: produtos, mesas, comandas, fornecedores, 
                  configurações e logs de auditoria.
                </AlertDescription>
              </Alert>
              
              <Button 
                onClick={criarBackup} 
                disabled={processando}
                className="w-full"
              >
                <Download className="mr-2 h-4 w-4" />
                {processando ? 'Criando Backup...' : 'Criar e Baixar Backup'}
              </Button>
            </CardContent>
          </Card>

          {/* Restaurar Backup */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Restaurar Backup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  ATENÇÃO: Restaurar um backup irá substituir todos os dados atuais.
                  Certifique-se de ter um backup atual antes de prosseguir.
                </AlertDescription>
              </Alert>

              <div>
                <Label htmlFor="arquivo-backup">Carregar arquivo de backup</Label>
                <Input
                  id="arquivo-backup"
                  type="file"
                  accept=".json"
                  onChange={carregarArquivo}
                  disabled={processando}
                />
              </div>

              <div>
                <Label htmlFor="dados-backup">Ou cole os dados do backup</Label>
                <Textarea
                  id="dados-backup"
                  placeholder="Cole aqui o conteúdo do arquivo de backup..."
                  value={dadosImportacao}
                  onChange={(e) => setDadosImportacao(e.target.value)}
                  rows={6}
                  disabled={processando}
                />
              </div>

              <Button 
                onClick={restaurarBackup} 
                disabled={processando || !dadosImportacao.trim()}
                variant="destructive"
                className="w-full"
              >
                <Upload className="mr-2 h-4 w-4" />
                {processando ? 'Restaurando...' : 'Restaurar Backup'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Histórico de Backups */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Histórico de Backups
            </CardTitle>
          </CardHeader>
          <CardContent>
            {backupsLocais.length === 0 ? (
              <div className="text-center py-8">
                <Database className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum backup encontrado</h3>
                <p className="text-muted-foreground">
                  Os backups criados aparecerão aqui.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {backupsLocais.map((backup, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{backup.nome}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(backup.data).toLocaleString('pt-PT')} • {backup.tamanho}
                      </p>
                    </div>
                    <Badge variant="outline">v{backup.versao}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Zona de Perigo */}
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Zona de Perigo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                As ações abaixo são irreversíveis e irão apagar permanentemente todos os dados do sistema.
              </AlertDescription>
            </Alert>

            <Button 
              onClick={limparTodosDados}
              disabled={processando}
              variant="destructive"
              className="w-full"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {processando ? 'Apagando Dados...' : 'Apagar Todos os Dados'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </LayoutPrincipal>
  );
}
