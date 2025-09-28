import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withErrorHandling, createErrorResponse } from '@/lib/api-routes'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  return withErrorHandling(async () => {
    const { id } = await params
    
    const fornecedor = await prisma.fornecedor.findUnique({
      where: { id },
      include: {
        restaurante: {
          select: {
            id: true,
            nome: true,
          }
        },
        ordensCompra: {
          orderBy: { criadaEm: 'desc' },
          include: {
            usuario: {
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
            ordensCompra: true,
          }
        }
      }
    })
    
    if (!fornecedor) {
      return createErrorResponse('Fornecedor não encontrado', 404)
    }
    
    return fornecedor
  })
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  return withErrorHandling(async () => {
    const { id } = await params
    const body = await request.json()
    
    // Check if NUIT is unique if provided (excluding current fornecedor)
    if (body.nuit) {
      const fornecedor = await prisma.fornecedor.findUnique({
        where: { id },
        select: { restauranteId: true }
      })
      
      if (!fornecedor) {
        return createErrorResponse('Fornecedor não encontrado', 404)
      }
      
      const existingFornecedor = await prisma.fornecedor.findFirst({
        where: {
          nuit: body.nuit,
          restauranteId: fornecedor.restauranteId,
          NOT: { id }
        }
      })
      
      if (existingFornecedor) {
        return createErrorResponse('NUIT já cadastrado para este restaurante', 400)
      }
    }
    
    const fornecedor = await prisma.fornecedor.update({
      where: { id },
      data: {
        nome: body.nome,
        nuit: body.nuit,
        contato: body.contato,
        telefone: body.telefone,
        email: body.email,
        endereco: body.endereco,
        ativo: body.ativo,
      }
    })
    
    return fornecedor
  })
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return withErrorHandling(async () => {
    const { id } = await params
    
    // Check if fornecedor has any orders
    const fornecedor = await prisma.fornecedor.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            ordensCompra: true,
          }
        }
      }
    })
    
    if (!fornecedor) {
      return createErrorResponse('Fornecedor não encontrado', 404)
    }
    
    if (fornecedor._count.ordensCompra > 0) {
      return createErrorResponse(
        'Não é possível excluir fornecedor que possui ordens de compra',
        400
      )
    }
    
    await prisma.fornecedor.delete({
      where: { id }
    })
    
    return { message: 'Fornecedor excluído com sucesso' }
  })
}