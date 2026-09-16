'use client';
// Two columns on a wide screen with a draggable divider (shadcn Resizable); stacked on phones.
import { useIsMobile } from '@/hooks/use-mobile';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';

export function MarketDetailLayout({ main, aside }: { main: React.ReactNode; aside: React.ReactNode }) {
  const isMobile = useIsMobile();
  if (isMobile) return <div className="flex flex-col gap-4 px-4">{main}{aside}</div>;
  return (
    <ResizablePanelGroup orientation="horizontal" className="min-h-[640px] px-4 lg:px-6">
      <ResizablePanel defaultSize="64%" minSize="40%"><div className="flex h-full flex-col gap-4 pr-4">{main}</div></ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize="36%" minSize="24%"><div className="flex h-full flex-col gap-4 pl-4">{aside}</div></ResizablePanel>
    </ResizablePanelGroup>
  );
}
