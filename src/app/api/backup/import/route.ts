import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dadosBackup, restauranteId } = body;

    if (!dadosBackup || !restauranteId) {
      return NextResponse.json(
        { success: false, error: 'Dados do backup e ID do restaurante são obrigatórios' },
        { status: 400 }
      );
    }

    // Validar estrutura do backup
    if (!dadosBackup.versao || !dadosBackup.restaurante) {
      return NextResponse.json(
        { success: false, error: 'Formato de backup inválido' },
        { status: 400 }
      );
    }

    // Usar transação para garantir consistência
    await prisma.$transaction(async (tx) => {
      // 1. Limpar dados existentes (exceto restaurante base)
      await tx.movimentacaoEstoque.deleteMany({
        where: {
          produto: {
            restauranteId
          }
        }
      });

      await tx.logAuditoria.deleteMany({
        where: { restauranteId }
      });

      await tx.turnoFechamento.deleteMany({
        where: { restauranteId }
      });

      await tx.entrega.deleteMany({
        where: { restauranteId }
      });

      await tx.entregador.deleteMany({
        where: { restauranteId }
      });

      await tx.itemOrdemCompra.deleteMany({
        where: {
          ordemCompra: {
            restauranteId
          }
        }
      });

      await tx.ordemCompra.deleteMany({
        where: { restauranteId }
      });

      await tx.fornecedor.deleteMany({
        where: { restauranteId }
      });

      await tx.pagamento.deleteMany({
        where: {
          comanda: {
            restauranteId
          }
        }
      });

      await tx.variacaoSelecionada.deleteMany({
        where: {
          itemComanda: {
            comanda: {
              restauranteId
            }
          }
        }
      });

      await tx.itemComanda.deleteMany({
        where: {
          comanda: {
            restauranteId
          }
        }
      });

      await tx.comanda.deleteMany({
        where: { restauranteId }
      });

      await tx.menuProduto.deleteMany({
        where: {
          menu: {
            restauranteId
          }
        }
      });

      await tx.menu.deleteMany({
        where: { restauranteId }
      });

      await tx.precoPorCanal.deleteMany({
        where: {
          produto: {
            restauranteId
          }
        }
      });

      await tx.variacaoProduto.deleteMany({
        where: {
          produto: {
            restauranteId
          }
        }
      });

      await tx.ingredienteProduto.deleteMany({
        where: {
          produto: {
            restauranteId
          }
        }
      });

      await tx.produto.deleteMany({
        where: { restauranteId }
      });

      await tx.categoria.deleteMany({
        where: { restauranteId }
      });

      await tx.mesa.deleteMany({
        where: { restauranteId }
      });

      await tx.usuario.deleteMany({
        where: { restauranteId }
      });

      await tx.impostoConfig.deleteMany({
        where: { restauranteId }
      });

      await tx.horarioFuncionamento.deleteMany({
        where: { restauranteId }
      });

      // 2. Restaurar dados do backup
      const backup = dadosBackup.restaurante;

      // Restaurar configurações do restaurante
      await tx.restaurante.update({
        where: { id: restauranteId },
        data: {
          nome: backup.nome,
          endereco: backup.endereco,
          telefone: backup.telefone,
          email: backup.email,
          nuit: backup.nuit,
          inscricaoEstadual: backup.inscricaoEstadual,
          inscricaoMunicipal: backup.inscricaoMunicipal,
          taxaServico: backup.taxaServico,
          moeda: backup.moeda,
          fusoHorario: backup.fusoHorario
        }
      });

      // Restaurar impostos
      if (backup.impostos?.length > 0) {
        await tx.impostoConfig.createMany({
          data: backup.impostos.map((imposto: any) => ({
            ...imposto,
            id: undefined,
            restauranteId
          }))
        });
      }

      // Restaurar horários de funcionamento
      if (backup.horariosFuncionamento?.length > 0) {
        await tx.horarioFuncionamento.createMany({
          data: backup.horariosFuncionamento.map((horario: any) => ({
            ...horario,
            id: undefined,
            restauranteId
          }))
        });
      }

      // Restaurar usuários
      if (backup.usuarios?.length > 0) {
        await tx.usuario.createMany({
          data: backup.usuarios.map((usuario: any) => ({
            ...usuario,
            id: undefined,
            restauranteId
          }))
        });
      }

      // Restaurar mesas
      if (backup.mesas?.length > 0) {
        await tx.mesa.createMany({
          data: backup.mesas.map((mesa: any) => ({
            ...mesa,
            id: undefined,
            restauranteId
          }))
        });
      }

      // Restaurar categorias
      if (backup.categorias?.length > 0) {
        await tx.categoria.createMany({
          data: backup.categorias.map((categoria: any) => ({
            ...categoria,
            id: undefined,
            restauranteId
          }))
        });
      }

      // Restaurar produtos (mais complexo devido às relações)
      if (backup.produtos?.length > 0) {
        for (const produto of backup.produtos) {
          // Buscar categoria existente
          const categoria = await tx.categoria.findFirst({
            where: {
              nome: produto.categoria.nome,
              restauranteId
            }
          });

          // Buscar unidade de medida existente
          const unidadeMedida = await tx.unidadeMedida.findFirst({
            where: {
              sigla: produto.unidadeMedida.sigla
            }
          });

          if (categoria && unidadeMedida) {
            await tx.produto.create({
              data: {
                sku: produto.sku,
                nome: produto.nome,
                descricao: produto.descricao,
                imagem: produto.imagem,
                preco: produto.preco,
                custo: produto.custo,
                tempoPreparoMinutos: produto.tempoPreparoMinutos,
                disponivel: produto.disponivel,
                controlaEstoque: produto.controlaEstoque,
                categoriaId: categoria.id,
                unidadeMedidaId: unidadeMedida.id,
                restauranteId
              }
            });
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Backup restaurado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao importar backup:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor ao restaurar backup' },
      { status: 500 }
    );
  }
}