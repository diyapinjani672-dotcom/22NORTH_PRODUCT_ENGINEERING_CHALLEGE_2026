export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-night-raised rounded-lg ${className}`} />
}

export function CardSkeleton() {
  return (
    <div className="glass rounded-2xl p-5 space-y-4">
      <div className="flex justify-between">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-16" />
      </div>
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  )
}

export function PageSkeleton() {
  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-pulse">
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  )
}
