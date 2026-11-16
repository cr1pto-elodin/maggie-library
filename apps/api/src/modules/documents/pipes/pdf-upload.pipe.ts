import {
  BadRequestException,
  FileTypeValidator,
  Injectable,
  ParseFilePipe,
} from '@nestjs/common';

@Injectable()
export class PdfUploadPipe extends ParseFilePipe {
  constructor() {
    super({
      validators: [
        new FileTypeValidator({
          fileType: 'application/pdf',
          errorMessage: 'O arquivo precisa ser um PDF.',
        }),
      ],
      exceptionFactory: (message) =>
        new BadRequestException(
          message === 'File is required'
            ? 'Envie um arquivo PDF no campo "file".'
            : message,
        ),
    });
  }
}
