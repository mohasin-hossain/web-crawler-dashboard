import { cn } from "../../lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-gray-200 dark:bg-gray-800",
        className
      )}
    />
  );
}

// Table skeleton loader
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {/* Header skeleton */}
      <div className="flex items-center space-x-4 p-4 border rounded-lg">
        <Skeleton className="h-4 w-4" /> {/* Checkbox */}
        <Skeleton className="h-4 w-32" /> {/* URL */}
        <Skeleton className="h-4 w-16" /> {/* Status */}
        <Skeleton className="h-4 w-20" /> {/* Links */}
        <Skeleton className="h-4 w-20" /> {/* Broken */}
        <Skeleton className="h-4 w-24" /> {/* Date */}
        <Skeleton className="h-4 w-16" /> {/* Actions */}
      </div>

      {/* Row skeletons */}
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center space-x-4 p-4 border rounded-lg"
        >
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-24" />
        </div>
      ))}
    </div>
  );
}

// Card skeleton loader for stats
export function StatsCardSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="border rounded-lg p-6 space-y-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-full" />
        </div>
      ))}
    </div>
  );
}

// Detail page skeleton loader
export function UrlDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <div className="flex items-center space-x-4">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-4 space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-6 w-12" />
          </div>
        ))}
      </div>

      {/* Chart skeleton */}
      <div className="border rounded-lg p-6">
        <Skeleton className="h-6 w-40 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>

      {/* Table skeleton */}
      <div className="border rounded-lg p-6">
        <Skeleton className="h-6 w-32 mb-4" />
        <TableSkeleton rows={3} />
      </div>
    </div>
  );
}

// Form skeleton loader
export function FormSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-full" />
      </div>
      <Skeleton className="h-10 w-24" />
    </div>
  );
}

// Progress indicator for processing URLs
export function ProcessingIndicator({
  url,
  className,
}: {
  url?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-100" />
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-200" />
      </div>
      <span className="text-sm text-gray-600 dark:text-gray-400">
        {url ? `Analyzing ${url}...` : "Processing..."}
      </span>
    </div>
  );
}

// Shimmer effect for images/charts
export function ShimmerEffect({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-gray-200 dark:bg-gray-800 rounded-md",
        className
      )}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-gray-300/60 dark:via-gray-700/60 to-transparent" />
    </div>
  );
}

// List skeleton for navigation/sidebar
export function ListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3 p-2">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 flex-1" />
        </div>
      ))}
    </div>
  );
}
