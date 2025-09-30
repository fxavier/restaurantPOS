'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
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
	FileText,
	Search,
	Calendar,
	Euro,
	Package,
	Truck,
	Eye,
	Send,
	Check,
	X,
} from 'lucide-react';
import LayoutPrincipal from '@/components/layout/layout-principal';
import { apiDataService } from '@/lib/api-data-service';
import {
	OrdemCompra,
	ItemOrdemCompra,
	StatusOrdemCompra,
	Fornecedor,
	Produto,
} from '@/types/sistema-restaurante';
import DataPagination from '@/components/ui/data-pagination';

interface FormularioOrdemCompra {
	fornecedorId: string;
	dataEntregaPrevista: string;
	observacoes: string;
	itens: ItemOrdemCompra[];
}

const formularioVazio: FormularioOrdemCompra = {
	fornecedorId: '',
	dataEntregaPrevista: '',
	observacoes: '',
	itens: [],
};

const STATUS_CORES: Record<StatusOrdemCompra, string> = {
	rascunho: 'secondary',
	enviada: 'default',
	confirmada: 'default',
	recebida: 'default',
	cancelada: 'destructive',
};

const STATUS_LABELS: Record<StatusOrdemCompra, string> = {
	rascunho: 'Rascunho',
	enviada: 'Enviada',
	confirmada: 'Confirmada',
	recebida: 'Recebida',
	cancelada: 'Cancelada',
};

export default function PaginaCompras() {
	const [ordensCompra, setOrdensCompra] = useState<OrdemCompra[]>([]);
	const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
	const [produtos, setProdutos] = useState<Produto[]>([]);
	const [formulario, setFormulario] =
		useState<FormularioOrdemCompra>(formularioVazio);
	const [ordemEditando, setOrdemEditando] = useState<string | null>(null);
	const [dialogoAberto, setDialogoAberto] = useState(false);
	const [termoPesquisa, setTermoPesquisa] = useState('');
	const [filtroStatus, setFiltroStatus] = useState<StatusOrdemCompra | 'todos'>(
		'todos'
	);
	const [produtoSelecionado, setProdutoSelecionado] = useState('');
	const [quantidadeProduto, setQuantidadeProduto] = useState('');
	const [precoProduto, setPrecoProduto] = useState('');
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);

	// Pagination state
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(20);
	const [totalPages, setTotalPages] = useState(0);
	const [totalItems, setTotalItems] = useState(0);

	useEffect(() => {
		carregarDados();
	}, [currentPage, itemsPerPage, filtroStatus]);

	const carregarDados = useCallback(async () => {
		setLoading(true);
		try {
			const restauranteId = 'default-restaurant'; // TODO: Get from context
			
			// Load purchase orders with pagination
			const { ordensCompra: ordens, pagination } =
				await apiDataService.obterOrdensCompra({
					page: currentPage,
					limit: itemsPerPage,
					status: filtroStatus !== 'todos' ? filtroStatus : undefined,
					restauranteId,
				});

			setOrdensCompra(ordens);
			setTotalPages(pagination.totalPages);
			setTotalItems(pagination.total);

			// Load suppliers and products for the specific restaurant
			const [fornecedoresData, produtosData] = await Promise.all([
				apiDataService.obterFornecedores(restauranteId),
				apiDataService.obterProdutos(restauranteId),
			]);

			setFornecedores(fornecedoresData.filter((f) => f.ativo));
			setProdutos(produtosData);
		} catch (error) {
			console.error('Erro ao carregar dados:', error);
			toast.error('Erro ao carregar dados');
		} finally {
			setLoading(false);
		}
	}, [currentPage, itemsPerPage, filtroStatus]);

	const gerarNumeroOrdem = () => {
		const agora = new Date();
		const ano = agora.getFullYear().toString().slice(-2);
		const mes = (agora.getMonth() + 1).toString().padStart(2, '0');
		const dia = agora.getDate().toString().padStart(2, '0');
		const hora = agora.getHours().toString().padStart(2, '0');
		const minuto = agora.getMinutes().toString().padStart(2, '0');
		const segundo = agora.getSeconds().toString().padStart(2, '0');
		const aleatorio = Math.floor(Math.random() * 100).toString().padStart(2, '0');
		return `OC${ano}${mes}${dia}${hora}${minuto}${segundo}${aleatorio}`;
	};

	const adicionarItem = () => {
		console.log('=== ADICIONAR ITEM CHAMADO ===');
		console.log('Produto selecionado:', produtoSelecionado);
		console.log('Quantidade:', quantidadeProduto);
		console.log('Preço:', precoProduto);
		console.log('Produtos disponíveis:', produtos);

		if (!produtoSelecionado || !quantidadeProduto || !precoProduto) {
			console.log('Campos não preenchidos - mostrando toast de erro');
			toast.error('Preencha todos os campos do item');
			return;
		}

		const produto = produtos.find((p) => p.id === produtoSelecionado);
		console.log('Produto encontrado:', produto);
		if (!produto) {
			console.log('Produto não encontrado!');
			return;
		}

		const quantidade = parseFloat(quantidadeProduto);
		const precoUnitario = parseFloat(precoProduto);
		console.log('Quantidade parseada:', quantidade);
		console.log('Preço parseado:', precoUnitario);

		const novoItem: ItemOrdemCompra = {
			id: Date.now().toString(),
			produtoId: produto.id,
			produtoNome: produto.nome,
			quantidade,
			precoUnitario,
			precoTotal: quantidade * precoUnitario,
		};

		console.log('Novo item criado:', novoItem);

		setFormulario((prev) => {
			console.log('Estado anterior do formulário:', prev);
			const novoEstado = {
				...prev,
				itens: [...prev.itens, novoItem],
			};
			console.log('Novo estado do formulário:', novoEstado);
			return novoEstado;
		});

		setProdutoSelecionado('');
		setQuantidadeProduto('');
		setPrecoProduto('');

		console.log('Item adicionado ao formulário');
	};

	const removerItem = async (itemId: string) => {
		try {
			const { default: Swal } = await import('sweetalert2');
			
			const result = await Swal.fire({
				title: 'Tem certeza?',
				text: 'Deseja remover este item da ordem de compra?',
				icon: 'warning',
				showCancelButton: true,
				confirmButtonColor: '#d33',
				cancelButtonColor: '#3085d6',
				confirmButtonText: 'Sim, remover!',
				cancelButtonText: 'Cancelar'
			});

			if (result.isConfirmed) {
				setFormulario((prev) => ({
					...prev,
					itens: prev.itens.filter((item) => item.id !== itemId),
				}));

				await Swal.fire(
					'Removido!',
					'O item foi removido da ordem de compra.',
					'success'
				);
			}
		} catch (error) {
			console.error('Erro ao carregar SweetAlert2:', error);
			// Fallback to browser confirm
			if (confirm('Tem certeza que deseja remover este item?')) {
				setFormulario((prev) => ({
					...prev,
					itens: prev.itens.filter((item) => item.id !== itemId),
				}));
			}
		}
	};

	const calcularTotais = () => {
		const subtotal = formulario.itens.reduce(
			(acc, item) => acc + item.precoTotal,
			0
		);
		const impostos = subtotal * 0.16; // IVA 16% (Moçambique)
		const total = subtotal + impostos;

		return { subtotal, impostos, total };
	};

	const salvarOrdemCompra = async () => {
		console.log('=== INICIANDO SALVAMENTO DA ORDEM ===');
		console.log('Formulário atual:', formulario);

		if (!formulario.fornecedorId) {
			console.log('Erro: Fornecedor não selecionado');
			toast.error('Selecione um fornecedor');
			return;
		}

		if (formulario.itens.length === 0) {
			console.log('Erro: Nenhum item na ordem');
			toast.error('Adicione pelo menos um item à ordem de compra');
			return;
		}

		setSaving(true);
		try {
			// TODO: Replace with actual restaurant ID from session/context
			const restauranteId = 'default-restaurant';
			console.log('Restaurant ID:', restauranteId);

			const ordemData = {
				numero: ordemEditando
					? ordensCompra.find((o) => o.id === ordemEditando)?.numero ||
					  gerarNumeroOrdem()
					: gerarNumeroOrdem(),
				fornecedorId: formulario.fornecedorId,
				subtotal: 0, // Will be calculated by the API when items are added
				impostos: 0, // Will be calculated by the API when items are added
				total: 0, // Will be calculated by the API when items are added
				status: 'rascunho' as StatusOrdemCompra,
				dataEntregaPrevista: formulario.dataEntregaPrevista ? new Date(formulario.dataEntregaPrevista).toISOString() : undefined,
				observacoes: formulario.observacoes || undefined,
				usuarioId: 'sistema-admin', // Using system admin user
				restauranteId: restauranteId,
			};

			console.log('Dados da ordem a serem salvos:', ordemData);

			let ordemId: string;

			if (ordemEditando) {
				console.log('Editando ordem existente:', ordemEditando);
				await apiDataService.atualizarOrdemCompra(ordemEditando, ordemData);
				ordemId = ordemEditando;
				// TODO: Handle updating existing items (for now, we just update the order)
			} else {
				console.log('Criando nova ordem...');
				console.log('=== PAYLOAD SENDO ENVIADO PARA API ===');
				console.log(JSON.stringify(ordemData, null, 2));
				
				// Create the order first
				const response = await fetch('/api/compras', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(ordemData),
				});

				const responseData = await response.json();
				console.log('Resposta completa da API:', responseData);
				console.log('Response status:', response.status);
				console.log('Response ok:', response.ok);

				if (!response.ok) {
					throw new Error(responseData.error || `HTTP error! status: ${response.status}`);
				}

				// Check if we have a successful response
				if (responseData.success === false) {
					throw new Error(responseData.error || 'Falha ao criar ordem de compra');
				}

				// The API returns the data wrapped in a data property
				const novaOrdem = responseData.data;
				console.log('Ordem criada (data):', novaOrdem);
				console.log('Tipo de novaOrdem:', typeof novaOrdem);
				console.log('Keys de novaOrdem:', novaOrdem ? Object.keys(novaOrdem) : 'null');
				
				// If novaOrdem is still an empty object, try the responseData directly
				if (!novaOrdem || Object.keys(novaOrdem).length === 0) {
					console.log('novaOrdem está vazio, tentando responseData diretamente');
					// Maybe the API returned the order directly without wrapping
					if (responseData.id) {
						ordemId = responseData.id;
					} else {
						console.error('Resposta da API não contém ID da ordem');
						throw new Error('Falha ao criar ordem de compra - resposta inválida da API');
					}
				} else {
					ordemId = novaOrdem.id;
				}
				
				console.log('ID da ordem criada:', ordemId);

				console.log('Buscando unidades de medida...');
				// Get a default unit of measure once (outside the loop for efficiency)
				const unidadeResponse = await fetch(
					`/api/configuracoes/unidades-medida?restauranteId=${restauranteId}`
				);
				
				if (!unidadeResponse.ok) {
					throw new Error(`Erro ao buscar unidades de medida: ${unidadeResponse.status}`);
				}

				const unidadesData = await unidadeResponse.json();
				console.log('Resposta das unidades:', unidadesData);

				// Handle the API response format - it returns {success: true, data: [...]}
				const unidadesArray = unidadesData.success ? unidadesData.data : [];
				console.log('Array de unidades:', unidadesArray);

				if (!Array.isArray(unidadesArray) || unidadesArray.length === 0) {
					throw new Error(
						'Nenhuma unidade de medida encontrada. Configure as unidades primeiro.'
					);
				}

				const unidadePadrao =
					unidadesArray.find((u: any) => u.nome === 'Unidade') ||
					unidadesArray[0];

				console.log('Unidade padrão selecionada:', unidadePadrao);

				// Then create each item
				console.log('Criando itens da ordem...');
				for (let i = 0; i < formulario.itens.length; i++) {
					const item = formulario.itens[i];
					console.log(`Criando item ${i + 1}/${formulario.itens.length}:`, item);

					const itemData = {
						produtoId: item.produtoId,
						produtoNome: item.produtoNome,
						quantidade: item.quantidade,
						precoUnitario: item.precoUnitario,
						precoTotal: item.precoTotal,
						unidadeMedidaId: unidadePadrao.id,
					};

					console.log('Dados do item a serem salvos:', itemData);

					const itemResult = await apiDataService.salvarItemOrdemCompra(
						ordemId,
						itemData
					);
					console.log('Resultado do item criado:', itemResult);
					
					if (!itemResult) {
						throw new Error(`Falha ao criar item: ${item.produtoNome}`);
					}
				}
			}

			console.log('Ordem salva com sucesso!');
			toast.success(
				ordemEditando
					? 'Ordem de compra atualizada com sucesso'
					: 'Ordem de compra criada com sucesso'
			);
			setFormulario(formularioVazio);
			setOrdemEditando(null);
			setDialogoAberto(false);
			await carregarDados();
		} catch (error) {
			console.error('=== ERRO AO SALVAR ORDEM ===');
			console.error('Erro completo:', error);
			console.error('Stack trace:', error instanceof Error ? error.stack : 'N/A');
			toast.error(
				'Erro ao salvar ordem de compra: ' +
					(error instanceof Error ? error.message : 'Erro desconhecido')
			);
		} finally {
			setSaving(false);
		}
	};

	const editarOrdem = async (ordem: OrdemCompra) => {
		setLoading(true);
		try {
			// Fetch the full order details
			const ordemCompleta = await apiDataService.obterOrdemCompra(ordem.id);
			if (!ordemCompleta) {
				toast.error('Ordem de compra não encontrada');
				return;
			}

			setFormulario({
				fornecedorId: ordemCompleta.fornecedorId,
				dataEntregaPrevista: ordemCompleta.dataEntregaPrevista || '',
				observacoes: ordemCompleta.observacoes || '',
				itens: ordemCompleta.itens,
			});
			setOrdemEditando(ordemCompleta.id);
			setDialogoAberto(true);
		} catch (error) {
			console.error('Erro ao carregar ordem de compra:', error);
			toast.error('Erro ao carregar ordem de compra');
		} finally {
			setLoading(false);
		}
	};

	const excluirOrdem = async (ordem: OrdemCompra) => {
		try {
			const { default: Swal } = await import('sweetalert2');
			
			const result = await Swal.fire({
				title: 'Tem certeza?',
				text: `Deseja excluir permanentemente a ordem ${ordem.numero}?`,
				icon: 'warning',
				showCancelButton: true,
				confirmButtonColor: '#d33',
				cancelButtonColor: '#3085d6',
				confirmButtonText: 'Sim, excluir!',
				cancelButtonText: 'Cancelar'
			});

			if (result.isConfirmed) {
				setLoading(true);
				try {
					await apiDataService.excluirOrdemCompra(ordem.id);
					
					await Swal.fire(
						'Excluída!',
						'A ordem de compra foi excluída com sucesso.',
						'success'
					);
					
					await carregarDados();
				} catch (error) {
					console.error('Erro ao excluir ordem de compra:', error);
					
					await Swal.fire(
						'Erro!',
						'Erro ao excluir ordem de compra.',
						'error'
					);
				} finally {
					setLoading(false);
				}
			}
		} catch (error) {
			console.error('Erro ao carregar SweetAlert2:', error);
			// Fallback to browser confirm
			if (confirm(`Tem certeza que deseja excluir a ordem ${ordem.numero}?`)) {
				setLoading(true);
				try {
					await apiDataService.excluirOrdemCompra(ordem.id);
					toast.success('Ordem de compra excluída com sucesso');
					await carregarDados();
				} catch (error) {
					console.error('Erro ao excluir ordem de compra:', error);
					toast.error('Erro ao excluir ordem de compra');
				} finally {
					setLoading(false);
				}
			}
		}
	};

	const alterarStatusOrdem = async (
		ordem: OrdemCompra,
		novoStatus: StatusOrdemCompra
	) => {
		setLoading(true);
		try {
			await apiDataService.atualizarStatusOrdemCompra(ordem.id, novoStatus);
			toast.success(`Status alterado para ${STATUS_LABELS[novoStatus]}`);
			await carregarDados();
		} catch (error) {
			console.error('Erro ao alterar status da ordem:', error);
			toast.error('Erro ao alterar status da ordem');
		} finally {
			setLoading(false);
		}
	};

	const obterNomeFornecedor = (ordem: OrdemCompra) => {
		// Check if the order has a populated fornecedor object
		if (ordem.fornecedor && typeof ordem.fornecedor === 'object') {
			return ordem.fornecedor.nome;
		}
		// Fallback to finding in the local array
		const fornecedor = (fornecedores || []).find(
			(f) => f.id === ordem.fornecedorId
		);
		return fornecedor?.nome || 'Fornecedor não encontrado';
	};

	const ordensFiltradas = (ordensCompra || []).filter((ordem) => {
		const correspondeNumero =
			ordem.numero.toLowerCase().includes(termoPesquisa.toLowerCase()) ||
			obterNomeFornecedor(ordem)
				.toLowerCase()
				.includes(termoPesquisa.toLowerCase());
		return correspondeNumero;
	});

	const { subtotal, impostos, total } = calcularTotais();

	return (
		<LayoutPrincipal>
			<div className='container mx-auto p-6 space-y-6'>
				<div className='flex justify-between items-center'>
					<div>
						<h1 className='text-3xl font-bold text-primary'>
							Ordens de Compra
						</h1>
						<p className='text-muted-foreground'>
							Gerencie pedidos de compra para fornecedores
						</p>
					</div>
					<Dialog open={dialogoAberto} onOpenChange={setDialogoAberto}>
						<DialogTrigger asChild>
							<Button
								onClick={() => {
									setFormulario(formularioVazio);
									setOrdemEditando(null);
								}}
							>
								<Plus className='mr-2 h-4 w-4' />
								Nova Ordem de Compra
							</Button>
						</DialogTrigger>
						<DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
							<DialogHeader>
								<DialogTitle>
									{ordemEditando
										? 'Editar Ordem de Compra'
										: 'Nova Ordem de Compra'}
								</DialogTitle>
							</DialogHeader>

							<div className='space-y-6'>
								<div className='grid grid-cols-2 gap-4'>
									<div>
										<Label htmlFor='fornecedor'>Fornecedor *</Label>
										<Select
											value={formulario.fornecedorId}
											onValueChange={(value) =>
												setFormulario((prev) => ({
													...prev,
													fornecedorId: value,
												}))
											}
										>
											<SelectTrigger>
												<SelectValue placeholder='Selecione um fornecedor' />
											</SelectTrigger>
											<SelectContent>
												{fornecedores.map((fornecedor) => (
													<SelectItem key={fornecedor.id} value={fornecedor.id}>
														{fornecedor.nome}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
									<div>
										<Label htmlFor='dataEntrega'>
											Data de Entrega Prevista
										</Label>
										<Input
											id='dataEntrega'
											type='date'
											value={formulario.dataEntregaPrevista}
											onChange={(e) =>
												setFormulario((prev) => ({
													...prev,
													dataEntregaPrevista: e.target.value,
												}))
											}
										/>
									</div>
								</div>

								<div>
									<Label htmlFor='observacoes'>Observações</Label>
									<Textarea
										id='observacoes'
										value={formulario.observacoes}
										onChange={(e) =>
											setFormulario((prev) => ({
												...prev,
												observacoes: e.target.value,
											}))
										}
										placeholder='Observações sobre a ordem de compra...'
										rows={3}
									/>
								</div>

								{/* Adicionar Itens */}
								<div className='border rounded-lg p-4'>
									<h3 className='font-semibold mb-4'>Adicionar Itens</h3>
									<div className='grid grid-cols-4 gap-4 mb-4'>
										<div>
											<Label>Produto</Label>
											<Select
												value={produtoSelecionado}
												onValueChange={setProdutoSelecionado}
											>
												<SelectTrigger>
													<SelectValue placeholder='Selecione' />
												</SelectTrigger>
												<SelectContent>
													{produtos.map((produto) => (
														<SelectItem key={produto.id} value={produto.id}>
															{produto.nome}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
										<div>
											<Label>Quantidade</Label>
											<Input
												type='number'
												value={quantidadeProduto}
												onChange={(e) => setQuantidadeProduto(e.target.value)}
												placeholder='0'
												min='0'
												step='0.01'
											/>
										</div>
										<div>
											<Label>Preço Unitário (MT )</Label>
											<Input
												type='number'
												value={precoProduto}
												onChange={(e) => setPrecoProduto(e.target.value)}
												placeholder='0.00'
												min='0'
												step='0.01'
											/>
										</div>
										<div className='flex items-end'>
											<Button
												onClick={() => {
													console.log('Botão Adicionar clicado!');
													adicionarItem();
												}}
												className='w-full'
												disabled={saving}
											>
												<Plus className='mr-2 h-4 w-4' />
												Adicionar
											</Button>
										</div>
									</div>
								</div>

								{/* Lista de Itens */}
								{formulario.itens.length > 0 && (
									<div className='border rounded-lg'>
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead>Produto</TableHead>
													<TableHead>Quantidade</TableHead>
													<TableHead>Preço Unit.</TableHead>
													<TableHead>Total</TableHead>
													<TableHead></TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{formulario.itens.map((item) => (
													<TableRow key={item.id}>
														<TableCell>{item.produtoNome}</TableCell>
														<TableCell>{item.quantidade}</TableCell>
														<TableCell>
															MT {item.precoUnitario.toFixed(2)}
														</TableCell>
														<TableCell>
															MT {item.precoTotal.toFixed(2)}
														</TableCell>
														<TableCell>
															<Button
																variant='ghost'
																size='sm'
																onClick={() => removerItem(item.id)}
																className='text-destructive'
															>
																<Trash2 className='h-4 w-4' />
															</Button>
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>

										<div className='p-4 border-t bg-muted/50'>
											<div className='flex justify-end space-y-1'>
												<div className='text-right space-y-1'>
													<div className='flex justify-between gap-8'>
														<span>Subtotal:</span>
														<span>MT {subtotal.toFixed(2)}</span>
													</div>
													<div className='flex justify-between gap-8'>
														<span>IVA (16%):</span>
														<span>MT {impostos.toFixed(2)}</span>
													</div>
													<div className='flex justify-between gap-8 font-semibold text-lg'>
														<span>Total:</span>
														<span>MT {total.toFixed(2)}</span>
													</div>
												</div>
											</div>
										</div>
									</div>
								)}

								<div className='flex justify-end space-x-2 pt-4'>
									<Button
										variant='outline'
										onClick={() => setDialogoAberto(false)}
										disabled={saving}
									>
										Cancelar
									</Button>
									<Button onClick={salvarOrdemCompra} disabled={saving}>
										{saving
											? 'Salvando...'
											: ordemEditando
											? 'Atualizar'
											: 'Criar'}{' '}
										Ordem
									</Button>
								</div>
							</div>
						</DialogContent>
					</Dialog>
				</div>

				{/* Filtros */}
				<Card>
					<CardContent className='p-4'>
						<div className='flex gap-4 items-center'>
							<div className='flex-1'>
								<div className='relative'>
									<Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4' />
									<Input
										placeholder='Pesquisar ordens...'
										value={termoPesquisa}
										onChange={(e) => {
											setTermoPesquisa(e.target.value);
											setCurrentPage(1);
										}}
										className='pl-10'
									/>
								</div>
							</div>
							<Select
								value={filtroStatus}
								onValueChange={(value: any) => {
									setFiltroStatus(value);
									setCurrentPage(1);
								}}
							>
								<SelectTrigger className='w-48'>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='todos'>Todos os Status</SelectItem>
									<SelectItem value='rascunho'>Rascunho</SelectItem>
									<SelectItem value='enviada'>Enviada</SelectItem>
									<SelectItem value='confirmada'>Confirmada</SelectItem>
									<SelectItem value='recebida'>Recebida</SelectItem>
									<SelectItem value='cancelada'>Cancelada</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</CardContent>
				</Card>

				{/* Lista de Ordens */}
				{loading ? (
					<Card>
						<CardContent className='p-8 text-center'>
							<div className='flex justify-center items-center'>
								<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
							</div>
							<p className='mt-4 text-muted-foreground'>
								Carregando ordens de compra...
							</p>
						</CardContent>
					</Card>
				) : (
					<>
						<div className='grid gap-4'>
							{ordensFiltradas.length === 0 ? (
								<Card>
									<CardContent className='p-8 text-center'>
										<FileText className='mx-auto h-12 w-12 text-muted-foreground mb-4' />
										<h3 className='text-lg font-semibold mb-2'>
											Nenhuma ordem encontrada
										</h3>
										<p className='text-muted-foreground mb-4'>
											{termoPesquisa
												? 'Tente ajustar os filtros de pesquisa.'
												: 'Comece criando sua primeira ordem de compra.'}
										</p>
										{!termoPesquisa && (
											<Button onClick={() => setDialogoAberto(true)}>
												<Plus className='mr-2 h-4 w-4' />
												Criar Primeira Ordem
											</Button>
										)}
									</CardContent>
								</Card>
							) : (
								ordensFiltradas.map((ordem) => (
									<Card
										key={ordem.id}
										className='hover:shadow-md transition-shadow'
									>
										<CardHeader className='pb-3'>
											<div className='flex justify-between items-start'>
												<div className='flex-1'>
													<div className='flex items-center gap-2 mb-2'>
														<CardTitle className='text-lg flex items-center gap-2'>
															<FileText className='h-5 w-5' />
															{ordem.numero}
														</CardTitle>
														<Badge variant={STATUS_CORES[ordem.status] as any}>
															{STATUS_LABELS[ordem.status]}
														</Badge>
													</div>
													<div className='space-y-1 text-sm text-muted-foreground'>
														<div className='flex items-center gap-2'>
															<Truck className='h-4 w-4' />
															{obterNomeFornecedor(ordem)}
														</div>
														<div className='flex items-center gap-2'>
															<Calendar className='h-4 w-4' />
															Criada em:{' '}
															{new Date(ordem.criadaEm).toLocaleDateString(
																'pt-PT'
															)}
														</div>
														{ordem.dataEntregaPrevista && (
															<div className='flex items-center gap-2'>
																<Calendar className='h-4 w-4' />
																Entrega prevista:{' '}
																{new Date(
																	ordem.dataEntregaPrevista
																).toLocaleDateString('pt-PT')}
															</div>
														)}
														<div className='flex items-center gap-2'>
															<Package className='h-4 w-4' />
															{ordem._count?.itens || 0}{' '}
															{(ordem._count?.itens || 0) === 1
																? 'item'
																: 'itens'}
														</div>
														<div className='flex items-center gap-2'>
															<Euro className='h-4 w-4' />
															Total: MT {ordem.total.toFixed(2)}
														</div>
													</div>
												</div>
												<div className='flex gap-2'>
													{ordem.status === 'rascunho' && (
														<Button
															variant='ghost'
															size='sm'
															onClick={() =>
																alterarStatusOrdem(ordem, 'enviada')
															}
															title='Enviar ordem'
															disabled={loading}
														>
															<Send className='h-4 w-4' />
														</Button>
													)}
													{ordem.status === 'enviada' && (
														<Button
															variant='ghost'
															size='sm'
															onClick={() =>
																alterarStatusOrdem(ordem, 'confirmada')
															}
															title='Confirmar ordem'
															disabled={loading}
														>
															<Check className='h-4 w-4' />
														</Button>
													)}
													{ordem.status === 'confirmada' && (
														<Button
															variant='ghost'
															size='sm'
															onClick={() =>
																alterarStatusOrdem(ordem, 'recebida')
															}
															title='Marcar como recebida'
															disabled={loading}
														>
															<Package className='h-4 w-4' />
														</Button>
													)}
													{ordem.status !== 'cancelada' &&
														ordem.status !== 'recebida' && (
															<Button
																variant='ghost'
																size='sm'
																onClick={() =>
																	alterarStatusOrdem(ordem, 'cancelada')
																}
																title='Cancelar ordem'
																className='text-destructive hover:text-destructive'
																disabled={loading}
															>
																<X className='h-4 w-4' />
															</Button>
														)}
													<Button
														variant='ghost'
														size='sm'
														onClick={() => editarOrdem(ordem)}
														title='Editar ordem'
														disabled={
															ordem.status === 'recebida' ||
															ordem.status === 'cancelada' ||
															loading
														}
													>
														<Edit className='h-4 w-4' />
													</Button>
													<Button
														variant='ghost'
														size='sm'
														onClick={() => excluirOrdem(ordem)}
														title='Excluir ordem'
														className='text-destructive hover:text-destructive'
														disabled={loading}
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
						<DataPagination
							currentPage={currentPage}
							totalPages={totalPages}
							totalItems={totalItems}
							itemsPerPage={itemsPerPage}
							onPageChange={setCurrentPage}
							onItemsPerPageChange={(newItemsPerPage) => {
								setItemsPerPage(newItemsPerPage);
								setCurrentPage(1);
							}}
							isLoading={loading}
						/>
					</>
				)}
			</div>

			{/* Diálogo temporariamente removido para teste */}
		</LayoutPrincipal>
	);
}
