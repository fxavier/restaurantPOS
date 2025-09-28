import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { withErrorHandling, createErrorResponse } from '@/lib/api-routes';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return createErrorResponse('Acesso negado. Apenas administradores podem visualizar usuários.', 403);
    }

    const { id } = await params;

    const usuario = await prisma.usuario.findFirst({
      where: {
        id,
        restauranteId: session.user.restauranteId,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        username: true,
        telefone: true,
        perfil: true,
        permissoes: true,
        ativo: true,
        ultimoLogin: true,
        criadoEm: true,
        atualizadoEm: true,
        // Don't include senha in response
      },
    });

    if (!usuario) {
      return createErrorResponse('Usuário não encontrado', 404);
    }

    return usuario;
  });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return createErrorResponse('Acesso negado. Apenas administradores podem editar usuários.', 403);
    }

    const { id } = await params;
    const body = await request.json();

    // Check if user exists and belongs to same restaurant
    const existingUser = await prisma.usuario.findFirst({
      where: {
        id,
        restauranteId: session.user.restauranteId,
      },
    });

    if (!existingUser) {
      return createErrorResponse('Usuário não encontrado', 404);
    }

    // Prevent admin from deactivating themselves
    if (id === session.user.id && body.ativo === false) {
      return createErrorResponse('Você não pode desativar seu próprio usuário', 400);
    }

    // If email or username is being changed, check for conflicts
    if (body.email || body.username) {
      const conflictUser = await prisma.usuario.findFirst({
        where: {
          AND: [
            { id: { not: id } }, // Exclude current user
            {
              OR: [
                body.email ? { email: body.email } : {},
                body.username ? { username: body.username } : {},
              ].filter(Boolean),
            },
          ],
        },
      });

      if (conflictUser) {
        return createErrorResponse(
          'Já existe outro usuário com este email ou nome de usuário',
          400
        );
      }
    }

    // Prepare update data
    const updateData: any = {};
    
    if (body.nome) updateData.nome = body.nome;
    if (body.email) updateData.email = body.email;
    if (body.username) updateData.username = body.username;
    if (body.telefone !== undefined) updateData.telefone = body.telefone;
    if (body.perfil) updateData.perfil = body.perfil;
    if (body.permissoes) updateData.permissoes = body.permissoes;
    if (body.ativo !== undefined) updateData.ativo = body.ativo;
    
    // Hash password if provided
    if (body.senha) {
      updateData.senha = await bcrypt.hash(body.senha, 12);
    }

    const usuario = await prisma.usuario.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        nome: true,
        email: true,
        username: true,
        telefone: true,
        perfil: true,
        permissoes: true,
        ativo: true,
        ultimoLogin: true,
        criadoEm: true,
        atualizadoEm: true,
        // Don't include senha in response
      },
    });

    return usuario;
  });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return createErrorResponse('Acesso negado. Apenas administradores podem excluir usuários.', 403);
    }

    const { id } = await params;

    // Check if user exists and belongs to same restaurant
    const existingUser = await prisma.usuario.findFirst({
      where: {
        id,
        restauranteId: session.user.restauranteId,
      },
    });

    if (!existingUser) {
      return createErrorResponse('Usuário não encontrado', 404);
    }

    // Prevent admin from deleting themselves
    if (id === session.user.id) {
      return createErrorResponse('Você não pode excluir seu próprio usuário', 400);
    }

    // Instead of deleting, deactivate the user to preserve data integrity
    await prisma.usuario.update({
      where: { id },
      data: { ativo: false },
    });

    return { message: 'Usuário desativado com sucesso' };
  });
}