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
  const perfil = searchParams.get('perfil')
  const ativo = searchParams.get('ativo')
  const search = searchParams.get('search')
  
  const where: any = {}
  
  // If restauranteId is provided, filter by it. Otherwise, return all usuarios
  if (restauranteId) {
    where.restauranteId = restauranteId
  }
  
  if (perfil) {
    where.perfil = perfil
  }
  
  if (ativo !== null) {
    where.ativo = ativo === 'true'
  }
  
  // Add search functionality
  if (search) {
    where.OR = [
      { nome: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { telefone: { contains: search, mode: 'insensitive' } },
    ]
  }
  
  try {
    // Get total count for pagination
    const total = await prisma.usuario.count({ where })
    
    // Get paginated data
    const usuarios = await prisma.usuario.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: orderBy || { nome: 'asc' },
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        perfil: true,
        permissoes: true,
        ativo: true,
        ultimoLogin: true,
        criadoEm: true,
        atualizadoEm: true,
        restauranteId: true,
        _count: {
          select: {
            comandas: true,
            ordensCompra: true,
          }
        }
      }
    })
    
    return createPaginatedResponse(usuarios, total, page, limit)
  } catch (error) {
    console.error('Error fetching usuarios:', error)
    return createErrorResponse('Erro ao buscar usuários', 500)
  }
}

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const body = await request.json()
    
    const requiredFields = ['nome', 'email', 'perfil', 'restauranteId']
    const missingFields = validateRequiredFields(body, requiredFields)
    
    if (missingFields.length > 0) {
      return createErrorResponse(
        `Campos obrigatórios ausentes: ${missingFields.join(', ')}`,
        400
      )
    }
    
    // Check if email is unique
    const existingUser = await prisma.usuario.findUnique({
      where: { email: body.email }
    })
    
    if (existingUser) {
      return createErrorResponse('Email já está em uso', 400)
    }
    
    const usuario = await prisma.usuario.create({
      data: {
        nome: body.nome,
        email: body.email,
        username: body.username || body.email.split('@')[0],
        senha: body.senha || 'senha-padrao-123',
        telefone: body.telefone,
        perfil: body.perfil,
        permissoes: body.permissoes || [],
        ativo: body.ativo ?? true,
        restauranteId: body.restauranteId,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        perfil: true,
        permissoes: true,
        ativo: true,
        criadoEm: true,
        restauranteId: true,
      }
    })
    
    return usuario
  })
}