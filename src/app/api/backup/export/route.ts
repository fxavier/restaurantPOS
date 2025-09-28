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

    // Buscar todos os dados do restaurante
    const restaurante = await prisma.restaurante.findUnique({
      where: { id: restauranteId },
      include: {
        usuarios: {
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
            atualizadoEm: true
          }
        },
        mesas: true,
        categorias: true,
        produtos: {
          include: {
            categoria: true,
            unidadeMedida: true,
            ingredientes: {
              include: {
                ingrediente: true,
                unidadeMedida: true
              }
            },
            variacoes: true,
            precosPorCanal: true
          }
        },
        menus: {
          include: {
            produtos: {
              include: {
                produto: true
              }
            }
          }
        },
        comandas: {
          include: {
            mesa: true,
            garcom: {
              select: {
                id: true,
                nome: true,
                email: true
              }
            },
            itens: {
              include: {
                produto: true,
                variacoes: true
              }
            },
            pagamentos: true
          }
        },
        fornecedores: true,
        ordensCompra: {
          include: {
            fornecedor: true,
            usuario: {
              select: {
                id: true,
                nome: true,
                email: true
              }
            },
            itens: {
              include: {
                produto: true,
                unidadeMedida: true
              }
            }
          }
        },
        entregas: {
          include: {
            comanda: true
          }
        },
        entregadores: true,
        logsAuditoria: {
          include: {
            usuario: {
              select: {
                id: true,
                nome: true,
                email: true
              }
            }
          }
        },
        turnosFechamento: {
          include: {
            usuario: {
              select: {
                id: true,
                nome: true,
                email: true
              }
            }
          }
        },
        impostos: true,
        horariosFuncionamento: true
      }
    });

    if (!restaurante) {
      return NextResponse.json(
        { success: false, error: 'Restaurante não encontrado' },
        { status: 404 }
      );
    }

    // Buscar unidades de medida (dados globais)
    const unidadesMedida = await prisma.unidadeMedida.findMany();

    // Buscar movimentações de estoque
    const movimentacoesEstoque = await prisma.movimentacaoEstoque.findMany({
      where: {
        produto: {
          restauranteId
        }
      },
      include: {
        produto: true,
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        },
        unidadeMedida: true
      }
    });

    const dadosBackup = {
      versao: '1.0.0',
      dataExportacao: new Date().toISOString(),
      restaurante,
      unidadesMedida,
      movimentacoesEstoque,
      metadados: {
        totalProdutos: restaurante.produtos.length,
        totalMesas: restaurante.mesas.length,
        totalComandas: restaurante.comandas.length,
        totalFornecedores: restaurante.fornecedores.length,
        totalUsuarios: restaurante.usuarios.length
      }
    };

    return NextResponse.json({
      success: true,
      data: dadosBackup
    });

  } catch (error) {
    console.error('Erro ao exportar dados:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}