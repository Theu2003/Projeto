interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circle' | 'card' | 'line';
  width?: string | number;
  height?: string | number;
}

const baseClass = 'relative overflow-hidden bg-gray-200 dark:bg-gray-700 rounded';
const shimmerClass = 'animate-shimmer bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-[length:200%_100%]';

function SkeletonElement({ className = '', variant = 'text', width, height }: SkeletonProps) {
  const variantClasses: Record<string, string> = {
    text: 'h-4 w-full',
    circle: 'h-10 w-10 rounded-full',
    card: 'h-32 w-full rounded-xl',
    line: 'h-px w-full',
  };

  return (
    <div
      className={`${baseClass} ${variantClasses[variant]} ${shimmerClass} ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
      aria-hidden="true"
    />
  );
}

// Pre-built skeleton layouts

export function StatCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
      <div className="text-center space-y-3">
        <SkeletonElement variant="text" width="60%" className="mx-auto" />
        <SkeletonElement variant="text" width="80%" className="mx-auto" />
      </div>
    </div>
  );
}

export function RequestCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div className="space-y-2 flex-1">
          <SkeletonElement variant="text" width="40%" />
          <SkeletonElement variant="text" width="20%" />
        </div>
        <SkeletonElement variant="text" width="80px" className="ml-4" />
      </div>
    </div>
  );
}

export function ReviewCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <SkeletonElement variant="text" width="120px" />
        <div className="flex gap-1">
          {[...Array(5)].map((_, i) => (
            <SkeletonElement key={i} variant="text" width="16px" height="16px" />
          ))}
        </div>
      </div>
      <SkeletonElement variant="text" width="80%" />
    </div>
  );
}

export function DashboardSkeleton({ type = 'resident' }: { type?: 'resident' | 'company' | 'admin' }) {
  const statCards = type === 'admin' ? 8 : type === 'company' ? 4 : 3;
  const requestCards = type === 'admin' ? 0 : 5;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6" aria-label="Loading content">
      {/* Title */}
      <SkeletonElement variant="text" width="240px" height="28px" />

      {/* Stat cards grid */}
      <div className={`grid gap-6 ${
        type === 'admin'
          ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
          : type === 'company'
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
            : 'grid-cols-1 md:grid-cols-3'
      }`}>
        {[...Array(statCards)].map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      {/* Request/Review list */}
      {type !== 'admin' && (
        <div className="space-y-4">
          <SkeletonElement variant="text" width="160px" height="20px" />
          <div className="space-y-3">
            {[...Array(requestCards)].map((_, i) => (
              type === 'company' ? <ReviewCardSkeleton key={i} /> : <RequestCardSkeleton key={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Detail page skeletons

export function RequestDetailSkeleton() {
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6" aria-label="Loading content">
      <SkeletonElement variant="text" width="200px" height="28px" />
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700 space-y-4">
        <div className="flex items-center justify-between">
          <SkeletonElement variant="text" width="120px" height="24px" />
          <SkeletonElement variant="text" width="80px" />
        </div>
        <SkeletonElement variant="text" width="60%" />
        <SkeletonElement variant="text" width="80%" />
        <SkeletonElement variant="text" width="40%" />
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700 space-y-3">
        <SkeletonElement variant="text" width="100px" height="20px" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <SkeletonElement variant="circle" width="24px" height="24px" />
            <SkeletonElement variant="text" width="60%" />
          </div>
        ))}
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700 space-y-3">
        <SkeletonElement variant="text" width="80px" height="20px" />
        <SkeletonElement variant="text" width="50%" />
        <SkeletonElement variant="text" width="30%" />
      </div>
    </div>
  );
}

export function CompanyRequestDetailSkeleton() {
  return (
    <div className="max-w-2xl mx-auto space-y-6" aria-label="Loading content">
      <SkeletonElement variant="text" width="200px" height="28px" />
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700 space-y-4">
        <div className="flex items-center justify-between">
          <SkeletonElement variant="text" width="120px" />
          <SkeletonElement variant="text" width="100px" />
        </div>
        <div className="space-y-2">
          <SkeletonElement variant="text" width="100px" height="20px" />
          <SkeletonElement variant="text" width="50%" />
          <SkeletonElement variant="text" width="30%" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-1">
              <SkeletonElement variant="text" width="60%" />
              <SkeletonElement variant="text" width="40%" />
            </div>
          ))}
        </div>
        <SkeletonElement variant="text" width="30%" height="20px" />
        <SkeletonElement variant="text" width="80%" />
      </div>
      <div className="flex gap-3">
        <SkeletonElement variant="text" height="44px" className="flex-1" />
        <SkeletonElement variant="text" height="44px" className="flex-1" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-6" aria-label="Loading content">
      <SkeletonElement variant="text" width="200px" height="28px" />
      <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-6">
            {[...Array(5)].map((_, i) => (
              <SkeletonElement key={i} variant="text" width={`${70 + i * 20}px`} />
            ))}
          </div>
        </div>
        {/* Rows */}
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {[...Array(rows)].map((_, i) => (
            <div key={i} className="flex gap-6 px-4 py-4">
              {[...Array(5)].map((_, j) => (
                <SkeletonElement key={j} variant="text" width={`${60 + (j * 15) % 60}px`} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ReportsSkeleton() {
  return (
    <div className="space-y-6" aria-label="Loading content">
      <div className="flex items-center justify-between">
        <SkeletonElement variant="text" width="120px" height="28px" />
        <div className="flex gap-2">
          <SkeletonElement variant="text" width="120px" height="40px" />
          <SkeletonElement variant="text" width="120px" height="40px" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700 space-y-3">
            <SkeletonElement variant="text" width="60%" height="24px" />
            {[...Array(4)].map((_, j) => (
              <div key={j} className="flex justify-between">
                <SkeletonElement variant="text" width="50%" />
                <SkeletonElement variant="text" width="20%" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6" aria-label="Loading content">
      <SkeletonElement variant="text" width="220px" height="28px" />
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700 space-y-5">
        <div className="space-y-2">
          <SkeletonElement variant="text" width="80px" height="16px" />
          <SkeletonElement variant="text" height="42px" />
        </div>
        <div className="space-y-2">
          <SkeletonElement variant="text" width="100px" height="16px" />
          <SkeletonElement variant="text" height="42px" />
        </div>
        <div className="space-y-2">
          <SkeletonElement variant="text" width="90px" height="16px" />
          <SkeletonElement variant="text" height="42px" />
        </div>
        <div className="space-y-2">
          <SkeletonElement variant="text" width="100px" height="16px" />
          <SkeletonElement variant="text" height="80px" />
        </div>
        <SkeletonElement variant="text" height="44px" />
      </div>
    </div>
  );
}

export default SkeletonElement;
