import { apiClient, type ApiResponse, type PaginatedResponse } from './client'

export type QuotationStatus = 'DRAFT' | 'FINAL'
export type QuotationSummary = {
  id: string
  quotationNumber: string
  projectId: string
  version: number
  status: QuotationStatus
  clientName: string
  projectName: string
  finalPrice: number
  createdAt: string
}
export type QuotationListParams = {
  page?: number
  pageSize?: number
  search?: string
  status?: QuotationStatus
  projectId?: string
  sort?: 'createdAt' | 'quotationNumber' | 'finalPrice' | 'version'
  order?: 'asc' | 'desc'
}
export type QuotationDraft = {
  id: string; quotationNumber: string; version: number; status: 'DRAFT'; finalPrice: number; workingDays: number; createdAt: string
}
export type QuotationDetail = {
  header: {
    id: string; quotationNumber: string; version: number; status: QuotationStatus; clientName: string; projectName: string
    logoUrl: string | null; deadline: string | null; developerRate: number; finalizedAt: string | null; createdAt: string; updatedAt: string
  }
  features: Array<{
    name: string; baseHours: number; estimatedHours: number; developerRate: number; developmentCost: number
    selections: Array<{ optionName: string; valueLabel: string; hours: number }>
  }>
  design: { name: string; price: number } | null
  hostings: Array<{ label: string; provider: string | null; plan: string | null; internalCost: number | null; clientPrice: number; clientProvided: boolean; billingPeriod: 'MONTHLY' | 'YEARLY' | 'ONE_TIME' | null }>
  maintenances: Array<{ name: string; price: number; billingPeriod: 'MONTHLY' | 'YEARLY' | 'ONE_TIME' }>
  timeline: { estimatedHours: number; bufferPercentage: number; bufferedHours: number; workingHoursPerDay: number; workingDays: number }
  pricing: { developmentCost: number; designCost: number; hostingCost: number; maintenanceCost: number; subtotal: number; marginPercentage: number; marginAmount: number; rushFeePercentage: number; rushFeeAmount: number; finalPrice: number }
  revisionPolicy: { freeRevisionCount: number; additionalRevisionPrice: number }
}

export const quotationsApi = {
  list: (query?: QuotationListParams) => apiClient.get<PaginatedResponse<QuotationSummary>>('quotations', { query }),
  createDraft: (projectId: string) => apiClient.post<ApiResponse<QuotationDraft>>(`projects/${encodeURIComponent(projectId)}/quotations`, {}),
  recalculate: (quotationId: string) => apiClient.post<ApiResponse<QuotationDraft>>(`quotations/${encodeURIComponent(quotationId)}/recalculate`),
  finalize: (quotationId: string) => apiClient.post<ApiResponse<{ id: string; quotationNumber: string; version: number; status: 'FINAL'; finalizedAt: string }>>(`quotations/${encodeURIComponent(quotationId)}/finalize`),
  get: (quotationId: string) => apiClient.get<ApiResponse<QuotationDetail>>(`quotations/${encodeURIComponent(quotationId)}`),
  downloadPdf: (quotationId: string) => apiClient.get<Blob>(`quotations/${encodeURIComponent(quotationId)}/pdf`, { headers: { Accept: 'application/pdf' } }),
}
