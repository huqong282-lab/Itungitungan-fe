import { apiClient, type ApiResponse, type PaginatedResponse } from './client'

export type BillingPeriod = 'MONTHLY' | 'YEARLY' | 'ONE_TIME'
export type HostingPlan = { id: string; provider: string; name: string; internalCost: number; clientPrice: number; billingPeriod: BillingPeriod; isActive: boolean }
export type HostingListParams = { page?: number; pageSize?: number; search?: string; isActive?: boolean }
export type HostingPlanRequest = Omit<HostingPlan, 'id' | 'isActive'>

export const hostingApi = {
  list: (query?: HostingListParams) => apiClient.get<PaginatedResponse<HostingPlan>>('hosting-plans', { query }),
  get: (id: string) => apiClient.get<ApiResponse<HostingPlan>>(`hosting-plans/${encodeURIComponent(id)}`),
  create: (body: HostingPlanRequest) => apiClient.post<ApiResponse<HostingPlan>>('hosting-plans', body),
  update: (id: string, body: Partial<HostingPlanRequest>) => apiClient.patch<ApiResponse<HostingPlan>>(`hosting-plans/${encodeURIComponent(id)}`, body),
  setActive: (id: string, isActive: boolean) => apiClient.patch<ApiResponse<Pick<HostingPlan, 'id' | 'isActive'>>>(`hosting-plans/${encodeURIComponent(id)}/status`, { isActive }),
}
