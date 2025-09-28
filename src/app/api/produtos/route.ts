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
	const categoriaId = searchParams.get('categoriaId');
	const disponivel = searchParams.get('disponivel');
	const search = searchParams.get('search');

	const where: any = {};

	// If restauranteId is provided, filter by it. Otherwise, return all products
	if (restauranteId) {
		where.restauranteId = restauranteId;
	}

	if (categoriaId) {
		where.categoriaId = categoriaId;
	}

	if (disponivel !== null) {
		where.disponivel = disponivel === 'true';
	}

	// Add search functionality
	if (search) {
		where.OR = [
			{ nome: { contains: search, mode: 'insensitive' } },
			{ sku: { contains: search, mode: 'insensitive' } },
			{ descricao: { contains: search, mode: 'insensitive' } },
		];
	}

	try {
		// Get total count for pagination
		const total = await prisma.produto.count({ where });

		// Get paginated data
		const produtos = await prisma.produto.findMany({
			where,
			take: limit,
			skip: offset,
			orderBy: orderBy || { nome: 'asc' },
			include: {
				categoria: true,
				unidadeMedida: true,
				variacoes: true,
				precosPorCanal: true,
				_count: {
					select: {
						ingredientes: true,
					},
				},
			},
		});

		return createPaginatedResponse(produtos, total, page, limit);
	} catch (error) {
		console.error('Error fetching products:', error);
		return createErrorResponse('Erro ao buscar produtos', 500);
	}
}

export async function POST(request: NextRequest) {
	return withErrorHandling(async () => {
		const body = await request.json();

		const requiredFields = [
			'sku',
			'nome',
			'preco',
			'categoriaId',
			'restauranteId',
		];
		const missingFields = validateRequiredFields(body, requiredFields);

		if (missingFields.length > 0) {
			return createErrorResponse(
				`Campos obrigatórios ausentes: ${missingFields.join(', ')}`,
				400
			);
		}

		// Ensure default unit of measure exists
		let unidadeMedidaId = body.unidadeMedidaId;
		if (!unidadeMedidaId) {
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

		const produto = await prisma.produto.create({
			data: {
				sku: body.sku,
				nome: body.nome,
				descricao: body.descricao,
				imagem: body.imagem,
				preco: body.preco,
				custo: body.custo || 0,
				tempoPreparoMinutos: body.tempoPreparoMinutos,
				disponivel: body.disponivel ?? true,
				controlaEstoque: body.controlaEstoque ?? false,
				categoriaId: body.categoriaId,
				unidadeMedidaId: unidadeMedidaId,
				restauranteId: body.restauranteId,
			},
			include: {
				categoria: true,
				unidadeMedida: true,
			},
		});

		return produto;
	});
}
