import type { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: "blue" | "green" | "red" | "yellow" | "purple" | "gray";
  trend?: {
    value: number;
    isUpward: boolean;
    label: string;
  };
  description?: string;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  color = "blue",
  trend,
  description,
}: StatsCardProps) {
  const colorClasses = {
    blue: {
      bg: "bg-blue-50",
      text: "text-blue-600",
      border: "border-blue-200",
    },
    green: {
      bg: "bg-green-50",
      text: "text-green-600",
      border: "border-green-200",
    },
    red: {
      bg: "bg-red-50",
      text: "text-red-600",
      border: "border-red-200",
    },
    yellow: {
      bg: "bg-yellow-50",
      text: "text-yellow-600",
      border: "border-yellow-200",
    },
    purple: {
      bg: "bg-purple-50",
      text: "text-purple-600",
      border: "border-purple-200",
    },
    gray: {
      bg: "bg-gray-50",
      text: "text-gray-600",
      border: "border-gray-200",
    },
  };

  const classes = colorClasses[color];

  return (
    <div className="bg-white rounded-lg border p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center">
        <div
          className={`rounded-lg p-3 ${classes.bg} ${classes.border} border`}
        >
          <Icon className={`w-6 h-6 ${classes.text}`} />
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <div className="flex items-baseline">
            <p className={`text-2xl font-bold ${classes.text}`}>{value}</p>
            {trend && (
              <span
                className={`ml-2 text-xs font-medium ${
                  trend.isUpward ? "text-green-600" : "text-red-600"
                }`}
              >
                {trend.isUpward ? "↗" : "↘"} {trend.value}% {trend.label}
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
}
