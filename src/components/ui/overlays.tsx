import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { ChevronDown, X } from 'lucide-react'
import { Button } from './forms'

export interface ModalProps { open: boolean; onClose: () => void; title: string; description?: string; children?: ReactNode; footer?: ReactNode; className?: string }
export function Modal({ open, onClose, title, description, children, footer, className = '' }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null); const titleId = useId(); const descriptionId = useId()
  useEffect(() => { const dialog = dialogRef.current; if (!dialog) return; if (open && !dialog.open) { if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open', '') } if (!open && dialog.open) { if (typeof dialog.close === 'function') dialog.close(); else dialog.removeAttribute('open') } }, [open])
  return <dialog ref={dialogRef} className={`ui-modal ${className}`} aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined} onClose={onClose} onCancel={event => { event.preventDefault(); onClose() }} onClick={event => { if (event.target === event.currentTarget) onClose() }}><header className="ui-modal__header"><div><h2 id={titleId}>{title}</h2>{description && <p id={descriptionId}>{description}</p>}</div><button type="button" className="ui-icon-button" aria-label="Tutup dialog" onClick={onClose}><X size={18} /></button></header><div className="ui-modal__content">{children}</div>{footer && <footer className="ui-modal__footer">{footer}</footer>}</dialog>
}

export interface DrawerProps extends ModalProps { side?: 'left' | 'right' }
export function Drawer({ side = 'right', ...props }: DrawerProps) { return <Modal {...props} className={`ui-drawer ui-drawer--${side} ${props.className ?? ''}`} /> }

export interface DropdownItem { label: string; onSelect?: () => void; disabled?: boolean; destructive?: boolean; separator?: boolean }
export function Dropdown({ label = 'Aksi', items }: { label?: string; items: DropdownItem[] }) {
  const [open, setOpen] = useState(false); const root = useRef<HTMLDivElement>(null); const trigger = useRef<HTMLButtonElement>(null)
  useEffect(() => { const handle = (event: MouseEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false) }; document.addEventListener('mousedown', handle); return () => document.removeEventListener('mousedown', handle) }, [])
  const selectable = items.filter(item => !item.separator && !item.disabled)
  const move = (current: HTMLButtonElement, direction: number) => { const buttons = [...(root.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)') ?? [])]; const index = buttons.indexOf(current); buttons[(index + direction + buttons.length) % buttons.length]?.focus() }
  return <div className="ui-dropdown" ref={root} onKeyDown={event => { if (event.key === 'Escape') { setOpen(false); trigger.current?.focus() } if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); const target = event.target as HTMLButtonElement; if (target === trigger.current) root.current?.querySelector<HTMLButtonElement>('[role="menuitem"]:not(:disabled)')?.focus(); else move(target, event.key === 'ArrowDown' ? 1 : -1) } }}><Button ref={trigger} variant="outline" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)}>{label}<ChevronDown size={14} /></Button>{open && <div className="ui-dropdown__menu" role="menu">{items.map((item, index) => <div key={`${item.label}-${index}`}>{item.separator && <div className="ui-dropdown__separator" role="separator" />}<button type="button" role="menuitem" disabled={item.disabled} className={item.destructive ? 'ui-dropdown__destructive' : ''} onClick={() => { item.onSelect?.(); setOpen(false); trigger.current?.focus() }} onKeyDown={event => { if (event.key === 'Home') { event.preventDefault(); root.current?.querySelector<HTMLButtonElement>('[role="menuitem"]:not(:disabled)')?.focus() } if (event.key === 'End') { event.preventDefault(); root.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)').item(selectable.length - 1)?.focus() } }}>{item.label}</button></div>)}</div>}</div>
}
