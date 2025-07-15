// UI Constants
export const UI = {
  // Colors
  COLORS: {
    // Primary colors
    PRIMARY: {
      BLUE: "#3B82F6",
      BLUE_HOVER: "#2563EB",
      BLUE_LIGHT: "#DBEAFE",
      BLUE_DARK: "#1E40AF",
    },
    // Success colors
    SUCCESS: {
      GREEN: "#10B981",
      GREEN_HOVER: "#059669",
      GREEN_LIGHT: "#D1FAE5",
      GREEN_DARK: "#047857",
    },
    // Warning colors
    WARNING: {
      YELLOW: "#F59E0B",
      YELLOW_HOVER: "#D97706",
      YELLOW_LIGHT: "#FEF3C7",
      YELLOW_DARK: "#B45309",
    },
    // Error colors
    ERROR: {
      RED: "#EF4444",
      RED_HOVER: "#DC2626",
      RED_LIGHT: "#FEE2E2",
      RED_DARK: "#B91C1C",
    },
    // Neutral colors
    NEUTRAL: {
      GRAY: "#6B7280",
      GRAY_LIGHT: "#F3F4F6",
      GRAY_DARK: "#374151",
      GRAY_BORDER: "#E5E7EB",
    },
    // Chart colors
    CHART: {
      INTERNAL: "#3B82F6",
      EXTERNAL: "#10B981",
      AXIS: "#6B7280",
    },
  },

  // Spacing and sizing
  SPACING: {
    XS: "0.25rem", // 4px
    SM: "0.5rem", // 8px
    MD: "1rem", // 16px
    LG: "1.5rem", // 24px
    XL: "2rem", // 32px
    XXL: "3rem", // 48px
  },

  // Border radius
  BORDER_RADIUS: {
    SM: "0.25rem", // 4px
    MD: "0.5rem", // 8px
    LG: "0.75rem", // 12px
    XL: "1rem", // 16px
    XXL: "1.5rem", // 24px
  },

  // Shadows
  SHADOWS: {
    SM: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    MD: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    LG: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
    XL: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
  },

  // Z-index layers
  Z_INDEX: {
    DROPDOWN: 1000,
    STICKY: 1020,
    FIXED: 1030,
    MODAL_BACKDROP: 1040,
    MODAL: 1050,
    POPOVER: 1060,
    TOOLTIP: 1070,
  },
} as const;

// Animation and timing constants
export const ANIMATION = {
  // Durations (in milliseconds)
  DURATION: {
    FAST: 150,
    NORMAL: 200,
    SLOW: 300,
    VERY_SLOW: 500,
  },

  // Delays (in milliseconds)
  DELAY: {
    NONE: 0,
    SHORT: 100,
    MEDIUM: 200,
    LONG: 500,
  },

  // Easing functions
  EASING: {
    LINEAR: "linear",
    EASE_IN: "ease-in",
    EASE_OUT: "ease-out",
    EASE_IN_OUT: "ease-in-out",
  },
} as const;

// Toast and notification constants
export const NOTIFICATIONS = {
  // Toast durations (in milliseconds)
  TOAST_DURATION: {
    SHORT: 2000,
    NORMAL: 3000,
    LONG: 5000,
    PERSISTENT: 0, // No auto-dismiss
  },

  // Navigation delays (in milliseconds)
  NAVIGATION_DELAY: {
    SUCCESS: 1500,
    ERROR: 0,
  },
} as const;

// API and polling constants
export const API = {
  // Polling intervals (in milliseconds)
  POLLING: {
    FAST: 1000, // 1 second
    NORMAL: 2000, // 2 seconds
    SLOW: 5000, // 5 seconds
    VERY_SLOW: 10000, // 10 seconds
  },

  // Request timeouts (in milliseconds)
  TIMEOUT: {
    SHORT: 5000, // 5 seconds
    NORMAL: 10000, // 10 seconds
    LONG: 30000, // 30 seconds
  },

  // Retry configuration
  RETRY: {
    MAX_ATTEMPTS: 3,
    DELAY: 1000,
    BACKOFF_MULTIPLIER: 2,
  },
} as const;

// UI thresholds and limits
export const THRESHOLDS = {
  // URL truncation
  URL_TRUNCATION: {
    SHORT: 30,
    MEDIUM: 50,
    LONG: 80,
  },

  // Pagination
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 10,
    MAX_PAGE_SIZE: 100,
    PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
  },

  // Status codes
  HTTP_STATUS: {
    CLIENT_ERROR_MIN: 400,
    CLIENT_ERROR_MAX: 499,
    SERVER_ERROR_MIN: 500,
    SERVER_ERROR_MAX: 599,
  },

  // Performance
  PERFORMANCE: {
    DEBOUNCE_DELAY: 300,
    THROTTLE_DELAY: 100,
  },
} as const;

// Chart and visualization constants
export const CHARTS = {
  // Default chart dimensions
  DIMENSIONS: {
    HEIGHT: 300,
    WIDTH: 600,
    MARGIN: {
      TOP: 20,
      RIGHT: 30,
      BOTTOM: 30,
      LEFT: 40,
    },
  },

  // Animation settings
  ANIMATION: {
    DURATION: 750,
    DELAY: 100,
  },

  // Color schemes
  COLOR_SCHEMES: {
    CATEGORICAL: [
      "#3B82F6", // Blue
      "#10B981", // Green
      "#F59E0B", // Yellow
      "#EF4444", // Red
      "#8B5CF6", // Purple
      "#06B6D4", // Cyan
      "#F97316", // Orange
      "#84CC16", // Lime
    ],
  },
} as const;

// Form validation constants
export const VALIDATION = {
  // Input limits
  LIMITS: {
    EMAIL_MAX_LENGTH: 254,
    PASSWORD_MIN_LENGTH: 8,
    PASSWORD_MAX_LENGTH: 128,
    URL_MAX_LENGTH: 2048,
    NAME_MAX_LENGTH: 100,
  },

  // Regex patterns
  PATTERNS: {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    URL: /^https?:\/\/.+/,
  },
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: "auth_token",
  AUTH_USER: "auth_user",
  THEME: "theme",
  LANGUAGE: "language",
  SIDEBAR_COLLAPSED: "sidebar_collapsed",
  TABLE_PREFERENCES: "table_preferences",
} as const;

// Route paths
export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  DASHBOARD: "/dashboard",
  URLS: "/urls",
  URL_DETAIL: "/urls/:id",
  SETTINGS: "/settings",
  PROFILE: "/profile",
} as const;

// Error messages
export const ERROR_MESSAGES = {
  // Generic errors
  GENERIC: {
    UNKNOWN: "An unexpected error occurred",
    NETWORK: "Network error - please check your connection and try again",
    TIMEOUT: "Request timeout - please try again",
    SERVER: "Server error - please try again later",
  },

  // Authentication errors
  AUTH: {
    INVALID_CREDENTIALS:
      "Invalid email or password. Please check your credentials and try again.",
    AUTHENTICATION_FAILED:
      "Authentication failed. Please check your credentials.",
    SESSION_EXPIRED: "Your session has expired. Please log in again.",
    INSUFFICIENT_PERMISSIONS:
      "You don't have permission to perform this action.",
  },

  // Form validation errors
  VALIDATION: {
    REQUIRED: "This field is required",
    INVALID_EMAIL: "Please enter a valid email address",
    INVALID_URL: "Please enter a valid URL",
    PASSWORD_TOO_SHORT: "Password must be at least 8 characters long",
    PASSWORDS_DONT_MATCH: "Passwords don't match",
  },

  // API errors
  API: {
    NOT_FOUND: "Resource not found",
    CONFLICT: "Resource already exists",
    TOO_MANY_REQUESTS: "Too many requests - please try again later",
    BAD_REQUEST: "Bad request - please check your input",
  },
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  AUTH: {
    LOGIN: "Login successful!",
    REGISTER: "Account created successfully!",
    LOGOUT: "Logged out successfully",
  },

  URL: {
    CREATED: "URL added successfully!",
    UPDATED: "URL updated successfully!",
    DELETED: "URL deleted successfully!",
    ANALYSIS_STARTED: "Analysis started!",
    ANALYSIS_STOPPED: "Analysis stopped!",
    ANALYSIS_COMPLETED: "Analysis completed!",
  },

  BULK: {
    DELETE: "Selected URLs deleted successfully!",
    RERUN: "Analysis rerun for selected URLs!",
  },
} as const;
