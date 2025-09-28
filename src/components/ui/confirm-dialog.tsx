'use client';

import { useState } from 'react';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface ConfirmDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	description: string;
	confirmText?: string;
	cancelText?: string;
	variant?: 'warning' | 'success';
	onConfirm: () => void;
	onCancel?: () => void;
}

export function ConfirmDialog({
	open,
	onOpenChange,
	title,
	description,
	confirmText = 'Confirmar',
	cancelText = 'Cancelar',
	variant = 'warning',
	onConfirm,
	onCancel,
}: ConfirmDialogProps) {
	const [isLoading, setIsLoading] = useState(false);

	const handleConfirm = async () => {
		setIsLoading(true);
		try {
			await onConfirm();
			onOpenChange(false);
		} finally {
			setIsLoading(false);
		}
	};

	const handleCancel = () => {
		onCancel?.();
		onOpenChange(false);
	};

	const Icon = variant === 'warning' ? AlertTriangle : CheckCircle;
	const confirmButtonVariant =
		variant === 'warning' ? 'destructive' : 'default';

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='sm:max-w-[425px]'>
				<DialogHeader>
					<div className='flex items-center gap-3'>
						<div
							className={`p-2 rounded-full ${
								variant === 'warning'
									? 'bg-destructive/10 text-destructive'
									: 'bg-green-100 text-green-600'
							}`}
						>
							<Icon className='h-5 w-5' />
						</div>
						<DialogTitle className='text-lg font-semibold'>{title}</DialogTitle>
					</div>
					<DialogDescription className='text-sm text-muted-foreground mt-2'>
						{description}
					</DialogDescription>
				</DialogHeader>
				<DialogFooter className='gap-2 sm:gap-0'>
					<Button variant='outline' onClick={handleCancel} disabled={isLoading}>
						{cancelText}
					</Button>
					<Button
						variant={confirmButtonVariant}
						onClick={handleConfirm}
						disabled={isLoading}
					>
						{isLoading ? 'Processando...' : confirmText}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

// Hook para usar o diálogo de confirmação
export function useConfirmDialog() {
	const [dialogState, setDialogState] = useState<{
		open: boolean;
		title: string;
		description: string;
		confirmText?: string;
		cancelText?: string;
		variant?: 'warning' | 'success';
		onConfirm?: () => void | Promise<void>;
		onCancel?: () => void;
	}>({
		open: false,
		title: '',
		description: '',
	});

	const showConfirm = (options: {
		title: string;
		description: string;
		confirmText?: string;
		cancelText?: string;
		variant?: 'warning' | 'success';
		onConfirm: () => void | Promise<void>;
		onCancel?: () => void;
	}) => {
		setDialogState({
			open: true,
			...options,
		});
	};

	const hideConfirm = () => {
		setDialogState((prev) => ({ ...prev, open: false }));
	};

	const ConfirmDialogComponent = () => {
		console.log('ConfirmDialogComponent renderizado, estado:', dialogState);
		return (
			<ConfirmDialog
				open={dialogState.open}
				onOpenChange={hideConfirm}
				title={dialogState.title}
				description={dialogState.description}
				confirmText={dialogState.confirmText}
				cancelText={dialogState.cancelText}
				variant={dialogState.variant}
				onConfirm={dialogState.onConfirm || (() => {})}
				onCancel={dialogState.onCancel}
			/>
		);
	};

	return {
		showConfirm,
		hideConfirm,
		ConfirmDialogComponent,
	};
}
