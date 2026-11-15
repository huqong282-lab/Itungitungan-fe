import { useId, useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react'
import { Input } from './forms'

export interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> { value: string; onChange: (value: string) => void; onClear?: () => void }
export function SearchInput({ value, onChange, onClear, placeholder = 'Cari…', className = '', ...props }: SearchInputProps) { return <div className={`ui-search ${className}`}><Search aria-hidden="true" size={17} /><Input type="search" value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} {...props} />{value && <button type="button" className="ui-icon-button" aria-label="Hapus pencarian" onClick={() => { onChange(''); onClear?.() }}><X size={15} /></button>}</div> }

export interface PaginationProps { page: number; totalPages: number; onPageChange: (page: number) => void; siblingCount?: number; className?: string }
export function Pagination({ page, totalPages, onPageChange, siblingCount = 1, className = '' }: PaginationProps) {
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1).filter(number => number === 1 || number === totalPages || Math.abs(number - page) <= siblingCount)
  return <nav className={`ui-pagination ${className}`} aria-label="Navigasi halaman"><button type="button" aria-label="Halaman sebelumnya" disabled={page <= 1} onClick={() => onPageChange(page - 1)}><ChevronLeft size={16} /></button>{pages.map((number, index) => <span className="ui-pagination__item" key={number}>{index > 0 && pages[index - 1] !== number - 1 && <span aria-hidden="true">…</span>}<button type="button" aria-current={page === number ? 'page' : undefined} aria-label={`Halaman ${number}`} onClick={() => onPageChange(number)}>{number}</button></span>)}<button type="button" aria-label="Halaman berikutnya" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}><ChevronRight size={16} /></button></nav>
}

export interface TabItem { id: string; label: string; content: ReactNode; disabled?: boolean }
export function Tabs({ tabs, defaultValue }: { tabs: TabItem[]; defaultValue?: string }) {
  const [active, setActive] = useState(defaultValue ?? tabs[0]?.id ?? ''); const id = useId(); const current = tabs.find(tab => tab.id === active) ?? tabs[0]
  const enabled = tabs.filter(tab => !tab.disabled)
  const focusTab = (index: number) => { const next = enabled[(index + enabled.length) % enabled.length]; setActive(next.id); document.getElementById(`${id}-${next.id}`)?.focus() }
  return <div className="ui-tabs"><div className="ui-tabs__list" role="tablist" aria-label="Tab showcase" onKeyDown={event => { if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return; event.preventDefault(); const index = enabled.findIndex(tab => tab.id === active); focusTab(event.key === 'Home' ? 0 : event.key === 'End' ? enabled.length - 1 : index + (event.key === 'ArrowRight' ? 1 : -1)) }}>{tabs.map(tab => <button key={tab.id} id={`${id}-${tab.id}`} type="button" role="tab" aria-selected={active === tab.id} aria-controls={`${id}-panel`} tabIndex={active === tab.id ? 0 : -1} disabled={tab.disabled} onClick={() => setActive(tab.id)}>{tab.label}</button>)}</div><div className="ui-tabs__panel" id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-${current?.id}`}>{current?.content}</div></div>
}
