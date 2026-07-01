import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface Column<T> {
  header: string;
  accessor: (item: T) => React.ReactNode;
  className?: string;
}

export interface PremiumTableProps<T> extends React.HTMLAttributes<HTMLDivElement> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyText?: string;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onRowClick?: (item: T) => void;
}

function PremiumTable<T>({
  className,
  columns,
  data,
  loading = false,
  emptyText = "Sin datos disponibles",
  currentPage,
  totalPages,
  onPageChange,
  onRowClick,
  ...props
}: PremiumTableProps<T>) {
  return (
    <div className={cn("space-y-4", className)} {...props}>
      <div className="border border-border/40 rounded-2xl overflow-hidden bg-card/65 backdrop-blur-md shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/15 border-b border-border/40">
              <TableRow className="hover:bg-transparent border-none">
                {columns.map((col, idx) => (
                  <TableHead
                    key={idx}
                    className={cn(
                      "h-10 text-[9px] font-bold uppercase tracking-widest text-muted-foreground select-none",
                      col.className
                    )}
                  >
                    {col.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-32 text-center text-xs text-muted-foreground animate-pulse">
                    Cargando información...
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-32 text-center text-xs text-muted-foreground italic">
                    {emptyText}
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item, rowIdx) => (
                  <TableRow
                    key={rowIdx}
                    onClick={() => onRowClick && onRowClick(item)}
                    className={cn(
                      "border-b border-border/20 last:border-none hover:bg-secondary/20 transition-colors select-none",
                      onRowClick && "cursor-pointer"
                    )}
                  >
                    {columns.map((col, colIdx) => (
                      <TableCell
                        key={colIdx}
                        className={cn(
                          "py-3 text-xs text-foreground/85 font-semibold",
                          col.className
                        )}
                      >
                        {col.accessor(item)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {onPageChange && currentPage !== undefined && totalPages !== undefined && totalPages > 1 && (
        <div className="flex items-center justify-end gap-2.5 px-1">
          <span className="text-[10px] text-muted-foreground font-bold">
            Página {currentPage} de {totalPages}
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg border-border"
              disabled={currentPage <= 1}
              onClick={() => onPageChange(currentPage - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg border-border"
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange(currentPage + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export { PremiumTable };
