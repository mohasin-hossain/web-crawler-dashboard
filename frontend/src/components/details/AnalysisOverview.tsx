import {
  AlertTriangle,
  Calendar,
  Clock,
  Globe,
  Link,
  Shield,
} from "lucide-react";
import type { AnalysisResult } from "../../types/url";
import { StatusBadge } from "../dashboard/StatusBadge";
import { Badge } from "../ui/badge";

interface AnalysisOverviewProps {
  analysis: AnalysisResult;
}

export function AnalysisOverview({ analysis }: AnalysisOverviewProps) {
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "Not available";

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid date";

      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Invalid date";
    }
  };

  const getSuccessRate = () => {
    const totalLinks = analysis.internal_links + analysis.external_links;
    if (totalLinks === 0) return 100;
    return Math.round(
      ((totalLinks - analysis.broken_links) / totalLinks) * 100
    );
  };

  const stats = [
    {
      title: "Internal Links",
      value: analysis.internal_links,
      icon: Link,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "External Links",
      value: analysis.external_links,
      icon: Globe,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Broken Links",
      value: analysis.broken_links,
      icon: AlertTriangle,
      color: analysis.broken_links > 0 ? "text-red-600" : "text-gray-600",
      bgColor: analysis.broken_links > 0 ? "bg-red-50" : "bg-gray-50",
    },
    {
      title: "Success Rate",
      value: `${getSuccessRate()}%`,
      icon: Shield,
      color:
        getSuccessRate() >= 90
          ? "text-green-600"
          : getSuccessRate() >= 70
          ? "text-yellow-600"
          : "text-red-600",
      bgColor:
        getSuccessRate() >= 90
          ? "bg-green-50"
          : getSuccessRate() >= 70
          ? "bg-yellow-50"
          : "bg-red-50",
    },
  ];

  const totalHeadings = Object.values(analysis.headings).reduce(
    (sum, count) => sum + count,
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {analysis.title || "No Title"}
            </h1>
            <p className="text-gray-600 mb-4 break-all">{analysis.url}</p>

            <div className="flex items-center space-x-4">
              <StatusBadge status={analysis.status} />

              {analysis.html_version && (
                <Badge variant="outline">{analysis.html_version}</Badge>
              )}

              {analysis.has_login_form && (
                <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                  <Shield className="w-3 h-3 mr-1" />
                  Login Form Detected
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Timestamps */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-gray-500">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              Created: {formatDate(analysis.created_at)}
            </div>
            {analysis.analyzed_at && (
              <div className="flex items-center mt-2 sm:mt-0">
                <Clock className="w-4 h-4 mr-2" />
                Analyzed: {formatDate(analysis.analyzed_at)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-6"
            >
              <div className="flex items-center">
                <div className={`rounded-lg p-3 ${stat.bgColor}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </p>
                  <p className={`text-2xl font-bold ${stat.color}`}>
                    {stat.value}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Analysis Summary */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Analysis Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Content Structure */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">
              Content Structure
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Headings:</span>
                <span className="font-medium">{totalHeadings}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">HTML Version:</span>
                <span className="font-medium">
                  {analysis.html_version || "Unknown"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Login Form:</span>
                <span className="font-medium">
                  {analysis.has_login_form ? "Detected" : "Not detected"}
                </span>
              </div>
            </div>
          </div>

          {/* Link Analysis */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Link Analysis</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Links:</span>
                <span className="font-medium">
                  {analysis.internal_links + analysis.external_links}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Success Rate:</span>
                <span
                  className={`font-medium ${
                    getSuccessRate() >= 90
                      ? "text-green-600"
                      : getSuccessRate() >= 70
                      ? "text-yellow-600"
                      : "text-red-600"
                  }`}
                >
                  {getSuccessRate()}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Internal vs External:</span>
                <span className="font-medium">
                  {analysis.internal_links}:{analysis.external_links}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
