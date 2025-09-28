import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withErrorHandling, createErrorResponse, getPaginationParams, createPaginatedResponse, validateRequiredFields } from '@/lib/api-routes'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const { page, limit, offset, orderBy } = await getPaginationParams(request)
  const restauranteId = searchParams.get('restauranteId')
  const status = searchParams.get('status')
  const dataInicio = searchParams.get('dataInicio')
  const dataFim = searchParams.get('dataFim')
  const search = searchParams.get('search')
  
  const where: any = {}
  
  // If restauranteId is provided, filter by it. Otherwise, return all
  if (restauranteId) {
    where.restauranteId = restauranteId
  }
  
  if (status) {
    where.status = status
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
      { entregadorNome: { contains: search, mode: 'insensitive' } },
      { enderecoEntrega: { contains: search, mode: 'insensitive' } }
    ]
  }
  
  try {
    // Get total count for pagination
    const total = await prisma.entrega.count({ where })
    
    // Get paginated data
    const entregas = await prisma.entrega.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: orderBy || { criadaEm: 'desc' },
      include: {
        comanda: {
          select: {
            id: true,
            numero: true,
            total: true,
            mesa: {
              select: {
                numero: true,
              }
            },
            garcom: {
              select: {
                nome: true,
              }
            }
          }
        }
      }
    })
    
    return createPaginatedResponse(entregas, total, page, limit)
  } catch (error) {
    console.error('Error fetching deliveries:', error)
    return createErrorResponse('Erro ao buscar entregas', 500)
  }
}

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const body = await request.json()
    
    const requiredFields = [
      'numero', 'comandaId', 'clienteNome', 'clienteTelefone', 
      'entregadorNome', 'entregadorTelefone', 'enderecoEntrega', 
      'valorTotal', 'tempoEstimado', 'restauranteId'
    ]
    const missingFields = validateRequiredFields(body, requiredFields)
    
    if (missingFields.length > 0) {
      return createErrorResponse(
        `Campos obrigatórios ausentes: ${missingFields.join(', ')}`,
        400
      )
    }
    
    // Check if numero is unique
    const existingEntrega = await prisma.entrega.findUnique({
      where: { numero: body.numero }
    })
    
    if (existingEntrega) {
      return createErrorResponse('Número da entrega já existe', 400)
    }
    
    // Get comanda details
    const comanda = await prisma.comanda.findUnique({
      where: { id: body.comandaId },
      select: {
        numero: true,
        status: true,
        canal: true,
      }
    })
    
    if (!comanda) {
      return createErrorResponse('Comanda não encontrada', 404)
    }
    
    if (comanda.canal !== 'delivery') {
      return createErrorResponse('Comanda deve ser do canal delivery', 400)
    }
    
    const entrega = await prisma.entrega.create({
      data: {
        numero: body.numero,
        comandaId: body.comandaId,
        comandaNumero: comanda.numero,
        clienteNome: body.clienteNome,
        clienteTelefone: body.clienteTelefone,
        entregadorNome: body.entregadorNome,
        entregadorTelefone: body.entregadorTelefone,
        enderecoEntrega: body.enderecoEntrega,
        observacoes: body.observacoes,
        taxaEntrega: body.taxaEntrega || 0,
        valorTotal: body.valorTotal,
        tempoEstimado: body.tempoEstimado,
        status: body.status || 'pendente',
        dataEntrega: body.dataEntrega ? new Date(body.dataEntrega) : null,
        restauranteId: body.restauranteId,
      },
      include: {
        comanda: {
          select: {
            id: true,
            numero: true,
            total: true,
          }
        }
      }
    })
    
    return entrega
  })
}