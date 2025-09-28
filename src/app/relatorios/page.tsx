
'use client';

import { useState, useEffect } from 'react';
import LayoutPrincipal from '@/components/layout/layout-principal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
  Line,
  Area,
  AreaChart
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Calendar,
  Download,
  Filter,
  BarChart3,
  PieChart as PieChartIcon,
  FileText
} from 'lucide-react';
import { ArmazenamentoLocal } from '@/lib/armazenamento-local';
import { Comanda, Produto, Categoria } from '@/types/sistema-restaurante';

interface RelatorioVendas {
  periodo: string;
  vendas: number;
  pedidos: number;
  ticketMedio: number;
}

interface ProdutoVendido {
  nome: string;
  quantidade: number;
  total: number;
}

interface VendasPorCanal {
  canal: string;
  total: number;
  percentual: number;
  cor: string;
}

export default function PaginaRelatorios() {
  const [comandas, setComandas] = useState<Comanda[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [periodoInicio, setPeriodoInicio] = useState('');
  const [periodoFim, setPeriodoFim] = useState('');
  const [filtroRapido, setFiltroRapido] = useState('hoje');

  useEffect(() => {
    carregarDados();
    definirPeriodoPadrao();
  }, []);

  useEffect(() => {
    if (filtroRapido !== 'personalizado') {
      definirPeriodoPorFiltro(filtroRapido);
    }
  }, [filtroRapido]);

  const carregarDados = () => {
    setComandas(ArmazenamentoLocal.obterComandas());
    setProdutos(ArmazenamentoLocal.obterProdutos());
    setCategorias(ArmazenamentoLocal.obterCategorias());
  };

  const definirPeriodoPadrao = () => {
    const hoje = new Date();
    setPeriodoFim(hoje.toISOString().split('T')[0]);
    setPeriodoInicio(hoje.toISOString().split('T')[0]);
  };

  const definirPeriodoPorFiltro = (filtro: string) => {
    const hoje = new Date();
    const fim = hoje.toISOString().split('T')[0];
    let inicio = '';

    switch (filtro) {
      case 'hoje':
        inicio = fim;
        break;
      case 'ontem':
        const ontem = new Date(hoje);
        ontem.setDate(hoje.getDate() - 1);
        inicio = ontem.toISOString().split('T')[0];
        setPeriodoFim(inicio);
        break;
      case 'semana':
        const inicioSemana = new Date(hoje);
        inicioSemana.setDate(hoje.getDate() - 7);
        inicio = inicioSemana.toISOString().split('T')[0];
        break;
      case 'mes':
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        inicio = inicioMes.toISOString().split('T')[0];
        break;
      case 'trimestre':
        const inicioTrimestre = new Date(hoje.getFullYear(), Math.floor(hoje.getMonth() / 3) * 3, 1);
        inicio = inicioTrimestre.toISOString().split('T')[0];
        break;
      case 'ano':
        const inicioAno = new Date(hoje.getFullYear(), 0, 1);
        inicio = inicioAno.toISOString().split('T')[0];
        break;
      default:
        return;
    }

    setPeriodoInicio(inicio);
    if (filtro !== 'ontem') {
      setPeriodoFim(fim);
    }
  };

  const filtrarComandasPorPeriodo = () => {
    if (!periodoInicio || !periodoFim) return comandas;

    const inicio = new Date(periodoInicio);
    const fim = new Date(periodoFim);
    fim.setHours(23, 59, 59, 999);

    return comandas.filter(comanda => {
      const dataComanda = new Date(comanda.criadaEm);
      return dataComanda >= inicio && dataComanda <= fim && comanda.status === 'paga';
    });
  };

  const calcularEstatisticasGerais = () => {
    const comandasFiltradas = filtrarComandasPorPeriodo();
    
    const totalVendas = comandasFiltradas.reduce((total, comanda) => total + comanda.total, 0);
    const totalPedidos = comandasFiltradas.length;
    const ticketMedio = totalPedidos > 0 ? totalVendas / totalPedidos : 0;
    const totalItens = comandasFiltradas.reduce((total, comanda) => 
      total + comanda.itens.reduce((subtotal, item) => subtotal + item.quantidade, 0), 0
    );

    // Comparar com período anterior
    const diasPeriodo = Math.ceil((new Date(periodoFim).getTime() - new Date(periodoInicio).getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const inicioAnterior = new Date(new Date(periodoInicio).getTime() - (diasPeriodo * 24 * 60 * 60 * 1000));
    const fimAnterior = new Date(new Date(periodoInicio).getTime() - (24 * 60 * 60 * 1000));

    const comandasAnterior = comandas.filter(comanda => {
      const dataComanda = new Date(comanda.criadaEm);
      return dataComanda >= inicioAnterior && dataComanda <= fimAnterior && comanda.status === 'paga';
    });

    const vendasAnterior = comandasAnterior.reduce((total, comanda) => total + comanda.total, 0);
    const crescimentoVendas = vendasAnterior > 0 ? ((totalVendas - vendasAnterior) / vendasAnterior) * 100 : 0;

    return {
      totalVendas,
      totalPedidos,
      ticketMedio,
      totalItens,
      crescimentoVendas
    };
  };

  const obterVendasPorDia = (): RelatorioVendas[] => {
    const comandasFiltradas = filtrarComandasPorPeriodo();
    const vendasPorDia: Record<string, { vendas: number; pedidos: number }> = {};

    comandasFiltradas.forEach(comanda => {
      const data = new Date(comanda.criadaEm).toISOString().split('T')[0];
      if (!vendasPorDia[data]) {
        vendasPorDia[data] = { vendas: 0, pedidos: 0 };
      }
      vendasPorDia[data].vendas += comanda.total;
      vendasPorDia[data].pedidos += 1;
    });

    return Object.entries(vendasPorDia)
      .map(([data, dados]) => ({
        periodo: new Date(data).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' }),
        vendas: dados.vendas,
        pedidos: dados.pedidos,
        ticketMedio: dados.pedidos > 0 ? dados.vendas / dados.pedidos : 0
      }))
      .sort((a, b) => a.periodo.localeCompare(b.periodo));
  };

  const obterVendasPorHora = () => {
    const comandasFiltradas = filtrarComandasPorPeriodo();
    const vendasPorHora: Record<number, { vendas: number; pedidos: number }> = {};

    for (let i = 0; i < 24; i++) {
      vendasPorHora[i] = { vendas: 0, pedidos: 0 };
    }

    comandasFiltradas.forEach(comanda => {
      const hora = new Date(comanda.criadaEm).getHours();
      vendasPorHora[hora].vendas += comanda.total;
      vendasPorHora[hora].pedidos += 1;
    });

    return Object.entries(vendasPorHora)
      .map(([hora, dados]) => ({
        hora: `${hora.padStart(2, '0')}:00`,
        vendas: dados.vendas,
        pedidos: dados.pedidos
      }))
      .filter(item => item.vendas > 0 || item.pedidos > 0);
  };

  const obterProdutosMaisVendidos = (): ProdutoVendido[] => {
    const comandasFiltradas = filtrarComandasPorPeriodo();
    const produtosVendidos: Record<string, { quantidade: number; total: number }> = {};

    comandasFiltradas.forEach(comanda => {
      comanda.itens.forEach(item => {
        if (!produtosVendidos[item.produtoNome]) {
          produtosVendidos[item.produtoNome] = { quantidade: 0, total: 0 };
        }
        produtosVendidos[item.produtoNome].quantidade += item.quantidade;
        produtosVendidos[item.produtoNome].total += item.precoTotal;
      });
    });

    return Object.entries(produtosVendidos)
      .map(([nome, dados]) => ({
        nome,
        quantidade: dados.quantidade,
        total: dados.total
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  };

  const obterVendasPorCanal = (): VendasPorCanal[] => {
    const comandasFiltradas = filtrarComandasPorPeriodo();
    const vendasPorCanal: Record<string, number> = {};
    const totalGeral = comandasFiltradas.reduce((total, comanda) => total + comanda.total, 0);

    comandasFiltradas.forEach(comanda => {
      if (!vendasPorCanal[comanda.canal]) {
        vendasPorCanal[comanda.canal] = 0;
      }
      vendasPorCanal[comanda.canal] += comanda.total;
    });

    const cores = {
      balcao: '#3b82f6',
      takeaway: '#10b981',
      delivery: '#f59e0b'
    };

    return Object.entries(vendasPorCanal)
      .map(([canal, total]) => ({
        canal: canal.charAt(0).toUpperCase() + canal.slice(1),
        total,
        percentual: totalGeral > 0 ? (total / totalGeral) * 100 : 0,
        cor: cores[canal as keyof typeof cores] || '#6b7280'
      }))
      .sort((a, b) => b.total - a.total);
  };

  const obterVendasPorCategoria = () => {
    const comandasFiltradas = filtrarComandasPorPeriodo();
    const vendasPorCategoria: Record<string, number> = {};

    comandasFiltradas.forEach(comanda => {
      comanda.itens.forEach(item => {
        const produto = produtos.find(p => p.id === item.produtoId);
        if (produto) {
          const categoria = categorias.find(c => c.id === produto.categoriaId);
          const nomeCategoria = categoria?.nome || 'Sem Categoria';
          
          if (!vendasPorCategoria[nomeCategoria]) {
            vendasPorCategoria[nomeCategoria] = 0;
          }
          vendasPorCategoria[nomeCategoria] += item.precoTotal;
        }
      });
    });

    return Object.entries(vendasPorCategoria)
      .map(([categoria, total]) => ({ categoria, total }))
      .sort((a, b) => b.total - a.total);
  };

  const exportarRelatorio = () => {
    const dados = {
      periodo: `${periodoInicio} a ${periodoFim}`,
      estatisticas: calcularEstatisticasGerais(),
      vendasPorDia: obterVendasPorDia(),
      produtosMaisVendidos: obterProdutosMaisVendidos(),
      vendasPorCanal: obterVendasPorCanal(),
      vendasPorCategoria: obterVendasPorCategoria()
    };

    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-vendas-${periodoInicio}-${periodoFim}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const estatisticas = calcularEstatisticasGerais();
  const vendasPorDia = obterVendasPorDia();
  const vendasPorHora = obterVendasPorHora();
  const produtosMaisVendidos = obterProdutosMaisVendidos();
  const vendasPorCanal = obterVendasPorCanal();
  const vendasPorCategoria = obterVendasPorCategoria();

  return (
    <LayoutPrincipal titulo="Relatórios e Dashboard Financeiro">
      <div className="space-y-6">
        {/* Filtros de Período */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <Select value={filtroRapido} onValueChange={setFiltroRapido}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hoje">Hoje</SelectItem>
                    <SelectItem value="ontem">Ontem</SelectItem>
                    <SelectItem value="semana">Última Semana</SelectItem>
                    <SelectItem value="mes">Este Mês</SelectItem>
                    <SelectItem value="trimestre">Este Trimestre</SelectItem>
                    <SelectItem value="ano">Este Ano</SelectItem>
                    <SelectItem value="personalizado">Personalizado</SelectItem>
                  </SelectContent>
                </Select>

                {filtroRapido === 'personalizado' && (
                  <>
                    <Input
                      type="date"
                      value={periodoInicio}
                      onChange={(e) => setPeriodoInicio(e.target.value)}
                      className="w-full sm:w-auto"
                    />
                    <Input
                      type="date"
                      value={periodoFim}
                      onChange={(e) => setPeriodoFim(e.target.value)}
                      className="w-full sm:w-auto"
                    />
                  </>
                )}
              </div>

              <Button onClick={exportarRelatorio}>
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-green-500" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Total de Vendas</p>
                  <p className="text-2xl font-bold">MT {estatisticas.totalVendas.toFixed(2)}</p>
                  <p className={`text-xs flex items-center ${estatisticas.crescimentoVendas >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {estatisticas.crescimentoVendas >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                    {Math.abs(estatisticas.crescimentoVendas).toFixed(1)}% vs período anterior
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <ShoppingCart className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total de Pedidos</p>
                  <p className="text-2xl font-bold">{estatisticas.totalPedidos}</p>
                  <p className="text-xs text-muted-foreground">
                    {estatisticas.totalItens} itens vendidos
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Ticket Médio</p>
                  <p className="text-2xl font-bold">MT {estatisticas.ticketMedio.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">
                    Por pedido
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Período</p>
                  <p className="text-lg font-bold">
                    {new Date(periodoInicio).toLocaleDateString('pt-PT')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    até {new Date(periodoFim).toLocaleDateString('pt-PT')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos e Relatórios */}
        <Tabs defaultValue="vendas" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="vendas">Vendas</TabsTrigger>
            <TabsTrigger value="produtos">Produtos</TabsTrigger>
            <TabsTrigger value="canais">Canais</TabsTrigger>
            <TabsTrigger value="categorias">Categorias</TabsTrigger>
          </TabsList>

          <TabsContent value="vendas" className="space-y-6">
            {/* Vendas por Dia */}
            <Card>
              <CardHeader>
                <CardTitle>Vendas por Dia</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={vendasPorDia}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="periodo" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'vendas' ? `MT ${Number(value).toFixed(2)}` : value,
                        name === 'vendas' ? 'Vendas' : 'Pedidos'
                      ]}
                    />
                    <Area type="monotone" dataKey="vendas" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                    <Area type="monotone" dataKey="pedidos" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Vendas por Hora */}
            <Card>
              <CardHeader>
                <CardTitle>Vendas por Hora do Dia</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={vendasPorHora}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hora" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`MT ${Number(value).toFixed(2)}`, 'Vendas']} />
                    <Bar dataKey="vendas" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="produtos" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Produtos Mais Vendidos</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Participação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {produtosMaisVendidos.map((produto, index) => {
                      const totalGeral = produtosMaisVendidos.reduce((sum, p) => sum + p.total, 0);
                      const participacao = totalGeral > 0 ? (produto.total / totalGeral) * 100 : 0;
                      
                      return (
                        <TableRow key={produto.nome}>
                          <TableCell>
                            <div className="flex items-center">
                              <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs mr-2">
                                {index + 1}
                              </span>
                              {produto.nome}
                            </div>
                          </TableCell>
                          <TableCell>{produto.quantidade}</TableCell>
                          <TableCell className="font-bold">MT {produto.total.toFixed(2)}</TableCell>
                          <TableCell>{participacao.toFixed(1)}%</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="canais" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Vendas por Canal</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={vendasPorCanal}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="total"
                      >
                        {vendasPorCanal.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.cor} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`MT ${Number(value).toFixed(2)}`, 'Vendas']} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Detalhes por Canal</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {vendasPorCanal.map((canal) => (
                      <div key={canal.canal} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center">
                          <div
                            className="w-4 h-4 rounded-full mr-3"
                            style={{ backgroundColor: canal.cor }}
                          />
                          <span className="font-medium">{canal.canal}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">MT {canal.total.toFixed(2)}</p>
                          <p className="text-sm text-muted-foreground">{canal.percentual.toFixed(1)}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="categorias" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Vendas por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={vendasPorCategoria} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="categoria" type="category" width={100} />
                    <Tooltip formatter={(value) => [`MT ${Number(value).toFixed(2)}`, 'Vendas']} />
                    <Bar dataKey="total" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </LayoutPrincipal>
  );
}
