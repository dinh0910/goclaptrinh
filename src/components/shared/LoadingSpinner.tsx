interface LoadingSpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClass = {
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-10 h-10",
};

export function LoadingSpinner({
  className = "",
  size = "md",
}: LoadingSpinnerProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      className={`text-blue-600 dark:text-blue-400 animate-spin ${sizeClass[size]} ${className}`}
      role="status"
      aria-label="Đang tải"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        pathLength="1"
        strokeDasharray="0.75 1"
      />
    </svg>
  );
}

export function LoadingScreen({
  label = "Đang tải...",
  className = "",
  compact = false,
}: {
  label?: string;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 ${
        compact ? "py-8" : "py-20"
      } ${className}`}
    >
      <LoadingSpinner size={compact ? "md" : "lg"} />
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
        {label}
      </p>
    </div>
  );
}