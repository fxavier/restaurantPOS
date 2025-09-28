import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withErrorHandling, createErrorResponse } from '@/lib/api-routes'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  return withErrorHandling(async () => {
    const { id } = await params
    
    const restaurante = await prisma.restaurante.findUnique({
      where: { id },
      include: {
        impostos: true,
        horariosFuncionamento: true,
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
    
    if (!restaurante) {
      return createErrorResponse('Restaurante não encontrado', 404)
    }
    
    return restaurante
  })
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  return withErrorHandling(async () => {
    const { id } = await params
    const body = await request.json()
    
    const restaurante = await prisma.restaurante.update({
      where: { id },
      data: {
        nome: body.nome,
        endereco: body.endereco,
        telefone: body.telefone,
        email: body.email,
        nuit: body.nuit,
        inscricaoEstadual: body.inscricaoEstadual,
        inscricaoMunicipal: body.inscricaoMunicipal,
        taxaServico: body.taxaServico,
        moeda: body.moeda,
        fusoHorario: body.fusoHorario,
      }
    })
    
    return restaurante
  })
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return withErrorHandling(async () => {
    const { id } = await params
    
    await prisma.restaurante.delete({
      where: { id }
    })
    
    return { message: 'Restaurante excluído com sucesso' }
  })
}