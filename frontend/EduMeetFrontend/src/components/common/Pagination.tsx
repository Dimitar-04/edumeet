import { Fragment } from 'react';

interface PaginationProps {
  pageNumber: number;
  totalPages: number;
  onPageChange: (pageNumber: number) => void;
}

function Pagination({
  pageNumber,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from(
    new Set(
      [1, pageNumber - 1, pageNumber, pageNumber + 1, totalPages].filter(
        (page) => page >= 1 && page <= totalPages,
      ),
    ),
  ).sort((first, second) => first - second);

  return (
    <nav className="event-pagination" aria-label="Event pages">
      <button
        type="button"
        disabled={pageNumber === 1}
        onClick={() => onPageChange(pageNumber - 1)}
      >
        Previous
      </button>

      <div className="event-pagination-pages">
        {pages.map((page, index) => (
          <Fragment key={page}>
            {index > 0 && page - pages[index - 1] > 1 ? (
              <span aria-hidden="true">&hellip;</span>
            ) : null}
            <button
              className={page === pageNumber ? 'active' : ''}
              type="button"
              aria-current={page === pageNumber ? 'page' : undefined}
              aria-label={`Go to page ${page}`}
              onClick={() => onPageChange(page)}
            >
              {page}
            </button>
          </Fragment>
        ))}
      </div>

      <button
        type="button"
        disabled={pageNumber === totalPages}
        onClick={() => onPageChange(pageNumber + 1)}
      >
        Next
      </button>
    </nav>
  );
}

export default Pagination;
