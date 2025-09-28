import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withErrorHandling, createErrorResponse } from '@/lib/api-routes'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  return withErrorHandling(async () => {
    const { id } = await params
    
    const mesa = await prisma.mesa.findUnique({
      where: { id },
      include: {
        restaurante: {
          select: {
            id: true,
            nome: true,
          }
        },
        comandas: {
          orderBy: { criadaEm: 'desc' },
          take: 10,
          include: {
            garcom: {
              select: {
                id: true,
                nome: true,
              }
            },
            _count: {
              select: {
                itens: true,
              }
            }
          }
        },
        _count: {
          select: {
            comandas: true,
          }
        }
      }
    })
    
    if (!mesa) {
      return createErrorResponse('Mesa não encontrada', 404)
    }
    
    return mesa
  })
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  return withErrorHandling(async () => {
    const { id } = await params
    const body = await request.json()
    
    // Check if numero is unique within restaurant (excluding current mesa)
    if (body.numero) {
      const mesa = await prisma.mesa.findUnique({
        where: { id },
        select: { restauranteId: true }
      })
      
      if (!mesa) {
        return createErrorResponse('Mesa não encontrada', 404)
      }
      
      const existingMesa = await prisma.mesa.findFirst({
        where: {
          numero: body.numero,
          restauranteId: mesa.restauranteId,
          NOT: { id }
        }
      })
      
      if (existingMesa) {
        return createErrorResponse('Número da mesa já existe neste restaurante', 400)
      }
    }
    
    const mesa = await prisma.mesa.update({
      where: { id },
      data: {
        numero: body.numero,
        capacidade: body.capacidade,
        area: body.area,
        qrCode: body.qrCode,
        status: body.status,
      }
    })
    
    return mesa
  })
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return withErrorHandling(async () => {
    const { id } = await params
    
    // Check if mesa has any active comandas
    const mesa = await prisma.mesa.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            comandas: true,
          }
        },
        comandas: {
          where: {
            status: {
              in: ['aberta', 'enviada', 'preparando', 'pronta']
            }
          }
        }
      }
    })
    
    if (!mesa) {
      return createErrorResponse('Mesa não encontrada', 404)
    }
    
    if (mesa.comandas.length > 0) {
      return createErrorResponse(
        'Não é possível excluir mesa que possui comandas ativas',
        400
      )
    }
    
    await prisma.mesa.delete({
      where: { id }
    })
    
    return { message: 'Mesa excluída com sucesso' }
  })
}