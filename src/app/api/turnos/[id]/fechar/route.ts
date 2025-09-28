import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withErrorHandling, createErrorResponse, validateRequiredFields } from '@/lib/api-routes'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  return withErrorHandling(async () => {
    const { id } = await params
    const body = await request.json()
    
    const requiredFields = ['valorFechamento']
    const missingFields = validateRequiredFields(body, requiredFields)
    
    if (missingFields.length > 0) {
      return createErrorResponse(
        `Campos obrigatórios ausentes: ${missingFields.join(', ')}`,
        400
      )
    }
    
    const turno = await prisma.turnoFechamento.findUnique({
      where: { id }
    })
    
    if (!turno) {
      return createErrorResponse('Turno não encontrado', 404)
    }
    
    if (turno.status === 'fechado') {
      return createErrorResponse('Turno já está fechado', 400)
    }
    
    const dataFechamento = new Date()
    
    // Calculate sales during this shift
    const vendas = await prisma.comanda.findMany({
      where: {
        restauranteId: turno.restauranteId,
        finalizadaEm: {
          gte: turno.dataAbertura,
          lte: dataFechamento,
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
    
    const totalVendas = vendas.reduce((sum, comanda) => sum + comanda.total, 0)
    
    const vendasPorMetodo = vendas.reduce((acc, comanda) => {
      comanda.pagamentos.forEach(pagamento => {
        switch (pagamento.metodoPagamento) {
          case 'dinheiro':
            acc.dinheiro += pagamento.valor
            break
          case 'cartao_debito':
          case 'cartao_credito':
            acc.cartao += pagamento.valor
            break
          default:
            acc.outros += pagamento.valor
            break
        }
      })
      return acc
    }, { dinheiro: 0, cartao: 0, outros: 0 })
    
    // Calculate cash difference
    const valorEsperado = turno.valorAbertura + vendasPorMetodo.dinheiro
    const diferencaCaixa = body.valorFechamento - valorEsperado
    
    const turnoFechado = await prisma.turnoFechamento.update({
      where: { id },
      data: {
        dataFechamento,
        valorFechamento: body.valorFechamento,
        totalVendas,
        totalDinheiro: vendasPorMetodo.dinheiro,
        totalCartao: vendasPorMetodo.cartao,
        totalOutros: vendasPorMetodo.outros,
        diferencaCaixa,
        observacoes: body.observacoes,
        status: 'fechado',
      },
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
    
    return {
      ...turnoFechado,
      resumoVendas: {
        totalComandas: vendas.length,
        valorEsperado,
        vendasPorMetodo,
      }
    }
  })
}