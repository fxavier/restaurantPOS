import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withErrorHandling, createErrorResponse, validateRequiredFields } from '@/lib/api-routes'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  return withErrorHandling(async () => {
    const { id } = await params
    
    const itens = await prisma.itemOrdemCompra.findMany({
      where: { ordemCompraId: id },
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
      },
      orderBy: { id: 'asc' }
    })
    
    return itens
  })
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  return withErrorHandling(async () => {
    const { id: ordemCompraId } = await params
    const body = await request.json()
    
    const requiredFields = ['produtoId', 'quantidade', 'precoUnitario', 'unidadeMedidaId']
    const missingFields = validateRequiredFields(body, requiredFields)
    
    if (missingFields.length > 0) {
      return createErrorResponse(
        `Campos obrigatórios ausentes: ${missingFields.join(', ')}`,
        400
      )
    }
    
    // Verify ordem exists and is in valid status
    const ordemCompra = await prisma.ordemCompra.findUnique({
      where: { id: ordemCompraId },
      select: { status: true }
    })
    
    if (!ordemCompra) {
      return createErrorResponse('Ordem de compra não encontrada', 404)
    }
    
    if (ordemCompra.status !== 'rascunho' && ordemCompra.status !== 'enviada') {
      return createErrorResponse(
        'Só é possível adicionar itens em ordens "rascunho" ou "enviada"',
        400
      )
    }
    
    // Get product details
    const produto = await prisma.produto.findUnique({
      where: { id: body.produtoId },
      select: {
        nome: true,
      }
    })
    
    if (!produto) {
      return createErrorResponse('Produto não encontrado', 404)
    }
    
    const precoTotal = body.quantidade * body.precoUnitario
    
    const itemOrdemCompra = await prisma.itemOrdemCompra.create({
      data: {
        ordemCompraId,
        produtoId: body.produtoId,
        produtoNome: produto.nome,
        quantidade: body.quantidade,
        precoUnitario: body.precoUnitario,
        precoTotal,
        quantidadeRecebida: body.quantidadeRecebida,
        unidadeMedidaId: body.unidadeMedidaId,
      },
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
    })
    
    // Update ordem totals
    await updateOrdemTotals(ordemCompraId)
    
    return itemOrdemCompra
  })
}

async function updateOrdemTotals(ordemCompraId: string) {
  const itens = await prisma.itemOrdemCompra.findMany({
    where: { ordemCompraId }
  })
  
  const subtotal = itens.reduce((total, item) => total + item.precoTotal, 0)
  
  // IVA 16% (Mozambique)
  const impostos = subtotal * 0.16
  const total = subtotal + impostos
  
  await prisma.ordemCompra.update({
    where: { id: ordemCompraId },
    data: {
      subtotal,
      impostos,
      total,
    }
  })
}