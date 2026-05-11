export interface ErrorResponse {
  success: boolean;
  error: {
    message: string;
    code?: string;
    details?: Record<string, any>;
    timestamp?: string;
    path?: string;
    method?: string;
  };
  slack?: {
    enabled: boolean;
    notified?: boolean;
    timestamp?: string;
  };
}
