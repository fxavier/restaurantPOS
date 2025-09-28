import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface DataPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  isLoading?: boolean;
}

const DataPagination: React.FC<DataPaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  isLoading = false,
}) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else {
      if (totalPages > 1) {
        rangeWithDots.push(totalPages);
      }
    }

    return rangeWithDots;
  };

  // Always show pagination controls if there are items
  if (totalItems === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-4 bg-white border border-gray-200 rounded-lg shadow-sm mt-4">
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <span>
          Mostrando {startItem} a {endItem} de {totalItems} resultados
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 sm:space-x-6">
        {/* Items per page selector */}
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium whitespace-nowrap">Linhas por página:</p>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => onItemsPerPageChange(Number(value))}
            disabled={isLoading}
          >
            <SelectTrigger className="h-9 w-[90px] border-2 border-gray-300 bg-white font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 50, 100].map((pageSize) => (
                <SelectItem key={pageSize} value={pageSize.toString()}>
                  {pageSize} linhas
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Page navigation */}
        <div className="flex items-center space-x-1">
          <Button
            variant="outline"
            className="h-9 w-9 p-0 border-2 border-gray-300 bg-white hover:bg-gray-50"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1 || isLoading}
          >
            <span className="sr-only">Ir para primeira página</span>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-9 px-4 flex items-center gap-1 border-2 border-gray-300 bg-white hover:bg-gray-50 font-medium"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1 || isLoading}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="text-sm">Anterior</span>
          </Button>

          <div className="flex items-center space-x-1">
            {getVisiblePages().map((page, index) => (
              <React.Fragment key={index}>
                {page === '...' ? (
                  <span className="h-8 w-8 flex items-center justify-center text-sm font-medium">
                    ...
                  </span>
                ) : (
                  <Button
                    variant={page === currentPage ? "default" : "outline"}
                    className={`h-9 w-9 p-0 font-medium border-2 ${
                      page === currentPage 
                        ? "bg-blue-600 border-blue-600 text-white hover:bg-blue-700" 
                        : "border-gray-300 bg-white hover:bg-gray-50"
                    }`}
                    onClick={() => onPageChange(page as number)}
                    disabled={isLoading}
                  >
                    {page}
                  </Button>
                )}
              </React.Fragment>
            ))}
          </div>

          <Button
            variant="outline"
            className="h-9 px-4 flex items-center gap-1 border-2 border-gray-300 bg-white hover:bg-gray-50 font-medium"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages || isLoading}
          >
            <span className="text-sm">Próximo</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-9 w-9 p-0 border-2 border-gray-300 bg-white hover:bg-gray-50"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages || isLoading}
          >
            <span className="sr-only">Ir para última página</span>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DataPagination;