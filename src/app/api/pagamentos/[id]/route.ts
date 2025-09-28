import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withErrorHandling, createErrorResponse } from '@/lib/api-routes'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  return withErrorHandling(async () => {
    const { id } = await params
    
    const pagamento = await prisma.pagamento.findUnique({
      where: { id },
      include: {
        comanda: {
          include: {
            mesa: {
              select: {
                numero: true,
              }
            },
            garcom: {
              select: {
                nome: true,
              }
            },
            restaurante: {
              select: {
                id: true,
                nome: true,
              }
            }
          }
        }
      }
    })
    
    if (!pagamento) {
      return createErrorResponse('Pagamento não encontrado', 404)
    }
    
    return pagamento
  })
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  return withErrorHandling(async () => {
    const { id } = await params
    const body = await request.json()
    
    // Get current payment
    const currentPayment = await prisma.pagamento.findUnique({
      where: { id },
      include: {
        comanda: {
          select: {
            id: true,
            total: true,
          }
        }
      }
    })
    
    if (!currentPayment) {
      return createErrorResponse('Pagamento não encontrado', 404)
    }
    
    // If changing status to approved, set processedAt
    const updateData: any = {
      valor: body.valor,
      metodoPagamento: body.metodoPagamento,
      status: body.status,
      referencia: body.referencia,
    }
    
    if (body.status === 'aprovado' && currentPayment.status !== 'aprovado') {
      updateData.processadoEm = new Date()
    } else if (body.status !== 'aprovado') {
      updateData.processadoEm = null
    }
    
    const pagamento = await prisma.pagamento.update({
      where: { id },
      data: updateData,
      include: {
        comanda: {
          select: {
            id: true,
            numero: true,
            total: true,
          }
        }
      }
    })
    
    // Check if comanda is fully paid
    const allPayments = await prisma.pagamento.findMany({
      where: {
        comandaId: currentPayment.comandaId,
        status: 'aprovado'
      }
    })
    
    const totalPago = allPayments.reduce((sum, payment) => sum + payment.valor, 0)
    
    if (totalPago >= currentPayment.comanda.total) {
      await prisma.comanda.update({
        where: { id: currentPayment.comandaId },
        data: { 
          status: 'paga',
          finalizadaEm: new Date()
        }
      })
    } else {
      // If payment was rejected/cancelled, might need to update comanda status back
      const comanda = await prisma.comanda.findUnique({
        where: { id: currentPayment.comandaId },
        select: { status: true }
      })
      
      if (comanda?.status === 'paga') {
        await prisma.comanda.update({
          where: { id: currentPayment.comandaId },
          data: { 
            status: 'pronta', // or appropriate status
            finalizadaEm: null
          }
        })
      }
    }
    
    return pagamento
  })
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return withErrorHandling(async () => {
    const { id } = await params
    
    // Check if payment can be deleted (only if not processed)
    const pagamento = await prisma.pagamento.findUnique({
      where: { id },
      select: {
        status: true,
        comandaId: true,
      }
    })
    
    if (!pagamento) {
      return createErrorResponse('Pagamento não encontrado', 404)
    }
    
    if (pagamento.status === 'aprovado') {
      return createErrorResponse(
        'Não é possível excluir pagamento aprovado',
        400
      )
    }
    
    await prisma.pagamento.delete({
      where: { id }
    })
    
    return { message: 'Pagamento excluído com sucesso' }
  })
}