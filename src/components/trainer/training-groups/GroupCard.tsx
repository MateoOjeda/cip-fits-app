import React from 'react';
import { PremiumCard, PremiumCardContent } from '@/components/ui/premium-card';
import { Button } from '@/components/ui/button';
import { Trash2, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface GroupCardProps {
  group: {
    id: string;
    name: string;
  };
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

export const GroupCard: React.FC<GroupCardProps> = ({ group, selected, onSelect, onDelete }) => {
  return (
    <PremiumCard
      className={cn(
        "cursor-pointer transition-all duration-200 rounded-2xl border shadow-sm hover:scale-[1.01]",
        selected
          ? "bg-primary/5 border-primary/30 shadow-md"
          : "bg-card border-border/40 hover:bg-muted/10"
      )}
      onClick={onSelect}
    >
      <PremiumCardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/25">
            <Users className="h-4.5 w-4.5 text-primary" />
          </div>
          <span className="font-bold text-xs text-foreground truncate max-w-[150px]">
            {group.name}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </PremiumCardContent>
    </PremiumCard>
  );
};
