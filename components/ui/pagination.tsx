import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Server-rendered pagination. Pages are plain links so they work without
 * JavaScript and stay shareable/bookmarkable.
 */
export function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  basePath,
  searchParams = {},
  className,
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  basePath: string;
  searchParams?: Record<string, string | undefined>;
  className?: string;
}) {
  if (total === 0) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  function hrefFor(target: number) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value !== undefined && value !== "" && key !== "page") {
        params.set(key, value);
      }
    }
    if (target > 1) params.set("page", String(target));
    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
  }

  // Windowed page numbers so long lists stay readable.
  const windowSize = 5;
  let start = Math.max(1, page - Math.floor(windowSize / 2));
  const end = Math.min(totalPages, start + windowSize - 1);
  start = Math.max(1, end - windowSize + 1);

  const pages = Array.from({ length: end - start + 1 }, (_, index) => start + index);

  return (
    <nav
      aria-label="Pagination"
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3",
        className,
      )}
    >
      <p className="text-xs text-slate-500">
        Showing <span className="font-medium text-slate-700">{from}</span>–
        <span className="font-medium text-slate-700">{to}</span> of{" "}
        <span className="font-medium text-slate-700">{total}</span>
      </p>

      <div className="flex items-center gap-1">
        {page > 1 ? (
          <Link
            href={hrefFor(page - 1)}
            rel="prev"
            className="inline-flex size-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
            aria-label="Previous page"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </Link>
        ) : (
          <span
            aria-disabled="true"
            className="inline-flex size-8 items-center justify-center rounded-lg text-slate-300"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </span>
        )}

        {pages.map((pageNumber) => (
          <Link
            key={pageNumber}
            href={hrefFor(pageNumber)}
            aria-current={pageNumber === page ? "page" : undefined}
            className={cn(
              "inline-flex size-8 items-center justify-center rounded-lg text-xs font-medium transition-colors",
              pageNumber === page
                ? "bg-brand-600 text-white"
                : "text-slate-600 hover:bg-slate-100",
            )}
          >
            {pageNumber}
          </Link>
        ))}

        {page < totalPages ? (
          <Link
            href={hrefFor(page + 1)}
            rel="next"
            className="inline-flex size-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
            aria-label="Next page"
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </Link>
        ) : (
          <span
            aria-disabled="true"
            className="inline-flex size-8 items-center justify-center rounded-lg text-slate-300"
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </span>
        )}
      </div>
    </nav>
  );
}
