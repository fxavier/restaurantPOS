import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withErrorHandling, createErrorResponse, getQueryParams, validateRequiredFields } from '@/lib/api-routes'

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    const { searchParams } = new URL(request.url)
    const { limit, offset, orderBy } = await getQueryParams(request)
    const comandaId = searchParams.get('comandaId')
    const status = searchParams.get('status')
    const metodoPagamento = searchParams.get('metodoPagamento')
    const dataInicio = searchParams.get('dataInicio')
    const dataFim = searchParams.get('dataFim')
    
    const where: any = {}
    
    if (comandaId) {
      where.comandaId = comandaId
    }
    
    if (status) {
      where.status = status
    }
    
    if (metodoPagamento) {
      where.metodoPagamento = metodoPagamento
    }
    
    if (dataInicio || dataFim) {
      where.criadoEm = {}
      if (dataInicio) {
        where.criadoEm.gte = new Date(dataInicio)
      }
      if (dataFim) {
        where.criadoEm.lte = new Date(dataFim)
      }
    }
    
    const pagamentos = await prisma.pagamento.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: orderBy || { criadoEm: 'desc' },
      include: {
        comanda: {
          select: {
            id: true,
            numero: true,
            total: true,
            clienteNome: true,
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
    
    return pagamentos
  })
}

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const body = await request.json()
    
    const requiredFields = ['comandaId', 'valor', 'metodoPagamento']
    const missingFields = validateRequiredFields(body, requiredFields)
    
    if (missingFields.length > 0) {
      return createErrorResponse(
        `Campos obrigatórios ausentes: ${missingFields.join(', ')}`,
        400
      )
    }
    
    // Verify comanda exists and get total
    const comanda = await prisma.comanda.findUnique({
      where: { id: body.comandaId },
      select: {
        id: true,
        total: true,
        status: true,
      }
    })
    
    if (!comanda) {
      return createErrorResponse('Comanda não encontrada', 404)
    }
    
    // Check existing payments for this comanda
    const existingPayments = await prisma.pagamento.findMany({
      where: {
        comandaId: body.comandaId,
        status: 'aprovado'
      }
    })
    
    const totalPago = existingPayments.reduce((sum, payment) => sum + payment.valor, 0)
    const novoTotal = totalPago + body.valor
    
    if (novoTotal > comanda.total) {
      return createErrorResponse(
        `Valor total dos pagamentos (${novoTotal}) excede o total da comanda (${comanda.total})`,
        400
      )
    }
    
    const pagamento = await prisma.pagamento.create({
      data: {
        comandaId: body.comandaId,
        valor: body.valor,
        metodoPagamento: body.metodoPagamento,
        status: body.status || 'pendente',
        referencia: body.referencia,
        processadoEm: body.status === 'aprovado' ? new Date() : null,
      },
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
    
    // If payment is approved and covers full amount, update comanda status
    if (body.status === 'aprovado' && novoTotal >= comanda.total) {
      await prisma.comanda.update({
        where: { id: body.comandaId },
        data: { 
          status: 'paga',
          finalizadaEm: new Date()
        }
      })
    }
    
    return pagamento
  })
}