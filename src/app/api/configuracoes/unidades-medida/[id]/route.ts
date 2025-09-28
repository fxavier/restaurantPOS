import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withErrorHandling, createErrorResponse } from '@/lib/api-routes'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  return withErrorHandling(async () => {
    const { id } = await params
    
    const unidadeMedida = await prisma.unidadeMedida.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            produtos: true,
            ingredientes: true,
            movimentacoes: true,
            itensOrdemCompra: true,
          }
        }
      }
    })
    
    if (!unidadeMedida) {
      return createErrorResponse('Unidade de medida não encontrada', 404)
    }
    
    return unidadeMedida
  })
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  return withErrorHandling(async () => {
    const { id } = await params
    const body = await request.json()
    
    // Check if sigla is unique (excluding current record)
    if (body.sigla) {
      const existingUnidade = await prisma.unidadeMedida.findFirst({
        where: {
          sigla: body.sigla,
          NOT: { id }
        }
      })
      
      if (existingUnidade) {
        return createErrorResponse('Sigla já está em uso', 400)
      }
    }
    
    const unidadeMedida = await prisma.unidadeMedida.update({
      where: { id },
      data: {
        nome: body.nome,
        sigla: body.sigla,
        tipo: body.tipo,
        fatorConversao: body.fatorConversao,
      }
    })
    
    return unidadeMedida
  })
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return withErrorHandling(async () => {
    const { id } = await params
    
    // Check if unit is being used
    const unidadeMedida = await prisma.unidadeMedida.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            produtos: true,
            ingredientes: true,
            movimentacoes: true,
            itensOrdemCompra: true,
          }
        }
      }
    })
    
    if (!unidadeMedida) {
      return createErrorResponse('Unidade de medida não encontrada', 404)
    }
    
    const totalUso = unidadeMedida._count.produtos + 
                    unidadeMedida._count.ingredientes + 
                    unidadeMedida._count.movimentacoes + 
                    unidadeMedida._count.itensOrdemCompra
    
    if (totalUso > 0) {
      return createErrorResponse(
        'Não é possível excluir unidade de medida que está sendo utilizada',
        400
      )
    }
    
    await prisma.unidadeMedida.delete({
      where: { id }
    })
    
    return { message: 'Unidade de medida excluída com sucesso' }
  })
}