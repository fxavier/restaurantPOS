import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withErrorHandling, createErrorResponse, getPaginationParams, createPaginatedResponse, validateRequiredFields } from '@/lib/api-routes'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const { page, limit, offset, orderBy } = await getPaginationParams(request)
  const restauranteId = searchParams.get('restauranteId')
  const usuarioId = searchParams.get('usuarioId')
  const acao = searchParams.get('acao')
  const entidade = searchParams.get('entidade')
  const entidadeId = searchParams.get('entidadeId')
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
  
  if (acao) {
    where.acao = acao
  }
  
  if (entidade) {
    where.entidade = entidade
  }
  
  if (entidadeId) {
    where.entidadeId = entidadeId
  }
  
  if (dataInicio || dataFim) {
    where.criadoEm = {}
    if (dataInicio) {
      where.criadoEm.gte = new Date(dataInicio)
    }
    if (dataFim) {
      where.criadoEm.lte = new Date(dataFim)
    }
  }
  
  // Add search functionality
  if (search) {
    where.OR = [
      { acao: { contains: search, mode: 'insensitive' } },
      { entidade: { contains: search, mode: 'insensitive' } },
      { usuarioNome: { contains: search, mode: 'insensitive' } },
      { detalhes: { contains: search, mode: 'insensitive' } }
    ]
  }
  
  try {
    // Get total count for pagination
    const total = await prisma.logAuditoria.count({ where })
    
    // Get paginated data
    const logs = await prisma.logAuditoria.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: orderBy || { criadoEm: 'desc' },
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
    
    return createPaginatedResponse(logs, total, page, limit)
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return createErrorResponse('Erro ao buscar logs de auditoria', 500)
  }
}

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const body = await request.json()
    
    const requiredFields = ['usuarioId', 'usuarioNome', 'acao', 'entidade', 'entidadeId', 'detalhes', 'restauranteId']
    const missingFields = validateRequiredFields(body, requiredFields)
    
    if (missingFields.length > 0) {
      return createErrorResponse(
        `Campos obrigatórios ausentes: ${missingFields.join(', ')}`,
        400
      )
    }
    
    const log = await prisma.logAuditoria.create({
      data: {
        usuarioId: body.usuarioId,
        usuarioNome: body.usuarioNome,
        acao: body.acao,
        entidade: body.entidade,
        entidadeId: body.entidadeId,
        detalhes: body.detalhes,
        dadosAnteriores: body.dadosAnteriores || null,
        dadosNovos: body.dadosNovos || null,
        ip: body.ip,
        userAgent: body.userAgent,
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
    
    return log
  })
}