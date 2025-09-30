'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import LayoutPrincipal from '@/components/layout/layout-principal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Building2,
  Save,
  MapPin,
  Phone,
  Mail,
  FileText,
  Clock,
  DollarSign,
  AlertCircle
} from 'lucide-react';

interface Restaurante {
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
  criadoEm: string;
  atualizadoEm: string;
}

interface Imposto {
  id: string;
  nome: string;
  percentual: number;
  tipo: string;
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
  sigla: string;
  tipo: 'peso' | 'volume' | 'unidade';
  fatorConversao: number;
}

interface DadosRestaurante {
  restaurante: Restaurante;
  impostos: Imposto[];
  horariosFuncionamento: HorarioFuncionamento[];
  unidadesMedida: UnidadeMedida[];
}

export default function PaginaRestaurante() {
  const [dados, setDados] = useState<DadosRestaurante | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [alteracoesPendentes, setAlteracoesPendentes] = useState(false);
  const restauranteId = 'default-restaurant'; // TODO: Get from context

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const response = await api.get(`/configuracoes?restauranteId=${restauranteId}`);
      
      // Verificar se a resposta tem a estrutura esperada
      if (response && response.restaurante) {
        setDados(response);
      } else {
        console.error('Estrutura de resposta inesperada:', response);
        toast.error('Dados do restaurante não encontrados');
      }
    } catch (error) {
      console.error('Erro ao carregar dados do restaurante:', error);
      toast.error('Erro ao carregar dados do restaurante');
    } finally {
      setCarregando(false);
    }
  };

  const atualizarRestaurante = (campo: keyof Restaurante, valor: any) => {
    if (!dados) return;
    
    setDados(prev => ({
      ...prev!,
      restaurante: {
        ...prev!.restaurante,
        [campo]: valor
      }
    }));
    setAlteracoesPendentes(true);
  };

  const salvarAlteracoes = async () => {
    if (!dados) return;

    setSalvando(true);
    try {
      await api.put(`/configuracoes?restauranteId=${restauranteId}`, {
        ...dados.restaurante,
        impostos: dados.impostos,
        horariosFuncionamento: dados.horariosFuncionamento
      });
      
      setAlteracoesPendentes(false);
      toast.success('Informações do restaurante atualizadas com sucesso!');
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      toast.error(error.response?.data?.error || 'Erro ao salvar alterações');
    } finally {
      setSalvando(false);
    }
  };

  const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  if (carregando) {
    return (
      <LayoutPrincipal titulo="Restaurante">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando informações do restaurante...</p>
          </div>
        </div>
      </LayoutPrincipal>
    );
  }

  if (!dados || !dados.restaurante) {
    return (
      <LayoutPrincipal titulo="Restaurante">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-muted-foreground">Erro ao carregar dados do restaurante</p>
            <Button onClick={carregarDados} className="mt-4">
              Tentar Novamente
            </Button>
          </div>
        </div>
      </LayoutPrincipal>
    );
  }

  return (
    <LayoutPrincipal titulo="Informações do Restaurante">
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <Building2 className="w-8 h-8 mr-3" />
              {dados.restaurante.nome}
            </h1>
            <p className="text-muted-foreground mt-2">
              Gerencie as informações básicas do seu restaurante
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={salvarAlteracoes} 
              disabled={!alteracoesPendentes || salvando}
            >
              <Save className="w-4 h-4 mr-2" />
              {salvando ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </div>

        {alteracoesPendentes && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-4">
              <div className="flex items-center text-yellow-800">
                <AlertCircle className="w-4 h-4 mr-2" />
                <span className="text-sm">Você tem alterações não salvas. Clique em "Salvar Alterações" para aplicá-las.</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building2 className="w-5 h-5 mr-2" />
              Informações Básicas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="nome">Nome do Restaurante</Label>
                <Input
                  id="nome"
                  value={dados.restaurante.nome}
                  onChange={(e) => atualizarRestaurante('nome', e.target.value)}
                  placeholder="Nome do restaurante"
                />
              </div>
              
              <div>
                <Label htmlFor="telefone">Telefone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="telefone"
                    value={dados.restaurante.telefone}
                    onChange={(e) => atualizarRestaurante('telefone', e.target.value)}
                    placeholder="+258 84 123 4567"
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={dados.restaurante.email}
                    onChange={(e) => atualizarRestaurante('email', e.target.value)}
                    placeholder="contato@restaurante.com"
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="moeda">Moeda</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Select 
                    value={dados.restaurante.moeda} 
                    onValueChange={(value) => atualizarRestaurante('moeda', value)}
                  >
                    <SelectTrigger className="pl-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MZN">Metical (MT)</SelectItem>
                      <SelectItem value="USD">Dólar Americano ($)</SelectItem>
                      <SelectItem value="BRL">Real Brasileiro (R$)</SelectItem>
                      <SelectItem value="EUR">Euro (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="endereco">Endereço</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Textarea
                  id="endereco"
                  value={dados.restaurante.endereco}
                  onChange={(e) => atualizarRestaurante('endereco', e.target.value)}
                  placeholder="Endereço completo do restaurante"
                  className="pl-10"
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informações Fiscais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Informações Fiscais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nuit">NUIT</Label>
                <Input
                  id="nuit"
                  value={dados.restaurante.nuit || ''}
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
                  value={dados.restaurante.taxaServico}
                  onChange={(e) => atualizarRestaurante('taxaServico', parseFloat(e.target.value) || 0)}
                />
              </div>

              <div>
                <Label htmlFor="inscricaoEstadual">Inscrição Estadual</Label>
                <Input
                  id="inscricaoEstadual"
                  value={dados.restaurante.inscricaoEstadual || ''}
                  onChange={(e) => atualizarRestaurante('inscricaoEstadual', e.target.value)}
                  placeholder="Número da inscrição estadual"
                />
              </div>

              <div>
                <Label htmlFor="inscricaoMunicipal">Inscrição Municipal</Label>
                <Input
                  id="inscricaoMunicipal"
                  value={dados.restaurante.inscricaoMunicipal || ''}
                  onChange={(e) => atualizarRestaurante('inscricaoMunicipal', e.target.value)}
                  placeholder="Número da inscrição municipal"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configurações Regionais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Configurações Regionais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="fusoHorario">Fuso Horário</Label>
              <Select 
                value={dados.restaurante.fusoHorario} 
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
          </CardContent>
        </Card>

        {/* Status e Horários de Funcionamento */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Status do Restaurante</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Status atual:</span>
                  <Badge variant="default">
                    Ativo
                  </Badge>
                </div>
                <Separator />
                <div className="text-sm text-muted-foreground">
                  <p><strong>Criado em:</strong> {new Date(dados.restaurante.criadoEm).toLocaleString('pt-PT')}</p>
                  <p><strong>Última atualização:</strong> {new Date(dados.restaurante.atualizadoEm).toLocaleString('pt-PT')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Horários de Funcionamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {diasSemana.map((dia, index) => {
                  const horario = dados.horariosFuncionamento.find(h => h.diaSemana === index);
                  return (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="w-20">{dia}</span>
                      {horario && horario.ativo ? (
                        <span className="text-muted-foreground">
                          {horario.abertura} - {horario.fechamento}
                        </span>
                      ) : (
                        <Badge variant="secondary">Fechado</Badge>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  Para alterar os horários, acesse a página de Configurações.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </LayoutPrincipal>
  );
}