import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withErrorHandling, createErrorResponse } from '@/lib/api-routes'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  return withErrorHandling(async () => {
    const { id } = await params
    
    const usuario = await prisma.usuario.findUnique({
      where: { id },
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
        restaurante: {
          select: {
            id: true,
            nome: true,
          }
        },
        _count: {
          select: {
            comandas: true,
            ordensCompra: true,
            logsAuditoria: true,
          }
        }
      }
    })
    
    if (!usuario) {
      return createErrorResponse('Usuário não encontrado', 404)
    }
    
    return usuario
  })
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  return withErrorHandling(async () => {
    const { id } = await params
    const body = await request.json()
    
    // Check if email is unique (excluding current user)
    if (body.email) {
      const existingUser = await prisma.usuario.findFirst({
        where: {
          email: body.email,
          NOT: { id }
        }
      })
      
      if (existingUser) {
        return createErrorResponse('Email já está em uso', 400)
      }
    }
    
    const usuario = await prisma.usuario.update({
      where: { id },
      data: {
        nome: body.nome,
        email: body.email,
        telefone: body.telefone,
        perfil: body.perfil,
        permissoes: body.permissoes,
        ativo: body.ativo,
        ultimoLogin: body.ultimoLogin ? new Date(body.ultimoLogin) : undefined,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        perfil: true,
        permissoes: true,
        ativo: true,
        ultimoLogin: true,
        atualizadoEm: true,
        restauranteId: true,
      }
    })
    
    return usuario
  })
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return withErrorHandling(async () => {
    const { id } = await params
    
    // Check if user has any dependencies
    const usuario = await prisma.usuario.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            comandas: true,
            ordensCompra: true,
            logsAuditoria: true,
          }
        }
      }
    })
    
    if (!usuario) {
      return createErrorResponse('Usuário não encontrado', 404)
    }
    
    if (usuario._count.comandas > 0 || usuario._count.ordensCompra > 0) {
      return createErrorResponse(
        'Não é possível excluir usuário que possui comandas ou ordens de compra',
        400
      )
    }
    
    await prisma.usuario.delete({
      where: { id }
    })
    
    return { message: 'Usuário excluído com sucesso' }
  })
}