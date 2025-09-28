import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withErrorHandling, createErrorResponse } from '@/lib/api-routes'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  return withErrorHandling(async () => {
    const { id } = await params
    
    const turno = await prisma.turnoFechamento.findUnique({
      where: { id },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
            telefone: true,
          }
        },
        restaurante: {
          select: {
            id: true,
            nome: true,
          }
        }
      }
    })
    
    if (!turno) {
      return createErrorResponse('Turno não encontrado', 404)
    }
    
    // Get sales data for this shift if closed
    if (turno.status === 'fechado' && turno.dataAbertura && turno.dataFechamento) {
      const vendas = await prisma.comanda.findMany({
        where: {
          restauranteId: turno.restauranteId,
          finalizadaEm: {
            gte: turno.dataAbertura,
            lte: turno.dataFechamento,
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
      
      const vendasPorMetodo = vendas.reduce((acc, comanda) => {
        comanda.pagamentos.forEach(pagamento => {
          if (!acc[pagamento.metodoPagamento]) {
            acc[pagamento.metodoPagamento] = 0
          }
          acc[pagamento.metodoPagamento] += pagamento.valor
        })
        return acc
      }, {} as Record<string, number>)
      
      return {
        ...turno,
        vendasDetalhadas: {
          totalComandas: vendas.length,
          vendasPorMetodo,
          totalVendas: vendas.reduce((sum, comanda) => sum + comanda.total, 0)
        }
      }
    }
    
    return turno
  })
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  return withErrorHandling(async () => {
    const { id } = await params
    const body = await request.json()
    
    const turno = await prisma.turnoFechamento.findUnique({
      where: { id }
    })
    
    if (!turno) {
      return createErrorResponse('Turno não encontrado', 404)
    }
    
    // If closing the shift, calculate totals
    const updateData: any = {
      valorFechamento: body.valorFechamento,
      totalVendas: body.totalVendas,
      totalDinheiro: body.totalDinheiro,
      totalCartao: body.totalCartao,
      totalOutros: body.totalOutros,
      observacoes: body.observacoes,
    }
    
    if (body.status === 'fechado' && turno.status === 'aberto') {
      updateData.dataFechamento = new Date()
      updateData.status = 'fechado'
      
      // Calculate difference
      if (body.valorFechamento !== undefined && turno.valorAbertura !== undefined) {
        const expectedTotal = turno.valorAbertura + (body.totalVendas || 0)
        updateData.diferencaCaixa = body.valorFechamento - expectedTotal
      }
    }
    
    const turnoAtualizado = await prisma.turnoFechamento.update({
      where: { id },
      data: updateData,
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
          }
        }
      }
    })
    
    return turnoAtualizado
  })
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return withErrorHandling(async () => {
    const { id } = await params
    
    // Check if turno can be deleted (only if open and no sales)
    const turno = await prisma.turnoFechamento.findUnique({
      where: { id },
      select: {
        status: true,
        dataAbertura: true,
        restauranteId: true,
      }
    })
    
    if (!turno) {
      return createErrorResponse('Turno não encontrado', 404)
    }
    
    if (turno.status === 'fechado') {
      return createErrorResponse(
        'Não é possível excluir turno fechado',
        400
      )
    }
    
    // Check for sales during this shift
    const vendasNoTurno = await prisma.comanda.count({
      where: {
        restauranteId: turno.restauranteId,
        criadaEm: {
          gte: turno.dataAbertura,
        },
        status: {
          in: ['paga', 'entregue']
        }
      }
    })
    
    if (vendasNoTurno > 0) {
      return createErrorResponse(
        'Não é possível excluir turno que possui vendas',
        400
      )
    }
    
    await prisma.turnoFechamento.delete({
      where: { id }
    })
    
    return { message: 'Turno excluído com sucesso' }
  })
}