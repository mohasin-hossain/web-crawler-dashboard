import { apiClient, handleApiError } from "./client";

export interface HealthCheckResponse {
  status: string;
  message: string;
  database: string;
  time: number;
}

export const healthService = {
  // Check API health status
  checkHealth: async (): Promise<HealthCheckResponse> => {
    try {
      const response = await apiClient.get<HealthCheckResponse>("/api/health");
      return response.data;
    } catch (error: any) {
      throw new Error(handleApiError(error));
    }
  },
};
