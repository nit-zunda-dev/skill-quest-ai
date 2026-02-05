import type { Context } from 'hono';
import type { Bindings } from '../types';
import { HTTPException } from 'hono/http-exception';

/**
 * エラーハンドリングミドルウェア
 * 統一的なエラーレスポンスを返す
 */
export function errorHandler(
  err: Error,
  c: Context<{ Bindings: Bindings }>
) {
  // HTTPExceptionの場合は、そのまま返す
  if (err instanceof HTTPException) {
    return c.json(
      {
        error: {
          code: getErrorCode(err.status),
          message: err.message || getDefaultErrorMessage(err.status),
          timestamp: new Date().toISOString(),
        },
      },
      err.status
    );
  }

  // 予期しないエラーの場合は、500を返す
  console.error('Unhandled error:', err);

  return c.json(
    {
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
        timestamp: new Date().toISOString(),
      },
    },
    500
  );
}

/**
 * ステータスコードからエラーコードを取得
 */
function getErrorCode(status: number): string {
  const errorCodes: Record<number, string> = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    422: 'UNPROCESSABLE_ENTITY',
    429: 'TOO_MANY_REQUESTS',
    500: 'INTERNAL_SERVER_ERROR',
    503: 'SERVICE_UNAVAILABLE',
  };

  return errorCodes[status] || 'UNKNOWN_ERROR';
}

/**
 * ステータスコードからデフォルトエラーメッセージを取得
 */
function getDefaultErrorMessage(status: number): string {
  const messages: Record<number, string> = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    422: 'Unprocessable Entity',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    503: 'Service Unavailable',
  };

  return messages[status] || 'Unknown Error';
}
