export type LibraryStatus = 'loading' | 'success' | 'error'

export interface LibraryDocument {
  id: string
  name: string
  size: string
  date: string
  pageCount: number
  chunkCount: number
  embeddingModel: string
}

