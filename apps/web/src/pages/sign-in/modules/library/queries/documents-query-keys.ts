export const documentsQueryKeys = {
  all: ['documents'] as const,
  list: () => [...documentsQueryKeys.all, 'list'] as const,
}

