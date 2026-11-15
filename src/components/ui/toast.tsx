import { useCallback, useRef, useState, type ReactNode } from 'react'
import { Check, Info, TriangleAlert, X } from 'lucide-react'
import { ToastContext, type ToastMessage } from './toast-context'

export function ToastProvider({ children, duration = 4000 }: { children: ReactNode; duration?: number }) {
  const [messages, setMessages] = useState<ToastMessage[]>([]); const nextId = useRef(0)
  const add = useCallback((type: ToastMessage['type'], message: string) => { const id = ++nextId.current; setMessages(items => [...items, { id, type, message }]); window.setTimeout(() => setMessages(items => items.filter(item => item.id !== id)), duration) }, [duration])
  const dismiss = (id: number) => setMessages(items => items.filter(item => item.id !== id))
  const icons = { success: Check, error: X, warning: TriangleAlert, info: Info }
  return <ToastContext.Provider value={{ toast: { success: message => add('success', message), error: message => add('error', message), warning: message => add('warning', message), info: message => add('info', message) } }}>{children}<div className="ui-toast-region" aria-live="polite" aria-label="Notifikasi">{messages.map(item => { const Icon = icons[item.type]; return <div className={`ui-toast ui-toast--${item.type}`} key={item.id} role="status"><Icon size={17} aria-hidden="true" /><span>{item.message}</span><button type="button" aria-label="Tutup notifikasi" onClick={() => dismiss(item.id)}><X size={15} /></button></div> })}</div></ToastContext.Provider>
}
