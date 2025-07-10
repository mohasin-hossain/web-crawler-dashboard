import { AlertTriangle, ExternalLink, Link as LinkIcon } from "lucide-react";
import type { AnalysisResult, BrokenLink } from "../../types/url";
import { Badge } from "../ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

interface BrokenLinksTableProps {
  analysis: AnalysisResult;
}

export function BrokenLinksTable({ analysis }: BrokenLinksTableProps) {
  const brokenLinks = analysis.broken_links_details || [];

  const getStatusCodeColor = (statusCode: number) => {
    if (statusCode >= 400 && statusCode < 500) {
      return "bg-red-100 text-red-800 border-red-200";
    }
    if (statusCode >= 500) {
      return "bg-orange-100 text-orange-800 border-orange-200";
    }
    return "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getStatusCodeDescription = (statusCode: number) => {
    const descriptions: { [key: number]: string } = {
      400: "Bad Request",
      401: "Unauthorized",
      403: "Forbidden",
      404: "Not Found",
      405: "Method Not Allowed",
      408: "Request Timeout",
      410: "Gone",
      429: "Too Many Requests",
      500: "Internal Server Error",
      502: "Bad Gateway",
      503: "Service Unavailable",
      504: "Gateway Timeout",
    };
    return descriptions[statusCode] || "Unknown Error";
  };

  const formatUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname + urlObj.pathname + (urlObj.search || "");
    } catch {
      return url;
    }
  };

  if (brokenLinks.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <LinkIcon className="w-5 h-5 mr-2" />
            Broken Links
          </h2>
          <Badge variant="secondary" className="bg-green-50 text-green-700">
            No broken links found
          </Badge>
        </div>

        <div className="text-center py-12">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <LinkIcon className="w-8 h-8 text-green-600" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-gray-900">
                All links are working!
              </h3>
              <p className="text-gray-500">
                No broken links were detected during the analysis.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
          Broken Links
        </h2>
        <Badge variant="destructive">
          {brokenLinks.length} broken link{brokenLinks.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      {/* Summary */}
      <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-start">
          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-red-800">
              {brokenLinks.length} broken link
              {brokenLinks.length !== 1 ? "s" : ""} detected
            </h3>
            <p className="text-sm text-red-700 mt-1">
              These links are not accessible and may need to be fixed or removed
              to improve user experience and SEO.
            </p>
          </div>
        </div>
      </div>

      {/* Broken Links Table */}
      <div className="overflow-x-auto">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>URL</TableHead>
                <TableHead className="w-32">Status Code</TableHead>
                <TableHead>Error</TableHead>
                <TableHead className="w-20">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {brokenLinks.map((link: BrokenLink, index: number) => (
                <TableRow key={index}>
                  <TableCell>
                    <div className="max-w-md">
                      <p
                        className="font-medium text-gray-900 truncate"
                        title={link.url}
                      >
                        {formatUrl(link.url)}
                      </p>
                      {link.url !== formatUrl(link.url) && (
                        <p
                          className="text-xs text-gray-500 truncate mt-1"
                          title={link.url}
                        >
                          {link.url}
                        </p>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant="outline"
                      className={getStatusCodeColor(link.status_code)}
                    >
                      {link.status_code}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <div>
                      <p className="font-medium text-gray-900">
                        {getStatusCodeDescription(link.status_code)}
                      </p>
                      {link.error && (
                        <p className="text-sm text-gray-500 mt-1">
                          {link.error}
                        </p>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <button
                      onClick={() => window.open(link.url, "_blank")}
                      className="text-blue-600 hover:text-blue-800 p-1"
                      title="Open link in new tab"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Recommendations */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-medium text-blue-800 mb-2">Recommendations</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Fix or remove broken links to improve user experience</li>
          <li>• Update outdated URLs to their new locations</li>
          <li>• Consider implementing 301 redirects for moved content</li>
          <li>• Use tools like Google Search Console to monitor link health</li>
        </ul>
      </div>
    </div>
  );
}
