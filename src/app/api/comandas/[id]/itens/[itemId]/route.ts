import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withErrorHandling, createErrorResponse } from '@/lib/api-routes'

interface RouteParams {
  params: Promise<{ id: string; itemId: string }>
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  return withErrorHandling(async () => {
    const { id: comandaId, itemId } = await params
    const body = await request.json()
    
    // Verify item exists and belongs to the comanda
    const itemExistente = await prisma.itemComanda.findFirst({
      where: {
        id: itemId,
        comandaId: comandaId,
      }
    })
    
    if (!itemExistente) {
      return createErrorResponse('Item não encontrado', 404)
    }
    
    // Update the item with new data
    const updateData: any = {}
    
    if (body.status) {
      updateData.status = body.status
      
      // Set timestamps based on status changes
      if (body.status === 'preparando' && !itemExistente.iniciadoPreparoEm) {
        updateData.iniciadoPreparoEm = new Date()
      } else if (body.status === 'pronto' && !itemExistente.prontoEm) {
        updateData.prontoEm = new Date()
      }
    }
    
    if (body.observacoes !== undefined) {
      updateData.observacoes = body.observacoes
    }
    
    if (body.quantidade !== undefined) {
      updateData.quantidade = body.quantidade
      updateData.precoTotal = body.quantidade * itemExistente.precoUnitario
    }
    
    const itemAtualizado = await prisma.itemComanda.update({
      where: { id: itemId },
      data: updateData,
      include: {
        produto: {
          select: {
            id: true,
            nome: true,
          }
        },
        variacoes: true,
      }
    })
    
    // Update comanda status based on items
    await updateComandaStatus(comandaId)
    
    return itemAtualizado
  })
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return withErrorHandling(async () => {
    const { id: comandaId, itemId } = await params
    
    // Verify item exists and belongs to the comanda
    const itemExistente = await prisma.itemComanda.findFirst({
      where: {
        id: itemId,
        comandaId: comandaId,
      }
    })
    
    if (!itemExistente) {
      return createErrorResponse('Item não encontrado', 404)
    }
    
    // Delete the item
    await prisma.itemComanda.delete({
      where: { id: itemId }
    })
    
    // Update comanda totals and status
    await updateComandaTotals(comandaId)
    await updateComandaStatus(comandaId)
    
    return { success: true, message: 'Item removido com sucesso' }
  })
}

async function updateComandaStatus(comandaId: string) {
  // Get all items for this comanda
  const itens = await prisma.itemComanda.findMany({
    where: { comandaId },
    select: { status: true }
  })
  
  if (itens.length === 0) {
    // No items, keep comanda as 'aberta'
    return
  }
  
  // Determine new comanda status based on item statuses
  const statusCounts = itens.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  let novoStatus = 'aberta'
  
  if (statusCounts.cancelado === itens.length) {
    // All items cancelled
    novoStatus = 'cancelada'
  } else if (statusCounts.entregue === itens.length) {
    // All items delivered
    novoStatus = 'entregue'
  } else if (statusCounts.pronto + (statusCounts.entregue || 0) === itens.length) {
    // All items ready or delivered
    novoStatus = 'pronta'
  } else if (statusCounts.preparando > 0 || statusCounts.pronto > 0) {
    // Some items being prepared or ready
    novoStatus = 'preparando'
  }
  
  await prisma.comanda.update({
    where: { id: comandaId },
    data: { status: novoStatus as any }
  })
}

async function updateComandaTotals(comandaId: string) {
  const itens = await prisma.itemComanda.findMany({
    where: { comandaId },
    include: {
      variacoes: true,
    }
  })
  
  const subtotal = itens.reduce((total, item) => {
    const variacoesTotal = item.variacoes.reduce(
      (sum, variacao) => sum + variacao.precoAdicional,
      0
    )
    return total + item.precoTotal + variacoesTotal
  }, 0)
  
  // Get restaurant tax settings
  const comanda = await prisma.comanda.findUnique({
    where: { id: comandaId },
    include: {
      restaurante: {
        select: {
          taxaServico: true,
        }
      }
    }
  })
  
  const taxaServico = subtotal * (comanda?.restaurante.taxaServico || 0)
  const total = subtotal + taxaServico
  
  await prisma.comanda.update({
    where: { id: comandaId },
    data: {
      subtotal,
      taxaServico,
      total,
    }
  })
}