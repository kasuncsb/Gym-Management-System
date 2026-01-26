// Standardized API response formatter

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: {
        code: string;
        message: string;
        details?: any;
    };
    meta?: {
        page?: number;
        limit?: number;
        total?: number;
        totalPages?: number;
    };
}

export function successResponse<T>(data: T, message?: string, meta?: any): ApiResponse<T> {
    return {
        success: true,
        data,
        message,
        meta
    };
}

export function errorResponse(code: string, message: string, details?: any): ApiResponse {
    return {
        success: false,
        error: {
            code,
            message,
            details
        }
    };
}

export function paginatedResponse<T>(
    data: T[],
    page: number,
    limit: number,
    total: number
): ApiResponse<T[]> {
    return {
        success: true,
        data,
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
}
