import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withErrorHandling, createErrorResponse, getQueryParams, validateRequiredFields } from '@/lib/api-routes'

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    const { limit, offset, orderBy } = await getQueryParams(request)
    
    const restaurantes = await prisma.restaurante.findMany({
      take: limit,
      skip: offset,
      orderBy: orderBy || { criadoEm: 'desc' },
      include: {
        _count: {
          select: {
            usuarios: true,
            mesas: true,
            produtos: true,
            comandas: true,
          }
        }
      }
    })
    
    return restaurantes
  })
}

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const body = await request.json()
    
    const requiredFields = ['nome', 'endereco', 'telefone', 'email', 'nuit']
    const missingFields = validateRequiredFields(body, requiredFields)
    
    if (missingFields.length > 0) {
      return createErrorResponse(
        `Campos obrigatórios ausentes: ${missingFields.join(', ')}`,
        400
      )
    }
    
    const restaurante = await prisma.restaurante.create({
      data: {
        nome: body.nome,
        endereco: body.endereco,
        telefone: body.telefone,
        email: body.email,
        nuit: body.nuit,
        inscricaoEstadual: body.inscricaoEstadual,
        inscricaoMunicipal: body.inscricaoMunicipal,
        taxaServico: body.taxaServico || 0.1,
        moeda: body.moeda || 'MZN',
        fusoHorario: body.fusoHorario || 'Africa/Johannesburg',
      }
    })
    
    return restaurante
  })
}