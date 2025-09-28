import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withErrorHandling, createErrorResponse, getQueryParams, validateRequiredFields } from '@/lib/api-routes'

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    const { limit, offset, orderBy } = await getQueryParams(request)
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo')
    
    const where: any = {}
    
    if (tipo) {
      where.tipo = tipo
    }
    
    const unidadesMedida = await prisma.unidadeMedida.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: orderBy || { nome: 'asc' },
      include: {
        _count: {
          select: {
            produtos: true,
            ingredientes: true,
            movimentacoes: true,
          }
        }
      }
    })
    
    return unidadesMedida
  })
}

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const body = await request.json()
    
    const requiredFields = ['nome', 'sigla', 'tipo']
    const missingFields = validateRequiredFields(body, requiredFields)
    
    if (missingFields.length > 0) {
      return createErrorResponse(
        `Campos obrigatórios ausentes: ${missingFields.join(', ')}`,
        400
      )
    }
    
    // Check if sigla is unique
    const existingUnidade = await prisma.unidadeMedida.findUnique({
      where: { sigla: body.sigla }
    })
    
    if (existingUnidade) {
      return createErrorResponse('Sigla já está em uso', 400)
    }
    
    const unidadeMedida = await prisma.unidadeMedida.create({
      data: {
        nome: body.nome,
        sigla: body.sigla,
        tipo: body.tipo,
        fatorConversao: body.fatorConversao || 1.0,
      }
    })
    
    return unidadeMedida
  })
}