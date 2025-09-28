import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withErrorHandling, createErrorResponse } from '@/lib/api-routes'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  return withErrorHandling(async () => {
    const { id } = await params
    
    const ordemCompra = await prisma.ordemCompra.findUnique({
      where: { id },
      include: {
        fornecedor: true,
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
          }
        },
        restaurante: {
          select: {
            id: true,
            nome: true,
          }
        },
        itens: {
          include: {
            produto: {
              select: {
                id: true,
                nome: true,
                sku: true,
              }
            },
            unidadeMedida: {
              select: {
                id: true,
                nome: true,
                sigla: true,
              }
            }
          }
        }
      }
    })
    
    if (!ordemCompra) {
      return createErrorResponse('Ordem de compra não encontrada', 404)
    }
    
    return ordemCompra
  })
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  return withErrorHandling(async () => {
    const { id } = await params
    const body = await request.json()
    
    const ordemCompra = await prisma.ordemCompra.update({
      where: { id },
      data: {
        subtotal: body.subtotal,
        impostos: body.impostos,
        total: body.total,
        status: body.status,
        dataEntregaPrevista: body.dataEntregaPrevista ? new Date(body.dataEntregaPrevista) : null,
        observacoes: body.observacoes,
      },
      include: {
        fornecedor: {
          select: {
            id: true,
            nome: true,
            contato: true,
          }
        },
        usuario: {
          select: {
            id: true,
            nome: true,
          }
        },
        itens: {
          include: {
            produto: {
              select: {
                id: true,
                nome: true,
                sku: true,
              }
            },
            unidadeMedida: {
              select: {
                id: true,
                nome: true,
                sigla: true,
              }
            }
          }
        }
      }
    })
    
    return ordemCompra
  })
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return withErrorHandling(async () => {
    const { id } = await params
    
    // Check if ordem can be deleted (only if status is 'rascunho' or 'cancelada')
    const ordemCompra = await prisma.ordemCompra.findUnique({
      where: { id },
      select: {
        status: true,
      }
    })
    
    if (!ordemCompra) {
      return createErrorResponse('Ordem de compra não encontrada', 404)
    }
    
    if (ordemCompra.status !== 'rascunho' && ordemCompra.status !== 'cancelada') {
      return createErrorResponse(
        'Só é possível excluir ordens em status "rascunho" ou "cancelada"',
        400
      )
    }
    
    await prisma.ordemCompra.delete({
      where: { id }
    })
    
    return { message: 'Ordem de compra excluída com sucesso' }
  })
}