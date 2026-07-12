import { HttpStatus } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { ApiErrorDetail, ApiException } from '../exceptions/api.exception';

function flattenErrors(
  errors: ValidationError[],
  parentPath = '',
): ApiErrorDetail[] {
  const details: ApiErrorDetail[] = [];

  for (const error of errors) {
    const path = parentPath
      ? `${parentPath}.${error.property}`
      : error.property;

    if (error.constraints) {
      for (const [constraintCode, message] of Object.entries(
        error.constraints,
      )) {
        details.push({ field: path, code: constraintCode, message });
      }
    }

    if (error.children?.length) {
      details.push(...flattenErrors(error.children, path));
    }
  }

  return details;
}

export function validationExceptionFactory(
  errors: ValidationError[],
): ApiException {
  return new ApiException(
    'VALIDATION_ERROR',
    HttpStatus.BAD_REQUEST,
    'validation_error',
    flattenErrors(errors),
  );
}
