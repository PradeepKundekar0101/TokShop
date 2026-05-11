import * as React from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"
import { ButtonProps, buttonVariants } from "@/components/ui/button"

const Pagination = ({ className, ...props }: React.ComponentProps<"nav">) => (
  <nav
    role="navigation"
    aria-label="pagination"
    className={cn("mx-auto flex w-full justify-center", className)}
    {...props}
  />
)
Pagination.displayName = "Pagination"

const PaginationContent = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn("flex flex-row items-center gap-1", className)}
    {...props}
  />
))
PaginationContent.displayName = "PaginationContent"

const PaginationItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("", className)} {...props} />
))
PaginationItem.displayName = "PaginationItem"

type PaginationLinkProps = {
  isActive?: boolean
} & Pick<ButtonProps, "size"> &
  React.ComponentProps<"a">

const PaginationLink = ({
  className,
  isActive,
  size = "icon",
  ...props
}: PaginationLinkProps) => (
  <a
    aria-current={isActive ? "page" : undefined}
    className={cn(
      buttonVariants({
        variant: isActive ? "outline" : "ghost",
        size,
      }),
      className
    )}
    {...props}
  />
)
PaginationLink.displayName = "PaginationLink"

const PaginationPrevious = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Go to previous page"
    size="default"
    className={cn("gap-1 pl-2.5", className)}
    {...props}
  >
    <ChevronLeft className="h-4 w-4" />
    <span>Previous</span>
  </PaginationLink>
)
PaginationPrevious.displayName = "PaginationPrevious"

const PaginationNext = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Go to next page"
    size="default"
    className={cn("gap-1 pr-2.5", className)}
    {...props}
  >
    <span>Next</span>
    <ChevronRight className="h-4 w-4" />
  </PaginationLink>
)
PaginationNext.displayName = "PaginationNext"

const PaginationEllipsis = ({
  className,
  ...props
}: React.ComponentProps<"span">) => (
  <span
    aria-hidden
    className={cn("flex h-9 w-9 items-center justify-center", className)}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More pages</span>
  </span>
)
PaginationEllipsis.displayName = "PaginationEllipsis"

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
}

// Complete Pagination Component with all required features
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface CompletePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  itemsPerPageOptions?: number[];
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  showingText?: string; // e.g., "orders", "items", "results"
  className?: string;
}

export function CompletePagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  itemsPerPageOptions = [10, 20, 50, 100],
  onPageChange,
  onItemsPerPageChange,
  showingText = "items",
  className,
}: CompletePaginationProps) {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  const goToFirstPage = () => onPageChange(1);
  const goToPreviousPage = () => onPageChange(Math.max(1, currentPage - 1));
  const goToNextPage = () => onPageChange(Math.min(totalPages, currentPage + 1));
  const goToLastPage = () => onPageChange(totalPages);

  // Generate page numbers to show (show current page and 2 pages before/after when possible)
  const getVisiblePageNumbers = () => {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show current page with surrounding pages
      const start = Math.max(1, currentPage - 2);
      const end = Math.min(totalPages, start + maxVisiblePages - 1);
      
      // Adjust start if we're near the end
      const adjustedStart = Math.max(1, end - maxVisiblePages + 1);
      
      for (let i = adjustedStart; i <= end; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  // Generate mobile page numbers (always show 3 pages centered on current)
  const getMobilePageNumbers = () => {
    const mobilePages: number[] = [];
    const mobileVisibleCount = 3;
    
    if (totalPages <= 5) {
      // Show all pages if total is 5 or less
      for (let i = 1; i <= totalPages; i++) {
        mobilePages.push(i);
      }
    } else {
      // Show 3 pages centered on current page
      let start = currentPage - 1;
      let end = currentPage + 1;
      
      // Adjust if near the start
      if (start < 1) {
        start = 1;
        end = Math.min(totalPages, mobileVisibleCount);
      }
      
      // Adjust if near the end
      if (end > totalPages) {
        end = totalPages;
        start = Math.max(1, totalPages - mobileVisibleCount + 1);
      }
      
      for (let i = start; i <= end; i++) {
        mobilePages.push(i);
      }
    }
    
    return mobilePages;
  };

  const visiblePages = getVisiblePageNumbers();
  const mobileVisiblePages = getMobilePageNumbers();

  if (totalItems === 0) {
    return (
      <div className={cn("flex items-center justify-center px-2", className)}>
        <div className="text-sm text-muted-foreground" data-testid="pagination-info">
          No {showingText} found
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col md:flex-row gap-4 md:items-center md:justify-between px-2 py-3 md:py-2", className)}>
      {/* Left side - Showing X-Y of Z text */}
      <div className="text-xs md:text-sm text-muted-foreground order-2 md:order-1" data-testid="pagination-info">
        Showing {startItem}-{endItem} of {totalItems} {showingText}
      </div>

      {/* Right side - Pagination controls */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center order-1 md:order-2">
        {/* Items per page selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs md:text-sm text-muted-foreground whitespace-nowrap">Items per page</span>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => onItemsPerPageChange(parseInt(value))}
            data-testid="pagination-items-per-page"
          >
            <SelectTrigger className="w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {itemsPerPageOptions.map((option) => (
                <SelectItem key={option} value={option.toString()}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Page navigation */}
        <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-1">
          <div className="flex items-center gap-1">
            {/* First page button - hidden on mobile */}
            <Button
              variant="outline"
              size="sm"
              onClick={goToFirstPage}
              disabled={!canGoPrevious}
              data-testid="pagination-first"
              className="h-8 w-8 p-0 hidden sm:flex"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>

            {/* Previous page button */}
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousPage}
              disabled={!canGoPrevious}
              data-testid="pagination-previous"
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-3 w-3 md:h-4 md:w-4" />
            </Button>

            {/* Page numbers - show 3 pages on mobile, all visible pages on larger screens */}
            <div className="flex items-center gap-1">
              {/* Mobile: show mobileVisiblePages */}
              {mobileVisiblePages.map((pageNumber) => (
                <Button
                  key={`mobile-${pageNumber}`}
                  variant={pageNumber === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(pageNumber)}
                  data-testid={`pagination-page-${pageNumber}`}
                  className="h-8 w-8 p-0 text-xs md:text-sm sm:hidden"
                >
                  {pageNumber}
                </Button>
              ))}
              
              {/* Desktop/Tablet: show all visiblePages */}
              {visiblePages.map((pageNumber) => (
                <Button
                  key={`desktop-${pageNumber}`}
                  variant={pageNumber === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(pageNumber)}
                  data-testid={`pagination-page-${pageNumber}`}
                  className="hidden sm:flex h-8 w-8 p-0 text-xs md:text-sm"
                >
                  {pageNumber}
                </Button>
              ))}
            </div>

            {/* Next page button */}
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              disabled={!canGoNext}
              data-testid="pagination-next"
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-3 w-3 md:h-4 md:w-4" />
            </Button>

            {/* Last page button - hidden on mobile */}
            <Button
              variant="outline"
              size="sm"
              onClick={goToLastPage}
              disabled={!canGoNext}
              data-testid="pagination-last"
              className="h-8 w-8 p-0 hidden sm:flex"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Page info */}
          <span className="text-xs md:text-sm text-muted-foreground whitespace-nowrap" data-testid="pagination-page-info">
            Page {currentPage} of {totalPages}
          </span>
        </div>
      </div>
    </div>
  );
}
