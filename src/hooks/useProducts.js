import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { listProducts } from '../api/products';

export default function useProducts({ search = '', lowStock = false, page = 1, limit = 20 } = {}) {
  return useQuery({
    queryKey: ['products', 'list', { search, lowStock, page, limit }],
    queryFn: () => listProducts({
      search: search || undefined,
      lowStock: lowStock || undefined,
      page,
      limit,
    }),
    placeholderData: keepPreviousData,
  });
}
