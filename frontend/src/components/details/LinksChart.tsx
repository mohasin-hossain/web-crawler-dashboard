import { BarChart, PieChart, TrendingUp } from "lucide-react";
import { useState } from "react";
import {
  Bar,
  Cell,
  Legend,
  Pie,
  BarChart as RechartsBarChart,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AnalysisResult } from "../../types/url";

interface LinksChartProps {
  analysis: AnalysisResult;
}

export function LinksChart({ analysis }: LinksChartProps) {
  const [chartType, setChartType] = useState<"bar" | "donut">("bar");

  const linksData = [
    {
      type: "Internal Links",
      count: analysis.internal_links || 0,
      color: "#3B82F6",
      percentage: 0,
    },
    {
      type: "External Links",
      count: analysis.external_links || 0,
      color: "#10B981",
      percentage: 0,
    },
  ];

  const totalLinks = linksData.reduce((sum, item) => sum + item.count, 0);

  // Calculate percentages
  linksData.forEach((item) => {
    item.percentage =
      totalLinks > 0 ? Math.round((item.count / totalLinks) * 100) : 0;
  });

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<{ value: number; payload: any }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{label || data.type}</p>
          <p className="text-sm text-gray-600">
            Count: {data.count} ({data.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{ value: number; payload: any }>;
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{data.type}</p>
          <p className="text-sm text-gray-600">
            {data.count} links ({data.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const getLinkInsights = () => {
    const { internal_links = 0, external_links = 0 } = analysis;

    if (totalLinks === 0) {
      return {
        type: "info",
        message: "No links found on this page.",
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
      };
    }

    const internalRatio = internal_links / totalLinks;

    if (internalRatio > 0.8) {
      return {
        type: "info",
        message:
          "High internal link ratio - good for site navigation and SEO internal linking.",
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
      };
    }

    if (internalRatio < 0.3) {
      return {
        type: "warning",
        message:
          "Low internal link ratio - consider adding more internal links for better site structure.",
        color: "text-yellow-600",
        bgColor: "bg-yellow-50",
        borderColor: "border-yellow-200",
      };
    }

    return {
      type: "success",
      message: "Good balance between internal and external links.",
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
    };
  };

  const insights = getLinkInsights();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Link Analysis
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setChartType("bar")}
              className={`p-2 rounded-lg transition-colors ${
                chartType === "bar"
                  ? "bg-blue-100 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <BarChart className="w-4 h-4" />
            </button>
            <button
              onClick={() => setChartType("donut")}
              className={`p-2 rounded-lg transition-colors ${
                chartType === "donut"
                  ? "bg-blue-100 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <PieChart className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Insights */}
        <div
          className={`p-4 rounded-lg border ${insights.borderColor} ${insights.bgColor}`}
        >
          <p className={`text-sm ${insights.color} font-medium`}>
            {insights.message}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Internal vs External Links
          </h3>
          <div className="text-sm text-gray-500">
            Total: {totalLinks} link{totalLinks !== 1 ? "s" : ""}
          </div>
        </div>

        {totalLinks > 0 ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "bar" ? (
                <RechartsBarChart
                  data={linksData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <XAxis
                    dataKey="type"
                    stroke="#6b7280"
                    fontSize={12}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {linksData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </RechartsBarChart>
              ) : (
                <RechartsPieChart>
                  <Pie
                    data={linksData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="count"
                  >
                    {linksData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                  <Legend
                    formatter={(value, entry) => (
                      <span style={{ color: entry.color }}>
                        {value}: {entry.payload.count} (
                        {entry.payload.percentage}%)
                      </span>
                    )}
                  />
                </RechartsPieChart>
              )}
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No links found on this page</p>
            </div>
          </div>
        )}
      </div>

      {/* Detailed Stats */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Link Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {linksData.map((link) => (
            <div key={link.type} className="flex items-center space-x-4">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: link.color }}
              ></div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-gray-900">{link.type}</span>
                  <span className="text-sm text-gray-500">
                    {link.percentage}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-gray-900">
                    {link.count}
                  </span>
                  <span className="text-xs text-gray-500">
                    {link.count === 1 ? "link" : "links"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* SEO Tips */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3">
            Link Building Best Practices
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="font-medium">Internal Links:</span>
              </div>
              <ul className="space-y-1 ml-4">
                <li>• Help users navigate your site</li>
                <li>• Distribute page authority</li>
                <li>• Improve crawl depth</li>
              </ul>
            </div>
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="font-medium">External Links:</span>
              </div>
              <ul className="space-y-1 ml-4">
                <li>• Provide value to users</li>
                <li>• Link to authoritative sources</li>
                <li>• Use descriptive anchor text</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
