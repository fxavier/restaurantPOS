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
  const ativo = searchParams.get('ativo')
  const search = searchParams.get('search')
  
  const where: any = {}
  
  // If restauranteId is provided, filter by it. Otherwise, return all fornecedores
  if (restauranteId) {
    where.restauranteId = restauranteId
  }
  
  if (ativo !== null) {
    where.ativo = ativo === 'true'
  }
  
  // Add search functionality
  if (search) {
    where.OR = [
      { nome: { contains: search, mode: 'insensitive' } },
      { nuit: { contains: search, mode: 'insensitive' } },
      { contato: { contains: search, mode: 'insensitive' } },
      { telefone: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ]
  }
  
  try {
    // Get total count for pagination
    const total = await prisma.fornecedor.count({ where })
    
    // Get paginated data
    const fornecedores = await prisma.fornecedor.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: orderBy || { nome: 'asc' },
      include: {
        _count: {
          select: {
            ordensCompra: true,
          }
        },
        ordensCompra: {
          where: {
            status: {
              in: ['rascunho', 'enviada', 'confirmada']
            }
          },
          select: {
            id: true,
            numero: true,
            status: true,
            total: true,
            criadaEm: true,
          },
          orderBy: { criadaEm: 'desc' },
          take: 3
        }
      }
    })
    
    return createPaginatedResponse(fornecedores, total, page, limit)
  } catch (error) {
    console.error('Error fetching fornecedores:', error)
    return createErrorResponse('Erro ao buscar fornecedores', 500)
  }
}

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const body = await request.json()
    
    const requiredFields = ['nome', 'contato', 'restauranteId']
    const missingFields = validateRequiredFields(body, requiredFields)
    
    if (missingFields.length > 0) {
      return createErrorResponse(
        `Campos obrigatórios ausentes: ${missingFields.join(', ')}`,
        400
      )
    }
    
    // Check if NUIT is unique if provided
    if (body.nuit) {
      const existingFornecedor = await prisma.fornecedor.findFirst({
        where: {
          nuit: body.nuit,
          restauranteId: body.restauranteId
        }
      })
      
      if (existingFornecedor) {
        return createErrorResponse('NUIT já cadastrado para este restaurante', 400)
      }
    }
    
    const fornecedor = await prisma.fornecedor.create({
      data: {
        nome: body.nome,
        nuit: body.nuit,
        contato: body.contato,
        telefone: body.telefone,
        email: body.email,
        endereco: body.endereco,
        ativo: body.ativo ?? true,
        restauranteId: body.restauranteId,
      }
    })
    
    return fornecedor
  })
}