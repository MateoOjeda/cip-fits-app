import * as React from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, value, onChange, onClear, ...props }, ref) => {
    const showClear = React.useMemo(() => {
      if (value === undefined) return false;
      return String(value).length > 0;
    }, [value]);

    return (
      <div className="relative w-full flex items-center">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 pointer-events-none" />
        <Input
          ref={ref}
          value={value}
          onChange={onChange}
          className={cn(
            "pl-9 pr-9 h-9.5 text-xs bg-secondary/15 border-border/50 rounded-xl focus-visible:ring-primary/20 transition-all duration-200",
            className
          )}
          {...props}
        />
        {showClear && onClear && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClear}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground/60 hover:text-foreground hover:bg-secondary/40 rounded-lg transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    );
  }
);
SearchInput.displayName = "SearchInput";

export { SearchInput };
