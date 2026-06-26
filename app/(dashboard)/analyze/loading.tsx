import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex h-16 items-center justify-between border-b border-border px-6">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <main className="flex-1 overflow-y-auto p-6 space-y-5">
        <Skeleton className="h-24 rounded-2xl" />
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="flex gap-3 px-4 py-3 border-b border-border">
            <Skeleton className="h-8 w-40 rounded-lg" />
            <Skeleton className="h-8 w-72 rounded-lg" />
            <Skeleton className="h-8 w-24 rounded-lg ml-auto" />
          </div>
          <Skeleton className="h-72 rounded-none" />
          <div className="flex justify-between px-4 py-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-9 w-36 rounded-lg" />
          </div>
        </div>
      </main>
    </div>
  );
}
