import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withErrorHandling, createErrorResponse, validateRequiredFields } from '@/lib/api-routes'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  return withErrorHandling(async () => {
    const { id } = await params
    
    const itens = await prisma.itemComanda.findMany({
      where: { comandaId: id },
      include: {
        produto: true,
        variacoes: true,
      },
      orderBy: { id: 'asc' }
    })
    
    return itens
  })
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  return withErrorHandling(async () => {
    const { id: comandaId } = await params
    const body = await request.json()
    
    const requiredFields = ['produtoId', 'quantidade', 'precoUnitario']
    const missingFields = validateRequiredFields(body, requiredFields)
    
    if (missingFields.length > 0) {
      return createErrorResponse(
        `Campos obrigatórios ausentes: ${missingFields.join(', ')}`,
        400
      )
    }
    
    // Verify comanda exists and is in valid status
    const comanda = await prisma.comanda.findUnique({
      where: { id: comandaId },
      select: { status: true }
    })
    
    if (!comanda) {
      return createErrorResponse('Comanda não encontrada', 404)
    }
    
    if (comanda.status !== 'aberta' && comanda.status !== 'enviada') {
      return createErrorResponse(
        'Só é possível adicionar itens em comandas abertas ou enviadas',
        400
      )
    }
    
    // Get product details
    const produto = await prisma.produto.findUnique({
      where: { id: body.produtoId },
      select: {
        nome: true,
        disponivel: true,
        tempoPreparoMinutos: true,
      }
    })
    
    if (!produto) {
      return createErrorResponse('Produto não encontrado', 404)
    }
    
    if (!produto.disponivel) {
      return createErrorResponse('Produto não está disponível', 400)
    }
    
    const precoTotal = body.quantidade * body.precoUnitario
    
    const itemComanda = await prisma.itemComanda.create({
      data: {
        comandaId,
        produtoId: body.produtoId,
        produtoNome: produto.nome,
        quantidade: body.quantidade,
        precoUnitario: body.precoUnitario,
        precoTotal,
        observacoes: body.observacoes,
        tempoPreparoEstimado: produto.tempoPreparoMinutos,
      },
      include: {
        produto: true,
        variacoes: true,
      }
    })
    
    // Add product variations if provided
    if (body.variacoes && body.variacoes.length > 0) {
      await prisma.variacaoSelecionada.createMany({
        data: body.variacoes.map((variacao: any) => ({
          itemComandaId: itemComanda.id,
          variacaoId: variacao.variacaoId,
          nome: variacao.nome,
          precoAdicional: variacao.precoAdicional,
        }))
      })
    }
    
    // Update comanda totals
    await updateComandaTotals(comandaId)
    
    return itemComanda
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