import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandling, createErrorResponse, validateRequiredFields } from '@/lib/api-routes';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const body = await request.json();
    
    const requiredFields = ['email', 'senha'];
    const missingFields = validateRequiredFields(body, requiredFields);
    
    if (missingFields.length > 0) {
      return createErrorResponse(
        `Campos obrigatórios ausentes: ${missingFields.join(', ')}`,
        400
      );
    }
    
    // Buscar usuário
    const usuario = await prisma.usuario.findUnique({
      where: { email: body.email },
      include: {
        restaurante: true,
      },
    });
    
    if (!usuario) {
      return createErrorResponse('Email ou senha inválidos', 401);
    }
    
    // Verificar se usuário está ativo
    if (!usuario.ativo) {
      return createErrorResponse('Usuário inativo', 403);
    }
    
    // Verificar senha (por enquanto comparação simples, depois implementar bcrypt)
    // TODO: Implementar hash de senha adequadamente
    const senhaValida = usuario.senha === body.senha;
    
    if (!senhaValida) {
      return createErrorResponse('Email ou senha inválidos', 401);
    }
    
    // Atualizar último acesso
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { ultimoAcesso: new Date() },
    });
    
    // Remover senha do retorno
    const { senha, ...usuarioSemSenha } = usuario;
    
    // TODO: Implementar JWT ou sessões adequadamente
    return NextResponse.json({
      success: true,
      data: {
        usuario: usuarioSemSenha,
        token: 'mock-token-' + usuario.id, // Token temporário
      },
    });
  });
}