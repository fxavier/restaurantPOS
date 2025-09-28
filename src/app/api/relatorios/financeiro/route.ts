import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withErrorHandling, createErrorResponse } from '@/lib/api-routes'

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    const { searchParams } = new URL(request.url)
    const restauranteId = searchParams.get('restauranteId')
    const dataInicio = searchParams.get('dataInicio')
    const dataFim = searchParams.get('dataFim')
    
    if (!restauranteId) {
      return createErrorResponse('restauranteId é obrigatório', 400)
    }
    
    if (!dataInicio || !dataFim) {
      return createErrorResponse('dataInicio e dataFim são obrigatórios', 400)
    }
    
    const inicio = new Date(dataInicio)
    const fim = new Date(dataFim)
    
    // Sales (Revenue)
    const vendas = await prisma.comanda.findMany({
      where: {
        restauranteId,
        finalizadaEm: {
          gte: inicio,
          lte: fim,
        },
        status: 'paga'
      },
      include: {
        pagamentos: {
          where: {
            status: 'aprovado'
          }
        }
      }
    })
    
    const receita = {
      totalVendas: vendas.reduce((sum, comanda) => sum + comanda.total, 0),
      quantidadeVendas: vendas.length,
      ticketMedio: 0,
      vendasPorMetodo: {} as Record<string, number>,
      taxasServico: vendas.reduce((sum, comanda) => sum + comanda.taxaServico, 0),
      impostos: vendas.reduce((sum, comanda) => sum + comanda.impostos, 0),
    }
    
    receita.ticketMedio = receita.quantidadeVendas > 0 ? receita.totalVendas / receita.quantidadeVendas : 0
    
    // Payment methods breakdown
    vendas.forEach(comanda => {
      comanda.pagamentos.forEach(pagamento => {
        if (!receita.vendasPorMetodo[pagamento.metodoPagamento]) {
          receita.vendasPorMetodo[pagamento.metodoPagamento] = 0
        }
        receita.vendasPorMetodo[pagamento.metodoPagamento] += pagamento.valor
      })
    })
    
    // Purchases (Expenses)
    const compras = await prisma.ordemCompra.findMany({
      where: {
        restauranteId,
        atualizadaEm: {
          gte: inicio,
          lte: fim,
        },
        status: {
          in: ['confirmada', 'recebida']
        }
      },
      include: {
        itens: true,
      }
    })
    
    const despesas = {
      totalCompras: compras.reduce((sum, ordem) => sum + ordem.total, 0),
      quantidadeOrdens: compras.length,
      compraPorFornecedor: {} as Record<string, number>,
    }
    
    // Group purchases by supplier
    compras.forEach(ordem => {
      const fornecedorId = ordem.fornecedorId
      if (!despesas.compraPorFornecedor[fornecedorId]) {
        despesas.compraPorFornecedor[fornecedorId] = 0
      }
      despesas.compraPorFornecedor[fornecedorId] += ordem.total
    })
    
    // Cash flow calculation
    const fluxoCaixa = {
      entradas: receita.totalVendas,
      saidas: despesas.totalCompras,
      saldo: receita.totalVendas - despesas.totalCompras,
      margemLucro: receita.totalVendas > 0 ? 
        ((receita.totalVendas - despesas.totalCompras) / receita.totalVendas) * 100 : 0,
    }
    
    // Daily breakdown
    const fluxoDiario: Array<{
      data: string
      entradas: number
      saidas: number
      saldo: number
    }> = []
    
    const currentDate = new Date(inicio)
    while (currentDate <= fim) {
      const dateStr = currentDate.toISOString().split('T')[0]
      
      const vendasDia = vendas.filter(venda => {
        if (!venda.finalizadaEm) return false
        return new Date(venda.finalizadaEm).toISOString().split('T')[0] === dateStr
      })
      
      const comprasDia = compras.filter(compra => {
        return new Date(compra.atualizadaEm).toISOString().split('T')[0] === dateStr
      })
      
      const entradas = vendasDia.reduce((sum, venda) => sum + venda.total, 0)
      const saidas = comprasDia.reduce((sum, compra) => sum + compra.total, 0)
      
      fluxoDiario.push({
        data: dateStr,
        entradas,
        saidas,
        saldo: entradas - saidas,
      })
      
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    // Get shifts data for cash reconciliation
    const turnos = await prisma.turnoFechamento.findMany({
      where: {
        restauranteId,
        dataFechamento: {
          gte: inicio,
          lte: fim,
        },
        status: 'fechado'
      }
    })
    
    const caixa = {
      totalTurnos: turnos.length,
      totalAbertura: turnos.reduce((sum, turno) => sum + turno.valorAbertura, 0),
      totalFechamento: turnos.reduce((sum, turno) => sum + (turno.valorFechamento || 0), 0),
      totalDiferenca: turnos.reduce((sum, turno) => sum + (turno.diferencaCaixa || 0), 0),
      vendaDinheiro: turnos.reduce((sum, turno) => sum + turno.totalDinheiro, 0),
      vendaCartao: turnos.reduce((sum, turno) => sum + turno.totalCartao, 0),
      vendaOutros: turnos.reduce((sum, turno) => sum + turno.totalOutros, 0),
    }
    
    return {
      periodo: {
        inicio: dataInicio,
        fim: dataFim,
      },
      receita,
      despesas,
      fluxoCaixa,
      fluxoDiario,
      caixa,
      resumo: {
        faturamento: receita.totalVendas,
        custos: despesas.totalCompras,
        lucroLiquido: fluxoCaixa.saldo,
        margemLucro: fluxoCaixa.margemLucro,
      }
    }
  })
}