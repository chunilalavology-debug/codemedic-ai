import { Skeleton } from "@/components/ui/skeleton";
export default function ImageToCodeLoading() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex h-16 items-center justify-between border-b border-border px-6">
        <Skeleton className="h-5 w-40" /><Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <main className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto w-full">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4"><Skeleton className="h-64 rounded-xl" /><Skeleton className="h-32 rounded-xl" /><Skeleton className="h-10 rounded-xl" /></div>
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </main>
    </div>
  );
}
