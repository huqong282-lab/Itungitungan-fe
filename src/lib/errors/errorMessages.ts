import { ApiError } from '../api/client'

export type ErrorKind = 'inline' | 'access-session' | 'access-denied' | 'not-found' | 'conflict' | 'server' | 'network' | 'unknown'

export type ErrorPresentation = {
  kind: ErrorKind
  title: string
  description: string
  status?: number
  code?: string
  originalError: unknown
}

type FriendlyError = Pick<ErrorPresentation, 'kind' | 'title' | 'description'>

const statusMessages: Record<number, FriendlyError> = {
  400: { kind: 'inline', title: 'Permintaan tidak valid', description: 'Periksa kembali data yang dimasukkan, lalu coba lagi.' },
  401: { kind: 'access-session', title: 'Sesi Anda telah berakhir', description: 'Masuk kembali untuk melanjutkan pekerjaan Anda.' },
  403: { kind: 'access-denied', title: 'Akses ditolak', description: 'Anda tidak memiliki izin untuk melakukan tindakan ini.' },
  404: { kind: 'not-found', title: 'Data tidak ditemukan', description: 'Data yang diminta tidak ditemukan atau sudah tidak tersedia.' },
  409: { kind: 'conflict', title: 'Terjadi konflik data', description: 'Muat ulang data, lalu coba kembali.' },
  422: { kind: 'inline', title: 'Data tidak dapat diproses', description: 'Periksa kembali isian Anda.' },
  500: { kind: 'server', title: 'Terjadi kesalahan di server', description: 'Ini bukan kesalahan Anda. Silakan coba lagi beberapa saat.' },
}

const backendCodeMessages: Record<string, FriendlyError> = {
  UNAUTHORIZED: { kind: 'access-session', title: 'Sesi Anda telah berakhir', description: 'Masuk kembali untuk melanjutkan pekerjaan Anda.' },
  INVALID_CREDENTIALS: { kind: 'inline', title: 'Email atau kata sandi salah', description: 'Periksa kembali email dan kata sandi Anda.' },
  EMAIL_ALREADY_EXISTS: { kind: 'conflict', title: 'Email sudah terdaftar', description: 'Gunakan email lain atau masuk dengan akun Anda.' },
  REQUEST_ERROR: { kind: 'inline', title: 'Permintaan tidak valid', description: 'Periksa kembali data yang dimasukkan, lalu coba lagi.' },
  VALIDATION_ERROR: { kind: 'inline', title: 'Periksa kembali isian Anda', description: 'Ada data yang belum sesuai. Perbaiki isian yang ditandai.' },
  BUSINESS_RULE_VIOLATION: { kind: 'inline', title: 'Data belum dapat diproses', description: 'Periksa kelengkapan data proyek, lalu coba lagi.' },
  CONFLICT: { kind: 'conflict', title: 'Data sudah digunakan', description: 'Muat ulang data, lalu coba kembali.' },
  FEATURE_NOT_FOUND: { kind: 'not-found', title: 'Fitur tidak ditemukan', description: 'Fitur ini mungkin sudah dihapus atau tidak tersedia.' },
  DESIGN_NOT_FOUND: { kind: 'not-found', title: 'Desain tidak ditemukan', description: 'Desain ini mungkin sudah dihapus atau tidak tersedia.' },
  HOSTING_PLAN_NOT_FOUND: { kind: 'not-found', title: 'Paket hosting tidak ditemukan', description: 'Paket ini mungkin sudah dihapus atau tidak tersedia.' },
  MAINTENANCE_PLAN_NOT_FOUND: { kind: 'not-found', title: 'Paket maintenance tidak ditemukan', description: 'Paket ini mungkin sudah dihapus atau tidak tersedia.' },
  PROJECT_NOT_FOUND: { kind: 'not-found', title: 'Proyek tidak ditemukan', description: 'Proyek ini mungkin sudah dihapus atau tidak tersedia.' },
  PROJECT_HOSTING_NOT_FOUND: { kind: 'not-found', title: 'Hosting proyek tidak ditemukan', description: 'Data hosting ini mungkin sudah dihapus.' },
  PROJECT_MAINTENANCE_NOT_FOUND: { kind: 'not-found', title: 'Maintenance proyek tidak ditemukan', description: 'Data maintenance ini mungkin sudah dihapus.' },
  QUOTATION_NOT_FOUND: { kind: 'not-found', title: 'Penawaran tidak ditemukan', description: 'Penawaran ini mungkin sudah dihapus atau tidak tersedia.' },
  SETTINGS_NOT_FOUND: { kind: 'not-found', title: 'Pengaturan tidak ditemukan', description: 'Lengkapi pengaturan developer sebelum melanjutkan.' },
  NOT_FOUND: { kind: 'not-found', title: 'Data tidak ditemukan', description: 'Data yang diminta tidak ditemukan atau sudah tidak tersedia.' },
  DRAFT_QUOTATION_EXISTS: { kind: 'conflict', title: 'Draft penawaran sudah tersedia', description: 'Buka draft yang ada untuk melanjutkan.' },
  QUOTATION_FINALIZED: { kind: 'conflict', title: 'Penawaran sudah difinalisasi', description: 'Penawaran final tidak dapat diubah.' },
  QUOTATION_INVALID: { kind: 'inline', title: 'Penawaran belum dapat dibuat', description: 'Periksa data proyek dan pengaturan harga, lalu coba lagi.' },
  CALCULATION_INVALID: { kind: 'inline', title: 'Proyek belum dapat dihitung', description: 'Periksa kembali data proyek sebelum menghitung.' },
  INTERNAL_SERVER_ERROR: { kind: 'server', title: 'Terjadi kesalahan di server', description: 'Ini bukan kesalahan Anda. Silakan coba lagi beberapa saat.' },
}

type ErrorLike = {
  status?: unknown
  code?: unknown
  payload?: unknown
  message?: unknown
  name?: unknown
}

function getErrorDetails(error: unknown): { status?: number; code?: string; message?: string; name?: string } {
  if (error instanceof ApiError) {
    const payload = error.payload as { error?: { code?: unknown; message?: unknown } } | null
    const nestedCode = payload?.error?.code
    const nestedMessage = payload?.error?.message
    return {
      status: error.status,
      code: error.code ?? (typeof nestedCode === 'string' ? nestedCode : undefined),
      message: typeof nestedMessage === 'string' ? nestedMessage : error.message,
      name: error.name,
    }
  }

  if (error && typeof error === 'object') {
    const candidate = error as ErrorLike
    const payload = candidate.payload as { error?: { code?: unknown; message?: unknown } } | null | undefined
    const status = typeof candidate.status === 'number' ? candidate.status : undefined
    const code = typeof candidate.code === 'string'
      ? candidate.code
      : typeof payload?.error?.code === 'string' ? payload.error.code : undefined
    return {
      status,
      code,
      message: typeof payload?.error?.message === 'string'
        ? payload.error.message
        : typeof candidate.message === 'string' ? candidate.message : undefined,
      name: typeof candidate.name === 'string' ? candidate.name : undefined,
    }
  }

  return {}
}

function isNetworkError(details: ReturnType<typeof getErrorDetails>) {
  if (details.status !== undefined) return false
  const message = details.message?.toLowerCase() ?? ''
  return details.name === 'TypeError'
    || /failed to fetch|networkerror|network request failed|load failed/.test(message)
}

export function mapApplicationError(error: unknown): ErrorPresentation {
  const details = getErrorDetails(error)
  const friendlyByCode = details.code ? backendCodeMessages[details.code] : undefined
  const fallback = details.status === undefined
    ? { kind: 'unknown' as const, title: 'Terjadi kesalahan', description: 'Terjadi sesuatu yang tidak terduga. Silakan coba lagi.' }
    : statusMessages[details.status]
      ?? (details.status >= 500
        ? { kind: 'server' as const, title: 'Terjadi kesalahan di server', description: 'Ini bukan kesalahan Anda. Silakan coba lagi beberapa saat.' }
        : { kind: 'unknown' as const, title: 'Permintaan belum dapat diproses', description: 'Silakan coba lagi. Jika masalah berlanjut, hubungi tim kami.' })
  const friendly = isNetworkError(details)
    ? { kind: 'network' as const, title: 'Tidak dapat terhubung ke server', description: 'Periksa koneksi internet Anda, lalu coba kembali.' }
    : friendlyByCode ?? fallback

  return {
    ...friendly,
    ...(details.status !== undefined ? { status: details.status } : {}),
    ...(details.code ? { code: details.code } : {}),
    originalError: error,
  }
}
