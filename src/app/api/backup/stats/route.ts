import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restauranteId = searchParams.get('restauranteId');

    if (!restauranteId) {
      return NextResponse.json(
        { success: false, error: 'ID do restaurante é obrigatório' },
        { status: 400 }
      );
    }

    // Contar registros por tabela
    const [
      produtos,
      mesas,
      comandas,
      fornecedores,
      usuarios,
      categorias,
      menus,
      ordenCompra
    ] = await Promise.all([
      prisma.produto.count({ where: { restauranteId } }),
      prisma.mesa.count({ where: { restauranteId } }),
      prisma.comanda.count({ where: { restauranteId } }),
      prisma.fornecedor.count({ where: { restauranteId } }),
      prisma.usuario.count({ where: { restauranteId } }),
      prisma.categoria.count({ where: { restauranteId } }),
      prisma.menu.count({ where: { restauranteId } }),
      prisma.ordemCompra.count({ where: { restauranteId } })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        produtos,
        mesas,
        comandas,
        fornecedores,
        usuarios,
        categorias,
        menus,
        ordenCompra
      }
    });

  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}