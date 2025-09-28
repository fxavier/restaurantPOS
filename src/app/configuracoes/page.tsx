
'use client';

import { useState, useEffect } from 'react';
import LayoutPrincipal from '@/components/layout/layout-principal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Settings,
  Save,
  RotateCcw,
  Bell,
  Shield,
  Palette,
  Globe,
  Printer,
  CreditCard,
  Mail,
  Smartphone,
  Clock,
  DollarSign
} from 'lucide-react';

interface ConfiguracoesSistema {
  // Configurações Gerais
  nomeEmpresa: string;
  emailEmpresa: string;
  telefoneEmpresa: string;
  enderecoEmpresa: string;
  moeda: string;
  idioma: string;
  fusoHorario: string;

  // Configurações de Vendas
  taxaServicoBalcao: number;
  taxaServicoDelivery: number;
  tempoPreparoDefault: number;
  permitirDesconto: boolean;
  descontoMaximo: number;
  
  // Configurações de Impressão
  impressoraComanda: string;
  impressoraCozinha: string;
  imprimirAutomatico: boolean;
  
  // Configurações de Notificação
  notificacoesPush: boolean;
  notificacoesEmail: boolean;
  notificacoesSMS: boolean;
  
  // Configurações de Segurança
  sessaoTimeout: number;
  loginDoisFatores: boolean;
  logAuditoria: boolean;
  
  // Configurações de Aparência
  tema: 'claro' | 'escuro' | 'sistema';
  corPrimaria: string;
  logoEmpresa: string;
}

const configuracoesDefault: ConfiguracoesSistema = {
  nomeEmpresa: 'Meu Restaurante',
  emailEmpresa: 'contato@meurestaurante.com',
  telefoneEmpresa: '+351 123 456 789',
  enderecoEmpresa: 'Rua Principal, 123, Lisboa',
  moeda: 'MZN',
  idioma: 'pt-PT',
  fusoHorario: 'Africa/Johannesburg',
  
  taxaServicoBalcao: 10,
  taxaServicoDelivery: 0,
  tempoPreparoDefault: 15,
  permitirDesconto: true,
  descontoMaximo: 20,
  
  impressoraComanda: '',
  impressoraCozinha: '',
  imprimirAutomatico: true,
  
  notificacoesPush: true,
  notificacoesEmail: true,
  notificacoesSMS: false,
  
  sessaoTimeout: 60,
  loginDoisFatores: false,
  logAuditoria: true,
  
  tema: 'sistema',
  corPrimaria: '#3b82f6',
  logoEmpresa: ''
};

export default function PaginaConfiguracoes() {
  const [configuracoes, setConfiguracoes] = useState<ConfiguracoesSistema>(configuracoesDefault);
  const [carregando, setCarregando] = useState(false);
  const [alteracoesPendentes, setAlteracoesPendentes] = useState(false);

  useEffect(() => {
    carregarConfiguracoes();
  }, []);

  const carregarConfiguracoes = () => {
    try {
      const configSalvas = localStorage.getItem('configuracoes_sistema');
      if (configSalvas) {
        setConfiguracoes({ ...configuracoesDefault, ...JSON.parse(configSalvas) });
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast.error('Erro ao carregar configurações');
    }
  };

  const salvarConfiguracoes = async () => {
    setCarregando(true);
    try {
      localStorage.setItem('configuracoes_sistema', JSON.stringify(configuracoes));
      setAlteracoesPendentes(false);
      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setCarregando(false);
    }
  };

  const restaurarPadrao = () => {
    if (confirm('Tem certeza que deseja restaurar as configurações padrão? Esta ação não pode ser desfeita.')) {
      setConfiguracoes(configuracoesDefault);
      setAlteracoesPendentes(true);
      toast.success('Configurações restauradas para o padrão');
    }
  };

  const atualizarConfiguracao = (chave: keyof ConfiguracoesSistema, valor: any) => {
    setConfiguracoes(prev => ({ ...prev, [chave]: valor }));
    setAlteracoesPendentes(true);
  };

  return (
    <LayoutPrincipal titulo="Configurações do Sistema">
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Configurações</h1>
            <p className="text-muted-foreground">
              Gerencie as configurações do sistema e personalize sua experiência
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={restaurarPadrao}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Restaurar Padrão
            </Button>
            <Button 
              onClick={salvarConfiguracoes} 
              disabled={!alteracoesPendentes || carregando}
            >
              <Save className="w-4 h-4 mr-2" />
              {carregando ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </div>

        {alteracoesPendentes && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-4">
              <div className="flex items-center text-yellow-800">
                <Settings className="w-4 h-4 mr-2" />
                <span className="text-sm">Você tem alterações não salvas. Clique em "Salvar Alterações" para aplicá-las.</span>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="geral" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="geral">Geral</TabsTrigger>
            <TabsTrigger value="vendas">Vendas</TabsTrigger>
            <TabsTrigger value="impressao">Impressão</TabsTrigger>
            <TabsTrigger value="notificacoes">Notificações</TabsTrigger>
            <TabsTrigger value="seguranca">Segurança</TabsTrigger>
            <TabsTrigger value="aparencia">Aparência</TabsTrigger>
          </TabsList>

          {/* Configurações Gerais */}
          <TabsContent value="geral" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="w-5 h-5 mr-2" />
                  Informações da Empresa
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nomeEmpresa">Nome da Empresa</Label>
                    <Input
                      id="nomeEmpresa"
                      value={configuracoes.nomeEmpresa}
                      onChange={(e) => atualizarConfiguracao('nomeEmpresa', e.target.value)}
                      placeholder="Nome da sua empresa"
                    />
                  </div>
                  <div>
                    <Label htmlFor="emailEmpresa">Email da Empresa</Label>
                    <Input
                      id="emailEmpresa"
                      type="email"
                      value={configuracoes.emailEmpresa}
                      onChange={(e) => atualizarConfiguracao('emailEmpresa', e.target.value)}
                      placeholder="contato@empresa.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="telefoneEmpresa">Telefone</Label>
                    <Input
                      id="telefoneEmpresa"
                      value={configuracoes.telefoneEmpresa}
                      onChange={(e) => atualizarConfiguracao('telefoneEmpresa', e.target.value)}
                      placeholder="+351 123 456 789"
                    />
                  </div>
                  <div>
                    <Label htmlFor="moeda">Moeda</Label>
                    <Select 
                      value={configuracoes.moeda} 
                      onValueChange={(value) => atualizarConfiguracao('moeda', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MZN">Metical (MT)</SelectItem>
                        <SelectItem value="USD">Dólar Americano ($)</SelectItem>
                        <SelectItem value="BRL">Real Brasileiro (R$)</SelectItem>
                        <SelectItem value="EUR">Euro (€)</SelectItem>
                        <SelectItem value="GBP">Libra Esterlina (£)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="enderecoEmpresa">Endereço</Label>
                  <Textarea
                    id="enderecoEmpresa"
                    value={configuracoes.enderecoEmpresa}
                    onChange={(e) => atualizarConfiguracao('enderecoEmpresa', e.target.value)}
                    placeholder="Endereço completo da empresa"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Configurações Regionais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="idioma">Idioma</Label>
                    <Select 
                      value={configuracoes.idioma} 
                      onValueChange={(value) => atualizarConfiguracao('idioma', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pt-PT">Português (Portugal)</SelectItem>
                        <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                        <SelectItem value="en-US">English (US)</SelectItem>
                        <SelectItem value="es-ES">Español</SelectItem>
                        <SelectItem value="fr-FR">Français</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="fusoHorario">Fuso Horário</Label>
                    <Select 
                      value={configuracoes.fusoHorario} 
                      onValueChange={(value) => atualizarConfiguracao('fusoHorario', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Europe/Lisbon">Europa/Lisboa</SelectItem>
                        <SelectItem value="America/Sao_Paulo">América/São Paulo</SelectItem>
                        <SelectItem value="America/New_York">América/Nova York</SelectItem>
                        <SelectItem value="Europe/London">Europa/Londres</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Configurações de Vendas */}
          <TabsContent value="vendas" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Taxas e Preços
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="taxaServicoBalcao">Taxa de Serviço - Balcão (%)</Label>
                    <Input
                      id="taxaServicoBalcao"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={configuracoes.taxaServicoBalcao}
                      onChange={(e) => atualizarConfiguracao('taxaServicoBalcao', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="taxaServicoDelivery">Taxa de Serviço - Delivery (%)</Label>
                    <Input
                      id="taxaServicoDelivery"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={configuracoes.taxaServicoDelivery}
                      onChange={(e) => atualizarConfiguracao('taxaServicoDelivery', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="tempoPreparoDefault">Tempo de Preparo Padrão (min)</Label>
                    <Input
                      id="tempoPreparoDefault"
                      type="number"
                      min="1"
                      value={configuracoes.tempoPreparoDefault}
                      onChange={(e) => atualizarConfiguracao('tempoPreparoDefault', parseInt(e.target.value) || 15)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="descontoMaximo">Desconto Máximo (%)</Label>
                    <Input
                      id="descontoMaximo"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={configuracoes.descontoMaximo}
                      onChange={(e) => atualizarConfiguracao('descontoMaximo', parseFloat(e.target.value) || 0)}
                      disabled={!configuracoes.permitirDesconto}
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="permitirDesconto"
                    checked={configuracoes.permitirDesconto}
                    onCheckedChange={(checked) => atualizarConfiguracao('permitirDesconto', checked)}
                  />
                  <Label htmlFor="permitirDesconto">Permitir aplicação de descontos</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Configurações de Impressão */}
          <TabsContent value="impressao" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Printer className="w-5 h-5 mr-2" />
                  Configurações de Impressão
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="impressoraComanda">Impressora de Comandas</Label>
                    <Input
                      id="impressoraComanda"
                      value={configuracoes.impressoraComanda}
                      onChange={(e) => atualizarConfiguracao('impressoraComanda', e.target.value)}
                      placeholder="Nome da impressora"
                    />
                  </div>
                  <div>
                    <Label htmlFor="impressoraCozinha">Impressora da Cozinha</Label>
                    <Input
                      id="impressoraCozinha"
                      value={configuracoes.impressoraCozinha}
                      onChange={(e) => atualizarConfiguracao('impressoraCozinha', e.target.value)}
                      placeholder="Nome da impressora"
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="imprimirAutomatico"
                    checked={configuracoes.imprimirAutomatico}
                    onCheckedChange={(checked) => atualizarConfiguracao('imprimirAutomatico', checked)}
                  />
                  <Label htmlFor="imprimirAutomatico">Imprimir automaticamente ao finalizar pedido</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Configurações de Notificações */}
          <TabsContent value="notificacoes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="w-5 h-5 mr-2" />
                  Notificações
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Notificações Push</Label>
                      <p className="text-sm text-muted-foreground">
                        Receber notificações no navegador
                      </p>
                    </div>
                    <Switch
                      checked={configuracoes.notificacoesPush}
                      onCheckedChange={(checked) => atualizarConfiguracao('notificacoesPush', checked)}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Notificações por Email</Label>
                      <p className="text-sm text-muted-foreground">
                        Receber notificações por email
                      </p>
                    </div>
                    <Switch
                      checked={configuracoes.notificacoesEmail}
                      onCheckedChange={(checked) => atualizarConfiguracao('notificacoesEmail', checked)}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Notificações por SMS</Label>
                      <p className="text-sm text-muted-foreground">
                        Receber notificações por SMS
                      </p>
                    </div>
                    <Switch
                      checked={configuracoes.notificacoesSMS}
                      onCheckedChange={(checked) => atualizarConfiguracao('notificacoesSMS', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Configurações de Segurança */}
          <TabsContent value="seguranca" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Segurança
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="sessaoTimeout">Timeout da Sessão (minutos)</Label>
                  <Input
                    id="sessaoTimeout"
                    type="number"
                    min="5"
                    max="480"
                    value={configuracoes.sessaoTimeout}
                    onChange={(e) => atualizarConfiguracao('sessaoTimeout', parseInt(e.target.value) || 60)}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Tempo em minutos antes da sessão expirar automaticamente
                  </p>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Autenticação de Dois Fatores</Label>
                      <p className="text-sm text-muted-foreground">
                        Adicionar uma camada extra de segurança ao login
                      </p>
                    </div>
                    <Switch
                      checked={configuracoes.loginDoisFatores}
                      onCheckedChange={(checked) => atualizarConfiguracao('loginDoisFatores', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Log de Auditoria</Label>
                      <p className="text-sm text-muted-foreground">
                        Registrar todas as ações dos usuários no sistema
                      </p>
                    </div>
                    <Switch
                      checked={configuracoes.logAuditoria}
                      onCheckedChange={(checked) => atualizarConfiguracao('logAuditoria', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Configurações de Aparência */}
          <TabsContent value="aparencia" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Palette className="w-5 h-5 mr-2" />
                  Aparência
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tema">Tema</Label>
                    <Select 
                      value={configuracoes.tema} 
                      onValueChange={(value: 'claro' | 'escuro' | 'sistema') => atualizarConfiguracao('tema', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="claro">Claro</SelectItem>
                        <SelectItem value="escuro">Escuro</SelectItem>
                        <SelectItem value="sistema">Seguir Sistema</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="corPrimaria">Cor Primária</Label>
                    <Input
                      id="corPrimaria"
                      type="color"
                      value={configuracoes.corPrimaria}
                      onChange={(e) => atualizarConfiguracao('corPrimaria', e.target.value)}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="logoEmpresa">URL do Logo da Empresa</Label>
                  <Input
                    id="logoEmpresa"
                    value={configuracoes.logoEmpresa}
                    onChange={(e) => atualizarConfiguracao('logoEmpresa', e.target.value)}
                    placeholder="https://exemplo.com/logo.png"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    URL da imagem do logo que aparecerá no sistema
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </LayoutPrincipal>
  );
}
