import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "./constants";

// Error types for better type safety
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: unknown;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

export interface NetworkError {
  message: string;
  isTimeout: boolean;
  isOffline: boolean;
}

// Error classification
export type ErrorType =
  | "network"
  | "timeout"
  | "validation"
  | "authentication"
  | "authorization"
  | "not_found"
  | "conflict"
  | "server"
  | "unknown";

// Enhanced error extraction with better type safety
export function extractErrorMessage(
  error: unknown,
  fallback = ERROR_MESSAGES.GENERIC.UNKNOWN
): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  if (error && typeof error === "object") {
    // Handle API error responses
    if ("response" in error && error.response) {
      const response = error.response as {
        data?: { message?: string; error?: string };
      };
      if (response.data?.message) {
        return response.data.message;
      }
      if (response.data?.error) {
        return response.data.error;
      }
    }

    // Handle direct error objects
    if ("message" in error && typeof error.message === "string") {
      return error.message;
    }

    if ("error" in error && typeof error.error === "string") {
      return error.error;
    }
  }

  return fallback;
}

// Enhanced error classification
export function classifyError(error: unknown): ErrorType {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    const name = error.name.toLowerCase();

    // Network errors
    if (name === "networkerror" || message.includes("network")) {
      return "network";
    }

    // Timeout errors
    if (name === "timeouterror" || message.includes("timeout")) {
      return "timeout";
    }

    // Validation errors
    if (name === "validationerror" || message.includes("validation")) {
      return "validation";
    }

    // Authentication errors
    if (
      message.includes("invalid email or password") ||
      message.includes("authentication failed") ||
      message.includes("unauthorized")
    ) {
      return "authentication";
    }

    // Authorization errors
    if (
      message.includes("forbidden") ||
      message.includes("insufficient permissions")
    ) {
      return "authorization";
    }

    // Not found errors
    if (message.includes("not found") || message.includes("404")) {
      return "not_found";
    }

    // Conflict errors
    if (message.includes("already exists") || message.includes("conflict")) {
      return "conflict";
    }
  }

  // Check for HTTP status codes in API errors
  if (error && typeof error === "object" && "response" in error) {
    const response = error.response as { status?: number };
    if (response?.status) {
      if (response.status === 401) return "authentication";
      if (response.status === 403) return "authorization";
      if (response.status === 404) return "not_found";
      if (response.status === 409) return "conflict";
      if (response.status >= 500) return "server";
    }
  }

  return "unknown";
}

// Get user-friendly error message based on error type
export function getUserFriendlyErrorMessage(
  error: unknown,
  context?: string
): string {
  const errorType = classifyError(error);
  const extractedMessage = extractErrorMessage(error);

  // Map specific error messages to user-friendly versions
  const messageMappings: Record<string, string> = {
    "Invalid email or password": ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS,
    "Authentication failed": ERROR_MESSAGES.AUTH.AUTHENTICATION_FAILED,
    "User already exists":
      "An account with this email already exists. Please use a different email or try logging in.",
    "Network Error": ERROR_MESSAGES.GENERIC.NETWORK,
    timeout: ERROR_MESSAGES.GENERIC.TIMEOUT,
    ECONNABORTED: ERROR_MESSAGES.GENERIC.TIMEOUT,
  };

  // Check for specific message mappings first
  for (const [key, value] of Object.entries(messageMappings)) {
    if (extractedMessage.includes(key)) {
      return value;
    }
  }

  // Fall back to type-based messages
  switch (errorType) {
    case "network":
      return ERROR_MESSAGES.GENERIC.NETWORK;
    case "timeout":
      return ERROR_MESSAGES.GENERIC.TIMEOUT;
    case "authentication":
      return ERROR_MESSAGES.AUTH.AUTHENTICATION_FAILED;
    case "authorization":
      return ERROR_MESSAGES.AUTH.INSUFFICIENT_PERMISSIONS;
    case "not_found":
      return ERROR_MESSAGES.API.NOT_FOUND;
    case "conflict":
      return ERROR_MESSAGES.API.CONFLICT;
    case "server":
      return ERROR_MESSAGES.GENERIC.SERVER;
    case "validation":
      return context ? `${context}: ${extractedMessage}` : extractedMessage;
    default:
      return extractedMessage;
  }
}

// Enhanced error logging with context
export function logError(
  error: unknown,
  context?: string,
  additionalData?: Record<string, unknown>
): void {
  const errorType = classifyError(error);
  const message = extractErrorMessage(error);

  const logData = {
    type: errorType,
    message,
    context,
    timestamp: new Date().toISOString(),
    ...additionalData,
  };

  // Use appropriate log level based on error type
  if (errorType === "server" || errorType === "network") {
    console.error("Application Error:", logData);
  } else if (errorType === "validation" || errorType === "authentication") {
    console.warn("User Error:", logData);
  } else {
    console.log("Info Error:", logData);
  }
}

// Error handler for async operations
export async function handleAsyncError<T>(
  operation: () => Promise<T>,
  context?: string,
  fallback?: T
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    logError(error, context);

    if (fallback !== undefined) {
      return fallback;
    }

    throw error;
  }
}

// Error handler for form submissions
export function handleFormError(
  error: unknown,
  setFieldError?: (field: string, message: string) => void
): string {
  const userMessage = getUserFriendlyErrorMessage(error, "Form submission");

  // If we have a setFieldError function and this is a validation error,
  // we could potentially set field-specific errors
  if (setFieldError && classifyError(error) === "validation") {
    // For now, just set a general error
    setFieldError("root", userMessage);
  }

  return userMessage;
}

// Error handler for API calls
export function handleApiError(error: unknown, operation: string): string {
  const userMessage = getUserFriendlyErrorMessage(error, operation);
  logError(error, `API ${operation}`);
  return userMessage;
}

// Success message helper
export function getSuccessMessage(
  operation: keyof typeof SUCCESS_MESSAGES,
  subOperation?: string
): string {
  const messages = SUCCESS_MESSAGES[operation];

  if (
    subOperation &&
    typeof messages === "object" &&
    subOperation in messages
  ) {
    return (messages as Record<string, string>)[subOperation];
  }

  if (typeof messages === "string") {
    return messages;
  }

  return "Operation completed successfully!";
}

// Validation error formatter
export function formatValidationErrors(
  errors: Record<string, string[]>
): ValidationError[] {
  return Object.entries(errors).map(([field, messages]) => ({
    field,
    message: messages[0] || ERROR_MESSAGES.VALIDATION.REQUIRED,
  }));
}

// Network status checker
export function isNetworkError(error: unknown): boolean {
  return classifyError(error) === "network";
}

export function isTimeoutError(error: unknown): boolean {
  return classifyError(error) === "timeout";
}

export function isAuthenticationError(error: unknown): boolean {
  return classifyError(error) === "authentication";
}

// Error recovery suggestions
export function getErrorRecoverySuggestion(error: unknown): string | null {
  const errorType = classifyError(error);

  switch (errorType) {
    case "network":
      return "Please check your internet connection and try again.";
    case "timeout":
      return "The request took too long. Please try again.";
    case "authentication":
      return "Please log in again to continue.";
    case "authorization":
      return "You don't have permission to perform this action.";
    case "server":
      return "The server is experiencing issues. Please try again later.";
    default:
      return null;
  }
}
