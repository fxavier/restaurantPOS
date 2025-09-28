import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withErrorHandling, createErrorResponse } from '@/lib/api-routes'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  return withErrorHandling(async () => {
    const { id } = await params
    
    const entrega = await prisma.entrega.findUnique({
      where: { id },
      include: {
        comanda: {
          include: {
            mesa: {
              select: {
                numero: true,
                area: true,
              }
            },
            garcom: {
              select: {
                id: true,
                nome: true,
                telefone: true,
              }
            },
            itens: {
              include: {
                produto: {
                  select: {
                    nome: true,
                    tempoPreparoMinutos: true,
                  }
                },
                variacoes: true,
              }
            }
          }
        },
        restaurante: {
          select: {
            id: true,
            nome: true,
            endereco: true,
            telefone: true,
          }
        }
      }
    })
    
    if (!entrega) {
      return createErrorResponse('Entrega não encontrada', 404)
    }
    
    return entrega
  })
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  return withErrorHandling(async () => {
    const { id } = await params
    const body = await request.json()
    
    const entrega = await prisma.entrega.update({
      where: { id },
      data: {
        clienteNome: body.clienteNome,
        clienteTelefone: body.clienteTelefone,
        entregadorNome: body.entregadorNome,
        entregadorTelefone: body.entregadorTelefone,
        enderecoEntrega: body.enderecoEntrega,
        observacoes: body.observacoes,
        taxaEntrega: body.taxaEntrega,
        valorTotal: body.valorTotal,
        tempoEstimado: body.tempoEstimado,
        status: body.status,
        dataEntrega: body.dataEntrega ? new Date(body.dataEntrega) : null,
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
    
    // Update comanda status based on entrega status
    if (body.status === 'entregue') {
      await prisma.comanda.update({
        where: { id: entrega.comandaId },
        data: { status: 'entregue' }
      })
    }
    
    return entrega
  })
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return withErrorHandling(async () => {
    const { id } = await params
    
    // Check if entrega can be deleted (only if not delivered)
    const entrega = await prisma.entrega.findUnique({
      where: { id },
      select: {
        status: true,
      }
    })
    
    if (!entrega) {
      return createErrorResponse('Entrega não encontrada', 404)
    }
    
    if (entrega.status === 'entregue') {
      return createErrorResponse(
        'Não é possível excluir entrega que já foi entregue',
        400
      )
    }
    
    await prisma.entrega.delete({
      where: { id }
    })
    
    return { message: 'Entrega excluída com sucesso' }
  })
}