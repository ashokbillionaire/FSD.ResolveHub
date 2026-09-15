"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";

import { COMPLAINT_PRIORITIES, COMPLAINT_STATUSES } from "@/types/database";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";

export type FilterOption = { value: string; label: string };

const SORT_OPTIONS: FilterOption[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "priority", label: "Highest priority" },
  { value: "status", label: "Workflow order" },
];

/**
 * Filter bar for complaint lists.
 *
 * State lives in the URL, so filters survive a refresh, work with the browser
 * back button and can be shared. Submitting the form pushes the new query.
 */
export function ComplaintFilters({
  categories,
  staff,
  showStaffFilter = false,
  className,
}: {
  categories: FilterOption[];
  staff?: FilterOption[];
  showStaffFilter?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSearch = searchParams.get("search") ?? "";
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = React.useTransition();

  function applyParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "All") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    // Any filter change resets pagination.
    params.delete("page");

    startTransition(() => {
      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname);
    });
  }

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    applyParam("search", (searchInputRef.current?.value ?? "").trim());
  }

  function clearAll() {
    // The keyed input remounts from the URL, so clearing the ref is enough.
    if (searchInputRef.current) searchInputRef.current.value = "";
    startTransition(() => router.push(pathname));
  }

  const activeCount =
    (searchParams.get("search") ? 1 : 0) +
    (searchParams.get("status") ? 1 : 0) +
    (searchParams.get("priority") ? 1 : 0) +
    (searchParams.get("categoryId") ? 1 : 0) +
    (searchParams.get("assignedTo") ? 1 : 0) +
    (searchParams.get("sort") ? 1 : 0);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <form onSubmit={handleSearchSubmit} className="relative flex-1" role="search">
          <label htmlFor="complaint-search" className="sr-only">
            Search complaints
          </label>
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          {/*
            Uncontrolled on purpose: `key` remounts the field whenever the URL
            search term changes (e.g. "Clear filters"), so the input always
            reflects the active query without mirroring it in component state.
          */}
          <Input
            key={currentSearch}
            ref={searchInputRef}
            id="complaint-search"
            name="search"
            type="search"
            defaultValue={currentSearch}
            placeholder="Search by number, title, location or description…"
            className="pl-9"
            disabled={isPending}
          />
        </form>

        <div className="flex items-center gap-2">
          <label htmlFor="complaint-sort" className="sr-only">
            Sort complaints
          </label>
          <Select
            id="complaint-sort"
            value={searchParams.get("sort") ?? "newest"}
            onChange={(event) => applyParam("sort", event.target.value)}
            className="w-full lg:w-44"
            disabled={isPending}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
          <SlidersHorizontal className="size-3.5" aria-hidden />
          Filters
        </span>

        <label htmlFor="filter-status" className="sr-only">
          Filter by status
        </label>
        <Select
          id="filter-status"
          value={searchParams.get("status") ?? "All"}
          onChange={(event) => applyParam("status", event.target.value)}
          className="h-9 w-auto min-w-36 text-xs"
          disabled={isPending}
        >
          <option value="All">All statuses</option>
          {COMPLAINT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </Select>

        <label htmlFor="filter-priority" className="sr-only">
          Filter by priority
        </label>
        <Select
          id="filter-priority"
          value={searchParams.get("priority") ?? "All"}
          onChange={(event) => applyParam("priority", event.target.value)}
          className="h-9 w-auto min-w-36 text-xs"
          disabled={isPending}
        >
          <option value="All">All priorities</option>
          {COMPLAINT_PRIORITIES.map((priority) => (
            <option key={priority} value={priority}>
              {priority}
            </option>
          ))}
        </Select>

        <label htmlFor="filter-category" className="sr-only">
          Filter by category
        </label>
        <Select
          id="filter-category"
          value={searchParams.get("categoryId") ?? ""}
          onChange={(event) => applyParam("categoryId", event.target.value)}
          className="h-9 w-auto min-w-40 text-xs"
          disabled={isPending}
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </Select>

        {showStaffFilter && staff ? (
          <>
            <label htmlFor="filter-staff" className="sr-only">
              Filter by assigned staff
            </label>
            <Select
              id="filter-staff"
              value={searchParams.get("assignedTo") ?? ""}
              onChange={(event) => applyParam("assignedTo", event.target.value)}
              className="h-9 w-auto min-w-40 text-xs"
              disabled={isPending}
            >
              <option value="">Any staff member</option>
              <option value="unassigned">Unassigned</option>
              {staff.map((member) => (
                <option key={member.value} value={member.value}>
                  {member.label}
                </option>
              ))}
            </Select>
          </>
        ) : null}

        {activeCount > 0 ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            disabled={isPending}
            className="text-slate-500"
          >
            <X className="size-3.5" aria-hidden />
            Clear filters
          </Button>
        ) : null}

        {isPending ? (
          <span className="text-xs text-slate-500" role="status">
            Applying…
          </span>
        ) : null}
      </div>
    </div>
  );
}
