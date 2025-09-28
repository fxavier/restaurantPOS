import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandling, createErrorResponse } from '@/lib/api-routes';

export async function GET(request: NextRequest) {
	return withErrorHandling(async () => {
		const { searchParams } = new URL(request.url);
		const restauranteId = searchParams.get('restauranteId');
		const produtoId = searchParams.get('produtoId');

		if (produtoId) {
			// Get balance for specific product
			const saldo = await calculateProductBalance(produtoId);
			return saldo;
		} else {
			// Get balance for all products
			const where: any = {
				controlaEstoque: true,
			};

			// If restauranteId is provided, filter by it
			if (restauranteId) {
				where.restauranteId = restauranteId;
			}

			const produtos = await prisma.produto.findMany({
				where,
				select: {
					id: true,
					nome: true,
					sku: true,
				},
			});

			const saldos = await Promise.all(
				produtos.map(async (produto) => {
					const saldo = await calculateProductBalance(produto.id);
					return {
						produto,
						...saldo,
					};
				})
			);

			return saldos;
		}
	});
}

async function calculateProductBalance(produtoId: string) {
	const movimentacoes = await prisma.movimentacaoEstoque.findMany({
		where: { produtoId },
		include: {
			unidadeMedida: {
				select: {
					sigla: true,
					fatorConversao: true,
				},
			},
		},
	});

	let saldoTotal = 0;
	let valorTotal = 0;
	let ultimaMovimentacao: Date | null = null;

	for (const mov of movimentacoes) {
		const quantidade = mov.quantidade * mov.unidadeMedida.fatorConversao;

		switch (mov.tipo) {
			case 'entrada':
				saldoTotal += quantidade;
				break;
			case 'saida':
			case 'perda':
				saldoTotal -= quantidade;
				break;
			case 'ajuste':
				saldoTotal = quantidade; // Ajuste substitui o saldo
				break;
			case 'transferencia':
				// Para transferências, considerar entrada ou saída baseado no sinal
				saldoTotal += quantidade;
				break;
		}

		if (mov.valorTotal) {
			valorTotal += mov.valorTotal;
		}

		if (!ultimaMovimentacao || mov.criadaEm > ultimaMovimentacao) {
			ultimaMovimentacao = mov.criadaEm;
		}
	}

	return {
		saldoAtual: saldoTotal,
		valorEstoque: valorTotal,
		ultimaMovimentacao,
		totalMovimentacoes: movimentacoes.length,
	};
}
