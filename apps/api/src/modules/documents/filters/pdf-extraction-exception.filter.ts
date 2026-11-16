import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  type ExceptionFilter,
} from '@nestjs/common';
import type { Response } from 'express';
import { PdfExtractionError } from '../exceptions/pdf-extraction.error.js';

@Catch(PdfExtractionError)
export class PdfExtractionExceptionFilter implements ExceptionFilter {
  catch(exception: PdfExtractionError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const httpException = new BadRequestException(exception.message);

    response
      .status(httpException.getStatus())
      .json(httpException.getResponse());
  }
}
