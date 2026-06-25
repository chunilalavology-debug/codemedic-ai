import { Skeleton } from "@/components/ui/skeleton";
export default function ApiInspectorLoading() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex h-16 items-center justify-between border-b border-border px-6">
        <Skeleton className="h-5 w-32" /><Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <main className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto w-full space-y-4">
        <Skeleton className="h-6 w-36" /><Skeleton className="h-4 w-80" />
        <Skeleton className="h-48 rounded-xl" />
      </main>
    </div>
  );
}
