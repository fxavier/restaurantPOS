import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandling, createErrorResponse } from '@/lib/api-routes';

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    // TODO: Implementar verificação de token adequadamente
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return createErrorResponse('Token de autorização não fornecido', 401);
    }
    
    const token = authHeader.substring(7);
    
    // Verificação temporária do token mock
    if (!token.startsWith('mock-token-')) {
      return createErrorResponse('Token inválido', 401);
    }
    
    const userId = token.replace('mock-token-', '');
    
    // Buscar usuário
    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
      include: {
        restaurante: true,
      },
    });
    
    if (!usuario) {
      return createErrorResponse('Usuário não encontrado', 404);
    }
    
    if (!usuario.ativo) {
      return createErrorResponse('Usuário inativo', 403);
    }
    
    // Remover senha do retorno
    const { senha, ...usuarioSemSenha } = usuario;
    
    return NextResponse.json({
      success: true,
      data: usuarioSemSenha,
    });
  });
}