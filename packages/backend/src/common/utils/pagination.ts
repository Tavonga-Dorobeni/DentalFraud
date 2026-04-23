export const parsePagination = (page?: string, pageSize?: string) => {
  const normalizedPage = Number(page ?? 1);
  const normalizedPageSize = Number(pageSize ?? 25);

  return {
    page: Number.isFinite(normalizedPage) && normalizedPage > 0 ? normalizedPage : 1,
    pageSize:
      Number.isFinite(normalizedPageSize) && normalizedPageSize > 0 && normalizedPageSize <= 100
        ? normalizedPageSize
        : 25
  };
};
