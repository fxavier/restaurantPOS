import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandling } from '@/lib/api-routes';

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    // TODO: Implementar invalidação de token adequadamente
    // Por enquanto, apenas retornamos sucesso
    // Em uma implementação real, invalidaríamos o token no servidor
    
    return NextResponse.json({
      success: true,
      message: 'Logout realizado com sucesso',
    });
  });
}