import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UploadedFile,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { IndexDocumentResponseDto } from '../dtos/index-document-response.dto.js';
import type { ReindexDocumentResponseDto } from '../dtos/reindex-document-response.dto.js';
import type { SemanticSearchRequestDto } from '../dtos/semantic-search-request.dto.js';
import type { SemanticSearchResponseDto } from '../dtos/semantic-search-response.dto.js';
import { PdfExtractionExceptionFilter } from '../filters/pdf-extraction-exception.filter.js';
import type { PdfUpload } from '../models/pdf-upload.model.js';
import { PdfUploadPipe } from '../pipes/pdf-upload.pipe.js';
import { DocumentIndexingService } from '../services/document-indexing/document-indexing.service.js';
import { DocumentsQueryService } from '../services/documents-query/documents-query.service.js';
import { PdfExtractionService } from '../services/pdf-extraction/pdf-extraction.service.js';
import { SemanticSearchService } from '../services/semantic-search/semantic-search.service.js';

@Controller('documents')
@UseFilters(PdfExtractionExceptionFilter)
export class DocumentsController {
  constructor(
    private readonly documentIndexingService: DocumentIndexingService,
    private readonly documentsQueryService: DocumentsQueryService,
    private readonly pdfExtractionService: PdfExtractionService,
    private readonly semanticSearchService: SemanticSearchService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  list(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.documentsQueryService.list(page, limit);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  findById(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.documentsQueryService.findById(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.documentsQueryService.delete(id);
  }

  @Post('search')
  @HttpCode(HttpStatus.OK)
  search(
    @Body() input: SemanticSearchRequestDto,
  ): Promise<SemanticSearchResponseDto> {
    return this.semanticSearchService.search(input);
  }

  @Post('index')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  index(
    @UploadedFile(PdfUploadPipe) file: PdfUpload,
  ): Promise<IndexDocumentResponseDto> {
    return this.documentIndexingService.index(file);
  }

  @Post(':id/reindex')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  reindex(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @UploadedFile(PdfUploadPipe) file: PdfUpload,
  ): Promise<ReindexDocumentResponseDto> {
    return this.documentIndexingService.reindex(id, file);
  }

  @Post('extract')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  extract(@UploadedFile(PdfUploadPipe) file: PdfUpload) {
    return this.pdfExtractionService.extract(file.buffer);
  }
}
