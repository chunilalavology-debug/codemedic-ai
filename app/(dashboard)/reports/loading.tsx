import { Skeleton } from "@/components/ui/skeleton";
export default function ReportsLoading() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex h-16 items-center justify-between border-b border-border px-6">
        <Skeleton className="h-5 w-24" /><Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <main className="flex-1 overflow-y-auto p-6 max-w-6xl mx-auto w-full space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({length:4}).map((_,i)=><Skeleton key={i} className="h-24 rounded-xl"/>)}</div>
        <div className="grid gap-4 lg:grid-cols-2"><Skeleton className="h-60 rounded-xl"/><Skeleton className="h-60 rounded-xl"/></div>
        <Skeleton className="h-40 rounded-xl"/>
      </main>
    </div>
  );
}
