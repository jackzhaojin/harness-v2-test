import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

/**
 * Pagination controls with Previous/Next buttons, numbered page buttons,
 * and "Showing X-Y of Z projects" info text.
 */
export function Pagination({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  onPageChange,
}: PaginationProps): JSX.Element {
  const isFirstPage = currentPage <= 1;
  const isLastPage = currentPage >= totalPages;

  // Calculate the range of items shown
  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);

  // Generate page numbers array
  const pageNumbers: number[] = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  const handlePrevious = (): void => {
    if (!isFirstPage) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = (): void => {
    if (!isLastPage) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
      {/* Page info text */}
      <p className="text-sm text-gray-500 dark:text-gray-400" data-testid="page-info">
        Showing {startItem}-{endItem} of {totalCount} projects
      </p>

      {/* Pagination controls */}
      <nav aria-label="Pagination" className="flex items-center gap-1">
        {/* Previous button */}
        <button
          type="button"
          onClick={handlePrevious}
          disabled={isFirstPage}
          aria-label="Previous page"
          className="inline-flex items-center justify-center rounded-md px-2 py-1.5 text-sm font-medium
            text-gray-700 dark:text-gray-300
            hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent dark:disabled:hover:bg-transparent
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
        >
          <ChevronLeft className="h-4 w-4 mr-1" aria-hidden="true" />
          Previous
        </button>

        {/* Page number buttons */}
        {pageNumbers.map((pageNum) => (
          <button
            key={pageNum}
            type="button"
            onClick={() => onPageChange(pageNum)}
            aria-label={`Page ${pageNum}`}
            aria-current={pageNum === currentPage ? 'page' : undefined}
            className={`inline-flex items-center justify-center rounded-md w-8 h-8 text-sm font-medium transition-colors
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900
              ${
                pageNum === currentPage
                  ? 'bg-blue-600 text-white dark:bg-blue-500'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
          >
            {pageNum}
          </button>
        ))}

        {/* Next button */}
        <button
          type="button"
          onClick={handleNext}
          disabled={isLastPage}
          aria-label="Next page"
          className="inline-flex items-center justify-center rounded-md px-2 py-1.5 text-sm font-medium
            text-gray-700 dark:text-gray-300
            hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent dark:disabled:hover:bg-transparent
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" aria-hidden="true" />
        </button>
      </nav>
    </div>
  );
}

export default Pagination;
