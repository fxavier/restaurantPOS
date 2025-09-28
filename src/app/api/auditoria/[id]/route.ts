import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withErrorHandling, createErrorResponse } from '@/lib/api-routes'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  return withErrorHandling(async () => {
    const { id } = await params
    
    const log = await prisma.logAuditoria.findUnique({
      where: { id },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
            perfil: true,
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
    
    if (!log) {
      return createErrorResponse('Log de auditoria não encontrado', 404)
    }
    
    return log
  })
}

// Audit logs are typically read-only, but we might allow adding notes
export async function PUT(request: NextRequest, { params }: RouteParams) {
  return withErrorHandling(async () => {
    const { id } = await params
    const body = await request.json()
    
    // Only allow updating detalhes for administrative purposes
    if (!body.detalhes) {
      return createErrorResponse('Apenas detalhes podem ser atualizados', 400)
    }
    
    const log = await prisma.logAuditoria.update({
      where: { id },
      data: {
        detalhes: body.detalhes,
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

// Audit logs should generally not be deleted for compliance reasons
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return withErrorHandling(async () => {
    const { id } = await params
    
    // Only allow deletion in very specific circumstances
    const log = await prisma.logAuditoria.findUnique({
      where: { id }
    })
    
    if (!log) {
      return createErrorResponse('Log de auditoria não encontrado', 404)
    }
    
    // Only allow deletion of test logs or specific error logs
    if (log.acao !== 'erro' && !log.detalhes.includes('TESTE')) {
      return createErrorResponse(
        'Logs de auditoria não podem ser excluídos por motivos de conformidade',
        403
      )
    }
    
    await prisma.logAuditoria.delete({
      where: { id }
    })
    
    return { message: 'Log de auditoria excluído' }
  })
}