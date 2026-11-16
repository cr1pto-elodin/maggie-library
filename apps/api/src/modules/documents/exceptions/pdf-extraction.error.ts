export class PdfExtractionError extends Error {
  constructor(cause?: unknown) {
    super('Não foi possível extrair o conteúdo do arquivo PDF.', { cause });
    this.name = PdfExtractionError.name;
  }
}
