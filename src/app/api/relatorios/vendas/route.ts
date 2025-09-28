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
    
    // Get sales data
    const comandas = await prisma.comanda.findMany({
      where: {
        restauranteId,
        finalizadaEm: {
          gte: inicio,
          lte: fim,
        },
        status: 'paga'
      },
      include: {
        itens: {
          include: {
            produto: {
              select: {
                id: true,
                nome: true,
              }
            }
          }
        },
        pagamentos: {
          where: {
            status: 'aprovado'
          }
        }
      }
    })
    
    // Calculate totals
    const totalVendas = comandas.reduce((sum, comanda) => sum + comanda.total, 0)
    const quantidadePedidos = comandas.length
    const ticketMedio = quantidadePedidos > 0 ? totalVendas / quantidadePedidos : 0
    
    // Sales by channel
    const vendasPorCanal = comandas.reduce((acc, comanda) => {
      const existing = acc.find(item => item.canal === comanda.canal)
      if (existing) {
        existing.total += comanda.total
        existing.quantidade += 1
      } else {
        acc.push({
          canal: comanda.canal,
          total: comanda.total,
          quantidade: 1,
          percentual: 0
        })
      }
      return acc
    }, [] as Array<{ canal: string; total: number; quantidade: number; percentual: number }>)
    
    // Calculate percentages
    vendasPorCanal.forEach(item => {
      item.percentual = totalVendas > 0 ? (item.total / totalVendas) * 100 : 0
    })
    
    // Most sold products
    const produtoCount = comandas.reduce((acc, comanda) => {
      comanda.itens.forEach(item => {
        const key = item.produtoId
        if (!acc[key]) {
          acc[key] = {
            produtoId: item.produtoId,
            produtoNome: item.produto.nome,
            quantidade: 0,
            total: 0
          }
        }
        acc[key].quantidade += item.quantidade
        acc[key].total += item.precoTotal
      })
      return acc
    }, {} as Record<string, { produtoId: string; produtoNome: string; quantidade: number; total: number }>)
    
    const produtosMaisVendidos = Object.values(produtoCount)
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 10)
    
    // Sales by hour
    const vendasPorHora = Array.from({ length: 24 }, (_, hora) => {
      const comandasHora = comandas.filter(comanda => 
        comanda.finalizadaEm && new Date(comanda.finalizadaEm).getHours() === hora
      )
      return {
        hora,
        total: comandasHora.reduce((sum, comanda) => sum + comanda.total, 0),
        quantidade: comandasHora.length
      }
    })
    
    // Sales by day
    const vendasPorDia: Array<{ data: string; total: number; quantidade: number }> = []
    const currentDate = new Date(inicio)
    
    while (currentDate <= fim) {
      const dateStr = currentDate.toISOString().split('T')[0]
      const comandasDia = comandas.filter(comanda => {
        if (!comanda.finalizadaEm) return false
        const comandaDate = new Date(comanda.finalizadaEm).toISOString().split('T')[0]
        return comandaDate === dateStr
      })
      
      vendasPorDia.push({
        data: dateStr,
        total: comandasDia.reduce((sum, comanda) => sum + comanda.total, 0),
        quantidade: comandasDia.length
      })
      
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    return {
      periodo: {
        inicio: dataInicio,
        fim: dataFim,
      },
      totalVendas,
      quantidadePedidos,
      ticketMedio,
      vendasPorCanal,
      produtosMaisVendidos,
      vendasPorHora,
      vendasPorDia,
    }
  })
}