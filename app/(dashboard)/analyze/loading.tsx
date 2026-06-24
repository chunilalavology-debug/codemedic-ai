import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="p-6 space-y-5">
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="flex gap-3 px-4 py-3 border-b border-border">
          <Skeleton className="h-8 w-36 rounded-lg" />
          <Skeleton className="h-8 w-64 rounded-lg" />
          <Skeleton className="h-8 w-28 rounded-lg ml-auto" />
        </div>
        <Skeleton className="h-56 rounded-none" />
        <div className="flex justify-between px-4 py-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
