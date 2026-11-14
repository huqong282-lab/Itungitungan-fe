import { apiClient, type ApiResponse, type PaginatedResponse } from './client'
import type { BillingPeriod } from './hosting'

export type MaintenancePlan = { id: string; name: string; price: number; billingPeriod: BillingPeriod; isActive: boolean }
export type MaintenanceListParams = { page?: number; pageSize?: number; search?: string; isActive?: boolean }
export type MaintenancePlanRequest = Omit<MaintenancePlan, 'id' | 'isActive'>

export const maintenanceApi = {
  list: (query?: MaintenanceListParams) => apiClient.get<PaginatedResponse<MaintenancePlan>>('maintenance-plans', { query }),
  get: (id: string) => apiClient.get<ApiResponse<MaintenancePlan>>(`maintenance-plans/${encodeURIComponent(id)}`),
  create: (body: MaintenancePlanRequest) => apiClient.post<ApiResponse<MaintenancePlan>>('maintenance-plans', body),
  update: (id: string, body: Partial<MaintenancePlanRequest>) => apiClient.patch<ApiResponse<MaintenancePlan>>(`maintenance-plans/${encodeURIComponent(id)}`, body),
  setActive: (id: string, isActive: boolean) => apiClient.patch<ApiResponse<Pick<MaintenancePlan, 'id' | 'isActive'>>>(`maintenance-plans/${encodeURIComponent(id)}/status`, { isActive }),
}
