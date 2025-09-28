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
	const ativa = searchParams.get('ativa');
	const search = searchParams.get('search');

	const where: any = {};

	// If restauranteId is provided, filter by it. Otherwise, return all categories
	if (restauranteId) {
		where.restauranteId = restauranteId;
	}

	if (ativa !== null) {
		where.ativa = ativa === 'true';
	}

	// Add search functionality
	if (search) {
		where.OR = [
			{ nome: { contains: search, mode: 'insensitive' } },
			{ descricao: { contains: search, mode: 'insensitive' } },
		];
	}

	try {
		// Get total count for pagination
		const total = await prisma.categoria.count({ where });

		// Get paginated data
		const categorias = await prisma.categoria.findMany({
			where,
			take: limit,
			skip: offset,
			orderBy: orderBy || { ordem: 'asc' },
			include: {
				_count: {
					select: {
						produtos: true,
					},
				},
			},
		});

		return createPaginatedResponse(categorias, total, page, limit);
	} catch (error) {
		console.error('Error fetching categories:', error);
		return createErrorResponse('Erro ao buscar categorias', 500);
	}
}

export async function POST(request: NextRequest) {
	return withErrorHandling(async () => {
		const body = await request.json();

		const requiredFields = ['nome', 'restauranteId'];
		const missingFields = validateRequiredFields(body, requiredFields);

		if (missingFields.length > 0) {
			return createErrorResponse(
				`Campos obrigatórios ausentes: ${missingFields.join(', ')}`,
				400
			);
		}

		// Get next order number if not provided
		let ordem = body.ordem;
		if (ordem === undefined) {
			const lastCategoria = await prisma.categoria.findFirst({
				where: { restauranteId: body.restauranteId },
				orderBy: { ordem: 'desc' },
			});
			ordem = (lastCategoria?.ordem || 0) + 1;
		}

		const categoria = await prisma.categoria.create({
			data: {
				nome: body.nome,
				descricao: body.descricao,
				cor: body.cor || '#3B82F6',
				icone: body.icone,
				ordem,
				ativa: body.ativa ?? true,
				restauranteId: body.restauranteId,
			},
		});

		return categoria;
	});
}
