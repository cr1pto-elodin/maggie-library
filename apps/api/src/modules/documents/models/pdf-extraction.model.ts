export interface PdfPageLink {
  text: string;
  url: string;
}

export interface PdfPage {
  pageNumber: number;
  pageLabel: string | null;
  text: string;
  width: number | null;
  height: number | null;
  links: PdfPageLink[];
}

export interface PdfOutlineItem {
  title: string;
  bold: boolean;
  italic: boolean;
  color: number[];
  destination: string | unknown[] | null;
  url: string | null;
  items: PdfOutlineItem[];
}

export interface PdfExtractionResult {
  text: string;
  totalPages: number;
  pages: PdfPage[];
  info: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  dates: Record<string, string | null>;
  fingerprints: Array<string | null>;
  permissions: number[] | null;
  outline: PdfOutlineItem[];
}
