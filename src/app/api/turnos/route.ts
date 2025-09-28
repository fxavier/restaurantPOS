import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withErrorHandling, createErrorResponse, getPaginationParams, createPaginatedResponse, validateRequiredFields } from '@/lib/api-routes'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const { page, limit, offset, orderBy } = await getPaginationParams(request)
  const restauranteId = searchParams.get('restauranteId')
  const usuarioId = searchParams.get('usuarioId')
  const status = searchParams.get('status')
  const dataInicio = searchParams.get('dataInicio')
  const dataFim = searchParams.get('dataFim')
  const search = searchParams.get('search')
  
  const where: any = {}
  
  // If restauranteId is provided, filter by it. Otherwise, return all
  if (restauranteId) {
    where.restauranteId = restauranteId
  }
  
  if (usuarioId) {
    where.usuarioId = usuarioId
  }
  
  if (status) {
    where.status = status
  }
  
  if (dataInicio || dataFim) {
    where.dataAbertura = {}
    if (dataInicio) {
      where.dataAbertura.gte = new Date(dataInicio)
    }
    if (dataFim) {
      where.dataAbertura.lte = new Date(dataFim)
    }
  }
  
  // Add search functionality
  if (search) {
    where.OR = [
      { observacoes: { contains: search, mode: 'insensitive' } },
      { usuario: { nome: { contains: search, mode: 'insensitive' } } },
      { usuario: { email: { contains: search, mode: 'insensitive' } } }
    ]
  }
  
  try {
    // Get total count for pagination
    const total = await prisma.turnoFechamento.count({ where })
    
    // Get paginated data
    const turnos = await prisma.turnoFechamento.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: orderBy || { dataAbertura: 'desc' },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
          }
        },
        restaurante: {
          select: {
            id: true,
            nome: true,
          }
        }
      }
    })
    
    return createPaginatedResponse(turnos, total, page, limit)
  } catch (error) {
    console.error('Error fetching shifts:', error)
    return createErrorResponse('Erro ao buscar turnos', 500)
  }
}

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const body = await request.json()
    
    const requiredFields = ['usuarioId', 'valorAbertura', 'restauranteId']
    const missingFields = validateRequiredFields(body, requiredFields)
    
    if (missingFields.length > 0) {
      return createErrorResponse(
        `Campos obrigatórios ausentes: ${missingFields.join(', ')}`,
        400
      )
    }
    
    // Check if user has any open shifts
    const turnoAberto = await prisma.turnoFechamento.findFirst({
      where: {
        usuarioId: body.usuarioId,
        status: 'aberto'
      }
    })
    
    if (turnoAberto) {
      return createErrorResponse(
        'Usuário já possui um turno aberto',
        400
      )
    }
    
    const turno = await prisma.turnoFechamento.create({
      data: {
        dataAbertura: body.dataAbertura ? new Date(body.dataAbertura) : new Date(),
        valorAbertura: body.valorAbertura,
        observacoes: body.observacoes,
        usuarioId: body.usuarioId,
        restauranteId: body.restauranteId,
      },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
          }
        }
      }
    })
    
    return turno
  })
}