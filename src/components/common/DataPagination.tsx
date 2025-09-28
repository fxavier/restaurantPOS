'use client';

import React from 'react';
import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';

interface PaginationInfo {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
}

interface DataPaginationProps {
	pagination: PaginationInfo;
	onPageChange: (page: number) => void;
	onLimitChange: (limit: number) => void;
	showLimitSelector?: boolean;
	limitOptions?: number[];
	className?: string;
}

export function DataPagination({
	pagination,
	onPageChange,
	onLimitChange,
	showLimitSelector = true,
	limitOptions = [10, 20, 50, 100],
	className = '',
}: DataPaginationProps) {
	const { page, limit, total, totalPages } = pagination;

	// Calculate range of items being shown
	const startItem = totalPages === 0 ? 0 : (page - 1) * limit + 1;
	const endItem = Math.min(page * limit, total);

	// Generate array of page numbers to show
	const getVisiblePages = () => {
		const visiblePages: (number | 'ellipsis')[] = [];
		const maxVisible = 7; // Maximum number of page buttons to show

		if (totalPages <= maxVisible) {
			// Show all pages
			for (let i = 1; i <= totalPages; i++) {
				visiblePages.push(i);
			}
		} else {
			// Always show first page
			visiblePages.push(1);

			if (page <= 4) {
				// Near the beginning
				for (let i = 2; i <= 5; i++) {
					visiblePages.push(i);
				}
				visiblePages.push('ellipsis');
				visiblePages.push(totalPages);
			} else if (page >= totalPages - 3) {
				// Near the end
				visiblePages.push('ellipsis');
				for (let i = totalPages - 4; i <= totalPages; i++) {
					visiblePages.push(i);
				}
			} else {
				// In the middle
				visiblePages.push('ellipsis');
				for (let i = page - 1; i <= page + 1; i++) {
					visiblePages.push(i);
				}
				visiblePages.push('ellipsis');
				visiblePages.push(totalPages);
			}
		}

		return visiblePages;
	};

	const visiblePages = getVisiblePages();

	if (totalPages <= 1 && !showLimitSelector) {
		return null;
	}

	return (
		<div
			className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}
		>
			{/* Items info and limit selector */}
			<div className='flex items-center gap-4 text-sm text-muted-foreground'>
				<span>
					Mostrando {startItem}-{endItem} de {total} itens
				</span>

				{showLimitSelector && (
					<div className='flex items-center gap-2'>
						<span>Itens por página:</span>
						<Select
							value={limit.toString()}
							onValueChange={(value) => onLimitChange(parseInt(value))}
						>
							<SelectTrigger className='w-20 h-8'>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{limitOptions.map((option) => (
									<SelectItem key={option} value={option.toString()}>
										{option}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				)}
			</div>

			{/* Pagination controls */}
			{totalPages > 1 && (
				<Pagination>
					<PaginationContent>
						<PaginationItem>
							<PaginationPrevious
								onClick={() => onPageChange(Math.max(1, page - 1))}
								className={
									page === 1
										? 'pointer-events-none opacity-50'
										: 'cursor-pointer'
								}
							/>
						</PaginationItem>

						{visiblePages.map((pageNum, index) => (
							<PaginationItem key={index}>
								{pageNum === 'ellipsis' ? (
									<PaginationEllipsis />
								) : (
									<PaginationLink
										onClick={() => onPageChange(pageNum)}
										isActive={pageNum === page}
										className='cursor-pointer'
									>
										{pageNum}
									</PaginationLink>
								)}
							</PaginationItem>
						))}

						<PaginationItem>
							<PaginationNext
								onClick={() => onPageChange(Math.min(totalPages, page + 1))}
								className={
									page === totalPages
										? 'pointer-events-none opacity-50'
										: 'cursor-pointer'
								}
							/>
						</PaginationItem>
					</PaginationContent>
				</Pagination>
			)}
		</div>
	);
}

// Hook para gerenciar paginação
export function usePagination(
	initialPage: number = 1,
	initialLimit: number = 20
) {
	const [page, setPage] = React.useState(initialPage);
	const [limit, setLimit] = React.useState(initialLimit);

	const handlePageChange = (newPage: number) => {
		setPage(newPage);
	};

	const handleLimitChange = (newLimit: number) => {
		setLimit(newLimit);
		setPage(1); // Reset to first page when changing limit
	};

	const reset = () => {
		setPage(initialPage);
		setLimit(initialLimit);
	};

	return {
		page,
		limit,
		setPage: handlePageChange,
		setLimit: handleLimitChange,
		reset,
	};
}
