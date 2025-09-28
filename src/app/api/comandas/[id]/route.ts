import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withErrorHandling, createErrorResponse } from '@/lib/api-routes'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  return withErrorHandling(async () => {
    const { id } = await params
    
    const comanda = await prisma.comanda.findUnique({
      where: { id },
      include: {
        mesa: true,
        garcom: {
          select: {
            id: true,
            nome: true,
            email: true,
          }
        },
        itens: {
          include: {
            produto: true,
            variacoes: true,
          }
        },
        pagamentos: true,
        entregas: true,
      }
    })
    
    if (!comanda) {
      return createErrorResponse('Comanda não encontrada', 404)
    }
    
    return comanda
  })
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  return withErrorHandling(async () => {
    const { id } = await params
    const body = await request.json()
    
    const comanda = await prisma.comanda.update({
      where: { id },
      data: {
        clienteNome: body.clienteNome,
        clienteTelefone: body.clienteTelefone,
        status: body.status,
        canal: body.canal,
        observacoes: body.observacoes,
        mesaId: body.mesaId,
        subtotal: body.subtotal,
        taxaServico: body.taxaServico,
        impostos: body.impostos,
        desconto: body.desconto,
        total: body.total,
        finalizadaEm: body.status === 'paga' ? new Date() : body.finalizadaEm,
      },
      include: {
        mesa: true,
        garcom: {
          select: {
            id: true,
            nome: true,
          }
        },
        itens: {
          include: {
            produto: true,
            variacoes: true,
          }
        },
        pagamentos: true,
      }
    })
    
    return comanda
  })
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return withErrorHandling(async () => {
    const { id } = await params
    
    // Check if comanda can be deleted (only if status is 'aberta' or 'cancelada')
    const comanda = await prisma.comanda.findUnique({
      where: { id },
      select: {
        status: true,
        _count: {
          select: {
            pagamentos: true,
          }
        }
      }
    })
    
    if (!comanda) {
      return createErrorResponse('Comanda não encontrada', 404)
    }
    
    if (comanda.status !== 'aberta' && comanda.status !== 'cancelada') {
      return createErrorResponse(
        'Só é possível excluir comandas em status "aberta" ou "cancelada"',
        400
      )
    }
    
    if (comanda._count.pagamentos > 0) {
      return createErrorResponse(
        'Não é possível excluir comanda que possui pagamentos',
        400
      )
    }
    
    await prisma.comanda.delete({
      where: { id }
    })
    
    return { message: 'Comanda excluída com sucesso' }
  })
}