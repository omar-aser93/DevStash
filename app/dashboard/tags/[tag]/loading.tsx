import { Skeleton } from "@/components/ui/skeleton";

export default function ItemsByTypeLoading() {
  return (
    <div className="flex-1 overflow-y-auto bg-background/50 p-6 space-y-6">
      {/* Header */}
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-32 mt-1" />
      </div>

      {/* Grid of item cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    </div>
  );
}