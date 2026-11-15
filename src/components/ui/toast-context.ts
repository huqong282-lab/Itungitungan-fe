import { createContext } from 'react'

export interface ToastMessage { id: number; type: 'success' | 'error' | 'warning' | 'info'; message: string }
export interface ToastApi { toast: { success: (message: string) => void; error: (message: string) => void; warning: (message: string) => void; info: (message: string) => void } }
export const ToastContext = createContext<ToastApi | null>(null)
