
'use client';

import { useEffect, useState } from 'react';
import LayoutPrincipal from '@/components/layout/layout-principal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingCart,
  DollarSign,
  Package,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { api } from '@/lib/api-client';
import { Comanda, Produto, Mesa } from '@/types/sistema-restaurante';

interface DashboardData {
  dadosVendasHoje: { hora: string; vendas: number }[];
  dadosVendasPorCanal: { canal: string; vendas: number; pedidos: number }[];
  dadosVendasSemana: { dia: string; vendas: number; data: string }[];
  resumo: {
    vendas: { hoje: number; crescimento: number };
    pedidos: { hoje: number; crescimento: number };
    pendentes: number;
  };
}

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // TODO: Replace with actual restaurant ID from session/context
  const restauranteId = 'cmg3w1utw005j2gzkrott9zul';

  useEffect(() => {
    const carregarDados = async () => {
      try {
        setLoading(true);
        setError(null);

        // Carregar dados do dashboard
        const dashboardResponse = await api.get(`/relatorios/dashboard?restauranteId=${restauranteId}`);
        if (dashboardResponse.success) {
          setDashboardData(dashboardResponse.data);
        }

        // Carregar dados das mesas
        const mesasResponse = await api.get(`/mesas?restauranteId=${restauranteId}`);
        if (mesasResponse.success) {
          setMesas(mesasResponse.data);
        }
      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
        setError('Erro ao carregar dados do dashboard');
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, [restauranteId]);

  // Calcular métricas das mesas
  const mesasOcupadas = mesas.filter(m => m.status === 'ocupada').length;
  const percentualOcupacao = mesas.length > 0 ? (mesasOcupadas / mesas.length) * 100 : 0;

  // Dados com fallback para quando não há dados
  const dadosVendasHoje = dashboardData?.dadosVendasHoje || [];
  const dadosVendasPorCanal = dashboardData?.dadosVendasPorCanal?.map(canal => ({
    nome: canal.canal === 'balcao' ? 'Balcão' : canal.canal === 'takeaway' ? 'Takeaway' : 'Delivery',
    valor: canal.vendas,
    cor: canal.canal === 'balcao' ? '#3b82f6' : canal.canal === 'takeaway' ? '#10b981' : '#f59e0b'
  })) || [];
  const dadosVendasSemana = dashboardData?.dadosVendasSemana || [];
  const resumo = dashboardData?.resumo || {
    vendas: { hoje: 0, crescimento: 0 },
    pedidos: { hoje: 0, crescimento: 0 },
    pendentes: 0
  };

  if (loading) {
    return (
      <LayoutPrincipal titulo="Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Carregando dados...</p>
          </div>
        </div>
      </LayoutPrincipal>
    );
  }

  if (error) {
    return (
      <LayoutPrincipal titulo="Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-600">{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline" 
              className="mt-2"
            >
              Tentar novamente
            </Button>
          </div>
        </div>
      </LayoutPrincipal>
    );
  }

  return (
    <LayoutPrincipal titulo="Dashboard">
      <div className="space-y-6">
        {/* Cards de métricas principais */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vendas Hoje</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">MT {resumo.vendas.hoje.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                <span className={`inline-flex items-center ${
                  resumo.vendas.crescimento >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {resumo.vendas.crescimento >= 0 ? (
                    <TrendingUp className="mr-1 h-3 w-3" />
                  ) : (
                    <TrendingDown className="mr-1 h-3 w-3" />
                  )}
                  {resumo.vendas.crescimento >= 0 ? '+' : ''}{resumo.vendas.crescimento.toFixed(1)}%
                </span>{' '}
                em relação a ontem
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pedidos Hoje</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{resumo.pedidos.hoje}</div>
              <p className="text-xs text-muted-foreground">
                <span className={`inline-flex items-center ${
                  resumo.pedidos.crescimento >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {resumo.pedidos.crescimento >= 0 ? (
                    <TrendingUp className="mr-1 h-3 w-3" />
                  ) : (
                    <TrendingDown className="mr-1 h-3 w-3" />
                  )}
                  {resumo.pedidos.crescimento >= 0 ? '+' : ''}{resumo.pedidos.crescimento.toFixed(1)}%
                </span>{' '}
                em relação a ontem
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                MT {resumo.pedidos.hoje > 0 ? (resumo.vendas.hoje / resumo.pedidos.hoje).toFixed(2) : '0.00'}
              </div>
              <p className="text-xs text-muted-foreground">
                Ticket médio por pedido
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ocupação de Mesas</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mesasOcupadas}/{mesas.length}</div>
              <Progress value={percentualOcupacao} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {percentualOcupacao.toFixed(1)}% de ocupação
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos e informações */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          {/* Gráfico de vendas por hora */}
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Vendas por Hora - Hoje</CardTitle>
              <CardDescription>
                Distribuição das vendas ao longo do dia
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={dadosVendasHoje}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hora" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`MT ${value}`, 'Vendas']} />
                  <Bar dataKey="vendas" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Vendas por canal */}
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Vendas por Canal</CardTitle>
              <CardDescription>Distribuição das vendas hoje</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={dadosVendasPorCanal}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="valor"
                  >
                    {dadosVendasPorCanal.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.cor} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`MT ${value}`, 'Vendas']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {dadosVendasPorCanal.map((canal) => (
                  <div key={canal.nome} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: canal.cor }}
                      />
                      <span className="text-sm">{canal.nome}</span>
                    </div>
                    <span className="text-sm font-medium">MT {canal.valor}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Vendas da semana e alertas */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          {/* Vendas da semana */}
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Vendas da Semana</CardTitle>
              <CardDescription>
                Evolução das vendas nos últimos 7 dias
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dadosVendasSemana}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dia" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`MT ${value}`, 'Vendas']} />
                  <Line
                    type="monotone"
                    dataKey="vendas"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Alertas e notificações */}
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Alertas do Sistema</CardTitle>
              <CardDescription>Notificações importantes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Stock Baixo</p>
                  <p className="text-xs text-muted-foreground">
                    Verificar produtos com estoque baixo
                  </p>
                  <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                    Ver detalhes
                  </Button>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Clock className="h-5 w-5 text-blue-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Pedidos Pendentes</p>
                  <p className="text-xs text-muted-foreground">
                    {resumo.pendentes} pedidos aguardando preparo
                  </p>
                  <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                    Ver KDS
                  </Button>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Sistema Online</p>
                  <p className="text-xs text-muted-foreground">
                    Todos os sistemas funcionando normalmente
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Turno Aberto</p>
                  <p className="text-xs text-muted-foreground">
                    Turno iniciado às 08:00 - Lembrar de fechar
                  </p>
                  <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                    Fechar turno
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status das mesas */}
        <Card>
          <CardHeader>
            <CardTitle>Status das Mesas</CardTitle>
            <CardDescription>Situação atual das mesas do restaurante</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-10 gap-3">
              {mesas.slice(0, 20).map((mesa) => (
                <div
                  key={mesa.id}
                  className={`
                    relative p-3 rounded-lg border-2 text-center transition-colors
                    ${mesa.status === 'livre' ? 'border-green-200 bg-green-50 text-green-800' : ''}
                    ${mesa.status === 'ocupada' ? 'border-red-200 bg-red-50 text-red-800' : ''}
                    ${mesa.status === 'reservada' ? 'border-yellow-200 bg-yellow-50 text-yellow-800' : ''}
                    ${mesa.status === 'manutencao' ? 'border-gray-200 bg-gray-50 text-gray-800' : ''}
                  `}
                >
                  <div className="text-sm font-medium">Mesa {mesa.numero}</div>
                  <div className="text-xs">{mesa.capacidade} pessoas</div>
                  <Badge
                    variant="secondary"
                    className={`
                      mt-1 text-xs
                      ${mesa.status === 'livre' ? 'bg-green-100 text-green-800' : ''}
                      ${mesa.status === 'ocupada' ? 'bg-red-100 text-red-800' : ''}
                      ${mesa.status === 'reservada' ? 'bg-yellow-100 text-yellow-800' : ''}
                      ${mesa.status === 'manutencao' ? 'bg-gray-100 text-gray-800' : ''}
                    `}
                  >
                    {mesa.status === 'livre' && 'Livre'}
                    {mesa.status === 'ocupada' && 'Ocupada'}
                    {mesa.status === 'reservada' && 'Reservada'}
                    {mesa.status === 'manutencao' && 'Manutenção'}
                  </Badge>
                </div>
              ))}
            </div>
            {mesas.length > 20 && (
              <div className="mt-4 text-center">
                <Button variant="outline">
                  Ver todas as {mesas.length} mesas
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </LayoutPrincipal>
  );
}
