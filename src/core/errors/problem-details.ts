import type { InvalidParamDetail } from './app-error.js';
import { resolveLocale, getErrorMessage, type SupportedLocale } from '../i18n/index.js';
import type { MessageKey } from '../i18n/th.js';

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  correlation_id?: string | undefined;
  code: string;
  invalid_params?: InvalidParamDetail[] | undefined;
}

const ERROR_TYPE_BASE = 'https://momentra.app/errors';

export interface CreateProblemDetailsOptions {
  status: number;
  code: string;
  detail?: string | undefined;
  instance: string;
  correlationId?: string | undefined;
  invalidParams?: InvalidParamDetail[] | undefined;
  acceptLanguage?: string | undefined;
}

export function createProblemDetails(options: CreateProblemDetailsOptions): ProblemDetails {
  const { status, code, detail, instance, correlationId, invalidParams, acceptLanguage } = options;
  const locale: SupportedLocale = resolveLocale(acceptLanguage);

  const fallbackDetail = getErrorMessage(
    (code in (locale === 'en' ? {} : {}) ? code : code) as MessageKey,
    locale
  );

  const resolvedDetail = detail || fallbackDetail;
  const kebabType = code.toLowerCase().replace(/_/g, '-');

  const problem: ProblemDetails = {
    type: `${ERROR_TYPE_BASE}/${kebabType}`,
    title: getTitleFromStatus(status),
    status,
    detail: resolvedDetail,
    instance,
    code,
  };

  if (correlationId) {
    problem.correlation_id = correlationId;
  }

  if (invalidParams && invalidParams.length > 0) {
    problem.invalid_params = invalidParams;
  }

  return problem;
}

function getTitleFromStatus(status: number): string {
  switch (status) {
    case 400: return 'Bad Request';
    case 401: return 'Unauthorized';
    case 403: return 'Forbidden';
    case 404: return 'Not Found';
    case 409: return 'Conflict';
    case 410: return 'Gone';
    case 429: return 'Too Many Requests';
    case 500: return 'Internal Server Error';
    default: return 'Error';
  }
}
