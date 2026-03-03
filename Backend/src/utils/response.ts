// Standardized API response format
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: { code: string; message: string; details?: unknown };
}

export function success<T>(data: T, message?: string): ApiResponse<T> {
  return { success: true, data, ...(message && { message }) };
}

export function error(code: string, message: string, details?: unknown): ApiResponse<never> {
  return { success: false, error: { code, message, ...(details ? { details } : {}) } };
}
