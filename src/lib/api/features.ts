import { apiClient, type ApiResponse, type PaginatedResponse } from './client'

export type FeatureSummary = {
  id: string
  name: string
  description: string | null
  category: string | null
  baseEstimatedHours: number
  isActive: boolean
}
export type FeatureOptionValue = { id: string; label: string; estimatedHours: number; isDefault: boolean; isActive: boolean }
export type FeatureOption = { id: string; name: string; selectionType: 'SINGLE' | 'MULTIPLE'; values: FeatureOptionValue[] }
export type FeatureDetail = FeatureSummary & { options: FeatureOption[] }
export type FeatureListParams = { page?: number; pageSize?: number; search?: string; category?: string; isActive?: boolean }
export type FeatureCreateRequest = Pick<FeatureSummary, 'name'> & Partial<Pick<FeatureSummary, 'description' | 'category' | 'baseEstimatedHours'>>
export type FeatureOptionRequest = { name: string; selectionType: 'SINGLE' | 'MULTIPLE' }
export type FeatureOptionValueRequest = { label: string; estimatedHours?: number; isDefault?: boolean; isActive?: boolean }

export const featuresApi = {
  list: (query?: FeatureListParams) => apiClient.get<PaginatedResponse<FeatureSummary>>('features', { query }),
  get: (id: string) => apiClient.get<ApiResponse<FeatureDetail>>(`features/${encodeURIComponent(id)}`),
  create: (body: FeatureCreateRequest) => apiClient.post<void>('features', body),
  update: (id: string, body: Partial<FeatureCreateRequest>) => apiClient.patch<ApiResponse<FeatureSummary>>(`features/${encodeURIComponent(id)}`, body),
  setActive: (id: string, isActive: boolean) => apiClient.patch<ApiResponse<Pick<FeatureSummary, 'id' | 'isActive'>>>(`features/${encodeURIComponent(id)}/status`, { isActive }),
  createOption: (featureId: string, body: FeatureOptionRequest) => apiClient.post<ApiResponse<Omit<FeatureOption, 'values'>>>(`features/${encodeURIComponent(featureId)}/options`, body),
  updateOption: (featureId: string, optionId: string, body: Partial<FeatureOptionRequest>) => apiClient.patch<ApiResponse<Omit<FeatureOption, 'values'>>>(`features/${encodeURIComponent(featureId)}/options/${encodeURIComponent(optionId)}`, body),
  createOptionValue: (featureId: string, optionId: string, body: FeatureOptionValueRequest) => apiClient.post<ApiResponse<FeatureOptionValue & { featureOptionId: string }>>(`features/${encodeURIComponent(featureId)}/options/${encodeURIComponent(optionId)}/values`, body),
  updateOptionValue: (featureId: string, optionId: string, valueId: string, body: Partial<FeatureOptionValueRequest>) => apiClient.patch<ApiResponse<FeatureOptionValue & { featureOptionId: string }>>(`features/${encodeURIComponent(featureId)}/options/${encodeURIComponent(optionId)}/values/${encodeURIComponent(valueId)}`, body),
}
