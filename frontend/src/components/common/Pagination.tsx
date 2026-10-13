import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: readonly number[] | number[];
  itemLabel?: string;
}

export default function Pagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 50],
  itemLabel = "records",
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validPage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = totalItems === 0 ? 0 : (validPage - 1) * pageSize + 1;
  const endIndex = Math.min(validPage * pageSize, totalItems);

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (validPage <= 4) {
      return [1, 2, 3, 4, 5, "...", totalPages];
    }

    if (validPage >= totalPages - 3) {
      return [
        1,
        "...",
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }

    return [1, "...", validPage - 1, validPage, validPage + 1, "...", totalPages];
  };

  const pages = getPageNumbers();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border bg-surface/50 px-3 sm:px-4 py-3 text-xs text-muted select-none">
      {/* Records Count & Page Size */}
      <div className="flex flex-wrap items-center justify-between w-full sm:w-auto gap-2.5">
        <span className="text-[11px] sm:text-xs">
          Showing <span className="font-semibold text-ink">{startIndex}</span> to{" "}
          <span className="font-semibold text-ink">{endIndex}</span> of{" "}
          <span className="font-semibold text-ink">{totalItems}</span> {itemLabel}
        </span>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 pl-2 sm:border-l border-border">
            <span className="text-[11px] sm:text-xs text-muted">Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="rounded border border-border bg-surface px-1.5 py-1 text-xs font-medium text-ink focus:border-accent focus:outline-none"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Page Navigation Controls */}
      <div className="flex items-center justify-center gap-1 w-full sm:w-auto overflow-x-auto py-0.5">
        {/* First Page */}
        <button
          onClick={() => onPageChange(1)}
          disabled={validPage === 1}
          title="First Page"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-border bg-surface text-ink hover:bg-bg disabled:opacity-40 disabled:hover:bg-surface disabled:cursor-not-allowed transition-colors"
        >
          <ChevronsLeft className="h-3.5 w-3.5" />
        </button>

        {/* Previous Page */}
        <button
          onClick={() => onPageChange(validPage - 1)}
          disabled={validPage === 1}
          title="Previous Page"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-border bg-surface text-ink hover:bg-bg disabled:opacity-40 disabled:hover:bg-surface disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>

        {/* Numbered Page Buttons */}
        <div className="flex items-center gap-1 px-1">
          {pages.map((p, idx) => {
            if (p === "...") {
              return (
                <span key={`ellipsis-${idx}`} className="px-1 text-muted text-xs">
                  …
                </span>
              );
            }

            const pageNum = p as number;
            const isActive = pageNum === validPage;

            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`flex h-7 min-w-[28px] shrink-0 px-1.5 items-center justify-center rounded text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-ink text-white font-semibold shadow-xs"
                    : "border border-border bg-surface text-ink hover:bg-bg"
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* Next Page */}
        <button
          onClick={() => onPageChange(validPage + 1)}
          disabled={validPage === totalPages}
          title="Next Page"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-border bg-surface text-ink hover:bg-bg disabled:opacity-40 disabled:hover:bg-surface disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>

        {/* Last Page */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={validPage === totalPages}
          title="Last Page"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-border bg-surface text-ink hover:bg-bg disabled:opacity-40 disabled:hover:bg-surface disabled:cursor-not-allowed transition-colors"
        >
          <ChevronsRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
