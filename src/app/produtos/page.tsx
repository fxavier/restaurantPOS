'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
	Plus,
	Edit,
	Trash2,
	Search,
	Package,
	DollarSign,
	Clock,
	Eye,
	EyeOff,
	Filter,
	Download,
	Upload,
	ImageIcon,
	X,
} from 'lucide-react';
import Image from 'next/image';
import { apiDataService } from '@/lib/api-data-service';
import {
	Produto,
	Categoria,
	CanalVenda,
	VariacaoProduto,
	PrecoPorCanal,
} from '@/types/sistema-restaurante';
import { uploadService } from '@/lib/upload-service';

export default function PaginaProdutos() {
	const [produtos, setProdutos] = useState<Produto[]>([]);
	const [categorias, setCategorias] = useState<Categoria[]>([]);
	const [produtoEditando, setProdutoEditando] = useState<Produto | null>(null);
	const [dialogoAberto, setDialogoAberto] = useState(false);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [visualizacao, setVisualizacao] = useState<'grid' | 'tabela'>('grid');
	const [busca, setBusca] = useState('');
	const [filtroCategoria, setFiltroCategoria] = useState<string>('todas');
	const [filtroDisponibilidade, setFiltroDisponibilidade] = useState<
		'todos' | 'disponivel' | 'indisponivel'
	>('todos');

	// Pagination state
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(20);
	const [totalPages, setTotalPages] = useState(0);
	const [totalItems, setTotalItems] = useState(0);

	// Formulário
	const [sku, setSku] = useState('');
	const [nome, setNome] = useState('');
	const [descricao, setDescricao] = useState('');
	const [categoriaId, setCategoriaId] = useState('');
	const [preco, setPreco] = useState('');
	const [custo, setCusto] = useState('');
	const [tempoPreparoMinutos, setTempoPreparoMinutos] = useState('');
	const [disponivel, setDisponivel] = useState(true);
	const [controlaEstoque, setControlaEstoque] = useState(false);
	const [variacoes, setVariacoes] = useState<VariacaoProduto[]>([]);
	const [precosPorCanal, setPrecosPorCanal] = useState<PrecoPorCanal[]>([
		{ canal: 'balcao', preco: 0 },
		{ canal: 'takeaway', preco: 0 },
		{ canal: 'delivery', preco: 0 },
	]);
	const [imagemFile, setImagemFile] = useState<File | null>(null);
	const [imagemPreview, setImagemPreview] = useState<string>('');
	const [imagemUrl, setImagemUrl] = useState<string>('');
	const [isUploading, setIsUploading] = useState(false);

	useEffect(() => {
		carregarCategorias();
	}, []);

	useEffect(() => {
		carregarProdutos();
	}, [currentPage, itemsPerPage, filtroCategoria, filtroDisponibilidade]);

	// Debounced search effect
	useEffect(() => {
		const timeoutId = setTimeout(() => {
			if (currentPage === 1) {
				carregarProdutos();
			} else {
				setCurrentPage(1);
			}
		}, 500);

		return () => clearTimeout(timeoutId);
	}, [busca]);

	const carregarCategorias = async () => {
		try {
			// TODO: Replace with actual restaurant ID from session/context
			const restauranteId = 'cmg3w1utw005j2gzkrott9zul';
			const categoriasData = await apiDataService.obterCategorias(
				restauranteId
			);
			setCategorias((categoriasData || []).filter((c) => c.ativa));
		} catch (error) {
			console.error('Erro ao carregar categorias:', error);
			toast.error('Erro ao carregar categorias');
		}
	};

	const carregarProdutos = async () => {
		try {
			setLoading(true);
			// TODO: Replace with actual restaurant ID from session/context
			const restauranteId = 'cmg3w1utw005j2gzkrott9zul';

			// Build query parameters
			const params = new URLSearchParams({
				page: currentPage.toString(),
				limit: itemsPerPage.toString(),
				restauranteId,
			});

			if (busca) {
				params.append('search', busca);
			}

			if (filtroCategoria !== 'todas') {
				params.append('categoriaId', filtroCategoria);
			}

			if (filtroDisponibilidade !== 'todos') {
				params.append(
					'disponivel',
					filtroDisponibilidade === 'disponivel' ? 'true' : 'false'
				);
			}

			// Make API call with pagination
			const response = await fetch(`/api/produtos?${params.toString()}`);
			const data = await response.json();

			if (data.success) {
				setProdutos(data.data || []);
				if (data.pagination) {
					setTotalPages(data.pagination.totalPages);
					setTotalItems(data.pagination.total);
					console.log('Pagination data:', data.pagination);
				} else {
					// Fallback for when API doesn't return pagination info
					setTotalPages(1);
					setTotalItems(data.data?.length || 0);
					console.log('No pagination, fallback:', data.data?.length || 0);
				}
			} else {
				throw new Error(data.error || 'Erro ao carregar produtos');
			}
		} catch (error) {
			console.error('Erro ao carregar produtos:', error);
			toast.error('Erro ao carregar produtos');
		} finally {
			setLoading(false);
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
		setSku('');
		setNome('');
		setDescricao('');
		setCategoriaId('');
		setPreco('');
		setCusto('');
		setTempoPreparoMinutos('');
		setDisponivel(true);
		setControlaEstoque(false);
		setVariacoes([]);
		setPrecosPorCanal([
			{ canal: 'balcao', preco: 0 },
			{ canal: 'takeaway', preco: 0 },
			{ canal: 'delivery', preco: 0 },
		]);
		setProdutoEditando(null);
		setImagemFile(null);
		setImagemPreview('');
		setImagemUrl('');
		setIsUploading(false);
	};

	const handleImagemChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			// Validate file type
			if (!file.type.startsWith('image/')) {
				toast.error('Por favor, selecione um arquivo de imagem');
				return;
			}

			// Validate file size (max 5MB)
			if (file.size > 5 * 1024 * 1024) {
				toast.error('A imagem deve ter no máximo 5MB');
				return;
			}

			setImagemFile(file);

			// Create preview
			const reader = new FileReader();
			reader.onloadend = () => {
				setImagemPreview(reader.result as string);
			};
			reader.readAsDataURL(file);
		}
	};

	const abrirDialogo = (produto?: Produto) => {
		if (produto) {
			setProdutoEditando(produto);
			setSku(produto.sku);
			setNome(produto.nome);
			setDescricao(produto.descricao || '');
			setCategoriaId(produto.categoriaId);
			setPreco(produto.preco.toString());
			setCusto(produto.custo.toString());
			setTempoPreparoMinutos(produto.tempoPreparoMinutos?.toString() || '');
			setDisponivel(produto.disponivel);
			setControlaEstoque(produto.controlaEstoque);
			setVariacoes(produto.variacoes || []);
			setPrecosPorCanal(
				produto.precosPorCanal.length > 0
					? produto.precosPorCanal
					: [
							{ canal: 'balcao', preco: produto.preco },
							{ canal: 'takeaway', preco: produto.preco },
							{ canal: 'delivery', preco: produto.preco },
					  ]
			);
			if (produto.imagem) {
				setImagemPreview(produto.imagem);
			}
		} else {
			limparFormulario();
		}
		setDialogoAberto(true);
	};

	const salvarProduto = async () => {
		if (!sku || !nome || !categoriaId || !preco) {
			toast.error('Preencha todos os campos obrigatórios');
			return;
		}

		const precoNum = parseFloat(preco);
		const custoNum = parseFloat(custo) || 0;
		const tempoNum = tempoPreparoMinutos
			? parseInt(tempoPreparoMinutos)
			: undefined;

		if (isNaN(precoNum) || precoNum <= 0) {
			toast.error('Preço deve ser um número válido');
			return;
		}

		// Verificar se o SKU já existe (exceto se estiver editando)
		const produtoExistente = produtos.find(
			(p) => p.sku === sku && (!produtoEditando || p.id !== produtoEditando.id)
		);

		if (produtoExistente) {
			toast.error('Já existe um produto com este SKU');
			return;
		}

		try {
			setSaving(true);

			// Upload image if selected
			let imagemUrl = imagemPreview;
			if (imagemFile) {
				setIsUploading(true);
				// TODO: Replace with actual restaurant ID from session/context
			const restauranteId = 'cmg3w1utw005j2gzkrott9zul';
				const uploadResult = await uploadService.uploadProductImage(
					imagemFile,
					restauranteId
				);
				setIsUploading(false);

				if (uploadResult.success && uploadResult.url) {
					imagemUrl = uploadResult.url;
				} else {
					toast.error(`Erro ao fazer upload da imagem: ${uploadResult.error}`);
					return;
				}
			}

			// TODO: Replace with actual restaurant ID from session/context
			const restauranteId = 'cmg3w1utw005j2gzkrott9zul';

			const dadosProduto = {
				sku,
				nome,
				descricao: descricao || undefined,
				imagem: imagemUrl || undefined,
				categoriaId,
				preco: precoNum,
				custo: custoNum,
				tempoPreparoMinutos: tempoNum,
				disponivel,
				controlaEstoque,
				unidadeMedidaId: '', // Will be set by the API with default unit
				ingredientes: [],
				variacoes,
				precosPorCanal: precosPorCanal.map((p) => ({
					...p,
					preco: p.preco || precoNum,
				})),
				restauranteId,
			};

			let result;
			if (produtoEditando) {
				result = await apiDataService.atualizarProduto(
					produtoEditando.id,
					dadosProduto
				);
				if (result) {
					toast.success('Produto atualizado com sucesso');
				} else {
					toast.error('Erro ao atualizar produto');
					return;
				}
			} else {
				result = await apiDataService.salvarProduto(dadosProduto);
				if (result) {
					toast.success('Produto criado com sucesso');
				} else {
					toast.error('Erro ao criar produto');
					return;
				}
			}

			await carregarProdutos();
			setDialogoAberto(false);
			limparFormulario();
		} catch (error) {
			console.error('Erro ao salvar produto:', error);
			toast.error('Erro ao salvar produto');
		} finally {
			setSaving(false);
		}
	};

	const excluirProduto = async (produto: Produto) => {
		if (
			confirm(`Tem certeza que deseja excluir o produto "${produto.nome}"?`)
		) {
			try {
				const sucesso = await apiDataService.excluirProduto(produto.id);
				if (sucesso) {
					await carregarProdutos();
					toast.success('Produto excluído com sucesso');
				} else {
					toast.error('Erro ao excluir produto');
				}
			} catch (error) {
				console.error('Erro ao excluir produto:', error);
				toast.error('Erro ao excluir produto');
			}
		}
	};

	const alternarDisponibilidade = async (produto: Produto) => {
		try {
			const result = await apiDataService.atualizarProduto(produto.id, {
				disponivel: !produto.disponivel,
			});
			if (result) {
				await carregarProdutos();
				toast.success(
					`Produto ${produto.disponivel ? 'desabilitado' : 'habilitado'}`
				);
			} else {
				toast.error('Erro ao alterar disponibilidade');
			}
		} catch (error) {
			console.error('Erro ao alterar disponibilidade:', error);
			toast.error('Erro ao alterar disponibilidade');
		}
	};

	const adicionarVariacao = () => {
		const novaVariacao: VariacaoProduto = {
			id: Date.now().toString(),
			nome: '',
			precoAdicional: 0,
			disponivel: true,
		};
		setVariacoes([...variacoes, novaVariacao]);
	};

	const removerVariacao = (index: number) => {
		setVariacoes(variacoes.filter((_, i) => i !== index));
	};

	const atualizarVariacao = (
		index: number,
		campo: keyof VariacaoProduto,
		valor: any
	) => {
		const variacoesAtualizadas = variacoes.map((variacao, i) =>
			i === index ? { ...variacao, [campo]: valor } : variacao
		);
		setVariacoes(variacoesAtualizadas);
	};

	const atualizarPrecoCanal = (canal: CanalVenda, novoPreco: number) => {
		setPrecosPorCanal(
			precosPorCanal.map((p) =>
				p.canal === canal ? { ...p, preco: novoPreco } : p
			)
		);
	};

	const obterCategoriaPorId = (id: string) => {
		return categorias.find((c) => c.id === id);
	};

	// No need for local filtering since it's done on server
	const produtosFiltrados = produtos;

	// For statistics, we'll use the actual current page data
	const estatisticas = {
		total: totalItems,
		disponiveis: produtos.filter((p) => p.disponivel).length,
		indisponiveis: produtos.filter((p) => !p.disponivel).length,
		comEstoque: produtos.filter((p) => p.controlaEstoque).length,
	};

	return (
		<LayoutPrincipal titulo='Gestão de Produtos'>
			<div className='space-y-6'>
				{/* Estatísticas */}
				<div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
					<Card>
						<CardContent className='p-4'>
							<div className='flex items-center space-x-2'>
								<Package className='h-5 w-5 text-blue-500' />
								<div>
									<p className='text-sm text-muted-foreground'>Total</p>
									<p className='text-2xl font-bold'>{estatisticas.total}</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className='p-4'>
							<div className='flex items-center space-x-2'>
								<Eye className='h-5 w-5 text-green-500' />
								<div>
									<p className='text-sm text-muted-foreground'>Disponíveis</p>
									<p className='text-2xl font-bold'>
										{estatisticas.disponiveis}
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className='p-4'>
							<div className='flex items-center space-x-2'>
								<EyeOff className='h-5 w-5 text-red-500' />
								<div>
									<p className='text-sm text-muted-foreground'>Indisponíveis</p>
									<p className='text-2xl font-bold'>
										{estatisticas.indisponiveis}
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className='p-4'>
							<div className='flex items-center space-x-2'>
								<Package className='h-5 w-5 text-purple-500' />
								<div>
									<p className='text-sm text-muted-foreground'>Com Estoque</p>
									<p className='text-2xl font-bold'>
										{estatisticas.comEstoque}
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Filtros e Ações */}
				<Card>
					<CardContent className='p-4'>
						<div className='flex flex-col lg:flex-row gap-4 items-center justify-between'>
							<div className='flex flex-col sm:flex-row gap-4 flex-1'>
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
									value={filtroCategoria}
									onValueChange={setFiltroCategoria}
								>
									<SelectTrigger className='w-full sm:w-48'>
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

								<Select
									value={filtroDisponibilidade}
									onValueChange={(value: any) =>
										setFiltroDisponibilidade(value)
									}
								>
									<SelectTrigger className='w-full sm:w-48'>
										<SelectValue placeholder='Disponibilidade' />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value='todos'>Todos</SelectItem>
										<SelectItem value='disponivel'>Disponíveis</SelectItem>
										<SelectItem value='indisponivel'>Indisponíveis</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className='flex gap-2'>
								<Button
									variant='outline'
									onClick={() =>
										setVisualizacao(visualizacao === 'grid' ? 'tabela' : 'grid')
									}
								>
									{visualizacao === 'grid' ? 'Tabela' : 'Grid'}
								</Button>

								<Dialog open={dialogoAberto} onOpenChange={setDialogoAberto}>
									<DialogTrigger asChild>
										<Button onClick={() => abrirDialogo()}>
											<Plus className='w-4 h-4 mr-2' />
											Novo Produto
										</Button>
									</DialogTrigger>
									<DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
										<DialogHeader>
											<DialogTitle>
												{produtoEditando ? 'Editar Produto' : 'Novo Produto'}
											</DialogTitle>
										</DialogHeader>

										<Tabs defaultValue='basico' className='w-full'>
											<TabsList className='grid w-full grid-cols-3'>
												<TabsTrigger value='basico'>
													Informações Básicas
												</TabsTrigger>
												<TabsTrigger value='precos'>Preços</TabsTrigger>
												<TabsTrigger value='variacoes'>Variações</TabsTrigger>
											</TabsList>

											<TabsContent value='basico' className='space-y-4'>
												<div className='grid grid-cols-2 gap-4'>
													<div>
														<Label htmlFor='sku'>SKU *</Label>
														<Input
															id='sku'
															value={sku}
															onChange={(e) => setSku(e.target.value)}
															placeholder='Ex: PROD001'
														/>
													</div>

													<div>
														<Label htmlFor='nome'>Nome *</Label>
														<Input
															id='nome'
															value={nome}
															onChange={(e) => setNome(e.target.value)}
															placeholder='Nome do produto'
														/>
													</div>
												</div>

												<div>
													<Label htmlFor='descricao'>Descrição</Label>
													<Textarea
														id='descricao'
														value={descricao}
														onChange={(e) => setDescricao(e.target.value)}
														placeholder='Descrição do produto'
														rows={3}
													/>
												</div>

												<div>
													<Label htmlFor='imagem'>Imagem do Produto</Label>
													<div className='mt-2 space-y-4'>
														{imagemPreview && (
															<div className='relative w-32 h-32'>
																<Image
																	src={imagemPreview}
																	alt='Preview'
																	fill
																	className='object-cover rounded-lg'
																/>
																<Button
																	type='button'
																	variant='destructive'
																	size='icon'
																	className='absolute -top-2 -right-2 h-6 w-6'
																	onClick={() => {
																		setImagemFile(null);
																		setImagemPreview('');
																	}}
																>
																	<X className='h-4 w-4' />
																</Button>
															</div>
														)}
														<div className='flex flex-col items-center gap-4'>
															<input
																id='imagem'
																type='file'
																accept='image/*'
																onChange={handleImagemChange}
																className='hidden'
															/>
															<Button
																type='button'
																variant='outline'
																onClick={() =>
																	document.getElementById('imagem')?.click()
																}
																className='w-full'
															>
																<Upload className='h-4 w-4 mr-2' />
																Escolher Imagem
															</Button>
															{!imagemPreview && (
																<div className='flex items-center gap-2 text-sm text-muted-foreground'>
																	<ImageIcon className='h-4 w-4' />
																	<span>PNG, JPG até 5MB</span>
																</div>
															)}
														</div>
													</div>
												</div>

												<div className='grid grid-cols-2 gap-4'>
													<div>
														<Label htmlFor='categoria'>Categoria *</Label>
														<Select
															value={categoriaId}
															onValueChange={setCategoriaId}
														>
															<SelectTrigger>
																<SelectValue placeholder='Selecionar categoria' />
															</SelectTrigger>
															<SelectContent>
																{categorias.map((categoria) => (
																	<SelectItem
																		key={categoria.id}
																		value={categoria.id}
																	>
																		{categoria.nome}
																	</SelectItem>
																))}
															</SelectContent>
														</Select>
													</div>

													<div>
														<Label htmlFor='tempo'>
															Tempo de Preparo (min)
														</Label>
														<Input
															id='tempo'
															type='number'
															value={tempoPreparoMinutos}
															onChange={(e) =>
																setTempoPreparoMinutos(e.target.value)
															}
															placeholder='Ex: 15'
															min='0'
														/>
													</div>
												</div>

												<div className='flex items-center space-x-4'>
													<div className='flex items-center space-x-2'>
														<Switch
															id='disponivel'
															checked={disponivel}
															onCheckedChange={setDisponivel}
														/>
														<Label htmlFor='disponivel'>
															Produto disponível
														</Label>
													</div>

													<div className='flex items-center space-x-2'>
														<Switch
															id='estoque'
															checked={controlaEstoque}
															onCheckedChange={setControlaEstoque}
														/>
														<Label htmlFor='estoque'>Controlar estoque</Label>
													</div>
												</div>
											</TabsContent>

											<TabsContent value='precos' className='space-y-4'>
												<div className='grid grid-cols-2 gap-4'>
													<div>
														<Label htmlFor='preco'>Preço Base *</Label>
														<Input
															id='preco'
															type='number'
															step='0.01'
															value={preco}
															onChange={(e) => setPreco(e.target.value)}
															placeholder='0.00'
															min='0'
														/>
													</div>

													<div>
														<Label htmlFor='custo'>Custo</Label>
														<Input
															id='custo'
															type='number'
															step='0.01'
															value={custo}
															onChange={(e) => setCusto(e.target.value)}
															placeholder='0.00'
															min='0'
														/>
													</div>
												</div>

												<div>
													<Label>Preços por Canal</Label>
													<div className='space-y-3 mt-2'>
														{precosPorCanal.map((precoCanal) => (
															<div
																key={precoCanal.canal}
																className='flex items-center space-x-4'
															>
																<Label className='w-20 capitalize'>
																	{precoCanal.canal}:
																</Label>
																<Input
																	type='number'
																	step='0.01'
																	value={precoCanal.preco}
																	onChange={(e) =>
																		atualizarPrecoCanal(
																			precoCanal.canal,
																			parseFloat(e.target.value) || 0
																		)
																	}
																	placeholder='0.00'
																	min='0'
																	className='flex-1'
																/>
															</div>
														))}
													</div>
												</div>
											</TabsContent>

											<TabsContent value='variacoes' className='space-y-4'>
												<div className='flex items-center justify-between'>
													<Label>Variações do Produto</Label>
													<Button
														type='button'
														variant='outline'
														onClick={adicionarVariacao}
													>
														<Plus className='w-4 h-4 mr-2' />
														Adicionar Variação
													</Button>
												</div>

												<div className='space-y-3'>
													{variacoes.map((variacao, index) => (
														<div
															key={variacao.id}
															className='flex items-center space-x-2 p-3 border rounded-lg'
														>
															<Input
																placeholder='Nome da variação'
																value={variacao.nome}
																onChange={(e) =>
																	atualizarVariacao(
																		index,
																		'nome',
																		e.target.value
																	)
																}
																className='flex-1'
															/>
															<Input
																type='number'
																step='0.01'
																placeholder='Preço adicional'
																value={variacao.precoAdicional}
																onChange={(e) =>
																	atualizarVariacao(
																		index,
																		'precoAdicional',
																		parseFloat(e.target.value) || 0
																	)
																}
																className='w-32'
															/>
															<Switch
																checked={variacao.disponivel}
																onCheckedChange={(checked) =>
																	atualizarVariacao(
																		index,
																		'disponivel',
																		checked
																	)
																}
															/>
															<Button
																type='button'
																variant='destructive'
																size='sm'
																onClick={() => removerVariacao(index)}
															>
																<Trash2 className='w-4 h-4' />
															</Button>
														</div>
													))}
												</div>
											</TabsContent>
										</Tabs>

										<div className='flex space-x-2 mt-6'>
											<Button
												variant='outline'
												className='flex-1'
												onClick={() => setDialogoAberto(false)}
											>
												Cancelar
											</Button>
											<Button
												className='flex-1'
												onClick={salvarProduto}
												disabled={saving || isUploading}
											>
												{saving || isUploading
													? 'Salvando...'
													: produtoEditando
													? 'Atualizar'
													: 'Criar'}
											</Button>
										</div>
									</DialogContent>
								</Dialog>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Lista de Produtos */}
				{loading ? (
					<Card>
						<CardContent className='p-8 text-center'>
							<div className='animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4'></div>
							<p className='text-muted-foreground'>Carregando produtos...</p>
						</CardContent>
					</Card>
				) : visualizacao === 'grid' ? (
					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
						{produtosFiltrados.map((produto) => {
							const categoria = obterCategoriaPorId(produto.categoriaId);

							return (
								<Card
									key={produto.id}
									className={`relative ${
										!produto.disponivel ? 'opacity-60' : ''
									}`}
								>
									<CardContent className='p-4'>
										<div className='space-y-3'>
											{/* Imagem do Produto */}
											{produto.imagem && (
												<div className='relative w-full h-32 rounded-lg overflow-hidden bg-gray-100'>
													<Image
														src={produto.imagem}
														alt={produto.nome}
														fill
														className='object-cover'
														onError={(e) => {
															// Hide image if failed to load
															(e.target as HTMLImageElement).style.display =
																'none';
														}}
													/>
												</div>
											)}

											{/* Cabeçalho */}
											<div className='flex items-start justify-between'>
												<div className='flex-1'>
													<h3 className='font-medium text-sm leading-tight'>
														{produto.nome}
													</h3>
													<p className='text-xs text-muted-foreground'>
														SKU: {produto.sku}
													</p>
												</div>
												<div className='flex items-center space-x-1'>
													{produto.tempoPreparoMinutos && (
														<Badge variant='secondary' className='text-xs'>
															<Clock className='w-3 h-3 mr-1' />
															{produto.tempoPreparoMinutos}min
														</Badge>
													)}
													{!produto.disponivel && (
														<Badge variant='destructive' className='text-xs'>
															<EyeOff className='w-3 h-3 mr-1' />
															Indisponível
														</Badge>
													)}
												</div>
											</div>

											{/* Categoria */}
											{categoria && (
												<Badge
													variant='outline'
													className='text-xs'
													style={{
														borderColor: categoria.cor,
														color: categoria.cor,
													}}
												>
													{categoria.nome}
												</Badge>
											)}

											{/* Descrição */}
											{produto.descricao && (
												<p className='text-xs text-muted-foreground line-clamp-2'>
													{produto.descricao}
												</p>
											)}

											{/* Preços */}
											<div className='space-y-1'>
												<div className='flex items-center justify-between'>
													<span className='text-sm font-medium'>Preço:</span>
													<span className='text-lg font-bold text-primary'>
														MT {produto.preco.toFixed(2)}
													</span>
												</div>
												{produto.custo > 0 && (
													<div className='flex items-center justify-between text-xs text-muted-foreground'>
														<span>Custo:</span>
														<span>MT {produto.custo.toFixed(2)}</span>
													</div>
												)}
												{produto.custo > 0 && (
													<div className='flex items-center justify-between text-xs text-muted-foreground'>
														<span>Margem:</span>
														<span>
															{(
																((produto.preco - produto.custo) /
																	produto.preco) *
																100
															).toFixed(1)}
															%
														</span>
													</div>
												)}
											</div>

											{/* Variações */}
											{produto.variacoes && produto.variacoes.length > 0 && (
												<div className='text-xs text-muted-foreground'>
													{produto.variacoes.length} variação(ões)
													disponível(is)
												</div>
											)}

											{/* Ações */}
											<div className='flex space-x-1'>
												<Button
													size='sm'
													variant='outline'
													className='flex-1'
													onClick={() => alternarDisponibilidade(produto)}
												>
													{produto.disponivel ? (
														<EyeOff className='w-3 h-3' />
													) : (
														<Eye className='w-3 h-3' />
													)}
												</Button>
												<Button
													size='sm'
													variant='outline'
													className='flex-1'
													onClick={() => abrirDialogo(produto)}
												>
													<Edit className='w-3 h-3' />
												</Button>
												<Button
													size='sm'
													variant='destructive'
													className='flex-1'
													onClick={() => excluirProduto(produto)}
												>
													<Trash2 className='w-3 h-3' />
												</Button>
											</div>
										</div>
									</CardContent>
								</Card>
							);
						})}
					</div>
				) : (
					<Card>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Imagem</TableHead>
									<TableHead>SKU</TableHead>
									<TableHead>Nome</TableHead>
									<TableHead>Categoria</TableHead>
									<TableHead>Preço</TableHead>
									<TableHead>Custo</TableHead>
									<TableHead>Margem</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Ações</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{produtosFiltrados.map((produto) => {
									const categoria = obterCategoriaPorId(produto.categoriaId);
									const margem =
										produto.custo > 0
											? ((produto.preco - produto.custo) / produto.preco) * 100
											: 0;

									return (
										<TableRow
											key={produto.id}
											className={!produto.disponivel ? 'opacity-60' : ''}
										>
											<TableCell>
												{produto.imagem ? (
													<div className='relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100'>
														<Image
															src={produto.imagem}
															alt={produto.nome}
															fill
															className='object-cover'
															onError={(e) => {
																// Hide image if failed to load
																(e.target as HTMLImageElement).style.display =
																	'none';
															}}
														/>
													</div>
												) : (
													<div className='w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center'>
														<ImageIcon className='w-6 h-6 text-gray-400' />
													</div>
												)}
											</TableCell>
											<TableCell className='font-mono text-sm'>
												{produto.sku}
											</TableCell>
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
											<TableCell>
												{categoria && (
													<Badge
														variant='outline'
														style={{
															borderColor: categoria.cor,
															color: categoria.cor,
														}}
													>
														{categoria.nome}
													</Badge>
												)}
											</TableCell>
											<TableCell className='font-bold'>
												MT {produto.preco.toFixed(2)}
											</TableCell>
											<TableCell>MT {produto.custo.toFixed(2)}</TableCell>
											<TableCell>{margem.toFixed(1)}%</TableCell>
											<TableCell>
												<Badge
													variant={
														produto.disponivel ? 'default' : 'destructive'
													}
												>
													{produto.disponivel ? 'Disponível' : 'Indisponível'}
												</Badge>
											</TableCell>
											<TableCell>
												<div className='flex space-x-1'>
													<Button
														size='sm'
														variant='outline'
														onClick={() => alternarDisponibilidade(produto)}
													>
														{produto.disponivel ? (
															<EyeOff className='w-3 h-3' />
														) : (
															<Eye className='w-3 h-3' />
														)}
													</Button>
													<Button
														size='sm'
														variant='outline'
														onClick={() => abrirDialogo(produto)}
													>
														<Edit className='w-3 h-3' />
													</Button>
													<Button
														size='sm'
														variant='destructive'
														onClick={() => excluirProduto(produto)}
													>
														<Trash2 className='w-3 h-3' />
													</Button>
												</div>
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					</Card>
				)}

				{!loading && produtosFiltrados.length === 0 && (
					<Card>
						<CardContent className='p-8 text-center'>
							<Package className='w-12 h-12 mx-auto mb-4 text-muted-foreground' />
							<p className='text-muted-foreground'>
								Nenhum produto encontrado com os filtros aplicados.
							</p>
						</CardContent>
					</Card>
				)}

				{/* Pagination */}
				{!loading && totalItems > 0 && (
					<DataPagination
						currentPage={currentPage}
						totalPages={totalPages}
						totalItems={totalItems}
						itemsPerPage={itemsPerPage}
						onPageChange={handlePageChange}
						onItemsPerPageChange={handleItemsPerPageChange}
						isLoading={loading}
					/>
				)}
			</div>
		</LayoutPrincipal>
	);
}
