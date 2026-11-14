import { apiClient, type ApiResponse, type PaginatedResponse } from './client'

export type ProjectStatus = 'DRAFT' | 'QUOTED' | 'ACCEPTED' | 'REJECTED'
export type Project = {
  id: string
  clientName: string
  projectName: string
  logoUrl: string | null
  deadline: string | null
  status: ProjectStatus
  createdAt: string
  updatedAt: string
}
export type ProjectListParams = { page?: number; pageSize?: number }
export type ProjectRequest = {
  clientName: string
  projectName: string
  logoUrl?: string | null
  deadline?: string | null
}
export type ProjectFeature = {
  id: string; projectId: string; featureId: string; overrideHours: number | null; notes: string | null; createdAt: string; updatedAt: string
}
export type ProjectSelection = {
  id: string; projectFeatureId: string; featureOptionId: string; featureOptionValueId: string; createdAt: string; updatedAt: string
}
export type ProjectHosting = {
  id: string; projectId: string; hostingPlanId: string | null; label: string; clientProvided: boolean; createdAt: string; updatedAt: string
}
export type ProjectMaintenance = {
  id: string; projectId: string; maintenancePlanId: string; createdAt: string; updatedAt: string
}
export type ProjectCalculation = {
  estimatedHours: number
  bufferPercentage: number
  bufferedHours: number
  workingHoursPerDay: number
  workingDays: number
  deadline: string | null
  deadlineStatus: 'NORMAL' | 'RUSH'
  developmentCost: number
  designCost: number
  hostingCost: number
  maintenanceCost: number
  subtotal: number
  marginPercentage: number
  marginAmount: number
  rushFeePercentage: number
  rushFeeAmount: number
  finalPrice: number
  revisionPolicy: { freeRevisionCount: number; additionalRevisionPrice: number }
}

export const projectsApi = {
  list: (query?: ProjectListParams) => apiClient.get<PaginatedResponse<Project>>('projects', { query }),
  get: (id: string) => apiClient.get<ApiResponse<Project>>(`projects/${encodeURIComponent(id)}`),
  create: (body: ProjectRequest) => apiClient.post<ApiResponse<Project>>('projects', body),
  update: (id: string, body: Partial<ProjectRequest>) => apiClient.patch<ApiResponse<Project>>(`projects/${encodeURIComponent(id)}`, body),
  calculate: (projectId: string, marginPercentage?: number) => apiClient.post<ApiResponse<ProjectCalculation>>(`projects/${encodeURIComponent(projectId)}/calculate`, marginPercentage === undefined ? undefined : { marginPercentage }),
  addFeature: (projectId: string, featureId: string) => apiClient.post<ApiResponse<ProjectFeature>>(`projects/${encodeURIComponent(projectId)}/features`, { featureId }),
  updateFeature: (projectId: string, projectFeatureId: string, body: { overrideHours?: number | null; notes?: string | null }) => apiClient.patch<ApiResponse<ProjectFeature>>(`projects/${encodeURIComponent(projectId)}/features/${encodeURIComponent(projectFeatureId)}`, body),
  removeFeature: (projectId: string, projectFeatureId: string) => apiClient.delete<void>(`projects/${encodeURIComponent(projectId)}/features/${encodeURIComponent(projectFeatureId)}`),
  replaceFeatureSelections: (projectId: string, projectFeatureId: string, selections: Array<{ featureOptionId: string; featureOptionValueId: string }>) => apiClient.put<ApiResponse<ProjectSelection[]>>(`projects/${encodeURIComponent(projectId)}/features/${encodeURIComponent(projectFeatureId)}/selections`, { selections }),
  setDesign: (projectId: string, designId: string) => apiClient.put<ApiResponse<{ id: string; projectId: string; designId: string; createdAt: string; updatedAt: string }>>(`projects/${encodeURIComponent(projectId)}/design`, { designId }),
  removeDesign: (projectId: string) => apiClient.delete<void>(`projects/${encodeURIComponent(projectId)}/design`),
  addHosting: (projectId: string, body: { label: string; hostingPlanId: string | null; clientProvided: boolean }) => apiClient.post<ApiResponse<ProjectHosting>>(`projects/${encodeURIComponent(projectId)}/hostings`, body),
  updateHosting: (projectId: string, hostingId: string, body: { label?: string; hostingPlanId?: string | null; clientProvided?: boolean }) => apiClient.patch<ApiResponse<ProjectHosting>>(`projects/${encodeURIComponent(projectId)}/hostings/${encodeURIComponent(hostingId)}`, body),
  removeHosting: (projectId: string, hostingId: string) => apiClient.delete<void>(`projects/${encodeURIComponent(projectId)}/hostings/${encodeURIComponent(hostingId)}`),
  addMaintenance: (projectId: string, maintenancePlanId: string) => apiClient.post<ApiResponse<ProjectMaintenance>>(`projects/${encodeURIComponent(projectId)}/maintenances`, { maintenancePlanId }),
  removeMaintenance: (projectId: string, maintenanceId: string) => apiClient.delete<void>(`projects/${encodeURIComponent(projectId)}/maintenances/${encodeURIComponent(maintenanceId)}`),
}
