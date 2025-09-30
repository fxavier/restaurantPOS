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
	Clock,
	Plus,
	DollarSign,
	TrendingUp,
	Users,
	Search,
	Eye,
	PowerOff,
	AlertCircle,
	CheckCircle,
} from 'lucide-react';
import { TurnoFechamento } from '@/types/sistema-restaurante';

interface TurnoExtendido extends TurnoFechamento {
	usuario?: {
		id: string;
		nome: string;
		email: string;
	};
	restaurante?: {
		id: string;
		nome: string;
	};
}

export default function PaginaTurnos() {
	const [turnos, setTurnos] = useState<TurnoExtendido[]>([]);
	const [turnoAtivo, setTurnoAtivo] = useState<TurnoExtendido | null>(null);
	const [carregando, setCarregando] = useState(true);
	const [busca, setBusca] = useState('');
	const [dialogoAbrirAberto, setDialogoAbrirAberto] = useState(false);
	const [dialogoFecharAberto, setDialogoFecharAberto] = useState(false);
	const [dialogoDetalhesAberto, setDialogoDetalhesAberto] = useState(false);
	const [turnoSelecionado, setTurnoSelecionado] = useState<TurnoExtendido | null>(null);

	// Pagination state
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(20);
	const [totalPages, setTotalPages] = useState(0);
	const [totalItems, setTotalItems] = useState(0);

	// TODO: Replace with actual restaurant ID from session/context
	const RESTAURANT_ID = 'default-restaurant';

	// Formulários
	const [valorAbertura, setValorAbertura] = useState('');
	const [observacoesAbertura, setObservacoesAbertura] = useState('');
	const [valorFechamento, setValorFechamento] = useState('');
	const [observacoesFechamento, setObservacoesFechamento] = useState('');

	useEffect(() => {
		carregarDados();
	}, [currentPage, itemsPerPage]);

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
			const params = new URLSearchParams({
				page: currentPage.toString(),
				limit: itemsPerPage.toString(),
				restauranteId: RESTAURANT_ID,
			});

			if (busca) {
				params.append('search', busca);
			}

			const response = await fetch(`/api/turnos?${params.toString()}`);

			if (!response.ok) {
				throw new Error('Erro ao carregar turnos');
			}

			const data = await response.json();
			const turnosArray = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];

			setTurnos(turnosArray);

			// Set pagination info
			if (data?.pagination) {
				setTotalPages(data.pagination.totalPages);
				setTotalItems(data.pagination.total);
			}

			// Find active shift
			const ativo = turnosArray.find((turno: TurnoExtendido) => turno.status === 'aberto');
			setTurnoAtivo(ativo || null);

		} catch (error) {
			console.error('Erro ao carregar turnos:', error);
			toast.error('Erro ao carregar turnos');
		} finally {
			setCarregando(false);
		}
	};

	const handlePageChange = (page: number) => {
		setCurrentPage(page);
	};

	const handleItemsPerPageChange = (itemsPerPage: number) => {
		setItemsPerPage(itemsPerPage);
		setCurrentPage(1);
	};

	const limparFormularioAbertura = () => {
		setValorAbertura('');
		setObservacoesAbertura('');
	};

	const limparFormularioFechamento = () => {
		setValorFechamento('');
		setObservacoesFechamento('');
	};

	const abrirTurno = async () => {
		if (!valorAbertura) {
			toast.error('Informe o valor de abertura do caixa');
			return;
		}

		const valorNum = parseFloat(valorAbertura);
		if (isNaN(valorNum) || valorNum < 0) {
			toast.error('Valor de abertura deve ser um número válido');
			return;
		}

		try {
			const novoTurno = {
				valorAbertura: valorNum,
				observacoes: observacoesAbertura || undefined,
				usuarioId: 'sistema-admin', // TODO: Pegar do usuário logado
				restauranteId: RESTAURANT_ID,
			};

			const response = await fetch('/api/turnos', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(novoTurno),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Erro ao abrir turno');
			}

			await carregarDados();
			setDialogoAbrirAberto(false);
			limparFormularioAbertura();

			toast.success('Turno aberto com sucesso');
		} catch (error) {
			console.error('Erro ao abrir turno:', error);
			toast.error(error instanceof Error ? error.message : 'Erro ao abrir turno');
		}
	};

	const fecharTurno = async () => {
		if (!turnoAtivo || !valorFechamento) {
			toast.error('Informe o valor de fechamento do caixa');
			return;
		}

		const valorNum = parseFloat(valorFechamento);
		if (isNaN(valorNum) || valorNum < 0) {
			toast.error('Valor de fechamento deve ser um número válido');
			return;
		}

		try {
			const dadosFechamento = {
				valorFechamento: valorNum,
				observacoes: observacoesFechamento || undefined,
			};

			const response = await fetch(`/api/turnos/${turnoAtivo.id}/fechar`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(dadosFechamento),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Erro ao fechar turno');
			}

			await carregarDados();
			setDialogoFecharAberto(false);
			limparFormularioFechamento();

			toast.success('Turno fechado com sucesso');
		} catch (error) {
			console.error('Erro ao fechar turno:', error);
			toast.error(error instanceof Error ? error.message : 'Erro ao fechar turno');
		}
	};

	const abrirDialogoDetalhes = (turno: TurnoExtendido) => {
		setTurnoSelecionado(turno);
		setDialogoDetalhesAberto(true);
	};

	const formatarDuracao = (inicio: string, fim?: string) => {
		const dataInicio = new Date(inicio);
		const dataFim = fim ? new Date(fim) : new Date();
		const diferenca = dataFim.getTime() - dataInicio.getTime();
		const horas = Math.floor(diferenca / (1000 * 60 * 60));
		const minutos = Math.floor((diferenca % (1000 * 60 * 60)) / (1000 * 60));
		return `${horas}h ${minutos}m`;
	};

	// Estatísticas gerais
	const estatisticas = {
		turnoAtual: turnoAtivo ? 'Aberto' : 'Fechado',
		totalTurnos: totalItems,
		turnosHoje: turnos.filter(t => {
			const hoje = new Date().toDateString();
			const dataTurno = new Date(t.dataAbertura).toDateString();
			return dataTurno === hoje;
		}).length,
		vendasHoje: turnoAtivo ? (turnoAtivo.totalVendas || 0) : 0,
	};

	return (
		<LayoutPrincipal titulo='Gestão de Turnos'>
			<div className='space-y-6'>
				{/* Estatísticas */}
				<div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
					<Card>
						<CardContent className='p-4'>
							<div className='flex items-center space-x-2'>
								<Clock className='h-5 w-5 text-blue-500' />
								<div>
									<p className='text-sm text-muted-foreground'>Status Atual</p>
									<p className='text-2xl font-bold'>
										{estatisticas.turnoAtual}
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className='p-4'>
							<div className='flex items-center space-x-2'>
								<Users className='h-5 w-5 text-green-500' />
								<div>
									<p className='text-sm text-muted-foreground'>Turnos Hoje</p>
									<p className='text-2xl font-bold'>
										{estatisticas.turnosHoje}
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className='p-4'>
							<div className='flex items-center space-x-2'>
								<TrendingUp className='h-5 w-5 text-purple-500' />
								<div>
									<p className='text-sm text-muted-foreground'>Total de Turnos</p>
									<p className='text-2xl font-bold'>
										{estatisticas.totalTurnos}
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className='p-4'>
							<div className='flex items-center space-x-2'>
								<DollarSign className='h-5 w-5 text-orange-500' />
								<div>
									<p className='text-sm text-muted-foreground'>Vendas Hoje</p>
									<p className='text-2xl font-bold'>
										MT {estatisticas.vendasHoje.toFixed(2)}
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Turno Ativo */}
				{turnoAtivo && (
					<Card className='border-green-200 bg-green-50'>
						<CardHeader>
							<CardTitle className='text-green-700 flex items-center gap-2'>
								<CheckCircle className='h-5 w-5' />
								Turno Ativo
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
								<div>
									<p className='text-muted-foreground'>Usuário</p>
									<p className='font-medium'>{turnoAtivo.usuario?.nome || 'Sistema'}</p>
								</div>
								<div>
									<p className='text-muted-foreground'>Abertura</p>
									<p className='font-medium'>
										{new Date(turnoAtivo.dataAbertura).toLocaleString('pt-PT')}
									</p>
								</div>
								<div>
									<p className='text-muted-foreground'>Duração</p>
									<p className='font-medium'>
										{formatarDuracao(turnoAtivo.dataAbertura)}
									</p>
								</div>
								<div>
									<p className='text-muted-foreground'>Valor Abertura</p>
									<p className='font-medium'>MT {turnoAtivo.valorAbertura.toFixed(2)}</p>
								</div>
							</div>
							<div className='flex gap-2 mt-4'>
								<Button 
									variant='outline' 
									onClick={() => abrirDialogoDetalhes(turnoAtivo)}
								>
									<Eye className='w-4 h-4 mr-2' />
									Ver Detalhes
								</Button>
								<Button 
									variant='destructive'
									onClick={() => setDialogoFecharAberto(true)}
								>
									<PowerOff className='w-4 h-4 mr-2' />
									Fechar Turno
								</Button>
							</div>
						</CardContent>
					</Card>
				)}

				{/* Controles */}
				<Card>
					<CardContent className='p-4'>
						<div className='flex flex-col lg:flex-row gap-4 items-center justify-between'>
							<div className='relative flex-1'>
								<Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4' />
								<Input
									placeholder='Buscar por usuário ou observações...'
									value={busca}
									onChange={(e) => setBusca(e.target.value)}
									className='pl-10'
								/>
							</div>

							<Dialog open={dialogoAbrirAberto} onOpenChange={setDialogoAbrirAberto}>
								<DialogTrigger asChild>
									<Button 
										disabled={!!turnoAtivo}
										className='w-full lg:w-auto'
									>
										<Plus className='w-4 h-4 mr-2' />
										Abrir Turno
									</Button>
								</DialogTrigger>
							</Dialog>
						</div>
					</CardContent>
				</Card>

				{/* Tabela de Turnos */}
				<Card>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Usuário</TableHead>
								<TableHead>Data/Hora Abertura</TableHead>
								<TableHead>Data/Hora Fechamento</TableHead>
								<TableHead>Duração</TableHead>
								<TableHead>Valor Abertura</TableHead>
								<TableHead>Valor Fechamento</TableHead>
								<TableHead>Total Vendas</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Ações</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{turnos.map((turno) => (
								<TableRow key={turno.id}>
									<TableCell>
										<div>
											<p className='font-medium'>{turno.usuario?.nome || 'Sistema'}</p>
											<p className='text-xs text-muted-foreground'>{turno.usuario?.email}</p>
										</div>
									</TableCell>
									<TableCell>
										<div className='text-sm'>
											<p>{new Date(turno.dataAbertura).toLocaleDateString('pt-PT')}</p>
											<p className='text-xs text-muted-foreground'>
												{new Date(turno.dataAbertura).toLocaleTimeString('pt-PT', {
													hour: '2-digit',
													minute: '2-digit',
												})}
											</p>
										</div>
									</TableCell>
									<TableCell>
										{turno.dataFechamento ? (
											<div className='text-sm'>
												<p>{new Date(turno.dataFechamento).toLocaleDateString('pt-PT')}</p>
												<p className='text-xs text-muted-foreground'>
													{new Date(turno.dataFechamento).toLocaleTimeString('pt-PT', {
														hour: '2-digit',
														minute: '2-digit',
													})}
												</p>
											</div>
										) : (
											<span className='text-muted-foreground'>Em andamento</span>
										)}
									</TableCell>
									<TableCell>
										{formatarDuracao(turno.dataAbertura, turno.dataFechamento)}
									</TableCell>
									<TableCell>MT {turno.valorAbertura.toFixed(2)}</TableCell>
									<TableCell>
										{turno.valorFechamento !== null && turno.valorFechamento !== undefined ? 
											`MT ${turno.valorFechamento.toFixed(2)}` : 
											'-'
										}
									</TableCell>
									<TableCell>MT {(turno.totalVendas || 0).toFixed(2)}</TableCell>
									<TableCell>
										<Badge 
											variant={turno.status === 'aberto' ? 'default' : 'secondary'}
											className={turno.status === 'aberto' ? 'bg-green-500' : ''}
										>
											{turno.status === 'aberto' ? 'Aberto' : 'Fechado'}
										</Badge>
									</TableCell>
									<TableCell>
										<Button
											size='sm'
											variant='outline'
											onClick={() => abrirDialogoDetalhes(turno)}
										>
											<Eye className='w-3 h-3' />
										</Button>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</Card>

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

				{/* Estado vazio */}
				{!carregando && turnos.length === 0 && (
					<Card>
						<CardContent className='p-8 text-center'>
							<Clock className='w-12 h-12 mx-auto mb-4 text-muted-foreground' />
							<p className='text-muted-foreground mb-4'>
								Nenhum turno encontrado.
							</p>
							<p className='text-sm text-muted-foreground'>
								Abra um novo turno para começar a trabalhar.
							</p>
						</CardContent>
					</Card>
				)}

				{/* Dialog Abrir Turno */}
				<Dialog open={dialogoAbrirAberto} onOpenChange={setDialogoAbrirAberto}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Abrir Novo Turno</DialogTitle>
						</DialogHeader>

						<div className='space-y-4'>
							<div>
								<Label htmlFor='valorAbertura'>Valor de Abertura do Caixa</Label>
								<Input
									id='valorAbertura'
									type='number'
									step='0.01'
									value={valorAbertura}
									onChange={(e) => setValorAbertura(e.target.value)}
									placeholder='0.00'
									min='0'
								/>
							</div>

							<div>
								<Label htmlFor='observacoesAbertura'>Observações (opcional)</Label>
								<Textarea
									id='observacoesAbertura'
									value={observacoesAbertura}
									onChange={(e) => setObservacoesAbertura(e.target.value)}
									placeholder='Observações sobre a abertura do turno...'
									rows={3}
								/>
							</div>

							<div className='flex space-x-2'>
								<Button
									variant='outline'
									className='flex-1'
									onClick={() => {
										setDialogoAbrirAberto(false);
										limparFormularioAbertura();
									}}
								>
									Cancelar
								</Button>
								<Button className='flex-1' onClick={abrirTurno}>
									Abrir Turno
								</Button>
							</div>
						</div>
					</DialogContent>
				</Dialog>

				{/* Dialog Fechar Turno */}
				<Dialog open={dialogoFecharAberto} onOpenChange={setDialogoFecharAberto}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Fechar Turno</DialogTitle>
						</DialogHeader>

						<div className='space-y-4'>
							{turnoAtivo && (
								<div className='bg-muted p-3 rounded-lg'>
									<h4 className='font-medium mb-2'>Resumo do Turno</h4>
									<div className='grid grid-cols-2 gap-2 text-sm'>
										<div>
											<span className='text-muted-foreground'>Abertura:</span>
											<span className='ml-2'>MT {turnoAtivo.valorAbertura.toFixed(2)}</span>
										</div>
										<div>
											<span className='text-muted-foreground'>Vendas:</span>
											<span className='ml-2'>MT {(turnoAtivo.totalVendas || 0).toFixed(2)}</span>
										</div>
									</div>
								</div>
							)}

							<div>
								<Label htmlFor='valorFechamento'>Valor de Fechamento do Caixa</Label>
								<Input
									id='valorFechamento'
									type='number'
									step='0.01'
									value={valorFechamento}
									onChange={(e) => setValorFechamento(e.target.value)}
									placeholder='0.00'
									min='0'
								/>
							</div>

							<div>
								<Label htmlFor='observacoesFechamento'>Observações (opcional)</Label>
								<Textarea
									id='observacoesFechamento'
									value={observacoesFechamento}
									onChange={(e) => setObservacoesFechamento(e.target.value)}
									placeholder='Observações sobre o fechamento do turno...'
									rows={3}
								/>
							</div>

							<div className='flex space-x-2'>
								<Button
									variant='outline'
									className='flex-1'
									onClick={() => {
										setDialogoFecharAberto(false);
										limparFormularioFechamento();
									}}
								>
									Cancelar
								</Button>
								<Button variant='destructive' className='flex-1' onClick={fecharTurno}>
									Fechar Turno
								</Button>
							</div>
						</div>
					</DialogContent>
				</Dialog>

				{/* Dialog Detalhes */}
				<Dialog open={dialogoDetalhesAberto} onOpenChange={setDialogoDetalhesAberto}>
					<DialogContent className='max-w-2xl'>
						<DialogHeader>
							<DialogTitle>
								Detalhes do Turno - {turnoSelecionado?.usuario?.nome || 'Sistema'}
							</DialogTitle>
						</DialogHeader>

						{turnoSelecionado && (
							<div className='space-y-6'>
								{/* Informações Gerais */}
								<div className='grid grid-cols-2 gap-4'>
									<div>
										<h3 className='font-medium mb-2'>Informações do Turno</h3>
										<div className='space-y-1 text-sm'>
											<div className='flex justify-between'>
												<span>Status:</span>
												<Badge variant={turnoSelecionado.status === 'aberto' ? 'default' : 'secondary'}>
													{turnoSelecionado.status === 'aberto' ? 'Aberto' : 'Fechado'}
												</Badge>
											</div>
											<div className='flex justify-between'>
												<span>Abertura:</span>
												<span>{new Date(turnoSelecionado.dataAbertura).toLocaleString('pt-PT')}</span>
											</div>
											{turnoSelecionado.dataFechamento && (
												<div className='flex justify-between'>
													<span>Fechamento:</span>
													<span>{new Date(turnoSelecionado.dataFechamento).toLocaleString('pt-PT')}</span>
												</div>
											)}
											<div className='flex justify-between'>
												<span>Duração:</span>
												<span>{formatarDuracao(turnoSelecionado.dataAbertura, turnoSelecionado.dataFechamento)}</span>
											</div>
										</div>
									</div>

									<div>
										<h3 className='font-medium mb-2'>Valores Financeiros</h3>
										<div className='space-y-1 text-sm'>
											<div className='flex justify-between'>
												<span>Abertura:</span>
												<span>MT {turnoSelecionado.valorAbertura.toFixed(2)}</span>
											</div>
											{turnoSelecionado.valorFechamento !== null && (
												<div className='flex justify-between'>
													<span>Fechamento:</span>
													<span>MT {turnoSelecionado.valorFechamento?.toFixed(2) || '-'}</span>
												</div>
											)}
											<div className='flex justify-between'>
												<span>Total Vendas:</span>
												<span className='font-bold'>MT {(turnoSelecionado.totalVendas || 0).toFixed(2)}</span>
											</div>
											{turnoSelecionado.diferencaCaixa !== null && (
												<div className='flex justify-between'>
													<span>Diferença:</span>
													<span className={`font-bold ${(turnoSelecionado.diferencaCaixa || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
														MT {(turnoSelecionado.diferencaCaixa || 0).toFixed(2)}
													</span>
												</div>
											)}
										</div>
									</div>
								</div>

								{/* Breakdown de Vendas */}
								{turnoSelecionado.status === 'fechado' && (
									<div>
										<h3 className='font-medium mb-2'>Breakdown de Vendas</h3>
										<div className='grid grid-cols-3 gap-4 text-sm'>
											<div className='text-center p-3 bg-green-50 rounded-lg'>
												<p className='text-muted-foreground'>Dinheiro</p>
												<p className='font-bold text-green-600'>MT {(turnoSelecionado.totalDinheiro || 0).toFixed(2)}</p>
											</div>
											<div className='text-center p-3 bg-blue-50 rounded-lg'>
												<p className='text-muted-foreground'>Cartão</p>
												<p className='font-bold text-blue-600'>MT {(turnoSelecionado.totalCartao || 0).toFixed(2)}</p>
											</div>
											<div className='text-center p-3 bg-purple-50 rounded-lg'>
												<p className='text-muted-foreground'>Outros</p>
												<p className='font-bold text-purple-600'>MT {(turnoSelecionado.totalOutros || 0).toFixed(2)}</p>
											</div>
										</div>
									</div>
								)}

								{/* Observações */}
								{turnoSelecionado.observacoes && (
									<div>
										<h3 className='font-medium mb-2'>Observações</h3>
										<p className='text-sm text-muted-foreground bg-muted p-3 rounded-lg'>
											{turnoSelecionado.observacoes}
										</p>
									</div>
								)}
							</div>
						)}
					</DialogContent>
				</Dialog>
			</div>
		</LayoutPrincipal>
	);
}