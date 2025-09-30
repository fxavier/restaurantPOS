'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import DataPagination from '@/components/ui/data-pagination';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Grid3X3, Palette, Search } from 'lucide-react';
import LayoutPrincipal from '@/components/layout/layout-principal';
import { apiDataService } from '@/lib/api-data-service';
import { Categoria } from '@/types/sistema-restaurante';

const CORES_PREDEFINIDAS = [
	'#ef4444', // red
	'#f59e0b', // amber
	'#10b981', // emerald
	'#3b82f6', // blue
	'#8b5cf6', // violet
	'#ec4899', // pink
	'#14b8a6', // teal
	'#f97316', // orange
	'#6366f1', // indigo
	'#84cc16', // lime
];

const formularioVazio = {
	nome: '',
	descricao: '',
	cor: '#3b82f6',
	icone: '',
	ordem: 0,
	ativa: true,
};

export default function PaginaCategorias() {
	const [categorias, setCategorias] = useState<Categoria[]>([]);
	const [formulario, setFormulario] = useState(formularioVazio);
	const [categoriaEditando, setCategoriaEditando] = useState<string | null>(
		null
	);
	const [dialogoAberto, setDialogoAberto] = useState(false);
	const [termoPesquisa, setTermoPesquisa] = useState('');
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);

	// Pagination state
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(20);
	const [totalPages, setTotalPages] = useState(0);
	const [totalItems, setTotalItems] = useState(0);

	useEffect(() => {
		carregarCategorias();
	}, [currentPage, itemsPerPage]);

	// Debounced search effect
	useEffect(() => {
		const timeoutId = setTimeout(() => {
			if (currentPage === 1) {
				carregarCategorias();
			} else {
				setCurrentPage(1);
			}
		}, 500);

		return () => clearTimeout(timeoutId);
	}, [termoPesquisa]);

	const carregarCategorias = async () => {
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

			if (termoPesquisa) {
				params.append('search', termoPesquisa);
			}

			// Make API call with pagination
			const response = await fetch(`/api/categorias?${params.toString()}`);
			const data = await response.json();

			if (data.success) {
				setCategorias(data.data || []);
				if (data.pagination) {
					setTotalPages(data.pagination.totalPages);
					setTotalItems(data.pagination.total);
				}
			} else {
				throw new Error(data.error || 'Erro ao carregar categorias');
			}
		} catch (error) {
			console.error('Erro ao carregar categorias:', error);
			toast.error('Erro ao carregar categorias');
		} finally {
			setLoading(false);
		}
	};


	const salvarCategoria = async () => {
		if (!formulario.nome.trim()) {
			toast.error('Nome da categoria é obrigatório');
			return;
		}

		try {
			setSaving(true);
			// TODO: Replace with actual restaurant ID from session/context
			const restauranteId = 'default-restaurant';
			const categoriaData: Omit<Categoria, 'id'> = {
				...formulario,
				restauranteId,
			};

			let result;
			if (categoriaEditando) {
				result = await apiDataService.atualizarCategoria(
					categoriaEditando,
					categoriaData
				);
				if (result) {
					toast.success('Categoria atualizada com sucesso');
				} else {
					toast.error('Erro ao atualizar categoria');
					return;
				}
			} else {
				result = await apiDataService.salvarCategoria(categoriaData);
				if (result) {
					toast.success('Categoria criada com sucesso');
				} else {
					toast.error('Erro ao criar categoria');
					return;
				}
			}

			setFormulario(formularioVazio);
			setCategoriaEditando(null);
			setDialogoAberto(false);
			await carregarCategorias();
		} catch (error) {
			console.error('Erro ao salvar categoria:', error);
			toast.error('Erro ao salvar categoria');
		} finally {
			setSaving(false);
		}
	};

	const editarCategoria = (categoria: Categoria) => {
		setFormulario({
			nome: categoria.nome,
			descricao: categoria.descricao || '',
			cor: categoria.cor,
			icone: categoria.icone || '',
			ordem: categoria.ordem,
			ativa: categoria.ativa,
		});
		setCategoriaEditando(categoria.id);
		setDialogoAberto(true);
	};

	const excluirCategoria = async (categoria: Categoria) => {
		try {
			// Verificar se há produtos usando esta categoria
			// TODO: Replace with actual restaurant ID from session/context
			const restauranteId = 'default-restaurant';
			const produtos = await apiDataService.obterProdutos(restauranteId);
			const produtosUsandoCategoria = produtos.filter(
				(p) => p.categoriaId === categoria.id
			);

			if (produtosUsandoCategoria.length > 0) {
				toast.error(
					`Não é possível excluir. ${produtosUsandoCategoria.length} produto(s) estão usando esta categoria.`
				);
				return;
			}

			if (
				confirm(
					`Tem certeza que deseja excluir a categoria "${categoria.nome}"?`
				)
			) {
				const sucesso = await apiDataService.excluirCategoria(categoria.id);
				if (sucesso) {
					await carregarCategorias();
					toast.success('Categoria excluída com sucesso');
				} else {
					toast.error('Erro ao excluir categoria');
				}
			}
		} catch (error) {
			console.error('Erro ao excluir categoria:', error);
			toast.error('Erro ao excluir categoria');
		}
	};

	const alternarStatusCategoria = async (categoria: Categoria) => {
		try {
			const result = await apiDataService.atualizarCategoria(categoria.id, {
				ativa: !categoria.ativa,
			});
			if (result) {
				await carregarCategorias();
				toast.success(
					`Categoria ${categoria.ativa ? 'desativada' : 'ativada'} com sucesso`
				);
			} else {
				toast.error('Erro ao alterar status da categoria');
			}
		} catch (error) {
			console.error('Erro ao alterar status da categoria:', error);
			toast.error('Erro ao alterar status da categoria');
		}
	};

	const moverCategoria = async (
		categoria: Categoria,
		direcao: 'cima' | 'baixo'
	) => {
		try {
			const index = categorias.findIndex((c) => c.id === categoria.id);
			const novaOrdem =
				direcao === 'cima' ? categoria.ordem - 1 : categoria.ordem + 1;

			if (novaOrdem < 0 || novaOrdem >= categorias.length) return;

			// Trocar ordens
			const outraCategoria = categorias.find((c) => c.ordem === novaOrdem);
			if (outraCategoria) {
				await Promise.all([
					apiDataService.atualizarCategoria(categoria.id, { ordem: novaOrdem }),
					apiDataService.atualizarCategoria(outraCategoria.id, {
						ordem: categoria.ordem,
					}),
				]);
				await carregarCategorias();
			}
		} catch (error) {
			console.error('Erro ao mover categoria:', error);
			toast.error('Erro ao reordenar categoria');
		}
	};

	// No need for local filtering since it's done on server
	const categoriasFiltradas = categorias;

	const contarProdutosPorCategoria = (categoria: Categoria) => {
		// Use the _count from the API response if available
		return (categoria as any)._count?.produtos || 0;
	};

	const handlePageChange = useCallback((page: number) => {
		setCurrentPage(page);
	}, []);

	const handleItemsPerPageChange = useCallback((newItemsPerPage: number) => {
		setItemsPerPage(newItemsPerPage);
		setCurrentPage(1); // Reset to first page when changing page size
	}, []);

	return (
		<LayoutPrincipal>
			<div className='container mx-auto p-6 space-y-6'>
				<div className='flex justify-between items-center'>
					<div>
						<h1 className='text-3xl font-bold text-primary'>
							Categorias de Produtos
						</h1>
						<p className='text-muted-foreground'>
							Organize seus produtos em categorias
						</p>
					</div>
					<Dialog open={dialogoAberto} onOpenChange={setDialogoAberto}>
						<DialogTrigger asChild>
							<Button
								onClick={() => {
									setFormulario(formularioVazio);
									setCategoriaEditando(null);
								}}
							>
								<Plus className='mr-2 h-4 w-4' />
								Nova Categoria
							</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>
									{categoriaEditando ? 'Editar Categoria' : 'Nova Categoria'}
								</DialogTitle>
							</DialogHeader>

							<div className='space-y-4'>
								<div>
									<Label htmlFor='nome'>Nome *</Label>
									<Input
										id='nome'
										value={formulario.nome}
										onChange={(e) =>
											setFormulario((prev) => ({
												...prev,
												nome: e.target.value,
											}))
										}
										placeholder='Ex: Bebidas, Pratos Principais'
									/>
								</div>

								<div>
									<Label htmlFor='descricao'>Descrição</Label>
									<Textarea
										id='descricao'
										value={formulario.descricao}
										onChange={(e) =>
											setFormulario((prev) => ({
												...prev,
												descricao: e.target.value,
											}))
										}
										placeholder='Descrição da categoria (opcional)'
										rows={3}
									/>
								</div>

								<div>
									<Label>Cor da Categoria</Label>
									<div className='mt-2 space-y-3'>
										<div className='flex items-center gap-2'>
											<Input
												type='color'
												value={formulario.cor}
												onChange={(e) =>
													setFormulario((prev) => ({
														...prev,
														cor: e.target.value,
													}))
												}
												className='w-20 h-10'
											/>
											<Input
												type='text'
												value={formulario.cor}
												onChange={(e) =>
													setFormulario((prev) => ({
														...prev,
														cor: e.target.value,
													}))
												}
												placeholder='#000000'
												className='flex-1'
											/>
										</div>
										<div className='flex gap-2 flex-wrap'>
											{CORES_PREDEFINIDAS.map((cor) => (
												<button
													key={cor}
													type='button'
													className='w-8 h-8 rounded-md border-2 border-border hover:scale-110 transition-transform'
													style={{ backgroundColor: cor }}
													onClick={() =>
														setFormulario((prev) => ({ ...prev, cor }))
													}
												/>
											))}
										</div>
									</div>
								</div>

								<div className='flex items-center space-x-2'>
									<Switch
										id='ativa'
										checked={formulario.ativa}
										onCheckedChange={(checked) =>
											setFormulario((prev) => ({ ...prev, ativa: checked }))
										}
									/>
									<Label htmlFor='ativa'>Categoria ativa</Label>
								</div>

								<div className='flex justify-end space-x-2 pt-4'>
									<Button
										variant='outline'
										onClick={() => setDialogoAberto(false)}
									>
										Cancelar
									</Button>
									<Button onClick={salvarCategoria} disabled={saving}>
										{saving
											? 'Salvando...'
											: categoriaEditando
											? 'Atualizar'
											: 'Criar'}{' '}
										Categoria
									</Button>
								</div>
							</div>
						</DialogContent>
					</Dialog>
				</div>

				{/* Barra de pesquisa */}
				<Card>
					<CardContent className='p-4'>
						<div className='relative'>
							<Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4' />
							<Input
								placeholder='Pesquisar categorias...'
								value={termoPesquisa}
								onChange={(e) => setTermoPesquisa(e.target.value)}
								className='pl-10'
							/>
						</div>
					</CardContent>
				</Card>

				{/* Lista de categorias */}
				<div className='grid gap-4'>
					{loading ? (
						<Card>
							<CardContent className='p-8 text-center'>
								<div className='animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4'></div>
								<p className='text-muted-foreground'>
									Carregando categorias...
								</p>
							</CardContent>
						</Card>
					) : categoriasFiltradas.length === 0 ? (
						<Card>
							<CardContent className='p-8 text-center'>
								<Grid3X3 className='mx-auto h-12 w-12 text-muted-foreground mb-4' />
								<h3 className='text-lg font-semibold mb-2'>
									Nenhuma categoria encontrada
								</h3>
								<p className='text-muted-foreground mb-4'>
									{termoPesquisa
										? 'Tente ajustar sua pesquisa.'
										: 'Comece criando sua primeira categoria.'}
								</p>
								{!termoPesquisa && (
									<Button onClick={() => setDialogoAberto(true)}>
										<Plus className='mr-2 h-4 w-4' />
										Criar Primeira Categoria
									</Button>
								)}
							</CardContent>
						</Card>
					) : (
						categoriasFiltradas.map((categoria, index) => (
							<Card
								key={categoria.id}
								className='hover:shadow-md transition-shadow'
							>
								<CardHeader className='pb-3'>
									<div className='flex justify-between items-start'>
										<div className='flex items-center gap-3'>
											<div
												className='w-12 h-12 rounded-lg flex items-center justify-center'
												style={{
													backgroundColor: categoria.cor + '20',
													color: categoria.cor,
												}}
											>
												<Grid3X3 className='h-6 w-6' />
											</div>
											<div>
												<CardTitle className='text-lg flex items-center gap-2'>
													{categoria.nome}
													<Badge
														variant={categoria.ativa ? 'default' : 'secondary'}
													>
														{categoria.ativa ? 'Ativa' : 'Inativa'}
													</Badge>
												</CardTitle>
												{categoria.descricao && (
													<p className='text-sm text-muted-foreground mt-1'>
														{categoria.descricao}
													</p>
												)}
												<p className='text-sm text-muted-foreground mt-1'>
													{contarProdutosPorCategoria(categoria)} produto(s)
												</p>
											</div>
										</div>
										<div className='flex gap-2'>
											<Button
												variant='ghost'
												size='sm'
												onClick={() => moverCategoria(categoria, 'cima')}
												disabled={index === 0}
												title='Mover para cima'
											>
												↑
											</Button>
											<Button
												variant='ghost'
												size='sm'
												onClick={() => moverCategoria(categoria, 'baixo')}
												disabled={index === categoriasFiltradas.length - 1}
												title='Mover para baixo'
											>
												↓
											</Button>
											<Button
												variant='ghost'
												size='sm'
												onClick={() => alternarStatusCategoria(categoria)}
											>
												{categoria.ativa ? 'Desativar' : 'Ativar'}
											</Button>
											<Button
												variant='ghost'
												size='sm'
												onClick={() => editarCategoria(categoria)}
											>
												<Edit className='h-4 w-4' />
											</Button>
											<Button
												variant='ghost'
												size='sm'
												onClick={() => excluirCategoria(categoria)}
												className='text-destructive hover:text-destructive'
											>
												<Trash2 className='h-4 w-4' />
											</Button>
										</div>
									</div>
								</CardHeader>
							</Card>
						))
					)}
				</div>

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
