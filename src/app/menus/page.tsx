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
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
	Plus,
	Edit,
	Trash2,
	Search,
	Calendar,
	Clock,
	Eye,
	EyeOff,
	Filter,
	Download,
	Upload,
	ImageIcon,
	X,
	Coffee,
	Utensils,
	Wine,
	Cake,
	Pizza,
	Copy,
	Check,
	ChefHat,
	Menu as MenuIcon,
	ShoppingCart,
	Minus,
} from 'lucide-react';
import Image from 'next/image';
import { apiDataService } from '@/lib/api-data-service';
import { uploadService } from '@/lib/upload-service';
import {
	Menu,
	Produto,
	Categoria,
	TipoMenu,
} from '@/types/sistema-restaurante';

const tiposMenu: {
	value: TipoMenu;
	label: string;
	icon: any;
	color: string;
}[] = [
	{
		value: 'cafe_manha',
		label: 'Café da Manhã',
		icon: Coffee,
		color: 'bg-yellow-500',
	},
	{ value: 'almoco', label: 'Almoço', icon: Utensils, color: 'bg-green-500' },
	{ value: 'jantar', label: 'Jantar', icon: Wine, color: 'bg-purple-500' },
	{
		value: 'sobremesas',
		label: 'Sobremesas',
		icon: Cake,
		color: 'bg-pink-500',
	},
	{ value: 'bebidas', label: 'Bebidas', icon: Coffee, color: 'bg-blue-500' },
	{ value: 'petiscos', label: 'Petiscos', icon: Pizza, color: 'bg-orange-500' },
	{ value: 'especial', label: 'Especial', icon: ChefHat, color: 'bg-red-500' },
	{ value: 'criancas', label: 'Infantil', icon: Cake, color: 'bg-indigo-500' },
	{
		value: 'vegetariano',
		label: 'Vegetariano',
		icon: Utensils,
		color: 'bg-green-600',
	},
	{
		value: 'executivo',
		label: 'Executivo',
		icon: MenuIcon,
		color: 'bg-gray-600',
	},
];

export default function PaginaMenus() {
	const [menus, setMenus] = useState<Menu[]>([]);
	const [produtos, setProdutos] = useState<Produto[]>([]);
	const [categorias, setCategorias] = useState<Categoria[]>([]);
	const [menuEditando, setMenuEditando] = useState<Menu | null>(null);
	const [dialogoAberto, setDialogoAberto] = useState(false);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [busca, setBusca] = useState('');
	const [filtroTipo, setFiltroTipo] = useState<TipoMenu | 'todos'>('todos');
	const [filtroAtivo, setFiltroAtivo] = useState<'todos' | 'ativo' | 'inativo'>(
		'todos'
	);

	// Pagination state
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(20);
	const [totalPages, setTotalPages] = useState(0);
	const [totalItems, setTotalItems] = useState(0);

	// Formulário
	const [nome, setNome] = useState('');
	const [descricao, setDescricao] = useState('');
	const [tipo, setTipo] = useState<TipoMenu>('almoco');
	const [ativo, setAtivo] = useState(true);
	const [produtosSelecionados, setProdutosSelecionados] = useState<string[]>(
		[]
	);
	const [imagemFile, setImagemFile] = useState<File | null>(null);
	const [imagemPreview, setImagemPreview] = useState<string>('');
	const [isUploading, setIsUploading] = useState(false);
	const [buscaProduto, setBuscaProduto] = useState('');

	useEffect(() => {
		carregarProdutosECategorias();
	}, []);

	useEffect(() => {
		carregarMenus();
	}, [currentPage, itemsPerPage, filtroTipo, filtroAtivo]);

	// Debounced search effect
	useEffect(() => {
		const timeoutId = setTimeout(() => {
			if (currentPage === 1) {
				carregarMenus();
			} else {
				setCurrentPage(1);
			}
		}, 500);

		return () => clearTimeout(timeoutId);
	}, [busca]);

	const carregarProdutosECategorias = async () => {
		try {
			// TODO: Replace with actual restaurant ID from session/context
			const restauranteId = 'default-restaurant';

			const [produtosData, categoriasData] = await Promise.all([
				apiDataService.obterProdutos(restauranteId),
				apiDataService.obterCategorias(restauranteId),
			]);

			setProdutos(produtosData || []);
			setCategorias(categoriasData || []);
		} catch (error) {
			console.error('Erro ao carregar produtos e categorias:', error);
			toast.error('Erro ao carregar dados');
		}
	};

	const carregarMenus = async () => {
		try {
			setLoading(true);
			// TODO: Replace with actual restaurant ID from session/context
			const restauranteId = 'default-restaurant';
			
			// Build query parameters
			const params = new URLSearchParams({
				page: currentPage.toString(),
				limit: itemsPerPage.toString(),
				restauranteId,
			});

			if (busca) {
				params.append('search', busca);
			}

			if (filtroTipo !== 'todos') {
				params.append('periodo', filtroTipo);
			}

			if (filtroAtivo !== 'todos') {
				params.append('ativo', filtroAtivo === 'ativo' ? 'true' : 'false');
			}

			// Make API call with pagination
			const response = await fetch(`/api/menus?${params.toString()}`);
			const data = await response.json();

			if (data.success) {
				setMenus(data.data || []);
				if (data.pagination) {
					setTotalPages(data.pagination.totalPages);
					setTotalItems(data.pagination.total);
				}
			} else {
				throw new Error(data.error || 'Erro ao carregar menus');
			}
		} catch (error) {
			console.error('Erro ao carregar menus:', error);
			toast.error('Erro ao carregar menus');
		} finally {
			setLoading(false);
		}
	};

	const limparFormulario = () => {
		setNome('');
		setDescricao('');
		setTipo('almoco');
		setAtivo(true);
		setProdutosSelecionados([]);
		setMenuEditando(null);
		setImagemFile(null);
		setImagemPreview('');
		setIsUploading(false);
		setBuscaProduto('');
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

	const abrirDialogo = (menu?: Menu) => {
		if (menu) {
			setMenuEditando(menu);
			setNome(menu.nome);
			setDescricao(menu.descricao || '');
			setTipo(menu.tipo);
			setAtivo(menu.ativo);
			setProdutosSelecionados(menu.produtos?.map((p) => p.id) || []);
			if (menu.imagem) {
				setImagemPreview(menu.imagem);
			}
		} else {
			limparFormulario();
		}
		setDialogoAberto(true);
	};

	const salvarMenu = async () => {
		if (!nome || !tipo) {
			toast.error('Preencha todos os campos obrigatórios');
			return;
		}

		if (produtosSelecionados.length === 0) {
			toast.error('Selecione pelo menos um produto para o menu');
			return;
		}

		try {
			setSaving(true);

			// Upload image if selected
			let imagemUrl = menuEditando?.imagem || '';
			if (imagemFile) {
				setIsUploading(true);
				// TODO: Replace with actual restaurant ID from session/context
			const restauranteId = 'default-restaurant';
				const uploadResult = await uploadService.uploadMenuImage(
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
			const restauranteId = 'default-restaurant';

			const dadosMenu = {
				nome,
				descricao: descricao || undefined,
				imagem: imagemUrl || undefined,
				tipo,
				ativo,
				produtos: produtosSelecionados,
				restauranteId,
			};

			let result;
			if (menuEditando) {
				result = await apiDataService.atualizarMenu(menuEditando.id, dadosMenu);
				if (result) {
					toast.success('Menu atualizado com sucesso');
				} else {
					toast.error('Erro ao atualizar menu');
					return;
				}
			} else {
				result = await apiDataService.salvarMenu(dadosMenu);
				if (result) {
					toast.success('Menu criado com sucesso');
				} else {
					toast.error('Erro ao criar menu');
					return;
				}
			}

			await carregarMenus();
			setDialogoAberto(false);
			limparFormulario();
		} catch (error) {
			console.error('Erro ao salvar menu:', error);
			toast.error('Erro ao salvar menu');
		} finally {
			setSaving(false);
		}
	};

	const excluirMenu = async (menu: Menu) => {
		if (confirm(`Tem certeza que deseja excluir o menu "${menu.nome}"?`)) {
			try {
				const sucesso = await apiDataService.excluirMenu(menu.id);
				if (sucesso) {
					await carregarMenus();
					toast.success('Menu excluído com sucesso');
				} else {
					toast.error('Erro ao excluir menu');
				}
			} catch (error) {
				console.error('Erro ao excluir menu:', error);
				toast.error('Erro ao excluir menu');
			}
		}
	};

	const alternarStatusMenu = async (menu: Menu) => {
		try {
			const result = await apiDataService.atualizarMenu(menu.id, {
				ativo: !menu.ativo,
			});
			if (result) {
				await carregarMenus();
				toast.success(
					`Menu ${menu.ativo ? 'desativado' : 'ativado'} com sucesso`
				);
			} else {
				toast.error('Erro ao alterar status do menu');
			}
		} catch (error) {
			console.error('Erro ao alterar status do menu:', error);
			toast.error('Erro ao alterar status do menu');
		}
	};

	const duplicarMenu = async (menu: Menu) => {
		try {
			const novoMenu = {
				nome: `${menu.nome} (Cópia)`,
				descricao: menu.descricao,
				imagem: menu.imagem,
				tipo: menu.tipo,
				ativo: false,
				produtos: menu.produtos?.map((p) => p.id) || [],
				restauranteId: menu.restauranteId,
			};

			const result = await apiDataService.salvarMenu(novoMenu);
			if (result) {
				await carregarMenus();
				toast.success('Menu duplicado com sucesso');
			} else {
				toast.error('Erro ao duplicar menu');
			}
		} catch (error) {
			console.error('Erro ao duplicar menu:', error);
			toast.error('Erro ao duplicar menu');
		}
	};

	const obterIconeTipo = (tipo: TipoMenu) => {
		const tipoInfo = tiposMenu.find((t) => t.value === tipo);
		return tipoInfo ? tipoInfo.icon : MenuIcon;
	};

	const obterCorTipo = (tipo: TipoMenu) => {
		const tipoInfo = tiposMenu.find((t) => t.value === tipo);
		return tipoInfo ? tipoInfo.color : 'bg-gray-500';
	};

	const obterLabelTipo = (tipo: TipoMenu) => {
		const tipoInfo = tiposMenu.find((t) => t.value === tipo);
		return tipoInfo ? tipoInfo.label : tipo;
	};

	const obterCategoriaPorId = (id: string) => {
		return categorias.find((c) => c.id === id);
	};

	// No need for local filtering since it's done on server
	const menusFiltrados = menus;

	// For statistics, we'll use the actual current page data
	const estatisticas = {
		total: totalItems,
		ativos: menus.filter((m) => m.ativo).length,
		inativos: menus.filter((m) => !m.ativo).length,
		porTipo: tiposMenu.map((tipo) => ({
			...tipo,
			quantidade: menus.filter((m) => m.tipo === tipo.value).length,
		})),
	};

	const handlePageChange = useCallback((page: number) => {
		setCurrentPage(page);
	}, []);

	const handleItemsPerPageChange = useCallback((newItemsPerPage: number) => {
		setItemsPerPage(newItemsPerPage);
		setCurrentPage(1); // Reset to first page when changing page size
	}, []);

	const produtosPorCategoria = categorias.map((categoria) => ({
		...categoria,
		produtos: produtos.filter(
			(p) =>
				p.categoriaId === categoria.id &&
				p.disponivel &&
				(p.nome.toLowerCase().includes(buscaProduto.toLowerCase()) ||
					p.sku.toLowerCase().includes(buscaProduto.toLowerCase()))
		),
	}));

	return (
		<LayoutPrincipal titulo='Gestão de Menus'>
			<div className='space-y-6'>
				{/* Estatísticas */}
				<div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
					<Card>
						<CardContent className='p-4'>
							<div className='flex items-center space-x-2'>
								<MenuIcon className='h-5 w-5 text-blue-500' />
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
									<p className='text-sm text-muted-foreground'>Ativos</p>
									<p className='text-2xl font-bold'>{estatisticas.ativos}</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className='p-4'>
							<div className='flex items-center space-x-2'>
								<EyeOff className='h-5 w-5 text-red-500' />
								<div>
									<p className='text-sm text-muted-foreground'>Inativos</p>
									<p className='text-2xl font-bold'>{estatisticas.inativos}</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className='p-4'>
							<div className='flex items-center space-x-2'>
								<ChefHat className='h-5 w-5 text-purple-500' />
								<div>
									<p className='text-sm text-muted-foreground'>Tipos</p>
									<p className='text-2xl font-bold'>
										{
											estatisticas.porTipo.filter((t) => t.quantidade > 0)
												.length
										}
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
										placeholder='Buscar menu...'
										value={busca}
										onChange={(e) => setBusca(e.target.value)}
										className='pl-10'
									/>
								</div>

								<Select
									value={filtroTipo}
									onValueChange={(value: any) => setFiltroTipo(value)}
								>
									<SelectTrigger className='w-full sm:w-48'>
										<SelectValue placeholder='Tipo de Menu' />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value='todos'>Todos os Tipos</SelectItem>
										{tiposMenu.map((tipo) => (
											<SelectItem key={tipo.value} value={tipo.value}>
												<div className='flex items-center space-x-2'>
													<tipo.icon className='h-4 w-4' />
													<span>{tipo.label}</span>
												</div>
											</SelectItem>
										))}
									</SelectContent>
								</Select>

								<Select
									value={filtroAtivo}
									onValueChange={(value: any) => setFiltroAtivo(value)}
								>
									<SelectTrigger className='w-full sm:w-48'>
										<SelectValue placeholder='Status' />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value='todos'>Todos</SelectItem>
										<SelectItem value='ativo'>Ativos</SelectItem>
										<SelectItem value='inativo'>Inativos</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<Dialog open={dialogoAberto} onOpenChange={setDialogoAberto}>
								<DialogTrigger asChild>
									<Button onClick={() => abrirDialogo()}>
										<Plus className='w-4 h-4 mr-2' />
										Novo Menu
									</Button>
								</DialogTrigger>
								<DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
									<DialogHeader>
										<DialogTitle>
											{menuEditando ? 'Editar Menu' : 'Novo Menu'}
										</DialogTitle>
									</DialogHeader>

									<Tabs defaultValue='info' className='w-full'>
										<TabsList className='grid w-full grid-cols-2'>
											<TabsTrigger value='info'>Informações</TabsTrigger>
											<TabsTrigger value='produtos'>Produtos</TabsTrigger>
										</TabsList>

										<TabsContent value='info' className='space-y-4'>
											<div className='grid grid-cols-2 gap-4'>
												<div>
													<Label htmlFor='nome'>Nome do Menu *</Label>
													<Input
														id='nome'
														value={nome}
														onChange={(e) => setNome(e.target.value)}
														placeholder='Ex: Menu Executivo'
													/>
												</div>

												<div>
													<Label htmlFor='tipo'>Tipo de Menu *</Label>
													<Select
														value={tipo}
														onValueChange={(value: TipoMenu) => setTipo(value)}
													>
														<SelectTrigger>
															<SelectValue />
														</SelectTrigger>
														<SelectContent>
															{tiposMenu.map((tipoOpt) => (
																<SelectItem
																	key={tipoOpt.value}
																	value={tipoOpt.value}
																>
																	<div className='flex items-center space-x-2'>
																		<tipoOpt.icon className='h-4 w-4' />
																		<span>{tipoOpt.label}</span>
																	</div>
																</SelectItem>
															))}
														</SelectContent>
													</Select>
												</div>
											</div>

											<div>
												<Label htmlFor='descricao'>Descrição</Label>
												<Textarea
													id='descricao'
													value={descricao}
													onChange={(e) => setDescricao(e.target.value)}
													placeholder='Descrição detalhada do menu'
													rows={3}
												/>
											</div>

											<div>
												<Label htmlFor='imagem'>Imagem do Menu</Label>
												<div className='mt-2 space-y-4'>
													{imagemPreview && (
														<div className='relative w-full h-48'>
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
																className='absolute top-2 right-2'
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

											<div className='flex items-center space-x-2'>
												<Switch
													id='ativo'
													checked={ativo}
													onCheckedChange={setAtivo}
												/>
												<Label htmlFor='ativo'>Menu ativo</Label>
											</div>
										</TabsContent>

										<TabsContent value='produtos' className='space-y-4'>
											<div>
												<Label>Selecione os Produtos do Menu *</Label>
												<p className='text-sm text-muted-foreground mb-4'>
													Use os botões para adicionar/remover produtos do menu
												</p>

												<div
													className='grid grid-cols-1 lg:grid-cols-2 gap-6'
													style={{ height: '28rem' }}
												>
													{/* Produtos Disponíveis */}
													<div className='space-y-4'>
														<div className='flex items-center justify-between'>
															<h4 className='font-semibold text-sm'>
																Produtos Disponíveis
															</h4>
															<Badge variant='outline'>
																{
																	produtos.filter(
																		(p) =>
																			!produtosSelecionados.includes(p.id) &&
																			p.disponivel
																	).length
																}{' '}
																disponíveis
															</Badge>
														</div>

														{/* Busca de Produtos */}
														<div className='relative'>
															<Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4' />
															<Input
																placeholder='Buscar produtos...'
																value={buscaProduto}
																onChange={(e) =>
																	setBuscaProduto(e.target.value)
																}
																className='pl-10'
															/>
														</div>

														<div className='border rounded-lg overflow-hidden'>
															<div className='max-h-64 overflow-y-auto'>
																{produtosPorCategoria.map(
																	(categoria) =>
																		categoria.produtos.filter(
																			(p) =>
																				!produtosSelecionados.includes(p.id)
																		).length > 0 && (
																			<div
																				key={categoria.id}
																				className='border-b last:border-b-0'
																			>
																				<div className='bg-gray-50 px-3 py-2 border-b'>
																					<h5 className='font-medium text-xs flex items-center'>
																						<div
																							className='w-3 h-3 rounded-full mr-2'
																							style={{
																								backgroundColor: categoria.cor,
																							}}
																						/>
																						{categoria.nome}
																					</h5>
																				</div>
																				<div className='space-y-0'>
																					{categoria.produtos
																						.filter(
																							(produto) =>
																								!produtosSelecionados.includes(
																									produto.id
																								)
																						)
																						.map((produto) => (
																							<div
																								key={produto.id}
																								className='flex items-center justify-between p-3 hover:bg-gray-50 border-b last:border-b-0'
																							>
																								<div className='flex-1 min-w-0'>
																									<p className='text-sm font-medium truncate'>
																										{produto.nome}
																									</p>
																									<p className='text-xs text-muted-foreground'>
																										MT{' '}
																										{produto.preco.toFixed(2)}
																									</p>
																								</div>
																								<Button
																									type='button'
																									size='sm'
																									variant='outline'
																									onClick={() => {
																										setProdutosSelecionados([
																											...produtosSelecionados,
																											produto.id,
																										]);
																									}}
																									className='ml-2 h-8 w-8 p-0'
																								>
																									<Plus className='h-4 w-4' />
																								</Button>
																							</div>
																						))}
																				</div>
																			</div>
																		)
																)}

																{produtos.filter(
																	(p) =>
																		!produtosSelecionados.includes(p.id) &&
																		p.disponivel
																).length === 0 && (
																	<div className='p-8 text-center text-muted-foreground'>
																		<ShoppingCart className='h-8 w-8 mx-auto mb-2 opacity-50' />
																		<p className='text-sm'>
																			Todos os produtos foram selecionados
																		</p>
																	</div>
																)}
															</div>
														</div>
													</div>

													{/* Produtos Selecionados */}
													<div className='space-y-4'>
														<div className='flex items-center justify-between'>
															<h4 className='font-semibold text-sm'>
																Produtos do Menu
															</h4>
															<Badge variant='default'>
																{produtosSelecionados.length} selecionados
															</Badge>
														</div>

														<div className='border rounded-lg overflow-hidden'>
															<div className='max-h-64 overflow-y-auto'>
																{produtosSelecionados.length === 0 ? (
																	<div className='p-8 text-center text-muted-foreground'>
																		<MenuIcon className='h-8 w-8 mx-auto mb-2 opacity-50' />
																		<p className='text-sm'>
																			Nenhum produto selecionado
																		</p>
																		<p className='text-xs'>
																			Adicione produtos da lista ao lado
																		</p>
																	</div>
																) : (
																	<div className='space-y-0'>
																		{produtosSelecionados.map((produtoId) => {
																			const produto = produtos.find(
																				(p) => p.id === produtoId
																			);
																			const categoria = produto
																				? obterCategoriaPorId(
																						produto.categoriaId
																				  )
																				: null;

																			if (!produto) return null;

																			return (
																				<div
																					key={produto.id}
																					className='flex items-center justify-between p-3 hover:bg-gray-50 border-b last:border-b-0'
																				>
																					<div className='flex-1 min-w-0'>
																						<div className='flex items-center space-x-2'>
																							{categoria && (
																								<div
																									className='w-3 h-3 rounded-full flex-shrink-0'
																									style={{
																										backgroundColor:
																											categoria.cor,
																									}}
																								/>
																							)}
																							<div className='min-w-0 flex-1'>
																								<p className='text-sm font-medium truncate'>
																									{produto.nome}
																								</p>
																								<p className='text-xs text-muted-foreground'>
																									{categoria?.nome} • MT{' '}
																									{produto.preco.toFixed(2)}
																								</p>
																							</div>
																						</div>
																					</div>
																					<Button
																						type='button'
																						size='sm'
																						variant='outline'
																						onClick={() => {
																							setProdutosSelecionados(
																								produtosSelecionados.filter(
																									(id) => id !== produto.id
																								)
																							);
																						}}
																						className='ml-2 h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50'
																					>
																						<Minus className='h-4 w-4' />
																					</Button>
																				</div>
																			);
																		})}
																	</div>
																)}
															</div>
														</div>

														{produtosSelecionados.length > 0 && (
															<div className='text-center pt-2'>
																<Button
																	type='button'
																	variant='outline'
																	size='sm'
																	onClick={() => setProdutosSelecionados([])}
																	className='text-red-500 hover:text-red-600 hover:bg-red-50'
																>
																	<X className='h-4 w-4 mr-1' />
																	Limpar Seleção
																</Button>
															</div>
														)}
													</div>
												</div>
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
											onClick={salvarMenu}
											disabled={saving || isUploading}
										>
											{saving || isUploading
												? 'Salvando...'
												: menuEditando
												? 'Atualizar'
												: 'Criar'}
										</Button>
									</div>
								</DialogContent>
							</Dialog>
						</div>
					</CardContent>
				</Card>

				{/* Lista de Menus */}
				{loading ? (
					<Card>
						<CardContent className='p-8 text-center'>
							<div className='animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4'></div>
							<p className='text-muted-foreground'>Carregando menus...</p>
						</CardContent>
					</Card>
				) : (
					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
						{menusFiltrados.map((menu) => {
							const IconeTipo = obterIconeTipo(menu.tipo);
							const produtosCount = menu.produtos?.length || 0;

							return (
								<Card
									key={menu.id}
									className={`relative group hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1 ${
										!menu.ativo ? 'opacity-60' : ''
									}`}
								>
									<div className='relative'>
										{menu.imagem ? (
											<div className='relative h-48 bg-gray-100 rounded-t-lg overflow-hidden'>
												<Image
													src={menu.imagem}
													alt={menu.nome}
													fill
													className='object-cover'
													onError={(e) => {
														(e.target as HTMLImageElement).style.display =
															'none';
													}}
												/>
											</div>
										) : (
											<div
												className={`h-48 ${obterCorTipo(
													menu.tipo
												)} rounded-t-lg flex items-center justify-center`}
											>
												<IconeTipo className='h-20 w-20 text-white opacity-50' />
											</div>
										)}

										<Badge
											className={`absolute top-2 right-2 ${obterCorTipo(
												menu.tipo
											)} text-white border-0`}
										>
											{obterLabelTipo(menu.tipo)}
										</Badge>

										{!menu.ativo && (
											<Badge
												variant='destructive'
												className='absolute top-2 left-2'
											>
												Inativo
											</Badge>
										)}
									</div>

									<CardContent className='p-4'>
										<div className='space-y-3'>
											<div>
												<h3 className='font-bold text-lg truncate'>
													{menu.nome}
												</h3>
												{menu.descricao && (
													<p className='text-sm text-muted-foreground line-clamp-2'>
														{menu.descricao}
													</p>
												)}
											</div>

											<div className='flex items-center justify-between text-sm'>
												<div className='flex items-center text-muted-foreground'>
													<Utensils className='h-4 w-4 mr-1' />
													<span>{produtosCount} produtos</span>
												</div>
												<div className='flex items-center'>
													{menu.ativo ? (
														<Badge
															variant='outline'
															className='text-green-600 border-green-600'
														>
															<Check className='h-3 w-3 mr-1' />
															Ativo
														</Badge>
													) : (
														<Badge
															variant='outline'
															className='text-red-600 border-red-600'
														>
															<X className='h-3 w-3 mr-1' />
															Inativo
														</Badge>
													)}
												</div>
											</div>

											<div className='flex space-x-1 pt-2 border-t'>
												<Button
													size='sm'
													variant='outline'
													className='flex-1'
													onClick={() => alternarStatusMenu(menu)}
													title={menu.ativo ? 'Desativar menu' : 'Ativar menu'}
												>
													{menu.ativo ? (
														<EyeOff className='h-3 w-3' />
													) : (
														<Eye className='h-3 w-3' />
													)}
												</Button>
												<Button
													size='sm'
													variant='outline'
													className='flex-1'
													onClick={() => duplicarMenu(menu)}
													title='Duplicar menu'
												>
													<Copy className='h-3 w-3' />
												</Button>
												<Button
													size='sm'
													variant='outline'
													className='flex-1'
													onClick={() => abrirDialogo(menu)}
													title='Editar menu'
												>
													<Edit className='h-3 w-3' />
												</Button>
												<Button
													size='sm'
													variant='destructive'
													className='flex-1'
													onClick={() => excluirMenu(menu)}
													title='Excluir menu'
												>
													<Trash2 className='h-3 w-3' />
												</Button>
											</div>
										</div>
									</CardContent>
								</Card>
							);
						})}
					</div>
				)}

				{!loading && menusFiltrados.length === 0 && (
					<Card>
						<CardContent className='p-8 text-center'>
							<MenuIcon className='w-12 h-12 mx-auto mb-4 text-muted-foreground' />
							<p className='text-muted-foreground'>
								Nenhum menu encontrado com os filtros aplicados.
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
