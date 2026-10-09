interface MarketplacePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function MarketplacePagination({
  currentPage,
  totalPages,
  onPageChange,
}: MarketplacePaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav
      aria-label="Marketplace pagination"
      className="mt-10 flex items-center justify-end gap-3 text-sm"
    >
      <button
        className="px-3 py-2 text-text-1 disabled:cursor-not-allowed disabled:opacity-40"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        type="button"
      >
        Previous
      </button>
      {Array.from({ length: totalPages }, (_, index) => {
        const page = index + 1;
        const active = page === currentPage;

        return (
          <button
            aria-current={active ? 'page' : undefined}
            aria-label={`Go to page ${page}`}
            className={
              active
                ? 'flex h-9 w-9 items-center justify-center rounded-full bg-tint text-green-text'
                : 'h-9 w-9 text-text-2 hover:text-text-1'
            }
            key={page}
            onClick={() => onPageChange(page)}
            type="button"
          >
            {page}
          </button>
        );
      })}
      <button
        className="px-3 py-2 text-text-1 disabled:cursor-not-allowed disabled:opacity-40"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        type="button"
      >
        Next
      </button>
    </nav>
  );
}
