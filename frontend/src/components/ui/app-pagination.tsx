import React, { useState } from 'react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import { ChevronsLeft, ChevronsRight, CornerDownLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface AppPaginationProps {
  /** 0-based page index */
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  size?: number;
  className?: string;
  showQuickJump?: boolean;
}

export const AppPagination: React.FC<AppPaginationProps> = ({
  page,
  totalPages,
  onPageChange,
  totalItems,
  size,
  className = '',
  showQuickJump = true,
}) => {
  const [jumpPageInput, setJumpPageInput] = useState('');
  const [isJumping, setIsJumping] = useState(false);

  if (totalPages <= 1 && !totalItems) {
    return null;
  }

  const currentPage1 = page + 1; // 1-based for user display

  /**
   * Generates a friendly array of page numbers with ellipsis.
   * Example: [1, '...', 4, 5, 6, '...', 20]
   */
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | string)[] = [];

    // Always include page 1
    pages.push(1);

    if (currentPage1 > 3) {
      pages.push('ellipsis-start');
    }

    const start = Math.max(2, currentPage1 - 1);
    const end = Math.min(totalPages - 1, currentPage1 + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage1 < totalPages - 2) {
      pages.push('ellipsis-end');
    }

    // Always include last page
    pages.push(totalPages);

    return pages;
  };

  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseInt(jumpPageInput.trim(), 10);
    if (!isNaN(target) && target >= 1 && target <= totalPages) {
      onPageChange(target - 1);
      setJumpPageInput('');
      setIsJumping(false);
    }
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className={`mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm ${className}`}>
      {/* Left side info */}
      <div className="text-muted-foreground order-2 sm:order-1 flex items-center gap-2 text-xs sm:text-sm">
        <span>
          Trang <strong className="text-slate-800 font-semibold">{currentPage1}</strong> / {totalPages}
        </span>
        {typeof totalItems === 'number' && (
          <span className="text-slate-400">
            • Tổng số <strong className="text-slate-700">{totalItems}</strong> mục
            {size && (
              <span className="hidden md:inline">
                {' '}(mỗi trang {size})
              </span>
            )}
          </span>
        )}
      </div>

      {/* Right side pagination controls */}
      <div className="order-1 sm:order-2 flex flex-wrap items-center justify-end gap-1.5 w-full sm:w-auto">
        <Pagination className="w-auto mx-0">
          <PaginationContent className="gap-1 flex-wrap">
            {/* First page button */}
            {totalPages > 5 && (
              <PaginationItem className="hidden md:block">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-600 disabled:opacity-40"
                  disabled={page === 0}
                  onClick={() => onPageChange(0)}
                  title="Về trang đầu"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
              </PaginationItem>
            )}

            {/* Previous button */}
            <PaginationItem>
              <PaginationPrevious
                onClick={() => onPageChange(Math.max(0, page - 1))}
                className={`h-8 px-2.5 text-xs sm:text-sm ${
                  page === 0 ? 'pointer-events-none opacity-40' : 'cursor-pointer'
                }`}
              />
            </PaginationItem>

            {/* Desktop windowed page numbers */}
            <div className="hidden sm:flex items-center gap-1">
              {pageNumbers.map((p, idx) => {
                if (typeof p === 'string') {
                  return (
                    <PaginationItem key={`${p}-${idx}`}>
                      <PaginationEllipsis className="h-8 w-8" />
                    </PaginationItem>
                  );
                }

                const zeroBased = p - 1;
                const isActive = zeroBased === page;

                return (
                  <PaginationItem key={p}>
                    <PaginationLink
                      isActive={isActive}
                      onClick={() => onPageChange(zeroBased)}
                      className={`h-8 w-8 text-xs cursor-pointer ${
                        isActive
                          ? 'bg-primary text-primary-foreground font-bold shadow-xs hover:bg-primary/90 hover:text-primary-foreground'
                          : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
            </div>

            {/* Mobile current indicator */}
            <div className="sm:hidden flex items-center px-2 font-medium text-xs text-slate-700">
              {currentPage1} / {totalPages}
            </div>

            {/* Next button */}
            <PaginationItem>
              <PaginationNext
                onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
                className={`h-8 px-2.5 text-xs sm:text-sm ${
                  page >= totalPages - 1 ? 'pointer-events-none opacity-40' : 'cursor-pointer'
                }`}
              />
            </PaginationItem>

            {/* Last page button */}
            {totalPages > 5 && (
              <PaginationItem className="hidden md:block">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-600 disabled:opacity-40"
                  disabled={page >= totalPages - 1}
                  onClick={() => onPageChange(totalPages - 1)}
                  title="Đến trang cuối"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </PaginationItem>
            )}
          </PaginationContent>
        </Pagination>

        {/* Quick jump to page input for large totalPages */}
        {showQuickJump && totalPages > 7 && (
          <div className="hidden lg:flex items-center gap-1.5 ml-2 pl-2 border-l border-slate-200">
            {isJumping ? (
              <form onSubmit={handleJumpSubmit} className="flex items-center gap-1">
                <Input
                  type="number"
                  min={1}
                  max={totalPages}
                  placeholder="Trang"
                  value={jumpPageInput}
                  onChange={(e) => setJumpPageInput(e.target.value)}
                  className="h-8 w-16 text-xs px-2 text-center"
                  autoFocus
                  onBlur={() => {
                    if (!jumpPageInput) setIsJumping(false);
                  }}
                />
                <Button type="submit" size="sm" variant="outline" className="h-8 px-2 text-xs">
                  <CornerDownLeft className="h-3 w-3" />
                </Button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setIsJumping(true)}
                className="text-xs text-muted-foreground hover:text-primary transition-colors underline decoration-dotted"
                title="Nhập số trang để chuyển nhanh"
              >
                Đến trang...
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
