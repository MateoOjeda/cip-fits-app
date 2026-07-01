import * as React from "react";
import { SearchInput } from "@/components/ui/search-input";
import { Button } from "@/components/ui/button";
import { Plus, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DataToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onSearchClear?: () => void;
  
  // Primary button action
  primaryActionText?: string;
  onPrimaryAction?: () => void;
  primaryActionIcon?: React.ReactNode;
  
  // Custom filters slots
  filters?: React.ReactNode;
  
  // Extra elements (sorting, bulk action etc)
  extraActions?: React.ReactNode;
}

const DataToolbar: React.FC<DataToolbarProps> = ({
  className,
  searchPlaceholder = "Buscar...",
  searchValue = "",
  onSearchChange,
  onSearchClear,
  primaryActionText,
  onPrimaryAction,
  primaryActionIcon = <Plus className="h-3.5 w-3.5" />,
  filters,
  extraActions,
  ...props
}) => {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 p-3.5 rounded-2xl border border-border/40 bg-card/45 backdrop-blur-md shadow-sm mb-4",
        className
      )}
      {...props}
    >
      <div className="flex flex-1 flex-col sm:flex-row sm:items-center gap-2.5">
        {onSearchChange && (
          <div className="w-full sm:max-w-xs shrink-0">
            <SearchInput
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              onClear={onSearchClear}
            />
          </div>
        )}
        
        {filters && (
          <div className="flex items-center gap-2 flex-wrap">
            {filters}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap justify-end">
        {extraActions && (
          <div className="flex items-center gap-2">
            {extraActions}
          </div>
        )}
        
        {primaryActionText && onPrimaryAction && (
          <Button
            size="sm"
            onClick={onPrimaryAction}
            className="h-8.5 text-xs font-bold rounded-xl shadow-sm px-3.5 transition-all duration-200 hover:scale-[1.01]"
          >
            {primaryActionIcon && <span className="mr-1.5 shrink-0">{primaryActionIcon}</span>}
            {primaryActionText}
          </Button>
        )}
      </div>
    </div>
  );
};

export { DataToolbar };
