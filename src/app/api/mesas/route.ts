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
  const area = searchParams.get('area')
  const search = searchParams.get('search')
  
  const where: any = {}
  
  // If restauranteId is provided, filter by it. Otherwise, return all tables
  if (restauranteId) {
    where.restauranteId = restauranteId
  }
  
  if (status) {
    where.status = status
  }
  
  if (area) {
    where.area = area
  }
  
  // Add search functionality
  if (search) {
    where.OR = [
      { numero: { contains: search, mode: 'insensitive' } },
      { area: { contains: search, mode: 'insensitive' } },
    ]
  }
  
  try {
    // Get total count for pagination
    const total = await prisma.mesa.count({ where })
    
    // Get paginated data
    const mesas = await prisma.mesa.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: orderBy || { numero: 'asc' },
      include: {
        _count: {
          select: {
            comandas: true,
          }
        },
        comandas: {
          where: {
            status: {
              in: ['aberta', 'enviada', 'preparando']
            }
          },
          select: {
            id: true,
            numero: true,
            status: true,
            total: true,
            criadaEm: true,
          }
        }
      }
    })
    
    return createPaginatedResponse(mesas, total, page, limit)
  } catch (error) {
    console.error('Error fetching tables:', error)
    return createErrorResponse('Erro ao buscar mesas', 500)
  }
}

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const body = await request.json()
    
    const requiredFields = ['numero', 'capacidade', 'area', 'restauranteId']
    const missingFields = validateRequiredFields(body, requiredFields)
    
    if (missingFields.length > 0) {
      return createErrorResponse(
        `Campos obrigatórios ausentes: ${missingFields.join(', ')}`,
        400
      )
    }
    
    // Check if numero is unique within restaurant
    const existingMesa = await prisma.mesa.findFirst({
      where: {
        numero: body.numero,
        restauranteId: body.restauranteId
      }
    })
    
    if (existingMesa) {
      return createErrorResponse('Número da mesa já existe neste restaurante', 400)
    }
    
    const mesa = await prisma.mesa.create({
      data: {
        numero: body.numero,
        capacidade: body.capacidade,
        area: body.area,
        qrCode: body.qrCode,
        status: body.status || 'livre',
        restauranteId: body.restauranteId,
      }
    })
    
    return mesa
  })
}