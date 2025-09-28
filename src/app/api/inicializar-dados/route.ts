import { NextResponse } from 'next/server';
import { inicializarDadosIniciais } from '@/lib/dados-iniciais';

export async function POST() {
  try {
    await inicializarDadosIniciais();
    return NextResponse.json({ 
      success: true, 
      message: 'Dados iniciais criados com sucesso' 
    });
  } catch (error) {
    console.error('Erro ao inicializar dados:', error);
    return NextResponse.json(
      { error: 'Erro ao inicializar dados' },
      { status: 500 }
    );
  }
}