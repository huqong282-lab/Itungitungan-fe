import { apiClient, type ApiResponse } from './client'

export type Settings = {
  developerRate: number
  workingHoursPerDay: number
  buffer: number
  margin: number
  rush: number
  freeRevisionCount: number
  additionalRevisionPrice: number
}

export type UpdateSettingsRequest = Partial<Settings>

export const settingsApi = {
  get: () => apiClient.get<ApiResponse<Settings>>('settings'),
  update: (body: UpdateSettingsRequest) => apiClient.patch<ApiResponse<Settings>>('settings', body),
}
