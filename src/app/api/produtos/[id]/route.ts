import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandling, createErrorResponse } from '@/lib/api-routes';

interface RouteParams {
	params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
	return withErrorHandling(async () => {
		const { id } = await params;

		const produto = await prisma.produto.findUnique({
			where: { id },
			include: {
				categoria: true,
				unidadeMedida: true,
				variacoes: true,
				precosPorCanal: true,
				ingredientes: {
					include: {
						ingrediente: true,
						unidadeMedida: true,
					},
				},
				_count: {
					select: {
						itensComanda: true,
						movimentacoesEstoque: true,
					},
				},
			},
		});

		if (!produto) {
			return createErrorResponse('Produto não encontrado', 404);
		}

		return produto;
	});
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
	return withErrorHandling(async () => {
		const { id } = await params;
		const body = await request.json();

		// Ensure default unit of measure exists if not provided
		let unidadeMedidaId = body.unidadeMedidaId;
		if (!unidadeMedidaId || unidadeMedidaId === '') {
			// Check if default unit exists
			let defaultUnit = await prisma.unidadeMedida.findUnique({
				where: { sigla: 'un' },
			});

			// Create if doesn't exist
			if (!defaultUnit) {
				defaultUnit = await prisma.unidadeMedida.create({
					data: {
						nome: 'Unidade',
						sigla: 'un',
						tipo: 'unidade',
						fatorConversao: 1.0,
					},
				});
			}

			unidadeMedidaId = defaultUnit.id;
		}

		const produto = await prisma.produto.update({
			where: { id },
			data: {
				sku: body.sku,
				nome: body.nome,
				descricao: body.descricao,
				imagem: body.imagem,
				preco: body.preco,
				custo: body.custo,
				tempoPreparoMinutos: body.tempoPreparoMinutos,
				disponivel: body.disponivel,
				controlaEstoque: body.controlaEstoque,
				categoriaId: body.categoriaId,
				unidadeMedidaId: unidadeMedidaId,
			},
			include: {
				categoria: true,
				unidadeMedida: true,
				variacoes: true,
			},
		});

		return produto;
	});
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
	return withErrorHandling(async () => {
		const { id } = await params;

		// Check if product has any order items or stock movements
		const produto = await prisma.produto.findUnique({
			where: { id },
			include: {
				_count: {
					select: {
						itensComanda: true,
						movimentacoesEstoque: true,
					},
				},
			},
		});

		if (!produto) {
			return createErrorResponse('Produto não encontrado', 404);
		}

		if (
			produto._count.itensComanda > 0 ||
			produto._count.movimentacoesEstoque > 0
		) {
			return createErrorResponse(
				'Não é possível excluir produto que possui movimentações ou itens em comandas',
				400
			);
		}

		await prisma.produto.delete({
			where: { id },
		});

		return { message: 'Produto excluído com sucesso' };
	});
}
