import { apiClient, type ApiResponse, type PaginatedResponse } from './client'

export type Design = { id: string; name: string; description: string | null; price: number; isActive: boolean }
export type DesignListParams = { page?: number; pageSize?: number; search?: string; isActive?: boolean }
export type DesignRequest = Pick<Design, 'name' | 'price'> & { description?: string | null }

export const designsApi = {
  list: (query?: DesignListParams) => apiClient.get<PaginatedResponse<Design>>('designs', { query }),
  get: (id: string) => apiClient.get<ApiResponse<Design>>(`designs/${encodeURIComponent(id)}`),
  create: (body: DesignRequest) => apiClient.post<ApiResponse<Design>>('designs', body),
  update: (id: string, body: Partial<DesignRequest>) => apiClient.patch<ApiResponse<Design>>(`designs/${encodeURIComponent(id)}`, body),
  setActive: (id: string, isActive: boolean) => apiClient.patch<ApiResponse<Pick<Design, 'id' | 'isActive'>>>(`designs/${encodeURIComponent(id)}/status`, { isActive }),
}
