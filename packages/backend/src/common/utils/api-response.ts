export const successResponse = <T>(data: T) => ({
  success: true as const,
  data
});

export const paginatedResponse = <T>(
  items: T[],
  page: number,
  pageSize: number,
  total: number
) => ({
  success: true as const,
  data: {
    items,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize) || 1
    }
  }
});
