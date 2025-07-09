import { Button } from "@/components/ui/button";
import type { HealthCheckResponse } from "@/services/api/health";
import { healthService } from "@/services/api/health";
import { useEffect, useState } from "react";

function App() {
  const [healthStatus, setHealthStatus] = useState<HealthCheckResponse | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkHealth = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const status = await healthService.checkHealth();
      setHealthStatus(status);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect to API");
      setHealthStatus(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const getStatusColor = () => {
    if (isLoading) return "text-yellow-600";
    if (error || healthStatus?.status !== "ok") return "text-red-600";
    return "text-green-600";
  };

  const getStatusText = () => {
    if (isLoading) return "Connecting...";
    if (error) return `Error: ${error}`;
    if (healthStatus?.status === "ok")
      return `Connected (DB: ${healthStatus.database})`;
    return "Disconnected";
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Web Crawler Dashboard</h1>
        <p className="text-lg text-muted-foreground mb-6">
          A full-stack web application that crawls websites and analyzes their
          structure.
        </p>

        {/* API Connection Status */}
        <div className="mb-6 p-4 border rounded-lg">
          <h3 className="text-lg font-semibold mb-2">API Connection Status</h3>
          <p className={`${getStatusColor()} font-medium`}>{getStatusText()}</p>
          {healthStatus && (
            <p className="text-sm text-muted-foreground mt-1">
              Last checked:{" "}
              {new Date(healthStatus.time * 1000).toLocaleTimeString()}
            </p>
          )}
        </div>

        <div className="space-x-4">
          <Button>Get Started</Button>
          <Button variant="outline" onClick={checkHealth} disabled={isLoading}>
            {isLoading ? "Checking..." : "Check Connection"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default App;
