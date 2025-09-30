
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Settings,
  Save,
  Globe,
  Clock,
  DollarSign
} from 'lucide-react';

interface ConfiguracoesRestaurante {
  id: string;
  nome: string;
  endereco: string;
  telefone: string;
  email: string;
  nuit?: string;
  inscricaoEstadual?: string;
  inscricaoMunicipal?: string;
  taxaServico: number;
  moeda: string;
  fusoHorario: string;
}

interface Imposto {
  id: string;
  nome: string;
  percentual: number;
  tipo: 'servico' | 'produto' | 'outro';
  ativo: boolean;
}

interface HorarioFuncionamento {
  id: string;
  diaSemana: number;
  abertura: string;
  fechamento: string;
  ativo: boolean;
}

interface UnidadeMedida {
  id: string;
  nome: string;
  simbolo: string;
  tipo: 'peso' | 'volume' | 'unidade' | 'outro';
  ativo: boolean;
}

interface ConfiguracoesCompletas {
  restaurante: ConfiguracoesRestaurante;
  impostos: Imposto[];
  horariosFuncionamento: HorarioFuncionamento[];
  unidadesMedida: UnidadeMedida[];
}


export default function PaginaConfiguracoes() {
  const [configuracoes, setConfiguracoes] = useState<ConfiguracoesCompletas | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [carregandoInicial, setCarregandoInicial] = useState(true);
  const [alteracoesPendentes, setAlteracoesPendentes] = useState(false);
  const restauranteId = 'default-restaurant'; // TODO: Get from context

  useEffect(() => {
    carregarConfiguracoes();
  }, []);

  const carregarConfiguracoes = async () => {
    try {
      const response = await api.get(`/configuracoes?restauranteId=${restauranteId}`);
      setConfiguracoes(response);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setCarregandoInicial(false);
    }
  };

  const salvarConfiguracoes = async () => {
    if (!configuracoes) return;
    
    setCarregando(true);
    try {
      await api.put(`/configuracoes?restauranteId=${restauranteId}`, {
        ...configuracoes.restaurante,
        impostos: configuracoes.impostos,
        horariosFuncionamento: configuracoes.horariosFuncionamento
      });
      setAlteracoesPendentes(false);
      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setCarregando(false);
    }
  };


  const atualizarRestaurante = (chave: keyof ConfiguracoesRestaurante, valor: any) => {
    if (!configuracoes) return;
    setConfiguracoes(prev => ({
      ...prev!,
      restaurante: { ...prev!.restaurante, [chave]: valor }
    }));
    setAlteracoesPendentes(true);
  };

  if (carregandoInicial) {
    return (
      <LayoutPrincipal titulo="Configurações do Sistema">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando configurações...</p>
          </div>
        </div>
      </LayoutPrincipal>
    );
  }

  if (!configuracoes) {
    return (
      <LayoutPrincipal titulo="Configurações do Sistema">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-muted-foreground">Erro ao carregar configurações. Por favor, tente novamente.</p>
            <Button onClick={carregarConfiguracoes} className="mt-4">
              Tentar Novamente
            </Button>
          </div>
        </div>
      </LayoutPrincipal>
    );
  }

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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="geral">Informações Gerais</TabsTrigger>
            <TabsTrigger value="impostos">Impostos</TabsTrigger>
            <TabsTrigger value="horarios">Horários</TabsTrigger>
            <TabsTrigger value="unidades">Unidades de Medida</TabsTrigger>
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
                    <Label htmlFor="nomeEmpresa">Nome do Restaurante</Label>
                    <Input
                      id="nomeEmpresa"
                      value={configuracoes.restaurante.nome}
                      onChange={(e) => atualizarRestaurante('nome', e.target.value)}
                      placeholder="Nome do restaurante"
                    />
                  </div>
                  <div>
                    <Label htmlFor="emailEmpresa">Email</Label>
                    <Input
                      id="emailEmpresa"
                      type="email"
                      value={configuracoes.restaurante.email}
                      onChange={(e) => atualizarRestaurante('email', e.target.value)}
                      placeholder="contato@restaurante.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="telefoneEmpresa">Telefone</Label>
                    <Input
                      id="telefoneEmpresa"
                      value={configuracoes.restaurante.telefone}
                      onChange={(e) => atualizarRestaurante('telefone', e.target.value)}
                      placeholder="+351 123 456 789"
                    />
                  </div>
                  <div>
                    <Label htmlFor="moeda">Moeda</Label>
                    <Select 
                      value={configuracoes.restaurante.moeda} 
                      onValueChange={(value) => atualizarRestaurante('moeda', value)}
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
                    value={configuracoes.restaurante.endereco}
                    onChange={(e) => atualizarRestaurante('endereco', e.target.value)}
                    placeholder="Endereço completo do restaurante"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Informações Fiscais e Taxa de Serviço</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nuit">NUIT</Label>
                    <Input
                      id="nuit"
                      value={configuracoes.restaurante.nuit || ''}
                      onChange={(e) => atualizarRestaurante('nuit', e.target.value)}
                      placeholder="Número Único de Identificação Tributária"
                    />
                  </div>
                  <div>
                    <Label htmlFor="taxaServico">Taxa de Serviço (%)</Label>
                    <Input
                      id="taxaServico"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={configuracoes.restaurante.taxaServico}
                      onChange={(e) => atualizarRestaurante('taxaServico', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="inscricaoEstadual">Inscrição Estadual</Label>
                    <Input
                      id="inscricaoEstadual"
                      value={configuracoes.restaurante.inscricaoEstadual || ''}
                      onChange={(e) => atualizarRestaurante('inscricaoEstadual', e.target.value)}
                      placeholder="Número da inscrição estadual"
                    />
                  </div>
                  <div>
                    <Label htmlFor="inscricaoMunicipal">Inscrição Municipal</Label>
                    <Input
                      id="inscricaoMunicipal"
                      value={configuracoes.restaurante.inscricaoMunicipal || ''}
                      onChange={(e) => atualizarRestaurante('inscricaoMunicipal', e.target.value)}
                      placeholder="Número da inscrição municipal"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fusoHorario">Fuso Horário</Label>
                    <Select 
                      value={configuracoes.restaurante.fusoHorario} 
                      onValueChange={(value) => atualizarRestaurante('fusoHorario', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Africa/Maputo">África/Maputo</SelectItem>
                        <SelectItem value="Africa/Johannesburg">África/Joanesburgo</SelectItem>
                        <SelectItem value="Europe/Lisbon">Europa/Lisboa</SelectItem>
                        <SelectItem value="America/Sao_Paulo">América/São Paulo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Configurações de Impostos */}
          <TabsContent value="impostos" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Configuração de Impostos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {configuracoes.impostos.map((imposto, index) => (
                    <div key={imposto.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Input
                          value={imposto.nome}
                          placeholder="Nome do imposto"
                          onChange={(e) => {
                            const novosImpostos = [...configuracoes.impostos];
                            novosImpostos[index] = { ...imposto, nome: e.target.value };
                            setConfiguracoes(prev => ({ ...prev!, impostos: novosImpostos }));
                            setAlteracoesPendentes(true);
                          }}
                        />
                        <Input
                          type="number"
                          value={imposto.percentual}
                          placeholder="Percentual"
                          min="0"
                          max="100"
                          step="0.01"
                          onChange={(e) => {
                            const novosImpostos = [...configuracoes.impostos];
                            novosImpostos[index] = { ...imposto, percentual: parseFloat(e.target.value) || 0 };
                            setConfiguracoes(prev => ({ ...prev!, impostos: novosImpostos }));
                            setAlteracoesPendentes(true);
                          }}
                        />
                        <Select
                          value={imposto.tipo}
                          onValueChange={(value: 'servico' | 'produto' | 'outro') => {
                            const novosImpostos = [...configuracoes.impostos];
                            novosImpostos[index] = { ...imposto, tipo: value };
                            setConfiguracoes(prev => ({ ...prev!, impostos: novosImpostos }));
                            setAlteracoesPendentes(true);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="servico">Serviço</SelectItem>
                            <SelectItem value="produto">Produto</SelectItem>
                            <SelectItem value="outro">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={imposto.ativo}
                            onCheckedChange={(checked) => {
                              const novosImpostos = [...configuracoes.impostos];
                              novosImpostos[index] = { ...imposto, ativo: checked };
                              setConfiguracoes(prev => ({ ...prev!, impostos: novosImpostos }));
                              setAlteracoesPendentes(true);
                            }}
                          />
                          <Label>Ativo</Label>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const novosImpostos = configuracoes.impostos.filter((_, i) => i !== index);
                          setConfiguracoes(prev => ({ ...prev!, impostos: novosImpostos }));
                          setAlteracoesPendentes(true);
                        }}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    onClick={() => {
                      const novoImposto: Imposto = {
                        id: Date.now().toString(),
                        nome: '',
                        percentual: 0,
                        tipo: 'produto',
                        ativo: true
                      };
                      setConfiguracoes(prev => ({
                        ...prev!,
                        impostos: [...prev!.impostos, novoImposto]
                      }));
                      setAlteracoesPendentes(true);
                    }}
                  >
                    Adicionar Imposto
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Configurações de Horários */}
          <TabsContent value="horarios" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Horários de Funcionamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].map((dia, diaSemana) => {
                    const horario = configuracoes.horariosFuncionamento.find(h => h.diaSemana === diaSemana) || {
                      id: Date.now().toString(),
                      diaSemana,
                      abertura: '09:00',
                      fechamento: '22:00',
                      ativo: true
                    };
                    
                    return (
                      <div key={diaSemana} className="flex items-center gap-4 p-4 border rounded-lg">
                        <div className="w-24 font-medium">{dia}</div>
                        <div className="flex-1 flex items-center gap-4">
                          <Input
                            type="time"
                            value={horario.abertura}
                            onChange={(e) => {
                              const novosHorarios = [...configuracoes.horariosFuncionamento];
                              const index = novosHorarios.findIndex(h => h.diaSemana === diaSemana);
                              if (index >= 0) {
                                novosHorarios[index] = { ...horario, abertura: e.target.value };
                              } else {
                                novosHorarios.push({ ...horario, abertura: e.target.value });
                              }
                              setConfiguracoes(prev => ({ ...prev!, horariosFuncionamento: novosHorarios }));
                              setAlteracoesPendentes(true);
                            }}
                            disabled={!horario.ativo}
                          />
                          <span>às</span>
                          <Input
                            type="time"
                            value={horario.fechamento}
                            onChange={(e) => {
                              const novosHorarios = [...configuracoes.horariosFuncionamento];
                              const index = novosHorarios.findIndex(h => h.diaSemana === diaSemana);
                              if (index >= 0) {
                                novosHorarios[index] = { ...horario, fechamento: e.target.value };
                              } else {
                                novosHorarios.push({ ...horario, fechamento: e.target.value });
                              }
                              setConfiguracoes(prev => ({ ...prev!, horariosFuncionamento: novosHorarios }));
                              setAlteracoesPendentes(true);
                            }}
                            disabled={!horario.ativo}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={horario.ativo}
                            onCheckedChange={(checked) => {
                              const novosHorarios = [...configuracoes.horariosFuncionamento];
                              const index = novosHorarios.findIndex(h => h.diaSemana === diaSemana);
                              if (index >= 0) {
                                novosHorarios[index] = { ...horario, ativo: checked };
                              } else {
                                novosHorarios.push({ ...horario, ativo: checked });
                              }
                              setConfiguracoes(prev => ({ ...prev!, horariosFuncionamento: novosHorarios }));
                              setAlteracoesPendentes(true);
                            }}
                          />
                          <Label>Aberto</Label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Unidades de Medida */}
          <TabsContent value="unidades" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Unidades de Medida</CardTitle>
                <p className="text-sm text-muted-foreground">
                  As unidades de medida são configurações globais do sistema
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {configuracoes.unidadesMedida.map((unidade) => (
                    <div key={unidade.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">{unidade.nome}</div>
                        <div className="text-sm text-muted-foreground">
                          Símbolo: {unidade.simbolo} • Tipo: {unidade.tipo}
                        </div>
                      </div>
                      <Badge variant={unidade.ativo ? 'default' : 'secondary'}>
                        {unidade.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </LayoutPrincipal>
  );
}
