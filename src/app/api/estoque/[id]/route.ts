import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withErrorHandling, createErrorResponse } from '@/lib/api-routes'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  return withErrorHandling(async () => {
    const { id } = await params
    
    const movimentacao = await prisma.movimentacaoEstoque.findUnique({
      where: { id },
      include: {
        produto: {
          include: {
            categoria: true,
            unidadeMedida: true,
          }
        },
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
          }
        },
        unidadeMedida: true,
      }
    })
    
    if (!movimentacao) {
      return createErrorResponse('Movimentação de estoque não encontrada', 404)
    }
    
    return movimentacao
  })
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  return withErrorHandling(async () => {
    const { id } = await params
    const body = await request.json()
    
    // Only allow updating certain fields
    const allowedFields = ['quantidade', 'valorUnitario', 'valorTotal', 'motivo', 'documentoReferencia']
    const updateData: any = {}
    
    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    })
    
    // Recalculate total if unitario or quantidade changed
    if (updateData.valorUnitario && updateData.quantidade) {
      updateData.valorTotal = updateData.valorUnitario * updateData.quantidade
    }
    
    const movimentacao = await prisma.movimentacaoEstoque.update({
      where: { id },
      data: updateData,
      include: {
        produto: {
          select: {
            id: true,
            nome: true,
            sku: true,
          }
        },
        usuario: {
          select: {
            id: true,
            nome: true,
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
    })
    
    return movimentacao
  })
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return withErrorHandling(async () => {
    const { id } = await params
    
    const movimentacao = await prisma.movimentacaoEstoque.findUnique({
      where: { id }
    })
    
    if (!movimentacao) {
      return createErrorResponse('Movimentação de estoque não encontrada', 404)
    }
    
    await prisma.movimentacaoEstoque.delete({
      where: { id }
    })
    
    return { message: 'Movimentação de estoque excluída com sucesso' }
  })
}