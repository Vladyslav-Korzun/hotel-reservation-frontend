import { HttpErrorResponse } from '@angular/common/http';
import { ProblemDetail } from './problem-detail.model';

export function toProblemDetail(error: unknown): ProblemDetail {
  if (error instanceof HttpErrorResponse && isProblemDetail(error.error)) {
    return error.error;
  }

  if (error instanceof HttpErrorResponse) {
    return {
      title: 'Request failed',
      status: error.status,
      detail: error.message,
    };
  }

  return {
    title: 'Unexpected error',
    detail: 'The request could not be completed.',
  };
}

function isProblemDetail(value: unknown): value is ProblemDetail {
  return typeof value === 'object' && value !== null && ('title' in value || 'detail' in value || 'status' in value);
}
