import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { 
  withErrorHandling, 
  createErrorResponse, 
  getPaginationParams,
  createPaginatedResponse,
  validateRequiredFields 
} from '@/lib/api-routes'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const { page, limit, offset, orderBy } = await getPaginationParams(request)
  const restauranteId = searchParams.get('restauranteId')
  const status = searchParams.get('status')
  const mesaId = searchParams.get('mesaId')
  const dataInicio = searchParams.get('dataInicio')
  const dataFim = searchParams.get('dataFim')
  const search = searchParams.get('search')
  
  const where: any = {}
  
  // If restauranteId is provided, filter by it. Otherwise, return all comandas
  if (restauranteId) {
    where.restauranteId = restauranteId
  }
  
  if (status) {
    const statusArray = searchParams.getAll('status')
    if (statusArray.length > 1) {
      where.status = { in: statusArray }
    } else {
      where.status = status
    }
  }
  
  if (mesaId) {
    where.mesaId = mesaId
  }
  
  if (dataInicio || dataFim) {
    where.criadaEm = {}
    if (dataInicio) {
      where.criadaEm.gte = new Date(dataInicio)
    }
    if (dataFim) {
      where.criadaEm.lte = new Date(dataFim)
    }
  }
  
  // Add search functionality
  if (search) {
    where.OR = [
      { numero: { contains: search, mode: 'insensitive' } },
      { clienteNome: { contains: search, mode: 'insensitive' } },
      { clienteTelefone: { contains: search, mode: 'insensitive' } },
      { observacoes: { contains: search, mode: 'insensitive' } },
    ]
  }
  
  try {
    console.log('Fetching comandas with filters:', where)
    
    // Get total count for pagination
    const total = await prisma.comanda.count({ where })
    console.log('Total comandas found:', total)
    
    // Get paginated data
    const comandas = await prisma.comanda.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: orderBy || { criadaEm: 'desc' },
      include: {
        mesa: true,
        garcom: {
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
              }
            },
            variacoes: true,
          }
        },
        pagamentos: true,
        _count: {
          select: {
            itens: true,
          }
        }
      }
    })
    
    console.log('Comandas fetched successfully:', comandas.length)
    return createPaginatedResponse(comandas, total, page, limit)
  } catch (error) {
    console.error('Error fetching comandas:', error)
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error')
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return createErrorResponse('Erro ao buscar comandas: ' + (error instanceof Error ? error.message : 'Erro desconhecido'), 500)
  }
}

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const body = await request.json()
    
    const requiredFields = ['numero', 'garcomId', 'restauranteId']
    const missingFields = validateRequiredFields(body, requiredFields)
    
    if (missingFields.length > 0) {
      return createErrorResponse(
        `Campos obrigatórios ausentes: ${missingFields.join(', ')}`,
        400
      )
    }
    
    // Check if numero is unique
    const existingComanda = await prisma.comanda.findUnique({
      where: { numero: body.numero }
    })
    
    if (existingComanda) {
      return createErrorResponse('Número da comanda já existe', 400)
    }
    
    const comanda = await prisma.comanda.create({
      data: {
        numero: body.numero,
        clienteNome: body.clienteNome,
        clienteTelefone: body.clienteTelefone,
        canal: body.canal || 'balcao',
        observacoes: body.observacoes,
        mesaId: body.mesaId,
        garcomId: body.garcomId,
        restauranteId: body.restauranteId,
        subtotal: body.subtotal || 0,
        taxaServico: body.taxaServico || 0,
        impostos: body.impostos || 0,
        desconto: body.desconto || 0,
        total: body.total || 0,
        status: body.status || 'aberta',
        // Create items if provided
        itens: body.itens ? {
          create: body.itens.map((item: any) => ({
            produtoId: item.produtoId,
            produtoNome: item.produtoNome,
            quantidade: item.quantidade,
            precoUnitario: item.precoUnitario,
            precoTotal: item.precoTotal,
            observacoes: item.observacoes,
            status: item.status || 'pendente',
            tempoPreparoEstimado: item.tempoPreparoEstimado,
          }))
        } : undefined,
      },
      include: {
        mesa: true,
        garcom: {
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
              }
            },
            variacoes: true,
          }
        },
      }
    })
    
    return comanda
  })
}