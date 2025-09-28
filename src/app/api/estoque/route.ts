import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
	withErrorHandling,
	createErrorResponse,
	getPaginationParams,
	createPaginatedResponse,
	validateRequiredFields,
} from '@/lib/api-routes';

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const { page, limit, offset, orderBy } = await getPaginationParams(request);
	const restauranteId = searchParams.get('restauranteId');
	const produtoId = searchParams.get('produtoId');
	const tipo = searchParams.get('tipo');
	const dataInicio = searchParams.get('dataInicio');
	const dataFim = searchParams.get('dataFim');
	const search = searchParams.get('search');

	const where: any = {};

	// If restauranteId is provided, filter by it. Otherwise, return all
	if (restauranteId) {
		where.produto = {
			restauranteId,
		};
	}

	if (produtoId) {
		where.produtoId = produtoId;
	}

	if (tipo) {
		where.tipo = tipo;
	}

	if (dataInicio || dataFim) {
		where.criadaEm = {};
		if (dataInicio) {
			where.criadaEm.gte = new Date(dataInicio);
		}
		if (dataFim) {
			where.criadaEm.lte = new Date(dataFim);
		}
	}

	// Add search functionality
	if (search) {
		where.OR = [
			{ motivo: { contains: search, mode: 'insensitive' } },
			{ documentoReferencia: { contains: search, mode: 'insensitive' } },
			{ produto: { nome: { contains: search, mode: 'insensitive' } } },
			{ produto: { sku: { contains: search, mode: 'insensitive' } } }
		];
	}

	try {
		// Get total count for pagination
		const total = await prisma.movimentacaoEstoque.count({ where });

		// Get paginated data
		const movimentacoes = await prisma.movimentacaoEstoque.findMany({
			where,
			take: limit,
			skip: offset,
			orderBy: orderBy || { criadaEm: 'desc' },
			include: {
				produto: {
					select: {
						id: true,
						nome: true,
						sku: true,
					},
				},
				usuario: {
					select: {
						id: true,
						nome: true,
					},
				},
				unidadeMedida: {
					select: {
						id: true,
						nome: true,
						sigla: true,
					},
				},
			},
		});

		return createPaginatedResponse(movimentacoes, total, page, limit);
	} catch (error) {
		console.error('Error fetching stock movements:', error);
		return createErrorResponse('Erro ao buscar movimentações de estoque', 500);
	}
}

export async function POST(request: NextRequest) {
	return withErrorHandling(async () => {
		const body = await request.json();

		const requiredFields = [
			'produtoId',
			'tipo',
			'quantidade',
			'motivo',
			'usuarioId',
			'unidadeMedidaId',
		];
		const missingFields = validateRequiredFields(body, requiredFields);

		if (missingFields.length > 0) {
			return createErrorResponse(
				`Campos obrigatórios ausentes: ${missingFields.join(', ')}`,
				400
			);
		}

		// Verify that the product belongs to a valid restaurant
		const produto = await prisma.produto.findUnique({
			where: { id: body.produtoId },
			select: {
				id: true,
				nome: true,
				controlaEstoque: true,
				restauranteId: true,
			},
		});

		if (!produto) {
			return createErrorResponse('Produto não encontrado', 404);
		}

		// Handle system user - create if doesn't exist and userId is 'sistema-admin'
		let finalUserId = body.usuarioId;
		if (body.usuarioId === 'sistema-admin') {
			const existingUser = await prisma.usuario.findUnique({
				where: { id: 'sistema-admin' },
			});

			if (!existingUser) {
				try {
					await prisma.usuario.create({
						data: {
							id: 'sistema-admin',
							nome: 'Sistema Admin',
							email: 'admin@sistema.com',
							perfil: 'admin',
							ativo: true,
							restauranteId: produto.restauranteId,
						},
					});
				} catch (error) {
					// User might already exist, ignore error
					console.log('Sistema admin user creation attempted');
				}
			}
		}

		const movimentacao = await prisma.movimentacaoEstoque.create({
			data: {
				produtoId: body.produtoId,
				tipo: body.tipo,
				quantidade: body.quantidade,
				valorUnitario: body.valorUnitario,
				valorTotal:
					body.valorTotal ||
					(body.valorUnitario ? body.valorUnitario * body.quantidade : null),
				motivo: body.motivo,
				documentoReferencia: body.documentoReferencia,
				usuarioId: body.usuarioId,
				unidadeMedidaId: body.unidadeMedidaId,
			},
			include: {
				produto: {
					select: {
						id: true,
						nome: true,
						sku: true,
					},
				},
				usuario: {
					select: {
						id: true,
						nome: true,
					},
				},
				unidadeMedida: {
					select: {
						id: true,
						nome: true,
						sigla: true,
					},
				},
			},
		});

		return movimentacao;
	});
}
