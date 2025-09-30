'use client';

import { useState, useEffect } from 'react';
import LayoutPrincipal from '@/components/layout/layout-principal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import DataPagination from '@/components/ui/data-pagination';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import {
	Package,
	Plus,
	Minus,
	AlertTriangle,
	TrendingUp,
	TrendingDown,
	Search,
	Filter,
	Download,
	Upload,
	RotateCcw,
	ArrowUpDown,
	Eye,
	Edit,
} from 'lucide-react';
import {
	Produto,
	MovimentacaoEstoque,
	TipoMovimentacao,
	Categoria,
} from '@/types/sistema-restaurante';

interface EstoqueProduto extends Produto {
	quantidadeAtual: number;
	quantidadeMinima: number;
	quantidadeMaxima: number;
	valorEstoque: number;
	ultimaMovimentacao?: string;
}

export default function PaginaEstoque() {
	const [produtos, setProdutos] = useState<EstoqueProduto[]>([]);
	const [movimentacoes, setMovimentacoes] = useState<MovimentacaoEstoque[]>([]);
	const [categorias, setCategorias] = useState<Categoria[]>([]);
	const [produtoSelecionado, setProdutoSelecionado] =
		useState<EstoqueProduto | null>(null);
	const [dialogoMovimentacaoAberto, setDialogoMovimentacaoAberto] =
		useState(false);
	const [dialogoDetalhesAberto, setDialogoDetalhesAberto] = useState(false);
	const [busca, setBusca] = useState('');
	const [filtroStatus, setFiltroStatus] = useState<
		'todos' | 'baixo' | 'normal' | 'alto'
	>('todos');
	const [filtroCategoria, setFiltroCategoria] = useState<string>('todas');
	const [carregando, setCarregando] = useState(true);

	// Pagination state
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(20);
	const [totalPages, setTotalPages] = useState(0);
	const [totalItems, setTotalItems] = useState(0);

	// TODO: Replace with actual restaurant ID from session/context
	const RESTAURANT_ID = 'default-restaurant';

	// Formulário de movimentação
	const [tipoMovimentacao, setTipoMovimentacao] =
		useState<TipoMovimentacao>('entrada');
	const [quantidade, setQuantidade] = useState('');
	const [valorUnitario, setValorUnitario] = useState('');
	const [motivo, setMotivo] = useState('');
	const [documentoReferencia, setDocumentoReferencia] = useState('');

	useEffect(() => {
		carregarDados();
	}, [currentPage, itemsPerPage, filtroCategoria, filtroStatus]);

	// Debounced search effect
	useEffect(() => {
		const timeoutId = setTimeout(() => {
			if (currentPage === 1) {
				carregarDados();
			} else {
				setCurrentPage(1);
			}
		}, 500);

		return () => clearTimeout(timeoutId);
	}, [busca]);

	const carregarDados = async () => {
		try {
			setCarregando(true);

			// Build query parameters
			const produtosParams = new URLSearchParams({
				page: currentPage.toString(),
				limit: itemsPerPage.toString(),
				restauranteId: RESTAURANT_ID,
			});

			if (busca) {
				produtosParams.append('search', busca);
			}

			if (filtroCategoria !== 'todas') {
				produtosParams.append('categoriaId', filtroCategoria);
			}

			// Carregar produtos, saldos de estoque e categorias em paralelo
			const [
				produtosResponse,
				saldosResponse,
				categoriasResponse,
				movimentacoesResponse,
			] = await Promise.all([
				fetch(`/api/produtos?${produtosParams.toString()}`),
				fetch(`/api/estoque/saldo?restauranteId=${RESTAURANT_ID}`),
				fetch(`/api/categorias?restauranteId=${RESTAURANT_ID}`),
				fetch(`/api/estoque?restauranteId=${RESTAURANT_ID}&limit=100`),
			]);

			if (
				!produtosResponse.ok ||
				!saldosResponse.ok ||
				!categoriasResponse.ok ||
				!movimentacoesResponse.ok
			) {
				throw new Error('Erro ao carregar dados');
			}

			const produtosBrutos = await produtosResponse.json();
			const saldos = await saldosResponse.json();
			const categoriasData = await categoriasResponse.json();
			const movimentacoesData = await movimentacoesResponse.json();

			console.log('🔍 Debug - Resposta das APIs:');
			console.log('Produtos:', produtosBrutos);
			console.log('Saldos:', saldos);
			console.log('Categorias:', categoriasData);
			console.log('Movimentações:', movimentacoesData);

			// Extrair dados das respostas da API (que têm formato { success: true, data: [...] })
			const produtosArray = Array.isArray(produtosBrutos?.data)
				? produtosBrutos.data
				: Array.isArray(produtosBrutos)
				? produtosBrutos
				: [];

			const saldosArray = Array.isArray(saldos?.data)
				? saldos.data
				: Array.isArray(saldos)
				? saldos
				: [];

			const categoriasArray = Array.isArray(categoriasData?.data)
				? categoriasData.data
				: Array.isArray(categoriasData)
				? categoriasData
				: [];

			const movimentacoesArray = Array.isArray(movimentacoesData?.data)
				? movimentacoesData.data
				: Array.isArray(movimentacoesData)
				? movimentacoesData
				: [];

			// Set pagination info from products response
			if (produtosBrutos?.pagination) {
				setTotalPages(produtosBrutos.pagination.totalPages);
				setTotalItems(produtosBrutos.pagination.total);
			}

			// Filtrar apenas produtos que controlam estoque
			const produtosComEstoque = produtosArray
				.filter((produto: Produto) => produto.controlaEstoque)
				.map((produto: Produto) => {
					// Encontrar saldo correspondente
					const saldoInfo = saldosArray.find(
						(s: any) => s.produto?.id === produto.id
					);

					return {
						...produto,
						quantidadeAtual: Math.max(0, saldoInfo?.saldoAtual || 0),
						quantidadeMinima: 10, // TODO: Implementar configuração por produto
						quantidadeMaxima: 100, // TODO: Implementar configuração por produto
						valorEstoque: saldoInfo?.valorEstoque || 0,
						ultimaMovimentacao: saldoInfo?.ultimaMovimentacao,
					};
				});

			setProdutos(produtosComEstoque);
			setCategorias(categoriasArray);
			setMovimentacoes(movimentacoesArray);
		} catch (error) {
			console.error('Erro ao carregar dados do estoque:', error);
			toast.error('Erro ao carregar dados do estoque');
		} finally {
			setCarregando(false);
		}
	};

	const handlePageChange = (page: number) => {
		setCurrentPage(page);
	};

	const handleItemsPerPageChange = (itemsPerPage: number) => {
		setItemsPerPage(itemsPerPage);
		setCurrentPage(1); // Reset to first page when changing items per page
	};

	const limparFormulario = () => {
		setTipoMovimentacao('entrada');
		setQuantidade('');
		setValorUnitario('');
		setMotivo('');
		setDocumentoReferencia('');
	};

	const abrirDialogoMovimentacao = (produto: EstoqueProduto) => {
		setProdutoSelecionado(produto);
		setValorUnitario(produto.custo.toString());
		setDialogoMovimentacaoAberto(true);
	};

	const abrirDialogoDetalhes = (produto: EstoqueProduto) => {
		setProdutoSelecionado(produto);
		setDialogoDetalhesAberto(true);
	};

	const salvarMovimentacao = async () => {
		if (!produtoSelecionado || !quantidade || !motivo) {
			toast.error('Preencha todos os campos obrigatórios');
			return;
		}

		const quantidadeNum = parseInt(quantidade);
		const valorNum = parseFloat(valorUnitario) || 0;

		if (isNaN(quantidadeNum) || quantidadeNum <= 0) {
			toast.error('Quantidade deve ser um número válido');
			return;
		}

		// Verificar se há estoque suficiente para saída
		if (
			tipoMovimentacao === 'saida' &&
			quantidadeNum > produtoSelecionado.quantidadeAtual
		) {
			toast.error('Quantidade insuficiente em estoque');
			return;
		}

		try {
			// Buscar uma unidade de medida padrão (por enquanto)
			const unidadesResponse = await fetch(
				`/api/configuracoes/unidades-medida`
			);
			if (!unidadesResponse.ok) {
				throw new Error('Erro ao buscar unidades de medida');
			}
			const unidadesData = await unidadesResponse.json();
			const unidades = unidadesData.success ? unidadesData.data : unidadesData;
			const unidadePadrao =
				unidades.find((u: any) => u.nome === 'Unidade') || unidades[0];

			if (!unidadePadrao) {
				toast.error(
					'Nenhuma unidade de medida encontrada. Configure as unidades primeiro.'
				);
				return;
			}

			const novaMovimentacao = {
				produtoId: produtoSelecionado.id,
				tipo: tipoMovimentacao,
				quantidade:
					tipoMovimentacao === 'ajuste' ? quantidadeNum : quantidadeNum,
				valorUnitario: valorNum > 0 ? valorNum : undefined,
				valorTotal: valorNum > 0 ? valorNum * quantidadeNum : undefined,
				motivo,
				usuarioId: 'sistema-admin', // TODO: Pegar do usuário logado
				unidadeMedidaId: unidadePadrao.id,
				documentoReferencia: documentoReferencia || undefined,
			};

			const response = await fetch('/api/estoque', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(novaMovimentacao),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Erro ao salvar movimentação');
			}

			await carregarDados();
			setDialogoMovimentacaoAberto(false);
			limparFormulario();

			toast.success(
				`${
					tipoMovimentacao.charAt(0).toUpperCase() + tipoMovimentacao.slice(1)
				} registrada com sucesso`
			);
		} catch (error) {
			console.error('Erro ao salvar movimentação:', error);
			toast.error(
				error instanceof Error ? error.message : 'Erro ao salvar movimentação'
			);
		}
	};

	const obterStatusEstoque = (produto: EstoqueProduto) => {
		if (produto.quantidadeAtual <= produto.quantidadeMinima) return 'baixo';
		if (produto.quantidadeAtual >= produto.quantidadeMaxima) return 'alto';
		return 'normal';
	};

	const obterCorStatus = (status: string) => {
		switch (status) {
			case 'baixo':
				return 'bg-red-500';
			case 'alto':
				return 'bg-blue-500';
			default:
				return 'bg-green-500';
		}
	};

	const produtosFiltrados = produtos.filter((produto) => {
		const correspondeNome =
			produto.nome.toLowerCase().includes(busca.toLowerCase()) ||
			produto.sku.toLowerCase().includes(busca.toLowerCase());
		const status = obterStatusEstoque(produto);
		const correspondeStatus =
			filtroStatus === 'todos' || status === filtroStatus;
		const correspondeCategoria =
			filtroCategoria === 'todas' || produto.categoriaId === filtroCategoria;

		return correspondeNome && correspondeStatus && correspondeCategoria;
	});

	const estatisticas = {
		totalProdutos: produtos.length,
		produtosBaixoEstoque: produtos.filter(
			(p) => obterStatusEstoque(p) === 'baixo'
		).length,
		valorTotalEstoque: produtos.reduce((total, p) => total + p.valorEstoque, 0),
		movimentacoesHoje: movimentacoes.filter((m) => {
			const hoje = new Date().toDateString();
			const dataMovimentacao = new Date(m.criadaEm).toDateString();
			return dataMovimentacao === hoje;
		}).length,
	};

	const obterMovimentacoesProduto = (produtoId: string) => {
		return movimentacoes
			.filter((m) => m.produtoId === produtoId)
			.sort(
				(a, b) =>
					new Date(b.criadaEm).getTime() - new Date(a.criadaEm).getTime()
			)
			.slice(0, 10);
	};

	return (
		<LayoutPrincipal titulo='Gestão de Inventário e Stock'>
			<div className='space-y-6'>
				{/* Estatísticas */}
				<div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
					<Card>
						<CardContent className='p-4'>
							<div className='flex items-center space-x-2'>
								<Package className='h-5 w-5 text-blue-500' />
								<div>
									<p className='text-sm text-muted-foreground'>
										Total de Produtos
									</p>
									<p className='text-2xl font-bold'>
										{estatisticas.totalProdutos}
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className='p-4'>
							<div className='flex items-center space-x-2'>
								<AlertTriangle className='h-5 w-5 text-red-500' />
								<div>
									<p className='text-sm text-muted-foreground'>Estoque Baixo</p>
									<p className='text-2xl font-bold'>
										{estatisticas.produtosBaixoEstoque}
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className='p-4'>
							<div className='flex items-center space-x-2'>
								<TrendingUp className='h-5 w-5 text-green-500' />
								<div>
									<p className='text-sm text-muted-foreground'>
										Valor do Estoque
									</p>
									<p className='text-2xl font-bold'>
										MT {estatisticas.valorTotalEstoque.toFixed(2)}
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className='p-4'>
							<div className='flex items-center space-x-2'>
								<ArrowUpDown className='h-5 w-5 text-purple-500' />
								<div>
									<p className='text-sm text-muted-foreground'>
										Movimentações Hoje
									</p>
									<p className='text-2xl font-bold'>
										{estatisticas.movimentacoesHoje}
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Filtros */}
				<Card>
					<CardContent className='p-4'>
						<div className='flex flex-col lg:flex-row gap-4 items-center'>
							<div className='relative flex-1'>
								<Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4' />
								<Input
									placeholder='Buscar produto por nome ou SKU...'
									value={busca}
									onChange={(e) => setBusca(e.target.value)}
									className='pl-10'
								/>
							</div>

							<Select
								value={filtroStatus}
								onValueChange={(value: any) => setFiltroStatus(value)}
							>
								<SelectTrigger className='w-full lg:w-48'>
									<SelectValue placeholder='Status do Estoque' />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='todos'>Todos os Status</SelectItem>
									<SelectItem value='baixo'>Estoque Baixo</SelectItem>
									<SelectItem value='normal'>Estoque Normal</SelectItem>
									<SelectItem value='alto'>Estoque Alto</SelectItem>
								</SelectContent>
							</Select>

							<Select
								value={filtroCategoria}
								onValueChange={setFiltroCategoria}
							>
								<SelectTrigger className='w-full lg:w-48'>
									<SelectValue placeholder='Categoria' />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='todas'>Todas as Categorias</SelectItem>
									{categorias.map((categoria) => (
										<SelectItem key={categoria.id} value={categoria.id}>
											{categoria.nome}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</CardContent>
				</Card>

				{/* Tabela de Produtos */}
				<Card>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Produto</TableHead>
								<TableHead>SKU</TableHead>
								<TableHead>Estoque Atual</TableHead>
								<TableHead>Estoque Mín/Máx</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Valor Unitário</TableHead>
								<TableHead>Valor Total</TableHead>
								<TableHead>Última Movimentação</TableHead>
								<TableHead>Ações</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{produtosFiltrados.map((produto) => {
								const status = obterStatusEstoque(produto);

								return (
									<TableRow key={produto.id}>
										<TableCell>
											<div>
												<p className='font-medium'>{produto.nome}</p>
												{produto.descricao && (
													<p className='text-xs text-muted-foreground line-clamp-1'>
														{produto.descricao}
													</p>
												)}
											</div>
										</TableCell>
										<TableCell className='font-mono text-sm'>
											{produto.sku}
										</TableCell>
										<TableCell>
											<span className='font-bold text-lg'>
												{produto.quantidadeAtual}
											</span>
										</TableCell>
										<TableCell>
											<div className='text-sm'>
												<p>Mín: {produto.quantidadeMinima}</p>
												<p>Máx: {produto.quantidadeMaxima}</p>
											</div>
										</TableCell>
										<TableCell>
											<Badge className={`${obterCorStatus(status)} text-white`}>
												{status === 'baixo' && 'Estoque Baixo'}
												{status === 'normal' && 'Normal'}
												{status === 'alto' && 'Estoque Alto'}
											</Badge>
										</TableCell>
										<TableCell>MT {produto.custo.toFixed(2)}</TableCell>
										<TableCell className='font-bold'>
											MT {produto.valorEstoque.toFixed(2)}
										</TableCell>
										<TableCell>
											{produto.ultimaMovimentacao ? (
												<div className='text-sm'>
													<p>
														{new Date(
															produto.ultimaMovimentacao
														).toLocaleDateString('pt-PT')}
													</p>
													<p className='text-xs text-muted-foreground'>
														{new Date(
															produto.ultimaMovimentacao
														).toLocaleTimeString('pt-PT', {
															hour: '2-digit',
															minute: '2-digit',
														})}
													</p>
												</div>
											) : (
												<span className='text-muted-foreground'>Nunca</span>
											)}
										</TableCell>
										<TableCell>
											<div className='flex space-x-1'>
												<Button
													size='sm'
													variant='outline'
													onClick={() => abrirDialogoDetalhes(produto)}
												>
													<Eye className='w-3 h-3' />
												</Button>
												<Button
													size='sm'
													onClick={() => abrirDialogoMovimentacao(produto)}
												>
													<ArrowUpDown className='w-3 h-3' />
												</Button>
											</div>
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				</Card>

				{carregando && (
					<Card>
						<CardContent className='p-8 text-center'>
							<div className='flex flex-col items-center space-y-4'>
								<div className='w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin'></div>
								<p className='text-muted-foreground'>
									Carregando dados do estoque...
								</p>
							</div>
						</CardContent>
					</Card>
				)}

				{!carregando &&
					produtosFiltrados.length === 0 &&
					produtos.length === 0 && (
						<Card>
							<CardContent className='p-8 text-center'>
								<Package className='w-12 h-12 mx-auto mb-4 text-muted-foreground' />
								<p className='text-muted-foreground mb-4'>
									Nenhum produto configurado para controle de estoque.
								</p>
								<p className='text-sm text-muted-foreground'>
									Configure produtos para controlar estoque na página de
									Produtos.
								</p>
							</CardContent>
						</Card>
					)}

				{!carregando &&
					produtosFiltrados.length === 0 &&
					produtos.length > 0 && (
						<Card>
							<CardContent className='p-8 text-center'>
								<Package className='w-12 h-12 mx-auto mb-4 text-muted-foreground' />
								<p className='text-muted-foreground'>
									Nenhum produto encontrado com os filtros aplicados.
								</p>
							</CardContent>
						</Card>
					)}

				{/* Paginação */}
				{!carregando && totalItems > 0 && (
					<DataPagination
						currentPage={currentPage}
						totalPages={totalPages}
						totalItems={totalItems}
						itemsPerPage={itemsPerPage}
						onPageChange={handlePageChange}
						onItemsPerPageChange={handleItemsPerPageChange}
						isLoading={carregando}
					/>
				)}

				{/* Dialog de Movimentação */}
				<Dialog
					open={dialogoMovimentacaoAberto}
					onOpenChange={setDialogoMovimentacaoAberto}
				>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>
								Movimentação de Estoque - {produtoSelecionado?.nome}
							</DialogTitle>
						</DialogHeader>

						<div className='space-y-4'>
							<div className='bg-muted p-3 rounded-lg'>
								<p className='text-sm text-muted-foreground'>Estoque Atual</p>
								<p className='text-2xl font-bold'>
									{produtoSelecionado?.quantidadeAtual} unidades
								</p>
							</div>

							<div>
								<Label htmlFor='tipo'>Tipo de Movimentação</Label>
								<Select
									value={tipoMovimentacao}
									onValueChange={(value: TipoMovimentacao) =>
										setTipoMovimentacao(value)
									}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value='entrada'>Entrada</SelectItem>
										<SelectItem value='saida'>Saída</SelectItem>
										<SelectItem value='ajuste'>Ajuste</SelectItem>
										<SelectItem value='transferencia'>Transferência</SelectItem>
										<SelectItem value='perda'>Perda</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className='grid grid-cols-2 gap-4'>
								<div>
									<Label htmlFor='quantidade'>
										{tipoMovimentacao === 'ajuste'
											? 'Nova Quantidade'
											: 'Quantidade'}
									</Label>
									<Input
										id='quantidade'
										type='number'
										value={quantidade}
										onChange={(e) => setQuantidade(e.target.value)}
										placeholder='0'
										min='0'
									/>
								</div>

								<div>
									<Label htmlFor='valor'>Valor Unitário</Label>
									<Input
										id='valor'
										type='number'
										step='0.01'
										value={valorUnitario}
										onChange={(e) => setValorUnitario(e.target.value)}
										placeholder='0.00'
										min='0'
									/>
								</div>
							</div>

							<div>
								<Label htmlFor='motivo'>Motivo</Label>
								<Textarea
									id='motivo'
									value={motivo}
									onChange={(e) => setMotivo(e.target.value)}
									placeholder='Descreva o motivo da movimentação...'
									rows={3}
								/>
							</div>

							<div>
								<Label htmlFor='documento'>
									Documento de Referência (opcional)
								</Label>
								<Input
									id='documento'
									value={documentoReferencia}
									onChange={(e) => setDocumentoReferencia(e.target.value)}
									placeholder='Ex: NF-001, OC-123'
								/>
							</div>

							<div className='flex space-x-2'>
								<Button
									variant='outline'
									className='flex-1'
									onClick={() => {
										setDialogoMovimentacaoAberto(false);
										limparFormulario();
									}}
								>
									Cancelar
								</Button>
								<Button className='flex-1' onClick={salvarMovimentacao}>
									Registrar Movimentação
								</Button>
							</div>
						</div>
					</DialogContent>
				</Dialog>

				{/* Dialog de Detalhes */}
				<Dialog
					open={dialogoDetalhesAberto}
					onOpenChange={setDialogoDetalhesAberto}
				>
					<DialogContent className='max-w-2xl'>
						<DialogHeader>
							<DialogTitle>
								Detalhes do Estoque - {produtoSelecionado?.nome}
							</DialogTitle>
						</DialogHeader>

						{produtoSelecionado && (
							<div className='space-y-6'>
								{/* Informações do Produto */}
								<div className='grid grid-cols-2 gap-4'>
									<div>
										<h3 className='font-medium mb-2'>Informações do Produto</h3>
										<div className='space-y-1 text-sm'>
											<div className='flex justify-between'>
												<span>SKU:</span>
												<span className='font-medium'>
													{produtoSelecionado.sku}
												</span>
											</div>
											<div className='flex justify-between'>
												<span>Nome:</span>
												<span className='font-medium'>
													{produtoSelecionado.nome}
												</span>
											</div>
											<div className='flex justify-between'>
												<span>Custo Unitário:</span>
												<span>MT {produtoSelecionado.custo.toFixed(2)}</span>
											</div>
										</div>
									</div>

									<div>
										<h3 className='font-medium mb-2'>Status do Estoque</h3>
										<div className='space-y-1 text-sm'>
											<div className='flex justify-between'>
												<span>Quantidade Atual:</span>
												<span className='font-bold text-lg'>
													{produtoSelecionado.quantidadeAtual}
												</span>
											</div>
											<div className='flex justify-between'>
												<span>Estoque Mínimo:</span>
												<span>{produtoSelecionado.quantidadeMinima}</span>
											</div>
											<div className='flex justify-between'>
												<span>Estoque Máximo:</span>
												<span>{produtoSelecionado.quantidadeMaxima}</span>
											</div>
											<div className='flex justify-between'>
												<span>Valor Total:</span>
												<span className='font-bold'>
													MT {produtoSelecionado.valorEstoque.toFixed(2)}
												</span>
											</div>
										</div>
									</div>
								</div>

								{/* Histórico de Movimentações */}
								<div>
									<h3 className='font-medium mb-2'>Últimas Movimentações</h3>
									<div className='max-h-64 overflow-y-auto'>
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead>Data</TableHead>
													<TableHead>Tipo</TableHead>
													<TableHead>Quantidade</TableHead>
													<TableHead>Motivo</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{obterMovimentacoesProduto(produtoSelecionado.id).map(
													(movimentacao) => (
														<TableRow key={movimentacao.id}>
															<TableCell>
																<div className='text-sm'>
																	<p>
																		{new Date(
																			movimentacao.criadaEm
																		).toLocaleDateString('pt-PT')}
																	</p>
																	<p className='text-xs text-muted-foreground'>
																		{new Date(
																			movimentacao.criadaEm
																		).toLocaleTimeString('pt-PT', {
																			hour: '2-digit',
																			minute: '2-digit',
																		})}
																	</p>
																</div>
															</TableCell>
															<TableCell>
																<Badge variant='outline' className='capitalize'>
																	{movimentacao.tipo}
																</Badge>
															</TableCell>
															<TableCell>
																<span
																	className={`font-medium ${
																		movimentacao.tipo === 'entrada'
																			? 'text-green-600'
																			: movimentacao.tipo === 'saida'
																			? 'text-red-600'
																			: 'text-blue-600'
																	}`}
																>
																	{movimentacao.tipo === 'entrada'
																		? '+'
																		: movimentacao.tipo === 'saida'
																		? '-'
																		: ''}
																	{movimentacao.quantidade}
																</span>
															</TableCell>
															<TableCell className='text-sm'>
																{movimentacao.motivo}
															</TableCell>
														</TableRow>
													)
												)}
											</TableBody>
										</Table>
									</div>
								</div>
							</div>
						)}
					</DialogContent>
				</Dialog>
			</div>
		</LayoutPrincipal>
	);
}
