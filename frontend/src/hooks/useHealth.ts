import { useEffect, useState } from "react";
import {
  healthService,
  type HealthCheckResponse,
} from "../services/api/health";

interface HealthState {
  data: HealthCheckResponse | null;
  isLoading: boolean;
  error: string | null;
  lastChecked: Date | null;
}

export function useHealth(intervalMs?: number) {
  const [state, setState] = useState<HealthState>({
    data: null,
    isLoading: false,
    error: null,
    lastChecked: null,
  });

  const checkHealth = async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const data = await healthService.checkHealth();
      setState({
        data,
        isLoading: false,
        error: null,
        lastChecked: new Date(),
      });
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error.message || "Failed to check health",
        lastChecked: new Date(),
      }));
    }
  };

  useEffect(() => {
    // Initial health check
    checkHealth();

    // Set up interval if provided
    if (intervalMs && intervalMs > 0) {
      const interval = setInterval(checkHealth, intervalMs);
      return () => clearInterval(interval);
    }
  }, [intervalMs]);

  return {
    ...state,
    checkHealth,
    isHealthy:
      state.data?.status === "ok" && state.data?.database === "connected",
  };
}
