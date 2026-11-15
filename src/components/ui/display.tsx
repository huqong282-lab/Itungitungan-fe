import type { HTMLAttributes, ReactNode } from 'react'
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from 'lucide-react'
import { Button } from './forms'

export interface CardProps extends HTMLAttributes<HTMLElement> { variant?: 'default' | 'outlined'; clickable?: boolean; header?: ReactNode; footer?: ReactNode; title?: string }
export function Card({ variant = 'default', clickable = false, header, footer, title, children, className = '', onKeyDown, ...props }: CardProps) { return <article className={`ui-card ui-card--${variant} ${clickable ? 'ui-card--clickable' : ''} ${className}`} role={clickable ? 'button' : undefined} tabIndex={clickable ? 0 : undefined} onKeyDown={event => { onKeyDown?.(event); if (clickable && event.currentTarget === event.target && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); event.currentTarget.click() } }} {...props}>{(header || title) && <header className="ui-card__header">{header ?? <h3>{title}</h3>}</header>}<div className="ui-card__content">{children}</div>{footer && <footer className="ui-card__footer">{footer}</footer>}</article> }

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'
export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> { variant?: BadgeVariant }
export function Badge({ variant = 'default', children, className = '', ...props }: BadgeProps) { return <span className={`ui-badge ui-badge--${variant} ${className}`} {...props}>{children}</span> }

export type AlertVariant = 'success' | 'info' | 'warning' | 'error'
export interface AlertProps extends HTMLAttributes<HTMLDivElement> { variant?: AlertVariant; title?: string; onDismiss?: () => void }
const alertIcons = { success: CheckCircle2, info: Info, warning: TriangleAlert, error: AlertCircle }
export function Alert({ variant = 'info', title, onDismiss, children, className = '', ...props }: AlertProps) { const Icon = alertIcons[variant]; return <div className={`ui-alert ui-alert--${variant} ${className}`} role="alert" {...props}><Icon aria-hidden="true" size={19} /><div className="ui-alert__body">{title && <strong>{title}</strong>}<div>{children}</div></div>{onDismiss && <button type="button" className="ui-icon-button" aria-label="Tutup pemberitahuan" onClick={onDismiss}>×</button>}</div> }

export interface TableColumn<T> { key: string; header: string; render?: (row: T) => ReactNode; className?: string }
export interface TableProps<T> extends HTMLAttributes<HTMLDivElement> { columns: TableColumn<T>[]; rows: T[]; getRowKey: (row: T) => string; emptyState?: ReactNode; loading?: boolean; caption?: string }
export function Table<T>({ columns, rows, getRowKey, emptyState = 'Belum ada data.', loading, caption = 'Daftar data', className = '', ...props }: TableProps<T>) { return <div className={`ui-table-wrap ${className}`} {...props}><table className="ui-table"><caption className="ui-sr-only">{caption}</caption><thead><tr>{columns.map(column => <th key={column.key} scope="col" className={column.className}>{column.header}</th>)}</tr></thead><tbody>{loading ? Array.from({ length: 3 }, (_, index) => <tr key={`loading-${index}`}><td colSpan={columns.length}><Skeleton width={`${70 - index * 10}%`} /></td></tr>) : rows.length ? rows.map(row => <tr key={getRowKey(row)}>{columns.map(column => <td key={column.key} className={column.className}>{column.render ? column.render(row) : String((row as Record<string, unknown>)[column.key] ?? '')}</td>)}</tr>) : <tr><td colSpan={columns.length}>{emptyState}</td></tr>}</tbody></table></div> }

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> { width?: string | number; height?: string | number; variant?: 'text' | 'circle' | 'card' | 'row' }
export function Skeleton({ width, height, variant = 'text', className = '', style, ...props }: SkeletonProps) { return <div aria-hidden="true" className={`ui-skeleton ui-skeleton--${variant} ${className}`} style={{ ...style, width: width ?? style?.width, height: height ?? style?.height }} {...props} /> }
export function SkeletonCard() { return <div className="ui-skeleton-card" aria-label="Memuat konten"><Skeleton variant="circle" width={44} height={44} /><div><Skeleton width="55%" /><Skeleton width="88%" /><Skeleton width="70%" /></div></div> }
export function SkeletonTableRow({ columns = 4 }: { columns?: number }) { return <div className="ui-skeleton-table-row" aria-label="Memuat baris tabel">{Array.from({ length: columns }, (_, index) => <Skeleton key={index} width={`${70 + index % 2 * 20}%`} />)}</div> }

export interface EmptyStateProps { icon?: ReactNode; title: string; description: string; action?: ReactNode; className?: string }
export function EmptyState({ icon = <span aria-hidden="true">∅</span>, title, description, action, className = '' }: EmptyStateProps) { return <div className={`ui-state ui-empty-state ${className}`}><div className="ui-state__icon">{icon}</div><h3>{title}</h3><p>{description}</p>{action}</div> }
export interface ErrorStateProps { icon?: ReactNode; title: string; description: string; onRetry?: () => void; className?: string }
export function ErrorState({ icon = <AlertCircle aria-hidden="true" />, title, description, onRetry, className = '' }: ErrorStateProps) { return <div className={`ui-state ui-error-state ${className}`}><div className="ui-state__icon">{icon}</div><h3>{title}</h3><p>{description}</p>{onRetry && <Button variant="danger" onClick={onRetry}>Coba lagi</Button>}</div> }
