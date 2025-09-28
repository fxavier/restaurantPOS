import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withErrorHandling, createErrorResponse } from '@/lib/api-routes'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  return withErrorHandling(async () => {
    const { id } = await params
    
    const menu = await prisma.menu.findUnique({
      where: { id },
      include: {
        produtos: {
          include: {
            produto: {
              select: {
                id: true,
                nome: true,
                preco: true,
                disponivel: true,
                categoria: {
                  select: {
                    id: true,
                    nome: true,
                    cor: true,
                  }
                }
              }
            }
          }
        },
        _count: {
          select: {
            produtos: true,
          }
        }
      }
    })
    
    if (!menu) {
      return createErrorResponse('Menu não encontrado', 404)
    }
    
    return menu
  })
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  return withErrorHandling(async () => {
    const { id } = await params
    const body = await request.json()
    
    const menu = await prisma.menu.update({
      where: { id },
      data: {
        ...(body.nome && { nome: body.nome }),
        ...(body.descricao && { descricao: body.descricao }),
        ...(body.tipo && { tipo: body.tipo }),
        ...(body.imagem && { imagem: body.imagem }),
        ...(typeof body.ativo !== 'undefined' && { ativo: body.ativo }),
      }
    })
    
    // Update products if provided
    if (body.produtos !== undefined) {
      // Remove existing products
      await prisma.menuProduto.deleteMany({
        where: { menuId: id }
      })
      
      // Add new products
      if (body.produtos.length > 0) {
        await prisma.menuProduto.createMany({
          data: body.produtos.map((produtoId: string) => ({
            menuId: id,
            produtoId,
          }))
        })
      }
    }
    
    // Return updated menu with products
    const updatedMenu = await prisma.menu.findUnique({
      where: { id },
      include: {
        produtos: {
          include: {
            produto: {
              select: {
                id: true,
                nome: true,
                preco: true,
                disponivel: true,
                categoria: {
                  select: {
                    id: true,
                    nome: true,
                    cor: true,
                  }
                }
              }
            }
          }
        },
        _count: {
          select: {
            produtos: true,
          }
        }
      }
    })
    
    return updatedMenu
  })
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return withErrorHandling(async () => {
    const { id } = await params
    
    const menu = await prisma.menu.findUnique({
      where: { id }
    })
    
    if (!menu) {
      return createErrorResponse('Menu não encontrado', 404)
    }
    
    // First remove all products from menu
    await prisma.menuProduto.deleteMany({
      where: { menuId: id }
    })
    
    // Then delete the menu
    await prisma.menu.delete({
      where: { id }
    })
    
    return { message: 'Menu excluído com sucesso' }
  })
}