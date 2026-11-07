import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PdfExtractionService } from './pdf-extraction.service.js';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly pdfExtractionService: PdfExtractionService) {}

  @Post('extract')
  @UseInterceptors(FileInterceptor('file'))
  async extract(
    @UploadedFile() file?: { buffer: Buffer; mimetype: string },
  ) {
    if (!file) {
      throw new BadRequestException('Envie um arquivo PDF no campo "file".');
    }

    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('O arquivo precisa ser um PDF.');
    }

    try {
      return await this.pdfExtractionService.extract(file.buffer);
    } catch {
      throw new BadRequestException(
        'Não foi possível extrair o conteúdo do arquivo PDF.',
      );
    }
  }
}
