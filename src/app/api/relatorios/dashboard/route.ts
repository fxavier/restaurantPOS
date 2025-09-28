import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restauranteId = searchParams.get('restauranteId');

    if (!restauranteId) {
      return NextResponse.json(
        { success: false, error: 'ID do restaurante é obrigatório' },
        { status: 400 }
      );
    }

    const hoje = new Date();
    const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    const fimHoje = new Date(inicioHoje.getTime() + 24 * 60 * 60 * 1000);

    // Dados de vendas de hoje por hora
    const vendasHoje = await prisma.comanda.findMany({
      where: {
        restauranteId,
        criadaEm: {
          gte: inicioHoje,
          lt: fimHoje
        },
        status: { in: ['paga', 'entregue'] }
      },
      select: {
        total: true,
        criadaEm: true
      }
    });

    // Agrupar vendas por hora
    const dadosVendasHoje = Array.from({ length: 14 }, (_, i) => {
      const hora = i + 8; // 8h às 21h
      const horaStr = `${hora.toString().padStart(2, '0')}:00`;
      const inicioHora = new Date(inicioHoje.getTime() + hora * 60 * 60 * 1000);
      const fimHora = new Date(inicioHora.getTime() + 60 * 60 * 1000);
      
      const vendasHora = vendasHoje.filter(venda => 
        venda.criadaEm >= inicioHora && venda.criadaEm < fimHora
      );
      
      const vendas = vendasHora.reduce((sum, venda) => sum + venda.total, 0);
      
      return { hora: horaStr, vendas: Math.round(vendas) };
    });

    // Vendas por canal
    const vendasPorCanal = await prisma.comanda.groupBy({
      by: ['canal'],
      where: {
        restauranteId,
        criadaEm: {
          gte: inicioHoje,
          lt: fimHoje
        },
        status: { in: ['paga', 'entregue'] }
      },
      _sum: {
        total: true
      },
      _count: {
        id: true
      }
    });

    const dadosVendasPorCanal = vendasPorCanal.map(canal => ({
      canal: canal.canal,
      vendas: Math.round(canal._sum.total || 0),
      pedidos: canal._count.id
    }));

    // Vendas da última semana
    const inicioSemana = new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000);
    const vendasSemana = await prisma.comanda.findMany({
      where: {
        restauranteId,
        criadaEm: {
          gte: inicioSemana,
          lt: fimHoje
        },
        status: { in: ['paga', 'entregue'] }
      },
      select: {
        total: true,
        criadaEm: true
      }
    });

    // Agrupar vendas por dia da semana
    const dadosVendasSemana = Array.from({ length: 7 }, (_, i) => {
      const data = new Date(inicioSemana.getTime() + i * 24 * 60 * 60 * 1000);
      const inicioDia = new Date(data.getFullYear(), data.getMonth(), data.getDate());
      const fimDia = new Date(inicioDia.getTime() + 24 * 60 * 60 * 1000);
      
      const vendasDia = vendasSemana.filter(venda => 
        venda.criadaEm >= inicioDia && venda.criadaEm < fimDia
      );
      
      const vendas = vendasDia.reduce((sum, venda) => sum + venda.total, 0);
      
      const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      
      return { 
        dia: dias[data.getDay()], 
        vendas: Math.round(vendas),
        data: data.toISOString().split('T')[0]
      };
    });

    // Estatísticas gerais
    const totalVendasHoje = vendasHoje.reduce((sum, venda) => sum + venda.total, 0);
    const totalPedidosHoje = vendasHoje.length;
    
    // Pedidos pendentes
    const pedidosPendentes = await prisma.comanda.count({
      where: {
        restauranteId,
        status: { in: ['aberta', 'enviada', 'preparando'] }
      }
    });

    // Comparação com ontem
    const ontem = new Date(inicioHoje.getTime() - 24 * 60 * 60 * 1000);
    const vendasOntem = await prisma.comanda.findMany({
      where: {
        restauranteId,
        criadaEm: {
          gte: ontem,
          lt: inicioHoje
        },
        status: { in: ['paga', 'entregue'] }
      },
      select: {
        total: true
      }
    });

    const totalVendasOntem = vendasOntem.reduce((sum, venda) => sum + venda.total, 0);
    const crescimentoVendas = totalVendasOntem > 0 
      ? ((totalVendasHoje - totalVendasOntem) / totalVendasOntem * 100).toFixed(1)
      : '0';

    const crescimentoPedidos = vendasOntem.length > 0
      ? ((totalPedidosHoje - vendasOntem.length) / vendasOntem.length * 100).toFixed(1)
      : '0';

    return NextResponse.json({
      success: true,
      data: {
        dadosVendasHoje,
        dadosVendasPorCanal,
        dadosVendasSemana,
        resumo: {
          vendas: {
            hoje: Math.round(totalVendasHoje),
            crescimento: parseFloat(crescimentoVendas)
          },
          pedidos: {
            hoje: totalPedidosHoje,
            crescimento: parseFloat(crescimentoPedidos)
          },
          pendentes: pedidosPendentes
        }
      }
    });

  } catch (error) {
    console.error('Erro ao buscar dados do dashboard:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}