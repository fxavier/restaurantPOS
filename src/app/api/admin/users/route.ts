import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { withErrorHandling, createErrorResponse, validateRequiredFields } from '@/lib/api-routes';

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return createErrorResponse('Acesso negado. Apenas administradores podem gerenciar usuários.', 403);
    }

    const { searchParams } = new URL(request.url);
    const restauranteId = session.user.restauranteId;

    const usuarios = await prisma.usuario.findMany({
      where: {
        restauranteId,
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
      orderBy: {
        criadoEm: 'desc',
      },
    });

    return usuarios;
  });
}

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return createErrorResponse('Acesso negado. Apenas administradores podem criar usuários.', 403);
    }

    const body = await request.json();
    const requiredFields = ['nome', 'email', 'username', 'senha', 'perfil'];
    const missingFields = validateRequiredFields(body, requiredFields);
    
    if (missingFields.length > 0) {
      return createErrorResponse(
        `Campos obrigatórios ausentes: ${missingFields.join(', ')}`,
        400
      );
    }

    // Check if username or email already exists
    const existingUser = await prisma.usuario.findFirst({
      where: {
        OR: [
          { email: body.email },
          { username: body.username },
        ],
      },
    });

    if (existingUser) {
      return createErrorResponse(
        'Usuário já existe com este email ou nome de usuário',
        400
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(body.senha, 12);

    const usuario = await prisma.usuario.create({
      data: {
        nome: body.nome,
        email: body.email,
        username: body.username,
        senha: hashedPassword,
        telefone: body.telefone,
        perfil: body.perfil,
        permissoes: body.permissoes || [],
        ativo: body.ativo !== undefined ? body.ativo : true,
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

    return usuario;
  });
}