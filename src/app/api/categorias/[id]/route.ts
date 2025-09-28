import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withErrorHandling, createErrorResponse } from '@/lib/api-routes'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  return withErrorHandling(async () => {
    const { id } = await params
    
    const categoria = await prisma.categoria.findUnique({
      where: { id },
      include: {
        restaurante: {
          select: {
            id: true,
            nome: true,
          }
        },
        produtos: {
          where: { disponivel: true },
          select: {
            id: true,
            nome: true,
            preco: true,
            disponivel: true,
          },
          orderBy: { nome: 'asc' }
        },
        _count: {
          select: {
            produtos: true,
          }
        }
      }
    })
    
    if (!categoria) {
      return createErrorResponse('Categoria não encontrada', 404)
    }
    
    return categoria
  })
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  return withErrorHandling(async () => {
    const { id } = await params
    const body = await request.json()
    
    const categoria = await prisma.categoria.update({
      where: { id },
      data: {
        nome: body.nome,
        descricao: body.descricao,
        cor: body.cor,
        icone: body.icone,
        ordem: body.ordem,
        ativa: body.ativa,
      }
    })
    
    return categoria
  })
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return withErrorHandling(async () => {
    const { id } = await params
    
    // Check if categoria has any products
    const categoria = await prisma.categoria.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            produtos: true,
          }
        }
      }
    })
    
    if (!categoria) {
      return createErrorResponse('Categoria não encontrada', 404)
    }
    
    if (categoria._count.produtos > 0) {
      return createErrorResponse(
        'Não é possível excluir categoria que possui produtos',
        400
      )
    }
    
    await prisma.categoria.delete({
      where: { id }
    })
    
    return { message: 'Categoria excluída com sucesso' }
  })
}