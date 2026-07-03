import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import React, { ReactNode } from 'react';

interface Tab {
  value: string;
  label: string;
  content: ReactNode;
}

interface TabContainerProps {
  tabs: Tab[];
  defaultValue?: string;
}

export const TabContainer: React.FC<TabContainerProps> = ({ tabs, defaultValue }) => {
  return (
    <Tabs defaultValue={defaultValue}>
      <TabsList className="flex flex-wrap w-full bg-muted/40 border border-border/50 p-1 h-auto rounded-xl">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="flex-1 min-w-[70px] text-[10px] py-1.5 px-2 transition-all data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-lg font-semibold"
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} className="space-y-4 outline-none">
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
};
